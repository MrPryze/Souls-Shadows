import { state, onChange } from '../core/state.js';
import { showDialogue } from '../story/inkRunner.js';
// add these imports at top
import { COST } from '../core/constants.js';
import { inDialogue, inGameOver, canAct, canExplore, atCaveEntrance, atPool } from '../core/selectors.js';


const $devLog  = document.querySelector('#panel-dev-log');
const $overlay = document.getElementById('player-log-overlay');
const $olist   = document.getElementById('player-log-list');

const $btnStats = document.getElementById('btn-stats');
const $drawer   = document.getElementById('stats-drawer');
const $tabPlayer= document.getElementById('tab-player');
const $tabDev   = document.getElementById('tab-dev');
const $secPlayer= document.getElementById('drawer-player');
const $secDev   = document.getElementById('drawer-dev');
const $devJson  = document.getElementById('drawer-dev-json');

// Intro: hide everything but dialogue; when intro finishes, onEnd flips the flag in inkRunner.js init.
document.body.classList.add('intro');
showDialogue('/src/data/dialogues/intro.json', {
  onEnd: ()=>{
    state.flags.introDone = true;
    document.body.classList.remove('intro');
    renderAll();
  }
});

// -------- renderers ----------
function renderMain(){
  if (!$logbar || !$actions) return;

  // --- compute lock state FIRST (prevents TDZ error)
  const locked = state.lock === 'dialogue' || state.lock === 'gameover';
  const inDialogue = state.lock === 'dialogue';

  // --- log bar
  $logbar.classList.toggle('hidden', inDialogue);
  if (!inDialogue){
    $logbar.textContent = state.now || '…';
    $logbar.onclick = openChronicle;
  }

  // --- actions
  $actions.classList.toggle('hidden', locked);

  if (!locked){
    // selectors are fine; inline logic below if you haven't wired selectors yet
    const canAct     = state.flags.introDone && state.energy > 0;
    const canExplore = state.flags.cageBroken && state.energy >= 3;
    const atEntrance = state.area==='cave' && state.room==='entrance';
    const atPool     = state.area==='cave' && state.room==='pool';

    $actions.innerHTML = `
      <button class="btn btn--accent" id="act-channel" ${!canAct ? 'disabled' : ''}>Channel Soul</button>
      <button class="btn" id="act-explore" ${!canExplore ? 'disabled' : ''}>Explore (3)</button>
      ${atEntrance ? `<button class="btn" id="act-exit">Exit Cave</button>` : ``}
      ${atPool ? `<button class="btn btn--danger" id="act-drink-pool">Drink from pool</button>` : ``}
      <button class="btn" id="act-sleep">Sleep</button>
    `;
    document.getElementById('act-channel')?.addEventListener('click', ()=> dispatch('channel'));
    document.getElementById('act-explore')?.addEventListener('click', ()=> dispatch('explore'));
    document.getElementById('act-exit')   ?.addEventListener('click', ()=> dispatch('exit_cave'));
    document.getElementById('act-drink-pool')?.addEventListener('click', ()=> dispatch('drink_pool'));
    document.getElementById('act-sleep')  ?.addEventListener('click', ()=> dispatch('sleep'));
  } else {
    $actions.innerHTML = '';
  }
}

function renderDevLog(){
  const $devLog  = document.querySelector('#panel-dev-log');
  $devLog.innerHTML = `<h2>Dev Log</h2><div class="log">${state.log.map(l=>`• ${l}`).join('\n')}</div>`;
}

// Drawer: player stats + dev snapshot
function renderDrawer(){
  // Player-facing stats/resources
  $secPlayer.innerHTML = `
    <div class="row" style="display:flex;gap:6px;flex-wrap:wrap">
      <span class="badge">Day ${state.day}</span>
      <span class="badge">Energy ${state.energy}/${state.energyMax}</span>
      <span class="badge">Soul ${state.soul}/${state.soulCap}</span>
      <span class="badge">Hunger ${state.hunger}</span>
      <span class="badge">Health ${state.health}</span>
      <span class="badge">Area ${state.area}</span>
      <span class="badge">Room ${state.room}</span>
    </div>
    <h4 style="margin:10px 0 6px">Inventory</h4>
    <pre class="devjson">${JSON.stringify(state.inv, null, 2)}</pre>
  `;
  // Dev raw state (read-only snapshot)
  $devJson.textContent = JSON.stringify(state, null, 2);
}

// Chronicle overlay (newest at bottom)
function renderChronicle(){
  const lines = [...state.pLog].reverse(); // newest at bottom
  $olist.innerHTML = lines.map(l=>`• ${l}`).join('\n');
  // auto-scroll to bottom
  requestAnimationFrame(()=> $olist.parentElement.scrollTo(0, $olist.parentElement.scrollHeight));
}

function openChronicle(){
  renderChronicle();
  $overlay.classList.remove('hidden');
}
function closeChronicle(){ $overlay.classList.add('hidden'); }

// Overlay interactions: click outside card to close
$overlay.addEventListener('click', (e)=>{
  if (e.target === $overlay) closeChronicle();
});

// Drawer open/close
$btnStats.addEventListener('click', ()=>{
  $drawer.classList.toggle('open');
  // Rotate arrow for fun
  $btnStats.textContent = $drawer.classList.contains('open') ? '→' : '←';
});

// Drawer tabs
$tabPlayer.addEventListener('click', ()=>{
  $tabPlayer.classList.add('active'); $tabDev.classList.remove('active');
  $secPlayer.classList.remove('hidden'); $secDev.classList.add('hidden');
});
$tabDev.addEventListener('click', ()=>{
  $tabDev.classList.add('active'); $tabPlayer.classList.remove('active');
  $secDev.classList.remove('hidden'); $secPlayer.classList.add('hidden');
});

// Master render
function renderAll(){
  renderStatusBar();
  renderMain();
  renderDevLog();
  renderDrawer();
}

onChange(()=>{ renderAll(); if (!document.getElementById('player-log-overlay').classList.contains('hidden')) renderChronicle(); });
renderAll();

function dispatch(type){
  import('../systems/actions.js').then(m => m.handle(type));
}

function renderStatusBar(){
  const bar = document.getElementById('statusbar');
  bar.innerHTML = `
    <span class="chip">Day ${state.day}</span>
    <span class="chip">En ${state.energy}/${state.energyMax}</span>
    <span class="chip">Soul ${state.soul}/${state.soulCap}</span>
    ${state.lock ? `<span class="chip">• ${state.lock}</span>` : ''}
  `;
}
