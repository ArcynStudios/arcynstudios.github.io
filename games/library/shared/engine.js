/**
 * Arcyn Studios — Premium Shared Game Engine
 * Features: Canvas auto-sizing, input handling, game loop, particles, audio, UI components, effects
 */

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

export function createKeyState() {
  const keys = new Set();
  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  return keys;
}

export function createTouchState(canvas) {
  const touches = { x: 0, y: 0, active: false };
  const rect = () => canvas.getBoundingClientRect();
  
  const update = (e) => {
    const r = rect();
    const t = e.touches[0] || e;
    touches.x = t.clientX - r.left;
    touches.y = t.clientY - r.top;
    touches.active = true;
  };
  
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); update(e); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); update(e); }, { passive: false });
  canvas.addEventListener('touchend', (e) => { touches.active = e.touches.length > 0; if (touches.active) update(e); });
  canvas.addEventListener('mousemove', (e) => update(e));
  canvas.addEventListener('mousedown', (e) => { touches.active = true; update(e); });
  canvas.addEventListener('mouseup', () => { touches.active = false; });
  canvas.addEventListener('mouseleave', () => { touches.active = false; });
  
  return touches;
}

export function createLoop(update) {
  let last = null;
  let running = true;
  let frame = null;

  function tick(now) {
    if (!running) return;
    if (last === null) last = now;
    const dt = Math.min((now - last) / 1000, 1 / 30);
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
    stop() { running = false; if (frame) cancelAnimationFrame(frame); },
    pause() { running = false; },
    resume() { running = true; last = null; frame = requestAnimationFrame(tick); }
  };
}

