/**
 * Downloads candidate stock photos and tiles them into a contact sheet for
 * review.
 *
 *   node scripts/fetch-stock.mjs            # download + build sheet
 *
 * Source: Pexels. The Pexels licence allows free commercial use, no
 * attribution required, and permits modification. These are DEMO images to show
 * the client the design working with real photography — replace them with the
 * brand's own shoot before launch (see README).
 */

import sharp from 'sharp';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = join(root, '.stock');

/** [group, pexels photo id, note] */
const CANDIDATES = [
  ['serum', 8054400, 'amber dropper bottle, light bg'],
  ['serum', 8101534, 'serum bottle w/ shadows'],
  ['serum', 35899861, 'brown dropper on glass'],
  ['serum', 7796377, 'dropper bottle w/ leaf'],

  ['jar', 6963149, 'cream jar top view, white'],
  ['jar', 5911997, 'open jar, wooden lid'],
  ['jar', 8015480, 'white containers, white bg'],
  ['jar', 8490121, 'jar on wood w/ leaves'],

  ['model', 6707140, 'hand applying cream, beige bg'],
  ['model', 3762874, 'young woman applying moisturiser'],
  ['model', 6543616, 'woman applying facial cream'],
  ['model', 6543612, 'close-up woman applying cream'],
  ['model', 7010902, 'woman in headband, skincare'],
  ['model', 6475982, 'smiling woman applying cream'],

  ['rose', 37646136, 'red rose on white'],
  ['rose', 13977740, 'red rose w/ leaves, white'],
  ['rose', 11882660, 'single red rose, white'],
  ['rose', 6616436, 'red rose long stem, white'],

  ['leaf', 4131785, 'green leaf, white bg'],
  ['leaf', 4131781, 'long green leaf, white bg'],
  ['leaf', 4098469, 'boldo leaf isolated'],
  ['leaf', 37215213, 'curry leaf branch, white'],
  ['leaf', 36881511, 'monstera leaf'],
  ['leaf', 691043, 'fern leaf'],
];

const url = (id, w) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

async function download(id, w = 900) {
  const res = await fetch(url(id, w), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; site-build/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

await mkdir(cache, { recursive: true });

const ok = [];
const failed = [];

for (const [group, id, note] of CANDIDATES) {
  const file = join(cache, `${group}-${id}.jpg`);
  try {
    const buf = await download(id);
    await writeFile(file, buf);
    const meta = await sharp(buf).metadata();
    ok.push({ group, id, note, file, w: meta.width, h: meta.height });
  } catch (err) {
    failed.push({ group, id, note, err: String(err.message) });
  }
}

console.log(`downloaded ${ok.length}/${CANDIDATES.length}`);
for (const f of failed) console.log(`  FAILED ${f.group}-${f.id}: ${f.err}`);

/* ── Contact sheet ───────────────────────────────────────────────────────── */

const COLS = 6;
const CELL = 260;
const LABEL = 30;
const rows = Math.ceil(ok.length / COLS);

const tiles = await Promise.all(
  ok.map(async (item, i) => ({
    input: await sharp(item.file)
      .resize(CELL, CELL, { fit: 'cover' })
      .toBuffer(),
    left: (i % COLS) * CELL,
    top: Math.floor(i / COLS) * (CELL + LABEL),
  })),
);

const labels = ok
  .map((item, i) => {
    const x = (i % COLS) * CELL + 6;
    const y = Math.floor(i / COLS) * (CELL + LABEL) + CELL + 20;
    return `<text x="${x}" y="${y}" font-family="monospace" font-size="15" fill="#111">${i + 1}. ${item.group}-${item.id}</text>`;
  })
  .join('');

const sheetW = COLS * CELL;
const sheetH = rows * (CELL + LABEL);

await sharp({
  create: {
    width: sheetW,
    height: sheetH,
    channels: 3,
    background: { r: 245, g: 245, b: 245 },
  },
})
  .composite([
    ...tiles,
    {
      input: Buffer.from(
        `<svg width="${sheetW}" height="${sheetH}">${labels}</svg>`,
      ),
      top: 0,
      left: 0,
    },
  ])
  .jpeg({ quality: 82 })
  .toFile(join(cache, 'contact-sheet.jpg'));

console.log('contact sheet ->', join(cache, 'contact-sheet.jpg'));
console.log(ok.map((o, i) => `${i + 1}. ${o.group}-${o.id}  ${o.w}x${o.h}  ${o.note}`).join('\n'));
