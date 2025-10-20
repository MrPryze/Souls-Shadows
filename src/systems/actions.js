import { state, patch, addLog, addPlayerLog, spendEnergy,setNow, gainSoul, setFlag } from '../core/state.js';
import { endDay } from './day.js';
import { playSnippet, playDialog, makeKnot } from '../story/inkBook.js';
import { COST, SOUL, FLAGS } from '../core/constants.js';

export function handle(type){
  if (state.lock === 'gameover') return;

  switch(type){
    case 'channel': {
      if (state.energy <= 0){ addPlayerLog('Too tired.'); return; }
      spendEnergy(COST.CHANNEL);

      // ask area for flavor text
      playSnippet(state.area, `snip_channel_${state.room}`, {
        onText: (flavor)=> { setNow(flavor); addPlayerLog(`Channel (+1 Soul). ${state.soul+1}/${state.soulCap}`); }
      });

      const gained = gainSoul(1);
      if (!gained) addPlayerLog('You strain, but nothing more comes.');

      if (!state.flags[FLAGS.CAGE_BROKEN] && state.soul >= SOUL.CAGE_BREAK_AT){
        setFlag(FLAGS.CAGE_BROKEN, true);
        addPlayerLog('Stone splits. The cage collapses.');
      }
      break;
    }

    case 'explore': {
      if (state.energy < COST.EXPLORE){ addPlayerLog('Too tired to explore.'); return; }
      spendEnergy(COST.EXPLORE);

      // TODO: your room progression logic here
      addPlayerLog('You feel your way forward into the dark.');
      setNow('Your hands find wet stone and a current of cold air.');
      break;
    }

    case 'sleep': {
      // day.js probably adjusts hunger/health; keep your logic
      patch({ day: state.day + 1, energy: state.energyMax });
      addPlayerLog(`You sleep. Day ${state.day-1} → ${state.day}.`);
      setNow('Sleep comes like stone sinking in water.');
      break;
    }

    case 'exit_cave': {
      patch({ area: 'forest_edge', room: 'clearing' });
      addPlayerLog('You step into the trees. The air is green and cool.');
      setNow('The forest holds its breath.');
      break;
    }

    case 'drink_pool': {
      playDialog('cave','dlg_pool_drink', {
        onChoice: (key)=>{
          const k = (key||'').toLowerCase();
          if (k.includes('drink')){
            // assume your gameOver() lives elsewhere; call it
            import('./gameover.js').then(m=>{
              m.gameOver('You swallow the humming water.\nA heat blooms behind your eyes.\nThe dark eats what you are.');
            });
          } else {
            addPlayerLog('You step back from the water. It keeps singing.');
          }
        }
      });
      break;
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

