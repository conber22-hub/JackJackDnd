import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { PROP_MODELS } from '../src/data/prop-models.js';
import { PROPS, PROP_TOP } from '../src/data/props.js';

test('every prop model is a real prop, its file is shipped (a binary glTF), and its numbers make sense', () => {
  for (const [k, spec] of Object.entries(PROP_MODELS)){
    assert.ok(PROPS[k], `${k} is a prop`);
    const f = new URL(`../public/assets/props/${spec.file}`, import.meta.url);
    assert.ok(existsSync(f), `${spec.file} is in public/assets/props`);
    assert.equal(readFileSync(f).subarray(0, 4).toString(), 'glTF', `${spec.file} is a .glb`);
    assert.ok(spec.top > 0 || spec.height > 0, `${k} says how tall it is`);
    if (spec.top) assert.ok(PROP_TOP[k] > 0, `${k} has a height heroes stand on`);
  }
  assert.ok(existsSync(new URL('../public/assets/props/kaykit/LICENSE.txt', import.meta.url)), 'the pack\'s licence ships with it');
});
