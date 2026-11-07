import { REFUGES } from '../data/hidden-refuges.js';
import { propSize } from '../data/props.js';
import { cavern } from './caverns.js';
import { ORTHO, passMove } from './grid.js';
import { hashSeed, mulberry32 } from '../util/core.js';

const SIZE = 28;
const validId = id => typeof id === 'string' && id.trim().length > 0 && id.length <= 160;
const validPoint = p => Number.isSafeInteger(p?.x) && Number.isSafeInteger(p?.y);
const near = (a, b) => validPoint(a) && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
const rngFor = (...parts) => mulberry32(hashSeed(JSON.stringify(parts)));
const byId = (book, id) => book.sites.find(site => site.id === id);
const replace = (book, site) => ({ ...book, sites: book.sites.map(item => item.id === site.id ? site : item) });
const onMap = (site, where) => site.mapId === where.mapId && site.level === where.level;

export function newRefugeBook(seed) {
  if (!validId(seed)) throw new TypeError('A refuge book needs a stable campaign seed');
  return { seed, sites: [], active: null };
}

function entranceCandidates(floor, rule, roots) {
  const { W, H } = floor, index = (x, y) => y * W + x;
  const point = i => ({ x: i % W, y: Math.floor(i / W) });
  const mist = new Set(floor.mistWall ?? []);
  const within = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const pass = (x, y) => within(x, y) && !mist.has(index(x, y)) && passMove(floor, index(x, y));
  const startRoom = floor.rooms?.[0];
  const start = [floor.up, startRoom && { x: startRoom.cx, y: startRoom.cy }].find(p => validPoint(p) && pass(p.x, p.y));
  const startIndex = start ? index(start.x, start.y) : Array.from(floor.grid).findIndex((_, i) => {
    const p = point(i);
    return pass(p.x, p.y);
  });
  if (startIndex < 0) return [];
  const seen = new Set([startIndex]), queue = [startIndex];
  for (let i = 0; i < queue.length; i++) {
    const { x, y } = point(queue[i]);
    for (const [dx, dy] of ORTHO) {
      const nx = x + dx, ny = y + dy, next = index(nx, ny);
      if (pass(nx, ny) && !seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }

  const used = new Set([...(floor.shallow ?? []), ...(floor.water ?? []), ...(floor.mists ?? [])]);
  for (const item of [...(floor.events ?? []), floor.up, floor.down]) if (validPoint(item)) used.add(index(item.x, item.y));
  for (const door of floor.doors ?? []) used.add(door.i);
  for (const trap of floor.traps ?? []) used.add(trap.i);
  const anchors = new Set();
  for (const prop of floor.props ?? []) {
    const { w, h } = propSize(prop);
    for (let y = prop.y; y < prop.y + h; y++) for (let x = prop.x; x < prop.x + w; x++) {
      if (!within(x, y)) continue;
      used.add(index(x, y));
      if (rule.props.includes(prop.k)) for (const [dx, dy] of ORTHO) {
        if (within(x + dx, y + dy)) anchors.add(index(x + dx, y + dy));
      }
    }
  }
  const free = [...seen].filter(i => !used.has(i));
  const nearby = free.filter(i => anchors.has(i));
  if (nearby.length || roots) return nearby.map(point);
  // A bare wall or the verge of a road works when no fitting prop is nearby.
  return free.map(point).filter(({ x, y }) => ORTHO.some(([dx, dy]) => !pass(x + dx, y + dy)));
}

/** Host-only placement on an eligible road, interior, wooded or rocky floor. */
export function seedRefuge(book, floor, { mapId, kind, chance = 0.35 }) {
  if (!validId(mapId) || !Number.isSafeInteger(floor?.level) || floor.level < 0 ||
    !Number.isInteger(floor.W) || floor.W < 3 || !Number.isInteger(floor.H) || floor.H < 3 ||
    floor.grid?.length !== floor.W * floor.H ||
    typeof kind !== 'string' || !Object.hasOwn(REFUGES, kind) || !Number.isFinite(chance) || chance < 0 || chance > 1) {
    throw new TypeError('A refuge needs a valid source floor, map ID, kind and chance');
  }
  const level = floor.level;
  const existing = book.sites.find(site => onMap(site, { mapId, level }));
  if (existing) return { book, id: existing.id };
  const id = 'refuge:' + JSON.stringify([mapId, level]);
  const rng = rngFor(book.seed, mapId, level, kind);
  if (rng() >= chance) return { book, id: null };
  const rule = REFUGES[kind], options = entranceCandidates(floor, rule, kind === 'roots');
  if (!options.length) return { book, id: null };
  const position = options[Math.floor(rng() * options.length)];
  const site = { id, mapId, level, kind, position, name: rule.names[Math.floor(rng() * rule.names.length)],
    layoutSeed: JSON.stringify([book.seed, id, kind]), heard: false, found: false, visited: false };
  return { book: { ...book, sites: [...book.sites, site] }, id };
}

/** The DM hands out this clue from a rumour, document or other discovery. */
export function learnRefugeClue(book, id) {
  const site = byId(book, id);
  if (!site) return { book, clue: null };
  return { book: site.heard ? book : replace(book, { ...site, heard: true }), clue: REFUGES[site.kind].clue };
}

export function searchRefuge(book, { id, mapId, level, position, total }) {
  const site = byId(book, id);
  const noFind = { book, found: false, tell: null };
  if (!site || !onMap(site, { mapId, level }) || !near(position, site.position) || !Number.isFinite(total)) return noFind;
  const rule = REFUGES[site.kind];
  if (site.found) return { book, found: true, tell: rule.tell };
  if (total < rule.dc - (site.heard ? 3 : 0)) return noFind;
  return { book: replace(book, { ...site, found: true }), found: true, tell: rule.tell };
}

/** Only confirmed entrances, scoped to the active surface map. */
export function refugesForPlayers(book, mapId, level) {
  return book.sites.filter(site => site.found && onMap(site, { mapId, level }))
    .map(({ id, name, position, visited }) => ({ id, name, position: { ...position }, visited }));
}

function builtLayout(site, rule) {
  const rng = rngFor(site.layoutSeed);
  const flipX = rng() < 0.5, flipY = rng() < 0.5;
  const transform = (x, y) => [flipX ? SIZE - 1 - x : x, flipY ? SIZE - 1 - y : y];
  const bend = 11 + Math.floor(rng() * 4);
  const boxes = [[2, 10, 5, 7], [11, 10, 6, 7], [10, 2, 8, 5], [21, 10, 5, 7], [11, 21, 6, 5]];
  const rooms = boxes.map(([x, y, w, h], i) => {
    const a = transform(x, y), b = transform(x + w - 1, y + h - 1);
    return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), w, h, i ? 'chamber' : 'entrance', rule.rooms[i], i ? '' : rule.opening];
  });
  const path = (...pairs) => ({ w: 1, pts: pairs.flatMap(([x, y]) => transform(x, y)) });
  return {
    rooms, up: transform(4, 13),
    paths: [path([4, 13], [8, 13], [8, bend], [14, bend], [14, 13], [23, 13]),
      path([14, 4], [14, 23])],
    props: [['bedroll', ...transform(12, 3)], ['stool', ...transform(15, 4)], ['crate', ...transform(12, 24)],
      ['barrel', ...transform(15, 22)], ['lantern', ...transform(22, 11)]],
    events: [{ label: 'Signs of the shelter', text: rule.opening, x: transform(23, 13)[0], y: transform(23, 13)[1], enc: null }],
  };
}

