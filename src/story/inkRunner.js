import { setNow, addPlayerLog, lockUI, unlockUI, state } from '../core/state.js';

const $dlg = document.getElementById('main-dialogue');
let story = null, hooks = { onChoice:null, onEnd:null }, lastBlock = '';

// showDialogue(file, { onEnd, onChoice })
export async function showDialogue(jsonPath, hooks={}){
  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${jsonPath}`);
    const data = await res.json();

    const Story = window.inkjs?.Story;
    if (!Story) throw new Error('Ink engine missing: window.inkjs.Story is undefined');

    const story = new Story(data);

    lockUI('dialogue');
    continueStory(story, hooks);
  } catch (e){
    console.error('Dialogue failed for', jsonPath, e);
    setNow('Dialogue failed.');
    addPlayerLog(`Dialogue error: ${e.message}`);
    unlockUI();
  }
}

function continueStory(story, hooks){
  try {
    const chunks = [];
    while (story.canContinue) {
      let text = story.Continue().trim();
      if (text) chunks.push(text);
    }
    const lastBlock = chunks.join('\n');
    if (lastBlock) setNow(lastBlock);

    const choices = story.currentChoices || [];
    const dlg = document.getElementById('main-dialogue');
    if (!dlg) return;

    if (choices.length){
      dlg.innerHTML = `
        <div style="white-space:pre-wrap">${lastBlock}</div>
        <div class="choices">
          ${choices.map((c,i)=> `<button class="btn" data-i="${i}">${c.text}</button>`).join('')}
        </div>`;
      dlg.querySelectorAll('button[data-i]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx = +btn.dataset.i;
          const key = (choices[idx]?.text || '').trim();
          if (hooks.onChoice) hooks.onChoice(key);
          story.ChooseChoiceIndex(idx);
          continueStory(story, hooks);
        });
      });
    } else {
      // finished
      dlg.innerHTML = `<div style="white-space:pre-wrap">${lastBlock || ''}</div>`;
      unlockUI();
      hooks.onEnd && hooks.onEnd();
    }
  } catch(e){
    console.error('Ink runtime error:', e);
    setNow('Dialogue failed.');
    addPlayerLog(`Ink runtime error: ${e.message}`);
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
