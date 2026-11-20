/* ⛨ CHOOSE YOUR CALLING: the moment a player chooses who they are. A grid of the twelve Callings —
   each with its emblem, its name, its era and a one-line who-they-are — and choosing one turns it over
   into the detail: the blurb, the signature, and its three Paths, the Seep-touched one marked. Choose
   (Ⓐ / Enter / tap) calls onPick({ calling, path }); a Path is optional (it's chosen at level 3, but a
   player may decide now). Ⓑ / Escape goes back, then closes. It takes plain data shaped like ChatGPT's
   callingList() (with Paths and a signature where the data has them); Claude wires it in from the hero
   creator in place of the class <select>. Grouped by era: The Drawn (far-future, ancient, medieval, any)
   and Born in Barovia. No animation to finish: the card turns over at once, at full strength (rounds
   13–14: a CSS fade-in never advances on a slow compositor, and a frame can take seconds). */
import { esc } from '../util/core.js';
import { emblemSvg } from './emblems.js';

const ERA_LABEL = { 'far-future':'The Drawn: far-future', ancient:'The Drawn: ancient',
  medieval:'The Drawn: medieval', barovian:'Born in Barovia', any:'The Drawn' };
const ERA_SHORT = { 'far-future':'Far-future', ancient:'Ancient', medieval:'Medieval', barovian:'Barovian', any:'The Drawn' };
const ERA_GROUP = { 'far-future':'drawn', ancient:'drawn', medieval:'drawn', barovian:'barovia', any:'drawn' };
const eraLabel = c => ERA_LABEL[c.era] || 'The Drawn';
const eraShort = c => ERA_SHORT[c.era] || 'The Drawn';
const eraGroup = c => ERA_GROUP[c.era] || 'drawn';
const FILTERS = [['all', 'All twelve'], ['drawn', 'The Drawn'], ['barovia', 'Born in Barovia']];
// The Seep-touched mark: a green-black bloom, and a word of warning. The rot gives, and the rot keeps count.
const SEEP_WARN = 'The rot gives, and the rot keeps count.';
const seepMark = () => `<span class="cp-seep" title="${esc(SEEP_WARN)}">${emblemSvg('seepbound', { size:16, color:'var(--seep)' })} Seep-touched</span>`;

let el = null, bodyEl = null, cur = null;

