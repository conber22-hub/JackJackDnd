import test from 'node:test';
import assert from 'node:assert/strict';
import { report } from '../scripts/callings-balance.mjs';
import { BEST } from '../src/data/bestiary.js';
import { CALLINGS } from '../src/data/callings.js';
import { benchmarkParty, simulate, simulateParty } from '../src/engine/balance.js';
import { budgetFor, xpOf } from '../src/engine/encounter.js';
import { riteName } from '../src/engine/rites.js';
import { mulberry32 } from '../src/util/core.js';

const hoplite = lvl => ({ calling:'vanguard', path:'hoplite', lvl });
const target = (d, b, speed) => ({
  hp:300, ac:10, speed, saveMod:0, attacks:[{ n:'Strike', d, b, t:'bludgeoning', m:1 }],
});

test('a seeded trial is repeatable with an id or the corresponding bestiary entry', () => {
  const setup = { calling:'huscarl', path:'rotblood', lvl:5, foe:'husk', fights:30 };
  const result = simulate({ ...setup, rng:mulberry32(52) });
  assert.deepEqual(result, simulate({ ...setup, foe:BEST.husk, rng:mulberry32(52) }));
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  assert.ok(result.featuresUsed['Red Blisters'] > 0);
  assert.ok(result.seep.marks + result.seep.drain + result.seep.hp > 0);
});

test('the same level five build usually beats a CR 1/4 foe and loses to CR 8', () => {
  const setup = { calling:'warden', path:'last-bastion', lvl:5 };
  assert.equal(BEST.wolf.cr, '1/4');
  assert.equal(BEST['srd-frost-giant'].cr, '8');
  assert.ok(simulate({ ...setup, foe:'wolf', rng:mulberry32(37) }).won >= .95);
  assert.ok(simulate({ ...setup, foe:'srd-frost-giant', rng:mulberry32(37) }).won <= .05);
});

test('a level five Archivist wins more often with spells than in the old duel', () => {
  const setup = { calling:'archivist', path:'strategist', lvl:5, fights:100 };
  const old = simulate({ ...setup, spells:false });
  const result = simulate(setup);
  assert.ok(result.won > old.won);
  assert.ok(result.spells.casts[riteName('Fireball', 'archivist')] > 0);
  assert.deepEqual(old.spells.slotsSpent, {});
});

test('a long fight exhausts the prepared caster’s slots and then uses the free cantrip', () => {
  const result = simulate({ calling:'archivist', lvl:3, foe:target('0', -10, 25), fights:1, rng:mulberry32(2) });
  assert.deepEqual(result.spells.slotsSpent, { 1:4, 2:2 });
  assert.equal(result.spells.casts[riteName('Scorching Ray', 'archivist')], 2);
  assert.equal(result.spells.cantrips[riteName('Fire Bolt', 'archivist')], result.rounds - 6);
});

test('a new concentration spell replaces the previous one and damage can break the active spell', () => {
  const foe = target('7', 50, 35);
  const result = simulate({ calling:'chaplain', lvl:5, foe, fights:1, rng:mulberry32(2) });
  const { started, replaced, broken, casts } = result.spells;
  assert.ok(casts[riteName('Spiritual Weapon', 'chaplain')] > 0);
  assert.ok(casts[riteName('Shield of Faith', 'chaplain')] > 0);
  assert.ok(replaced > 0);
  assert.ok(broken > 0);
  assert.equal(started, replaced + broken);
});

test('a single area cast hits multiple party foes and each takes half on its save', () => {
  const foe = { ...target('200', 50, 60), init:-20, hp:13, ac:100, saveMod:25 };
  const { heroes:[archivist], party } = simulateParty({
    heroes:[{ calling:'archivist', lvl:5 }, hoplite(5)], foes:[foe, foe], fights:1, rng:() => .49,
  });
  // Eight fixed 3s deal 24 raw damage, halved to 12 per foe on their successful saves.
  assert.equal(archivist.spells.casts[riteName('Fireball', 'archivist')], 1);
  assert.equal(archivist.dmgDealt, 24);
  assert.equal(party.rounds, 1);
  assert.equal(party.won, 0);
});

