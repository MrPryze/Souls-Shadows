import { save } from '/src/core/save.js';
export const state = {
  day:1, energy:10, energyMax:10,
  soul:0, soulCap:15, hunger:0, health:10,
  area:'cave', room:'cell',
  flags:{ introDone:false, firstActionDone:false, cageBroken:false, ratDone:false },
  inv:{},
  log:[],      // dev
  pLog:[],     // player chronicle
  now: '…',    // 👈 latest “what just happened”
  lock: null,
  pLog: [],
  now: '…',      // what the main log bar shows when not in dialogue
  
  lock: null,
  now: '…',
  ui: { justSummarized: false },
  flags: { introDone:false, firstActionDone:false, cageBroken:false, ratDone:false },
  nowStamp: 0,              // increments when we change “Now”
  lastChronicleStamp: 0,    // increments when we add to Chronicle
};

const listeners = new Set();
export function onChange(fn){ listeners.add(fn); }
export function emit(){ listeners.forEach(fn=>fn()); save(state);}
export function setFlag(k, v){ state.flags[k] = v; emit(); }
export function setNow(msg){ state.now = msg; emit(); }
export function markSummarizedOnce(){ state.ui.justSummarized = true; emit(); }
export function clearJustSummarized(){ state.ui.justSummarized = false; emit(); }

export function addPlayerLog(msg){
  state.pLog.unshift(msg);
  if (state.pLog.length > 200) state.pLog.length = 200;
  state.lastChronicleStamp = state.nowStamp; // tie the memory to the current event
  emit();
}
export function markFirstAction(){
  if (!state.flags.firstActionDone){
    state.flags.firstActionDone = true;
    emit();
  }
}

export function lockUI(reason){ state.lock = reason || 'busy'; emit(); }
export function unlockUI(){ state.lock = null; emit(); }


const subs = new Set();
export function get(k){ return state[k]; }
export function set(k,v){ state[k]=v; emit(); }
export function patch(obj){ Object.assign(state, obj); emit(); }

// helpers
export function addLog(msg){
  state.log.unshift(msg);
  if (state.log.length>200) state.log.length=200;
  emit();
}
export function spendEnergy(n){ state.energy = Math.max(0, state.energy - n); emit(); }
export function addSoul(n){
  const before = state.soul;
  state.soul = Math.min(state.soulCap, before + n);
  emit();
  return state.soul > before;
}

window.GameState = { state, get, set, patch }; // debugging in console


