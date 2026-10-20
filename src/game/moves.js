/* MOVES — everything about moving that sits above a single walk (actions.js doMove):
   · the party following its leader in marching order when the DM moves one of them outside a fight
   · a group the DM picked (Shift-click, or Select party / Select its kind) moving in formation
   · Dash, Disengage, Dodge and Stand up in a fight; undoing a move made this turn
   · a monster closing in on the nearest foe (the DM's 🐾 Close in)
   · opportunity attacks: a move that leaves an enemy's reach pauses there, and the enemy (its player if it
     has one at the table, else the DM) decides whether to strike before the walk carries on
   · stepping the selected creature one square with the arrow keys or the number pad. */
import * as THREE from 'three';
import { state, ui, tokById, isDM, log } from '../engine/state.js';
import { updateVision } from '../engine/grid.js';
import { trailTargets, formationTargets, planToward, claim, closeIn, bestMelee, canReact, tokGap } from '../engine/movement.js';
import { moveAllowance, speedSquares, hasCond, removeCond, stopped, turnKey } from './rules.js';
import { doMove, resolvePath, requestMove, trapCut } from './actions.js';
import { doAttack, partySees } from './combat.js';
import { changed } from './session.js';
import { toast, renderSel } from '../ui/hud.js';
import { showReach, refreshSelectionRing } from '../render/effects.js';
import { syncTokens, tokenViews } from '../render/minis.js';
import { camera } from '../render/scene.js';
import { $, esc, uid } from '../util/core.js';
import { sendToSeat, broadcast, sendHost } from '../net/table.js';
import { sfx } from '../audio/sound.js';

// Who may move this creature from this screen: the DM anything, a player their own hero.
export const mayMove = t => !!t && (ui.role === 'dm' ? !ui.tableView : t.id === ui.myToken);

/* ---------- marching order, following, groups ---------- */
// The party (heroes and allies) in marching order: state.march first, then everyone else as they were added.
export function marchOrder(){
  const ids = state.march || [], at = t => { const k = ids.indexOf(t.id); return k < 0 ? 1e6 + state.tokens.indexOf(t) : k; };
  return state.tokens.filter(t => t.kind !== 'monster').sort((a, b) => at(a) - at(b));
}
export function marchUp(id){
  const order = marchOrder().map(t => t.id), k = order.indexOf(id);
  if (k > 0){ [order[k - 1], order[k]] = [order[k], order[k - 1]]; state.march = order; changed(); }
}
export function toggleStay(id){ const t = tokById(id); if (!t) return; t.flags.stay = !t.flags.stay; changed(); }
const here = (t, o) => o && o.id !== t.id && o.floor === t.floor && !o.dead && !o.flags?.gone;
// When the DM walks a hero outside a fight, the rest of the party nearby falls in behind.
function followersOf(t){
  if (state.combat.active || ui.follow === false || t.kind === 'monster' || ui.role !== 'dm') return [];
  return marchOrder().filter(o => here(t, o) && !o.flags?.stay && !stopped(o) && tokGap(t, o) <= 8 && !tokenViews.get(o.id)?.anim);
}
const groupOf = t => [...(ui.group || [])].map(tokById).filter(o => here(t, o));

/* Move a creature and whoever goes with it: a picked group keeps its formation; otherwise, outside a fight,
   the party follows the leader single file. Each member is planned as if those before it had already
   arrived, then everyone walks at once, the followers a beat behind. */
export function moveGroup(t, x, y, path = null){
  const grp = isDM() ? groupOf(t) : [], fol = grp.length ? [] : followersOf(t), members = grp.length ? grp : fol;
  if (!members.length) return doMove(t, x, y, { path });
  const way = resolvePath(t, x, y, path); if (!way) return false;
  const walk = trapCut(t, way.path).path;                  // where the leader will really stop
  if (!walk.length) return doMove(t, x, y, { path:way.path });
  const f = state.floors[t.floor], end = walk[walk.length - 1];
  const targets = grp.length ? formationTargets(t, end, grp) : trailTargets(t, walk, fol);
  const saved = [t, ...members].map(o => [o, o.x, o.y]), plans = [], taken = new Set();
  claim(taken, f, end.x, end.y, t.size || 1);
  t.x = t.y = -99;                                         // the leader has left its square
  try {
    for (const m of members){
      const tg = targets.find(q => q.id === m.id);
      const mp = tg && planToward(m, tg.x, tg.y, moveAllowance(m), taken);
      if (mp){ const e = mp[mp.length - 1]; claim(taken, f, e.x, e.y, m.size || 1); plans.push([m, mp]); m.x = m.y = -99; }
      else claim(taken, f, m.x, m.y, m.size || 1);
    }
  } finally { for (const [o, x0, y0] of saved){ o.x = x0; o.y = y0; } }
  if (!doMove(t, x, y, { path:way.path })) return false;
  plans.forEach(([m, mp], k) => { const e = mp[mp.length - 1]; doMove(m, e.x, e.y, { path:mp, trusted:true, delay:(grp.length ? 50 : 170) * (k + 1) }); });
  return true;
}
// Shift-click (or the card's buttons) adds creatures to the selection; they move with the selected one.
export function toggleGroup(id){
  ui.group ||= new Set();
  if (!ui.selected){ return false; }
  if (id === ui.selected) return true;
  if (ui.group.has(id)) ui.group.delete(id); else ui.group.add(id);
  refreshSelectionRing(); renderSel(); return true;
}
export function selectParty(t){ ui.group = new Set(marchOrder().filter(o => here(t, o)).map(o => o.id)); refreshSelectionRing(); renderSel(); }
export function selectKin(t){
  ui.group = new Set(state.tokens.filter(o => here(t, o) && o.kind === t.kind && (t.bid ? o.bid === t.bid : true) && tokGap(t, o) <= 10).map(o => o.id));
  if (!ui.group.size) toast(`No other ${t.kind === 'monster' ? 'creature of its kind' : 'one'} nearby.`);
  refreshSelectionRing(); renderSel();
}
export function clearGroup(){ ui.group = new Set(); refreshSelectionRing(); renderSel(); }

