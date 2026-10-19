/* ACTIONS — selecting, moving (doors open, traps fire), stairs, falling, doors, searching, pings, floors, views. */
import * as THREE from 'three';
import { state, ui, tokById, tokenAt, log, isDM, viewAsPlayer, dreadLevel } from '../engine/state.js';
import { makeNoise } from './noise.js';
import { reach, pathTo, pathCost, updateVision, detectHidden, vision, passMove, canSeeTile } from '../engine/grid.js';
import { trapAt } from '../engine/generator.js';
import { TRAP_KINDS } from '../data/rooms.js';
import { CONDITIONS, WHISPERS } from '../data/dread.js';
import { d, clamp, cheb, esc, pick, rollDice } from '../util/core.js';
import { controls, camera, tween, focusTile, focusFloor, wx, wz } from '../render/scene.js';
import { buildFloor, applyFloorLook, animateDoor } from '../render/floors.js';
import { syncTokens, tokenViews } from '../render/minis.js';
import { showReach, clearReach, refreshSelectionRing, spawnPing, burst } from '../render/effects.js';
import { showCard, toast, sendWhisper, renderTop, renderSel } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { canAct, moveAllowance, addCond, saveBonus } from './rules.js';
import { applyDamage, runFx, zoneSource } from './combat.js';
import { changed, broadcast, sendHost } from './session.js';
import { sfx } from '../audio/sound.js';

/* ---------- selection ---------- */
export function select(id){
  ui.selected = id; if (id){ ui.selDoor = null; ui.selTrap = null; }
  const t = id && tokById(id);
  if (t && t.floor !== ui.floor && ui.view !== 'stack') goFloor(t.floor, false);
  showReach(t); refreshSelectionRing(); renderSel();
  if (ui.tab === 'tokens') renderPanel();
}
export function selectDoor(L, id){ ui.selected = null; ui.selTrap = null; ui.selDoor = { floor:L, id }; clearReach(); refreshSelectionRing(); renderSel(); }
export function selectTrap(L, id){ ui.selected = null; ui.selDoor = null; ui.selTrap = { floor:L, id }; clearReach(); refreshSelectionRing(); renderSel(); }
export const selectedDoor = () => ui.selDoor && state.floors[ui.selDoor.floor]?.doors.find(d => d.id === ui.selDoor.id);
export const selectedTrap = () => ui.selTrap && state.floors[ui.selTrap.floor]?.traps.find(t => t.id === ui.selTrap.id);

