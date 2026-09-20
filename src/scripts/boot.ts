/**
 * The only script on the critical path.
 *
 * Everything expensive is deferred behind a dynamic import and a real trigger:
 *   • checkout   — first "Order Now" press
 *   • hero tilt  — first pointer move over the hero, or a device with a gyro
 *   • GSAP       — after load + idle, and only when motion is wanted and the
 *                  connection can afford it
 *   • Meta Pixel — after load, and only when an ID is configured
 *
 * No scroll listeners anywhere: one IntersectionObserver drives the sticky
 * header and the mobile order bar, a second drives the reveals.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Slow or metered connection: skip everything optional. */
function connectionIsCheap(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (!c) return true;
  if (c.saveData) return false;
  return c.effectiveType !== 'slow-2g' && c.effectiveType !== '2g' && c.effectiveType !== '3g';
}

const idle: (cb: () => void) => void =
  'requestIdleCallback' in window
    ? (cb) => window.requestIdleCallback(cb, { timeout: 2500 })
    : (cb) => window.setTimeout(cb, 1200);

/* ── Header + mobile order bar ───────────────────────────────────────────── */

function initChrome(): void {
  const sentinel = document.querySelector('[data-header-sentinel]');
  const header = document.querySelector<HTMLElement>('[data-header]');
  const bar = document.querySelector<HTMLElement>('[data-mobile-bar]');
  if (!sentinel) return;

  new IntersectionObserver(
    ([entry]) => {
      const past = !entry?.isIntersecting;
      header?.toggleAttribute('data-stuck', past);
      bar?.toggleAttribute('data-visible', past);
    },
    // Fires once the sentinel has passed roughly a hero's worth of scroll.
    { rootMargin: '-140px 0px 0px 0px' },
  ).observe(sentinel);
}

/* ── Scroll reveals ──────────────────────────────────────────────────────── */

function initReveals(): void {
  if (prefersReducedMotion.matches) return;

  const targets = document.querySelectorAll<HTMLElement>(
    '.panel, .pcard, .scard, .step, .rcard, .combo, .story, .feat',
  );
  if (targets.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-revealed', '');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );

  targets.forEach((el, i) => {
    // Applied here rather than in the markup: if this script never runs, the
    // content is simply visible instead of stuck at opacity 0.
    el.setAttribute('data-reveal', '');
    el.style.setProperty('--reveal-delay', `${Math.min(i % 4, 3) * 70}ms`);
    observer.observe(el);
  });
}

/* ── Checkout (lazy) ─────────────────────────────────────────────────────── */

let checkoutReady: Promise<typeof import('./checkout/index')> | null = null;

function loadCheckout() {
  checkoutReady ??= import('./checkout/index').then((mod) => {
    mod.initCheckout();
    return mod;
  });
  return checkoutReady;
}

function initCheckoutTriggers(): void {
  document.addEventListener('click', (event) => {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-order-open]');
    if (!trigger) return;
    event.preventDefault();
    const itemId = trigger.dataset.orderOpen || undefined;
    void loadCheckout().then((mod) => mod.openCheckout(itemId, trigger));
  });

  // Warm the chunk as soon as a pointer approaches a trigger, so the sheet is
  // instant on the actual press. Idempotent and only ever runs once.
  const warm = () => void loadCheckout();
  document.addEventListener(
    'pointerover',
    (event) => {
      if ((event.target as HTMLElement).closest('[data-order-open]')) warm();
    },
    { once: true, passive: true },
  );
}

/* ── Hero tilt (lazy) ────────────────────────────────────────────────────── */

function initHeroTilt(): void {
  if (prefersReducedMotion.matches) return;
  const stage = document.querySelector<HTMLElement>('[data-hero-stage]');
  if (!stage) return;

  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    void import('./motion/hero-tilt').then((mod) => mod.initHeroTilt(stage));
  };

  // Desktop: on first pointer move near the hero. Touch: the gyroscope path
  // inside the module handles it, so load once the page settles.
  stage.addEventListener('pointermove', load, { once: true, passive: true });
  if (window.matchMedia('(hover: none)').matches) idle(load);
}

/* ── Magnetic buttons ────────────────────────────────────────────────────── */

function initMagnetic(): void {
  if (prefersReducedMotion.matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const buttons = document.querySelectorAll<HTMLElement>('[data-magnetic]');
  if (buttons.length === 0) return;

  for (const button of buttons) {
    let frame = 0;

    const move = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = button.getBoundingClientRect();
        // Pull is capped so the control never wanders off its own hit area.
        const x = ((event.clientX - box.left) / box.width - 0.5) * 10;
        const y = ((event.clientY - box.top) / box.height - 0.5) * 8;
        button.style.setProperty('--mx', `${x.toFixed(2)}px`);
        button.style.setProperty('--my', `${y.toFixed(2)}px`);
      });
    };

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      button.style.setProperty('--mx', '0px');
      button.style.setProperty('--my', '0px');
    };

    button.addEventListener('pointermove', move, { passive: true });
    button.addEventListener('pointerleave', reset, { passive: true });
    button.addEventListener('blur', reset);
  }
}

/* ── Scroll motion (lazy, gated) ─────────────────────────────────────────── */

function initScrollMotion(): void {
  if (prefersReducedMotion.matches) return;
  if (!connectionIsCheap()) return;
  if (!document.querySelector('[data-story]')) return;

  idle(() => {
    void import('./motion/scroll').then((mod) => mod.initScrollMotion());
  });
}

/* ── Analytics (lazy, opt-in) ────────────────────────────────────────────── */

function initAnalytics(): void {
  const pixelId = document.documentElement.dataset.pixel ?? '';
  if (!pixelId) return;

  idle(() => {
    void import('./analytics/pixel').then((mod) => {
      mod.initPixel(pixelId);
      mod.observeProductViews();
    });
  });
}

/* ── Go ──────────────────────────────────────────────────────────────────── */

initChrome();
initReveals();
initCheckoutTriggers();
initHeroTilt();
initMagnetic();
initScrollMotion();

if (document.readyState === 'complete') initAnalytics();
else window.addEventListener('load', initAnalytics, { once: true });
