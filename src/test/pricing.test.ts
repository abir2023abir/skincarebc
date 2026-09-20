import { describe, expect, it } from 'vitest';
import { clampQuantity, computeTotals, deliveryFor, savingsPercent } from '~/lib/pricing';
import { makeOrderId, prefixFromBrand } from '~/lib/orderId';
import { formatBdt } from '~/lib/formatBdt';

const charges = { insideRajshahi: 60, outsideRajshahi: 120 };

describe('clampQuantity', () => {
  it('keeps whole numbers inside 1–10', () => {
    expect(clampQuantity(1)).toBe(1);
    expect(clampQuantity(10)).toBe(10);
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
    expect(clampQuantity(99)).toBe(10);
    expect(clampQuantity(2.9)).toBe(2);
  });

  it('falls back to 1 for junk input', () => {
    expect(clampQuantity('')).toBe(1);
    expect(clampQuantity('abc')).toBe(1);
    expect(clampQuantity(null)).toBe(1);
    expect(clampQuantity(undefined)).toBe(1);
    expect(clampQuantity(NaN)).toBe(1);
  });
});

describe('computeTotals', () => {
  it('multiplies the unit price and adds the area delivery charge', () => {
    expect(computeTotals(850, 2, 'inside', charges)).toEqual({
      subtotal: 1700,
      delivery: 60,
      total: 1760,
    });
    expect(computeTotals(850, 2, 'outside', charges)).toEqual({
      subtotal: 1700,
      delivery: 120,
      total: 1820,
    });
  });

  it('clamps the quantity before pricing', () => {
    expect(computeTotals(100, 999, 'inside', charges).subtotal).toBe(1000);
    expect(computeTotals(100, 0, 'inside', charges).subtotal).toBe(100);
  });

  it('never produces a negative subtotal', () => {
    expect(computeTotals(-500, 2, 'inside', charges).subtotal).toBe(0);
  });
});

describe('deliveryFor', () => {
  it('reads the charge straight from config', () => {
    expect(deliveryFor('inside', charges)).toBe(60);
    expect(deliveryFor('outside', charges)).toBe(120);
    expect(deliveryFor('inside', { insideRajshahi: 0, outsideRajshahi: 150 })).toBe(0);
  });
});

describe('savingsPercent', () => {
  it('floors the discount and ignores a missing or useless old price', () => {
    expect(savingsPercent(1250, 1500)).toBe(16);
    expect(savingsPercent(1990, 2200)).toBe(9);
    expect(savingsPercent(1000)).toBe(0);
    expect(savingsPercent(1000, 900)).toBe(0);
    expect(savingsPercent(1000, 1000)).toBe(0);
  });
});

describe('order ids', () => {
  it('derives a two-letter prefix from the brand name', () => {
    expect(prefixFromBrand('Glow Skin')).toBe('GS');
    expect(prefixFromBrand('BRAND_NAME')).toBe('BN');
    expect(prefixFromBrand('Aura')).toBe('AO');
    expect(prefixFromBrand('')).toBe('OR');
  });

  it('is stable for a given timestamp and changes as time moves', () => {
    const a = makeOrderId('GS', 1_700_000_000_000);
    expect(a).toBe(makeOrderId('GS', 1_700_000_000_000));
    expect(a).toMatch(/^GS-[0-9A-Z]{6}$/);
    expect(a).not.toBe(makeOrderId('GS', 1_700_000_001_000));
  });
});

describe('formatBdt', () => {
  it('prefixes the taka sign and drops decimals', () => {
    expect(formatBdt(60)).toBe('৳60');
    expect(formatBdt(1760)).toBe('৳1,760');
    expect(formatBdt(1759.6)).toBe('৳1,760');
    expect(formatBdt(0)).toBe('৳0');
  });
});
