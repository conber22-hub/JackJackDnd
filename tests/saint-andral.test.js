import test from 'node:test';
import assert from 'node:assert/strict';
import { SAINT_ANDRAL } from '../src/data/saint-andral.js';
import { PROPS, propSize } from '../src/data/props.js';
import { interiorGround, interiorPlan, isDoorway } from '../src/engine/generator.js';
import { canStep, ORTHO, passMove } from '../src/engine/grid.js';
import { packFloor } from '../src/engine/maps.js';
import { redactForPlayers } from '../src/engine/redact.js';
import { newState } from '../src/engine/state.js';
import { T, walk } from '../src/engine/tiles.js';

const church = { kind:'church', name:SAINT_ANDRAL, w:5, h:4, seed:'vallaki|church' };
const build = (template, floors, interior, seed = 'church') =>
  newState({ name:SAINT_ANDRAL, seed, size:32, floors, template, interior, party:false });
const index = (f, x, y) => y * f.W + x;
const getRoom = (f, name) => f.rooms.find(r => r.name === name);
const contains = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
function reachable(f, x, y){
  const start = index(f, x, y);
  assert.ok(passMove(f, start));
  const seen = new Set([start]), queue = [start];
  for (const i of queue){
    const x = i % f.W, y = Math.floor(i / f.W);
    for (const [dx, dy] of ORTHO){
      const next = index(f, x + dx, y + dy);
      if (seen.has(next) || !canStep(f, x, y, dx, dy)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}
const visits = (f, seen, r) => [...seen].some(i => contains(r, i % f.W, Math.floor(i / f.W)));

test('a fresh church template and the Vallaki facade open the same two floors', () => {
  const direct = build('saint-andral-church', 2).floors;
  const fromStreet = build('interior', 1, church).floors;
  assert.deepEqual(fromStreet.map(f => f.rooms), direct.map(f => f.rooms));
  assert.deepEqual(fromStreet.map(f => f.theme), direct.map(f => f.theme));
  assert.equal(interiorGround(church), 0);
  const [x, y] = interiorPlan(church).floors[0].out;
  assert.equal(direct[0].rooms[0].name, 'Church steps');
  assert.ok(contains(direct[0].rooms[0], x, y));
  assert.deepEqual(direct[0].down, direct[1].up);
  assert.equal(direct[1].down, null);
  assert.equal(direct[1].rooms.length, 1);
  assert.ok(interiorPlan({ ...church, name:'The Morning Chapel' }).floors.every(f => f.name !== SAINT_ANDRAL));
});

test('the nave has two routes out and the crypt stays hidden until the altar access is found', () => {
  const state = build('saint-andral-church', 2);
  const [f, crypt] = state.floors;
  for (const floor of [f, crypt]){
    const occupied = new Set();
    for (const prop of floor.props){
      assert.ok(PROPS[prop.k], prop.k);
      const { w, h } = propSize(prop);
      for (let y = prop.y; y < prop.y + h; y++) for (let x = prop.x; x < prop.x + w; x++){
        const i = index(floor, x, y);
        assert.equal(walk(floor.grid[i]), prop.k !== 'fence', `${prop.k} at ${x},${y}`);
        assert.ok(!occupied.has(i), `overlapping props at ${x},${y}`);
        occupied.add(i);
      }
    }
    for (const d of floor.doors){
      assert.ok(isDoorway(floor, d.i), `malformed doorway at ${d.i}`);
      assert.ok(!occupied.has(d.i));
    }
    for (const stair of [floor.up, floor.down].filter(Boolean)) assert.ok(!occupied.has(index(floor, stair.x, stair.y)));
  }

  const front = f.doors.find(d => d.i === index(f, 15, 24));
  const side = f.doors.find(d => d.i === index(f, 22, 12));
  const hidden = f.doors.find(d => d.state === 'secret');
  const nave = getRoom(f, 'Nave and altar');
  const publicTiles = reachable(f, 15, 27);
  assert.ok(visits(f, publicTiles, nave));
  assert.ok(visits(f, publicTiles, getRoom(f, 'Churchyard')));
  assert.ok(!visits(f, publicTiles, getRoom(f, 'Altar recess')));

  for (const d of [front, side]){
    d.state = 'locked';
    assert.ok(visits(f, reachable(f, 15, 27), nave), 'the other route stays open');
    d.state = 'closed';
  }
  const player = redactForPlayers({ ...state, floors:state.floors.map(packFloor) }, { explored:{ 0:publicTiles } });
  assert.equal(player.floors[0].grid[hidden.i], '0');
  assert.equal(player.floors[0].down, null);
  assert.equal(player.floors[1].name, 'Unexplored');
  assert.ok(!player.floors[0].rooms.some(r => r.notes));

  hidden.state = 'open';
  const all = reachable(f, 15, 27);
  for (const r of f.rooms) assert.ok(visits(f, all, r), r.name);
  assert.ok(all.has(index(f, f.down.x, f.down.y)));
  assert.ok(visits(crypt, reachable(crypt, crypt.up.x, crypt.up.y), crypt.rooms[0]));
});

test('the Flood campaign retains its four deeper floors and aligned stairs', () => {
  for (const seed of ['flood-s8-standral', 'valley|vallaki|standral', 'other campaign']){
    const { floors } = build('standral', 5, undefined, seed);
    assert.deepEqual(floors.map(f => f.name), [SAINT_ANDRAL, 'The Undercroft of St. Andral', 'The Silver Vein', 'The Hand-Warrens', 'The Undertow']);
    assert.ok(floors[0].props.some(p => p.k === 'bloomgrowth'));
    for (let i = 0; i < floors.length - 1; i++){
      const f = floors[i], next = floors[i + 1], { x, y } = f.down;
      assert.deepEqual(next.up, f.down);
      assert.equal(f.grid[index(f, x, y)], T.DOWN);
      assert.equal(next.grid[index(next, x, y)], T.UP);
      assert.ok(passMove(f, index(f, x, y)));
      assert.ok(passMove(next, index(next, x, y)));
    }
  }
});
