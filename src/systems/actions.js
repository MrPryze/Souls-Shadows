import { state, patch, addLog, addPlayerLog, spendEnergy, addSoul } from '../core/state.js';
import { endDay } from './day.js';
import { showDialogue } from '../story/inkRunner.js';

export function handle(type){
  if (state.lock) { addLog(`Busy (${state.lock}).`); return; }
  switch(type){
    case 'channel': {
      if (state.energy <= 0) { addLog('You are exhausted.'); return; }
      const gained = addSoul(1);
      spendEnergy(1);
      if (gained){
        addLog(`You pull at the thread. Soul ${state.soul}/${state.soulCap}.`);
        if (!state.flags.cageBroken && state.soul >= 3){
          patch({ flags:{...state.flags, cageBroken:true} });
          addLog('The stone cage cracks and collapses.');
        }
      } else {
        addLog('No matter how hard you focus, you seem to have hit your limit for now.');
      }
      break;
    }

    case 'explore': {
      if (!state.flags.cageBroken) { addLog('The cage still holds.'); return; }
      if (state.energy < 3) { addLog('Too tired to explore. (3 energy)'); return; }
      spendEnergy(3);
      addLog('You feel your way along wet rock.');
      const order = ['cell','tunnel','alcove','pool','junction'];
      const idx = order.indexOf(state.room);
      patch({ room: order[(idx+1)%order.length] });

      if (state.day >= 3 && !state.flags.ratDone){
        showDialogue('/src/data/dialogues/rat_intro.json', {
          onChoice:(k)=>{ 
            if (k==='eat')   addLog('You eat the rat. It is vile. It is life.');
            if (k==='leave') addLog('You leave the corpse. Mercy comes late and costs you.');
            patch({ flags:{...state.flags, ratDone:true} });
          }
        });
      }
      break;
    }

    case 'sleep': { endDay(); break; }

    case 'talk_rat': {
      showDialogue('/src/data/dialogues/rat_intro.json', {
        onChoice:(k)=> addLog(`You chose: ${k}`)
      });
      break;
    }
  }
  
// when cage breaks:
addPlayerLog('The stone cage cracks and collapses.');

// when exploring:
addPlayerLog(`You explore the ${state.room}.`);
}
