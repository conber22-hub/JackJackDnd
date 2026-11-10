import test from 'node:test';
import assert from 'node:assert/strict';
import { plankBridges } from '../src/engine/bridges.js';

// 🌉 engine/bridges.js: the patch of planks where a road crosses a river is one bridge, running across the water.
const P = (x, y) => ({ id:x * 100 + y, k:'bridge', x, y });
test('a solid patch of planks with the river along its sides is one bridge, across the water', () => {
  const W = 20, H = 20, props = [], water = [];
  for (let y = 9; y <= 11; y++) for (let x = 5; x <= 7; x++) props.push(P(x, y));
  for (let y = 1; y < H - 1; y++) if (y < 9 || y > 11) for (let x = 5; x <= 7; x++) water.push(y * W + x);   // the river runs north–south
  const [b, ...more] = plankBridges({ W, H, props, water });
  assert.equal(more.length, 0);
  assert.deepEqual({ x:b.x, y:b.y, w:b.w, h:b.h, ew:b.ew, n:b.cells.length }, { x:5, y:9, w:3, h:3, ew:true, n:9 });
  // the same, turned: the river runs east–west, the bridge north–south
  const props2 = props.map(p => P(p.y, p.x)), water2 = water.map(i => (i % W) * W + ((i / W) | 0));
  assert.equal(plankBridges({ W, H, props:props2, water:water2 })[0].ew, false);
});
test('a jetty, a ragged patch, broken planks and planks over dry ground stay as they are', () => {
  const W = 20, H = 20, water = [8 * W + 5, 8 * W + 6, 12 * W + 5, 12 * W + 6];
  assert.deepEqual(plankBridges({ W, H, props:[P(5, 9), P(6, 9), P(7, 9), P(8, 9)], water }), [], 'a line');
  assert.deepEqual(plankBridges({ W, H, props:[P(5, 9), P(6, 9), P(5, 10), P(6, 10), P(7, 10)], water }), [], 'ragged');
  assert.deepEqual(plankBridges({ W, H, props:[P(5, 9), P(6, 9), P(5, 10), { ...P(6, 10), broken:true }], water }), [], 'a plank gone');
  assert.deepEqual(plankBridges({ W, H, props:[P(5, 9), P(6, 9), P(5, 10), P(6, 10)], water:[] }), [], 'no water');
  assert.deepEqual(plankBridges({ W, H }), []);
});
