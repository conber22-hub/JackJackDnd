import test from 'node:test';
import assert from 'node:assert/strict';
import { VALLEY_ROADS } from '../src/data/barovia-map.js';
import { TRAIL_REJOINS, TRAIL_SIGNS } from '../src/data/road-exploration.js';
import { journeySpecs, planJourney } from '../src/engine/overland.js';
import { layoutFloor } from '../src/engine/generator.js';
import { walk } from '../src/engine/tiles.js';
import {
  newRoadExploration, branchingJourneySpecs, discoverTrailhead, trailOptions, completeTrailLeg,
  trailsForPlayers, knownRoadRoute, trailLegSpecs,
} from '../src/engine/road-exploration.js';

const seed = 'survey-the-valley';
const roads = VALLEY_ROADS.filter(road => !road.mist && ![road.a, road.b].includes('castle'));
const fresh = () => newRoadExploration(seed);
const junctionFor = roadId => 'trail:' + roadId + ':junction';

function reachable(floor, start) {
  const index = start.y * floor.W + start.x;
  assert.ok(walk(floor.grid[index]), 'the way in stands on a walkable cell');
  const seen = new Set([index]), queue = [index];
  for (let i = 0; i < queue.length; i++) {
    const x = queue[i] % floor.W, y = Math.floor(queue[i] / floor.W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, next = ny * floor.W + nx;
      if (nx < 0 || ny < 0 || nx >= floor.W || ny >= floor.H || seen.has(next) || !walk(floor.grid[next])) continue;
      seen.add(next); queue.push(next);
    }
  }
  return seen;
}

const found = (book, from, sign) => trailOptions(book, from).find(option => option.sign === TRAIL_SIGNS[sign]);
const step = (book, from, sign) => {
  const option = found(book, from, sign);
  assert.ok(option, 'the trail sign is available');
  return completeTrailLeg(book, { from, edgeId: option.id });
};

test('each eligible Valley road gains one reachable spur in either direction', () => {
  for (const road of roads) for (const [from, to] of [[road.a, road.b], [road.b, road.a]]) {
    for (const n of [1, 9, 21, 35]) {
      const journey = { from, to, seed, n, gaze: 6, bloom: true };
      const old = journeySpecs(journey), specs = branchingJourneySpecs(fresh(), journey);
      assert.equal(specs.length, old.length);
      const markers = [];
      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i], layout = spec.layout;
        assert.deepEqual(layout.down, old[i].layout.down);
        assert.deepEqual(layout.paths.slice(0, old[i].layout.paths.length), old[i].layout.paths);
        assert.deepEqual(layout.events.filter(event => !event.trailhead), old[i].layout.events);
        const last = i === specs.length - 1;
        const up = i ? { x: specs[i - 1].layout.down[0], y: specs[i - 1].layout.down[1] } : null;
        const floor = layoutFloor(i, 40, 40, spec, up, last);
        const seen = reachable(floor, floor.up || { x: floor.rooms[0].cx, y: floor.rooms[0].cy });
        if (floor.down) assert.ok(seen.has(floor.down.y * 40 + floor.down.x));
        for (const marker of floor.events.filter(event => event.trailhead)) {
          assert.ok(seen.has(marker.y * 40 + marker.x), road.id);
          assert.ok(!floor.water.includes(marker.y * 40 + marker.x), road.id);
          assert.ok(layout.paths.slice(old[i].layout.paths.length).some(path =>
            path.pts.at(-2) === marker.x && path.pts.at(-1) === marker.y), road.id);
          markers.push(marker);
        }
      }
      assert.deepEqual(markers.map(marker => marker.trailhead), [road.id]);
    }
  }
});

test('long journeys keep their main map chain and place forks only on included road stretches', () => {
  const journey = { from: 'mists', to: 'tower', seed, n: 8, gaze: 3 };
  const stock = planJourney(journey.from, journey.to);
  const specs = branchingJourneySpecs(fresh(), journey);
  const included = new Set(stock.stretches.map(stretch => stretch.road));
  const markers = specs.flatMap(spec => spec.layout.events).filter(event => event.trailhead);
  assert.equal(specs.length, stock.stretches.length);
  assert.deepEqual(markers.map(event => event.trailhead).sort(), roads.filter(road => included.has(road.id)).map(road => road.id).sort());
  for (const [from, to] of [['mists', 'gates'], ['crossroads', 'castle']]) {
    const trip = { ...journey, from, to };
    assert.deepEqual(branchingJourneySpecs(fresh(), trip), journeySpecs(trip));
  }
});

