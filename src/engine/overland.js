/* THE ROAD — the Barovian overworld. Routes across the valley map, and procedural stretches of road
   between places, built from modules: a winding road (bends, sometimes a river and a bridge), roadside set
   pieces (graves, a hanging tree, a wagon, a shrine, a scarecrow field, a wolf den, a mist bank…) and, at the
   end of the last stretch, the destination's landmark (the Gates, the village in the mist, the gallows
   crossroads, the camp at Tser Pool…). Each stretch is a hand-built-style layout for layoutFloor().
   The road's shape is seeded by the road, so it is the same road every time; what is on it (the events)
   is seeded by the journey, so it changes. Pure: no DOM, no Three.js. */
import { mulberry32, hashSeed, pick, clamp } from '../util/core.js';
import { VALLEY_PLACES, VALLEY_ROADS, ROAD_EVENTS } from '../data/barovia-map.js';

const N = 40, MAX_STRETCHES = 6;
export const placeById = id => VALLEY_PLACES.find(p => p.id === id) || null;
export const roadBetween = (a, b) => VALLEY_ROADS.find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a)) || null;
export const neighbours = id => VALLEY_ROADS.filter(r => r.a === id || r.b === id).map(r => r.a === id ? r.b : r.a);

// Shortest way along the roads (by stretches of road), as a list of place ids — or null.
export function route(from, to){
  if (from === to) return [from];
  const dist = { [from]:0 }, prev = {}, open = new Set([from]);
  while (open.size){
    const u = [...open].reduce((a, b) => dist[a] <= dist[b] ? a : b); open.delete(u);
    if (u === to) break;
    for (const v of neighbours(u)){ const nd = dist[u] + roadBetween(u, v).len; if (dist[v] === undefined || nd < dist[v]){ dist[v] = nd; prev[v] = u; open.add(v); } }
  }
  if (dist[to] === undefined) return null;
  const out = [to]; while (out[0] !== from) out.unshift(prev[out[0]]);
  return out;
}

// The stretches of road a journey takes (at most six maps; long roads are shortened to fit).
export function planJourney(from, to){
  const path = route(from, to); if (!path || path.length < 2) return null;
  const legs = path.slice(1).map((p, i) => ({ from:path[i], to:p, road:roadBetween(path[i], p) }));
  let lens = legs.map(l => l.road.len);
  while (lens.reduce((a, b) => a + b, 0) > MAX_STRETCHES && lens.some(n => n > 1)){ const i = lens.indexOf(Math.max(...lens)); lens[i]--; }
  const stretches = [];
  legs.forEach((leg, li) => { for (let k = 0; k < lens[li]; k++) stretches.push({ leg:li, k, of:lens[li], road:leg.road.id, from:leg.from, to:leg.to, end:k === lens[li] - 1 }); });
  return { from, to, path, legs:legs.map(l => ({ from:l.from, to:l.to, road:l.road.id })), stretches:stretches.slice(0, Math.max(MAX_STRETCHES, legs.length)) };
}

// The events the road throws at one stretch.
export function rollEvents(rng, { gaze = 1, bloom = false, avoid = [] } = {}, count){
  let ok = ROAD_EVENTS.filter(e => (!e.gaze || gaze >= e.gaze) && (!e.bloom || bloom));
  if (ok.some(e => !avoid.includes(e.label))) ok = ok.filter(e => !avoid.includes(e.label));   // no repeats on one journey while there is something new
  const out = [], n = count ?? (rng() < .15 ? 0 : 1 + (gaze >= 5 && rng() < .5 ? 1 : 0));
  for (let i = 0; i < n; i++){
    const left = ok.filter(e => !out.includes(e)), tot = left.reduce((a, e) => a + e.w, 0); let r = rng() * tot;
    const e = left.find(x => (r -= x.w) <= 0) || left[0]; if (e) out.push(e);
  }
  return out;
}

