import { test } from 'node:test';
import assert from 'node:assert/strict';
import { underfoot, printSide, stepAngle } from '../src/engine/underfoot.js';

const f = () => ({ W:10, grid:[...Array(100)].map((_, i) => (i % 10 === 5 ? 2 : 1)), shallow:[33], props:[{ k:'bush', x:7, y:7 }, { k:'puddle', x:1, y:1 }],
  rooms:[{ x:0, y:0, w:10, h:10, outdoor:true }, { x:8, y:0, w:2, h:2, outdoor:false }] });

test('what a step feels like, square by square', () => {
  assert.equal(underfoot(f(), 3, 3), 'splash');            // (a ford)
  assert.equal(underfoot(f(), 1, 1), 'splash');            // (a puddle)
  assert.equal(underfoot(f(), 5, 4), 'dust');              // (the road)
  assert.equal(underfoot(f(), 2, 4), 'grass');             // (open ground)
  assert.equal(underfoot(f(), 7, 7), 'rustle');            // (brush)
  assert.equal(underfoot(f(), 2, 4, { snow:.5 }), 'snow');
  assert.equal(underfoot(f(), 3, 3, { snow:.9 }), 'splash');   // (water is water)
  assert.equal(underfoot(f(), 2, 4, { wet:.6 }), 'mud');
  assert.equal(underfoot(f(), 2, 4, { indoors:true }), 'stone');
  assert.equal(underfoot(f(), 9, 0, { snow:.9 }), 'stone');    // (under a roof)
  assert.equal(underfoot(null, 0, 0), 'stone');
});
test('prints go left, right, left, and point the way of the step', () => {
  assert.deepEqual([0, 1, 2, 3].map(printSide), [-1, 1, -1, 1]);
  assert.equal(stepAngle(0, 1), 0); assert.ok(Math.abs(stepAngle(1, 0) - Math.PI / 2) < 1e-9);
});
