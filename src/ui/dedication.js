/* 🕯 THE DEDICATION — Dread Delve is made in memory of Chance, "Dutcher", the Dutch Oven (data/memorial.js holds the
   words). Once each time the game is opened, before the start page, a quiet moment: a candle, his name, two lines.
   It holds a few seconds and goes on its own; a tap or a key lets it go sooner (never the first instant, so the tap
   that opened the page doesn't skip it). The start page carries his line at its foot, always.
   Timers, not frames; things appear at full strength (this box's compositor doesn't run fade-ins). */
import { MEMORIAL } from '../data/memorial.js';
import { esc } from '../util/core.js';

const SEEN = 'dreaddelve.dedication.v1';   // (sessionStorage: once per opening; the tests mark it seen)
const HOLD_MS = 5200, FADE_MS = 900, GRACE_MS = 700;
let el = null, shown = 0;

function style(){
  if (document.getElementById('dedicationStyle')) return;
  const s = document.createElement('style'); s.id = 'dedicationStyle';
  s.textContent = `#dedication{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;
  background:radial-gradient(ellipse at 50% 45%,rgba(60,34,18,.92),rgba(8,6,8,.98) 62%);color:var(--ink,#eadfcf);text-align:center;cursor:pointer;
  transition:opacity ${FADE_MS}ms ease}
#dedication.out{opacity:0;pointer-events:none}
#dedication .dd-in{max-width:520px;display:flex;flex-direction:column;align-items:center;gap:10px}
#dedication .dd-flame{width:14px;height:26px;border-radius:50% 50% 45% 45%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff4c8,#ffb347 45%,#c4561a 75%,transparent 78%);
  box-shadow:0 0 28px 10px rgba(255,170,70,.35),0 0 80px 30px rgba(255,140,40,.12);margin-bottom:2px;animation:ddflick 2.4s ease-in-out infinite}
#dedication .dd-wick{width:34px;height:46px;border-radius:4px 4px 2px 2px;background:linear-gradient(90deg,#cbb89a,#efe2c6 45%,#b8a383);margin-top:-6px;margin-bottom:14px}
#dedication h2{margin:0;font:600 30px/1.2 "Cormorant Garamond",Georgia,serif;letter-spacing:.02em;color:#f3dfb4}
#dedication .dd-sub{font:italic 19px/1.3 "Cormorant Garamond",Georgia,serif;color:#e0b878}
#dedication p{margin:0;font:16px/1.5 "Cormorant Garamond",Georgia,serif;color:#cdbda6}
#dedication .dd-hint{margin-top:14px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7a6a5a}
@keyframes ddflick{0%,100%{transform:scale(1) rotate(-1deg)}40%{transform:scale(1.06,.96) rotate(1.5deg)}70%{transform:scale(.97,1.04) rotate(-.5deg)}}
@media (prefers-reduced-motion: reduce){#dedication{transition:none}#dedication .dd-flame{animation:none}}
body.hh #dedication h2{font-size:24px}
.th-memorial{display:block;margin-top:10px;font:italic 14px/1.4 "Cormorant Garamond",Georgia,serif;color:#a88f6a}`;
  document.head.appendChild(s);
}

// The line at the foot of the start page (main.js, once)
export function memorialFoot(){
  style();
  const foot = document.querySelector('#startModal .th-foot'); if (!foot || foot.querySelector('.th-memorial')) return;
  const m = document.createElement('span'); m.className = 'th-memorial'; m.textContent = `🕯 ${MEMORIAL.foot}`;
  foot.appendChild(m);
}

export function showDedication({ force = false } = {}){
  let seen = false; try { seen = sessionStorage.getItem(SEEN) === '1'; } catch {}
  if ((seen && !force) || el) return false;
  try { sessionStorage.setItem(SEEN, '1'); } catch {}
  style();
  el = document.createElement('div'); el.id = 'dedication'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', MEMORIAL.title);
  el.innerHTML = `<div class="dd-in"><div class="dd-flame" aria-hidden="true"></div><div class="dd-wick" aria-hidden="true"></div>
    <h2>${esc(MEMORIAL.title)}</h2><div class="dd-sub">${esc(MEMORIAL.sub)}</div>${MEMORIAL.lines.map(l => `<p>${esc(l)}</p>`).join('')}
    <div class="dd-hint">tap to go on</div></div>`;
  document.body.appendChild(el); shown = performance.now();
  const go = () => { if (performance.now() - shown >= GRACE_MS) endDedication(); };
  el.addEventListener('click', go);
  addEventListener('keydown', onKey);
  el._t = setTimeout(endDedication, HOLD_MS);
  return true;
}
function onKey(){ if (el && performance.now() - shown >= GRACE_MS) endDedication(); }
export function endDedication(){
  if (!el) return;
  const e = el; el = null; clearTimeout(e._t); removeEventListener('keydown', onKey);
  e.classList.add('out'); setTimeout(() => e.remove(), FADE_MS);
}
export const dedicationOpen = () => !!el;
