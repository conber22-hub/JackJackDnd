/* COMBAT — initiative, attacks, damage, death hooks, the fx language, and the Dread's round-end tide. */
import { state, ui, tokById, tokenAt, side, makeMonster, log, dreadLevel, isDM } from '../engine/state.js';
import { freeTilesNear, randomRoomTile, updateVision, spotFor, seenNow } from '../engine/grid.js';
import { BEST, hasTag, isHost } from '../data/bestiary.js';
import { CONDITIONS } from '../data/dread.js';
import { d, rollDice, avgDice, esc, cheb, pick, signed } from '../util/core.js';
import { tween, ease, focusTile } from '../render/scene.js';
import { syncTokens, tokenViews, actOn } from '../render/minis.js';
import { burst, showReach, clearReach, flashArea } from '../render/effects.js';
import { showCard, toast, banner, sendWhisper } from '../ui/hud.js';
import { WHISPERS } from '../data/dread.js';
import { sfx } from '../audio/sound.js';
import { currentTurn, addCond, removeCond, tickConds, hasCond, saveBonus, stopped, startConc, endConc, defend, defNote, immuneTo, saveRoll, saveTxt, timingFor, condPhase, endOn, moveAllowance } from './rules.js';
import { SPELL_EFFECTS } from '../data/spell-effects.js';
import { witnessed, stepFolkNow } from './folk.js';
import { attackMods } from '../engine/conditions.js';
import { diceAt, upRays, concDC } from '../engine/spellcast.js';
import { SPELLS } from '../data/srd.js';
import { freshTurn, clearOpportunities, closeInMove, pausedMover, turnAction } from './moves.js';
import { planTurn, resistWorthIt } from '../engine/tactics.js';
import { court as getCourt } from './court.js';
import { doMove, nearestOpen } from './actions.js';
import { rangeCheck, coverOf, areaOf, areaSquares, caughtIn, coverFromOrigin, spellReach } from '../engine/targeting.js';
import { tokGap as gapTo, bestMelee, planToward } from '../engine/movement.js';
import { fightCandidates, rollOrder, fightWon, fightXp } from '../engine/fight.js';
import { shiftFloor } from './shift.js';
import { whimRoll, whimStep, whimReset } from './whim.js';
import { changed, broadcast } from './session.js';
import { goFloor, setDread, fall, rebuildFog } from './actions.js';
import { spendSpell } from './resources.js';
import { LEGENDARY } from '../data/legendary.js';
import { MONSTER_PLAY } from '../data/monster-play.js';
import { makeNoise } from './noise.js';
import { nemesisDamage, nemesisHolds, nemesisRegen, nemesisFalls, nemesisSurvives } from './court.js';
import { toPlayers } from './outbox.js';
import { alarmAt, garrisonCalm } from './garrison.js';

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
/* Start a fight. ids: who's in it (default: the party on this floor and the creatures that are part of it —
   engine/fight.js); group: identical creatures share one roll; surprise: 'party' or 'foes' roll at disadvantage. */
export function rollInitiative({ ids = null, group = true, surprise = 'none', fixed = {} } = {}){
  const L = ui.floor, f = state.floors[L];
  const list = ids ? ids.map(tokById).filter(t => t && t.floor === L && !t.dead && !t.flags.gone)
    : fightCandidates(state.tokens, L, f.W, seenNow[L]).filter(c => c.in).map(c => c.t);
  if (!list.length){ toast('No one on this floor.'); return; }
  const order = rollOrder(list, { group, surprise, fixed, d20:() => d(20) });
  for (const o of order){ const t = tokById(o.id); t.initRoll = o.roll; freshTurn(t); delete t.legend; delete t.spent; }   // a new fight: legendary actions full, breath weapons ready
  state.combat = { active:true, order:order.map(o => o.id), idx:0, round:1, floor:L, group, surprise };
  { const h = state.tokens.find(t => t.floor === L && t.kind !== 'monster' && !t.dead); if (h) witnessed(L, { kind:'fight', x:h.x, y:h.y }); }   // a fight breaks out: the folk see it
  log(`⚔ Initiative on ${f.name}: ${list.map(t => `${t.name} ${t.initRoll}`).join(', ')}`, true);
  log(`⚔ Roll for initiative!${surprise === 'party' ? ' The party is caught by surprise.' : surprise === 'foes' ? ' The party has the drop on them.' : ''}`);
  const pts = list.filter(t => t.kind !== 'monster').length ? list.filter(t => t.kind !== 'monster') : list;   // the noise is where the party is
  const mid = pts.reduce((m, t) => ({ x:m.x + t.x / pts.length, y:m.y + t.y / pts.length }), { x:0, y:0 });
  makeNoise(L, Math.round(mid.x), Math.round(mid.y), 1, 'Steel and shouting');
  alarmAt(L, Math.round(mid.x), Math.round(mid.y));   // a stocked site hears it (game/garrison.js)
  startTurn(); changed();
}
// Take a creature out of the fight (fled, made peace, the DM's call). Its place in the order closes up.
export function leaveFight(id){
  const c = state.combat, k = c.order.indexOf(id); if (k < 0) return;
  const wasTurn = k === c.idx;
  c.order.splice(k, 1);
  if (k < c.idx) c.idx--;
  if (!c.order.length){ endCombat(); return; }
  if (c.idx >= c.order.length){ c.idx = 0; c.round++; }
  if (wasTurn) startTurn();
  changed();
}
// Delay: the creature whose turn it is steps back one place; the next one goes now.
export function delayTurn(){
  const c = state.combat; if (!c.active || c.order.length < 2) return;
  const k = c.idx, j = (k + 1) % c.order.length; if (j === 0) return;   // already last this round
  [c.order[k], c.order[j]] = [c.order[j], c.order[k]];
  const t = tokById(c.order[j]); if (t) log(`${t.name} holds back.`);
  startTurn(); changed();
}
// Once every foe in the fight is down: a card, the XP, and End the fight goes gold in the initiative bar.
export function checkVictory(){
  const c = state.combat; if (!c.active || c.won || !fightWon(c.order, tokById)) return;
  c.won = true;
  const xp = fightXp(c.order, tokById, BEST), heroes = c.order.map(tokById).filter(t => t?.kind === 'pc').length || 1;
  showCard({ kind:'crit', title:'The fight is won', sub:`Round ${c.round}`, lines:[xp ? `<b>${xp} XP</b> — ${Math.floor(xp / heroes)} each for ${heroes} hero${heroes === 1 ? '' : 'es'}` : 'Nothing worth counting.'], flair:'For now. Somewhere below, something heard all of that.' });
  log(`⚔ The fight is won (${xp} XP).`); changed();
}
/* A monster takes its turn (the DM's 🤖): hits whoever it can reach — the most hurt first; else shoots one in
   range; else closes in and, if that brings a hero within reach, hits them. Specials stay the DM's to use. */
