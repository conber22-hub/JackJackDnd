import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, setState, state, T, walk } from '../src/engine/state.js';
import { reach, updateVision, passMove, lineClear, canSee, pathTo, pathCost } from '../src/engine/grid.js';
import { carve, addRoom, deleteRoom, rectProblem, moveStairs, appendFloor, roomById } from '../src/engine/generator.js';
import { parseTable, tableGaps, tableRow } from '../src/engine/tables.js';
import { DEFAULT_SHIFT_TABLE, DEFAULT_WHIM_TABLE } from '../src/data/tables.js';
import { PROPS, propSize, propAt } from '../src/data/props.js';
import { parseMapInput, buildImportedFloor, floorToAscii, floorToJSON } from '../src/engine/importer.js';
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
    for (const t of s.tokens) assert.ok(walk(s.floors[t.floor].grid[t.y * s.floors[t.floor].W + t.x]), `${t.name} stands on rock`);
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

test('default Shift table covers d100 and Whim table covers d12', () => {
  const sh = parseTable(DEFAULT_SHIFT_TABLE), gr = parseTable(DEFAULT_WHIM_TABLE);
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

test('Battle Table saves import: pieces, shared walls, doors, secret doors, stairs, roster', async () => {
  const P = (k, x, y, o = {}) => ({ id:Math.random().toString(36).slice(2), k, x, y, name:'', tag:'', notes:'', conns:[], dir:'down', ...o });
  const bt = { v:2, name:'Upper crypt', theme:'dungeon', active:0, levels:[
    { id:'a', name:'Crypt level', parts:[
      P('chamber', 0, 0, { w:6, h:5, name:'Entry hall', tag:'Guard post', conns:[{ e:'s', o:2.5, t:'door' }] }),
      P('corridor', 2, 5, { w:2, h:4, name:'Descent', conns:[{ e:'n', o:0.5, t:'arch' }, { e:'s', o:0.5, t:'arch' }] }),
      P('crypt', -1, 9, { w:7, h:5, name:'Ossuary', tag:'Ambush', conns:[{ e:'n', o:2, t:'arch' }, { e:'e', o:1.5, t:'door' }, { e:'w', o:1.5, t:'secret' }] }),
      P('vault', 6, 9, { w:5, h:4, name:'Reliquary', tag:'Treasure', conns:[{ e:'w', o:1.5, t:'secret' }] }),
      P('shrine', -7, 9, { w:6, h:6, name:'Forgotten shrine', tag:'Shrine', conns:[{ e:'e', o:2, t:'door' }] }),
      P('stairs', 8, 3, { w:3, h:5, name:'Down', dir:'down', conns:[{ e:'w', o:1.5, t:'arch' }] }) ], notes:'' },
    { id:'b', name:'The Bloomed chapel', parts:[
      P('shrine', 0, 0, { w:6, h:6, name:'Nave', tag:'Ritual site', conns:[{ e:'s', o:2.5, t:'arch' }, { e:'n', o:2.5, t:'door' }] }),
      P('hall', -2, -6, { w:10, h:6, name:'Apse', tag:'Boss lair', conns:[{ e:'s', o:4.5, t:'arch' }] }),
      P('stairs', 7, 1, { w:3, h:5, name:'Up', dir:'up', conns:[{ e:'w', o:1.5, t:'arch' }] }) ], notes:'' } ],
    roster:[{ id:'t1', mid:'sporeling', name:'Sporeling', x:1, y:1, lvl:1, hp:13, hpMax:13, ac:13, n:1 }, { id:'t2', mid:'ghoul', name:'Ghoul', x:1, y:11, lvl:0, n:1 }] };
  const p = parseMapInput(JSON.stringify(bt));
  assert.equal(p.floors.length, 2);
  const { floor:f0, tokens:t0 } = buildImportedFloor(p.floors[0], 0, 40, 0);
  assert.ok(f0.rooms.some(r => r.name === 'Ossuary' && r.type === 'lair'));
  assert.ok(f0.rooms.some(r => r.name === 'Reliquary' && r.type === 'treasure'));
  assert.equal(f0.doors.filter(d => d.state === 'secret').length, 2, 'two secret doors');
  assert.ok(f0.doors.some(d => d.state === 'closed'), 'a closed door');
  assert.ok(f0.down, 'stairs down from the stairwell');
  assert.equal(t0[0].name, 'Ghoul');
  // the shared wall between the entry hall and the corridor keeps a gap only at the door
  const reachable = new Set([f0.rooms[0].cy * f0.W + f0.rooms[0].cx]), q = [...reachable];
  while (q.length){ const i = q.pop(), x = i % f0.W, y = (i / f0.W) | 0; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const ni = (y + dy) * f0.W + x + dx; if (f0.grid[ni] > 0 && !reachable.has(ni)){ reachable.add(ni); q.push(ni); } } }
  for (const r of f0.rooms) assert.ok(reachable.has(r.cy * f0.W + r.cx) || f0.grid[r.cy * f0.W + r.cx] === 0, `${r.name} reachable`);
  const { tokens:t1, floor:f1 } = buildImportedFloor(p.floors[1], 1, 40, 0, { up:f0.down });
  assert.equal(t1[0].bid, 'sporeling');
  assert.deepEqual(f1.up, f0.down);
});

test('Session 0 (the Salt Road): hand-built floors with doors, houses, props and named exits', () => {
  const s = newState({ seed:'s0', floors:3, template:'saltroad', party:false }); setState(s);
  const [tavern, village, road] = s.floors;
  assert.deepEqual([tavern.name, village.name, road.name], ['The Lantern & Ladle', 'Hollin\'s Ford', 'The Old Salt Road']);
  assert.deepEqual(tavern.down, village.up); assert.deepEqual(village.down, road.up);
  assert.equal(tavern.doors.length, 5); assert.equal(village.doors.length, 4);
  assert.ok(village.buildings.length >= 6 && road.buildings.length === 1);
  for (const f of s.floors){
    assert.ok(f.exits && f.props.length > 10, `${f.name} has props and exits`);
    for (const p of f.props){
      assert.ok(PROPS[p.k], `${f.name}: unknown prop ${p.k}`);
      const sz = propSize(p); let onFloor = false;
      for (let y = p.y; y < p.y + sz.h; y++) for (let x = p.x; x < p.x + sz.w; x++) if (walk(f.grid[y * f.W + x])) onFloor = true;
      assert.ok(onFloor, `${f.name}: ${p.k} at ${p.x},${p.y} sits on solid rock`);
    }
    // houses stand on rock, never on a walkable square
    for (const b of f.buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) assert.ok(!walk(f.grid[y * f.W + x]), `${f.name}: ${b.name} covers floor at ${x},${y}`);
  }
  assert.equal(propAt(road, 6, 23)?.k, 'wreck');
  assert.ok(road.rooms.some(r => r.type === 'lair' && /Carriage/.test(r.name)));
});

test('floor JSON keeps props and houses', () => {
  const s = newState({ seed:'s0', floors:3, template:'saltroad', party:false }); setState(s);
  const json = JSON.stringify(floorToJSON(s.floors[1]));
  const parsed = parseMapInput(json), { floor } = buildImportedFloor(parsed.floors[0], 0, 40, 0);
  assert.equal(floor.props.length, s.floors[1].props.length);
  assert.equal(floor.buildings.length, s.floors[1].buildings.length);
});

test('line of sight: walls block, corner squeezes block, the wall itself is seen', () => {
  // 7×5 room with a pillar at (3,2) and two blocks touching at a corner around (5,0)-(6,1)
  const W = 7, H = 5, grid = Array(W * H).fill(T.ROOM);
  const rock = (x, y) => grid[y * W + x] = T.ROCK;
  rock(3, 2); rock(6, 0); rock(5, 1);
  const f = { W, H, grid, doors:[] };
  assert.equal(canSee(f, 0, 2, 6, 2), false);              // straight behind the pillar
  assert.equal(canSee(f, 0, 2, 3, 2), true);               // the pillar itself
  assert.equal(canSee(f, 0, 2, 6, 4), true);               // around it
  assert.equal(lineClear(f, 4.5, 2.5, 6.5, 0.5), false);   // through the corner between (5,1) and (6,0)… blocked at (5,1)
  assert.equal(canSee(f, 0, 0, 6, 4), false);             // in the pillar's shadow
  assert.equal(canSee(f, 0, 4, 6, 4), true);
});

test('difficult terrain costs two squares and the path goes around it when that is cheaper', () => {
  const s = newState({ seed:'rough', floors:1, party:false }); setState(s);
  const W = 9, H = 5, f = { W, H, grid:Array(W * H).fill(T.ROOM), doors:[], rooms:[], rough:[] };
  s.floors[0] = f; s.tokens = [];
  // a band of mud across the middle row from x=2 to x=6
  for (let x = 2; x <= 6; x++) f.rough.push(2 * W + x);
  const R = reach(0, 0, 2, 20, null);
  assert.equal(R.dist.get(2 * W + 2), 3);                         // one step, then the mud costs 2
  assert.equal(R.dist.get(2 * W + 8), 8);                         // around the mud (diagonals) beats wading through it (11)
  const path = pathTo(R.par, W, 2 * W + 8);
  assert.equal(pathCost(f, path), 8);
  assert.ok(!reach(0, 0, 2, 1, null).dist.has(2 * W + 1 + 1));   // 1 square of movement doesn't reach into mud two away
  // the swamp marks its banks as mud
  const sw = newState({ seed:'swamp', floors:1, template:'berez', party:false });
  assert.ok(sw.floors[0].rough.length > 10, 'Berez has mud');
});

test('furnished rooms: props inside rooms, never on doors, stairs or doorways, never overlapping, wall pieces against a wall', async () => {
  const { propSize } = await import('../src/data/props.js');
  for (const tpl of ['deathhouse', 'andral', 'castle', 'bonegrinder', 'labyrinth']){
    const s = newState({ seed:'furnish-' + tpl, floors:3, template:tpl, party:false }); setState(s);
    for (const f of s.floors){
      assert.ok(f.props.length > 5, `${tpl}: furnished`);
      assert.ok(f.rooms.every(r => r.read && r.read.length > 20), `${tpl}: every room has a read-aloud`);
      const used = new Set(), doors = new Set(f.doors.map(d => d.i)), stairs = [f.up, f.down].filter(Boolean).map(p => p.y * f.W + p.x);
      for (const p of f.props){
        const sz = propSize(p), room = f.rooms.find(r => p.x >= r.x && p.y >= r.y && p.x + sz.w <= r.x + r.w && p.y + sz.h <= r.y + r.h);
        assert.ok(room, `${tpl}: ${p.k} sits inside a room`);
        for (let y = p.y; y < p.y + sz.h; y++) for (let x = p.x; x < p.x + sz.w; x++){
          const i = y * f.W + x;
          assert.ok(!used.has(i), `${tpl}: ${p.k} overlaps another prop`); used.add(i);
          assert.ok(!doors.has(i) && !stairs.includes(i), `${tpl}: ${p.k} on a door or the stairs`);
          assert.equal(f.grid[i], T.ROOM);
        }
      }
    }
  }
  // the Narrow House has rooms with uses and names to match
  const h = newState({ seed:'furnish-house', floors:2, template:'deathhouse', party:false });
  assert.ok(h.floors.flatMap(f => f.rooms).some(r => r.use), 'house rooms get uses');
});