function ensureStyle(){
  if (document.getElementById('callingPickerStyle')) return;
  const s = document.createElement('style'); s.id = 'callingPickerStyle';
  s.textContent = `#callingPicker{position:fixed;z-index:60;display:flex;flex-direction:column;background:#0b0d0a;color:var(--ink);
  border:1px solid var(--gold-line);border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.65);
  font-family:var(--ui);overflow:hidden;box-sizing:border-box}
#callingPicker *{box-sizing:border-box}
.cp-head{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:7px 6px 4px;border-bottom:1px solid var(--line)}
.cp-title{flex:1;min-width:0;text-align:center;font-family:var(--regal);font-variant:small-caps;letter-spacing:.14em;font-size:14px;color:var(--gold-hi);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cp-x{flex:0 0 auto;width:28px;height:26px;border:1px solid var(--line-2);border-radius:6px;background:transparent;color:var(--gold);font-size:12px;cursor:pointer;padding:0}
.cp-filters{flex:0 0 auto;display:flex;gap:6px;justify-content:center;padding:8px 10px 2px;flex-wrap:wrap}
.cp-filters button{border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--dim);font-size:12px;padding:4px 12px;cursor:pointer}
.cp-filters button.on{border-color:var(--gold-line);color:var(--gold-hi);background:rgba(228,184,102,.08)}
.cp-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:10px 12px;min-height:0;scrollbar-width:thin}
.cp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.cp-card{display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;border:1px solid var(--line);border-radius:8px;padding:10px 6px 8px;background:rgba(255,246,232,.03);color:var(--ink);cursor:pointer;font:inherit}
.cp-card.on{border-width:2px;padding:9px 5px 7px;box-shadow:0 0 14px rgba(228,184,102,.25)}
.cp-card .cp-em{height:56px;display:flex;align-items:center;justify-content:center}
.cp-card .cp-nm{font-family:var(--regal);font-size:14.5px;line-height:1.15}
.cp-card .cp-era{font-variant:small-caps;letter-spacing:.1em;font-size:10px;color:var(--dim)}
.cp-card .cp-who{font-size:11.5px;color:var(--dim);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cp-card .cp-now{font-size:10px;color:var(--gold);font-variant:small-caps;letter-spacing:.14em}
.cp-none{color:var(--dim);font-style:italic;text-align:center;padding:30px 10px}
.cp-det{text-align:center}
.cp-det .cp-em{margin:6px 0 2px}
.cp-det .cp-nm{font-family:var(--regal);font-size:22px;color:var(--gold-hi)}
.cp-det .cp-era{font-variant:small-caps;letter-spacing:.14em;font-size:11px;color:var(--dim);margin-top:2px}
.cp-det .cp-blurb{font-size:13.5px;line-height:1.55;color:var(--ink);margin:12px 4px 0;text-align:left}
.cp-sig{margin:14px 4px 0;padding:10px 12px;border-left:2px solid var(--gold-line);background:rgba(228,184,102,.05);text-align:left}
.cp-sig b{font-family:var(--regal);font-size:14px;color:var(--gold-hi)}
.cp-sig div{font-size:13px;color:var(--dim);line-height:1.5;margin-top:2px}
.cp-paths{margin-top:14px;text-align:left}
.cp-paths h3{font-family:var(--regal);font-variant:small-caps;letter-spacing:.14em;font-size:12px;color:var(--dim);margin:0 4px 6px}
.cp-path{display:block;width:100%;text-align:left;border:1px solid var(--line);border-radius:8px;padding:9px 11px;margin:0 0 6px;background:rgba(255,246,232,.03);color:var(--ink);cursor:pointer;font:inherit}
.cp-path.on{border-color:var(--gold-line);background:rgba(228,184,102,.08)}
.cp-path.seep{border-color:rgba(165,204,69,.4);background:rgba(165,204,69,.05)}
.cp-path.seep.on{border-color:var(--seep);box-shadow:0 0 12px rgba(165,204,69,.2)}
.cp-path .cp-pn{font-family:var(--regal);font-size:14.5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.cp-path .cp-pb{font-size:12.5px;color:var(--dim);line-height:1.45;margin-top:2px}
.cp-path .cp-pc{font-size:12px;color:var(--seep);font-style:italic;margin-top:3px}
.cp-seep{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--seep);font-variant:small-caps;letter-spacing:.1em}
.cp-choose{width:100%;margin:12px 0 4px;padding:11px;border:1px solid var(--gold-line);border-radius:8px;background:rgba(228,184,102,.12);color:var(--gold-hi);font-family:var(--regal);font-size:16px;letter-spacing:.06em;cursor:pointer}
.cp-choose:active{background:rgba(228,184,102,.25)}
.cp-back{width:100%;padding:7px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--dim);font-size:13px;cursor:pointer}
.cp-foot{flex:0 0 auto;padding:5px 10px 7px;border-top:1px solid var(--line);background:transparent;font:inherit;font-size:10.5px;color:var(--dim);text-align:center;letter-spacing:.04em}
@media (max-width:760px){.cp-grid{grid-template-columns:repeat(2,1fr)}}
body.hh-lcd #callingPicker{border-radius:2px;box-shadow:none}
body.hh-lcd #callingPicker .cp-card,body.hh-lcd #callingPicker .cp-path,body.hh-lcd #callingPicker .cp-choose,body.hh-lcd #callingPicker .cp-back,body.hh-lcd #callingPicker .cp-x,body.hh-lcd #callingPicker .cp-filters button{border-radius:2px}`;
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
    Object.assign(el.style, { left:'50%', top:'50%', width:'min(560px, 94vw)', height:'min(640px, 88vh)', transform:'translate(-50%,-50%)' });
}

const filtered = () => cur.filter === 'all' ? cur.callings : cur.callings.filter(c => eraGroup(c) === cur.filter);
const cols = () => (el && el.clientWidth < 420 ? 2 : 4);
const callingById = id => cur.callings.find(c => c.id === id) || null;

