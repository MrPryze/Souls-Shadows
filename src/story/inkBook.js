const CACHE = new Map(); // area -> parsed JSON

async function loadArea(area){
  if (CACHE.has(area)) return CACHE.get(area);
  const res = await fetch(`/src/data/areas/${area}.json`, { cache:'no-store' });
  if (!res.ok) throw new Error(`Missing area JSON: ${area}`);
  const data = await res.json();
  CACHE.set(area, data);
  return data;
}

function newStoryFrom(data){
  const { Story } = window.inkjs || {};
  if (!Story) throw new Error('inkjs missing');
  return new Story(data);
}

// ----- public API -----

// one-off narration; writes to main dialogue and Chronicle (no choices expected)
export async function playSnippet(area, knot, {onText} = {}){
  const data = await loadArea(area);
  const s = newStoryFrom(data);
  try { s.ChoosePathString(knot); } catch { return; }
  let text = '';
  while (s.canContinue) text += s.Continue();
  text = text.trim();
  if (text){
    onText?.(text);
  }
}

// dialog with choices rendered by inkRunner
export async function playDialog(area, knot, opts){
  const data = await loadArea(area);
  const s = newStoryFrom(data);
  try { s.ChoosePathString(knot); } catch { return false; }
  const { runExternalStory } = await import('./inkRunner.js');
  // hand the prepared Story instance to the runner
  runExternalStory(s, opts);
  return true;
}

// helper to build knot names with fallbacks, e.g. "snip_channel_pool" -> "snip_channel_default"
export function makeKnot(base, node){
  return `${base}_${node}`;
}
