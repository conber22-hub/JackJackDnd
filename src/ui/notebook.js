/* The DM's notebook — jotted names, promises, loot and hooks, kept with the save and never sent to players.
   DM only: the 📓 button hides on player and table screens (body.player / body.screen in the CSS below),
   and toggleNotebook() refuses unless isDM(). Every edit calls changed(), so notes autosave with the delve. */
import { state, isDM } from '../engine/state.js';
import { changed } from '../game/session.js';
import { $, esc, uid } from '../util/core.js';

const TAGS = [['npc', '👤', 'NPC'], ['loot', '💰', 'Loot'], ['hook', '🪝', 'Hook'], ['fight', '⚔', 'Fight'], ['place', '📍', 'Place'], ['todo', '❗', 'To do']];
const TAG_EMOJI = Object.fromEntries(TAGS.map(([id, e]) => [id, e]));
const TAG_NAME = Object.fromEntries(TAGS.map(([id, , n]) => [id, n]));

// the notes, creating the list on a fresh delve (newCampaign has no notebook field; deserialize() defaults old saves)
const notes = () => state?.campaign ? (state.campaign.notebook || (state.campaign.notebook = [])) : [];
// the session a note belongs to: the campaign's session number, else today's date
const sessionOf = () => state?.campaign?.session ?? new Date().toISOString().slice(0, 10);
const sessionLabel = s => typeof s === 'number' ? `Session ${s}` : s;
const timeOf = at => new Date(at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

// #npc and friends typed in a note become its tags (and leave the text); unknown #words stay put
function parseTags(text){
  const tags = [];
  const clean = text.replace(/#([A-Za-z-]+)/g, (m, w) => {
    const id = w.toLowerCase() === 'to-do' ? 'todo' : w.toLowerCase();
    if (TAG_EMOJI[id]){ if (!tags.includes(id)) tags.push(id); return ''; }
    return m;
  }).replace(/\s+/g, ' ').trim();
  return { text:clean, tags };
}

let filter = { q:'', tag:null }, lastDeleted = null;

function save(){ renderNotebook(); changed(); }

export function toggleNotebook(){
  if (!state || !isDM()) return;
  ensureNotebookUI();
  const dr = $('#nbDrawer');
  dr.classList.toggle('open');
  if (dr.classList.contains('open')){ renderNotebook(); $('#nbText')?.focus(); }
  else lastDeleted = null;
}

function addNote(raw){
  const { text, tags } = parseTags(raw);
  if (!text) return false;
  notes().push({ id:uid(), at:Date.now(), session:sessionOf(), text, tags, pin:false, done:false });
  save(); return true;
}

// tonight's notes as plain text, grouped by tag, for a recap or a group chat
export function tonightText(){
  const sess = sessionOf(), mine = notes().filter(n => n.session === sess);
  const lines = [`Tonight's notes — ${sessionLabel(sess)}`, ''];
  if (!mine.length) return lines.join('\n') + 'No notes tonight yet.';
  for (const [id, e, name] of TAGS){
    const group = mine.filter(n => n.tags.includes(id));
    if (group.length){ lines.push(`${e} ${name}`); group.forEach(n => lines.push(`- ${n.done ? '✓ ' : ''}${n.text}`)); lines.push(''); }
  }
  const bare = mine.filter(n => !n.tags.length);
  if (bare.length){ lines.push('Notes'); bare.forEach(n => lines.push(`- ${n.done ? '✓ ' : ''}${n.text}`)); }
  return lines.join('\n').trimEnd();
}

function copyText(t){
  try { const p = navigator.clipboard?.writeText(t); p?.catch?.(() => {}); } catch {}
}

function renderNotebook(){
  const dr = $('#nbDrawer'); if (!dr) return;
  const q = filter.q.trim().toLowerCase();
  const list = notes().filter(n => (!filter.tag || n.tags.includes(filter.tag)) && (!q || n.text.toLowerCase().includes(q)));
  list.sort((a, b) => (b.pin - a.pin) || (b.at - a.at));
  $('#nbList').innerHTML = list.length ? list.map(row).join('') : `<div class="nb-empty">No notes yet. Type one below — #npc, #loot, #hook, #fight, #place or #todo tags it.</div>`;
  $('#nbUndo').style.display = lastDeleted ? 'flex' : 'none';
  dr.querySelectorAll('[data-nb-filter]').forEach(b => b.classList.toggle('on', (b.dataset.nbFilter || null) === filter.tag));
}

