/**
 * Main entry point — bootstraps the homepage: loads the games dataset,
 * renders all dynamic sections, and wires up interactive modules.
 */
import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { initSearch } from './search.js';
import { renderCards, initFavoriteButtons, initAutoReveal } from './game-card.js';
import { CATEGORIES } from './categories.js';
import { iconMarkup } from './icons.js';
import { getFeatured, getTrending, getNewReleases, getEditorsPicks, getMostPlayed, getHighestRated } from './collections.js';
import { getFavorites, onFavoritesChange } from './favorites.js';

const PAGE_SIZE = 12;
let visibleCount = PAGE_SIZE;
let activeCategoryFilter = 'All';

initTheme();
initNav();
initFavoriteButtons();
initAutoReveal();
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
    if (!rail || wrap.dataset.bound) return;
    wrap.dataset.bound = 'true';
    const update = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      wrap.classList.toggle('is-scrollable', rail.scrollLeft < maxScroll - 4);
      wrap.classList.toggle('is-scrolled', rail.scrollLeft > 4);
    };
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    requestAnimationFrame(update);
    setTimeout(update, 400);
  });
}

function renderHome(games) {
  setGrid('[data-featured-grid]', getFeatured(games, 4));
  setGrid('[data-trending-scroller]', getTrending(games).length ? getTrending(games) : games.slice(0, 8));
  setGrid('[data-recent-grid]', getNewReleases(games).length ? getNewReleases(games).slice(0, 6) : games.slice(0, 6));
  setGrid('[data-editors-grid]', getEditorsPicks(games).length ? getEditorsPicks(games) : games.slice(0, 4));
  setGrid('[data-most-played-scroller]', getMostPlayed(games));
  setGrid('[data-top-rated-scroller]', getHighestRated(games));

  renderCategories(games);
  renderFavoritesSection(games);
  renderAllGames(games);
  initScrollers();

  onFavoritesChange(() => renderFavoritesSection(games));
}

function setGrid(selector, games, { empty } = {}) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (!games.length) {
    el.innerHTML = empty || emptyStateMarkup('Nothing here yet', 'Check back soon as the catalog grows.');
    return;
  }
  el.innerHTML = renderCards(games);
}

function emptyStateMarkup(title, body, icon = 'gamepad') {
  return `
    <div class="state-panel">
      <span class="state-panel__icon">${iconMarkup(icon)}</span>
      <h3>${title}</h3>
      <p>${body}</p>
    </div>
  `;
}

function renderCategories(games) {
  const el = document.querySelector('[data-category-grid]');
  if (!el) return;

  el.innerHTML = CATEGORIES.map((cat) => {
    const count = games.filter((g) => g.category === cat.name).length;
    return `
      <a class="category-card reveal" href="categories/category.html?name=${encodeURIComponent(cat.name)}" style="--cat-color:${cat.color};">
        <span class="category-card__icon">${iconMarkup(cat.icon, 'style="width:24px;height:24px;"')}</span>
        <span class="category-card__name">${cat.name}${iconMarkup('chevronRight', 'class="category-card__arrow"')}</span>
        <span class="category-card__count">${count} games</span>
      </a>
    `;
  }).join('');
}

/** Favorites are personal, so the whole section stays hidden until the visitor has saved at least one game. */
function renderFavoritesSection(games) {
  const section = document.querySelector('[data-favorites-section]');
  const grid = document.querySelector('[data-favorites-grid]');
  if (!section || !grid) return;

  const favoriteIds = getFavorites();
  const favoriteGames = games.filter((g) => favoriteIds.includes(g.id));

  section.hidden = favoriteGames.length === 0;
  if (favoriteGames.length) {
    grid.innerHTML = renderCards(favoriteGames);
  }
}

function renderAllGames(games) {
  const grid = document.querySelector('[data-game-grid]');
  const chipRow = document.querySelector('[data-category-chips]');
  const countEl = document.querySelector('[data-all-games-count]');
  const loadMoreBtn = document.querySelector('[data-load-more]');
  if (!grid || !chipRow) return;

  const categories = ['All', ...new Set(games.map((g) => g.category))];
  chipRow.innerHTML = categories
    .map((cat, i) => `<button class="chip${i === 0 ? ' is-active' : ''}" data-filter="${cat}">${cat}</button>`)
    .join('');

  const paint = () => {
    const filtered = activeCategoryFilter === 'All' ? games : games.filter((g) => g.category === activeCategoryFilter);
    const slice = filtered.slice(0, visibleCount);

    grid.classList.remove('grid-transition');
    grid.innerHTML = filtered.length
      ? renderCards(slice)
      : emptyStateMarkup('No games match that filter', 'Try a different category, or check back as more games are added.');
    void grid.offsetWidth;
    grid.classList.add('grid-transition');

    if (countEl) countEl.textContent = `Showing ${slice.length} of ${filtered.length} games`;
    if (loadMoreBtn) loadMoreBtn.hidden = visibleCount >= filtered.length;
  };

  chipRow.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chipRow.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    activeCategoryFilter = chip.dataset.filter;
    visibleCount = PAGE_SIZE;
    paint();
  });

  loadMoreBtn?.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    paint();
  });

  paint();
}

function renderLoadError() {
  const selectors = [
    '[data-featured-grid]',
    '[data-trending-scroller]',
    '[data-recent-grid]',
    '[data-editors-grid]',
    '[data-most-played-scroller]',
    '[data-top-rated-scroller]',
    '[data-game-grid]'
  ];
  document.querySelectorAll(selectors.join(', ')).forEach((el) => {
    el.innerHTML = `
      <div class="state-panel state-panel--error">
        <span class="state-panel__icon">${iconMarkup('close')}</span>
        <h3>Couldn't load games</h3>
        <p>Something went wrong fetching the catalog.</p>
        <button type="button" class="btn btn-ghost btn-sm" data-retry-load>Try again</button>
      </div>
    `;
  });

  document.querySelectorAll('[data-retry-load]').forEach((btn) => {
    btn.addEventListener('click', () => window.location.reload(), { once: true });
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
