/**
 * Generates the placeholder image set.
 *
 *   node scripts/gen-placeholders.mjs
 *
 * Nothing here is downloaded — every file is drawn as SVG and rasterised with
 * sharp, so the repo has no stock-photo dependency. Replace the output with
 * real photography using the exact sizes documented in README.md; the file
 * names and aspect ratios are what the layout expects.
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const INK = '#1b2520';
const SAND = '#dcd4c6';
const BONE = '#f4f1ec';
const CLAY = '#a0462a';
const SAGE = '#5f7359';
const TEAL = '#1f4446';

/** Soft vertical glass gradient + a label band, shared by every silhouette. */
function defs(tint) {
  return `
  <defs>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${tint}" stop-opacity="0.55"/>
      <stop offset="18%" stop-color="${tint}" stop-opacity="0.30"/>
      <stop offset="46%" stop-color="${BONE}" stop-opacity="0.92"/>
      <stop offset="72%" stop-color="${tint}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${tint}" stop-opacity="0.60"/>
    </linearGradient>
    <linearGradient id="cap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${INK}" stop-opacity="0.95"/>
      <stop offset="40%" stop-color="${INK}" stop-opacity="0.70"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="label" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BONE}" stop-opacity="0.80"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${BONE}" stop-opacity="0.80"/>
    </linearGradient>
  </defs>`;
}

/** The thin rules + dot that stand in for printed label typography. */
function labelMarks(x, y, w, h, accent) {
  const cx = x + w / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="url(#label)"/>
    <circle cx="${cx}" cy="${y + h * 0.26}" r="${w * 0.055}" fill="${accent}" opacity="0.85"/>
    <rect x="${cx - w * 0.28}" y="${y + h * 0.46}" width="${w * 0.56}" height="3" rx="1.5" fill="${INK}" opacity="0.45"/>
    <rect x="${cx - w * 0.18}" y="${y + h * 0.60}" width="${w * 0.36}" height="2" rx="1" fill="${INK}" opacity="0.28"/>
    <rect x="${cx - w * 0.12}" y="${y + h * 0.72}" width="${w * 0.24}" height="2" rx="1" fill="${INK}" opacity="0.18"/>`;
}

const shapes = {
  /** Tall dropper bottle — serums. */
  dropper(tint, accent) {
    return `
      <rect x="505" y="205" width="190" height="34" rx="10" fill="url(#cap)"/>
      <rect x="548" y="238" width="104" height="128" rx="14" fill="url(#cap)" opacity="0.92"/>
      <rect x="520" y="360" width="160" height="26" rx="9" fill="${INK}" opacity="0.55"/>
      <path d="M430 386 h340 a34 34 0 0 1 34 34 v830 a56 56 0 0 1 -56 56 h-296 a56 56 0 0 1 -56 -56 v-830 a34 34 0 0 1 34 -34 z" fill="url(#glass)"/>
      <path d="M430 386 h340 a34 34 0 0 1 34 34 v830 a56 56 0 0 1 -56 56 h-296 a56 56 0 0 1 -56 -56 v-830 a34 34 0 0 1 34 -34 z" fill="none" stroke="${INK}" stroke-opacity="0.22" stroke-width="3"/>
      ${labelMarks(470, 640, 260, 390, accent)}`;
  },

  /** Squat wide jar — moisturisers and balms. */
  jar(tint, accent) {
    return `
      <rect x="392" y="450" width="416" height="118" rx="26" fill="url(#cap)"/>
      <rect x="392" y="548" width="416" height="22" rx="8" fill="${INK}" opacity="0.5"/>
      <path d="M404 566 h392 a24 24 0 0 1 24 24 v520 a70 70 0 0 1 -70 70 h-300 a70 70 0 0 1 -70 -70 v-520 a24 24 0 0 1 24 -24 z" fill="url(#glass)"/>
      <path d="M404 566 h392 a24 24 0 0 1 24 24 v520 a70 70 0 0 1 -70 70 h-300 a70 70 0 0 1 -70 -70 v-520 a24 24 0 0 1 24 -24 z" fill="none" stroke="${INK}" stroke-opacity="0.22" stroke-width="3"/>
      ${labelMarks(468, 700, 264, 300, accent)}`;
  },

  /** Tapered tube — cleansers. */
  tube(tint, accent) {
    return `
      <rect x="512" y="232" width="176" height="74" rx="14" fill="url(#cap)"/>
      <path d="M470 306 h260 l44 900 a40 40 0 0 1 -40 46 h-268 a40 40 0 0 1 -40 -46 z" fill="url(#glass)"/>
      <path d="M470 306 h260 l44 900 a40 40 0 0 1 -40 46 h-268 a40 40 0 0 1 -40 -46 z" fill="none" stroke="${INK}" stroke-opacity="0.22" stroke-width="3"/>
      ${labelMarks(486, 560, 228, 430, accent)}`;
  },

  /** Rounded-shoulder bottle with a pump — after-shave. */
  pump(tint, accent) {
    return `
      <rect x="566" y="178" width="68" height="120" rx="14" fill="url(#cap)"/>
      <path d="M634 206 h66 a14 14 0 0 1 0 28 h-66 z" fill="url(#cap)"/>
      <rect x="530" y="298" width="140" height="70" rx="16" fill="${INK}" opacity="0.72"/>
      <path d="M600 368 m-170 0 a170 170 0 0 1 340 0 v760 a62 62 0 0 1 -62 62 h-216 a62 62 0 0 1 -62 -62 z" fill="url(#glass)"/>
      <path d="M600 368 m-170 0 a170 170 0 0 1 340 0 v760 a62 62 0 0 1 -62 62 h-216 a62 62 0 0 1 -62 -62 z" fill="none" stroke="${INK}" stroke-opacity="0.22" stroke-width="3"/>
      ${labelMarks(474, 660, 252, 340, accent)}`;
  },
};

function productSvg(shape, tint, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
    ${defs(tint)}
    ${shapes[shape](tint, accent)}
  </svg>`;
}

