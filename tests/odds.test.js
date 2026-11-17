import test from 'node:test';
import assert from 'node:assert/strict';
import { hitOdds, expectedDamage, pct, edgeWords } from '../src/engine/odds.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test('the chance to hit: d20 + bonus against AC, a 1 always misses and a 20 always hits', () => {
  near(hitOdds(5, 15).hit, .55);          // needs a 10 or more
  assert.equal(hitOdds(5, 15).need, 10);
  near(hitOdds(20, 5).hit, .95);          // only a 1 misses
  near(hitOdds(0, 40).hit, .05);          // only a 20 hits
  near(hitOdds(5, 15).crit, .05);
});
test('advantage keeps the higher of two, disadvantage the lower, and both is neither', () => {
  near(hitOdds(5, 15, { adv:true }).hit, 1 - .45 ** 2);
  near(hitOdds(5, 15, { dis:true }).hit, .55 ** 2);
  near(hitOdds(5, 15, { adv:true, dis:true }).hit, .55);
  near(hitOdds(5, 15, { adv:true }).crit, 1 - .95 ** 2);
});
test('a helpless foe struck close: every hit a critical, but it still has to hit', () => {
  const o = hitOdds(5, 15, { autoCrit:true });
  near(o.crit, o.hit);
});
test('the damage on average counts the misses, and a critical doubles only the dice', () => {
  const o = { hit:1, crit:0 };
  near(expectedDamage('1d8+3', o), 7);                 // 4.5 + 3, floored by avgDice to 7
  near(expectedDamage('1d8+3', { hit:1, crit:1 }), 7 + 4);
  near(expectedDamage('2d6', { hit:.5, crit:0 }), 3.5);
  near(expectedDamage('12d6+2', { hit:0, crit:0 }), 0);
});
test('the odds and the edge, in words', () => {
  assert.equal(pct(.55), '55%'); assert.equal(pct(1), '99%'); assert.equal(pct(0), '1%');
  assert.deepEqual(edgeWords({ adv:['prone'] }), { mark:'⇈', text:'advantage: prone' });
  assert.equal(edgeWords({ dis:['long range'] }).mark, '⇊');
  assert.equal(edgeWords({ adv:['prone'], dis:['long range'] }).mark, '⇅');
  assert.equal(edgeWords({}).mark, '');
});
