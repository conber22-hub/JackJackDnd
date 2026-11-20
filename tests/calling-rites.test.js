import test from 'node:test';
import assert from 'node:assert/strict';
import { spellReading, spellWord, riteSpells, magicWord } from '../src/game/calling.js';
import { riteName } from '../src/engine/rites.js';

// ✦ A Calling's hero casts by our names (ChatGPT's data/rites.js, game/calling.js); the rules keep the spell's own
test('a Calling\'s hero knows each spell by its tradition\'s name, and the rules keep the spell\'s own underneath', () => {
  assert.equal(spellWord('Eldritch Blast', { calling:'seepbound' }), riteName('Eldritch Blast', 'seepbound'));
  assert.notEqual(spellWord('Magic Missile', { calling:'archivist' }), 'Magic Missile');
  // a Calling with no tradition of its own reads a borrowed spell as a caster tradition does
  assert.ok(spellReading('Magic Missile', 'vanguard')?.n);
  assert.notEqual(spellWord('Shield', { calling:'vanguard' }), 'Shield');
  // a classic hero, or a spell from a DM's book, keeps the name it has
  assert.equal(spellWord('Magic Missile', { cls:'Wizard 3' }), 'Magic Missile');
  assert.equal(spellWord('Homebrew Hex of Ash', { calling:'archivist' }), 'Homebrew Hex of Ash');
  assert.equal(spellReading(null, 'archivist'), null);
  assert.equal(magicWord({ calling:'archivist' }), 'Protocols'); assert.equal(magicWord({ calling:'vanguard' }), 'Spells'); assert.equal(magicWord(null), 'Spells');
  // on the token: casts and spell attacks renamed, the spell's own name kept in sn, a monster's breath left alone
  const t = { casts:[{ n:'Magic Missile', l:1, k:'atk' }, { n:'Fire Breath', mon:1 }], attacks:[{ n:'Fire Bolt (×2)', f:'Fire Bolt casts a mote' }, { n:'Longsword' }, { n:'Witch Bolt', l:1, sn:'Witch Bolt' }] };
  riteSpells(t, 'archivist');
  assert.equal(t.casts[0].sn, 'Magic Missile'); assert.notEqual(t.casts[0].n, 'Magic Missile'); assert.ok(t.casts[0].line);
  assert.equal(t.casts[1].n, 'Fire Breath'); assert.equal(t.casts[1].sn, undefined);
  assert.equal(t.attacks[0].sn, 'Fire Bolt'); assert.match(t.attacks[0].n, / \(×2\)$/); assert.ok(!t.attacks[0].n.startsWith('Fire Bolt'));
  assert.equal(t.attacks[1].n, 'Longsword');
  // again is the same (it reads the kept name), and Classic puts them all back
  const once = JSON.stringify(t); riteSpells(t, 'archivist'); assert.equal(JSON.stringify(t), once);
  riteSpells(t, null);
  assert.deepEqual([t.casts[0].n, t.casts[0].sn, t.attacks[0].n, t.attacks[0].sn, t.attacks[2].n, t.attacks[2].sn], ['Magic Missile', undefined, 'Fire Bolt (×2)', undefined, 'Witch Bolt', 'Witch Bolt']);
});
