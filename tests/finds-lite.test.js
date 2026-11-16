import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeFinds, noticed, outcome, pageById } from '../src/engine/finds-lite.js';
import { READ, PAGES, TRINKETS } from '../src/data/finds-lite.js';

const floor = () => {
  const W = 30, H = 30, open = [], path = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++){ open.push([x, y]); if (y === 15) path.push([x, y]); }
  return { W, H, kind:'village', open, path, rooms:[{ x:1, y:1, w:5, h:5 }],
    props:[{ kind:'gravestone', x:10, y:10 }, { kind:'gravestone', x:11, y:10 }, { kind:'barrel', x:20, y:20 }, { kind:'crate', x:21, y:20 }, { kind:'well', x:5, y:20 }, { kind:'house', x:24, y:5 }] };
};

test('the same floor and seed give the same finds; another seed other glints', () => {
  const a = placeFinds(floor(), { seed:'x' }), b = placeFinds(floor(), { seed:'x' }), c = placeFinds(floor(), { seed:'y' });
  assert.deepEqual(a, b);
  const g = l => l.filter(f => f.kind === 'glint').map(f => `${f.x},${f.y}`).join(';');
  assert.notEqual(g(a), g(c));
});

test('things to read sit on their props, glints on open ground off the road, apart, not where they come in', () => {
  const f = floor(), list = placeFinds(f, { seed:'z' });
  const reads = list.filter(o => o.kind === 'read');
  assert.ok(reads.filter(o => o.on === 'gravestone').length === 2);
  for (const r of reads) assert.ok(r.text && f.props.some(p => p.x === r.x && p.y === r.y));
  assert.notEqual(reads[0].text, reads[1].text);   // (no repeats on one map while there are others to say)
  const glints = list.filter(o => o.kind === 'glint');
  assert.ok(glints.length >= 3);
  for (const g of glints){
    assert.notEqual(g.y, 15, 'off the road');
    assert.ok(!(g.x < 6 && g.y < 6), 'not where they come in');
    assert.ok(!f.props.some(p => p.x === g.x && p.y === g.y));
  }
  for (const a of glints) for (const b of glints) if (a !== b) assert.ok(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) >= 4);
});

test('taken finds stay taken, and nothing else moves', () => {
  const all = placeFinds(floor(), { seed:'t' }), gone = all[0].id, rest = placeFinds(floor(), { seed:'t', taken:[gone] });
  assert.deepEqual(rest, all.filter(f => f.id !== gone));
});

test('a hidden glint is seen only close up, by a sharp eye', () => {
  const g = { kind:'glint', hidden:true, dc:13 };
  assert.equal(noticed(g, { passive:20, dist:3 }), false);
  assert.equal(noticed(g, { passive:10, dist:1 }), false);
  assert.equal(noticed(g, { passive:13, dist:1 }), true);
  assert.equal(noticed({ kind:'glint', hidden:false, dc:0 }, { passive:8, dist:6 }), true);
  assert.equal(noticed({ kind:'glint', hidden:false, dc:0 }, { passive:8, dist:7 }), false);
});

test('what a find gives is fixed, in whole coins, and its pages and keepsakes are real', () => {
  for (const seed of ['a', 'b', 'c', 'd']) for (const f of placeFinds(floor(), { seed })){
    if (f.kind === 'read') continue;
    const o = outcome(f);
    assert.deepEqual(o, outcome(f));
    assert.ok(Number.isInteger(o.gp) && o.gp >= 0 && o.gp <= 25);
    assert.ok(o.say);
    if (o.page) assert.ok(pageById(o.page));
    if (o.trinket) assert.ok(TRINKETS.some(t => t.n === o.trinket));
  }
});

test('the first set has enough to say, and says nothing twice', () => {
  for (const [k, list] of Object.entries(READ)){ assert.ok(list.length >= 4, k); assert.equal(new Set(list).size, list.length, k); }
  assert.equal(new Set(PAGES.map(p => p.id)).size, PAGES.length);
});
