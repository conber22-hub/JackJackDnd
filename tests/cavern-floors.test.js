import test from 'node:test';
import assert from 'node:assert/strict';
import { genDelve } from '../src/engine/generator.js';
import { reachable } from '../src/engine/caves.js';
import { walk, T } from '../src/engine/tiles.js';

// ChatGPT's caverns (engine/caverns.js) as floors: the Deep Caverns template.
test('the Deep Caverns: grown floors, stairs that line up, a lake and a bridge, and everything joins up', () => {
  for (let k = 1; k <= 6; k++){
    const floors = genDelve({ seed:`cav-${k}`, template:'caverns', floors:4, size:48 });
    floors.forEach((f, L) => {
      assert.ok(f.cavern, `floor ${L} is a cavern`);
      const seen = reachable(f, f.up.y * f.W + f.up.x);
      assert.ok(f.grid.every((v, i) => !walk(v) || seen.has(i)), `seed ${k} floor ${L}: one piece`);
      assert.equal(f.grid[f.up.y * f.W + f.up.x], T.UP);
      if (L < 3){ assert.equal(f.grid[f.down.y * f.W + f.down.x], T.DOWN); assert.ok(seen.has(f.down.y * f.W + f.down.x)); }
      if (L > 0) assert.deepEqual(f.up, floors[L - 1].down, 'the way up is under the way down above');
      assert.ok(f.rooms.length >= 2, 'its wide places are rooms');
      for (const r of f.rooms) assert.ok(walk(f.grid[r.cy * f.W + r.cx]), 'each wide place\'s middle is open');
      for (const i of f.water || []) assert.ok(!walk(f.grid[i]), 'deep water can\'t be walked');
      for (const i of f.shallow || []) assert.ok(walk(f.grid[i]) && f.rough.includes(i), 'the shallow rim is difficult ground');
      for (const i of f.chasm || []) assert.ok(!walk(f.grid[i]));
      for (const i of f.span || []) assert.ok(walk(f.grid[i]));
    });
    assert.ok(floors[1].water.length > 20, 'the lake floor has a lake');
    assert.ok(floors[2].chasm.length > 0 && floors[2].span.length > 0, 'the chasm floor has a drop and a bridge');
  }
});
