import test from 'node:test';
import assert from 'node:assert/strict';
import { shoveDC, pbAt, canShove, saveFor, pushTo, shoveResult } from '../src/engine/shove.js';

test('the DC: 8 + Strength + proficiency', () => {
  assert.equal(shoveDC({ str:3, pb:2 }), 13);
  assert.equal(shoveDC({}), 10);
  assert.deepEqual([1, 4, 5, 9, 13, 17, 20].map(pbAt), [2, 2, 3, 4, 5, 6, 6]);
});
test('no more than one size larger', () => {
  assert.equal(canShove({ size:1 }, { size:2 }), true);
  assert.equal(canShove({ size:1 }, { size:3 }), false);
  assert.equal(canShove({}, {}), true);
});
test('they save with the better of Strength and Dexterity', () => {
  assert.equal(saveFor({ str:3, dex:1 }), 'str');
  assert.equal(saveFor({ str:0, dex:2 }), 'dex');
  assert.equal(saveFor({}), 'str');
});
test('a push goes one square straight away, unless the way is blocked', () => {
  assert.deepEqual(pushTo({ x:5, y:5 }, { x:6, y:5 }), { x:7, y:5 });
  assert.deepEqual(pushTo({ x:5, y:5 }, { x:4, y:4 }), { x:3, y:3 });
  assert.equal(pushTo({ x:5, y:5 }, { x:6, y:5 }, () => false), null);
  assert.equal(pushTo({ x:5, y:5 }, { x:5, y:5 }), null);
});
test('what happens', () => {
  assert.equal(shoveResult({ choice:'push', dc:13, save:13 }), 'resisted');
  assert.equal(shoveResult({ choice:'push', dc:13, save:12, to:{ x:1, y:1 } }), 'pushed');
  assert.equal(shoveResult({ choice:'push', dc:13, save:-99, to:null }), 'stuck');
  assert.equal(shoveResult({ choice:'prone', dc:13, save:5 }), 'prone');
});
