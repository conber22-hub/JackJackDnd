import test from 'node:test';
import assert from 'node:assert/strict';
import { setState, T } from '../src/engine/state.js';
import { attackProfile, rangeCheck, coverOf, areaOf, areaSquares, caughtIn, coverFromOrigin } from '../src/engine/targeting.js';
import { heroAttacks, castables, addRanges } from '../src/engine/hero.js';
import { SPELLS } from '../src/data/srd.js';

// A 16×12 room; a wall of rock down x = 8 from y = 2 to 6, and whoever we put in it.
function arena(tokens, walls = []){
  const W = 16, H = 12, grid = Array(W * H).fill(T.ROOM);
  for (let y = 2; y <= 6; y++) grid[y * W + 8] = T.ROCK;
  for (const [x, y] of walls) grid[y * W + x] = T.ROCK;
  setState({ floors:[{ W, H, grid, doors:[], traps:[], rough:[], rooms:[] }], tokens, combat:{ active:true, order:[], idx:0, round:1, floor:0 } });
}
const tok = (id, kind, x, y, extra = {}) => ({ id, kind, name:id, floor:0, x, y, size:1, dead:false, flags:{}, conds:[], attacks:[], ...extra });
const sqs = (set, W = 16) => [...set].map(i => [i % W, (i / W) | 0]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);

test('attack ranges: melee reach, a bow\'s normal and long range, a range in the name, spell ranges', () => {
  assert.deepEqual(attackProfile({ n:'Longsword', m:1 }), { melee:1, near:0, far:0 });
  assert.deepEqual(attackProfile({ n:'Glaive', m:1, reach:2 }), { melee:2, near:0, far:0 });
  assert.deepEqual(attackProfile({ n:'Dagger', m:1, rng:[20, 60] }), { melee:1, near:4, far:12 });
  assert.deepEqual(attackProfile({ n:'Shortbow', rng:[80, 320] }), { melee:0, near:16, far:64 });
  assert.deepEqual(attackProfile({ n:'Hallowed Ray (120 ft.)', b:12 }), { melee:0, near:24, far:24 });
  assert.deepEqual(attackProfile({ n:'Claw', b:4 }), { melee:1, near:0, far:0 });
  assert.deepEqual(attackProfile({ n:'Shocking Grasp', rng:[5] }), { melee:1, near:0, far:0 });
  // a hero's sheet: weapons and spell attacks carry their ranges; castables their range and area
  const h = { cls:'Wizard', lvl:5, sp:'Human', bg:'Sage', ab:{ Str:8, Dex:14, Con:14, Int:16, Wis:12, Cha:10 }, weapons:['Dagger', 'Light Crossbow'], spells:['Fire Bolt', 'Fireball', 'Burning Hands'] };
  const at = heroAttacks(h);
  assert.deepEqual(at.find(a => a.n === 'Dagger').rng, [20, 60]);
  assert.deepEqual(at.find(a => a.n === 'Light Crossbow').rng, [80, 320]);
  assert.deepEqual(at.find(a => a.n === 'Fire Bolt').rng, [120]);
  const fb = castables(h).find(c => c.n === 'Fireball');
  assert.equal(fb.r, 150); assert.deepEqual(fb.area, ['sphere', 20]);
  assert.ok(SPELLS.every(s => typeof s.r === 'number'));
  // an old save's hero gets them by name
  const old = { kind:'pc', attacks:[{ n:'Halberd', b:5, d:'1d10' }, { n:'Shortbow', b:5, d:'1d6' }, { n:'Bonk', b:1, d:'1' }], casts:[{ n:'Thunderwave', k:'save' }] };
  addRanges(old);
  assert.equal(old.attacks[0].reach, 2); assert.deepEqual(old.attacks[1].rng, [80, 320]); assert.equal(old.attacks[2].rng, undefined);
  assert.deepEqual(old.casts[0].area, ['cube', 15]); assert.equal(old.casts[0].r, 0);
});

