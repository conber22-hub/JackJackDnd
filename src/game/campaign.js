/* CAMPAIGN — running the Flood Edition sessions: building their dungeons, placing their encounters,
   reading aloud to the table, ticking clocks and rolling the night. */
import { state, ui, makeMonster, log, tokenAt } from '../engine/state.js';
import { randomRoomTile, freeTilesNear, reachSight, passMove } from '../engine/grid.js';
import { BEST } from '../data/bestiary.js';
import { CAMPAIGN, SESSIONS, CLOCKS, NIGHT } from '../data/campaign.js';
import { TEMPLATES } from '../data/themes.js';
import { rollDice, pick, clamp } from '../util/core.js';
import { syncTokens } from '../render/minis.js';
import { showCard, toast, sendWhisper } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { addToInit, riseFrom } from './combat.js';
import { setDread, goFloor } from './actions.js';
import { newDelve } from './build.js';
import { changed } from './session.js';

export const sessionById = n => SESSIONS.find(s => s.n === +n);
export const camp = () => state.campaign;

export function buildSessionDelve(n, k){
  const s = sessionById(n), d = s?.scenes[k]?.delve; if (!d) return;
  const tpl = TEMPLATES.find(t => t.id === d.template);
  newDelve({ name:`${s.title}`, seed:`flood-s${n}-${d.template}`, floors:d.floors || tpl.floors.length, size:40, template:d.template }, true);
  camp().session = +n;
  log(`Session ${n}: built ${tpl?.name || d.template}.`);
  toast(`${tpl?.name || d.template} built — ${d.note || ''}`);
}

// Somewhere 4–9 squares from a random party member on this floor, else any room.
function anchorNearParty(L){
  const party = state.tokens.filter(t => t.floor === L && t.kind !== 'monster' && !t.dead && !t.flags.gone);
  if (party.length){
    const p = pick(party), f = state.floors[L], { dist } = reachSight(f, p.x, p.y, 9, passMove);
    const ring = [...dist.entries()].filter(([i, dd]) => dd >= 4 && !tokenAt(L, i % f.W, (i / f.W) | 0)).map(([i]) => ({ x:i % f.W, y:(i / f.W) | 0 }));
    if (ring.length) return pick(ring);
  }
  return randomRoomTile(L);
}
export function placeSessionEncounter(n, k){
  const s = sessionById(n), enc = s?.scenes[k]?.enc; if (!enc) return;
  const L = ui.floor;
  const at = enc.where === 'party' ? anchorNearParty(L) : enc.where === 'nest' ? (randomRoomTile(L, Math.random, r => r.type === 'nest' || r.type === 'lair') || randomRoomTile(L)) : randomRoomTile(L);
  if (!at){ toast('No room on this floor to put them.'); return; }
  const placed = [];
  for (const [bid, cnt] of enc.group){
    if (!BEST[bid]){ toast(`Unknown creature "${bid}"`); continue; }
    const n2 = typeof cnt === 'number' ? cnt : rollDice(cnt).total;
    for (const spot of freeTilesNear(L, at.x, at.y, n2, true)){
      const m = makeMonster(bid, L, spot.x, spot.y); state.tokens.push(m); placed.push(m);
      if (state.combat.active && state.combat.floor === L) addToInit(m);
    }
  }
  syncTokens(); placed.forEach(riseFrom);
  log(`${enc.label}: ${placed.length} placed on ${state.floors[L].name}.`);
  toast(`${enc.label} — ${placed.length} on the map`);
  changed();
}
export function readAloud(title, text){ showCard({ kind:'', title, flair:text }); }
export function tickClock(id, d){
  const c = CLOCKS.find(c => c.id === id); if (!c) return;
  const C = camp(), before = C.clocks[id] || 0;
  C.clocks[id] = clamp(before + d, 0, c.max);
  if (C.clocks[id] === c.max && before < c.max){ showCard({ kind:'crit', title:`${c.label} — full`, flair:c.full }, false); log(`⏱ ${c.label} is full.`); }
  // the Bloom tide offends him: each quarter filled raises his Gaze
  if (id === 'bloom' && d > 0 && Math.floor(C.clocks[id] / 2) > Math.floor(before / 2)) setDread(state.dread + 1);
  changed();
}
export function applyTicks(n){
  const s = sessionById(n); if (!s) return;
  for (const [id, d] of Object.entries(s.tick || {})) tickClock(id, d);
  toast('Suggested clock ticks applied.');
}
export function rollNight(kind){
  const C = camp(), list = kind === 'counsel' ? NIGHT.counsel : NIGHT[kind]; if (!list) return;
  const txt = pick(list);
  if (kind === 'counsel') C.counsel = txt; else C.lastNight = `${kind[0].toUpperCase() + kind.slice(1)}: ${txt}`;
  changed(); renderPanel();
}
export function shareNight(){ const C = camp(); if (!C.lastNight) return; if (/^Omen/.test(C.lastNight)) sendWhisper(C.lastNight.replace(/^Omen:\s*/, '')); else showCard({ kind:'', title:'The valley', flair:C.lastNight.replace(/^\w+:\s*/, '') }); }
export function setSessionGaze(n){ const s = sessionById(n); if (s) setDread(s.gaze); }
export function markBeat(n, key, on){ const C = camp(); (C.done[n] ||= {})[key] = on; changed(); }

