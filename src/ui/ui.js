import { state, onChange } from '../core/state.js';
import { showDialogue } from '../story/inkRunner.js';

// DOM refs
const $status  = document.querySelector('#panel-status');
const $actions = document.querySelector('#panel-actions');
const $devLog  = document.querySelector('#panel-dev-log');

const $toast   = document.getElementById('player-log-toast');
const $overlay = document.getElementById('player-log-overlay');
const $olist   = document.getElementById('player-log-list');

// --------- initial intro ----------
document.body.classList.add('intro');
showDialogue('/src/data/dialogues/intro.json', {
  onEnd: ()=>{
    // flip intro flag, reveal UI
    state.flags.introDone = true;
    document.body.classList.remove('intro');
    // seed first player log line
    if (state.pLog.length===0) state.pLog.unshift('You wake in a lightless cave.');
    renderAll();
  }
});

// --------- renderers ---------------
function renderStatus(){
  $status.innerHTML = `
    <h2>Status</h2>
    <div class="row">
      <span class="badge">Day ${state.day}</span>
      <span class="badge">Energy ${state.energy}/${state.energyMax}</span>
      <span class="badge">Soul ${state.soul}/${state.soulCap}</span>
      <span class="badge">Hunger ${state.hunger}</span>
      <span class="badge">Health ${state.health}</span>
      <span class="badge">Area ${state.area}</span>
      <span class="badge">Room ${state.room}</span>
      ${state.lock ? `<span class="badge">Lock ${state.lock}</span>` : ''}
    </div>
  `;
}

function renderActions(){
  const locked = !!state.lock;
  const canAct = state.energy > 0 && state.flags.introDone && !locked;
  const canExplore = state.flags.cageBroken && state.energy >= 3 && !locked;

  $actions.innerHTML = `
    <h2>Actions</h2>
    <div class="choices">
      <button id="act-channel" ${!canAct ? 'disabled' : ''} title="${locked?'Interaction in progress':''}">Channel Soul</button>
      <button id="act-explore" ${!canExplore ? 'disabled' : ''} title="${locked?'Interaction in progress':''}">Explore (3)</button>
      <button id="act-sleep"   ${locked ? 'disabled' : ''} title="${locked?'Interaction in progress':''}">Sleep</button>
    </div>
    <p class="muted">
      ${locked ? 'An interaction is in progress…' : 'Explore appears after you break the cage. Channel appears after the opening.'}
    </p>
  `;
  qs('#act-channel')?.addEventListener('click', ()=> dispatch('channel'));
  qs('#act-explore')?.addEventListener('click', ()=> dispatch('explore'));
  qs('#act-sleep')  ?.addEventListener('click', ()=> dispatch('sleep'));
}


function renderDevLog(){
  $devLog.innerHTML = `<h2>Dev Log</h2><div class="log">${state.log.map(l=>`• ${l}`).join('\n')}</div>`;
}

function renderPlayerLog(){
  const last = state.pLog[0] || '';
  if (!last){ $toast.classList.add('hidden'); return; }
  $toast.textContent = last.length>100 ? (last.slice(0,100)+'…') : last;
  $toast.classList.remove('hidden');

  // full overlay list
  $olist.innerHTML = state.pLog.map(l=>`• ${l}`).join('\n');
}

// --------- overlay interactions -------------
$toast.addEventListener('click', ()=> $overlay.classList.remove('hidden'));
$overlay.addEventListener('click', (e)=>{
  if (e.target === $overlay) $overlay.classList.add('hidden'); // click outside card
});

// helpers
function qs(sel){ return document.querySelector(sel); }
function renderAll(){ renderStatus(); renderActions(); renderDevLog(); renderPlayerLog(); }

onChange(renderAll);
renderAll();

// action dispatcher
function dispatch(type){
  import('../systems/actions.js').then(m => m.handle(type));
}
