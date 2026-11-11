import test from 'node:test';
import assert from 'node:assert/strict';
import { woodsBloom, journeyBloom, bloomedTree, BLOOM_LEVELS } from '../src/engine/bloom-woods.js';
import { genDelve } from '../src/engine/generator.js';

// 🌿 engine/bloom-woods.js: how far the Bloom has got into a map's trees, and which trees it has taken.
test('a floor\'s Bloom: its own, or the Moss\'s if the place has been given to it, whichever is more', () => {
  assert.equal(woodsBloom(null), 0); assert.equal(woodsBloom({}), 0);
  assert.equal(woodsBloom({ bloom:.3 }), .3); assert.equal(woodsBloom({ bloom:5 }), 1); assert.equal(woodsBloom({ bloom:'x' }), 0);
  assert.equal(woodsBloom({ decay:{ stage:'infested', intensity:1 } }), .7);
  assert.equal(woodsBloom({ bloom:.9, decay:{ stage:'infested', intensity:.34 } }), .9);
  assert.equal(woodsBloom({ decay:{ stage:'abandoned', intensity:1 } }), 0, 'an empty village is not the Moss');
  assert.deepEqual(BLOOM_LEVELS.map(l => l.v), [0, .3, .7]);
});
test('a road laid while the Bloom is loose has some in its trees, more the harder he looks', () => {
  assert.equal(journeyBloom(false, 9), 0);
  assert.equal(journeyBloom(true, 1), .2);
  assert.ok(journeyBloom(true, 6) > journeyBloom(true, 2));
  assert.ok(journeyBloom(true, 20) <= .55);
});
test('the trees that turn are the same ones, and only more of them as the Bloom grows', () => {
  const rs = Array.from({ length:200 }, (_, i) => (i * 0.6180339887) % 1);
  const taken = b => rs.filter(r => bloomedTree('beech', 'beech-bloomed', r, b) === 'beech-bloomed');
  assert.equal(taken(0).length, 0);
  const some = taken(.3), more = taken(.7);
  assert.ok(some.length > 30 && more.length > some.length);
  assert.ok(some.every(r => more.includes(r)));
  assert.equal(bloomedTree('oak', null, 0, 1), 'oak', 'a tree with no bloomed twin stays as it is');
});
test('a journey set out while the Bloom is loose carries it on every stretch; one set out before does not', () => {
  const meta = b => ({ name:'J', seed:'bloomwoods', floors:1, size:64, template:'journey', journey:{ from:'village', to:'crossroads', seed:'v', n:0, gaze:4, bloom:b } });
  const loose = genDelve(meta(true)), clean = genDelve(meta(false));
  assert.ok(loose.length >= 1 && loose.every(f => f.bloom === journeyBloom(true, 4)));
  assert.ok(clean.every(f => !f.bloom));
});
