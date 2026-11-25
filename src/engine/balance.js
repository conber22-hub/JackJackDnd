/* Fresh-rest trials on an open lane. Combat state is local to a trial and
   every roll (including the feature engine's expression dice) uses the same RNG. */
import { BAROVIA } from '../data/bestiary-barovia.js';
import { BESTIARY } from '../data/bestiary.js';
import { RITES } from '../data/rites.js';
import { SRD_MONSTERS } from '../data/srd-monsters.js';
import { ABILITIES, CLASSES, mod } from '../data/srd.js';
import { avgDice, mulberry32 } from '../util/core.js';
import { callingOf, featureView, featuresAt } from './callings.js';
import { castables, heroAttacks, heroResources, heroSpells, heroStats, asiLevels, spellLimits, spellPool } from './hero.js';
import { budgetFor, xpOf } from './encounter.js';
import { riteName } from './rites.js';
import { BREAKS_CONC, concDC, diceAt, upRays } from './spellcast.js';
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
// One damage option at each available tier comes first, then support and alternatives.
const PREPARE = {
  Wizard:['Magic Missile', 'Scorching Ray', 'Fireball', 'Ice Storm', 'Cone of Cold', 'Shield', 'Burning Hands', 'Lightning Bolt'],
  Sorcerer:['Magic Missile', 'Scorching Ray', 'Fireball', 'Ice Storm', 'Cone of Cold', 'Shield', 'Burning Hands', 'Lightning Bolt'],
  Warlock:['Hex', 'Armor of Agathys', 'Cyst Rupture', 'Vampiric Touch'],
  Cleric:['Guiding Bolt', 'Spiritual Weapon', 'Spirit Guardians', 'Guardian of Faith', 'Flame Strike', 'Healing Word', 'Shield of Faith', 'Cure Wounds'],
  Bard:['Dissonant Whispers', 'Shatter', 'Healing Word', 'Cure Wounds', 'Thunderwave', 'Mass Cure Wounds'],
  Druid:['Thunderwave', 'Moonbeam', 'Fireball', 'Ice Storm', 'Cone of Cold', 'Healing Word', 'Barkskin', 'Cure Wounds', 'Cyst Rupture'],
  Ranger:['Cure Wounds', 'Barkskin', 'Cyst Rupture'],
  Paladin:['Shield of Faith', 'Cure Wounds', 'Bless'],
};
const PROTECT = new Set(['Shield', 'Shield of Faith', 'Armor of Agathys', 'Barkskin', 'Bless']);
const ZONES = new Set(['Moonbeam', 'Spirit Guardians']);
function rite(name, calling){
  const own = riteName(name, calling);
  // A chassis bonus spell may be borrowed from another tradition.
  return own === name ? Object.values(RITES[name]?.by ?? {})[0]?.n ?? name : own;
}
const MARK_TYPE = { "Hunter's Mark":'force', Hex:'necrotic' };
const RIDERS = new Set([...Object.keys(MARK_TYPE), 'Divine Smite']);

function buildHero(c, path, lvl, spells){

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
  if (spells && PREPARE[cls]){
    const available = new Set(spellPool(build).map(s => s.n));
    const defaults = new Set(heroSpells(build, st).map(s => s.n));
    build.spells.push(...PREPARE[cls].filter(n => available.has(n) && !defaults.has(n)).slice(0, spellLimits(build).prepared));
  }
  const selected = featuresAt(build);
  const mechs = selected.filter(f => f.mech.k !== 'text').map(f => ({ ...f.mech, src:f.n }));
  const ctx = { lvl, pb:st.pb, mods:Object.fromEntries(ABILITIES.map(a => [a.toLowerCase(), st.M(a)])) };
  const attacks = heroAttacks(build, st).filter(a => !a.l).map(a => ({ ...a, spell:a.n !== 'Unarmed Strike' && a.n !== WEAPON[cls] }));
  for (const a of castables(build, st).filter(a => a.l === 0 && a.k === 'save' && a.d)){
    attacks.push({ n:a.n, spell:true, rng:[a.r], d:a.d, t:a.ty, save:a.sv, dc:a.dc });
  }
  const kit = heroResources(build, st);
  const slots = spells ? kit.filter(r => r.slot) : [];
  const prepared = spells ? heroSpells(build, st).filter(s => s.l && slots.some(r => r.slot >= s.l))
    .filter(s => PROTECT.has(s.n) || RIDERS.has(s.n) || ZONES.has(s.n) ||
      s.n === 'Vampiric Touch' || s.n === 'Spiritual Weapon' ||
      !s.conc && !['Guardian of Faith', 'Ice Knife'].includes(s.n) && s.d && ['Action', 'Bonus Action'].includes(s.time))
    .map(s => ({ ...s, rite:rite(s.n, c.id), b:st.spAtk, dc:st.dc, mod:st.M(st.castAb) })) : [];
  for (const a of attacks.filter(a => a.spell)) a.rite = rite(a.n.replace(/ \(×.*\)$/, ''), c.id);
  const resources = kit.filter(r => ['rage','wind','lay','surge','focus'].includes(r.id))
    .map(r => ({ ...r, n:featureView(c.id, r.n).n }));
  const ward = mechWard(mechs, ctx);
  const aura = mechs.filter(m => m.k === 'aura' && m.gives).flatMap(m =>
    [m.gives].flat().map(g => ({ ...g, src:m.src, radius:m.radius ?? 10 })));
  return {
    calling:c.id, path, kind:'pc', cls, ac:st.ac, maxHp:st.hp, speed:st.spd, init:st.init,
    slots, prepared, saves:Object.fromEntries(ABILITIES.map(a => [a.toLowerCase(), st.saves[a]])), attacks, mechs, aura, ctx, ward,
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
    ...entry, kind:'monster', maxHp:entry.hpAverage ?? (typeof entry.hp === 'number' ? entry.hp : avgDice(entry.hp)),
    defenses:defensesFor(entry), attacks:entry.attacks,
  };
}

const fresh = (base, x) => ({ ...base, x, hp:base.maxHp, thp:0, conds:[] });
const gap = (a, b) => Math.abs(a.x - b.x);
const dirty = foe => foe.fam === 'seep' || foe.fam === 'bloom' || foe.tags?.includes('seep');
const cappedHeal = (who, n) => { who.hp = Math.min(who.maxHp, who.hp + n); };

function totals(){
  return {
    won:0, rounds:0, dmgDealt:0, dmgTaken:0, hpLeft:0, featuresUsed:{},
    seep:{ marks:0, drain:0, hp:0, text:{} },
    spells:{ casts:{}, cantrips:{}, slotsSpent:{}, allyHeals:0, started:0, replaced:0, broken:0 },
  };
}

