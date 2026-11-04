/* "Our place" — the party's own home, on the players' phones.
   The DM builds a camp, house or fort and hires hands (state.campaign, which
   never reaches the players); this module gives them a view of what's theirs,
   without ever showing what the DM keeps hidden. The summary is built by
   copying the fields a player may see, never by copying the holding and
   deleting the rest — so a spy, a raid, a watch, the log, the stores and
   another hero's jobs cannot leak through a field nobody remembered to cut.
   Sending goes through the Curtain like every card (see the PR for the
   one-player hook); the table's message handler is a hook for Claude: it
   calls net.onEstate(estate), which this module sets when it starts. */
import { state, ui, tokById, log } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { net } from '../net/table.js';
import { toPlayers } from '../game/outbox.js';
import { toast } from './hud.js';
import { registerCommands } from './palette.js';
import { stats } from '../engine/holdings.js';
import { MODULE_BY_ID as MOD } from '../data/holdings.js';
import { KIND_NAMES } from '../game/holdings.js';
import { roleName } from '../game/folk.js';

/* The summary: a small, safe object, built from the campaign. Pure — it
   reads the campaign it is given and returns new objects, changing nothing,
   so the spec can test it directly with a holding full of secrets. */
const pct = (done, total) => Math.max(0, Math.min(100, Math.round(100 * done / Math.max(1, total))));
export function estateSummary(campaign, { charId } = {}){
  const h = (campaign?.holdings || [])[0];
  if (!h) return null;
  let s = { beds:0, comfort:0, defence:0 };
  try { const st = stats(h); s = { beds:st.beds, comfort:st.comfort, defence:st.defence }; } catch { /* a stray module id: the numbers drop out, the rest stands */ }
  return {
    holding:{ name:h.name, kind:h.kind, beds:s.beds, comfort:s.comfort, defence:s.defence },
    modules:(h.modules || []).map(m => ({ name:MOD[m.module]?.n || m.module, built:!!m.built })),
    building:(h.projects || []).map(p => { const md = MOD[p.module]; return { name:md?.n || p.module, pct:pct((md?.days || 1) * (md?.labour || 1) - (p.remaining || 0), (md?.days || 1) * (md?.labour || 1)) }; }),
    crew:(h.hired || []).map(w => ({ name:w.name, role:roleName(w), devoted:!!w.devoted })),
    wagons:(campaign?.transport || []).map(w => ({ name:w.n, capacity:w.capacity, speed:w.speed, seats:w.seats, bunks:w.bunks || 0, fittings:(w.fittings || []).map(f => String(f).replaceAll('-', ' ')) })),
    jobs:charId ? (campaign?.jobs || []).filter(j => j.for === charId).map(j => ({ name:j.n, pct:pct(j.job?.progress || 0, j.job?.hours || 1) })) : [],
    gp:h.stores?.gp || 0,   // the party's own coffers; timber, stone and salt stay with the DM
  };
}

/* Sending, DM only: the party's version first (no jobs — it is the TV's),
   then one summary per seated player, each with their own hero's jobs.
   The party version goes first so that, the list keeping the last one it
   sees, each player ends on their own. A summary for one hero carries
   `for` (that hero's seat); the receiver ignores any summary addressed to
   another seat, so nothing leaks even before the routing hook lands. */
export function sendEstate(){
  if (ui.role !== 'dm') return;
  const party = estateSummary(state.campaign, {});
  if (!party){ toast('The party has no holding yet.'); return; }
  toPlayers({ t:'estate', estate:party, text:`🏰 Our place: ${party.holding.name}` }, 'world');
  const seen = new Set();
  for (const tokId of Object.values(state.seats || {})){
    if (!tokId || seen.has(tokId)) continue; seen.add(tokId);
    const tok = tokById(tokId); if (!tok) continue;
    const mine = estateSummary(state.campaign, { charId:tok.charId });
    if (!mine) continue;
    mine.for = tokId;
    toPlayers({ t:'estate', estate:mine, text:`🏰 Our place for ${tok.name || 'a hero'}` }, 'world');
  }
  log('🏰 Our place shown to the players.', true);
}

/* Receiving: the handler Claude adds calls this with the estate the DM sent. */
export function receiveEstate(e){
  if (!e || !e.holding) return;
  if (ui.role === 'dm' && !ui.screen) return;   // the DM's copy lives in the campaign, not here
  if (e.for && ui.myToken && e.for !== ui.myToken) return;   // another hero's summary: never shown, never kept
  if (ui.screen){ showEstateOverlay(e); return; }   // the TV shows it big, and keeps no list
  saveEstate(e);
  toast('🏰 Our place has been updated.');
  renderEstateSection();
}

const estateKey = () => `dreaddelve.estate.${net.join?.code || net.code || 'local'}.v1`;
const loadEstate = () => { try { return JSON.parse(localStorage.getItem(estateKey())) || null; } catch { return null; } };
const saveEstate = e => { try { localStorage.setItem(estateKey(), JSON.stringify(e)); } catch { /* a full store: the section still shows this one */ } };

/* The cards: the holding, what stands and what's being built, the crew, the
   wagons, and (when this summary has them) the hero's own Workshop jobs. */