test('range checks: reach, long range, out of range, an enemy next to an archer', () => {
  const a = tok('a', 'pc', 1, 9), z = tok('z', 'monster', 2, 9), far = tok('f', 'monster', 13, 9);
  arena([a, z, far]);
  assert.equal(rangeCheck(a, z, { n:'Longsword', m:1 }).ok, true);
  assert.equal(rangeCheck(a, far, { n:'Longsword', m:1 }).ok, false);
  assert.match(rangeCheck(a, far, { n:'Longsword', m:1 }).why, /out of reach \(5 ft\.; it's 60 ft\. away\)/);
  const bow = rangeCheck(a, far, { n:'Shortbow', rng:[80, 320] });
  assert.deepEqual([bow.ok, bow.kind, bow.long, bow.close], [true, 'ranged', false, true], 'a zombie next to the archer');
  const dart = rangeCheck(a, far, { n:'Dart', rng:[20, 60] });
  assert.deepEqual([dart.ok, dart.long], [true, true]);
  assert.equal(rangeCheck(a, far, { n:'Sling', rng:[30, 50] }).ok, false);
});

test('cover: walls give half, three-quarters or total; creatures half; clear lines none', () => {
  const a = tok('a', 'pc', 6, 4), t = tok('t', 'monster', 10, 4);
  arena([a, t]);
  assert.equal(coverOf(a, t).cover, 'total', 'straight through the wall');
  a.x = 6; a.y = 8; t.x = 10; t.y = 8;
  assert.equal(coverOf(a, t).cover, 'none', 'below the wall: clear');
  a.x = 6; a.y = 7; t.x = 10; t.y = 6;
  assert.ok(['half', 'three'].includes(coverOf(a, t).cover), 'peeking past the end of the wall');
  // a creature between: half
  a.x = 1; a.y = 10; t.x = 5; t.y = 10;
  const mid = tok('m', 'pc', 3, 10); arena([a, t, mid]);
  assert.equal(coverOf(a, t).cover, 'half');
  assert.equal(coverOf(a, t, { creatures:false }).cover, 'none');
  // standing right beside the target: nothing in between
  a.x = 4; arena([a, t]); assert.equal(coverOf(a, t).cover, 'none');
});

test('areas: a Fireball sphere, stopped by walls; who it catches, the caster too', () => {
  const c = tok('c', 'pc', 2, 9), z1 = tok('z1', 'monster', 10, 4), z2 = tok('z2', 'monster', 11, 5), ally = tok('al', 'pc', 9, 9);
  arena([c, z1, z2, ally]);
  const fb = areaOf(SPELLS.find(s => s.n === 'Fireball'));
  assert.deepEqual(fb, { shape:'sphere', size:4, range:30 });
  const r = areaSquares(c, fb, { x:10, y:7 });
  assert.equal(r.ok, true);
  assert.ok(r.squares.has(4 * 16 + 10) && r.squares.has(9 * 16 + 10));
  assert.ok(!r.squares.has(5 * 16 + 7), 'behind the wall from the blast');
  assert.ok(!r.squares.has(5 * 16 + 8), 'the wall itself');
  assert.ok(r.squares.has(8 * 16 + 7), 'round the end of the wall, in plain line');
  assert.deepEqual(caughtIn(c, fb, r.squares).map(t => t.id).sort(), ['al', 'z1', 'z2']);
  // out of range, out of sight
  arena([tok('c', 'pc', 0, 0), z1]);
  const far = areaSquares(tok('c', 'pc', 0, 0), { shape:'sphere', size:1, range:2 }, { x:10, y:4 });
  assert.equal(far.ok, false); assert.match(far.why, /out of range/);
  const hid = areaSquares(tok('c', 'pc', 6, 4), { shape:'sphere', size:1, range:30 }, { x:10, y:4 });
  assert.equal(hid.ok, false); assert.match(hid.why, /out of sight/);
});

test('areas from the caster: a cone widens, a line runs straight, a cube sits in front, an aura spares friends', () => {
  const c = tok('c', 'pc', 2, 9), friend = tok('fr', 'pc', 3, 10), foe = tok('fo', 'monster', 1, 8);
  arena([c, friend, foe]);
  // Burning Hands, 15-ft. cone pointing east: 1, then 3, then 3 squares
  const cone = areaSquares(c, { shape:'cone', size:3, range:0 }, { x:9, y:9 });
  assert.deepEqual(sqs(cone.squares), [[4, 8], [5, 8], [3, 9], [4, 9], [5, 9], [4, 10], [5, 10]]);
  // Lightning Bolt east: a single row, all the way
  const line = areaSquares(c, { shape:'line', size:20, range:0 }, { x:9, y:9 });
  assert.equal(line.squares.size, 13); assert.ok([...line.squares].every(i => ((i / 16) | 0) === 9));
  // Thunderwave north: the 3×3 cube right above the caster
  const cube = areaSquares(c, { shape:'cube', size:3, range:0 }, { x:2, y:2 });
  assert.deepEqual(sqs(cube.squares), [[1, 6], [2, 6], [3, 6], [1, 7], [2, 7], [3, 7], [1, 8], [2, 8], [3, 8]]);
  // Spirit Guardians: the foe, not the friend, not the caster
  const aura = { shape:'aura', size:3, range:0 }, ar = areaSquares(c, aura, c);
  assert.deepEqual(caughtIn(c, aura, ar.squares).map(t => t.id), ['fo']);
  // a creature's Dex save from the blast's origin: behind the end of a wall it has cover
  const o = coverFromOrigin(0, { x:6.5, y:7.5 }, tok('t', 'monster', 10, 6));
  assert.ok(['half', 'three'].includes(o.cover));
});
