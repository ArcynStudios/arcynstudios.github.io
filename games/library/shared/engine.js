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

/** Best-time variant (lower is better) — used by timed puzzles. */
export function bestTime(gameId, seconds) {
  const key = `arcyn-besttime-${gameId}`;
  const prev = Number(localStorage.getItem(key) || 0);
  if (!prev || seconds < prev) {
    try {
      localStorage.setItem(key, String(seconds));
    } catch {
      /* localStorage unavailable */
    }
    return { best: seconds, isNewBest: true };
  }
  return { best: prev, isNewBest: false };
}

/** Win/loss/draw tallies, namespaced per game — for turn-based and versus games. */
export function recordResult(gameId, result) {
  const key = `arcyn-stats-${gameId}`;
  let stats = { wins: 0, losses: 0, draws: 0 };
  try {
    stats = { ...stats, ...JSON.parse(localStorage.getItem(key) || '{}') };
  } catch {
    /* corrupt or unavailable — start fresh */
  }
  const field = result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws';
  stats[field] += 1;
  try {
    localStorage.setItem(key, JSON.stringify(stats));
  } catch {
    /* localStorage unavailable — stats just won't persist */
  }
  return stats;
}

export function getStats(gameId) {
  try {
    return { wins: 0, losses: 0, draws: 0, ...JSON.parse(localStorage.getItem(`arcyn-stats-${gameId}`) || '{}') };
  } catch {
    return { wins: 0, losses: 0, draws: 0 };
  }
}

/**
 * Minimal synthesized sound kit — WebAudio oscillator "beeps" rather than
 * audio files, so every game gets real (if simple) SFX with zero asset
 * weight and zero licensing surface. Muted state persists across games.
 */
const MUTE_KEY = 'arcyn-sfx-muted';
let audioCtx = null;
let muted = localStorage.getItem(MUTE_KEY) === 'true';

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, duration = 0.12, type = 'sine', gain = 0.15, delay = 0) {
  if (muted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g).connect(ctx.destination);
  const t = ctx.currentTime + delay;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export const sfx = {
  click: () => tone(440, 0.06, 'triangle', 0.12),
  move: () => tone(330, 0.08, 'sine', 0.12),
  place: () => tone(520, 0.07, 'square', 0.08),
  pop: () => tone(660, 0.09, 'sine', 0.15),
  merge: () => tone(880, 0.12, 'triangle', 0.15),
  invalid: () => tone(160, 0.14, 'sawtooth', 0.1),
  win: () => {
    tone(523, 0.12, 'triangle', 0.15, 0);
    tone(659, 0.12, 'triangle', 0.15, 0.12);
    tone(784, 0.2, 'triangle', 0.18, 0.24);
  },
  lose: () => {
    tone(300, 0.2, 'sawtooth', 0.12, 0);
    tone(200, 0.32, 'sawtooth', 0.12, 0.15);
  },
  tick: () => tone(880, 0.03, 'square', 0.05)
};

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    /* localStorage unavailable */
  }
  return muted;
}
