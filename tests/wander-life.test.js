import test from 'node:test';
import assert from 'node:assert/strict';
import { levelFor, xpForNext, shareXp, autoLevel, mainAbility, fightLoot, advanceQuests, questText, questOpen, loyalty, reactions, clampApproval, resolveChoice, momentChance, nextMoment, upgradeWander } from '../src/engine/wander-life.js';
import { QUESTS, MOMENTS, LIKES, MOOD, COMPANIONS, questById } from '../src/data/wander.js';
import { newHero, heroWarnings, heroStats, SP } from '../src/engine/hero.js';
import { itemInfo } from '../src/engine/inventory.js';
import { mulberry32 } from '../src/util/core.js';

test('XP: the 5e table, shared by the party', () => {
  assert.equal(levelFor(0), 1); assert.equal(levelFor(299), 1); assert.equal(levelFor(300), 2); assert.equal(levelFor(2700), 4); assert.equal(levelFor(1e9), 20);
  assert.equal(xpForNext(1), 300); assert.equal(xpForNext(20), null);
  assert.equal(shareXp(100, 3), 33); assert.equal(shareXp(50, 0), 50);
});

test('levelling up by itself: an ability increase into the main ability, spells filled to the new limits, nothing chosen undone', () => {
  assert.equal(mainAbility('Wizard'), 'Int'); assert.equal(mainAbility('Fighter'), 'Str'); assert.equal(mainAbility('Rogue'), 'Dex');
  const f = newHero('Fighter'); f.name = 'Vasha';
  const f4 = autoLevel(f, 4);
  assert.equal(f4.lvl, 4); assert.deepEqual(f4.asi[4], { feat:'Ability Score Improvement', ab:'Str' });
  assert.deepEqual(heroWarnings(f4).filter(w => /ability increase|feat/.test(w)), []);
  assert.ok(heroStats(f4).hp > heroStats(f).hp);
  assert.equal(f.lvl, 1, 'the old sheet is left alone');
  // a cleric with two spells of their own keeps them and gains the rest
  const c = newHero('Cleric'); c.name = 'Dorin'; c.spells = ['Sacred Flame', 'Cure Wounds'];
  const c3 = autoLevel(c, 3);
  for (const n of ['Sacred Flame', 'Cure Wounds']) assert.ok(c3.spells.includes(n));
  assert.ok(c3.spells.some(n => SP(n)?.l === 2), 'a level-2 spell at level 3');
  assert.deepEqual(heroWarnings(c3).filter(w => /Too many/.test(w)), []);
  assert.ok(c3.spells.length > c.spells.length);
  // a fighter past 18 Str puts the next increase into Constitution
  const big = newHero('Fighter'); big.ab.Str = 18; big.asi = { 4:{ feat:'Ability Score Improvement', ab:'Str' } };
  assert.equal(autoLevel(big, 8).asi[8].ab, 'Con');
  // never past 20, never down
  assert.equal(autoLevel({ ...f, lvl:20 }, 25).lvl, 20); assert.equal(autoLevel({ ...f, lvl:5 }, 3).lvl, 5);
});

test('loot: coins for every fight, potions now and then, all of it real items', () => {
  assert.deepEqual(fightLoot(0), { gp:0, sp:0, items:[] });
  const rng = mulberry32(5); let potions = 0, gp = 0;
  for (let k = 0; k < 200; k++){ const l = fightLoot(100, { level:2, rng }); gp += l.gp; potions += l.items.filter(n => n === 'Potion of Healing').length; for (const n of l.items) assert.ok(itemInfo(n), n); assert.ok(l.gp >= 0 && l.sp >= 0 && l.sp < 10); }
  assert.ok(potions > 40 && potions < 120, `${potions} potions`); assert.ok(gp / 200 > 10 && gp / 200 < 40, `${gp / 200} gp a fight`);
});

