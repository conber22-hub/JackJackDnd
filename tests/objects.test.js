import test from 'node:test';
import assert from 'node:assert/strict';
import { setState, T, newState } from '../src/engine/state.js';
import { objAC, objHp, objMaxHp, besideProp, pushDir, pushTarget, toppleTarget, lieDown, movedTo, damageObject, objectActs } from '../src/engine/objects.js';
import { passMove, propTerrain, standHeight } from '../src/engine/grid.js';
import { propSize } from '../src/data/props.js';

// A bare 10×10 room with walls round the edge.
function room(props = []){
  const W = 10, H = 10, grid = Array(W * H).fill(T.ROOM);
  for (let i = 0; i < W; i++){ grid[i] = T.ROCK; grid[(H - 1) * W + i] = T.ROCK; grid[i * W] = T.ROCK; grid[i * W + W - 1] = T.ROCK; }
  const f = { W, H, grid, doors:[], traps:[], rough:[], rooms:[], props:props.map((p, i) => ({ id:i + 1, rot:0, ...p })) };
  setState({ floors:[f], tokens:[] }); return f;
}
const hero = (x, y) => ({ id:'h', x, y, size:1, flags:{}, conds:[] });

test('objects: armour class by material, hit points by size (SRD)', () => {
  const f = room([{ k:'chest', x:3, y:3 }, { k:'statue', x:5, y:5 }, { k:'chair', x:2, y:2 }]);
  const [chest, statue, chair] = f.props;
  assert.equal(objAC(chest), 15); assert.equal(objMaxHp(chest), 10);
  assert.equal(objAC(statue), 17); assert.equal(objMaxHp(statue), 27);
  assert.equal(objMaxHp(chair), 3, 'a chair is fragile');
  assert.equal(damageObject(f, chest, 4), false); assert.equal(objHp(chest), 6);
  assert.equal(damageObject(f, chest, 6), true); assert.ok(chest.broken);
  assert.ok(!propTerrain(f).block.has(3 * f.W + 3) && propTerrain(f).rough.has(3 * f.W + 3), 'debris is rough ground');
});

test('pushing: straight away from the hero, never into a wall, a person or another piece', () => {
  const f = room([{ k:'crate', x:4, y:4 }, { k:'barrel', x:6, y:4 }]);
  const crate = f.props[0];
  assert.ok(besideProp(hero(3, 4), crate)); assert.ok(!besideProp(hero(2, 4), crate));
  assert.deepEqual(pushDir(hero(3, 4), crate), { dx:1, dy:0 });
  assert.equal(pushDir(hero(3, 3), crate), null, 'not from a corner');
  assert.deepEqual(pushTarget(f, crate, 1, 0), { x:5, y:4 });
  movedTo(f, crate, { x:5, y:4 });
  assert.match(pushTarget(f, crate, 1, 0).why, /barrel/);
  assert.match(pushTarget(f, crate, 0, 1, [{ x:5, y:5, size:1, flags:{} }]).why, /someone/);
  crate.y = 1; f.propsV = 9;
  assert.match(pushTarget(f, crate, 0, -1).why, /wall/);
});

test('toppling a bookshelf: it falls across two squares, then lies there low enough to climb', () => {
  const f = room([{ k:'bookshelf', x:1, y:3, rot:0 }]);   // against the west wall, 1 × 2
  const shelf = f.props[0], t = hero(1, 2);
  assert.ok(passMove(f, 3 * f.W + 2) && !passMove(f, 3 * f.W + 1), 'it blocks where it stands');
  const at = toppleTarget(f, shelf, 1, 0);
  assert.deepEqual({ x:at.x, y:at.y, w:at.w, h:at.h }, { x:1, y:3, w:3, h:2 });
  assert.equal(at.hit.length, 4);
  lieDown(f, shelf, 1, 0, at);
  assert.deepEqual(propSize(shelf), { w:3, h:2 });
  assert.ok(passMove(f, 3 * f.W + 1) && propTerrain(f).rough.has(3 * f.W + 2) && standHeight(f, 2, 3) > 0, 'climbable, difficult');
  assert.ok(!objectActs(f, shelf, t).some(a => a.act === 'topple'), 'it cannot fall twice');
  // a wall stops a fall short; no room at all, no fall
  const g = room([{ k:'statue', x:7, y:4 }]);
  assert.equal(toppleTarget(g, g.props[0], 1, 0).len, 1);
  const h = room([{ k:'statue', x:8, y:4 }]);
  assert.match(toppleTarget(h, h.props[0], 1, 0).why, /no room/);
  assert.match(toppleTarget(h, room([{ k:'crate', x:4, y:4 }]).props[0], 1, 0).why, /tall/);
});

test('what a hero can do: open, pick a lock, push, smash; swing a shelf only once its door is found', () => {
  const f = room([{ k:'chest', x:4, y:4, lock:14 }, { k:'bookshelf', x:1, y:3, hides:7 }]);
  const [chest, shelf] = f.props, t = hero(3, 4), acts = a => a.map(x => x.act);
  assert.deepEqual(acts(objectActs(f, chest, hero(1, 1))), [''], 'too far');
  assert.deepEqual(acts(objectActs(f, chest, t)), ['pick', 'force', 'push', 'smash']);
  delete chest.lock; assert.deepEqual(acts(objectActs(f, chest, t)).slice(0, 1), ['open']);
  chest.open = true; assert.equal(objectActs(f, chest, t)[0].act, 'close');
  assert.ok(!acts(objectActs(f, shelf, hero(2, 3), { door:{ state:'secret' } })).includes('swing'));
  assert.ok(acts(objectActs(f, shelf, hero(2, 3), { door:{ state:'closed' } })).includes('swing'));
  shelf.swung = true; f.propsV = 3;
  assert.ok(passMove(f, 3 * f.W + 1), 'swung aside, it no longer blocks');
});

test('the dresser hides secrets: locks, stashes, shelves in front of secret doors — and never walls anything off', () => {
  let hides = 0, locks = 0, stashes = 0;
  for (const template of ['andral', 'castle', 'outbreak', 'ravenloft']) for (const seed of ['a', 'b']){
    const s = newState({ seed:'obj-' + seed, template, floors:3 });
    for (const f of s.floors) for (const p of f.props || []){
      if (p.lock) locks++; if (p.stash) stashes++;
      if (p.hides){ hides++; const d = f.doors.find(d => d.id === p.hides); assert.ok(d, 'it hides a real door');
        const s2 = propSize(p); let touch = false;
        for (let y = p.y; y < p.y + s2.h; y++) for (let x = p.x; x < p.x + s2.w; x++) if (Math.abs(d.i % f.W - x) + Math.abs(((d.i / f.W) | 0) - y) === 1) touch = true;
        assert.ok(touch, 'it stands right in front of the door'); }
    }
  }
  assert.ok(hides > 0 && locks > 0 && stashes > 0, `${hides} ${locks} ${stashes}`);
});
