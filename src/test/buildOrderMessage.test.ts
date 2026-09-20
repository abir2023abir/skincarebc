import { describe, expect, it } from 'vitest';
import { buildOrderMessage, buildWhatsappUrl } from '~/lib/buildOrderMessage';
import type { OrderMessageInput } from '~/lib/buildOrderMessage';

const base: OrderMessageInput = {
  orderId: 'GS-4821',
  productName: 'Vitamin C Glow Serum',
  quantity: 2,
  subtotal: 1700,
  deliveryCharge: 60,
  total: 1760,
  customerName: 'নুসরাত জাহান',
  mobile: '01712345678',
  address: 'বাড়ি ১২, রোড ৪, উপশহর',
  district: 'রাজশাহী',
  bkashNumber: '01712345678',
};

describe('buildOrderMessage', () => {
  it('renders the full template in order', () => {
    expect(buildOrderMessage(base)).toBe(
      [
        'আসসালামু আলাইকুম, আমি একটি অর্ডার করতে চাই।',
        '',
        '🧾 Order ID: #GS-4821',
        '',
        '🧴 Product: Vitamin C Glow Serum',
        '📦 Quantity: 2',
        '💰 Subtotal: ৳1,700',
        '🚚 Delivery: ৳60',
        '✅ Total: ৳1,760',
        '',
        '👤 Name: নুসরাত জাহান',
        '📞 Mobile: 01712345678',
        '📍 Address: বাড়ি ১২, রোড ৪, উপশহর, রাজশাহী',
        '',
        '💳 Payment: bKash (01712345678)',
        'আমি মোট ৳1,760 পাঠিয়েছি / পাঠাচ্ছি। ট্রানজেকশনের স্ক্রিনশট নিচে পাঠাচ্ছি।',
      ].join('\n'),
    );
  });

  it('appends the note block only when a note is present', () => {
    expect(buildOrderMessage(base)).not.toContain('📝 Note:');
    expect(buildOrderMessage({ ...base, note: '   ' })).not.toContain('📝 Note:');
    expect(buildOrderMessage({ ...base, note: 'বিকেলে ফোন দিন' })).toContain(
      '\n\n📝 Note: বিকেলে ফোন দিন',
    );
  });

  it('flattens newlines so a field cannot forge extra message lines', () => {
    const msg = buildOrderMessage({
      ...base,
      address: 'বাড়ি ১২\n✅ Total: ৳10',
      note: 'line one\nline two',
    });
    expect(msg).toContain('📍 Address: বাড়ি ১২ ✅ Total: ৳10, রাজশাহী');
    expect(msg).toContain('📝 Note: line one line two');
    // Exactly one real total line survives.
    expect(msg.split('\n').filter((l) => l.startsWith('✅ Total:'))).toHaveLength(1);
  });

  it('groups large totals the South Asian way', () => {
    const msg = buildOrderMessage({ ...base, subtotal: 220000, total: 220120, deliveryCharge: 120 });
    expect(msg).toContain('💰 Subtotal: ৳2,20,000');
    expect(msg).toContain('✅ Total: ৳2,20,120');
  });
});

describe('buildWhatsappUrl', () => {
  it('strips non-digits from the number and encodes spaces as %20', () => {
    const url = buildWhatsappUrl('+880 1712-345678', 'hello world');
    expect(url).toBe('https://wa.me/8801712345678?text=hello%20world');
    expect(url).not.toContain('+');
  });

  it('round-trips the message through decodeURIComponent', () => {
    const message = buildOrderMessage(base);
    const url = buildWhatsappUrl('8801712345678', message);
    const encoded = url.slice(url.indexOf('?text=') + 6);
    expect(decodeURIComponent(encoded)).toBe(message);
  });
});
