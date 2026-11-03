/* The Count's letters — the DM writes, the table receives: aged parchment, a wax seal that breaks.
   The desk lives here; the table's message handler is a hook for Claude (see the PR): it calls
   net.onLetter(letter), which this module sets when it starts. */
import { state, ui, tokById, log } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { net } from '../net/table.js';
import { toPlayers } from '../game/outbox.js';
import { toast } from './hud.js';
import { changed } from '../game/session.js';
import { registerCommands } from './palette.js';
import { sfx } from '../audio/sound.js';

/* The Count's crest, drawn original: a bat over a tower, for the wax. */
const crestSVG = () => `<svg viewBox="0 0 64 64" width="42" height="42" aria-hidden="true"><path d="M26 58V30h-3v-7h3v-3h3v3h3v-3h3v3h3v7h-3v28z" fill="#4a0d0d"/><path d="M30 58v-9a2 2 0 0 1 4 0v9z" fill="#e8dcc0"/><path d="M30 36h4v4h-4z" fill="#e8dcc0"/><path d="M9 16Q17 5 25 12q4-5 7-1 3-4 7 1 8-7 16 4-7-3-9 3-5-2-9 2-3 4-5 4t-5-4q-4-4-9-2-2-6-9-3z" fill="#4a0d0d"/></svg>`;

/* Openings to start from, all in his voice and original — the DM edits freely after picking one.
   The forged plea is marked as forged in its title, so the DM knows; the letter itself reads genuine. */
const OPENINGS = [
  { title:'An invitation to dinner', from:"Count Strahd", sig:'Strahd', seal:'crest', body:`You have travelled far, and my roads have not been kind to you.
I invite you to dine with me at Castle Ravenloft tomorrow night, when the mists are thin and the road is safe.
Come as guests. Leave your weapons at the door, and I will leave my temper in the crypt.
Do not keep me waiting. A host who is kept waiting grows curious, and curiosity in this valley has teeth.` },
  { title:'A warning, given kindly', from:"Count Strahd", sig:'Strahd', seal:'crest', body:`Turn back. The valley ahead holds nothing you want, and several things that want you.
I have watched stronger companies than yours walk these roads, and I have watched the mists take them.
This is not a threat. A threat would be less honest, and I am being honest with you now.
Go home, while the road home still knows your name.` },
  { title:'A courtesy', from:"Count Strahd", sig:'Strahd', seal:'crest', body:`Word reached me that you dealt with the trouble at the village, and did it without asking a price.
That is rare in Barovia, and rarer still in strangers. Accept this note as my thanks, and my word that my roads will not trouble you tonight.
Should you need shelter, my gates are open. Should you need anything else, ask — and I will consider it.` },
  { title:'A threat, wrapped in courtesy', from:"Count Strahd", sig:'Strahd', seal:'crest', body:`How kind of you to visit my valley, and how brave, to do it without my leave.
I admire bravery. I keep a collection of it, in the crypt, where it no longer troubles anyone.
Do not mistake my courtesy for permission. The next letter I write about you will be shorter, and it will not be addressed to you.` },
  { title:'A forged plea for help', from:'Marta', sig:'Marta', seal:'wax', body:`Please — you are the only ones who helped us, and now we need you again.
They came in the night and took my boy from his bed. The elders say nothing can be done, but you did something before, when nothing could be done.
Come to the village before dark. Come quickly. Do not tell the Count's men — I fear they already know.` },
  { title:'Safe passage', from:"Count Strahd", sig:'Strahd', seal:'crest', body:`By my word, you may travel the roads of Barovia unharmed for three nights, beginning tonight.
My creatures will not trouble you. My mists will not take you. Any man of mine who breaks this word answers to me, and I am not a forgiving master.
Keep this letter on you. Show it to anything that doubts you. Three nights — and then we shall see what you have done with them.` },
];

/* The draft survives closing the desk, so a half-written letter is still there when the DM comes back. */
const draft = { from:"Count Strahd", to:'', body:'', sig:'Strahd', seal:'crest' };
/* The party, as the Table tab's seating list sees it: every token that isn't a monster. */
const heroes = () => (state?.tokens || []).filter(t => t.kind !== 'monster');
const toLabel = l => l.to ? (tokById(l.to)?.name || 'a hero') : 'the whole party';
const letterKey = () => `dreaddelve.letters.${net.join?.code || net.code || 'local'}.v1`;
const loadLetters = () => { try { return JSON.parse(localStorage.getItem(letterKey()) || '[]'); } catch { return []; } };
const saveLetters = list => { try { localStorage.setItem(letterKey(), JSON.stringify(list)); } catch {} };

