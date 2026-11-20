/* 📖 THE POCKET SHEET: the hero's sheet as a few small pages on the handheld's own screen, read and turned with
   the buttons, like the status screens of the old handheld games (in this app's own look: no console's name, badge
   or art). It only reads: no messages to the DM, no state changes. The hosts (ui/tablehh.js, ui/wander.js) call
   openPocketSheet(...) and give each press to pocketPress first — see the PR. */
import { classLine, originLine } from '../game/calling.js';
import { esc } from '../util/core.js';
import { ABILITIES } from '../data/srd.js';
import { heroStats, SP } from '../engine/hero.js';
import { migrateSheet, itemInfo } from '../engine/inventory.js';
import { left } from '../game/resources.js';

const ABIL_FULL = { Str:'Strength', Dex:'Dexterity', Con:'Constitution', Int:'Intelligence', Wis:'Wisdom', Cha:'Charisma' };
const lower = a => a.toLowerCase();
const sgn = n => `${n >= 0 ? '+' : ''}${n}`;
const PAGES = [
  { k:'hero', label:'Hero' }, { k:'fight', label:'Fighting' }, { k:'saves', label:'Saves & skills' },
  { k:'pack', label:'Pack' }, { k:'notes', label:'Notes' },
];
const EMPTY = {
  hero:'Nothing here yet — the sheet hasn\'t reached this phone.',
  fight:'Nothing here but the will to fight.',
  saves:'Nothing to save against, nothing learned — yet.',
  pack:'Nothing in your pack but lint and worry.',
  notes:'No notes, no letters yet.',
};

let el = null, titleEl = null, dotsEl = null, bodyEl = null, footEl = null, cur = null, st;

