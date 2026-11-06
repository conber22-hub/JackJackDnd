import test from 'node:test';
import assert from 'node:assert/strict';
import { genDelve } from '../src/engine/generator.js';
import { reachable } from '../src/engine/caves.js';
import { walk } from '../src/engine/tiles.js';

// ChatGPT's site planner (engine/sites.js) on generated delves (engine/sitegraph.js): most floors get a plan, every
// room a part, a locked door names its key, and the floor still joins up.
test('generated floors get a site plan: roles, factions, locked doors with keys, and one connected floor', () => {
  let planned = 0, floors = 0, locked = 0;
  for (const template of ['andral', 'castle', 'labyrinth', 'caverns']) for (let k = 1; k <= 5; k++){
    for (const f of genDelve({ seed:`plan-${template}-${k}`, template, floors:3, size:40 })){
      floors++;
      const start = f.up ? f.up.y * f.W + f.up.x : f.rooms[0].cy * f.W + f.rooms[0].cx, seen = reachable(f, start);
      assert.ok(f.grid.every((v, i) => !walk(v) || seen.has(i)), 'one piece');
      if (!f.site) continue;
      planned++;
      assert.ok(f.site.name && f.site.hook && f.site.twist && f.site.factions.length >= 1);
      assert.ok(f.rooms.every(r => r.role), 'every room has a part');
      for (const d of f.doors.filter(d => d.state === 'locked' && d.key)){ locked++; assert.ok(typeof d.key === 'string' && d.dc >= 15); }
      assert.doesNotThrow(() => JSON.parse(JSON.stringify(f.site)));
    }
  }
  assert.ok(planned >= floors * .7, `${planned} of ${floors} floors planned`);
  assert.ok(locked > 0, 'some doors are locked by a plan');
});
