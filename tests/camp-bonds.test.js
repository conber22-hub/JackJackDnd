import test from 'node:test';
import assert from 'node:assert/strict';
import { newCampBonds, recordCampChoice, campOffers, playCampScene, campForPlayers } from '../src/engine/camp-bonds.js';

const keeper = Object.freeze({ id: 'npc-1', name: 'Vera', outlook: 'keeper' });
const wayfarer = Object.freeze({ id: 'npc-2', name: 'Ilan', outlook: 'wayfarer' });
const sworn = Object.freeze({ id: 'npc-3', name: 'Ruz', outlook: 'sworn' });
const party = Object.freeze([keeper, wayfarer]);
const event = (eventId, choice, witnesses = party) => ({ eventId, choice, witnesses });
const rest = (restId, present = party) => ({ restId, present });
const reload = state => JSON.parse(JSON.stringify(state));

test('a witnessed decision can gain one companion’s trust and cost another’s, exactly once', () => {
  const blank = newCampBonds();
  Object.freeze(blank.decisions);
  Object.freeze(blank.bonds);
  Object.freeze(blank.played);
  Object.freeze(blank);
  const first = recordCampChoice(blank, event('shelter', 'shelter-stranger'));
  assert.deepEqual(first.bonds.map(({ id, score }) => [id, score]), [[keeper.id, 2], [wayfarer.id, -1]]);
  assert.equal(recordCampChoice(first, event('shelter', 'abandon-stranger', [sworn])), first);
  assert.deepEqual(blank, newCampBonds());
  const second = recordCampChoice(first, event('oath', 'keep-oath', [sworn]));
  assert.deepEqual(second.bonds.map(({ id, score }) => [id, score]), [[keeper.id, 2], [wayfarer.id, -1], [sworn.id, 2]]);
});

test('one scene per long rest, then a deeper bond, with save round trips and stale offers', () => {
  let state = recordCampChoice(undefined, event('s1', 'shelter-stranger'));
  state = recordCampChoice(state, event('s2', 'shelter-stranger'));
  const next = rest('night-1');
  const offers = campOffers(state, next);
  assert.deepEqual(offers.map(scene => [scene.name, scene.at]), [['Vera', 'trust'], ['Ilan', 'friction']]);
  assert.deepEqual(campOffers(state, rest('night-1', [])), []);
  assert.equal(playCampScene(state, { ...next, companionId: keeper.id, sceneId: 'second-chair' }).scene, null);
  assert.equal(playCampScene(state, { ...rest('night-1', [wayfarer]), companionId: keeper.id, sceneId: offers[0].id }).state, state);
  const played = playCampScene(state, { ...next, companionId: keeper.id, sceneId: offers[0].id, share: true });
  assert.equal(played.scene.title, 'An extra blanket');
  assert.deepEqual(campOffers(played.state, next), []);
  assert.equal(playCampScene(played.state, { ...next, companionId: wayfarer.id, sceneId: offers[1].id }).state, played.state);
  const later = rest('night-2');
  const deeper = campOffers(reload(played.state), later)[0];
  assert.equal(deeper.at, 'bond');
  const after = playCampScene(played.state, { ...later, companionId: keeper.id, sceneId: deeper.id }).state;
  assert.deepEqual(campOffers(after, rest('night-3', [keeper])), []);
  assert.deepEqual(campForPlayers(after), [{ name: keeper.name, title: played.scene.title, opening: played.scene.opening }]);
});

test('a change of heart retires a pending confrontation and invalidates its old offer', () => {
  const low = recordCampChoice(undefined, event('left', 'abandon-stranger', [keeper]));
  const before = campOffers(low, rest('night', [keeper]))[0];
  assert.equal(before.at, 'friction');
  const recovered = recordCampChoice(low, event('saved', 'shelter-stranger', [keeper]));
  const stale = playCampScene(recovered, { ...rest('night', [keeper]), companionId: keeper.id, sceneId: before.id, share: true });
  assert.equal(stale.state, recovered);
  assert.deepEqual(campForPlayers(recovered), []);
});

test('scores are bounded and invalid or duplicate roster identities cannot double count', () => {
  let state = newCampBonds();
  for (let i = 0; i < 9; i++) state = recordCampChoice(state, event('aid-' + i, 'shelter-stranger'));
  assert.deepEqual(state.bonds.map(bond => bond.score), [5, -5]);
  assert.throws(() => recordCampChoice(state, event('dup', 'keep-oath', [keeper, keeper])), /Duplicate/);
  assert.throws(() => recordCampChoice(state, event('flip', 'keep-oath', [{ ...keeper, outlook: 'sworn' }])), /cannot change/);
  assert.throws(() => recordCampChoice(state, event('bad', '__proto__')), /Unknown camp choice/);
  assert.throws(() => campOffers(state, rest('')), /Rest ID/);
});
