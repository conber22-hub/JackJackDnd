import test from 'node:test';
import assert from 'node:assert/strict';
import * as npcs from '../src/data/npcs.js';

const traits = ['NPC_OCCUPATIONS', 'NPC_LOOKS', 'NPC_QUIRKS', 'NPC_VOICES', 'NPC_WANTS', 'NPC_FEARS'];
const nameParts = ['feminine', 'masculine', 'neutral', 'surnames'];

test('NPC generator exports both name pools and at least 30 choices per trait', () => {
  for (const key of ['NPC_NAMES', 'VISTANI_NAMES']){
    assert.deepEqual(Object.keys(npcs[key]).sort(), [...nameParts].sort(), key);
    for (const part of nameParts) assert.ok(Array.isArray(npcs[key][part]), `${key}.${part} must be a table`);
  }
  for (const key of traits){
    assert.ok(Array.isArray(npcs[key]), `${key} must be a table`);
    assert.ok(npcs[key].length >= 30, `${key} needs at least 30 choices`);
  }
});

test('every NPC table is non-empty, unique and contains single lines of at most 120 characters', () => {
  const seen = new Map();
  const visit = (value, path) => {
    if (!Array.isArray(value)){
      assert.ok(value && typeof value === 'object', `${path} must contain tables`);
      assert.ok(Object.keys(value).length, `${path} must not be empty`);
      for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
      return;
    }
    assert.ok(value.length, `${path} must not be empty`);
    for (const line of value){
      assert.equal(typeof line, 'string', `${path} contains a non-string`);
      assert.ok(line.trim().length, `${path} contains a blank entry`);
      assert.equal(line, line.trim(), `${path}: surrounding whitespace in ${JSON.stringify(line)}`);
      assert.ok(!/[\r\n\u2028\u2029]/u.test(line), `${path}: entry must fit on one line`);
      assert.ok([...line].length <= 120, `${path}: entry exceeds 120 characters: ${line}`);
      const key = line.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ');
      assert.ok(!seen.has(key), `${path}: duplicate of ${seen.get(key)}: ${line}`);
      seen.set(key, path);
    }
  };
  for (const [key, value] of Object.entries(npcs)) visit(value, key);
});
