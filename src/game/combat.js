/* COMBAT — initiative, attacks, damage, death hooks, the fx language, and the Dread's round-end tide. */
import { state, ui, tokById, tokenAt, side, makeMonster, log, dreadLevel, isDM } from '../engine/state.js';
import { freeTilesNear, randomRoomTile, updateVision } from '../engine/grid.js';
import { BEST, hasTag, isHost } from '../data/bestiary.js';
import { CONDITIONS } from '../data/dread.js';
import { d, rollDice, avgDice, esc, cheb, pick, signed } from '../util/core.js';
import { tween, ease, focusTile } from '../render/scene.js';
import { syncTokens, tokenViews } from '../render/minis.js';
import { burst, showReach, clearReach } from '../render/effects.js';
import { showCard, toast, banner, sendWhisper } from '../ui/hud.js';
import { WHISPERS } from '../data/dread.js';
import { sfx } from '../audio/sound.js';
import { currentTurn, addCond, tickConds, hasCond, saveBonus } from './rules.js';
import { shiftFloor } from './shift.js';
import { whimRoll, whimStep, whimReset } from './whim.js';
import { changed, broadcast } from './session.js';
import { goFloor, setDread, fall, rebuildFog } from './actions.js';
import { spendSpell } from './resources.js';
import { LEGENDARY } from '../data/legendary.js';
import { makeNoise } from './noise.js';

export { currentTurn };

/* ---------- placing & initiative ---------- */
export function placeMonster(bid, tile){
  const t = makeMonster(bid, tile.floor, tile.x, tile.y); state.tokens.push(t);
  if (state.combat.active && tile.floor === state.combat.floor) addToInit(t);
  syncTokens(); riseFrom(t); changed();
  return t;
}
export function riseFrom(t){
  const tv = tokenViews.get(t.id); if (!tv) return;
  tv.anim = true; const y0 = -1;
  tween(.7, k => tv.group.position.y = y0 * (1 - ease(k)), () => tv.anim = null);
  sfx(hasTag(t, 'hands') ? 'skitter' : 'rise');
  burst(t.floor, t.x, t.y, BEST[t.bid]?.fam === 'seep' ? '#9cc23c' : '#e6d3b8');
}
export function addToInit(t){
  if (state.combat.order.includes(t.id)) return;
  t.initRoll = d(20) + (t.init || 0);
  const ord = state.combat.order.map(tokById);
  let at = ord.findIndex(o => !o || (o.initRoll ?? -99) < t.initRoll); if (at < 0) at = ord.length;
  state.combat.order.splice(at, 0, t.id);
  if (at <= state.combat.idx && state.combat.order.length > 1) state.combat.idx++;
}
export function rollInitiative(){
  const L = ui.floor, list = state.tokens.filter(t => t.floor === L && !t.dead && !t.flags.gone);
  if (!list.length){ toast('No one on this floor.'); return; }
  list.forEach(t => { t.initRoll = d(20) + (t.init || 0); t.moved = 0; });
  list.sort((a, b) => b.initRoll - a.initRoll || (a.kind === 'monster') - (b.kind === 'monster'));
  state.combat = { active:true, order:list.map(t => t.id), idx:0, round:1, floor:L };
  log(`⚔ Initiative on ${state.floors[L].name}: ${list.map(t => `${t.name} ${t.initRoll}`).join(', ')}`);
  const mid = list.reduce((m, t) => ({ x:m.x + t.x / list.length, y:m.y + t.y / list.length }), { x:0, y:0 });
  makeNoise(L, Math.round(mid.x), Math.round(mid.y), 1, 'Steel and shouting');
  startTurn(); changed();
}
export function nextTurn(){
  if (!state.combat.active) return;
  tickConds(currentTurn());
  if (!state.combat.order.some(id => { const t = tokById(id); return t && !t.flags.gone && (!t.dead || t.flags.rising); })){ toast('Everyone in this fight is down.'); return; }
  for (let guard = 0; guard < 300; guard++){
    state.combat.idx++;
    if (state.combat.idx >= state.combat.order.length){ state.combat.idx = 0; state.combat.round++; endOfRound(); }
    const t = currentTurn(); if (t && !t.flags.gone && (!t.dead || t.flags.rising)) break;
    if (!state.combat.order.length) break;
  }
  startTurn(); changed();
}
export function startTurn(){
  const t = currentTurn(); if (!t) return;
  t.moved = 0;
  const lg = legendOf(t); if (lg?.legendary) t.legend = lg.legendary.n;   // legendary actions come back
  if (t.flags.rising){
    t.dead = false; t.hp = 1; t.flags.rising = false; t.flags.rose = true;
    showCard({ kind:'seep', title:`${t.name} gets back up`, flair:'The tendrils pull the body upright by the collarbones. It was never finished dying.', lines:['Unfinished Death — it returns at 1 HP. Radiant or fire damage keeps it down.'] });
    syncTokens(); burst(t.floor, t.x, t.y, '#9cc23c');
  }
  const b = BEST[t.bid], D = dreadLevel();
  if (!t.dead && isHis(t) && D.regen && t.hp < t.maxHp){ t.hp = Math.min(t.maxHp, t.hp + D.regen); }
  if (b?.hooks?.onTurnStart && !t.dead) for (const fx of b.hooks.onTurnStart) runFx(t, fx, true);
  if (isDM()){ ui.selected = t.id; if (t.floor !== ui.floor) goFloor(t.floor, false); focusTile(t.floor, t.x, t.y); showReach(t); }
  const extra = t.conds?.length ? ` (${t.conds.map(c => c.n).join(', ')})` : '';
  banner(`${t.name}'s turn${extra}`); sfx('turn');
  broadcast({ t:'banner', text:`${t.name}'s turn` });
}

