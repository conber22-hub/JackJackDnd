import test from 'node:test';
import assert from 'node:assert/strict';
import { orchardTrees, orchardTree } from '../src/engine/orchard.js';
import { genPlace } from '../src/engine/settlement.js';
import { CROPS } from '../src/data/props.js';

// 🍎 engine/orchard.js: the apple trees of an orchard field, where they stand and what has become of them.
test('an orchard\'s trees stand where four of its squares meet, two apart, every other row set over', () => {
  const r = { x:10, y:20, w:7, h:5 }, trees = orchardTrees(r);
  assert.deepEqual(trees, [[11, 21], [13, 21], [15, 21], [12, 23], [14, 23], [16, 23]]);
  for (const [cx, cy] of trees){ assert.ok(cx - 1 >= r.x && cx < r.x + r.w, 'the four squares are inside the field'); assert.ok(cy - 1 >= r.y && cy < r.y + r.h); }
  assert.deepEqual(orchardTrees({ x:0, y:0, w:1, h:1 }), [], 'a single square has no corner inside it');
});
test('the Bloom takes the same trees, more as it grows; the blight kills some when the Count looks hard', () => {
  const rs = Array.from({ length:200 }, (_, i) => [(i * 0.6180339887) % 1, (i * 0.7548776662) % 1]);
  const count = (b, w, kind) => rs.filter(([rb, rw]) => orchardTree(b, w, rb, rw) === kind).length;
  assert.equal(count(0, 0, 'healthy'), 200);
  const some = rs.filter(([rb, rw]) => orchardTree(.3, 0, rb, rw) === 'bloomed'), more = rs.filter(([rb, rw]) => orchardTree(.7, 0, rb, rw) === 'bloomed');
  assert.ok(some.length > 30 && more.length > some.length && some.every(t => more.includes(t)));
  assert.equal(count(0, 2, 'dead'), 0, 'not until the fields blight');
  assert.ok(count(0, 5, 'dead') > count(0, 3, 'dead') && count(0, 3, 'dead') > 0);
});
test('villages plant orchards among their fields, in grass and without a scarecrow', () => {
  assert.ok(CROPS.orchard.field && CROPS.orchard.notes);
  let found = 0;
  for (let seed = 1; seed <= 60 && found < 3; seed++){
    const lay = genPlace('village', { seed, name:'Testvale', last:true });
    for (const r of lay.rooms.filter(r => r[7]?.crop === 'orchard')){
      found++; assert.equal(r[7].ground, 'grass'); assert.equal(r[5], CROPS.orchard.field);
      const [x, y, w, h] = r; assert.ok(!lay.props.some(p => p[0] === 'scarecrow' && p[1] >= x && p[1] < x + w && p[2] >= y && p[2] < y + h));
    }
  }
  assert.ok(found >= 1, 'some village in sixty has an orchard');
});
