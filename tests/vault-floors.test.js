import test from 'node:test';
import assert from 'node:assert/strict';
import { genDelve } from '../src/engine/generator.js';
import { reachable } from '../src/engine/caves.js';
import { walk } from '../src/engine/tiles.js';
import { propSize } from '../src/data/props.js';
import { VAULTS } from '../src/data/vaults.js';

// ChatGPT's set pieces (engine/vaults.js) in generated delves: some rooms get one, and the floor still joins up.
test('generated delves stamp set pieces into some rooms, and every floor still joins up', () => {
  let vaults = 0; const ids = new Set();
  for (const template of ['andral', 'castle', 'labyrinth']) for (let k = 1; k <= 8; k++){
    const floors = genDelve({ seed:`vault-${k}`, template, floors:3, size:40 });
    floors.forEach((f, L) => {
      const start = f.up ? f.up.y * f.W + f.up.x : f.rooms[0].cy * f.W + f.rooms[0].cx, seen = reachable(f, start);
      assert.ok(f.grid.every((v, i) => !walk(v) || seen.has(i)), `${template} ${k} floor ${L}: one piece`);
      const per = new Set();
      for (const r of f.rooms.filter(r => r.vault)){
        vaults++; ids.add(r.vault);
        assert.ok(!per.has(r.vault), 'no set piece twice on a floor'); per.add(r.vault);
        const v = VAULTS.find(v => v.id === r.vault);
        assert.equal(r.name, v.name); assert.equal(r.read, v.read);
        assert.ok(walk(f.grid[r.cy * f.W + r.cx]), 'its middle is open');
        assert.ok(!r.shape && !r.feature, 'a plain room, and no other feature on top');
      }
      // no two props share a square
      const taken = new Map();
      for (const p of f.props || []){ const s = propSize(p); for (let y = p.y; y < p.y + s.h; y++) for (let x = p.x; x < p.x + s.w; x++){ const i = y * f.W + x; assert.ok(!taken.has(i), `${template} ${k} floor ${L}: ${p.k} on top of ${taken.get(i)}`); taken.set(i, p.k); } }
    });
  }
  assert.ok(vaults >= 6, `${vaults} set pieces in 72 floors`);
  assert.ok(ids.size >= 4, [...ids].join());
});
