/* 👥 THE MOB — Codex's engine/mobs.js at the DM's hand: thirty zombies in a churchyard, fifty bats out of a tower, a
   village rising with torches, run as one creature instead of thirty turns. The DM raises a mob from any SRD statblock
   (or a rising of the village), sets it on the map in a crowd round a square, and each round: it attacks a hero (only
   the members who can reach do, and no more than fit round them), it takes damage (one blow kills members one by
   one; a fireball hits everyone in the burst) and it checks its morale as it thins. The dead don't break, except to
   Turn Undead. A rising has a leader with a grievance and a demand: talk them down with the folk card.
   Mobs live on the floor (f.mobs), plain JSON, and players never see them, only the crowd of minis on the map. */
import { state, ui, tokById, log } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { makeMob, mobAttack, hitMob, moraleCheck, formation, rising, advanceMob } from '../engine/mobs.js';
import { SRD_MONSTERS } from '../data/srd-monsters.js';
import { changed } from '../game/session.js';
import { passMove } from '../engine/grid.js';
import { toast } from './hud.js';
import { registerCommands } from './palette.js';

const MOBBABLE = SRD_MONSTERS.filter(c => c.attacks?.some(a => Number.isFinite(a.b) && a.d)).sort((a, b) => a.name.localeCompare(b.name));
let sel = null, form = { b:'srd-zombie', n:30 }, lastText = '';

const floorMobs = () => (state.floors[ui.floor].mobs ||= []);
const mobName = m => m.leader ? `${m.leader.name}'s mob` : `${m.n} ${SRD_MONSTERS.find(c => c.id === m.b)?.name || m.b}${m.n === 1 ? '' : 's'}`;
const heroes = () => state.tokens.filter(t => t.kind === 'pc' && t.floor === ui.floor && !t.dead && !t.flags?.gone);

export function openMobs(){ if (ui.role !== 'dm' || !state) return; sel ||= floorMobs()[0]?.id || null; lastText = ''; render(); }
function close(){ $('#mobSheet')?.classList.add('hidden'); }
const setMob = (m) => { const L = floorMobs(), i = L.findIndex(x => x.id === m.id); if (i >= 0) L[i] = m; else L.push(m); sel = m.id; };

// open squares round a point, nearest first: where the crowd stands
function openAround(f, cx, cy, need){
  const out = [], taken = new Set(state.tokens.filter(t => t.floor === ui.floor && !t.dead).map(t => `${t.x},${t.y}`));
  for (let r = 0; r <= 24 && out.length < need * 2; r++)
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++){
      if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== r || x < 0 || y < 0 || x >= f.W || y >= f.H) continue;
      if (passMove(f, y * f.W + x) && !taken.has(`${x},${y}`)) out.push({ x, y });
    }
  return out;
}
function placeOnMap(m){
  const f = state.floors[ui.floor], at = tokById(ui.selected) || heroes()[0] || { x:f.up?.x ?? Math.floor(f.W / 2), y:f.up?.y ?? Math.floor(f.H / 2) };
  const anchor = m.formation[0] || { x:at.x + 4, y:at.y };   // (openAround finds the open squares nearest to it)
  const sq = formation({ ...m, origin:anchor }, openAround(f, anchor.x, anchor.y, m.n));
  return { ...m, origin:anchor, formation:sq };
}

