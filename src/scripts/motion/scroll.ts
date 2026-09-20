/**
 * Scroll-driven product moments (GSAP + ScrollTrigger).
 *
 * This is the only heavy chunk on the site (~35 KB gzipped) and it is loaded
 * on idle, after first paint, and only when the visitor wants motion and the
 * connection can afford it — see boot.ts.
 *
 * It writes one custom property per row (--p, 0→1). The bottle's rotation,
 * scale and lift are expressed in CSS against --p, so GSAP never touches a
 * transform directly and the resting pose (--p: 0) is already correct before
 * this file loads, or if it never does.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initScrollMotion(): void {
  gsap.registerPlugin(ScrollTrigger);

  const rows = document.querySelectorAll<HTMLElement>('[data-story]');

  for (const row of rows) {
    const bottle = row.querySelector<HTMLElement>('[data-story-bottle]');
    const items = row.querySelectorAll<HTMLElement>('[data-story-item]');

    /* Drive --p across the row's travel through the viewport. */
    if (bottle) {
      gsap.to(bottle, {
        '--p': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: row,
          start: 'top 85%',
          end: 'bottom 15%',
          scrub: 0.6,
        },
      });
    }

    /* Stagger the detail blocks in once the row is genuinely on screen. */
    if (items.length > 0) {
      gsap.from(items, {
        opacity: 0,
        y: 18,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.07,
        scrollTrigger: {
          trigger: row,
          start: 'top 70%',
          once: true,
        },
      });
    }
  }

  /* Late-loading images change section heights; recompute once they settle. */
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