/* The parchment, as the players see it: torn edges, ink that bleeds a little, a seal that breaks. */
function parchmentHTML(l, sealed){
  const sealBtn = l.seal === 'crest' ? crestSVG() : '';
  const sealEl = l.seal === 'none' ? '' : `<button class="letter-seal" data-act="letterSeal" aria-label="Break the seal" title="Break the seal">${sealBtn}</button>`;
  return `<div class="letter-sheet ${sealed ? 'sealed' : 'open'} ${ui.screen ? 'tv' : ''}">
    <div class="letter-fold">
      <div class="letter-to">To ${esc(toLabel(l))}</div>
      <div class="muted">From ${esc(l.from)}</div>
      ${sealEl || '<div class="muted">No seal — open to read</div>'}
      ${l.seal === 'none' ? '' : '<div class="muted">Tap the seal to open</div>'}
    </div>
    <div class="letter-body">
      <div class="letter-to">To ${esc(toLabel(l))},</div>
      <div class="ink">${esc(l.body)}</div>
      <div class="letter-sig">${esc(l.sig)}</div>
      ${l.seal === 'none' ? '' : `<div class="letter-seal broken" aria-hidden="true">${sealBtn}</div>`}
    </div>
  </div>`;
}

/* The overlay a letter arrives in, on a phone or the TV. */
function showLetterOverlay(l, sealed){
  let ov = $('#letterOverlay');
  if (!ov){ ov = document.createElement('div'); ov.id = 'letterOverlay'; ov.className = 'modal'; document.body.appendChild(ov); }
  ov.innerHTML = `<div style="position:relative;width:min(580px,94vw)"><button class="btn small" data-act="letterClose" style="position:absolute;right:-4px;top:-34px;z-index:2">✕</button>${parchmentHTML(l, sealed)}</div>`;
  ov.classList.remove('hidden');
  ov.dataset.letter = l.id || '';
}
function closeOverlay(){ $('#letterOverlay')?.classList.add('hidden'); }

/* Receiving: the handler Claude adds calls this with the letter the DM sent. */
export function receiveLetter(l){
  if (!l || !l.body) return;
  if (ui.role === 'dm' && !ui.screen) return;   // the DM's copy lives in the campaign, not here
  if (l.to && ui.myToken && l.to !== ui.myToken) return;   // addressed to another hero: never shown, never kept
  const open = l.seal === 'none';
  if (ui.screen){ sfx('whisper', false); showLetterOverlay(l, !open); return; }   // the TV shows it, and keeps no list
  sfx('whisper', false);   // a soft sound on arrival, local to this phone
  const list = loadLetters();
  if (!list.some(x => x.id === l.id)) list.push({ ...l, opened:open });
  saveLetters(list);
  showLetterOverlay(l, !open);
  renderLetterList();
}

/* The 📜 list on the player's Your hero tab, kept in localStorage per table code. */
function renderLetterList(){
  let el = $('#letterList');
  if (!el){ const p = $('#panel'); if (!p) return; el = document.createElement('div'); el.id = 'letterList'; p.appendChild(el); }
  const show = !!(state && ui.role === 'player' && ui.tab === 'hero' && !ui.screen);
  el.style.display = show ? '' : 'none';
  if (!show) return;
  const list = loadLetters().slice().reverse();
  el.innerHTML = `<h3>📜 Letters</h3>` + (list.length ? list.map(l => `<button class="btn small letter-entry" data-act="letterOpen" data-id="${esc(l.id)}">${l.seal === 'none' || l.opened ? '📜' : '🔴'} From ${esc(l.from)} <span class="muted">· ${new Date(l.at).toLocaleDateString()} · ${l.opened ? 'read' : 'sealed'}</span></button>`).join('') : '<div class="muted">No letters yet. When the Count writes, his seal will find you here.</div>');
}
let listTimer = null;
function watchList(){
  const run = () => { clearTimeout(listTimer); listTimer = setTimeout(renderLetterList, 150); };
  const tb = $('#tabBody'), tabs = $('#tabs');
  if (tb) new MutationObserver(run).observe(tb, { childList:true });
  if (tabs) new MutationObserver(run).observe(tabs, { childList:true });
  renderLetterList();
}