// The Dread Zone acts between rounds.
function endOfRound(){
  log(`— Round ${state.combat.round} —`);
  const lairBy = lairCreature();
  if (lairBy) toast(`Initiative 20: ${lairBy.name}'s lair can act (🏰 in the initiative list).`);
  const L = state.combat.floor, D = dreadLevel(), f = state.floors[L];
  // Host Seed: seeded corpses rise
  for (const t of state.tokens.filter(t => t.dead && t.flags.seeded && !t.flags.gone)) seedRises(t);
  // His Gaze: the fallen get back up as his dead
  if (D.raise > 0) for (const t of state.tokens.filter(t => t.floor === L && t.dead && !t.flags.gone && t.kind !== 'pc' && isHost(t) && !hasTag(t, 'seep'))){
    if (Math.random() < D.raise) setTimeout(() => { if (t.dead) infest(t, 'He does not let the dead rest while he is watching. It stands, and it is his.', 'zombie'); }, 900);
  }
  // His Gaze: the Charm
  if (D.charm > 0 && partyOn(L).length) setTimeout(() => runFx({ ...zoneSource(L), name:'The Count\'s voice' }, `party:wis:${D.charm}:0:psychic:charmed:random`), 700);
  // the Whim Die, if the DM wants it every round
  if (state.grasp.auto) setTimeout(() => whimRoll(L, 'The round ends; he is watching'), 600);
  // The land rearranges
  if (D.shift > 0 && Math.random() < D.shift) setTimeout(() => shiftFloor(L, 'Barovia rearranges itself as the round ends'), 400);
}
export function endCombat(){ state.combat = { active:false, order:[], idx:0, round:1, floor:ui.floor }; log('Combat ends.'); clearReach(); const t = ui.selected && tokById(ui.selected); if (t) showReach(t); changed(); }

