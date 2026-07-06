/**
 * Search — overlay palette that filters the in-memory games dataset by
 * title, category, or tag. Supports arrow-key navigation between results,
 * Enter to open the highlighted result, and remembers recent queries in
 * localStorage so returning users can jump back in one click.
 */
import { iconMarkup } from './icons.js';

const RECENT_KEY = 'arcyn-recent-searches';
const MAX_RECENT = 6;

export function initSearch(games, basePath = '') {
  const overlay = document.querySelector('[data-search-overlay]');
  const openBtns = document.querySelectorAll('[data-search-open]');
  const closeBtn = document.querySelector('[data-search-close]');
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelector('[data-search-results]');

  if (!overlay || !input || !results) return;

  let activeIndex = -1;
  let currentMatches = [];

  const open = () => {
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 50);
    renderResults('');
  };

  const close = () => {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    input.value = '';
    activeIndex = -1;
  };

  function matchGame(game, q) {
    if (game.name.toLowerCase().includes(q)) return true;
    if (game.category.toLowerCase().includes(q)) return true;
    if (game.tags?.some((t) => t.toLowerCase().includes(q))) return true;
    return false;
  }

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    activeIndex = -1;

    if (!q) {
      currentMatches = [];
      renderRecent();
      return;
    }

    currentMatches = games.filter((g) => matchGame(g, q));

    if (!currentMatches.length) {
      results.innerHTML = `
        <div class="search-empty">
          <p>No games found for "${escapeHtml(query)}"</p>
        </div>
      `;
      return;
    }

    results.innerHTML = currentMatches.map((g, i) => searchResultTemplate(g, i)).join('');
  }

  function renderRecent() {
    const recent = getRecent();
    if (!recent.length) {
      results.innerHTML = `
        <div class="search-empty">
          <p>Search by title, category, or tag — try "racing" or "puzzle".</p>
        </div>
      `;
      return;
    }

    results.innerHTML = `
      <div class="search-recent">
        <h3>Recent searches</h3>
        <button type="button" data-clear-recent>Clear</button>
      </div>
      <div class="search-recent-list">
        ${recent
          .map(
            (term, i) => `
          <button type="button" class="search-recent-chip" data-recent-index="${i}">
            ${iconMarkup('search')}${escapeHtml(term)}
          </button>
        `
          )
          .join('')}
      </div>
    `;

    results.querySelector('[data-clear-recent]')?.addEventListener('click', () => {
      clearRecent();
      renderRecent();
    });

    // Index-based lookup (rather than round-tripping the raw term through an
    // HTML attribute) so a query containing quotes can't break the markup.
    results.querySelectorAll('[data-recent-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        input.value = recent[Number(btn.dataset.recentIndex)] || '';
        renderResults(input.value);
      });
    });
  }

  function searchResultTemplate(g, index) {
    return `
      <a class="search-result" data-index="${index}" href="${basePath}games/game.html?id=${encodeURIComponent(g.id)}">
        <div class="search-result__thumb">
          <img src="${basePath}${g.thumbnail}" alt="" loading="lazy" decoding="async" width="44" height="44" />
        </div>
        <div class="search-result__meta">
          <span>${highlightMatch(g.name, input.value)}</span>
          <small>${escapeHtml(g.category)} · ${g.rating.toFixed(1)}★</small>
        </div>
      </a>
    `;
  }

  function highlightMatch(text, query) {
    const q = query.trim();
    if (!q) return escapeHtml(text);
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return escapeHtml(text);
    return `${escapeHtml(text.slice(0, idx))}<strong>${escapeHtml(text.slice(idx, idx + q.length))}</strong>${escapeHtml(text.slice(idx + q.length))}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setActive(index) {
    const items = results.querySelectorAll('.search-result');
    items.forEach((el) => el.classList.remove('is-active'));
    if (index >= 0 && items[index]) {
      items[index].classList.add('is-active');
      items[index].scrollIntoView({ block: 'nearest' });
    }
    activeIndex = index;
  }

  function commitSearch(query) {
    const q = query.trim();
    if (!q) return;
    const recent = getRecent().filter((t) => t.toLowerCase() !== q.toLowerCase());
    recent.unshift(q);
    saveRecent(recent.slice(0, MAX_RECENT));
  }

  openBtns.forEach((btn) => btn.addEventListener('click', open));
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('is-open') ? close() : open();
    }
  });

  let debounceTimer;
  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const value = e.target.value;
    debounceTimer = setTimeout(() => renderResults(value), 120);
  });

  input.addEventListener('keydown', (e) => {
    if (!currentMatches.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, currentMatches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitSearch(input.value);
      const target = activeIndex >= 0 ? currentMatches[activeIndex] : currentMatches[0];
      if (target) window.location.href = `${basePath}games/game.html?id=${encodeURIComponent(target.id)}`;
    }
  });

  results.addEventListener('click', (e) => {
    if (e.target.closest('.search-result')) commitSearch(input.value);
  });

  // Deep-link support: ?q=tag from game-page tag chips opens search prefilled.
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q');
  if (initialQuery) {
    open();
    input.value = initialQuery;
    renderResults(initialQuery);
  }
}

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* localStorage unavailable — recent searches just won't persist */
  }
}

function clearRecent() {
  saveRecent([]);
}