/* The writing desk, DM only. */
function deskHTML(){
  const sent = (state?.campaign?.letters || []).slice().reverse().slice(0, 10);
  return `<div class="box"><button class="btn small" data-act="letterClose" style="float:right">✕</button>
    <h2>✉ A letter from the Count</h2>
    <div class="muted">Write it, seal it, and send it through the Curtain — it waits in the outbox until you send it, unless the Curtain sends at once.</div>
    <div class="row" style="flex-wrap:wrap;margin-top:10px">${OPENINGS.map((o, i) => `<button class="btn small" data-open="${i}">${esc(o.title)}</button>`).join('')}</div>
    <div style="margin-top:12px"><label class="muted">From</label><input class="txt" id="ltFrom" value="${esc(draft.from)}"></div>
    <div style="margin-top:8px"><label class="muted">To</label><select class="txt" id="ltTo"><option value="">The whole party</option>${heroes().map(t => `<option value="${t.id}"${draft.to === t.id ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
    <div style="margin-top:8px"><label class="muted">The letter</label><textarea class="txt" id="ltBody" style="min-height:150px">${esc(draft.body)}</textarea></div>
    <div class="row" style="margin-top:8px"><div style="flex:1"><label class="muted">Signed</label><input class="txt" id="ltSig" value="${esc(draft.sig)}"></div>
    <div><label class="muted">Seal</label><select class="txt" id="ltSeal"><option value="crest"${draft.seal === 'crest' ? ' selected' : ''}>The Count's crest</option><option value="wax"${draft.seal === 'wax' ? ' selected' : ''}>Plain wax</option><option value="none"${draft.seal === 'none' ? ' selected' : ''}>No seal</option></select></div></div>
    <div class="row" style="margin-top:12px"><button class="btn small" data-act="letterPreview">Preview, as the players will see it</button><button class="btn small primary" data-act="letterSend">Send</button></div>
    <div id="ltPreviewPane" style="margin-top:12px"></div>
    <div style="margin-top:14px"><h3>Letters sent</h3>${sent.length ? sent.map(l => `<div class="muted">📜 ${new Date(l.at).toLocaleDateString()} — to ${esc(toLabel(l))}, from ${esc(l.from)}</div>`).join('') : '<div class="muted">None yet.</div>'}</div>
  </div>`;
}
function readDesk(){
  draft.from = $('#ltFrom')?.value.trim() || "Count Strahd";
  draft.to = $('#ltTo')?.value || '';
  draft.body = $('#ltBody')?.value || '';
  draft.sig = $('#ltSig')?.value.trim() || draft.from;
  draft.seal = $('#ltSeal')?.value || 'crest';
  return { id:`lt-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, from:draft.from, to:draft.to || null, body:draft.body, sig:draft.sig, seal:draft.seal, at:Date.now() };
}
export function openDesk(){
  if (!state || ui.role !== 'dm') return;
  let d = $('#letterDesk');
  if (!d){ d = document.createElement('div'); d.id = 'letterDesk'; d.className = 'modal hidden'; document.body.appendChild(d); }
  d.innerHTML = deskHTML();
  d.classList.remove('hidden');
}
function closeDesk(){ $('#letterDesk')?.classList.add('hidden'); }
function sendDeskLetter(){
  const l = readDesk();
  if (!l.body.trim()){ toast('Write the letter first.'); return; }
  // The outbox shows a held thing's text, and a letter has none of its own — so the message carries a one-line summary for it.
  const r = toPlayers({ t:'letter', letter:l, text:`✉ Letter from ${l.from} to ${toLabel(l)}` }, 'world');
  if (r === 'kept'){ toast('The Curtain is closed to letters — nothing was sent.'); return; }
  state.campaign.letters ??= [];
  state.campaign.letters.push(l);
  changed();
  log(`✉ A letter from ${l.from} to ${toLabel(l)}`, true);
  toast(r === 'sent' ? 'Sent to the table.' : 'In the outbox — send it when ready.');
  closeDesk();   // back at the table, where the outbox waits; the sent list is there on reopening
}

