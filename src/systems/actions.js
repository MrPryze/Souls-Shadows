import { state, patch, addLog, addPlayerLog, spendEnergy, addSoul, markFirstAction, setFlag } from '../core/state.js';
import { endDay } from './day.js';
import { playSnippet, playDialog, makeKnot } from '../story/inkBook.js';
import { knotForSnippet } from '../story/snippetRouter.js';
import { rollEncounter, nextRoom, isCaveEntrance } from '../data/world.js';

export function handle(type){
  if (state.lock) { addLog(`Busy (${state.lock}).`); return; }
  if (['channel','explore','sleep','exit_cave','drink_pool'].includes(type)) markFirstAction();
  console.log("handle: "+type);
  switch(type){
    case 'channel': {
      if (state.energy<=0){ addPlayerLog('Too tired.'); return; }
      spendEnergy(1);

      // your snippet + flavor/summary as before...
      // actions.js (inside 'channel')
      if (!state.flags.cageBroken && state.soul >= 5){
        setFlag('cageBroken', true);
        addPlayerLog('Stone splits. The cage collapses.');
      }
      
      const gained = addSoul(1);
      if (!state.flags.cageBroken && state.soul >= 5){
        setFlag('cageBroken', true);                    // ← use setter rather than patch
        addPlayerLog('Stone splits. The cage collapses.');
      }
      if (!gained) addPlayerLog('You strain, but nothing more comes.');
      break;
    }

    case 'sleep': {
      endDay();
      playSnippet(state.area, knotForSnippet('sleep', state.room), {
        onText: (t)=> addPlayerLog(t)
      });
      addPlayerLog(`You sleep. Day ${state.day-1} → ${state.day}.`);
      break;
    }

    case 'explore': {
      if (!state.flags.cageBroken){ addPlayerLog('You’re still caged.'); return; }
      if (state.energy<3){ addPlayerLog('Too tired to explore. (3 energy)'); return; }
      spendEnergy(3);
      const next = nextRoom(state);
      patch({ room: next });
      addPlayerLog(`You move to the ${next}.`);
      if (isCaveEntrance(state)){
        addPlayerLog('A draft and daylight. (Exit Cave is available.)');
      }
      const enc = rollEncounter(state);
      if (enc==='rat'){
        // knot name inside cave.json
        playDialog(state.area, 'dlg_rat_intro', {
          onChoice:(k)=>{
            if (k==='eat')   addPlayerLog('You eat the rat. It is vile. It is life.');
            if (k==='leave') addPlayerLog('You leave the corpse. Mercy comes late and costs you.');
            patch({ flags:{...state.flags, ratDone:true} });
          }
        });
      }
      break;
    }
    case 'drink_pool': {
      console.log('action drink_pool start');
      if (state.area === 'cave' && state.room === 'pool') {
        playDialog('cave', 'dlg_pool_drink', {
          onChoice: (key) => {
            console.log('choice key:', key); // <— this will show what Ink is sending back
            if (!key) {
              addPlayerLog('DEBUG: Missing key tag in Ink choice!');
              return;
            }
            console.log(key);
            
            console.log(key.toLowerCase());
            
            console.log(key.toLowerCase().includes('drink'));
            console.log(key.includes('drink'));
            if (key.toLowerCase().includes('drink')) {
              console.log("game over");
              gameOver(
                'You swallow the humming water. ' +
                'A heat blooms behind your eyes. ' +
                'The dark eats what you are.'
              );
              return;
            }

            if (key === 'leave') {
              addPlayerLog('You step back from the water. It keeps singing.');
              return;
            }

            addPlayerLog(`Unhandled pool key: ${key}`);
          },
        });
      }
      break;
    }
    case 'exit_cave': {
      patch({ area:'forest_edge', room:'clearing' });
      playDialog('forest_edge','dlg_arrive',{ onChoice:(k)=> addPlayerLog('The forest waits.') });
    }
  }
}

// actions.js
function gameOver(msg) {
  addPlayerLog(msg || 'You die.');
  state.lock = 'gameover';

  // Remove any existing modal
  const existing = document.getElementById('modal-gameover');
  if (existing) existing.remove();

  // Build modal
  const wrap = document.createElement('div');
  wrap.id = 'modal-gameover';
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="modal-card">
      <h3>❖ You Died</h3>
      <div style="white-space:pre-wrap; margin-top:6px">${msg || 'You die.'}</div>
      <div class="choices" style="margin-top:12px">
        <button id="btn-restart">Restart</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  document.getElementById('btn-restart').onclick = () => location.reload();
}

// src/systems/actions.js (top-level helpers)
function narrate(flavor, {summary}={}){
  document.getElementById('main-dialogue').innerHTML = `<div>${flavor}</div>`;
  setNow(flavor);
  if (summary) addPlayerLog(summary);
}