/* 🕹 THE HANDHELD'S LITTLE LIFE: its tunes and its coach, for both ways of holding it (the table, ui/tablehh.js, and
   the Wanderer, ui/wander.js).
     · tunes: ChatGPT's minor-key jingles (engine/chiptune.js → audio/sound.js playTune): switching on, your turn, a
       level, a fight won or lost, a quest, a save state, the menu's blips, a door, the stairs, a heal, a hit
     · the coach: ChatGPT's engine/coach.js picks one short tip that fits the moment (worded for the handheld, a
       controller or the keys), shown as a line on the screen; any press or a tap puts it away. It remembers what's been
       said and what the player has shown they know (kept per device), and the menu can turn it off.
   Both follow the menu's Handheld & camera page (hh.chip, hh.tips) and the player's sound settings. */
import { events } from '../engine/chiptune.js';
import { nextTip, learn, reset } from '../engine/coach.js';
import { playTune } from '../audio/sound.js';
import { hh, hhOn } from './handheld.js';

/* ---------- tunes ---------- */
export function tune(id, opts){ if (hh.chip === false) return; try { playTune(events(id), opts); } catch {} }

/* ---------- the coach ---------- */
const KEY = 'dreaddelve.coach.v1';
let mem = reset(); try { mem = { ...reset(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
let lastTick = 0, lastDid = 'none', shownAt = 0, sitAt = 0, savedAt = '', shownFor = '';
// the moment a tip was shown for: once the fight starts or ends, or the turn changes hands, it's old news
const momentOf = s => s ? `${!!s.fight}:${!!s.myTurn}:${!!s.down}` : '';
// off the handheld the tip is a small pill in the middle, under the fight's turn order when that's up (it used to be
// a bar the width of the screen, over the order's portraits)
function placeTip(e){
  if (hhOn()){ e.style.top = ''; return; }
  const o = document.getElementById('wdOrder'), r = o && !o.classList.contains('hidden') && o.getClientRects().length ? o.getBoundingClientRect() : null;
  e.style.top = r && r.bottom > 0 ? `${Math.round(r.bottom + 8)}px` : '';
}
const save = () => { const s = JSON.stringify(mem); if (s === savedAt) return; savedAt = s; try { localStorage.setItem(KEY, s); } catch {} };
// The player did something the coach teaches ('strike', 'cast', 'endTurn', 'aim', 'camera', 'sheet', 'menu', 'stairs', 'door', 'dash'…)
export function coachLearn(action){ if (!action) return; lastDid = action; mem = learn(mem, action); save(); }
function el(){
  let e = document.getElementById('hhTip');
  if (!e){ e = document.createElement('div'); e.id = 'hhTip'; e.className = 'hidden'; e.addEventListener('click', coachDone); document.body.appendChild(e); }
  return e;
}
// Put the tip away (any press, a tap on it)
export function coachDone(){ const e = document.getElementById('hhTip'); if (e && !e.classList.contains('hidden')) e.classList.add('hidden'); }
/* Every frame from a host while it holds the handheld (or plays the Wanderer): snapFn() makes the coach's snapshot
   without now, mode, justDid or sessionMs (engine/coach.js); it's only called when the coach asks, once a second. */
export function coachTick(snapFn, now = performance.now()){
  if (!sitAt) sitAt = now;
  const e = el();
  if (hh.tips === false || mem.muted){ e.classList.add('hidden'); return; }
  if (!e.classList.contains('hidden') && now - shownAt > 9000) e.classList.add('hidden');
  if (now - lastTick < 1000) return; lastTick = now;
  const snap = snapFn(); if (!snap){ e.classList.add('hidden'); return; }
  if (!e.classList.contains('hidden') && momentOf(snap) !== shownFor) e.classList.add('hidden');
  const pad = [...(navigator.getGamepads?.() || [])].some(g => g && g.connected);
  const mode = hhOn() ? 'handheld' : pad ? 'pad' : 'keys';
  const r = nextTip({ ...snap, now:Date.now(), mode, justDid:lastDid, sessionMs:now - sitAt }, mem);
  mem = r.memory; lastDid = 'none'; save();
  if (r.tip){ e.textContent = `💡 ${r.tip.text}`; e.classList.remove('hidden'); shownAt = now; shownFor = momentOf(snap); placeTip(e); }
}
export function coachHide(){ el().classList.add('hidden'); }
export const coachMemory = () => mem;
