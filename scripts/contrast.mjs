/**
 * WCAG contrast checker for the design tokens.
 * Run: node scripts/contrast.mjs
 * Exits non-zero if any required pair fails, so it can gate a build.
 */

const C = {
  bone: '#F4F1EC',
  paper: '#FAF8F4',
  sand: '#E9E3D8',
  sandDeep: '#DCD4C6',
  ink: '#1B2520',
  ink2: '#2B3730',
  inkSoft: '#4E5C54',
  inkMute: '#59675F',
  clay: '#A0462A',
  clayDeep: '#853A22',
  claySoft: '#C98A6E',
  sage: '#5F7359',
  sageSoft: '#8FA189',
  teal: '#1F4446',
  tealSoft: '#7FA0A1',
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
  ['ink', 'bone', 4.5, 'body copy on the light base'],
  ['ink', 'paper', 4.5, 'body copy on cards'],
  ['ink', 'sand', 4.5, 'body copy on the sand band'],
  ['inkSoft', 'bone', 4.5, 'secondary copy'],
  ['inkSoft', 'paper', 4.5, 'secondary copy on cards'],
  ['inkMute', 'bone', 4.5, 'index labels, meta, captions'],
  ['inkMute', 'paper', 4.5, 'meta on cards'],
  ['inkMute', 'sand', 4.5, 'meta on the sand band'],
  ['clay', 'bone', 4.5, 'accent text + text links'],
  ['clay', 'paper', 4.5, 'accent text on cards'],
  ['white', 'clay', 4.5, 'label inside the primary CTA'],
  ['white', 'clayDeep', 4.5, 'label inside the hovered CTA'],
  ['white', 'sage', 4.5, 'label on a sage chip'],
  ['white', 'teal', 4.5, 'label on a teal chip'],
  ['bone', 'ink', 4.5, 'copy inside the dark section'],
  ['paper', 'ink', 4.5, 'headlines inside the dark section'],
  ['sageSoft', 'ink', 4.5, 'her accent on dark'],
  ['tealSoft', 'ink', 4.5, 'him accent on dark'],
  ['claySoft', 'ink', 4.5, 'accent text on dark'],
  ['inkSoft', 'sand', 3.0, 'hairline dividers / large text'],
  ['white', 'ink', 4.5, 'focus ring contrast on dark'],
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
