/**
 * Checkout behaviour. Loaded on demand — boot.ts dynamically imports this the
 * first time someone presses an "Order Now" button or opens the cart, so none
 * of it is on the critical path.
 *
 * Views: cart → form → done
 * The dialog itself handles focus trapping, Esc and focus restoration.
 */

import { computeCartTotals, type DeliveryArea, type DeliveryCharges } from '~/lib/pricing';
import { formatBdt } from '~/lib/formatBdt';
import { validateDraft, isValid, normaliseMobile, FIELD_ORDER } from '~/lib/validate';
import type { Errors, OrderDraft } from '~/lib/validate';
import { buildOrderMessage, buildWhatsappUrl } from '~/lib/buildOrderMessage';
import { makeOrderId } from '~/lib/orderId';
import { loadCustomer, saveCustomer } from './storage';
import { CartStore } from './cart';
import { track } from '../analytics/pixel';

interface CheckoutData {
  items: { id: string; name: string; price: number }[];
  delivery: DeliveryCharges;
  bkashNumber: string;
  whatsappNumber: string;
  orderPrefix: string;
  bkashAction: string;
  paymentMethods: ('bkash' | 'cod')[];
}

const $ = <T extends Element>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);

let dialog: HTMLDialogElement;
let form: HTMLFormElement;
let data: CheckoutData;
let prices: Map<string, { name: string; price: number }>;
let districtValues: string[] = [];
let cart: CartStore;
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

function paymentMethodValue(): 'bkash' | 'cod' {
  const checked = form.querySelector<HTMLInputElement>('input[name="paymentMethod"]:checked');
  if (checked?.value === 'cod') return 'cod';
  return 'bkash';
}

function readDraft(): OrderDraft {
  return {
    // itemId and quantity are cart-driven; put dummy values so the type passes —
    // validateDraft skips them when itemIds is empty.
    itemId: cart.lines[0]?.itemId ?? '',
    quantity: cart.lines[0]?.quantity ?? 1,
    name: fields.name.value,
    mobile: fields.mobile.value,
    district: fields.district.value,
    address: fields.address.value,
    area: areaValue(),
    paymentMethod: paymentMethodValue(),
    note: fields.note.value,
  };
}

/* ── Cart badge ──────────────────────────────────────────────────────────── */

function updateCartBadge(): void {
  const badge = document.querySelector<HTMLElement>('[data-cart-count]');
  if (!badge) return;
  const count = cart.totalQuantity;
  badge.textContent = count > 0 ? String(count) : '';
  badge.hidden = count === 0;
}

/* ── Live summary ────────────────────────────────────────────────────────── */

function currentTotals() {
  return computeCartTotals(
    [...cart.lines],
    new Map([...prices.entries()].map(([k, v]) => [k, v.price])),
    areaValue(),
    data.delivery,
  );
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
  set('total-inline-cod', formatBdt(total));
  // Cart view summary
  set('cart-subtotal', formatBdt(subtotal));
  set('cart-delivery', formatBdt(delivery));
  set('cart-total', formatBdt(total));
}

/* ── Cart view ───────────────────────────────────────────────────────────── */

