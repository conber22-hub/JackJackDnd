import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEncounter, budgetFor, xpOf, partyLevels, gazeScale } from '../src/engine/encounter.js';
import { bestList } from '../src/data/bestiary.js';

const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

test('budgets follow the party and the Gaze', () => {
  assert.equal(budgetFor([1, 1, 1, 1], 'moderate', 1), 300);
  assert.equal(budgetFor([3, 3, 3, 3], 'high', 1), 1600);
  assert.ok(budgetFor([3, 3, 3, 3], 'high', 6) > 1600);
  assert.equal(gazeScale(1), 1);
});

test('encounters stay inside the budget, leave bosses out and keep to a family', () => {
  const list = bestList();
  for (let i = 1; i < 40; i++){
    const levels = [1 + (i % 5), 1 + (i % 5), 2, 3];
    const e = buildEncounter(list, { levels, difficulty:['low', 'moderate', 'high'][i % 3], gaze:1 + (i % 10), rng:seeded(i * 7919) });
    assert.ok(e.group.length > 0, 'something fits');
    const total = e.group.reduce((s, g) => s + xpOf(list.find(b => b.id === g.bid)) * g.n, 0);
    assert.equal(total, e.xp); assert.ok(e.xp <= e.budget, `${e.xp} ≤ ${e.budget}`);
    assert.ok(e.group.every(g => !list.find(b => b.id === g.bid).tags?.includes('boss')));
    assert.ok(e.group.reduce((s, g) => s + g.n, 0) <= 8);
  }
  const wolves = buildEncounter(list, { levels:[2, 2, 2, 2], fam:'barovia', rng:seeded(3) });
  assert.ok(wolves.group.every(g => list.find(b => b.id === g.bid).fam === 'barovia'));
});

test('party levels come from hero tokens, with a fallback for tokens without a sheet', () => {
  assert.deepEqual(partyLevels([{ kind:'pc', cls:'Fighter 3 · Champion', flags:{} }, { kind:'pc', flags:{} }, { kind:'monster', flags:{} }], 2), [3, 2]);
});
