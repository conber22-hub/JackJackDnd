import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, setState, T } from '../src/engine/state.js';
import { isTraveller, packMap, unpackFloor, arrivalAnchor, arrivalSpots, trimRoads, libraryList } from '../src/engine/maps.js';

test('a map on the shelf keeps its floors, fog and creatures — but not the party', () => {
  const s = newState({ seed:'shelf', floors:2, template:'andral' }); setState(s);
  s.meta.mapId = 'm1'; s.meta.key = 'session:1:andral'; s.meta.kind = 'session';
  s.explored[0] = new Set([5, 6, 7]);
  s.tokens.push({ id:'z', kind:'monster', name:'Zombie', floor:1, x:3, y:3, flags:{}, conds:[] });
  s.tokens.push({ id:'n1', kind:'npc', name:'Ismark', floor:0, x:2, y:2, flags:{}, conds:[] });
  s.tokens.push({ id:'n2', kind:'npc', name:'Innkeeper', floor:0, x:4, y:2, flags:{ stay:true }, conds:[] });
  const lead = s.tokens.find(t => t.kind === 'pc');
  const e = packMap(s);
  assert.equal(e.id, 'm1'); assert.equal(e.key, 'session:1:andral'); assert.equal(e.kind, 'session');
  assert.deepEqual(e.explored[0], [5, 6, 7]);
  assert.equal(typeof e.floors[0].grid, 'string');
  assert.deepEqual(unpackFloor(e.floors[0]).grid, s.floors[0].grid);
  assert.deepEqual(e.tokens.map(t => t.id).sort(), ['n2', 'z'], 'the zombie and the NPC who stays; heroes and Ismark travel');
  assert.ok(isTraveller(lead) && isTraveller({ kind:'npc', flags:{} }) && !isTraveller({ kind:'npc', flags:{ stay:true } }) && !isTraveller({ kind:'monster', flags:{} }));
  assert.deepEqual(e.left, { floor:lead.floor, x:lead.x, y:lead.y }, 'where the party stood');
  assert.doesNotThrow(() => JSON.stringify(e));
});

test('the party arrives where it left, else at the way in, else in the first room', () => {
  const s = newState({ seed:'arrive', floors:2, template:'andral' }); setState(s);
  const e = packMap(s);
  assert.deepEqual(arrivalAnchor(e), e.left);
  const fresh = { floors:s.floors };
  const a = arrivalAnchor(fresh), up = s.floors[0].up;
  if (up) assert.deepEqual(a, { floor:0, x:up.x, y:up.y }); else assert.equal(a.floor, 0);
  assert.deepEqual(arrivalAnchor({ floors:[{ W:10, H:10, rooms:[{ x:2, y:2, w:4, h:2, cx:4, cy:3 }] }] }), { floor:0, x:4, y:3 });
});

test('arrival squares: open floor round the spot, walking distance first, nobody doubled up', () => {
  // a 9×5 room split by a wall at x = 4 with a gap at the bottom
  const W = 9, H = 5, grid = Array(W * H).fill(T.ROOM);
  for (let y = 0; y < 4; y++) grid[y * W + 4] = T.ROCK;
  const f = { W, H, grid, doors:[], props:[], rooms:[] };
  setState({ floors:[f], tokens:[] });
  const spots = arrivalSpots(f, { x:3, y:0 }, 12, (x, y) => x === 2 && y === 0);
  assert.equal(spots.length, 12);
  assert.deepEqual(spots[0], { x:3, y:0 }, 'the leader on the spot');
  assert.ok(!spots.some(p => p.x === 2 && p.y === 0), 'not on someone');
  assert.ok(!spots.some(p => p.x === 4 && p.y < 4), 'never in the wall');
  const left = spots.filter(p => p.x < 4).length;
  assert.ok(left >= 11, 'the near side of the wall fills first');
  // an anchor inside the wall starts from the nearest open square
  assert.ok(arrivalSpots(f, { x:4, y:1 }, 1)[0].x !== 4);
});

test('old road maps are cleared from the shelf, newest kept', () => {
  const lib = {};
  for (let i = 0; i < 6; i++) lib['r' + i] = { id:'r' + i, kind:'road', savedAt:i, floors:[] };
  lib.v = { id:'v', kind:'place', savedAt:0, floors:[] };
  assert.deepEqual(trimRoads(lib, 3).sort(), ['r0', 'r1', 'r2']);
  assert.deepEqual(libraryList(lib).map(e => e.id), ['r5', 'r4', 'r3', 'v']);
});