/* ---------- attacks & saves ---------- */
const nearSeep = (tg, a) => state.tokens.some(o => o.id !== a.id && o.id !== tg.id && !o.dead && o.floor === tg.floor && hasTag(o, 'seep') && cheb(o.x, o.y, tg.x, tg.y) <= 1);
export function doAttack(aId, tId, i, mode = 'normal'){
  const a = tokById(aId), tg = tokById(tId), atk = a?.attacks?.[i]; if (!a || !tg || !atk) return false;
  const slot = spendSpell(a, atk.l, atk.n);
  if (slot === null){ toast(`${a.name} has no spell slot left for ${atk.n}.`); return false; }
  const b = BEST[a.bid], D = dreadLevel();
  let adv = mode === 'adv', dis = mode === 'dis';
  const why = [];
  if (b?.pack && nearSeep(tg, a)){ adv = true; why.push('Pack Tide'); }
  if (hasCond(tg, 'prone') || hasCond(tg, 'restrained') || hasCond(tg, 'paralyzed') || hasCond(tg, 'stunned') || hasCond(tg, 'blinded')){ adv = true; why.push(tg.conds.find(c => ['prone','restrained','paralyzed','stunned','blinded'].includes(c.n)).n); }
  if (hasCond(a, 'blinded') || hasCond(a, 'frightened') || hasCond(a, 'poisoned') || hasCond(a, 'prone')){ dis = true; why.push(`${a.name} ${a.conds.find(c => ['blinded','frightened','poisoned','prone'].includes(c.n)).n}`); }
  const r1 = d(20), r2 = d(20), useBoth = adv !== dis;
  const r = useBoth ? (adv ? Math.max(r1, r2) : Math.min(r1, r2)) : r1;
  const bonus = atk.b + (isHis(a) ? D.hit : 0);
  const tot = r + bonus, crit = r === 20 || (r !== 1 && (hasCond(tg, 'paralyzed')) && cheb(a.x, a.y, tg.x, tg.y) <= 1), hit = crit || (r !== 1 && tot >= tg.ac);
  const rage = atk.m && hasCond(a, 'raging') ? a.rageDmg || 2 : 0;
  let dmg = 0; if (hit) dmg = rollDice(atk.d, crit).total + rage;
  const flair = (atk.f || '{A} strikes at {T}.').replace(/\{A\}/g, a.name).replace(/\{T\}/g, tg.name);
  const lines = [`d20 ${useBoth ? `(${r1}, ${r2} → ${adv ? 'adv' : 'dis'}) ` : ''}<b>${r}</b> ${signed(bonus)} = <b>${tot}</b> vs AC ${tg.ac} — <b>${crit ? 'CRITICAL' : hit ? 'HIT' : r === 1 ? 'FUMBLE' : 'MISS'}</b>`];
  if (why.length) lines.push(`<span class="muted">${esc(why.join(' · '))}</span>`);
  if (slot) lines.push(`<span class="muted">${esc(slot)}</span>`);
  if (hit && rage) lines.push(`<span class="muted">+${rage} rage</span>`);
  if (isHis(a) && D.hit) lines.push(`<span class="muted">+${D.hit} to hit under his Gaze (${state.dread})</span>`);
  if (hit && atk.on && !tg.dead){
    const s = d(20) + saveBonus(tg, atk.on.save), ok = s >= atk.on.dc;
    lines.push(`${esc(tg.name)} — ${atk.on.save.toUpperCase()} save ${s} vs ${atk.on.dc}: <b>${ok ? 'resists' : atk.on.cond}</b>`);
    if (!ok && (atk.on.cond !== 'seeded' || isHost(tg))) addCond(tg, atk.on.cond, atk.on.rounds || 1, a.bid);
  }
  if (hit && atk.latch && !tg.dead && tg.kind !== 'monster'){ tg.flags.latchedBy = a.id; lines.push(`<span class="fam-seep">${esc(a.name)} is latched on.</span>`); }
  sfx(crit ? 'crit' : hit ? 'hit' : 'miss');
  showCard({ kind:crit ? 'crit' : hit ? '' : 'miss', title:`${a.name} → ${tg.name}`, sub:atk.n, flair, lines, big:hit ? `${dmg} ${atk.t}` : '' });
  log(`${a.name} ${atk.n} → ${tg.name}: ${hit ? `${dmg} ${atk.t}${crit ? ' (crit)' : ''}` : 'miss'}`);
  if (hit) applyDamage(tg, dmg, atk.t, a);
  changed(); return true;
}
const PHYS = /bludgeoning|piercing|slashing/;
export function applyDamage(t, n, type = '', by = null){
  if (t.dead || n <= 0) return;
  if (hasCond(t, 'raging') && PHYS.test(String(type))) n = Math.floor(n / 2);   // Rage: resistance
  t.hp = Math.max(0, t.hp - n);
  burst(t.floor, t.x, t.y, '#c0303a');
  if (t.bid === 'seepling' && n >= 5) t.hp = 0;     // Burst Sac
  if (t.hp > 0 && !t.flags.bloodied && t.hp <= t.maxHp / 2){
    t.flags.bloodied = true;
    const hooks = BEST[t.bid]?.hooks?.onBloodied;
    if (hooks){ showCard({ kind:'seep', title:`${t.name} is bloodied`, flair:'Something changes in the way it holds itself.' }); for (const fx of hooks) runFx(t, fx); }
  }
  if (t.hp <= 0) kill(t, type, by);
}
export function heal(t, n){
  t.hp = Math.min(t.maxHp, t.hp + n);
  if (t.hp > 0 && t.dead){ t.dead = false; t.flags.rising = false; }
  if (t.flags.seeded || t.conds?.some(c => c.n === 'seeded')){ t.flags.seeded = false; t.conds = (t.conds || []).filter(c => c.n !== 'seeded'); toast(`${t.name}: the seed is burned out.`); }
  if (t.hp > t.maxHp / 2) t.flags.bloodied = false;
}
export function kill(t, type, by){
  t.dead = true;
  const radiant = /radiant|fire/.test(String(type));
  if (t.kind !== 'monster' || isHost(t)){
    const latcher = t.flags.latchedBy && tokById(t.flags.latchedBy);
    const latched = latcher && !latcher.dead && latcher.floor === t.floor && cheb(latcher.x, latcher.y, t.x, t.y) <= 1;
    const seed = t.conds?.find(c => c.n === 'seeded');
    if ((latched || seed) && !hasTag(t, 'seep') && !radiant){
      const bloom = (seed && BEST[seed.src]?.fam === 'bloom') || (latched && BEST[latcher.bid]?.fam === 'bloom') || hasTag(by || {}, 'bloom');
      t.flags.seeded = true; t.flags.riser = bloom && BEST['bloom-vessel'] ? 'bloom-vessel' : 'husk';
      const what = BEST[t.flags.riser].name;
      showCard({ kind:'seep', title:`${t.name} has been seeded`, flair:bloom ? 'Green-black threads bloom under the skin. Something is already using the bones.' : 'The Seepling stops feeding and starts burrowing.',
        lines:[`<b>Seeded:</b> rises as a ${what} at the start of the next round unless they get magical healing (or Lesser Restoration) first. Fire or radiant on the body stops it.`] });
    }
  }
  if (t.kind !== 'monster'){ log(`${t.name} falls!`); return; }
  const hooks = BEST[t.bid]?.hooks?.onDeath || [];
  if (hooks.includes('unfinished') && !t.flags.rose && !radiant){
    t.flags.rising = true;
    showCard({ kind:'seep', title:`${t.name} drops…`, flair:'…and keeps twitching. Something under the skin is still deciding.', lines:['Unfinished Death: it rises at 1 HP on its next turn unless the corpse takes radiant or fire damage or is destroyed.'] });
    return;
  }
  t.flags.rising = false;
  log(`${t.name} is destroyed.`);
  if (hasTag(t, 'seep')) sfx('burst');
  // killing his creatures catches his interest (once a round)
  if (isHis(t) && state.grasp.stepRound !== `${state.combat.active}:${state.combat.round}`){ state.grasp.stepRound = `${state.combat.active}:${state.combat.round}`; whimStep(1, `${t.name} falls — he noticed`); }
  // All Flesh Returns
  if (hasTag(t, 'seep')) for (const u of state.tokens.filter(u => u.bid === 'undertow' && !u.dead && u.floor === t.floor && cheb(u.x, u.y, t.x, t.y) <= 12)) u.hp = Math.min(u.maxHp, u.hp + 10);
  for (const fx of hooks){
    if (fx === 'unfinished') continue;
    if (fx === 'divide'){
      const r = d(6);
      if (r >= 5){ runFx(t, 'spawn:handswarm:2'); showCard({ kind:'', title:'Endless Division', flair:'The hands fall apart — and the earth answers. More claw up through the floor.', lines:[`d6 = <b>${r}</b>: two more Hand-Swarms.`] }); }
      else toast(`Endless Division d6 = ${r}: the hands stay down… for now.`);
      continue;
    }
    if (fx.startsWith('aoeall')) showCard({ kind:'seep', title:`${t.name} bursts`, flair:'The membrane gives. Everything inside it comes out at once.' });
    runFx(t, fx);
  }
}
function seedRises(t){
  if (t.kind === 'pc'){
    t.flags.gone = true; t.flags.taken = true; t.flags.seeded = false;
    const h = spawnAt(t.flags.riser || 'husk', t.floor, t.x, t.y, true);
    if (h){ h.name = `${t.flags.riser === 'bloom-vessel' ? 'Vessel' : 'Husk'} of ${t.name}`; h.flags.from = t.id; if (state.art[t.id]) state.art[h.id] = state.art[t.id]; }
    const i = state.combat.order.indexOf(t.id); if (i >= 0){ state.combat.order.splice(i, 1); if (i < state.combat.idx) state.combat.idx--; }
    showCard({ kind:'seep', title:`${t.name} stands up`, flair:`It is ${t.name}'s face. It is not ${t.name}.`, lines:['The Seep has taken the body. Restore them from the Tokens tab if the table rules otherwise.'] });
    log(`☣ ${t.name} is taken by the Seep.`);
  } else infest(t, 'The seed has finished growing.', t.flags.riser);
}

