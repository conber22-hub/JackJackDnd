import test from 'node:test';
import assert from 'node:assert/strict';
import { planDressing, DRESS_SIZE } from '../src/engine/terrain-dress.js';
import { newState } from '../src/engine/state.js';
import { T, walk } from '../src/engine/tiles.js';

// A clearing in the woods (open ground in the middle, woods all round), with what each test puts beside it.
function clearing({ water = false, graves = false, rise = false } = {}){
  const W = 30, H = 24, grid = Array(W * H).fill(T.ROCK);
  for (let y = 6; y < 18; y++) for (let x = 6; x < 24; x++) grid[y * W + x] = T.ROOM;
  const f = { W, H, grid, rooms:[{ x:6, y:6, w:18, h:12, outdoor:true }], props:[], buildings:[], up:{ x:7, y:12 }, down:{ x:22, y:12 } };
  if (water) f.water = [15, 16, 17].flatMap(x => [6, 7].map(y => y * W + x));   // (a pond at the clearing's edge, by the trees)
  if (graves) f.props = [{ k:'gravestone', x:12, y:7 }, { k:'gravestone', x:14, y:7 }];
  if (rise){ f.height = Array(W * H).fill(0); for (let y = 6; y < 10; y++) for (let x = 6; x < 24; x++) f.height[y * W + x] = 1; }
  return f;
}
// only on woods squares; the marsh's own may stand in open water, but never on the bank
const ok = (f, plan) => plan.every(d => d.cells.every(i => { if (walk(f.grid[i])) return false; if (!(f.water || []).includes(i)) return true;
  if (d.kind !== 'wet' || !/^tser_/.test(d.id)) return false; const x = i % f.W, y = (i / f.W) | 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (walk(f.grid[(y + dy) * f.W + x + dx])) return false; return true; }));

test('the treeline is dressed by what lies beside it, never on open ground or water', () => {
  for (const [opts, expect] of [[{ water:true }, /tser_/], [{ graves:true }, /forgotten_graves|sentry_stones|vallaki_arch|gallows/], [{ rise:true }, /balinok_/]]){
    const f = clearing(opts), plan = planDressing(f, { seed:'t' });
    assert.ok(plan.length > 0, JSON.stringify(opts));
    assert.ok(ok(f, plan), 'only on woods squares');
    assert.ok(plan.some(d => expect.test(d.id)), `${JSON.stringify(opts)} → ${plan.map(d => d.id)}`);
    for (const d of plan){ const [w, h] = DRESS_SIZE[d.id]; assert.deepEqual(d.size, d.rot % 2 ? [h, w] : [w, h]); assert.equal(d.cells.length, w * h); }
  }
});

test('nothing near the way in or out, the same plan every time, and drifts only where snow lies', () => {
  const f = clearing({ water:true }), a = planDressing(f, { seed:'s' }), b = planDressing(f, { seed:'s' });
  assert.deepEqual(a, b);
  for (const d of a) for (const i of d.cells){ const x = i % f.W, y = (i / f.W) | 0;
    for (const e of [f.up, f.down]) assert.ok(Math.max(Math.abs(x - e.x), Math.abs(y - e.y)) > 3); }
  assert.ok(!planDressing(clearing(), { seed:'s' }).some(d => d.id === 'balinok_windblown_snow'));
  assert.ok(planDressing(clearing(), { seed:'s', snow:true }).some(d => d.id === 'balinok_windblown_snow'));
});

test('on the real outdoor maps: off the open ground, buildings and clearings, reeds in the marsh, quickly', () => {
  for (const tpl of ['barovia', 'saltroad', 'berez', 'yester', 'krezk']){
    const s = newState({ seed:'dress', floors:3, template:tpl, size:40 }), f = s.floors[0];
    const t0 = performance.now(), plan = planDressing(f, { seed:`dress|${tpl}` });
    assert.ok(performance.now() - t0 < 200, `${tpl} took too long`);
    assert.ok(ok(f, plan), tpl);
    const clear = new Set(f.clear || []), houses = new Set();
    for (const b of f.buildings || []) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) houses.add(y * f.W + x);
    for (const d of plan) for (const i of d.cells) assert.ok(!clear.has(i) && !houses.has(i), `${tpl}: ${d.id} on a clearing or a house`);
    assert.ok(plan.length <= 14);
    assert.ok(plan.filter(d => d.kind === 'road').length <= 2, `${tpl}: a roadside piece at every bend`);
    if (tpl === 'berez') assert.ok(plan.some(d => /^tser_/.test(d.id)), 'the marsh at Berez has its reeds');
  }
});
