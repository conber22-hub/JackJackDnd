/* PLACES — procedural maps for the Valley's places, as hand-built-style layouts for layoutFloor():
     village   a main street, a square with a well, a church on a rise with its graveyard, a tavern and a
               shop you can walk into, a burgomaster's house, rows of shuttered houses, mist (the Village of Barovia)
     town      the same, bigger and lit, inside a palisade with gates (Vallaki)
     walled    a small stone-walled village on a slope with the road on up to the abbey (Krezk)
     swamp     huts on islands in a drowned marsh, joined by causeways (Berez)
     camp      a ring of painted wagons round a fire, tents, the reader's tent, and the pool (Tser Pool)
     vineyard  vine rows, the press house and storehouse (the cellars are the floor below), the family house (the Wizard of Wines)
     lake      a shore, a jetty you can walk out on, boats, a boathouse and a fisher's hut (Lake Zarovich)
     hill      a bare hilltop, a ring of standing stones, the tree, the singers' fire (Yester Hill)
     tower     a tower on an island in a tarn; part 0 is the island and the ground floor, 1 the upper room, 2 the roof
   Each takes { seed, name, last (no floor below), part }. Pure: no DOM, no Three.js. */
import { mulberry32, hashSeed, clamp } from '../util/core.js';

const N = 40;
const P = (k, x, y, r = 0) => [k, x, y, r];
const R = (x, y, w, h) => ({ x, y, w, h });

// Which squares are spoken for (streets, rooms, houses, walls).
function plot(){
  const t = new Set();
  return {
    free(r, m = 0){ if (r.x < 1 || r.y < 1 || r.x + r.w > N - 1 || r.y + r.h > N - 1) return false; for (let y = r.y - m; y < r.y + r.h + m; y++) for (let x = r.x - m; x < r.x + r.w + m; x++) if (t.has(y * N + x)) return false; return true; },
    take(r, m = 0){ for (let y = r.y - m; y < r.y + r.h + m; y++) for (let x = r.x - m; x < r.x + r.w + m; x++) t.add(y * N + x); },
    has:(x, y) => t.has(y * N + x),
  };
}
function line(x0, y0, x1, y1, w = 1){ const off = Math.floor((w - 1) / 2), out = []; let x = x0, y = y0;
  const brush = () => { for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) out.push([x - off + dx, y - off + dy]); };
  brush(); while (x !== x1 || y !== y1){ if (x !== x1) x += Math.sign(x1 - x); else y += Math.sign(y1 - y); brush(); } return out; }

function base(name){ return { name, exits:null, rooms:[], paths:[], doors:[], buildings:[], props:[], water:[], fill:[], masonry:[], clear:[], events:[] }; }
const room = (lay, r, type, name, notes, outdoor) => lay.rooms.push([r.x, r.y, r.w, r.h, type, name, notes, outdoor ? { outdoor:true } : {}]);

/* An indoor room with a door onto a street: the walls round it are the building. door = { x, y } on the wall line. */
function hall(lay, pl, r, name, notes, door, furnish){
  room(lay, r, 'chamber', name, notes, false); pl.take(r, 1);
  lay.paths.push({ w:1, pts:[door.x, door.y, door.sx, door.sy] }); lay.doors.push([door.x, door.y, 'closed']);
  for (const [x, y] of line(door.x, door.y, door.sx, door.sy)) pl.take(R(x, y, 1, 1), 1);   // nothing gets built across the doorstep
  // its walls are stone, even out in the woods (where loose rock would otherwise be drawn as trees)
  for (let x = r.x - 1; x <= r.x + r.w; x++) for (const y of [r.y - 1, r.y + r.h]) if (!(x === door.x && y === door.y)) lay.masonry.push([x, y]);
  for (let y = r.y; y < r.y + r.h; y++) for (const x of [r.x - 1, r.x + r.w]) if (!(x === door.x && y === door.y)) lay.masonry.push([x, y]);
  if (furnish) lay.props.push(...furnish(r));
}

