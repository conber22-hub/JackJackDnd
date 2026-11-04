/* 🏰 THE HOLDING BUILDER — in the Build tab: found a place of the party's own on this map, then pick a module and
   tap the map where it goes (green where it can, red where it can't and why; R or ⟳ turns it). Projects, the
   crew (the party, hired folk), the stores, what the place gives (beds, defence, a ward, workshops), growing it into
   the next kind, and the Count's raids. game/holdings.js does the work. */
import { state, ui, tokById } from '../engine/state.js';
import { esc, $ } from '../util/core.js';
import { KINDS, MODULES, KIND_NAMES, holdingHere, holdingById, found, moveBounds, abandon, check, footprint, place, repair, cancel, workDays, hire,
  dismiss, adjustStore, growTo, meetRaid, defendersAt, stats, hands } from '../game/holdings.js';
import { MODULE_BY_ID as MOD } from '../data/holdings.js';
import { court } from '../game/court.js';
import { showFootprint } from '../render/effects.js';
import { toast } from './hud.js';
import { setMode } from './input.js';
import { renderPanel } from './panels.js';
import { roleName } from '../game/folk.js';
import { sendEstate } from './estate.js';

const GROUPS = { 'Walls and ways':['palisade', 'stone-wall', 'gate', 'watchtower', 'ditch', 'salt-line'], 'Shelter':['bedroll-ring', 'tent', 'cottage', 'hall', 'bunkhouse', 'stable', 'wagon-shed', 'storehouse'],
  'Inside a building':['kitchen', 'cellar', 'forge', 'carpenter', 'alchemist', 'library'], 'Grounds':['shrine', 'garden', 'well'] };
const GIVE_NAMES = { defence:'defence', ward:'ward', beds:'beds', storage:'lb stored', comfort:'comfort', income:'gp a week', upkeep:'gp upkeep' };
const gives = m => Object.entries(m.gives).filter(([k, v]) => GIVE_NAMES[k] && v).map(([k, v]) => `${k === 'upkeep' ? '−' : '+'}${v} ${GIVE_NAMES[k]}`).concat(m.gives.workshops ? [`a ${m.gives.workshops.join(', ')}`] : [], m.gives.salt ? ['the Bloom won\'t cross'] : []).join(', ');

