/* 💀 THREE HEARTS, THREE SKULLS: the death save's moment on screen. A hero at 0 hit points rolls a d20 on
   their turn, and the table holds its breath: the die tumbles in the middle of the screen, lands, and the
   new heart or skull fills. A natural 20 is gold and warm, the face loses its grey; dead turns the whole
   thing to blood and ash; stable settles in a quiet blue-grey. It takes plain data (the shape is ChatGPT's
   engine/death-saves.js, for one roll); Claude wires it in from deathSaveTurn(), and waits for onDone
   before the turn moves on. Any press closes it at once. A second save while one is up waits its turn, so
   two downed heroes both get their moment. Timers, not requestAnimationFrame: on a slow device a frame can
   take seconds, so an animation driven by frames would never finish (rounds 13–14). Things appear at full
   strength at once: a CSS transition fade-in never advances on this box's slow compositor (round 14). The
   moment sits at z-index 50 — above the game, the HUD (40) and the captions' stack (41, low on the screen),
   below the victory and defeat screens (60). */
import { esc } from '../util/core.js';

const TUMBLE_MS = 90;     // one step of the tumbling die
const TUMBLE_STEPS = 6;   // ~540 ms of tumbling before it lands — a few steps, a moment
const HOLD_MS = 2500;     // hold after landing, then it goes
const HOLD_RM_MS = 1200;  // reduced motion: the whole thing under 2 s
const OUTCOMES = ['success', 'failure', 'two', 'rise', 'stable', 'dead'];

const clamp3 = n => Math.min(3, Math.max(0, Math.trunc(Number(n) || 0)));
const clampD20 = n => { const v = Math.trunc(Number(n)); return Number.isFinite(v) ? Math.min(20, Math.max(1, v)) : 10; };

let el = null, cur = null, timers = [];
let queue = [];

function ensureStyle(){
  if (document.getElementById('deathSaveStyle')) return;
  const s = document.createElement('style'); s.id = 'deathSaveStyle';
  s.textContent = `#deathSave{position:fixed;z-index:50;left:50%;top:50%;transform:translate(-50%,-50%);width:min(360px,92vw);
  background:linear-gradient(180deg,rgba(23,18,26,.97),rgba(11,10,13,.98));color:var(--ink);
  border:1px solid var(--line);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.7);
  font-family:var(--ui);padding:16px 18px 12px;text-align:center;box-sizing:border-box;cursor:pointer}
#deathSave *{box-sizing:border-box}
#deathSave.ds-mine{width:min(400px,94vw)}
.ds-face{width:56px;height:56px;border-radius:50%;border:1px solid #555;object-fit:cover;margin:0 auto 8px;background:#1a1512;filter:grayscale(1) brightness(.65)}
.ds-face.init{display:flex;align-items:center;justify-content:center;font-family:var(--regal);font-size:24px;color:#0b0d0a;background:#6f655d}
.ds-name{font-family:var(--regal);font-size:19px;color:var(--silver)}
#deathSave.ds-mine .ds-name{font-size:22px}
.ds-sub{font-size:11.5px;color:var(--faint);letter-spacing:.06em;margin-top:2px}
.ds-marks{margin-top:10px;display:flex;flex-direction:column;gap:3px;align-items:center}
.ds-row{display:flex;gap:6px;justify-content:center;font-size:20px;line-height:1}
.ds-h{color:rgba(239,225,200,.22)}
.ds-h.on{color:#e06666}
.ds-k{color:rgba(239,225,200,.22)}
.ds-k.on{color:#e8dcc8}
.ds-die{width:64px;height:64px;margin:13px auto 4px;transform:rotate(45deg);border:1px solid var(--gold-line);border-radius:10px;
  background:rgba(201,162,70,.08);display:flex;align-items:center;justify-content:center}
.ds-die-num{transform:rotate(-45deg);font-family:var(--regal);font-size:26px;color:var(--candle)}
.ds-words{font-family:var(--serif);font-style:italic;font-size:15px;line-height:1.5;color:var(--dim);margin-top:10px;min-height:22px}
.ds-hint{font-size:10.5px;color:var(--faint);margin-top:10px;letter-spacing:.04em}
/* the landed looks: a natural 20 is gold and warm, the face loses its grey; dead is blood and ash; stable is quiet blue-grey */
#deathSave.ds-landed.ds-rise{border-color:var(--gold-line);background:linear-gradient(180deg,rgba(46,34,12,.97),rgba(11,10,13,.98))}
#deathSave.ds-landed.ds-rise .ds-die{border-color:var(--gold-hi);background:rgba(201,162,70,.2);box-shadow:0 0 18px rgba(201,162,70,.45)}
#deathSave.ds-landed.ds-rise .ds-die-num{color:var(--gold-hi)}
#deathSave.ds-landed.ds-rise .ds-face{filter:none;border-color:var(--gold-hi);box-shadow:0 0 14px rgba(201,162,70,.5)}
#deathSave.ds-landed.ds-rise .ds-words{color:var(--gold-hi)}
#deathSave.ds-landed.ds-dead{border-color:rgba(194,58,70,.7);background:linear-gradient(180deg,rgba(40,10,12,.97),rgba(11,8,10,.98))}
#deathSave.ds-landed.ds-dead .ds-die{border-color:rgba(194,58,70,.8);background:rgba(194,58,70,.15)}
#deathSave.ds-landed.ds-dead .ds-die-num{color:#ffb3ad}
#deathSave.ds-landed.ds-dead .ds-words{color:#ffb3ad}
#deathSave.ds-landed.ds-dead .ds-k.on{color:#c23a46}
#deathSave.ds-landed.ds-stable{border-color:rgba(120,140,170,.6);background:linear-gradient(180deg,rgba(18,24,34,.97),rgba(11,10,13,.98))}
#deathSave.ds-landed.ds-stable .ds-words{color:#aebdd2}
/* the dying badge: a small element on a party card, ~20px tall, three tiny hearts and three tiny skulls */
.ds-badge{display:inline-flex;gap:2px;align-items:center;height:20px;font-size:12px;line-height:1;vertical-align:middle}
.ds-badge .ds-calm{color:#aebdd2;font-size:13px}
.ds-badge.ds-dead .ds-k.on{color:#c23a46}
body.hh-lcd #deathSave{border-radius:2px;box-shadow:none}
body.hh-lcd #deathSave .ds-die{border-radius:2px}`;
  document.head.appendChild(s);
}