// Houses along a street: solid buildings packed beside it, with gaps for yards and alleys.
function rowOfHouses(lay, pl, g, along){
  // along: { horiz, at (street edge row/col), from, to, side (-1 above/left, +1 below/right) }
  let p = along.from;
  while (p < along.to - 2){
    const w = 3 + Math.floor(g() * 3), h = 3 + Math.floor(g() * 2), gap = g() < .25 ? 2 + Math.floor(g() * 2) : 1;
    const r = along.horiz ? R(p, along.side < 0 ? along.at - h : along.at + 1, w, h) : R(along.side < 0 ? along.at - w : along.at + 1, p, w, h);   // -1: ends just before 'at'; +1: starts just after it
    if (pl.free(r, 0) && pl.free({ x:r.x, y:r.y, w:r.w, h:r.h }, 0)){
      const dark = g() < along.dark;
      lay.buildings.push({ ...r, name:along.names ? along.names[Math.floor(g() * along.names.length)] : 'House',
        door:along.horiz ? (along.side < 0 ? 's' : 'n') : (along.side < 0 ? 'e' : 'w'), dark, ...(g() < .12 ? { tall:true } : {}) });
      pl.take(r, 1);
      if (gap > 1 && g() < .6){   // a yard: a fence and a hay bale or a bush
        const fx = along.horiz ? r.x + r.w + 1 : (along.side < 0 ? along.at - 1 : along.at + 1), fy = along.horiz ? (along.side < 0 ? along.at - 1 : along.at + 1) : r.y + r.h + 1;
        if (!pl.has(fx, fy)) lay.props.push(P(g() < .5 ? 'fence' : 'bush', fx, fy, along.horiz ? 0 : 1));
      }
    }
    p += w + gap;
  }
}

const tavernProps = r => [P('bar', r.x + r.w - 2, r.y + 1, 0), P('hearth', r.x + 1, r.y, 1), P('table', r.x + 1, r.y + 3), P('chair', r.x, r.y + 3, 3), P('chair', r.x + 2, r.y + 3, 1),
  P('table', r.x + 3, r.y + r.h - 2), P('chair', r.x + 3, r.y + r.h - 1, 2), P('kegs', r.x + r.w - 3, r.y + r.h - 1, 0), P('candelabra', r.x, r.y + r.h - 1)];
const shopProps = r => [P('shelf', r.x, r.y + 1, 0), P('shelf', r.x + r.w - 1, r.y + 1, 2), P('crate', r.x + 2, r.y + 1), P('barrel', r.x + 3, r.y + r.h - 1), P('sacks', r.x + 1, r.y + r.h - 1), P('table', r.x + Math.floor(r.w / 2), r.y + 2)];
const churchProps = r => [P('altar', r.x + Math.floor(r.w / 2) - 1, r.y, 1), P('candelabra', r.x, r.y), P('candelabra', r.x + r.w - 1, r.y),
  ...[2, 4].flatMap(dy => [P('bench', r.x + 1, r.y + dy, 1), P('bench', r.x + r.w - 3, r.y + dy, 1)])];
const mansionProps = r => [P('rug', r.x + 2, r.y + 1, 0), P('longtable', r.x + r.w - 3, r.y + 2, 0), P('chair', r.x + r.w - 4, r.y + 2, 3), P('chair', r.x + r.w - 4, r.y + 3, 3), P('hearth', r.x, r.y + 2, 0), P('shelf', r.x + r.w - 1, r.y + r.h - 3, 2), P('candelabra', r.x + 1, r.y + r.h - 1)];

