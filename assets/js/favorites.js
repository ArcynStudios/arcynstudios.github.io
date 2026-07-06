/**
 * Favorites — localStorage-backed store shared by game cards and the
 * game page. Simple pub-sub so any rendered heart button stays in sync
 * the moment a favorite is toggled anywhere on the page.
 */
const STORAGE_KEY = 'arcyn-favorites';
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* localStorage unavailable (private mode / quota) — favorites just won't persist */
  }
  listeners.forEach((fn) => fn(ids));
}

export function getFavorites() {
  return read();
}

export function isFavorite(id) {
  return read().includes(id);
}

export function toggleFavorite(id) {
  const ids = read();
  const index = ids.indexOf(id);
  if (index === -1) {
    ids.push(id);
  } else {
    ids.splice(index, 1);
  }
  write(ids);
  return index === -1; // true if it was just added
}

export function onFavoritesChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