function render(){
  if (!el || !cur) return;
  const list = filtered();
  el.querySelector('.cp-title').textContent = cur.view === 'detail' ? (cur.sel?.name || 'Choose your Calling') : 'Choose your Calling';
  el.querySelector('.cp-foot').textContent = cur.view === 'detail'
    ? '↑↓ choose a Path · Ⓐ confirm · Ⓑ back (or tap)'
    : '↑↓←→ move · Ⓐ open · Ⓑ close (or tap)';
  const filters = el.querySelector('.cp-filters');
  filters.style.display = cur.view === 'detail' ? 'none' : '';
  filters.innerHTML = FILTERS.map(([k, label]) => {
    const n = k === 'all' ? cur.callings.length : cur.callings.filter(c => eraGroup(c) === k).length;
    return `<button data-cp-filter="${k}" class="${cur.filter === k ? 'on' : ''}">${esc(label)} (${n})</button>`;
  }).join('');
  if (cur.view === 'grid'){
    if (!list.length){ bodyEl.innerHTML = '<div class="cp-none">No Callings here yet.</div>'; return; }
    if (cur.idx >= list.length) cur.idx = list.length - 1;
    if (cur.idx < 0) cur.idx = 0;
    bodyEl.innerHTML = `<div class="cp-grid">${list.map((c, i) => {
      const on = i === cur.idx, now = cur.current && c.id === cur.current;
      return `<button class="cp-card${on ? ' on' : ''}" data-cp-card="${esc(c.id)}"${on ? ` style="border-color:${esc(c.color || '#e4b866')}"` : ''} data-i="${i}">
        <span class="cp-em" style="color:${esc(c.color || '#e4b866')}">${emblemSvg(c.id, { size:56 })}</span>
        <span class="cp-nm">${esc(c.name)}</span><span class="cp-era">${esc(eraShort(c))}</span>
        <span class="cp-who">${esc(c.blurb || '')}</span>${now ? '<span class="cp-now">Chosen now</span>' : ''}</button>`;
    }).join('')}</div>`;
  } else {
    const c = cur.sel;
    if (!c){ bodyEl.innerHTML = '<div class="cp-none">No Calling chosen.</div>'; return; }
    const paths = Array.isArray(c.paths) ? c.paths : [];
    const sig = c.signature;
    const pathName = cur.pathSel ? (paths.find(p => p.id === cur.pathSel)?.name || null) : null;
    bodyEl.innerHTML = `<div class="cp-det">
      <div class="cp-em" style="color:${esc(c.color || '#e4b866')}">${emblemSvg(c.id, { size:120 })}</div>
      <div class="cp-nm">${esc(c.name)}</div>
      <div class="cp-era">${esc(eraLabel(c))} · stands on ${esc(c.chassis || '')}</div>
      <div class="cp-blurb">${esc(c.blurb || '')}</div>
      ${sig ? `<div class="cp-sig"><b>${esc(sig.n || 'Signature')}</b><div>${esc(sig.text || '')}</div></div>` : ''}
      ${paths.length ? `<div class="cp-paths"><h3>Paths — chosen at level 3, or now</h3>${paths.map(p => {
        const on = cur.pathSel === p.id;
        return `<button class="cp-path${on ? ' on' : ''}${p.seep ? ' seep' : ''}" data-cp-path="${esc(p.id)}">
          <span class="cp-pn">${esc(p.name)}${p.seep ? seepMark() : ''}</span>
          <span class="cp-pb">${esc(p.blurb || '')}</span>
          ${p.seep && p.cost ? `<span class="cp-pc">Its price: ${esc(p.cost)}</span>` : ''}
          ${p.seep && !p.cost ? `<span class="cp-pc">${esc(SEEP_WARN)}</span>` : ''}</button>`;
      }).join('')}</div>` : ''}
      <button class="cp-choose" data-cp="choose">Choose ${esc(c.name)}${pathName ? ` · ${esc(pathName)}` : ''}</button>
      <button class="cp-back" data-cp="back">← Back to the twelve</button></div>`;
  }
  bodyEl.scrollTop = 0;
}

