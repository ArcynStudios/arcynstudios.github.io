/**
 * Game page bootstrap — reads ?id= from the URL, hydrates the template
 * with data from games.json, and wires up player/like/share/fullscreen/
 * favorite/report. The actual embeddable game player is intentionally
 * out of scope for this milestone (structure only, per project brief).
 */
import { initTheme } from '../assets/js/theme.js';
import { initNav } from '../assets/js/nav.js';
import { initSearch } from '../assets/js/search.js';
import { renderCards, initFavoriteButtons, initAutoReveal } from '../assets/js/game-card.js';
import { getSimilarGames } from '../assets/js/collections.js';
import { isFavorite, toggleFavorite } from '../assets/js/favorites.js';
import { toast } from '../assets/js/toast.js';
import { iconMarkup } from '../assets/js/icons.js';

const REPORTED_KEY = 'arcyn-reported-games';

initTheme();
initNav();
initFavoriteButtons();
initAutoReveal();
initYear();
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('is-loading')));
bootstrap();

async function bootstrap() {
  try {
    const res = await fetch('../data/games.json');
    const { games } = await res.json();
    initSearch(games, '../');

    const id = new URLSearchParams(window.location.search).get('id');
    const game = games.find((g) => g.id === id) || games[0];
    if (!game) return renderNotFound();

    hydrate(game);
    renderSimilar(game, games);
    wireActions(game);
  } catch (err) {
    console.error('Failed to load game data', err);
    renderError();
  }
}

function hydrate(game) {
  document.title = `${game.name} — Play Free on Arcyn Studios`;
  setMeta('description', `Play ${game.name} free on Arcyn Studios. ${game.category} game, rated ${game.rating}/5 with ${game.plays} plays.`);
  setMeta('og:title', `${game.name} — Arcyn Studios`, true);
  setMeta('og:description', `Play ${game.name} instantly in your browser. No downloads required.`, true);

  const canonical = document.querySelector('[data-page-canonical]');
  if (canonical) canonical.href = `https://www.arcynstudios.com/games/game.html?id=${game.id}`;

  const breadcrumbCategory = document.querySelector('[data-breadcrumb-category]');
  breadcrumbCategory.textContent = game.category;
  breadcrumbCategory.href = `../categories/category.html?name=${encodeURIComponent(game.category)}`;

  document.querySelector('[data-breadcrumb-name]').textContent = game.name;
  document.querySelector('[data-game-title]').textContent = game.name;
  document.querySelector('[data-player-name]').textContent = game.name;
  document.querySelector('[data-game-category]').textContent = game.category;
  document.querySelector('[data-game-plays]').textContent = `${game.plays} plays`;
  document.querySelector('[data-game-rating]').innerHTML = `${iconMarkup('star')} ${game.rating.toFixed(1)}`;
  document.querySelector('[data-game-description]').textContent = game.description;

  const difficultyEl = document.querySelector('[data-game-difficulty]');
  if (difficultyEl && game.difficulty) {
    const dotClass = `difficulty-dot--${game.difficulty.toLowerCase()}`;
    difficultyEl.innerHTML = `<span class="difficulty-dot ${dotClass}"></span>${game.difficulty}`;
  }

  const playtimeEl = document.querySelector('[data-game-playtime]');
  if (playtimeEl && game.estPlayTime) playtimeEl.textContent = game.estPlayTime;

  const tagRow = document.querySelector('[data-tag-row]');
  if (tagRow) {
    tagRow.innerHTML = (game.tags || [])
      .map((tag) => `<a class="tag" href="../index.html?q=${encodeURIComponent(tag)}">#${tag}</a>`)
      .join('');
  }

  const controlsList = document.querySelector('[data-controls-list]');
  if (controlsList) {
    controlsList.innerHTML = (game.controls || [])
      .map((c) => `<div class="control-item"><kbd>${c.key}</kbd><span>${c.action}</span></div>`)
      .join('');
  }

  const favoriteBtn = document.querySelector('[data-action="favorite"]');
  if (favoriteBtn) {
    const favorited = isFavorite(game.id);
    favoriteBtn.setAttribute('aria-pressed', String(favorited));
    favoriteBtn.setAttribute('aria-label', favorited ? 'Remove from favorites' : 'Add to favorites');
  }

  const shell = document.querySelector('[data-player-shell]');
  if (shell) {
    shell.style.background = `radial-gradient(circle at 30% 20%, ${game.accent}33, transparent 60%), var(--bg-elevated)`;
  }

  const placeholder = document.querySelector('[data-player-placeholder]');
  if (placeholder) {
    placeholder.innerHTML = game.playable
      ? `
        <button class="btn-icon" data-player-start aria-label="Start game" style="width:64px;height:64px;background:var(--gradient-cta);box-shadow:var(--shadow-glow-violet);">
          ${iconMarkup('play', 'style="width:26px;height:26px;color:#fff;margin-left:3px;"')}
        </button>
        <p>Click play to load <strong>${game.name}</strong></p>
      `
      : `
        <span class="state-panel__icon">${iconMarkup('sparkle')}</span>
        <p><strong>${game.name}</strong> is still in development.<br />Check back soon — new games ship regularly.</p>
      `;
  }

  const jsonld = document.querySelector('[data-jsonld-game]');
  if (jsonld) {
    jsonld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: game.name,
      description: game.description,
      genre: game.category,
      keywords: (game.tags || []).join(', '),
      datePublished: game.releaseDate,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.rating,
        bestRating: '5'
      },
      applicationCategory: 'Game',
      operatingSystem: 'Any (Web Browser)'
    });
  }
}

