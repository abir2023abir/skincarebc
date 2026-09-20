/**
 * Turns the downloaded stock photos into the site's asset set.
 *
 *   node scripts/fetch-stock.mjs     # first: download into .stock/
 *   node scripts/build-assets.mjs    # then: process into src/assets/
 *
 * Source: Pexels. The Pexels licence allows free commercial use, no attribution
 * required, and permits modification. These are DEMO photos so the client can
 * see the design with real imagery — swap in the brand's own shoot before
 * launch (see "Replacing the images" in README.md).
 *
 * Products and scenes are written as JPEG (photographs compress far better as
 * JPEG, and Astro re-encodes to AVIF/WebP at several widths anyway).
 * Botanicals are written as PNG because they need a real alpha channel.
 */

import sharp from 'sharp';
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = join(root, '.stock');
const assets = join(root, 'src', 'assets');

const src = (name) => join(cache, `${name}.jpg`);

/* ── Photographs ─────────────────────────────────────────────────────────── */

/** [source, output, width, height, gravity] */
const PHOTOS = [
  // Products. 4:5 so one file serves both the 1:1 card well and the taller
  // story well without either one cropping badly.
  ['serum-8054400', 'products/vitamin-c-glow-serum', 1200, 1500, 'centre'],
  ['jar-6963149', 'products/hydra-barrier-moisturizer', 1200, 1500, 'centre'],
  ['jar-8015480', 'products/oil-control-face-wash', 1200, 1500, 'centre'],
  ['serum-35899861', 'products/after-shave-calm-balm', 1200, 1500, 'centre'],

  // Model cards. Every figure is a woman, per the brief.
  ['model-3762874', 'scenes/model-hero', 1000, 1250, 'north'],
  ['model-7010902', 'scenes/model-council', 1200, 900, 'centre'],
  ['model-6543616', 'scenes/model-square', 900, 900, 'north'],

  // Showcase scene cards.
  ['serum-7796377', 'scenes/scene-1', 900, 900, 'centre'],
  ['jar-8490121', 'scenes/scene-2', 900, 900, 'centre'],
  ['serum-8101534', 'scenes/scene-3', 900, 900, 'centre'],
];

/* ── Cut-outs ────────────────────────────────────────────────────────────── */

const CUTOUTS = [
  ['rose-37646136', 'botanical/rose', 700],
  ['rose-11882660', 'botanical/rose-stem', 700],
  ['leaf-37215213', 'botanical/sprig-green', 700],
  ['leaf-36881511', 'botanical/monstera', 700],
  ['leaf-4098469', 'botanical/leaf', 700],
  ['leaf-4131781', 'botanical/leaf-long', 700],
];

/**
 * Keys a subject off a light background by luminance.
 *
 * These photos are a saturated subject (red rose, green leaf) on a pale
 * backdrop, so the darkest channel discriminates well: background pixels have a
 * high minimum channel, the subject has a low one.
 *
 * The threshold is derived per image rather than fixed. "White" backdrops in
 * stock photography are often light grey, and a fixed cut left a visible pale
 * rectangle around three of these six. Sampling the border gives the real
 * backdrop level to key against.
 *
 * A soft ramp rather than a hard cut keeps edges anti-aliased instead of
 * leaving a cut-paper silhouette.
 */
async function cutout(inPath, size) {
  const img = sharp(inPath).resize(size, size, { fit: 'inside', withoutEnlargement: true });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const darknessAt = (x, y) => {
    const i = (y * width + x) * channels;
    return 255 - Math.min(data[i], data[i + 1], data[i + 2]);
  };

  // Sample the border: the subject is centred, so the frame is backdrop.
  const samples = [];
  const step = Math.max(1, Math.floor(width / 60));
  for (let x = 0; x < width; x += step) {
    samples.push(darknessAt(x, 0), darknessAt(x, height - 1));
  }
  for (let y = 0; y < height; y += step) {
    samples.push(darknessAt(0, y), darknessAt(width - 1, y));
  }
  samples.sort((a, b) => a - b);
  // 85th percentile, not the max: a stray dark pixel in one corner should not
  // drag the whole threshold up and eat the subject.
  const backdrop = samples[Math.floor(samples.length * 0.85)] ?? 0;

  const FLOOR = backdrop + 10;
  const CEIL = FLOOR + 48;

  const out = Buffer.alloc(width * height * 4);
  for (let i = 0, o = 0; i < data.length; i += channels, o += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const darkness = 255 - Math.min(r, g, b);
    let alpha = ((darkness - FLOOR) / (CEIL - FLOOR)) * 255;
    alpha = alpha < 0 ? 0 : alpha > 255 ? 255 : alpha;

    out[o] = r;
    out[o + 1] = g;
    out[o + 2] = b;
    out[o + 3] = alpha;
  }

  return sharp(out, { raw: { width, height, channels: 4 } })
    // Drop the fully transparent border so the scatter positions the subject,
    // not a box of empty pixels.
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9 });
}

/* ── Run ─────────────────────────────────────────────────────────────────── */

for (const dir of ['products', 'scenes', 'botanical']) {
  await rm(join(assets, dir), { recursive: true, force: true });
  await mkdir(join(assets, dir), { recursive: true });
}

for (const [from, to, w, h, gravity] of PHOTOS) {
  await sharp(src(from))
    .resize(w, h, { fit: 'cover', position: gravity })
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(join(assets, `${to}.jpg`));
  console.log(`photo    ${to}.jpg  ${w}x${h}`);
}

for (const [from, to, size] of CUTOUTS) {
  const pipeline = await cutout(src(from), size);
  const info = await pipeline.toFile(join(assets, `${to}.png`));
  console.log(`cutout   ${to}.png  ${info.width}x${info.height}`);
}

console.log('\nDone. Run `npm run build` to regenerate the optimised variants.');