function move(dRow, dCol){
  if (cur.view === 'detail'){
    const paths = Array.isArray(cur.sel?.paths) ? cur.sel.paths : [];
    const order = [null, ...paths.map(p => p.id)];   // no Path first: it's chosen at level 3
    const d = dRow + dCol;
    let i = order.indexOf(cur.pathSel);
    i = (i + d + order.length) % order.length;
    cur.pathSel = order[i];
    render();
    return;
  }
  const list = filtered();
  if (!list.length) return;
  const n = cols();
  let i = cur.idx + dRow * n + dCol;
  i = ((i % list.length) + list.length) % list.length;   // wrap around the grid
  cur.idx = i;
  render();
}
function openDetail(c){
  cur.sel = c; cur.pathSel = null; cur.view = 'detail';
  render();
}
function backToGrid(){
  cur.view = 'grid'; cur.sel = null; cur.pathSel = null;
  render();
}
function confirm(){
  const c = cur.sel;
  if (!c) return;
  const pick = { calling:c.id, path:cur.pathSel || null };
  const cb = cur.onPick;
  cur.onClose = null;   // a pick is not a back-out: onClose is only for Escape / ✕ / Ⓑ out
  closeCallingPicker();
  cb?.(pick);
}
function onKey(e){
  if (e.key === 'Escape'){ e.preventDefault(); callingPickerPress('b'); }
  else if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); callingPickerPress('a'); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); callingPickerPress('up'); }
  else if (e.key === 'ArrowDown'){ e.preventDefault(); callingPickerPress('down'); }
  else if (e.key === 'ArrowLeft'){ e.preventDefault(); callingPickerPress('left'); }
  else if (e.key === 'ArrowRight'){ e.preventDefault(); callingPickerPress('right'); }
}
function onClick(e){
  const f = e.target.closest('[data-cp-filter]');
  if (f){ cur.filter = f.dataset.cpFilter; cur.idx = 0; render(); return; }
  const card = e.target.closest('[data-cp-card]');
  if (card){ const c = callingById(card.dataset.cpCard); if (c) openDetail(c); return; }
  const p = e.target.closest('[data-cp-path]');
  if (p){ cur.pathSel = cur.pathSel === p.dataset.cpPath ? null : p.dataset.cpPath; render(); return; }
  const b = e.target.closest('[data-cp]');
  if (b?.dataset.cp === 'choose'){ confirm(); return; }
  if (b?.dataset.cp === 'back'){ backToGrid(); return; }
  if (b?.dataset.cp === 'close'){ closeCallingPicker(); return; }
}

export function openCallingPicker({ callings = [], current = null, onPick, onClose } = {}){
  if (cur) closeCallingPicker();
  const list = Array.isArray(callings) ? callings.filter(c => c && c.id && c.name) : [];
  cur = { callings:list, current:current || null,
    onPick:typeof onPick === 'function' ? onPick : null,
    onClose:typeof onClose === 'function' ? onClose : null,
    filter:'all', view:'grid', idx:0, sel:null, pathSel:null };
  if (current){
    const i = list.findIndex(c => c.id === current);
    if (i >= 0) cur.idx = i;
  }
  ensureStyle();
  el = document.createElement('div');
  el.id = 'callingPicker'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Choose your Calling');
  el.innerHTML = `<div class="cp-head"><div class="cp-title">Choose your Calling</div><button class="cp-x" data-cp="close" aria-label="Close">✕</button></div>
    <div class="cp-filters"></div><div class="cp-body" tabindex="-1"></div><div class="cp-foot"></div>`;
  el.addEventListener('click', onClick);
  document.body.appendChild(el);
  bodyEl = el.querySelector('.cp-body');
  place();
  addEventListener('resize', place); addEventListener('keydown', onKey);
  render();
  return el;
}
export function closeCallingPicker(){
  if (!cur) return;
  const cb = cur.onClose; cur = null;
  if (el){ el.remove(); el = null; bodyEl = null; }
  removeEventListener('resize', place); removeEventListener('keydown', onKey);
  cb?.();
}
export const callingPickerOpen = () => !!cur;
export function callingPickerPress(name){
  if (!cur) return false;
  switch (name){
    case 'up': move(-1, 0); return true;
    case 'down': move(1, 0); return true;
    case 'left': move(0, -1); return true;
    case 'right': move(0, 1); return true;
    case 'a': case 'enter': {
      if (cur.view === 'grid'){ const c = filtered()[cur.idx]; if (c) openDetail(c); }
      else confirm();
      return true; }
    case 'b': case 'back': case 'start': {
      if (cur.view === 'detail') backToGrid(); else closeCallingPicker();
      return true; }
    default: return false;
  }
}