function renderCartView(): void {
  const list = $<HTMLUListElement>('[data-cart-list]', dialog);
  const empty = $<HTMLElement>('[data-cart-empty]', dialog);
  const foot = $<HTMLElement>('[data-cart-foot]', dialog);
  if (!list || !empty || !foot) return;

  const isEmpty = cart.isEmpty;
  empty.hidden = !isEmpty;
  list.hidden = isEmpty;
  foot.hidden = isEmpty;

  if (isEmpty) return;

  list.innerHTML = '';
  for (const line of cart.lines) {
    const item = prices.get(line.itemId);
    if (!item) continue;

    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-item-stepper">
        <button type="button" class="cart-step" data-cart-dec="${line.itemId}"
          aria-label="পরিমাণ কমান" ${line.quantity <= 1 ? 'disabled' : ''}>−</button>
        <span class="cart-qty">${line.quantity}</span>
        <button type="button" class="cart-step" data-cart-inc="${line.itemId}"
          aria-label="পরিমাণ বাড়ান" ${line.quantity >= 10 ? 'disabled' : ''}>+</button>
      </div>
      <div class="cart-item-price">${formatBdt(item.price * line.quantity)}</div>
      <button type="button" class="cart-remove" data-cart-remove="${line.itemId}" aria-label="${item.name} সরান">✕</button>
    `;
    list.append(li);
  }

  renderSummary();
}

/* ── Cart recap in form view ─────────────────────────────────────────────── */

function renderCartRecap(): void {
  const recap = $('[data-cart-recap]', dialog);
  if (!recap) return;
  recap.innerHTML = '';
  for (const line of cart.lines) {
    const item = prices.get(line.itemId);
    if (!item) continue;
    const p = document.createElement('p');
    p.className = 'recap-item';
    p.innerHTML = `<span class="recap-name">${item.name} × ${line.quantity}</span><span class="recap-qty-price">${formatBdt(item.price * line.quantity)}</span>`;
    recap.append(p);
  }
}

/* ── Errors ──────────────────────────────────────────────────────────────── */

function showErrors(errors: Errors): void {
  for (const field of FIELD_ORDER) {
    const slot = form.querySelector(`[data-err="${field}"]`);
    const message = errors[field] ?? '';
    if (slot) slot.textContent = message;

    const control = form.querySelector<HTMLElement>(`[name="${field}"]`);
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

/* ── Payment method show/hide ────────────────────────────────────────────── */

function updatePaymentUI(): void {
  const method = paymentMethodValue();
  dialog.querySelectorAll<HTMLElement>('[data-payment-target]').forEach((el) => {
    el.hidden = el.dataset.paymentTarget !== method;
  });
}

/* ── Views ───────────────────────────────────────────────────────────────── */

type ViewName = 'cart' | 'form' | 'done';

function showView(which: ViewName): void {
  let active: HTMLElement | null = null;

  dialog.querySelectorAll<HTMLElement>('[data-view]').forEach((view) => {
    view.hidden = view.dataset.view !== which;
    if (!view.hidden) active = view;
  });

  $<HTMLElement>('.shell', dialog)?.scrollTo({ top: 0 });

  // Update the dialog's aria-labelledby to point at the visible heading.
  if (which === 'cart') {
    dialog.setAttribute('aria-labelledby', 'checkout-title');
  } else if (which === 'form') {
    dialog.setAttribute('aria-labelledby', 'checkout-form-title');
  }

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

  if (cart.isEmpty) {
    showView('cart');
    return;
  }

  const draft = readDraft();
  const errors = validateDraft(draft, {
    itemIds: [...prices.keys()],
    districts: districtValues,
    paymentMethods: data.paymentMethods,
  });

  // itemId / quantity are cart-driven — remove any phantom errors for those
  delete errors.itemId;
  delete errors.quantity;

  showErrors(errors);

  if (!isValid(errors)) {
    focusFirstError(errors);
    return;
  }

  const totals = currentTotals();
  const orderId = makeOrderId(data.orderPrefix);
  const mobile = normaliseMobile(draft.mobile)!;
  const method = paymentMethodValue();

  // Build a readable product list for the WhatsApp message.
  const productLines = cart.lines
    .map((l) => {
      const item = prices.get(l.itemId);
      return item ? `${item.name} × ${l.quantity}` : null;
    })
    .filter(Boolean);

  const productName = productLines.join(', ');

  const message = buildOrderMessage({
    orderId,
    productName,
    quantity: cart.totalQuantity,
    subtotal: totals.subtotal,
    deliveryCharge: totals.delivery,
    total: totals.total,
    customerName: draft.name,
    mobile,
    address: draft.address,
    district: draft.district,
    paymentMethod: method,
    bkashNumber: method === 'bkash' ? data.bkashNumber : undefined,
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

  track('Lead', { value: totals.total, currency: 'BDT', content_name: productName });

  // Fill the success view before navigating.
  const setDone = (key: string, value: string) => {
    const el = dialog.querySelector(`[data-done="${key}"]`);
    if (el) el.textContent = value;
  };
  setDone('orderId', `#${orderId}`);
  setDone('total', formatBdt(totals.total));

  // Show/hide the bKash row on the success screen depending on payment method.
  dialog.querySelectorAll<HTMLElement>('[data-done-bkash]').forEach((el) => {
    el.hidden = method !== 'bkash';
  });
  const remind = $<HTMLElement>('[data-done-bkash-remind]', dialog);
  if (remind) remind.hidden = method !== 'bkash';

  const again = dialog.querySelector<HTMLAnchorElement>('[data-done="wa"]');
  if (again) again.href = url;

  // Clear cart only after we've built the message.
  cart.clear();
  updateCartBadge();

  showView('done');
  window.open(url, '_blank', 'noopener');
}

/* ── Toast (add to cart feedback) ───────────────────────────────────────── */

let toastTimer = 0;

export function showAddedToast(itemName: string): void {
  let toast = document.querySelector<HTMLElement>('[data-cart-toast]');
  if (!toast) {
    toast = document.createElement('div');
    toast.setAttribute('data-cart-toast', '');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }
  toast.textContent = `✓ ${itemName} কার্টে যোগ হয়েছে`;
  toast.classList.add('toast-show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast!.classList.remove('toast-show'), 2200);
}

/* ── Open / close ────────────────────────────────────────────────────────── */

export function addToCart(itemId: string, trigger?: HTMLElement | null): void {
  const item = prices?.get(itemId);
  cart.add(itemId);
  updateCartBadge();
  if (item) showAddedToast(item.name);
  // Warm the checkout bundle (already loaded since we're here), but do not open.
  void trigger;
}

export function openCart(trigger?: HTMLElement | null): void {
  lastTrigger = trigger ?? null;
  renderCartView();
  showView('cart');
  if (!dialog.open) dialog.showModal();
}

export function openCheckout(itemId?: string, trigger?: HTMLElement | null): void {
  // Legacy compatibility: if called with an itemId, add it first then open cart.
  if (itemId && prices?.has(itemId)) {
    cart.add(itemId);
    updateCartBadge();
  }
  openCart(trigger);
}

/* ── Init ────────────────────────────────────────────────────────────────── */

export function initCheckout(): void {
  dialog = $<HTMLDialogElement>('[data-checkout]')!;
  form = $<HTMLFormElement>('[data-checkout-form]', dialog)!;

  data = JSON.parse($<HTMLScriptElement>('#checkout-data')!.textContent ?? '{}') as CheckoutData;
  prices = new Map(data.items.map((i) => [i.id, { name: i.name, price: i.price }]));
  cart = new CartStore();

  fields = {
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

  // Update badge in case cart was persisted.
  updateCartBadge();

  form.addEventListener('submit', onSubmit);

  form.addEventListener('input', () => {
    renderSummary();
    if (submitted) {
      showErrors(
        validateDraft(readDraft(), {
          itemIds: [...prices.keys()],
          districts: districtValues,
          paymentMethods: data.paymentMethods,
        }),
      );
    }
  });

  form.addEventListener('change', (event) => {
    const target = event.target as HTMLElement | null;
    if (target === fields.district && fields.district.value) {
      const isDhaka = fields.district.value === 'ঢাকা';
      const radio = form.querySelector<HTMLInputElement>(isDhaka ? '#co-area-inside' : '#co-area-outside');
      if (radio) radio.checked = true;
    }
    renderSummary();
    updatePaymentUI();
  });

  // Cart view: stepper and remove buttons (delegated).
  dialog.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    // Cart view controls
    const dec = target.closest<HTMLElement>('[data-cart-dec]');
    if (dec) {
      const id = dec.dataset.cartDec!;
      const line = cart.lines.find((l) => l.itemId === id);
      if (line && line.quantity > 1) {
        cart.setQty(id, line.quantity - 1);
      } else {
        cart.remove(id);
      }
      updateCartBadge();
      renderCartView();
      return;
    }

    const inc = target.closest<HTMLElement>('[data-cart-inc]');
    if (inc) {
      const id = inc.dataset.cartInc!;
      const line = cart.lines.find((l) => l.itemId === id);
      cart.setQty(id, (line?.quantity ?? 0) + 1);
      updateCartBadge();
      renderCartView();
      return;
    }

    const remove = target.closest<HTMLElement>('[data-cart-remove]');
    if (remove) {
      cart.remove(remove.dataset.cartRemove!);
      updateCartBadge();
      renderCartView();
      return;
    }

    // "Proceed to checkout" in cart view.
    if (target.closest('[data-cart-checkout]')) {
      renderCartRecap();
      renderSummary();
      updatePaymentUI();
      showView('form');
      return;
    }

    // Copy button.
    const copy = target.closest<HTMLElement>('[data-copy]');
    if (copy) {
      void copyNumber(copy);
      return;
    }

    if (target.closest('[data-checkout-close]')) {
      dialog.close();
      return;
    }

    // Clicking the backdrop closes.
    if (target === dialog) dialog.close();
  });

  // Covers every close path at once: the button, the backdrop and Esc.
  dialog.addEventListener('close', () => {
    submitted = false;
    showErrors({});
    lastTrigger?.focus({ preventScroll: true });
    lastTrigger = null;
  });

  // Initial payment UI state.
  updatePaymentUI();
  renderSummary();
}

/* ── Toast styles (injected once, tiny) ─────────────────────────────────── */

const toastStyle = document.createElement('style');
toastStyle.textContent = `
[data-cart-toast]{
  position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 5.5rem);right:1rem;
  z-index:200;padding:.55rem 1rem;border-radius:var(--radius-pill,999px);
  background:var(--color-ink,#131313);color:#fff;font-size:.8125rem;font-weight:600;
  opacity:0;transform:translateY(.5rem);transition:opacity 220ms,transform 220ms;
  pointer-events:none;
}
[data-cart-toast].toast-show{opacity:1;transform:translateY(0);}
@media(min-width:48rem){[data-cart-toast]{bottom:2rem;}}
`;
document.head.append(toastStyle);
