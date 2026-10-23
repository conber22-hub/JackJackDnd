import test from 'node:test';
import assert from 'node:assert/strict';
import { CHECKS, checkById, bonusFor, resolveRoll, groupOk, keepDie } from '../src/engine/checks.js';
import { heroToken, newHero } from '../src/engine/hero.js';

test('the checks the DM can ask for: six saves, eighteen skills, six ability checks', () => {
  assert.equal(CHECKS.length, 30);
  assert.equal(checkById('save:Dex').label, 'Dexterity saving throw');
  assert.equal(checkById('skill:Stealth').ab, 'Dex');
  assert.equal(checkById('nope'), null);
});

test('bonuses come from the hero\'s sheet; anyone else falls back to their one save and check numbers', () => {
  const h = newHero('Rogue'); h.name = 'Vex';
  const t = heroToken(h);
  assert.ok(t.skills && t.mods, 'hero tokens carry skills and ability modifiers');
  assert.equal(bonusFor(t, checkById('save:Dex')), t.saves.dex);
  assert.equal(bonusFor(t, checkById('skill:Stealth')), t.skills.Stealth);
  assert.equal(bonusFor(t, checkById('ability:Str')), t.mods.str);
  const z = { saveMod:1, check:2, passive:9 };
  assert.equal(bonusFor(z, checkById('save:Wis')), 1);
  assert.equal(bonusFor(z, checkById('skill:Perception')), -1, 'Perception from passive Perception');
  assert.equal(bonusFor(z, checkById('skill:Athletics')), 2);
});

test('a roll against a DC, a group check, and advantage', () => {
  assert.deepEqual(resolveRoll(14, 3, 15), { d20:14, bonus:3, total:17, ok:true, nat20:false, nat1:false });
  assert.equal(resolveRoll(1, 20, 15).ok, true, 'a natural 1 on a save is just a low die');
  assert.equal(resolveRoll(12, 0, null).ok, null, 'no DC, no verdict');
  assert.equal(groupOk([{ ok:true }, { ok:false }]), true, 'half is enough');
  assert.equal(groupOk([{ ok:true }, { ok:false }, { ok:false }]), false);
  assert.equal(keepDie(4, 17, 'adv'), 17); assert.equal(keepDie(4, 17, 'dis'), 4); assert.equal(keepDie(4, 17, 'normal'), 4);
});
