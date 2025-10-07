import { SOUL, FLAGS } from './constants.js';
import { save, load } from './save.js';

export const state = (()=>{
  const restored = load();
  return {
    _version: 1,
    day: restored?.day ?? 1,
    energy: restored?.energy ?? 10,
    energyMax: restored?.energyMax ?? 10,
    soul: restored?.soul ?? 0,
    soulCap: restored?.soulCap ?? SOUL.CAP_START,
    hunger: restored?.hunger ?? 0,
    health: restored?.health ?? 10,
    area: restored?.area ?? 'cave',
    room: restored?.room ?? 'cell',
    flags: {
      [FLAGS.INTRO_DONE]: restored?.flags?.[FLAGS.INTRO_DONE] ?? false,
      [FLAGS.FIRST_ACTION_DONE]: restored?.flags?.[FLAGS.FIRST_ACTION_DONE] ?? false,
      [FLAGS.CAGE_BROKEN]: restored?.flags?.[FLAGS.CAGE_BROKEN] ?? false,
      [FLAGS.RAT_DONE]: restored?.flags?.[FLAGS.RAT_DONE] ?? false,
    },
    inv: restored?.inv ?? {},
    log: restored?.log ?? [],
    pLog: restored?.pLog ?? [],
    now: restored?.now ?? '…',
    lock: restored?.lock ?? null,
    ui: restored?.ui ?? { justSummarized:false },
  };
})();

const listeners = new Set();
export function onChange(fn){ listeners.add(fn); }
export function emit(){
  listeners.forEach(fn => fn());
  // autosave (throttled)
  clearTimeout(emit._t);
  emit._t = setTimeout(()=> save(state), 200);
}

// general mutation helpers
export function setNow(msg){ state.now = msg; emit(); }
export function addLog(msg){ state.log.unshift(msg); cap(state.log, 200); emit(); }
export function addPlayerLog(msg){ state.pLog.push(msg); cap(state.pLog, 400); emit(); }
export function clearPLog(){ state.pLog = []; emit(); }
export function setFlag(key, val){ state.flags[key] = val; emit(); }
export function patch(obj){ Object.assign(state, obj); emit(); }

export function lockUI(kind){ state.lock = kind; emit(); }
export function unlockUI(){ if (state.lock!=='gameover') { state.lock = null; emit(); } }

function cap(arr, n){ if (arr.length > n) arr.splice(0, arr.length - n); }

// resource helpers
export function spendEnergy(n){ state.energy = Math.max(0, state.energy - n); emit(); }
export function gainSoul(n){
  const before = state.soul;
  state.soul = Math.min(state.soulCap, state.soul + n);
  emit();
  return state.soul > before; // true if actually gained
}

// one-shot hide logic if you re-enable later
export function markSummarizedOnce(){ state.ui.justSummarized = true; emit(); }
export function clearJustSummarized(){ state.ui.justSummarized = false; emit(); }
