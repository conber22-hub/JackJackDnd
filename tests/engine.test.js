import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, setState, state, T, walk } from '../src/engine/state.js';
import { reach, updateVision, passMove } from '../src/engine/grid.js';
import { carve, addRoom, deleteRoom, rectProblem, moveStairs, appendFloor, roomById } from '../src/engine/generator.js';
import { parseTable, tableGaps, tableRow } from '../src/engine/tables.js';
import { DEFAULT_SHIFT_TABLE, DEFAULT_GRASP_TABLE } from '../src/data/tables.js';
import { parseMapInput, buildImportedFloor, floorToAscii } from '../src/engine/importer.js';
import { TEMPLATES } from '../src/data/themes.js';
import { BEST } from '../src/data/bestiary.js';

// every walkable tile reachable from the up/entry stairs (ignoring tokens and doors)
function connected(f){
  const start = f.up ? f.up.y * f.W + f.up.x : f.rooms[0].cy * f.W + f.rooms[0].cx;
  const seen = new Set([start]), q = [start];
  while (q.length){ const i = q.pop(), x = i % f.W, y = (i / f.W) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = x + dx, ny = y + dy, ni = ny * f.W + nx;
      if (nx >= 0 && ny >= 0 && nx < f.W && ny < f.H && walk(f.grid[ni]) && !seen.has(ni)){ seen.add(ni); q.push(ni); } } }
  return f.rooms.every(r => seen.has(r.cy * f.W + r.cx)) && (!f.down || seen.has(f.down.y * f.W + f.down.x));
}

test('same seed builds the same dungeon', () => {
  const a = newState({ seed:'ash-saint-123', floors:4 }), b = newState({ seed:'ash-saint-123', floors:4 });
  assert.equal(a.floors.map(f => f.grid.join('')).join('|'), b.floors.map(f => f.grid.join('')).join('|'));
  const c = newState({ seed:'ash-saint-124', floors:4 });
  assert.notEqual(a.floors[0].grid.join(''), c.floors[0].grid.join(''));
});

for (const tpl of TEMPLATES) test(`template "${tpl.id}": stairs line up and every room is reachable`, () => {
  for (const seed of ['one', 'two', 'three']){
    const s = newState({ seed, floors:5, template:tpl.id });
    assert.equal(s.floors.length, 5);
    s.floors.forEach((f, L) => {
      assert.ok(connected(f), `${tpl.id}/${seed} floor ${L} is disconnected`);
      if (L < 4){ assert.ok(f.down, 'has stairs down'); assert.deepEqual(f.down, s.floors[L + 1].up); assert.equal(f.grid[f.down.y * f.W + f.down.x], T.DOWN); }
      else assert.equal(f.down, null);
    });
    for (const t of s.tokens) assert.ok(walk(s.floors[t.floor].grid[t.y * 40 + t.x]), `${t.name} stands on rock`);
  }
});

test('outbreak template populates monsters, including a boss', () => {
  const s = newState({ seed:'pop', floors:4, template:'outbreak' });
  const foes = s.tokens.filter(t => t.kind === 'monster');
  assert.ok(foes.length > 5, `only ${foes.length} monsters`);
  assert.ok(foes.some(t => t.bid === 'undertow'), 'the Undertow waits at the bottom');
});

test('doors: locked blocks movement, closed does not', () => {
  const s = newState({ seed:'doors', floors:2 }); setState(s);
  const f = s.floors[0], pc = s.tokens.find(t => t.kind === 'pc');
  const R = reach(0, pc.x, pc.y, 999, pc.id);
  const target = [...R.par.keys()].find(i => f.grid[i] === T.HALL);
  // put a locked door on a corridor tile on the path and check it is no longer walkable
  f.doors = f.doors.filter(d => d.i !== target);
  f.doors.push({ id:999, i:target, state:'locked', dc:15 });
  assert.equal(passMove(f, target), false);
  f.doors.at(-1).state = 'closed';
  assert.equal(passMove(f, target), true);
});

test('vision marks explored tiles', () => {
  const s = newState({ seed:'vis', floors:2 }); setState(s);
  assert.ok(updateVision());
  assert.ok(state.explored[0].size > 10);
});

