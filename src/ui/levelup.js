/* ⬆ THE LEVEL-UP FANFARE: the screen darkens, a burst of light, the hero's face, the new level; the hit
   points climb from where they were; then each gain flips in with its kind's icon and a line of what it does.
   A chiptune flourish (tune('levelUp') if it exists, else sfx('rise')). Ⓐ through it, Ⓑ closes. Plain data;
   Claude opens it after the victory screen when the XP bar crosses the line. */
import { esc } from '../util/core.js';
import { sfx } from '../audio/sound.js';
import { tune } from './hhlife.js';

const KIND_ICON = { feature:'✦', spell:'✧', slot:'◇', stat:'▲', feat:'★' };
const KIND_LABEL = { feature:'Feature', spell:'Spell', slot:'Spell slot', stat:'Ability', feat:'Feat' };

let el = null, bodyEl = null, cur = null, timers = [], hpTimer = 0;

function ensureStyle(){
  if (document.getElementById('levelUpStyle')) return;
  const s = document.createElement('style'); s.id = 'levelUpStyle';
  s.textContent = `#levelUp{position:fixed;z-index:60;display:flex;flex-direction:column;background:#0b0d0a;color:var(--ink);
  border:1px solid rgba(228,184,102,.55);border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.65);
  font-family:var(--ui);overflow:hidden;box-sizing:border-box}
#levelUp *{box-sizing:border-box}
#levelUp .lu-burst{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 38%,rgba(246,223,168,.55),rgba(246,223,168,0) 55%);animation:luburst .9s var(--ease) forwards}
@keyframes luburst{from{opacity:0}35%{opacity:1}to{opacity:0}}
.lu-head{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:7px 6px 4px;border-bottom:1px solid var(--line);position:relative;z-index:1}
.lu-title{flex:1;min-width:0;text-align:center;font-family:var(--regal);font-variant:small-caps;letter-spacing:.14em;font-size:14px;color:var(--gold-hi);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lu-x{flex:0 0 auto;width:28px;height:26px;border:1px solid var(--line-2);border-radius:6px;background:transparent;color:var(--gold);font-size:12px;cursor:pointer;padding:0}
.lu-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:10px 12px;min-height:0;text-align:center;scrollbar-width:thin;position:relative;z-index:1}
.lu-foot{flex:0 0 auto;padding:5px 10px 7px;border-top:1px solid var(--line);background:transparent;font:inherit;font-size:10.5px;color:var(--dim);text-align:center;letter-spacing:.04em;cursor:pointer;width:100%;position:relative;z-index:1}
.lu-face{width:88px;height:88px;border-radius:50%;border:3px solid var(--gold);object-fit:cover;margin:12px auto 4px;background:#1a1512;box-shadow:0 0 28px rgba(228,184,102,.4)}
.lu-face.init{display:flex;align-items:center;justify-content:center;font-family:var(--regal);font-size:42px;color:#0b0d0a;background:var(--gold)}
.lu-name{font-family:var(--regal);font-size:18px;color:var(--gold-hi)}
.lu-lvl{font-family:var(--regal);font-size:30px;color:var(--gold-hi);margin:6px 0 2px;animation:luin .4s var(--ease)}
.lu-hp{color:var(--dim);font-size:13px}
.lu-hp b{color:var(--ink);font-size:16px}
.lu-gains{display:flex;flex-direction:column;gap:8px;margin-top:14px;text-align:left}
.lu-gain{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line);border-radius:8px;padding:9px 10px;background:rgba(228,184,102,.05);animation:luflip .45s var(--ease)}
.lu-ic{flex:0 0 auto;font-size:18px;color:var(--gold);width:24px;text-align:center}
.lu-gn{font-family:var(--regal);font-size:15px;color:var(--gold-hi)}
.lu-gt{color:var(--dim);font-size:12.5px;line-height:1.5;margin-top:2px}
.lu-gk{font-size:10.5px;color:var(--dim);font-variant:small-caps;letter-spacing:.12em}
@keyframes luin{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
@keyframes luflip{from{opacity:0;transform:rotateX(70deg)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){#levelUp .lu-burst,.lu-lvl,.lu-gain{animation:none}}
body.hh-lcd #levelUp{border-radius:2px;box-shadow:none}
body.hh-lcd #levelUp .lu-x,body.hh-lcd #levelUp .lu-gain{border-radius:2px}`;
  document.head.appendChild(s);
}

function place(){
  if (!el) return;
  const cs = getComputedStyle(document.body);
  const on = document.body.classList.contains('hh');
  const x = parseFloat(cs.getPropertyValue('--hh-scr-x')), y = parseFloat(cs.getPropertyValue('--hh-scr-y')),
    w = parseFloat(cs.getPropertyValue('--hh-scr-w')), h = parseFloat(cs.getPropertyValue('--hh-scr-h'));
  if (on && Number.isFinite(x) && Number.isFinite(w) && Number.isFinite(h) && w > 40 && h > 40)
    Object.assign(el.style, { left:`${x}px`, top:`${y}px`, width:`${w}px`, height:`${h}px`, transform:'none' });
  else
    Object.assign(el.style, { left:'50%', top:'50%', width:'min(420px, 94vw)', height:'min(520px, 88vh)', transform:'translate(-50%,-50%)' });
}
const clearTimers = () => { for (const t of timers) clearTimeout(t); timers = []; if (hpTimer) clearTimeout(hpTimer); hpTimer = 0; };