export function bindTouchButton(el, keys, code) {
  if (!el) return;
  const press = (e) => { e.preventDefault(); keys.add(code); };
  const release = (e) => { e.preventDefault(); keys.delete(code); };
  el.addEventListener('pointerdown', press);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointerleave', release);
  el.addEventListener('pointercancel', release);
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function bestScore(gameId, score) {
  const key = `arcyn-best-${gameId}`;
  const prev = Number(localStorage.getItem(key) || 0);
  if (score > prev) {
    try { localStorage.setItem(key, String(score)); } catch {}
    return { best: score, isNewBest: true };
  }
  return { best: prev, isNewBest: false };
}

export function bestTime(gameId, seconds) {
  const key = `arcyn-besttime-${gameId}`;
  const prev = Number(localStorage.getItem(key) || 0);
  if (!prev || seconds < prev) {
    try { localStorage.setItem(key, String(seconds)); } catch {}
    return { best: seconds, isNewBest: true };
  }
  return { best: prev, isNewBest: false };
}

export function recordResult(gameId, result) {
  const key = `arcyn-stats-${gameId}`;
  let stats = { wins: 0, losses: 0, draws: 0 };
  try { stats = { ...stats, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}
  const field = result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws';
  stats[field] += 1;
  try { localStorage.setItem(key, JSON.stringify(stats)); } catch {}
  return stats;
}

export function getStats(gameId) {
  try { return { wins: 0, losses: 0, draws: 0, ...JSON.parse(localStorage.getItem(`arcyn-stats-${gameId}`) || '{}') }; }
  catch { return { wins: 0, losses: 0, draws: 0 }; }
}

export function saveGameState(gameId, state) {
  try { localStorage.setItem(`arcyn-save-${gameId}`, JSON.stringify(state)); } catch {}
}

export function loadGameState(gameId) {
  try { return JSON.parse(localStorage.getItem(`arcyn-save-${gameId}`) || 'null'); } catch { return null; }
}

export function clearGameState(gameId) {
  try { localStorage.removeItem(`arcyn-save-${gameId}`); } catch {}
}

const MUTE_KEY = 'arcyn-sfx-muted';
let audioCtx = null;
let muted = localStorage.getItem(MUTE_KEY) === 'true';
let masterGain = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0.5;
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
  osc.connect(g).connect(masterGain);
  const t = ctx.currentTime + delay;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function noise(duration = 0.1, gain = 0.1, delay = 0) {
  if (muted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const g = ctx.createGain();
  source.buffer = buffer;
  source.connect(g).connect(masterGain);
  const t = ctx.currentTime + delay;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  source.start(t);
  source.stop(t + duration + 0.02);
}

export const sfx = {
  click: () => tone(440, 0.06, 'triangle', 0.12),
  move: () => tone(330, 0.08, 'sine', 0.12),
  place: () => tone(520, 0.07, 'square', 0.08),
  pop: () => tone(660, 0.09, 'sine', 0.15),
  merge: () => tone(880, 0.12, 'triangle', 0.15),
  invalid: () => tone(160, 0.14, 'sawtooth', 0.1),
  win: () => { tone(523, 0.12, 'triangle', 0.15, 0); tone(659, 0.12, 'triangle', 0.15, 0.12); tone(784, 0.2, 'triangle', 0.18, 0.24); },
  lose: () => { tone(300, 0.2, 'sawtooth', 0.12, 0); tone(200, 0.32, 'sawtooth', 0.12, 0.15); },
  tick: () => tone(880, 0.03, 'square', 0.05),
  jump: () => { tone(400, 0.08, 'sine', 0.15); tone(600, 0.06, 'sine', 0.1, 0.04); },
  dash: () => { tone(800, 0.05, 'square', 0.1); tone(1200, 0.05, 'square', 0.08, 0.03); },
  shield: () => { tone(600, 0.1, 'triangle', 0.15); tone(900, 0.08, 'triangle', 0.1, 0.05); },
  powerup: () => { tone(600, 0.1, 'triangle', 0.15); tone(800, 0.1, 'triangle', 0.15, 0.08); tone(1000, 0.15, 'triangle', 0.18, 0.16); },
  crystal: () => { tone(800, 0.08, 'sine', 0.15); tone(1200, 0.08, 'sine', 0.12, 0.04); tone(1600, 0.06, 'sine', 0.1, 0.08); },
  explosion: () => { noise(0.3, 0.15); tone(100, 0.3, 'sawtooth', 0.15); tone(80, 0.4, 'sawtooth', 0.1, 0.1); },
  laser: () => { tone(800, 0.05, 'square', 0.1); tone(1600, 0.03, 'square', 0.08, 0.02); },
  collect: () => { tone(523, 0.06, 'triangle', 0.12); tone(784, 0.06, 'triangle', 0.12, 0.04); tone(1047, 0.08, 'triangle', 0.15, 0.08); },
  combo: () => { tone(600, 0.08, 'triangle', 0.12); tone(800, 0.08, 'triangle', 0.12, 0.05); tone(1000, 0.1, 'triangle', 0.15, 0.1); },
  levelup: () => { tone(440, 0.1, 'triangle', 0.15); tone(554, 0.1, 'triangle', 0.15, 0.08); tone(659, 0.1, 'triangle', 0.15, 0.16); tone(880, 0.2, 'triangle', 0.2, 0.24); },
  pause: () => { tone(400, 0.1, 'sine', 0.1); tone(300, 0.1, 'sine', 0.1, 0.05); },
  resume: () => { tone(300, 0.1, 'sine', 0.1); tone(400, 0.1, 'sine', 0.1, 0.05); },
  countdown: () => tone(800, 0.08, 'square', 0.12),
  countdownFinal: () => tone(1200, 0.15, 'triangle', 0.18),
  ambient: null
};

export function playMusic(gameId, notes, tempo = 120, loop = true) {
  if (muted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  
  if (sfx.ambient) {
    sfx.ambient.stop();
    sfx.ambient = null;
  }
  
  let noteIndex = 0;
  let nextTime = ctx.currentTime + 0.1;
  const beatDuration = 60 / tempo;
  
  function scheduleNext() {
    if (muted) return;
    const note = notes[noteIndex % notes.length];
    const [freq, dur, type, gain] = note;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    osc.connect(g).connect(masterGain);
    g.gain.setValueAtTime(gain || 0.08, nextTime);
    g.gain.exponentialRampToValueAtTime(0.0001, nextTime + (dur * beatDuration) || beatDuration);
    osc.start(nextTime);
    osc.stop(nextTime + (dur * beatDuration) || beatDuration + 0.02);
    
    noteIndex++;
    nextTime += beatDuration;
    
    if (loop || noteIndex < notes.length) {
      sfx.ambient = setTimeout(scheduleNext, beatDuration * 900);
    }
  }
  
  scheduleNext();
}

export function stopMusic() {
  if (sfx.ambient) {
    clearTimeout(sfx.ambient);
    sfx.ambient = null;
  }
}

export function isMuted() { return muted; }

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, String(muted)); } catch {}
  if (muted) stopMusic();
  return muted;
}

export function setMasterVolume(vol) {
  if (masterGain) masterGain.gain.value = clamp(vol, 0, 1);
}

export function createParticleSystem() {
  const particles = [];
  
  function add(x, y, opts = {}) {
    particles.push({
      x, y,
      vx: opts.vx || rand(-1, 1),
      vy: opts.vy || rand(-1, 1),
      life: opts.life || 1,
      maxLife: opts.life || 1,
      size: opts.size || rand(2, 6),
      color: opts.color || '#fff',
      alpha: opts.alpha || 1,
      gravity: opts.gravity || 0,
      friction: opts.friction || 0.98,
      shrink: opts.shrink !== false,
      glow: opts.glow || false
    });
  }
  
  function burst(x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = opts.speed || rand(1, 4);
      add(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ...opts
      });
    }
  }
  
  function trail(x, y, opts = {}) {
    add(x, y, { vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), life: 0.5, size: 3, ...opts });
  }
  
  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += p.gravity * dt * 60;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  
  function draw(ctx) {
    for (const p of particles) {
      const alpha = p.alpha * (p.life / p.maxLife);
      const size = p.shrink ? p.size * (p.life / p.maxLife) : p.size;
      ctx.globalAlpha = alpha;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }
  
  function clear() { particles.length = 0; }
  
  return { add, burst, trail, update, draw, clear, get count() { return particles.length; } };
}

