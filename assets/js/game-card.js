/**
 * Game card rendering — pure functions that turn a game data object
 * into markup, reused across featured / trending / grid / search sections.
 */
import { iconMarkup, CATEGORY_ICON_MAP } from './icons.js';

export function renderRating(rating) {
  return `<span class="rating" aria-label="Rated ${rating.toFixed(1)} out of 5">${iconMarkup('star')}${rating.toFixed(1)}</span>`;
}

export function renderBadges(game) {
  const badges = [];
  if (game.new) badges.push('<span class="badge badge-new">New</span>');
  if (game.trending) badges.push('<span class="badge badge-trending">Trending</span>');
  if (game.featured && !game.new) badges.push('<span class="badge badge-hot">Featured</span>');
  return badges.join('');
}

export function gameCardTemplate(game) {
  const icon = CATEGORY_ICON_MAP[game.category] || 'gamepad';
  return `
    <article class="game-card reveal" data-game-id="${game.id}" data-category="${game.category}" style="--accent: ${game.accent};">
      <a class="game-card__media" href="games/game.html?id=${encodeURIComponent(game.id)}" aria-label="Play ${game.name} — ${game.category}, rated ${game.rating.toFixed(1)} out of 5">
        <div class="game-card__badges">${renderBadges(game)}</div>
        <div class="game-card__thumb" style="background: radial-gradient(circle at 30% 20%, ${game.accent}55, transparent 60%), linear-gradient(155deg, ${game.accent}dd, ${shade(game.accent)} 120%);">
          ${iconMarkup(icon)}
        </div>
        <div class="game-card__play">
          <span class="game-card__play-btn">${iconMarkup('play')}</span>
        </div>
      </a>
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

/** Darkens a hex color for gradient depth without needing extra assets. */
function shade(hex, amount = 0.55) {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 255) * amount));
  const g = Math.max(0, Math.floor(((num >> 8) & 255) * amount));
  const b = Math.max(0, Math.floor((num & 255) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export function renderCards(games) {
  return games.map(gameCardTemplate).join('');
}