function encounter(builds, monsters, roll, legacy){
  const heroes = builds.map((base, i) => ({
    ...fresh(base, i === 1 ? 5 : 0), id:`hero-${i}`, tally:totals(),
    uses:new Map([...base.resources, ...base.slots].map(r => [r.id, r.max])),
    byName:new Map(base.mechs.map(m => [m.src, m])), invoked:new Map(),
    ragingUntil:0, reactionRound:0, firstHit:true, summon:null, concentration:null,
    ward:base.ward ? { max:base.ward.max, now:base.ward.max, hit:false, src:base.ward.src } : null,
  }));
  const foes = monsters.map((base, i) => ({ ...fresh(base, 40 + i * 5), id:`foe-${i}` }));
  const actors = [...heroes, ...foes];
  const isFoe = t => t.kind === 'monster';
  const up = t => t?.hp > 0;
  const allies = t => isFoe(t) ? foes.filter(o => o !== t && up(o)) :
    heroes.flatMap(h => [h.summon, h]).filter(o => o !== t && up(o));
  const targetsOf = t => isFoe(t) ? heroes.flatMap(h => [h.summon, h]).filter(up) : foes.filter(up);
  let round = 1, turn = 0;

  const d20 = () => roll(1, 20);
  const check = ({ adv, dis }) => {
    const one = d20();
    return !!adv.length === !!dis.length ? one : (adv.length ? Math.max : Math.min)(one, d20());
  };
  const count = (obj, key, n = 1) => { obj[key] = (Object.hasOwn(obj, key) ? obj[key] : 0) + n; };
  const record = (hero, src) => { if (src) count(hero.tally.featuresUsed, src); };
  const pay = (hero, m) => {
    for (const { what, n, text } of seepCosts(m, hero.ctx, roll)){
      if (what === 'text') count(hero.tally.seep.text, text);
      else hero.tally.seep[{ mark:'marks', maxHp:'drain', hp:'hp' }[what]] += n;
    }
  };
  const available = (hero, test) => hero.resources.find(r => hero.uses.get(r.id) > 0 && test(r));
  const spend = (hero, r, n = 1) => {
    hero.uses.set(r.id, hero.uses.get(r.id) - n);
    record(hero, r.n);
    pay(hero, r.mech);
  };
  const context = (hero, foe, extra) => ({
    ...hero.ctx, raging:hero.ragingUntil > round, bloodied:hero.hp <= hero.maxHp / 2,
    hpLow:hero.hp <= hero.maxHp / 4, wardUp:hero.ward?.now > 0, wardDown:hero.ward?.now === 0,
    alone:!allies(hero).some(o => gap(hero, o) <= 30), allyNear:allies(hero).some(o => gap(hero, o) <= 5),
    vsSeep:!!foe && dirty(foe), firstRound:round === 1, firstHit:hero.firstHit,
    invoked:[...hero.invoked].filter(([, until]) => until > round).map(([src]) => src), ...extra,
  });
  const mechs = who => isFoe(who) ? [] : [
    ...(who.mechs ?? []),
    ...heroes.filter(up).flatMap(h => h.aura.filter(a => gap(h, who) <= a.radius)
      .map(a => ({ ...a, src:h === who ? a.src : `${h.id}:${a.src}` }))),
  ];
  function track(who, key){
    if (!key) return;
    const owner = heroes.find(h => key.startsWith(h.id + ':'));
    const hero = owner ?? who;
    if (!hero.tally) return;
    const src = owner ? key.slice(owner.id.length + 1) : key;
    record(hero, src);
    if (!(hero.invoked.get(src) > round)) pay(hero, hero.byName.get(src));
  }
  function trackEdge(who, edge){
    for (const src of new Set([...edge.adv, ...edge.dis])){
      if (!(who.invoked?.get(src) > round)) track(who, src);
    }
  }
  const amount = (hero, expr) => amountOf(expr, hero?.ctx, roll);
  const mean = (hero, expr) => amountOf(expr, hero?.ctx, (n, sides) => n * (sides + 1) / 2);
  function receiveTemp(hero, moment, foe = foes[0]){
    const grant = mechTempHp(hero.mechs, moment, context(hero, foe), roll);
    if (grant.n > hero.thp){ hero.thp = tempGive(hero.thp, grant.n); track(hero, grant.src); }
  }
  heroes.forEach(h => receiveTemp(h, 'rest'));

  const effectsOn = (target, name) => heroes.some(h => h.concentration?.spell.n === name && h.concentration.targets.includes(target));
  const acOf = target => Math.max(target.ac, target.barkskin ? 17 : 0) +
    (effectsOn(target, 'Shield of Faith') ? 2 : 0) + (target.shield ? 5 : 0);

  function damageDefenses(target, source){
    if (isFoe(target)) return target.defenses;
    const owner = target.summoner ?? target;
    const resist = mechResist(mechs(target), context(owner, source));
    if (target.ragingUntil > round) resist.push(...PHYSICAL);
    return { resist };
  }

  function burst(hero, r, target){
    spend(hero, r);
    const n = amount(hero, r.mech.dice);
    for (const foe of foes.filter(up)){
      if (gap(target, foe) <= (r.mech.radius ?? 5)) damage(hero, foe, [{ n, t:r.mech.type }]);
    }
  }

  function reaction(hero, trigger, attacker, target, incoming = 0){
    if (!up(hero) || hero.reactionRound === round || !canAct(hero).reactions) return null;
    const r = mechReaction(mechs(hero), trigger, context(hero, attacker));
    if (r){
      hero.reactionRound = round;
      track(hero, r.src);
      const d = r.does;
      if (d.k === 'reduce') return Math.max(0, incoming - amount(hero, d.amount));
      if (d.k === 'damage' && attacker) damage(hero, attacker, [{ n:amount(hero, d.dice ?? d.amount), t:d.type }]);
      if (d.k === 'heal') heal(hero, trigger === 'allyDown' ? target : hero, amount(hero, d.amount));
      if (d.k === 'tempHp') hero.thp = tempGive(hero.thp, amount(hero, d.amount));
      if (d.k === 'move' && target !== hero) moveToward(hero, target, Math.min(d.feet, gap(hero, target)));
      return incoming;
    }
    if (trigger === 'hit' && hero.uncanny && incoming >= 2){
      hero.reactionRound = round;
      record(hero, hero.uncanny);
      return Math.floor(incoming / 2);
    }
    if (trigger === 'allyDown' && gap(hero, target) <= 10){
      const step = hero.mechs.find(m => m.k === 'move' && m.when === 'allyDown');
      if (step){
        hero.reactionRound = round;
        track(hero, step.src);
        moveToward(hero, target, Math.min(step.feet, gap(hero, target)));
        return incoming;
      }
    }
    return null;
  }

  function heal(hero, target, n, spell = false){
    if (target.slain || n <= 0) return;
    cappedHeal(target, n);
    if (spell && hero !== target) hero.tally.spells.allyHeals++;
  }
  function breakConcentration(hero){
    if (!hero.concentration) return;
    hero.concentration = null;
    hero.tally.spells.broken++;
  }
  function hurt(source, target, n){
    if (n <= 0 || !up(target)) return;
    if (target.tally){
      const W = wardSoak(target.ward, n);
      if (W.soaked) record(target, target.ward.src);
      target.ward = W.ward;
      n = W.through;
    }
    const damageTaken = n;
    const S = tempSoak(target.thp, n);
    target.thp = S.thp;
    if (!target.thp && target.agathys) target.agathys = 0;
    n = S.through;
    const before = target.hp, removed = Math.min(n, before);
    if (target.tally) target.tally.dmgTaken += removed;
    const owner = source?.summoner ?? source;
    if (isFoe(target) && owner?.tally) owner.tally.dmgDealt += removed;
    target.hp = before - removed;
    if (target.tally && !target.hp){
      const hold = available(target, r => r.mech?.k === 'holdAtOne');
      if (hold && n - before < target.maxHp){ target.hp = 1; spend(target, hold); }
      if (!target.hp){
        const onDown = available(target, r => r.mech?.k === 'burst' && r.mech.when === 'selfDown');
        if (onDown) burst(target, onDown, target);
        target.slain = n - before >= target.maxHp;
      }
    }
    if (target.concentration && (!up(target) || damageTaken > 0 && !save(target, 'con', concDC(damageTaken), source))){
      breakConcentration(target);
    }
    if (!target.hp && !isFoe(target)){
      for (const hero of heroes.filter(h => h !== target && gap(h, target) <= 30)){
        if (reaction(hero, 'allyDown', source, target) !== null) break;
      }
    }
    if (isFoe(target) && !target.hp && up(owner)) receiveTemp(owner, 'kill', target);
  }

  const parts = a => a.parts ?? [{ d:a.d, t:a.t }];
  const reach = a => a.rng?.[1] ?? a.rng?.[0] ??
    (isMelee(a) ? reachOf(a) * 5 : +(a.n?.match(/(\d+) ft/i)?.[1] || 60));
  const meleeAt = (a, distance) => isMelee(a) && distance <= reachOf(a) * 5;
  const inRange = (a, distance) => distance <= (isMelee(a) ? Math.max(reachOf(a) * 5, reach(a)) : reach(a));

  function attackEdge(who, target, a, distance, x = target.x + Math.sign(who.x - target.x) * distance){
    const melee = a.remoteMelee || meleeAt(a, distance);
    const cm = attackMods({ attacker:who, target, melee, within5:distance <= 5 });
    const hero = who.summoner ?? who;
    const edge = mechEdge(mechs(who), 'attack', hero.ctx ? context(hero, target, { melee, ranged:!melee }) : {});
    const nearby = targetsOf(who).some(t => t !== target && Math.abs(x - t.x) <= 5);
    const dis = !melee && (distance <= 5 || (!legacy || isFoe(who)) && nearby || distance > (a.rng?.[0] ?? Infinity));
    const guided = target.guided;
    return {
      melee, adv:[...cm.adv, ...edge.adv, ...(guided ? ['guiding'] : [])],
      dis:[...cm.dis, ...edge.dis, ...(dis ? ['range'] : [])], autoCrit:cm.autoCrit, penalty:cm.penalty, edge,
    };
  }

  function saveEdge(target, ability, source, condition){
    const cm = saveMods(target, ability);
    const hero = target.summoner ?? target;
    const edge = mechEdge(mechs(target), 'save', hero.ctx ? context(hero, source) : {}, condition ?? ability);
    const stat = target.stats?.[ability[0].toUpperCase() + ability.slice(1)];
    return {
      ...cm, edge, adv:[...cm.adv, ...edge.adv], dis:[...cm.dis, ...edge.dis],
      bonus:(target.saves?.[ability] ?? target.saveMod ?? (stat != null ? mod(stat) : isFoe(target) ? 1 : 0)) - cm.penalty,
    };
  }

  function spellSaveEdge(target, a, source){
    const e = saveEdge(target, a.save, source);
    if (a.n === 'Shatter' && target.tags?.includes('construct')) e.dis.push('construct');
    return e;
  }

  function save(target, ability, dc, source, condition, e = saveEdge(target, ability, source, condition)){
    if (e.autoFail) return false;
    trackEdge(target, e.edge);
    return check(e) + e.bonus + (effectsOn(target, 'Bless') ? roll(1, 4) : 0) >= dc;
  }

  function addCondition(target, condition, source){
    target.conds = target.conds.filter(c => c.n !== condition.cond);
    target.conds.push({ n:condition.cond, turns:condition.rounds ?? 1, src:source.id });
    if (BREAKS_CONC.has(condition.cond)) breakConcentration(target);
  }

  function damage(source, target, raw, hit = false){
    const defs = damageDefenses(target, source);
    let n = applyDefenses(raw, defs).total;
    if (!isFoe(target)){
      const resisted = raw.filter(p => p.n >= 2 && defs.resist.includes(p.t));
      for (const m of mechs(target)){
        const owner = target.summoner ?? target;
        if (owner.invoked.get(m.src) > round) continue;
        const types = mechResist([m], context(owner, source));
        if (resisted.some(p => types.includes(p.t) && !(target.ragingUntil > round && PHYSICAL.includes(p.t)))) track(target, m.src);
      }
      if (n > 0 && hit){
        if (target.tally) n = reaction(target, 'hit', source, target, n) ?? n;
        for (const hero of heroes.filter(h => h !== target && gap(h, target) <= 5)){
          const reacted = reaction(hero, 'allyHit', source, target, n);
          if (reacted !== null){ n = reacted; break; }
        }
      }
    }
    hurt(source, target, n);
    return n;
  }

  function markType(who, target){
    const held = who.concentration;
    return held?.targets[0] === target ? MARK_TYPE[held.spell.n] : null;
  }
  function canSneak(who, target, a, edge){
    return who.sneak && !a.spell && who.firstHit && (!edge.dis.length || edge.adv.length) &&
      (edge.adv.length && !edge.dis.length || allies(who).some(o => gap(o, target) <= 5 && canAct(o).actions));
  }
  function attacksRaw(who, target, a, edge, crit){
    const double = d => String(d).replace(/(\d*)d(\d+)/gi, (_, n, f) => `${2 * (+n || 1)}d${f}`);
    const raw = parts(a).map(p => ({
      n:amount(who, crit ? double(p.d) : p.d) +
        (edge.melee && who.ragingUntil > round && PHYSICAL.includes(p.t) ? (who.ctx.lvl >= 9 ? 3 : 2) : 0),
      t:p.t,
    }));
    if (!who.tally) return raw;
    const defs = damageDefenses(target, who);
    for (const e of mechExtra(mechs(who), context(who, target, { crit, melee:edge.melee, ranged:!edge.melee }), roll)){
      const type = e.type || a.t;
      if (applyDefenses([{ t:type, n:e.n }], defs).total > 0) track(who, e.src);
      raw.push({ n:e.n, t:type });
    }
    if (canSneak(who, target, a, edge)){
      raw.push({ n:roll(Math.ceil(who.ctx.lvl / 2) * (crit ? 2 : 1), 6), t:a.t });
      record(who, who.sneak);
    }
    const mark = markType(who, target);
    if (mark) raw.push({ n:roll(crit ? 2 : 1, 6), t:mark });
    who.firstHit = false;
    return raw;
  }

  function strike(who, target, a){
    if (!up(target) || !up(who)) return;
    if (a.save || a.auto){
      const saved = a.save && save(target, a.save, a.dc, who, null, spellSaveEdge(target, a, who));
      if (!saved || a.half) damage(who, target, parts(a).map(p => ({
        n:Math.floor(amount(who, p.d) * (saved ? .5 : 1)), t:p.t,
      })));
      return;
    }
    let hit = false;
    for (let i = 0; i < (a.rays ?? 1) && up(target) && up(who); i++){
      const edge = attackEdge(who, target, a, gap(who, target));
      const die = check(edge);
      trackEdge(who, edge.edge);
      if (target.guided) delete target.guided;
      const total = die + a.b - edge.penalty + (effectsOn(who, 'Bless') ? roll(1, 4) : 0);
      if (die === 1 || (die !== 20 && total < acOf(target))) continue;
      if (die !== 20 && shield(target, total)) continue;
      hit = true;
      const crit = die === 20 || edge.autoCrit;
      const raw = attacksRaw(who, target, a, edge, crit);
      if (who.tally && edge.melee && !a.spell) smite(who, target, raw, crit);
      const retaliation = target.thp > 0 && edge.melee ? target.agathys : 0;
      const before = target.hp;
      damage(who, target, raw, true);
      if (retaliation) damage(target, who, [{ n:retaliation, t:'cold' }]);
      if (a.vampiric) heal(who, who, Math.floor((before - target.hp) / 2));
      if (a.guiding && up(target)) target.guided = { source:who, round };
      if (up(target) && a.on && !target.defenses?.condImmune?.includes(a.on.cond) &&
          !save(target, a.on.save, a.on.dc, who, a.on.cond)){
        addCondition(target, a.on, who);
      }
    }
    if (target.tally && !hit) reaction(target, 'missed', who, target);
    if (who.tally && hit && !meleeAt(a, gap(who, target)) && up(target)){
      const volley = available(who, r => r.mech?.k === 'burst' && r.mech.when === 'rangedHitAtTarget');
      if (volley) burst(who, volley, target);
    }
  }

  function estimate(who, target, a, distance, x){
    const defs = damageDefenses(target, who);
    const typed = (n, type) => defs.immune?.includes(type) ? 0 :
      n * (defs.resist?.includes(type) ? .5 : 1) * (defs.vuln?.includes(type) ? 2 : 1);
    if (a.save || a.auto){
      let chance = 1;
      if (a.save){
        const e = spellSaveEdge(target, a, who);
        const fail = Math.max(0, Math.min(1, (a.dc - e.bonus - 1) / 20));
        chance = e.autoFail ? 1 : !!e.adv.length === !!e.dis.length ? fail : e.adv.length ? fail ** 2 : 1 - (1 - fail) ** 2;
      }
      const base = parts(a).reduce((sum, p) => sum + (legacy ?
        applyDefenses([{ n:avgDice(p.d), t:p.t }], defs).total : typed(avgDice(p.d), p.t)), 0);
      return (chance + (a.half ? (1 - chance) / 2 : 0)) * base;
    }
    const e = attackEdge(who, target, a, distance, x);
    const odds = hitOdds(a.b - e.penalty, acOf(target), { adv:!!e.adv.length, dis:!!e.dis.length, autoCrit:e.autoCrit });
    const base = parts(a).reduce((sum, p) => {
      const rage = e.melee && who.ragingUntil > round && PHYSICAL.includes(p.t) ? (who.ctx.lvl >= 9 ? 3 : 2) : 0;
      return sum + typed(expectedDamage(p.d, odds, rage), p.t);
    }, 0) * (a.rays ?? 1);
    if (!who.tally) return base;
    const mark = markType(who, target);
    const riders = (odds.hit + odds.crit) * ((canSneak(who, target, a, e) && !legacy ? typed(Math.ceil(who.ctx.lvl / 2) * 3.5, a.t) : 0) +
      (mark ? typed(3.5, mark) * (a.rays ?? 1) : 0));
    const meanRoll = (n, sides) => n * (sides + 1) / 2;
    const extra = crit => mechExtra(mechs(who), context(who, target, { crit, melee:e.melee, ranged:!e.melee }), meanRoll)
      .reduce((sum, part) => sum + typed(part.n, part.type || a.t), 0);
    return base + riders + (odds.hit - odds.crit) * extra(false) + odds.crit * extra(true);
  }

  function attackPlan(who, targets, move){
    let best = null;
    for (const target of targets){
      const distance = gap(who, target);
      for (const a of who.attacks){
        const normal = (isMelee(a) && reachOf(a) * 5) || a.rng?.[0] || reach(a);
        const steps = Math.min(move, Math.max(0, distance - normal));
        if (!inRange(a, distance - steps)) continue;
        const score = estimate(who, target, a, distance - steps);
        if (!best || score > best.score) best = { a, target, steps, score };
      }
    }
    return best;
  }

  function moveToward(who, target, feet){
    if (!feet) return;
    const from = who.x;
    who.x += Math.sign(target.x - who.x) * feet;
    for (const zone of zones()){
      if (zone.hero === who && zone.spell.n === 'Spirit Guardians'){
        for (const foe of foes.filter(up)){
          if (Math.abs(foe.x - from) > zone.radius &&
              foe.x >= Math.min(from, who.x) - zone.radius && foe.x <= Math.max(from, who.x) + zone.radius) zoneHit(zone, foe);
        }
      } else if (zoneApplies(zone, who)){
        const x = zoneX(zone);
        if (Math.abs(from - x) > zone.radius &&
            x >= Math.min(from, who.x) - zone.radius && x <= Math.max(from, who.x) + zone.radius) zoneHit(zone, who);
      }
    }
  }
  function movement(who){
    let speed = speedOf(who, who.speed);
    if (zones().some(z => z.spell.n === 'Spirit Guardians' && isFoe(who) && gap(who, z.hero) <= z.radius)) speed /= 2;
    if (speed && who.conds.some(c => c.n === 'prone')){
      speed = Math.floor(speed / 10) * 5;
      who.conds = who.conds.filter(c => c.n !== 'prone');
    }
    return speed;
  }
  function simpleTurn(who, targets){
    if (!up(who) || !canAct(who).actions || !targets.length) return;
    const move = movement(who);
    // A group fights the nearest opponent it can attack. This gives the
    // front line a chance to screen back-line allies along the open lane.
    const ordered = isFoe(who) && heroes.length > 1 ? [...targets].sort((a, b) => gap(who, a) - gap(who, b)) : targets;
    const plan = ordered === targets ? attackPlan(who, targets, move) :
      ordered.map(t => attackPlan(who, [t], move)).find(Boolean);
    if (plan){
      moveToward(who, plan.target, plan.steps);
      strike(who, plan.target, plan.a);
    } else moveToward(who, ordered[0], Math.min(move * 2, Math.max(0, gap(who, ordered[0]) - 5)));
  }

  const zones = () => heroes.map(h => h.concentration).filter(c => c?.radius);
  const zoneApplies = (zone, actor) => zone.spell.n === 'Moonbeam' || isFoe(actor);
  const zoneX = zone => zone.spell.n === 'Spirit Guardians' ? zone.hero.x : zone.x;
  function zoneHit(zone, target){
    if (!up(target) || zone.hero.concentration !== zone || zone.hit.get(target) === turn) return;
    zone.hit.set(target, turn);
    strike(zone.hero, target, zone.attack);
  }
  function pulse(zone){
    for (const target of [...foes, ...heroes, ...heroes.map(h => h.summon).filter(up)]){
      if (zoneApplies(zone, target) && Math.abs(target.x - zoneX(zone)) <= zone.radius) zoneHit(zone, target);
    }
  }
  function focus(hero, spell, targets, extra = {}){
    const t = hero.tally.spells;
    if (hero.concentration) t.replaced++;
    t.started++;
    hero.concentration = { hero, spell, targets, expires:round + 10, ...extra };
    return hero.concentration;
  }

  const slotsFor = (hero, spell) => hero.slotTurn === turn ? [] :
    hero.slots.filter(r => r.slot >= spell.l && hero.uses.get(r.id) > 0);

  function consumeSlot(hero, spell, slot){
    hero.uses.set(slot.id, hero.uses.get(slot.id) - 1);
    hero.slotTurn = turn;
    count(hero.tally.spells.slotsSpent, slot.slot);
    count(hero.tally.spells.casts, spell.rite);
  }

  function shield(target, attackTotal){
    if (!target.tally || target.reactionRound === round || !canAct(target).reactions ||
        attackTotal >= acOf(target) + 5) return false;
    const spell = target.prepared.find(s => s.n === 'Shield');
    const slot = spell && slotsFor(target, spell)[0];
    if (!slot) return false;
    consumeSlot(target, spell, slot);
    target.reactionRound = round;
    target.shield = true;
    return true;
  }

  function smite(hero, target, raw, crit){
    if (hero.bonusUsed || raw.reduce((sum, p) => sum + p.n, 0) >= target.hp) return;
    const spell = hero.prepared.find(s => s.n === 'Divine Smite');
    if (!spell) return;
    const undead = target.tags?.some(t => t === 'fiend' || t === 'undead') ?? false;
    const options = slotsFor(hero, spell);
    const slot = options.find(r => avgDice(diceAt(spell, r.slot)) + (undead ? 4.5 : 0) >= target.hp - raw.reduce((sum, p) => sum + p.n, 0)) ?? options[0];
    if (!slot || target.defenses.immune?.includes('radiant')) return;
    consumeSlot(hero, spell, slot);
    hero.bonusUsed = true;
    raw.push({ n:roll((slot.slot + 1 + Number(undead)) * (crit ? 2 : 1), 8), t:'radiant' });
  }

  function spellAttack(spell, slot){
    const { n, k, ty, area, r, b, sv, dc, half } = spell;
    const dice = diceAt(spell, slot);
    const split = ty?.split(' + ');
    const d = n === 'Spiritual Weapon' ? `${dice}+${spell.mod}` : dice;
    const reach = r || (area ? area[1] : 5);
    return {
      n, d, t:ty, b, dc, half, rng:[reach], spell:true,
      save:k === 'save' ? sv : null, auto:k === 'auto', remoteMelee:n === 'Spiritual Weapon',
      guiding:n === 'Guiding Bolt', vampiric:n === 'Vampiric Touch',
      ...(n === 'Scorching Ray' ? { d:spell.d, rays:3 + (upRays(spell) ? slot - spell.l : 0) } : {}),
      ...(split?.length > 1 ? { parts:split.map((type, i) => ({
        d:(dice === spell.d ? spell.d.split('+')[i] : i ? spell.d.split('+')[i] : diceAt({ ...spell, d:spell.d.split('+')[0] }, slot)),
        t:type,
      })) } : {}),
    };
  }

  // Choose a footprint along the lane. Point areas may be offset to include
  // several foes or clip an isolated foe without hitting a party member.
  function footprints(hero, spell, x, targets, range = spell.r, alliesAt = [hero, ...allies(hero)], casterX = x){
    const shape = spell.area?.[0];
    const size = spell.area?.[1];
    if (!shape){
      return targets.filter(t => Math.abs(t.x - x) <= (range || 5)).map(t => ({ x:t.x, targets:[t] }));
    }
    if (spell.n === 'Spirit Guardians'){
      return [{ x, targets:targets.filter(t => Math.abs(t.x - x) <= size) }];
    }
    if (['cone', 'line', 'cube'].includes(shape)){
      return [-1, 1].map(sign => {
        const within = t => t !== hero && (t.x - x) * sign >= 0 && (t.x - x) * sign <= size;
        return { x, targets:alliesAt.some(within) ? [] : targets.filter(within) };
      });
    }
    const radius = size;
    const centres = new Set(targets.flatMap(t => [t.x, t.x - radius, t.x + radius]
      .map(pos => Math.max(x - range, Math.min(x + range, pos)))));
    return [...centres].filter(pos => !alliesAt.some(t => Math.abs((t === hero ? casterX : t.x) - pos) <= radius))
      .map(pos => ({ x:pos, targets:targets.filter(t => Math.abs(t.x - pos) <= radius) }));
  }

  function offensiveSpell(hero, targets, move, base, bonus = false){
    let best = null;
    const baseline = bonus ? 0 : base?.score ?? 0;
    const current = hero.concentration;
    const choose = (candidate, cost = 0) => {
      if (!candidate.targets.length) return;
      const gain = candidate.value - baseline;
      const rank = gain - cost;
      if (gain >= (candidate.slot ? Math.max(bonus ? 4 : 2, baseline * .2) : 0) && rank > (best?.rank ?? 0)){
        best = { ...candidate, rank };
      }
    };
    // All movement positions are in 5-foot increments, plus a fractional end
    // point when speed was halved. Ties favour staying where the hero stands.
    const positions = [{ x:hero.x, steps:0 }];
    for (let d = 5; d < move; d += 5) positions.push({ x:hero.x - d, steps:d }, { x:hero.x + d, steps:d });
    if (move > 0) positions.push({ x:hero.x - move, steps:move }, { x:hero.x + move, steps:move });

    const allyPositions = [hero, ...allies(hero)];
    const prepared = hero.prepared.filter(s => s.d && !RIDERS.has(s.n) &&
      (s.k !== 'heal' && (s.time === 'Bonus Action') === bonus) && s.n !== current?.spell.n);
    for (const spell of prepared){
      for (const slot of slotsFor(hero, spell)){
        const attack = spellAttack(spell, slot.slot);
        const cached = new Map();
        const damageValue = (t, x) => {
          if (!attack.save && !attack.auto) return Math.min(t.hp, estimate(hero, t, attack, Math.abs(x - t.x), x));
          if (!cached.has(t)) cached.set(t, Math.min(t.hp, estimate(hero, t, attack, Math.abs(x - t.x), x)));
          return cached.get(t);
        };
        for (const { x, steps } of positions){
          if (bonus && steps) continue;
          for (const area of footprints(hero, spell, x, targets, spell.r, allyPositions)){
            let value = area.targets.reduce((sum, t) => sum + damageValue(t, x), 0);
            if (ZONES.has(spell.n)) value += .5 * area.targets.reduce((sum, t) => sum + Math.min(Math.max(0, t.hp - damageValue(t, x)), damageValue(t, x)), 0);
            if (spell.n === 'Vampiric Touch') value += .5 * Math.min(hero.maxHp - hero.hp, value);
            // Keep valuable active protection or damage unless the replacement buys enough.
            const replacement = spell.conc && current ? (current.radius || current.attack ? 5 : 3) : 0;
            choose({ ...area, casterX:x, steps, attack, spell, slot, value }, 1.5 * (slot.slot - 1) + replacement);
          }
        }
      }
    }
    if (current?.attack && !current.radius && (current.spell.n === 'Spiritual Weapon') === bonus){
      const { attack, spell } = current;
      for (const t of targets){
        const x = spell.n === 'Spiritual Weapon' ? current.x : hero.x;
        const steps = Math.max(0, Math.abs(t.x - x) - 5);
        if (steps > (bonus ? 20 : move)) continue;
        const value = Math.min(t.hp, estimate(hero, t, attack, 5));
        choose({ x:t.x, casterX:x, steps, targets:[t], attack, spell, value });
      }
    }
    if (!bonus && current?.spell.n === 'Moonbeam'){
      const { spell, attack } = current;
      for (const area of footprints(hero, spell, current.x, targets, 60, [hero, ...allies(hero)], hero.x)){
        const value = area.targets.filter(t => Math.abs(t.x - current.x) > current.radius)
          .reduce((sum, t) => sum + Math.min(t.hp, estimate(hero, t, attack, 5)), 0);
        choose({ ...area, casterX:hero.x, steps:0, attack, spell, value });
      }
    }
    return best;
  }

  function castAttack(hero, plan){
    const { spell, attack, slot } = plan;
    const spiritual = spell.n === 'Spiritual Weapon';
    if (!spiritual) moveToward(hero, { x:plan.casterX ?? plan.x }, plan.steps);
    if (!up(hero)) return;
    const current = slot && spell.conc ?
      focus(hero, spell, [], { attack, x:plan.x, radius:ZONES.has(spell.n) ? spell.area[1] : 0, hit:new Map() }) :
      slot ? null : hero.concentration;
    if (slot) consumeSlot(hero, spell, slot);
    if (current?.radius){
      const previous = current.x;
      current.x = plan.x;
      if (slot) pulse(current);
      else for (const t of plan.targets){
        if (Math.abs(previous - t.x) > current.radius) zoneHit(current, t);
      }
      return;
    }
    if (spiritual && current) current.x = plan.x;
    for (const target of plan.targets) strike(hero, target, attack);
  }

  function healPlan(hero, bonus, move, attackScore = 0){
    let best = null;
    for (const spell of hero.prepared.filter(s => s.k === 'heal' && (s.time === 'Bonus Action') === bonus)){
      for (const slot of slotsFor(hero, spell)){
        const expr = `${diceAt(spell, slot.slot)}+${spell.mod}`;
        const options = heroes.filter(t => !t.slain && t.hp <= t.maxHp * .5 && gap(hero, t) <= spell.r + move);
        for (const target of options){
          if (attackScore >= targetsOf(hero).reduce((sum, t) => sum + t.hp, 0) && up(target)) continue;
          const steps = Math.max(0, gap(hero, target) - spell.r);
          const x = hero.x + Math.sign(target.x - hero.x) * steps;
          const valueOf = t => Math.min(Math.max(1, mean(hero, expr)), t.maxHp - t.hp) + (t.hp ? 0 : 8);
          const mass = spell.n.startsWith('Mass ');
          const targets = mass ? options.filter(t => Math.abs(t.x - (bonus ? x : target.x)) <= (bonus ? spell.r : 30)) : [target];
          const score = targets.reduce((sum, t) => sum + valueOf(t), 0) - 2 * (slot.slot - 1);
          if (score >= Math.max(3, attackScore * .8) && (!best || score > best.score)){
            best = { spell, slot, expr, targets, target, steps, score };
          }
        }
      }
    }
    return best;
  }

  function castHeal(hero, plan){
    moveToward(hero, plan.target, plan.steps);
    if (!up(hero)) return;
    consumeSlot(hero, plan.spell, plan.slot);
    for (const target of plan.targets) heal(hero, target, Math.max(1, amount(hero, plan.expr)), true);
  }

  function protect(hero, foe, bonus){
    const threatened = t => gap(t, foe) <= foe.speed + Math.max(...foe.attacks.map(a => Math.min(reach(a), 60)));
    for (const spell of hero.prepared.filter(s => PROTECT.has(s.n) && (s.time === 'Bonus Action') === bonus && s.n !== 'Shield')){
      const slots = slotsFor(hero, spell);
      if (!slots.length || spell.conc && hero.concentration) continue;
      const targets = heroes.filter(t => up(t) && gap(hero, t) <= spell.r && threatened(t))
        .sort((a, b) => gap(a, foe) - gap(b, foe));
      const target = targets.find(t => t.hp <= t.maxHp * .7);
      let slot = slots[0];
      if (spell.n === 'Bless' && heroes.length > 1 && round === 1 && targets.length === heroes.length){
        focus(hero, spell, targets);
      } else if (spell.n === 'Shield of Faith' && target){
        focus(hero, spell, [target]);
      } else if (spell.n === 'Barkskin' && target && acOf(target) < 17){
        target.barkskin = true;
      } else if (spell.n === 'Armor of Agathys' && target === hero && !hero.thp){
        slot = slots.at(-1);
        hero.agathys = hero.thp = slot.slot * 5;
      } else continue;
      consumeSlot(hero, spell, slot);
      return true;
    }
    return false;
  }

  function bonusAction(hero, foe){
    const rage = available(hero, r => r.id === 'rage' && hero.ragingUntil <= round);
    if (rage){ spend(hero, rage); hero.ragingUntil = round + 10; return true; }
    const healSpell = healPlan(hero, true, 0);
    if (healSpell){ castHeal(hero, healSpell); return true; }
    const options = hero.resources.filter(r => hero.uses.get(r.id) > 0 && !r.auto).map(r => {
      const m = r.mech;
      const healTarget = range => heroes.filter(t => !t.slain && gap(hero, t) <= range)
        .sort((a, b) => Number(up(a)) - Number(up(b)) || (b.maxHp - b.hp) - (a.maxHp - a.hp))[0];
      if (r.id === 'wind') return { r, target:hero, expr:r.dice, value:Math.min(hero.maxHp - hero.hp, mean(hero, r.dice)) };
      if (r.id === 'lay' || m?.k === 'heal'){
        const target = healTarget(r.id === 'lay' ? 5 : m.range ?? 0);
        if (!target) return null;
        const charge = r.id === 'lay' ? Math.min(5, hero.uses.get(r.id)) : 1;
        const expr = r.id === 'lay' ? charge : m.amount;
        return { r, target, expr, charge, value:Math.min(target.maxHp - target.hp, mean(hero, expr)) + (target.hp ? 0 : 8) };
      }
      if (r.invoke && !(hero.invoked.get(r.n) > round)){
        const future = context(hero, foe, { invoked:[r.n] });
        const useful = m.k === 'resist' && mechResist([m], future).some(t =>
          !damageDefenses(hero, foe).resist.includes(t) && foe.attacks.some(a => parts(a).some(p => p.t === t))) ||
          m.k === 'advantage' && (m.on === 'attack' || m.on === 'save' && foe.attacks.some(a =>
            a.on && mechEdge([m], 'save', future, a.on.cond).adv.length));
        if (useful) return { r, kind:'invoke', value:6 };
      }
      if (m?.k === 'tempHp' && !r.invoke) return { r, kind:'temp', expr:m.amount, value:mean(hero, m.amount) - hero.thp };
      return null;
    }).filter(o => o && o.value >= (o.target ? Math.min(5, hero.maxHp / 3) : 1));
    options.sort((a, b) => b.value - a.value);
    const best = options[0];
    if (best){
      spend(hero, best.r, best.charge);
      if (best.target) heal(hero, best.target, amount(hero, best.expr));
      if (best.kind === 'temp') hero.thp = tempGive(hero.thp, amount(hero, best.expr));
      if (best.kind === 'invoke') hero.invoked.set(best.r.n, round + 10);
      return true;
    }
    if (protect(hero, foe, true)) return true;
    const mark = hero.prepared.find(s => MARK_TYPE[s.n]);
    if (mark && gap(hero, foe) <= mark.r && foe.hp >= 12 && !foe.defenses.immune?.includes(MARK_TYPE[mark.n])){
      const current = hero.concentration;
      if (current?.spell === mark && !up(current.targets[0])){
        current.targets = [foe];
        return true;
      }
      const pack = targetsOf(hero);
      const reserveForArea = pack.length > 1 && hero.prepared.some(s => s.area && s.d && slotsFor(hero, s).length);
      const slot = !current && !reserveForArea && slotsFor(hero, mark)[0];
      if (slot){
        consumeSlot(hero, mark, slot);
        focus(hero, mark, [foe], { expires:Infinity });
        return true;
      }
    }
    const targets = targetsOf(hero);
    const offense = offensiveSpell(hero, targets, 0, null, true);
    if (!offense) return false;
    if (offense.slot && hero.prepared.some(s => s.n === 'Spirit Guardians' && slotsFor(hero, s).length)){
      const move = speedOf(hero, hero.speed);
      const action = offensiveSpell(hero, targets, move, attackPlan(hero, targets, move));
      if (action?.spell.n === 'Spirit Guardians' && action.rank > offense.rank) return false;
    }
    castAttack(hero, offense);
    return true;
  }

  const extraAttacks = (hero, a) => !a.spell && hero.extraAttack ?
    (hero.cls === 'Fighter' && hero.ctx.lvl >= 20 ? 3 : hero.cls === 'Fighter' && hero.ctx.lvl >= 11 ? 2 : 1) : 0;

  function heroTurn(hero){
    const W = wardTurn(hero.ward);
    if (W.back) record(hero, hero.ward.src);
    hero.ward = W.ward;
    const foesUp = targetsOf(hero), foe = foesUp[0];
    receiveTemp(hero, 'turnStart', foe);
    if (!canAct(hero).actions) return;
    hero.firstHit = true;
    hero.bonusUsed = bonusAction(hero, attackPlan(hero, foesUp, speedOf(hero, hero.speed))?.target ?? foe);
    const targets = targetsOf(hero);
    if (!targets.length || !up(hero)) return;
    const speed = movement(hero), moveCtx = context(hero, foe);
    const extra = speed ? mechMove(mechs(hero), moveCtx) : 0;
    const move = speed + extra, plan = attackPlan(hero, targets, move);
    const usedMovement = feet => {
      if (feet <= speed || !extra) return;
      const source = mechs(hero).find(m => mechMove([m], moveCtx) === extra);
      if (source) track(hero, source.src);
    };
    const call = available(hero, r => r.mech?.k === 'summon');
    const target = plan?.target ?? targets[0];
    const action = plan && { ...plan, score:Math.min(target.hp, plan.score * (1 + extraAttacks(hero, plan.a))) };
    const cure = healPlan(hero, false, move, action?.score);
    if (cure){
      usedMovement(cure.steps);
      castHeal(hero, cure);
      return;
    }
    if (protect(hero, target, false)) return;
    const spell = offensiveSpell(hero, targets, move, action);
    if (call && !up(hero.summon) && (!plan || target.hp > 2 * plan.score)){
      const token = summonToken(call.mech, hero.ctx, hero);
      if (token){
        const steps = Math.min(move, Math.max(0, gap(hero, target) - 10));
        usedMovement(steps);
        moveToward(hero, target, steps);
        if (!up(hero)) return;
        hero.summon = { ...fresh(token, hero.x + Math.sign(target.x - hero.x) * (gap(hero, target) > 5 ? 5 : -5)),
          id:`${hero.id}-summon`, summoner:hero, until:round + 10 };
        spend(hero, call);
        return;
      }
    }
    if (spell){
      usedMovement(spell.steps);
      castAttack(hero, spell);
      return;
    }
    if (!plan){
      const steps = Math.min(move * 2, Math.max(0, gap(hero, target) - 5));
      usedMovement(steps / 2);
      moveToward(hero, target, steps);
      return;
    }
    usedMovement(plan.steps);
    moveToward(hero, target, plan.steps);
    if (!up(hero) || !up(target)) return;
    if (plan.a.rite) count(hero.tally.spells.cantrips, plan.a.rite);
    strike(hero, target, plan.a);
    let next = target;
    const followThrough = count => {
      for (let i = 0; i < count && up(hero); i++){
        if (!up(next)) next = attackPlan(hero, targetsOf(hero), 0)?.target;
        if (!next || !inRange(plan.a, gap(hero, next))) break;
        record(hero, hero.extraAttack.n);
        strike(hero, next, plan.a);
      }
    };
    const extraCount = extraAttacks(hero, plan.a);
    followThrough(extraCount);
    const surge = available(hero, r => r.id === 'surge');
    if (surge && !plan.a.spell && up(next) && next.hp > plan.score){
      spend(hero, surge);
      strike(hero, next, plan.a);
      followThrough(extraCount);
    }
    const within = up(next) && gap(hero, next) <= 5 ? next : targetsOf(hero).find(t => gap(hero, t) <= 5);
    if (hero.unarmed && !plan.a.spell && !hero.bonusUsed && within){
      const punch = hero.attacks.find(a => a.n === 'Unarmed Strike');
      const focus = available(hero, r => r.id === 'focus');
      if (focus){
        spend(hero, focus);
        for (let i = 0; i < (hero.ctx.lvl >= 10 ? 3 : 2) && up(within); i++) strike(hero, within, punch);
      } else {
        record(hero, hero.unarmed);
        strike(hero, within, punch);
      }
    }
  }
  const order = rollOrder(actors, { d20 }).map(({ id }) => actors.find(t => t.id === id));
  const done = () => !heroes.some(up) || !foes.some(up);
  function endTurn(actor){
    for (const zone of zones()){
      if (zoneApplies(zone, actor) && Math.abs(actor.x - zoneX(zone)) <= zone.radius) zoneHit(zone, actor);
    }
    actor.conds = actor.conds.filter(c => --c.turns > 0);
    for (const foe of foes){
      if (foe.guided?.source === actor && foe.guided.round < round) delete foe.guided;
    }
  }
  let rounds = 0;
  for (; round <= MAX_ROUNDS && !done(); round++){
    rounds++;
    for (const hero of heroes){
      if (hero.summon?.until <= round) hero.summon = null;
    }
    for (const actor of order){
      turn++;
      if (actor.tally){
        actor.shield = false;
        if (actor.concentration?.expires <= round) actor.concentration = null;
      }
      if (up(actor)){
        if (actor.tally) heroTurn(actor);
        else simpleTurn(actor, targetsOf(actor));
        endTurn(actor);
      }
      if (done()) break;
      if (up(actor.summon)){
        turn++;
        simpleTurn(actor.summon, targetsOf(actor.summon));
        endTurn(actor.summon);
      }
      if (done()) break;
    }
  }
  const won = Number(!foes.some(up) && heroes.some(up));
  const party = totals();
  party.rounds = rounds;
  party.won = won;
  for (const hero of heroes){
    hero.tally.rounds = rounds;
    hero.tally.won = won * Number(up(hero));
    hero.tally.hpLeft = hero.hp;
    mergeTotals(party, hero.tally, ['won', 'rounds']);
  }
  return { heroes:heroes.map(h => h.tally), party };
}

