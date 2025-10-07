// All tweakables live here. One place to balance the game.

export const AREAS = {
  CAVE: 'cave',
  FOREST_EDGE: 'forest_edge',
};

export const ROOMS = {
  CAVE: {
    CELL: 'cell',
    ENTRANCE: 'entrance',
    POOL: 'pool',
  },
  FOREST_EDGE: {
    CLEARING: 'clearing',
    HOLLOW: 'hollow',
  }
};

export const COST = {
  CHANNEL: 1,
  EXPLORE: 3,
  SLEEP: 0,
};

export const SOUL = {
  CAP_START: 15,
  CAGE_BREAK_AT: 5,
};

export const UI = {
  VERSION: 'ui-2025-10-07', // bump when you change area JSON caching
};

// tiny helper to avoid magic strings in code
export const FLAGS = {
  INTRO_DONE: 'introDone',
  FIRST_ACTION_DONE: 'firstActionDone',
  CAGE_BROKEN: 'cageBroken',
  RAT_DONE: 'ratDone',
};
