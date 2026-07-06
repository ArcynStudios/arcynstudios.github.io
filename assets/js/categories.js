/**
 * Static category metadata (icon, accent, banner description). Counts are
 * computed at render time from the live games dataset so they never drift.
 */
export const CATEGORIES = [
  {
    name: 'Action',
    icon: 'action',
    color: '#7c5cff',
    description: 'Fast reflexes, bigger stakes. Combat-driven games built for players who think on their feet.'
  },
  {
    name: 'Racing',
    icon: 'racing',
    color: '#ff5c8a',
    description: 'Grip the wheel and chase the podium — drifting physics, rival AI, and tracks worth mastering.'
  },
  {
    name: 'Strategy',
    icon: 'strategy',
    color: '#22d3ee',
    description: 'Command, plan, and out-think the opposition. Deep systems for players who love a good long game.'
  },
  {
    name: 'Puzzle',
    icon: 'puzzle',
    color: '#ffb444',
    description: 'Clever mechanics and satisfying "aha" moments. Easy to learn, deceptively hard to put down.'
  },
  {
    name: 'Shooter',
    icon: 'shooter',
    color: '#7c5cff',
    description: 'Precision aim and split-second decisions. Competitive arenas built for the top of the leaderboard.'
  },
  {
    name: 'Arcade',
    icon: 'arcade',
    color: '#22d3ee',
    description: 'Classic arcade energy, remixed for the browser. Tight controls, instant restarts, endless high scores.'
  },
  {
    name: 'Fighting',
    icon: 'fighting',
    color: '#ff5c8a',
    description: 'Technical combos and close, punishing duels. Built for players who study every frame.'
  },
  {
    name: 'Simulation',
    icon: 'simulation',
    color: '#ffb444',
    description: 'Build, manage, and optimize at your own pace. Deep sims for patient planners.'
  },
  {
    name: 'Adventure',
    icon: 'adventure',
    color: '#7c5cff',
    description: 'Hand-crafted worlds full of secrets. Every corner rewards curiosity.'
  }
];

export function getCategory(name) {
  return CATEGORIES.find((c) => c.name.toLowerCase() === String(name).toLowerCase());
}
