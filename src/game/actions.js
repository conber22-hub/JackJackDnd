/* ACTIONS — selecting, moving (doors open, traps fire), stairs, falling, doors, searching, pings, floors, views. */
import * as THREE from 'three';
import { state, ui, tokById, tokenAt, log, isDM, viewAsPlayer, dreadLevel } from '../engine/state.js';
import { makeNoise } from './noise.js';
import { enteredRoom } from './rooms.js';
import { reach, pathTo, pathCost, updateVision, detectHidden, vision, passMove, canSeeTile, seenNow, standHeight } from '../engine/grid.js';
import { trapAt } from '../engine/generator.js';
import { SEARCHABLE } from '../data/loot.js';
import { reveal, searchStashes } from './objects.js';
import { besideProp } from '../engine/objects.js';
import { TRAP_KINDS } from '../data/rooms.js';
import { CONDITIONS, WHISPERS } from '../data/dread.js';
import { d, clamp, cheb, esc, pick, rollDice } from '../util/core.js';
import { controls, camera, tween, focusTile, focusFloor, wx, wz } from '../render/scene.js';
import { buildFloor, applyFloorLook, animateDoor } from '../render/floors.js';
import { syncTokens, tokenViews, faceStep } from '../render/minis.js';
import { showReach, clearReach, refreshSelectionRing, spawnPing, burst, clearMovePath } from '../render/effects.js';
import { showCard, toast, sendWhisper, renderTop, renderSel } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { canAct, moveAllowance, addCond, saveBonus, turnKey } from './rules.js';
import { checkPath, fits, provokers } from '../engine/movement.js';
import { moveGroup, takeDash, offerOpportunity, pausedMover } from './moves.js';
import { applyDamage, runFx, zoneSource } from './combat.js';
import { changed, broadcast, sendHost } from './session.js';
import { sfx } from '../audio/sound.js';

/* ---------- selection ---------- */
export function select(id){
  // picking someone in the group makes them the one who leads it; picking anyone else lets the group go
  if (ui.group?.size){ if (id && ui.group.has(id)){ ui.group.delete(id); if (ui.selected) ui.group.add(ui.selected); } else ui.group.clear(); }
  ui.selected = id; if (id){ ui.selDoor = null; ui.selTrap = null; ui.selProp = null; }
  clearMovePath();
  const t = id && tokById(id);
  if (t && t.floor !== ui.floor && ui.view !== 'stack') goFloor(t.floor, false);
  showReach(t); refreshSelectionRing(); renderSel();
  if (ui.tab === 'tokens') renderPanel();
}
export function selectDoor(L, id){ ui.selected = null; ui.selTrap = null; ui.selProp = null; ui.selDoor = { floor:L, id }; clearReach(); refreshSelectionRing(); renderSel(); }
export function selectTrap(L, id){ ui.selected = null; ui.selDoor = null; ui.selProp = null; ui.selTrap = { floor:L, id }; clearReach(); refreshSelectionRing(); renderSel(); }
export const selectedDoor = () => ui.selDoor && state.floors[ui.selDoor.floor]?.doors.find(d => d.id === ui.selDoor.id);
export const selectedTrap = () => ui.selTrap && state.floors[ui.selTrap.floor]?.traps.find(t => t.id === ui.selTrap.id);

