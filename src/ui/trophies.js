/* 🏅 ACHIEVEMENTS: as they happen, a banner slides in at the top of the screen with a chime, holds three
   seconds and slides away — several queue, and it never takes input or blocks a press. On the shelf, the
   achievements sit grouped by their group: earned ones bright with a tier rim, unearned ones dim with a
   progress bar, hidden ones as ??? with their hint. Plain data in ChatGPT's achievements shape; Claude
   calls trophyBanner wherever the tracker reports an unlock. */
import { esc } from '../util/core.js';
import { sfx } from '../audio/sound.js';

const TIER_RIM = { bronze:'rgba(205,127,50,.8)', silver:'rgba(192,192,192,.85)', gold:'rgba(228,184,102,.95)' };
const TIER_LABEL = { bronze:'Bronze', silver:'Silver', gold:'Gold' };

let bannerEl = null, queue = [], showing = false, hideTimer = 0, inTimer = 0;
let el = null, bodyEl = null, cur = null;

function ensureStyle(){
  if (document.getElementById('trophiesStyle')) return;
  const s = document.createElement('style'); s.id = 'trophiesStyle';
  s.textContent = `#trophyBanner{position:fixed;left:50%;transform:translate(-50%,-140%);z-index:65;min-width:min(340px,86vw);max-width:min(420px,92vw);
  background:#14100c;color:var(--ink);border:1px solid var(--gold-line);border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.6);
  font-family:var(--ui);padding:9px 14px;display:flex;gap:10px;align-items:center;pointer-events:none;
  transition:transform .35s var(--ease);box-sizing:border-box}
#trophyBanner.in{transform:translate(-50%,0)}
#trophyBanner .tb-ic{font-size:22px;flex:0 0 auto}
#trophyBanner .tb-nm{font-family:var(--regal);font-size:15px;color:var(--gold-hi)}
#trophyBanner .tb-tx{font-size:12px;color:var(--dim);line-height:1.4}
#trophyBanner.t-bronze{border-color:rgba(205,127,50,.8)}
#trophyBanner.t-silver{border-color:rgba(192,192,192,.85)}
#trophyBanner.t-gold{border-color:var(--gold);box-shadow:0 12px 40px rgba(0,0,0,.6),0 0 20px rgba(228,184,102,.35)}
#trophies{position:fixed;z-index:60;display:flex;flex-direction:column;background:#0b0d0a;color:var(--ink);
  border:1px solid rgba(228,184,102,.55);border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.65);
  font-family:var(--ui);overflow:hidden;box-sizing:border-box}
#trophies *{box-sizing:border-box}
.tr-head{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:7px 6px 4px;border-bottom:1px solid var(--line)}
.tr-title{flex:1;min-width:0;text-align:center;font-family:var(--regal);font-variant:small-caps;letter-spacing:.14em;font-size:14px;color:var(--gold-hi);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tr-score{flex:0 0 auto;color:var(--dim);font-size:11.5px}
.tr-x{flex:0 0 auto;width:28px;height:26px;border:1px solid var(--line-2);border-radius:6px;background:transparent;color:var(--gold);font-size:12px;cursor:pointer;padding:0}
.tr-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 10px 10px;min-height:0;scrollbar-width:thin}
.tr-foot{flex:0 0 auto;padding:5px 10px 7px;border-top:1px solid var(--line);background:transparent;font:inherit;font-size:10.5px;color:var(--dim);text-align:center;letter-spacing:.04em;cursor:pointer;width:100%}
.tr-grp{font-variant:small-caps;letter-spacing:.14em;font-size:12px;color:var(--gold);border-bottom:1px solid var(--line);padding:8px 0 3px;margin:2px 0 6px}
.tr-row{display:flex;gap:10px;align-items:center;width:100%;border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin-bottom:6px;background:transparent;color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.tr-row.on{border-color:var(--gold);background:rgba(228,184,102,.14)}
.tr-row.got-bronze{border-color:rgba(205,127,50,.8)}
.tr-row.got-silver{border-color:rgba(192,192,192,.85)}
.tr-row.got-gold{border-color:var(--gold);box-shadow:0 0 10px rgba(228,184,102,.25)}
.tr-row.dim{opacity:.55}
.tr-ic{flex:0 0 auto;font-size:20px;width:28px;text-align:center}
.tr-nm{font-family:var(--regal);font-size:14.5px}
.tr-tx{color:var(--dim);font-size:12px;line-height:1.45;margin-top:1px}
.tr-bar{height:5px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:6px;overflow:hidden}
.tr-bar i{display:block;height:100%;background:var(--gold)}
.tr-pct{font-size:11px;color:var(--dim);margin-top:3px}
.tr-empty{padding:14px 4px;color:var(--dim);font-style:italic;font-size:13px;line-height:1.5;text-align:center}
@media (prefers-reduced-motion: reduce){#trophyBanner{transition:none}}
body.hh-lcd #trophies{border-radius:2px;box-shadow:none}
body.hh-lcd #trophies .tr-row,body.hh-lcd #trophies .tr-x,body.hh-lcd #trophyBanner{border-radius:2px}`;
  document.head.appendChild(s);
}

