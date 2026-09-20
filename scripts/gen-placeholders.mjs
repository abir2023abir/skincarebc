/**
 * Generates the placeholder image set.
 *
 *   node scripts/gen-placeholders.mjs
 *
 * Nothing is downloaded — every file is drawn as SVG and rasterised with sharp,
 * so the repo has no stock-photo dependency and no licensing question.
 *
 * These are deliberately clean flat illustrations, not fake photographs. The
 * reference design gets its character from real photography; see "Replacing the
 * images" in README.md for the exact size, ratio and subject to shoot or buy
 * for every slot. Every human figure here is female, per the brief.
 *
 * Output:
 *   src/assets/products/*.png    transparent bottles   1200×1600 (3:4)
 *   src/assets/scenes/*.png      model + scene cards   various
 *   src/assets/botanical/*.png   transparent cut-outs  square
 *   public/og.jpg + icons        served as-is
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
/* Product, scene and botanical art lives under src/assets so Astro's image
   pipeline can emit AVIF/WebP and a srcset for it. Files in public/ are served
   byte-for-byte and would blow the LCP budget. */
const assets = join(root, 'src', 'assets');

const INK = '#131313';
const PAGE = '#f0efed';
const BEIGE = '#e9ddd1';
const BEIGE_DEEP = '#dccbba';
const ORANGE = '#c24d10';
const ORANGE_BRIGHT = '#f2701e';
const GREEN = '#4f6349';
const GREEN_LIGHT = '#7d9274';
const AMBER = '#9c5324';
const AMBER_LIGHT = '#c8813f';
const SKIN = '#d9a87e';
const SKIN_SHADE = '#c08f66';
const HAIR = '#2a2118';
const CREAM = '#fbf7f2';

/* ───────────────────────────────────────────────────────────────────────────
   PRODUCTS — amber glass, black cap, white label
   ─────────────────────────────────────────────────────────────────────── */

function glassDefs(id) {
  return `
  <defs>
    <linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${AMBER}" stop-opacity="0.98"/>
      <stop offset="22%" stop-color="${AMBER_LIGHT}" stop-opacity="0.95"/>
      <stop offset="48%" stop-color="#e0a468" stop-opacity="0.92"/>
      <stop offset="74%" stop-color="${AMBER_LIGHT}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#7d4019" stop-opacity="0.99"/>
    </linearGradient>
    <linearGradient id="c-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0d0d0d"/>
      <stop offset="35%" stop-color="#3a3a3a"/>
      <stop offset="65%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
  </defs>`;
}