/* ---------- moving ---------- */
// x, y: where to; path: a traced route (dragged on the map) instead of the shortest way there.
export function requestMove(t, x, y, path = null){
  if (ui.role === 'player'){
    if (!canAct(t)){ toast('Wait for your turn.'); return; }
    sendHost({ t:'move', id:t.id, x, y, ...(path ? { path } : {}) }); clearReach(); return;
  }
  if (!moveGroup(t, x, y, path) && path) toast(`${t.name} can't end there.`);
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
/* The way a creature would walk to (x, y): the traced route if one is given (checked), else the shortest.
   In a fight, a move longer than what's left of its speed takes the Dash (if it hasn't), so the reach shown
   includes the Dash. → { path, cost, dash } or null. */
export function resolvePath(t, x, y, given = null, { trusted = false } = {}){
  const f = state.floors[t.floor], base = moveAllowance(t);
  const most = state.combat.active && !t.dashed && !(ui.freeMove && ui.role === 'dm') ? moveAllowance(t, { dash:true }) : base;
  let path;
  if (given){
    const c = trusted ? pathCost(f, given) : checkPath(t, given, most);
    if (c < 0) return null; path = given.map(p => ({ x:p.x, y:p.y }));
  } else {
    const R = reach(t.floor, t.x, t.y, most, t.id), ti = y * f.W + x;
    if (!R.par.has(ti) || !fits(t.floor, x, y, t.size || 1, t.id)) return null;
    path = pathTo(R.par, f.W, ti);
  }
  if (!path.length) return null;
  const cost = pathCost(f, path);
  return { path, cost, dash:state.combat.active && cost > base };
}
// Where a hero's walk really ends: short of a trap it spots, or on the one it walks into (never on someone
// else's square, unless a group move planned it). Monsters walk where they mean to. → { path, trapHit }
export function trapCut(t, path, trusted = false){
  const f = state.floors[t.floor]; let trapHit = null;
  if (t.kind === 'monster') return { path, trapHit };
  path = stopForSpotted(t, path);
  const k = path.findIndex(p => trapAt(f, p.y * f.W + p.x)?.armed);
  if (k >= 0){ trapHit = trapAt(f, path[k].y * f.W + path[k].x); path = path.slice(0, k + 1); }
  while (path.length){ const e = path[path.length - 1], o = tokenAt(t.floor, e.x, e.y); if (!o || o.id === t.id || trusted) break; path.pop(); if (trapHit && trapHit.i === e.y * f.W + e.x) trapHit = null; }
  return { path, trapHit };
}
/* Walk a creature along its way: doors open as it reaches them, a hero stops short of a trap it spots (or
   walks into one it doesn't), and in a fight, leaving an enemy's reach stops the move right there and offers
   that enemy its opportunity attack (game/moves.js) — the rest of the walk carries on after.
   opts: path (a traced route), trusted (planned by a group move: skip the end-square check), skip (enemies
   that already passed on this move), cont (the rest of a move an opportunity attack paused), delay (ms). */
export function doMove(t, x, y, opts = {}){
  if (!t || t.dead || pausedMover(t.id) || (tokenViews.get(t.id)?.anim && !opts.delay)) return false;   // one walk at a time
  const f = state.floors[t.floor];
  const way = resolvePath(t, x, y, opts.path, opts);
  if (!way) return false;
  let path = way.path;
  if (way.dash && !opts.cont) takeDash(t, true);
  if (!opts.cont) t.lastMove = { floor:t.floor, x:t.x, y:t.y, moved:t.moved || 0, dashed:!!t.dashed && !way.dash, key:state.combat.active ? turnKey() : 'free', clean:true };
  let trapHit;
  ({ path, trapHit } = trapCut(t, path, opts.trusted));
  // leaving an enemy's reach: walk up to the edge of it, and stop there for the opportunity attack
  let rest = null, oa = null;
  const pv = !(ui.freeMove && ui.role === 'dm') ? provokers(t, path, { skip:opts.skip || [] }) : [];
  if (pv.length){ oa = pv[0]; rest = path.slice(oa.at + 1); path = path.slice(0, oa.at + 1); if (trapHit && !path.some(p => p.y * f.W + p.x === trapHit.i)) trapHit = null; }
  if (state.combat.active) t.moved = (t.moved || 0) + pathCost(f, path);
  if ((trapHit || oa) && t.lastMove) t.lastMove.clean = false;
  if (ui.selected === t.id) clearReach();
  const finish = () => {
    if (trapHit) triggerTrap(t, trapHit);
    if (oa) offerOpportunity(t, oa.by, rest, [...(opts.skip || []), oa.by]);
    if (ui.selected === t.id && !oa) showReach(t);
    changed();
  };
  if (!path.length){ finish(); return true; }
  const go = () => {
    // players see a monster walk only if any of its steps are in the party's sight
    if (t.kind !== 'monster' || [{ x:t.x, y:t.y }, ...path].some(p => seenNow[t.floor]?.has(p.y * f.W + p.x))) broadcast({ t:'anim', id:t.id, path });
    animatePath(t.id, path, step => {
      t.x = step.x; t.y = step.y;
      const dr = f.doors.find(dd => dd.i === step.y * f.W + step.x);
      if (dr && dr.state === 'closed'){ dr.state = 'open'; t.lastMove && (t.lastMove.clean = false); buildFloor(t.floor); animateDoor(t.floor, dr.id, true); sfx('door'); log(`${t.name} opens a door.`); }
      if (t.kind !== 'monster'){
        if (t.kind === 'pc') enteredRoom(t.floor, step.x, step.y);
        const grew = updateVision(), found = detectHidden();
        if (grew && t.lastMove) t.lastMove.clean = false;
        if (found.length || (grew && (viewAsPlayer() || ui.previewFog))) rebuildFog(t.floor);   // the DM's own view has no fog to redraw
        for (const fd of found) announceFound(fd);
      }
      syncTokens();
    }, finish, ui.selected === t.id);
  };
  if (opts.delay) setTimeout(go, opts.delay); else go();
  return true;
}
export function animatePath(id, path, onStep, onDone, follow){
  const tv = tokenViews.get(id), t = tokById(id);
  if (!tv || !t || !path.length){ onDone && onDone(); return; }
  tv.anim = true;
  const s = (t.size - 1) / 2, f = state.floors[t.floor];
  const step = i => {
    if (i >= path.length){ tv.anim = null; onDone && onDone(); return; }
    const from = tv.group.position.clone(), to = new THREE.Vector3(wx(path[i].x + s), standHeight(f, path[i].x, path[i].y, t.size || 1), wz(path[i].y + s));
    faceStep(id, to.x - from.x, to.z - from.z);
    // a little bob each step; a hop up onto a table (or down off it) gets a proper jump and a beat longer
    const climb = Math.abs(to.y - from.y), arc = .15 + climb * .5;
    let last = from.clone();
    tween(climb > .05 ? .22 : .13, k => {
      tv.group.position.lerpVectors(from, to, k); tv.group.position.y = from.y + (to.y - from.y) * k + Math.sin(k * Math.PI) * arc;
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
  // containers next to the searcher open (one roll each on their table, data/loot.js, unless the DM wrote what's
  // inside); a locked one stays shut. Hidden stashes in the furniture beside them are found on a good enough roll.
  for (const p of (f.props || []).filter(p => (SEARCHABLE.has(p.k) || p.contents) && !p.searched && !p.lock && !p.broken && besideProp(actor, p))) reveal(actor, p, 'searches');
  const stashes = searchStashes(actor, tot);
  if (stashes.length) found.push(...stashes.map(n => `a hiding place in the ${n}`));
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
  if (ui.selDoor?.floor !== ui.floor) ui.selDoor = null; if (ui.selTrap?.floor !== ui.floor) ui.selTrap = null; if (ui.selProp?.floor !== ui.floor) ui.selProp = null;
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
