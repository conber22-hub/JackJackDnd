/* Fresh-rest trials on an open lane. Combat state is local to a trial and
   every roll (including the feature engine's expression dice) uses the same RNG. */
import { BAROVIA } from '../data/bestiary-barovia.js';
import { BESTIARY } from '../data/bestiary.js';
import { SRD_MONSTERS } from '../data/srd-monsters.js';
import { ABILITIES, CLASSES, mod } from '../data/srd.js';
import { avgDice, mulberry32 } from '../util/core.js';
import { callingOf, featureView, featuresAt } from './callings.js';
import { castables, heroAttacks, heroResources, heroStats, asiLevels } from './hero.js';
import { rollOrder } from './fight.js';
import { attackMods, canAct, saveMods, speedOf } from './conditions.js';
import { applyDefenses, defensesFor } from './defenses.js';
import { expectedDamage, hitOdds } from './odds.js';
import { isMelee, reachOf } from './movement.js';
import {
  amountOf, mechEdge, mechExtra, mechMove, mechReaction, mechResist, mechResources, mechTempHp, mechWard,
  seepCosts, summonToken, tempGive, tempSoak, wardSoak, wardTurn,
} from './mech.js';

const MAX_ROUNDS = 30;
const FOES = new Map([...SRD_MONSTERS, ...BESTIARY, ...BAROVIA].map(entry => [entry.id, entry]));
const WEAPON = {
  Fighter:'Longsword', Barbarian:'Battleaxe', Rogue:'Shortbow', Ranger:'Longbow', Paladin:'Longsword',
  Cleric:'Mace', Wizard:'Dagger', Sorcerer:'Dagger', Warlock:'Light Crossbow', Bard:'Rapier', Druid:'Scimitar',
};
const PRIMARY = { Rogue:'Dex', Ranger:'Dex', Paladin:'Str', Monk:'Dex' };
const CANTRIP = {
  Cleric:'Sacred Flame', Wizard:'Fire Bolt', Sorcerer:'Fire Bolt', Warlock:'Eldritch Blast',
  Bard:'Starry Wisp', Druid:'Starry Wisp',
};
const PHYSICAL = ['bludgeoning', 'piercing', 'slashing'];

// Keep the starting kit and ability progression identical across a Calling's Paths.
function buildHero(c, path, lvl){
  const cls = c.chassis, C = CLASSES[cls];
  const primary = PRIMARY[cls] ?? C.cast ?? 'Str';
  const secondary = cls === 'Monk' ? 'Wis' : 'Con';
  const ranged = ['Rogue', 'Ranger', 'Warlock'].includes(cls);
  const build = {
    cls, calling:c.id, path, lvl, sp:'Human', bg:null, asi:{},
    ab:{ ...C.arr, [primary]:C.arr[primary] + 2, [secondary]:C.arr[secondary] + 1 },
    armor:C.armor?.startsWith('heavy') ? 'Chain Mail' : C.armor?.startsWith('medium') ? 'Scale Mail' :
      C.armor?.startsWith('light') ? 'Leather' : 'None',
    shield:!ranged && C.armor?.includes('shield'),
    weapons:WEAPON[cls] ? [WEAPON[cls]] : [],
    style:cls === 'Ranger' ? 'Archery' : 'Defense',
    spells:CANTRIP[cls] ? [CANTRIP[cls]] : [],
    invoc:cls === 'Warlock' && lvl >= 2 ? 'Agonizing Blast' : null,
  };
  // The same +2 primary / +1 secondary increases for the starting array,
  // followed by the chassis's ordinary ASIs. Exclude background feats and magic gear.
  for (const level of asiLevels(build)) build.asi[level] = level <= 8 ? primary : secondary;
  const st = heroStats(build);
  const selected = featuresAt(build);
  const mechs = selected.filter(f => f.mech.k !== 'text').map(f => ({ ...f.mech, src:f.n }));
  const ctx = { lvl, pb:st.pb, mods:Object.fromEntries(ABILITIES.map(a => [a.toLowerCase(), st.M(a)])) };
  const attacks = heroAttacks(build, st).filter(a => !a.l).map(a => ({ ...a, spell:a.n !== 'Unarmed Strike' && a.n !== WEAPON[cls] }));
  for (const a of castables(build, st).filter(a => a.l === 0 && a.k === 'save' && a.d)){
    attacks.push({ n:a.n, spell:true, rng:[a.r], d:a.d, t:a.ty, save:a.sv, dc:a.dc });
  }
  const resources = heroResources(build, st).filter(r => ['rage','wind','lay','surge','focus'].includes(r.id))
    .map(r => ({ ...r, n:featureView(c.id, r.n).n }));
  const ward = mechWard(mechs, ctx);
  const aura = mechs.filter(m => m.k === 'aura' && m.gives).flatMap(m =>
    [m.gives].flat().map(g => ({ ...g, src:m.src, radius:m.radius ?? 10 })));
  return {
    id:'hero', kind:'pc', cls, ac:st.ac, maxHp:st.hp, speed:st.spd, init:st.init,
    saves:Object.fromEntries(ABILITIES.map(a => [a.toLowerCase(), st.saves[a]])), attacks, mechs, aura, ctx, ward,
    resources:[...resources, ...mechResources(mechs, ctx)],
    extraAttack:selected.find(f => f.n === featureView(c.id, 'Extra Attack').n),
    unarmed:selected.find(f => f.n === featureView(c.id, 'Martial Arts').n)?.n,
    sneak:cls === 'Rogue' ? featureView(c.id, 'Sneak Attack').n : null,
    uncanny:cls === 'Rogue' && lvl >= 5 ? featureView(c.id, 'Uncanny Dodge').n : null,
  };
}