/* ---------- the Build tab's section ---------- */
export function holdingsHTML(){
  const h = holdingHere();
  if (!h) return `<details class="card" ${ui.holdOpen ? 'open' : ''} data-holdopen="1"><summary>🏰 <b>A place of their own</b> <span class="muted">· a camp, a house, a fort, a keep</span></summary>
    <div class="muted">Found one here, around the party: then build it up piece by piece. The Count will notice.</div>
    <div class="row"><input class="txt" id="holdName" placeholder="Its name (The Lantern House…)" style="flex:1"></div>
    <div class="row">${['camp', 'house', 'outpost'].map(k => `<button class="btn small" data-hd="found" data-k="${k}">${KIND_NAMES[k]}</button>`).join('')}</div>
    <div class="muted">A camp grows into a house or an outpost, a house into a homestead, an outpost into a fort, a fort into a keep.</div></details>`;
  const s = stats(h), k = KINDS[h.kind], sel = ui.holdModule && MOD[ui.holdModule];
  const tall = n => n === 1 ? '' : 's';
  const grows = k.next.map(n => { const missing = KINDS[n].needs.filter(id => !h.modules.some(p => p.module === id && p.built && p.hp > 0)); return `<button class="btn small" data-hd="grow" data-k="${n}" ${missing.length ? `disabled title="Needs: ${missing.map(id => MOD[id].n).join(', ')}"` : ''}>⬆ ${KIND_NAMES[n]}${missing.length ? ` <span class="muted">(needs ${missing.map(id => MOD[id].n.toLowerCase()).join(', ')})</span>` : ''}</button>`; }).join('');
  const raid = h.raid && court()?.members.find(m => m.id === h.raid.member);
  const folkHere = (state.floors[ui.floor]?.folk || []).filter(p => !['dog', 'child', 'lostChild', 'captive'].includes(p.role) && !(h.hired || []).some(w => w.id === p.id));
  return `<details class="card hold" open data-holdopen="1"><summary>${KIND_NAMES[h.kind]} <b>${esc(h.name)}</b> <span class="muted">· ${h.bounds.w}×${h.bounds.h} squares</span></summary>
    ${raid ? `<div class="card" style="border-color:var(--blood)"><b>⚔ ${esc(raid.name)} comes for ${esc(h.name)}</b> <span class="muted">(strength ${h.raid.power})</span>
      <div class="row"><button class="btn small primary" data-hd="raid" data-k="meet">Meet it (${defendersAt(h)} defender${defendersAt(h) === 1 ? '' : 's'} here)</button><button class="btn small" data-hd="raid" data-k="fall">Nobody's there</button></div></div>` : ''}
    <div class="stat">🛡 Defence ${s.defence} · ✦ Ward ${s.ward} · 🛏 ${s.beds} bed${tall(s.beds)} · 📦 ${s.storage} lb · ☺ Comfort ${s.comfort} · ${s.income} gp in, ${s.upkeep} gp upkeep a week${s.workshops.length ? ` · 🔨 ${s.workshops.join(', ')}` : ''}</div>
    <h4>Build</h4>
    ${Object.entries(GROUPS).map(([g, ids]) => `<div class="muted" style="margin-top:4px">${g}</div><div class="propgrid">${ids.map(id => MOD[id]).filter(m => m && m.kinds.includes(h.kind)).map(m => `<span class="chip ${ui.holdModule === m.id ? 'on' : ''}" data-hd="pick" data-k="${m.id}" title="${esc(m.flavour)} ${esc(gives(m))}">${esc(m.n)}<small> ${m.footprint.w}×${m.footprint.h}</small></span>`).join('')}</div>`).join('')}
    ${sel ? `<div class="card"><b>${esc(sel.n)}</b> · ${sel.cost} gp · ${Object.entries(sel.materials).map(([k2, n]) => `${n} ${k2}`).join(', ')} · ${sel.days} day${tall(sel.days)} with ${sel.labour} worker${tall(sel.labour)} · <span class="muted">${esc(gives(sel))}</span>
      <div class="muted">${sel.on === 'wall' ? 'Goes on the edge of the holding (the gold line).' : sel.on === 'inside' ? 'Goes inside a finished building (a square in from its walls).' : 'Goes anywhere on open ground inside the gold line.'}${sel.needs.length ? ` Needs a finished ${sel.needs.map(id => MOD[id].n.toLowerCase()).join(', ')}.` : ''}</div>
      <div class="row"><button class="btn small ${ui.mode === 'holding' ? 'on' : ''} primary" data-hd="placing">${ui.mode === 'holding' ? '✓ Tap the map to place it' : '📍 Place it on the map'}</button><button class="btn small" data-hd="turn">⟳ Turn (R)</button></div></div>` : '<div class="muted">Pick a piece, then tap the map where it goes.</div>'}
    <h4>Work</h4>
    ${h.projects.length ? h.projects.map(p => { const m = h.modules.find(x => x.id === p.target), md = MOD[p.module]; const total = md.days * md.labour * (p.repair ? 1 : 1); return `<div class="packRow"><span class="packN">${p.repair ? '🔧' : '🪵'} ${esc(md.n)} <span class="muted">${Math.ceil(p.remaining)} worker-day${tall(Math.ceil(p.remaining))} left${p.paid ? '' : ` · ${p.cost} gp due from the stores`}</span><div class="wsBar"><i style="width:${Math.round(100 * (1 - p.remaining / Math.max(1, total)))}%"></i></div></span>
      <span class="packB">${p.repair ? '' : `<button class="btn small" data-hd="cancel" data-id="${m?.id}" title="Take it down (materials back)">✕</button>`}</span></div>`; }).join('')
      + `<div class="row"><button class="btn small primary" data-hd="work" data-k="1">⏳ A day's work</button><button class="btn small" data-hd="work" data-k="7">A week</button><label class="muted"><input type="checkbox" data-hdf="partyWorks" ${h.partyWorks ? 'checked' : ''}> the party works when here</label></div>
      <div class="muted">The work also goes on by itself as days pass (travel, a long rest): the hired hands keep at it.</div>` : '<div class="muted">Nothing being built.</div>'}
    ${h.modules.some(p => p.built && p.hp < MOD[p.module].hp) ? `<div class="muted">Damaged: ${h.modules.filter(p => p.built && p.hp < MOD[p.module].hp && !h.projects.some(x => x.target === p.id)).map(p => `<button class="btn small" data-hd="repair" data-id="${p.id}">🔧 ${esc(MOD[p.module].n)} (${p.hp}/${MOD[p.module].hp})</button>`).join(' ')}</div>` : ''}
    <h4>Crew</h4>
    ${hands(h).map(w => `<div class="packRow"><span class="packN">${w.devoted ? '⭐ ' : ''}${w.exposed ? '👁 ' : ''}${esc(w.name)} <span class="muted">${esc(roleName(w))} · ${esc(w.skill)} · ${w.wage} gp a day</span>${w.exposed ? `<div class="muted" style="color:var(--blood)">The Count's eyes: ${esc(w.exposed.tell)}</div>` : ''}${w.turned ? '<div class="muted">Turned: once his eyes, theirs now.</div>' : ''}</span>
      <span class="muted" title="Loyalty (0–20): 18 or more is devoted">♥ ${w.loyalty}</span><span class="packB"><button class="btn small" data-hd="dismiss" data-id="${esc(w.id)}" title="Let them go">✕</button></span></div>`).join('') || '<div class="muted">No hired hands.</div>'}
    ${(h.hired || []).length ? `<div class="muted">Wages come from the stores each day; the unpaid lose heart and may leave. Guards defend in a raid, the devoted twice over. ${defendersAt(h)} defender${defendersAt(h) === 1 ? '' : 's'} here now.</div>` : ''}
    ${folkHere.length ? `<div class="row"><select class="txt" style="width:auto" id="holdHire">${folkHere.map(p => `<option value="${esc(p.id)}">${esc(p.name)} (${esc(roleName(p))})</option>`).join('')}</select><button class="btn small" data-hd="hire">Hire</button></div>` : '<div class="muted">The folk of this map can be hired when there are any (a village, a camp).</div>'}
    <h4>Stores</h4>
    <div class="row">${['timber', 'stone', 'salt', 'gp'].map(k2 => `<span class="wsMat">${k2}: <b>${h.stores[k2] || 0}</b> <button class="btn small" data-hd="store" data-k="${k2}" data-by="${k2 === 'gp' ? -10 : -5}">−</button><button class="btn small" data-hd="store" data-k="${k2}" data-by="${k2 === 'gp' ? 10 : 5}">+</button></span>`).join('')}</div>
    <div class="muted">Timber is cut or bought, stone quarried or carted in, salt bought dear; the stores' gold pays for building and wages (the party puts it in).</div>
    ${grows ? `<h4>Grow</h4><div class="row">${grows}</div>` : ''}
    ${h.log?.length ? `<h4>Lately</h4><div class="muted">${h.log.slice(-5).map(esc).join('<br>')}</div>` : ''}
    <div class="row"><button class="btn small" data-act="downtime" title="Recuperate, keep watch, research in the library, craft">🌙 Days off here</button><button class="btn small" data-hd="estate" title="Send the players 🏰 Our place: what's built, the crew, the wagons, their own work (never the spies, raids or your notes)">📤 Show the players</button></div>
    <div class="row">${h.modules.length ? '' : '<button class="btn small" data-hd="bounds" title="Then tap the map: the holding centres there">⌖ Move its bounds</button>'}<button class="btn small danger" data-hd="abandon">Abandon it</button></div>
  </details>`;
}

/* ---------- placing on the map (ui/input.js passes taps and hovers in the 'holding' mode) ---------- */
let rot = 0;
export function holdHover(tile){
  const h = holdingHere(); if (!h){ showFootprint(ui.floor, []); return; }
  if (ui.modeData?.bounds){ showFootprint(ui.floor, [], true, tile ? boundsPreview(h, tile) : h.bounds); return; }
  if (!tile || !ui.holdModule){ showFootprint(ui.floor, [], true, h.bounds); return; }
  const c = check(h.id, ui.holdModule, tile.x, tile.y, rot);
  showFootprint(ui.floor, footprint(ui.holdModule, tile.x, tile.y, rot), c.ok, h.bounds);
  const tip = $('#modeText'); if (tip) tip.textContent = c.ok ? `${MOD[ui.holdModule].n}: tap to place · R turns it · Esc stops` : c.why;
}
const boundsPreview = (h, t) => { const k = KINDS[h.kind], f = state.floors[ui.floor]; return { x:Math.max(1, Math.min(f.W - 1 - h.bounds.w, t.x - (h.bounds.w >> 1))), y:Math.max(1, Math.min(f.H - 1 - h.bounds.h, t.y - (h.bounds.h >> 1))), w:h.bounds.w, h:h.bounds.h }; };
export function holdTap(tile){
  const h = holdingHere(); if (!h || !tile) return;
  if (ui.modeData?.bounds){ moveBounds(h.id, ui.floor, tile.x, tile.y); stopPlacing(); return; }
  if (!ui.holdModule) return;
  if (place(h.id, ui.holdModule, tile.x, tile.y, rot)) renderPanel();
  holdHover(tile);
}
export function holdTurn(){ rot = (rot + 90) % 360; toast(`Turned: ${rot}°`); }
function stopPlacing(){ setMode('select'); showFootprint(ui.floor, []); renderPanel(); }
export function holdModeOff(){ showFootprint(ui.floor, []); }

/* ---------- its buttons ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest?.('[data-hd]'); if (!b || !state) return;
  const a = b.dataset.hd, k = b.dataset.k, h = holdingHere();
  if (a === 'found'){ const n = $('#holdName')?.value || ''; if (found(k, n)){ ui.holdModule = null; setMode('holding', null, 'Pick a piece in the Build tab, then tap the map'); holdHover(null); } }
  else if (!h) return;
  else if (a === 'pick'){ ui.holdModule = k; setMode('holding', null, `${MOD[k].n}: tap the map where it goes · R turns it · Esc stops`); }
  else if (a === 'placing'){ if (ui.mode === 'holding') stopPlacing(); else setMode('holding'); }
  else if (a === 'turn') holdTurn();
  else if (a === 'work') workDays(h.id, +k);
  else if (a === 'cancel') cancel(h.id, b.dataset.id);
  else if (a === 'repair') repair(h.id, b.dataset.id);
  else if (a === 'dismiss') dismiss(h.id, b.dataset.id);
  else if (a === 'hire'){ const id = $('#holdHire')?.value, p = state.floors[ui.floor]?.folk?.find(x => x.id === id); hire(h.id, p); }
  else if (a === 'store') adjustStore(h.id, k, +b.dataset.by);
  else if (a === 'grow') growTo(h.id, k);
  else if (a === 'raid') meetRaid(h.id, k === 'meet' ? defendersAt(h) : 0);
  else if (a === 'estate') sendEstate();   // 🏰 Our place, through the Curtain (ui/estate.js)
  else if (a === 'bounds') setMode('holding', { bounds:true }, 'Tap where the holding should centre');
  else if (a === 'abandon'){ if (confirm(`Abandon ${h.name}? What was built comes down.`)) abandon(h.id); }
  renderPanel(); if (ui.mode === 'holding') holdHover(null);
});
document.addEventListener('change', e => { const el = e.target.closest?.('[data-hdf]'); if (!el || !state) return; const h = holdingHere(); if (h){ h[el.dataset.hdf] = el.checked; renderPanel(); } });
document.addEventListener('toggle', e => { if (e.target?.dataset?.holdopen) ui.holdOpen = e.target.open; }, true);
addEventListener('keydown', e => { if (ui.mode === 'holding' && (e.key === 'r' || e.key === 'R') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)){ holdTurn(); holdHover(null); } });
