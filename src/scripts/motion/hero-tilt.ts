/**
 * 2.5D tilt for the hero product card.
 *
 * Writes two custom properties (--tx / --ty) on the stage; every depth layer
 * multiplies them by its own --depth in CSS. That means one rAF write per
 * frame regardless of how many layers there are, and the compositor does the
 * rest — no per-element JavaScript, no layout reads in the loop.
 */

const MAX = 18;

export function initHeroTilt(stage: HTMLElement): void {
  let frame = 0;
  let box: DOMRect | null = null;

  const write = (tx: number, ty: number) => {
    stage.style.setProperty('--tx', tx.toFixed(2));
    stage.style.setProperty('--ty', ty.toFixed(2));
  };

  /* ── Pointer ─────────────────────────────────────────────────────────── */

  const onMove = (event: PointerEvent) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      // Measured once per gesture, refreshed on resize/scroll-out rather than
      // every frame, so the loop never forces a layout.
      box ??= stage.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width - 0.5) * 2;
      const y = ((event.clientY - box.top) / box.height - 0.5) * 2;
      stage.setAttribute('data-live', '');
      write(x * MAX, y * MAX);
    });
  };

  const onLeave = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    box = null;
    stage.removeAttribute('data-live');
    write(0, 0);
  };

  stage.addEventListener('pointermove', onMove, { passive: true });
  stage.addEventListener('pointerleave', onLeave, { passive: true });
  window.addEventListener('resize', () => (box = null), { passive: true });

  /* ── Gyroscope ───────────────────────────────────────────────────────────
     Android phones expose deviceorientation without a permission prompt; iOS
     requires a user gesture to request it, which is not worth interrupting a
     purchase for, so iOS simply keeps the resting pose. */

  if (window.matchMedia('(hover: none)').matches && 'DeviceOrientationEvent' in window) {
    let gyroFrame = 0;

    window.addEventListener(
      'deviceorientation',
      (event) => {
        if (event.beta === null || event.gamma === null) return;
        if (gyroFrame) return;
        gyroFrame = requestAnimationFrame(() => {
          gyroFrame = 0;
          // beta is front/back (-180..180), gamma is left/right (-90..90).
          // Clamped hard: a phone held at an angle should not peg the tilt.
          const x = Math.max(-1, Math.min(1, (event.gamma ?? 0) / 35));
          const y = Math.max(-1, Math.min(1, ((event.beta ?? 45) - 45) / 35));
          write(x * MAX * 0.7, y * MAX * 0.7);
        });
      },
      { passive: true },
    );
  }
}
