import test from 'node:test';
import assert from 'node:assert/strict';
import { SHAPES, inShape, shapeSquares, pickShape, isShaped } from '../src/engine/shapes.js';
import { T, walk } from '../src/engine/state.js';
import { genFloor, carve, roomAt, recalcRoom } from '../src/engine/generator.js';
import { reachable } from '../src/engine/caves.js';
import { redactForPlayers } from '../src/engine/redact.js';
import { mulberry32 } from '../src/util/core.js';

const joined = (r, W) => {   // every floor square of the shape reaches every other, stepping orthogonally
  const sq = new Set(shapeSquares(r, W)), [first] = sq, seen = new Set([first]), q = [first];
  while (q.length){ const i = q.pop(); for (const j of [i + 1, i - 1, i + W, i - W]) if (sq.has(j) && !seen.has(j) && Math.abs((j % W) - (i % W)) <= 1){ seen.add(j); q.push(j); } }
  return seen.size === sq.size;
};

test('every shape keeps its middle, hangs together, and is smaller than its box', () => {
  for (const shape of Object.keys(SHAPES).filter(Boolean)) for (const [w, h] of [[5, 5], [6, 6], [7, 5], [9, 9], [8, 12], [11, 7]]){
    const r = recalcRoom({ x:3, y:4, w, h, shape }), n = shapeSquares(r, 40).length;
    if (shape === 'cross' && (w < 7 || h < 7)){ assert.ok(n < w * h); continue; }
    assert.ok(inShape(r, r.cx, r.cy), `${shape} ${w}×${h}: the middle is floor`);
    assert.ok(inShape(r, r.cx + 1, r.cy) || inShape(r, r.cx - 1, r.cy), `${shape} ${w}×${h}: and a square beside it`);
    assert.ok(joined(r, 40), `${shape} ${w}×${h}: one piece`);
    assert.ok(n < w * h && n > w * h * .45, `${shape} ${w}×${h}: ${n} of ${w * h} squares`);
    assert.ok(!inShape(r, r.x - 1, r.y) && !inShape(r, r.x + w, r.y + h - 1), 'nothing outside the box');
  }
});

test('the shapes are the shapes: corners cut, symmetry, the L\'s missing corner', () => {
  const round = { x:0, y:0, w:9, h:9, shape:'round' }, oct = { x:0, y:0, w:9, h:9, shape:'octagon' };
  for (const r of [round, oct]){
    for (const [x, y] of [[0, 0], [8, 0], [0, 8], [8, 8]]) assert.ok(!inShape(r, x, y), `${r.shape}: corner ${x},${y} cut`);
    for (const [x, y] of [[4, 0], [0, 4], [8, 4], [4, 8]]) assert.ok(inShape(r, x, y), `${r.shape}: the middle of each side reaches the wall`);
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) assert.equal(inShape(r, x, y), inShape(r, 8 - x, y), `${r.shape} is symmetric`);
  }
  const cross = { x:0, y:0, w:9, h:9, shape:'cross' };
  assert.ok(!inShape(cross, 0, 0) && !inShape(cross, 1, 1) && inShape(cross, 4, 0) && inShape(cross, 0, 4));
  const ell = { x:0, y:0, w:8, h:8, shape:'ell-ne' };
  assert.ok(!inShape(ell, 7, 0) && inShape(ell, 0, 0) && inShape(ell, 7, 7) && inShape(ell, 0, 7));
  assert.ok(!inShape({ ...ell, shape:'ell-sw' }, 0, 7) && inShape({ ...ell, shape:'ell-sw' }, 7, 0));
  // too small to shape: a rectangle
  assert.ok(!isShaped({ x:0, y:0, w:4, h:6, shape:'round' }) && inShape({ x:0, y:0, w:4, h:6, shape:'round' }, 0, 0));
  assert.equal(pickShape({ w:4, h:9 }, () => 0), '');
});

test('generated floors mix in shaped rooms, and everything still joins up', () => {
  let shaped = 0, rooms = 0;
  const kinds = new Set();
  for (const theme of ['undercroft', 'chapel', 'manor', 'castle', 'ossuary']) for (let seed = 1; seed <= 12; seed++){
    const f = genFloor(1, 40, 40, mulberry32(seed * 104729), { x:20, y:20 }, false, { theme });
    const seen = reachable(f, f.up.y * 40 + f.up.x);
    assert.ok(f.grid.every((v, i) => !walk(v) || seen.has(i)), `${theme} ${seed}: one piece`);
    assert.equal(f.grid[f.up.y * 40 + f.up.x], T.UP); assert.equal(f.grid[f.down.y * 40 + f.down.x], T.DOWN);
    for (const r of f.rooms){
      rooms++; if (isShaped(r)){ shaped++; kinds.add(r.shape.slice(0, 3)); }
      assert.ok(walk(f.grid[r.cy * 40 + r.cx]), `${theme} ${seed}: the middle of ${r.name} is open`);
      // the cut-away corners are rock (a tunnel may pass through one, but never the room's own floor)
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (!inShape(r, x, y)) assert.notEqual(f.grid[y * 40 + x], T.ROOM);
    }
  }
  assert.ok(shaped > rooms * .2 && shaped < rooms * .75, `${shaped} of ${rooms} rooms shaped`);
  assert.ok(['rou', 'oct', 'cro', 'ell'].every(k => kinds.has(k)), [...kinds].join());
  // the caves stay dug, not shaped; a blank floor stays plain
  for (let seed = 1; seed <= 5; seed++) assert.ok(genFloor(1, 40, 40, mulberry32(seed), { x:20, y:20 }, false, { theme:'silver' }).rooms.every(r => !r.shape));
  assert.ok(genFloor(0, 40, 40, mulberry32(3), null, false, { theme:'undercroft', shapes:false }).rooms.every(r => !r.shape));
});

test('a room can be reshaped, and the players see its shape (not its secrets)', () => {
  const f = genFloor(0, 40, 40, mulberry32(9), null, true, { theme:'manor', shapes:false });
  const r = f.rooms.find(r => r.w >= 7 && r.h >= 7) || f.rooms.find(r => r.w >= 5 && r.h >= 5);
  const before = f.grid.filter(v => v === T.ROOM).length;
  r.shape = 'octagon'; carve(f);
  assert.ok(f.grid.filter(v => v === T.ROOM).length < before, 'the corners went back to rock');
  assert.equal(roomAt(f, r.x, r.y), undefined, 'a cut corner is no longer in the room');
  assert.equal(roomAt(f, r.cx, r.cy)?.id, r.id);
  const exp = new Set(); for (let i = 0; i < f.grid.length; i++) if (walk(f.grid[i])) exp.add(i);
  const s = { meta:{ seed:'x' }, floors:[f], tokens:[], campaign:{} };
  const out = redactForPlayers(s, { explored:{ 0:exp } });
  assert.equal(out.floors[0].rooms.find(o => o.id === r.id).shape, 'octagon');
});
