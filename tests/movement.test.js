import test from 'node:test';
import assert from 'node:assert/strict';
import { setState, T } from '../src/engine/state.js';
import { threatReach, provokers, checkPath, extendPath, trailTargets, formationTargets, planToward, closeIn, bestMelee, gap, claim } from '../src/engine/movement.js';

// A bare 12×12 room with a wall down x = 6 from y = 0 to 8 (a gap at the bottom), and whoever we put in it.
function arena(tokens, { combat = true, rough = [] } = {}){
  const W = 12, H = 12, grid = Array(W * H).fill(T.ROOM);
  for (let y = 0; y <= 8; y++) grid[y * W + 6] = T.ROCK;
  const f = { W, H, grid, doors:[], traps:[], rough, rooms:[] };
  const s = { floors:[f], tokens, combat:{ active:combat, order:tokens.map(t => t.id), idx:0, round:1, floor:0 } };
  setState(s); return s;
}
const tok = (id, kind, x, y, extra = {}) => ({ id, kind, name:id, floor:0, x, y, size:1, dead:false, flags:{}, conds:[], speed:30,
  attacks:kind === 'monster' ? [{ n:'Claw', b:4, d:'1d6' }] : [{ n:'Longsword', b:5, d:'1d8+3', m:1 }], ...extra });

test('reach: melee 1 square, a reach weapon 2, ranged-only none; best melee picked', () => {
  assert.equal(threatReach(tok('a', 'monster', 0, 0)), 1);
  assert.equal(threatReach(tok('a', 'pc', 0, 0, { attacks:[{ n:'Glaive', b:5, d:'1d10', m:1 }] })), 2);
  assert.equal(threatReach(tok('a', 'monster', 0, 0, { attacks:[{ n:'Shortbow', b:4, d:'1d6' }] })), 0);
  assert.equal(threatReach(tok('a', 'pc', 0, 0, { attacks:[{ n:'Fire Bolt', b:5, d:'1d10', l:0, sn:'Fire Bolt' }] })), 0);
  assert.equal(bestMelee(tok('a', 'monster', 0, 0, { attacks:[{ n:'Bite', b:3, d:'1d4' }, { n:'Shortbow', b:9, d:'1d6' }, { n:'Claw', b:5, d:'1d6' }] })), 2);
  assert.equal(gap(0, 0, 2, 2, 0, 1), 1, 'a Large creature touching on its right edge');
});

test('opportunity attacks: leaving reach provokes, staying in it or disengaging does not', () => {
  const hero = tok('h', 'pc', 2, 2), z = tok('z', 'monster', 3, 2), ally = tok('a', 'npc', 2, 3);
  arena([hero, z, ally]);
  // walking west, away from the zombie: provokes, and the pause is at the start square (still in reach)
  let pv = provokers(hero, [{ x:1, y:2 }, { x:0, y:2 }]);
  assert.deepEqual(pv, [{ by:'z', at:-1 }]);
  // circling round it, always adjacent: nothing
  assert.deepEqual(provokers(hero, [{ x:2, y:1 }, { x:3, y:1 }]), []);
  // one step along then away: pause after the first step
  assert.deepEqual(provokers(hero, [{ x:2, y:1 }, { x:2, y:0 }]), [{ by:'z', at:0 }]);
  hero.disengaged = true; assert.deepEqual(provokers(hero, [{ x:1, y:2 }]), []); hero.disengaged = false;
  z.reacted = true; assert.deepEqual(provokers(hero, [{ x:1, y:2 }]), [], 'no reaction left'); z.reacted = false;
  z.conds = [{ n:'stunned', r:1 }]; assert.deepEqual(provokers(hero, [{ x:1, y:2 }]), [], 'stunned'); z.conds = [];
  assert.deepEqual(provokers(hero, [{ x:1, y:2 }], { skip:['z'] }), [], 'already passed on this move');
  // allies never provoke; outside a fight nothing does
  assert.deepEqual(provokers(z, [{ x:4, y:2 }, { x:5, y:2 }]).map(p => p.by).sort(), ['a', 'h'], 'both heroes it was next to');
  arena([hero, z, ally], { combat:false });
  assert.deepEqual(provokers(hero, [{ x:1, y:2 }]), []);
});