/* ---------- moving ---------- */
export function requestMove(t, x, y){
  if (ui.role === 'player'){
    if (!canAct(t)){ toast('Wait for your turn.'); return; }
    sendHost({ t:'move', id:t.id, x, y }); clearReach(); return;
  }
  doMove(t, x, y);
}
// Would this creature, walking `path`, notice a trap that lies further along it? Stop before it if so.
function stopForSpotted(t, path){
  if (t.kind === 'monster') return path;
  const f = state.floors[t.floor], ox = t.x, oy = t.y;
  try {
    for (let k = 0; k < path.length; k++){
      t.x = path[k].x; t.y = path[k].y;
      const seen = vision(t);
      for (let j = k + 1; j < path.length; j++){
        const tr = trapAt(f, path[j].y * f.W + path[j].x);
        if (tr && tr.armed && !tr.found && seen.has(tr.i) && cheb(t.x, t.y, path[j].x, path[j].y) <= 2 && (t.passive || 10) >= (TRAP_KINDS[tr.kind]?.find ?? 13)) return path.slice(0, k + 1);
        if (tr && tr.armed && tr.found && j === k + 1 && path.length > j + 1) return path.slice(0, k + 1);
      }
    }
  } finally { t.x = ox; t.y = oy; }
  return path;
}
export function doMove(t, x, y){
  const f = state.floors[t.floor];
  const R = reach(t.floor, t.x, t.y, moveAllowance(t), t.id), ti = y * f.W + x;
  const occ = tokenAt(t.floor, x, y);
  if (!R.par.has(ti) || (occ && occ.id !== t.id)) return false;
  let path = pathTo(R.par, f.W, ti);
  let trapHit = null;
  if (t.kind !== 'monster'){
    path = stopForSpotted(t, path);
    const k = path.findIndex(p => trapAt(f, p.y * f.W + p.x)?.armed);
    if (k >= 0){ trapHit = trapAt(f, path[k].y * f.W + path[k].x); path = path.slice(0, k + 1); }
  }
  if (state.combat.active) t.moved = (t.moved || 0) + pathCost(f, path);
  clearReach();
  broadcast({ t:'anim', id:t.id, path });
  animatePath(t.id, path, step => {
    t.x = step.x; t.y = step.y;
    const dr = f.doors.find(dd => dd.i === step.y * f.W + step.x);
    if (dr && dr.state === 'closed'){ dr.state = 'open'; buildFloor(t.floor); animateDoor(t.floor, dr.id, true); sfx('door'); log(`${t.name} opens a door.`); }
    if (t.kind !== 'monster'){
      const grew = updateVision(), found = detectHidden();
      if (grew || found.length) rebuildFog(t.floor);
      for (const fd of found) announceFound(fd);
    }
    syncTokens();
  }, () => {
    if (trapHit) triggerTrap(t, trapHit);
    if (ui.selected === t.id) showReach(t);
    changed();
  }, ui.selected === t.id);
  return true;
}
export function animatePath(id, path, onStep, onDone, follow){
  const tv = tokenViews.get(id), t = tokById(id);
  if (!tv || !t || !path.length){ onDone && onDone(); return; }
  tv.anim = true;
  const s = (t.size - 1) / 2;
  const step = i => {
    if (i >= path.length){ tv.anim = null; onDone && onDone(); return; }
    const from = tv.group.position.clone(), to = new THREE.Vector3(wx(path[i].x + s), 0, wz(path[i].y + s));
    let last = from.clone();
    tween(.13, k => {
      tv.group.position.lerpVectors(from, to, k); tv.group.position.y = Math.sin(k * Math.PI) * .15;
      if (follow){ const dx = tv.group.position.x - last.x, dz = tv.group.position.z - last.z; controls.target.x += dx; controls.target.z += dz; camera.position.x += dx; camera.position.z += dz; }
      last = tv.group.position.clone();
    }, () => { onStep && onStep(path[i]); step(i + 1); });
  };
  step(0);
}
export function rebuildFog(L){ if (viewAsPlayer() || ui.previewFog){ if (L === undefined) state.floors.forEach((_, i) => buildFloor(i)); else buildFloor(L); } else if (L !== undefined) buildFloor(L); }
function announceFound(fd){
  const f = state.floors[fd.floor];
  if (fd.what === 'trap'){
    const k = TRAP_KINDS[fd.obj.kind];
    showCard({ kind:'', title:`${fd.who.name} spots a trap`, sub:`${k?.n || 'Trap'} · passive Perception ${fd.who.passive}`, flair:'Something about that flagstone is wrong.' });
    log(`${fd.who.name} spots a ${k?.n || 'trap'} on ${f.name}.`);
  } else {
    showCard({ kind:'', title:`${fd.who.name} finds a secret door`, sub:`passive Perception ${fd.who.passive}`, flair:'A seam in the stone that is a little too straight.' });
    log(`${fd.who.name} finds a secret door on ${f.name}.`);
  }
  buildFloor(fd.floor);
}

