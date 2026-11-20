/* 🏆 THE VICTORY SCREEN: the fight is over, and the game says so properly. The headline, the MVP, the party's
   numbers counting up, the awards flipping in, the XP bar filling (and the Level up flash if it crosses the
   line), then the loot, then "Ⓐ Carry on". Each beat plays and can be skipped: Ⓐ jumps to the end of the beat
   it's on, then goes on. It takes plain data (the shape is ChatGPT's fight-summary); Claude wires it in from
   finishFight, and opens the level-up screen after this one closes. A lost fight gets none of this. */
import { esc } from '../util/core.js';
import { emblemSvg } from './emblems.js';
import { sfx } from '../audio/sound.js';

const sgn = n => `${n >= 0 ? '+' : ''}${n}`;
const fmt = n => (n == null || !Number.isFinite(+n)) ? '—' : `${+n}`;
// Beats in order. Awards and loot are dropped if there's nothing in them; the MVP beat is dropped with no MVP.
const BEATS = ['headline', 'mvp', 'party', 'awards', 'xp', 'loot', 'carry'];

let el = null, bodyEl = null, cur = null, timers = [];

function ensureStyle(){
  if (document.getElementById('victoryStyle')) return;
  const s = document.createElement('style'); s.id = 'victoryStyle';
  s.textContent = `#victory{position:fixed;z-index:60;display:flex;flex-direction:column;background:#0b0d0a;color:var(--ink);
  border:1px solid rgba(228,184,102,.55);border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.65);
  font-family:var(--ui);overflow:hidden;box-sizing:border-box}
#victory *{box-sizing:border-box}
.vc-head{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:7px 6px 4px;border-bottom:1px solid var(--line)}
.vc-title{flex:1;min-width:0;text-align:center;font-family:var(--regal);font-variant:small-caps;letter-spacing:.14em;font-size:14px;color:var(--gold-hi);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vc-x{flex:0 0 auto;width:28px;height:26px;border:1px solid var(--line-2);border-radius:6px;background:transparent;color:var(--gold);font-size:12px;cursor:pointer;padding:0}
.vc-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:10px 12px;min-height:0;text-align:center;scrollbar-width:thin}
.vc-foot{flex:0 0 auto;padding:5px 10px 7px;border-top:1px solid var(--line);background:transparent;font:inherit;font-size:10.5px;color:var(--dim);text-align:center;letter-spacing:.04em;cursor:pointer;width:100%}
.vc-big{font-family:var(--regal);font-size:26px;line-height:1.15;color:var(--gold-hi);margin:14px 0 4px;animation:vcin .35s var(--ease)}
.vc-verdict{color:var(--dim);font-style:italic;font-size:13.5px;line-height:1.5}
.vc-rounds{color:var(--dim);font-size:11.5px;font-variant:small-caps;letter-spacing:.14em;margin-top:14px}
.vc-mvp-face{width:92px;height:92px;border-radius:50%;border:3px solid var(--gold);object-fit:cover;margin:10px auto 6px;background:#1a1512;box-shadow:0 0 24px rgba(228,184,102,.35)}
.vc-mvp-face.init{display:flex;align-items:center;justify-content:center;font-family:var(--regal);font-size:44px;color:#0b0d0a;background:var(--gold)}
.vc-mvp-name{font-family:var(--regal);font-size:19px;color:var(--gold-hi)}
.vc-mvp-why{color:var(--dim);font-style:italic;font-size:13px;line-height:1.5;margin-top:4px}
.vc-mvp-tag{font-variant:small-caps;letter-spacing:.2em;font-size:11px;color:var(--gold);margin-top:12px}
.vc-cards{display:flex;flex-direction:column;gap:8px;text-align:left}
.vc-card{display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:rgba(255,236,206,.03)}
.vc-face{flex:0 0 auto;width:44px;height:44px;border-radius:8px;border:1px solid var(--gold-line);object-fit:cover;background:#1a1512}
.vc-face.init{display:flex;align-items:center;justify-content:center;font-family:var(--regal);font-size:22px;color:#0b0d0a}
.vc-card .vc-nm{font-family:var(--regal);font-size:15px}
.vc-nums{display:flex;gap:10px;flex-wrap:wrap;margin-top:3px}
.vc-nums span{font-size:12px;color:var(--dim)}
.vc-nums b{color:var(--ink);font-weight:600}
.vc-award{border:1px solid var(--gold-line);border-radius:8px;padding:10px;margin:8px 0;background:rgba(228,184,102,.06);animation:vcflip .4s var(--ease)}
.vc-award .vc-at{font-family:var(--regal);font-size:16px;color:var(--gold-hi)}
.vc-award .vc-al{color:var(--dim);font-style:italic;font-size:13px;margin-top:3px;line-height:1.5}
.vc-award .vc-aw{font-size:12px;color:var(--dim);margin-top:5px}
.vc-xpbar{height:12px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden;margin:14px 4px 6px}
.vc-xpbar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold-lo),var(--gold));width:0;transition:width .7s var(--ease)}
.vc-xpbar.flash i{background:linear-gradient(90deg,#fff2c0,var(--gold-hi));box-shadow:0 0 16px rgba(246,223,168,.8)}
.vc-xpnums{color:var(--dim);font-size:12.5px}
.vc-lvlup{font-family:var(--regal);font-size:20px;color:var(--gold-hi);margin-top:10px;animation:vcflash .5s ease-in-out infinite alternate}
.vc-loot{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}
.vc-slot{border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-size:13px;background:rgba(255,236,206,.03)}
.vc-coins{font-size:14px;color:var(--gold-hi);margin-top:10px}
.vc-carry{font-family:var(--regal);font-size:20px;color:var(--gold-hi);margin:26px 0 6px}
.vc-carry-sub{color:var(--dim);font-size:13px}
@keyframes vcin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes vcflip{from{opacity:0;transform:rotateY(70deg)}to{opacity:1;transform:none}}
@keyframes vcflash{from{opacity:.55}to{opacity:1}}
@media (prefers-reduced-motion: reduce){.vc-big,.vc-award{animation:none}.vc-xpbar i{transition:none}.vc-lvlup{animation:none}}
body.hh-lcd #victory{border-radius:2px;box-shadow:none}
body.hh-lcd #victory .vc-face,body.hh-lcd #victory .vc-card,body.hh-lcd #victory .vc-award,body.hh-lcd #victory .vc-slot,body.hh-lcd #victory .vc-x{border-radius:2px}`;
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

const faceHtml = (id, cls = 'vc-face') => {
  const url = cur.faces?.[id], name = cur.names?.[id] || 'Hero', initial = (name.trim()[0] || '?').toUpperCase();
  const colour = '#8a7a5a';
  return url ? `<img class="${cls}" src="${esc(url)}" alt="">` : `<div class="${cls} init" style="background:${colour}">${esc(initial)}</div>`;
};
const beats = () => BEATS.filter(b =>
  (b !== 'mvp' || cur.summary.mvp) && (b !== 'awards' || (cur.summary.awards || []).length) &&
  (b !== 'loot' || cur.summary.loot));
const beatIdx = () => beats().indexOf(cur.beat);
const clearTimers = () => { for (const t of timers) clearTimeout(t); timers = []; };

function render(){
  if (!el || !cur) return;
  const s = cur.summary, list = beats(), b = cur.beat;
  const titles = { headline:'Victory', mvp:'Most valuable hero', party:'The party', awards:'Awards', xp:'Experience', loot:'Loot', carry:'Victory' };
  el.querySelector('.vc-title').textContent = titles[b] || 'Victory';
  el.querySelector('.vc-foot').textContent = b === 'carry' ? 'Ⓐ Carry on (or tap here)' : 'Ⓐ go on · Ⓑ close (or tap here)';
  let html = '';
  if (b === 'headline'){
    html = `<div class="vc-big">${esc(s.headline || 'Victory')}</div>
      <div class="vc-verdict">${esc(s.verdict || '')}</div>
      <div class="vc-rounds">Round ${fmt(s.rounds)} · the fight is over</div>`;
  } else if (b === 'mvp'){
    const m = s.mvp, name = cur.names?.[m.id] || 'A hero';
    html = `<div class="vc-mvp-tag">Most valuable hero</div>${faceHtml(m.id, 'vc-mvp-face')}
      <div class="vc-mvp-name">${emb(m.id, 20)}${esc(name)}</div><div class="vc-mvp-why">${esc(m.why || '')}</div>`;
  } else if (b === 'party'){
    html = `<div class="vc-cards">${cur.party.map(id => { const p = s.per?.[id] || {}, name = cur.names?.[id] || 'Hero';
      return `<div class="vc-card" data-id="${esc(id)}">${faceHtml(id)}
        <div style="flex:1;min-width:0"><div class="vc-nm">${emb(id, 16)}${esc(name)}</div>
        <div class="vc-nums"><span>Dealt <b data-n="dealt">${cur.counted ? fmt(p.dealt) : '0'}</b></span><span>Taken <b data-n="taken">${cur.counted ? fmt(p.taken) : '0'}</b></span><span>Healed <b data-n="healed">${cur.counted ? fmt(p.healed) : '0'}</b></span><span>Kills <b data-n="kills">${cur.counted ? fmt(p.kills) : '0'}</b></span><span>Crits <b data-n="crits">${cur.counted ? fmt(p.crits) : '0'}</b></span></div></div></div>`; }).join('')}</div>`;
  } else if (b === 'awards'){
    html = (s.awards || []).slice(0, cur.awardsShown).map(a => `<div class="vc-award"><div class="vc-at">${esc(a.title)}</div>
      <div class="vc-al">${esc(a.line || '')}</div><div class="vc-aw">${esc(cur.names?.[a.id] || '')}</div></div>`).join('');
  } else if (b === 'xp'){
    const x = cur.xp, pct = x.next > 0 ? Math.max(0, Math.min(100, (cur.xpShown / x.next) * 100)) : 0;
    const crossed = x.after >= x.next && x.next > 0;
    html = `<div class="vc-big" style="font-size:20px">Experience</div>
      <div class="vc-xpbar${crossed && cur.counted ? ' flash' : ''}"><i style="width:${pct}%"></i></div>
      <div class="vc-xpnums">${fmt(cur.xpShown)} / ${fmt(x.next)} XP · level ${fmt(x.level)}</div>
      ${crossed && cur.counted ? '<div class="vc-lvlup">Level up</div>' : ''}`;
  } else if (b === 'loot'){
    const l = s.loot || {};
    html = `<div class="vc-big" style="font-size:20px">What was found</div>
      <div class="vc-loot">${(l.items || []).slice(0, cur.lootShown).map(i => `<div class="vc-slot">${esc(typeof i === 'string' ? i : i.n || i.name || '')}</div>`).join('')}</div>
      ${(l.gp || l.sp) ? `<div class="vc-coins">🪙 ${[l.gp ? `${l.gp} gp` : '', l.sp ? `${l.sp} sp` : ''].filter(Boolean).join(' · ')}</div>` : ''}`;
  } else {
    html = `<div class="vc-carry">Ⓐ Carry on</div><div class="vc-carry-sub">${esc(s.headline || 'The fight is over.')}</div>`;
  }
  bodyEl.innerHTML = html;
  bodyEl.scrollTop = 0;
}

// A beat's animation: counting numbers, awards flipping in, the XP bar filling, loot appearing. Ⓐ finishes it at once.
// The counting steps run on short timers, not requestAnimationFrame: on a slow device a frame can take seconds,
// so an animation driven by frames would never finish (and the XP bar is re-rendered from cur.xpShown, so the
// state is what climbs, not just the pixels).
function playBeat(){
  clearTimers();
  const s = cur.summary, b = cur.beat;
  if (b === 'party' && !cur.counted){
    const t0 = performance.now(), dur = 700;
    const step = () => { if (!cur || cur.beat !== 'party' || cur.counted) return;
      const k = Math.min(1, (performance.now() - t0) / dur);
      for (const id of cur.party){ const p = s.per?.[id] || {};
        for (const n of ['dealt', 'taken', 'healed', 'kills', 'crits']){
          const node = bodyEl?.querySelector(`[data-id="${CSS.escape(id)}"] [data-n="${n}"]`);
          if (node) node.textContent = fmt(Math.round((+p[n] || 0) * k)); } }
      if (k < 1) timers.push(setTimeout(step, 60));
      else { cur.counted = true; render(); } };
    timers.push(setTimeout(step, 60));
  } else if (b === 'awards' && cur.awardsShown < (s.awards || []).length){
    const show = () => { if (cur.beat !== 'awards') return;
      cur.awardsShown++; render();
      if (cur.awardsShown < (s.awards || []).length) timers.push(setTimeout(show, 350)); };
    timers.push(setTimeout(show, 350));
  } else if (b === 'xp' && !cur.counted){
    const x = cur.xp, t0 = performance.now(), dur = 800;
    const step = () => { if (!cur || cur.beat !== 'xp' || cur.counted) return;
      const k = Math.min(1, (performance.now() - t0) / dur);
      cur.xpShown = Math.round(x.before + (x.after - x.before) * k);
      if (k < 1) { render(); timers.push(setTimeout(step, 60)); }
      else { cur.xpShown = x.after; cur.counted = true; render(); } };
    timers.push(setTimeout(step, 60));
  } else if (b === 'loot' && cur.lootShown < ((s.loot?.items) || []).length){
    const show = () => { if (cur.beat !== 'loot') return;
      cur.lootShown++; render();
      if (cur.lootShown < (s.loot.items || []).length) timers.push(setTimeout(show, 300)); };
    timers.push(setTimeout(show, 300));
  }
}
function finishBeat(){
  const s = cur.summary, b = cur.beat;
  if (b === 'party' || b === 'xp') cur.counted = true;
  if (b === 'awards') cur.awardsShown = (s.awards || []).length;
  if (b === 'loot') cur.lootShown = (s.loot?.items || []).length;
  if (b === 'xp') cur.xpShown = cur.xp.after;
  clearTimers(); render();
}
const beatDone = () => {
  const s = cur.summary, b = cur.beat;
  if (b === 'party' || b === 'xp') return cur.counted;
  if (b === 'awards') return cur.awardsShown >= (s.awards || []).length;
  if (b === 'loot') return cur.lootShown >= ((s.loot?.items) || []).length;
  return true;
};
function next(){
  const list = beats(), i = list.indexOf(cur.beat);
  if (i < list.length - 1){ cur.beat = list[i + 1]; cur.counted = false; render(); playBeat(); }
  else closeVictory();
}
function onKey(e){
  if (e.key === 'Escape'){ e.preventDefault(); closeVictory(); }
  else if (e.key === ' '){ e.preventDefault(); victoryPress('a'); }
}
function onClick(e){
  if (e.target.closest('[data-vc="close"]')){ closeVictory(); return; }
  if (e.target.closest('.vc-foot')){ victoryPress('a'); return; }
}

export function openVictory(summary, { party = [], names = {}, faces = {}, callings = {}, xp = null, onClose } = {}){
  if (!summary) return null;
  if (cur) closeVictory();
  cur = { summary, party:party.length ? party : Object.keys(summary.per || {}), names, faces, callings:callings || {},
    xp:xp || summary.xp || { before:0, after:0, next:100, level:1 },
    onClose:typeof onClose === 'function' ? onClose : null,
    beat:'headline', counted:false, awardsShown:0, lootShown:0, xpShown:(xp || summary.xp || { before:0 }).before || 0 };
  ensureStyle();
  el = document.createElement('div');
  el.id = 'victory'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Victory');
  el.innerHTML = `<div class="vc-head"><div class="vc-title"></div><button class="vc-x" data-vc="close" aria-label="Close">✕</button></div>
    <div class="vc-body" tabindex="-1"></div><button class="vc-foot"></button>`;
  el.addEventListener('click', onClick);
  document.body.appendChild(el);
  bodyEl = el.querySelector('.vc-body');
  place();
  addEventListener('resize', place); addEventListener('keydown', onKey);
  render(); playBeat();
  try { sfx('rise', false); } catch {}
  return el;
}
export function closeVictory(){
  if (!cur) return;
  const cb = cur.onClose; clearTimers(); cur = null;
  if (el){ el.remove(); el = null; bodyEl = null; }
  removeEventListener('resize', place); removeEventListener('keydown', onKey);
  cb?.();
}
export const victoryOpen = () => !!cur;
export function setVictoryFace(id, url){
  if (!cur || !id) return;
  cur.faces = { ...cur.faces, [id]:url };
  if (cur.beat === 'mvp' || cur.beat === 'party' || cur.beat === 'awards') render();
}
// ⛨ a Calling's emblem beside a hero's name (ui/emblems.js), when the opener said which Calling: { id: { calling, color } }
function emb(id, size){ const c = cur?.callings?.[id]; return c?.calling ? `<span class="vc-emb" style="color:${esc(c.color || 'currentColor')};display:inline-flex;vertical-align:-3px;margin-right:6px">${emblemSvg(c.calling, { size })}</span>` : ''; }
export function victoryPress(name){
  if (!cur) return false;
  switch (name){
    case 'a': case 'right': case 'down': {
      if (cur.beat === 'carry'){ closeVictory(); return true; }
      if (!beatDone()) finishBeat(); else next();
      return true; }
    case 'b': case 'back': case 'start': closeVictory(); return true;
    default: return false;
  }
}