function naturalLayout(site, rule) {
  const cave = cavern(SIZE, SIZE, { preset: rule.preset, seed: site.layoutSeed });
  const point = i => [i % SIZE, Math.floor(i / SIZE)];
  const paths = [];
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      if (!cave.open[y * SIZE + x]) continue;
      const start = x;
      while (x + 1 < SIZE - 1 && cave.open[y * SIZE + x + 1]) x++;
      paths.push({ w: 1, pts: [start, y, x, y] });
    }
  }
  const wet = new Set([...cave.deep, ...cave.shallow]);
  const dryCamp = ORTHO.map(([dx, dy]) => [cave.down.x + dx, cave.down.y + dy]).filter(([x, y]) => {
    const i = y * SIZE + x;
    return x > 0 && y > 0 && x < SIZE - 1 && y < SIZE - 1 && cave.open[i] && !wet.has(i)
      && (x !== cave.up.x || y !== cave.up.y);
  });
  const props = dryCamp.slice(0, 2).map(([x, y], index) => [index ? 'sacks' : 'bedroll', x, y]);
  return {
    props, rooms: [[cave.up.x, cave.up.y, 1, 1, 'entrance', rule.rooms[0], rule.opening],
      [cave.down.x, cave.down.y, 1, 1, 'chamber', rule.rooms[1], 'The last dry camp lies here.']],
    up: [cave.up.x, cave.up.y], paths, water: cave.deep.map(point), shallow: cave.shallow.map(point),
    events: [{ label: 'Signs of the shelter', text: rule.opening, ...cave.down, enc: null }],
  };
}

/** Host commits the returned book only when the map switch succeeds. */
export function enterRefuge(book, { id, mapId, level, position }) {
  const site = byId(book, id);
  if (book.active || !site?.found || !onMap(site, { mapId, level }) || !near(position, site.position)) return { book, visit: null };
  const rule = REFUGES[site.kind], layout = rule.preset ? naturalLayout(site, rule) : builtLayout(site, rule);
  const [x, y] = layout.up, insideMap = site.id;
  const active = { mapId: insideMap, exit: { x, y }, back: { mapId, level, position: { x: position.x, y: position.y } } };
  return {
    book: { ...replace(book, { ...site, visited: true }), active },
    visit: { mapId: insideMap, size: SIZE, start: { x, y },
      specs: [{ theme: site.kind === 'roots' ? 'hands' : rule.preset ? 'silver' : 'cellar', layout: { ...layout, name: site.name, exits: { up: 'Back to the hidden entrance' } } }],
      builder: rule.builder, dilemma: rule.dilemma },
  };
}

/** Leaving returns to the saved parent map and original approach tile. */
export function leaveRefuge(book, { mapId, level, position }) {
  const visit = book.active;
  if (!visit || visit.mapId !== mapId || level !== 0 || !near(position, visit.exit)) return { book, back: null };
  return { book: { ...book, active: null }, back: structuredClone(visit.back) };
}
