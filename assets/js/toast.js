/**
 * Toast — lightweight, dependency-free notification stack. Lazily creates
 * its own viewport on first use so any module can `import { toast }` and
 * call it without touching index.html.
 */
import { iconMarkup } from './icons.js';

const ICON_BY_TYPE = {
  success: 'star',
  info: 'sparkle',
  error: 'close',
  favorite: 'heart'
};

let viewport = null;

function getViewport() {
  if (viewport) return viewport;
  viewport = document.createElement('div');
  viewport.className = 'toast-viewport';
  viewport.setAttribute('role', 'status');
  viewport.setAttribute('aria-live', 'polite');
  document.body.appendChild(viewport);
  return viewport;
}

export function toast(message, { type = 'info', duration = 3200 } = {}) {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `${iconMarkup(ICON_BY_TYPE[type] || 'sparkle')}<span>${message}</span>`;

  getViewport().appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-visible'));

  const remove = () => {
    el.classList.remove('is-visible');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 500); // safety net if transitionend never fires
  };

  const timer = setTimeout(remove, duration);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}
