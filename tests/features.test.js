import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, setState, walk, T } from '../src/engine/state.js';
import { reachable } from '../src/engine/caves.js';
import { addFeatures, FEATURE_TEXT } from '../src/engine/features.js';
import { carve } from '../src/engine/generator.js';
import { mulberry32 } from '../src/util/core.js';
import { reach, vision } from '../src/engine/grid.js';
import { redactForPlayers } from '../src/engine/redact.js';

const joined = f => { const s = f.up ? f.up.y * f.W + f.up.x : f.rooms[0].cy * f.W + f.rooms[0].cx, seen = reachable(f, s); return f.grid.every((v, i) => !walk(v) || seen.has(i)); };

test('rooms get water, chasms, rock falls and pillars, and the floor still joins up', () => {
  const tally = {};
  for (let k = 0; k < 40; k++) for (const template of ['andral', 'castle', 'labyrinth']){
    const s = newState({ seed:`feat-${k}`, floors:4, template });
    s.floors.forEach((f, L) => {
      assert.ok(joined(f), `${template} ${k} floor ${L} joins up`);
      for (const r of f.rooms) if (r.feature){
        tally[r.feature] = (tally[r.feature] || 0) + 1;
        assert.ok(!r.stairsUp && !r.stairsDown && r.type !== 'entrance', 'never in a stair room');
        assert.ok(r.read.endsWith(FEATURE_TEXT[r.feature].read), 'the read-aloud says so');
        assert.ok(r.notes.includes(FEATURE_TEXT[r.feature].note), 'and the DM\'s notes');
      }
      for (const i of f.shallow || []){ assert.ok(walk(f.grid[i]), 'water to the knee can be walked in'); assert.ok(f.rough.includes(i), 'and it is difficult terrain'); }
      for (const i of f.chasm || []) assert.ok(!walk(f.grid[i]), 'a chasm is a drop');
      for (const i of f.span || []) assert.ok(walk(f.grid[i]), 'the bridge can be walked');
      if (f.chasm?.length) assert.ok(f.span.length, 'every chasm has a bridge');
      // no furniture in the water or on the bridge
      const wet = new Set([...(f.shallow || []), ...(f.span || [])]);
      for (const p of f.props || []) if (p.k !== 'rubble' && p.k !== 'pillar') assert.ok(!wet.has(p.y * f.W + p.x), `${p.k} is not in the water`);
    });
  }
  for (const k of ['flooded', 'chasm', 'collapsed', 'pillared']) assert.ok(tally[k] >= 3, `${k} turns up (${JSON.stringify(tally)})`);
});

test('a chasm splits a room you can only cross by its bridge, and you can see across it', () => {
  const W = 14, H = 10, grid = Array(W * H).fill(T.ROCK);
  const f = { level:0, W, H, theme:1, rooms:[{ id:0, x:2, y:2, w:9, h:6, cx:6, cy:5, type:'chamber', name:'Gallery', notes:'' }], edges:[], corridors:[], autoLink:false,
    up:null, down:null, grid, dug:[], filled:[], doors:[], traps:[], base:null, nextObj:1, rough:[], props:[] };
  carve(f);
  let made = null;
  for (let seed = 1; seed < 400 && !made; seed++){
    const g = JSON.parse(JSON.stringify(f));
    const out = addFeatures(g, 'silver', (() => { const r = mulberry32(seed); let first = true; return () => { if (first){ first = false; return .01; } return r(); }; })());
    if (out[0]?.[1] === 'chasm') made = g;
  }
  assert.ok(made, 'a chasm was made');
  setState({ floors:[made], tokens:[], explored:{ 0:new Set() }, meta:{ size:14 } });
  const [bx, by] = [made.span[0] % W, (made.span[0] / W) | 0];
  // the far side is reachable, but only through the bridge
  const near = made.grid.findIndex((v, i) => walk(v) && !made.span.includes(i));
  assert.ok(joined({ ...made, up:{ x:near % W, y:(near / W) | 0 } }));
  const cut = { ...made, grid:made.grid.slice() }; for (const i of made.span) cut.grid[i] = T.ROCK;
  assert.ok(!joined({ ...cut, up:{ x:near % W, y:(near / W) | 0 } }), 'without the bridge the room is in two');
  // sight crosses the drop
  const t = { id:'a', kind:'pc', floor:0, x:near % W, y:(near / W) | 0, size:1, conds:[] };
  const seen = vision(t), far = made.grid.findIndex((v, i) => walk(v) && Math.abs((i % W) - t.x) + Math.abs(((i / W) | 0) - t.y) > 4 && !made.span.includes(i));
  assert.ok(seen.size > 20 && seen.has(far) || seen.size > 30, 'you see across');
  void reach; void bx; void by;
});

test('players get the water, the chasm and the bridge they have seen', () => {
  const s = newState({ seed:'feat-6', floors:4, template:'andral' });
  const L = s.floors.findIndex(f => f.shallow?.length), f = s.floors[L];
  assert.ok(L >= 0, 'this seed has a flooded room');
  const out = redactForPlayers(s, { explored:{ [L]:f.shallow.slice(0, 3) } }), got = out.floors[L].shallow;
  for (const i of f.shallow.slice(0, 3)) assert.ok(got.includes(i), 'what they have seen');
  assert.ok(got.length <= 3 * 9, 'and nothing far beyond it');
});