/* ---------- the fx language ---------- */
export function spawnAt(bid, L, x, y, quiet){
  if (!BEST[bid]) return null;
  const spot = tokenAt(L, x, y) ? freeTilesNear(L, x, y, 1)[0] : { x, y }; if (!spot) return null;
  const m = makeMonster(bid, L, spot.x, spot.y); state.tokens.push(m);
  if (state.combat.active && state.combat.floor === L) addToInit(m);
  syncTokens(); riseFrom(m);
  if (!quiet) log(`${m.name} emerges.`);
  return m;
}
const partyOn = L => state.tokens.filter(t => t.floor === L && !t.dead && !t.flags.gone && t.kind !== 'monster');
export function spawnWhere(src, where, L){
  const party = partyOn(L);
  if (where === 'party' && party.length){ const p = pick(party); return { x:p.x, y:p.y }; }
  if (where === 'nest'){ const s = randomRoomTile(L, Math.random, r => r.type === 'nest'); if (s) return s; }
  if (where === 'random'){ const s = randomRoomTile(L); if (s) return s; }
  return { x:src.x, y:src.y };
}
// A pseudo-source for effects that come from the floor itself (Shift / Whim tables, traps).
// The Count's own creatures (wolves, bats, his dead, his spawn) are the ones his Gaze strengthens.
export const isHis = t => BEST[t.bid]?.fam === 'barovia';
export function zoneSource(L, at){
  const p = at || pick(partyOn(L)) || { x:state.floors[L].rooms[0].cx, y:state.floors[L].rooms[0].cy };
  return { id:null, name:'Barovia', kind:'monster', floor:L, x:p.x, y:p.y, flags:{} };
}
export function runFx(src, fx, quiet){
  const [kind0, ...p] = String(fx).trim().split(':');
  const kind = kind0.trim(), L = src.floor;
  if (kind === 'spawn'){
    const [bid, rest = '1'] = p, [count, where = 'near'] = rest.split('@');
    if (!BEST[bid]){ toast(`Unknown creature "${bid}"`); return; }
    let n = /d/.test(count) ? rollDice(count).total : +count || 1;
    // Birth a Husk @corpse: take an unclaimed host body if there is one
    if (where === 'corpse'){
      const bodies = state.tokens.filter(t => t.floor === L && t.dead && !t.flags.gone && isHost(t) && !hasTag(t, 'seep') && t.kind !== 'pc');
      while (n > 0 && bodies.length && (bid === 'husk' || bid === 'bloom-vessel')){ infest(bodies.shift(), 'The Seep claims a body.', bid); n--; }
    }
    if (n <= 0) return;
    const at = spawnWhere(src, where, L), spots = freeTilesNear(L, at.x, at.y, n, !tokenAt(L, at.x, at.y));
    for (const s of spots){ const m = makeMonster(bid, L, s.x, s.y); state.tokens.push(m); if (state.combat.active && state.combat.floor === L) addToInit(m); }
    syncTokens();
    for (const s of spots){ const m = tokenAt(L, s.x, s.y); if (m) riseFrom(m); }
    log(`${spots.length} ${BEST[bid].name}${spots.length === 1 ? '' : 's'} emerge${spots.length === 1 ? 's' : ''} near ${src.name}.`);
    if (!quiet) toast(`${spots.length} × ${BEST[bid].name}`);
  }
  else if (kind === 'aoe' || kind === 'aoeall'){
    const [rad, save, dc, dice, type, cond] = p;
    const targets = state.tokens.filter(t => t.floor === L && !t.dead && !t.flags.gone && t.id !== src.id &&
      cheb(t.x, t.y, src.x, src.y) <= +rad && (kind === 'aoeall' || side(t) !== side(src)));
    const base = rollDice(dice).total, lines = [];
    for (const t of targets){
      let dmg = base, ok = false;
      if (save !== 'none'){ const r = d(20) + saveBonus(t, save); ok = r >= +dc; if (ok) dmg = Math.floor(dmg / 2); lines.push(`${esc(t.name)} — ${save.toUpperCase()} save ${r} vs ${dc}: <b>${ok ? 'saved' : 'failed'}</b> → ${dmg}${!ok && cond ? ` + ${cond}` : ''}`); }
      else lines.push(`${esc(t.name)} → <b>${dmg}</b>${cond ? ` + ${cond}` : ''}`);
      if (cond && !ok && CONDITIONS[cond]) addCond(t, cond, 1);
      applyDamage(t, dmg, type, src);
    }
    if (!targets.length) lines.push('No one was close enough.');
    showCard({ kind:'seep', title:`${src.name}: ${type}`, sub:`${dice} ${type}${save !== 'none' ? ` · DC ${dc} ${save.toUpperCase()}` : ''} · ${+rad * 5} ft.`, lines });
    log(`${src.name} area effect: ${targets.length} caught.`);
  }
  else if (kind === 'party' || kind === 'save'){
    // party:<save>:<dc>:<dice>:<type>:<cond|pit|->:<all|random>   save:<save>:<dc>:<cond>[:all|random]
    const [save, dc, dice, type, cond, who] = kind === 'save' ? [p[0], p[1], '0', 'psychic', p[2], p[3] || 'all'] : p;
    let targets = partyOn(L); if (who === 'random' && targets.length) targets = [pick(targets)];
    const base = dice && dice !== '0' ? rollDice(dice).total : 0, lines = [];
    for (const t of targets){
      const r = d(20) + saveBonus(t, save), ok = r >= +dc, dmg = ok ? Math.floor(base / 2) : base;
      lines.push(`${esc(t.name)} — ${String(save).toUpperCase()} ${r} vs ${dc}: <b>${ok ? 'saved' : 'failed'}</b>${dmg ? ` → ${dmg} ${type}` : ''}${!ok && cond && cond !== '-' ? ` + ${cond === 'pit' ? 'dragged down' : cond}` : ''}`);
      if (dmg) applyDamage(t, dmg, type, src);
      if (!ok && cond === 'pit' && !t.dead) setTimeout(() => fall(t), 500);
      else if (!ok && cond && CONDITIONS[cond]) addCond(t, cond, 1);
    }
    if (!targets.length) lines.push('No one is on this floor.');
    if (!quiet) showCard({ kind:'', title:`${String(save).toUpperCase()} save · DC ${dc}`, sub:src.name, lines });
  }
  else if (kind === 'condall'){
    const [tag, cond, rounds] = p, hit = state.tokens.filter(t => t.floor === L && !t.dead && hasTag(t, tag));
    hit.forEach(t => addCond(t, cond, +rounds || 1));
    showCard({ kind:'seep', title:`${hit.length} ${tag} creatures ${cond}`, flair:'Every one of them stops at once, like puppets with the strings cut.' });
  }
  else if (kind === 'heal'){
    if (p[0] === 'seep'){ const n = rollDice(p[1] || '2d10').total; for (const t of state.tokens.filter(t => t.floor === L && !t.dead && hasTag(t, 'seep'))) t.hp = Math.min(t.maxHp, t.hp + n); toast(`The Seep knits itself: +${n} HP`); }
    else if (src.id){ const n = rollDice(p[0] || '1d8').total; heal(src, n); if (!quiet) toast(`${src.name} regains ${n} HP`); }
  }
  else if (kind === 'shift') shiftFloor(L, `${src.name} reorganizes the sector`);
  else if (kind === 'dread+1') setDread(state.dread + 1);
  else if (kind === 'dread-1') setDread(state.dread - 1);
  // whim (grasp is the old name, still read from older custom tables and creatures)
  else if (kind === 'whim+1' || kind === 'grasp+1') whimStep(1, src.name);
  else if (kind === 'whim-1' || kind === 'grasp-1') whimStep(-1, src.name);
  else if ((kind === 'whim' || kind === 'grasp') && p[0] === 'roll') whimRoll(L, `${src.name} amuses him`);
  else if ((kind === 'whim' || kind === 'grasp') && p[0] === 'reset') whimReset();
  else if (kind === 'whisper') sendWhisper(pick(WHISPERS));
  else if (kind === 'alert'){
    const foes = state.tokens.filter(t => t.floor === L && !t.dead && t.kind === 'monster');
    foes.forEach(t => t.flags.alert = true);
    log(`Every creature on ${state.floors[L].name} knows where you are.`);
    if (!quiet) toast(`${foes.length} creatures on this floor are alerted.`);
  }
  else if (kind === 'pit' && src.id) fall(src);
  else if (kind === 'morph'){
    const nb = BEST[p[0]]; if (!nb || !src.id) return;
    const ratio = src.hp / src.maxHp;
    Object.assign(src, { bid:nb.id, name:src.name.startsWith(BEST[src.bid]?.name || '\u0000') ? nb.name + src.name.slice(BEST[src.bid].name.length) : nb.name, ac:nb.ac, maxHp:avgDice(nb.hp), speed:nb.speed, attacks:nb.attacks.map(a => ({ ...a })), size:nb.size || 1, init:nb.init, color:nb.color });
    src.hp = Math.max(1, Math.round(src.maxHp * ratio));
    burst(src.floor, src.x, src.y, '#9cc23c'); log(`It reshapes into ${nb.name}.`);
    showCard({ kind:'seep', title:`${nb.name}`, flair:nb.look });
    syncTokens();
  }
  else if (kind === 'note'){ /* rules text only — useSpecial shows the card */ }
  else if (kind) toast(`Unknown effect "${fx}"`);
}
/* ---------- heroes' spells (from the character creator) ---------- */
export function castSpell(casterId, targetId, i){
  const c = tokById(casterId), tg = tokById(targetId), sp = c?.casts?.[i]; if (!c || !tg || !sp) return false;
  const slot = spendSpell(c, sp.l, sp.n);
  if (slot === null){ toast(`${c.name} has no spell slot left for ${sp.n}.`); return false; }
  const paid = slot ? [`<span class="muted">${esc(slot)}</span>`] : [];
  sfx('roll');
  if (sp.k === 'heal'){
    const n = rollDice(sp.d).total + (sp.healMod || 0);
    heal(tg, n); showCard({ kind:'', title:`${c.name}: ${sp.n}`, sub:`on ${tg.name}`, flair:'Warmth, and the wound closes a little.', lines:paid, big:`+${n} HP` });
    log(`${c.name} casts ${sp.n} on ${tg.name}: +${n} HP.`); changed(); return true;
  }
  if (sp.k === 'auto'){
    const evil = sp.smite && (hasTag(tg, 'undead') || /fiend|undead/i.test(BEST[tg.bid]?.type || ''));
    const n = rollDice(sp.d).total + (evil ? d(8) : 0); showCard({ kind:'', title:`${c.name}: ${sp.n}`, sub:`on ${tg.name}${evil ? ' · +1d8 against the undead' : ''}`, lines:paid, big:`${n} ${sp.ty}` });
    log(`${c.name} casts ${sp.n} on ${tg.name}: ${n} ${sp.ty}.`); applyDamage(tg, n, sp.ty, c); changed(); return true;
  }
  if (sp.k === 'buff' || sp.k === 'util'){
    showCard({ kind:'', title:`${c.name}: ${sp.n}`, sub:tg.id === c.id ? 'on themself' : `on ${tg.name}`, lines:[...(sp.note ? [esc(sp.note)] : []), ...paid, '<span class="muted">The DM rules how it plays out.</span>'] });
    if (sp.n === 'Lesser Restoration' || sp.n === 'Greater Restoration'){ tg.conds = (tg.conds || []).filter(x => !['blinded', 'paralyzed', 'poisoned', 'seeded'].includes(x.n)); if (tg.flags.seeded) heal(tg, 0); }
    log(`${c.name} casts ${sp.n}${tg.id === c.id ? '' : ` on ${tg.name}`}.`); changed(); return true;
  }
  const targets = sp.rad ? state.tokens.filter(t => t.floor === tg.floor && !t.dead && !t.flags.gone && t.id !== c.id && cheb(t.x, t.y, tg.x, tg.y) <= sp.rad) : [tg];
  const base = sp.d ? rollDice(sp.d).total : 0, lines = [];
  for (const t of targets){
    const r = d(20) + saveBonus(t, sp.sv), ok = r >= sp.dc, dmg = base ? (ok ? (sp.half ? Math.floor(base / 2) : 0) : base) : 0;
    lines.push(`${esc(t.name)} — ${String(sp.sv).toUpperCase()} ${r} vs ${sp.dc}: <b>${ok ? 'saved' : 'failed'}</b>${dmg ? ` → ${dmg} ${sp.ty}` : ''}${!ok && sp.cond ? ` + ${sp.cond}` : ''}`);
    if (!ok && sp.cond && CONDITIONS[sp.cond]) addCond(t, sp.cond, 1, null);
    if (dmg) applyDamage(t, dmg, sp.ty, c);
  }
  if (/thunder|fire/.test(sp.ty || '') && sp.rad) makeNoise(tg.floor, tg.x, tg.y, 2, sp.n);
  showCard({ kind:'', title:`${c.name}: ${sp.n}`, sub:`DC ${sp.dc} ${String(sp.sv).toUpperCase()}${sp.rad ? ` · ${sp.rad * 5} ft. around ${tg.name}` : ` · ${tg.name}`}${base ? ` · ${sp.d} ${sp.ty}` : ''}`, lines:[...lines, ...paid] });
  log(`${c.name} casts ${sp.n}: ${targets.length} caught.`);
  changed(); return true;
}