test('room editing keeps the floor connected', () => {
  const s = newState({ seed:'edit', floors:2 }); setState(s);
  const f = s.floors[0];
  const free = { x:2, y:2, w:3, h:3 };
  let spot = null;
  for (let y = 1; y < 36 && !spot; y++) for (let x = 1; x < 36 && !spot; x++) if (!rectProblem(f, { ...free, x, y })) spot = { ...free, x, y };
  if (spot){ const r = addRoom(f, spot); carve(f); assert.ok(connected(f)); assert.equal(deleteRoom(f, r.id), null); carve(f); assert.ok(connected(f)); }
  const plain = f.rooms.find(r => !r.stairsUp && !r.stairsDown && r !== f.rooms[0]);
  if (plain){ assert.equal(deleteRoom(f, plain.id), null); carve(f); assert.ok(connected(f)); assert.equal(roomById(f, plain.id), undefined); }
  const stairsRoom = f.rooms.find(r => r.stairsDown);
  assert.match(deleteRoom(f, stairsRoom.id), /stairs/);
});

test('moving stairs moves both ends', () => {
  const s = newState({ seed:'stairs', floors:3 }); setState(s);
  const r = s.floors[0].rooms[0];
  assert.equal(moveStairs(s.floors, 0, 'down', r.cx + 1, r.cy), null);
  assert.deepEqual(s.floors[0].down, { x:r.cx + 1, y:r.cy });
  assert.deepEqual(s.floors[1].up, { x:r.cx + 1, y:r.cy });
  assert.ok(connected(s.floors[1]));
});

test('appending a floor gives the old bottom floor stairs down', () => {
  const s = newState({ seed:'append', floors:2 }); setState(s);
  assert.equal(s.floors[1].down, null);
  appendFloor(s.floors, s.meta);
  assert.equal(s.floors.length, 3);
  assert.deepEqual(s.floors[1].down, s.floors[2].up);
  assert.ok(connected(s.floors[2]));
});

test('default Shift table covers d100 and Grasp table covers d12', () => {
  const sh = parseTable(DEFAULT_SHIFT_TABLE), gr = parseTable(DEFAULT_GRASP_TABLE);
  assert.deepEqual(sh.errors, []); assert.deepEqual(gr.errors, []);
  assert.deepEqual(tableGaps(sh.rows, 100), []); assert.deepEqual(tableGaps(gr.rows, 12), []);
  assert.equal(tableRow(sh.rows, 100).name, 'Reality Tears');
  for (const r of [...sh.rows, ...gr.rows]) for (const fx of r.fx){
    const m = fx.match(/^spawn:([^:]+)/); if (m) assert.ok(BEST[m[1]], `unknown creature ${m[1]}`);
  }
});

test('bestiary fx reference real creatures', () => {
  for (const b of Object.values(BEST)){
    const all = [...(b.specials || []).map(s => s.fx), ...Object.values(b.hooks || {}).flat()];
    for (const fx of all){ const m = fx.match(/^(?:spawn|morph):([^:@]+)/); if (m) assert.ok(BEST[m[1]], `${b.id}: unknown creature ${m[1]}`); }
  }
});

test('ASCII import round-trips', () => {
  const txt = `=== Test Hall ===
##########
#....#...#
#....+...#
#.<..#.>.#
#....#...#
##########`;
  const p = parseMapInput(txt);
  assert.equal(p.floors.length, 1);
  const { floor } = buildImportedFloor(p.floors[0], 0, 20, 0);
  assert.deepEqual(floor.up, { x:2, y:3 }); assert.deepEqual(floor.down, { x:7, y:3 });
  assert.equal(floor.doors.length, 1); assert.equal(floor.doors[0].state, 'closed');
  assert.ok(floor.rooms.length >= 2);
  const back = floorToAscii(floor);
  assert.match(back, /#\.<\.\.#\.>\.#/);
});

test('JSON import accepts a Battle-Table-style grid with rooms, doors and tokens', () => {
  const json = { name:'BT map', width:12, height:8, grid:[
    '############', '#....#.....#', '#....+.....#', '#....#.....#', '######.....#', '######.....#', '######.....#', '############'],
    rooms:[{ x:1, y:1, w:4, h:3, name:'Crypt A', type:'crypt' }], doors:[{ x:5, y:2, locked:true }],
    tokens:[{ name:'Seepling', x:7, y:3 }], stairs:[{ x:8, y:5, dir:'down' }] };
  const p = parseMapInput(JSON.stringify(json));
  const { floor, tokens } = buildImportedFloor(p.floors[0], 0, 20, 0);
  assert.equal(floor.name, 'BT map');
  assert.equal(floor.doors[0].state, 'locked');
  assert.ok(floor.rooms.some(r => r.name === 'Crypt A' && r.type === 'crypt'));
  assert.deepEqual(floor.down, { x:8, y:5 });
  assert.equal(tokens[0].name, 'Seepling');
});