/* ---------- a printable session guide ---------- */
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
export function sessionHTML(s){
  const enc = e => e ? `<p class="enc">⚔ <b>${esc(e.label)}:</b> ${e.group.map(([b, n]) => `${n} × ${esc(BEST[b]?.name || b)} (CR ${esc(BEST[b]?.cr || '?')})`).join(', ')}</p>` : '';
  const del = d => d ? `<p class="enc">▦ <b>Dungeon:</b> ${esc((TEMPLATES.find(t => t.id === d.template) || {}).name || d.template)} — ${esc(d.note || '')}</p>` : '';
  return `<section><h2>Session ${s.n} · ${esc(s.title)}</h2>
    <p class="meta">Level ${esc(s.level)} · start at Gaze ${s.gaze} · ${esc(s.length)}</p>
    <p><b>Hook.</b> ${esc(s.hook)}</p><p>${esc(s.premise)}</p>
    <p><b>From your book.</b> ${esc(s.book)}</p><p><b>Flood Edition.</b> ${esc(s.flood)}</p>
    <blockquote>${esc(s.open)}</blockquote>
    ${s.scenes.map(sc => `<h3>${esc(sc.t)}</h3><ul>${sc.beats.map(b => `<li>${esc(b)}</li>`).join('')}</ul>${del(sc.delve)}${enc(sc.enc)}`).join('')}
    ${s.loot?.length ? `<p><b>Loot.</b> ${s.loot.map(esc).join(' · ')}</p>` : ''}
    <p><b>Clocks.</b> ${Object.entries(s.tick || {}).map(([k, v]) => `${esc(CLOCKS.find(c => c.id === k)?.label || k)} ${v > 0 ? '+' : ''}${v}`).join(' · ') || '—'}</p>
    <p><b>End on.</b> ${esc(s.ending)}</p><p><b>Level.</b> ${esc(s.levelUp)}</p></section>`;
}
export function printSessions(list = SESSIONS){
  const w = window.open('', '_blank'); if (!w){ toast('Allow pop-ups to print the guide.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(CAMPAIGN.name)}</title><style>
    body{font:15px/1.5 Georgia,serif;color:#1a1410;max-width:760px;margin:24px auto;padding:0 16px}
    h1{letter-spacing:.12em;text-transform:uppercase} h2{border-bottom:2px solid #6b3a2c;padding-bottom:4px;margin-top:36px;page-break-before:always}
    h2:first-of-type{page-break-before:auto} blockquote{font-style:italic;border-left:4px solid #b3303a;margin:12px 0;padding:6px 14px;background:#f6efe6}
    .meta{color:#6a5a4a;font-style:italic} .enc{background:#eef3e6;border-left:4px solid #56702a;padding:4px 10px} li{margin:3px 0}
  </style></head><body><h1>${esc(CAMPAIGN.name)}</h1><p><i>${esc(CAMPAIGN.tagline)}</i></p>${list.map(sessionHTML).join('')}</body></html>`);
  w.document.close(); setTimeout(() => w.print(), 400);
}
export { SESSIONS, CAMPAIGN };
