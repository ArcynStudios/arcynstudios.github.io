/**
 * Arcyn Studios — Service Worker
 * Caches the static shell for offline use and network-first for data.
 * Works on GitHub Pages (subdirectory) and root domain deployments.
 */
const CACHE_NAME = 'arcyn-shell-v1';

function getBasePath() {
  const scope = self.registration.scope;
  const url = new URL(scope);
  const path = url.pathname;
  const basePath = path.slice(0, path.lastIndexOf('/') + 1);
  return basePath;
}

const BASE_PATH = getBasePath();

function joinPath(...parts) {
  return parts.map((p) => p.replace(/^\/+|\/+$/g, '')).join('/');
}

function toAbsolute(path) {
  return new URL(joinPath(BASE_PATH, path), self.location.origin).href;
}

function toRelative(url) {
  const u = new URL(url);
  const base = new URL(BASE_PATH, self.location.origin);
  if (!u.pathname.startsWith(base.pathname)) return url;
  return u.pathname.slice(base.pathname.length) + u.search + u.hash;
}

const STATIC_ASSETS_RELATIVE = [
  '',
  'index.html',
  '404.html',
  'offline.html',
  'assets/css/main.css',
  'assets/css/game-page.css',
  'assets/js/main.js',
  'assets/js/main.js.map',
  'assets/js/game-card.js',
  'assets/js/search.js',
  'assets/js/collections.js',
  'assets/js/favorites.js',
  'assets/js/toast.js',
  'assets/js/theme.js',
  'assets/js/nav.js',
  'assets/js/categories.js',
  'assets/js/icons.js',
  'assets/js/install-prompt.js',
  'games/game.html',
  'games/game.js',
  'categories/category.html',
  'categories/category.js',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  'cookies.html',
  'faq.html',
  'changelog.html',
  'manifest.json',
  'sitemap.xml',
  'assets/icons/favicon.svg',
  'assets/images/social-share.svg',
];

const DATA_URLS_RELATIVE = [
  'data/games.json',
];

const IMAGE_EXTS = /\.(svg|jpg|jpeg|png|gif|webp|avif)$/i;

const STATIC_ASSETS = STATIC_ASSETS_RELATIVE.map(toAbsolute);
const DATA_URLS = DATA_URLS_RELATIVE.map(toAbsolute);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  const requestPath = toRelative(request.url);

  if (DATA_URLS_RELATIVE.some((u) => requestPath === u || requestPath.endsWith('/' + u))) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (IMAGE_EXTS.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  try {
    const network = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, network.clone());
    return network;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((network) => {
    cache.put(request, network.clone());
    return network;
  }).catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});