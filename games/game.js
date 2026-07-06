/**
 * Game page bootstrap — reads ?id= from the URL, hydrates the template
 * with data from games.json, and wires up player/like/share/fullscreen.
 * The actual embeddable game player is intentionally out of scope for
 * this milestone (structure only, per project brief).
 */
import { initTheme } from '../assets/js/theme.js';
import { initNav } from '../assets/js/nav.js';
import { initSearch } from '../assets/js/search.js';
import { renderCards } from '../assets/js/game-card.js';
import { iconMarkup } from '../assets/js/icons.js';

initTheme();
initNav();
initYear();
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('is-loading')));
bootstrap();

async function bootstrap() {
  try {
    const res = await fetch('../data/games.json');
    const { games } = await res.json();
    initSearch(games);

    const id = new URLSearchParams(window.location.search).get('id');
    const game = games.find((g) => g.id === id) || games[0];
    if (!game) return;

    hydrate(game);
    renderSimilar(game, games);
    wireActions(game);
  } catch (err) {
    console.error('Failed to load game data', err);
  }
}

function hydrate(game) {
  document.title = `${game.name} — Play Free on Arcyn Studios`;
  setMeta('description', `Play ${game.name} free on Arcyn Studios. ${game.category} game, rated ${game.rating}/5 with ${game.plays} plays.`);
  setMeta('og:title', `${game.name} — Arcyn Studios`, true);
  setMeta('og:description', `Play ${game.name} instantly in your browser. No downloads required.`, true);

  const canonical = document.querySelector('[data-page-canonical]');
  if (canonical) canonical.href = `https://www.arcynstudios.com/games/game.html?id=${game.id}`;

  document.querySelector('[data-breadcrumb-category]').textContent = game.category;
  document.querySelector('[data-breadcrumb-category]').href = `../index.html#all-games`;
  document.querySelector('[data-breadcrumb-name]').textContent = game.name;
  document.querySelector('[data-game-title]').textContent = game.name;
  document.querySelector('[data-player-name]').textContent = game.name;
  document.querySelector('[data-game-category]').textContent = game.category;
  document.querySelector('[data-game-plays]').textContent = `${game.plays} plays`;
  document.querySelector('[data-game-rating]').innerHTML = `${iconMarkup('star')} ${game.rating.toFixed(1)}`;
  document.querySelector('[data-game-description]').textContent =
    `${game.name} is a ${game.category.toLowerCase()} game from Arcyn Studios, loved by players with a ${game.rating.toFixed(1)}-star average rating and ${game.plays} plays. Jump in instantly — no downloads, no installs, just click and play.`;

  const shell = document.querySelector('[data-player-shell]');
  if (shell) {
    shell.style.background = `radial-gradient(circle at 30% 20%, ${game.accent}33, transparent 60%), var(--bg-elevated)`;
  }

  const jsonld = document.querySelector('[data-jsonld-game]');
  if (jsonld) {
    jsonld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: game.name,
      genre: game.category,
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
  const similar = games.filter((g) => g.category === game.category && g.id !== game.id).slice(0, 4);
  el.innerHTML = renderCards(similar.length ? similar : games.filter((g) => g.id !== game.id).slice(0, 4));
}

function wireActions(game) {
  const startBtn = document.querySelector('[data-player-start]');
  const placeholder = document.querySelector('[data-player-placeholder]');
  const shell = document.querySelector('[data-player-shell]');

  startBtn?.addEventListener('click', () => {
    if (placeholder) placeholder.innerHTML = `<p>Embedded player coming soon for <strong>${game.name}</strong>.</p>`;
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
  });

  document.querySelector('[data-action="share"]')?.addEventListener('click', async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: game.name, url }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(url);
    }
  });
}

function initYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = new Date().getFullYear();
}
