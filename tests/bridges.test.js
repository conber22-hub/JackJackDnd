import test from 'node:test';
import assert from 'node:assert/strict';
import { plankBridges, bridgeKind, BRIDGE_KINDS } from '../src/engine/bridges.js';
import { journeySpecs, BRIDGE_NOTES } from '../src/engine/overland.js';
import { VALLEY_ROADS } from '../src/data/barovia-map.js';

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
test('on the valley\'s river roads the planks are always one square patch with the river above and below', () => {
  let bridges = 0; const kinds = new Set();
  for (const r of VALLEY_ROADS.filter(r => r.river)) for (const [from, to] of [[r.a, r.b], [r.b, r.a]]){
    for (const { layout, road } of journeySpecs({ from, to, seed:'bridges', n:0, gaze:1, bloom:false })){
      const planks = layout.props.filter(p => p[0] === 'bridge'); if (planks.length < 4) continue;
      const W = 64, props = planks.map(([k, x, y], id) => ({ id, k, x, y })), water = layout.water.map(([x, y]) => y * W + x);
      const found = plankBridges({ W, H:64, props, water, bridge:layout.bridge });
      assert.equal(found.length, 1, `${from} > ${to}: one bridge`); assert.equal(found[0].ew, true); assert.equal(found[0].cells.length, planks.length);
      // the road's own kind of bridge, and the DM hears of that one
      const want = VALLEY_ROADS.find(x => x.id === road).bridge;
      assert.equal(found[0].kind, want, `${road}: a ${want} bridge`); kinds.add(want);
      assert.ok(layout.rooms[0][6].includes(BRIDGE_NOTES[want]), `${road}: the note`);
      bridges++;
    }
  }
  assert.ok(bridges >= 2, 'some of the river roads do cross their river');
  assert.ok(kinds.size >= 2, 'not every bridge is the same');
});
test('a floor that says nothing of its bridge has a timber one; every kind has its note', () => {
  assert.equal(bridgeKind({}), 'timber'); assert.equal(bridgeKind({ bridge:'nonsense' }), 'timber'); assert.equal(bridgeKind({ bridge:'rope' }), 'rope');
  for (const k of BRIDGE_KINDS) assert.ok(BRIDGE_NOTES[k], k);
});
