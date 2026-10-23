import test from 'node:test';
import assert from 'node:assert/strict';
import { fightCandidates, rollOrder, fightWon, fightXp } from '../src/engine/fight.js';

const tok = (id, kind, x, y, extra = {}) => ({ id, kind, name:id, floor:0, x, y, size:1, flags:{}, conds:[], init:0, dead:false, ...extra });

test('who is in the fight: the party, foes in sight or close by or alerted — not the far end of the map', () => {
  const W = 50, seen = new Set([10 * W + 30]);
  const list = [tok('h', 'pc', 10, 10), tok('a', 'npc', 11, 10), tok('near', 'monster', 18, 12), tok('seen', 'monster', 30, 10),
    tok('alert', 'monster', 45, 45, { flags:{ alert:true } }), tok('far', 'monster', 40, 40), tok('dead', 'monster', 11, 11, { dead:true }), tok('up', 'monster', 10, 12, { floor:1 })];
  const c = Object.fromEntries(fightCandidates(list, 0, W, seen).map(x => [x.t.id, x]));
  assert.deepEqual(Object.keys(c).sort(), ['a', 'alert', 'far', 'h', 'near', 'seen']);
  assert.ok(c.h.in && c.a.in && c.near.in && c.seen.in && c.alert.in);
  assert.equal(c.far.in, false); assert.equal(c.far.why, 'far off');
  assert.equal(c.seen.why, 'in sight'); assert.equal(c.near.why, 'close by');
});

test('initiative: identical creatures share a roll, surprise means disadvantage, ties go to the bonus then the heroes', () => {
  const dice = [15, 3, 12, 8, 19], d20 = () => dice.shift();
  const list = [tok('h', 'pc', 0, 0, { init:2 }), tok('w1', 'monster', 0, 0, { bid:'wolf', init:2 }), tok('w2', 'monster', 0, 0, { bid:'wolf', init:2 }), tok('g', 'monster', 0, 0, { bid:'ghoul', init:1 })];
  // the party is surprised: the hero rolls 15 and 3 (takes 3); the wolves roll once (12); the ghoul 8
  const o = rollOrder(list, { surprise:'party', d20 });
  assert.deepEqual(o.map(x => [x.id, x.roll]), [['w1', 14], ['w2', 14], ['g', 9], ['h', 5]]);
  // no grouping: each wolf rolls; ties: better bonus first, then heroes before foes
  const o2 = rollOrder([tok('h', 'pc', 0, 0, { init:1 }), tok('m', 'monster', 0, 0, { init:1, bid:'x' }), tok('k', 'monster', 0, 0, { init:3, bid:'y' })], { group:false, d20:() => 10 });
  assert.deepEqual(o2.map(x => x.id), ['k', 'h', 'm']);
});

test('a fight is won when every foe in it is down; XP for the fallen', () => {
  const t = { h:tok('h', 'pc', 0, 0), z1:tok('z1', 'monster', 0, 0, { bid:'zombie' }), z2:tok('z2', 'monster', 0, 0, { bid:'zombie' }) };
  const by = id => t[id], order = ['h', 'z1', 'z2'];
  assert.equal(fightWon(order, by), false);
  t.z1.dead = true; t.z2.dead = true; t.z2.flags.rising = true;
  assert.equal(fightWon(order, by), false, 'one of them is getting back up');
  t.z2.flags.rising = false;
  assert.equal(fightWon(order, by), true);
  assert.equal(fightWon(['h'], by), false, 'no foes, no victory');
  assert.equal(fightXp(order, by, { zombie:{ cr:'1/4' } }), 100);
});

test('initiative from real dice: a hero\'s d20 rolled at the table is used as it is', () => {
  const list = [tok('h', 'pc', 0, 0, { init:3 }), tok('m', 'monster', 0, 0, { init:0, bid:'x' })];
  const o = rollOrder(list, { d20:() => 10, fixed:{ h:2 } });
  assert.deepEqual(o.map(x => [x.id, x.die, x.roll]), [['m', 10, 10], ['h', 2, 5]]);
  assert.equal(rollOrder(list, { d20:() => 10, fixed:{ h:25 } }).find(x => x.id === 'h').die, 10, 'nonsense is ignored');
});
