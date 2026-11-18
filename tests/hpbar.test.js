import test from 'node:test';
import assert from 'node:assert/strict';
import { hpBar } from '../src/ui/hpbar.js';

const chipOf = html => html.match(/class="wd-chip" style="left:([\d.]+)%;width:([\d.]+)%;animation-delay:-(\d+)ms"/);

test('a bar with no key, or seen for the first time, is just its fill', () => {
  assert.equal(hpBar(5, 10), '<i class="wd-hp"><i style="width:50.0%"></i></i>');
  assert.equal(chipOf(hpBar(10, 10, 'a', 0)), null);
  assert.equal(chipOf(hpBar(0, 0, 'z', 0)), null);   // (never divides by nothing)
});

test('a blow leaves the part it took, draining, then gone', () => {
  hpBar(10, 10, 'b', 0);
  const c = chipOf(hpBar(4, 10, 'b', 1000));
  assert.deepEqual([+c[1], +c[2], +c[3]], [40, 60, 0]);
  // drawn again while it runs: picked up where it was
  assert.equal(+chipOf(hpBar(4, 10, 'b', 1300))[3], 300);
  assert.equal(chipOf(hpBar(4, 10, 'b', 2000)), null);   // (over)
});

test('a second blow while the first drains keeps the whole loss in the chip; a heal shows none', () => {
  hpBar(10, 10, 'c', 0); hpBar(6, 10, 'c', 100);
  const c = chipOf(hpBar(2, 10, 'c', 300));
  assert.deepEqual([+c[1], +c[2]], [20, 80]);
  assert.equal(chipOf(hpBar(9, 10, 'c', 5000)), null);
});