function setMeta(name, content, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  if (el) el.setAttribute('content', content);
}

function renderSimilar(game, games) {
  const el = document.querySelector('[data-similar-games]');
  if (!el) return;
  const similar = getSimilarGames(game, games, 4);
  el.innerHTML = similar.length
    ? renderCards(similar, '../')
    : `<div class="state-panel"><span class="state-panel__icon">${iconMarkup('gamepad')}</span><h3>No similar games yet</h3><p>Check back soon as the catalog grows.</p></div>`;
}

function wireActions(game) {
  const startBtn = document.querySelector('[data-player-start]');
  const shell = document.querySelector('[data-player-shell]');

  startBtn?.addEventListener('click', () => {
    if (!shell || !game.playable) return;
    const iframe = document.createElement('iframe');
    // playUrl (e.g. "library/neon-drift/index.html") is already relative to
    // this page's own /games/ directory — no "../" needed.
    iframe.src = game.playUrl;
    iframe.title = `${game.name} — playable game`;
    iframe.allow = 'fullscreen; autoplay';
    iframe.setAttribute('allowfullscreen', '');
    shell.innerHTML = '';
    shell.appendChild(iframe);
  });

  document.querySelector('[data-action="fullscreen"]')?.addEventListener('click', () => {
    if (!shell) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      shell.requestFullscreen?.();
    }
  });

  const likeBtn = document.querySelector('[data-action="like"]');
  likeBtn?.addEventListener('click', () => {
    const pressed = likeBtn.getAttribute('aria-pressed') === 'true';
    likeBtn.setAttribute('aria-pressed', String(!pressed));
    likeBtn.style.color = !pressed ? 'var(--aurora-pink)' : '';
    toast(!pressed ? `Liked ${game.name}` : `Removed like from ${game.name}`, { type: !pressed ? 'success' : 'info' });
  });

  const favoriteBtn = document.querySelector('[data-action="favorite"]');
  favoriteBtn?.addEventListener('click', () => {
    const added = toggleFavorite(game.id);
    favoriteBtn.setAttribute('aria-pressed', String(added));
    favoriteBtn.setAttribute('aria-label', added ? 'Remove from favorites' : 'Add to favorites');
    toast(added ? `${game.name} added to favorites` : `${game.name} removed from favorites`, { type: 'favorite' });
  });

  document.querySelector('[data-action="share"]')?.addEventListener('click', async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: game.name, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard?.writeText(url);
      toast('Link copied to clipboard', { type: 'success' });
    } catch {
      toast('Could not copy link', { type: 'error' });
    }
  });

  wireReportModal(game);
}

function wireReportModal(game) {
  const modal = document.querySelector('[data-report-modal]');
  const openBtn = document.querySelector('[data-action="report"]');
  const cancelBtn = document.querySelector('[data-report-cancel]');
  const form = document.querySelector('[data-report-form]');
  if (!modal || !openBtn || !form) return;

  const alreadyReported = () => getReportedIds().includes(game.id);

  const open = () => {
    if (alreadyReported()) {
      toast("You've already reported this game — our team is on it", { type: 'info' });
      return;
    }
    modal.classList.add('is-open');
  };
  const close = () => modal.classList.remove('is-open');

  openBtn.addEventListener('click', open);
  cancelBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const reason = new FormData(form).get('reason');
    markReported(game.id);
    close();
    toast(`Report submitted — thanks for helping keep Arcyn Studios in shape (${reason})`, { type: 'success' });
  });
}

function getReportedIds() {
  try {
    return JSON.parse(localStorage.getItem(REPORTED_KEY) || '[]');
  } catch {
    return [];
  }
}

function markReported(id) {
  try {
    const ids = getReportedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(REPORTED_KEY, JSON.stringify(ids));
    }
  } catch {
    /* localStorage unavailable — report still submits, just won't be remembered */
  }
}

function renderNotFound() {
  const main = document.querySelector('#main-content');
  if (main) {
    main.innerHTML = `
      <div class="state-panel" style="padding-block: var(--space-3xl);">
        <span class="state-panel__icon">${iconMarkup('gamepad')}</span>
        <h3>Game not found</h3>
        <p>This game may have been removed or the link is incorrect.</p>
        <a class="btn btn-primary" href="../index.html">Back to Arcyn Studios</a>
      </div>
    `;
  }
}

function renderError() {
  const main = document.querySelector('#main-content');
  if (main) {
    main.innerHTML = `
      <div class="state-panel state-panel--error" style="padding-block: var(--space-3xl);">
        <span class="state-panel__icon">${iconMarkup('close')}</span>
        <h3>Couldn't load this game</h3>
        <p>Something went wrong. Please refresh the page.</p>
      </div>
    `;
  }
}

function initYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = new Date().getFullYear();
}
