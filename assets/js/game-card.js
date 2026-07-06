/**
 * Game card rendering — pure functions that turn a game data object
 * into markup, reused across featured / trending / grid / search sections.
 */
import { iconMarkup } from './icons.js';
import { isFavorite, toggleFavorite } from './favorites.js';
import { toast } from './toast.js';

export function renderRating(rating) {
  return `<span class="rating" aria-label="Rated ${rating.toFixed(1)} out of 5">${iconMarkup('star')}${rating.toFixed(1)}</span>`;
}

export function renderBadges(game) {
  const badges = [];
  if (game.playable === false) badges.push('<span class="badge badge-soon">Coming Soon</span>');
  if (game.new) badges.push('<span class="badge badge-new">New</span>');
  if (game.trending) badges.push('<span class="badge badge-trending">Trending</span>');
  if (game.featured && !game.new) badges.push('<span class="badge badge-hot">Featured</span>');
  return badges.join('');
}

/**
 * `basePath` accounts for this template being rendered from pages at
 * different folder depths (index.html at root, category/game pages one
 * level down) — every relative link and image src needs it prefixed so
 * cards work identically wherever they're rendered.
 */
export function gameCardTemplate(game, basePath = '') {
  const favorited = isFavorite(game.id);
  return `
    <article class="game-card reveal" data-game-id="${game.id}" data-category="${game.category}" style="--accent: ${game.accent};">
      <a class="game-card__media" href="${basePath}games/game.html?id=${encodeURIComponent(game.id)}" aria-label="Play ${game.name} — ${game.category}, rated ${game.rating.toFixed(1)} out of 5">
        <div class="game-card__badges">${renderBadges(game)}</div>
        <div class="game-card__thumb">
          <img src="${basePath}${game.thumbnail}" alt="" loading="lazy" decoding="async" width="800" height="450" />
        </div>
        <div class="game-card__play">
          <span class="game-card__play-btn">${iconMarkup('play')}</span>
        </div>
      </a>
      <button
        type="button"
        class="game-card__favorite"
        data-favorite-toggle="${game.id}"
        aria-label="${favorited ? 'Remove from favorites' : 'Add to favorites'}"
        aria-pressed="${favorited}"
      >${iconMarkup('heart')}</button>
      <div class="game-card__body">
        <div class="game-card__top">
          <h3 class="game-card__name">${game.name}</h3>
        </div>
        <div class="game-card__meta">
          <span class="game-card__category">${game.category}</span>
          <span class="game-card__stats">${renderRating(game.rating)}<span class="game-card__plays">${game.plays} plays</span></span>
        </div>
      </div>
    </article>
  `;
}

/**
 * Attaches one delegated click listener for every favorite button on the
 * page — cards are re-rendered often (filters, sorts, search), so binding
 * per-card listeners would leak; delegation survives innerHTML swaps.
 */
export function initFavoriteButtons() {
  if (initFavoriteButtons._bound) return;
  initFavoriteButtons._bound = true;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-favorite-toggle]');
    if (!btn) return;
    e.preventDefault();

    const id = btn.dataset.favoriteToggle;
    const name = btn.closest('.game-card')?.querySelector('.game-card__name')?.textContent || 'Game';
    const added = toggleFavorite(id);

    document.querySelectorAll(`[data-favorite-toggle="${id}"]`).forEach((el) => {
      el.setAttribute('aria-pressed', String(added));
      el.setAttribute('aria-label', added ? 'Remove from favorites' : 'Add to favorites');
    });

    toast(added ? `${name} added to favorites` : `${name} removed from favorites`, { type: 'favorite' });
  });
}

export function renderCards(games, basePath = '') {
  return games.map((game) => gameCardTemplate(game, basePath)).join('');
}

/**
 * Fades .reveal elements in once they scroll into view. Wired as a
 * MutationObserver rather than something each page must remember to call
 * after every renderCards() — a previous per-page-callback version left
 * category pages and similar-games grids permanently invisible because
 * nothing there ever triggered it.
 */
export function initAutoReveal() {
  if (initAutoReveal._bound) return;
  initAutoReveal._bound = true;

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