export function createTextParticles() {
  const particles = [];
  
  function add(x, y, text, opts = {}) {
    particles.push({
      x, y,
      text,
      vx: opts.vx || rand(-0.5, 0.5),
      vy: opts.vy || -1,
      life: opts.life || 1,
      maxLife: opts.life || 1,
      size: opts.size || 24,
      color: opts.color || '#fff',
      alpha: 1,
      scale: 1,
      glow: opts.glow || false
    });
  }
  
  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 0.01 * dt * 60;
      p.life -= dt;
      p.alpha = p.life / p.maxLife;
      p.scale = 1 + (1 - p.life / p.maxLife) * 0.5;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  
  function draw(ctx) {
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.font = `bold ${p.size * p.scale}px Sora, sans-serif`;
      ctx.fillStyle = p.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
      }
      ctx.fillText(p.text, p.x, p.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
  
  return { add, update, draw, clear: () => particles.length = 0 };
}

export function createScreenShake() {
  let intensity = 0;
  let decay = 0.9;
  
  function shake(amount = 5, d = 0.9) {
    intensity = amount;
    decay = d;
  }
  
  function update(dt) {
    intensity *= Math.pow(decay, dt * 60);
    if (intensity < 0.1) intensity = 0;
  }
  
  function apply(ctx) {
    if (intensity > 0) {
      ctx.translate(
        (Math.random() - 0.5) * intensity * 2,
        (Math.random() - 0.5) * intensity * 2
      );
    }
  }
  
  function getOffset() {
    if (intensity <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * intensity * 2,
      y: (Math.random() - 0.5) * intensity * 2
    };
  }
  
  return { shake, update, apply, getOffset, get intensity() { return intensity; } };
}

export function createGlowEffect() {
  const glows = [];
  
  function add(x, y, radius, color, life = 0.5) {
    glows.push({ x, y, radius, maxRadius: radius, color, life, maxLife: life });
  }
  
  function update(dt) {
    for (let i = glows.length - 1; i >= 0; i--) {
      const g = glows[i];
      g.life -= dt;
      g.radius = g.maxRadius * (g.life / g.maxLife);
      if (g.life <= 0) glows.splice(i, 1);
    }
  }
  
  function draw(ctx) {
    for (const g of glows) {
      const alpha = g.life / g.maxLife;
      const gradient = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      gradient.addColorStop(0, g.color.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba').replace('hsl', 'hsla'));
      gradient.addColorStop(1, g.color.replace(')', `, 0)`).replace('rgb', 'rgba').replace('hsl', 'hsla'));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.fillRect(g.x - g.radius, g.y - g.radius, g.radius * 2, g.radius * 2);
    }
    ctx.globalAlpha = 1;
  }
  
  return { add, update, draw, clear: () => glows.length = 0 };
}

export function createTrailEffect() {
  const points = [];
  const maxPoints = 30;
  
  function add(x, y, color = '#fff', width = 4) {
    points.push({ x, y, color, width, life: 1 });
    if (points.length > maxPoints) points.shift();
  }
  
  function update(dt) {
    for (let i = points.length - 1; i >= 0; i--) {
      points[i].life -= dt * 2;
      if (points[i].life <= 0) points.splice(i, 1);
    }
  }
  
  function draw(ctx) {
    if (points.length < 2) return;
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const alpha = Math.min(p1.life, p2.life);
      const width = lerp(p1.width, p2.width, i / points.length) * alpha;
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = p2.color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  
  return { add, update, draw, clear: () => points.length = 0 };
}

export function createRainEffect(canvas, opts = {}) {
  const drops = [];
  const count = opts.count || 100;
  const color = opts.color || 'rgba(100, 200, 255, 0.4)';
  const speed = opts.speed || 300;
  const width = canvas.width;
  const height = canvas.height;
  
  for (let i = 0; i < count; i++) {
    drops.push({
      x: rand(0, width),
      y: rand(0, height),
      length: rand(10, 30),
      speed: rand(speed * 0.5, speed * 1.5)
    });
  }
  
  function update(dt, w, h) {
    for (const d of drops) {
      d.y += d.speed * dt;
      d.x -= d.speed * 0.1 * dt;
      if (d.y > h + 20) {
        d.y = -20;
        d.x = rand(0, w);
      }
      if (d.x < -20) d.x = w + 20;
    }
  }
  
  function draw(ctx) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (const d of drops) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + 5, d.y + d.length);
      ctx.stroke();
    }
  }
  
  return { update, draw, resize: (w, h) => {} };
}

