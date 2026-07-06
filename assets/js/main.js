/**
 * Main entry point — bootstraps the homepage: loads the games dataset,
 * renders all dynamic sections, and wires up interactive modules.
 */
import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { initSearch } from './search.js';
import { renderCards } from './game-card.js';
import { CATEGORIES } from './categories.js';
import { iconMarkup } from './icons.js';

initTheme();
initNav();
initYear();
initNewsletter();
releaseLoadingState();
loadGames();

/** Lets the theme/layout settle on first paint before re-enabling transitions. */
function releaseLoadingState() {
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('is-loading')));
}

async function loadGames() {
  try {
    const res = await fetch('data/games.json');
    if (!res.ok) throw new Error(`Failed to load games.json: ${res.status}`);
    const { games } = await res.json();
    renderHome(games);
    initSearch(games);
    initCountUp();
  } catch (err) {
    console.error(err);
    renderLoadError();
  }
}

/** Animates hero stat numbers up from 0 once they scroll into view. */
function initCountUp() {
  const stats = document.querySelectorAll('[data-count-to]');
  if (!stats.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = (el) => {
    const target = parseFloat(el.dataset.countTo);
    const decimals = Number(el.dataset.countDecimals || 0);
    const suffix = el.dataset.countSuffix || '';
    const format = (n) => `${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

    if (reduceMotion) {
      el.textContent = format(target);
      return;
    }

    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    stats.forEach(animate);
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  stats.forEach((el) => io.observe(el));
}

/** Toggles edge-fade hints on horizontally scrollable rails (e.g. Trending). */
function initScrollers() {
  document.querySelectorAll('.scroller-wrap').forEach((wrap) => {
    const rail = wrap.querySelector('.scroller');
    if (!rail) return;
    const update = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      wrap.classList.toggle('is-scrollable', rail.scrollLeft < maxScroll - 4);
      wrap.classList.toggle('is-scrolled', rail.scrollLeft > 4);
    };
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Content loads asynchronously, so re-check shortly after render.
    requestAnimationFrame(update);
    setTimeout(update, 400);
  });
}

function renderHome(games) {
  const featured = games.filter((g) => g.featured).slice(0, 4);
  const trending = games.filter((g) => g.trending);
  const recent = games.filter((g) => g.new);

  setGrid('[data-featured-grid]', featured.length ? featured : games.slice(0, 4));
  setGrid('[data-trending-scroller]', trending.length ? trending : games.slice(0, 8));
  setGrid('[data-recent-grid]', recent.length ? recent : games.slice(0, 6));

  renderCategories(games);
  renderAllGames(games);
  initScrollers();
}

function setGrid(selector, games) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = renderCards(games);
}

function renderCategories(games) {
  const el = document.querySelector('[data-category-grid]');
  if (!el) return;

  el.innerHTML = CATEGORIES.map((cat) => {
    const count = games.filter((g) => g.category === cat.name).length;
    return `
      <a class="category-card reveal" href="#" data-filter="${cat.name}" style="--cat-color:${cat.color};">
        <span class="category-card__icon">${iconMarkup(cat.icon, 'style="width:24px;height:24px;"')}</span>
        <span class="category-card__name">${cat.name}${iconMarkup('chevronRight', 'class="category-card__arrow"')}</span>
        <span class="category-card__count">${count} games</span>
      </a>
    `;
  }).join('');

  el.querySelectorAll('[data-filter]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const chip = document.querySelector(`.chip[data-filter="${link.dataset.filter}"]`);
      chip?.click();
      document.querySelector('[data-all-games]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderAllGames(games) {
  const grid = document.querySelector('[data-game-grid]');
  const chipRow = document.querySelector('[data-category-chips]');
  if (!grid || !chipRow) return;

  const categories = ['All', ...new Set(games.map((g) => g.category))];
  chipRow.innerHTML = categories
    .map((cat, i) => `<button class="chip${i === 0 ? ' is-active' : ''}" data-filter="${cat}">${cat}</button>`)
    .join('');

  grid.innerHTML = renderCards(games);

  chipRow.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chipRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const filter = chip.dataset.filter;
    const filtered = filter === 'All' ? games : games.filter((g) => g.category === filter);
    grid.innerHTML = renderCards(filtered);
    observeReveals();
  });

  observeReveals();
}

function renderLoadError() {
  document.querySelectorAll('[data-featured-grid], [data-trending-scroller], [data-recent-grid], [data-game-grid]').forEach((el) => {
    el.innerHTML = '<p class="search-empty">Unable to load games right now. Please refresh the page.</p>';
  });
}

function initYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = new Date().getFullYear();
}

function initNewsletter() {
  const form = document.querySelector('[data-newsletter-form]');
  const success = document.querySelector('[data-newsletter-success]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.reset();
    success?.classList.add('is-visible');
  });
}

function observeReveals() {
  const items = document.querySelectorAll('.reveal:not(.is-revealed)');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  const io = new IntersectionObserver(
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
  );
  items.forEach((el) => io.observe(el));
}

document.addEventListener('DOMContentLoaded', observeReveals);