/* ---------- the village, the town and the walled village ---------- */
function settlement(kind, o, g){
  const lay = base(o.name), pl = plot(), town = kind === 'town', walled = kind === 'walled';
  const y0 = 19 + Math.floor(g() * 5) - 2;                                    // the main street
  const wallR = town ? R(3, 3, N - 6, N - 6) : walled ? R(5, 4, N - 10, N - 9) : null;
  if (wallR){   // the palisade (town) or the stone wall (walled), solid, with gates where the street goes through
    const ring = [];
    for (let x = wallR.x; x < wallR.x + wallR.w; x++) ring.push([x, wallR.y], [x, wallR.y + wallR.h - 1]);
    for (let y = wallR.y + 1; y < wallR.y + wallR.h - 1; y++) ring.push([wallR.x, y], [wallR.x + wallR.w - 1, y]);
    for (const [x, y] of ring){
      const gate = Math.abs(y - y0) <= 1 && (x === wallR.x || x === wallR.x + wallR.w - 1);
      const abbey = walled && y === wallR.y && (x === wallR.x + wallR.w - 5 || x === wallR.x + wallR.w - 4);
      if (gate || abbey) continue;
      lay.fill.push([x, y]); if (walled) lay.masonry.push([x, y]); else { lay.props.push(P('palisade', x, y)); lay.clear.push([x, y]); } pl.take(R(x, y, 1, 1));
    }
    const gx = wallR.x + wallR.w - 1;
    lay.props.push(P('lamppost', gx + 1, y0 - 2), P('lamppost', gx + 1, y0 + 2));
  }
  // the main street, end to end, and the way in from the east
  lay.paths.push({ w:3, pts:[N - 2, y0, 1, y0] }); pl.take(R(1, y0 - 1, N - 2, 3));
  const r0 = R(N - 6, y0 - 2, 4, 5);
  room(lay, r0, 'entrance', 'The road in', `The east road into ${o.name}.`, true); pl.take(r0, 0);
  if (walled){ const ax = wallR.x + wallR.w - 5; lay.paths.push({ w:2, pts:[ax, y0 - 2, ax, 1] }); pl.take(R(ax - 1, 1, 4, y0 - 2), 0); lay.props.push(P('signpost', ax + 2, wallR.y + 2), P('shrine', ax - 2, 2)); }
  // the square
  const sq = R(15 + Math.floor(g() * 4), y0 - 4, town ? 12 : 10, 9);
  room(lay, sq, 'chamber', town ? 'Town square' : 'Village square', town ? 'Bunting, a stage for the next festival, guards who smile too much.' : 'A dry well, and doors that close as you look at them.', true); pl.take(sq, 1);
  const scx = sq.x + Math.floor(sq.w / 2);
  lay.props.push(P('well', scx - 1, y0 - 3), P('lamppost', sq.x, sq.y), P('lamppost', sq.x + sq.w - 1, sq.y + sq.h - 1), P('signpost', sq.x + sq.w - 2, sq.y + 1));
  if (town) lay.props.push(P('stall', sq.x + 1, sq.y + sq.h - 2, 0), P('stall', sq.x + sq.w - 4, sq.y + 1, 0), P('cart', sq.x + 1, sq.y + 1, 0), P('barrel', sq.x + sq.w - 2, sq.y + sq.h - 2));
  else lay.props.push(P('cart', sq.x + 1, sq.y + sq.h - 3, 1), P('bench', sq.x + sq.w - 2, sq.y + sq.h - 3, 0));
  // north street up to the church on its rise, south street down to the burgomaster's house
  const top = wallR ? wallR.y + 2 : 2, bot = wallR ? wallR.y + wallR.h - 3 : N - 3;
  lay.paths.push({ w:2, pts:[scx, sq.y - 1, scx, top + 7] }); pl.take(R(scx, top + 7, 2, sq.y - top - 7), 0);
  const ch = R(scx - 4, top, 9, 6);
  hall(lay, pl, ch, o.church || 'The church', o.churchNotes || 'Candles that keep going out, and a priest who keeps lighting them.', { x:scx, y:top + 6, sx:scx, sy:top + 7 }, churchProps);
  if (!o.last){ lay.down = [scx, top + 1]; }
  const gy = R(ch.x + ch.w + 2, top, 6, 5);
  if (pl.free(gy, 0)){ room(lay, gy, 'crypt', 'The graveyard', 'Leaning stones, a gate that will not stay shut, and one grave freshly turned.', true); pl.take(gy, 1);
    lay.paths.push({ w:1, pts:[gy.x, gy.y + 4, scx + 1, gy.y + 4] }); lay.doors.push([ch.x + ch.w, gy.y + 4, 'open']);   // the church's side door
    for (let i = 0; i < 6; i++) lay.props.push(P('gravestone', gy.x + 1 + (i % 3) * 2, gy.y + (i < 3 ? 1 : 3)));
    lay.props.push(P('deadtree', gy.x + gy.w - 1, gy.y)); }
  lay.paths.push({ w:2, pts:[scx, sq.y + sq.h, scx, bot - 7] }); pl.take(R(scx, sq.y + sq.h, 2, bot - 7 - sq.y - sq.h + 1), 0);
  const mh = R(scx - 5, bot - 5, 11, 6);
  hall(lay, pl, mh, town ? 'The burgomaster\'s mansion' : 'The burgomaster\'s house', town ? 'Every lamp lit. Every guest checked at the door.' : 'Shutters barred. Claw marks on the door, deep and old.', { x:scx, y:mh.y - 1, sx:scx, sy:mh.y - 2 }, mansionProps);
  // the tavern and the shop
  const tv = R(sq.x + sq.w + 2, y0 + 2 + 1, 8, 6);
  if (pl.free(tv, 0)) hall(lay, pl, tv, town ? 'The inn' : 'The tavern', town ? 'Warm, loud, and full of people who are very careful what they say.' : 'One lit window. A barkeep who has stopped asking names.', { x:tv.x + 2, y:tv.y - 1, sx:tv.x + 2, sy:y0 + 1 }, tavernProps);
  const sh = R(sq.x - 9, y0 - 2 - 6, 7, 5);
  if (pl.free(sh, 0)) hall(lay, pl, sh, town ? 'The coffin maker\'s' : 'The mercantile', town ? 'Coffins in the window. More coffins than a town this size could need.' : 'Overpriced, under-stocked, and the only shop for miles.', { x:sh.x + 3, y:sh.y + sh.h, sx:sh.x + 3, sy:y0 - 1 }, shopProps);
  // a back lane on the west side
  const lx = Math.max(wallR ? wallR.x + 4 : 5, sq.x - 12);
  lay.paths.push({ w:1, pts:[lx, y0 + 2, lx, bot - 2] }); pl.take(R(lx, y0 + 2, 1, bot - y0 - 3), 0);
  // houses everywhere else along the streets
  const dark = town ? .25 : .65, names = ['House', 'House', 'Cottage', town ? 'Townhouse' : 'Shuttered house'];
  const lo = wallR ? wallR.x + 2 : 2, hi = wallR ? wallR.x + wallR.w - 2 : N - 7;
  // (at = the street's own edge row or column; houses go right up against it)
  rowOfHouses(lay, pl, g, { horiz:true, at:y0 - 1, from:lo, to:hi, side:-1, dark, names });
  rowOfHouses(lay, pl, g, { horiz:true, at:y0 + 1, from:lo, to:hi, side:1, dark, names });
  rowOfHouses(lay, pl, g, { horiz:false, at:scx, from:top + 8, to:sq.y - 1, side:-1, dark, names });
  rowOfHouses(lay, pl, g, { horiz:false, at:scx + 1, from:top + 8, to:sq.y - 1, side:1, dark, names });
  rowOfHouses(lay, pl, g, { horiz:false, at:scx, from:sq.y + sq.h + 1, to:bot - 7, side:-1, dark, names });
  rowOfHouses(lay, pl, g, { horiz:false, at:scx + 1, from:sq.y + sq.h + 1, to:bot - 7, side:1, dark, names });
  rowOfHouses(lay, pl, g, { horiz:false, at:lx, from:y0 + 3, to:bot - 2, side:-1, dark, names });
  rowOfHouses(lay, pl, g, { horiz:false, at:lx, from:y0 + 3, to:bot - 2, side:1, dark, names });
  // and behind the street fronts, more roofs: back houses, barns and sheds wherever there is ground
  const backs = ['House', 'Barn', 'Shed', 'Cottage', 'House'];
  for (let y = (wallR ? wallR.y + 2 : 2); y < (wallR ? wallR.y + wallR.h - 5 : N - 5); y += 1 + Math.floor(g() * 2))
    for (let x = (wallR ? wallR.x + 2 : 2); x < (wallR ? wallR.x + wallR.w - 4 : N - 4); x += 1 + Math.floor(g() * 2)){
      const r = R(x, y, 3 + Math.floor(g() * 3), 3 + Math.floor(g() * 2));
      // (everything already placed keeps a one-square margin, so a back house never touches another or blocks a door)
      if (g() < (town ? .85 : .65) && pl.free(r, 0) && (!wallR || (r.x + r.w < wallR.x + wallR.w - 1 && r.y + r.h < wallR.y + wallR.h - 1))){
        lay.buildings.push({ ...r, name:backs[Math.floor(g() * backs.length)], door:'s', dark:g() < dark + .15, ...(g() < .2 ? { noChimney:true } : {}) }); pl.take(r, 1); x += r.w;
      }
    }
  // the Narrow House, at the village edge where the road comes in
  if (o.narrow){ const nh = R(N - 9, y0 - 8, 3, 5); if (pl.free(nh, 0)){ lay.buildings.push({ ...nh, name:'The Narrow House', door:'s', tall:true, dark:true }); pl.take(nh, 1); } }
  // lamps and mist on the streets
  for (let x = 4; x < N - 4; x += town ? 7 : 13) if (!pl.has(x, y0 - 2)) lay.props.push(P('lamppost', x, y0 - 1));
  for (let i = 0; i < (town ? 3 : 8); i++){ const x = 3 + Math.floor(g() * (N - 8)); lay.props.push(P('mist', x, y0 - 1 + Math.floor(g() * 2))); }
  return lay;
}

