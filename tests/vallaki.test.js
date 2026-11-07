import test from 'node:test';
import assert from 'node:assert/strict';
import { genDelve, doorOrientation } from '../src/engine/generator.js';
import { canStep, ORTHO, passMove } from '../src/engine/grid.js';
import { populate } from '../src/engine/folk.js';
import { walk } from '../src/engine/tiles.js';

const makeTown = (size, seed = 'vallaki') => genDelve({ template:'vallaki', floors:1, size, seed })[0];
const tile = (f, x, y) => y * f.W + x;
const names = {
  church:'St. Andral’s Church', inn:'Blue Water Inn', mansion:'Burgomaster’s Mansion',
  wachter:'Wachterhaus Manor', coffin:'Coffin Maker’s Shop', toyshop:'Blinsky Toys Shop',
  square:'Town Square', yard:'Arasek Stockyard', camp:'Vistani Camp',
};
function reachFrom(f, start){
  const startTile = tile(f, start.cx, start.cy);
  assert.ok(passMove(f, startTile), start.name);
  const seen = new Set([startTile]), queue = [startTile];
  for (const i of queue){
    const x = i % f.W, y = Math.floor(i / f.W);
    for (const [dx, dy] of ORTHO){
      const j = tile(f, x + dx, y + dy);
      if (seen.has(j) || !canStep(f, x, y, dx, dy)) continue;
      seen.add(j);
      queue.push(j);
    }
  }
  return seen;
}

test('Vallaki has a fixed street plan and all nine Chapter 5 destinations', () => {
  const f = makeTown(40);
  const places = [...f.buildings, ...f.rooms];
  const { church, inn, mansion, wachter, coffin, toyshop, square, yard, camp } =
    Object.fromEntries(Object.entries(names).map(([id, name]) => [id, places.find(p => p.name === name)]));
  assert.ok(church.x < inn.x && inn.x < square.x && square.x < yard.x);
  assert.ok(wachter.y < inn.y && mansion.y > toyshop.y && coffin.y > square.y);
  assert.ok(camp.x < mansion.x && camp.y > mansion.y);
  assert.deepEqual(makeTown(40, 'different seed'), f);
});

for (const size of [32, 40, 64]) test(`Vallaki ${size}: the gates, streets and every front door work with furniture in place`, () => {
  const f = makeTown(size);
  const start = f.rooms.find(r => r.type === 'entrance');
  assert.equal(start.name, 'Morning Gate');
  const townDoors = f.doors.map(d => [d.i % f.W, Math.floor(d.i / f.W), d.state]);
  assert.deepEqual(townDoors, [[3, 14, 'closed'], [28, 17, 'closed'], [18, 4, 'closed']]);
  for (const d of f.doors) assert.ok(doorOrientation(f, d.i), 'gate can be rendered as a door');

  const seen = reachFrom(f, start);
  for (const r of f.rooms){
    assert.ok(Array.from(seen, i => ({ x:i % f.W, y:Math.floor(i / f.W) })).some(
      ({x,y}) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h), r.name);
  }
  for (const b of f.buildings){
    const x = b.door === 'e' ? b.x + b.w : b.x + Math.floor(b.w / 2);
    const y = b.door === 'n' ? b.y - 1 : b.door === 's' ? b.y + b.h : b.y + Math.floor(b.h / 2);
    assert.ok(seen.has(tile(f, x, y)), `doorstep of ${b.name} at ${x},${y}`);
    for (let by = b.y; by < b.y + b.h; by++) for (let bx = b.x; bx < b.x + b.w; bx++)
      assert.ok(!walk(f.grid[tile(f, bx, by)]), `street under ${b.name}`);
  }

  for (const d of f.doors) d.state = 'locked';
  const east = reachFrom(f, start);
  const square = f.rooms.find(r => r.name === 'Town Square');
  assert.ok(!east.has(tile(f, square.cx, square.cy)), 'no way through the locked palisade');
  const west = reachFrom(f, f.rooms.find(r => r.name === 'Sunset Gate'));
  const camp = f.rooms.find(r => r.name === 'Vistani Camp');
  assert.ok(west.has(tile(f, camp.cx, camp.cy)), 'camp remains outside the locked palisade');
  assert.ok(!west.has(tile(f, square.cx, square.cy)), 'camp trail does not bypass the west gate');
});

test('gate lodges give roaming townsfolk places to start', () => {
  const f = makeTown(40);
  const people = populate(f, { place:{ id:'vallaki', kind:'town' }, seed:'vallaki' });
  assert.ok(people.length > 5);
  for (const person of people){
    const { x, y } = person.home;
    assert.ok(passMove(f, tile(f, x, y)), person.name);
    assert.ok(f.rooms.some(r => r.name.endsWith('Gate lodge') && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h), person.name);
    assert.ok(person.haunts.length, person.name);
  }
});