function mergeTotals(total, add, skip = []){
  for (const key of Object.keys(add)){
    if (skip.includes(key)) continue;
    const value = add[key];
    if (typeof value === 'number') total[key] = (Object.hasOwn(total, key) ? total[key] : 0) + value;
    else mergeTotals(total[key], value);
  }
}
function average(total, fights){
  return Object.fromEntries(Object.entries(total).map(([key, value]) =>
    [key, typeof value === 'number' ? value / fights : average(value, fights)]));
}

function heroBuild({ calling, path, lvl = 3 }, spells){
  const c = callingOf({ calling });
  if (!c) throw new RangeError(`Unknown Calling: ${calling}`);
  if (path != null && !c.paths.some(p => p.id === path)) throw new RangeError(`Unknown Path for ${calling}: ${path}`);
  if (!Number.isInteger(lvl) || lvl < 1 || lvl > 20) throw new RangeError('Use a whole level from 1 to 20.');
  return buildHero(c, path, lvl, spells);
}
function foeBuild(foe){
  const entry = typeof foe === 'string' ? FOES.get(foe) : foe;
  if (!entry?.attacks?.length) throw new RangeError('Choose a bestiary foe with attacks.');
  return buildFoe(entry);
}

function trials(builds, monsters, fights, rng, legacy = false){
  if (!Number.isInteger(fights) || fights < 1) throw new RangeError('Use at least one fight.');
  const roll = (n, sides) => {
    let total = 0;
    for (let i = 0; i < n; i++) total += 1 + Math.floor(rng() * sides);
    return total;
  };
  const heroes = builds.map(totals), party = totals();
  for (let i = 0; i < fights; i++){
    const result = encounter(builds, monsters, roll, legacy);
    result.heroes.forEach((r, j) => mergeTotals(heroes[j], r));
    mergeTotals(party, result.party);
  }
  return { heroes:heroes.map(t => average(t, fights)), party:average(party, fights) };
}