/* ---------- stairs & falling ---------- */
export function onStairs(t){ const f = state.floors[t.floor], v = f.grid[t.y * f.W + t.x]; return v === 3 && state.floors[t.floor + 1] ? 'down' : v === 4 && t.floor > 0 ? 'up' : null; }
export function takeStairs(t){
  if (ui.role === 'player'){ sendHost({ t:'stairs', id:t.id }); return; }
  const dir = onStairs(t); if (!dir) return;
  t.floor += dir === 'down' ? 1 : -1;
  const occ = tokenAt(t.floor, t.x, t.y); if (occ && occ.id !== t.id){ const free = nearestOpen(t.floor, t.x, t.y); if (free){ t.x = free.x; t.y = free.y; } }
  log(`${t.name} ${dir === 'down' ? 'descends to' : 'climbs to'} ${state.floors[t.floor].name}.`);
  updateVision(); rebuildFog();
  if (ui.selected === t.id) goFloor(t.floor);
  changed(); if (ui.selected === t.id) showReach(t);
}
export function nearestOpen(L, x, y){
  const f = state.floors[L];
  for (let r = 0; r < Math.max(f.W, f.H); r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++){
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= f.W || ny >= f.H) continue;
    if (passMove(f, ny * f.W + nx) && !tokenAt(L, nx, ny)) return { x:nx, y:ny };
  }
  return null;
}
// Through the floor: a pit trap, Pull Under, a collapsing floor.
export function fall(t){
  if (t.dead && t.kind === 'monster') return;
  const below = state.floors[t.floor + 1];
  if (!below){ toast(`${t.name} hits the bottom of a shallow pit.`); return; }
  burst(t.floor, t.x, t.y, '#3a2b33');
  t.floor++; const spot = nearestOpen(t.floor, t.x, t.y); if (spot){ t.x = spot.x; t.y = spot.y; }
  addCond(t, 'prone', 1);
  log(`${t.name} falls through to ${below.name}!`);
  showCard({ kind:'', title:`${t.name} falls`, sub:below.name, flair:'Down through the dark, and the floor below comes up fast.' });
  updateVision(); rebuildFog(); syncTokens();
  if (ui.selected === t.id || (ui.role === 'dm' && !state.tokens.some(o => o.floor === ui.floor && o.kind !== 'monster' && !o.dead))) goFloor(t.floor);
  changed();
}

/* ---------- traps ---------- */
export function triggerTrap(t, tr){
  const f = state.floors[t.floor], k = TRAP_KINDS[tr.kind] || TRAP_KINDS.pit, x = tr.i % f.W, y = (tr.i / f.W) | 0;
  tr.armed = false; tr.found = true;
  sfx(tr.kind === 'bell' ? 'toll' : tr.kind === 'hands' ? 'skitter' : 'trap');
  const targets = state.tokens.filter(o => o.floor === t.floor && !o.dead && !o.flags.gone && cheb(o.x, o.y, x, y) <= (k.rad || 0));
  const base = k.dice && k.dice !== '0' ? rollDice(k.dice).total : 0, lines = [], fallers = [];
  for (const o of targets){
    let dmg = base, ok = false;
    if (k.save !== 'none'){ const r = d(20) + saveBonus(o, k.save); ok = r >= k.dc; if (ok) dmg = Math.floor(dmg / 2);
      lines.push(`${esc(o.name)} — ${k.save.toUpperCase()} ${r} vs ${k.dc}: <b>${ok ? 'saved' : 'failed'}</b>${dmg ? ` → ${dmg} ${k.type}` : ''}${!ok && k.cond ? ` + ${k.cond}` : ''}`); }
    else if (dmg) lines.push(`${esc(o.name)} → <b>${dmg}</b> ${k.type}`);
    if (!ok && k.cond && CONDITIONS[k.cond]) addCond(o, k.cond, 1);
    if (dmg) applyDamage(o, dmg, k.type);
    if (!ok && k.fx?.includes('pit') && !o.dead) fallers.push(o);
  }
  showCard({ kind:'crit', title:`${k.icon} ${k.n}!`, sub:`${t.name} sets it off`, flair:k.f, lines });
  makeNoise(t.floor, x, y, tr.kind === 'bell' ? 2 : 1, `${k.n} goes off`);
  log(`${t.name} triggers a ${k.n} on ${f.name}.`);
  buildFloor(t.floor);
  const zs = zoneSource(t.floor, { x, y });
  for (const fx of k.fx || []) if (fx !== 'pit') setTimeout(() => { runFx(zs, fx); changed(); }, 500);
  fallers.forEach(o => setTimeout(() => fall(o), 700));
  changed();
}
export function disarmTrap(actor, L, id){
  if (ui.role === 'player'){ sendHost({ t:'disarm', floor:L, id }); return; }
  const f = state.floors[L], tr = f.traps.find(t => t.id === id); if (!tr || !actor) return;
  const k = TRAP_KINDS[tr.kind], dc = k?.find ?? 13, r = d(20), tot = r + (actor.check || 0), ok = tot >= dc;
  showCard({ kind:ok ? '' : 'miss', title:`${actor.name} works at the ${k?.n || 'trap'}`, sub:`Disarm · DC ${dc}`, lines:[`d20 <b>${r}</b> + ${actor.check || 0} = <b>${tot}</b> — <b>${ok ? 'DISARMED' : tot <= dc - 5 ? 'SET IT OFF' : 'not yet'}</b>`] });
  log(`${actor.name} ${ok ? 'disarms' : 'fails to disarm'} a ${k?.n || 'trap'}.`);
  if (ok){ tr.armed = false; buildFloor(L); }
  else if (tot <= dc - 5) triggerTrap(actor, tr);
  changed();
}

