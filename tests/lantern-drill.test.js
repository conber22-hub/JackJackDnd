import test from 'node:test';
import assert from 'node:assert/strict';
import { newHero } from '../src/engine/hero.js';
import {
  openPartyLobby, admitLobbyPlayer, disconnectLobbyPlayer, finishLobbyHero,
  lobbyForPlayer, playLobby, startLobbySession,
} from '../src/engine/party-lobby.js';
import { openLanternDrill, lanternDrillForPlayers, playLanternDrill } from '../src/engine/lantern-drill.js';

const hit = expr => ({ total: expr === '1d20' ? 20 : 8 });
const miss = () => ({ total: 1 });
const lobbyId = 'the-yard';

function setup() {
  let lobby = openPartyLobby(lobbyId);
  for (const id of ['a', 'b']) {
    lobby = admitLobbyPlayer(lobby, { seatId: 'private-seat-' + id, connectionId: 'conn-' + id, name: 'Player ' + id });
    lobby = finishLobbyHero(lobby, 'conn-' + id,
      { ...newHero('Fighter'), id: 'private-hero-' + id, name: 'Hero ' + id, weapons: ['Longbow'] });
  }
  return { lobby, drill: openLanternDrill(lobby, 'drill-1') };
}

function move(lobby, connectionId, x, y) {
  const next = playLobby(lobby, connectionId, { lobbyId, kind: 'move', x, y });
  assert.equal(next.ok, true);
  return next.lobby;
}

function shoot(drill, lobby, connectionId, targetId, roll = hit, overrides = {}) {
  const [action] = lobbyForPlayer(lobby, connectionId).actions;
  return playLanternDrill(drill, lobby, connectionId,
    { lobbyId, kind: 'practice', actionId: action?.id, targetId, drillId: drill.id, ...overrides }, roll);
}

test('the plate needs a live holder and a different hero to hit the active target', () => {
  const { lobby, drill } = setup();
  const alone = shoot(drill, lobby, 'conn-b', 'straw');
  assert.equal(alone.ok, true);
  assert.ok(alone.practice.damage > 0);
  assert.equal(alone.drillFeedback, 'stand-on-plate');
  assert.equal(alone.drill, drill);

  const held = move(lobby, 'conn-a', 6, 7);
  const view = lanternDrillForPlayers(drill, held);
  assert.equal(view.shutterOpen, true);
  assert.equal(view.plate.holderSlot, 1);
  assert.equal(view.targetId, 'straw');
  const solo = shoot(drill, held, 'conn-a', 'shield');
  assert.ok(solo.practice.damage > 0);
  assert.equal(solo.drillFeedback, 'need-a-partner');
  assert.equal(solo.drill, drill);

  const away = move(held, 'conn-a', 6, 8);
  assert.equal(lanternDrillForPlayers(drill, away).shutterOpen, false);
  const disconnected = disconnectLobbyPlayer(held, 'conn-a');
  assert.equal(lanternDrillForPlayers(drill, disconnected).shutterOpen, false);
});

test('only real hits clear the three targets in order and duplicates cannot advance the next target', () => {
  const { lobby, drill } = setup();
  let state = move(lobby, 'conn-a', 6, 7);
  state = move(state, 'conn-b', 11, 7);
  assert.equal(shoot(drill, state, 'conn-b', 'shield').drillFeedback, 'hit-the-lit-target');
  const missed = shoot(drill, state, 'conn-b', 'straw', miss);
  assert.equal(missed.drillFeedback, 'try-again');
  assert.equal(missed.drill, drill);

  const first = shoot(drill, state, 'conn-b', 'straw');
  assert.equal(first.drillFeedback, 'target-cleared');
  assert.equal(first.lobby, state);
  assert.equal(shoot(first.drill, state, 'conn-b', 'straw').drill, first.drill);
  const second = shoot(first.drill, state, 'conn-b', 'shield');
  assert.equal(second.drill.cleared, 2);
  state = move(state, 'conn-a', 6, 8);
  assert.equal(shoot(second.drill, state, 'conn-b', 'lantern').drill, second.drill);
  state = move(state, 'conn-a', 6, 7);
  const final = shoot(second.drill, state, 'conn-b', 'lantern');
  assert.equal(final.drillFeedback, 'complete');
  const view = lanternDrillForPlayers(final.drill, state);
  assert.equal(view.complete, true);
  assert.equal(view.shutterOpen, false);
  assert.equal(view.targetId, null);
  assert.ok(view.targets.every(target => target.stage === 'cleared'));
  assert.equal(shoot(final.drill, state, 'conn-b', 'lantern').drill, final.drill);
});

test('weapon and spell results come from the lobby, never from a phone’s claimed damage', () => {
  const { lobby, drill } = setup();
  let state = move(lobby, 'conn-a', 6, 7);
  const invalid = shoot(drill, state, 'conn-b', 'straw', () => assert.fail('invalid action was rolled'), {
    actionId: 'fake-action', damage: 100,
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.drill, drill);
  const rogue = shoot(drill, state, 'outside-connection', 'straw', () => assert.fail('unauthorised action was rolled'));
  assert.equal(rogue.ok, false);
  assert.equal(rogue.drill, drill);

  const caster = { ...newHero('Wizard'), id: 'wizard-b', name: 'Wizard B', spells: ['Magic Missile'] };
  state = finishLobbyHero(state, 'conn-b', caster);
  const actionId = lobbyForPlayer(state, 'conn-b').actions.find(action => action.name === 'Magic Missile').id;
  const cast = shoot(drill, state, 'conn-b', 'straw', hit, { actionId });
  assert.equal(cast.practice.kind, 'auto');
  assert.equal(cast.drill.cleared, 1);
});

test('reset and launch isolate drill progress from old messages and campaign seats', () => {
  const { lobby, drill } = setup();
  let state = move(lobby, 'conn-a', 6, 7);
  const reset = openLanternDrill(state, 'drill-2');
  const stale = shoot(reset, state, 'conn-b', 'straw', hit, { drillId: drill.id });
  assert.equal(stale.ok, true);
  assert.equal(stale.drill, reset);
  const overlay = JSON.stringify(lanternDrillForPlayers(reset, state));
  for (const privateText of ['private-seat', 'private-hero', 'conn-a', 'Longbow']) assert.ok(!overlay.includes(privateText));

  for (const id of ['a', 'b']) state = playLobby(state, 'conn-' + id, { lobbyId, kind: 'ready', ready: true }).lobby;
  const launch = startLobbySession(state);
  assert.deepEqual(launch.party, ['a', 'b'].map(id => ({ seatId: 'private-seat-' + id, heroId: 'private-hero-' + id })));
  assert.equal(lanternDrillForPlayers(reset, launch.lobby), null);
  assert.equal(lanternDrillForPlayers(reset, openPartyLobby('another-yard')), null);
});