/* ---------- roadside set pieces ----------
   Each fills a clearing (rect) beside the road: { name, notes, props, room? (a smaller walkable part),
   buildings?, water? } — props are [kind, x, y, rot] in map squares. */
const P = (k, x, y, r = 0) => [k, x, y, r];
const MODULES = {
  den:      { w:7, h:6, make:(r, g) => ({ name:'A wolf den', notes:'Gnawed bones and a hollow under the roots. It smells of wet dog and old blood.',
              props:[P('boulder', r.x + 1, r.y + 1), P('deadtree', r.x + r.w - 2, r.y + 1), P('bones', r.x + 2, r.y + r.h - 2), P('bones', r.x + 4, r.y + 2), P('boulder', r.x + r.w - 2, r.y + r.h - 2)] }) },
  field:    { w:8, h:6, make:(r, g) => ({ name:'The scarecrow field', notes:'Rows of scarecrows, all facing the road. No birds. Not one.',
              props:[...[1, 3, 5].flatMap(dx => [P('scarecrow', r.x + dx, r.y + 1), P('scarecrow', r.x + dx + 1, r.y + 3)]), P('fence', r.x, r.y + r.h - 1), P('fence', r.x + 1, r.y + r.h - 1), P('hay', r.x + r.w - 1, r.y + r.h - 2)] }) },
  mistbank: { w:6, h:6, make:(r) => ({ name:'A bank of mist', notes:'The mist here is thick enough to lean on. It is colder inside than out.',
              props:[P('mist', r.x, r.y), P('mist', r.x + 3, r.y + 1), P('mist', r.x + 1, r.y + 3), P('mist', r.x + 4, r.y + 4)] }) },
  graves:   { w:6, h:5, make:(r) => ({ name:'Roadside graves', notes:'Wooden markers, most of them without names. One grave is fresh.',
              props:[P('gravestone', r.x + 1, r.y + 1), P('gravestone', r.x + 3, r.y + 1), P('gravestone', r.x + 1, r.y + 3), P('gravestone', r.x + 3, r.y + 3), P('deadtree', r.x + r.w - 1, r.y)] }) },
  hanged:   { w:5, h:5, make:(r) => ({ name:'The hanging tree', notes:'A dead tree leaning over the road, with a rope on its lowest branch.',
              props:[P('gallows', r.x + 1, r.y + 1), P('ravens', r.x + r.w - 1, r.y), P('deadtree', r.x, r.y + r.h - 1)] }) },
  wagon:    { w:7, h:6, make:(r) => ({ name:'An abandoned wagon', notes:'A painted wagon sunk to the axles. The door is open. The pot on the step is still warm.',
              props:[P('vardo', r.x + 1, r.y + 1, 1), P('campfire', r.x + 4, r.y + 4), P('barrel', r.x + r.w - 1, r.y), P('sacks', r.x + r.w - 2, r.y + r.h - 1)] }) },
  shrine:   { w:5, h:5, make:(r) => ({ name:'A wayside shrine', notes:'A shrine to the Morninglord. Fresh candles, and a bench for the tired.',
              props:[P('shrine', r.x + 2, r.y + 1), P('bench', r.x + 1, r.y + 3, 1), P('bush', r.x + r.w - 1, r.y + r.h - 1)] }) },
  ravens:   { w:5, h:5, make:(r) => ({ name:'The raven\'s tree', notes:'A dead oak full of ravens. They watch the road and say nothing.',
              props:[P('deadtree', r.x + 2, r.y + 2), P('ravens', r.x + 1, r.y + 1), P('ravens', r.x + 3, r.y + 3), P('stump', r.x, r.y + r.h - 1)] }) },
  milestone:{ w:4, h:4, make:(r) => ({ name:'A milestone', notes:'An old Svalich milestone. Someone has been at the numbers with a knife.',
              props:[P('milestone', r.x + 1, r.y + 1), P('signpost', r.x + 2, r.y + 2), P('bush', r.x + 3, r.y)] }) },
  cart:     { w:6, h:5, make:(r) => ({ name:'A spilled cart', notes:'A farmer\'s cart on its side, its load across the ditch. No farmer.',
              props:[P('cart', r.x + 1, r.y + 1, 1), P('sacks', r.x + 3, r.y + 3), P('wheel', r.x + 4, r.y + 1), P('barrel', r.x, r.y + r.h - 1)] }) },
  bloomlog: { w:6, h:5, make:(r) => ({ name:'The furred log', notes:'A fallen log furred with grey-green growth that pulses when you breathe on it. The Bloom has come this far.',
              props:[P('log', r.x + 2, r.y + 1, 1), P('bloomgrowth', r.x + 2, r.y + 2), P('bloomgrowth', r.x + 4, r.y + 2), P('deadtree', r.x, r.y)] }) },
  fork:     { w:8, h:6, make:(r) => ({ name:'A fork that was not there', notes:'The road forks here. On the way back, it will not.',
              props:[P('signpost', r.x + 3, r.y + 2), P('mist', r.x + r.w - 2, r.y), P('mist', r.x, r.y + r.h - 2), P('boulder', r.x + 6, r.y + 4)], spur:true }) },
  camp:     { w:8, h:7, make:(r) => ({ name:'A Vistani fire', notes:'A painted wagon, a fire, and someone who will read one card for a share of bread.',
              props:[P('vardo', r.x + 1, r.y + 1, 1), P('campfire', r.x + 5, r.y + 3), P('stool', r.x + 4, r.y + 4), P('stool', r.x + 6, r.y + 4), P('log', r.x + 5, r.y + 5, 1)] }) },
  // (up = the clearing is above the road: its open side faces down, toward the road)
  pond:     { w:7, h:6, make:(r, g, up) => { const room = { x:r.x, y:up ? r.y + 3 : r.y, w:r.w, h:3 }; return { name:'A black pond', notes:'Still water that reflects a sky with more stars than this one has.', room,
              water:rectTiles({ x:r.x + 1, y:up ? r.y : r.y + 4, w:r.w - 2, h:2 }), props:[P('bush', r.x, room.y), P('stone', r.x + r.w - 1, room.y + 1)] }; } },
  farm:     { w:9, h:7, make:(r, g, up) => { const room = { x:r.x, y:up ? r.y + 3 : r.y, w:r.w, h:4 }; return { name:'A lonely farmstead', notes:'Shutters nailed closed from the inside. Smoke from the chimney. Nobody answers.', room,
              buildings:[{ x:r.x + 1, y:up ? r.y : r.y + 4, w:5, h:3, name:'Farmhouse', door:up ? 's' : 'n', dark:true }], props:[P('fence', r.x + 7, room.y + 1), P('fence', r.x + 7, room.y + 2), P('hay', r.x + 6, room.y), P('trough', r.x + 1, room.y + 2, 1)] }; } },
  stones:   { w:6, h:6, make:(r) => ({ name:'Standing stones', notes:'Three stones older than the road. Moss grows on every side but one.',
              props:[P('stone', r.x + 1, r.y + 1), P('stone', r.x + 4, r.y + 1), P('stone', r.x + 2, r.y + 4), P('rubble', r.x + 4, r.y + 4)] }) },
};
const AMBIENT = ['shrine', 'ravens', 'graves', 'milestone', 'pond', 'farm', 'stones', 'mistbank', 'cart'];
function rectTiles(r){ const out = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) out.push([x, y]); return out; }