/* ---------- the look ---------- */
function ensureStyle(){
  if (document.getElementById('pocketSheetStyle')) return;
  const s = document.createElement('style'); s.id = 'pocketSheetStyle';
  s.textContent = `#pocketSheet{position:fixed;z-index:45;display:flex;flex-direction:column;background:#0b0d0a;color:var(--ink);
  border:1px solid rgba(228,184,102,.55);border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.65);
  font-family:var(--ui);overflow:hidden;box-sizing:border-box}
#pocketSheet *{box-sizing:border-box}
.pk-head{display:flex;align-items:center;gap:6px;padding:7px 6px 4px;border-bottom:1px solid var(--line)}
.pk-title{flex:1;min-width:0;text-align:center;font-family:var(--regal);font-variant:small-caps;letter-spacing:.14em;font-size:14px;color:var(--gold-hi);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk-arrow{flex:0 0 auto;width:28px;height:26px;border:1px solid var(--line-2);border-radius:6px;background:transparent;color:var(--gold);font-size:12px;cursor:pointer;padding:0}
.pk-arrow:active{background:rgba(228,184,102,.18)}
.pk-dots{display:flex;justify-content:center;gap:7px;padding:6px 0 2px}
.pk-dots span{width:6px;height:6px;border-radius:50%;border:1px solid var(--dim);background:transparent}
.pk-dots span.on{background:var(--gold);border-color:var(--gold)}
.pk-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:2px 10px 10px;scrollbar-width:thin;min-height:0}
.pk-foot{flex:0 0 auto;padding:5px 10px 7px;border:0;border-top:1px solid var(--line);background:transparent;font:inherit;font-size:10.5px;color:var(--dim);text-align:center;letter-spacing:.04em;cursor:pointer;width:100%}
.pk-x{margin-left:4px}
.pk-h{font-variant:small-caps;letter-spacing:.12em;font-size:12px;color:var(--gold);border-bottom:1px solid var(--line);padding:8px 0 3px;margin:2px 0 2px}
.pk-h small{float:right;color:var(--dim);letter-spacing:.02em;text-transform:none;font-variant:normal}
.pk-row{display:flex;align-items:baseline;gap:8px;width:100%;padding:6px 7px;border:0;border-left:2px solid transparent;background:transparent;color:var(--ink);font:inherit;font-size:13px;text-align:left;cursor:pointer;border-radius:4px}
.pk-row .pk-l{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pk-row.wrap{align-items:flex-start}.pk-row.wrap .pk-l{white-space:normal;line-height:1.45}
.pk-row .pk-s{flex:0 0 auto;color:var(--dim);font-size:12px}
.pk-row .pk-m{flex:0 0 auto;color:var(--gold);font-size:11px}
.pk-row.on{background:rgba(228,184,102,.16);border-left-color:var(--gold)}
.pk-row.on .pk-s{color:var(--gold-hi)}
.pk-row.pk-strahd .pk-l{color:#f0b0b0}
.pk-note{padding:10px 4px;color:var(--dim);font-style:italic;font-size:13px;line-height:1.5}
.pk-hero{display:flex;gap:10px;align-items:center;padding:8px 2px 4px}
.pk-face{flex:0 0 auto;width:52px;height:52px;border-radius:8px;border:1px solid var(--gold-line);object-fit:cover;background:#1a1512}
.pk-face.init{display:flex;align-items:center;justify-content:center;font-family:var(--regal);font-size:28px;color:#0b0d0a}
.pk-name{font-family:var(--regal);font-size:17px;line-height:1.15;overflow-wrap:anywhere}
.pk-sub{color:var(--dim);font-size:12px;margin-top:2px}
.pk-vitals{display:flex;gap:6px;padding:6px 2px}
.pk-vit{flex:1;min-width:0;text-align:center;border:1px solid var(--line);border-radius:6px;padding:5px 2px}
.pk-vit b{display:block;font-size:14px}
.pk-vit span{font-size:10px;color:var(--dim);font-variant:small-caps;letter-spacing:.1em}
.pk-hpbar{height:5px;border-radius:3px;background:rgba(255,255,255,.12);margin:5px 6px 0;overflow:hidden}
.pk-hpbar i{display:block;height:100%;background:var(--seep)}
.pk-hpbar i.low{background:var(--blood)}
.pk-chips{display:flex;flex-wrap:wrap;gap:5px;padding:4px 2px}
.pk-chip{border:1px solid rgba(194,58,70,.6);color:#f0b0b0;border-radius:20px;padding:2px 8px;font-size:11.5px}
.pk-pips{letter-spacing:1px}.pk-pips i{font-style:normal}.pk-pips .f{color:var(--gold)}.pk-pips .e{color:var(--faint)}
.pk-text{white-space:pre-wrap;line-height:1.55;font-size:13px;margin:8px 0}
.pk-meta{color:var(--dim);font-size:12px;margin:6px 0 0}
.pk-detail-t{font-family:var(--regal);font-size:16px;margin:6px 0 0}
.pk-coins{padding:8px 4px 2px;color:var(--dim);font-size:12.5px;border-top:1px solid var(--line);margin-top:4px}
.pk-body.pk-turn{animation:pkturn .14s var(--ease)}
.pk-body.pk-turn-b{animation:pkturn .14s var(--ease)}
@keyframes pkturn{from{opacity:.3}to{opacity:1}}   /* fade only: a slide would push the body past the sheet's edge and read as sideways overflow */
@media (prefers-reduced-motion: reduce){.pk-body.pk-turn,.pk-body.pk-turn-b{animation:none}}
body.hh-lcd #pocketSheet{border-radius:2px;box-shadow:none}
body.hh-lcd #pocketSheet .pk-face{border-radius:2px;image-rendering:pixelated}
body.hh-lcd #pocketSheet .pk-row,body.hh-lcd #pocketSheet .pk-vit,body.hh-lcd #pocketSheet .pk-arrow{border-radius:2px}`;
  document.head.appendChild(s);
}

