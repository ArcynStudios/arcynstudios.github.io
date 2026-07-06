/**
 * Arcyn Studios — shared mini-engine for embedded games.
 * Deliberately tiny (no dependencies): canvas auto-sizing, a keyboard
 * state map, a fixed-step-ish RAF loop, and a couple of DOM helpers so
 * every game doesn't reinvent the same 40 lines.
 */

/** Resizes a canvas' backing store to match its CSS box at devicePixelRatio, keeping drawing crisp on retina screens. */
export function fitCanvas(canvas, aspectRatio) {
  const resize = () => {
    const parent = canvas.parentElement;
    const maxW = parent.clientWidth;
    const maxH = parent.clientHeight;
    let w = maxW;
    let h = w / aspectRatio;
    if (h > maxH) {
      h = maxH;
      w = h * aspectRatio;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
  return () => window.removeEventListener('resize', resize);
}

/** Tracks currently-held keys by code, e.g. keys.has('ArrowLeft'). */
export function createKeyState() {
  const keys = new Set();
  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  return keys;
}

/** requestAnimationFrame loop that pauses cleanly when the tab/iframe isn't visible. */
export function createLoop(update) {
  let last = null;
  let running = true;
  let frame = null;

  function tick(now) {
    if (!running) return;
    if (last === null) last = now;
    const dt = Math.min((now - last) / 1000, 1 / 30); // clamp so a stalled tab doesn't jump physics forward
    last = now;
    update(dt);
    frame = requestAnimationFrame(tick);
  }

  frame = requestAnimationFrame(tick);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      last = null;
      if (frame) cancelAnimationFrame(frame);
    } else if (!running) {
      running = true;
      frame = requestAnimationFrame(tick);
    }
  });

  return {
    stop() {
      running = false;
      if (frame) cancelAnimationFrame(frame);
    }
  };
}

/** Binds a press-and-hold virtual button (mouse + touch) to set/unset a key in the given key state set. */
export function bindTouchButton(el, keys, code) {
  if (!el) return;
  const press = (e) => {
    e.preventDefault();
    keys.add(code);
  };
  const release = (e) => {
    e.preventDefault();
    keys.delete(code);
  };
  el.addEventListener('pointerdown', press);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointerleave', release);
  el.addEventListener('pointercancel', release);
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}

/** Simple AABB overlap test — used by nearly every game here. */
export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

/** Tiny localStorage-backed best-score helper, namespaced per game. */
export function bestScore(gameId, score) {
  const key = `arcyn-best-${gameId}`;
  const prev = Number(localStorage.getItem(key) || 0);
  if (score > prev) {
    try {
      localStorage.setItem(key, String(score));
    } catch {
      /* localStorage unavailable — best score just won't persist */
    }
    return { best: score, isNewBest: true };
  }
  return { best: prev, isNewBest: false };
}
