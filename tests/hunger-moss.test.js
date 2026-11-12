import test from 'node:test';
import assert from 'node:assert/strict';
import { mossGround } from '../src/engine/hunger-moss.js';
import { planHungerMoss } from '../src/render/barovia-living-state.js';
import { T } from '../src/engine/tiles.js';

// 🍄 engine/hunger-moss.js: where the Bloom's moss may creep on an outdoor map, and the trees it starts from.
// A clearing in the woods: two squares of trees round the edge, grass inside, a road across, a door, the way out,
// a crate, a cottage, a pond and a field.
function clearing(){
  const W = 24, H = 20, grid = Array(W * H).fill(T.ROCK);
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) grid[y * W + x] = T.ROOM;
  for (let x = 2; x < W - 2; x++) grid[10 * W + x] = T.HALL;   // the road
  const f = { W, H, grid, doors:[{ i:5 * W + 5, state:'closed' }], up:{ x:3, y:10 }, props:[{ k:'crate', x:8, y:4 }],
    buildings:[{ x:14, y:3, w:3, h:3 }], water:[15 * W + 6, 15 * W + 7], rooms:[{ x:16, y:13, w:4, h:3, outdoor:true, crop:'wheat' }] };
  grid[f.up.y * W + f.up.x] = T.UP;
  return f;
}
const grow = (f, ground) => planHungerMoss({ width:f.W, height:f.H, seed:'test', ...ground });

test('no Bloom, no moss', () => {
  assert.equal(mossGround(clearing(), 0), null);
  assert.equal(mossGround(null, .5), null);
});
test('it starts in the treeline and creeps over the grass, never on the road, a door, the stairs, water, a building, a prop or a field', () => {
  const f = clearing(), ground = mossGround(f, .8), cells = grow(f, ground);
  assert.ok(ground.origins.length > 0);
  for (const o of ground.origins){ assert.equal(f.grid[o.y * f.W + o.x], T.ROCK, 'an origin is a tree');
    assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => f.grid[(o.y + dy) * f.W + o.x + dx] === T.ROOM), 'at the edge of the woods'); }
  assert.ok(cells.length > ground.origins.length, 'it spreads out of the trees');
  const W = f.W, banned = new Set([...f.water, f.doors[0].i, f.up.y * W + f.up.x, 4 * W + 8]);
  for (let y = 3; y < 6; y++) for (let x = 14; x < 17; x++) banned.add(y * W + x);
  for (let y = 13; y < 16; y++) for (let x = 16; x < 20; x++) banned.add(y * W + x);
  for (const c of cells){ const i = c.y * W + c.x;
    assert.notEqual(f.grid[i], T.HALL, 'not on the road'); assert.ok(!banned.has(i), `not on a protected square (${c.x},${c.y})`);
    if (f.grid[i] === T.ROCK) assert.ok(ground.origins.some(o => o.x === c.x && o.y === c.y), 'only the starting trees among the woods'); }
});
test('the same moss at every device, and more of it (from the same trees) as the Bloom grows', () => {
  const f = clearing(), a = mossGround(f, .3), b = mossGround(f, .9);
  assert.deepEqual(grow(f, a), grow(f, mossGround(clearing(), .3)));
  const key = o => `${o.x},${o.y}`, more = new Set(b.origins.map(key));
  assert.ok(a.origins.every(o => more.has(key(o))), 'a stronger Bloom keeps the trees a weaker one had');
  assert.ok(grow(f, b).length > grow(f, a).length && b.maxSteps > a.maxSteps);
});
test('the players see it only where they have been', () => {
  const f = clearing(), seen = i => (i % f.W) < 12;
  const cells = grow(f, mossGround(f, .9, { seen }));
  assert.ok(cells.every(c => c.x < 12 || f.grid[c.y * f.W + c.x] === T.ROCK));
  assert.ok(cells.filter(c => f.grid[c.y * f.W + c.x] === T.ROOM).every(c => c.x < 12));
});