test('a dragged route: legal steps only, no walking through foes or walls, within the move', () => {
  const hero = tok('h', 'pc', 2, 2), z = tok('z', 'monster', 4, 2);
  arena([hero, z], { rough:[3 * 12 + 2] });
  assert.equal(checkPath(hero, [{ x:3, y:2 }], 6), 1);
  assert.equal(checkPath(hero, [{ x:3, y:2 }, { x:4, y:2 }, { x:5, y:2 }], 6), -1, 'through the zombie');
  assert.equal(checkPath(hero, [{ x:4, y:2 }], 6), -1, 'a jump, not a step');
  assert.equal(checkPath(hero, [{ x:3, y:3 }, { x:4, y:3 }, { x:5, y:3 }, { x:6, y:3 }], 6), -1, 'into the wall');
  assert.equal(checkPath(hero, [{ x:2, y:3 }], 6), 2, 'rough ground costs double');
  assert.equal(checkPath(hero, [{ x:2, y:3 }, { x:2, y:4 }], 2), -1, 'more than the move left');
  assert.equal(checkPath(hero, [{ x:3, y:2 }, { x:3, y:2 }], 6), -1, 'standing still is not a step');
  // tracing: forward, back over itself (cut), and bridging a jump
  let p = extendPath(hero, [], 3, 2, 6); assert.deepEqual(p, [{ x:3, y:2 }]);
  p = extendPath(hero, p, 3, 1, 6); assert.equal(p.length, 2);
  p = extendPath(hero, p, 3, 2, 6); assert.deepEqual(p, [{ x:3, y:2 }], 'back over the route cuts it');
  p = extendPath(hero, p, 3, 5, 6); assert.deepEqual(p.at(-1), { x:3, y:5 }); assert.equal(p.length, 4);
  assert.deepEqual(extendPath(hero, p, 2, 2, 6), [], 'back to the start: no route');
  p = extendPath(hero, [], 11, 11, 3); assert.deepEqual(p, [], 'too far to bridge');
});

test('the party trails its leader single file, and a group keeps its formation', () => {
  const lead = tok('l', 'pc', 2, 5), b = tok('b', 'pc', 1, 5), c = tok('c', 'pc', 0, 5);
  arena([lead, b, c], { combat:false });
  const path = [{ x:3, y:5 }, { x:4, y:5 }, { x:5, y:5 }];
  assert.deepEqual(trailTargets(lead, path, [b, c]), [{ id:'b', x:4, y:5 }, { id:'c', x:3, y:5 }]);
  // a one-square move: the line closes up behind
  assert.deepEqual(trailTargets(lead, [{ x:3, y:5 }], [b, c]), [{ id:'b', x:2, y:5 }, { id:'c', x:1, y:5 }]);
  assert.deepEqual(formationTargets(lead, { x:4, y:8 }, [b, c]), [{ id:'b', x:3, y:8 }, { id:'c', x:2, y:8 }]);
  // planning toward a target behind a wall goes round it; a claimed square is left for someone else
  const f = { W:12 };
  const way = planToward(b, 8, 2, 40, new Set());
  assert.deepEqual(way.at(-1), { x:8, y:2 });
  assert.ok(way.some(p => p.y >= 9), 'round the bottom of the wall');
  const taken = new Set(); claim(taken, f, 8, 2);
  assert.notDeepEqual(planToward(b, 8, 2, 40, taken).at(-1), { x:8, y:2 });
});

