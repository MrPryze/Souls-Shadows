export const SNIPPETS = {
  // action -> area -> node -> file
  channel: {
    cave: {
      pool: '/src/data/snippets/channel_pool.json',
      '*':  '/src/data/snippets/channel_cave.json'
    },
    '*': '/src/data/snippets/channel_generic.json'
  },
  sleep: {
    cave: '/src/data/snippets/sleep_cave.json',
    '*':   '/src/data/snippets/sleep_generic.json'
  }
};

export function pickSnippet(action, area, node){
  const a = SNIPPETS[action];
  if (!a) return null;
  const byArea = a[area] ?? a['*'];
  if (!byArea) return null;
  if (typeof byArea === 'string') return byArea; // whole area uses one file
  return byArea[node] ?? byArea['*'] ?? null;
}

// Build knot name "snip_{action}_{node}" with fallbacks to "snip_{action}_default"
export function knotForSnippet(action, node){
  return `snip_${action}_${node || 'default'}`;
}