export function createLightningEffect(canvas) {
  const bolts = [];
  
  function strike(x, y, branches = 3) {
    const bolt = { x, y, life: 0.3, maxLife: 0.3, segments: [] };
    for (let b = 0; b < branches; b++) {
      const segs = [];
      let sx = x + rand(-50, 50);
      let sy = y;
      for (let i = 0; i < 8; i++) {
        segs.push({ x: sx, y: sy });
        sx += rand(-30, 30);
        sy += rand(40, 80);
      }
      bolt.segments.push(segs);
    }
    bolts.push(bolt);
  }
  
  function update(dt) {
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].life -= dt;
      if (bolts[i].life <= 0) bolts.splice(i, 1);
    }
  }
  
  function draw(ctx) {
    for (const bolt of bolts) {
      const alpha = bolt.life / bolt.maxLife;
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = '#88f';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#88f';
      ctx.shadowBlur = 10;
      for (const segs of bolt.segments) {
        ctx.beginPath();
        ctx.moveTo(segs[0].x, segs[0].y);
        for (let i = 1; i < segs.length; i++) {
          ctx.lineTo(segs[i].x, segs[i].y);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }
  
  return { strike, update, draw };
}

export function createUI() {
  const buttons = [];
  const panels = [];
  
  function createButton(x, y, w, h, label, onClick, opts = {}) {
    const btn = {
      x, y, w, h, label, onClick,
      hovered: false, pressed: false, enabled: true,
      color: opts.color || '#7c5cff',
      hoverColor: opts.hoverColor || '#9d7cff',
      pressColor: opts.pressColor || '#5a3fd6',
      textColor: opts.textColor || '#fff',
      font: opts.font || 'bold 16px Sora, sans-serif',
      radius: opts.radius || 12,
      glow: opts.glow !== false
    };
    buttons.push(btn);
    return btn;
  }
  
  function createPanel(x, y, w, h, opts = {}) {
    const panel = { x, y, w, h, visible: true, children: [],
      bgColor: opts.bgColor || 'rgba(10, 10, 20, 0.9)',
      borderColor: opts.borderColor || '#7c5cff',
      borderWidth: opts.borderWidth || 2,
      radius: opts.radius || 16,
      glow: opts.glow !== false
    };
    panels.push(panel);
    return panel;
  }
  
  function update(mouse, dt) {
    for (const btn of buttons) {
      if (!btn.enabled) continue;
      btn.hovered = mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
                    mouse.y >= btn.y && mouse.y <= btn.y + btn.h;
      if (btn.hovered && mouse.down && !btn.pressed) {
        btn.pressed = true;
      }
      if (btn.pressed && !mouse.down) {
        btn.pressed = false;
        if (btn.hovered && btn.onClick) btn.onClick();
      }
      if (!mouse.down) btn.pressed = false;
    }
  }
  
  function draw(ctx) {
    for (const panel of panels) {
      if (!panel.visible) continue;
      ctx.fillStyle = panel.bgColor;
      ctx.strokeStyle = panel.borderColor;
      ctx.lineWidth = panel.borderWidth;
      if (panel.glow) {
        ctx.shadowColor = panel.borderColor;
        ctx.shadowBlur = 20;
      }
      roundRect(ctx, panel.x, panel.y, panel.w, panel.h, panel.radius);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    for (const btn of buttons) {
      if (!btn.enabled) {
        ctx.globalAlpha = 0.4;
      }
      const color = btn.pressed ? btn.pressColor : btn.hovered ? btn.hoverColor : btn.color;
      ctx.fillStyle = color;
      ctx.strokeStyle = btn.glow ? btn.color : 'transparent';
      ctx.lineWidth = 3;
      if (btn.glow && (btn.hovered || btn.pressed)) {
        ctx.shadowColor = btn.color;
        ctx.shadowBlur = 15;
      }
      roundRect(ctx, btn.x, btn.y, btn.w, btn.h, btn.radius);
      ctx.fill();
      if (btn.glow) ctx.stroke();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = btn.textColor;
      ctx.font = btn.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = 1;
    }
  }
  
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  
  return { createButton, createPanel, update, draw, buttons, panels, clear: () => { buttons.length = 0; panels.length = 0; } };
}

export function createBackgroundLayers(canvas, theme = 'cyberpunk') {
  const layers = [];
  const stars = [];
  
  function init() {
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: rand(0, canvas.width),
        y: rand(0, canvas.height),
        size: rand(0.5, 2),
        speed: rand(0.1, 0.5),
        alpha: rand(0.3, 1),
        twinkle: rand(0, Math.PI * 2)
      });
    }
  }
  
  function addLayer(drawFn, speed = 1, opacity = 1) {
    layers.push({ draw: drawFn, speed, opacity });
  }
  
  function update(dt, scrollX = 0) {
    for (const star of stars) {
      star.y += star.speed * dt * 60;
      star.twinkle += dt * 3;
      if (star.y > canvas.height) star.y = 0;
      star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(star.twinkle));
    }
    for (const layer of layers) {
      if (layer.update) layer.update(dt, scrollX * layer.speed);
    }
  }
  
  function draw(ctx, scrollX = 0) {
    ctx.fillStyle = theme === 'cyberpunk' ? '#050510' : theme === 'cave' ? '#0a0510' : theme === 'dark' ? '#050505' : '#051015';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (const star of stars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = theme === 'cyberpunk' ? '#aaf' : theme === 'cave' ? '#ffd' : theme === 'sky' ? '#fff' : '#aaa';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    for (const layer of layers) {
      ctx.globalAlpha = layer.opacity;
      ctx.save();
      ctx.translate(scrollX * layer.speed, 0);
      layer.draw(ctx);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  
  return { init, addLayer, update, draw };
}

export function createComboSystem() {
  let combo = 0;
  let maxCombo = 0;
  let comboTimer = 0;
  const comboWindow = 2.0;
  
  function add(amount = 1) {
    combo += amount;
    maxCombo = Math.max(maxCombo, combo);
    comboTimer = comboWindow;
  }
  
  function reset() {
    combo = 0;
    comboTimer = 0;
  }
  
  function update(dt) {
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) reset();
    }
  }
  
  function getMultiplier() {
    return Math.min(1 + combo * 0.1, 5);
  }
  
  return { add, reset, update, get combo() { return combo; }, get maxCombo() { return maxCombo; }, get multiplier() { return getMultiplier(); }, get active() { return comboTimer > 0; } };
}

