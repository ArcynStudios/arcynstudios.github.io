/**
 * Icons — centralized inline SVG path data.
 * Kept as raw path strings so cards/categories can inject them without
 * fetching external files (fast, GitHub Pages friendly, no HTTP requests).
 */
export const ICONS = {
  gamepad: '<path d="M6 11h4M8 9v4M15.5 11h.01M18 9.5h.01" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.32 5H6.68a4 4 0 0 0-3.93 3.27l-.7 3.85A3.5 3.5 0 0 0 5.5 16.5c.86 0 1.68-.34 2.29-.95L9.5 13.8a2 2 0 0 1 1.4-.58h2.2a2 2 0 0 1 1.4.58l1.71 1.75a3.24 3.24 0 0 0 5.6-2.21c0-.24-.02-.48-.07-.71l-.7-3.85A4 4 0 0 0 17.32 5Z" stroke-linecap="round" stroke-linejoin="round"/>',
  racing: '<path d="M4 17h16M5 17l1.6-6.4A2 2 0 0 1 8.54 9h6.92a2 2 0 0 1 1.94 1.6L19 17M8 13h8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
  shooter: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke-linecap="round"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  strategy: '<path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" stroke-linejoin="round"/><path d="M12 12 3 7M12 12l9-5M12 12v10" stroke-linejoin="round"/>',
  action: '<path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" stroke-linejoin="round"/>',
  puzzle: '<path d="M9 3h4a1 1 0 0 1 1 1v2.2a1.8 1.8 0 1 0 0 3.6V12a1 1 0 0 1-1 1h-2.2a1.8 1.8 0 1 0-3.6 0H5a1 1 0 0 1-1-1V9.2a1.8 1.8 0 1 0 0-3.6V4a1 1 0 0 1 1-1h4Z" stroke-linejoin="round"/>',
  arcade: '<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M8 3h8l-1 4H9l-1-4Z" stroke-linejoin="round"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/>',
  fighting: '<path d="M4 12h4l2-4 3 8 2-4h5" stroke-linecap="round" stroke-linejoin="round"/>',
  simulation: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" stroke-linecap="round" stroke-linejoin="round"/>',
  adventure: '<path d="M12 3 3 8.5 12 14l9-5.5L12 3Z" stroke-linejoin="round"/><path d="M3 15.5 12 21l9-5.5M3 12l9 5.5L21 12" stroke-linejoin="round"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-linecap="round"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" stroke-linejoin="round"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/>',
  close: '<path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/>',
  play: '<path d="M7 5v14l12-7L7 5Z" stroke-linejoin="round"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z" stroke-linejoin="round"/>',
  fire: '<path d="M12 2s5 4.5 5 9.5a5 5 0 0 1-10 0C7 8 9 6 9 6s.5 2 1.5 2.5C10 6 12 2 12 2Z" stroke-linejoin="round"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" stroke-linecap="round"/>',
  discord: '<path d="M8 5.5C6.5 6 5.3 6.7 4.3 7.6 2.6 11 2 14.3 2.3 17.6c1.6 1.2 3.1 1.9 4.6 2.4l.7-1.4c-.7-.3-1.4-.6-2-1 .2-.1.3-.3.5-.4 3.5 1.7 7.3 1.7 10.8 0 .2.1.3.3.5.4-.6.4-1.3.7-2 1l.7 1.4c1.5-.5 3-1.2 4.6-2.4.4-4-.7-7.2-2.6-10-1-.9-2.2-1.6-3.6-2.1l-.6 1.3c-2-.4-4-.4-6 0L8 5.5Z" stroke-linejoin="round"/><circle cx="9" cy="13" r="1.2"/><circle cx="15" cy="13" r="1.2"/>',
  twitter: '<path d="M21 5.3a8 8 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.2 8.2 0 0 1-2.6 1 4.1 4.1 0 0 0-7 3.8A11.7 11.7 0 0 1 2.3 4.2a4.2 4.2 0 0 0 1.3 5.5 4 4 0 0 1-1.9-.5v.1a4.1 4.1 0 0 0 3.3 4 4.2 4.2 0 0 1-1.9.1 4.1 4.1 0 0 0 3.9 2.9A8.3 8.3 0 0 1 1 18a11.7 11.7 0 0 0 6.3 1.9c7.5 0 11.7-6.3 11.7-11.7v-.5A8.4 8.4 0 0 0 21 5.3Z" stroke-linejoin="round"/>',
  youtube: '<rect x="2" y="5.5" width="20" height="13" rx="3"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/>',
  chevronRight: '<path d="m9 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>',
  heart: '<path d="M12 21s-7.5-4.6-10-9.2C.6 8.4 2.2 5 5.6 5 8 5 9.6 6.4 12 9c2.4-2.6 4-4 6.4-4 3.4 0 5 3.4 3.6 6.8C19.5 16.4 12 21 12 21Z" stroke-linejoin="round"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.3 10.7 7.4-4.2M8.3 13.3l7.4 4.2" stroke-linecap="round"/>',
  fullscreen: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" stroke-linecap="round" stroke-linejoin="round"/>'
};

export const CATEGORY_ICON_MAP = {
  Racing: 'racing',
  Shooter: 'shooter',
  Strategy: 'strategy',
  Action: 'action',
  Puzzle: 'puzzle',
  Arcade: 'arcade',
  Fighting: 'fighting',
  Simulation: 'simulation',
  Adventure: 'adventure'
};

export function iconMarkup(name, extraAttrs = '') {
  const path = ICONS[name] || ICONS.gamepad;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" ${extraAttrs}>${path}</svg>`;
}