/* ---------- a turn in a fight ---------- */
export function takeDash(t, auto = false){
  if (!state.combat.active || t.dashed) return false;
  t.dashed = true; log(`🏃 ${t.name} ${auto ? 'dashes' : 'takes the Dash'}.`); return true;
}
// k: dash | disengage | dodge | stand
export function turnAction(t, k){
  if (!t || t.dead) return false;
  if (k === 'stand'){
    if (!hasCond(t, 'prone')) return false;
    if (state.combat.active){
      const half = Math.ceil(speedSquares(t) / 2), left = speedSquares(t) * (t.dashed ? 2 : 1) - (t.moved || 0);
      if (stopped(t) || left < half){ toast(`${t.name} hasn't the movement left to stand (it costs ${half * 5} ft).`); return false; }
      t.moved = (t.moved || 0) + half;
    }
    removeCond(t, 'prone'); log(`⤒ ${t.name} gets up.`);
  }
  else if (!state.combat.active){ toast('That is for a fight.'); return false; }
  else if (k === 'dash'){ if (!takeDash(t)) return false; }
  else if (k === 'disengage'){ if (t.disengaged) return false; t.disengaged = true; log(`🛡 ${t.name} disengages — no opportunity attacks this turn.`); }
  else if (k === 'dodge'){ if (t.dodge) return false; t.dodge = true; log(`🌀 ${t.name} takes the Dodge — attacks against it have disadvantage until its next turn.`); }
  else return false;
  if (t.lastMove) t.lastMove.clean = false;
  if (ui.selected === t.id) showReach(t);
  renderSel(); changed(); return true;
}
// Everything a creature's turn spends resets when its turn starts (and when a fight begins or ends).
export function freshTurn(t){ t.moved = 0; t.dashed = false; t.disengaged = false; t.dodge = false; t.reacted = false; t.lastMove = null; }

/* ---------- undo a move ---------- */
// The DM can always take back a creature's last move this turn; a player only while it revealed nothing
// (no new ground seen, no door opened, no trap, no opportunity attack).
export function canUndoMove(t, dm = isDM()){
  const m = t?.lastMove;
  if (!m || t.dead || pausedMover(t.id) || tokenViews.get(t.id)?.anim) return false;
  if (m.key !== (state.combat.active ? turnKey() : 'free') || m.floor !== t.floor) return false;
  return dm || m.clean;
}
export function undoMove(t, dm = isDM()){
  if (!canUndoMove(t, dm)) return false;
  const m = t.lastMove; t.x = m.x; t.y = m.y;
  if (state.combat.active){ t.moved = m.moved; t.dashed = m.dashed; }
  t.lastMove = null;
  log(`↶ ${t.name} steps back.`);
  updateVision(); syncTokens();
  if (ui.selected === t.id) showReach(t);
  renderSel(); changed(); return true;
}

/* ---------- the DM's helper for monsters ---------- */
export function closeInMove(t){
  const r = closeIn(t, moveAllowance(t));
  if (!r){ toast(`${t.name} can't get any closer from here.`); return false; }
  if (!r.path.length){ toast(`${t.name} is already within reach of ${r.target.name}.`); return false; }
  const e = r.path[r.path.length - 1];
  return doMove(t, e.x, e.y, { path:r.path });
}