export function createScoreSystem() {
  let score = 0;
  let highScore = 0;
  let gameId = 'game';
  
  function init(id) {
    gameId = id;
    highScore = Number(localStorage.getItem(`arcyn-best-${id}`) || 0);
  }
  
  function add(points) {
    score += Math.floor(points);
  }
  
  function getScore() { return score; }
  function getHighScore() { return highScore; }
  
  function save() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(`arcyn-best-${gameId}`, String(score));
      return true;
    }
    return false;
  }
  
  function reset() { score = 0; }
  
  return { init, add, getScore, getHighScore, save, reset };
}

export function createTimer() {
  let time = 0;
  let running = false;
  
  function start() { running = true; time = 0; }
  function stop() { running = false; }
  function reset() { time = 0; running = false; }
  function update(dt) { if (running) time += dt; }
  function getTime() { return time; }
  function getFormatted() {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  return { start, stop, reset, update, getTime, getFormatted, get running() { return running; } };
}

export function createAchievementSystem(gameId) {
  const key = `arcyn-achievements-${gameId}`;
  let achievements = {};
  
  function load() {
    try { achievements = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
  }
  
  function save() {
    try { localStorage.setItem(key, JSON.stringify(achievements)); } catch {}
  }
  
  function unlock(id, name, desc, icon) {
    if (achievements[id]) return false;
    achievements[id] = { id, name, desc, icon, unlocked: Date.now() };
    save();
    return true;
  }
  
  function isUnlocked(id) { return !!achievements[id]; }
  function getAll() { return Object.values(achievements); }
  function getCount() { return Object.keys(achievements).length; }
  
  load();
  return { unlock, isUnlocked, getAll, getCount };
}

export function createSettings() {
  const defaults = {
    music: true,
    sfx: true,
    fullscreen: false,
    difficulty: 'normal',
    particles: 'high',
    screenShake: true,
    showFPS: false
  };
  
  const key = 'arcyn-settings';
  let settings = { ...defaults };
  
  function load() {
    try { settings = { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}
    return settings;
  }
  
  function save() {
    try { localStorage.setItem(key, JSON.stringify(settings)); } catch {}
  }
  
  function get(key) { return settings[key]; }
  function set(key, value) { settings[key] = value; save(); }
  function toggle(key) { settings[key] = !settings[key]; save(); return settings[key]; }
  function reset() { settings = { ...defaults }; save(); }
  
  load();
  return { get, set, toggle, reset, load, save, all: () => ({ ...settings }) };
}

export const themes = {
  cyberpunk: { bg: '#050510', fg: '#fff', accent: '#7c5cff', accent2: '#ff5c8a', neon1: '#00ffff', neon2: '#ff00ff', neon3: '#ffff00' },
  gravity: { bg: '#080810', fg: '#e0e0ff', accent: '#00d4ff', accent2: '#7c5cff', neon1: '#00ffff', neon2: '#aa88ff', neon3: '#44ffff' },
  crystal: { bg: '#0a0510', fg: '#fff', accent: '#ff00ff', accent2: '#00ffff', neon1: '#ff44ff', neon2: '#44ffff', neon3: '#ffff44' },
  dark: { bg: '#050505', fg: '#ffcc00', accent: '#ff5c8a', accent2: '#ffaa00', neon1: '#ff3366', neon2: '#ffcc00', neon3: '#ff6600' },
  sky: { bg: '#051015', fg: '#fff', accent: '#ffb444', accent2: '#ff5c8a', neon1: '#ffaa00', neon2: '#ff66aa', neon3: '#ffcc44' }
};

export function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 255, g: 255, b: 255 };
}

export function lerpColor(c1, c2, t) {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const r = Math.round(lerp(rgb1.r, rgb2.r, t));
  const g = Math.round(lerp(rgb1.g, rgb2.g, t));
  const b = Math.round(lerp(rgb1.b, rgb2.b, t));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}