import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, setState, T, walk } from '../src/engine/state.js';
import { genPlace } from '../src/engine/settlement.js';
import { layoutFloor, carve, riseHeights } from '../src/engine/generator.js';
import { reach, standHeight, groundY, roughSet } from '../src/engine/grid.js';
import { STEP_H } from '../src/engine/tiles.js';
import { redactForPlayers } from '../src/engine/redact.js';

test('Yester Hill rises to its top, and its slopes are hard going', () => {
  const lay = genPlace('hill', { seed:7, name:'Yester Hill', last:true });
  const f = layoutFloor(0, 40, 40, { theme:'woods', layout:lay }, null, true), top = f.rooms.find(r => r.rise === 3);
  assert.ok(top, 'the hilltop is a rise');
  assert.equal(f.height[top.cy * 40 + top.cx], 3, 'highest in the middle');
  const edge = top.y * 40 + top.x; assert.ok(!f.height[edge], 'and level ground at its rim');
  assert.ok(f.slope.length > 10, 'slopes between the levels');
  for (const i of f.slope) assert.ok(walk(f.grid[i]) && f.height[i] > 0, 'a slope is a raised square');
  assert.ok(roughSet(f).has(f.slope[0]), 'slopes are difficult terrain');
});

test('walking up a rise costs more than walking round it on the level', () => {
  const W = 20, H = 12, grid = Array(W * H).fill(T.ROCK);
  const f = { level:0, W, H, theme:8, rooms:[{ id:0, x:2, y:2, w:15, h:8, cx:9, cy:6, outdoor:true, rise:0 }], edges:[], corridors:[], autoLink:false, up:null, down:null, grid, dug:[], filled:[], doors:[], traps:[], base:null, nextObj:1, rough:[], props:[] };
  carve(f);
  setState({ floors:[f], tokens:[], explored:{ 0:new Set() }, meta:{ size:20 } });
  const flat = reach(0, 2, 6, 30).dist.get(6 * W + 9);
  f.rooms[0].rise = 2; carve(f);
  const hilly = reach(0, 2, 6, 30).dist.get(6 * W + 9);
  assert.ok(hilly > flat, `the top costs more to reach (${hilly} > ${flat})`);
  // a mini on the top stands higher; one on a crate on the top higher still
  assert.equal(groundY(f, 9, 6), 2 * STEP_H);
  assert.equal(standHeight(f, 9, 6), 2 * STEP_H);
  f.props.push({ id:1, k:'crate', x:9, y:6, rot:0 }); f.propsV = 1;
  assert.ok(standHeight(f, 9, 6) > 2 * STEP_H + .3, 'on a crate on the hill');
  // flattened again, nothing left raised
  f.rooms[0].rise = 0; carve(f);
  assert.equal(f.height, undefined); assert.equal(f.slope.length, 0);
});

test('players get the heights of the ground they have seen, and keep them', () => {
  const lay = genPlace('hill', { seed:7, name:'Yester Hill', last:true });
  const s = newState({ seed:'hill-p', floors:1, template:'blank', party:false });
  s.floors[0] = layoutFloor(0, 40, 40, { theme:'woods', layout:lay }, null, true);
  const top = s.floors[0].rooms.find(r => r.rise), mid = top.cy * 40 + top.cx;
  const out = redactForPlayers(s, { explored:{ 0:[mid, mid + 1] } }).floors[0];
  assert.equal(out.height[mid], 3, 'the hilltop they stand on');
  assert.ok(Object.keys(out.height).length < Object.keys(s.floors[0].height).length, 'not the parts they have not seen');
  // the player's copy has no `rise` on its rooms: re-working it out keeps the heights it was sent
  const before = JSON.stringify(out.height); riseHeights(out); assert.equal(JSON.stringify(out.height), before);
});
