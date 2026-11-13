import test from 'node:test';
import assert from 'node:assert/strict';
import { readPad, padIntents, stickDir, turnBy, keyIntent } from '../src/engine/pad.js';
import { newWander, ambushChance, planAmbush, recruitRoll, pushTrail, followSpot, roadEnd, cycleTarget, partyDown, QUIET_STEPS } from '../src/engine/wander.js';
import { COMPANIONS } from '../src/data/wander.js';
import { BEST } from '../src/data/bestiary.js';
import { newState } from '../src/engine/state.js';
import { mulberry32 } from '../src/util/core.js';

const pad = (x = 0, y = 0, pressed = []) => readPad({ axes:[x, y, 0, 0], buttons:Array.from({ length:16 }, (_, i) => ({ pressed:pressed.includes(i), value:pressed.includes(i) ? 1 : 0 })) });

test('the controller: a dead zone, eight ways, a held stick repeats, a button counts once, the camera turns the stick', () => {
  assert.equal(stickDir(.2, .1), null);
  assert.deepEqual(stickDir(0, -1), [0, -1]);
  assert.deepEqual(stickDir(.7, .7), [1, 1]);
  assert.deepEqual(stickDir(-1, .1), [-1, 0]);
  // the D-pad is the stick
  assert.equal(pad(0, 0, [12]).y, -1);
  // held up: a step now, none before `first`, then one every `repeat`
  let r = padIntents(pad(0, -1), 0, {});
  assert.deepEqual(r.intents, [{ k:'step', dx:0, dy:-1 }]);
  r = padIntents(pad(0, -1), 100, r.mem); assert.deepEqual(r.intents, []);
  r = padIntents(pad(0, -1), 300, r.mem); assert.deepEqual(r.intents, [{ k:'step', dx:0, dy:-1 }]);
  r = padIntents(pad(1, 0), 320, r.mem); assert.deepEqual(r.intents, [{ k:'step', dx:1, dy:0 }], 'turning steps the new way at once');
  // Ⓐ held over three frames: one press
  let m = {}, presses = 0;
  for (let k = 0; k < 3; k++){ const o = padIntents(pad(0, 0, [0]), k * 16, m); m = o.mem; presses += o.intents.filter(i => i.k === 'press' && i.b === 'a').length; }
  assert.equal(presses, 1);
  // the camera turned a quarter (looking west from the east): up on the stick walks west
  const [x, y] = turnBy(0, -1, Math.PI / 2); assert.deepEqual(stickDir(x, y), [-1, 0]);
  // the keyboard
  assert.deepEqual(keyIntent('w'), { k:'step', dx:0, dy:-1 });
  assert.deepEqual(keyIntent(' '), { k:'press', b:'a' });
  assert.deepEqual(keyIntent('Tab', { shift:true }), { k:'press', b:'lb' });
  assert.equal(keyIntent('x'), null);
});

test('the director: quiet after a fight, a first ambush before long, a pack the party can take', () => {
  assert.equal(ambushChance({ quiet:QUIET_STEPS - 1, gaze:5 }), 0);
  assert.equal(ambushChance({ quiet:45, ambushes:0 }), 1);
  assert.ok(ambushChance({ quiet:20, gaze:1, ambushes:2 }) < ambushChance({ quiet:20, gaze:4, night:true, ambushes:2 }));
  const rng = mulberry32(7);
  for (let k = 0; k < 20; k++){
    const p = planAmbush(BEST, { levels:[1], gaze:1, ambushes:0 }, rng);
    assert.equal(p.difficulty, 'low');
    assert.ok(p.group.length > 0);
    for (const g of p.group){ assert.ok(BEST[g.bid], g.bid); assert.ok(!['zombie', 'skeleton', 'ghoul'].includes(g.bid), 'no dead walk by day at Gaze 1'); }
    assert.ok(p.xp <= 100, `a gentle first fight for one level-1 hero, not ${p.xp} XP`);
  }
  const big = planAmbush(BEST, { levels:[5, 5, 5], gaze:4, ambushes:3, night:true }, mulberry32(3));
  assert.ok(big.xp > 300);
});

test('winning a companion over: the better of two skills, a 20 always works', () => {
  const ilse = COMPANIONS.find(c => c.id === 'ilse');
  assert.deepEqual(recruitRoll(ilse, { Persuasion:1, Intimidation:4 }, 6), { ok:true, skill:'Intimidation', bonus:4, total:10, dc:10 });
  assert.equal(recruitRoll(ilse, { Persuasion:0, Intimidation:0 }, 9).ok, false);
  assert.equal(recruitRoll(ilse, { Persuasion:-5 }, 20).ok, true);
  for (const c of COMPANIONS) assert.ok(c.hello && c.ask && c.pitch && c.yes && c.no && c.join && c.near && c.check, c.id);
});

test('followers, the road\'s end, aiming and the fallen', () => {
  let trail = [];
  for (const p of [{ x:1, y:1 }, { x:2, y:1 }, { x:3, y:1 }]) trail = pushTrail(trail, p, 2);
  assert.deepEqual(trail, [{ x:3, y:1 }, { x:2, y:1 }]);
  assert.deepEqual(followSpot(trail, 0), { x:3, y:1 });
  assert.deepEqual(followSpot(trail, 5), { x:2, y:1 });
  // a road with no way on: the far end from where it comes in
  const s = newState({ name:'r', seed:'end', floors:2, size:40, template:'journey', party:false, journey:{ from:'village', to:'crossroads', seed:'end', n:1, gaze:1, bloom:false, trailSeed:'end' } });
  assert.deepEqual(roadEnd(s.floors[0]), s.floors[0].down);
  const f = s.floors[1], end = roadEnd(f);
  assert.ok(end && Math.hypot(end.x - f.up.x, end.y - f.up.y) > 15, JSON.stringify({ end, up:f.up }));
  const list = [{ id:'a' }, { id:'b' }, { id:'c' }];
  assert.equal(cycleTarget(list, 'c', 1).id, 'a'); assert.equal(cycleTarget(list, 'a', -1).id, 'c'); assert.equal(cycleTarget(list, 'zz').id, 'a'); assert.equal(cycleTarget([], 'a'), null);
  assert.equal(partyDown([{ hp:0 }, { dead:true, hp:3 }]), true); assert.equal(partyDown([{ hp:0 }, { hp:2 }]), false); assert.equal(partyDown([]), false);
  assert.deepEqual(newWander({ heroId:'h', seed:'s' }).party, []);
});
