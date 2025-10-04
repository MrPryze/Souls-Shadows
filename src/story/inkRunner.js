import { addPlayerLog, state, lockUI, unlockUI } from '../core/state.js';

const $dlg = document.getElementById('main-dialogue');   // 👈 new target
let story = null;
let hooks = { onChoice:null, onEnd:null };

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

function continueStory(){
  if (!story){ renderUI('<span class="muted">…</span>', []); unlockUI(); return; }

  let text = '';
  while (story.canContinue) text += story.Continue();

  // Feed player log/ticker only after intro is done
  if (text && state.flags.introDone) addPlayerLog(text.trim());

  const choices = story.currentChoices.map((c,i)=>({ text:c.text, i }));
  renderUI(text, choices);

  if (!choices.length){
    unlockUI();
    hooks.onEnd && setTimeout(hooks.onEnd, 0);
  }
}

export function closeDialogue(){ story = null; unlockUI(); renderUI('<span class="muted">…</span>', []); }
