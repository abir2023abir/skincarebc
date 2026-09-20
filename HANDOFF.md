# HANDOFF — remaining work

Continuation brief for the Aurora skincare landing page.
Read this file first, then `README.md` for how the project is wired.

---

## 0. Project context

- **Astro 7, static output only.** `npm run build` → plain `dist/`. No SSR, no adapter.
- **Tailwind 4** via `@tailwindcss/vite`. Design tokens in `src/styles/tokens.css`.
- **TypeScript everywhere.** `npm run check` must stay at 0 errors.
- **Vanilla TS islands, no React.** Initial JS is ~1.9 KB gzip; keep it small.
- **Bangla is the primary copy language.** Product and ingredient names stay English.
- `src/config/site.ts` is the single source of truth — no component hard-codes a
  price, number or product name.

**Verify with:** `npm run verify` (check → test → build → audit).

---

## 1. Current state

### Completed and verified (exit 0, all green)

- Full page: hero, intro + 3 promises, best sellers, For Her / For Him split,
  brand promise, filtered showcase, per-product story rows, ingredient explorer,
  routine builder, combos, reviews, how-to-order, FAQ, closing CTA, footer,
  mobile order bar.
- **Cart system** — `[data-order-open]` adds to cart + toast; header bag badge; cart
  view with qty steppers and remove; localStorage persistence (key `skincare.cart.v1`).
- **Cart checkout** — cart → form view → WhatsApp hand-off → success view; read-only
  cart summary replaces the old product select.
- **Payment methods** — bKash Send Money and Cash on Delivery (COD), radio group;
  controlled by `site.paymentMethods.{cod, bkash}`; WhatsApp message adapts.
- **WhatsApp FAB** — fixed bottom-right, hidden < 48rem (MobileOrderBar already has WA link).
- **Admin panel** — static `/admin` route, design-only, dummy data, noindex, sidebar, 4 sections.
- Hero promo card converted from cut-out CSS to framed `object-fit: cover` photo.
- `.stock/` added to `.gitignore`.
- Motion: hero 2.5D tilt + GSAP ScrollTrigger, both lazy.
- Lighthouse mobile **99 / 100 / 100 / 100**, LCP 1.9s, CLS 0, TBT 0ms.
- **30 Vitest tests** passing (was 24 — added computeCartTotals × 4, COD message × 2, paymentMethod validate × 1 — but count: validate 8, buildOrderMessage 8, pricing 14 = 30).
- `astro check` clean (0 errors).
- Initial JS **1.9 KB gzip** (budget 90 KB); checkout chunk 4.8 KB gzip.

---

## 2. Remaining work

### 2.1 Deployment — Vercel

The client wants this on **Vercel** (said as "Barcel").

- **Ask before deploying.** Do not deploy unprompted.
- The project is static; no adapter is needed. Vercel settings:
  - Build command `npm run build`
  - Output directory `dist`
  - Node 22.12+
- Set the real production origin in `astro.config.mjs` (`const SITE = ...`)
  before the first deploy — it drives the canonical link, OG URLs and the
  sitemap.
- Regenerate `public/og.jpg` (still says `BRAND_NAME`) before deploy — see
  `scripts/gen-placeholders.mjs`.

---

## 3. Constraints to preserve

These were hard requirements and are currently met. Do not regress them.

| Constraint | Current |
| --- | --- |
| Lighthouse mobile ≥ 95 on all four categories | 99 / 100 / 100 / 100 |
| LCP < 2.0s, CLS < 0.05 | 1.9s, 0 |
| Initial JS < 90 KB gzip | 1.9 KB |
| No horizontal scroll at 360/390/768/1280/1920 | verified |
| All tap targets ≥ 44px | enforced in CSS |
| WCAG AA contrast | `node scripts/contrast.mjs` gates it |
| `astro check` clean | 0 errors |

Three non-obvious things that will bite if you undo them:

1. **`.rail { contain: paint }` in `global.css` is load-bearing.** A scroll
   container propagates its scrollable overflow into the document even when it
   clips its own content; without containment the review rail made the whole
   page scroll ~500px sideways. `overflow`/`clip` on the rail or an ancestor
   does not fix it.
2. **The header sentinel must keep a real height** (150px, absolutely
   positioned, in `Header.astro`). A zero-height element at y=0 never
   intersects, and the header comes up permanently stuck.
3. **The client bundle must never import `src/config/site.ts`.** It would drag
   the whole Bangla catalogue into the browser. Prices reach the client through
   the `#checkout-data` JSON island (which also carries `paymentMethods`), and
   the 64 districts are read back off the rendered `<select>`.

Also: the interactive orange is `#C24D10`, not the reference's `#F2701E` —
the latter is 2.95:1 behind white text and fails AA. `--color-orange-bright`
keeps the vivid hue for decorative fills that carry no text. And the bKash and
WhatsApp marks are deliberately custom glyphs, not the trademarks.

---

## 4. Key files added / changed this session

| File | What changed |
|---|---|
| `src/scripts/checkout/cart.ts` | NEW — CartStore (localStorage, add/remove/setQty) |
| `src/lib/pricing.ts` | Added `computeCartTotals`, `CartLine` |
| `src/lib/buildOrderMessage.ts` | Added `paymentMethod` + COD block |
| `src/lib/validate.ts` | Added `paymentMethod` to `OrderDraft` + `KnownValues` |
| `src/config/site.ts` | Added `paymentMethods: { cod, bkash }` |
| `src/scripts/checkout/index.ts` | Full cart flow (cart→form→done), payment method, toast |
| `src/scripts/boot.ts` | Add-to-cart triggers + bag-open listener |
| `src/components/checkout/CheckoutSheet.astro` | Cart view + payment radio group + COD card |
| `src/components/layout/Header.astro` | Cart count badge + `data-bag-open` |
| `src/components/layout/WhatsAppFab.astro` | NEW — fixed WA button |
| `src/components/layout/BaseLayout.astro` | Imports WhatsAppFab |
| `src/pages/admin/index.astro` | NEW — design-only admin panel |
| `src/components/sections/Hero.astro` | Promo card: cut-out → framed photo |
| `.gitignore` | Added `.stock/` |
| `src/test/buildOrderMessage.test.ts` | COD tests + `paymentMethod` on base fixture |
| `src/test/pricing.test.ts` | `computeCartTotals` test suite |
| `src/test/validate.test.ts` | `paymentMethods` in KnownValues + paymentMethod test |