function row(n){
  const tags = TAGS.map(([id, e, name]) => `<button class="nb-tag ${n.tags.includes(id) ? 'on' : ''}" data-nb="tag" data-id="${n.id}" data-tag="${id}" title="${name}">${e}</button>`).join('');
  return `<div class="nb-note ${n.pin ? 'pinned' : ''} ${n.done ? 'done' : ''}" data-note="${n.id}">
    <div class="nb-meta"><span>${timeOf(n.at)} · ${esc(sessionLabel(n.session))}</span><span class="nb-tools">
      <button class="${n.pin ? 'on' : ''}" data-nb="pin" data-id="${n.id}" title="${n.pin ? 'Unpin' : 'Pin to the top'}">📌</button>
      ${n.tags.includes('todo') ? `<button data-nb="done" data-id="${n.id}" title="Tick off">${n.done ? '☑' : '☐'}</button>` : ''}
      <button data-nb="del" data-id="${n.id}" title="Delete">🗑</button></span></div>
    <div class="nb-text">${esc(n.text)}</div>
    <div class="nb-tags">${tags}</div></div>`;
}

function onDrawerClick(e){
  const chip = e.target.closest('[data-nb-filter]');
  if (chip){ filter.tag = chip.dataset.nbFilter || null; renderNotebook(); return; }
  const el = e.target.closest('[data-nb]'); if (!el) return;
  const act = el.dataset.nb, id = el.dataset.id;
  if (act === 'close') return toggleNotebook();
  if (act === 'tonight'){ $('#nbTonightText').textContent = tonightText(); $('#nbTonight').classList.add('show'); copyText(tonightText()); return; }
  if (act === 'tonight-close') return $('#nbTonight').classList.remove('show');
  if (act === 'tonight-copy'){ copyText($('#nbTonightText').textContent); el.textContent = 'Copied ✓'; setTimeout(() => el.textContent = 'Copy to clipboard', 1500); return; }
  if (act === 'undo' && lastDeleted){ notes().splice(lastDeleted.index, 0, lastDeleted.note); lastDeleted = null; return save(); }
  const n = notes().find(x => x.id === id); if (!n) return;
  if (act === 'tag'){ const t = el.dataset.tag, i = n.tags.indexOf(t); if (i >= 0) n.tags.splice(i, 1); else n.tags.push(t); return save(); }
  if (act === 'pin'){ n.pin = !n.pin; return save(); }
  if (act === 'done'){ n.done = !n.done; return save(); }
  if (act === 'del'){ const arr = notes(), i = arr.indexOf(n); lastDeleted = { note:n, index:i }; arr.splice(i, 1); return save(); }
}

