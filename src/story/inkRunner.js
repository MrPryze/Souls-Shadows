import { addLog, addPlayerLog, state, lockUI, unlockUI } from '../core/state.js';

const $dlg = document.getElementById('panel-dialogue');
let story = null;
let hooks = { onChoice:null, onEnd:null };

function banner(title, lines=[]){
  const list = lines.map(l=>`<div class="muted">• ${l}</div>`).join('');
  $dlg.innerHTML = `<h2>Dialogue</h2><div>${title}</div>${list}<div id="dlg-choices" class="choices"></div>`;
}

function renderUI(text, choices){
  $dlg.innerHTML = `
    <h2>Dialogue</h2>
    <div style="white-space:pre-wrap; min-height:160px">${text||''}</div>
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

export async function showDialogue(jsonPath, opts={}){
  hooks = { onChoice:opts.onChoice||null, onEnd:opts.onEnd||null };
  lockUI('dialogue');

  // 0) inkjs present?
  if (!window.inkjs){
    banner('Dialogue engine missing (inkjs).', ['Load /public/vendor/ink.js first.']);
    unlockUI();
    return;
  }

  // 1) fetch JSON
  banner('Loading dialogue…', [jsonPath]);
  let data;
  try{
    const res = await fetch(jsonPath, { cache:'no-store' });
    if (!res.ok){
      banner('Dialogue not found.', [`HTTP ${res.status}`, jsonPath]);
      unlockUI();
      return;
    }
    data = await res.json();
  }catch(e){
    console.error(e);
    banner('Failed to load dialogue JSON.', [String(e)]);
    unlockUI();
    return;
  }

  // 2) construct story
  try{
    const { Story } = window.inkjs;
    story = new Story(data);
    story.onError = (msg)=> console.error('[INK]', msg);
  }catch(e){
    console.error(e);
    banner('Failed to construct ink Story.', [String(e)]);
    unlockUI();
    return;
  }

  // 3) try to continue; if nothing, try common entry knots
  if (!story.canContinue && story.currentChoices.length===0){
    const tries = ['start','Start','root','Root','intro','Intro'];
    let jumped = false;
    for (const k of tries){
      try { story.ChoosePathString(k); jumped = true; break; } catch {}
    }
    banner('Starting…', [`canContinue:${story.canContinue}`, `choices:${story.currentChoices.length}`, jumped ? 'jumped to entry knot' : 'root']);
  }

  // 4) paint
  continueStory();
}

function continueStory(){
  if (!story){ banner('No story loaded.'); unlockUI(); return; }

  let text = '';
  while (story.canContinue) text += story.Continue();
  const choices = story.currentChoices.map((c,i)=>({ text:c.text, i }));

  // Log only after intro is done (avoid spoilers in the toast)
  if (text && state.flags.introDone) addPlayerLog(text.trim());

  renderUI(text, choices);

  if (!choices.length){
    // finished
    unlockUI();
    hooks.onEnd && setTimeout(hooks.onEnd, 0);

    // if absolutely nothing printed, tell the user
    if (!text){
      banner('This dialogue contains no lines or choices.', ['Check your .ink export and entry knot.']);
    }
  }
}

// optional manual close from elsewhere
export function closeDialogue(){ story = null; unlockUI(); banner('…'); }
