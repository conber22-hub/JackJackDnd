import test from 'node:test';
import assert from 'node:assert/strict';
import { newHero, heroToken } from '../src/engine/hero.js';
import { layoutFloor } from '../src/engine/generator.js';
import { walk } from '../src/engine/tiles.js';
import {
  openPartyLobby, admitLobbyPlayer, disconnectLobbyPlayer, releaseLobbySeat, finishLobbyHero,
  playLobby, lobbyScene, lobbyForPlayers, lobbyForPlayer, startLobbySession,
} from '../src/engine/party-lobby.js';

const open = () => openPartyLobby('yard');
const admit = (lobby, seat = 'a', connection = 'peer-' + seat) =>
  admitLobbyPlayer(lobby, { seatId: 'private-seat-' + seat, connectionId: connection, name: 'Player ' + seat });
const sheet = (cls = 'Fighter', id = 'a') => ({ ...newHero(cls), id: 'hero-' + id, name: 'Hero ' + id });
const send = (lobby, message, peer = 'peer-a', roll) => playLobby(lobby, peer, { lobbyId: 'yard', ...message }, roll);
const move = (lobby, x, y) => send(lobby, { kind: 'move', x, y });
const ready = (lobby, peer) => send(lobby, { kind: 'ready', ready: true }, peer).lobby;
const deck = (lobby, name) => lobbyForPlayer(lobby, 'peer-a').actions.find(action => action.name === name).id;
const practice = (lobby, name, targetId, roll) =>
  send(lobby, { kind: 'practice', actionId: deck(lobby, name), targetId }, 'peer-a', roll);

test('building players stay off the floor and all eight finished heroes have free spawn tiles', () => {
  let lobby = open();
  for (let i = 0; i < 8; i++) lobby = admit(lobby, String(i));
  assert.equal(admit(lobby, 'ninth'), lobby);
  const view = lobbyForPlayers(lobby);
  assert.ok(view.members.every(member => member.stage === 'building' && member.position === null));
  assert.equal(send(lobby, { kind: 'move', x: 6, y: 6 }, 'peer-0').reason, 'finish-your-hero');
  assert.equal(send(lobby, { kind: 'ready', ready: true }, 'peer-0').reason, 'finish-your-hero');
  for (let i = 0; i < 8; i++) lobby = finishLobbyHero(lobby, 'peer-' + i, sheet('Fighter', i));
  const scene = lobbyScene(), floor = layoutFloor(0, scene.width, scene.height, scene, null);
  const places = lobbyForPlayers(lobby).members.map(member => member.position);
  assert.equal(new Set(places.map(({ x, y }) => y * scene.width + x)).size, 8);
  assert.ok(places.every(({ x, y }) => walk(floor.grid[y * scene.width + x])));
  assert.ok(view.dummies.every(({ x, y }) => walk(floor.grid[y * scene.width + x])));
});

test('movement follows a walkable path and avoids props, walls, players and targets', () => {
  let lobby = finishLobbyHero(admit(admit(open()), 'b'), 'peer-a', sheet());
  lobby = finishLobbyHero(lobby, 'peer-b', sheet('Rogue', 'b'));
  for (const [x, y] of [[9, 5], [2, 2], [3, 6], [12, 3], [0, 1], [3.2, 7]]) {
    assert.equal(move(lobby, x, y).ok, false);
  }
  const travelled = move(ready(lobby), 13, 5);
  assert.equal(travelled.ok, true);
  assert.deepEqual(travelled.path.at(-1), { x: 13, y: 5 });
  const scene = lobbyScene(), floor = layoutFloor(0, scene.width, scene.height, scene, null);
  let last = { x: 3, y: 4 };
  for (const step of travelled.path) {
    assert.equal(Math.abs(step.x - last.x) + Math.abs(step.y - last.y), 1);
    assert.ok(walk(floor.grid[step.y * scene.width + step.x]));
    last = step;
  }
  assert.equal(lobbyForPlayers(travelled.lobby).members[0].stage, 'ready');
});

test('practice uses a built weapon, checks reach and rolls crits without changing the lobby or sheet', () => {
  const hero = Object.freeze({ ...sheet(), hp: 4, res: Object.freeze({ wind: 0 }), notes: 'private sheet notes' });
  let lobby = finishLobbyHero(admit(open()), 'peer-a', hero);
  assert.equal(practice(lobby, 'Longsword', 'straw', () => assert.fail('out of reach')).reason, 'out-of-range');
  lobby = move(lobby, 11, 3).lobby;
  const attack = heroToken(hero).attacks[0];
  const result = practice(lobby, 'Longsword', 'straw', (expr, crit) => {
    if (expr === '1d20') return { total: 20 };
    assert.equal(expr, attack.d);
    assert.equal(crit, true);
    return { total: 12 };
  });
  assert.equal(result.lobby, lobby);
  assert.equal(result.practice.rolls[0].total, 20 + attack.b);
  assert.equal(result.practice.rolls[0].crit, true);
  assert.equal(result.practice.damage, 12);
  assert.equal(hero.hp, 4);
  assert.equal(hero.res.wind, 0);
  assert.equal(practice(lobby, 'Longsword', 'peer-b', () => assert.fail('not a dummy')).reason, 'choose-a-dummy');
});

