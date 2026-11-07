import test from 'node:test';
import assert from 'node:assert/strict';
import { REFUGES } from '../src/data/hidden-refuges.js';
import { THEMES } from '../src/data/themes.js';
import { layoutFloor } from '../src/engine/generator.js';
import { ORTHO, passMove } from '../src/engine/grid.js';
import {
  newRefugeBook, seedRefuge, learnRefugeClue, searchRefuge, refugesForPlayers, enterRefuge, leaveRefuge,
} from '../src/engine/hidden-refuges.js';

const source = (prop = 'deadtree', level = 2) => layoutFloor(level, 18, 18, {
  theme: 'woods', layout: {
    rooms: [[2, 2, 10, 10, 'chamber', 'The way in'], [14, 14, 2, 2, 'chamber', 'Across the drop']],
    up: [3, 3], down: [4, 3], events: [{ x: 5, y: 3, label: 'Old sign' }],
    props: prop ? [[prop, 5, 5], ['deadtree', 15, 15]] : [],
    traps: [[6, 3, 'pit']], water: [[12, 12]], shallow: [[6, 4]],
  },
}, null);

const mapId = 'svalich-road:7';
const startBook = seed => newRefugeBook(seed ?? 'barovia-refuge-tests');
const make = (kind = 'road', seed) => seedRefuge(startBook(seed), source(kind === 'roots' ? 'deadtree' : REFUGES[kind].props[0]),
  { mapId, kind, chance: 1 });
const where = ({ book, id }) => {
  const { position, level } = book.sites.find(site => site.id === id);
  return { id, mapId, level, position };
};

function reach(floor) {
  const at = floor.up.y * floor.W + floor.up.x, seen = new Set([at]), todo = [at];
  for (let i = 0; i < todo.length; i++) {
    const x = todo[i] % floor.W, y = Math.floor(todo[i] / floor.W);
    for (const [dx, dy] of ORTHO) {
      const nx = x + dx, ny = y + dy, next = ny * floor.W + nx;
      if (nx >= 0 && ny >= 0 && nx < floor.W && ny < floor.H && !seen.has(next) && passMove(floor, next)) {
        seen.add(next); todo.push(next);
      }
    }
  }
  return seen;
}

test('placement is deterministic, walks from the real entrance and ignores props across an impassable gap', () => {
  for (const kind of Object.keys(REFUGES)) {
    const floor = source(REFUGES[kind].props[0]), opts = { mapId, kind, chance: 1 };
    const blank = Object.freeze({ ...startBook(), sites: Object.freeze([]) });
    const result = seedRefuge(blank, floor, opts);
    assert.equal(blank.sites.length, 0);
    assert.deepEqual(result, seedRefuge(blank, floor, opts));
    const { x, y } = where(result).position;
    assert.equal(Math.abs(x - 5) + Math.abs(y - 5), 1);
    assert.ok(reach(floor).has(y * floor.W + x));
    assert.equal(seedRefuge(result.book, floor, { ...opts, chance: 0 }).book, result.book);
    assert.equal(seedRefuge(blank, floor, { ...opts, chance: 0 }).id, null);
  }
  assert.equal(seedRefuge(startBook(), source(null), { mapId, kind: 'roots', chance: 1 }).id, null);
});

test('a learned clue lowers the check, but wrong maps and distant searches cannot reveal or enter', () => {
  const { book, id } = make('house');
  const place = where({ book, id }), total = REFUGES.house.dc - 3;
  assert.deepEqual(refugesForPlayers(book, mapId, place.level), []);
  assert.equal(enterRefuge(book, place).visit, null);
  assert.equal(searchRefuge(book, { ...place, total }).found, false);
  const learned = learnRefugeClue(book, id);
  assert.ok(learned.clue.includes('carpenter'));
  assert.deepEqual(refugesForPlayers(learned.book, mapId, place.level), []);
  assert.equal(searchRefuge(learned.book, { ...place, mapId: 'other', total: 20 }).found, false);
  assert.equal(searchRefuge(learned.book, { ...place, level: 1, total: 20 }).found, false);
  assert.equal(searchRefuge(learned.book, { ...place, position: { x: 0, y: 0 }, total: 20 }).found, false);
  const found = searchRefuge(learned.book, { ...place, total });
  assert.equal(found.found, true);
  assert.deepEqual(Object.keys(refugesForPlayers(found.book, mapId, place.level)[0]).sort(), ['id', 'name', 'position', 'visited']);
  assert.deepEqual(refugesForPlayers(found.book, 'other', place.level), []);
  assert.equal(searchRefuge(found.book, { ...place, total }).book, found.book);
});

test('all four sites make connected real layouts and preserve the generated floor after reload', () => {
  for (const kind of Object.keys(REFUGES)) for (let n = 0; n < 12; n++) {
    const { book, id } = make(kind, 'site-' + n), place = where({ book, id });
    const found = searchRefuge(book, { ...place, total: REFUGES[kind].dc }).book;
    const first = enterRefuge(found, place);
    const second = enterRefuge(JSON.parse(JSON.stringify(found)), place);
    assert.deepEqual(first, second);
    const { visit } = first;
    assert.ok(visit.builder && visit.dilemma);
    assert.ok(THEMES.some(theme => theme.id === visit.specs[0].theme));
    const floor = layoutFloor(0, visit.size, visit.size, visit.specs[0], null);
    const seen = reach(floor);
    assert.ok(seen.size > 50);
    for (const room of floor.rooms) assert.ok(seen.has(room.cy * floor.W + room.cx), kind + ' room ' + room.name);
    for (const event of floor.events) assert.ok(seen.has(event.y * floor.W + event.x));
    for (const i of floor.water) assert.ok(!seen.has(i));
    assert.equal(floor.down, null);
    assert.deepEqual(floor.up, visit.start);
  }
});

test('a saved visit returns only from its exit and preserves the original surface approach', () => {
  const { book, id } = make('road'), place = where({ book, id });
  const found = searchRefuge(book, { ...place, total: 18 }).book;
  const approach = { x: place.position.x + 1, y: place.position.y };
  const entered = enterRefuge(found, { ...place, position: approach });
  assert.equal(enterRefuge(entered.book, place).visit, null);
  assert.equal(enterRefuge(found, { ...place, mapId: 'other' }).visit, null);
  const reloaded = JSON.parse(JSON.stringify(entered.book));
  const exit = { mapId: entered.visit.mapId, level: 0, position: entered.visit.start };
  assert.equal(leaveRefuge(reloaded, { ...exit, mapId }).back, null);
  assert.equal(leaveRefuge(reloaded, { ...exit, level: 1 }).back, null);
  assert.equal(leaveRefuge(reloaded, { ...exit, position: { x: 0, y: 0 } }).back, null);
  const returned = leaveRefuge(reloaded, exit);
  assert.deepEqual(returned.back, { mapId, level: place.level, position: approach });
  assert.equal(refugesForPlayers(returned.book, mapId, place.level)[0].visited, true);
  assert.deepEqual(enterRefuge(returned.book, place).visit.specs, entered.visit.specs);
});
