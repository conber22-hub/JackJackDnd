/* 🌫 THE DEFEAT SCREEN: the party is down, and the Mists close over them. The victory screen's dark twin:
   the grey-violet mist dims in from the edges, the words rise, the headline and verdict, a line of Barovian
   consolation, each hero greyed like a name on a stone, where they'll wake, and a single button, Rise.
   It takes plain data (the shape is ChatGPT's fight-summary, for a lost fight); Claude wires it in from
   fallen(), and carries on to the last save when it closes. Ⓐ finishes the slow reveal, then rises; Ⓑ
   rises at once. Timers, not requestAnimationFrame: on a slow device a frame can take seconds, so an
   animation driven by frames would never finish (rounds 13–14). Things appear at full strength at once:
   a CSS transition fade-in never advances on this box's slow compositor (round 14). */
import { esc } from '../util/core.js';
import { sfx } from '../audio/sound.js';

const fmt = n => (n == null || !Number.isFinite(+n)) ? '—' : `${+n}`;
// A handful of consolations in the Mists' voice: original, quiet, never a joke. Picked from the summary, so
// the same fight always says the same line (a small FNV hash of the fight's shape).
const CONSOLATIONS = [
  'The valley is not finished with you.',
  'You wake to the smell of rain and woodsmoke.',
  'The fog lets you go, for now.',
  'Somewhere, a bell does not ring.',
  'The road remembers your name.',
  'Dawn will come, even here.',
  'The mists keep what they take, but they gave you back.',
  'Sleep now. The road will wait.',
];
const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const consolation = (summary, party) => {
  const key = [summary.rounds, summary.headline, summary.verdict, ...(party || [])]
    .concat((party || []).map(id => { const p = summary.per?.[id] || {}; return `${p.dealt || 0}/${p.taken || 0}/${p.downs || 0}`; })).join('|');
  return CONSOLATIONS[hash(key) % CONSOLATIONS.length];
};
// Sections in order. The title is always there; the rest arrive unhurried, one at a time.
const REVEAL_MAX = 4;

let el = null, mistEl = null, bodyEl = null, cur = null, timers = [];