/* ---------- doors ---------- */
// act: 'toggle' | 'pick' | 'force' | 'set:<state>'
export function doorAction(actor, L, id, act){
  if (ui.role === 'player'){ sendHost({ t:'door', floor:L, id, act }); return; }
  const f = state.floors[L], dr = f.doors.find(dd => dd.id === id); if (!dr) return;
  const before = dr.state, x = dr.i % f.W, y = (dr.i / f.W) | 0;
  if (act.startsWith('set:')) dr.state = act.slice(4);
  else if (act === 'toggle'){
    if (dr.state === 'locked'){ showCard({ kind:'miss', title:'Locked', sub:`DC ${dr.dc} to pick or force`, flair:'The handle turns a quarter-inch and stops.' }); return; }
    if (dr.state === 'open' && tokenAt(L, x, y)){ toast('Someone is standing in the doorway.'); return; }
    dr.state = dr.state === 'open' ? 'closed' : 'open';
    if (actor) log(`${actor.name} ${dr.state === 'open' ? 'opens' : 'closes'} a door.`);
  }
  else if (act === 'pick' || act === 'force'){
    if (!actor) return;
    const r = d(20), mod = act === 'pick' ? (actor.check || 0) : saveBonus(actor, 'str') + 2, dc = act === 'pick' ? dr.dc : dr.dc + 2, tot = r + mod, ok = tot >= dc;
    showCard({ kind:ok ? '' : 'miss', title:`${actor.name} ${act === 'pick' ? 'picks the lock' : 'throws a shoulder into the door'}`, sub:`DC ${dc}`,
      lines:[`d20 <b>${r}</b> + ${mod} = <b>${tot}</b> — <b>${ok ? (act === 'pick' ? 'UNLOCKED' : 'IT GIVES') : 'it holds'}</b>`], flair:act === 'force' ? 'The sound carries a long way down here.' : '' });
    log(`${actor.name} ${ok ? (act === 'pick' ? 'unlocks' : 'forces open') : 'fails to open'} a door.`);
    if (ok) dr.state = act === 'pick' ? 'closed' : 'open';
    if (act === 'force'){ runFx(zoneSource(L, { x, y }), 'alert', true); makeNoise(L, x, y, 1, 'A door is forced'); }
  }
  buildFloor(L);
  if ((before === 'open') !== (dr.state === 'open')){ animateDoor(L, dr.id, dr.state === 'open'); sfx('door'); }
  updateVision(); rebuildFog(L); renderSel(); changed();
}
// Actively look for traps and secret doors within 3 squares.
export function search(actor){
  if (ui.role === 'player'){ sendHost({ t:'search' }); return; }
  if (!actor) return;
  const f = state.floors[actor.floor], r = d(20), tot = r + ((actor.passive || 10) - 10), found = [];
  for (const tr of f.traps) if (tr.armed && !tr.found && cheb(actor.x, actor.y, tr.i % f.W, (tr.i / f.W) | 0) <= 3 && tot >= (TRAP_KINDS[tr.kind]?.find ?? 13)){ tr.found = true; found.push(TRAP_KINDS[tr.kind]?.n || 'a trap'); }
  for (const dr of f.doors) if (dr.state === 'secret' && cheb(actor.x, actor.y, dr.i % f.W, (dr.i / f.W) | 0) <= 3 && tot >= dr.dc){ dr.state = 'closed'; dr.found = true; found.push('a secret door'); }
  showCard({ kind:found.length ? '' : 'miss', title:`${actor.name} searches`, sub:'Perception · 15 ft.', lines:[`d20 <b>${r}</b> ${tot - r >= 0 ? '+' : '−'} ${Math.abs(tot - r)} = <b>${tot}</b>`, found.length ? `Found: <b>${esc(found.join(', '))}</b>` : 'Nothing — or nothing they can find.'] });
  log(`${actor.name} searches${found.length ? ` and finds ${found.join(', ')}` : ''}.`);
  if (found.length){ buildFloor(actor.floor); updateVision(); }
  changed();
}
// The party member best placed to act on a door or trap (DM side): nearest living hero.
export function nearestHero(L, x, y){
  return state.tokens.filter(t => t.floor === L && t.kind !== 'monster' && !t.dead && !t.flags.gone).sort((a, b) => cheb(a.x, a.y, x, y) - cheb(b.x, b.y, x, y))[0] || null;
}

