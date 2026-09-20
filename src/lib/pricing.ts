/** Order maths. Pure — no DOM, no config import, fully unit-testable. */

export type DeliveryArea = 'inside' | 'outside';

export interface DeliveryCharges {
  insideDhaka?: number;
  outsideDhaka?: number;
  insideRajshahi?: number;
  outsideRajshahi?: number;
}

export interface Totals {
  subtotal: number;
  delivery: number;
  total: number;
}

export const MIN_QTY = 1;
export const MAX_QTY = 10;

/** Clamp any user input to a whole quantity inside the allowed range. */
export function clampQuantity(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return MIN_QTY;
  return Math.min(MAX_QTY, Math.max(MIN_QTY, n));
}

export function deliveryFor(area: DeliveryArea, charges: DeliveryCharges): number {
  return area === 'inside'
    ? (charges.insideDhaka ?? charges.insideRajshahi ?? 60)
    : (charges.outsideDhaka ?? charges.outsideRajshahi ?? 130);
}

export function computeTotals(
  unitPrice: number,
  quantity: number,
  area: DeliveryArea,
  charges: DeliveryCharges,
): Totals {
  const qty = clampQuantity(quantity);
  const subtotal = Math.max(0, Math.round(unitPrice)) * qty;
  const delivery = deliveryFor(area, charges);
  return { subtotal, delivery, total: subtotal + delivery };
}

export interface CartLine {
  itemId: string;
  quantity: number;
}

/**
 * Multi-line cart totals. Sums each line's (price × qty), then adds one
 * delivery charge for the whole cart.
 */
export function computeCartTotals(
  lines: CartLine[],
  prices: Map<string, number>,
  area: DeliveryArea,
  charges: DeliveryCharges,
): Totals {
  const subtotal = lines.reduce((sum, line) => {
    const unitPrice = prices.get(line.itemId) ?? 0;
    return sum + Math.max(0, Math.round(unitPrice)) * clampQuantity(line.quantity);
  }, 0);
  const delivery = lines.length > 0 ? deliveryFor(area, charges) : 0;
  return { subtotal, delivery, total: subtotal + delivery };
}

/** Percentage saved versus the struck-through price, rounded down. 0 when none. */
export function savingsPercent(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.floor(((oldPrice - price) / oldPrice) * 100);
}
