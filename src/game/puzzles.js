/* PUZZLES AT THE TABLE — ChatGPT's puzzle engine (engine/puzzles.js) in the rooms. The DM sets one in a room from
   the Build tab: levers, statues, dials, a riddle, mirrors or a scale. When the room has a door, the puzzle locks it
   and solving opens it. Heroes standing in the room work it from their phones; the DM's app checks each move
   (their own hero, in the room, on that floor) and plays it; a wrong move may set off a trap, which the DM resolves.
   f.puzzles: [{ id, room, door (a door id or null), name, state, last (the latest line), trap (a trap kind waiting) }]
   Players are sent only each puzzle's view (engine/redact.js): never its solution. */
import { state, ui, log, tokById } from '../engine/state.js';
import { makePuzzle, act, view, hint, KINDS } from '../engine/puzzles.js';
import { roomById, inRoom } from '../engine/generator.js';
import { toPlayers } from './outbox.js';
import { changed, snapshot } from './session.js';
import { buildFloor } from '../render/floors.js';
import { toast, showCard } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { bus } from '../util/core.js';

export const PUZZLE_KINDS = KINDS;
const kindName = k => KINDS.find(x => x.id === k)?.name || k;
export const puzzlesOn = L => state?.floors[L]?.puzzles || [];
export const puzzleById = (L, id) => puzzlesOn(L).find(p => p.id === id) || null;
export const puzzleIn = (L, roomId) => puzzlesOn(L).find(p => p.room === roomId) || null;
// The puzzle in the room where a token stands, if any.
export function puzzleAt(t){
  if (!t) return null; const f = state.floors[t.floor]; if (!f) return null;
  return puzzlesOn(t.floor).find(p => { const r = roomById(f, p.room); return r && inRoom(r, t.x, t.y); }) || null;
}
// A door on the room's edge (the square just outside its wall, or in its doorway), nearest the room's middle.
function doorOf(f, r){
  let best = null, bd = Infinity;
  for (const d of f.doors || []){
    const x = d.i % f.W, y = (d.i / f.W) | 0;
    const touches = x >= r.x - 1 && x <= r.x + r.w && y >= r.y - 1 && y <= r.y + r.h;   // (in its doorway, or just outside its wall)
    if (!touches) continue; const dd = Math.abs(x - r.cx) + Math.abs(y - r.cy); if (dd < bd){ bd = dd; best = d; }
  }
  return best;
}

// The DM sets a puzzle in a room (replacing any there). Its door, if it has one, is locked until it's solved.
export function setPuzzle(L, roomId, kind, difficulty = 2){
  const f = state.floors[L], r = f && roomById(f, roomId); if (!r || !KINDS.some(k => k.id === kind)) return null;
  snapshot('puzzle');
  f.puzzles = (f.puzzles || []).filter(p => p.room !== roomId);
  const s = makePuzzle(kind, { seed:`${state.meta.seed}|puzzle|${L}|${roomId}|${Date.now()}`, difficulty:+difficulty || 2 });
  const door = doorOf(f, r);
  const p = { id:`pz${(f.nextObj = (f.nextObj || 1) + 1)}`, room:roomId, door:door?.id ?? null, name:kindName(kind), state:s, last:'', trap:null };
  if (door && door.state !== 'secret'){ p.doorWas = door.state; door.state = 'locked'; }
  f.puzzles.push(p);
  log(`🧩 ${p.name} set in ${r.name}${door ? ' (it holds the door shut)' : ''}.`, true);
  buildFloor(L); changed(); renderPanel();
  return p;
}
export function removePuzzle(L, id){
  const f = state.floors[L], p = puzzleById(L, id); if (!p) return;
  snapshot('remove puzzle');
  const door = (f.doors || []).find(d => d.id === p.door); if (door && !p.state.solved && p.doorWas) door.state = p.doorWas;
  f.puzzles = f.puzzles.filter(x => x !== p);
  buildFloor(L); changed(); renderPanel(); bus.emit('puzzle', null);
}
export function resetPuzzle(L, id){
  const p = puzzleById(L, id); if (!p) return;
  p.state = makePuzzle(p.state.kind, { seed:p.state.seed, difficulty:p.state.difficulty }); p.last = 'The mechanism settles back as it was.'; p.trap = null;
  changed(); bus.emit('puzzle', p);
}
// A hint for a good Investigation (or Wisdom) check: the DM gives it to the table.
export function puzzleHint(L, id, level){
  const p = puzzleById(L, id); if (!p) return;
  const text = hint(p.state, level);
  toPlayers({ t:'card', c:{ kind:'', title:`🧩 ${p.name}`, sub:'A hint', lines:[text] } }, 'dm');
  showCard({ kind:'', title:`🧩 ${p.name}`, sub:`Hint ${level}, sent to the table`, lines:[text] }, false);   // (already sent: once is enough)
}

/* A move on a puzzle: by the DM, or from a player's phone (net/table.js checks the hero is in the room first).
   → the event ('moved', 'wrong', 'reset', 'trap', 'solved', 'invalid') */
export function playPuzzle(L, id, action, who = null){
  const f = state.floors[L], p = puzzleById(L, id); if (!p || p.state.solved) return 'invalid';
  const out = act(p.state, action);
  if (out.event === 'invalid') return 'invalid';
  p.state = out.state; p.last = out.text || '';
  const r = roomById(f, p.room), name = who ? tokById(who)?.name : null;
  if (out.event === 'trap'){
    p.trap = out.state.lastTrap || 'darts';
    showCard({ kind:'bad', title:`🧩 ${p.name}: a trap`, sub:`${name || 'Someone'} got it wrong in ${r?.name || 'the room'}`, lines:[`It sets off: <b>${p.trap}</b>. Resolve it as the room's trap (a save, the damage) — or let it pass.`] }, false);
    log(`🧩 ${name || 'The party'} set off the ${p.name}'s trap (${p.trap}).`, true);
  }
  if (out.event === 'solved'){
    const door = (f.doors || []).find(d => d.id === p.door);
    if (door && door.state === 'locked') door.state = 'open';
    const c = { kind:'good', title:`🧩 ${p.name}: solved`, sub:r?.name || '', lines:[out.text || 'Something gives, deep in the stone.', ...(door ? ['The door it held swings open.'] : [])] };
    toPlayers({ t:'card', c }, 'dm'); showCard(c, false);
    log(`🧩 ${name || 'The party'} solved the ${p.name} in ${r?.name || 'the room'}.`);
    buildFloor(L);
  }
  changed(); bus.emit('puzzle', p);
  return out.event;
}

// What a device shows for a puzzle: the DM sees everything; a player has only the view the DM sent.
export function puzzleView(p){ return p.state ? view(p.state, { dm:ui.role === 'dm' }) : p.view; }