/* ---------- Berez: the drowned village ---------- */
function swamp(o, g){
  const lay = base(o.name), y0 = 20;
  lay.paths.push({ w:2, pts:[N - 2, y0, 3, y0] });
  room(lay, R(N - 6, y0 - 2, 4, 5), 'entrance', 'The causeway', 'An old raised road into the marsh. The water on both sides is very still.', true);
  const isles = [];
  for (let i = 0; i < 7; i++){
    const w = 5 + Math.floor(g() * 3), h = 4 + Math.floor(g() * 2), up = i % 2 === 0, x = 4 + i * 4 + Math.floor(g() * 2);
    const r = R(x, up ? y0 - 4 - h - Math.floor(g() * 5) : y0 + 4 + Math.floor(g() * 5), w, h);
    if ((up ? r.y < 5 : r.y + r.h > N - 5) || isles.some(o2 => r.x < o2.x + o2.w + 1 && o2.x < r.x + r.w + 1 && r.y < o2.y + o2.h + 1 && o2.y < r.y + r.h + 1)) continue;
    isles.push(r);
    room(lay, r, i === 3 ? 'lair' : 'chamber', i === 3 ? 'The hut that walks' : 'A hut on stilts', i === 3 ? 'Its doorstep is a little higher than yesterday. The water around it is full of footprints the size of a cart.' : 'Empty. A table set for two, and the water an inch under the floorboards.', true);
    const hut = R(r.x + 1, up ? r.y - 3 : r.y + r.h, 3, 3);
    lay.buildings.push({ ...hut, name:i === 3 ? 'The walking hut' : 'Hut', door:up ? 's' : 'n', dark:i !== 3, noChimney:true });
    const cx = r.x + Math.floor(r.w / 2);
    lay.paths.push({ w:1, pts:[cx, up ? r.y + r.h : r.y - 1, cx, up ? y0 - 1 : y0 + 1] });
    lay.props.push(P(g() < .5 ? 'deadtree' : 'bush', r.x, up ? r.y : r.y + r.h - 1), P('mist', r.x + 1, r.y + 1));
    if (i === 3) lay.props.push(P('bones', r.x + 2, r.y + 1), P('cauldron', r.x + r.w - 2, r.y + 1));
  }
  // everything that is not ground is water
  const solid = new Set(); for (const b of lay.buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) solid.add(y * N + x);
  for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) if (!solid.has(y * N + x)) lay.water.push([x, y]);
  for (let x = 5; x < N - 6; x += 3) lay.props.push(P('bridge', x, y0, 0));
  lay.props.push(P('boat', 10, y0 + 3, 1), P('deadtree', 30, y0 - 3), P('mist', 14, y0 - 1), P('mist', 24, y0 + 1), P('ravens', 33, y0 - 2));
  return lay;
}

