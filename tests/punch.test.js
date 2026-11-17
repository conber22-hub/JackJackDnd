import test from 'node:test';
import assert from 'node:assert/strict';
import { impactOf, speedAt, moveAt, bloodOf, shareOf } from '../src/engine/punch.js';

test('a heavier blow holds longer and knocks harder; a crit more, a killing blow most', () => {
  const light = impactOf({ r:.05 }), heavy = impactOf({ r:.5 }), crit = impactOf({ r:.5, crit:true }), kill = impactOf({ r:.5, kill:true });
  assert.ok(heavy.stop > light.stop && heavy.knock > light.knock && heavy.kick > light.kick);
  assert.ok(crit.stop > heavy.stop && crit.knock > heavy.knock && crit.screen === 'crit');
  assert.ok(kill.stop >= crit.stop - 30 && kill.slowMs > 0 && kill.slowScale < 1 && kill.back === false && kill.screen === 'kill');
  assert.ok(light.stop <= 60 && kill.stop <= 200, 'the hold is a beat, never a stall');
  assert.equal(impactOf({ miss:true }).stop, 0);
  assert.deepEqual(impactOf({ r:5 }), impactOf({ r:1 }), 'more than all their hit points is as hard as all of them');
});

test('the world freezes at impact, runs slow after a killing blow, then comes back to speed', () => {
  const I = impactOf({ r:.3, kill:true });
  assert.equal(speedAt(-5, I), 1); assert.equal(speedAt(0, I), 0); assert.equal(speedAt(I.stop - 1, I), 0);
  assert.equal(speedAt(I.stop + 10, I), I.slowScale);
  assert.ok(speedAt(I.stop + I.slowMs - 10, I) > I.slowScale);
  assert.equal(speedAt(I.stop + I.slowMs + 1, I), 1);
  const H = impactOf({ r:.3 }); assert.equal(speedAt(H.stop + 1, H), 1, 'an ordinary blow has no slow motion');
  assert.equal(speedAt(10, null), 1);
});

test('a lunge drives in and settles home; a knock comes back unless it killed; a dodge returns', () => {
  assert.ok(moveAt('lunge', .1) < 0, 'it winds back first');
  assert.ok(moveAt('lunge', .45) > .95);
  assert.ok(Math.abs(moveAt('lunge', 1)) < 1e-9);
  assert.ok(moveAt('knock', .16, .3) > .29);
  assert.ok(Math.abs(moveAt('knock', 1, .3)) < 1e-9);
  assert.ok(moveAt('knock', 1, .3, false) > .29, 'the dead lie where they were thrown');
  assert.ok(moveAt('dodge', .5, .2) > .19 && Math.abs(moveAt('dodge', 1, .2)) < .01);
  for (let k = 0; k <= 1; k += .05) for (const m of ['lunge', 'knock', 'dodge']) assert.ok(Math.abs(moveAt(m, k, 1)) <= 1.05, `${m} stays within its reach at ${k}`);
});

test('what comes out of them: blood, rot, dust or nothing', () => {
  assert.equal(bloodOf({ name:'Barovian Wolf' }).splat, true);
  assert.equal(bloodOf({ tags:['seep'], name:'Seepling' }).color, '#4f6b1e');
  assert.equal(bloodOf({ tags:['undead'], name:'Skeleton' }).splat, false);
  assert.equal(bloodOf({ name:'Ghost' }).splat, false);
  assert.equal(bloodOf({ name:'Scarecrow Watcher' }).splat, false);
});

test('a player\'s screen gets the share of hit points, rounded, never the HP', () => {
  assert.equal(shareOf(7, 22), .375); assert.equal(shareOf(50, 10), 1); assert.equal(shareOf(3, 0), 0); assert.equal(shareOf(1, 100), 0);
});
