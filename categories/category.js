/**
 * Dedicated category page — reads ?name= from the URL, hydrates the
 * banner from static category metadata, and renders a sortable grid of
 * every game in that category straight from games.json. Switching the
 * category tab or sort order re-filters in place (no page reload).
 */
import { initTheme } from '../assets/js/theme.js';
import { initNav } from '../assets/js/nav.js';
import { initSearch } from '../assets/js/search.js';
import { renderCards, initFavoriteButtons, initAutoReveal } from '../assets/js/game-card.js';
import { CATEGORIES, getCategory } from '../assets/js/categories.js';
import { iconMarkup } from '../assets/js/icons.js';

initTheme();
initNav();
initFavoriteButtons();
initAutoReveal();
initYear();
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('is-loading')));

const PAGE_SIZE = 12;

let allGames = [];
let currentCategory = '';
let currentSort = 'popular';
let visibleCount = PAGE_SIZE;

bootstrap();

async function bootstrap() {
  try {
    const res = await fetch('../data/games.json');
    const { games } = await res.json();
    allGames = games;
    initSearch(games, '../');

    const params = new URLSearchParams(window.location.search);
    currentCategory = params.get('name') || CATEGORIES[0].name;

    renderTabs();
    renderBanner();
    renderGrid();
  } catch (err) {
    console.error('Failed to load category data', err);
    renderError();
  }
}

function renderTabs() {
  const tabs = document.querySelector('[data-category-tabs]');
  if (!tabs) return;

  tabs.innerHTML = CATEGORIES.map(
    (cat) => `<button class="chip${cat.name === currentCategory ? ' is-active' : ''}" data-tab="${cat.name}" role="tab" aria-selected="${cat.name === currentCategory}">${cat.name}</button>`
  ).join('');

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    currentCategory = btn.dataset.tab;
    visibleCount = PAGE_SIZE;

    const url = new URL(window.location.href);
    url.searchParams.set('name', currentCategory);
    window.history.replaceState({}, '', url);

    tabs.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('is-active', c.dataset.tab === currentCategory);
      c.setAttribute('aria-selected', String(c.dataset.tab === currentCategory));
    });

    renderBanner();
    renderGrid();
  });
}

function renderBanner() {
  const banner = document.querySelector('[data-category-banner]');
  const meta = getCategory(currentCategory);
  if (!banner || !meta) return;

  const gamesInCategory = allGames.filter((g) => g.category === currentCategory);
  const avgRating = gamesInCategory.length
    ? (gamesInCategory.reduce((sum, g) => sum + g.rating, 0) / gamesInCategory.length).toFixed(1)
    : '—';
  const totalPlays = gamesInCategory.reduce((sum, g) => sum + (g.playsCount || 0), 0);

  banner.style.setProperty('--cat-color', meta.color);
  banner.style.backgroundImage = `linear-gradient(180deg, rgba(5, 5, 10, 0.2), rgba(5, 5, 10, 0.7)), url('../assets/images/categories/${meta.name.toLowerCase()}.svg')`;
  banner.style.backgroundSize = 'cover';
  banner.style.backgroundPosition = 'center';
  banner.innerHTML = `
    <span class="category-banner__icon">${iconMarkup(meta.icon)}</span>
    <h1>${meta.name} Games</h1>
    <p>${meta.description}</p>
    <div class="category-banner__meta">
      <span class="category-banner__stat"><strong>${gamesInCategory.length}</strong> games</span>
      <span class="category-banner__stat"><strong>${avgRating}</strong> avg rating</span>
      <span class="category-banner__stat"><strong>${formatCount(totalPlays)}</strong> total plays</span>
    </div>
  `;

  document.title = `${meta.name} Games — Play Free on Arcyn Studios`;
  setMeta('description', `Play free ${meta.name.toLowerCase()} games instantly on Arcyn Studios. ${meta.description}`);
  setMeta('og:title', `${meta.name} Games — Arcyn Studios`, true);
  setMeta('og:description', meta.description, true);

  const canonical = document.querySelector('[data-page-canonical]');
  if (canonical) canonical.href = `https://www.arcynstudios.com/categories/category.html?name=${encodeURIComponent(meta.name)}`;

  const breadcrumb = document.querySelector('[data-breadcrumb-name]');
  if (breadcrumb) breadcrumb.textContent = `${meta.name} Games`;

  const jsonld = document.querySelector('[data-jsonld-category]');
  if (jsonld) {
    jsonld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${meta.name} Games`,
      description: meta.description
    });
  }
}

function renderGrid() {
  const grid = document.querySelector('[data-category-grid]');
  const countEl = document.querySelector('[data-result-count]');
  const sortSelect = document.querySelector('[data-sort-select]');
  const loadMoreBtn = document.querySelector('[data-load-more]');
  if (!grid) return;

  sortSelect.value = currentSort;
  if (!sortSelect.dataset.bound) {
    sortSelect.dataset.bound = 'true';
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      visibleCount = PAGE_SIZE;
      renderGrid();
    });
  }
  if (loadMoreBtn && !loadMoreBtn.dataset.bound) {
    loadMoreBtn.dataset.bound = 'true';
    loadMoreBtn.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      renderGrid();
    });
  }

  let games = allGames.filter((g) => g.category === currentCategory);
  games = sortGames(games, currentSort);
  const slice = games.slice(0, visibleCount);

  countEl.textContent = `${games.length} ${games.length === 1 ? 'game' : 'games'} found`;
  if (loadMoreBtn) loadMoreBtn.hidden = visibleCount >= games.length;

  grid.classList.remove('grid-transition');
  grid.innerHTML = games.length ? renderCards(slice, '../') : emptyState();
  // Restart the fade-in transition every render.
  void grid.offsetWidth;
  grid.classList.add('grid-transition');
}

function sortGames(games, sort) {
  const list = [...games];
  switch (sort) {
    case 'rating':
      return list.sort((a, b) => b.rating - a.rating);
    case 'new':
      return list.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'popular':
    default:
      return list.sort((a, b) => (b.playsCount || 0) - (a.playsCount || 0));
  }
}

function emptyState() {
  return `
    <div class="state-panel">
      <span class="state-panel__icon">${iconMarkup('gamepad')}</span>
      <h3>No games here yet</h3>
      <p>We're still building out this category — check back soon or explore another one above.</p>
    </div>
  `;
}

function renderError() {
  const grid = document.querySelector('[data-category-grid]');
  if (grid) {
    grid.innerHTML = `
      <div class="state-panel state-panel--error">
        <span class="state-panel__icon">${iconMarkup('close')}</span>
        <h3>Couldn't load games</h3>
        <p>Something went wrong fetching the catalog. Please refresh the page.</p>
      </div>
    `;
  }
}

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

function setMeta(name, content, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  if (el) el.setAttribute('content', content);
}

function initYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = new Date().getFullYear();
}
