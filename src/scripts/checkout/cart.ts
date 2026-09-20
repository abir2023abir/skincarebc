/**
 * Cart state. Pure — no DOM, no config import, fully unit-testable.
 *
 * Persists to localStorage using the same try/catch pattern as storage.ts.
 * Every write that fails silently degrades to an in-memory-only cart; the page
 * never crashes.
 */

import { clampQuantity, MIN_QTY, MAX_QTY, type CartLine } from '~/lib/pricing';

export type { CartLine };

const CART_KEY = 'skincare.cart.v1';

function loadLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(
      (l): l is CartLine =>
        typeof l === 'object' &&
        l !== null &&
        typeof (l as CartLine).itemId === 'string' &&
        typeof (l as CartLine).quantity === 'number',
    );
  } catch {
    return [];
  }
}

function saveLines(lines: CartLine[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* Quota exceeded or private mode — in-memory only. */
  }
}

export class CartStore {
  private _lines: CartLine[];

  constructor() {
    this._lines = loadLines();
  }

  get lines(): readonly CartLine[] {
    return this._lines;
  }

  get isEmpty(): boolean {
    return this._lines.length === 0;
  }

  get totalQuantity(): number {
    return this._lines.reduce((s, l) => s + l.quantity, 0);
  }

  /** Adds one of the item, or increments if already present. */
  add(itemId: string): void {
    const existing = this._lines.find((l) => l.itemId === itemId);
    if (existing) {
      existing.quantity = clampQuantity(existing.quantity + 1);
    } else {
      this._lines.push({ itemId, quantity: 1 });
    }
    saveLines(this._lines);
  }

  /** Removes the line entirely. No-op if not present. */
  remove(itemId: string): void {
    this._lines = this._lines.filter((l) => l.itemId !== itemId);
    saveLines(this._lines);
  }

  /** Sets an explicit quantity; removes the line when qty falls to 0. */
  setQty(itemId: string, qty: number): void {
    const clamped = clampQuantity(qty);
    const existing = this._lines.find((l) => l.itemId === itemId);
    if (existing) {
      existing.quantity = clamped;
    } else {
      this._lines.push({ itemId, quantity: clamped });
    }
    // qty=0 (after clamping to MIN_QTY=1 that would be MIN anyway, but explicit 0 remove)
    if (qty < MIN_QTY) {
      this._lines = this._lines.filter((l) => l.itemId !== itemId);
    }
    saveLines(this._lines);
  }

  /** Clamp helper exposed for stepper buttons. */
  canDecrement(itemId: string): boolean {
    const line = this._lines.find((l) => l.itemId === itemId);
    return line ? line.quantity > MIN_QTY : false;
  }

  canIncrement(itemId: string): boolean {
    const line = this._lines.find((l) => l.itemId === itemId);
    return line ? line.quantity < MAX_QTY : true;
  }

  clear(): void {
    this._lines = [];
    saveLines(this._lines);
  }
}