/* ---------- legendary & lair actions ---------- */
export const legendOf = t => { const b = BEST[t?.bid]; if (!b) return null; const d = LEGENDARY[b.id] || {}; const o = { legendary:b.legendary || d.legendary, lair:b.lair || d.lair, resist:b.resist ?? d.resist }; return o.legendary || o.lair || o.resist ? o : null; };
export const legendLeft = t => t.legend ?? legendOf(t)?.legendary?.n ?? 0;
export const resistLeft = t => t.lres ?? legendOf(t)?.resist ?? 0;
// Pay for a legendary action (attacks are paid for once they land on a target — see ui/input.js).
export function payLegend(t, i){
  const act = legendOf(t)?.legendary?.acts[i]; if (!act) return false;
  if (legendLeft(t) < (act.cost || 1)){ toast(`${t.name} has ${legendLeft(t)} legendary action${legendLeft(t) === 1 ? '' : 's'} left this round.`); return false; }
  t.legend = legendLeft(t) - (act.cost || 1); return true;
}
export function useLegendary(t, i){
  const act = legendOf(t)?.legendary?.acts[i]; if (!act || act.atk != null || !payLegend(t, i)) return;
  showCard({ kind:'', title:`${t.name}: ${act.n}`, sub:`Legendary action${act.cost > 1 ? ` (costs ${act.cost})` : ''} · ${t.legend} left`, flair:act.f || '' });
  if (act.fx && act.fx !== 'note') runFx(t, act.fx);
  log(`${t.name} — legendary: ${act.n}.`); changed();
}
export function useResistance(t){
  if (resistLeft(t) <= 0){ toast(`${t.name} has no Legendary Resistance left today.`); return; }
  t.lres = resistLeft(t) - 1;
  showCard({ kind:'', title:`${t.name} refuses to fail`, sub:`Legendary Resistance · ${t.lres} left today`, flair:'The spell takes hold — and then simply doesn\'t.' });
  log(`${t.name} uses Legendary Resistance.`); changed();
}
// The creature whose lair this is, if it is in the current fight and its lair hasn't acted this round.
export function lairCreature(){
  const c = state.combat; if (!c.active || c.lairRound === c.round) return null;
  return c.order.map(tokById).find(t => t && !t.dead && !t.flags.gone && t.floor === c.floor && legendOf(t)?.lair?.length) || null;
}
export function lairAction(){
  const t = lairCreature(); if (!t) return;
  const list = legendOf(t).lair, opts = list.filter(a => a.n !== state.combat.lairLast), act = pick(opts.length ? opts : list);
  state.combat.lairRound = state.combat.round; state.combat.lairLast = act.n;
  showCard({ kind:'seep', title:`Initiative 20 — ${act.n}`, sub:`${t.name}'s lair`, flair:act.f || '' });
  if (act.fx && act.fx !== 'note') runFx({ ...t, name:`${t.name}'s lair` }, act.fx);
  log(`🏰 Lair action: ${act.n}.`); changed();
}

