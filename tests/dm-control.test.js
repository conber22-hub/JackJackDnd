import test from 'node:test';
import assert from 'node:assert/strict';
import { declineHeroActions, pendingHeroActions, playerControlDenial } from '../src/engine/dm-control.js';

test('pausing player movement holds moves, stairs and move undo, while combat actions remain available', () => {
  const control = { movementPaused:true, dmHeroes:[] };
  for (const type of ['move', 'stairs', 'undoMove']) assert.match(playerControlDenial(control, 'hero', type), /paused/);
  for (const type of ['act', 'endturn', 'oaAns', 'ping', 'askAns']) assert.equal(playerControlDenial(control, 'hero', type), '');
  assert.equal(playerControlDenial(null, 'hero', 'move'), '');
});

test('DM takeover blocks that hero’s commands while preserving the seat and independent prompts', () => {
  const control = { movementPaused:false, dmHeroes:['hero'] };
  for (const type of ['move', 'act', 'endturn', 'oaAns', 'prop', 'dropConc']){
    assert.match(playerControlDenial(control, 'hero', type), /controlling/);
    assert.equal(playerControlDenial(control, 'other', type), '');
  }
  for (const type of ['ping', 'hello', 'askAns', 'vote']) assert.equal(playerControlDenial(control, 'hero', type), '');
  assert.equal(playerControlDenial({ ...control, dmHeroes:[] }, 'hero', 'move'), '');
});

test('declining pending actions removes only that hero’s requests before notifying the players', () => {
  const replies = [];
  const queue = [
    { id:'a', deny:text => { assert.equal(pendingHeroActions(queue, 'a').length, 0); replies.push(text); } },
    { id:'b' },
    { id:'a', deny:text => replies.push(text) },
  ];
  assert.equal(pendingHeroActions(queue, 'a').length, 2);
  assert.equal(declineHeroActions(queue, 'a', 'The DM advanced the turn.'), 2);
  assert.deepEqual(queue, [{ id:'b' }]);
  assert.deepEqual(replies, ['The DM advanced the turn.', 'The DM advanced the turn.']);
  assert.equal(declineHeroActions(queue, 'a', 'again'), 0);
});
