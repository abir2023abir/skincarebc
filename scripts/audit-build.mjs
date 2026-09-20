/**
 * Reports what the production build actually ships.
 *
 *   node scripts/audit-build.mjs
 *
 * Splits JavaScript into "initial" (what a first paint pays for) and "on
 * demand" (chunks behind a dynamic import), because the budget in the brief is
 * about the former. Exits non-zero if the initial JS budget is blown.
 */

import { gzipSync, brotliCompressSync } from 'node:zlib';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/** KB gzipped, to one decimal. */
const kb = (buf) => Math.round((buf.length / 1024) * 10) / 10;

const INITIAL_JS_BUDGET_KB = 90;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const files = await walk(dist);

const html = await readFile(join(dist, 'index.html'), 'utf8');

/** A chunk is "initial" if index.html references it in a <script src> or modulepreload. */
function isInitial(name) {
  return (
    html.includes(`src="/_a/${name}"`) ||
    html.includes(`href="/_a/${name}"`)
  );
}

const rows = { initialJs: [], lazyJs: [], css: [], fonts: [], images: [], other: [] };

for (const file of files) {
  const rel = relative(dist, file).replace(/\\/g, '/');
  const name = rel.split('/').pop();
  const ext = extname(file).toLowerCase();
  const raw = await readFile(file);
  const entry = { rel, raw: kb(raw), gzip: kb(gzipSync(raw)), brotli: kb(brotliCompressSync(raw)) };

  if (ext === '.js') (isInitial(name) ? rows.initialJs : rows.lazyJs).push(entry);
  else if (ext === '.css') rows.css.push(entry);
  else if (ext === '.woff2') rows.fonts.push(entry);
  else if (['.webp', '.avif', '.png', '.jpg', '.jpeg', '.svg'].includes(ext)) rows.images.push(entry);
  else rows.other.push(entry);
}

const sum = (list, key = 'gzip') =>
  Math.round(list.reduce((t, r) => t + r[key], 0) * 10) / 10;

function table(title, list, { detail = true } = {}) {
  if (list.length === 0) return;
  list.sort((a, b) => b.gzip - a.gzip);
  console.log(`\n${title}  —  ${list.length} file(s), ${sum(list)} KB gzip`);
  if (!detail) return;
  for (const r of list.slice(0, 12)) {
    console.log(`   ${String(r.gzip).padStart(7)} KB gz  ${String(r.raw).padStart(7)} KB raw   ${r.rel}`);
  }
  if (list.length > 12) console.log(`   … and ${list.length - 12} more`);
}

const htmlBuf = Buffer.from(html);
console.log('PRODUCTION BUILD AUDIT');
console.log('='.repeat(72));
console.log(`\nindex.html  —  ${kb(gzipSync(htmlBuf))} KB gzip (${kb(htmlBuf)} KB raw)`);

table('Initial JavaScript', rows.initialJs);
table('On-demand JavaScript (dynamic imports)', rows.lazyJs);
table('CSS', rows.css);
table('Fonts (self-hosted, subset)', rows.fonts);
table('Images', rows.images, { detail: false });

const initial = sum(rows.initialJs);
const critical = Math.round((initial + sum(rows.css) + kb(gzipSync(htmlBuf))) * 10) / 10;

console.log('\n' + '='.repeat(72));
console.log(`Initial JS          ${initial} KB gzip   (budget ${INITIAL_JS_BUDGET_KB} KB)`);
console.log(`On-demand JS        ${sum(rows.lazyJs)} KB gzip`);
console.log(`Critical path       ${critical} KB gzip  (html + css + initial js)`);
console.log(`Total images        ${sum(rows.images)} KB gzip across ${rows.images.length} files`);

if (initial > INITIAL_JS_BUDGET_KB) {
  console.error(`\nFAIL: initial JS is over budget by ${Math.round((initial - INITIAL_JS_BUDGET_KB) * 10) / 10} KB.`);
  process.exit(1);
}
console.log('\nPASS: initial JavaScript is within budget.');