export const benchmarkFoe = lvl => lvl <= 3 ? 'husk' : lvl <= 7 ? 'unbaptized' : 'bulwark';

function buildFoe(entry){
  return {
    ...entry, id:'foe', kind:'monster', maxHp:entry.hpAverage ?? (typeof entry.hp === 'number' ? entry.hp : avgDice(entry.hp)),
    defenses:defensesFor(entry), attacks:entry.attacks,
  };
}

const fresh = (base, x) => ({ ...base, x, hp:base.maxHp, thp:0, conds:[] });
const gap = (a, b) => Math.abs(a.x - b.x);
const dirty = foe => foe.fam === 'seep' || foe.fam === 'bloom' || foe.tags?.includes('seep');
const cappedHeal = (who, n) => { who.hp = Math.min(who.maxHp, who.hp + n); };

function duel(build, monster, roll){
  const hero = fresh(build, 0), foe = fresh(monster, 40);
  const tally = { won:0, rounds:0, dmgDealt:0, dmgTaken:0, hpLeft:0, featuresUsed:{}, seep:{ marks:0, drain:0, hp:0, text:{} } };
  const uses = new Map(hero.resources.map(r => [r.id, r.max]));
  const byName = new Map(hero.mechs.map(m => [m.src, m]));
  const invoked = new Map();
  let summon = null, round = 1, ragingUntil = 0, reactionRound = 0;
  let firstHit = true;
  hero.ward = build.ward ? { max:build.ward.max, now:build.ward.max, hit:false } : null;

  const d20 = () => roll(1, 20);
  const check = ({ adv, dis }) => {
    const one = d20();
    return !!adv.length === !!dis.length ? one : (adv.length ? Math.max : Math.min)(one, d20());
  };
  const record = src => {
    if (src) tally.featuresUsed[src] = (tally.featuresUsed[src] ?? 0) + 1;
  };
  const pay = m => {
    for (const { what, n, text } of seepCosts(m, hero.ctx, roll)){
      if (what === 'text') tally.seep.text[text] = (tally.seep.text[text] ?? 0) + 1;
      else tally.seep[{ mark:'marks', maxHp:'drain', hp:'hp' }[what]] += n;
    }
  };
  const spend = (r, n = 1) => {
    uses.set(r.id, uses.get(r.id) - n);
    record(r.n);
    pay(r.mech);
  };
  const track = src => {
    record(src);
    // An invocation pays at activation. Its ongoing effect incurs no further charge.
    if (!(invoked.get(src) > round)) pay(byName.get(src));
  };
  const context = extra => ({
    ...hero.ctx, raging:ragingUntil > round, bloodied:hero.hp <= hero.maxHp / 2,
    hpLow:hero.hp <= hero.maxHp / 4, wardUp:hero.ward?.now > 0, wardDown:hero.ward?.now === 0,
    alone:!summon?.hp || gap(hero, summon) > 30, allyNear:summon?.hp > 0 && gap(hero, summon) <= 5,
    vsSeep:dirty(foe), firstRound:round === 1, firstHit,
    invoked:[...invoked].filter(([, until]) => until > round).map(([src]) => src), ...extra,
  });
  const mechs = who => who === hero ? hero.mechs.concat(hero.aura) :
    who === summon && hero.hp > 0 ? hero.aura.filter(a => gap(hero, who) <= a.radius) : [];
  const amount = expr => amountOf(expr, hero.ctx, roll);
  const mean = expr => amountOf(expr, hero.ctx, (n, sides) => n * (sides + 1) / 2);
  const receiveTemp = moment => {
    const grant = mechTempHp(hero.mechs, moment, context(), roll);
    if (grant.n > hero.thp){ hero.thp = tempGive(hero.thp, grant.n); track(grant.src); }
  };
  receiveTemp('rest');

  function damageDefenses(target){
    if (target === foe) return foe.defenses;
    const resist = mechResist(mechs(target), context());
    if (target === hero && ragingUntil > round) resist.push(...PHYSICAL);
    return { resist };
  }

  function burst(r, target){
    spend(r);
    const n = applyDefenses([{ n:amount(r.mech.dice), t:r.mech.type }], foe.defenses).total;
    if (target === foe || gap(hero, foe) <= (r.mech.radius ?? 5)) hurt(foe, n);
  }

  function react(trigger, attacker, target, incoming = 0){
    if (reactionRound === round || !canAct(hero).reactions) return incoming;
    if (target === summon && gap(hero, summon) > 5) return incoming;
    const r = mechReaction(mechs(hero), target === summon ? 'allyHit' : trigger, context());
    if (r && (target !== summon || trigger === 'hit')){
      reactionRound = round;
      track(r.src);
      const d = r.does;
      if (d.k === 'reduce') return Math.max(0, incoming - amount(d.amount));
      if (d.k === 'damage') hurt(attacker, applyDefenses([{ n:amount(d.dice ?? d.amount), t:d.type }], foe.defenses).total);
      if (d.k === 'heal') cappedHeal(hero, amount(d.amount));
      if (d.k === 'tempHp') hero.thp = tempGive(hero.thp, amount(d.amount));
    } else if (target === hero && trigger === 'hit' && hero.uncanny && incoming >= 2){
      reactionRound = round;
      record(hero.uncanny);
      return Math.floor(incoming / 2);
    }
    return incoming;
  }

  function hurt(target, n){
    if (n <= 0 || target.hp <= 0) return;
    if (target === hero){
      const W = wardSoak(hero.ward, n);
      hero.ward = W.ward;
      if (W.soaked) record(build.ward.src);
      const S = tempSoak(hero.thp, W.through);
      hero.thp = S.thp;
      n = S.through;
      tally.dmgTaken += Math.min(n, hero.hp);
    }
    if (target === foe) tally.dmgDealt += Math.min(n, target.hp);
    const before = target.hp;
    target.hp = Math.max(0, before - n);
    if (target === hero && !hero.hp){
      const hold = hero.resources.find(r => r.mech?.k === 'holdAtOne' && uses.get(r.id) > 0);
      if (hold && n - before < hero.maxHp){ hero.hp = 1; spend(hold); }
      const onDown = hero.resources.find(r => r.mech?.k === 'burst' && r.mech.when === 'selfDown' && uses.get(r.id) > 0);
      if (!hero.hp && onDown) burst(onDown, hero);
    }
    if (target === foe && !foe.hp && hero.hp > 0) receiveTemp('kill');
  }

  const parts = a => a.parts ?? [{ d:a.d, t:a.t }];
  const reach = a => a.rng?.[1] ?? a.rng?.[0] ??
    (isMelee(a) ? reachOf(a) * 5 : +(a.n?.match(/(\d+) ft/i)?.[1] || 60));
  const meleeAt = (a, distance) => isMelee(a) && distance <= reachOf(a) * 5;
  const inRange = (a, distance) => distance <= (isMelee(a) ? Math.max(reachOf(a) * 5, reach(a)) : reach(a));

  function attackEdge(who, target, a, distance){
    const melee = meleeAt(a, distance);
    const cm = attackMods({ attacker:who, target, melee, within5:distance <= 5 });
    const edge = mechEdge(mechs(who), 'attack', context({ melee, ranged:!melee }));
    const other = target === hero ? summon : hero;
    const end = target.x + Math.sign(who.x - target.x) * distance;
    const adjacentFoe = distance <= 5 || who === foe && other?.hp > 0 && Math.abs(end - other.x) <= 5;
    const dis = !melee && (adjacentFoe || distance > (a.rng?.[0] ?? Infinity));
    return { melee, adv:[...cm.adv, ...edge.adv], dis:[...cm.dis, ...edge.dis, ...(dis ? ['range'] : [])], autoCrit:cm.autoCrit, penalty:cm.penalty, edge };
  }

  function saveEdge(target, ability, condition){
    const cm = saveMods(target, ability);
    const edge = mechEdge(mechs(target), 'save', context(), condition ?? ability);
    return {
      ...cm, edge, adv:[...cm.adv, ...edge.adv], dis:[...cm.dis, ...edge.dis],
      bonus:(target.saves?.[ability] ?? target.saveMod ??
        (target.stats?.[ability[0].toUpperCase() + ability.slice(1)] != null ?
          mod(target.stats[ability[0].toUpperCase() + ability.slice(1)]) : target === foe ? 1 : 0)) - cm.penalty,
    };
  }

  function save(target, ability, dc, condition){
    const e = saveEdge(target, ability, condition);
    for (const src of new Set([...e.edge.adv, ...e.edge.dis])) if (!e.autoFail && (invoked.get(src) ?? 0) <= round) track(src);
    return !e.autoFail && check(e) + e.bonus >= dc;
  }

  function strike(who, target, a){
    if (a.save){
      if (!save(target, a.save, a.dc)) hurt(target, applyDefenses([{ n:amount(a.d), t:a.t }], damageDefenses(target)).total);
      return;
    }
    const edge = attackEdge(who, target, a, gap(who, target));
    const resist = damageDefenses(target);
    let hit = false;
    for (let i = 0; i < (a.rays ?? 1) && target.hp > 0; i++){
      const die = check(edge);
      for (const src of new Set([...edge.edge.adv, ...edge.edge.dis])) if ((invoked.get(src) ?? 0) <= round) track(src);
      if (die === 1 || (die !== 20 && die + a.b - edge.penalty < target.ac)) continue;
      hit = true;
      const crit = die === 20 || edge.autoCrit;
      const raw = parts(a).map(p => ({
        n:amount(crit ? String(p.d).replace(/(\d*)d(\d+)/gi, (_, count, sides) => `${2 * (+count || 1)}d${sides}`) : p.d) +
          (who === hero && edge.melee && ragingUntil > round && PHYSICAL.includes(p.t) ? (hero.ctx.lvl >= 9 ? 3 : 2) : 0),
        t:p.t,
      }));
      if (who === hero){
        const extras = mechExtra(mechs(hero), context({ crit, melee:edge.melee, ranged:!edge.melee }), roll);
        for (const e of extras){
          const type = e.type || a.t;
          if (applyDefenses([{ t:type, n:e.n }], resist).total > 0) track(e.src);
          raw.push({ n:e.n, t:type });
        }
        if (hero.sneak && firstHit && (!edge.dis.length || edge.adv.length) &&
            (edge.adv.length && !edge.dis.length || summon?.hp > 0 && gap(summon, foe) <= 5)){
          raw.push({ n:roll(Math.ceil(hero.ctx.lvl / 2) * (crit ? 2 : 1), 6), t:a.t });
          record(hero.sneak);
        }
        firstHit = false;
      }
      const dealt = applyDefenses(raw, resist).total;
      let n = dealt;
      if (target !== foe){
        const resisted = raw.filter(p => p.n >= 2 && resist.resist.includes(p.t));
        for (const m of mechs(target)){
          if ((invoked.get(m.src) ?? 0) > round) continue;
          const types = mechResist([m], context());
          if (resisted.some(p => types.includes(p.t) && !(target === hero && ragingUntil > round && PHYSICAL.includes(p.t)))) track(m.src);
        }
        if (dealt > 0) n = react('hit', who, target, dealt);
      }
      hurt(target, n);
      if (target.hp > 0 && a.on && !target.defenses?.condImmune?.includes(a.on.cond) &&
          !save(target, a.on.save, a.on.dc, a.on.cond)){
        target.conds = target.conds.filter(c => c.n !== a.on.cond);
        target.conds.push({ n:a.on.cond, turns:a.on.rounds ?? 1, src:who.id });
      }
    }
    if (target === hero && !hit) react('missed', who, target);
    if (who === hero && hit && !edge.melee && foe.hp > 0){
      const volley = hero.resources.find(r => r.mech?.k === 'burst' && r.mech.when === 'rangedHitAtTarget' && uses.get(r.id) > 0);
      if (volley) burst(volley, foe);
    }
  }

  function estimate(who, target, a, distance){
    const defs = damageDefenses(target);
    if (a.save){
      const e = saveEdge(target, a.save);
      const fail = Math.max(0, Math.min(1, (a.dc - e.bonus - 1) / 20));
      const chance = e.autoFail ? 1 : !!e.adv.length === !!e.dis.length ? fail : e.adv.length ? fail ** 2 : 1 - (1 - fail) ** 2;
      return chance * applyDefenses([{ n:avgDice(a.d), t:a.t }], defs).total;
    }
    const e = attackEdge(who, target, a, distance);
    const odds = hitOdds(a.b - e.penalty, target.ac, { adv:!!e.adv.length, dis:!!e.dis.length, autoCrit:e.autoCrit });
    const damage = (n, type) => defs.immune?.includes(type) ? 0 :
      n * (defs.resist?.includes(type) ? .5 : 1) * (defs.vuln?.includes(type) ? 2 : 1);
    const base = parts(a).reduce((sum, p) => {
      const rage = who === hero && e.melee && ragingUntil > round && PHYSICAL.includes(p.t) ? (hero.ctx.lvl >= 9 ? 3 : 2) : 0;
      return sum + damage(expectedDamage(p.d, odds, rage), p.t);
    }, 0);
    if (who !== hero) return base * (a.rays ?? 1);
    const meanRoll = (n, sides) => n * (sides + 1) / 2;
    const extra = crit => mechExtra(mechs(hero), context({ crit, melee:e.melee, ranged:!e.melee }), meanRoll)
      .reduce((sum, part) => sum + damage(part.n, part.type || a.t), 0);
    // Score riders on the first possible hit. Further beams can still apply them
    // at resolution, using the actual dice and first-hit state.
    return base * (a.rays ?? 1) + (odds.hit - odds.crit) * extra(false) + odds.crit * extra(true);
  }

  // Pick the best attack after taking only the steps needed to use it.
  function attackPlan(who, targets, move, attacks = who.attacks){
    let best = null;
    for (const target of targets){
      const distance = gap(who, target);
      for (const a of attacks){
        const meleeReach = isMelee(a) ? reachOf(a) * 5 : 0;
        const normal = meleeReach || a.rng?.[0] || reach(a);
        const steps = Math.min(move, Math.max(0, distance - normal));
        const end = distance - steps;
        if (!inRange(a, end)) continue;
        const score = estimate(who, target, a, end);
        if (!best || score > best.score) best = { a, target, steps, score };
      }
    }
    return best;
  }

  function moveToward(who, target, feet){
    who.x += Math.sign(target.x - who.x) * feet;
  }
  function takeAttack(who, plan){
    moveToward(who, plan.target, plan.steps);
    strike(who, plan.target, plan.a);
  }
  function movement(who){
    let speed = speedOf(who, who.speed);
    if (speed && who.conds.some(c => c.n === 'prone')){
      speed = Math.floor(speed / 10) * 5;
      who.conds = who.conds.filter(c => c.n !== 'prone');
    }
    return speed;
  }
  function simpleTurn(who, targets){
    if (!canAct(who).actions) return;
    const move = movement(who);
    const plan = attackPlan(who, targets, move);
    if (plan) takeAttack(who, plan);
    else moveToward(who, targets[0], Math.min(move * 2, Math.max(0, gap(who, targets[0]) - 5)));
  }

  function bonusAction(){
    const rage = hero.resources.find(r => r.id === 'rage' && uses.get(r.id) > 0 && ragingUntil <= round);
    if (rage){ spend(rage); ragingUntil = round + 10; return true; }
    const missing = hero.maxHp - hero.hp;
    const options = hero.resources.filter(r => uses.get(r.id) > 0 && !r.auto).map(r => {
      const m = r.mech;
      if (r.id === 'wind') return { r, kind:'heal', expr:r.dice, value:Math.min(missing, mean(r.dice)) };
      if (r.id === 'lay'){
        const n = Math.min(5, uses.get(r.id));
        return { r, kind:'heal', expr:n, charge:n, value:Math.min(missing, n) };
      }
      if (m?.k === 'heal') return { r, kind:'heal', expr:m.amount, value:Math.min(missing, mean(m.amount)) };
      if (r.invoke && !(invoked.get(r.n) > round)){
        const future = context({ invoked:[r.n] });
        const useful = m.k === 'resist' && mechResist([m], future).some(t =>
          !damageDefenses(hero).resist.includes(t) && foe.attacks.some(a => parts(a).some(p => p.t === t))) ||
          m.k === 'advantage' && (m.on === 'attack' || m.on === 'save' && foe.attacks.some(a =>
            a.on && mechEdge([m], 'save', future, a.on.cond).adv.length));
        if (useful) return { r, kind:'invoke', value:6 };
      }
      if (m?.k === 'tempHp' && !r.invoke) return { r, kind:'temp', expr:m.amount, value:mean(m.amount) - hero.thp };
      return null;
    }).filter(o => o && o.value >= (o.kind === 'heal' ? Math.min(5, hero.maxHp / 3) : 1));
    options.sort((a, b) => b.value - a.value);
    const best = options[0];
    if (!best) return false;
    spend(best.r, best.charge);
    if (best.kind === 'heal') cappedHeal(hero, amount(best.expr));
    if (best.kind === 'temp') hero.thp = tempGive(hero.thp, amount(best.expr));
    if (best.kind === 'invoke') invoked.set(best.r.n, round + 10);
    return true;
  }

  function heroTurn(){
    const W = wardTurn(hero.ward);
    hero.ward = W.ward;
    if (W.back) record(build.ward.src);
    receiveTemp('turnStart');
    if (!canAct(hero).actions) return;
    firstHit = true;
    const bonusUsed = bonusAction();
    const speed = movement(hero), moveCtx = context();
    const extra = speed ? mechMove(mechs(hero), moveCtx) : 0;
    const move = speed + extra, plan = attackPlan(hero, [foe], move);
    const usedMovement = feet => {
      if (feet <= speed || !extra) return;
      const source = mechs(hero).find(m => mechMove([m], moveCtx) === extra);
      if (source) track(source.src);
    };
    const call = hero.resources.find(r => r.mech?.k === 'summon' && uses.get(r.id) > 0);
    if (call && !summon?.hp && (!plan || foe.hp > 2 * plan.score)){
      const token = summonToken(call.mech, hero.ctx, hero);
      if (token){
        const steps = Math.min(move, Math.max(0, gap(hero, foe) - 10));
        usedMovement(steps);
        moveToward(hero, foe, steps);
        summon = { ...fresh(token, hero.x + Math.sign(foe.x - hero.x) * (gap(hero, foe) > 5 ? 5 : -5)), id:'summon', until:round + 10 };
        spend(call);
        return;
      }
    }
    if (!plan){
      const steps = Math.min(move * 2, Math.max(0, gap(hero, foe) - 5));
      usedMovement(steps / 2);
      moveToward(hero, foe, steps);
      return;
    }
    usedMovement(plan.steps);
    takeAttack(hero, plan);
    const extraAttacks = !plan.a.spell && hero.extraAttack ?
      (hero.cls === 'Fighter' && hero.ctx.lvl >= 20 ? 3 : hero.cls === 'Fighter' && hero.ctx.lvl >= 11 ? 2 : 1) : 0;
    const followThrough = () => {
      for (let i = 0; i < extraAttacks && foe.hp > 0; i++){
        record(hero.extraAttack.n);
        strike(hero, foe, plan.a);
      }
    };
    followThrough();
    const surge = hero.resources.find(r => r.id === 'surge' && uses.get(r.id) > 0);
    if (surge && !plan.a.spell && foe.hp > 0 && foe.hp > plan.score){
      spend(surge);
      strike(hero, foe, plan.a);
      followThrough();
    }
    if (hero.unarmed && !plan.a.spell && !bonusUsed && foe.hp > 0 && gap(hero, foe) <= 5){
      const punch = hero.attacks.find(a => a.n === 'Unarmed Strike');
      const focus = hero.resources.find(r => r.id === 'focus' && uses.get(r.id) > 0);
      if (focus){
        spend(focus);
        strike(hero, foe, punch);
        if (foe.hp > 0) strike(hero, foe, punch);
        if (foe.hp > 0 && hero.ctx.lvl >= 10) strike(hero, foe, punch);
      } else {
        record(hero.unarmed);
        strike(hero, foe, punch);
      }
    }
  }

  const order = rollOrder([hero, foe], { d20 });
  const tick = t => { t.conds = t.conds.filter(c => --c.turns > 0); };
  for (; round <= MAX_ROUNDS && hero.hp > 0 && foe.hp > 0; round++){
    tally.rounds++;
    if (summon?.until <= round) summon = null;
    for (const { id } of order){
      if (id === hero.id){
        heroTurn();
        tick(hero);
        if (foe.hp > 0 && summon?.hp > 0){
          simpleTurn(summon, [foe]);
          tick(summon);
        }
      } else {
        simpleTurn(foe, summon?.hp > 0 ? [summon, hero] : [hero]);
        tick(foe);
      }
      if (hero.hp <= 0 || foe.hp <= 0) break;
    }
  }
  tally.won = Number(foe.hp <= 0 && hero.hp > 0);
  tally.hpLeft = hero.hp;
  return tally;
}

