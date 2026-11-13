import test from 'node:test';
import assert from 'node:assert/strict';
import { followsDmTurn, partyByFloor, partyFrame, topViewDistance } from '../src/engine/dm-view.js';

const hero = (id, floor, x, y, extra = {}) => ({ id, kind:'pc', floor, x, y, ...extra });

test('DM turn following defaults on and stays local to the DM view', () => {
  assert.equal(followsDmTurn({ role:'dm' }), true);
  assert.equal(followsDmTurn({ role:'dm', dmFollowTurn:false }), false);
  assert.equal(followsDmTurn({ role:'dm', tableView:true }), false);
  assert.equal(followsDmTurn({ role:'player' }), false);
});

test('the roster groups party members by floor and keeps their marching order', () => {
  const a = hero('a', 2, 2, 2), b = hero('b', 0, 5, 3), c = hero('c', 2, 5, 3, { dead:true });
  const foe = hero('foe', 0, 3, 3, { kind:'monster' });
  const gone = hero('gone', 0, 1, 1, { flags:{ gone:true } });
  assert.deepEqual([...partyByFloor([a, b, c, foe, gone])], [[0, [b]], [2, [a, c]]]);
});

test('framing keeps the viewed party floor or falls back to the largest group', () => {
  const party = [hero('a', 2, 3, 8), hero('b', 0, 3, 4), hero('c', 2, 10, 2, { size:2 })];
  assert.deepEqual(partyFrame(party, 0), { floor:0, x:3, y:4, width:1, height:1 });
  assert.deepEqual(partyFrame(party, 1), { floor:2, x:7, y:5, width:9, height:7 });
  assert.equal(partyFrame([], 0), null);
});

test('framing widens for scattered tokens and portrait viewports', () => {
  const frame = { width:18, height:8 };
  const desktop = topViewDistance(frame, 50, 1280 / 800);
  assert.ok(topViewDistance(frame, 50, 390 / 844) > desktop);
  assert.ok(desktop > topViewDistance({ width:1, height:1 }, 50, 1280 / 800));
});
