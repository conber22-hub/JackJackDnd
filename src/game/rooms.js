/* ROOMS AT THE TABLE — reading a room aloud, furnishing rooms by hand (old saves, hand-drawn rooms), and the
   DM's prompt when the party first walks into a room ("📜 Read aloud?"). */
import { state, ui } from '../engine/state.js';
import { roomById } from '../engine/generator.js';
import { furnishRoom, clearRoomProps } from '../engine/dressing.js';
import { describeRoom } from '../data/descriptions.js';
import { THEMES } from '../data/themes.js';
import { $, esc } from '../util/core.js';
import { buildFloor } from '../render/floors.js';
import { showCard, toast } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { changed, snapshot } from './session.js';

const themeOf = f => THEMES[f.theme]?.id;
const propsIn = (f, r) => (f.props || []).filter(p => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h).length;

export function readRoom(L, id){
  const f = state.floors[L], r = f && roomById(f, id); if (!r) return;
  const text = r.read || r.notes;
  if (!text){ toast('This room has no read-aloud yet — write one, or 📜 Describe rooms.'); return; }
  showCard({ kind:'', title:r.name || 'A room', flair:text });
  r.read && (r.told = true); dropPrompt(L, id); changed();
}
// Furniture: one room (adds to what's there) or every room on the floor that has none.
export function furnish(L, id = null){
  const f = state.floors[L]; if (!f) return;
  snapshot('furnish');
  const rooms = id === null ? f.rooms.filter(r => !propsIn(f, r)) : [roomById(f, id)].filter(Boolean);
  let n = 0; for (const r of rooms) n += furnishRoom(f, r, themeOf(f), Math.random, { rename:false });
  buildFloor(L); changed(); renderPanel();
  toast(n ? `${n} piece${n === 1 ? '' : 's'} of furniture in ${rooms.length} room${rooms.length === 1 ? '' : 's'}.` : 'No space left for furniture there.');
}
export function clearFurniture(L, id){
  const f = state.floors[L], r = f && roomById(f, id); if (!r) return;
  snapshot('clear furniture'); const n = clearRoomProps(f, r);
  buildFloor(L); changed(); renderPanel(); toast(`${n} prop${n === 1 ? '' : 's'} cleared.`);
}
export function describeRooms(L){
  const f = state.floors[L]; if (!f) return;
  let n = 0; for (const r of f.rooms) if (!r.read){ r.read = describeRoom(r, themeOf(f), Math.random); n++; }
  changed(); renderPanel(); toast(n ? `${n} room${n === 1 ? '' : 's'} described.` : 'Every room here already has a read-aloud.');
}

/* ---------- first steps into a room ---------- */
const prompts = [];
// Called as a hero moves: the first time anyone of the party stands in a room, the DM is offered its read-aloud.
export function enteredRoom(L, x, y){
  if (ui.role !== 'dm' || ui.roomPrompts === false) return;
  const f = state.floors[L], r = f?.rooms.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  if (!r || r.entered) return;
  r.entered = true;
  if (!(r.read || r.notes) || r.told) return;
  if (!prompts.some(p => p.L === L && p.id === r.id)) prompts.push({ L, id:r.id });
  while (prompts.length > 2) prompts.shift();
  renderPrompts();
}
function dropPrompt(L, id){ const i = prompts.findIndex(p => p.L === L && p.id === id); if (i >= 0){ prompts.splice(i, 1); renderPrompts(); } }
export function answerPrompt(L, id, read){ if (read) readRoom(L, id); else dropPrompt(L, id); }
export function clearPrompts(){ prompts.length = 0; renderPrompts(); }
export function renderPrompts(){
  const el = $('#roomPrompts'); if (!el) return;
  if (ui.role !== 'dm' || ui.tableView){ el.innerHTML = ''; return; }
  el.innerHTML = prompts.map(p => { const r = roomById(state.floors[p.L], p.id); if (!r) return '';
    return `<div class="req"><div class="w">📜 The party enters <b>${esc(r.name || 'a room')}</b><div class="muted" style="font-size:12px;margin-top:2px">${esc((r.read || r.notes).slice(0, 140))}${(r.read || r.notes).length > 140 ? '…' : ''}</div></div>
      <div class="b"><button class="btn small primary" data-act="promptRead" data-k="${p.L}" data-id="${p.id}">Read it aloud</button><button class="btn small" data-act="promptSkip" data-k="${p.L}" data-id="${p.id}">Not now</button></div></div>`; }).join('');
}