function ensureNotebookUI(){
  if (!$('#nbStyle')){
    const st = document.createElement('style'); st.id = 'nbStyle'; st.textContent = `
    body.player #btnNotebook, body.screen #btnNotebook{display:none !important}
    #nbDrawer{position:fixed;top:68px;right:12px;bottom:12px;width:372px;max-width:calc(100vw - 24px);z-index:20;background:var(--glass-strong);-webkit-backdrop-filter:var(--blur);backdrop-filter:var(--blur);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--spec),var(--lift);display:flex;flex-direction:column;overflow:hidden;transform:translateX(calc(100% + 24px));transition:transform .45s var(--ease)}
    #nbDrawer.open{transform:none}
    #nbDrawer .nb-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--line);color:var(--ink);font-size:16px}
    #nbDrawer .nb-head-tools{display:flex;gap:6px}
    #nbDrawer button{background:rgba(0,0,0,.3);border:1px solid var(--line);border-radius:8px;color:var(--ink);padding:4px 8px;font:inherit;font-size:13px;cursor:pointer}
    #nbDrawer button.on{border-color:var(--gold);color:var(--gold-hi)}
    #nbDrawer .nb-filters{padding:10px 12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
    #nbDrawer .nb-filters input, #nbDrawer .nb-composer input{width:100%;background:rgba(0,0,0,.35);border:1px solid var(--line);border-radius:8px;color:var(--ink);padding:8px 10px;font:inherit;font-size:14px;box-sizing:border-box}
    #nbDrawer .nb-chips{display:flex;gap:4px;flex-wrap:wrap}
    #nbList{flex:1;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
    #nbDrawer .nb-empty{color:var(--dim);font-size:13px;padding:8px}
    #nbDrawer .nb-note{border:1px solid var(--line);border-radius:var(--r-lg);padding:8px 10px;color:var(--ink)}
    #nbDrawer .nb-note.pinned{border-color:var(--gold-line)}
    #nbDrawer .nb-note.done .nb-text{text-decoration:line-through;opacity:.6}
    #nbDrawer .nb-meta{display:flex;justify-content:space-between;align-items:center;color:var(--dim);font-size:12px;margin-bottom:4px}
    #nbDrawer .nb-tools{display:flex;gap:2px}
    #nbDrawer .nb-tools button{padding:2px 5px;font-size:12px}
    #nbDrawer .nb-text{font-size:14px;white-space:pre-wrap;word-break:break-word}
    #nbDrawer .nb-tags{display:flex;gap:2px;margin-top:6px}
    #nbDrawer .nb-tag{padding:2px 5px;font-size:12px;opacity:.45}
    #nbDrawer .nb-tag.on{opacity:1;border-color:var(--gold)}
    #nbDrawer #nbUndo{display:none;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid var(--line);color:var(--ink);font-size:13px}
    #nbDrawer .nb-composer{padding:10px 12px;border-top:1px solid var(--line)}
    #nbDrawer #nbTonight{position:absolute;inset:0;background:var(--glass-strong);-webkit-backdrop-filter:var(--blur);backdrop-filter:var(--blur);padding:14px;display:none;flex-direction:column;gap:10px;color:var(--ink)}
    #nbDrawer #nbTonight.show{display:flex}
    #nbDrawer #nbTonight pre{flex:1;overflow:auto;white-space:pre-wrap;word-break:break-word;font:inherit;font-size:13px;margin:0}
    #nbDrawer .nb-tonight-head{display:flex;justify-content:space-between;align-items:center}`;
    document.head.appendChild(st);
  }
  if (!$('#nbDrawer')){
    const dr = document.createElement('div'); dr.id = 'nbDrawer';
    dr.innerHTML = `<div class="nb-head"><b>📓 Notebook</b><span class="nb-head-tools">
      <button data-nb="tonight" title="Copy tonight's notes as plain text">📋 Tonight's notes</button>
      <button data-nb="close" title="Close">✕</button></span></div>
      <div class="nb-filters"><input id="nbSearch" placeholder="Search notes…" autocomplete="off">
      <div class="nb-chips"><button data-nb-filter="" class="on">All</button>${TAGS.map(([id, e, name]) => `<button data-nb-filter="${id}" title="${name}">${e}</button>`).join('')}</div></div>
      <div id="nbList"></div>
      <div id="nbUndo"><span>Note deleted.</span><button data-nb="undo">Undo</button></div>
      <div class="nb-composer"><input id="nbText" placeholder="Jot it down — Enter adds · #npc #loot #hook…" autocomplete="off"></div>
      <div id="nbTonight"><div class="nb-tonight-head"><b>📋 Tonight's notes</b><button data-nb="tonight-close">✕</button></div><pre id="nbTonightText"></pre><button data-nb="tonight-copy">Copy to clipboard</button></div>`;
    document.body.appendChild(dr);
    dr.addEventListener('click', onDrawerClick);
    dr.querySelector('#nbText').addEventListener('keydown', e => { if (e.key === 'Enter'){ if (addNote(e.target.value)) e.target.value = ''; } });
    dr.querySelector('#nbSearch').addEventListener('input', e => { filter.q = e.target.value; renderNotebook(); });
  }
  if (!$('#btnNotebook')){
    const b = document.createElement('button'); b.className = 'icon'; b.id = 'btnNotebook'; b.title = 'Notebook (N)'; b.textContent = '📓';
    b.onclick = () => toggleNotebook();
    const help = $('#btnHelp'); if (help) help.before(b); else $('#topbar')?.appendChild(b);
  }
}

// the 📓 button, for the DM's screen (hidden for players and the table screen by the CSS above)
ensureNotebookUI();
