import test from 'node:test';
import assert from 'node:assert/strict';
import * as npcs from '../src/data/npc-starter.js';

test('NPC starter preserves the five flat tables consumed by the generator', () => {
  const minimums = { FIRST:90, LAST:30, VISTANI:90, QUIRKS:120, WANTS:60 };
  assert.deepEqual(Object.keys(npcs).sort(), Object.keys(minimums).sort());
  for (const [key, minimum] of Object.entries(minimums)){
    assert.ok(Array.isArray(npcs[key]), `${key} must be a table`);
    assert.ok(npcs[key].length >= minimum, `${key} needs at least ${minimum} choices`);
    assert.ok(npcs[key].every(line => typeof line === 'string'), `${key} must be flat`);
  }
  assert.ok(npcs.VISTANI.every(name => name.trim().split(/\s+/).length >= 2), 'Vistani choices include a family name');
  assert.ok([...npcs.QUIRKS, ...npcs.WANTS].every(line => !line.endsWith('.')), 'The generator adds punctuation');
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
