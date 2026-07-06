/**
 * Search — overlay palette that filters the in-memory games dataset.
 * No backend: filtering is a simple case-insensitive name/category match.
 */
import { CATEGORY_ICON_MAP, iconMarkup } from './icons.js';

export function initSearch(games) {
  const overlay = document.querySelector('[data-search-overlay]');
  const openBtns = document.querySelectorAll('[data-search-open]');
  const closeBtn = document.querySelector('[data-search-close]');
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelector('[data-search-results]');

  if (!overlay || !input || !results) return;

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
  };

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    const matches = q
      ? games.filter((g) => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q))
      : games.slice(0, 6);

    if (!matches.length) {
      results.innerHTML = `<p class="search-empty">No games found for "${escapeHtml(query)}"</p>`;
      return;
    }

    results.innerHTML = matches
      .map((g) => {
        const icon = CATEGORY_ICON_MAP[g.category] || 'gamepad';
        return `
          <a class="search-result" href="games/game.html?id=${encodeURIComponent(g.id)}">
            <div class="search-result__thumb" style="display:grid;place-items:center;background:linear-gradient(155deg, ${g.accent}, transparent);">
              ${iconMarkup(icon, 'style="width:22px;height:22px;color:#fff;"')}
            </div>
            <div class="search-result__meta">
              <span>${escapeHtml(g.name)}</span>
              <small>${escapeHtml(g.category)}</small>
            </div>
          </a>
        `;
      })
      .join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

  input.addEventListener('input', (e) => renderResults(e.target.value));
}