test('Close in: a monster walks to the nearest hero and stops within reach', () => {
  const z = tok('z', 'monster', 9, 10), far = tok('h1', 'pc', 0, 0), near = tok('h2', 'pc', 9, 4);
  arena([z, far, near]);
  const r = closeIn(z, 6);
  assert.equal(r.target.id, 'h2');
  const e = r.path.at(-1); assert.equal(gap(e.x, e.y, 1, 9, 4, 1), 1, 'ends next to the hero');
  // not far enough: as close as it gets
  const r2 = closeIn(z, 2); assert.equal(r2.path.at(-1).y, 8);
  // already there: no move
  const adj = tok('z2', 'monster', 9, 5); arena([adj, near]);
  assert.deepEqual(closeIn(adj, 6).path, []);
});

test('furniture: minis go round tall props, climb onto low ones (difficult terrain) and stand on top', async () => {
  const { reach, pathCost, standHeight, passMove, propTerrain } = await import('../src/engine/grid.js');
  const hero = tok('h', 'pc', 0, 10);
  const s = arena([hero], { combat:false });
  const f = s.floors[0];
  f.props = [{ id:1, k:'shelf', x:2, y:10, rot:0 }, { id:2, k:'table', x:1, y:11 }];
  assert.equal(passMove(f, 10 * f.W + 2), false, 'a shelf blocks');
  assert.equal(passMove(f, 11 * f.W + 1), true, 'a table does not');
  assert.equal(pathCost(f, [{ x:1, y:11 }]), 2, 'climbing onto the table costs double');
  assert.ok(standHeight(f, 1, 11) > .4 && standHeight(f, 0, 10) === 0, 'stands on the tabletop, the floor is 0');
  const r = reach(0, 0, 10, 6, 'h');
  assert.ok(!r.dist.has(10 * f.W + 2), 'no square inside the shelf');
  assert.ok(r.dist.has(10 * f.W + 3), 'but walks round it');
  // turning a prop is seen (the cache is keyed on propsV)
  f.props[0].rot = 1; f.propsV = 1;
  assert.ok(propTerrain(f).block.has(10 * f.W + 3) && !propTerrain(f).block.has(11 * f.W + 2));
});

test('the room dresser never lets a tall piece cut a room in two', async () => {
  const { furnishRoom } = await import('../src/engine/dressing.js');
  const { canStep, propTerrain } = await import('../src/engine/grid.js');
  // narrow rooms (2 and 3 wide): a beam or a pillar across the middle would seal one end off
  for (const theme of ['silver', 'ossuary', 'chapel', 'manor', 'cellar', 'woods']) for (const rw of [2, 3]) for (let seed = 1; seed <= 25; seed++){
    const W = 9, H = 9, grid = Array(W * H).fill(T.ROCK);
    for (let y = 1; y < 8; y++) for (let x = 1; x < 1 + rw; x++) grid[y * W + x] = T.ROOM;
    const f = { W, H, grid, doors:[], traps:[], rough:[], props:[], nextObj:1, rooms:[{ x:1, y:1, w:rw, h:7, type:'chamber' }] };
    setState({ floors:[f], tokens:[] });
    let n = seed; const rng = () => (n = (n * 16807) % 2147483647) / 2147483647;
    furnishRoom(f, f.rooms[0], theme, rng);
    const block = propTerrain(f).block, open = []; for (let i = 0; i < W * H; i++) if (grid[i] === T.ROOM && !block.has(i)) open.push(i);
    const seen = new Set([open[0]]), q = [open[0]];
    while (q.length){ const i = q.pop(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){ const x = i % W, y = (i / W) | 0; if (!canStep(f, x, y, dx, dy)) continue; const j = (y + dy) * W + x + dx; if (!seen.has(j)){ seen.add(j); q.push(j); } } }
    const blocked = new Set(); for (const i of open) if (!seen.has(i)) blocked.add(i);
    assert.equal(blocked.size, 0, `${theme} ${rw} wide, seed ${seed}: ${[...blocked]}`);
  }
});