/* ---------- Tser Pool: the camp ---------- */
function camp(o, g){
  const lay = base(o.name), y0 = 20;
  lay.paths.push({ w:2, pts:[N - 2, y0, 26, y0] });
  room(lay, R(N - 6, y0 - 2, 4, 5), 'entrance', 'The track in', 'Music before you see the fire. The music stops when they see you.', true);
  const c = R(6, 9, 20, 22), cx = c.x + 10, cy = c.y + 11;
  room(lay, c, 'safe', 'The camp', 'A ring of painted wagons round a fire that is never allowed to go out. Wine, a fiddle, and a great deal of watching.', true);
  for (let k = 0; k < 7; k++){ const a = k / 7 * Math.PI * 2 + .3, x = Math.round(cx + Math.cos(a) * 7.5), y = Math.round(cy + Math.sin(a) * 8); lay.props.push(P('vardo', clamp(x, c.x, c.x + c.w - 2), clamp(y, c.y, c.y + c.h - 2), Math.abs(Math.cos(a)) > .6 ? 0 : 1)); }
  lay.props.push(P('campfire', cx, cy), P('campfire', cx - 1, cy), P('campfire', cx, cy + 1), P('log', cx - 3, cy - 1, 0), P('log', cx + 2, cy - 1, 0), P('stool', cx - 1, cy + 3), P('stool', cx + 1, cy + 3),
    P('tent', c.x + 2, c.y + 2), P('tent', c.x + c.w - 4, c.y + c.h - 4), P('barrel', c.x + 1, c.y + c.h - 2), P('kegs', c.x + c.w - 4, c.y + 1, 0));
  const rd = R(c.x + 3, c.y + c.h + 2, 6, 5);
  hall(lay, plot(), rd, 'The reader\'s tent', 'Velvet, incense, a table with a cloth, and a deck of cards that has been waiting for them.', { x:rd.x + 3, y:rd.y - 1, sx:rd.x + 3, sy:c.y + c.h - 1 },
    r => [P('table', r.x + 2, r.y + 2), P('chair', r.x + 1, r.y + 2, 3), P('chair', r.x + 3, r.y + 2, 1), P('candelabra', r.x, r.y), P('rug', r.x + 1, r.y + 1, 1)]);
  // the pool, east of the camp
  for (let y = 8; y < 16; y++) for (let x = 28; x < 36; x++) if (Math.hypot(x - 31.5, y - 11.5) < 4) lay.water.push([x, y]);
  room(lay, R(27, 15, 9, 3), 'shrine', 'The pool\'s edge', 'The pool reflects a sky with a different moon in it.', true);
  lay.paths.push({ w:1, pts:[30, 18, 30, y0 - 1] });
  lay.props.push(P('stone', 27, 15), P('stone', 35, 16), P('mist', 29, 9));
  return lay;
}

