import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amountOf, newWard, wardSoak, wardTurn, wardRest, wardFrac } from '../src/engine/mech.js';

const fixed = v => (n, s) => n * Math.min(v, s);   // every die shows v (capped at its sides)

test('amounts: numbers, level, proficiency, ability modifiers, dice and arithmetic', () => {
  assert.equal(amountOf('lvl*2', { lvl:5 }), 10);
  assert.equal(amountOf('lvl*2+4', { lvl:1 }), 6);
  assert.equal(amountOf('pb', { lvl:5 }), 3);
  assert.equal(amountOf('pb', { lvl:1 }), 2);
  assert.equal(amountOf('2d8+wis', { lvl:3, mods:{ wis:3 } }, fixed(4)), 11);
  assert.equal(amountOf('1d10+lvl', { lvl:4 }, fixed(10)), 14);
  assert.equal(amountOf('5*lvl', { lvl:3 }), 15);
  assert.equal(amountOf('half lvl', { lvl:7 }), 3);
  assert.equal(amountOf('(lvl+1)*2', { lvl:2 }), 6);
  assert.equal(amountOf('str', { ab:{ Str:16 } }), 3);
  assert.equal(amountOf(7), 7);
});
test('amounts never go below 0, and anything unreadable is 0 (no eval)', () => {
  assert.equal(amountOf('1-5'), 0);
  assert.equal(amountOf('alert(1)'), 0);
  assert.equal(amountOf('lvl;process.exit()'), 0);
  assert.equal(amountOf(''), 0);
  assert.equal(amountOf(null), 0);
  assert.equal(amountOf(undefined), 0);
  assert.equal(amountOf('2 +'), 0);
  assert.equal(amountOf('unknownthing+2'), 2);
  assert.equal(amountOf('1000d6'), 0);
});
test('the Ward soaks a blow before hit points, and breaks', () => {
  const w = newWard({ lvl:3 });
  assert.deepEqual(w, { max:10, now:10, hit:false });
  const a = wardSoak(w, 4);
  assert.deepEqual([a.soaked, a.through, a.broke, a.ward.now, a.ward.hit], [4, 0, false, 6, true]);
  const b = wardSoak(a.ward, 9);
  assert.deepEqual([b.soaked, b.through, b.broke, b.ward.now], [6, 3, true, 0]);
  assert.equal(w.now, 10, 'the input is not changed');
  const none = wardSoak(null, 5);
  assert.equal(none.through, 5);
});
test('the Ward comes back whole only after a round untouched; a rest makes it whole', () => {
  let w = newWard({ lvl:3 });
  w = wardSoak(w, 7).ward;                       // struck since the last turn
  let t = wardTurn(w); assert.equal(t.back, false); assert.equal(t.ward.now, 3); w = t.ward;
  t = wardTurn(w); assert.equal(t.back, true); assert.equal(t.ward.now, 10);   // a round untouched: whole
  assert.equal(wardFrac({ max:10, now:5 }), .5);
  assert.equal(wardRest({ max:10, now:0, hit:true }).now, 10);
  assert.equal(wardTurn(null).back, false);
});
