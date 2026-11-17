/* 📕 THE BESTIARY BOOK: the creatures the party has met, filling in as they learn them. A grid by family;
   tier 0 is a dark silhouette with ???, tier 1 a face and a name, tier 2 adds a small ⚔, tier 3 a gold edge.
   An entry opened shows what its tier has earned — the seen line, the fought lines and revealed numbers, the
   lore with its voice and a tip — and what it hasn't as a locked line with `next`. Plain data in ChatGPT's
   bestiary-lore shape; Claude wires the book in from the menu. */
import { esc } from '../util/core.js';

let el = null, bodyEl = null, cur = null;

function ensureStyle(){
  if (document.getElementById('bestiaryStyle')) return;
  const s = document.createElement('style'); s.id = 'bestiaryStyle';
  s.textContent = `#bestiary{position:fixed;z-index:60;display:flex;flex-direction:column;background:#0b0d0a;color:var(--ink);
  border:1px solid rgba(228,184,102,.55);border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.65);
  font-family:var(--ui);overflow:hidden;box-sizing:border-box}
#bestiary *{box-sizing:border-box}
.be-head{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:7px 6px 4px;border-bottom:1px solid var(--line)}
.be-title{flex:1;min-width:0;text-align:center;font-family:var(--regal);font-variant:small-caps;letter-spacing:.14em;font-size:14px;color:var(--gold-hi);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.be-x{flex:0 0 auto;width:28px;height:26px;border:1px solid var(--line-2);border-radius:6px;background:transparent;color:var(--gold);font-size:12px;cursor:pointer;padding:0}
.be-count{flex:0 0 auto;color:var(--dim);font-size:11.5px}
.be-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 10px 10px;min-height:0;scrollbar-width:thin}
.be-foot{flex:0 0 auto;padding:5px 10px 7px;border-top:1px solid var(--line);background:transparent;font:inherit;font-size:10.5px;color:var(--dim);text-align:center;letter-spacing:.04em;cursor:pointer;width:100%}
.be-fam{font-variant:small-caps;letter-spacing:.14em;font-size:12px;color:var(--gold);border-bottom:1px solid var(--line);padding:8px 0 3px;margin:2px 0 6px}
.be-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px}
.be-cell{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--line);border-radius:8px;padding:8px 4px 6px;background:transparent;color:var(--ink);font:inherit;cursor:pointer;min-width:0}
.be-cell.on{border-color:var(--gold);background:rgba(228,184,102,.14)}
.be-cell.t3{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold),0 0 12px rgba(228,184,102,.3)}
.be-face{width:52px;height:52px;border-radius:8px;object-fit:cover;background:#1a1512;border:1px solid var(--gold-line)}
.be-face.sil{background:#050403;display:flex;align-items:center;justify-content:center;font-family:var(--regal);font-size:26px;color:var(--dim);border-color:var(--line)}
.be-nm{font-size:11.5px;line-height:1.2;text-align:center;overflow-wrap:anywhere}
.be-nm .be-sword{color:var(--gold);font-size:10px}
.be-entry-face{width:104px;height:104px;border-radius:12px;object-fit:cover;margin:8px auto 4px;background:#1a1512;border:1px solid var(--gold-line);display:block}
.be-entry-face.sil{display:flex;align-items:center;justify-content:center;font-family:var(--regal);font-size:44px;color:var(--dim);border-color:var(--line);background:#050403}
.be-en{font-family:var(--regal);font-size:19px;color:var(--gold-hi);text-align:center}
.be-ef{color:var(--dim);font-size:12px;text-align:center;font-variant:small-caps;letter-spacing:.12em}
.be-counts{color:var(--dim);font-size:12px;text-align:center;margin-top:4px}
.be-h{font-variant:small-caps;letter-spacing:.12em;font-size:12px;color:var(--gold);border-bottom:1px solid var(--line);padding:8px 0 3px;margin:4px 0;text-align:left}
.be-p{text-align:left;line-height:1.55;font-size:13px;margin:6px 0}
.be-voice{text-align:right;color:var(--dim);font-style:italic;font-size:12.5px;margin:2px 0 6px}
.be-tags{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-start;margin:6px 0}
.be-tag{border:1px solid var(--line-2);border-radius:20px;padding:2px 8px;font-size:11.5px;color:var(--dim)}
.be-tag b{color:var(--ink);font-weight:600}
.be-lock{color:var(--dim);font-style:italic;font-size:13px;line-height:1.5;text-align:left;margin:6px 0}
.be-empty{padding:14px 4px;color:var(--dim);font-style:italic;font-size:13px;line-height:1.5;text-align:center}
@media (prefers-reduced-motion: reduce){.be-cell{transition:none}}
body.hh-lcd #bestiary{border-radius:2px;box-shadow:none}
body.hh-lcd #bestiary .be-cell,body.hh-lcd #bestiary .be-face,body.hh-lcd #bestiary .be-entry-face,body.hh-lcd #bestiary .be-x{border-radius:2px}`;
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

const faceFor = e => cur.faces?.[e.bid];
const faceHtml = (e, big = false) => {
  const url = faceFor(e), cls = big ? 'be-entry-face' : 'be-face';
  if (e.tier >= 1 && url) return `<img class="${cls}" src="${esc(url)}" alt="">`;
  return `<div class="${cls} sil">?</div>`;
};
const columns = () => {
  const grid = bodyEl?.querySelector('.be-grid'); if (!grid) return 1;
  const cells = [...grid.children]; if (!cells.length) return 1;
  const top = cells[0].offsetTop; let n = 0;
  for (const c of cells){ if (c.offsetTop === top) n++; else break; }
  return Math.max(1, n);
};
const paintHi = () => {
  if (!el || !cur || cur.open) return;
  el.querySelectorAll('.be-cell').forEach(n => n.classList.toggle('on', +n.dataset.i === cur.hi));
  el.querySelector(`.be-cell[data-i="${cur.hi}"]`)?.scrollIntoView({ block:'nearest' });
};

function render(){
  if (!el || !cur) return;
  const book = cur.book, entries = book.entries || [];
  el.querySelector('.be-title').textContent = cur.open ? (cur.open.tier >= 1 ? cur.open.name : '???') : 'Bestiary';
  el.querySelector('.be-count').textContent = `${book.seen ?? 0} / ${book.of ?? entries.length} seen`;
  el.querySelector('.be-foot').textContent = cur.open ? 'Ⓑ back to the book (or tap here)' : 'D-pad moves · Ⓐ opens · Ⓑ closes (or tap here)';
  if (!cur.open){
    if (!entries.length){ bodyEl.innerHTML = '<div class="be-empty">Nothing in the book yet — the valley is still a rumour.</div>'; return; }
    const fams = [];
    for (const e of entries){ if (!fams.includes(e.family)) fams.push(e.family); }
    bodyEl.innerHTML = fams.map(f => `<div class="be-fam">${esc(f || 'The valley')}</div><div class="be-grid">${entries.map((e, i) => e.family === f ? `<button class="be-cell${e.tier >= 3 ? ' t3' : ''}" data-i="${i}">${faceHtml(e)}
      <span class="be-nm">${esc(e.tier >= 1 ? e.name : '???')}${e.tier >= 2 ? ' <span class="be-sword">⚔</span>' : ''}</span></button>` : '').join('')}</div>`).join('');
    paintHi();
    return;
  }
  const e = cur.open, t = e.tier || 0, counts = e.counts || {};
  const tag = (k, v) => v == null || v === '' ? '' : `<span class="be-tag">${esc(k)} <b>${esc(Array.isArray(v) ? v.join(', ') : String(v))}</b></span>`;
  const r = e.revealed || {};
  let html = `${faceHtml(e, true)}<div class="be-en">${esc(t >= 1 ? e.name : '???')}</div>
    <div class="be-ef">${esc(t >= 1 ? (e.family || '') : '???')}</div>
    <div class="be-counts">Seen ${counts.seen ?? 0} · fought ${counts.fought ?? 0} · killed ${counts.killed ?? 0}</div>`;
  if (t >= 1 && e.seen) html += `<div class="be-h">First seen</div><p class="be-p">${esc(e.seen)}</p>`;
  if (t >= 2){
    if ((e.fought || []).length) html += `<div class="be-h">How it fights</div>${e.fought.map(l => `<p class="be-p">${esc(l)}</p>`).join('')}`;
    const tags = tag('Armour', r.ac) + tag('HP', r.hp) + tag('Speed', r.speed) + tag('Resists', r.resist) + tag('Immune', r.immune) + tag('Weak to', r.vuln);
    if (tags) html += `<div class="be-tags">${tags}</div>`;
  } else if (t === 1 && e.next) html += `<p class="be-lock">🔒 ${esc(e.next)}</p>`;
  if (t >= 3){
    if (e.lore) html += `<div class="be-h">Its story</div><p class="be-p">${esc(e.lore)}</p>`;
    if (e.voice) html += `<div class="be-voice">— ${esc(e.voice)}</div>`;
    if (e.tip) html += `<div class="be-h">A word of advice</div><p class="be-p">${esc(e.tip)}</p>`;
  } else if (t === 2 && e.next) html += `<p class="be-lock">🔒 ${esc(e.next)}</p>`;
  if (t === 0 && e.next) html += `<p class="be-lock">🔒 ${esc(e.next)}</p>`;
  bodyEl.innerHTML = html;
  bodyEl.scrollTop = 0;
}
function move(d){
  if (cur.open){ bodyEl.scrollBy({ top:d * 48 }); return; }
  const n = (cur.book.entries || []).length; if (!n) return;
  cur.hi = Math.max(0, Math.min(n - 1, cur.hi + d));
  paintHi();
}
function onKey(e){
  if (e.key === 'Escape'){ e.preventDefault(); closeBestiary(); }
  else if (e.key === ' '){ e.preventDefault(); bestiaryPress('a'); }
}
function onClick(e){
  if (e.target.closest('[data-be="close"]')){ closeBestiary(); return; }
  if (e.target.closest('.be-foot')){ bestiaryPress('b'); return; }
  const cell = e.target.closest('.be-cell');
  if (cell){ cur.hi = +cell.dataset.i; paintHi(); bestiaryPress('a'); }
}

export function openBestiary(book, { faces = {}, onClose } = {}){
  if (!book) return null;
  if (cur) closeBestiary();
  cur = { book, faces, onClose:typeof onClose === 'function' ? onClose : null, hi:0, open:null };
  ensureStyle();
  el = document.createElement('div');
  el.id = 'bestiary'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Bestiary');
  el.innerHTML = `<div class="be-head"><div class="be-title"></div><span class="be-count"></span><button class="be-x" data-be="close" aria-label="Close">✕</button></div>
    <div class="be-body" tabindex="-1"></div><button class="be-foot"></button>`;
  el.addEventListener('click', onClick);
  document.body.appendChild(el);
  bodyEl = el.querySelector('.be-body');
  place();
  addEventListener('resize', place); addEventListener('keydown', onKey);
  render();
  return el;
}
export function closeBestiary(){
  if (!cur) return;
  const cb = cur.onClose; cur = null;
  if (el){ el.remove(); el = null; bodyEl = null; }
  removeEventListener('resize', place); removeEventListener('keydown', onKey);
  cb?.();
}
export const bestiaryOpen = () => !!cur;
export function setBestiaryFace(bid, url){
  if (!cur || !bid) return;
  cur.faces = { ...cur.faces, [bid]:url };
  render();
}
export function bestiaryPress(name){
  if (!cur) return false;
  const n = (cur.book.entries || []).length;
  switch (name){
    case 'up': move(-columns()); return true;
    case 'down': move(columns()); return true;
    case 'left': move(-1); return true;
    case 'right': move(1); return true;
    case 'a': {
      if (cur.open) return true;
      const e = (cur.book.entries || [])[cur.hi]; if (!e) return true;
      cur.open = e; render(); return true; }
    case 'b': case 'back': case 'start': {
      if (cur.open){ cur.open = null; render(); return true; }
      closeBestiary(); return true; }
    default: return false;
  }
}