function place(){
  if (!el) return;
  const cs = getComputedStyle(document.body);
  const on = document.body.classList.contains('hh');
  const x = parseFloat(cs.getPropertyValue('--hh-scr-x')), y = parseFloat(cs.getPropertyValue('--hh-scr-y')),
    w = parseFloat(cs.getPropertyValue('--hh-scr-w')), h = parseFloat(cs.getPropertyValue('--hh-scr-h'));
  if (on && Number.isFinite(x) && Number.isFinite(w) && Number.isFinite(h) && w > 40 && h > 40){
    // centred in the handheld's screen, a card — not the whole screen
    const pw = Math.min(340, w - 12);
    Object.assign(el.style, { left:`${x + w / 2}px`, top:`${y + h / 2}px`, width:`${pw}px`, transform:'translate(-50%,-50%)' });
  } else {
    Object.assign(el.style, { left:'50%', top:'50%', width:cur?.mine ? 'min(400px, 94vw)' : 'min(360px, 92vw)', transform:'translate(-50%,-50%)' });
  }
}

const faceHtml = () => {
  const name = cur.name, initial = (name.trim()[0] || '?').toUpperCase();
  return cur.face ? `<img class="ds-face" src="${esc(cur.face)}" alt="">` : `<div class="ds-face init">${esc(initial)}</div>`;
};
const marksHtml = (s, f) =>
  `<div class="ds-row">${[0, 1, 2].map(i => `<span class="ds-h${i < s ? ' on' : ''}">♥</span>`).join('')}</div>
   <div class="ds-row">${[0, 1, 2].map(i => `<span class="ds-k${i < f ? ' on' : ''}">☠</span>`).join('')}</div>`;
const clearTimers = () => { for (const t of timers) clearTimeout(t); timers = []; };

function render(){
  if (!el || !cur) return;
  const landed = cur.landed;
  el.classList.toggle('ds-landed', landed);
  if (landed) el.classList.add(`ds-${cur.outcome}`);
  el.querySelector('.ds-marks').innerHTML = marksHtml(landed ? cur.after.s : cur.before.s, landed ? cur.after.f : cur.before.f);
  el.querySelector('.ds-die-num').textContent = cur.shown;
  el.querySelector('.ds-words').textContent = landed ? cur.words : '';
}
function land(){ if (!cur) return; cur.landed = true; cur.shown = cur.d20; render(); }

function onKey(e){
  if (e.key === 'Escape'){ e.preventDefault(); close(); }
  else if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); deathSavePress('a'); }
}
function onClick(){ close(); }

