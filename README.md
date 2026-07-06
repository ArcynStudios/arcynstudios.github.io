# Arcyn Studios

A premium game studio and gaming ecosystem, delivered as an instant-play HTML5 web platform. Static site — HTML5, CSS3, and vanilla ES6+ JavaScript only, no build step, no frameworks, no backend. Deployable as-is on GitHub Pages.

## Design language

**Aurora Cyber** — a dark-first glassmorphic system with animated aurora-gradient accents (violet → cyan → pink), soft glass surfaces, neon glow shadows, and a light-mode counterpart. Tokens live in [assets/css/variables.css](assets/css/variables.css).

## Project structure

```
index.html                Homepage
games/
  game.html                Game page (player, tags, controls, favorite/like/share/report)
  game.js                  Game page bootstrap
categories/
  category.html            Dedicated category page (banner, sort, pagination)
  category.js              Category page bootstrap
components/                Reserved for future shared HTML partials
data/
  games.json               Game catalog — the single source of truth
assets/
  css/                     variables → base → components → platform → animations → main.css
  js/
    main.js                Homepage bootstrap
    game-card.js            Card rendering + favorite-button delegation
    collections.js          Pure derivations: trending, new, editor's picks, most played, top rated
    favorites.js             localStorage-backed favorites store (shared everywhere)
    toast.js                 Toast notification system
    search.js                Live search: title/category/tag match, keyboard nav, recent searches
    categories.js            Static category metadata (icon, color, banner description)
    nav.js / theme.js / icons.js
  icons/                    favicon.svg
  images/                   (reserved for real game thumbnails/art)
  fonts/                    (reserved; currently loaded via Google Fonts CDN)
manifest.json               Web app manifest
robots.txt / sitemap.xml
```

## Adding a game

Append one entry to `data/games.json` — nothing else needs to change. Every card, collection, category page, search result, and the game detail page all derive from this file:

```json
{
  "id": "your-game-id",
  "name": "Your Game",
  "category": "Action",
  "rating": 4.5,
  "plays": "10K",
  "playsCount": 10000,
  "likes": 1800,
  "reports": 0,
  "thumbnail": "assets/images/games/your-game.svg",
  "featured": false,
  "trending": false,
  "new": true,
  "editorsPick": false,
  "accent": "#7c5cff",
  "releaseDate": "2026-07-01",
  "description": "One or two sentences describing the game.",
  "tags": ["action", "singleplayer"],
  "controls": [{ "key": "W A S D", "action": "Move" }, { "key": "Space", "action": "Jump" }]
}
```

Thumbnails render as CSS gradients using `accent` plus a category icon (see `assets/js/icons.js`), so the platform scales to thousands of games without individual art assets up front. Swap in real images later by rendering `<img src="{thumbnail}">` in `game-card.js`.

`category` must match one of the names in `assets/js/categories.js` (`CATEGORIES`) — that's also where each category's banner icon/color/description live.

## Collections

Defined once in `assets/js/collections.js` and reused everywhere (homepage, category pages):

- **Trending** — `trending: true`
- **New Releases** — `new: true`, sorted by `releaseDate`
- **Editor's Picks** — `editorsPick: true`
- **Most Played** — sorted by `playsCount`
- **Highest Rated** — sorted by `rating`

## Favorites

Stored client-side in `localStorage` (`arcyn-favorites`) via `assets/js/favorites.js`. The heart button on every card and on the game page read/write the same store and stay in sync instantly (pub-sub). The homepage "Your Favorites" section only appears once a visitor has saved something.

## Running locally

Any static file server works (ES modules + `fetch()` require `http://`, not `file://` — opening `index.html` by double-click will not work):

```
npx serve .
# or
python -m http.server 8000
```

Then browse to `http://localhost:8000/`.

## Milestone status

- [x] Milestone 1 — Folder structure + complete homepage
- [x] Milestone 2 — Core gaming platform: category pages, upgraded game page, live search, dynamic collections, favorites, toasts, pagination
- [ ] Milestone 3 — Real embedded game player, comments backend, account system