/** Printed label: a dot, a brand rule and two text rules. */
function label(x, y, w, h) {
  const cx = x + w / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${CREAM}"/>
    <circle cx="${cx}" cy="${y + h * 0.22}" r="${w * 0.06}" fill="${ORANGE}"/>
    <rect x="${cx - w * 0.3}" y="${y + h * 0.42}" width="${w * 0.6}" height="7" rx="3.5" fill="${INK}" opacity="0.82"/>
    <rect x="${cx - w * 0.2}" y="${y + h * 0.58}" width="${w * 0.4}" height="4" rx="2" fill="${INK}" opacity="0.36"/>
    <rect x="${cx - w * 0.13}" y="${y + h * 0.7}" width="${w * 0.26}" height="4" rx="2" fill="${INK}" opacity="0.22"/>`;
}

const shapes = {
  dropper: (id) => `
    <rect x="516" y="196" width="168" height="40" rx="12" fill="url(#c-${id})"/>
    <rect x="552" y="234" width="96" height="140" rx="16" fill="url(#c-${id})"/>
    <rect x="524" y="368" width="152" height="30" rx="10" fill="#0d0d0d"/>
    <path d="M436 396 h328 a30 30 0 0 1 30 30 v800 a58 58 0 0 1 -58 58 h-272 a58 58 0 0 1 -58 -58 v-800 a30 30 0 0 1 30 -30 z" fill="url(#g-${id})"/>
    ${label(476, 640, 248, 380)}`,

  jar: (id) => `
    <rect x="388" y="436" width="424" height="126" rx="28" fill="url(#c-${id})"/>
    <rect x="388" y="540" width="424" height="24" rx="9" fill="#0a0a0a"/>
    <path d="M402 560 h396 a26 26 0 0 1 26 26 v500 a72 72 0 0 1 -72 72 h-304 a72 72 0 0 1 -72 -72 v-500 a26 26 0 0 1 26 -26 z" fill="url(#g-${id})"/>
    ${label(472, 690, 256, 296)}`,

  tube: (id) => `
    <rect x="510" y="222" width="180" height="82" rx="16" fill="url(#c-${id})"/>
    <path d="M466 304 h268 l42 880 a42 42 0 0 1 -42 48 h-268 a42 42 0 0 1 -42 -48 z" fill="url(#g-${id})"/>
    ${label(490, 556, 220, 420)}`,

  pump: (id) => `
    <rect x="568" y="164" width="64" height="126" rx="16" fill="url(#c-${id})"/>
    <path d="M632 194 h68 a15 15 0 0 1 0 30 h-68 z" fill="url(#c-${id})"/>
    <rect x="528" y="290" width="144" height="74" rx="18" fill="url(#c-${id})"/>
    <path d="M600 364 m-166 0 a166 166 0 0 1 332 0 v740 a64 64 0 0 1 -64 64 h-204 a64 64 0 0 1 -64 -64 z" fill="url(#g-${id})"/>
    ${label(478, 650, 244, 336)}`,
};

function productSvg(shape, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
    ${glassDefs(id)}
    ${shapes[shape](id)}
  </svg>`;
}

/* Product id -> silhouette. Keep in sync with src/config/site.ts. */
const products = [
  ['vitamin-c-glow-serum', 'dropper'],
  ['hydra-barrier-moisturizer', 'jar'],
  ['oil-control-face-wash', 'tube'],
  ['after-shave-calm-balm', 'pump'],
];

/* ───────────────────────────────────────────────────────────────────────────
   MODEL CARDS — stylised female figure on beige, standing in for photography
   ─────────────────────────────────────────────────────────────────────── */

