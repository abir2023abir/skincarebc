import { describe, expect, it } from 'vitest';
import { isValid, normaliseMobile, validateDraft } from '~/lib/validate';
import type { OrderDraft } from '~/lib/validate';
import { districts } from '~/lib/districts';

const ids = ['vitamin-c-glow-serum', 'combo-glow-duo'];

const good: OrderDraft = {
  itemId: 'vitamin-c-glow-serum',
  quantity: 2,
  name: 'নুসরাত জাহান',
  mobile: '01712345678',
  district: 'রাজশাহী',
  address: 'বাড়ি ১২, রোড ৪, উপশহর',
  area: 'inside',
  note: '',
};

describe('normaliseMobile', () => {
  it('accepts every shape people actually paste', () => {
    expect(normaliseMobile('01712345678')).toBe('01712345678');
    expect(normaliseMobile('+8801712345678')).toBe('01712345678');
    expect(normaliseMobile('8801712345678')).toBe('01712345678');
    expect(normaliseMobile('01712-345678')).toBe('01712345678');
    expect(normaliseMobile(' 017 1234 5678 ')).toBe('01712345678');
    expect(normaliseMobile('1712345678')).toBe('01712345678');
  });

  it('accepts all live operator prefixes 013–019', () => {
    for (const d of [3, 4, 5, 6, 7, 8, 9]) {
      expect(normaliseMobile(`01${d}12345678`)).toBe(`01${d}12345678`);
    }
  });

  it('rejects anything that is not a BD mobile number', () => {
    expect(normaliseMobile('01212345678')).toBeNull(); // 012 is not allocated
    expect(normaliseMobile('0171234567')).toBeNull(); // 10 digits
    expect(normaliseMobile('017123456789')).toBeNull(); // 12 digits
    expect(normaliseMobile('')).toBeNull();
    expect(normaliseMobile('hello')).toBeNull();
  });
});

describe('validateDraft', () => {
  it('passes a complete draft', () => {
    expect(isValid(validateDraft(good, ids))).toBe(true);
  });

  it('flags each field independently', () => {
    expect(validateDraft({ ...good, name: 'অ' }, ids).name).toBeDefined();
    expect(validateDraft({ ...good, mobile: '0121' }, ids).mobile).toBeDefined();
    expect(validateDraft({ ...good, address: 'ছোট' }, ids).address).toBeDefined();
    expect(validateDraft({ ...good, district: '' }, ids).district).toBeDefined();
    expect(validateDraft({ ...good, quantity: 0 }, ids).quantity).toBeDefined();
    expect(validateDraft({ ...good, quantity: 11 }, ids).quantity).toBeDefined();
    expect(validateDraft({ ...good, itemId: 'nope' }, ids).itemId).toBeDefined();
  });

  it('rejects a district that is not one of the 64', () => {
    expect(validateDraft({ ...good, district: 'কলকাতা' }, ids).district).toBeDefined();
  });

  it('collects every problem at once rather than stopping at the first', () => {
    const errors = validateDraft(
      { ...good, name: '', mobile: 'x', address: '', district: '' },
      ids,
    );
    expect(Object.keys(errors).sort()).toEqual(['address', 'district', 'mobile', 'name']);
  });
});

describe('districts', () => {
  it('contains exactly the 64 districts, with no duplicates', () => {
    expect(districts).toHaveLength(64);
    expect(new Set(districts).size).toBe(64);
  });
});