function openOne(item){
  const { args, opts } = item;
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  cur = { ...args, onDone:typeof opts?.onDone === 'function' ? opts.onDone : null,
    reduced, landed:false, shown:args.d20 };
  ensureStyle();
  el = document.createElement('div');
  el.id = 'deathSave'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Death save');
  if (cur.mine) el.classList.add('ds-mine');
  el.innerHTML = `${faceHtml()}
    <div class="ds-name">${esc(cur.mine ? 'You' : cur.name)}</div>
    <div class="ds-sub">${esc(cur.mine ? cur.name : 'death save')}</div>
    <div class="ds-marks"></div>
    <div class="ds-die"><span class="ds-die-num">${cur.shown}</span></div>
    <div class="ds-words"></div>
    <div class="ds-hint">Ⓐ dismiss</div>`;
  el.addEventListener('click', onClick);
  document.body.appendChild(el);
  place();
  addEventListener('resize', place); addEventListener('keydown', onKey);
  render();
  if (reduced){ land(); timers.push(setTimeout(close, HOLD_RM_MS)); return; }
  // the die tumbles for a moment — a few timer steps of numbers — then lands on the roll
  let step = 0;
  const tick = () => { if (!cur) return;
    step++;
    if (step >= TUMBLE_STEPS){ land(); timers.push(setTimeout(close, HOLD_MS)); return; }
    let n = 1 + Math.floor(Math.random() * 20);
    if (n === cur.shown) n = (n % 20) + 1;   // the die visibly turns, not sticks
    cur.shown = n;
    const num = el.querySelector('.ds-die-num'); if (num) num.textContent = n;
    timers.push(setTimeout(tick, TUMBLE_MS)); };
  timers.push(setTimeout(tick, TUMBLE_MS));
}

export function showDeathSave({ name, face, before, after, d20, outcome, words, mine } = {}, { onDone } = {}){
  const clean = {
    name:String(name || 'Hero').trim() || 'Hero',
    face:typeof face === 'string' && face ? face : null,
    before:{ s:clamp3(before?.s), f:clamp3(before?.f) },
    after:{ s:clamp3(after?.s), f:clamp3(after?.f) },
    d20:clampD20(d20),
    outcome:OUTCOMES.includes(outcome) ? outcome : 'failure',
    words:String(words || '').trim(),
    mine:!!mine,
  };
  const item = { args:clean, opts:{ onDone } };
  if (cur){ queue.push(item); return null; }   // one is up: wait its turn, so two downed heroes both get their moment
  openOne(item);
  return el;
}
export function closeDeathSave(){ close(); }
function close(){
  if (!cur) return;
  const cb = cur.onDone; clearTimers(); cur = null;
  if (el){ el.remove(); el = null; }
  removeEventListener('resize', place); removeEventListener('keydown', onKey);
  cb?.();
  const next = queue.shift();
  if (next) openOne(next);
}
export const deathSaveOpen = () => !!cur;
// Any press skips to the end and closes at once — the table is waiting on the turn, so it does not linger
// on the landed result first. Arrows do nothing: the moment has nowhere to move.
export function deathSavePress(name){
  if (!cur) return false;
  switch (name){
    case 'a': case 'b': case 'back': case 'start': case ' ': case 'space':
    case 'Enter': case 'enter': case 'Escape': case 'escape': case 'esc':
      close(); return true;
    default: return false;
  }
}

// The dying badge: a small element on a party card (~20px tall) with three tiny hearts and three tiny skulls,
// from ChatGPT's dyingMarks shape ({ s:[bool×3], f:[bool×3], stable, dead }). Stable shows a small calm mark
// instead; null empties it. Never throws.
export function dyingBadge(elm, marks){
  try {
    if (!elm || typeof elm !== 'object' || typeof elm.classList === 'undefined') return;
    ensureStyle();
    elm.classList.add('ds-badge');
    if (!marks){ elm.replaceChildren(); elm.classList.remove('ds-stable', 'ds-dead'); elm.removeAttribute('title'); return; }
    const s = Array.isArray(marks.s) ? marks.s : [false, false, false];
    const f = Array.isArray(marks.f) ? marks.f : [false, false, false];
    if (marks.stable){
      elm.classList.add('ds-stable'); elm.classList.remove('ds-dead');
      elm.innerHTML = '<span class="ds-calm" title="Stable">✦</span>';
      elm.title = 'Stable';
      return;
    }
    elm.classList.remove('ds-stable');
    elm.classList.toggle('ds-dead', !!marks.dead);
    elm.innerHTML = [0, 1, 2].map(i => `<span class="ds-h${s[i] ? ' on' : ''}">♥</span>`).join('') +
      [0, 1, 2].map(i => `<span class="ds-k${f[i] ? ' on' : ''}">☠</span>`).join('');
    elm.title = marks.dead ? 'Dead' : 'Dying';
  } catch {}
}
