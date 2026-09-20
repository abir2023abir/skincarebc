// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// NOTE: replace with the real production origin before deploying.
// It is only used for <link rel="canonical">, Open Graph URLs and the sitemap.
const SITE = 'https://skincare-bd.pages.dev';

export default defineConfig({
  site: SITE,
  output: 'static',
  compressHTML: true,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  image: {
    responsiveStyles: true,
    layout: 'constrained',
  },
  build: {
    inlineStylesheets: 'auto',
    assets: '_a',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: false,
    },
  },
  fonts: [
    {
      // Latin display + UI. The reference's headlines are a very heavy
      // geometric sans; Poppins 800 is the closest widely-available match.
      // 500 covers body, labels and nav.
      provider: fontProviders.google(),
      name: 'Poppins',
      cssVariable: '--ff-display',
      weights: [500, 800],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
    {
      // Bangla — primary copy language. Bengali subset only, so Latin
      // characters fall through to Poppins in the same stack.
      // Two weights only: the Bengali subset is ~40 KB per weight.
      provider: fontProviders.google(),
      name: 'Hind Siliguri',
      cssVariable: '--ff-bn',
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['bengali'],
      display: 'swap',
      fallbacks: ['Nirmala UI', 'Vrinda', 'sans-serif'],
    },
  ],
});
