/**
 * Checkout behaviour. Loaded on demand — boot.ts dynamically imports this the
 * first time someone presses an "Order Now" button, so none of it is on the
 * critical path.
 *
 * The dialog itself handles focus trapping, Esc and focus restoration; this
 * module only owns pricing, validation, the WhatsApp hand-off and the success
 * state.
 */

import { computeTotals, clampQuantity, MAX_QTY, MIN_QTY, type DeliveryArea } from '~/lib/pricing';
import { formatBdt } from '~/lib/formatBdt';
import { validateDraft, isValid, normaliseMobile, FIELD_ORDER } from '~/lib/validate';
import type { Errors, OrderDraft } from '~/lib/validate';
import { buildOrderMessage, buildWhatsappUrl } from '~/lib/buildOrderMessage';
import { makeOrderId } from '~/lib/orderId';
import { loadCustomer, saveCustomer } from './storage';
import { track } from '../analytics/pixel';

interface CheckoutData {
  items: { id: string; name: string; price: number }[];
  delivery: { insideRajshahi: number; outsideRajshahi: number };
  bkashNumber: string;
  whatsappNumber: string;
  orderPrefix: string;
  bkashAction: string;
}

const $ = <T extends Element>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);

let dialog: HTMLDialogElement;
let form: HTMLFormElement;
let data: CheckoutData;
let prices: Map<string, { name: string; price: number }>;
let districtValues: string[] = [];
/** Set once a submit has been attempted; until then we do not nag mid-typing. */
let submitted = false;
/**
 * The control that opened the sheet, so focus can go back to it on close.
 * <dialog> restores focus to whatever was focused when showModal() ran, but
 * Safari does not focus a <button> on click, so on iOS that is <body> and the
 * reader is dumped at the top of the page. Tracked explicitly instead.
 */
let lastTrigger: HTMLElement | null = null;

/* ── Field handles ───────────────────────────────────────────────────────── */

interface Fields {
  itemId: HTMLSelectElement;
  quantity: HTMLInputElement;
  name: HTMLInputElement;
  mobile: HTMLInputElement;
  district: HTMLSelectElement;
  address: HTMLTextAreaElement;
  note: HTMLTextAreaElement;
}

let fields: Fields;

function areaValue(): DeliveryArea {
  const checked = form.querySelector<HTMLInputElement>('input[name="area"]:checked');
  return checked?.value === 'outside' ? 'outside' : 'inside';
}

function readDraft(): OrderDraft {
  return {
    itemId: fields.itemId.value,
    quantity: clampQuantity(fields.quantity.value),
    name: fields.name.value,
    mobile: fields.mobile.value,
    district: fields.district.value,
    address: fields.address.value,
    area: areaValue(),
    note: fields.note.value,
  };
}

/* ── Live summary ────────────────────────────────────────────────────────── */

function currentTotals() {
  const draft = readDraft();
  const item = prices.get(draft.itemId);
  return computeTotals(item?.price ?? 0, draft.quantity, draft.area, data.delivery);
}

function renderSummary(): void {
  const { subtotal, delivery, total } = currentTotals();

  const set = (key: string, value: string) => {
    document.querySelectorAll(`[data-sum="${key}"]`).forEach((el) => {
      el.textContent = value;
    });
  };

  set('subtotal', formatBdt(subtotal));
  set('delivery', formatBdt(delivery));
  set('total', formatBdt(total));
  set('total-inline', formatBdt(total));

  // Keep the stepper honest about its own limits.
  const qty = clampQuantity(fields.quantity.value);
  form.querySelectorAll<HTMLButtonElement>('[data-qty]').forEach((btn) => {
    const step = Number(btn.dataset.qty);
    btn.disabled = step < 0 ? qty <= MIN_QTY : qty >= MAX_QTY;
  });
}

/* ── Errors ──────────────────────────────────────────────────────────────── */

function showErrors(errors: Errors): void {
  for (const field of FIELD_ORDER) {
    const slot = form.querySelector(`[data-err="${field}"]`);
    const message = errors[field] ?? '';
    if (slot) slot.textContent = message;

    const control = form.querySelector<HTMLElement>(`[name="${field === 'itemId' ? 'itemId' : field}"]`);
    if (control && control.tagName !== 'FIELDSET') {
      if (message) control.setAttribute('aria-invalid', 'true');
      else control.removeAttribute('aria-invalid');
    }
  }
}

