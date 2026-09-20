/**
 * Builds the WhatsApp order message.
 *
 * Deliberately pure and free of any config/DOM import so it can be unit-tested
 * in isolation — this string is the entire order record the business receives,
 * so it is the one piece of logic that must never silently drift.
 */

import { formatBdt } from './formatBdt';

export interface OrderMessageInput {
  /** e.g. "GS-3K7M2P" — the leading "#" is added by the template. */
  orderId: string;
  /** Product or combo name, in English. */
  productName: string;
  quantity: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  customerName: string;
  /** Already normalised to "01XXXXXXXXX". */
  mobile: string;
  address: string;
  district: string;
  /** 'bkash' | 'cod'. Drives the payment block. */
  paymentMethod: 'bkash' | 'cod';
  /** Required when paymentMethod === 'bkash'. */
  bkashNumber?: string;
  /** Optional customer note. Blank/whitespace drops the whole line. */
  note?: string;
}

/** Collapse newlines and trim, so one field cannot forge extra message lines. */
function oneLine(value: string): string {
  return value.replace(/\s*[\r\n]+\s*/g, ' ').trim();
}

export function buildOrderMessage(input: OrderMessageInput): string {
  const total = formatBdt(input.total);

  const paymentLines: string[] =
    input.paymentMethod === 'cod'
      ? [
          `💳 Payment: ক্যাশ অন ডেলিভারি (COD)`,
          `ডেলিভারির সময় মোট ${total} কুরিয়ারকে পরিশোধ করুন।`,
        ]
      : [
          `💳 Payment: bKash (${oneLine(input.bkashNumber ?? '')})`,
          `আমি মোট ${total} পাঠিয়েছি / পাঠাচ্ছি। ট্রানজেকশনের স্ক্রিনশট নিচে পাঠাচ্ছি।`,
        ];

  const lines: string[] = [
    'আসসালামু আলাইকুম, আমি একটি অর্ডার করতে চাই।',
    '',
    `🧾 Order ID: #${oneLine(input.orderId)}`,
    '',
    `🧴 Product: ${oneLine(input.productName)}`,
    `📦 Quantity: ${input.quantity}`,
    `💰 Subtotal: ${formatBdt(input.subtotal)}`,
    `🚚 Delivery: ${formatBdt(input.deliveryCharge)}`,
    `✅ Total: ${total}`,
    '',
    `👤 Name: ${oneLine(input.customerName)}`,
    `📞 Mobile: ${oneLine(input.mobile)}`,
    `📍 Address: ${oneLine(input.address)}, ${oneLine(input.district)}`,
    '',
    ...paymentLines,
  ];

  const note = oneLine(input.note ?? '');
  if (note) {
    lines.push('', `📝 Note: ${note}`);
  }

  return lines.join('\n');
}

/**
 * wa.me deep link. encodeURIComponent (not URLSearchParams) because WhatsApp
 * needs %20 for spaces — URLSearchParams would encode them as "+" and the
 * pluses show up literally in the customer's message box.
 */
export function buildWhatsappUrl(whatsappNumber: string, message: string): string {
  const digits = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