/* ---------- pings, floors, views, the Gaze (state.dread) ---------- */
export function doPing(tile, who, color, from){
  const c = color || (ui.role === 'player' ? tokById(ui.myToken)?.color : '#e9a54a') || '#e9a54a';
  spawnPing(tile.floor, tile.x, tile.y, c);
  if (ui.role === 'player') sendHost({ t:'ping', floor:tile.floor, x:tile.x, y:tile.y, color:c });
  else broadcast({ t:'ping', floor:tile.floor, x:tile.x, y:tile.y, color:c, who:who || 'The DM' }, from);
  if (who) toast(`${who} pings the map`);
}
export function goFloor(L, focus = true){
  ui.floor = clamp(L, 0, state.floors.length - 1);
  applyFloorLook(); if (focus) focusFloor();
  const t = ui.selected && tokById(ui.selected); if (!t || t.floor !== ui.floor && ui.view !== 'stack') clearReach();
  if (ui.selDoor?.floor !== ui.floor) ui.selDoor = null; if (ui.selTrap?.floor !== ui.floor) ui.selTrap = null;
  renderTop(); renderSel(); if (['dungeon', 'tokens', 'build'].includes(ui.tab)) renderPanel();
  import('../ui/input.js').then(m => m.refreshBuildOverlay());
}
export function setView(v){ ui.view = v; applyFloorLook(); focusFloor(); document.querySelectorAll('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.view === v)); }
export function setDread(n){
  const old = state.dread; state.dread = clamp(n, 1, 10);
  if (old !== state.dread){
    const D = dreadLevel();
    log(`Strahd's Gaze ${state.dread}: ${D.n}`);
    if (state.dread > old){
      sfx('boom');
      if (state.dread >= 5) sendWhisper(pick(WHISPERS));
      showCard({ kind:state.dread >= 7 ? 'crit' : '', title:`👁 Gaze ${state.dread} · ${D.n}`, flair:D.text, lines:dreadRulesLines(D) });
    }
  }
  renderTop(); changed();
}
export function dreadRulesLines(D){
  const out = [];
  if (D.regen) out.push(`His creatures regain <b>${D.regen}</b> HP each turn`);
  if (D.hit) out.push(`His creatures <b>+${D.hit}</b> to hit`);
  if (D.raise) out.push(`<b>${Math.round(D.raise * 100)}%</b> per fallen body: it rises as his`);
  if (D.charm) out.push(`each round one hero: <b>DC ${D.charm}</b> Wisdom or charmed`);
  if (D.shift) out.push(`<b>${Math.round(D.shift * 100)}%</b> the land rearranges each round`);
  return out;
}
export { canSeeTile, focusTile };