/* ---------- where it sits ---------- */
function place(){
  if (!el) return;
  const cs = getComputedStyle(document.body);
  const on = document.body.classList.contains('hh');
  const x = parseFloat(cs.getPropertyValue('--hh-scr-x')), y = parseFloat(cs.getPropertyValue('--hh-scr-y')),
    w = parseFloat(cs.getPropertyValue('--hh-scr-w')), h = parseFloat(cs.getPropertyValue('--hh-scr-h'));
  if (on && Number.isFinite(x) && Number.isFinite(w) && Number.isFinite(h) && w > 40 && h > 40)
    Object.assign(el.style, { left:`${x}px`, top:`${y}px`, width:`${w}px`, height:`${h}px`, transform:'none' });
  else   // outside the handheld: a centred card the size of a phone screen
    Object.assign(el.style, { left:'50%', top:'50%', width:'min(340px, 94vw)', height:'min(480px, 88vh)', transform:'translate(-50%,-50%)' });
}

/* ---------- the sheet's numbers (read-only) ---------- */
const stats = () => {   // heroStats for the sheet behind the token, cached while the sheet is open
  if (st !== undefined) return st;
  try { st = cur.sheet ? heroStats(cur.sheet) : null; } catch { st = null; }
  return st;
};
const scoreOf = a => stats()?.sc?.[a] ?? (Number.isFinite(+cur.sheet?.ab?.[a]) ? +cur.sheet.ab[a] : null);
const modOf = a => { const m = cur.token.mods?.[lower(a)]; if (Number.isFinite(m)) return m;
  const sc = scoreOf(a); return sc == null ? null : Math.floor((sc - 10) / 2); };
const saveProf = a => { const s = stats(); if (!s) return false;
  if (s.C?.sv?.includes(a)) return true;
  if (s.cls === 'Monk' && s.L >= 14) return true;
  if (s.cls === 'Rogue' && s.L >= 15 && ['Wis', 'Cha'].includes(a)) return true;
  return false; };
const saveOf = a => { const v = cur.token.saves?.[lower(a)]; if (Number.isFinite(v)) return v;
  const s = stats(); return s ? s.saves[a] : null; };