/* ---------- the landmark at the end of the road ---------- */
// r = the arrival clearing (about 14 × 12) at the far end; side = which edge the road came in from ('e' or 'w').
function landmark(kind, place, r, g, side){
  const far = side === 'e' ? r.x : r.x + r.w - 1, dir = side === 'e' ? -1 : 1;   // the side of the clearing away from the road
  const mid = r.y + Math.floor(r.h / 2), out = { name:place.name, notes:place.blurb, props:[], buildings:[], water:[], paths:[], fill:[] };
  const mists = n => { for (let i = 0; i < n; i++) out.props.push(P('mist', clamp(r.x + Math.floor(g() * r.w), 1, N - 3), clamp(r.y + Math.floor(g() * r.h), 1, N - 3))); };
  const beyond = (w, h, yy) => ({ x:side === 'e' ? r.x - w : r.x + r.w, y:yy, w, h });   // a building right behind the clearing's far edge
  switch (kind){
    case 'mists': mists(9); out.props.push(P('deadtree', r.x + 2, r.y + 2), P('deadtree', r.x + r.w - 3, r.y + r.h - 3)); break;
    case 'gates':
      out.props.push(P('gates', far - (dir < 0 ? 0 : 1), mid - 2, 0)); mists(6);
      out.props.push(P('stone', r.x + 3, r.y + 1), P('stone', r.x + 3, r.y + r.h - 2), P('ravens', r.x + r.w - 3, r.y + 1)); break;
    case 'village':
      out.buildings.push({ x:r.x + 1, y:r.y - 4, w:5, h:4, name:'House', door:'s', dark:g() < .6 }, { x:r.x + 7, y:r.y - 4, w:5, h:4, name:'House', door:'s', dark:g() < .6 },
        { x:r.x + 2, y:r.y + r.h, w:5, h:4, name:'House', door:'n', dark:true }, { x:r.x + 8, y:r.y + r.h, w:5, h:4, name:'Tavern', door:'n', tall:true });
      out.props.push(P('well', r.x + Math.floor(r.w / 2) - 1, mid - 1), P('lamppost', r.x + 2, r.y + 1), P('lamppost', r.x + r.w - 3, r.y + r.h - 2), P('signpost', side === 'e' ? r.x + r.w - 2 : r.x + 1, mid + 2));
      mists(7); break;
    case 'crossroads':
      out.props.push(P('gallows', r.x + Math.floor(r.w / 2) - 1, mid - 3), P('signpost', r.x + Math.floor(r.w / 2) + 2, mid + 1), P('ravens', r.x + 2, r.y + 1), P('milestone', r.x + r.w - 3, r.y + r.h - 2));
      out.paths.push({ w:2, pts:[r.x + Math.floor(r.w / 2), r.y, r.x + Math.floor(r.w / 2), 2] }, { w:2, pts:[r.x + Math.floor(r.w / 2), r.y + r.h - 1, r.x + Math.floor(r.w / 2), N - 3] });
      mists(3); break;
    case 'castle':
      out.buildings.push({ ...beyond(6, 10, mid - 5), name:'The castle gatehouse', door:side === 'e' ? 'e' : 'w', tall:true, dark:false });
      out.props.push(P('gates', far - (dir < 0 ? 0 : 1), mid - 2, 0), P('ravens', r.x + 2, r.y + 1), P('lamppost', far - dir, r.y + 2), P('lamppost', far - dir, r.y + r.h - 3));
      mists(5); break;
    case 'coffin':
      for (let i = 0; i < 6; i++) out.props.push(P('deadtree', r.x + 1 + Math.floor(g() * (r.w - 2)), r.y + 1 + Math.floor(g() * (r.h - 2))));
      out.props.push(P('hull', r.x + Math.floor(r.w / 2) - 1, mid - 1), P('hull', far + (dir < 0 ? 1 : -2), mid - 4), P('rubble', r.x + 3, r.y + r.h - 3), P('boulder', r.x + r.w - 3, r.y + 2), P('bloomgrowth', r.x + 4, mid + 2)); break;
    case 'camp':
      out.props.push(P('vardo', r.x + 2, r.y + 1, 1), P('vardo', r.x + 7, r.y + 1, 1), P('vardo', r.x + 2, r.y + r.h - 3, 1), P('campfire', r.x + Math.floor(r.w / 2), mid), P('stool', r.x + Math.floor(r.w / 2) - 1, mid + 1), P('stool', r.x + Math.floor(r.w / 2) + 1, mid + 1), P('log', r.x + Math.floor(r.w / 2) - 2, mid - 2, 1));
      out.water = rectTiles({ x:side === 'e' ? r.x - 5 : r.x + r.w + 1, y:mid - 2, w:4, h:5 }); break;
    case 'mill':
      out.buildings.push({ ...beyond(5, 5, r.y + 1), name:'The windmill', door:side === 'e' ? 'e' : 'w', mill:true, tall:true });
      out.props.push(P('scarecrow', r.x + 3, r.y + 2), P('hay', r.x + 5, r.y + r.h - 2), P('fence', r.x + 1, r.y + r.h - 1), P('fence', r.x + 2, r.y + r.h - 1), P('cart', r.x + r.w - 3, mid, 0)); break;
    case 'town':
      // the wall is real (solid), with the gate open in the middle and the street running on through it
      for (let y = r.y - 2; y < r.y + r.h + 2; y++) if (Math.abs(y - mid) > 1){ out.props.push(P('palisade', far, y)); out.fill.push([far, y]); }
      out.paths.push({ w:3, pts:[far, mid, far + dir * 5, mid] });
      out.buildings.push({ ...beyond(5, 4, r.y), name:'Rooftops', door:side === 'e' ? 'e' : 'w' }, { ...beyond(5, 4, r.y + r.h - 4), name:'Rooftops', door:side === 'e' ? 'e' : 'w', dark:true });
      out.props.push(P('lamppost', far - dir, mid - 2), P('lamppost', far - dir, mid + 2), P('signpost', r.x + Math.floor(r.w / 2), mid + 3), P('cart', r.x + 3, r.y + 2, 1)); break;
    case 'lake':
      out.water = rectTiles({ x:side === 'e' ? 2 : r.x + r.w + 1, y:r.y - 3, w:side === 'e' ? r.x - 3 : N - r.x - r.w - 3, h:r.h + 6 });
      out.props.push(P('bridge', far + dir, mid, 0), P('bridge', far + dir * 2, mid, 0), P('boat', far + dir * 3, mid + 1, 0), P('barrel', far - dir, mid - 2)); mists(4); break;
    case 'ruin':
      out.buildings.push({ ...beyond(8, 8, mid - 4), name:'The burned hall', door:side === 'e' ? 'e' : 'w', tall:true, dark:true });
      for (let i = 0; i < 5; i++) out.props.push(P('rubble', r.x + 1 + Math.floor(g() * (r.w - 2)), r.y + 1 + Math.floor(g() * (r.h - 2))));
      out.props.push(P('deadtree', r.x + 1, r.y + 1), P('ravens', r.x + r.w - 2, r.y + r.h - 2)); break;
    case 'swamp':
      out.water = [...rectTiles({ x:r.x + 1, y:r.y - 4, w:5, h:3 }), ...rectTiles({ x:r.x + 7, y:r.y + r.h + 1, w:6, h:3 })];
      out.buildings.push({ ...beyond(4, 4, r.y), name:'A drowned hut', door:side === 'e' ? 'e' : 'w', dark:true, noChimney:true });
      out.props.push(P('deadtree', r.x + 2, r.y + 2), P('deadtree', r.x + r.w - 3, r.y + r.h - 3), P('mist', r.x + 4, mid), P('bridge', r.x + 6, mid, 0)); mists(3); break;
    case 'vineyard':
      for (let row = 0; row < 4; row++) out.props.push(P('vines', r.x + 2 + row * 3, r.y + 1, 0), P('vines', r.x + 2 + row * 3, r.y + r.h - 4, 0));
      out.buildings.push({ ...beyond(6, 5, mid - 2), name:'The winery', door:side === 'e' ? 'e' : 'w', tall:true });
      out.props.push(P('barrel', far - dir, mid - 1), P('barrel', far - dir, mid + 1), P('cart', r.x + Math.floor(r.w / 2), mid, 1)); break;
    case 'hill':
      for (let a = 0; a < 7; a++) out.props.push(P('stone', r.x + Math.floor(r.w / 2) + Math.round(Math.cos(a * .9) * 4), mid + Math.round(Math.sin(a * .9) * 4)));
      out.props.push(P('deadtree', r.x + Math.floor(r.w / 2), mid), P('ravens', r.x + 1, r.y + 1)); mists(2); break;
    case 'tower':
      out.water = rectTiles({ x:side === 'e' ? 2 : r.x + r.w + 1, y:r.y - 2, w:side === 'e' ? r.x - 3 : N - r.x - r.w - 3, h:r.h + 4 });
      out.buildings.push({ x:side === 'e' ? 4 : N - 8, y:mid - 2, w:3, h:3, name:'The tower', door:side === 'e' ? 'e' : 'w', tall:true, tower:true });
      out.props.push(P('bridge', far + dir, mid, 0), P('boat', far + dir * 2, mid + 2, 0)); mists(4); break;
  }
  return out;
}

