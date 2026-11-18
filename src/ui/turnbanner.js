/* ⚔ YOUR TURN — when the turn comes round to you in a fight (the Wanderer's hero; a seated player's own hero on the
   handheld at the table), a gold band sweeps across the screen with the words, and the round's number when a new round
   has begun; it holds a moment and goes, without taking a press. With calm effects on (render/gfx.js) it only fades. */
import { gfx } from '../render/gfx.js';

let el = null, timer = 0, shown = 0, lastWords = '';
function ensure(){
  if (typeof document === 'undefined') return null;
  if (!document.getElementById('yourTurnStyle')){
    const st = document.createElement('style'); st.id = 'yourTurnStyle';
    st.textContent = `
#yourTurn{position:fixed;left:0;right:0;top:15%;z-index:60;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 0 14px;
  background:linear-gradient(90deg,transparent,rgba(12,9,14,.78) 22%,rgba(12,9,14,.78) 78%,transparent);
  border-top:1px solid rgba(228,184,102,.35);border-bottom:1px solid rgba(228,184,102,.35);opacity:0}
#yourTurn .tb-t{font-family:var(--serif, serif);font-weight:600;font-size:clamp(26px,5vw,44px);letter-spacing:.14em;text-transform:uppercase;color:#ffe9b8;font-weight:700;
  text-shadow:0 0 22px rgba(228,184,102,.85),0 0 4px rgba(255,220,150,.6),0 2px 2px rgba(0,0,0,.8)}
#yourTurn .tb-s{font-family:var(--ui, sans-serif);font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--dim,#a89d90)}
#yourTurn.go{animation:tbBand 1.35s ease-out forwards}
#yourTurn.go .tb-t{animation:tbWord 1.35s cubic-bezier(.2,.8,.2,1) forwards}
#yourTurn.calm{animation:tbFade 1.35s ease-out forwards}
@keyframes tbBand{0%{opacity:0;transform:scaleY(.2)}12%{opacity:1;transform:scaleY(1)}78%{opacity:1}100%{opacity:0}}
@keyframes tbWord{0%{transform:translateX(-60px);letter-spacing:.5em;opacity:0}22%{transform:none;letter-spacing:.14em;opacity:1}80%{transform:translateX(8px)}100%{transform:translateX(30px);opacity:0}}
@keyframes tbFade{0%{opacity:0}15%{opacity:1}80%{opacity:1}100%{opacity:0}}
body.hh #yourTurn{top:14%}body.hh #yourTurn .tb-t{font-size:24px}`;
    document.head.appendChild(st);
  }
  if (!el){ el = document.createElement('div'); el.id = 'yourTurn'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  return el;
}
// show it: { title, sub }
export function turnBanner({ title = 'Your turn', sub = '' } = {}){
  const b = ensure(); if (!b) return;
  b.innerHTML = `<div class="tb-t"></div>${sub ? '<div class="tb-s"></div>' : ''}`;
  b.querySelector('.tb-t').textContent = title; if (sub) b.querySelector('.tb-s').textContent = sub; lastWords = [title, sub].filter(Boolean).join(' · ');
  b.className = ''; void b.offsetWidth; b.className = gfx.calm ? 'calm' : 'go'; b.hidden = false; shown++;
  clearTimeout(timer); timer = setTimeout(() => { b.className = ''; b.hidden = true; }, 1450);
}
// (for the tests: how many have been shown, and the words of the one up now)
export const turnBannerNow = () => ({ shown, last:lastWords, up:!!el && !el.hidden && !!el.className });
