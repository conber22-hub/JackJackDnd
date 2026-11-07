import { VALLEY_ROADS, WAY_HOURS } from '../data/barovia-map.js';
import { TRAIL_SITES, TRAIL_SIGNS, TRAIL_REJOINS } from '../data/road-exploration.js';
import { genStretch, journeySpecs, placeById, planJourney, rollEvents } from './overland.js';
import { clamp, hashSeed, mulberry32 } from '../util/core.js';

const SIZE = 40;
const roadById = id => VALLEY_ROADS.find(road => road.id === id);
const branchable = road => road && !road.mist && road.a !== 'castle' && road.b !== 'castle';
const hoursFor = road => road.len * WAY_HOURS[road.way];
const rngFor = (...parts) => mulberry32(hashSeed(JSON.stringify(parts)));

export function newRoadExploration(seed) {
  if (typeof seed !== 'string' || !seed.trim()) throw new TypeError('Road exploration needs a stable Valley seed');
  return { seed, junctions: [], walked: [] };
}

function cluster(seed, road) {
  const rng = rngFor(seed, road.id, 'trail-network');
  const a = placeById(road.a), b = placeById(road.b), prefix = 'trail:' + road.id;
  const junction = {
    id: prefix + ':junction', name: 'Fork off ' + road.name,
    x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, kind: 'junction',
  };
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const side = rng() < 0.5 ? -1 : 1;
  const normal = { x: side * (a.y - b.y) / length, y: side * (b.x - a.x) / length };
  const along = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  const choices = [...TRAIL_SITES];
  const sites = [['first', 4, 0], ['left', 7, -4], ['right', 7, 4]].map(([key, depth, shift]) => {
    const offset = depth + rng() * 2;
    const [site] = choices.splice(Math.floor(rng() * choices.length), 1);
    return { id: prefix + ':' + key, ...site,
      x: clamp(Math.round(junction.x + normal.x * offset + along.x * shift), 2, 98),
      y: clamp(Math.round(junction.y + normal.y * offset + along.y * shift), 2, 62) };
  });
  const [first, left, right] = sites;
  let number = 0;
  const make = (key, from, to, hours, maps, way = 'trail') => ({
    id: prefix + ':way-' + ++number, a: from, b: to, hours, maps, way, sign: TRAIL_SIGNS[key] ?? null,
  });
  const halves = [make('approach-a', a.id, junction.id, hoursFor(road) / 2, 1, road.way),
    make('approach-b', junction.id, b.id, hoursFor(road) / 2, 1, road.way)];
  const trails = [make('first', junction.id, first.id, 1.5, 2),
    make('left', first.id, left.id, 2 + Math.floor(rng() * 2) / 2, 1 + Math.floor(rng() * 2)),
    make('right', first.id, right.id, 1, 1)];
  if (Object.hasOwn(TRAIL_REJOINS, road.id)) {
    trails.push(make('rejoin', right.id, TRAIL_REJOINS[road.id], 1.5, 1, 'path'));
  }
  return { junction, sites, halves, trails };
}

function explorationGraph(book) {
  const nodes = new Map(), sitesById = new Map(), edges = [], walked = new Set(book.walked);
  for (const roadId of new Set(book.junctions)) {
    const road = roadById(roadId);
    if (!branchable(road)) continue;
    const { junction, sites, halves, trails } = cluster(book.seed, road);
    nodes.set(junction.id, junction);
    for (const site of sites) {
      sitesById.set(site.id, site);
      if (trails.some(edge => walked.has(edge.id) && (edge.a === site.id || edge.b === site.id))) nodes.set(site.id, site);
    }
    edges.push(...halves, ...trails);
  }
  return { nodes, sitesById, edges, walked };
}

/** Call after the party physically reaches a trailhead marker on the active road. */
export function discoverTrailhead(book, roadId) {
  if (book.junctions.includes(roadId) || !branchable(roadById(roadId))) return book;
  return { ...book, junctions: [...book.junctions, roadId] };
}

function accessibleEdge(graph, from, edge) {
  if (edge.a !== from && edge.b !== from) return false;
  if (!edge.sign || graph.walked.has(edge.id)) return true;
  // Unknown tracks must be approached from a reached trail node, not from their hidden far end.
  return graph.nodes.has(from);
}