function model(w, h, bg, handToFace) {
  const cx = w / 2;
  const r = Math.min(w, h) * 0.17;
  const hy = h * 0.36;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <clipPath id="card"><rect width="${w}" height="${h}" rx="${Math.min(w, h) * 0.05}"/></clipPath>
      <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="${BEIGE_DEEP}"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#card)">
      <rect width="${w}" height="${h}" fill="url(#warm)"/>
      <circle cx="${cx}" cy="${hy + r * 0.2}" r="${r * 2.05}" fill="#ffffff" opacity="0.3"/>

      <path d="M${cx - w * 0.42} ${h} q ${w * 0.08} ${-h * 0.2} ${w * 0.42} ${-h * 0.2} q ${w * 0.34} 0 ${w * 0.42} ${h * 0.2} z" fill="${SKIN_SHADE}"/>
      <rect x="${cx - r * 0.32}" y="${hy + r * 0.55}" width="${r * 0.64}" height="${r * 0.85}" rx="${r * 0.3}" fill="${SKIN_SHADE}"/>
      <ellipse cx="${cx}" cy="${hy + r * 0.35}" rx="${r * 1.3}" ry="${r * 1.48}" fill="${HAIR}"/>
      <ellipse cx="${cx}" cy="${hy}" rx="${r * 0.92}" ry="${r * 1.12}" fill="${SKIN}"/>
      <path d="M${cx - r * 1.02} ${hy - r * 0.3} a ${r * 1.02} ${r * 1.16} 0 0 1 ${r * 2.04} 0 q ${-r * 0.3} ${-r * 0.52} ${-r * 1.02} ${-r * 0.46} q ${-r * 0.72} ${-r * 0.06} ${-r * 1.02} ${r * 0.46} z" fill="${HAIR}"/>

      <path d="M${cx - r * 0.44} ${hy - r * 0.02} q ${r * 0.16} ${-r * 0.14} ${r * 0.32} 0" stroke="${INK}" stroke-opacity="0.65" stroke-width="${r * 0.075}" fill="none" stroke-linecap="round"/>
      <path d="M${cx + r * 0.12} ${hy - r * 0.02} q ${r * 0.16} ${-r * 0.14} ${r * 0.32} 0" stroke="${INK}" stroke-opacity="0.65" stroke-width="${r * 0.075}" fill="none" stroke-linecap="round"/>
      <path d="M${cx - r * 0.17} ${hy + r * 0.5} q ${r * 0.17} ${r * 0.16} ${r * 0.34} 0" stroke="${INK}" stroke-opacity="0.45" stroke-width="${r * 0.07}" fill="none" stroke-linecap="round"/>

      ${
        handToFace
          ? `<path d="M${cx + r * 0.72} ${hy + r * 1.62} q ${r * 0.1} ${-r * 0.92} ${r * 0.52} ${-r * 1.04} q ${r * 0.3} ${-r * 0.08} ${r * 0.26} ${r * 0.3} l ${-r * 0.12} ${r * 0.62} q ${r * 0.02} ${r * 0.46} ${-r * 0.38} ${r * 0.58} z" fill="${SKIN}"/>
      <circle cx="${cx + r * 0.62}" cy="${hy + r * 0.3}" r="${r * 0.16}" fill="${CREAM}"/>
      <circle cx="${cx + r * 0.44}" cy="${hy + r * 0.52}" r="${r * 0.09}" fill="${CREAM}" opacity="0.85"/>`
          : ''
      }
    </g>
  </svg>`;
}

/* ───────────────────────────────────────────────────────────────────────────
   SCENE CARDS — a bottle on a plinth, for the product carousel
   ─────────────────────────────────────────────────────────────────────── */

function scene(w, h, bg, accent, shape) {
  const cx = w / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${glassDefs('s')}
    <defs><clipPath id="sc"><rect width="${w}" height="${h}" rx="${w * 0.05}"/></clipPath></defs>
    <g clip-path="url(#sc)">
      <rect width="${w}" height="${h}" fill="${bg}"/>
      <circle cx="${cx}" cy="${h * 0.44}" r="${w * 0.3}" fill="${accent}" opacity="0.22"/>
      <path d="M${w * 0.14} ${h * 0.86} q ${w * 0.1} ${-h * 0.22} ${w * 0.26} ${-h * 0.14} q ${-w * 0.1} ${h * 0.2} ${-w * 0.26} ${h * 0.14} z" fill="${GREEN}" opacity="0.5"/>
      <path d="M${w * 0.86} ${h * 0.88} q ${-w * 0.1} ${-h * 0.24} ${-w * 0.28} ${-h * 0.15} q ${w * 0.11} ${h * 0.22} ${w * 0.28} ${h * 0.15} z" fill="${GREEN}" opacity="0.42"/>
      <ellipse cx="${cx}" cy="${h * 0.8}" rx="${w * 0.3}" ry="${w * 0.075}" fill="${accent}" opacity="0.55"/>
      <ellipse cx="${cx}" cy="${h * 0.775}" rx="${w * 0.3}" ry="${w * 0.075}" fill="${accent}" opacity="0.9"/>
      <g transform="translate(${cx} ${h * 0.775}) scale(${(w * 0.00042).toFixed(4)}) translate(-600 -1484)">
        ${shapes[shape]('s')}
      </g>
    </g>
  </svg>`;
}

/* ───────────────────────────────────────────────────────────────────────────
   BOTANICAL CUT-OUTS — transparent, scattered around the page
   ─────────────────────────────────────────────────────────────────────── */

const petal = (len, w, fill, op) =>
  `<path d="M0 0 C ${len * 0.3} ${-w} ${len * 0.72} ${-w} ${len} 0 C ${len * 0.72} ${w} ${len * 0.3} ${w} 0 0 Z" fill="${fill}" opacity="${op}"/>`;