test('discoveries survive saves and expose only reached places and connected choices', () => {
  const empty = fresh(), from = junctionFor('r-winery');
  assert.deepEqual(trailsForPlayers(empty), { places: [], roads: [] });
  assert.equal(discoverTrailhead(empty, 'r-mist'), empty);
  assert.equal(discoverTrailhead(empty, 'r-castle'), empty);
  assert.equal(discoverTrailhead(empty, 'missing'), empty);
  assert.deepEqual(trailOptions(empty, from), []);
  const atFork = discoverTrailhead(Object.freeze(empty), 'r-winery');
  assert.equal(discoverTrailhead(atFork, 'r-winery'), atFork);
  const option = found(atFork, from, 'first');
  assert.deepEqual(Object.keys(option).sort(), ['id', 'sign']);
  assert.equal(completeTrailLeg(atFork, { from: 'krezk', edgeId: option.id }).book, atFork);
  assert.equal(trailLegSpecs(atFork, { from: 'krezk', edgeId: option.id }), null);
  const first = step(atFork, from, 'first');
  const reloaded = JSON.parse(JSON.stringify(first.book));
  assert.deepEqual(trailsForPlayers(reloaded), trailsForPlayers(first.book));
  assert.deepEqual(trailsForPlayers(reloaded).places.map(place => place.id), [from, first.at]);
  assert.equal(trailsForPlayers(atFork).roads.length, 0);
  assert.equal(trailsForPlayers(atFork, ['vallaki']).roads.length, 1);
  assert.ok(trailOptions(atFork, from).every(option => !option.to));
  assert.ok(trailOptions(atFork, from, ['vallaki']).some(option => option.to === 'vallaki'));
  assert.deepEqual(trailOptions(reloaded, first.at).filter(o => o.sign).map(o => o.sign), [TRAIL_SIGNS.left, TRAIL_SIGNS.right]);
  const back = completeTrailLeg(reloaded, { from: first.at, edgeId: option.id });
  assert.equal(back.at, from);
  assert.equal(back.book, reloaded);
});

test('shortcuts only affect route times after the connecting trail is walked', () => {
  const book = discoverTrailhead(fresh(), 'r-winery');
  const before = knownRoadRoute(book, 'vallaki', 'krezk');
  assert.equal(before.hours, 8);
  assert.equal(knownRoadRoute(book, 'vallaki', 'trail:r-winery:first'), null);
  const first = step(book, junctionFor('r-winery'), 'first');
  const right = step(first.book, first.at, 'right');
  assert.equal(knownRoadRoute(right.book, 'vallaki', 'krezk').hours, 8);
  assert.ok(trailOptions(right.book, 'krezk').every(option => !option.sign));
  const arrived = step(right.book, right.at, 'rejoin');
  assert.equal(arrived.at, TRAIL_REJOINS['r-winery']);
  assert.equal(knownRoadRoute(arrived.book, 'vallaki', 'krezk').hours, 6);
  assert.equal(knownRoadRoute(arrived.book, 'krezk', 'vallaki').hours, 6);
  assert.equal(trailsForPlayers(arrived.book).roads.some(road => road.b === 'krezk'), false);
  assert.equal(trailsForPlayers(arrived.book, ['krezk']).roads.some(road => road.b === 'krezk'), true);
});

function checkChain(plan) {
  let up = null;
  for (let i = 0; i < plan.specs.length; i++) {
    const last = i === plan.specs.length - 1;
    const floor = layoutFloor(i, 40, 40, plan.specs[i], up, last);
    const seen = reachable(floor, i ? floor.up : plan.start);
    if (last) assert.ok(seen.has(plan.end.y * 40 + plan.end.x), 'arrival is reachable');
    else {
      assert.ok(seen.has(floor.down.y * 40 + floor.down.x), 'next map is reachable');
      assert.deepEqual(plan.specs[i + 1].layout.up, [floor.down.x, floor.down.y]);
    }
    up = floor.down;
  }
}

test('generated side maps chain end to end and can be traversed in reverse', () => {
  function explore(book, from, sign, n) {
    const option = found(book, from, sign);
    const forward = trailLegSpecs(book, { from, edgeId: option.id, n, gaze: 5, bloom: true });
    const arrived = completeTrailLeg(book, { from, edgeId: option.id });
    assert.equal(forward.to, arrived.at);
    const reverse = trailLegSpecs(arrived.book, { from: arrived.at, edgeId: option.id, n: n + 1, gaze: 5, bloom: true });
    assert.deepEqual(reverse.start, forward.end);
    assert.deepEqual(reverse.end, forward.start);
    assert.deepEqual(reverse.specs.map(spec => spec.layout.paths[0]), forward.specs.map(spec => spec.layout.paths[0]).reverse());
    checkChain(forward); checkChain(reverse);
    return arrived;
  }
  for (const road of roads) for (const n of [1, 19]) {
    const book = discoverTrailhead(newRoadExploration(seed + n), road.id);
    const first = explore(book, junctionFor(road.id), 'first', n);
    explore(first.book, first.at, 'left', n);
    const right = explore(first.book, first.at, 'right', n);
    if (Object.hasOwn(TRAIL_REJOINS, road.id)) explore(right.book, right.at, 'rejoin', n);
  }
});
