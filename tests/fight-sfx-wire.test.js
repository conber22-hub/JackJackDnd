import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sfxFor } from '../src/engine/fight-sfx.js';
import { ARMOR } from '../src/data/srd.js';

// ui/fightsfx.js reads a hero's armour weight from the SRD table: light armour lets Dex in fully, medium up to 2, heavy none
test('the armour table tells light, medium and heavy apart, and each lands with its own sound', () => {
  assert.equal(ARMOR['Leather'].dex, 99); assert.equal(ARMOR['Chain Shirt'].dex, 2); assert.equal(ARMOR['Plate'].dex, 0);
  const ids = ['none', 'light', 'heavy', 'bone'].map(armour => sfxFor({ t:'land', hit:true, armour }).id);
  assert.equal(new Set(ids).size, 4);
});