function render(){
  if (!el || !cur) return;
  const d = cur.data, gains = d.gains || [];
  const initial = ((d.name || 'Hero').trim()[0] || '?').toUpperCase();
  const face = d.face ? `<img class="lu-face" src="${esc(d.face)}" alt="">` : `<div class="lu-face init">${esc(initial)}</div>`;
  el.querySelector('.lu-title').textContent = 'Level up';
  el.querySelector('.lu-foot').textContent = cur.gainsShown >= gains.length ? 'Ⓐ Carry on (or tap here)' : 'Ⓐ go on · Ⓑ close (or tap here)';
  bodyEl.innerHTML = `${face}<div class="lu-name">${esc(d.name || 'Hero')}</div>
    <div class="lu-lvl">Level ${esc(String(d.to ?? ''))}</div>
    <div class="lu-hp">Hit points <b>${cur.hpShown ?? d.hp?.after ?? '—'}</b>${d.hp ? ` <span>(was ${d.hp.before})</span>` : ''}</div>
    <div class="lu-gains">${gains.slice(0, cur.gainsShown).map(g => `<div class="lu-gain"><span class="lu-ic">${KIND_ICON[g.kind] || '✦'}</span>
      <span style="flex:1;min-width:0"><span class="lu-gk">${esc(KIND_LABEL[g.kind] || g.kind || '')}</span><div class="lu-gn">${esc(g.name)}</div><div class="lu-gt">${esc(g.text || '')}</div></span></div>`).join('')}</div>`;
  bodyEl.scrollTop = 0;
}
function playGains(){
  const gains = cur.data.gains || [];
  if (cur.gainsShown >= gains.length) return;
  const show = () => { if (!cur) return;
    cur.gainsShown++; render();
    if (cur.gainsShown < gains.length) timers.push(setTimeout(show, 300)); };
  timers.push(setTimeout(show, 300));
}
function onKey(e){
  if (e.key === 'Escape'){ e.preventDefault(); closeLevelUp(); }
  else if (e.key === ' '){ e.preventDefault(); levelUpPress('a'); }
}
function onClick(e){
  if (e.target.closest('[data-lu="close"]')){ closeLevelUp(); return; }
  if (e.target.closest('.lu-foot')){ levelUpPress('a'); return; }
}

export function openLevelUp({ name, face, from, to, hp, gains } = {}, { onClose } = {}){
  if (name == null && to == null) return null;
  if (cur) closeLevelUp();
  const d = { name, face:face || null, from, to, hp:hp || null, gains:gains || [] };
  cur = { data:d, onClose:typeof onClose === 'function' ? onClose : null, gainsShown:0, hpShown:hp?.before ?? null };
  ensureStyle();
  el = document.createElement('div');
  el.id = 'levelUp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Level up');
  el.innerHTML = `<div class="lu-burst"></div><div class="lu-head"><div class="lu-title"></div><button class="lu-x" data-lu="close" aria-label="Close">✕</button></div>
    <div class="lu-body" tabindex="-1"></div><button class="lu-foot"></button>`;
  el.addEventListener('click', onClick);
  document.body.appendChild(el);
  bodyEl = el.querySelector('.lu-body');
  place();
  addEventListener('resize', place); addEventListener('keydown', onKey);
  render();
  // the hit points climb, then the gains flip in one by one. The climb runs on short timers, not
  // requestAnimationFrame (a frame can take seconds on a slow device), and it keeps the climbed value in
  // cur.hpShown — a later render must show where the climb has reached, not the starting value. It has its own
  // timer, apart from the gains chain, so the two never cancel each other.
  if (d.hp && d.hp.after > d.hp.before){
    const t0 = performance.now(), dur = 700, fromHp = d.hp.before, toHp = d.hp.after;
    const step = () => { if (!cur) return;
      const k = Math.min(1, (performance.now() - t0) / dur);
      cur.hpShown = Math.round(fromHp + (toHp - fromHp) * k);
      const node = bodyEl?.querySelector('.lu-hp b');
      if (node) node.textContent = cur.hpShown;
      if (k < 1) hpTimer = setTimeout(step, 60); };
    hpTimer = setTimeout(step, 60);
  }
  timers.push(setTimeout(playGains, 350));
  try { tune('levelUp'); } catch { try { sfx('rise', false); } catch {} }
  return el;
}
export function closeLevelUp(){
  if (!cur) return;
  const cb = cur.onClose; clearTimers(); cur = null;
  if (el){ el.remove(); el = null; bodyEl = null; }
  removeEventListener('resize', place); removeEventListener('keydown', onKey);
  cb?.();
}
export const levelUpOpen = () => !!cur;
export function levelUpPress(name){
  if (!cur) return false;
  switch (name){
    case 'a': case 'right': case 'down': {
      const gains = cur.data.gains || [];
      if (cur.gainsShown < gains.length){ clearTimers(); if (cur.data.hp) cur.hpShown = cur.data.hp.after; cur.gainsShown = gains.length; render(); return true; }
      closeLevelUp(); return true; }
    case 'b': case 'back': case 'start': closeLevelUp(); return true;
    default: return false;
  }
}