test('ranged practice respects walls and rolls twice past a weapon’s normal range', () => {
  let lobby = finishLobbyHero(admit(open()), 'peer-a', sheet());
  const rolls = [20, 2];
  const result = practice(lobby, 'Javelin', 'straw', expr => {
    assert.equal(expr, '1d20');
    return { total: rolls.shift() };
  });
  assert.equal(result.practice.rolls[0].natural, 2);
  assert.equal(result.practice.damage, 0);
  assert.deepEqual(rolls, []);
  lobby = move(lobby, 3, 5).lobby;
  lobby = move(lobby, 8, 5).lobby;
  assert.equal(practice(lobby, 'Javelin', 'shield', () => assert.fail('behind wall')).reason, 'blocked');
});

test('spell practice handles saves and auto damage, and rebuilds invalidate old buttons', () => {
  const wizard = { ...sheet('Wizard'), spells: ['Fire Bolt', 'Burning Hands', 'Magic Missile', 'Mage Armor'] };
  let lobby = finishLobbyHero(admit(open()), 'peer-a', wizard);
  lobby = move(lobby, 15, 10).lobby;
  const result = practice(lobby, 'Burning Hands', 'lantern', expr => ({ total: expr === '1d20' ? 19 : 11 }));
  assert.equal(result.practice.save.saved, true);
  assert.equal(result.practice.damage, 5);
  assert.equal(practice(lobby, 'Magic Missile', 'lantern', () => ({ total: 9 })).practice.damage, 9);
  assert.equal(practice(lobby, 'Mage Armor', null, () => assert.fail('preview')).practice.kind, 'preview');
  const stale = deck(lobby, 'Fire Bolt');
  lobby = send(ready(lobby), { kind: 'build' }).lobby;
  assert.equal(lobbyForPlayers(lobby).members[0].stage, 'building');
  lobby = finishLobbyHero(lobby, 'peer-a', wizard);
  assert.equal(send(lobby, { kind: 'practice', actionId: stale, targetId: 'straw' }).reason, 'unknown-action');
});

test('reconnect preserves the hero and invalidates stale messages, while public views omit private state', () => {
  let lobby = finishLobbyHero(admit(admit(open()), 'b'), 'peer-a', sheet());
  assert.equal(finishLobbyHero(lobby, 'peer-b', sheet()), lobby);
  lobby = disconnectLobbyPlayer(ready(lobby), 'peer-a');
  assert.equal(lobbyForPlayers(lobby).members[0].stage, 'reconnecting');
  assert.equal(lobbyForPlayers(lobby).members[0].position, null);
  lobby = admit(lobby, 'a', 'peer-new');
  assert.equal(lobbyForPlayer(lobby, 'peer-new').yourSlot, 1);
  assert.ok(lobbyForPlayer(lobby, 'peer-new').actions.length);
  assert.equal(lobbyForPlayers(lobby).members[0].stage, 'practising');
  assert.equal(send(lobby, { kind: 'ready', ready: true }).reason, 'not-in-lobby');
  assert.equal(playLobby(lobby, 'peer-new', { lobbyId: 'old-yard', kind: 'ready', ready: true }).reason, 'not-in-lobby');
  assert.equal(lobbyForPlayer(lobby, 'peer-b').actions.length, 0);
  const publicJson = JSON.stringify(lobbyForPlayers(lobby));
  for (const secret of ['private-seat', 'peer-new', 'hero-a', 'Longsword', 'actions']) assert.ok(!publicJson.includes(secret));
});

test('host launch waits for ready players and hands off only approved IDs', () => {
  let lobby = finishLobbyHero(admit(admit(open()), 'b'), 'peer-a', sheet());
  assert.equal(startLobbySession(lobby, { allowPartial: true }).party, null);
  lobby = ready(lobby);
  assert.equal(startLobbySession(lobby).party, null);
  const partial = startLobbySession(lobby, { allowPartial: true });
  assert.deepEqual(partial.party, [{ seatId: 'private-seat-a', heroId: 'hero-a' }]);
  assert.equal(partial.lobby.status, 'started');
  assert.equal(move(partial.lobby, 12, 6).reason, 'not-in-lobby');
  assert.equal(startLobbySession(partial.lobby, { allowPartial: true }).party, null);
  const released = releaseLobbySeat(lobby, 'private-seat-b');
  assert.deepEqual(startLobbySession(released).party, partial.party);
});
