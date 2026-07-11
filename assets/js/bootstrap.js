/**
 * Arcyn Studios — shared bootstrap helpers
 * Imported by main.js, game.js, and category.js to avoid duplication.
 */
import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { toggleFavorite } from './favorites.js';
import { initInstallPrompt } from './install-prompt.js';

export function initCommon(extraInit = () => {}) {
  initTheme();
  initNav();
  initFavoriteButtons();
  initAutoReveal();
  initYear();
  releaseLoadingState();
  initInstallPrompt();
  extraInit();
}

let favBound = false;
function initFavoriteButtons() {
  if (favBound) return;
  favBound = true;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-favorite-toggle]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.favoriteToggle;
    const card = btn.closest('.game-card');
    const name = card?.querySelector('.game-card__name')?.textContent || 'Game';
    const added = toggleFavorite(id);
    document.querySelectorAll(`[data-favorite-toggle="${id}"]`).forEach((el) => {
      el.setAttribute('aria-pressed', String(added));
      el.setAttribute('aria-label', added ? 'Remove from favorites' : 'Add to favorites');
    });
  });
}

let revealBound = false;
function initAutoReveal() {
  if (revealBound) return;
  revealBound = true;
  const reduceMotion = !('IntersectionObserver' in window);
  const io = !reduceMotion
    ? new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
              entry.target.style.animationDelay = `${Math.min(i * 40, 240)}ms`;
              entry.target.classList.add('is-revealed');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      )
    : null;
  const sweep = (root = document) => {
    root.querySelectorAll('.reveal:not(.is-revealed)').forEach((el) => {
      if (reduceMotion) {
        el.classList.add('is-revealed');
      } else {
        io.observe(el);
      }
    });
  };
  sweep();
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('.reveal')) sweep(node.parentElement || document);
        else if (node.querySelector?.('.reveal')) sweep(node);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
}

function initYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = new Date().getFullYear();
}

function releaseLoadingState() {
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('is-loading')));
}

export function setMeta(name, content, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  if (el) el.setAttribute('content', content);
}
