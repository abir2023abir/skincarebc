/** Aggregates the seeded reviews. Pure — no DOM. */

import { site } from '~/config/site';

export interface Aggregate {
  /** Mean rating, one decimal. 0 when there are no reviews yet. */
  average: number;
  count: number;
}

export function aggregateFor(itemId: string): Aggregate {
  const matching = site.reviews.filter((r) => r.productId === itemId);
  if (matching.length === 0) return { average: 0, count: 0 };

  const sum = matching.reduce((total, r) => total + r.rating, 0);
  return {
    average: Math.round((sum / matching.length) * 10) / 10,
    count: matching.length,
  };
}
