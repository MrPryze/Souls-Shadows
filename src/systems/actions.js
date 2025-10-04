import { state, patch, addLog, addPlayerLog, spendEnergy, addSoul } from '../core/state.js';
import { endDay } from './day.js';
import { showDialogue } from '../story/inkRunner.js';

export function handle(type){
  if (state.lock) { addLog(`Busy (${state.lock}).`); return; }

  switch(type){
    case 'channel': {
      if (state.energy <= 0) { addLog('Exhausted.'); return; }
      const gained = addSoul(1);
      spendEnergy(1);
      if (gained){
        addPlayerLog(`You pull at the thread. Soul ${state.soul}/${state.soulCap}.`);
        if (!state.flags.cageBroken && state.soul >= 3){
          patch({ flags:{...state.flags, cageBroken:true} });
          addPlayerLog('The stone cage cracks and collapses.');
        }
      } else {
        addPlayerLog('You strain, but hit your limit for now.');
      }
      break;
    }

    case 'explore': {
      if (!state.flags.cageBroken) { addPlayerLog('The cage still holds.'); return; }
      if (state.energy < 3) { addPlayerLog('Too tired to explore. (3 energy)'); return; }
      spendEnergy(3);
      const order = ['cell','tunnel','alcove','pool','junction'];
      const idx = order.indexOf(state.room);
      const next = order[(idx+1)%order.length];
      patch({ room: next });
      addPlayerLog(`You explore the ${next}.`);

      if (state.day>=3 && !state.flags.ratDone){
        showDialogue('/src/data/dialogues/rat_intro.json', {
          onChoice:(k)=>{ 
            if (k==='eat')   addPlayerLog('You eat the rat. It is vile. It is life.');
            if (k==='leave') addPlayerLog('You leave the corpse. Mercy comes late and costs you.');
            patch({ flags:{...state.flags, ratDone:true} });
          }
        });
      }
      break;
    }

    case 'sleep': {
      endDay();
      addPlayerLog(`You sleep. Day ${state.day-1} → ${state.day}.`);
      break;
    }
  }
}