// Damage measures actual removed HP. Each hero gets credit for their own summon.
export function simulate({ calling, path, lvl = 3, foe = benchmarkFoe(lvl), fights = 200, rng = mulberry32(11), spells = true } = {}){
  return trials([heroBuild({ calling, path, lvl }, spells)], [foeBuild(foe)], fights, rng, !spells).heroes[0];
}

// A high two-hero XP budget, spent on a group rather than a solo foe.
// Use the campaign's Seep/Bloom creatures up to level ten, then widen the pool.
export function benchmarkParty(lvl){
  const budget = budgetFor([lvl, lvl], 'high');
  const pool = [...FOES.values()].filter(f => f.attacks?.length && xpOf(f) > 0 && !f.tags?.includes('boss') &&
    (lvl > 10 || ['seep', 'bloom'].includes(f.fam))).sort((a, b) => xpOf(b) - xpOf(a));
  const foes = [];
  let xp = 0;
  while (foes.length < 4){
    const limit = Math.min(budget * .6, budget - xp);
    const next = pool.find(f => xpOf(f) <= limit);
    if (!next) break;
    foes.push(next.id);
    xp += xpOf(next);
  }
  return { foes, budget, xp };
}

// Hero rows follow the input order. Individual wins require survival as well
// as a party win. Party totals include all hero and summon contributions.
export function simulateParty({ heroes, foes, fights = 200, rng = mulberry32(11) } = {}){
  if (!Array.isArray(heroes) || heroes.length !== 2) throw new RangeError('Choose two heroes.');
  const builds = heroes.map(hero => heroBuild(hero, true));
  const roster = foes ?? benchmarkParty(Math.max(...builds.map(h => h.ctx.lvl))).foes;
  if (!Array.isArray(roster) || !roster.length) throw new RangeError('Choose at least one foe.');
  return trials(builds, roster.map(foeBuild), fights, rng);
}
