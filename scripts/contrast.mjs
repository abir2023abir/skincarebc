/**
 * WCAG contrast checker for the design tokens.
 * Run: node scripts/contrast.mjs
 * Exits non-zero if any required pair fails, so it can gate a build.
 *
 * Note on the orange: the reference design uses a vivid #F2701E behind white
 * button labels, which is only 2.95:1 and fails AA. Interactive surfaces
 * therefore use the deeper --color-orange; the vivid hue survives as
 * --color-orange-bright for decorative fills that carry no text.
 */

const C = {
  page: '#F0EFED',
  card: '#FFFFFF',
  beige: '#E9DDD1',
  beigeDeep: '#DCCBBA',
  ink: '#131313',
  ink2: '#2E2E2E',
  inkSoft: '#565656',
  inkMute: '#6A6A6A',
  orange: '#C24D10',
  orangeDeep: '#A64109',
  orangeBright: '#F2701E',
  green: '#4F6349',
  white: '#FFFFFF',
};

function lum(hex) {
  const v = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [foreground, background, minimum, what it is used for]
const pairs = [
  ['ink', 'page', 4.5, 'headlines on the page background'],
  ['ink', 'card', 4.5, 'headlines and body on white cards'],
  ['ink', 'beige', 4.5, 'copy on the beige photo cards'],
  ['inkSoft', 'page', 4.5, 'body copy'],
  ['inkSoft', 'card', 4.5, 'body copy on cards'],
  ['inkSoft', 'beige', 4.5, 'body copy on beige'],
  ['inkMute', 'page', 4.5, 'meta, captions, sizes'],
  ['inkMute', 'card', 4.5, 'meta on cards'],
  ['orangeDeep', 'page', 4.5, 'accent text and links on the page'],
  ['orangeDeep', 'card', 4.5, 'accent text and links on cards'],
  ['white', 'orange', 4.5, 'label inside the primary button'],
  ['white', 'orangeDeep', 4.5, 'label inside the hovered button'],
  ['white', 'ink', 4.5, 'label inside the dark button'],
  ['ink', 'orangeBright', 4.5, 'dark label on a vivid-orange badge'],
  ['white', 'green', 4.5, 'label on a green chip'],
  ['page', 'ink', 4.5, 'copy inside a dark section'],
  ['beige', 'ink', 4.5, 'headline inside a dark section'],
];

let failed = 0;
const rows = pairs.map(([fg, bg, min, use]) => {
  const r = ratio(C[fg], C[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  return `${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)} : 1  (min ${min})  ${fg} on ${bg}  — ${use}`;
});

console.log(rows.join('\n'));
console.log(failed === 0 ? `\nAll ${pairs.length} pairs meet WCAG AA.` : `\n${failed} pair(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);