/* ---------- opportunity attacks ---------- */
const oaQueue = [];
export const pausedMover = id => oaQueue.some(q => q.mover === id);
export function offerOpportunity(mover, byId, rest, skip){
  const by = tokById(byId), i = by ? bestMelee(by) : null;
  const q = { id:uid(), mover:mover.id, by:byId, i, rest, skip };
  if (!by || i === null || !canReact(by)){ continueMove(mover, q); return; }
  oaQueue.push(q);
  log(`⚔ ${mover.name} leaves ${by.name}'s reach.`, by.kind === 'monster' && !partySees(by));
  sfx('turn', false);
  // a hero's player decides for their hero (the DM can still answer for them)
  if (by.kind !== 'monster') sendToSeat(by.id, { t:'oa', q:{ id:q.id, mover:mover.name, atk:by.attacks[i].n } });
  renderOA(); changed();
}
export function answerOpportunity(qid, take, fromPeer = null){
  const k = oaQueue.findIndex(q => q.id === qid); if (k < 0) return;
  const q = oaQueue[k];
  if (fromPeer && state.seats[fromPeer] !== q.by) return;
  oaQueue.splice(k, 1); broadcast({ t:'oaDone', id:qid }); renderOA();
  const mover = tokById(q.mover), by = tokById(q.by);
  let wait = 0;
  if (take && by && mover && !mover.dead && canReact(by)){
    by.reacted = true; log(`⚔ ${by.name} takes the opportunity.`);
    doAttack(by.id, mover.id, q.i, 'normal'); wait = 900;
  } else if (by && mover) log(`${by.name} lets ${mover.name} go.`, by.kind === 'monster' && !partySees(by));
  setTimeout(() => continueMove(mover, q), wait);
}
function continueMove(mover, q){
  const done = () => { if (mover && ui.selected === mover.id) showReach(mover); changed(); };
  if (!mover || mover.dead || stopped(mover) || !q.rest.length || !state.combat.active) return done();
  const e = q.rest[q.rest.length - 1];
  if (!doMove(mover, e.x, e.y, { path:q.rest, cont:true, skip:q.skip })) done();
}
// The turn moved on, the fight ended, the scene changed: a paused walk just stops where it is.
export function clearOpportunities(){ for (const q of oaQueue.splice(0)) broadcast({ t:'oaDone', id:q.id }); ui.oaAsk = []; renderOA(); }
// A player's prompt for their own hero's reaction.
export function askOpportunity(q){ (ui.oaAsk ||= []).push(q); sfx('turn', false); renderOA(); }
export function dropAsk(id){ ui.oaAsk = (ui.oaAsk || []).filter(q => q.id !== id); renderOA(); }
export function playerAnswer(id, take){ sendHost({ t:'oaAns', id, take }); dropAsk(id); }
export function renderOA(){
  const el = $('#oaPanel'); if (!el) return;
  const row = (id, text, yes, no) => `<div class="req oa"><div class="w">${text}</div><div class="b"><button class="btn small danger" data-act="oaTake" data-id="${id}">${yes}</button><button class="btn small" data-act="oaPass" data-id="${id}">${no}</button></div></div>`;
  if (ui.role === 'player'){ el.innerHTML = (ui.oaAsk || []).map(q => row(q.id, `⚔ <b>${esc(q.mover)}</b> is getting away from you — strike with <b>${esc(q.atk)}</b>? <span class="muted">(your reaction)</span>`, 'Strike', 'Let them go')).join(''); return; }
  if (ui.tableView){ el.innerHTML = ''; return; }
  el.innerHTML = oaQueue.map(q => { const m = tokById(q.mover), b = tokById(q.by), a = b?.attacks?.[q.i]; if (!m || !b || !a) return '';
    return row(q.id, `⚔ <b>${esc(m.name)}</b> leaves <b>${esc(b.name)}</b>'s reach — opportunity attack with <b>${esc(a.n)}</b> <span class="muted">${a.b >= 0 ? '+' : ''}${a.b} · ${esc(a.d)}</span>?${b.kind !== 'monster' ? ' <span class="muted">(their player can answer too)</span>' : ''}`, 'Strike', 'Let them go'); }).join('');
}

/* ---------- arrow keys and the number pad ---------- */
const up3 = new THREE.Vector3();
// sx, sy: a direction on screen (sy = -1 is up). Turned into a step on the grid by where the camera faces.
export function stepSelected(sx, sy){
  const t = ui.selected && tokById(ui.selected);
  if (!mayMove(t) || t.dead || tokenViews.get(t.id)?.anim || pausedMover(t.id)) return;
  up3.set(0, 1, 0).applyQuaternion(camera.quaternion);
  let fx = up3.x, fy = up3.z; const n = Math.hypot(fx, fy) || 1; fx /= n; fy /= n;
  const rx = -fy, ry = fx, vx = sx * rx - sy * fx, vy = sx * ry - sy * fy;
  const k = Math.round(Math.atan2(vy, vx) / (Math.PI / 4)), dx = Math.round(Math.cos(k * Math.PI / 4)), dy = Math.round(Math.sin(k * Math.PI / 4));
  requestMove(t, t.x + dx, t.y + dy);
}
