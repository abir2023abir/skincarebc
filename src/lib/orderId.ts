/**
 * Browser-generated order IDs. No backend, so the ID only has to be readable
 * over WhatsApp and unlikely to repeat.
 *
 * Format: <PREFIX>-<6 base36 chars derived from the timestamp>, e.g. "GS-3K7M2P".
 * Six base36 characters cover ~25 days of millisecond timestamps before the
 * code repeats. (The brief sketched a 4-character code; 4 characters would wrap
 * roughly every 30 minutes, which is not safe for a day of Facebook-ad traffic.)
 */

const CODE_LENGTH = 6;

/** "BRAND_NAME" -> "BN", "Glow Skin" -> "GS". Falls back to "OR". */
export function prefixFromBrand(brand: string): string {
  const words = brand
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const letters = words
    .map((w) => w[0] ?? '')
    .join('')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 2)
    .toUpperCase();
  return letters.length >= 2 ? letters : (letters + 'OR').slice(0, 2);
}

/**
 * @param prefix Two-letter brand prefix.
 * @param now    Injected for tests; defaults to the current time.
 */
export function makeOrderId(prefix: string, now: number = Date.now()): string {
  const safePrefix = (prefix || 'OR').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'OR';
  const code = Math.floor(Math.abs(now))
    .toString(36)
    .toUpperCase()
    .slice(-CODE_LENGTH)
    .padStart(CODE_LENGTH, '0');
  return `${safePrefix}-${code}`;
}
