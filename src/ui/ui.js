import { state, onChange } from '../core/state.js';
import { showDialogue } from '../story/inkRunner.js';

const $devLog  = document.querySelector('#panel-dev-log');
const $toast   = document.getElementById('player-log-toast');
const $overlay = document.getElementById('player-log-overlay');
const $olist   = document.getElementById('player-log-list');

// Intro mode
document.body.classList.add('intro');
showDialogue('/src/data/dialogues/intro.json', {
  onEnd: ()=>{
    state.flags.introDone = true;
    document.body.classList.remove('intro');
    renderAll();
  }
});

function renderMain(){
  // Dialogue panel is rendered by inkRunner.js into #main-dialogue, so we do the rest:
  const status = document.getElementById('main-status');
  const actions = document.getElementById('main-actions');
  const ticker = document.getElementById('main-ticker');

  // Ticker (latest meaningful event)
  ticker.textContent = state.now || '…';

  // Badges
  status.innerHTML = `
    <span class="badge">Day ${state.day}</span>
    <span class="badge">Energy ${state.energy}/${state.energyMax}</span>
    <span class="badge">Soul ${state.soul}/${state.soulCap}</span>
    <span class="badge">Hunger ${state.hunger}</span>
    <span class="badge">Health ${state.health}</span>
    <span class="badge">Area ${state.area}</span>
    <span class="badge">Room ${state.room}</span>
    ${state.lock ? `<span class="badge">Lock ${state.lock}</span>`:''}
  `;

  // Actions inline
  const locked = !!state.lock;
  const canAct = state.energy > 0 && state.flags.introDone && !locked;
  const canExplore = state.flags.cageBroken && state.energy >= 3 && !locked;

  actions.innerHTML = `
    <button id="act-channel" ${!canAct ? 'disabled' : ''} title="${locked?'Interaction in progress':''}">Channel Soul</button>
    <button id="act-explore" ${!canExplore ? 'disabled' : ''} title="${locked?'Interaction in progress':''}">Explore (3)</button>
    <button id="act-sleep"   ${locked ? 'disabled' : ''} title="${locked?'Interaction in progress':''}">Sleep</button>
  `;

  document.getElementById('act-channel')?.addEventListener('click', ()=> dispatch('channel'));
  document.getElementById('act-explore')?.addEventListener('click', ()=> dispatch('explore'));
  document.getElementById('act-sleep')  ?.addEventListener('click', ()=> dispatch('sleep'));
}

function renderDevLog(){
  $devLog.innerHTML = `<h2>Dev Log</h2><div class="log">${state.log.map(l=>`• ${l}`).join('\n')}</div>`;
}

function renderPlayerLog(){
  const last = state.pLog[0] || '';
  if (!last){ $toast.classList.add('hidden'); return; }
  $toast.textContent = last.length>100 ? (last.slice(0,100)+'…') : last;
  $toast.classList.remove('hidden');
  $olist.innerHTML = state.pLog.map(l=>`• ${l}`).join('\n');
}

function renderAll(){ renderMain(); renderDevLog(); renderPlayerLog(); }
onChange(renderAll);
renderAll();

// Chronicle overlay
$toast.addEventListener('click', ()=> $overlay.classList.remove('hidden'));
$overlay.addEventListener('click', (e)=>{ if (e.target=== $overlay) $overlay.classList.add('hidden'); });

function dispatch(type){
  import('../systems/actions.js').then(m => m.handle(type));
}
