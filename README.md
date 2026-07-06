# Arcyn Studios

A premium game studio and gaming ecosystem, delivered as an instant-play HTML5 web platform. Static site — HTML5, CSS3, and vanilla ES6+ JavaScript only, no build step, no frameworks, no backend. Deployable as-is on GitHub Pages.

## Design language

**Aurora Cyber** — a dark-first glassmorphic system with animated aurora-gradient accents (violet → cyan → pink), soft glass surfaces, neon glow shadows, and a light-mode counterpart. Tokens live in [assets/css/variables.css](assets/css/variables.css).

## Project structure

```
index.html              Homepage
games/
  game.html             Game page template (structure only)
  game.js               Game page bootstrap
components/             Reserved for future shared HTML partials
data/
  games.json            Game catalog (id, name, category, rating, etc.)
assets/
  css/                  variables → base → components → animations → main.css
  js/                   ES modules: theme, nav, search, game-card, categories, icons, main
  icons/                favicon.svg
  images/               (reserved for real game thumbnails/art)
  fonts/                (reserved; currently loaded via Google Fonts CDN)
manifest.json           Web app manifest
robots.txt / sitemap.xml
```

## Adding a game

Append an entry to `data/games.json`:

```json
{ "id": "your-game-id", "name": "Your Game", "category": "Action", "rating": 4.5, "plays": "10K", "thumbnail": "assets/images/games/your-game.svg", "featured": false, "trending": false, "new": true, "accent": "#7c5cff" }
```

Cards, filters, search, and the game detail page all read from this single file — no other code changes needed. Thumbnails are rendered as CSS gradients using `accent` plus a category icon (see `assets/js/icons.js`) so the platform scales to thousands of games without needing individual art assets up front; swap in real thumbnail images later by rendering `<img src="{thumbnail}">` in `game-card.js`.

## Running locally

Any static file server works (ES modules require http:// not file://):

```
npx serve .
# or
python -m http.server 8000
```

## Milestone status

- [x] Milestone 1 — Folder structure + complete homepage
- [ ] Milestone 2 — Game page player integration
- [ ] Milestone 3 — Additional categories/pages as game count scales
