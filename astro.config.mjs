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
      // Editorial display serif — English headlines, numerals, wordmark.
      provider: fontProviders.google(),
      name: 'Instrument Serif',
      cssVariable: '--ff-display',
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
    },
    {
      // Clean grotesk — UI, body, English product/ingredient names.
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--ff-ui',
      weights: [400, 600],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
    {
      // Bangla — primary copy language. Bengali subset only, so Latin
      // characters fall through to Inter in the same stack.
      provider: fontProviders.google(),
      name: 'Hind Siliguri',
      cssVariable: '--ff-bn',
      weights: [400, 600],
      styles: ['normal'],
      subsets: ['bengali'],
      display: 'swap',
      fallbacks: ['Nirmala UI', 'Vrinda', 'sans-serif'],
    },
  ],
});