function addCounts(total, add){
  for (const [name, n] of Object.entries(add)) total[name] = (total[name] ?? 0) + n;
}
function averageCounts(total, fights){
  return Object.fromEntries(Object.entries(total).map(([name, n]) => [name, n / fights]));
}

// won is a fraction. Damage counts HP removed (no overkill); damage taken is
// to the hero after defences, not to a summon or to the Ward/temp HP.
export function simulate({ calling, path, lvl = 3, foe = benchmarkFoe(lvl), fights = 200, rng = mulberry32(11) } = {}){
  const c = callingOf({ calling });
  if (!c) throw new RangeError(`Unknown Calling: ${calling}`);
  if (path != null && !c.paths.some(p => p.id === path)) throw new RangeError(`Unknown Path for ${calling}: ${path}`);
  if (!Number.isInteger(lvl) || lvl < 1 || lvl > 20) throw new RangeError('Use a whole level from 1 to 20.');
  if (!Number.isInteger(fights) || fights < 1) throw new RangeError('Use at least one fight.');
  const entry = typeof foe === 'string' ? FOES.get(foe) : foe;
  if (!entry?.attacks?.length) throw new RangeError('Choose a bestiary foe with attacks.');
  const build = buildHero(c, path, lvl), monster = buildFoe(entry);
  const roll = (n, sides) => {
    let total = 0;
    for (let i = 0; i < n; i++) total += 1 + Math.floor(rng() * sides);
    return total;
  };
  const total = { won:0, rounds:0, dmgDealt:0, dmgTaken:0, hpLeft:0 };
  const featuresUsed = Object.create(null), seep = { marks:0, drain:0, hp:0 }, text = Object.create(null);
  for (let i = 0; i < fights; i++){
    const result = duel(build, monster, roll);
    for (const key of Object.keys(total)) total[key] += result[key];
    for (const key of Object.keys(seep)) seep[key] += result.seep[key];
    addCounts(text, result.seep.text);
    addCounts(featuresUsed, result.featuresUsed);
  }
  return {
    ...averageCounts(total, fights), featuresUsed:averageCounts(featuresUsed, fights),
    seep:{ ...averageCounts(seep, fights), text:averageCounts(text, fights) },
  };
}