function placeShelf(){
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
function placeBanner(){
  if (!bannerEl) return;
  const cs = getComputedStyle(document.body);
  const on = document.body.classList.contains('hh');
  const y = parseFloat(cs.getPropertyValue('--hh-scr-y')), h = parseFloat(cs.getPropertyValue('--hh-scr-h'));
  bannerEl.style.top = (on && Number.isFinite(y) && Number.isFinite(h) && h > 40) ? `${y + 8}px` : '12px';
}

/* ---------- the banner ---------- */
function showNext(){
  if (showing || !queue.length) return;
  showing = true;
  const t = queue.shift();
  ensureStyle();
  if (!bannerEl){
    bannerEl = document.createElement('div');
    bannerEl.id = 'trophyBanner'; bannerEl.setAttribute('role', 'status'); bannerEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(bannerEl);
  }
  bannerEl.className = `t-${t.tier || 'bronze'}`;
  bannerEl.innerHTML = `<span class="tb-ic">${esc(t.icon || '🏆')}</span><span><div class="tb-nm">${esc(t.name || 'Achievement')}</div><div class="tb-tx">${esc(t.text || '')}</div></span>`;
  placeBanner();
  // a short timer, not a double requestAnimationFrame: on a slow device a frame can take seconds, and the
  // three-second hold would expire before the slide-in ever ran. The hold starts once the banner is in, so
  // the three seconds are three seconds of the banner being there, not of a timer set when it was built.
  inTimer = setTimeout(() => {
    bannerEl?.classList.add('in');
    try { sfx('chime', false); } catch {}
    hideTimer = setTimeout(() => {
      if (!bannerEl) { showing = false; return; }
      bannerEl.classList.remove('in');
      setTimeout(() => { showing = false; if (!queue.length && bannerEl){ bannerEl.remove(); bannerEl = null; } showNext(); }, 380);
    }, 3000);
  }, 50);
}
export function trophyBanner({ name, text, icon, tier } = {}){
  if (!name) return false;
  queue.push({ name, text, icon, tier });
  showNext();
  return true;
}

/* ---------- the shelf ---------- */
const flatShelf = () => cur?.shelf || [];
function paintHi(){
  if (!el || !cur) return;
  el.querySelectorAll('.tr-row').forEach(n => n.classList.toggle('on', +n.dataset.i === cur.hi));
  el.querySelector(`.tr-row[data-i="${cur.hi}"]`)?.scrollIntoView({ block:'nearest' });
}
function render(){
  if (!el || !cur) return;
  const shelf = flatShelf(), score = cur.score || {};
  el.querySelector('.tr-title').textContent = 'Achievements';
  el.querySelector('.tr-score').textContent = `${score.got ?? shelf.filter(a => a.got).length} / ${score.of ?? shelf.length}`;
  el.querySelector('.tr-foot').textContent = 'D-pad moves · Ⓑ closes (or tap here)';
  if (!shelf.length){ bodyEl.innerHTML = '<div class="tr-empty">No achievements yet — the valley keeps its own score.</div>'; return; }
  const groups = [];
  for (const a of shelf){ if (!groups.includes(a.group)) groups.push(a.group); }
  const label = g => ({ fighting:'Fighting', luck:'Luck', 'the-road':'The road', people:'People', odd:'Odd things' }[g] || (g ? g[0].toUpperCase() + g.slice(1) : 'The valley'));
  bodyEl.innerHTML = groups.map(g => `<div class="tr-grp">${esc(label(g))}</div>${shelf.map((a, i) => {
    if (a.group !== g) return '';
    const hidden = a.hidden && !a.got;
    const name = hidden ? '???' : a.name, text = hidden ? (a.hint || 'Something in the valley, waiting.') : a.text;
    const rim = a.got ? ` got-${a.tier || 'bronze'}` : ' dim';
    const bar = a.got ? '' : `<div class="tr-bar"><i style="width:${Math.max(0, Math.min(100, a.pct ?? 0))}%"></i></div><div class="tr-pct">${a.n ?? 0} / ${a.goal ?? 1} · ${TIER_LABEL[a.tier] || ''}</div>`;
    return `<button class="tr-row${rim}" data-i="${i}"><span class="tr-ic">${esc(hidden ? '?' : (a.icon || '🏆'))}</span>
      <span style="flex:1;min-width:0"><span class="tr-nm">${esc(name)}</span><div class="tr-tx">${esc(text)}</div>${bar}</span></button>`;
  }).join('')}`).join('');
  paintHi();
}
function onKey(e){
  if (e.key === 'Escape'){ e.preventDefault(); closeTrophies(); }
  else if (e.key === ' '){ e.preventDefault(); }
}
function onClick(e){
  if (e.target.closest('[data-tr="close"]')){ closeTrophies(); return; }
  if (e.target.closest('.tr-foot')){ closeTrophies(); return; }
  const row = e.target.closest('.tr-row');
  if (row){ cur.hi = +row.dataset.i; paintHi(); }
}

export function openTrophies(shelf, score, { onClose } = {}){
  if (!Array.isArray(shelf)) return null;
  if (cur) closeTrophies();
  cur = { shelf, score:score || null, onClose:typeof onClose === 'function' ? onClose : null, hi:0 };
  ensureStyle();
  el = document.createElement('div');
  el.id = 'trophies'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Achievements');
  el.innerHTML = `<div class="tr-head"><div class="tr-title"></div><span class="tr-score"></span><button class="tr-x" data-tr="close" aria-label="Close">✕</button></div>
    <div class="tr-body" tabindex="-1"></div><button class="tr-foot"></button>`;
  el.addEventListener('click', onClick);
  document.body.appendChild(el);
  bodyEl = el.querySelector('.tr-body');
  placeShelf();
  addEventListener('resize', placeShelf); addEventListener('keydown', onKey);
  render();
  return el;
}
export function closeTrophies(){
  if (!cur) return;
  const cb = cur.onClose; cur = null;
  if (el){ el.remove(); el = null; bodyEl = null; }
  removeEventListener('resize', placeShelf); removeEventListener('keydown', onKey);
  cb?.();
}
export const trophiesOpen = () => !!cur;
export function trophiesPress(name){
  if (!cur) return false;
  const n = flatShelf().length;
  switch (name){
    case 'up': case 'left': if (n){ cur.hi = Math.max(0, cur.hi - 1); paintHi(); } return true;
    case 'down': case 'right': if (n){ cur.hi = Math.min(n - 1, cur.hi + 1); paintHi(); } return true;
    case 'a': return true;   // the shelf is read-only: A just rests on a row
    case 'b': case 'back': case 'start': closeTrophies(); return true;
    default: return false;
  }
}
