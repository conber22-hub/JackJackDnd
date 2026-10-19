import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, setState, walk } from '../src/engine/state.js';
import { route, planJourney, rollEvents } from '../src/engine/overland.js';
import { VALLEY_PLACES, VALLEY_ROADS, ROAD_EVENTS } from '../src/data/barovia-map.js';
import { PROPS } from '../src/data/props.js';
import { BEST } from '../src/data/bestiary.js';
import { TEMPLATES } from '../src/data/themes.js';
import { mulberry32 } from '../src/util/core.js';

const reachable = (f, from) => {
  const start = from.y * f.W + from.x, seen = new Set([start]), q = [start];
  while (q.length){ const i = q.pop(), x = i % f.W, y = (i / f.W) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = x + dx, ny = y + dy, ni = ny * f.W + nx;
      if (nx >= 0 && ny >= 0 && nx < f.W && ny < f.H && walk(f.grid[ni]) && !seen.has(ni)){ seen.add(ni); q.push(ni); } } }
  return seen;
};
const journey = (from, to, seed = 'road', n = 1, gaze = 3, bloom = true) => {
  const plan = planJourney(from, to);
  return newState({ name:'J', seed, floors:plan.stretches.length, size:40, template:'journey', journey:{ from, to, seed, n, gaze, bloom }, party:false });
};

test('the valley: every place is on the road network and roads name real places', () => {
  for (const r of VALLEY_ROADS) assert.ok(VALLEY_PLACES.some(p => p.id === r.a) && VALLEY_PLACES.some(p => p.id === r.b), r.id);
  for (const p of VALLEY_PLACES) assert.ok(route('mists', p.id), `${p.id} cannot be reached from the mists`);
  for (const p of VALLEY_PLACES) for (const m of p.maps || [p.map]) assert.ok(m === 'landmark' || TEMPLATES.some(t => t.id === m), `${p.id}: no template ${m}`);
  assert.deepEqual(route('gates', 'tser'), ['gates', 'village', 'crossroads', 'tser']);
});

test('road events name real creatures and can be rolled at any Gaze', () => {
  for (const e of ROAD_EVENTS) for (const [bid] of e.enc || []) assert.ok(BEST[bid], `${e.label}: unknown ${bid}`);
  const g = mulberry32(7); for (let i = 0; i < 50; i++) assert.ok(rollEvents(g, { gaze:1 + (i % 10), bloom:i % 2 === 0 }).length <= 2);
  assert.ok(!rollEvents(mulberry32(3), { gaze:1, bloom:false }, 5).some(e => e.bloom || e.gaze > 1));
});

for (const p of VALLEY_PLACES.filter(p => p.id !== 'mists')) test(`journey to ${p.name}: stretches chain, everything is reachable, nothing sits wrong`, () => {
  const from = p.id === 'gates' ? 'mists' : 'gates';
  for (const seed of ['a', 'b']){
    const s = journey(from, p.id, seed); setState(s);
    s.floors.forEach((f, L) => {
      const start = f.up || { x:f.rooms[0].cx, y:f.rooms[0].cy }, seen = reachable(f, start);
      for (const r of f.rooms) assert.ok(seen.has(r.cy * f.W + r.cx) || [...seen].some(i => { const x = i % f.W, y = (i / f.W) | 0; return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }), `${p.id}/${seed} floor ${L}: ${r.name} unreachable`);
      if (L < s.floors.length - 1){ assert.ok(f.down && seen.has(f.down.y * f.W + f.down.x), `${p.id}/${seed} floor ${L}: the way on is unreachable`); assert.deepEqual(f.down, s.floors[L + 1].up); }
      for (const b of f.buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++){
        assert.ok(x >= 0 && y >= 0 && x < f.W && y < f.H, `${p.id}: ${b.name} off the map`);
        assert.ok(!walk(f.grid[y * f.W + x]), `${p.id}/${seed} floor ${L}: ${b.name} covers floor at ${x},${y}`);
      }
      for (const i of f.water) assert.ok(!walk(f.grid[i]));
      for (const pr of f.props) assert.ok(PROPS[pr.k], `unknown prop ${pr.k}`);
      for (const e of f.events) assert.ok(seen.has(e.y * f.W + e.x), `${p.id}/${seed} floor ${L}: event "${e.label}" is off the road`);
    });
    const last = s.floors[s.floors.length - 1];
    assert.ok(last.rooms.some(r => r.name === p.name), `${p.id}: no arrival clearing`);
  }
});

test('the same road has the same shape; the events change with the journey', () => {
  const a = journey('village', 'crossroads', 'x', 1), b = journey('village', 'crossroads', 'x', 1), c = journey('village', 'crossroads', 'x', 2);
  assert.equal(a.floors[0].grid.join(''), b.floors[0].grid.join(''));
  assert.deepEqual(a.floors.map(f => f.events.map(e => e.label)), b.floors.map(f => f.events.map(e => e.label)));
  const labels = s => s.floors.flatMap(f => f.events.map(e => e.label)).join('|');
  let differs = labels(a) !== labels(c); for (let n = 3; n < 8 && !differs; n++) differs = labels(a) !== labels(journey('village', 'crossroads', 'x', n));
  assert.ok(differs, 'events never change between journeys');
});

const PLACE_TEMPLATES = ['barovia', 'vallaki', 'krezk', 'tserpool', 'berez', 'winery', 'lakeshore', 'yester', 'tower', 'argyn', 'ravenloft'];
for (const id of PLACE_TEMPLATES) test(`place map "${id}": houses, water, doors and props sit right`, () => {
  const tpl = TEMPLATES.find(t => t.id === id);
  for (const seed of ['p1', 'p2', 'p3']){
    const s = newState({ seed, floors:tpl.floors.length, size:40, template:id, party:false }); setState(s);
    s.floors.forEach((f, L) => {
      for (const b of f.buildings || []) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) assert.ok(!walk(f.grid[y * f.W + x]), `${id}/${seed} floor ${L}: ${b.name} covers floor at ${x},${y}`);
      for (const i of f.water || []) assert.ok(!walk(f.grid[i]));
      for (const d of f.doors) assert.ok(walk(f.grid[d.i]), `${id}: a door on rock`);
      for (const pr of f.props || []) assert.ok(PROPS[pr.k], `unknown prop ${pr.k}`);
      const seen = reachable(f, f.up || { x:f.rooms[0].cx, y:f.rooms[0].cy });
      for (const r of f.rooms) assert.ok([...seen].some(i => { const x = i % f.W, y = (i / f.W) | 0; return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h; }), `${id}/${seed} floor ${L}: ${r.name} unreachable`);
    });
  }
});
test('every place in the valley has a map to enter', () => {
  for (const p of VALLEY_PLACES) assert.ok(p.map, `${p.name} has no map`);
  for (const id of ['gates', 'crossroads', 'mists']){
    const s = newState({ seed:'lm', floors:1, size:40, template:'landmark', place:id, party:false });
    assert.ok(s.floors[0].rooms.some(r => r.name === VALLEY_PLACES.find(p => p.id === id).name));
  }
});
