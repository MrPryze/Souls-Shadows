import { setNow, addPlayerLog, lockUI, unlockUI, state } from '../core/state.js';

const $dlg = document.getElementById('main-dialogue');
let story = null, hooks = { onChoice:null, onEnd:null }, lastBlock = '';

export async function showDialogue(jsonPath, opts={}){
  hooks = { onChoice:opts.onChoice||null, onEnd:opts.onEnd||null };
  lockUI('dialogue');

  if (!window.inkjs){ renderUI('<span class="muted">Dialogue engine missing.</span>', []); unlockUI(); return; }

  try{
    const res = await fetch(jsonPath, { cache:'no-store' });
    if (!res.ok){ renderUI('<span class="muted">Dialogue not found.</span>', []); unlockUI(); return; }
    const data = await res.json();
    const { Story } = window.inkjs;
    story = new Story(data);
    story.onError = (msg)=> console.error('[INK]', msg);

    if (!story.canContinue && story.currentChoices.length===0){
      const tries = ['start','Start','root','Root','intro','Intro'];
      for (const k of tries){ try { story.ChoosePathString(k); break; } catch {} }
    }
    continueStory();
  }catch(e){
    console.error(e);
    renderUI('<span class="muted">Dialogue failed.</span>', []);
    unlockUI();
  }
}


export function runExternalStory(st, opts = {}) {
  story = st;
  story.variablesState.$('area', state.area);
  story.variablesState.$('node', state.room);
  story.variablesState.$('hunger', state.hunger);
  hooks = { onChoice: opts.onChoice || null, onEnd: opts.onEnd || null };
  lastBlock = '';
  lockUI('dialogue');
  story.onError = (m) => console.error('[INK]', m);
  continueStory();
}

function continueStory() {
  if (!story) { $dlg.innerHTML = '<span class="muted">…</span>'; if (state.lock!=='gameover') unlockUI(); return; }

  // print block
  let text = '';
  while (story.canContinue) text += story.Continue();
  text = text.trim();
  if (text) { setNow(text); lastBlock = text; }

  // include tags on choices
  const choices = story.currentChoices.map((c, i) => ({
    text: c.text,
    tags: c.tags || [],
    i
  }));

  // render
  $dlg.innerHTML = `
    <div>${text || ''}</div>
    <div id="dlg-choices" class="choices"></div>
  `;

  const box = document.getElementById('dlg-choices');
  choices.forEach((c) => {
    const b = document.createElement('button');
    b.textContent = c.text;
    b.onclick = () => {
      try {
        story.ChooseChoiceIndex(c.i);

        // derive key: prefer "key:drink" tag, fallback to text
        const tag = (c.tags.find(t => t.startsWith('key:')) || '').slice(4);
        const key = tag || (c.text || '').toLowerCase();

        if (hooks.onChoice) hooks.onChoice(key);

        // If gameOver was triggered inside onChoice, abort continuation.
        if (state.lock === 'gameover') {
          story = null;           // drop reference; we’re done
          return;
        }

        continueStory();
      } catch (e) { console.error(e); }
    };
    box.appendChild(b);
  });

  // finished: only wrap up if not gameover
  if (!choices.length) {
    if (state.lock !== 'gameover') {
      if (lastBlock) addPlayerLog(lastBlock);
      unlockUI();
      hooks.onEnd && setTimeout(hooks.onEnd, 0);
      if (!$dlg.textContent.trim()) {
        $dlg.innerHTML = `<div class="muted">The dark waits for your next move.</div>`;
      }
    } else {
      // lock is gameover — keep modal on top; do not unlock/hide.
      story = null;
    }
  }
}


function renderUI(text, choices){
  $dlg.innerHTML = `
    <div>${text || ''}</div>
    <div id="dlg-choices" class="choices"></div>
  `;
  const box = document.getElementById('dlg-choices');
  (choices||[]).forEach((c,i)=>{
    const b = document.createElement('button');
    b.textContent = c.text;
    b.onclick = ()=>{
      try{
        story.ChooseChoiceIndex(i);
        const key = (story.currentTags||[]).find(t=>t.startsWith('key:'))?.split(':')[1] || c.text;
        hooks.onChoice && hooks.onChoice(key);
        continueStory();
      }catch(e){ console.error(e); }
    };
    box.appendChild(b);
  });
}

// Show a single-paragraph flavor snippet (no choices expected)
export async function showSnippet(jsonPath, knot='start'){
  if (!window.inkjs){ return; }
  try{
    const res = await fetch(jsonPath, { cache:'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const { Story } = window.inkjs;
    const s = new Story(data);
    try { s.ChoosePathString(knot); } catch {}
    let text = '';
    while (s.canContinue) text += s.Continue();
    text = text.trim();
    if (text){
      // overwrite main dialogue area with the snippet text, but don't lock UI
      document.getElementById('main-dialogue').innerHTML = `<div>${text}</div>`;
      // also record it for the ticker + Chronicle
      const { addPlayerLog } = await import('../core/state.js');
      addPlayerLog(text);
    }
  }catch(e){ console.error(e); }
}




export function closeDialogue(){ story=null; unlockUI(); $dlg.innerHTML = '<span class="muted">…</span>'; }
