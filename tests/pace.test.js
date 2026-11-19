import test from 'node:test';
import assert from 'node:assert/strict';
import { paceOf, PACES } from '../src/engine/pace.js';

test('each pace is quicker than the one before, in every wait', () => {
  const [n, q, b] = ['normal', 'quick', 'brisk'].map(paceOf);
  for (const k of ['wind', 'after', 'settle', 'down']){ assert.ok(n[k] > q[k], k); assert.ok(q[k] > b[k], k); assert.ok(b[k] >= 150, k); }
});
test('an unknown pace is normal', () => {
  assert.equal(paceOf('ludicrous'), PACES.normal);
  assert.equal(paceOf(undefined), PACES.normal);
});
