/**
 * Remembers the customer's details so a returning buyer does not retype an
 * address. Every access is wrapped: localStorage throws in private mode, when
 * site data is blocked, and when the quota is full — none of which should ever
 * take the checkout down.
 */

const KEY = 'skincare.customer.v1';

export interface SavedCustomer {
  name: string;
  mobile: string;
  district: string;
  address: string;
  area: string;
}

export function loadCustomer(): Partial<SavedCustomer> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Partial<SavedCustomer>;
  } catch {
    return {};
  }
}

export function saveCustomer(customer: SavedCustomer): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(customer));
  } catch {
    /* Not being able to remember the address is not worth an error. */
  }
}