function ensureStyle(){
  if (document.getElementById('defeatStyle')) return;
  const s = document.createElement('style'); s.id = 'defeatStyle';
  s.textContent = `#defeat{position:fixed;z-index:60;display:flex;flex-direction:column;background:linear-gradient(180deg,#17121f,#0b0d0a 70%);color:var(--ink);
  border:1px solid rgba(163,138,224,.45);border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.7);
  font-family:var(--ui);overflow:hidden;box-sizing:border-box}
#defeat *{box-sizing:border-box}
#defeatMist{position:fixed;inset:0;z-index:59;pointer-events:none;background:radial-gradient(ellipse at center,transparent 25%,rgba(23,18,31,.55) 60%,rgba(12,10,18,.9) 100%)}
.df-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:14px 16px;min-height:0;text-align:center;scrollbar-width:thin}
.df-title{font-family:var(--regal);font-size:24px;line-height:1.2;color:var(--silver);margin:18px 0 4px}
.df-head{font-family:var(--regal);font-size:17px;color:var(--ink);margin-top:16px}
.df-verdict{color:var(--dim);font-style:italic;font-size:13.5px;line-height:1.5;margin-top:4px}
.df-cons{color:var(--violet);font-family:var(--serif);font-style:italic;font-size:15px;line-height:1.5;margin-top:14px}
.df-heroes{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}
.df-hero{width:96px;border:1px solid var(--line);border-radius:8px;padding:8px 6px;background:rgba(255,246,232,.02)}
.df-face{width:48px;height:48px;border-radius:50%;border:1px solid #555;object-fit:cover;margin:0 auto 6px;background:#1a1512;filter:grayscale(1) brightness(.7)}
.df-face.init{display:flex;align-items:center;justify-content:center;font-family:var(--regal);font-size:22px;color:#0b0d0a;background:#6f655d}
.df-name{font-family:var(--regal);font-size:13.5px;color:var(--silver)}
.df-nums{font-size:11.5px;color:var(--dim);margin-top:3px;line-height:1.5}
.df-felled{font-size:11.5px;color:var(--violet);font-style:italic;margin-top:2px;line-height:1.4}
.df-wake{color:var(--dim);font-size:13.5px;font-style:italic;line-height:1.5;margin-top:18px}
.df-rise{flex:0 0 auto;margin:12px 16px 6px;padding:11px;border:1px solid rgba(163,138,224,.6);border-radius:8px;background:rgba(163,138,224,.12);color:var(--silver);font-family:var(--regal);font-size:17px;letter-spacing:.08em;cursor:pointer}
.df-rise:active{background:rgba(163,138,224,.25)}
.df-hint{flex:0 0 auto;padding:0 10px 9px;font-size:10.5px;color:var(--faint);text-align:center;letter-spacing:.04em}
body.hh-lcd #defeat{border-radius:2px;box-shadow:none}
body.hh-lcd #defeat .df-hero,body.hh-lcd #defeat .df-rise{border-radius:2px}`;
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

const faceHtml = id => {
  const url = cur.faces?.[id], name = cur.names?.[id] || 'Hero', initial = (name.trim()[0] || '?').toUpperCase();
  return url ? `<img class="df-face" src="${esc(url)}" alt="">` : `<div class="df-face init">${esc(initial)}</div>`;
};
const clearTimers = () => { for (const t of timers) clearTimeout(t); timers = []; };

function render(){
  if (!el || !cur) return;
  const s = cur.summary;
  if (mistEl) mistEl.style.opacity = `${cur.dim}`;
  const rise = `transform:translateY(${Math.round((1 - cur.rise) * 14)}px)`;
  let html = `<div class="df-title" style="${rise}">The Mists close over you</div>`;
  if (cur.reveal >= 1)
    html += `<div class="df-head">${esc(s.headline || 'The valley keeps its ground.')}</div>
      <div class="df-verdict">${esc(s.verdict || 'The account remains unsettled.')}</div>
      <div class="df-cons">${esc(cur.cons)}</div>`;
  if (cur.reveal >= 2)
    html += `<div class="df-heroes">${cur.party.map(id => { const p = s.per?.[id] || {}, name = cur.names?.[id] || 'Hero';
      const felled = (p.downs > 0 && s.biggest?.at === id) ? `<div class="df-felled">Felled by ${esc(s.biggest.weapon || 'a blow')} for ${fmt(s.biggest.n)} damage</div>` : '';
      return `<div class="df-hero">${faceHtml(id)}<div class="df-name">${esc(name)}</div>
        <div class="df-nums">Dealt <b>${fmt(p.dealt)}</b><br>Took <b>${fmt(p.taken)}</b></div>${felled}</div>`; }).join('')}</div>`;
  if (cur.reveal >= 3)
    html += `<div class="df-wake">You will wake at ${esc(cur.from)}.</div>`;
  bodyEl.innerHTML = html;
  bodyEl.scrollTop = 0;
  const riseBtn = el.querySelector('.df-rise');
  if (riseBtn) riseBtn.style.display = cur.reveal >= 4 ? '' : 'none';
}

// The slow reveal: the mist deepens and the title rises on short timer steps (the state climbs, not just the
// pixels), then each section arrives in turn. Ⓐ jumps to the end of it at once.
function playReveal(){
  clearTimers();
  const reduced = cur.reduced;
  if (reduced){ cur.dim = 1; cur.rise = 1; cur.reveal = REVEAL_MAX; render(); return; }
  const t0 = performance.now(), dur = 1000;
  const step = () => { if (!cur) return;
    const k = Math.min(1, (performance.now() - t0) / dur);
    cur.dim = k; cur.rise = k; render();
    if (k < 1) timers.push(setTimeout(step, 60)); };
  timers.push(setTimeout(step, 60));
  for (let i = 1; i <= REVEAL_MAX; i++)
    timers.push(setTimeout(() => { if (!cur) return; cur.reveal = Math.max(cur.reveal, i); render(); }, 500 + (i - 1) * 450));
}
function finishReveal(){
  clearTimers(); cur.dim = 1; cur.rise = 1; cur.reveal = REVEAL_MAX; render();
}
function onKey(e){
  if (e.key === 'Escape'){ e.preventDefault(); closeDefeat(); }
  else if (e.key === ' '){ e.preventDefault(); defeatPress('a'); }
}
function onClick(e){
  if (e.target.closest('[data-df="rise"]')) closeDefeat();
}

export function openDefeat(summary, { party = [], names = {}, faces = {}, from = null, onClose } = {}){
  if (!summary) return null;
  if (cur) closeDefeat();
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  cur = { summary, party:party.length ? party : Object.keys(summary.per || {}), names, faces,
    from:from || 'the last place you rested',
    onClose:typeof onClose === 'function' ? onClose : null,
    cons:consolation(summary, party.length ? party : Object.keys(summary.per || {})),
    reveal:0, dim:0, rise:0, reduced };
  ensureStyle();
  mistEl = document.createElement('div');
  mistEl.id = 'defeatMist'; mistEl.style.opacity = '0';
  document.body.appendChild(mistEl);
  el = document.createElement('div');
  el.id = 'defeat'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Defeat');
  el.innerHTML = `<div class="df-body" tabindex="-1"></div>
    <button class="df-rise" data-df="rise" style="display:none">Rise</button>
    <div class="df-hint">Ⓐ Rise · Ⓑ Rise</div>`;
  el.addEventListener('click', onClick);
  document.body.appendChild(el);
  bodyEl = el.querySelector('.df-body');
  place();
  addEventListener('resize', place); addEventListener('keydown', onKey);
  render(); playReveal();
  try { sfx('toll', false); } catch {}
  return el;
}
export function closeDefeat(){
  if (!cur) return;
  const cb = cur.onClose; clearTimers(); cur = null;
  if (el){ el.remove(); el = null; bodyEl = null; }
  if (mistEl){ mistEl.remove(); mistEl = null; }
  removeEventListener('resize', place); removeEventListener('keydown', onKey);
  cb?.();
}
export const defeatOpen = () => !!cur;
export function setDefeatFace(id, url){
  if (!cur || !id) return;
  cur.faces = { ...cur.faces, [id]:url };
  render();
}
export function defeatPress(name){
  if (!cur) return false;
  switch (name){
    case 'a': case 'right': case 'down': {
      if (cur.reveal < REVEAL_MAX) finishReveal(); else closeDefeat();
      return true; }
    case 'b': case 'back': case 'start': closeDefeat(); return true;
    default: return false;
  }
}
