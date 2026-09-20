/**
 * Meta Pixel, loaded only when a pixel ID is configured and only after the page
 * is interactive. If `facebookPixelId` is empty in site.ts, nothing here ever
 * touches the network and no third-party script is added to the page.
 */

type FbqFn = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
  callMethod?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

let ready = false;

/** Fire a standard event. No-ops entirely when the pixel is disabled. */
export function track(event: string, params?: Record<string, unknown>): void {
  if (!ready || typeof window.fbq !== 'function') return;
  window.fbq('track', event, params);
}

export function initPixel(pixelId: string): void {
  if (!pixelId || ready) return;

  /* Standard Meta bootstrap: a queueing stub so events fired before the remote
     script arrives are replayed, then the script itself, async. */
  const stub: FbqFn = function (...args: unknown[]) {
    if (stub.callMethod) stub.callMethod(...args);
    else (stub.queue ??= []).push(args);
  };
  stub.queue = [];
  stub.loaded = true;
  stub.version = '2.0';
  stub.push = stub;

  window.fbq ??= stub;
  window._fbq ??= window.fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.append(script);

  ready = true;
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

/**
 * One ViewContent per product, the first time its section is seen.
 * Uses the same observer pattern as the reveals — no scroll listener.
 */
export function observeProductViews(): void {
  if (!ready) return;

  const targets = document.querySelectorAll<HTMLElement>('[data-story]');
  if (targets.length === 0) return;

  const seen = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = (entry.target as HTMLElement).id.replace(/^story-/, '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        track('ViewContent', { content_ids: [id], content_type: 'product' });
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.4 },
  );

  targets.forEach((t) => observer.observe(t));
}
