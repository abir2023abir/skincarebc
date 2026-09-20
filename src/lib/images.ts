/**
 * Resolves image paths to real, optimisable assets.
 *
 * site.ts stores a stable, readable path ("/products/vitamin-c-glow-serum.png").
 * The actual files live in src/assets/ so Astro's pipeline can emit AVIF/WebP
 * and a srcset for them — anything in public/ is served byte-for-byte and would
 * blow the LCP budget. This module is the bridge between the two.
 *
 * Build-time only: import.meta.glob is resolved by Vite, so nothing here ever
 * reaches the browser.
 */

import type { ImageMetadata } from 'astro';

type Module = { default: ImageMetadata };

const products = import.meta.glob<Module>('../assets/products/*.{png,jpg}', { eager: true });
const scenes = import.meta.glob<Module>('../assets/scenes/*.{png,jpg}', { eager: true });
const botanical = import.meta.glob<Module>('../assets/botanical/*.{png,jpg}', { eager: true });

function lookup(files: Record<string, Module>, path: string, kind: string): ImageMetadata {
  const file = path.split('/').pop();
  const key = Object.keys(files).find((k) => k.endsWith(`/${file}`));

  if (!key) {
    const available = Object.keys(files)
      .map((k) => k.split('/').pop())
      .join(', ');
    throw new Error(
      `Missing ${kind} image "${path}" (looked for src/assets/${kind}/${file}).\n` +
        `Available: ${available || '(none — run "npm run placeholders")'}`,
    );
  }

  return files[key]!.default;
}

/** @param path the `image` field from a product in site.ts */
export function productImage(path: string): ImageMetadata {
  return lookup(products, path, 'products');
}

/** @param file bare filename, e.g. "model-hero.png" */
export function sceneImage(file: string): ImageMetadata {
  return lookup(scenes, file, 'scenes');
}

/** @param file bare filename, e.g. "rose.png" */
export function botanicalImage(file: string): ImageMetadata {
  return lookup(botanical, file, 'botanical');
}