function focusFirstError(errors: Errors): void {
  const first = FIELD_ORDER.find((f) => errors[f]);
  if (!first) return;
  const control = form.querySelector<HTMLElement>(`[name="${first}"]`);
  control?.focus();
  control?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ── Views ───────────────────────────────────────────────────────────────── */

function showView(which: 'form' | 'done'): void {
  let active: HTMLElement | null = null;

  dialog.querySelectorAll<HTMLElement>('[data-view]').forEach((view) => {
    view.hidden = view.dataset.view !== which;
    if (!view.hidden) active = view;
  });

  $<HTMLElement>('.shell', dialog)?.scrollTo({ top: 0 });

  // Hiding the view that held focus would drop focus to <body>, which escapes
  // the dialog and leaves a screen reader with nothing announced. Move it to
  // the new view's heading instead.
  const heading = active
    ? (active as HTMLElement).querySelector<HTMLElement>('h2')
    : null;
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

/* ── Copy to clipboard ───────────────────────────────────────────────────── */

async function copyNumber(button: HTMLElement): Promise<void> {
  const value = button.dataset.copy ?? '';
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard API needs permission/secure context; fall back to a temporary
    // selection, which works everywhere the site realistically runs.
    const scratch = document.createElement('textarea');
    scratch.value = value;
    scratch.setAttribute('readonly', '');
    scratch.style.cssText = 'position:fixed;top:-9999px';
    document.body.append(scratch);
    scratch.select();
    try {
      document.execCommand('copy');
    } catch {
      /* Nothing more to try — the number is on screen to read. */
    }
    scratch.remove();
  }

  button.setAttribute('data-copied', '');
  window.setTimeout(() => button.removeAttribute('data-copied'), 1800);
}

/* ── Submit ──────────────────────────────────────────────────────────────── */

function onSubmit(event: SubmitEvent): void {
  event.preventDefault();
  submitted = true;

  const draft = readDraft();
  const errors = validateDraft(draft, {
    itemIds: data.items.map((i) => i.id),
    districts: districtValues,
  });

  showErrors(errors);

  if (!isValid(errors)) {
    focusFirstError(errors);
    return;
  }

  const item = prices.get(draft.itemId)!;
  const totals = computeTotals(item.price, draft.quantity, draft.area, data.delivery);
  const orderId = makeOrderId(data.orderPrefix);
  const mobile = normaliseMobile(draft.mobile)!;

  const message = buildOrderMessage({
    orderId,
    productName: item.name,
    quantity: draft.quantity,
    subtotal: totals.subtotal,
    deliveryCharge: totals.delivery,
    total: totals.total,
    customerName: draft.name,
    mobile,
    address: draft.address,
    district: draft.district,
    bkashNumber: data.bkashNumber,
    note: draft.note,
  });

  const url = buildWhatsappUrl(data.whatsappNumber, message);

  saveCustomer({
    name: draft.name,
    mobile,
    district: draft.district,
    address: draft.address,
    area: draft.area,
  });

  track('Lead', { value: totals.total, currency: 'BDT', content_name: item.name });

  // Fill the success view before navigating, so it is already correct if the
  // new tab steals focus or the redirect is blocked.
  const setDone = (key: string, value: string) => {
    const el = dialog.querySelector(`[data-done="${key}"]`);
    if (el) el.textContent = value;
  };
  setDone('orderId', `#${orderId}`);
  setDone('total', formatBdt(totals.total));

  const again = dialog.querySelector<HTMLAnchorElement>('[data-done="wa"]');
  if (again) again.href = url;

  showView('done');
  window.open(url, '_blank', 'noopener');
}

/* ── Open / close ────────────────────────────────────────────────────────── */

export function openCheckout(itemId?: string, trigger?: HTMLElement | null): void {
  lastTrigger = trigger ?? null;

  if (itemId && prices.has(itemId)) {
    fields.itemId.value = itemId;
  }

  showView('form');
  renderSummary();

  if (!dialog.open) dialog.showModal();
  track('InitiateCheckout', { content_name: prices.get(fields.itemId.value)?.name });
}

/* ── Init ────────────────────────────────────────────────────────────────── */

export function initCheckout(): void {
  dialog = $<HTMLDialogElement>('[data-checkout]')!;
  form = $<HTMLFormElement>('[data-checkout-form]', dialog)!;

  data = JSON.parse($<HTMLScriptElement>('#checkout-data')!.textContent ?? '{}') as CheckoutData;
  prices = new Map(data.items.map((i) => [i.id, { name: i.name, price: i.price }]));

  fields = {
    itemId: form.elements.namedItem('itemId') as HTMLSelectElement,
    quantity: form.elements.namedItem('quantity') as HTMLInputElement,
    name: form.elements.namedItem('name') as HTMLInputElement,
    mobile: form.elements.namedItem('mobile') as HTMLInputElement,
    district: form.elements.namedItem('district') as HTMLSelectElement,
    address: form.elements.namedItem('address') as HTMLTextAreaElement,
    note: form.elements.namedItem('note') as HTMLTextAreaElement,
  };

  // The <select> already contains the canonical district list — read it rather
  // than shipping the 64 names a second time.
  districtValues = [...fields.district.options].map((o) => o.value).filter(Boolean);

  // Restore a returning customer.
  const saved = loadCustomer();
  if (saved.name) fields.name.value = saved.name;
  if (saved.mobile) fields.mobile.value = saved.mobile;
  if (saved.address) fields.address.value = saved.address;
  if (saved.district && districtValues.includes(saved.district)) {
    fields.district.value = saved.district;
  }
  if (saved.area === 'outside') {
    const outside = form.querySelector<HTMLInputElement>('#co-area-outside');
    if (outside) outside.checked = true;
  }

  form.addEventListener('submit', onSubmit);

  form.addEventListener('input', () => {
    renderSummary();
    // Only re-validate live once they have tried to submit, so the form never
    // turns red while someone is still halfway through typing their name.
    if (submitted) {
      showErrors(
        validateDraft(readDraft(), {
          itemIds: data.items.map((i) => i.id),
          districts: districtValues,
        }),
      );
    }
  });

  form.addEventListener('change', renderSummary);

  form.addEventListener('click', (event) => {
    const step = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-qty]');
    if (!step) return;
    fields.quantity.value = String(clampQuantity(Number(fields.quantity.value) + Number(step.dataset.qty)));
    renderSummary();
  });

  dialog.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    const copy = target.closest<HTMLElement>('[data-copy]');
    if (copy) {
      void copyNumber(copy);
      return;
    }

    if (target.closest('[data-checkout-close]')) {
      dialog.close();
      return;
    }

    // Clicking the backdrop closes. The dialog element itself fills the
    // viewport; .shell is the visible card, so a click that lands on the
    // dialog but not the shell is a backdrop click.
    if (target === dialog) dialog.close();
  });

  // Covers every close path at once: the button, the backdrop and Esc.
  dialog.addEventListener('close', () => {
    submitted = false;
    showErrors({});
    lastTrigger?.focus({ preventScroll: true });
    lastTrigger = null;
  });

  renderSummary();
}