/* ---------- the Wizard of Wines ---------- */
function vineyard(o, g){
  const lay = base(o.name), y0 = 26, pl = plot();
  lay.paths.push({ w:3, pts:[N - 2, y0, 4, y0] }); pl.take(R(1, y0 - 1, N - 2, 3));
  room(lay, R(N - 6, y0 - 2, 4, 5), 'entrance', 'The winery road', 'Wagon ruts, and the smell of crushed grapes gone sour.', true);
  const field = R(4, 4, 22, 14);
  room(lay, field, 'chamber', 'The vineyard', 'Rows of vines on the slope. Some rows are blighted grey-green. The pickers will not go near them.', true);
  for (let x = field.x + 1; x < field.x + field.w - 1; x += 3) for (const yy of [field.y + 1, field.y + 6, field.y + 10]) if (yy + 3 <= field.y + field.h) lay.props.push(P('vines', x, yy, 0));
  lay.props.push(P('bloomgrowth', field.x + 7, field.y + 5), P('bloomgrowth', field.x + 8, field.y + 9), P('scarecrow', field.x + field.w - 2, field.y + 1));
  lay.paths.push({ w:2, pts:[15, field.y + field.h, 15, y0 - 1] });
  const press = R(28, 8, 9, 7);
  hall(lay, pl, press, 'The press house', 'The great press, the vats, and a floor sticky with last year.', { x:31, y:press.y + press.h, sx:31, sy:y0 - 1 },
    r => [P('cauldron', r.x + 1, r.y + 1), P('cauldron', r.x + 3, r.y + 1), P('kegs', r.x + 5, r.y + 1, 0), P('barrel', r.x + 1, r.y + 4), P('barrel', r.x + 2, r.y + 4), P('longtable', r.x + 6, r.y + 3, 0)]);
  const store = R(10, y0 + 3, 9, 6);
  hall(lay, pl, store, 'The storehouse', o.last ? 'Barrels to the rafters, every one of them empty.' : 'Barrels to the rafters, and a trapdoor to the cellars.', { x:14, y:store.y - 1, sx:14, sy:y0 + 1 },
    r => [P('barrel', r.x, r.y), P('barrel', r.x + 1, r.y), P('barrel', r.x, r.y + 1), P('kegs', r.x + 5, r.y, 0), P('crate', r.x + 7, r.y + 4), P('sacks', r.x + 6, r.y + 4)]);
  if (!o.last) lay.down = [store.x + 4, store.y + 3];
  lay.buildings.push({ x:23, y:y0 + 3, w:7, h:5, name:'The family house', door:'n', tall:true });
  lay.props.push(P('cart', 33, y0 + 3, 0), P('barrel', 36, y0 - 3), P('lamppost', 21, y0 - 2), P('fence', 26, y0 - 2), P('fence', 27, y0 - 2), P('hay', 34, y0 + 3));
  return lay;
}

