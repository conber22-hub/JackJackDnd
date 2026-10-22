import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, setState, T } from '../src/engine/state.js';
import { updateVision, seenNow } from '../src/engine/grid.js';
import { redactForPlayers } from '../src/engine/redact.js';

// a serialized copy, as game/session.js serialize() makes it (without importing the DOM-bound module)
const ser = s => ({ ...s, floors:s.floors.map(f => ({ ...f, grid:f.grid.join(''), base:f.base ? f.base.join('') : null })),
  explored:Object.fromEntries(Object.entries(s.explored).map(([k, v]) => [k, [...v]])) });

test('players get no secrets: unexplored map, secret doors, unfound traps, unseen monsters, statblocks', () => {
  const s = newState({ seed:'redact', floors:3, template:'andral' }); setState(s);
  updateVision();
  const f = s.floors[0], pc = s.tokens.find(t => t.kind === 'pc');
  // a secret door and a hidden trap somewhere the party hasn't been, and one monster in sight, one far away
  const far = f.grid.findIndex((v, i) => v === T.ROOM && !s.explored[0].has(i) && ![...s.explored[0]].some(j => Math.abs((j % f.W) - (i % f.W)) <= 2 && Math.abs(((j / f.W) | 0) - ((i / f.W) | 0)) <= 2));
  assert.ok(far >= 0);
  f.doors.push({ id:900, i:far, state:'secret', dc:15 });
  f.traps.push({ id:901, i:far, kind:'pit', armed:true, found:false });
  const near = [...seenNow[0]].find(i => i !== pc.y * f.W + pc.x && f.grid[i] === T.ROOM);
  s.tokens.push({ id:'m1', kind:'monster', bid:'zombie', name:'Zombie', floor:0, x:near % f.W, y:(near / f.W) | 0, hp:22, maxHp:22, ac:8, attacks:[{ n:'Slam', b:3, d:'1d8+1' }], flags:{ seeded:true, alert:true }, conds:[], size:1, dead:false });
  s.tokens.push({ id:'m2', kind:'monster', bid:'zombie', name:'Zombie 2', floor:0, x:far % f.W, y:(far / f.W) | 0, hp:22, maxHp:22, ac:8, attacks:[], flags:{}, conds:[], size:1, dead:false });
  s.combat = { active:true, order:[pc.id, 'm1', 'm2'], idx:0, round:1, floor:0 };
  s.log.push({ t:1, m:'📢 secret', dm:true }, { t:2, m:'public' });
  s.content = { dread:{}, shift:'secret table', grasp:'whim table', bestiary:{ custom1:{ id:'custom1', name:'Secret thing' } } };
  const out = redactForPlayers(ser(s), { seen:seenNow, explored:s.explored });
  const g = out.floors[0].grid;
  assert.equal(g[far], '0', 'the far square is rock');
  assert.ok(!out.floors[0].doors.some(d => d.state === 'secret'));
  assert.ok(!out.floors[0].traps.some(t => !t.found));
  for (const i of s.explored[0]) assert.equal(g[i], String(f.grid[i]), 'explored squares are as they are');
  assert.ok(out.floors[0].rooms.every(r => r.type === 'chamber' && !r.notes));
  assert.equal(out.floors[2].name, 'Unexplored');
  const m1 = out.tokens.find(t => t.id === 'm1'), m2 = out.tokens.find(t => t.id === 'm2');
  assert.ok(m1 && !m1.unseen && m1.attacks.length === 0 && m1.ac === undefined && m1.maxHp === 1 && !m1.flags.seeded && !m1.flags.alert);
  assert.ok(m2.unseen && m2.flags.gone && m2.x < 0 && m2.name === 'something unseen');
  assert.ok(out.tokens.find(t => t.id === pc.id).attacks.length > 0, 'the party keeps its own numbers');
  assert.ok(out.log.some(e => e.m === 'public'));
  assert.ok(!out.log.some(e => e.dm));
  assert.equal(out.content.shift, null); assert.equal(out.content.grasp, null); assert.deepEqual(out.content.bestiary, {});
  assert.notEqual(out.meta.seed, s.meta.seed); assert.ok(!('campaign' in out) && !('characters' in out));
  // the DM's own state is untouched
  assert.ok(s.floors[0].doors.some(d => d.state === 'secret')); assert.equal(s.tokens.find(t => t.id === 'm1').attacks.length, 1);
});

test('furniture keeps its secrets: contents, unfound stashes and the shelf that hides a door', () => {
  const s = newState({ seed:'redact-props', floors:1, template:'andral' }); setState(s);
  updateVision();
  const f = s.floors[0], pc = s.tokens.find(t => t.kind === 'pc');
  const door = { id:950, i:(pc.y + 1) * f.W + pc.x, state:'secret', dc:15 }; f.doors.push(door);
  f.props = [
    { id:1, k:'chest', x:pc.x, y:pc.y, contents:'a cursed ring', stash:{ dc:14, text:'a false bottom', found:false } },
    { id:2, k:'bookshelf', x:pc.x, y:pc.y, hides:950, stash:{ dc:12, text:'a hollow book', found:true } },
  ];
  let out = redactForPlayers(ser(s), { seen:seenNow, explored:s.explored }).floors[0].props;
  assert.equal(out[0].contents, undefined); assert.equal(out[0].stash, undefined);
  assert.equal(out[1].hides, undefined, 'which shelf hides the secret door stays hidden');
  assert.equal(out[1].stash.text, 'a hollow book', 'a found stash is shared');
  door.state = 'closed';
  out = redactForPlayers(ser(s), { seen:seenNow, explored:s.explored }).floors[0].props;
  assert.equal(out[1].hides, 950, 'once the door is found, players can swing the shelf');
  assert.equal(f.props[0].contents, 'a cursed ring', 'the DM\'s copy is untouched');
});
