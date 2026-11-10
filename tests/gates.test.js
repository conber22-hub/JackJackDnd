import test from 'node:test';
import assert from 'node:assert/strict';
import { genPlace } from '../src/engine/settlement.js';
import { vallakiLayout } from '../src/data/vallaki.js';
import { PROPS, PROP_BLOCK, PROP_HOP } from '../src/data/props.js';

// 🚪 Town gates: a gatehouse stands in each gap of a town's wall (timber for a palisade, stone for a walled village),
// the street running under it; Vallaki's own one-square gates get gate posts. They are walked through, not round.
test('a palisade town and a walled village each get a gatehouse in both gaps of the wall, on the street', () => {
  for (const [kind, gate] of [['town', 'towngate'], ['walled', 'stonegate']]) for (const seed of [1, 7, 'krezk']){
    const lay = genPlace(kind, { seed, name:'Test', last:true }), gates = lay.props.filter(p => p[0] === gate);
    assert.equal(gates.length, 2, `${kind}: two gates`);
    const fill = new Set(lay.fill.map(([x, y]) => x + ',' + y));
    for (const [, x, y, rot] of gates){
      for (let dy = 0; dy < 3; dy++) assert.ok(!fill.has(x + ',' + (y + dy)), `${kind}: the gate stands in the gap, not in the wall`);
      assert.ok(fill.has(x + ',' + (y - 1)) && fill.has(x + ',' + (y + 3)), `${kind}: the wall meets it on both sides`);
      assert.ok(rot === 0 || rot === 2);
    }
    assert.notEqual(gates[0][3], gates[1][3], 'the two gates face each other: each opens into the town');
  }
  assert.equal(genPlace('village', { seed:1, name:'Test', last:true }).props.filter(p => /gate$/.test(p[0])).length, 0, 'an open village has no gates');
});
test('Vallaki\'s three gates have their posts, and none of the gate props stops a traveller', () => {
  const posts = vallakiLayout().props.filter(p => p[0] === 'postern');
  assert.deepEqual(posts.map(p => p.slice(1)), [[3, 14, 0], [28, 17, 2], [18, 4, 1]]);
  for (const k of ['towngate', 'stonegate', 'postern']){ assert.ok(PROPS[k]); assert.ok(!PROP_BLOCK.has(k) && !PROP_HOP.has(k), `${k} is walked through`); }
});