/** Choices near the party. Unknown tracks reveal their sign and ID only. */
export function trailOptions(book, at, visibleBaseIds = []) {
  const graph = explorationGraph(book);
  return graph.edges.filter(edge => accessibleEdge(graph, at, edge)).map(edge => {
    if (edge.sign && !graph.walked.has(edge.id)) return { id: edge.id, sign: edge.sign };
    const to = edge.a === at ? edge.b : edge.a;
    const destination = graph.nodes.get(to) ?? (visibleBaseIds.includes(to) ? placeById(to) : null);
    if (!destination) return { id: edge.id, sign: 'The road continues beyond the fork.' };
    return { id: edge.id, to, name: destination.name, hours: edge.hours };
  });
}

function traversable(book, from, edgeId) {
  const graph = explorationGraph(book), edge = graph.edges.find(item => item.id === edgeId);
  if (!edge || !accessibleEdge(graph, from, edge)) return null;
  // The undiscovered endpoint is DM-only until arrival.
  const lookup = id => graph.nodes.get(id) ?? placeById(id) ?? graph.sitesById.get(id);
  return { edge, a: lookup(edge.a), b: lookup(edge.b), reverse: from === edge.b };
}

/** Commit a walked leg only after the party reaches the far end. */
export function completeTrailLeg(book, { from, edgeId }) {
  const leg = traversable(book, from, edgeId);
  if (!leg) return { book, at: from };
  const at = (leg.reverse ? leg.a : leg.b).id;
  if (!leg.edge.sign || book.walked.includes(edgeId)) return { book, at };
  return { book: { ...book, walked: [...book.walked, edgeId] }, at };
}

function knownEdges(graph) {
  return graph.edges.filter(edge => !edge.sign || graph.walked.has(edge.id));
}

/** Overlay for the existing Valley map. Pass the base pins already visible to the party. */
export function trailsForPlayers(book, visibleBaseIds = []) {
  const graph = explorationGraph(book), visible = new Set([...visibleBaseIds, ...graph.nodes.keys()]);
  return {
    places: [...graph.nodes.values()].map(({ id, name, x, y, kind }) => ({ id, name, x, y, kind })),
    roads: knownEdges(graph).filter(edge => visible.has(edge.a) && visible.has(edge.b))
      .map(({ id, a, b, way, hours }) => ({ id, a, b, way, hours })),
  };
}

/** Fastest route over the authored roads plus trails already walked. DM route planner. */
export function knownRoadRoute(book, from, to) {
  const graph = explorationGraph(book);
  const valid = id => placeById(id) || graph.nodes.has(id);
  if (!valid(from) || !valid(to)) return null;
  const roads = [...VALLEY_ROADS.map(road => ({ id: road.id, a: road.a, b: road.b, way: road.way, hours: hoursFor(road) })), ...knownEdges(graph)];
  const distance = new Map([[from, 0]]), prev = new Map(), open = new Set([from]);
  while (open.size) {
    const here = [...open].reduce((best, id) => distance.get(id) < distance.get(best) ? id : best);
    open.delete(here);
    if (here === to) break;
    for (const road of roads) {
      if (road.a !== here && road.b !== here) continue;
      const next = road.a === here ? road.b : road.a;
      const cost = distance.get(here) + road.hours;
      if (cost >= (distance.get(next) ?? Infinity)) continue;
      distance.set(next, cost);
      prev.set(next, { id: road.id, from: here, to: next, hours: road.hours, way: road.way });
      open.add(next);
    }
  }
  if (!distance.has(to)) return null;
  const legs = [];
  for (let node = to; node !== from; node = prev.get(node).from) legs.unshift(prev.get(node));
  return { path: [from, ...legs.map(leg => leg.to)], legs, hours: distance.get(to) };
}

function centreline(pts) {
  const cells = [[pts[0], pts[1]]];
  for (let i = 2; i < pts.length; i += 2) {
    let [x, y] = cells.at(-1);
    while (x !== pts[i] || y !== pts[i + 1]) {
      if (x !== pts[i]) x += Math.sign(pts[i] - x);
      else y += Math.sign(pts[i + 1] - y);
      cells.push([x, y]);
    }
  }
  return cells;
}

const cellKey = (x, y) => y * SIZE + x;

