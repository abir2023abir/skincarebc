/**
 * Money formatting for Bangladeshi Taka.
 *
 * Digits stay Latin (1,760) rather than Bengali (১,৭৬০) on purpose: that is what
 * bKash, the courier slips and every other BD checkout show, so the number the
 * customer reads here is character-for-character the number they type into bKash.
 * Grouping uses the South Asian system, so ১ লাখ renders as 1,00,000 — not 100,000.
 */

const grouping = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/** 1760 -> "৳1,760" */
export function formatBdt(amount: number): string {
  return '৳' + grouping.format(Math.round(amount));
}

/** 1760 -> "1,760" (no symbol — for places that render ৳ as separate markup) */
export function formatAmount(amount: number): string {
  return grouping.format(Math.round(amount));
}
