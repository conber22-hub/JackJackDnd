import test from 'node:test';
import assert from 'node:assert/strict';
import { keepDoorwaysClear } from '../src/engine/dressing.js';
import { genDelve } from '../src/engine/generator.js';
import { TEMPLATES } from '../src/data/themes.js';
import { PROP_BLOCK, PROP_TOP, PROP_HOP, propSize } from '../src/data/props.js';
import { T, walk } from '../src/engine/tiles.js';

// A room (x 2–9, y 2–7) with a door in its north wall at (5, 1), the corridor beyond it, and the stairs in a corner.
function room(props){
  const W = 12, H = 10, grid = Array(W * H).fill(T.ROCK);
  for (let y = 2; y < 8; y++) for (let x = 2; x < 10; x++) grid[y * W + x] = T.ROOM;
  grid[1 * W + 5] = T.ROOM; grid[0 * W + 5] = T.HALL;   // (a door stands on a floor square)
  return { W, H, grid, rooms:[{ x:2, y:2, w:8, h:6 }], doors:[{ id:1, i:1 * W + 5, state:'closed' }], up:{ x:9, y:7 }, props, nextObj:50 };
}
const inWay = (f, p) => { const W = f.W, keep = new Set();
  for (const d of f.doors){ keep.add(d.i); for (const o of [1, -1, W, -W]) if (walk(f.grid[d.i + o])) keep.add(d.i + o); }
  const s = propSize(p); for (let y = p.y; y < p.y + s.h; y++) for (let x = p.x; x < p.x + s.w; x++) if (keep.has(y * W + x)) return true; return false; };

test('a hearth set down in front of a door goes back against a wall, out of the way', () => {
  const f = room([{ id:1, k:'hearth', x:5, y:2, rot:1 }]);   // (its back to the north wall, right where the door comes in)
  assert.equal(keepDoorwaysClear(f), 1);
  const h = f.props[0];
  assert.equal(inWay(f, h), false);
  assert.ok(h.x >= 2 && h.x < 10 && h.y >= 2 && h.y < 8, 'still in the room');
  const [dx, dy] = [[-1, 0], [0, -1], [1, 0], [0, 1]][h.rot];
  assert.equal(walk(f.grid[(h.y + dy) * f.W + h.x + dx]), false, 'a wall at its back');
});

test('a barrel on the stairs or in the door moves; a rug stays; a shelf hiding a secret door stays', () => {
  const f = room([{ id:1, k:'barrel', x:9, y:7 }, { id:2, k:'rug', x:4, y:2 }, { id:3, k:'barrel', x:5, y:1 }, { id:4, k:'bookshelf', x:3, y:2, rot:1, hides:9 }]);
  keepDoorwaysClear(f);
  const by = id => f.props.find(p => p.id === id);
  assert.notDeepEqual([by(1).x, by(1).y], [9, 7]);
  assert.ok(Math.abs(by(1).x - 9) > 1 || Math.abs(by(1).y - 7) > 1, 'off the stairs and the squares beside them');
  assert.deepEqual([by(2).x, by(2).y], [4, 2]);
  assert.ok(!by(3) || !inWay(f, by(3)), 'out of the doorway, or gone');
  assert.deepEqual([by(4).x, by(4).y], [3, 2]);
});

test('a piece with nowhere to go is taken away, unless something is hidden in it', () => {
  const f = room([]);
  // a tiny room: the door's square and the one in front of it, nothing else
  for (let i = 0; i < f.grid.length; i++) if (f.grid[i] === T.ROOM) f.grid[i] = T.ROCK;
  f.grid[2 * f.W + 5] = T.ROOM; f.rooms = [{ x:5, y:2, w:1, h:1 }]; f.up = null;
  f.props = [{ id:1, k:'crate', x:5, y:2 }];
  assert.equal(keepDoorwaysClear(f), 1);
  assert.equal(f.props.length, 0);
  f.props = [{ id:2, k:'crate', x:5, y:2, stash:{ dc:12, text:'a letter' } }];
  keepDoorwaysClear(f);
  assert.equal(f.props.length, 1);
});

test('no map the app makes has a piece you must climb, hop or go round on or beside a door', () => {
  for (const t of TEMPLATES) for (let k = 0; k < 2; k++){
    for (const f of genDelve({ seed:`doors-${t.id}-${k}`, template:t.id, floors:3, size:40 })){
      if (!f.props || !f.doors) continue;
      for (const p of f.props){
        if (p.hides || !(PROP_BLOCK.has(p.k) || p.k in PROP_TOP || PROP_HOP.has(p.k))) continue;
        assert.equal(inWay(f, p), false, `${t.id}: a ${p.k} at ${p.x},${p.y}`);
      }
    }
  }
});