/* A monster's turn on its own (the DM's ⚡ Auto): it thinks first (engine/tactics.js, Codex's planTurn: breathe on
   three, not one beside a friend; go for the wounded and the concentrating; a court servant keeps away from what
   burned it; cowards run; archers keep their distance; the Count's wolves carry the fallen off), the DM sees why,
   and then it does it through the app's own actions (walks with opportunity attacks, spells with their saves).
   Anything it can't carry out falls back to the old way: close in, and swing at the most hurt. */
export function autoTurn(t){
  if (!t || t.dead || stopped(t)) return;
  const sameFloor = o => o.floor === t.floor && !o.flags.gone;
  const think = () => planTurn(t, { allies:state.tokens.filter(o => sameFloor(o) && o.id !== t.id && side(o) === side(t)), foes:state.tokens.filter(o => sameFloor(o) && side(o) !== side(t)),
    floor:state.floors[t.floor], round:state.combat.round, court:getCourt() }, Math.random);
  // after a walk (and any opportunity attack it provoked): then
  const afterWalk = then => { const until = Date.now() + 20000; const wait = () => { if (tokenViews.get(t.id)?.anim || pausedMover(t.id)){ if (Date.now() < until) setTimeout(wait, 150); return; } if (!t.dead && currentTurn()?.id === t.id) then(); }; setTimeout(wait, 200); };
  const act = (p, second = false) => {
    if (!second) toast(`🧠 ${t.name}: ${p.why}`);
    if (p.kind === 'cast') return castSpell(t.id, null, p.i, p.aim) !== false || legacy(second);
    if (p.kind === 'attack'){ const tg = tokById(p.target); if (!tg || tg.dead || tg.hp <= 0) return legacy(second); doAttack(t.id, p.target, p.i); return true; }
    if (p.kind === 'dodge'){ turnAction(t, 'dodge'); return true; }
    if (p.kind === 'hold') return true;
    if (second) return false;   // after its move it may still strike, never walk again
    if (['move', 'flee', 'drag'].includes(p.kind) && p.to){
      const path = planToward(t, p.to.x, p.to.y, moveAllowance(t)), end = path?.at(-1);
      if (!end || end.x !== p.to.x || end.y !== p.to.y || !doMove(t, p.to.x, p.to.y, { path })) return legacy();
      const body = p.kind === 'drag' && tokById(p.target);
      afterWalk(() => { if (body) dragBody(t, body); else if (p.kind === 'move'){ const q = think(); if (q.kind === 'attack' || q.kind === 'cast') act(q, true); } });
      return true;
    }
    return legacy();
  };
  // the old way: the best melee or ranged attack at the most hurt in reach, else close in and try again
  const legacy = (second = false) => {
    const foes = state.tokens.filter(o => o.floor === t.floor && o.kind !== 'monster' && !o.dead && !o.flags.gone);
    const pickIn = (list, i) => list.filter(o => rangeCheck(t, o, t.attacks[i]).ok && coverOf(t, o).cover !== 'total').sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const strike = () => {
      const mi = bestMelee(t), mt = mi !== null && pickIn(foes, mi);
      if (mt){ doAttack(t.id, mt.id, mi); return true; }
      const ri = t.attacks.findIndex(a => !a.m && /bow|sling|crossbow|throw|spit|bolt|ray|dart|javelin/i.test(a.n));
      const rt = ri >= 0 && pickIn(foes, ri);
      if (rt){ doAttack(t.id, rt.id, ri); return true; }
      return false;
    };
    if (strike() || second) return true;
    if (!closeInMove(t)) return false;
    afterWalk(() => { if (!strike()) toast(`${t.name} closes in, but can't reach anyone yet.`); });
    return true;
  };
  act(think());
}
// The Count's wolves carry a fallen hero off: the body comes along to a square beside the wolf.
function dragBody(w, body){
  if (body.floor !== w.floor || !(body.dead || body.hp <= 0)) return;
  const at = nearestOpen(w.floor, w.x, w.y);   // (an open square, nobody on it)
  if (!at) return;
  body.x = at.x; body.y = at.y; syncTokens();
  showCard({ kind:'seep', title:`${w.name} drags ${body.name} away`, flair:'Jaws closed on a collar, and the body slides over the stones after it.' });
  log(`${w.name} drags ${body.name} away.`); changed();
}
export function nextTurn(){
  if (!state.combat.active) return;
  clearOpportunities();
  turnCard(currentTurn(), 'end');   // saves repeated to shake off Hold Person and the like; holds that run out now
  stepFolkNow(state.combat.floor ?? ui.floor, { fight:true });   // the valley's folk run for home, a step a turn
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
// The saves and run-outs of a turn's start or end (rules.js condPhase), on one card.
function turnCard(t, phase){
  const lines = condPhase(t, phase);
  if (lines.length) showCard({ kind:'', title:`${phase === 'end' ? 'End' : 'Start'} of ${t.name}'s turn`, lines });
}
export function startTurn(){
  const t = currentTurn(); if (!t) return;
  freshTurn(t);
  turnCard(t, 'start');
  const lg = legendOf(t); if (lg?.legendary) t.legend = lg.legendary.n;   // legendary actions come back
  // a spent breath weapon (and the like) comes back on a d6 roll of its Recharge number or more
  for (const n of Object.keys(t.spent || {})){
    const sp = t.casts?.find(s => s.n === n), r = d(6);
    if (!sp?.recharge || r >= sp.recharge){ delete t.spent[n]; if (sp) log(`${t.name}'s ${n} is back (d6: ${r}).`, true); }
    else log(`${t.name}'s ${n} is still spent (d6: ${r}, needs ${sp.recharge}).`, true);
  }
  if (t.flags.rising){
    t.dead = false; t.hp = 1; t.flags.rising = false; t.flags.rose = true;
    showCard({ kind:'seep', title:`${t.name} gets back up`, flair:'The tendrils pull the body upright by the collarbones. It was never finished dying.', lines:['Unfinished Death — it returns at 1 HP. Radiant or fire damage keeps it down.'] });
    syncTokens(); burst(t.floor, t.x, t.y, '#9cc23c');
  }
  const b = BEST[t.bid], D = dreadLevel();
  if (!t.dead && isHis(t) && D.regen && t.hp < t.maxHp){ t.hp = Math.min(t.maxHp, t.hp + D.regen); }
  if (!t.dead && t.nem && t.hp < t.maxHp){ const r = nemesisRegen(t); if (r) t.hp = Math.min(t.maxHp, t.hp + r); }   // His favour
  if (b?.hooks?.onTurnStart && !t.dead) for (const fx of b.hooks.onTurnStart) runFx(t, fx, true);
  if (isDM()){ ui.selected = t.id; if (t.floor !== ui.floor) goFloor(t.floor, false); focusTile(t.floor, t.x, t.y); showReach(t); }
  const extra = t.conds?.length ? ` (${t.conds.map(c => c.n).join(', ')})` : '';
  banner(`${t.name}'s turn${extra}`); sfx('turn');
  toPlayers({ t:'banner', text:t.kind === 'monster' && !partySees(t) ? 'Something unseen acts…' : `${t.name}'s turn` }, 'turns');
}

// A spell from the library by name (the hero's cast or attack carries the name).
const spellInfo = n => SPELLS.find(s => s.n === String(n || '').replace(/ \(×.*\)$/, '')) || null;

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
export function endCombat(){ for (const t of state.combat.order.map(tokById)) if (t?.nem && !t.dead) nemesisSurvives(t);   // it beat them, or got away
  garrisonCalm(state.combat.floor ?? ui.floor);   // the site settles, warier (game/garrison.js)
  clearOpportunities(); state.tokens.forEach(freshTurn); state.combat = { active:false, order:[], idx:0, round:1, floor:ui.floor }; log('Combat ends.'); clearReach(); const t = ui.selected && tokById(ui.selected); if (t) showReach(t); changed(); }

// A figure's swing, spell or flinch, on every screen (only forged figures move; the rest ignore it).
function animate(id, kind, target){ actOn(id, kind, target); broadcast({ t:'act', id, kind, target }); }

/* ---------- attacks & saves ---------- */
const nearSeep = (tg, a) => state.tokens.some(o => o.id !== a.id && o.id !== tg.id && !o.dead && o.floor === tg.floor && hasTag(o, 'seep') && cheb(o.x, o.y, tg.x, tg.y) <= 1);
// d20: a die rolled at the table (real dice, game/night.js) — used as the attack's d20 (the first, for rays).
export function doAttack(aId, tId, i, mode = 'normal', { d20 = null, at = null } = {}){
  const a = tokById(aId), tg = tokById(tId), atk0 = a?.attacks?.[i]; if (!a || !tg || !atk0) return false;
  const reuse = !!atk0.again && a.sustain === (atk0.sn || atk0.n);   // a sustained spell, used again: not a fresh casting
  const slot = spendSpell(a, atk0.l, atk0.sn || atk0.n, !!atk0.again, at);
  if (slot === null){ toast(`${a.name} has no spell slot left for ${atk0.n}.`); return false; }
  // a spell attack cast with a higher slot: more dice, or more rays (engine/spellcast.js); some need Concentration
  const lib = atk0.l ? spellInfo(atk0.sn || atk0.n) : null, level = !atk0.l ? 0 : slot === '' ? Math.max(atk0.l, at || 0) : (a.castAt || atk0.l), extra = level - (atk0.l || 0);
  const atk = extra > 0 ? { ...atk0, ...(upRays(lib) ? { rays:(atk0.rays || 1) + extra } : { d:diceAt({ ...lib, d:atk0.d }, level) }) } : atk0;
  if (lib?.conc && !reuse) startConc(a, lib.n);
  const b = BEST[a.bid], D = dreadLevel();
  let adv = mode === 'adv', dis = mode === 'dis';
  const why = [];
  if (b?.pack && nearSeep(tg, a)){ adv = true; why.push('Pack Tide'); }
  // range and cover (engine/targeting.js): long range and an enemy at the archer's elbow mean disadvantage;
  // cover adds to the target's AC. Beyond reach or behind total cover the DM can still roll it (their call).
  const rc = a.id === tg.id ? { ok:true, d:0, kind:'melee' } : rangeCheck(a, tg, atk), cov = a.id === tg.id ? { cover:'none', ac:0 } : coverOf(a, tg);
  if (!rc.ok) why.push(`${rc.why} — the DM's call`);
  if (cov.cover === 'total') why.push('behind total cover — the DM\'s call');
  if (rc.long){ dis = true; why.push('long range'); }
  if (rc.kind === 'ranged' && rc.close){ dis = true; why.push(`a foe beside ${a.name}`); }
  // what their conditions do (engine/conditions.js, the 2024 rules): prone, restrained, blinded, invisible, unconscious…
  // on either side; a paralysed or unconscious target hit from 5 ft. is a critical; exhaustion takes 2 a level
  const cm = a.id === tg.id ? { adv:[], dis:[], autoCrit:false, penalty:0 } : attackMods({ attacker:a, target:tg, melee:rc.kind !== 'ranged', within5:rc.d <= 1,
    attackerSeen:!hasCond(a, 'invisible'), targetSeen:!hasCond(tg, 'invisible') });
  if (cm.adv.length){ adv = true; why.push(...cm.adv); }
  if (cm.dis.length){ dis = true; why.push(...cm.dis); }
  if (cm.penalty) why.push(`exhaustion −${cm.penalty}`);
  if (tg.dodge && !stopped(tg) && a.id !== tg.id){ dis = true; why.push(`${tg.name} is dodging`); }
  a.lastMove = null;   // after an attack there's no taking the move back
  const bonus = atk.b + (isHis(a) ? D.hit : 0) - cm.penalty, useBoth = adv !== dis, ac = tg.ac + cov.ac;
  const rage = atk.m && hasCond(a, 'raging') ? a.rageDmg || 2 : 0;
  // one roll per ray / beam (Scorching Ray, Eldritch Blast); everything else is one roll
  const rolls = [], lines = [];
  for (let k = 0; k < (atk.rays || 1); k++){
    const real = k === 0 && d20 >= 1 && d20 <= 20 ? Math.round(d20) : null;
    const r1 = d(20), r2 = d(20), r = real ?? (useBoth ? (adv ? Math.max(r1, r2) : Math.min(r1, r2)) : r1);
    const tot = r + bonus, hit = r === 20 || (r !== 1 && tot >= ac), crit = r === 20 || (hit && cm.autoCrit);   // (a hit first: helpless isn't unmissable)
    const raw = hit ? rollDice(atk.d, crit).total + rage : 0, df = defend(tg, raw, atk.t), dmg = df.n;   // its resistances, immunities, Rage
    rolls.push({ hit, crit, dmg, raw, why:df.why, r });
    lines.push(`${atk.rays > 1 ? `#${k + 1} · ` : ''}${real ? '🎲 at the table ' : `d20 ${useBoth ? `(${r1}, ${r2} → ${adv ? 'adv' : 'dis'}) ` : ''}`}<b>${r}</b> ${signed(bonus)} = <b>${tot}</b> vs AC ${ac}${cov.ac ? ` <span class="muted">(${cov.cover === 'half' ? 'half' : '¾'} cover)</span>` : ''} — <b>${crit ? 'CRITICAL' : hit ? 'HIT' : r === 1 ? 'FUMBLE' : 'MISS'}</b>${atk.rays > 1 && hit ? ` → ${dmg}` : ''}`);
  }
  const hits = rolls.filter(x => x.hit), crit = rolls.some(x => x.crit), total = hits.reduce((n, x) => n + x.dmg, 0);
  const die = { n:rolls[0]?.r, crit:rolls[0]?.crit, hit:rolls[0]?.hit };   // the TV spins a d20 to it (ui/screen.js)
  const flair = (atk.f || '{A} strikes at {T}.').replace(/\{A\}/g, a.name).replace(/\{T\}/g, tg.name);
  if (why.length) lines.push(`<span class="muted">${esc(why.join(' · '))}</span>`);
  if (slot) lines.push(`<span class="muted">${esc(slot)}${extra > 0 ? ` · cast at level ${level}` : ''}</span>`);
  if (lib?.conc) lines.push(`<span class="muted">🌀 ${esc(a.name)} is concentrating on it</span>`);
  if (hits.length && rage) lines.push(`<span class="muted">+${rage} rage</span>`);
  const df = hits.find(x => x.why);
  if (df) lines.push(`<span class="muted">${esc(tg.name)} is ${df.why} to ${esc(atk.t)}${hits.length === 1 && df.raw !== df.dmg ? `: ${df.raw} → ${df.dmg}` : ''}</span>`);
  if (isHis(a) && D.hit) lines.push(`<span class="muted">+${D.hit} to hit under his Gaze (${state.dread})</span>`);
  if (hits.length && atk.on && !tg.dead){
    const S = saveRoll(tg, atk.on.save), ok = S.tot >= atk.on.dc;
    lines.push(`${esc(tg.name)} — ${atk.on.save.toUpperCase()} save ${saveTxt(S)} vs ${atk.on.dc}: <b>${ok ? 'resists' : immuneTo(tg, atk.on.cond) ? `immune to ${atk.on.cond}` : atk.on.cond}</b>`);
    if (!ok && (atk.on.cond !== 'seeded' || isHost(tg))) addCond(tg, atk.on.cond, atk.on.rounds || 1, a.bid);
  }
  // a spell attack that leaves a condition on a hit, no save (Ray of Sickness: poisoned until the end of your next turn)
  const ef = lib && SPELL_EFFECTS[lib.n];
  if (hits.length && ef?.cond && !ef.save && !tg.dead){ const tm = timingFor(ef, { src:a.id }); if (addCond(tg, ef.cond, tm.rounds, null, false, tm.extra)) lines.push(`${esc(tg.name)} is <b>${ef.cond}</b>`); else lines.push(`<span class="muted">${esc(tg.name)} is immune to ${ef.cond}</span>`); }
  endOn(a, 'attack');   // Invisibility: it ends when you attack
  if (hits.length && atk.latch && !tg.dead && tg.kind !== 'monster'){ tg.flags.latchedBy = a.id; lines.push(`<span class="fam-seep">${esc(a.name)} is latched on.</span>`); }
  sfx(crit ? 'crit' : hits.length ? 'hit' : 'miss');
  animate(a.id, 'attack', tg.id); if (hits.length) setTimeout(() => animate(tg.id, 'hit', a.id), 330);
  showCard({ kind:crit ? 'crit' : hits.length ? '' : 'miss', title:`${a.name} → ${tg.name}`, sub:atk.n, flair, lines, big:hits.length ? `${total} ${atk.t}` : '', die });
  log(`${a.name} ${atk.n} → ${tg.name}: ${hits.length ? `${total} ${atk.t}${crit ? ' (crit)' : ''}` : 'miss'}`);
  for (const x of hits) applyDamage(tg, x.dmg, atk.t, a, true);   // already through its defences (above)
  changed(); return true;
}
const GIVES = new Set(['Invisibility', 'Greater Invisibility']);
// ' + poisoned', or that it shrugs it off (a skeleton can't be poisoned)
const condTxt = (t, cond) => immuneTo(t, cond) ? ` · <span class="muted">immune to ${cond}</span>` : ` + ${cond}`;
/* Damage to one creature, after its resistances, immunities and vulnerabilities (rules.js defend: its stat block, plus Rage).
   defended: the caller already ran it through defend() so its card could show the real number. → the damage dealt */
export function applyDamage(t, n, type = '', by = null, defended = false){
  if (t.dead || n <= 0) return 0;
  if (!defended) n = defend(t, n, type).n;
  if (n <= 0) return 0;
  if (t.nem) n = nemesisDamage(t, n, type);   // one of the Count's court: its weakness, its scars (game/court.js)
  t.hp = Math.max(0, t.hp - n);
  burst(t.floor, t.x, t.y, '#c0303a');
  if (t.bid === 'seepling' && n >= 5) t.hp = 0;     // Burst Sac
  if (t.hp > 0 && !t.flags.bloodied && t.hp <= t.maxHp / 2){
    t.flags.bloodied = true;
    const hooks = BEST[t.bid]?.hooks?.onBloodied;
    if (hooks){ showCard({ kind:'seep', title:`${t.name} is bloodied`, flair:'Something changes in the way it holds itself.' }); for (const fx of hooks) runFx(t, fx); }
  }
  if (t.hp <= 0 && !(t.nem && nemesisHolds(t))){ kill(t, type, by); setTimeout(checkVictory, 600); }
  const dealt = n;
  // being hurt ends some holds (Charm Person: hurt by the caster or their friends); hurting someone ends Invisibility
  const byTok = typeof by === 'string' ? tokById(by) : by;
  for (const c of [...(t.conds || [])]){
    const src = c.by && tokById(c.by);
    if (c.ends?.includes('damage') || (c.ends?.includes('damageByCasterOrAlly') && byTok && src && side(byTok) === side(src))){ removeCond(t, c.n); log(`${t.name} is no longer ${c.n}.`); }
  }
  if (byTok?.id) endOn(byTok, 'dealDamage');
  if (t.conc){
    if (t.dead) endConc(t, 'goes down');
    else {   // a Constitution save to keep hold of it: DC 10 or half the damage (2024 rules)
      const dc = concDC(n), S = saveRoll(t, 'con'), r = S.r, tot = S.tot, held = tot >= dc;
      showCard({ kind:held ? '' : 'miss', title:`${t.name} ${held ? 'holds on' : 'loses concentration'}`, sub:`${t.conc.n} · Constitution save DC ${dc}`, lines:[`d20 <b>${r}</b> ${signed(tot - r)} = <b>${tot}</b>`] });
      if (!held) endConc(t, 'loses concentration');
    }
  }
  return dealt;
}
/* Exhaustion (2024): a level at a time, up to 6, which kills. Each level is -2 on every d20 test and 5 ft. less speed
   (engine/conditions.js); a long rest takes one away. */
export function exhaust(t, by = 1){
  const was = t.exhaustion || 0, now = Math.max(0, Math.min(6, was + by));
  if (now === was) return;
  if (now) t.exhaustion = now; else delete t.exhaustion;
  log(`${t.name}: exhaustion ${now}${now === 6 ? ' — it kills' : ''}.`);
  if (now === 6 && !t.dead){ t.hp = 0; kill(t, 'exhaustion'); setTimeout(checkVictory, 600); }
}
export function heal(t, n){
  t.hp = Math.min(t.maxHp, t.hp + n);
  if (t.hp > 0 && t.dead){ t.dead = false; t.flags.rising = false; }
  if (t.flags.seeded || t.conds?.some(c => c.n === 'seeded')){ t.flags.seeded = false; t.conds = (t.conds || []).filter(c => c.n !== 'seeded'); toast(`${t.name}: the seed is burned out.`); }
  if (t.hp > t.maxHp / 2) t.flags.bloodied = false;
}
export function kill(t, type, by){
  // the folk see a death; the Count's eyes among them tell his court who did it, and with what (game/folk.js)
  const killer = typeof by === 'string' ? tokById(by) : by;
  if (killer && killer.kind !== 'monster') witnessed(t.floor, { kind:'kill', x:t.x, y:t.y, by:killer.name, type:String(type || '').split(/[ ,]/)[0] });
  t.dead = true;
  t.conds = (t.conds || []).filter(c => c.n !== 'raging'); delete t.sustain;   // rage and sustained spells end when you drop
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
  if (t.nem) nemesisFalls(t, type, by);
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
// Can any hero see any square of this creature's space? (the host's live sight lines)
export const partySees = t => { const f = state.floors[t.floor]; if (!f) return false; for (let dy = 0; dy < (t.size || 1); dy++) for (let dx = 0; dx < (t.size || 1); dx++) if (seenNow[t.floor]?.has((t.y + dy) * f.W + t.x + dx)) return true; return false; };
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
    const at = spawnWhere(src, where, L), sz = BEST[bid].size || 1;
    // small ones fill the nearest free squares; Large ones are placed one at a time where their whole space fits
    const spots = sz === 1 ? freeTilesNear(L, at.x, at.y, n, !tokenAt(L, at.x, at.y)) : [];
    const made = [];
    if (sz === 1) for (const s of spots) made.push(makeMonster(bid, L, s.x, s.y));
    else for (let k = 0; k < n; k++){ const s = spotFor(L, at.x, at.y, sz); if (!s) break; const m = makeMonster(bid, L, s.x, s.y); state.tokens.push(m); made.push(m); spots.push(s); }
    for (const m of made){ if (sz === 1) state.tokens.push(m); if (state.combat.active && state.combat.floor === L) addToInit(m); }
    syncTokens();
    made.forEach(riseFrom);
    log(`${spots.length} ${BEST[bid].name}${spots.length === 1 ? '' : 's'} emerge${spots.length === 1 ? 's' : ''} near ${src.name}.`, true);
    if (!quiet) toast(`${spots.length} × ${BEST[bid].name}`);
  }
  else if (kind === 'aoe' || kind === 'aoeall'){
    const [rad, save, dc, dice, type, cond] = p;
    const targets = state.tokens.filter(t => t.floor === L && !t.dead && !t.flags.gone && t.id !== src.id &&
      cheb(t.x, t.y, src.x, src.y) <= +rad && (kind === 'aoeall' || side(t) !== side(src)));
    const base = rollDice(dice).total, lines = [];
    for (const t of targets){
      let dmg = base, ok = false, r = 0;
      if (save !== 'none'){ const S = saveRoll(t, save); r = saveTxt(S); ok = S.tot >= +dc; if (ok) dmg = Math.floor(dmg / 2); }
      const df = defend(t, dmg, type);
      lines.push(`${esc(t.name)}${save !== 'none' ? ` — ${save.toUpperCase()} save ${r} vs ${dc}: <b>${ok ? 'saved' : 'failed'}</b> →` : ' →'} <b>${df.n}</b>${defNote(df, dmg)}${!ok && cond ? condTxt(t, cond) : ''}`);
      if (cond && !ok && CONDITIONS[cond]) addCond(t, cond, 1);
      applyDamage(t, df.n, type, src, true);
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
      const S = saveRoll(t, save), r = saveTxt(S), ok = S.tot >= +dc, raw = ok ? Math.floor(base / 2) : base, df = defend(t, raw, type), dmg = df.n;
      lines.push(`${esc(t.name)} — ${String(save).toUpperCase()} ${r} vs ${dc}: <b>${ok ? 'saved' : 'failed'}</b>${raw ? ` → ${dmg} ${type}${defNote(df, raw)}` : ''}${!ok && cond && cond !== '-' ? (cond === 'pit' ? ' + dragged down' : condTxt(t, cond)) : ''}`);
      if (dmg) applyDamage(t, dmg, type, src, true);
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
    log(`Every creature on ${state.floors[L].name} knows where you are.`, true);
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
// targetId: the creature tapped (single-target spells, heals, buffs). aim: { x, y } — the square an area spell is
// centred on or pointed at (when it isn't given, the creature tapped is the aim).
// at: the slot level to cast it with (upcasting: more dice from the spell's higher-level rule, engine/spellcast.js).
export function castSpell(casterId, targetId, i, aim = null, { at = null } = {}){
  const c = tokById(casterId), base0 = c?.casts?.[i], area = base0 && areaOf(base0);
  const tg = tokById(targetId) || (area && aim ? c : null); if (!c || !tg || !base0) return false;
  if (base0.k === 'heal' && tg.dead && tg.kind === 'monster'){ toast(`${tg.name} is beyond healing.`); return false; }
  if (base0.recharge && c.spent?.[base0.n]){ toast(`${c.name}'s ${base0.n} hasn't come back yet (Recharge ${base0.recharge}–6).`); return false; }
  const reuse = !!base0.again && c.sustain === base0.n;   // a sustained spell, used again: not a fresh casting
  const slot = spendSpell(c, base0.l, base0.n, !!base0.again, at);
  if (slot !== null) c.lastMove = null;
  if (slot === null){ toast(`${c.name} has no spell slot left for ${base0.n}.`); return false; }
  endOn(c, 'castSpell');   // Invisibility: it ends when you cast
  if (c.kind !== 'monster') witnessed(c.floor, { kind:'spell', x:c.x, y:c.y, by:c.name, type:base0.ty || '' });   // magic in the street: someone saw
  // a breath weapon and its like: spent until a d6 at the start of its turn comes up (combat.js startTurn)
  if (base0.recharge) (c.spent ||= {})[base0.n] = true;
  const lib = base0.mon ? null : spellInfo(base0.n), level = !base0.l ? 0 : slot === '' ? Math.max(base0.l, at || 0) : (c.castAt || base0.l);
  const sp = { ...base0, d:base0.d && diceAt({ ...base0, hl:lib?.hl, up:base0.up || lib?.up }, level) }, conc = !!(base0.conc || lib?.conc);
  if (conc && base0.l && !reuse) startConc(c, base0.n);
  const paid = [...(base0.recharge ? [`<span class="muted">Recharge ${base0.recharge}–6: spent until it comes back</span>`] : []), ...(slot ? [`<span class="muted">${esc(slot)}${level > base0.l ? ` · cast at level ${level}${sp.d !== base0.d ? ` (${esc(sp.d)})` : ''}` : ''}</span>`] : []), ...(conc && base0.l ? [`<span class="muted">🌀 ${esc(c.name)} is concentrating on it</span>`] : [])];
  sfx('roll'); animate(c.id, 'cast', tg.id !== c.id ? tg.id : null);
  if (sp.k === 'heal'){
    // Mass Healing Word / Mass Cure Wounds: up to six of the caster's side around the creature tapped, each rolled
    const who = sp.multi ? [tg, ...state.tokens.filter(t => t.id !== tg.id && t.floor === tg.floor && !t.flags.gone && !(t.dead && t.kind === 'monster') && side(t) === side(c) && cheb(t.x, t.y, tg.x, tg.y) <= (sp.rad || 6))].slice(0, sp.multi) : [tg];
    const got = who.map(t => { const n = Math.max(0, rollDice(sp.d).total + (sp.healMod || 0)); heal(t, n); return [t, n]; });
    showCard({ kind:'', title:`${c.name}: ${sp.n}`, sub:who.length > 1 ? `${who.length} healed` : `on ${tg.name}`, flair:'Warmth, and the wound closes a little.',
      lines:[...(who.length > 1 ? got.map(([t, n]) => `${esc(t.name)} <b>+${n} HP</b>`) : []), ...paid], big:who.length > 1 ? '' : `+${got[0][1]} HP` });
    log(`${c.name} casts ${sp.n}: ${got.map(([t, n]) => `${t.name} +${n}`).join(', ')}.`); changed(); return true;
  }
  if (sp.k === 'auto'){
    const evil = sp.smite && (hasTag(tg, 'undead') || hasTag(tg, 'fiend'));
    const raw = rollDice(sp.d).total + (evil ? d(8) : 0), df = defend(tg, raw, sp.ty), n = df.n;
    showCard({ kind:'', title:`${c.name}: ${sp.n}`, sub:`on ${tg.name}${evil ? ` · +1d8 against the ${hasTag(tg, 'fiend') ? 'fiend' : 'undead'}` : ''}`, lines:[...(df.why ? [`<span class="muted">${esc(tg.name)} is ${df.why} to ${esc(sp.ty)}: ${raw} → ${n}</span>`] : []), ...paid], big:`${n} ${sp.ty}` });
    log(`${c.name} casts ${sp.n} on ${tg.name}: ${n} ${sp.ty}.`); applyDamage(tg, n, sp.ty, c, true); changed(); return true;
  }
  if (sp.k === 'buff' || sp.k === 'util'){
    // a spell that simply gives its target a condition (Invisibility): no roll at all. (Ray of Sickness needs a hit and
    // Color Spray a failed save, so they're left to the DM here, where the app doesn't roll them.)
    const ef = GIVES.has(sp.n) && SPELL_EFFECTS[sp.n];
    if (ef?.cond){ const tm = timingFor(ef, { src:c.id }); addCond(tg, ef.cond, conc ? -1 : tm.rounds, conc ? `conc:${c.id}` : null, false, tm.extra); }
    showCard({ kind:'', title:`${c.name}: ${sp.n}`, sub:tg.id === c.id ? 'on themself' : `on ${tg.name}`, lines:[...(sp.note ? [esc(sp.note)] : []), ...paid, '<span class="muted">The DM rules how it plays out.</span>'] });
    // Lesser Restoration: blinded, paralyzed, poisoned · Greater: charmed, petrified · both burn out the Seep's seed
    const cures = sp.n === 'Lesser Restoration' ? ['blinded', 'paralyzed', 'poisoned', 'seeded'] : sp.n === 'Greater Restoration' ? ['charmed', 'petrified', 'seeded'] : null;
    if (cures){ tg.conds = (tg.conds || []).filter(x => !cures.includes(x.n)); if (tg.flags.seeded) heal(tg, 0); }
    log(`${c.name} casts ${sp.n}${tg.id === c.id ? '' : ` on ${tg.name}`}.`); changed(); return true;
  }
  // an area (engine/targeting.js): the squares it covers from where it was aimed, everyone in them, a flash on the map;
  // a creature with cover from the blast's origin adds +2 / +5 to a Dexterity save
  let targets = [tg], where = ` · ${tg.name}`, origin = null;
  if (area){
    const res = areaSquares(c, area, aim || { x:tg.x, y:tg.y });
    targets = caughtIn(c, area, res.squares); origin = res.origin;
    where = ` · ${area.shape === 'aura' ? `${area.size * 5} ft. around ${c.name}` : `${area.size * 5}-ft. ${area.shape}`}${res.ok ? '' : ` (${res.why} — the DM's call)`}`;
    flashArea(c.floor, [...res.squares], sp.ty); broadcast({ t:'area', floor:c.floor, sq:[...res.squares], ty:sp.ty || '' });
  } else if (sp.rad) targets = state.tokens.filter(t => t.floor === tg.floor && !t.dead && !t.flags.gone && t.id !== c.id && cheb(t.x, t.y, tg.x, tg.y) <= sp.rad);   // hand-made spells with a radius
  else if (gapTo(c, tg) > Math.max(1, spellReach(sp))) where += ` (out of range — the DM's call)`;
  const base = sp.d ? rollDice(sp.d).total : 0, lines = [];
  // the timing of the condition it leaves (data/spell-effects.js for a spell; a creature's action carries its own)
  const hold = base0.mon ? (base0.cond ? base0 : null) : (SPELL_EFFECTS[base0.n]?.cond === sp.cond ? SPELL_EFFECTS[base0.n] : null);
  if (base0.conditionManual) lines.push('<span class="muted">Its grip, swallow or other hold is the DM\'s call (see its stat block).</span>');
  for (const t of targets){
    const cv = area && sp.sv === 'dex' ? coverFromOrigin(c.floor, origin, t) : null, cb = cv && cv.cover !== 'total' ? cv.ac : 0;
    const S = saveRoll(t, sp.sv, cb), r = saveTxt(S);
    let ok = S.tot >= sp.dc;
    // a legendary creature refuses to fail, when it matters (engine/tactics.js resistWorthIt: a hold, or a heavy blow)
    if (!ok && t.kind === 'monster' && resistLeft(t) > 0 && resistWorthIt(t, false, { cond:sp.cond, dmg:base })){ useResistance(t); ok = true; }
    const raw = base ? (ok ? (sp.half ? Math.floor(base / 2) : 0) : base) : 0, df = defend(t, raw, sp.ty), dmg = df.n;
    lines.push(`${esc(t.name)} — ${String(sp.sv).toUpperCase()} ${r}${cb ? ` <span class="muted">(+${cb} cover)</span>` : ''} vs ${sp.dc}: <b>${ok ? 'saved' : 'failed'}</b>${raw ? ` → ${dmg} ${sp.ty}${defNote(df, raw)}` : ''}${!ok && sp.cond ? condTxt(t, sp.cond) : ''}`);
    // its hold: a concentration spell's lasts until that ends; the rest as the rules say (timingFor): Hold Person's
    // repeated Wisdom save, Color Spray's "until the end of your next turn"
    if (!ok && sp.cond && CONDITIONS[sp.cond]){ const tm = timingFor(hold, { src:c.id, save:sp.sv, dc:sp.dc }); addCond(t, sp.cond, conc ? -1 : tm.rounds, conc ? `conc:${c.id}` : null, false, tm.extra); }
    if (dmg) applyDamage(t, dmg, sp.ty, c, true);
  }
  if (!targets.length) lines.push('<span class="muted">No one is caught in it.</span>');
  if (/thunder|fire/.test(sp.ty || '') && (area || sp.rad)) makeNoise(c.floor, origin ? Math.floor(origin.x) : tg.x, origin ? Math.floor(origin.y) : tg.y, 2, sp.n);
  showCard({ kind:'', title:`${c.name}: ${sp.n}`, sub:`DC ${sp.dc} ${String(sp.sv).toUpperCase()}${where}${base ? ` · ${sp.d} ${sp.ty}` : ''}`, lines:[...lines, ...paid] });
  log(`${c.name} casts ${sp.n}: ${targets.length} caught.`);
  changed(); return true;
}

/* ---------- legendary & lair actions ---------- */
// Hand-made legendary actions (data/legendary.js) win; else the SRD stat block's counts (data/monster-play.js): its uses a
// round, spent from one "see its stat block" action so the DM can keep count, and its Legendary Resistance a day.
export const legendOf = t => { const b = BEST[t?.bid]; if (!b) return null; const d = LEGENDARY[b.id] || {}, mp = MONSTER_PLAY[b.id] || {};
  const legendary = b.legendary || d.legendary || (mp.legendary ? { n:mp.legendary, acts:[{ n:'Legendary action', cost:1, fx:'note', f:'One of the actions in its stat block (Legendary Actions).' }] } : null);
  const o = { legendary, lair:b.lair || d.lair, resist:b.resist ?? d.resist ?? mp.resistDaily }; return o.legendary || o.lair || o.resist ? o : null; };
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