/* Product id -> silhouette. Keep in sync with src/config/site.ts. */
const products = [
  ['vitamin-c-glow-serum', 'dropper', SAND, CLAY],
  ['hydra-barrier-moisturizer', 'jar', SAND, SAGE],
  ['oil-control-face-wash', 'tube', SAND, TEAL],
  ['after-shave-calm-balm', 'pump', SAND, TEAL],
];

/* ── Hero depth layers ─────────────────────────────────────────────────── */

const heroBottle = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1900" viewBox="0 0 1200 1600">
  ${defs(SAND)}
  ${shapes.dropper(SAND, CLAY)}
</svg>`;

const heroShadow = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
  <defs>
    <radialGradient id="s" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${INK}" stop-opacity="0.42"/>
      <stop offset="55%" stop-color="${INK}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="600" cy="210" rx="560" ry="180" fill="url(#s)"/>
</svg>`;

/** Botanical sprig. `flip` mirrors it for the second layer. */
function sprig(flip) {
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const x = 120 + t * 520;
    const y = 640 - t * 520;
    const r = 58 - t * 22;
    const rot = -32 + t * 18 + (i % 2 ? 150 : 0);
    return `<ellipse cx="${x}" cy="${y}" rx="${r * 2.1}" ry="${r}" fill="${SAGE}" opacity="${0.5 - t * 0.16}" transform="rotate(${rot} ${x} ${y})"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <g ${flip ? 'transform="scale(-1,1) translate(-800,0)"' : ''}>
      <path d="M110 660 C 300 560 460 380 660 120" stroke="${SAGE}" stroke-opacity="0.5" stroke-width="7" fill="none" stroke-linecap="round"/>
      ${leaves}
    </g>
  </svg>`;
}

const droplets = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  ${[
    [140, 220, 34],
    [700, 160, 22],
    [790, 520, 40],
    [110, 640, 26],
    [430, 800, 30],
    [620, 700, 18],
  ]
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${BONE}" opacity="0.85"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${INK}" stroke-opacity="0.18" stroke-width="2"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.32}" r="${r * 0.26}" fill="#fff" opacity="0.9"/>`,
    )
    .join('')}
</svg>`;

/* ── Social card + icons ───────────────────────────────────────────────── */

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BONE}"/>
  <rect x="0" y="0" width="14" height="630" fill="${CLAY}"/>
  <g transform="translate(700,40) scale(0.36)">${shapes.dropper(SAND, CLAY)}</g>
  <text x="90" y="250" font-family="Georgia, serif" font-size="82" fill="${INK}">BRAND_NAME</text>
  <text x="90" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="${INK}" opacity="0.7">Clean actives. Visible results.</text>
  <rect x="90" y="382" width="120" height="2" fill="${CLAY}"/>
  <text x="90" y="452" font-family="Segoe UI, Arial, sans-serif" font-size="27" fill="${INK}" opacity="0.62">For her and for him — delivered across Bangladesh</text>
</svg>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${INK}"/>
  <rect x="26" y="12" width="12" height="7" rx="2" fill="${BONE}"/>
  <path d="M22 22 h20 a4 4 0 0 1 4 4 v20 a6 6 0 0 1 -6 6 h-16 a6 6 0 0 1 -6 -6 v-20 a4 4 0 0 1 4 -4 z" fill="${BONE}"/>
  <circle cx="32" cy="37" r="5" fill="${CLAY}"/>
</svg>`;

/* ── Run ───────────────────────────────────────────────────────────────── */

async function png(svg, outPath, width) {
  const img = sharp(Buffer.from(svg));
  if (width) img.resize({ width });
  await img.png({ compressionLevel: 9, palette: true }).toFile(outPath);
}

await mkdir(join(pub, 'products'), { recursive: true });
await mkdir(join(pub, 'hero'), { recursive: true });

for (const [id, shape, tint, accent] of products) {
  await png(productSvg(shape, tint, accent), join(pub, 'products', `${id}.png`));
}

await png(heroBottle, join(pub, 'hero', 'bottle.png'));
await png(heroShadow, join(pub, 'hero', 'shadow.png'));
await png(sprig(false), join(pub, 'hero', 'sprig-back.png'));
await png(sprig(true), join(pub, 'hero', 'sprig-front.png'));
await png(droplets, join(pub, 'hero', 'droplets.png'));

await sharp(Buffer.from(og)).jpeg({ quality: 86, mozjpeg: true }).toFile(join(pub, 'og.jpg'));

await writeFile(join(pub, 'favicon.svg'), icon);
await png(icon, join(pub, 'apple-touch-icon.png'), 180);
await png(icon, join(pub, 'icon-192.png'), 192);
await png(icon, join(pub, 'icon-512.png'), 512);

console.log('Placeholder assets written to public/.');