function addTrailhead(spec, junction, road, rng) {
  const lay = spec.layout;
  const main = centreline(lay.paths[0].pts);
  const blocked = new Set();
  for (const cells of [lay.water, lay.shallow, lay.fill, lay.mistWall, lay.mists]) {
    for (const [x, y] of cells ?? []) blocked.add(cellKey(x, y));
  }
  for (const [, x, y] of lay.props) blocked.add(cellKey(x, y));
  for (const event of lay.events) blocked.add(cellKey(event.x, event.y));
  const occupied = [...lay.rooms.map(([x, y, w, h]) => ({ x, y, w, h })), ...lay.buildings];
  const inside = (x, y, box) => x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h;
  const roadTiles = new Set();
  for (const path of lay.paths) {
    const off = Math.floor(((path.w || 1) - 1) / 2);
    for (const [x, y] of centreline(path.pts)) for (let j = 0; j < (path.w || 1); j++) {
      for (let i = 0; i < (path.w || 1); i++) roadTiles.add(cellKey(x + i - off, y + j - off));
    }
  }
  const candidates = main.slice(4, -4).filter(([x, y]) =>
    !blocked.has(cellKey(x, y)) && !occupied.some(box => inside(x, y, box)));
  if (!candidates.length) return spec;
  const offset = Math.floor(rng() * candidates.length);
  const orders = rng() < 0.5 ? [-1, 1] : [1, -1];
  for (let i = 0; i < candidates.length; i++) {
    const [x, y] = candidates[(i + offset) % candidates.length];
    for (const dy of orders) {
      const length = 4 + Math.floor(rng() * 3);
      let clear = true;
      for (let step = 1; step <= length; step++) {
        const yy = y + step * dy, key = cellKey(x, yy);
        if (yy < 2 || yy > SIZE - 3 || blocked.has(key) || occupied.some(box => inside(x, yy, box))
          || (step > 1 && roadTiles.has(key))) { clear = false; break; }
      }
      if (!clear) continue;
      const end = y + length * dy;
      return { ...spec, layout: { ...lay, paths: [...lay.paths, { w: 1, pts: [x, y, x, end] }],
        events: [...lay.events, { x, y: end, label: junction.name, text: TRAIL_SIGNS.first,
          enc: null, trailhead: road.id }] } };
    }
  }
  // Tight terrain can still show the fork on the road without carving through a ford or a building.
  const [x, y] = candidates[offset];
  return { ...spec, layout: { ...lay, events: [...lay.events, {
    x, y, label: junction.name, text: TRAIL_SIGNS.first, enc: null, trailhead: road.id,
  }] } };
}

/** Standard journey maps with reachable trailheads. Campaign seed controls the sites. */
export function branchingJourneySpecs(book, journey) {
  if (!placeById(journey.from) || !placeById(journey.to)) return [];
  const plan = planJourney(journey.from, journey.to);
  if (!plan) return [];
  return journeySpecs(journey).map((spec, i) => {
    const stretch = plan.stretches[i], road = roadById(stretch.road);
    if (!branchable(road)) return spec;
    const index = stretch.from === road.a ? stretch.k : stretch.of - 1 - stretch.k;
    if (index !== Math.floor((stretch.of - 1) / 2)) return spec;
    const { junction } = cluster(book.seed, road);
    return addTrailhead(spec, junction, road, rngFor(book.seed, road.id, 'marker'));
  });
}

/** Build an existing-format map chain for one chosen leg, with the same road spine in reverse. */
export function trailLegSpecs(book, { from, edgeId, n = 0, gaze = 1, bloom = false }) {
  const leg = traversable(book, from, edgeId);
  if (!leg) return null;
  const { edge, a, b, reverse } = leg;
  const records = [];
  let entry = null;
  for (let i = 0; i < edge.maps; i++) {
    const side = i % 2 ? 'w' : 'e', last = i === edge.maps - 1;
    const seed = JSON.stringify([book.seed, edge.id, i]);
    const events = rollEvents(rngFor(seed, n, 'encounters'), { gaze, bloom });
    const start = entry ?? { x: SIZE - 3, y: 20 };
    const { layout, exit } = genStretch({
      seed, eventSeed: JSON.stringify([seed, n]), road: { ...edge, name: 'The side road' },
      entry: start, side, arrive: last ? { ...b, kind: edge.sign ? b.kind : 'junction' } : null,
      name: 'The side road', events, exits: null, startName: i ? 'The side road' : a.name,
    });
    records.push({ layout, start: [start.x, start.y], end: [exit.x, exit.y] });
    entry = exit;
  }
  if (reverse) records.reverse();
  const destination = reverse ? a : b;
  const specs = records.map(({ layout, start, end }, i) => ({
    theme: 'woods', layout: { ...layout, up: i ? (reverse ? end : start) : null,
      down: i < records.length - 1 ? (reverse ? start : end) : null,
      exits: { up: i ? 'Back along the trail' : null, down: i < records.length - 1 ? 'On along the trail' : null } },
  }));
  const first = records[0], last = records.at(-1);
  const [x, y] = reverse ? first.end : first.start;
  const [endX, endY] = reverse ? last.start : last.end;
  return { to: destination.id, hours: edge.hours, specs, start: { x, y }, end: { x: endX, y: endY } };
}