/* One document listener for the desk, the seal, the list and the overlay. */
function onLetterClick(e){
  const open = e.target.closest?.('[data-open]');
  if (open && $('#letterDesk')?.contains(e.target)){ const o = OPENINGS[+open.dataset.open]; if (o){ readDesk();   // keep what the DM already picked (above all, To) before the opening fills the rest
    draft.from = o.from; draft.sig = o.sig; draft.seal = o.seal; draft.body = o.body; const d = $('#letterDesk'); if (d) d.innerHTML = deskHTML(); } return; }
  const act = e.target.closest?.('[data-act]')?.dataset.act;
  if (!act || !act.startsWith('letter')) return;
  if (act === 'letterClose'){ closeDesk(); closeOverlay(); }
  else if (act === 'letterPreview'){ const l = readDesk(); const p = $('#ltPreviewPane'); if (p) p.innerHTML = parchmentHTML({ ...l, id:l.id }, l.seal !== 'none'); }
  else if (act === 'letterSend') sendDeskLetter();
  else if (act === 'letterSeal'){
    const sheet = e.target.closest('.letter-sheet'); if (!sheet) return;
    sheet.classList.remove('sealed'); sheet.classList.add('open');
    const ov = $('#letterOverlay'), id = ov?.dataset.letter;
    if (id && !ov.closest('#letterDesk')){ const list = loadLetters(); const l = list.find(x => x.id === id); if (l && !l.opened){ l.opened = true; saveLetters(list); renderLetterList(); } }
  }
  else if (act === 'letterOpen'){
    const l = loadLetters().find(x => x.id === e.target.closest('[data-id]')?.dataset.id);
    if (l) showLetterOverlay(l, !l.opened);
  }
}

/* The hook: the ✉ button (DM only, hidden for players and the TV by the CSS below), the palette
   command, the receiver the table's handler will call, and the watch on the hero tab. */
let started = false;
export function ensureLettersButton(){
  if (started) return; started = true;
  if (!$('#letterStyle')){
    const st = document.createElement('style'); st.id = 'letterStyle';
    st.textContent = `body.player #btnLetters,body.screen #btnLetters{display:none!important}
    .letter-sheet{position:relative;background:linear-gradient(175deg,#efe3c2,#e2d2a8 60%,#d3bd8d);color:#2b1d10;border-radius:6px 12px 8px 14px/12px 8px 14px 6px;clip-path:polygon(0 2%,3% 0,97% 1%,100% 4%,99% 96%,96% 100%,4% 99%,0 97%);filter:drop-shadow(0 10px 24px rgba(0,0,0,.5));padding:26px 28px;font-family:var(--serif);max-width:100%}
    .letter-sheet .ink{white-space:pre-wrap;line-height:1.65;font-size:17px;text-shadow:0 0 1px rgba(43,29,16,.55),0 0 6px rgba(43,29,16,.15)}
    .letter-sheet .letter-to{font-size:15px;margin-bottom:10px}.letter-sheet .letter-sig{margin-top:16px;font-size:18px;font-style:italic;text-align:right}
    .letter-sheet.sealed .letter-body{display:none}.letter-sheet.open .letter-fold{display:none}
    .letter-sheet.open .letter-body{animation:letterunfold .6s var(--ease)}@keyframes letterunfold{from{opacity:0;transform:scaleY(.7);transform-origin:top}to{opacity:1;transform:none}}
    .letter-fold{text-align:center;padding:10px 0}.letter-fold .letter-seal{margin:14px auto}
    .letter-seal{width:64px;height:64px;border:0;border-radius:50%;background:radial-gradient(circle at 35% 30%,#c04545,#8a2020 60%,#6d1616);box-shadow:inset 0 2px 6px rgba(255,255,255,.25),inset 0 -4px 8px rgba(0,0,0,.35),0 3px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .3s,opacity .3s}
    .letter-seal.broken{transform:rotate(14deg) scale(.94);opacity:.85;position:relative}.letter-seal.broken::after{content:'';position:absolute;left:8%;right:8%;top:50%;height:2px;background:rgba(0,0,0,.35);transform:rotate(-24deg)}
    .letter-sheet.tv{padding:36px 40px}.letter-sheet.tv .ink{font-size:21px}.letter-sheet.tv .letter-sig{font-size:22px}
    #letterList{border-top:1px solid var(--line);padding:12px 0;margin-top:8px}#letterList .letter-entry{display:block;width:100%;text-align:left;margin-top:6px}
    @media (prefers-reduced-motion: reduce){.letter-sheet.open .letter-body{animation:none}.letter-seal{transition:none}}`;
    document.head.appendChild(st);
  }
  if (!$('#btnLetters')){
    const b = document.createElement('button'); b.className = 'icon'; b.id = 'btnLetters'; b.title = 'Write a letter'; b.textContent = '✉';
    b.onclick = () => openDesk();
    const help = $('#btnHelp'); if (help) help.before(b); else $('#topbar')?.appendChild(b);
  }
  registerCommands([{ id:'letter', n:'Write a letter', hint:'A letter from the Count, sealed in wax', icon:'✉', role:'dm', run:openDesk }]);
  net.onLetter = receiveLetter;   // the table's handler calls this when a letter arrives (see the PR)
  document.addEventListener('click', onLetterClick);
  watchList();
}