function estateCards(e, tv){
  const h = e.holding;
  const bar = p => `<div class="wsBar"><i style="width:${p}%"></i></div>`;
  return `<div class="estate-card"><b>${esc(h.name)}</b> <span class="muted">${esc(KIND_NAMES[h.kind] || h.kind)}</span>
    <div class="stat">🛡 Defence ${h.defence} · 🛏 ${h.beds} bed${h.beds === 1 ? '' : 's'} · ☺ Comfort ${h.comfort}${e.gp ? ` · 💰 ${e.gp} gp in the stores` : ''}</div></div>
  ${e.modules.length ? `<div class="estate-card"><b>What stands</b>${e.modules.map(m => `<div>${m.built ? '✓' : '○'} ${esc(m.name)}${m.built ? '' : ' <span class="muted">not yet built</span>'}</div>`).join('')}</div>` : ''}
  ${e.building.length ? `<div class="estate-card"><b>Being built</b>${e.building.map(p => `<div>🪵 ${esc(p.name)} <span class="muted">${p.pct}% done</span>${bar(p.pct)}</div>`).join('')}</div>` : ''}
  ${e.crew.length ? `<div class="estate-card"><b>The crew</b>${e.crew.map(w => `<div>${w.devoted ? '⭐ ' : ''}${esc(w.name)} <span class="muted">· ${esc(w.role)}</span></div>`).join('')}</div>` : ''}
  ${e.wagons.length ? `<div class="estate-card"><b>The wagons</b>${e.wagons.map(w => `<div>🛒 ${esc(w.name)} <span class="muted">· carries ${w.capacity} lb · ${w.speed} miles a day · ${w.seats} seat${w.seats === 1 ? '' : 's'}${w.bunks ? `, ${w.bunks} bunk${w.bunks === 1 ? '' : 's'}` : ''}${w.fittings.length ? ` · ${esc(w.fittings.join(', '))}` : ''}</span></div>`).join('')}</div>` : ''}
  ${e.jobs.length ? `<div class="estate-card"><b>Your Workshop jobs</b>${e.jobs.map(j => `<div>🔨 ${esc(j.name)} <span class="muted">${j.pct}% done</span>${bar(j.pct)}</div>`).join('')}</div>` : ''}`;
}

/* The 🏰 section on the player's Your hero tab, beside the 📜 Letters list:
   appended to the panel itself (not the tab body, which the panel renders
   wipe on every redraw), and shown only on the hero tab, so it survives
   redraws without flicker. */
function renderEstateSection(){
  let el = $('#estateSection');
  if (!el){ const p = $('#panel'); if (!p) return; el = document.createElement('div'); el.id = 'estateSection'; p.appendChild(el); }
  const show = !!(state && ui.role === 'player' && ui.tab === 'hero' && !ui.screen);
  el.style.display = show ? '' : 'none';
  if (!show) return;
  const e = loadEstate();
  el.innerHTML = `<h3>🏰 Our place</h3>` + (e ? estateCards(e) : '<div class="muted">No place yet. When the DM shows you the party’s home, it will live here.</div>');
}
let sectionTimer = null;
function watchSection(){
  const run = () => { clearTimeout(sectionTimer); sectionTimer = setTimeout(renderEstateSection, 150); };
  const tb = $('#tabBody'), tabs = $('#tabs');
  if (tb) new MutationObserver(run).observe(tb, { childList:true });
  if (tabs) new MutationObserver(run).observe(tabs, { childList:true });
  renderEstateSection();
}

/* The TV's view: the same cards, big, when an estate arrives. */
function showEstateOverlay(e){
  let ov = $('#estateOverlay');
  if (!ov){ ov = document.createElement('div'); ov.id = 'estateOverlay'; ov.className = 'modal'; document.body.appendChild(ov); }
  ov.innerHTML = `<div style="position:relative;width:min(640px,94vw)"><button class="btn small" data-act="estateClose" style="position:absolute;right:-4px;top:-34px;z-index:2">✕</button><div class="estate-tv">${estateCards(e, true)}</div></div>`;
  ov.classList.remove('hidden');
}
function onEstateClick(ev){
  if (ev.target.closest('[data-act="estateClose"]')) $('#estateOverlay')?.classList.add('hidden');
}

export function ensureEstate(){
  if (!document.getElementById('estateCSS')){
    const st = document.createElement('style'); st.id = 'estateCSS';
    st.textContent = `#estateSection{border-top:1px solid var(--line);padding:12px 0;margin-top:8px}
    .estate-card{background:var(--glass);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:8px}
    .estate-card .stat{margin-top:4px}
    .estate-card .wsBar{margin-top:4px}
    .estate-tv .estate-card{padding:20px 22px;font-size:18px}
    .estate-tv .estate-card .stat{font-size:16px}`;
    document.head.appendChild(st);
  }
  registerCommands([{ id:'estate', n:'Show the players our place', hint:'Send the party a view of their holding, wagons and Workshop jobs', icon:'🏰', role:'dm', run:sendEstate }]);
  net.onEstate = receiveEstate;   // the table's handler calls this when an estate arrives (see the PR)
  document.addEventListener('click', onEstateClick);
  watchSection();
}