test('quests: steps counted from what happens, the order kept, rewards only once', () => {
  let q = [{ id:'wolves', step:0, n:0 }, { id:'ilse-post', step:0, n:0 }];
  let r = advanceQuests(q, QUESTS, { k:'arrive', place:'village' });
  assert.deepEqual(r.stepped, [], 'the bounty is not collected before the wolves');
  r = advanceQuests(q, QUESTS, { k:'win', road:true, from:'village', to:'vallaki' });
  assert.deepEqual(r.stepped, ['wolves']); assert.equal(r.quests[0].n, 1); assert.equal(questText(r.quests[0], questById('wolves')), 'Win two fights on the roads (1 of 2)');
  assert.equal(q[0].n, 0, 'the old list is left alone');
  r = advanceQuests(r.quests, QUESTS, { k:'win', road:true, from:'village', to:'vallaki' }); assert.equal(r.quests[0].step, 1);
  r = advanceQuests(r.quests, QUESTS, { k:'win', road:false, place:'village' }); assert.equal(r.quests[0].step, 1, 'a fight in a village is not on the road');
  r = advanceQuests(r.quests, QUESTS, { k:'arrive', place:'village' }); assert.deepEqual(r.done, ['wolves']);
  assert.deepEqual(advanceQuests(r.quests, QUESTS, { k:'arrive', place:'village' }).done, [], 'done is done');
  // Ilse's: the crossroads, then a fight on a road to or from it (not any road)
  q = [{ id:'ilse-post', step:0, n:0 }];
  q = advanceQuests(q, QUESTS, { k:'arrive', place:'crossroads' }).quests;
  assert.equal(advanceQuests(q, QUESTS, { k:'win', road:true, from:'village', to:'vallaki' }).quests[0].step, 1);
  assert.deepEqual(advanceQuests(q, QUESTS, { k:'win', road:true, from:'crossroads', to:'tser' }).done, ['ilse-post']);
  // a companion's own quest: only when they're along and like the hero enough
  const d = questById('ilse-post');
  assert.equal(questOpen(d, { party:[], approval:{ ilse:90 } }), false);
  assert.equal(questOpen(d, { party:[{ id:'ilse' }], approval:{ ilse:10 } }), false);
  assert.equal(questOpen(d, { party:[{ id:'ilse' }], approval:{ ilse:30 } }), true);
  assert.equal(questOpen(d, { party:[{ id:'ilse' }], approval:{ ilse:30 }, quests:[{ id:'ilse-post' }] }), false);
  for (const qd of QUESTS){ assert.ok(qd.steps.length && qd.title && qd.text && qd.reward, qd.id); if (qd.reward.item) assert.ok(itemInfo(qd.reward.item), qd.reward.item); }
  for (const c of COMPANIONS) assert.ok(QUESTS.some(x => x.from === c.id), `${c.id} has a quest of their own`);
});

test('approval: each companion has their own likes; the words for how they feel', () => {
  const party = [{ id:'ilse' }, { id:'dorin' }, { id:'tamas' }];
  const r = Object.fromEntries(reactions(party, ['greed', 'cruel'], LIKES).map(x => [x.id, x.n]));
  assert.ok(r.ilse < 0 && r.dorin < 0, 'the watch and the priest hate it'); assert.equal(r.tamas, 0 || undefined);
  assert.deepEqual(reactions(party, ['faith'], LIKES).map(x => [x.id, x.n > 0]), [['dorin', true], ['tamas', false]]);
  assert.deepEqual(reactions(party, [], LIKES), []);
  assert.equal(clampApproval(140), 100); assert.equal(clampApproval(-300), -100);
  assert.deepEqual([90, 30, 0, -40, -70].map(n => loyalty(n).k), ['devoted', 'warm', 'wary', 'cold', 'leaving']);
  for (const c of COMPANIONS){ assert.ok(LIKES[c.id], c.id); for (const k of ['up', 'down', 'devoted', 'warm', 'wary', 'cold', 'leaving']) assert.ok(MOOD[c.id][k], `${c.id} ${k}`); }
});

test('roadside choices: a skill check rolled for the hero, a 1 always fails, a 20 always works; scenes once a stretch', () => {
  const cart = MOMENTS.find(m => m.id === 'cart'), push = cart.options[0], by = cart.options[2];
  assert.equal(resolveChoice(push, { Athletics:5 }, 6).ok, true); assert.equal(resolveChoice(push, { Athletics:5 }, 5).ok, false);
  assert.equal(resolveChoice(push, { Athletics:20 }, 1).ok, false); assert.equal(resolveChoice(push, { Athletics:-5 }, 20).ok, true);
  assert.equal(resolveChoice(push, {}, 4).out, push.fail);
  assert.deepEqual(resolveChoice(by, {}, 1), { ok:true, d20:null, bonus:0, total:null, dc:null, skill:null, out:by.ok });
  assert.equal(momentChance({ quiet:10 }), 0); assert.ok(momentChance({ quiet:30 }) > 0); assert.equal(momentChance({ quiet:90, had:true }), 0);
  assert.equal(nextMoment(MOMENTS, MOMENTS.map(m => m.id)), null);
  assert.equal(nextMoment(MOMENTS, MOMENTS.slice(1).map(m => m.id)).id, MOMENTS[0].id);
  for (const m of MOMENTS) for (const o of m.options){ assert.ok(o.ok?.text, `${m.id}/${o.k}`); if (o.check) assert.ok(heroStats(newHero('Rogue')).skills[o.check.skill] !== undefined, o.check.skill); if (o.ok.item) assert.ok(itemInfo(o.ok.item)); }
  const w = upgradeWander({ v:1 }); assert.deepEqual([w.quests, w.approval, w.moments], [[], {}, []]);
});