/* ---------- one stretch of road ---------- */
// spec: { seed, eventSeed, road, entry:{x,y}|null, side:'e'|'w' (where it comes in), arrive:place|null, passing:place|null, events, name, exits, gaze, bloom }
export function genStretch(spec){
  const g = mulberry32(hashSeed(spec.seed)), ge = mulberry32(hashSeed(spec.eventSeed || spec.seed + '|events'));
  const road = spec.road, width = road.way === 'road' ? 3 : 2, side = spec.side, toX = side === 'e' ? 2 : N - 3;
  const lay = { name:spec.name, exits:spec.exits, rooms:[], paths:[], doors:[], buildings:[], props:[], water:[], events:[], fill:[] };
  const taken = new Set(), take = (r, m = 1) => { for (let y = r.y - m; y < r.y + r.h + m; y++) for (let x = r.x - m; x < r.x + r.w + m; x++) taken.add(y * N + x); };
  const free = (r, m = 1) => { if (r.x < 2 || r.y < 2 || r.x + r.w > N - 2 || r.y + r.h > N - 2) return false; for (let y = r.y - m; y < r.y + r.h + m; y++) for (let x = r.x - m; x < r.x + r.w + m; x++) if (taken.has(y * N + x)) return false; return true; };
  const entry = spec.entry || { x:side === 'e' ? N - 3 : 2, y:10 + Math.floor(g() * 20) };
  // the arrival clearing (last stretch) sits at the far end; otherwise the road runs off the far edge
  let arrive = null;
  // (it leaves eight squares behind it for the landmark's buildings, water or walls)
  if (spec.arrive){ const w = 14, h = 12; arrive = { x:side === 'e' ? 9 : N - 9 - w, y:clamp(entry.y - 6 + Math.floor(g() * 6) - 3, 7, N - 8 - h), w, h }; }
  const exit = arrive ? { x:side === 'e' ? arrive.x + arrive.w - 1 : arrive.x, y:arrive.y + Math.floor(arrive.h / 2) } : { x:toX, y:6 + Math.floor(g() * 28) };
  // the road: three or four runs with bends, from the entry to the exit
  const pts = [entry.x, entry.y], steps = 3 + (g() < .4 ? 1 : 0); let y = entry.y;
  for (let s = 1; s < steps; s++){
    const x = Math.round(entry.x + (exit.x - entry.x) * s / steps);
    pts.push(x, y); y = clamp(y + Math.round((g() - .5) * 18), 5, N - 6); if (s === steps - 1) y = exit.y; pts.push(x, y);
  }
  pts.push(exit.x, exit.y);
  lay.paths.push({ w:width, pts });
  const center = []; for (let k = 0; k + 3 < pts.length; k += 2){ let x = pts[k], yy = pts[k + 1]; center.push([x, yy]); while (x !== pts[k + 2] || yy !== pts[k + 3]){ if (x !== pts[k + 2]) x += Math.sign(pts[k + 2] - x); else yy += Math.sign(pts[k + 3] - yy); center.push([x, yy]); } }
  for (const [x, yy] of center) take({ x:x - 1, y:yy - 1, w:3, h:3 }, 1);
  // where they come in: a little clearing so there is always somewhere to stand
  const r0 = { x:clamp(entry.x - 2, 1, N - 6), y:clamp(entry.y - 2, 1, N - 6), w:5, h:5 };
  lay.rooms.push([r0.x, r0.y, r0.w, r0.h, 'chamber', spec.startName || spec.road.name, spec.startNotes || '', { outdoor:true }]); take(r0, 1);
  if (arrive){
    const lm = landmark(spec.arrive.kind, spec.arrive, arrive, g, side);
    lay.rooms.push([arrive.x, arrive.y, arrive.w, arrive.h, 'entrance', lm.name, lm.notes, { outdoor:true }]); take(arrive, 2);
    lay.props.push(...lm.props); lay.buildings.push(...lm.buildings); lay.water.push(...lm.water); lay.paths.push(...lm.paths); lay.fill = lm.fill;
    for (const b of lm.buildings) take(b, 0);
    for (const [x, yy] of lm.water) taken.add(yy * N + x);
  }
  // a river across the road (on roads that cross water), with a bridge where the road meets it
  if (road.river && !arrive && g() < .75){
    const runs = center.filter(([x], i) => i > 6 && i < center.length - 6 && Math.abs(x - entry.x) > 6 && Math.abs(x - exit.x) > 6);
    const horiz = runs.filter(([x, yy], i) => center.some(([x2, y2]) => y2 === yy && Math.abs(x2 - x) === 1));
    const at = horiz.length ? horiz[Math.floor(g() * horiz.length)] : null;
    if (at){
      const phase = g() * 6;
      for (let yy = 1; yy < N - 1; yy++){
        const cx = at[0] + Math.round(Math.sin(yy / 5 + phase) * 1.5) - (yy === at[1] ? 0 : 0);
        for (let x = cx - 1; x <= cx + 1; x++){
          if (x < 1 || x > N - 2) continue;
          const onRoad = center.some(([rx, ry]) => Math.abs(rx - x) <= 1 && Math.abs(ry - yy) <= Math.floor(width / 2));
          if (onRoad) lay.props.push(P('bridge', x, yy, 0)); else { lay.water.push([x, yy]); taken.add(yy * N + x); }
        }
      }
      lay.riverNote = 'The road crosses the river on an old timber bridge.';
    }
  }
  // what is on the road this time, and the set pieces around it
  const events = spec.events || [], wanted = events.map(e => e.module || null);
  const extra = 1 + Math.floor(g() * 2); for (let i = 0; i < extra; i++) wanted.push(pick(AMBIENT, g));
  const anchors = center.filter((_, i) => i > 4 && i < center.length - 4);
  wanted.forEach((mk, wi) => {
    const ev = wi < events.length ? events[wi] : null;
    let placed = null;
    if (mk && MODULES[mk]){
      const m = MODULES[mk];
      for (let tries = 0; tries < 40 && !placed; tries++){
        const [ax, ay] = anchors[Math.floor(g() * anchors.length)] || [N / 2, N / 2], up = g() < .5;
        const gap = 2 + Math.floor(g() * 3), rect = { x:clamp(ax - Math.floor(m.w / 2), 2, N - 2 - m.w), y:up ? ay - gap - m.h : ay + gap + 1, w:m.w, h:m.h };
        if (!free(rect, 1)) continue;
        const made = m.make(rect, g, up), room = made.room || rect;
        lay.rooms.push([room.x, room.y, room.w, room.h, 'chamber', made.name, (ev ? `${ev.label}. ` : '') + made.notes, { outdoor:true }]);
        lay.props.push(...made.props); if (made.buildings) lay.buildings.push(...made.buildings); if (made.water) lay.water.push(...made.water);
        // a short track from the road to the clearing
        const tx = clamp(ax, room.x, room.x + room.w - 1), ty = up ? room.y + room.h - 1 : room.y;
        lay.paths.push({ w:1, pts:[tx, ay + (up ? -1 : 1), tx, ty] });
        if (made.spur) lay.paths.push({ w:2, pts:[room.x + Math.floor(room.w / 2), up ? room.y : room.y + room.h - 1, room.x + Math.floor(room.w / 2), up ? 2 : N - 3] });
        take(rect, 1); placed = { x:room.x + Math.floor(room.w / 2), y:room.y + Math.floor(room.h / 2) };
      }
    }
    if (ev){
      const at = placed || (anchors.length ? anchors[Math.floor(ge() * anchors.length)] : [entry.x, entry.y]);
      lay.events.push({ label:ev.label, text:ev.text, enc:ev.enc || null, x:at.x ?? at[0], y:at.y ?? at[1] });
    }
  });
  if (road.mist || spec.arrive?.kind === 'mists') for (let i = 0; i < 6; i++) lay.props.push(P('mist', 2 + Math.floor(g() * (N - 6)), 2 + Math.floor(g() * (N - 6))));
  if (spec.passing) lay.props.push(P('signpost', clamp(exit.x + (side === 'e' ? 2 : -2), 2, N - 3), clamp(exit.y + 2, 2, N - 3)));
  if (!arrive) lay.down = [exit.x, exit.y];
  // keep props off water and inside the map
  lay.props = lay.props.filter(p => p[1] >= 1 && p[2] >= 1 && p[1] < N - 1 && p[2] < N - 1);
  lay.water = lay.water.filter(([x, yy]) => x >= 1 && yy >= 1 && x < N - 1 && yy < N - 1);
  return { layout:lay, exit };
}

