/* The command palette — every frequent action a few keystrokes away. Ctrl+K (⌘K) or / opens it,
   arrows + Enter run, Esc closes; on a phone a 🔎 button opens it. Commands come from a registry
   (registerCommands, so more can be added without touching this file) plus entries built fresh on
   each open (tabs, creatures, library, maps, tokens, the hero's own actions), so the list always
   matches the table as it stands. The most recently used commands come first. */
import { state, ui, isDM, tokById } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { toast, renderTabs, renderDock, openFightSetup } from './hud.js';
import { renderPanel } from './panels.js';
import { select, doPing } from '../game/actions.js';
import { setMode, pickTile } from './input.js';
import { focusTile } from '../render/scene.js';
import { placeMonster, rollInitiative, nextTurn } from '../game/combat.js';
import { shortRest, longRest } from '../game/resources.js';
import { outbox, sendAllHeld, renderOutbox } from '../game/outbox.js';
import { hostTable } from '../net/table.js';
import { goToMap, library, away, returnToParty } from '../game/maps.js';
import { libraryList } from '../engine/maps.js';
import { freeTilesNear } from '../engine/grid.js';
import { bestList } from '../data/bestiary.js';
import { SPELLS, FEATS } from '../data/srd.js';
import { MAGIC_ITEMS } from '../data/srd-items.js';
import { cardAct, setCardOnly } from './cards.js';

// a registry entry: { id, n, hint, icon, role:'dm'|'player'|'both', run }
const registry = [];
export function registerCommands(list){
  for (const c of (list || [])) if (c && c.id && typeof c.run === 'function') registry.push(c);
}

