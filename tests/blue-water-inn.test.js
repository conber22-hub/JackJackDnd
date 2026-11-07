import test from 'node:test';
import assert from 'node:assert/strict';
import { BLUE_WATER_INN } from '../src/data/blue-water-inn.js';
import { PROPS, propSize } from '../src/data/props.js';
import { isDoorway, interiorGround, interiorPlan } from '../src/engine/generator.js';
import { canStep, ORTHO, passMove } from '../src/engine/grid.js';
import { packFloor } from '../src/engine/maps.js';
import { redactForPlayers } from '../src/engine/redact.js';
import { newState } from '../src/engine/state.js';
import { walk } from '../src/engine/tiles.js';

const inn = { kind:'tavern', name:BLUE_WATER_INN, w:5, h:4, seed:'vallaki|building' };
const build = (template = 'blue-water-inn', interior) =>
  newState({ name:BLUE_WATER_INN, seed:'table', size:32, floors:3, template, interior, party:false });
const index = (floor, x, y) => y * floor.W + x;
const room = (floor, name) => floor.rooms.find(r => r.name === name);
const contains = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
function reachable(floor, start){
  const seen = new Set([index(floor, start.x, start.y)]), queue = [...seen];
  for (const i of queue){
    const x = i % floor.W, y = Math.floor(i / floor.W);
    for (const [dx, dy] of ORTHO){
      const j = index(floor, x + dx, y + dy);
      if (seen.has(j) || !canStep(floor, x, y, dx, dy)) continue;
      seen.add(j);
      queue.push(j);
    }
  }
  return seen;
}
const visits = (f, seen, r) => [...seen].some(i => contains(r, i % f.W, Math.floor(i / f.W)));

test('the template and the Vallaki facade use the same inn, with matching stair landings', () => {
  const direct = build().floors;
  const fromStreet = build('interior', inn).floors;
  const plan = interiorPlan(inn), groundIndex = interiorGround(inn);
  assert.equal(groundIndex, 2);
  assert.equal(direct[0].rooms[0].name, 'Front porch');
  assert.equal(fromStreet[groundIndex].rooms[0].name, 'Front porch');
  const [x, y] = plan.floors[groundIndex].out;
  assert.ok(contains(fromStreet[groundIndex].rooms[0], x, y));
  assert.ok(passMove(fromStreet[groundIndex], index(fromStreet[groundIndex], x, y)));

  for (const floors of [direct, fromStreet]){
    assert.equal(floors.length, 3);
    for (let i = 0; i + 1 < floors.length; i++){
      assert.ok(floors[i].down);
      assert.deepEqual(floors[i].down, floors[i + 1].up);
    }
  }
  const geometry = f => f.rooms.map(({ name, x, y, w, h }) => ({ name, x, y, w, h }));
  assert.deepEqual(direct.map(geometry), [...fromStreet].reverse().map(geometry));
  assert.deepEqual(direct.map(f => f.props), [...fromStreet].reverse().map(f => f.props));
  assert.ok(interiorPlan({ ...inn, name:'Another tavern' }).floors.every(f => f.name !== 'Inn upper rooms'));
});

test('furniture leaves the doors clear and every inn room can be reached', () => {
  const [ground, upper, attic] = build().floors;
  for (const f of [ground, upper, attic]){
    const occupied = new Set();
    for (const p of f.props){
      assert.ok(PROPS[p.k], p.k);
      const { w, h } = propSize(p);
      for (let y = p.y; y < p.y + h; y++) for (let x = p.x; x < p.x + w; x++){
        const i = index(f, x, y);
        assert.ok(walk(f.grid[i]), `${f.name}: ${p.k} on rock at ${x},${y}`);
        assert.ok(!occupied.has(i), `${f.name}: furniture overlaps at ${x},${y}`);
        occupied.add(i);
      }
    }
    for (const d of f.doors){
      assert.ok(isDoorway(f, d.i), `${f.name}: malformed doorway at ${d.i % f.W},${Math.floor(d.i / f.W)}`);
      assert.ok(!occupied.has(d.i));
    }
    for (const stairs of [f.up, f.down].filter(Boolean)) assert.ok(!occupied.has(index(f, stairs.x, stairs.y)));
  }
  const fromPorch = reachable(ground, { x:26, y:16 });
  for (const r of ground.rooms) assert.ok(visits(ground, fromPorch, r), r.name);
  assert.ok(fromPorch.has(index(ground, ground.down.x, ground.down.y)));

  const guests = reachable(upper, upper.up);
  assert.ok(visits(upper, guests, room(upper, 'Taproom gallery')));
  assert.ok(!visits(upper, guests, room(upper, 'East guest room')));
  assert.ok(!visits(upper, guests, room(upper, 'Service passage')));
  assert.ok(!guests.has(index(upper, upper.down.x, upper.down.y)));
  for (const d of upper.doors) d.state = 'open';
  const inside = reachable(upper, upper.up);
  for (const r of upper.rooms) assert.ok(visits(upper, inside, r), r.name);
  assert.ok(inside.has(index(upper, upper.down.x, upper.down.y)));
  assert.ok(visits(attic, reachable(attic, attic.up), room(attic, 'Attic')));
});

test('the player view of the guest gallery hides the private access', () => {
  const state = build();
  const upper = state.floors[1];
  const explored = reachable(upper, upper.up);
  const player = redactForPlayers({ ...state, floors:state.floors.map(packFloor) }, { explored:{ 1:explored } });
  for (const d of upper.doors.filter(d => d.state === 'secret')){
    assert.equal(player.floors[1].grid[d.i], '0');
    assert.ok(!player.floors[1].doors.some(other => other.i === d.i));
  }
  assert.equal(player.floors[1].down, null);
  assert.equal(player.floors[2].name, 'Unexplored');
  assert.ok(!player.floors.flatMap(f => f.rooms).some(r => r.notes || r.name));
});