/* ---------- a whole journey, as template floor specs ---------- */
// journey: { from, to, seed, n (journeys so far), gaze, bloom }
export function journeySpecs(j){
  const plan = planJourney(j.from, j.to); if (!plan) return [];
  const goingWest = placeById(j.to).x < placeById(j.from).x;
  let side = goingWest ? 'e' : 'w', entry = null; const used = [];
  return plan.stretches.map((st, i) => {
    const road = VALLEY_ROADS.find(r => r.id === st.road), last = i === plan.stretches.length - 1, to = placeById(st.to), from = placeById(st.from);
    const er = mulberry32(hashSeed(`${i}~${j.n}~${j.seed}~${j.from}>${j.to}`)); er(); er();   // (warm the dice: neighbouring seeds start alike)
    const ev = rollEvents(er, { gaze:j.gaze, bloom:j.bloom, avoid:used }); used.push(...ev.map(e => e.label));
    const name = st.of > 1 ? `${road.name} · ${st.k + 1} of ${st.of}` : road.name;
    const exits = { up:i ? 'Back along the road' : null, down:last ? null : st.end ? `On toward ${placeById(plan.stretches[i + 1].to).name}` : `On along ${road.name}` };
    const { layout, exit } = genStretch({ seed:`${road.id}|${st.from}>${st.to}|${st.k}|${entry ? entry.x + ',' + entry.y : 'start'}`, eventSeed:`${j.seed}|${j.n}|${i}`,
      road, entry, side, arrive:last ? to : null, passing:st.end && !last ? to : null, events:ev, name, exits,
      startName:i === 0 ? `Leaving ${from.name}` : road.name, startNotes:i === 0 ? `The road out of ${from.name}.` : '' });
    if (!last){ entry = { ...exit }; side = side === 'e' ? 'w' : 'e'; }
    return { theme:last && ['village', 'town'].includes(to.kind) ? 'village' : 'woods', layout };
  });
}
