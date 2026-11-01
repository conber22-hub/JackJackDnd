import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, T, walk } from '../src/engine/state.js';
import { genFloor, carve } from '../src/engine/generator.js';
import { cavify, reachable } from '../src/engine/caves.js';
import { mulberry32 } from '../src/util/core.js';
import { THEMES } from '../src/data/themes.js';

const start = f => f.up ? f.up.y * f.W + f.up.x : f.rooms[0].cy * f.W + f.rooms[0].cx;
const allJoined = f => { const seen = reachable(f, start(f)); return f.grid.every((v, i) => !walk(v) || seen.has(i)); };

test('cave floors are ragged but every square still joins up, stairs and all', () => {
  for (const id of ['silver', 'hands', 'undertow', 'womb']) for (let seed = 1; seed <= 30; seed++){
    const rng = mulberry32(seed * 7919), anchor = { x:20, y:20 };
    const f = genFloor(1, 40, 40, rng, anchor, false, { theme:id });
    assert.ok(allJoined(f), `${id} seed ${seed}: a pocket of cave is cut off`);
    assert.equal(f.grid[f.up.y * 40 + f.up.x], T.UP, `${id} seed ${seed}: the way up is where it was`);
    assert.equal(f.grid[f.down.y * 40 + f.down.x], T.DOWN, `${id} seed ${seed}: the way down is there`);
    for (const r of f.rooms) assert.ok(walk(f.grid[r.cy * 40 + r.cx]), `${id} seed ${seed}: the middle of ${r.name} is open`);
    for (let i = 0; i < 40; i++) for (const j of [i, 39 * 40 + i, i * 40, i * 40 + 39]) assert.ok(!walk(f.grid[j]), 'nothing is dug into the map\'s border');
    assert.ok(f.dug.length > 10 && f.filled.length > 3, `${id} seed ${seed}: it is actually rougher (${f.dug.length} dug, ${f.filled.length} filled)`);
  }
});

test('the built floors keep their walls straight; only the dug themes are caves', () => {
  for (const id of ['undercroft', 'chapel', 'ossuary', 'manor']){
    const f = genFloor(0, 40, 40, mulberry32(5), null, false, { theme:id });
    assert.equal(f.dug.length + f.filled.length, 0, `${id} is built, not dug`);
  }
  assert.deepEqual(THEMES.filter(t => t.cave).map(t => t.id).sort(), ['hands', 'silver', 'undertow', 'womb']);
});

test('cavify never cuts anything off, even on a cramped floor, and gives up rather than break it', () => {
  for (let seed = 1; seed <= 200; seed++){
    // two small rooms side by side joined by one tunnel, and stairs right by the doorway
    const W = 16, H = 10;
    const f = { level:0, W, H, theme:1, rooms:[{ id:0, x:2, y:2, w:4, h:4, cx:4, cy:4 }, { id:1, x:10, y:3, w:4, h:5, cx:12, cy:5 }],
      edges:[{ a:0, b:1, bend:seed % 2 === 0 }], corridors:[], autoLink:true, up:{ x:5, y:4 }, down:{ x:10, y:5 }, dug:[], filled:[], doors:[], traps:[], base:null, nextObj:1 };
    carve(f); cavify(f, mulberry32(seed), 1);
    assert.ok(allJoined(f), `seed ${seed}: cut off`);
    assert.equal(f.grid[4 * W + 5], T.UP); assert.equal(f.grid[5 * W + 10], T.DOWN);
  }
});

test('a whole descent with caves in it still links every floor', () => {
  for (const seed of ['cave-a', 'cave-b', 'cave-c']){
    const s = newState({ seed, floors:4, template:'andral' });
    s.floors.forEach((f, L) => {
      assert.ok(allJoined(f), `${seed} floor ${L}`);
      if (L) assert.deepEqual(f.up, s.floors[L - 1].down, `${seed}: the stairs line up between floors ${L - 1} and ${L}`);
    });
    assert.ok(s.floors.slice(1).some(f => f.dug.length), `${seed}: the mine and the warrens are dug`);
  }
});