/** Layered round bloom — stands in for the rose / anemone cut-outs. */
function bloom(outer, inner, centre, rings = 3) {
  const S = 400;
  const layers = Array.from({ length: rings }, (_, r) => {
    const count = 8 + r * 3;
    const len = 150 - r * 36;
    const w = len * 0.42;
    const fill = r === 0 ? outer : r === 1 ? inner : centre;
    const op = (0.95 - r * 0.08).toFixed(2);
    return Array.from({ length: count }, (_, i) => {
      const a = (360 / count) * i + r * 14;
      return `<g transform="rotate(${a} ${S / 2} ${S / 2}) translate(${S / 2} ${S / 2})">${petal(len, w, fill, op)}</g>`;
    }).join('');
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${layers}
    <circle cx="${S / 2}" cy="${S / 2}" r="26" fill="${centre}"/>
  </svg>`;
}

/** Sunflower: long ray petals, dark disc. */
function sunflower() {
  const S = 400;
  const ring = (n, len, w, fill, offset) =>
    Array.from({ length: n }, (_, i) => {
      const a = (360 / n) * i + offset;
      return `<g transform="rotate(${a} ${S / 2} ${S / 2}) translate(${S / 2} ${S / 2})">${petal(len, w, fill, 0.96)}</g>`;
    }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${ring(18, 160, 38, '#e0a63a', 0)}
    ${ring(14, 104, 30, '#c98a24', 12)}
    <circle cx="${S / 2}" cy="${S / 2}" r="54" fill="#4a3418"/>
    <circle cx="${S / 2}" cy="${S / 2}" r="38" fill="#6b4a22" opacity="0.7"/>
  </svg>`;
}

/**
 * Autumn leaf. A smooth pointed leaf with a midrib and veins rather than a
 * jagged maple: at the 90px the scatter renders it at, a spiky outline reads as
 * an orange starburst instead of a leaf.
 */
function autumnLeaf() {
  const S = 400;
  const veins = Array.from({ length: 5 }, (_, i) => {
    const y = 110 + i * 44;
    const spread = 74 - Math.abs(i - 1.6) * 16;
    return `<path d="M200 ${y + 26} L ${200 - spread} ${y}" /><path d="M200 ${y + 26} L ${200 + spread} ${y}" />`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <defs><linearGradient id="al" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#e09a3c"/><stop offset="48%" stop-color="#c8701f"/><stop offset="100%" stop-color="#96481a"/>
    </linearGradient></defs>
    <path d="M200 372 C 196 330 198 316 200 300" stroke="#8a4517" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M200 34 C 312 130 330 236 200 340 C 70 236 88 130 200 34 Z" fill="url(#al)"/>
    <g stroke="#7d3a12" stroke-opacity="0.38" stroke-width="5" fill="none" stroke-linecap="round">
      <path d="M200 58 V 330"/>
      ${veins}
    </g>
  </svg>`;
}

/** Dried seed-pod sprig, like the pale stems in the reference corners. */
function driedSprig() {
  const S = 400;
  const pods = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    const x = 60 + t * 280;
    const y = 350 - t * 300;
    const side = i % 2 ? 1 : -1;
    const r = 26 - t * 11;
    const px = x + side * 20;
    return `<ellipse cx="${px}" cy="${y}" rx="${r}" ry="${r * 0.66}" fill="#c9b79a" opacity="${(0.95 - t * 0.2).toFixed(2)}" transform="rotate(${side * 34} ${px} ${y})"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <path d="M56 356 C 150 300 240 200 344 52" stroke="#b5a184" stroke-width="7" fill="none" stroke-linecap="round"/>
    ${pods}
  </svg>`;
}

/** Fresh green sprig — the small leafy stems in the reference. */
function greenSprig() {
  const S = 400;
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const x = 70 + t * 260;
    const y = 340 - t * 280;
    const side = i % 2 ? 1 : -1;
    const len = 122 - t * 54;
    const a = -46 + side * 56;
    return `<g transform="translate(${x} ${y}) rotate(${a})">${petal(len, len * 0.3, i % 3 === 0 ? GREEN : GREEN_LIGHT, (0.95 - t * 0.15).toFixed(2))}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <path d="M62 348 C 150 292 244 196 338 56" stroke="${GREEN}" stroke-width="8" fill="none" stroke-linecap="round"/>
    ${leaves}
  </svg>`;
}

/* ───────────────────────────────────────────────────────────────────────────
   SOCIAL CARD + ICONS
   ─────────────────────────────────────────────────────────────────────── */

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${glassDefs('og')}
  <rect width="1200" height="630" fill="${PAGE}"/>
  <rect x="64" y="56" width="1072" height="518" rx="44" fill="#ffffff"/>
  <g transform="translate(910 315) scale(0.30) translate(-600 -800)">${shapes.dropper('og')}</g>
  <text x="128" y="268" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="88" fill="${INK}">BRAND_NAME</text>
  <text x="128" y="342" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="${INK}" opacity="0.62">Clean actives. Visible results.</text>
  <rect x="128" y="392" width="196" height="56" rx="14" fill="${ORANGE}"/>
  <text x="160" y="429" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="24" fill="#ffffff">Shop Now</text>
</svg>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="${INK}"/>
  <rect x="27" y="11" width="10" height="7" rx="2" fill="${ORANGE_BRIGHT}"/>
  <path d="M23 21 h18 a4 4 0 0 1 4 4 v21 a6 6 0 0 1 -6 6 h-14 a6 6 0 0 1 -6 -6 v-21 a4 4 0 0 1 4 -4 z" fill="${ORANGE_BRIGHT}"/>
  <rect x="26" y="31" width="12" height="15" rx="3" fill="${CREAM}"/>
</svg>`;

/* ───────────────────────────────────────────────────────────────────────────
   RUN
   ─────────────────────────────────────────────────────────────────────── */

async function png(svg, outPath, width) {
  const img = sharp(Buffer.from(svg));
  if (width) img.resize({ width });
  await img.png({ compressionLevel: 9 }).toFile(outPath);
}

for (const dir of ['products', 'scenes', 'botanical']) {
  await mkdir(join(assets, dir), { recursive: true });
}

for (const [id, shape] of products) {
  await png(productSvg(shape, id), join(assets, 'products', `${id}.png`));
}

// Model cards. Every figure is female.
await png(model(1000, 1250, BEIGE, true), join(assets, 'scenes', 'model-hero.png'));
await png(model(1200, 900, BEIGE, true), join(assets, 'scenes', 'model-council.png'));
await png(model(900, 900, BEIGE_DEEP, false), join(assets, 'scenes', 'model-square.png'));

// Carousel scene cards.
await png(scene(900, 900, '#e4d6c6', BEIGE_DEEP, 'dropper'), join(assets, 'scenes', 'scene-1.png'));
await png(scene(900, 900, '#d8e0d2', GREEN_LIGHT, 'jar'), join(assets, 'scenes', 'scene-2.png'));
await png(scene(900, 900, '#e6dbcd', BEIGE_DEEP, 'pump'), join(assets, 'scenes', 'scene-3.png'));

// Botanicals.
await png(bloom('#c0271f', '#9d1c16', '#7a1410'), join(assets, 'botanical', 'rose.png'));
await png(bloom('#d94436', '#b32d22', '#2a1a14', 2), join(assets, 'botanical', 'anemone.png'));
await png(sunflower(), join(assets, 'botanical', 'sunflower.png'));
await png(autumnLeaf(), join(assets, 'botanical', 'leaf-autumn.png'));
await png(driedSprig(), join(assets, 'botanical', 'sprig-dried.png'));
await png(greenSprig(), join(assets, 'botanical', 'sprig-green.png'));

await sharp(Buffer.from(og)).jpeg({ quality: 86, mozjpeg: true }).toFile(join(pub, 'og.jpg'));

await writeFile(join(pub, 'favicon.svg'), icon);
await png(icon, join(pub, 'apple-touch-icon.png'), 180);
await png(icon, join(pub, 'icon-192.png'), 192);
await png(icon, join(pub, 'icon-512.png'), 512);

console.log('Placeholder art written to src/assets/, social card + icons to public/.');
