/**
 * Collections — pure derivation functions that turn the flat games list
 * into the dynamic shelves shown across the site. Single source of truth
 * so home, category, and search views never disagree on what "Trending"
 * or "Most Played" means.
 */

export function getTrending(games) {
  return games.filter((g) => g.trending);
}

export function getNewReleases(games) {
  return [...games.filter((g) => g.new)].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
}

export function getEditorsPicks(games) {
  return games.filter((g) => g.editorsPick);
}

export function getMostPlayed(games, limit = 12) {
  return [...games].sort((a, b) => (b.playsCount || 0) - (a.playsCount || 0)).slice(0, limit);
}

export function getHighestRated(games, limit = 12) {
  return [...games].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function getFeatured(games, limit = 4) {
  const featured = games.filter((g) => g.featured);
  return featured.length ? featured.slice(0, limit) : games.slice(0, limit);
}

export function getSimilarGames(game, games, limit = 4) {
  const sameCategory = games.filter((g) => g.category === game.category && g.id !== game.id);
  const bySharedTag = games.filter(
    (g) => g.id !== game.id && !sameCategory.includes(g) && g.tags?.some((t) => game.tags?.includes(t))
  );
  return [...sameCategory, ...bySharedTag].slice(0, limit);
}

export const COLLECTIONS = [
  { key: 'trending', label: 'Trending Games', icon: 'fire', get: getTrending },
  { key: 'new', label: 'New Releases', icon: 'sparkle', get: getNewReleases },
  { key: 'editors', label: "Editor's Picks", icon: 'star', get: getEditorsPicks },
  { key: 'most-played', label: 'Most Played', icon: 'gamepad', get: getMostPlayed },
  { key: 'top-rated', label: 'Highest Rated', icon: 'star', get: getHighestRated }
];