/* ---------- Lake Zarovich ---------- */
function lake(o, g){
  const lay = base(o.name);
  for (let y = 2; y < N - 2; y++){ const shore = 17 + Math.round(Math.sin(y / 4) * 2); for (let x = 2; x < shore; x++) lay.water.push([x, y]); }
  lay.paths.push({ w:2, pts:[N - 2, 20, 20, 20] });
  room(lay, R(N - 6, 18, 4, 5), 'entrance', 'The lake path', 'The trees open, and the mist sits on the water like a lid.', true);
  room(lay, R(19, 8, 12, 24), 'chamber', 'The shore', 'Black water, nets drying, and something large moving out past the end of the jetty.', true);
  lay.paths.push({ w:1, pts:[19, 20, 7, 20] });
  for (let x = 8; x < 19; x++) lay.props.push(P('bridge', x, 20, 0));
  lay.props.push(P('boat', 12, 21, 0), P('boat', 9, 18, 0), P('bush', 19, 9), P('bush', 20, 30), P('mist', 6, 10), P('mist', 10, 26), P('mist', 4, 16), P('barrel', 21, 19), P('sacks', 22, 22));
  lay.buildings.push({ x:24, y:3, w:6, h:4, name:'The boathouse', door:'s', dark:true });
  hall(lay, plot(), R(32, 25, 5, 5), 'The fisher\'s hut', 'A stove, a cot, a lot of rope, and a fisherman who has seen what is in the lake.', { x:34, y:24, sx:34, sy:21 },
    r => [P('bed', r.x, r.y, 0), P('hearth', r.x + r.w - 1, r.y + 1, 2), P('table', r.x + 2, r.y + 2), P('chair', r.x + 2, r.y + 3, 2)]);
  return lay;
}

/* ---------- Yester Hill ---------- */
function hill(o, g){
  const lay = base(o.name), c = { x:16, y:18 };
  lay.paths.push({ w:2, pts:[N - 2, 20, 24, 20] });
  room(lay, R(N - 6, 18, 4, 5), 'entrance', 'The hill path', 'A bare slope. Nothing grows but grass, and the grass leans the wrong way.', true);
  room(lay, R(6, 8, 20, 22), 'shrine', 'The hilltop', 'A ring of stones, a fire that the singers keep, and in the middle the tree that is not a tree. It is listening.', true);
  for (let k = 0; k < 9; k++){ const a = k / 9 * Math.PI * 2; lay.props.push(P('stone', Math.round(c.x + Math.cos(a) * 7), Math.round(c.y + Math.sin(a) * 7))); }
  lay.props.push(P('deadtree', c.x, c.y), P('deadtree', c.x + 1, c.y - 1), P('bloomgrowth', c.x - 1, c.y + 1), P('altar', c.x + 3, c.y - 1, 0), P('campfire', 9, 26), P('log', 10, 27, 1), P('stool', 8, 27), P('ravens', 22, 10), P('mist', 7, 9));
  return lay;
}

