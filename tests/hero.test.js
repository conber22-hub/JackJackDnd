import test from 'node:test';
import assert from 'node:assert/strict';
import { newHero, heroStats, heroAttacks, heroToken, castables, heroWarnings, spellLimits, maxSpellLevel } from '../src/engine/hero.js';

test('level 1 fighter: chain mail + shield + Defense, Soldier background', () => {
  const h = newHero('Fighter'); h.name = 'Ilse';
  const st = heroStats(h);
  assert.equal(st.sc.Str, 17); assert.equal(st.sc.Con, 14);          // Soldier +2 Str, +1 Con
  assert.equal(st.ac, 16 + 2 + 1);
  assert.equal(st.hp, 10 + 2);
  assert.equal(st.pb, 2);
  const atk = heroAttacks(h, st);
  assert.equal(atk[0].n, 'Longsword'); assert.equal(atk[0].b, 2 + 3); assert.equal(atk[0].d, '1d8+3');
  assert.deepEqual(heroWarnings(h), []);
});

test('level 5 wizard (Sage): slots, spell DC, cantrip scaling, area spells', () => {
  const h = newHero('Wizard'); h.name = 'Ambrose'; h.lvl = 5; h.bg = 'Sage'; h.bg2 = 'Int'; h.bg1 = 'Con'; h.asi = { 4:'Int' };
  h.spells = ['Fire Bolt', 'Fireball', 'Shield'];
  const st = heroStats(h);
  assert.equal(st.sc.Int, 15 + 2 + 2);
  assert.equal(st.dc, 8 + 3 + 4);
  assert.deepEqual(st.slots, [4, 3, 2]);
  assert.equal(maxSpellLevel(h), 3);
  const fb = heroAttacks(h, st).find(a => a.n === 'Fire Bolt');
  assert.equal(fb.d, '2d10'); assert.equal(fb.b, 3 + 4);
  const fireball = castables(h, st).find(c => c.n === 'Fireball');
  assert.equal(fireball.dc, 15); assert.equal(fireball.rad, 4); assert.equal(fireball.half, true);
  assert.equal(spellLimits(h).prepared, 9 + 1);                     // Sage's Magic Initiate adds one
  assert.equal(st.hp, 6 + 2 + 4 * (4 + 2));                          // d6, Con 14
});

test('rogue expertise doubles proficiency; passive Perception follows it', () => {
  const h = newHero('Rogue'); h.name = 'Mira'; h.bg = 'Criminal'; h.bg2 = 'Dex'; h.bg1 = 'Con';
  h.skills = ['Perception', 'Investigation', 'Acrobatics', 'Deception']; h.expert = ['Perception', 'Stealth'];
  const st = heroStats(h);
  assert.equal(st.skills.Perception, 0 + 2 + 2);
  assert.equal(st.passive, 14);
  assert.equal(st.check, 3 + 2);                                     // thieves' tools
  assert.ok(heroAttacks(h, st)[0].f.includes('Sneak Attack +1d6'));
});

test('a hero becomes a token with per-ability saves', () => {
  const h = newHero('Cleric'); h.name = 'Sister Anca'; h.lvl = 3; h.spells = ['Sacred Flame', 'Healing Word'];
  const t = heroToken(h);
  assert.equal(t.kind, 'pc'); assert.equal(t.charId, h.id);
  assert.equal(t.saves.wis, heroStats(h).saves.Wis);
  assert.ok(t.casts.some(c => c.n === 'Sacred Flame' && c.sv === 'dex'));
  assert.ok(t.casts.some(c => c.n === 'Cure Wounds' && c.k === 'heal'), 'Life Domain spells are added at 3');
  assert.match(t.cls, /Cleric 3 · Life Domain/);
});