test('an aura helps the other hero, and a fallen ally can trigger a reaction', () => {
  const base = { ...target('1', 50, 35), init:50, hp:50, ac:20 };
  const frightening = { ...base, attacks:[{ ...base.attacks[0], on:{ cond:'frightened', save:'wis', dc:15 } }] };
  const { heroes:[templar, partner] } = simulateParty({
    heroes:[{ calling:'warden', path:'templar', lvl:10 }, hoplite(10)], foes:[frightening], fights:1, rng:() => .49,
  });
  assert.ok(templar.featuresUsed.Processional > 0);
  assert.equal(partner.featuresUsed.Processional, undefined);

  const lethal = { ...base, attacks:[{ ...base.attacks[0], d:'42' }] };
  const { heroes:[warden] } = simulateParty({
    heroes:[{ calling:'warden', path:'last-bastion', lvl:3 }, hoplite(3)], foes:[lethal], fights:1, rng:() => .49,
  });
  assert.ok(warden.featuresUsed['Reach the Fallen'] > 0);
});

test('a seeded party gives the Outrider Sneak Attack and keeps its damage in the individual row', () => {
  const outrider = { calling:'outrider', path:'horse-archer', lvl:5 };
  const setup = { heroes:[outrider, hoplite(5)], fights:30 };
  const run = () => simulateParty({ ...setup, rng:mulberry32(11) });
  const result = run();
  assert.deepEqual(result, run());
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  const [hero, partner] = result.heroes;
  assert.equal(simulate({ ...outrider, fights:30 }).featuresUsed.Ambush, undefined);
  assert.ok(hero.featuresUsed.Ambush > 0);
  assert.equal(partner.featuresUsed.Ambush, undefined);
  assert.equal(result.party.featuresUsed.Ambush, hero.featuresUsed.Ambush);
  assert.ok(Math.abs(result.party.dmgDealt - hero.dmgDealt - partner.dmgDealt) < 1e-9);
});

test('party healing and the Hoplite’s ally-hit reaction can both fire', () => {
  const { heroes:[chaplain, partner] } = simulateParty({
    heroes:[{ calling:'chaplain', path:'corpsman', lvl:10 }, hoplite(10)], fights:30,
  });
  assert.ok(chaplain.spells.allyHeals > 0);
  assert.ok(partner.featuresUsed['Lock Shields'] > 0);
});

test('every Calling and Path simulates at each level from one to ten in both modes', () => {
  for (let lvl = 1; lvl <= 10; lvl++){
    const { foes, budget, xp } = benchmarkParty(lvl);
    assert.ok(foes.length >= 2);
    assert.equal(budget, budgetFor([lvl, lvl], 'high'));
    assert.equal(xp, foes.reduce((sum, id) => sum + xpOf(BEST[id]), 0));
    assert.ok(xp <= budget);
    for (const { id:calling, paths } of Object.values(CALLINGS)){
      for (const { id:path } of paths){
        const hero = { calling, path, lvl };
        const duel = simulate({ ...hero, fights:2 });
        const { heroes, party } = simulateParty({ heroes:[hero, hoplite(lvl)], foes, fights:2 });
        for (const result of [duel, ...heroes, party]){
          assert.ok(result.won >= 0 && result.won <= 1);
          assert.ok(result.rounds >= 1 && result.rounds <= 30);
          for (const value of [result.dmgDealt, result.dmgTaken, result.hpLeft, ...Object.values(result.featuresUsed)]){
            assert.ok(Number.isFinite(value) && value >= 0, `${calling} / ${path} at level ${lvl}`);
          }
        }
      }
    }
  }
});

test('the requested level reports both modes, all Paths, rite names and flags', () => {
  const output = report([3], 12);
  assert.match(output, /^## Level 3 /m);
  assert.doesNotMatch(output, /^## Level (5|10) /m);
  const modes = output.split(/^### (?:Duel with spells|Two-hero party)$/m).slice(1);
  assert.equal(modes.length, 2);
  for (const mode of modes){
    const rows = mode.split('\n').filter(line => /^\| (?!Calling|---)/.test(line));
    assert.equal(rows.length, 36);
    for (const { name, paths } of Object.values(CALLINGS)){
      for (const path of paths) assert.equal(rows.filter(row => row.startsWith(`| ${name} | ${path.name} | `)).length, 1);
    }
    assert.match(mode, /Seep price \(mark \/ drain \/ HP\)/);
    assert.match(mode, /DPR↑/);
    assert.match(mode, /DPR↓/);
  }
  assert.match(output, /The Unerring Errata/);
  assert.match(output, /Largest changes from the weapons and damage-cantrip duel/);
});
