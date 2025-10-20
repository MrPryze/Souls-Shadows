import { state } from './state.js';
import { COST, FLAGS } from './constants.js';

export function inDialogue(){ return state.lock === 'dialogue'; }
export function inGameOver(){ return state.lock === 'gameover'; }
export function canAct(){ return state.flags[FLAGS.INTRO_DONE] && state.energy > 0; }
export function canExplore(){ return state.flags[FLAGS.CAGE_BROKEN] && state.energy >= COST.EXPLORE && !inDialogue() && !inGameOver(); }
export function atCaveEntrance(){ return state.area==='cave' && state.room==='entrance'; }
export function atPool(){ return state.area==='cave' && state.room==='pool'; }
