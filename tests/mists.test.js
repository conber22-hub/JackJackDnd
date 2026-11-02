import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, setState, T, walk } from '../src/engine/state.js';
import { carve, layoutFloor } from '../src/engine/generator.js';
import { landmarkSpecs, planJourney } from '../src/engine/overland.js';
import { vision, passSight } from '../src/engine/grid.js';

test('deep mist hides what is in it and beyond it', () => {
  const W = 20, H = 7, grid = Array(W * H).fill(T.ROCK);
  const f = { level:0, W, H, theme:8, rooms:[{ id:0, x:1, y:1, w:18, h:5, cx:10, cy:3, outdoor:true }], edges:[], corridors:[], autoLink:false, up:null, down:null, grid, dug:[], filled:[], doors:[], traps:[], base:null, nextObj:1, rough:[], props:[] };
  carve(f);
  setState({ floors:[f], tokens:[], explored:{ 0:new Set() }, meta:{ size:20 } });
  const hero = { id:'a', kind:'pc', floor:0, x:2, y:3, size:1, conds:[] };
  assert.ok(vision(hero).has(3 * W + 12), 'on a clear day you see across the clearing');
  f.mists = []; for (let y = 1; y < 6; y++) f.mists.push(y * W + 8, y * W + 9);
  assert.ok(!passSight(f, 3 * W + 8), 'mist is not see-through');
  const seen = vision(hero);
  assert.ok(seen.has(3 * W + 8), 'you see the edge of the bank');
  assert.ok(!seen.has(3 * W + 9) && !seen.has(3 * W + 12), 'but not into it or past it');
  // a hero at the edge of the bank sees back out the clear side, but not on through the mist
  const lost = { ...hero, x:8 }, ls = vision(lost);
  assert.ok(ls.has(3 * W + 7) && ls.has(3 * W + 5) && !ls.has(3 * W + 10) && !ls.has(3 * W + 12));
});

test('the Mist Wall stands across the far side of the place where the road ends', () => {
  const [spec] = landmarkSpecs('mists', 'wall-1'), f = layoutFloor(0, 40, 40, spec, null, true);
  assert.ok(f.mistWall.length > 20, `a wall of it (${f.mistWall.length} squares)`);
  for (const i of f.mistWall){ assert.ok(walk(f.grid[i]), 'you can walk into it'); assert.ok(f.mists.includes(i), 'and it hides'); }
  // the rest of the clearing is clear, and the way in is not mist
  const r0 = f.rooms[0]; assert.ok(!f.mists.includes(r0.cy * 40 + r0.cx));
});

test('the road between the Mists and the Gates has banks of mist lying across it', () => {
  const plan = planJourney('mists', 'gates');
  const s = newState({ name:'J', seed:'mist-road', floors:plan.stretches.length, size:40, template:'journey', journey:{ from:'mists', to:'gates', seed:'mist-road', n:1, gaze:2, bloom:false }, party:false });
  assert.ok(s.floors.some(f => f.mists.length > 10), 'deep mist on the road');
  for (const f of s.floors) for (const i of f.mists) assert.ok(walk(f.grid[i]));
});
