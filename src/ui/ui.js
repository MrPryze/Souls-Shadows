// src/ui/ui.js
import { state, onChange, clearJustSummarized } from '../core/state.js';
import { showDialogue } from '../story/inkRunner.js';

// -------- element refs (assigned after DOM ready) --------
let $logbar, $actions, $statusbar;
let $devLog, $overlay, $olist;
let $drawer, $btnStats, $tabPlayer, $tabDev, $secPlayer, $secDev, $devJson;

// -------- boot --------
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init(){
  cacheRefs();

  // subscribe render
  onChange(() => {
    renderAll();
    // keep overlay in sync if open
    if ($overlay && !$overlay.classList.contains('hidden')) {
      renderChronicle();
    }
  });

  // initial paint
  renderAll();

  // open intro dialogue
  showDialogue('/src/data/dialogues/intro.json', {
    onEnd: () => {
      // flip intro flag and repaint
      state.flags.introDone = true;
      renderAll();
    }
  });

  // UI interactions
  document.getElementById('log-chip')?.addEventListener('click', openChronicle);
  $overlay?.addEventListener('click', (e) => { if (e.target === $overlay) closeChronicle(); });
  $btnStats?.addEventListener('click', () => {
    if (!$drawer) return;
    $drawer.classList.toggle('open');
    if ($btnStats) $btnStats.textContent = $drawer.classList.contains('open') ? '→' : '←';
  });
  $tabPlayer?.addEventListener('click', () => {
    if (!$tabPlayer || !$tabDev || !$secPlayer || !$secDev) return;
    $tabPlayer.classList.add('active'); $tabDev.classList.remove('active');
    $secPlayer.classList.remove('hidden'); $secDev.classList.add('hidden');
  });
  $tabDev?.addEventListener('click', () => {
    if (!$tabPlayer || !$tabDev || !$secPlayer || !$secDev) return;
    $tabDev.classList.add('active'); $tabPlayer.classList.remove('active');
    $secDev.classList.remove('hidden'); $secPlayer.classList.add('hidden');
  });
}

function cacheRefs(){
  $logbar    = document.getElementById('main-logbar');
  $actions   = document.getElementById('main-actions');
  $statusbar = document.getElementById('statusbar');

  $devLog    = document.querySelector('#panel-dev-log');
  $overlay   = document.getElementById('player-log-overlay');
  $olist     = document.getElementById('player-log-list');

  $drawer    = document.getElementById('player-drawer');
  $btnStats  = document.getElementById('btn-stats');
  $tabPlayer = document.getElementById('tab-player');
  $tabDev    = document.getElementById('tab-dev');
  $secPlayer = document.getElementById('sec-player');
  $secDev    = document.getElementById('sec-dev');
  $devJson   = document.getElementById('drawer-dev-json');
}

// -------- render master --------
function renderAll(){
  renderStatusBar();
  renderMain();
  renderDevLog();
  renderDrawer();
}

// -------- main panel (Now + Actions) --------
function renderMain(){
  if (!$logbar || !$actions) return;

  // Hide logbar during dialogue or right after we just summarized (one frame)
  const hideForDialogue = state.lock === 'dialogue';
  const hideJustOnce    = !!(state.ui && state.ui.justSummarized);
  const showLogbar      = !(hideForDialogue || hideJustOnce);

  $logbar.classList.toggle('hidden', !showLogbar);
  if (showLogbar){
    $logbar.textContent = state.now || '…';
    $logbar.onclick = openChronicle;
  } else if (hideJustOnce){
    // allow one render to pass, then show again
    requestAnimationFrame(() => clearJustSummarized());
  }

  const locked = state.lock === 'dialogue' || state.lock === 'gameover';
  $actions.classList.toggle('hidden', locked);

  if (!locked){
    const canAct     = state.energy > 0 && state.flags.introDone;
    const canExplore = state.flags.cageBroken && state.energy >= 3;
    const atEntrance = state.area === 'cave' && state.room === 'entrance';
    const atPool     = state.area === 'cave' && state.room === 'pool';

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

// -------- status bar (chips) --------
function renderStatusBar(){
  if (!$statusbar) return;
  $statusbar.innerHTML = `
    <span class="chip">Day ${state.day}</span>
    <span class="chip">En ${state.energy}/${state.energyMax}</span>
    <span class="chip">Soul ${state.soul}/${state.soulCap}</span>
    ${state.lock ? `<span class="chip">• ${state.lock}</span>` : ''}
  `;
}

// -------- dev log panel --------
function renderDevLog(){
  if (!$devLog) return;
  $devLog.innerHTML = `<h2>Dev Log</h2><div class="log">${state.log.map(l=>`• ${l}`).join('\n')}</div>`;
}

// -------- drawer (player stats + dev snapshot) --------
function renderDrawer(){
  if (!$drawer) return;

  if ($secPlayer){
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
  }
  if ($devJson){
    $devJson.textContent = JSON.stringify(state, null, 2);
  }
}

// -------- chronicle overlay --------
function renderChronicle(){
  if (!$olist) return;
  const lines = [...state.pLog].reverse(); // newest at bottom
  $olist.innerHTML = lines.map(l=>`• ${l}`).join('\n');
  requestAnimationFrame(() => {
    const scroller = $olist.parentElement;
    if (scroller) scroller.scrollTo(0, scroller.scrollHeight);
  });
}
function openChronicle(){ if ($overlay){ renderChronicle(); $overlay.classList.remove('hidden'); } }
function closeChronicle(){ $overlay?.classList.add('hidden'); }

// -------- action dispatcher (lazy import avoids circular deps) --------
function dispatch(type){
  import('../systems/actions.js').then(m => m.handle(type));
}
