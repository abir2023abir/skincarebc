/** Checkout form validation. Pure — returns field-keyed Bangla error messages. */

import { MAX_QTY, MIN_QTY, type DeliveryArea } from './pricing';
import { isKnownDistrict } from './districts';

export interface OrderDraft {
  itemId: string;
  quantity: number;
  name: string;
  mobile: string;
  district: string;
  address: string;
  area: DeliveryArea;
  note: string;
}

export type FieldName = keyof OrderDraft;
export type Errors = Partial<Record<FieldName, string>>;

/**
 * Bangladeshi mobile numbers are 11 digits starting 013–019.
 * Accepts the shapes people actually paste — "+8801712345678", "8801712345678",
 * "01712-345678" — and normalises them all to "01712345678".
 * Returns null when the input cannot be read as a BD mobile number.
 */
export function normaliseMobile(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('880')) local = local.slice(3);
  // A bare "1712345678" (leading zero dropped) is still recoverable.
  if (local.length === 10 && local.startsWith('1')) local = '0' + local;
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}

export function validateDraft(draft: OrderDraft, knownItemIds: readonly string[]): Errors {
  const errors: Errors = {};

  if (!knownItemIds.includes(draft.itemId)) {
    errors.itemId = 'একটি পণ্য বেছে নিন।';
  }

  const qty = Number(draft.quantity);
  if (!Number.isInteger(qty) || qty < MIN_QTY || qty > MAX_QTY) {
    errors.quantity = `পরিমাণ ${MIN_QTY} থেকে ${MAX_QTY}-এর মধ্যে হতে হবে।`;
  }

  if (draft.name.trim().length < 2) {
    errors.name = 'আপনার পুরো নাম লিখুন।';
  }

  if (normaliseMobile(draft.mobile) === null) {
    errors.mobile = 'সঠিক মোবাইল নম্বর লিখুন (যেমন ০১৭১২৩৪৫৬৭৮)।';
  }

  if (!draft.district.trim()) {
    errors.district = 'আপনার জেলা বেছে নিন।';
  } else if (!isKnownDistrict(draft.district)) {
    errors.district = 'তালিকা থেকে একটি জেলা বেছে নিন।';
  }

  if (draft.address.trim().length < 10) {
    errors.address = 'বাড়ি/রোড/এলাকাসহ সম্পূর্ণ ঠিকানা লিখুন।';
  }

  if (draft.area !== 'inside' && draft.area !== 'outside') {
    errors.area = 'ডেলিভারি এলাকা বেছে নিন।';
  }

  return errors;
}

export function isValid(errors: Errors): boolean {
  return Object.keys(errors).length === 0;
}
