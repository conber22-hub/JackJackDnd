import test from 'node:test';
import assert from 'node:assert/strict';
import { spendCoins, addCoins } from '../src/engine/coins.js';

const value = c => c.cp + c.sp * 10 + c.ep * 50 + c.gp * 100 + c.pp * 1000;

test('paying spends the small coins first and gives change in gold and silver, never platinum', () => {
  const c = spendCoins({ gp:300 }, 70);
  assert.deepEqual(c, { cp:0, sp:0, ep:0, gp:230, pp:0 });
  const d = spendCoins({ gp:2, sp:5, cp:3 }, 1.5);
  assert.equal(value(d), 253 - 150);
  assert.equal(d.pp, 0);
});
test('a platinum piece is broken only when the rest will not do, and the change comes back', () => {
  const c = spendCoins({ pp:2, gp:1 }, 3);
  assert.equal(value(c), 2100 - 300);
  assert.equal(c.pp, 1);
  assert.equal(c.gp, 8);
});
test('not enough coin is refused', () => {
  assert.equal(spendCoins({ gp:1 }, 2), null);
});
test('being paid adds gold, silver and copper to what is there', () => {
  assert.deepEqual(addCoins({ pp:1, gp:2 }, 3.57), { cp:7, sp:5, ep:0, gp:5, pp:1 });
});
