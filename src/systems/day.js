import { state, patch, addLog } from '../core/state.js';
import { tickEffects } from '../systems/effects.js';

export function endDay(){
  const hungerNext = Math.min(100, state.hunger + (state.day >= 3 ? 1 : 0));
  const healthNext = hungerNext >= 5 ? Math.max(0, state.health - 1) : state.health;
  tickEffects();
  patch({
    day: state.day + 1,
    hunger: hungerNext,
    health: healthNext,
    energyMax: 10,     // tweak later; statuses can modify this
    energy: 10
  });
  addLog(`You rest. Day ${state.day} → ${state.day+1}.`);
}