function render(){
  let el = $('#mobSheet');
  if (!el){ el = document.createElement('div'); el.id = 'mobSheet'; el.className = 'modal'; document.body.appendChild(el); el.addEventListener('click', onClick); el.addEventListener('change', onChange); }
  const L = floorMobs(), m = L.find(x => x.id === sel), hs = heroes();
  let h = `<div class="box mb-sheet"><div class="row" style="align-items:center"><h2 style="flex:1;margin:0">👥 The mob</h2><button class="btn small" data-mbx="close">✕</button></div>
    <div class="muted">Many of one kind, fighting as one: no thirty attack rolls, no thirty turns.</div>
    <div class="row"><select class="txt" style="width:auto;max-width:220px" id="mbKind">${MOBBABLE.map(c => `<option value="${c.id}" ${c.id === form.b ? 'selected' : ''}>${esc(c.name)} (CR ${esc(String(c.cr))})</option>`).join('')}</select>
      <input class="txt num" type="number" min="2" max="200" id="mbN" value="${form.n}" style="width:64px"><button class="btn primary" data-mbx="make">Raise the mob</button>
      <button class="btn small" data-mbx="rising" title="The village rises: a leader, a grievance, torches and a demand">🔥 A rising</button></div>`;
  if (L.length) h += `<div class="row">${L.map(x => `<span class="chip ${x.id === sel ? 'on' : ''}" data-mbx="pick" data-id="${x.id}">${esc(mobName(x))}</span>`).join('')}</div>`;
  if (m){
    const live = m.hp.length, fleeing = m.fleeing.length, turned = m.turned.length;
    h += `<div class="card"><div class="hd"><span class="nm">${esc(mobName(m))}</span><span class="stat">AC ${m.ac} · ${live}/${m.initial} standing${fleeing ? ` · ${fleeing} fleeing` : ''}${turned ? ` · ${turned} turned` : ''}</span></div>
      <div class="stat">${esc(m.attack.n || 'Attack')} +${m.attack.b}, ${esc(m.attack.d)} · each has ${m.hp[0] ?? 0} HP${m.hp.some(v => v !== m.hp[0]) ? ' (some hurt)' : ''}${m.undead ? ' · undead: never breaks, but turns' : ''}</div>
      ${m.leader ? `<div class="mb-lead"><b>${esc(m.leader.name)}</b> leads them, ${m.torches} torches among them. <i>“${esc(m.demand)}”</i></div>` : ''}
      <div class="row"><button class="btn small" data-mbx="place" title="Stand them round the selected creature or square, closest first">📍 On the map (${m.formation.length || 'not placed'})</button>${m.formation.length ? `<button class="btn small" data-mbx="unplace">Clear</button>` : ''}</div>
      <h4>It attacks</h4><div class="row">${hs.map(t => `<button class="btn small" data-mbx="attack" data-id="${t.id}">⚔ ${esc(t.name)} (AC ${t.ac})</button>`).join('') || '<span class="muted">No heroes on this floor.</span>'}</div>
      <h4>It's hit</h4><div class="row"><input class="txt num" type="number" min="0" id="mbDmg" placeholder="dmg" style="width:70px"><label class="muted"><input type="checkbox" id="mbArea"> area</label>
        <input class="txt num" type="number" min="1" id="mbCount" placeholder="how many" style="width:84px" title="For an area: how many members are in it (blank: the burst's squares on the map, a 20-ft radius round the selected square)"><button class="btn small" data-mbx="hit">Apply</button></div>
      <h4>Morale</h4><div class="row"><button class="btn small" data-mbx="morale">Check</button><button class="btn small" data-mbx="leader">The leader falls</button>${m.undead ? `<input class="txt num" type="number" min="0" id="mbTurn" placeholder="turned" style="width:74px" title="How many failed their save against Turn Undead"><button class="btn small" data-mbx="turn">✝ Turn Undead</button>` : ''}
        <button class="btn small" data-mbx="round" title="A round passes: the turned shake it off after a minute">⏭ Round</button><button class="btn small danger" data-mbx="drop">Disband</button></div></div>`;
  }
  if (lastText) h += `<div class="ch-events">${esc(lastText)}</div>`;
  el.innerHTML = h + '</div>'; el.classList.remove('hidden');
}
function onChange(e){
  const t = e.target;
  if (t.id === 'mbKind') form.b = t.value;
  if (t.id === 'mbN') form.n = Math.max(2, Math.min(200, Math.round(+t.value || 2)));
}
function burstSquares(r = 4){
  const c = tokById(ui.selected); if (!c) return null; const out = [];
  for (let y = c.y - r; y <= c.y + r; y++) for (let x = c.x - r; x <= c.x + r; x++) if ((x - c.x) ** 2 + (y - c.y) ** 2 <= r * r + r) out.push({ x, y });
  return out;
}
function onClick(e){
  const b = e.target.closest('[data-mbx]'); if (!b) return;
  const k = b.dataset.mbx, L = floorMobs(), m = L.find(x => x.id === sel);
  if (k === 'close') return close();
  if (k === 'pick'){ sel = b.dataset.id; lastText = ''; return render(); }
  if (k === 'make'){
    const c = SRD_MONSTERS.find(x => x.id === form.b); const mob = { ...makeMob(c, form.n, { rng:Math.random }), look:/undead/i.test(c.sizeText || '') || c.tags?.includes('undead') ? 'dead' : /commoner|villager|peasant/i.test(c.name) ? 'rising' : /guard|soldier|veteran/i.test(c.name) ? 'guards' : 'shade' };
    setMob(placeOnMap(mob)); lastText = `${mobName(mob)} gather.`; log(`👥 A mob: ${mobName(mob)}.`, true); changed(); return render();
  }
  if (k === 'rising'){
    const f = state.floors[ui.floor], r = rising({ place:state.meta.name || 'the village', gaze:state.dread || 1, rng:Math.random }), mob = { ...r, look:r.b === 'srd-guard' ? 'guards' : 'rising' };
    setMob(placeOnMap(mob)); lastText = `${mob.leader.name} has the village behind them: ${mob.n} with ${mob.torches} torches. “${mob.demand}” Talk them down, or face them.`;
    log(`🔥 ${f.name || 'The village'} rises: ${mob.leader.name} and ${mob.n} more, demanding: ${mob.demand}`, true); changed(); return render();
  }
  if (!m) return;
  if (k === 'place'){ setMob(placeOnMap({ ...m, formation:[] })); changed(); return render(); }
  if (k === 'unplace'){ setMob({ ...m, formation:[] }); changed(); return render(); }
  if (k === 'attack'){
    const t = tokById(b.dataset.id); if (!t) return;
    const r = mobAttack(m, { ac:t.ac, size:t.size || 1, ...(m.formation.length ? { x:t.x, y:t.y } : {}) }, { rng:Math.random });
    lastText = `On ${t.name}: ${r.text}${r.damage ? ' Apply it from their card.' : ''}`; log(`👥 ${mobName(m)} on ${t.name}: ${r.text}`, true); return render();
  }
  if (k === 'hit'){
    const dmg = Math.max(0, +$('#mbDmg')?.value || 0), area = $('#mbArea')?.checked, count = $('#mbCount')?.value;
    let opts = { area };
    if (area){ if (count) opts.count = +count; else { const sq = burstSquares(); if (!sq || !m.formation.length){ toast('Say how many are in the area, or place the mob and select the burst\'s centre.'); return; } opts.squares = sq; } }
    const r = hitMob(m, dmg, opts); setMob(r.mob);
    lastText = `${r.affected} hit, ${r.killed} fall. ${r.mob.n} left.`;
    const mc = r.killed ? moraleCheck(r.mob, { gaze:state.dread || 1, rng:Math.random }) : null;
    if (mc?.triggered){ setMob(mc.mob); lastText += ` Morale (d20 ${mc.roll} vs DC ${mc.dc}): ${mc.text}`; }
    if (!r.mob.n){ lastText += ' The mob is gone.'; }
    log(`👥 ${mobName(m)}: ${lastText}`, true); changed(); return render();
  }
  if (k === 'morale' || k === 'leader'){
    const r = moraleCheck(m, { leaderDead:k === 'leader', gaze:state.dread || 1, rng:Math.random }); setMob(r.mob);
    lastText = r.roll ? `d20 ${r.roll} vs DC ${r.dc}: ${r.text}${r.flees ? ` (${r.flees} run)` : ''}` : r.text; changed(); return render();
  }
  if (k === 'turn'){
    const n = Math.max(0, Math.round(+$('#mbTurn')?.value || 0)), r = moraleCheck(m, { turned:n, rng:Math.random }); setMob(r.mob);
    lastText = `${r.text}${r.flees ? ` (${r.flees} turned for a minute, until they're hurt)` : ''}`; changed(); return render();
  }
  if (k === 'round'){ setMob(advanceMob(m, 1)); lastText = 'A round passes.'; changed(); return render(); }
  if (k === 'drop'){ state.floors[ui.floor].mobs = L.filter(x => x.id !== m.id); sel = null; lastText = ''; changed(); return render(); }
}

let started = false;
export function ensureMobs(){
  if (started) return; started = true;
  const st = document.createElement('style');
  st.textContent = `.mb-sheet{max-width:660px}.mb-lead{margin:6px 0;font-size:14px}`;
  document.head.appendChild(st);
  registerCommands([{ id:'mob', n:'A mob', hint:'Thirty zombies, fifty bats, a village with torches: many fighting as one', icon:'👥', role:'dm', run:openMobs }]);
}