export function useSpecial(t, s){
  if (/toll|bell/i.test(s.n) || s.fx === 'dread+1') sfx('toll');
  if (s.f) showCard({ kind:'seep', title:`${t.name}: ${s.n}`, flair:s.f });
  runFx(t, s.fx); changed();
}
export function infest(t, why, as = 'husk'){
  const nb = BEST[as] || BEST.husk, base = t.name.replace(/^(Husk|Vessel) of |^Risen /, ''), his = nb.fam === 'barovia';
  Object.assign(t, { kind:'monster', bid:nb.id, name:his ? `Risen ${base}` : `${nb.id === 'husk' ? 'Husk' : 'Vessel'} of ${base}`, color:nb.color, ac:nb.ac, maxHp:avgDice(nb.hp), speed:nb.speed,
    attacks:nb.attacks.map(a => ({ ...a })), dead:false, flags:{}, conds:[], size:1, init:nb.init });
  t.hp = t.maxHp;
  showCard({ kind:his ? '' : 'seep', title:his ? 'The dead are his' : 'The Seep takes the body', flair:why || `Grey-green threads stitch through what used to be ${base}. It stands.` });
  if (state.combat.active && state.combat.floor === t.floor) addToInit(t);
  syncTokens(); riseFrom(t); changed();
}
export function removeToken(id){
  const i = state.combat.order.indexOf(id);
  if (i >= 0){ state.combat.order.splice(i, 1); if (i < state.combat.idx) state.combat.idx--; if (state.combat.idx >= state.combat.order.length) state.combat.idx = 0; }
  state.tokens = state.tokens.filter(t => t.id !== id);
  for (const k in state.seats) if (state.seats[k] === id) delete state.seats[k];
  if (ui.selected === id){ ui.selected = null; clearReach(); }
  changed();
}
export function restoreTaken(t){ t.flags.gone = false; t.flags.taken = false; t.dead = false; t.hp = Math.max(1, t.hp); updateVision(); rebuildFog(t.floor); changed(); }
