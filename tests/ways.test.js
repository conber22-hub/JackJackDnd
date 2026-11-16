import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compass, placeWays, inFrom, frontDoor, doorWalkedInto, outOfDoorway, offTheEdge, signLines } from '../src/engine/ways.js';
import { genDelve } from '../src/engine/generator.js';
import { walk } from '../src/engine/tiles.js';

const box = (W, H, fill = 1) => ({ W, H, grid:new Array(W * H).fill(fill) });

test('compass points', () => {
  assert.equal(compass(1, 0), 'e'); assert.equal(compass(-3, 0), 'w'); assert.equal(compass(0, -2), 'n'); assert.equal(compass(0, 5), 's');
  assert.equal(compass(2, 2), 'se'); assert.equal(compass(-1, -1), 'nw'); assert.equal(compass(0, 0), '');
});

test('a place\'s ways out go to the side of the map their road leaves by, apart, each with a signpost off the road', () => {
  const f = box(20, 20);
  for (let i = 0; i < 20; i++){ f.grid[i] = 0; f.grid[19 * 20 + i] = 0; f.grid[i * 20] = 0; f.grid[i * 20 + 19] = 0; }   // a rock rim
  const ways = placeWays(f, [{ to:'west', dx:-5, dy:1 }, { to:'east', dx:4, dy:0 }, { to:'north', dx:0, dy:-3 }]);
  const by = Object.fromEntries(ways.map(w => [w.to, w]));
  assert.equal(by.west.x, 1); assert.equal(by.east.x, 18); assert.equal(by.north.y, 1);
  assert.equal(by.west.dir, 'w'); assert.equal(by.north.dir, 'n');
  for (const a of ways) for (const b of ways) if (a !== b) assert.ok(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) >= 6);
  for (const w of ways){ assert.ok(w.sign); assert.ok(walk(f.grid[w.sign.y * 20 + w.sign.x])); assert.ok(w.sign.x !== w.x || w.sign.y !== w.y); }
  // the party comes in a step or two back from the way
  const at = inFrom(f, by.west); assert.ok(at.x > by.west.x);
});

test('a road out of the map is preferred, and nothing is chosen on an island cut off from the middle', () => {
  const f = box(20, 20, 0);
  for (let y = 5; y < 15; y++) for (let x = 5; x < 15; x++) f.grid[y * 20 + x] = 1;   // the village
  for (let x = 0; x < 5; x++) f.grid[10 * 20 + x] = 2;                                // a road out west
  f.grid[2 * 20 + 1] = 1;                                                              // an island, far west and cut off
  const [w] = placeWays(f, [{ to:'w', dx:-1, dy:0 }]);
  assert.deepEqual([w.x, w.y], [0, 10]);
});

test('every place map in the valley gives each of its roads a way out', () => {
  for (const [tpl, n] of [['barovia', 2], ['vallaki', 5], ['krezk', 2]]){
    const f = genDelve({ name:'x', seed:`ways|${tpl}`, floors:1, size:40, template:tpl })[0];
    const ways = placeWays(f, Array.from({ length:n }, (_, k) => ({ to:`p${k}`, dx:Math.cos(k * 2.4), dy:Math.sin(k * 2.4) })));
    assert.equal(ways.length, n, tpl);
    for (const w of ways) assert.ok(walk(f.grid[w.y * f.W + w.x]), `${tpl}: way ${w.to} on open ground`);
  }
});

test('a building\'s front door and its doorstep; walking into it', () => {
  const b = { x:4, y:4, w:3, h:3, door:'s' }, d = frontDoor(b);
  assert.deepEqual(d.cells, [{ x:5, y:6 }]); assert.deepEqual(d.steps, [{ x:5, y:7 }]); assert.deepEqual(d.out, [0, 1]);
  const e = frontDoor({ x:10, y:2, w:4, h:4, door:'e' });
  assert.deepEqual(e.cells, [{ x:13, y:3 }, { x:13, y:4 }]); assert.deepEqual(e.steps, [{ x:14, y:3 }, { x:14, y:4 }]);
  assert.equal(doorWalkedInto([b], 5, 7, 0, -1), 0);
  assert.equal(doorWalkedInto([b], 5, 7, 0, 1), -1);    // (walking away)
  assert.equal(doorWalkedInto([b], 4, 7, 0, -1), -1);   // (into the wall beside it)
  assert.equal(doorWalkedInto([b], 5, 7, 1, -1), -1);   // (not on a slant)
});

test('an inside\'s way out is the side of the doorway with no floor', () => {
  const f = box(5, 5, 0); f.grid[1 * 5 + 2] = 1; f.grid[2 * 5 + 2] = 2;
  assert.deepEqual(outOfDoorway(f, [2, 2]), [0, 1]);
  assert.equal(outOfDoorway(f, null), null);
});

test('a road\'s end: off the edge it runs to, going that way, near it', () => {
  const f = { W:40, H:40 }, end = { x:2, y:20 };
  assert.equal(offTheEdge(f, { x:2, y:21 }, end, -1), true);
  assert.equal(offTheEdge(f, { x:1, y:20 }, end, -1), true);
  assert.equal(offTheEdge(f, { x:3, y:20 }, end, -1), false);    // (not there yet)
  assert.equal(offTheEdge(f, { x:2, y:20 }, end, 1), false);     // (walking back in)
  assert.equal(offTheEdge(f, { x:2, y:25 }, end, -1), false);    // (off the road, in the trees)
  assert.equal(offTheEdge(f, { x:37, y:9 }, { x:37, y:10 }, 1), true);
});

test('signpost lines: west on the left with its arrow first, east with it last', () => {
  const lines = signLines([{ to:'Krezk', dir:'e', far:'a day' }, { to:'Vallaki', dir:'w' }, { to:'the Tser Pool', dir:'nw' }]);
  assert.deepEqual(lines, ['↖ the Tser Pool', '← Vallaki', 'Krezk · a day →']);
});

test('a road three wide to the edge still gets its signpost, on the verge', () => {
  const W = 20, H = 20, grid = new Array(W * H).fill(0);
  for (let y = 1; y < H - 1; y++) for (let x = 6; x < 14; x++) grid[y * W + x] = 1;   // (a village in the middle)
  for (let y = 9; y <= 11; y++) for (let x = 1; x < 14; x++) grid[y * W + x] = 2;     // (the road west, three wide)
  const [w] = placeWays({ W, H, grid }, [{ to:'west', dx:-10, dy:0 }]);
  assert.equal(w.x, 1);
  assert.ok(w.sign, 'a signpost');
  assert.notEqual(w.sign.y, 10, 'not in the middle of the road');
  assert.ok(w.sign.x !== w.x || w.sign.y !== w.y);
});