// a small subsequence match: every query character in order, with bonuses for word starts and runs
function fuzzy(q, text){
  q = q.toLowerCase(); text = text.toLowerCase();
  let ti = 0, score = 0, run = 0;
  for (const ch of q){
    const i = text.indexOf(ch, ti);
    if (i < 0) return -1;
    score += 1;
    if (i === 0 || /[\s\-']/.test(text[i - 1])) score += 3;   // a word start
    if (i === ti) run += 1; else run = 0;                     // consecutive letters
    score += run;
    ti = i + 1;
  }
  return score;
}

// The name counts far more than the hint; letters together at a word start ("gh" in Ghoul) most of all.
// (Without that, "gh" found a Berserker Axe first, through "Greataxe, or Halberd" in its hint.)
function rank(q, c){
  const ql = q.toLowerCase().trim(), n = c.n.toLowerCase();
  let s = fuzzy(ql, n);
  if (s >= 0){
    s *= 2;
    const at = n.indexOf(ql);
    if (at >= 0) s += 20 + (at === 0 || /[\s\-']/.test(n[at - 1]) ? 20 : 0);
    return s;
  }
  return fuzzy(ql, c.hint || '');
}

const MRU_KEY = 'dreaddelve.palette.mru.v1';
const mru = () => { try { return JSON.parse(localStorage.getItem(MRU_KEY) || '[]'); } catch { return []; } };
function noteMru(id){ try { localStorage.setItem(MRU_KEY, JSON.stringify([id, ...mru().filter(x => x !== id)].slice(0, 10))); } catch {} }

// the panel's tab switch, as the tab buttons do it, opening the panel if it was closed
function switchTab(k){
  ui.tab = k;
  if (k !== 'build' && ['room', 'corridor', 'door', 'trap', 'stairs', 'erase', 'dig', 'fill', 'rough', 'prop', 'house'].includes(ui.mode)) setMode('select');
  if ($('#panel.closed')) $('#btnPanel')?.click();
  renderTabs(); renderPanel(); renderDock();
}

// 📖 Look it up, on the tab that holds it (Table for the DM, Your hero for a player)
function openLookUp(name){
  ui.libQ = name || '';
  switchTab(isDM() ? 'table' : 'hero');
  $('#libQ')?.focus();
}

// a creature goes at the selected token's square (or the nearest free square beside it), else the centre of view
function placeAtSelection(bid){
  const sel = ui.selected && tokById(ui.selected);
  const tries = [];
  if (sel) tries.push({ floor:sel.floor, x:sel.x, y:sel.y });
  const centre = pickTile(innerWidth / 2, innerHeight / 2);
  if (centre) tries.push(centre);
  for (const t of tries){
    const spot = freeTilesNear(t.floor, t.x, t.y, 1, true)[0];
    if (spot){ placeMonster(bid, { floor:t.floor, x:spot.x, y:spot.y }); return; }
  }
  toast('Nowhere to put it here.');
}

function buildCommands(){
  const dm = isDM(), role = dm ? 'dm' : 'player';
  const list = registry.filter(c => c.role === 'both' || c.role === role);
  if (dm){
    for (const [k, icon, label] of [['story', '📖', 'Story'], ['valley', '🏔', 'Valley'], ['tokens', '👥', 'Tokens'], ['bestiary', '🐾', 'Beasts'], ['dungeon', '🗺', 'Maps'], ['build', '🛠', 'Build'], ['gaze', '👁', 'Gaze'], ['table', '📺', 'Table'], ['night', '🌙', 'Night']])
      list.push({ id:`tab:${k}`, n:`Go to ${label}`, hint:'Tab', icon, role:'dm', run(){ switchTab(k); } });
    list.push({ id:'fight', n:'Start a fight', hint:state.combat.active ? 'Roll initiative again' : 'Pick who fights', icon:'⚔', role:'dm',
      run(){ if (state.combat.active) rollInitiative({ ids:[...state.combat.order], group:state.combat.group ?? true, surprise:'none' }); else openFightSetup(); } });
    if (state.combat.active) list.push({ id:'next', n:'Next turn', hint:'Advance the fight', icon:'⏭', role:'dm', run:nextTurn });
    if (outbox.length) list.push({ id:'sendAll', n:'Send everything in the outbox', hint:`${outbox.length} held`, icon:'📤', role:'dm',
      run(){ sendAllHeld(); document.querySelectorAll('#cardLayer .held').forEach(e => e.remove()); renderOutbox(); } });
    for (const b of bestList()) list.push({ id:`creature:${b.id}`, n:`Place ${b.name}`, hint:`CR ${b.cr ?? '?'} · ${b.id.startsWith('srd-') ? 'SRD' : b.lib ? 'your books' : 'Barovia'}`, icon:'🐾', role:'dm', run(){ placeAtSelection(b.id); } });
    for (const s of SPELLS) list.push({ id:`spell:${s.n}`, n:s.n, hint:`${s.l ? `Level ${s.l}` : 'Cantrip'} spell`, icon:'✨', role:'dm', run(){ openLookUp(s.n); } });
    for (const i of MAGIC_ITEMS) list.push({ id:`item:${i.n}`, n:i.n, hint:[i.rarity, i.type].filter(Boolean).join(' ') || 'Magic item', icon:'💎', role:'dm', run(){ openLookUp(i.n); } });
    for (const n of Object.keys(FEATS)) if (n !== 'Other') list.push({ id:`feat:${n}`, n, hint:'Feat', icon:'🎖', role:'dm', run(){ openLookUp(n); } });
    const w = away();
    for (const e of libraryList(library())) list.push({ id:`map:${e.id}`, n:`Go to ${e.name}`, hint:`${e.floors.length} floor${e.floors.length === 1 ? '' : 's'}`, icon:'🗺', role:'dm',
      run(){ if (w?.mapId === e.id) returnToParty(); else goToMap({ id:e.id }); } });
    for (const t of state.tokens.filter(t => !t.flags?.gone)) list.push({ id:`token:${t.id}`, n:t.name, hint:t.kind === 'pc' ? 'Hero' : t.kind === 'npc' ? 'Ally' : `Creature${t.dead ? ' · down' : ''}`, icon:t.kind === 'pc' ? '👤' : '🐾', role:'dm',
      run(){ select(t.id); const tok = tokById(t.id); if (tok) focusTile(tok.floor, tok.x, tok.y); } });
  } else {
    const me = tokById(ui.myToken);
    if (me){
      me.attacks?.forEach((a, i) => list.push({ id:`atk:${i}`, n:a.n, hint:`Attack · +${a.b} · ${a.d}`, icon:'⚔', role:'player', run(){ cardAct('atk', i); } }));
      me.casts?.forEach((s, i) => list.push({ id:`cast:${i}`, n:s.n, hint:s.mon ? 'Action' : (s.l ? `Level ${s.l} spell` : 'Cantrip'), icon:'✨', role:'player', run(){ cardAct('cast', i); } }));
      (me.resources || []).filter(r => !r.slot).forEach(r => list.push({ id:`feat:${r.id}`, n:r.n, hint:'Feature', icon:'🎖', role:'player', run(){ cardAct('feat', 0, r.id); } }));
    }
    list.push({ id:'cardonly', n:ui.cardOnly ? 'Card only: off' : 'Card only: on', hint:'Just your hero, big', icon:'📇', role:'player', run(){ setCardOnly(!ui.cardOnly); } });
  }
  return list;
}

let palOpen = false, palSel = 0, palRows = [];

export function togglePalette(){
  if (!state) return;
  if (palOpen) closePalette(); else openPalette();
}
export function closePalette(){ palOpen = false; $('#palModal')?.classList.add('hidden'); }
function openPalette(){
  ensurePaletteUI();
  palOpen = true;
  $('#palModal').classList.remove('hidden');
  const q = $('#palQ'); q.value = ''; renderPal(''); q.focus();
}
function renderPal(q){
  const m = mru();
  const scored = buildCommands().map(c => ({ c, s:q ? rank(q, c) : 0 })).filter(x => !q || x.s >= 0);
  scored.sort((a, b) => {
    const ma = m.indexOf(a.c.id), mb = m.indexOf(b.c.id);
    if ((ma < 0) !== (mb < 0)) return ma < 0 ? 1 : -1;
    if (ma >= 0 && mb >= 0 && ma !== mb) return ma - mb;
    return b.s - a.s || a.c.n.localeCompare(b.c.n);
  });
  palRows = scored.slice(0, 12).map(x => x.c);
  palSel = 0;
  $('#palList').innerHTML = palRows.length ? palRows.map((c, i) => `<button class="pal-row ${i === palSel ? 'sel' : ''}" data-pal="${i}"><span class="pal-icon">${c.icon || '·'}</span><span class="pal-name">${esc(c.n)}</span>${c.hint ? `<span class="pal-hint">${esc(c.hint)}</span>` : ''}</button>`).join('')
    : `<div class="pal-empty">Nothing by that name. Try a tab, a creature, a spell, a map, or a hero.</div>`;
}
function moveSel(d){
  if (!palRows.length) return;
  palSel = (palSel + d + palRows.length) % palRows.length;
  document.querySelectorAll('#palList .pal-row').forEach((el, i) => el.classList.toggle('sel', i === palSel));
}
function runPal(i){
  const c = palRows[i]; if (!c) return;
  noteMru(c.id); closePalette(); c.run();
}

// every key, the palette's included
const KEYS = [
  ['Ctrl+K or /', 'Command palette'], ['?', 'This sheet'],
  ['N', 'Next turn in a fight · the notebook out of one'],
  ['← ↑ → ↓ / number pad', 'Step the selected creature one square'],
  ['PgUp / PgDn', 'Floor down / up'], ['1 / 2 / 3', 'Tilt / Top / Stack view'],
  ['F', 'Focus the selected creature'], ['W', 'Roll the Whim Die (DM)'], ['B', 'Build tab (DM)'],
  ['Del', 'Remove the selected token (DM)'], ['Ctrl+Z', 'Undo (DM)'], ['Esc', 'Cancel'],
];
export function showShortcuts(){
  ensurePaletteUI();
  $('#keysList').innerHTML = KEYS.map(([k, d]) => `<div class="keys-row"><b>${esc(k)}</b><span>${esc(d)}</span></div>`).join('');
  $('#keysModal').classList.remove('hidden');
}
export function closeShortcuts(){ $('#keysModal')?.classList.add('hidden'); }

function ensurePaletteUI(){
  if (!$('#palStyle')){
    const st = document.createElement('style'); st.id = 'palStyle'; st.textContent = `
    @media (min-width:761px){ #btnPalette{display:none !important} }
    #palBox{width:min(520px,100%)}
    #palBox #palQ{width:100%;background:rgba(0,0,0,.35);border:1px solid var(--line);border-radius:12px;color:var(--ink);padding:11px 14px;font:inherit;font-size:16px;box-sizing:border-box;margin-bottom:10px}
    #palList{display:flex;flex-direction:column;gap:2px;max-height:50vh;overflow:auto}
    #palList .pal-row{display:flex;align-items:center;gap:10px;width:100%;background:none;border:1px solid transparent;border-radius:10px;color:var(--ink);padding:8px 10px;font:inherit;font-size:15px;text-align:left;cursor:pointer}
    #palList .pal-row.sel{background:rgba(233,197,110,.16);border-color:var(--gold-line)}
    #palList .pal-icon{flex:none;width:22px;text-align:center}
    #palList .pal-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #palList .pal-hint{flex:none;color:var(--dim);font-size:13px}
    #palList .pal-empty{color:var(--dim);font-size:14px;padding:10px}
    #palBox .pal-foot{color:var(--dim);font-size:12px;margin-top:10px}
    #keysModal .keys-row{display:flex;gap:14px;padding:5px 0;border-bottom:1px solid var(--line);font-size:14px;color:var(--ink)}
    #keysModal .keys-row b{flex:none;min-width:180px;color:var(--gold-hi)}
    #keysModal .keys-head{display:flex;justify-content:space-between;align-items:center}
    #keysModal .keys-head button{background:rgba(0,0,0,.3);border:1px solid var(--line);border-radius:8px;color:var(--ink);padding:4px 10px;font:inherit;font-size:13px;cursor:pointer}`;
    document.head.appendChild(st);
  }
  if (!$('#palModal')){
    const m = document.createElement('div'); m.className = 'modal hidden'; m.id = 'palModal';
    m.innerHTML = `<div class="box" id="palBox"><input id="palQ" placeholder="Type a command, creature, spell, map…" autocomplete="off"><div id="palList"></div><div class="pal-foot">↑↓ move · Enter run · Esc close</div></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) closePalette(); });
    m.querySelector('#palList').addEventListener('click', e => { const row = e.target.closest('[data-pal]'); if (row) runPal(+row.dataset.pal); });
    const q = m.querySelector('#palQ');
    q.addEventListener('input', e => renderPal(e.target.value));
    q.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown'){ e.preventDefault(); moveSel(1); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); moveSel(-1); }
      else if (e.key === 'Enter'){ e.preventDefault(); runPal(palSel); }
      else if (e.key === 'Escape'){ e.preventDefault(); closePalette(); }
    });
  }
  if (!$('#keysModal')){
    const m = document.createElement('div'); m.className = 'modal hidden'; m.id = 'keysModal';
    m.innerHTML = `<div class="box"><div class="keys-head"><h2 style="margin:0">Keyboard shortcuts</h2><button data-keys="close">✕</button></div><div id="keysList" style="margin-top:12px"></div></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-keys="close"]')) closeShortcuts(); });
  }
  if (!$('#btnPalette')){
    const b = document.createElement('button'); b.className = 'icon'; b.id = 'btnPalette'; b.title = 'Command palette (Ctrl+K)'; b.textContent = '🔎';
    b.onclick = () => togglePalette();
    const help = $('#btnHelp'); if (help) help.before(b); else $('#topbar')?.appendChild(b);
  }
}

// the standing commands; the rest are built fresh on each open (see buildCommands)
registerCommands([
  { id:'host', n:'Host the table', hint:'Table', icon:'📡', role:'dm', run(){ hostTable(); renderPanel(); } },
  { id:'shortRest', n:'Short rest', hint:'An hour: features come back', icon:'☕', role:'dm', run:shortRest },
  { id:'longRest', n:'Long rest', hint:'Eight hours: full HP, every slot', icon:'🌙', role:'dm', run:longRest },
  { id:'lookup', n:'Look it up', hint:'Spells, items, feats', icon:'📖', role:'both', run(){ openLookUp(''); } },
  { id:'shortcuts', n:'Keyboard shortcuts', hint:'Every key, including this palette', icon:'⌨', role:'both', run:showShortcuts },
  { id:'ping', n:'Ping the map', hint:'At your hero', icon:'◎', role:'player', run(){ const t = tokById(ui.myToken); if (t) doPing({ floor:t.floor, x:t.x, y:t.y }, t.name); } },
]);

// the 🔎 button, for phones (hidden on wider screens by the CSS above)
ensurePaletteUI();