/* ---------- the pages ---------- */
function buildPage(idx){
  const t = cur.token, rows = [];
  const addRow = r => { const i = rows.length; rows.push(r);
    return `<div class="pk-row${r.wrap ? ' wrap' : ''}${r.cls ? ` ${r.cls}` : ''}" role="button" data-i="${i}"><span class="pk-l">${esc(r.label)}</span>${r.sub ? `<span class="pk-s">${esc(r.sub)}</span>` : ''}${r.mark ? `<span class="pk-m">${esc(r.mark)}</span>` : ''}</div>`; };
  const head = (txt, sub = '') => `<div class="pk-h">${esc(txt)}${sub ? `<small>${sub}</small>` : ''}</div>`;
  const note = txt => `<div class="pk-note">${esc(txt)}</div>`;
  let html = '';
  if (idx === 0){   // Hero
    const sh = cur.sheet, name = t.name || 'Hero', initial = (name.trim()[0] || '?').toUpperCase();
    const colour = t.color || sh?.color || '#8a7a5a';
    const face = sh?.portrait
      ? `<img class="pk-face" src="${esc(sh.portrait)}" alt="">`
      : `<div class="pk-face init" style="background:${esc(colour)}">${esc(initial)}</div>`;
    const line = [sh ? originLine(sh) : '', t.callName ? classLine(t) : t.cls || (sh ? classLine(sh) : '')].filter(Boolean).join(' · ');
    html += `<div class="pk-hero">${face}<div><div class="pk-name">${esc(name)}</div><div class="pk-sub">${esc(line)}</div></div></div>`;
    const hp = Math.max(0, t.hp ?? 0), max = Math.max(1, t.maxHp ?? 1);
    html += `<div class="pk-vitals"><div class="pk-vit"><b>${t.ac ?? '—'}</b><span>Armour</span></div><div class="pk-vit"><b>${hp} / ${max}</b><span>Hit points</span></div><div class="pk-vit"><b>${t.speed ?? '—'} ft.</b><span>Speed</span></div></div>`;
    html += `<div class="pk-hpbar"><i class="${hp / max <= .25 ? 'low' : ''}" style="width:${Math.max(0, Math.min(100, hp / max * 100))}%"></i></div>`;
    if (t.conds?.length) html += `<div class="pk-chips">${t.conds.map(c => `<span class="pk-chip">${esc(c.n)}</span>`).join('')}</div>`;
    html += head('Abilities');
    for (const a of ABILITIES){
      const sc = scoreOf(a), m = modOf(a);
      html += addRow({ label:ABIL_FULL[a], sub:`${sc != null ? `${sc} · ` : ''}${m == null ? '—' : sgn(m)}` });
    }
  } else if (idx === 1){   // Fighting
    html += head('Attacks');
    const attacks = t.attacks || [];
    if (!attacks.length) html += note('No weapon to hand.');
    for (const a of attacks){
      html += addRow({ label:a.n, sub:`${sgn(a.b)} · ${a.d}${a.t ? ` ${a.t}` : ''}`, open:() => attackDetail(a) });
    }
    html += head('Spells');
    const casts = t.casts || [], byLevel = new Map();
    for (const c of casts){ const l = c.l || 0; if (!byLevel.has(l)) byLevel.set(l, []); byLevel.get(l).push(c); }
    if (!casts.length) html += note('No spells yet — the sword is enough.');
    for (const l of [...byLevel.keys()].sort((a, b) => a - b)){
      let pips = '';
      if (l > 0){ const r = (t.resources || []).find(r => r.slot === l);
        if (r){ const have = left(t, r.id), max = r.max || 0;
          pips = `<span class="pk-pips">${Array.from({ length:max }, (_, i) => `<i class="${i < have ? 'f' : 'e'}">●</i>`).join('')}</span>`; } }
      html += head(l === 0 ? 'Cantrips' : `Level ${l}`, pips);
      for (const c of byLevel.get(l)){
        const s = SP(c.n);
        html += addRow({ label:c.n, sub:`${l === 0 ? 'Cantrip' : `Level ${l}`}${s?.school ? ` · ${s.school}` : ''}`, open:() => spellDetail(c) });
      }
    }
    html += head('Features');
    const feats = (t.resources || []).filter(r => !r.slot);
    if (!feats.length) html += note('Nothing to spend.');
    for (const r of feats){
      html += addRow({ label:r.n, sub:`${left(t, r.id)} / ${r.max} left`, open:() => ({ title:r.n, sub:`${left(t, r.id)} of ${r.max} left`, html:`<p class="pk-text">${esc(r.text || 'Nothing more written about it.')}</p>` }) });
    }
  } else if (idx === 2){   // Saves & skills
    html += head('Saving throws');
    for (const a of ABILITIES){
      const v = saveOf(a);
      html += addRow({ label:`${ABIL_FULL[a]} save`, sub:v == null ? '—' : sgn(v), mark:saveProf(a) ? '●' : '' });
    }
    const s = stats();
    html += head('Skills', '● proficient · ★ expert');
    const skills = Object.entries(t.skills || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (!skills.length) html += note('No skills written down.');
    for (const [name, v] of skills){
      const expert = !!s?.expert?.has(name), prof = expert || !!s?.prof?.has(name);
      html += addRow({ label:name, sub:sgn(v), mark:expert ? '★' : prof ? '●' : '' });
    }
  } else if (idx === 3){   // Pack
    html += head('What you carry');
    const sh = cur.sheet ? migrateSheet(cur.sheet) : null, inv = sh?.inv || [];
    if (!inv.length) html += note(EMPTY.pack);
    for (const i of inv){
      const info = itemInfo(i), kind = info?.kind || '';
      const worn = kind === 'weapon' ? 'In hand' : kind === 'armor' || kind === 'shield' ? 'Worn' : kind ? kind[0].toUpperCase() + kind.slice(1) : '';
      html += addRow({ label:`${i.n}${i.qty > 1 ? ` ×${i.qty}` : ''}`, sub:i.equipped ? worn : (kind ? kind[0].toUpperCase() + kind.slice(1) : ''), mark:i.equipped ? '✓' : '' });
    }
    if (sh?.coins){ const parts = ['pp', 'gp', 'ep', 'sp', 'cp'].filter(k => sh.coins[k] > 0).map(k => `${sh.coins[k]} ${k}`);
      if (parts.length) html += `<div class="pk-coins">🪙 ${esc(parts.join(' · '))}</div>`; }
  } else {   // Notes
    const notes = cur.extras.notes || [], letters = cur.extras.letters || [];
    if (notes.length){ html += head('Notes for you');
      for (const n of notes){ html += addRow({ label:n.text, wrap:true, cls:n.strahd ? 'pk-strahd' : '' }); } }
    if (letters.length){ html += head('Letters');
      for (const l of letters){
        const title = l.title || (l.from ? `From ${l.from}` : 'A letter');
        const sub = l.at ? new Date(l.at).toLocaleDateString() : '';
        html += addRow({ label:title, sub, open:() => ({ title, sub:l.from ? `From ${l.from}` : '', html:`<p class="pk-text">${esc(l.body || '')}</p>${l.sig ? `<p class="pk-meta" style="text-align:right">— ${esc(l.sig)}</p>` : ''}` }) });
      } }
    if (!notes.length && !letters.length) html += note(EMPTY.notes);
  }
  if (!rows.length && !html) html = note(EMPTY[PAGES[idx].k]);
  return { html, rows };
}
function attackDetail(a){
  const range = a.rng ? `Reach ${a.rng[0]} ft.${a.rng[1] > a.rng[0] ? ` (long ${a.rng[1]} ft.)` : ''}` : a.reach ? `Reach ${a.reach * 5} ft.` : a.m ? 'Melee' : '';
  const flavour = a.f ? a.f.replaceAll('{A}', cur.token.name).replaceAll('{T}', 'the target') : '';
  return { title:a.n, sub:`${sgn(a.b)} to hit · ${a.d}${a.t ? ` ${a.t}` : ''}`,
    html:`${flavour ? `<p class="pk-text">${esc(flavour)}</p>` : ''}${range ? `<p class="pk-meta">${esc(range)}</p>` : ''}` };
}
function spellDetail(c){
  const s = SP(c.n);
  if (!s) return { title:c.n, sub:'', html:'<p class="pk-text">The words for this one aren\'t on this phone.</p>' };
  const lvl = s.l === 0 ? 'Cantrip' : `Level ${s.l}`;
  return { title:s.n, sub:`${lvl}${s.school ? ` · ${s.school}` : ''}${s.time ? ` · ${s.time}` : ''}`,
    html:`<p class="pk-meta">${esc([s.range, s.comp, s.dur].filter(Boolean).join(' · '))}</p><p class="pk-text">${esc(s.text || '')}</p>` };
}

/* ---------- showing it ---------- */
function render(dir = 0){
  if (!el || !cur) return;
  titleEl.textContent = cur.detail ? cur.detail.title : PAGES[cur.page].label;
  dotsEl.innerHTML = PAGES.map((_, i) => `<span class="${i === cur.page ? 'on' : ''}"></span>`).join('');
  if (cur.detail){
    cur.rows = [];
    bodyEl.innerHTML = `<div class="pk-detail-t">${esc(cur.detail.title)}</div>${cur.detail.sub ? `<div class="pk-meta">${esc(cur.detail.sub)}</div>` : ''}${cur.detail.html}`;
    bodyEl.scrollTop = 0;
  } else {
    const built = buildPage(cur.page);
    cur.rows = built.rows;
    if (cur.hi >= cur.rows.length) cur.hi = 0;
    bodyEl.innerHTML = built.html;
    bodyEl.scrollTop = 0;
    paintHi();
  }
  footEl.textContent = cur.detail ? 'B — back to the page (or tap here)' : 'L · R turn the page · A opens · B closes (or tap here)';
  if (dir){ bodyEl.classList.remove('pk-turn', 'pk-turn-b'); void bodyEl.offsetWidth; bodyEl.classList.add(dir > 0 ? 'pk-turn' : 'pk-turn-b'); }
}
function paintHi(){
  if (!el || !cur) return;
  el.querySelectorAll('.pk-row').forEach(n => n.classList.toggle('on', +n.dataset.i === cur.hi));
  el.querySelector(`[data-i="${cur.hi}"]`)?.scrollIntoView({ block:'nearest' });
}
function turn(dir){
  cur.detail = null;
  cur.page = (cur.page + dir + PAGES.length) % PAGES.length;
  cur.hi = cur.hiByPage[cur.page] || 0;
  render(dir);
}
function stepHi(d){
  if (cur.detail){ bodyEl.scrollBy({ top:d * 48 }); return; }
  const n = cur.rows.length; if (!n) return;
  cur.hi = (cur.hi + d + n) % n;
  cur.hiByPage[cur.page] = cur.hi;
  paintHi();
}
function onClick(e){
  const nav = e.target.closest('[data-pk]');
  // (touch: the ✕ closes it; the line at the foot does what B would)
  if (nav?.dataset.pk === 'close'){ closePocketSheet(); return; }
  if (nav?.dataset.pk === 'back'){ if (cur?.detail){ cur.detail = null; render(); } else closePocketSheet(); return; }
  if (nav){ turn(nav.dataset.pk === 'next' ? 1 : -1); return; }
  const row = e.target.closest('[data-i]');
  if (!row || !cur) return;
  cur.hi = +row.dataset.i; cur.hiByPage[cur.page] = cur.hi; paintHi();
  const r = cur.rows[cur.hi];
  if (r?.open) openDetail(r.open());
}
function openDetail(d){ if (!d) return; cur.detail = d; render(); }

export function openPocketSheet({ token, sheet = null, extras = {}, onClose } = {}){
  if (!token) return null;
  if (cur) closePocketSheet();
  cur = { token, sheet, extras, onClose:typeof onClose === 'function' ? onClose : null, page:0, hi:0, hiByPage:[0, 0, 0, 0, 0], detail:null, rows:[] };
  st = undefined;
  ensureStyle();
  el = document.createElement('div');
  el.id = 'pocketSheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', "Your hero's sheet");
  el.innerHTML = `<div class="pk-head"><button class="pk-arrow" data-pk="prev" aria-label="Previous page">◀</button><div class="pk-title"></div><button class="pk-arrow" data-pk="next" aria-label="Next page">▶</button><button class="pk-arrow pk-x" data-pk="close" aria-label="Close the sheet">✕</button></div>
    <div class="pk-dots" aria-hidden="true"></div><div class="pk-body" tabindex="-1"></div><button class="pk-foot" data-pk="back"></button>`;
  el.addEventListener('click', onClick);
  document.body.appendChild(el);
  titleEl = el.querySelector('.pk-title'); dotsEl = el.querySelector('.pk-dots');
  bodyEl = el.querySelector('.pk-body'); footEl = el.querySelector('.pk-foot');
  place();
  addEventListener('resize', place);
  render();
  return el;
}
export function closePocketSheet(){
  if (!cur) return;
  const cb = cur.onClose; cur = null; st = undefined;
  if (el){ el.remove(); el = null; titleEl = dotsEl = bodyEl = footEl = null; }
  removeEventListener('resize', place);
  cb?.();
}
export const pocketOpen = () => !!cur;
export function pocketPress(name){
  if (!cur) return false;
  switch (name){
    case 'lb': case 'left': turn(-1); return true;
    case 'rb': case 'right': turn(1); return true;
    case 'up': stepHi(-1); return true;
    case 'down': stepHi(1); return true;
    case 'a': { if (cur.detail) return true; const r = cur.rows[cur.hi]; if (r?.open) openDetail(r.open()); return true; }
    case 'b': { if (cur.detail){ cur.detail = null; render(); return true; } closePocketSheet(); return true; }
    case 'back': case 'start': closePocketSheet(); return true;
    default: return false;
  }
}