/* ---------- the Lonely Tower ---------- */
function tower(o, g){
  const part = o.part || 0, lay = base(o.name), t = R(16, 16, 7, 7);
  if (part === 0){
    for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) if (Math.hypot(x - 19.5, y - 19.5) > 9) lay.water.push([x, y]);
    lay.paths.push({ w:1, pts:[N - 2, 20, 28, 20] });
    room(lay, R(N - 6, 18, 4, 5), 'entrance', 'The far shore', 'A boat tied up, and a tower across the water with one window lit.', true);
    room(lay, R(12, 12, 16, 16), 'chamber', 'The island', 'Wet rock, a ring of warding marks scratched into it, and a door with no handle on the outside.', true);
    for (let x = 29; x < 35; x++) lay.props.push(P('bridge', x, 20, 0));
    lay.props.push(P('boat', 36, 22, 0), P('mist', 6, 8), P('mist', 30, 30), P('stone', 13, 13), P('stone', 26, 26));
    // the tower's ground floor is a room inside the island; its walls are the tower
    lay.rooms.push([t.x, t.y, t.w, t.h, 'chamber', 'The tower — ground floor', 'A workroom: books, jars, a crossbow on the table, and traps on the stairs.', {}]);
    lay.fill.push(...[...Array(t.w + 2)].flatMap((_, i) => [[t.x - 1 + i, t.y - 1], [t.x - 1 + i, t.y + t.h]]), ...[...Array(t.h)].flatMap((_, i) => [[t.x - 1, t.y + i], [t.x + t.w, t.y + i]]));
    lay.fill = lay.fill.filter(([x, y]) => !(x === t.x + t.w && y === 20)); lay.masonry.push(...lay.fill);
    lay.doors.push([t.x + t.w, 20, 'locked']); lay.paths.push({ w:1, pts:[t.x + t.w - 1, 20, t.x + t.w + 1, 20] });
    lay.props.push(P('table', t.x + 1, t.y + 1), P('shelf', t.x, t.y + 3, 0), P('candelabra', t.x + t.w - 1, t.y), P('chest', t.x + 1, t.y + t.h - 1));
    if (!o.last) lay.down = [t.x + t.w - 2, t.y + t.h - 2];
    lay.exits = { down:'Up the tower stairs' };
  } else {
    room(lay, t, part === 2 ? 'shrine' : 'chamber', part === 2 ? 'The roof' : 'The upper room', part === 2 ? 'Wind, the whole valley below, and the castle watching back.' : 'A bed, a desk covered in maps of the valley, and a journal written in a careful hand.', part === 2);
    lay.props.push(...(part === 2 ? [P('stone', t.x, t.y), P('stone', t.x + t.w - 1, t.y), P('stone', t.x, t.y + t.h - 1), P('stone', t.x + t.w - 1, t.y + t.h - 1), P('brazier', t.x + 3, t.y + 3)]
      : [P('bed', t.x, t.y, 0), P('table', t.x + 4, t.y + 1), P('chair', t.x + 4, t.y + 2, 2), P('shelf', t.x + t.w - 1, t.y + 3, 2), P('rug', t.x + 2, t.y + 3, 0), P('chest', t.x + 1, t.y + t.h - 1)]));
    if (!o.last) lay.down = part === 1 ? [t.x + 1, t.y + 1] : [t.x + t.w - 2, t.y + 1];   // never on the square the stairs came up on
    lay.exits = { up:'Down the stairs', down:part === 1 ? 'Up to the roof' : 'Down through the trapdoor' };
  }
  return lay;
}

export function genPlace(kind, o){
  const g = mulberry32(hashSeed(String(o.seed) + '|' + kind + '|' + (o.part || 0))); g(); g();
  const lay = kind === 'village' || kind === 'town' || kind === 'walled' ? settlement(kind, o, g) : kind === 'swamp' ? swamp(o, g) : kind === 'camp' ? camp(o, g)
    : kind === 'vineyard' ? vineyard(o, g) : kind === 'lake' ? lake(o, g) : kind === 'hill' ? hill(o, g) : kind === 'tower' ? tower(o, g) : null;
  if (!lay) return null;
  lay.props = lay.props.filter(p => p[1] >= 1 && p[2] >= 1 && p[1] < N - 1 && p[2] < N - 1);
  return lay;
}
