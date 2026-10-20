/* CASTLE RAVENLOFT — five hand-shaped floors on a 56-square grid (engine/generator.js layoutFloor):
   0 the approach: the cliff road, the drawbridge over the chasm, the gatehouse, the courtyard and the keep's doors
   1 the great halls: entrance hall, great hall, chapel, dining hall, kitchens, servants' hall, the grand stair
   2 the upper keep: audience hall, library, study, portrait gallery, guest chambers, the bride's room, treasury
   3 the dungeons: the servants' stair comes out here — cell rows, the torture chamber, wine vaults, the cistern
   4 the catacombs: a grid of crypts around the tomb at their heart
   The plan is fixed (so the stairs always meet); the seed varies the crypts' names, which doors are locked, and
   the clutter. Room names and notes are this campaign's own, written for the Flood Edition.
   Rooms: [x, y, w, h, type, name, DM notes, { outdoor, use, dress, read }] — dress: furnish it (engine/dressing.js). */
import { mulberry32, hashSeed } from '../util/core.js';

export const CASTLE_SIZE = 56;
const pick = (a, g) => a[Math.floor(g() * a.length)];
function base(name, exits){ return { name, exits, rooms:[], paths:[], doors:[], props:[], masonry:[], clear:[], fill:[], buildings:[], water:[], traps:[], _r:{} }; }
function room(L, key, x, y, w, h, type, name, notes, o = {}){ L.rooms.push([x, y, w, h, type, name, notes, o]); L._r[key] = { x, y, w, h }; return L._r[key]; }
const P = (k, x, y, rot = 0) => [k, x, y, rot];
// Join two rooms that face each other across a gap: a corridor from one to the other, with a door on its first square.
function link(L, a, b, state = 'closed', at = null){
  const A = L._r[a], B = L._r[b];
  if (A.x < B.x + B.w && B.x < A.x + A.w){
    const top = A.y < B.y ? A : B, bot = top === A ? B : A, lo = Math.max(A.x, B.x), hi = Math.min(A.x + A.w, B.x + B.w) - 1, x = at ?? Math.floor((lo + hi) / 2);
    L.paths.push({ w:1, pts:[x, top.y + top.h - 1, x, bot.y] }); if (state) L.doors.push([x, top.y + top.h, state]);
  } else if (A.y < B.y + B.h && B.y < A.y + A.h){
    const left = A.x < B.x ? A : B, right = left === A ? B : A, lo = Math.max(A.y, B.y), hi = Math.min(A.y + A.h, B.y + B.h) - 1, y = at ?? Math.floor((lo + hi) / 2);
    L.paths.push({ w:1, pts:[left.x + left.w - 1, y, right.x, y] }); if (state) L.doors.push([left.x + left.w, y, state]);
  } else throw new Error(`castle: ${a} and ${b} don't face each other`);
}
const strip = L => { delete L._r; return L; };
const lockOr = (g, p, alt = 'closed') => g() < p ? 'locked' : alt;

/* ---------- 0: the approach ---------- */
function approach(g){
  const L = base('The Approach', { up:'Back down the cliff road', down:'Through the great doors' });
  room(L, 'road', 25, 47, 7, 7, 'entrance', 'The Cliff Road', 'The last of the road, cut into the rock. Two lamps on iron posts, lit, though nobody lights them. Behind the party the valley drops away into fog.', { outdoor:true, read:'The road ends at the lip of a chasm. Across it the castle rises out of its own rock — walls, towers, a keep with lit windows — and a bridge of old black planks is already down, as if you were expected.' });
  L.up = [28, 51];
  // the drawbridge over the chasm (3 wide), narrowing to the gate
  L.paths.push({ w:3, pts:[28, 47, 28, 38] }, { w:1, pts:[28, 38, 28, 36] });
  for (let y = 38; y <= 45; y++) for (const x of [27, 28, 29]) L.props.push(P('bridge', x, y, 0));
  room(L, 'gate', 24, 31, 9, 5, 'chamber', 'The Gatehouse', 'Murder holes in the ceiling, a portcullis raised just high enough to walk under. The winch room above is empty; the chains are oiled.', { read:'The gate tunnel is cold and smells of rust. Above you, slots in the stone ceiling. The portcullis hangs a hand\'s width over your heads.' });
  L.doors.push([28, 36, 'open']);
  room(L, 'court', 10, 13, 36, 17, 'chamber', 'The Courtyard', 'Flagstones, dead ornamental trees, statues with their faces worn smooth. A black carriage waits by the keep with no horses and the door open. The wind never reaches the courtyard.', { outdoor:true, read:'The courtyard is very still. Ravens on every ledge watch you cross it, and none of them make a sound. Ahead, the great doors of the keep stand open on a lit hall.' });
  link(L, 'gate', 'court', 'open', 28);
  L.down = [28, 14];
  // the keep's face, the stables and a chapel spire in the courtyard; towers either side of the gate
  L.buildings.push({ x:12, y:3, w:32, h:10, keep:true, door:'s', name:'The keep' });
  L.buildings.push({ x:12, y:20, w:6, h:5, noChimney:true, door:'e', dark:true, wall:'#3a3438', roof:'#1b1922', name:'Stables' });
  L.buildings.push({ x:40, y:16, w:4, h:4, turret:true, H:6.5, name:'The chapel spire' });
  L.buildings.push({ x:19, y:31, w:4, h:4, turret:true, name:'Gate tower' }, { x:34, y:31, w:4, h:4, turret:true, name:'Gate tower' });
  for (const b of L.buildings) if (b.y >= 13 && b.y < 30) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) L.fill.push([x, y]);
  // the curtain wall round the courtyard
  for (let y = 12; y <= 30; y++) L.masonry.push([9, y], [46, y]);
  for (let x = 9; x <= 46; x++) if (x !== 28) L.masonry.push([x, 30]);
  for (const x of [9, 10, 11, 44, 45, 46]) L.masonry.push([x, 12]);
  // the chasm and the cliffs: nothing there at all
  const solid = new Set([...L.masonry.map(([x, y]) => y * 56 + x)]);
  for (const b of L.buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) solid.add(y * 56 + x);
  for (let y = 1; y < 55; y++) for (let x = 1; x < 55; x++){
    const bridge = x >= 27 && x <= 29 && y >= 36;
    const chasm = y >= 37 && y <= 46 && !bridge, cliff = y < 37 && (x < 8 || x > 47 || y < 2), behindGate = y >= 31 && y <= 36 && (x < 19 || x > 37);
    if ((chasm || cliff || behindGate) && !solid.has(y * 56 + x)) L.clear.push([x, y]);
  }
  for (const [x, y] of [[6, 40], [16, 42], [36, 41], [46, 39], [10, 33], [42, 33]]) L.props.push(P('mist', x, y));
  // dressing
  L.props.push(P('lamppost', 26, 49), P('lamppost', 30, 49), P('deadtree', 25, 52), P('ravens', 31, 52), P('statue', 26, 47), P('statue', 30, 47),
    P('carriage', 31, 15, 0), P('well', 27, 21), P('banner', 25, 13), P('banner', 31, 13), P('statue', 23, 16), P('statue', 33, 16), P('statue', 23, 24), P('statue', 33, 24),
    P('deadtree', 14, 15), P('deadtree', 20, 27), P('deadtree', 37, 27), P('deadtree', 42, 22), P('ravens', 19, 14), P('ravens', 38, 19), P('ravens', 44, 26),
    P('trough', 18, 23, 0), P('hay', 18, 21), P('cart', 15, 26, 1), P('gravestone', 38, 26), P('gravestone', 40, 26), P('gravestone', 42, 27), P('gravestone', 39, 28),
    P('lamppost', 26, 18), P('lamppost', 30, 18), P('lamppost', 26, 28), P('lamppost', 30, 28), P('candelabra', 25, 32), P('candelabra', 31, 32));
  if (g() < .5) L.props.push(P('gallows', 12, 27));
  return strip(L);
}

/* ---------- 1: the great halls ---------- */
function halls(g){
  const L = base('The Great Halls', { up:'Out to the courtyard', down:'Up the grand stair' });
  room(L, 'gallery', 4, 4, 48, 4, 'chamber', 'The Long Gallery', 'Portraits of the same family for a dozen generations, all with the same eyes. Walk it at night and one of them is missing.', { use:'gallery', dress:true });
  room(L, 'wtower', 4, 10, 7, 7, 'chamber', 'The West Tower', 'A round room, a slit window, the smell of the chasm coming up through it.', { dress:true });
  room(L, 'wguard', 13, 10, 8, 7, 'chamber', 'The West Guardroom', 'Racks of polished arms, a dice game left mid-throw. The guards here died a long time ago and still stand their watch.', { use:'armoury', dress:true });
  room(L, 'entry', 23, 10, 11, 7, 'entrance', 'The Hall of Arrival', 'The great doors close behind the party on their own. Torches flare along the walls one after another, leading in.', { dress:true, read:'The doors swing shut behind you with no one to push them. One by one, the torches along the walls flare up, leading you in — as if the castle is showing you the way.' });
  room(L, 'eguard', 36, 10, 8, 7, 'chamber', 'The East Guardroom', 'A brazier still warm, a ring of keys on a hook — none of them fit anything the party will try.', { use:'armoury', dress:true });
  room(L, 'etower', 46, 10, 7, 7, 'chamber', 'The East Tower', 'Spiral steps up to nowhere: the stair ends at a stone ceiling.', { dress:true });
  room(L, 'chapel', 4, 20, 10, 12, 'shrine', 'The Castle Chapel', 'The holy symbols are turned to the wall. In the Flood Edition, grey-green threads have grown up through the altar from below.', { use:'chapel', dress:true, read:'Pews in rows before an altar, and above it a great window with the glass long gone. Something pale has grown up through the cracks in the altar stone, and it moves when you breathe.' });
  room(L, 'hall', 17, 20, 23, 12, 'chamber', 'The Great Hall', 'A feast hall for a hundred, laid for a hundred. A single chair at the head of the table has been pulled out, ready.', { use:'hall', dress:true, read:'A hall for a hundred guests, and the tables are laid for every one of them — silver, crystal, white linen. At the far end, a high-backed chair has been pulled out a little, ready for someone.' });
  room(L, 'dining', 43, 20, 10, 12, 'chamber', 'The Count\'s Dining Room', 'Where he invites the party to dinner. The organ plays when he wishes it to; he is a very good host until he isn\'t.', { read:'A long table set for a small party — your number exactly — and at its head, an organ of black pipes that begins to play as you enter.' });
  room(L, 'vestry', 4, 35, 10, 6, 'chamber', 'The Vestry', 'Vestments eaten to lace by moths. A secret door to the grand stair behind the wardrobe.', { dress:true });
  room(L, 'stair', 17, 35, 10, 8, 'entrance', 'The Grand Stair', 'A sweeping stair up into darkness, guarded by two statues of armoured knights whose helms turn to follow the party.', { dress:true, read:'A stair wide enough for a carriage sweeps up into the dark. Two stone knights stand at its foot, and as you pass between them you hear stone grind on stone.' });
  room(L, 'servants', 30, 35, 10, 7, 'chamber', 'The Servants\' Hall', 'Long benches, tin plates, a bell board on the wall — one bell still twitches now and then.', { use:'servants', dress:true });
  room(L, 'kitchen', 43, 35, 10, 9, 'chamber', 'The Kitchens', 'Ovens cold for a century, and one that is warm. Something is always cooking for the guests.', { use:'kitchen', dress:true });
  room(L, 'larder', 43, 47, 10, 6, 'chamber', 'The Larder', 'Hams, wine, cheese — all perfectly fresh, all perfectly tasteless.', { use:'kitchen', dress:true });
  room(L, 'lower', 17, 46, 23, 6, 'chamber', 'The Hall of Arms', 'Suits of armour in rows, banners of houses that no longer exist, a shield wall with one empty hook.', { use:'gallery', dress:true });
  for (const k of ['wtower', 'wguard', 'entry', 'eguard', 'etower']) link(L, 'gallery', k, k === 'entry' ? 'open' : 'closed');
  link(L, 'wtower', 'wguard'); link(L, 'eguard', 'etower');
  link(L, 'entry', 'hall', 'open'); link(L, 'wtower', 'chapel'); link(L, 'etower', 'dining', lockOr(g, .3));
  link(L, 'chapel', 'hall'); link(L, 'hall', 'dining', 'open');
  link(L, 'chapel', 'vestry'); link(L, 'vestry', 'stair', 'secret');
  link(L, 'hall', 'stair', 'open'); link(L, 'hall', 'servants'); link(L, 'stair', 'servants');
  link(L, 'dining', 'kitchen'); link(L, 'servants', 'kitchen'); link(L, 'kitchen', 'larder');
  link(L, 'stair', 'lower', 'open'); link(L, 'servants', 'lower'); link(L, 'lower', 'larder', lockOr(g, .5));
  L.down = [21, 39];
  // the hand-set pieces (the dresser fills in the rest)
  L.props.push(P('organ', 47, 20), P('longtable', 47, 22), P('longtable', 47, 24), P('longtable', 47, 26), P('longtable', 47, 28),
    ...[22, 23, 24, 25, 26, 27, 28, 29].flatMap(y => [P('chair', 46, y, 3), P('chair', 48, y, 1)]), P('candelabra', 43, 20), P('candelabra', 52, 20), P('candelabra', 43, 31), P('candelabra', 52, 31), P('rug', 44, 23),
    P('statue', 17, 41), P('statue', 26, 41), P('rug', 21, 36), P('throne', 28, 20, 1));
  L.traps.push([21, 33, 'bell']);
  return strip(L);
}

/* ---------- 2: the upper keep ---------- */
function upper(g){
  const L = base('The Upper Keep', { up:'Down the grand stair', down:'Down the servants\' stair, all the way down' });
  room(L, 'gallery', 4, 4, 48, 4, 'chamber', 'The Upper Gallery', 'Tall windows on the valley. From here you can see every light in Barovia, and count how few there are.', { use:'gallery', dress:true });
  room(L, 'wtower', 4, 10, 7, 7, 'chamber', 'The Servants\' Stair', 'A narrow stair behind a plain door, worn by generations of servants\' feet, going down past every floor to the dungeons.', { dress:true });
  room(L, 'master', 13, 10, 8, 7, 'chamber', 'The Master\'s Chamber', 'A great bed that has never been slept in. The Count does not sleep here.', { use:'bedchamber', dress:true });
  room(L, 'treasury', 23, 10, 11, 7, 'treasure', 'The Treasury', 'Coin, plate, jewels, deeds to lands that drowned in the mist — and a ledger of every debt owed to the Count, with the party\'s names already in it.', { dress:true });
  room(L, 'belfry', 36, 10, 8, 7, 'chamber', 'The Bell Room', 'The ropes of the castle bells. Ring them and every dead thing in the valley lifts its head.', { dress:true });
  room(L, 'etower', 46, 10, 7, 7, 'chamber', 'The East Tower Room', 'A telescope trained on the village of Barovia. The lens is fogged with breath.', { dress:true });
  room(L, 'library', 4, 20, 10, 12, 'chamber', 'The Library', 'History, poetry, necromancy, and a shelf of journals in the Count\'s own hand — the oldest describes a war and a brother.', { use:'library', dress:true, read:'Books to the ceiling, ladders on rails, a fire burning low in a great hearth. In a reading chair, a book lies open, face down, still warm from someone\'s hand.' });
  room(L, 'audience', 17, 20, 23, 12, 'chamber', 'The Audience Hall', 'The throne on its dais, and before it a long red carpet worn pale down the middle by everyone who ever had to walk it.', { use:'hall', dress:true, read:'A long red carpet runs the length of the hall to a throne on a dais. The throne is empty. The shadow it throws on the wall behind it is not.' });
  room(L, 'portraits', 43, 20, 10, 12, 'chamber', 'The Portrait Gallery', 'One portrait is of a woman the party may recognise from the village. It is three hundred years old.', { use:'gallery', dress:true });
  room(L, 'study', 4, 35, 10, 6, 'chamber', 'The Count\'s Study', 'Maps of the valley with pins in them — one for every place the party has been. A letter on the desk, addressed to them, sealed.', { use:'library', dress:true });
  room(L, 'landing', 17, 35, 10, 8, 'entrance', 'The Upper Landing', 'The grand stair arrives under a painted ceiling: the night sky as it was before the mists, every star in the wrong place.', { dress:true });
  room(L, 'guest1', 30, 35, 10, 7, 'chamber', 'The Blue Guest Room', 'Made up for a guest. The water in the jug is fresh. There is a lock on the outside of the door.', { use:'bedchamber', dress:true });
  room(L, 'guest2', 43, 35, 10, 9, 'chamber', 'The Red Guest Room', 'A guest who stayed too long: their clothes in the wardrobe, their diary under the pillow, the last entry just a name, over and over.', { use:'bedchamber', dress:true });
  room(L, 'bride', 43, 47, 10, 6, 'chamber', 'The Bride\'s Room', 'A wedding dress laid out on the bed, a veil on the chair, flowers that never wilt. He has been waiting a very long time.', { use:'bedchamber', dress:true, read:'A bedchamber in white and silver. A wedding dress is laid out on the bed, and a veil across the chair. The flowers on the dresser are fresh, and they have been fresh for a very long time.' });
  room(L, 'balcony', 17, 46, 23, 6, 'chamber', 'The Moon Terrace', 'An open terrace over the chasm. The drop is a long way down. Bats roost under the parapet by the hundred.', { dress:true });
  for (const k of ['wtower', 'master', 'treasury', 'belfry', 'etower']) link(L, 'gallery', k, k === 'treasury' ? 'locked' : 'closed');
  link(L, 'wtower', 'library'); link(L, 'etower', 'portraits');
  link(L, 'treasury', 'audience', 'locked');
  link(L, 'library', 'audience'); link(L, 'audience', 'portraits');
  link(L, 'library', 'study', lockOr(g, .4)); link(L, 'study', 'landing', 'secret');
  link(L, 'audience', 'landing', 'open'); link(L, 'audience', 'guest1'); link(L, 'landing', 'guest1');
  link(L, 'portraits', 'guest2'); link(L, 'guest2', 'bride', 'locked');
  link(L, 'landing', 'balcony', 'open'); link(L, 'guest1', 'balcony'); link(L, 'balcony', 'bride');
  L.down = [7, 13];
  L.props.push(P('throne', 28, 20, 1), P('rug', 27, 23, 0), P('rug', 27, 26, 0), P('banner', 24, 20), P('banner', 32, 20), P('statue', 18, 21), P('statue', 38, 21),
    P('bed', 47, 48, 1), P('candelabra', 43, 47), P('candelabra', 52, 47));
  L.traps.push([28, 9, 'wire']);
  return strip(L);
}

/* ---------- 3: the dungeons ---------- */
function dungeons(g){
  const L = base('The Dungeons', { up:'Up the servants\' stair', down:'Down into the catacombs' });
  room(L, 'bottom', 4, 10, 7, 7, 'entrance', 'The Foot of the Stair', 'The servants\' stair ends at a door studded with iron. Cold air comes under it, and the sound of chains.', { dress:true });
  room(L, 'gaolers', 13, 10, 8, 7, 'chamber', 'The Gaolers\' Room', 'A table, a lamp, a ledger of prisoners. The last name was written yesterday.', { use:'armoury', dress:true });
  room(L, 'row', 4, 24, 42, 3, 'chamber', 'The Cell Row', 'A long passage of cells on both sides. Some are empty. Some are not. One prisoner begs the party to open their cell and will say anything to make them do it.', { read:'A long passage, cells on both sides behind iron doors. Fingers curl around some of the bars as your light passes. Somewhere, someone is counting under their breath, and has been for a long time.' });
  link(L, 'bottom', 'gaolers'); link(L, 'bottom', 'row', 'closed', 7);
  const CELLS = ['A skeleton in rags, sitting up.', 'Scratches covering every wall: tallies, then names, then teeth marks.', 'A prisoner who is not quite a prisoner — the Bloom has taken them, and they are patient.', 'Empty, the door open, the straw still warm.', 'A child\'s drawing of the castle, in charcoal, on the wall.', 'A noble in a ruined coat who insists there has been a mistake.', 'Grey-green growth filling the cell like cotton.', 'Nothing but a key, on the floor, just out of reach of the cell next door.'];
  let n = 0;
  for (const x of [13, 18, 23, 28, 33, 38]) for (const [y, side] of [[19, 'n'], [28, 's']]){
    const key = `cell${n++}`;
    room(L, key, x, y, 4, 4, g() < .2 ? 'lair' : 'chamber', `Cell ${n}`, pick(CELLS, g), { dress:true });
    link(L, side === 'n' ? key : 'row', side === 'n' ? 'row' : key, g() < .6 ? 'locked' : 'closed', x + 1);
  }
  room(L, 'torture', 48, 20, 7, 11, 'chamber', 'The Question Room', 'Instruments laid out in order of size, cleaned and oiled. The chair in the middle has straps that have been replaced recently.', { use:'dungeon', dress:true });
  room(L, 'oubliette', 48, 33, 7, 6, 'trap', 'The Oubliette', 'A grate in the floor over a shaft. Something at the bottom answers when you call down.', { dress:true });
  room(L, 'vaults', 4, 33, 14, 12, 'chamber', 'The Wine Vaults', 'Racks of bottles going back three centuries. The oldest are labelled in a language nobody in Barovia speaks.', { dress:true });
  room(L, 'stores', 21, 36, 8, 8, 'treasure', 'The Storerooms', 'Salt by the sack — enough to ring every room in the castle. The Count keeps it to keep the Bloom out of his own house.', { dress:true });
  room(L, 'cistern', 32, 36, 10, 10, 'chamber', 'The Cistern', 'Black water under a vaulted roof, a walkway round the edge. Things move under the surface, slowly.', { read:'A vaulted room, half of it black water. A narrow walkway runs around the edge. When your light touches the water, something under it turns over, slowly, and goes still.' });
  room(L, 'cryptgate', 44, 42, 9, 9, 'entrance', 'The Crypt Stair', 'A stair cut down into the living rock, flanked by two kneeling statues with their hands over their faces.', { dress:true });
  link(L, 'row', 'torture', 'closed'); link(L, 'torture', 'oubliette', lockOr(g, .5));
  link(L, 'row', 'vaults', 'closed', 10); link(L, 'vaults', 'stores'); link(L, 'stores', 'cistern'); link(L, 'cistern', 'cryptgate', 'locked');
  L.down = [48, 46];
  for (let y = 37; y <= 44; y++) for (let x = 38; x <= 40; x++){ L.fill.push([x, y]); L.water.push([x, y]); }   // the black water, with a walkway round it
  L.props.push(P('statue', 45, 43), P('statue', 51, 43), P('rack', 50, 24, 0), P('cage', 52, 21), P('cage', 52, 28), P('brazier', 49, 22));
  L.traps.push([25, 25, 'pit'], [40, 25, 'wire']);
  return strip(L);
}

/* ---------- 4: the catacombs ---------- */
const FIRST = ['Lady Ostara', 'Lord Vadim', 'Mother Ilinca', 'Sir Andrei', 'the Twins', 'Bishop Teodor', 'Little Anca', 'Captain Radu', 'Old Mircea', 'the Lady Sorina', 'Brother Costin', 'Dame Elisaveta', 'the Unnamed Bride', 'Lord Petru', 'Nadia the Singer', 'the Weeping Knight'];
const FAMILY = ['Velikov', 'Dravic', 'Ostrova', 'Kerenzi', 'Malescu', 'Varnai', 'Iordache', 'Brasov'];
const CRYPT = ['A stone coffin with a face carved on the lid — the face is smiling.', 'Empty, the lid on the floor in two pieces.', 'The name on the door has been chiselled off.', 'Offerings at the foot of the coffin: fresh. Somebody still visits.', 'The occupant\'s hands are folded around a silver dagger.', 'Grey-green threads have come up through the floor and into the coffin.', 'A soldier\'s crypt: a sword, a shield, a helm, and nothing in the armour.', 'Three small coffins in a row.'];
function catacombs(g){
  const L = base('The Catacombs', { up:'Up to the dungeons' });
  room(L, 'gate', 44, 42, 9, 9, 'entrance', 'The Bottom of the Crypt Stair', 'The stair ends at a gate of black iron, open. Beyond it the catacombs run off in every direction, a grid of the dead.', { dress:true, read:'The stair ends at an iron gate, standing open. Beyond it, passages run straight into the dark in every direction, lined with sealed doors. The air is dry and very old, and it smells faintly of roses.' });
  // the passages: a grid
  L.paths.push({ w:1, pts:[10, 6, 47, 6] }, { w:1, pts:[10, 18, 47, 18] }, { w:1, pts:[10, 30, 47, 30] }, { w:1, pts:[10, 46, 44, 46] },
    { w:1, pts:[10, 6, 10, 46] }, { w:1, pts:[22, 6, 22, 46] }, { w:1, pts:[34, 6, 34, 46] }, { w:1, pts:[47, 6, 47, 42] });
  // the tomb at the heart
  room(L, 'tomb', 24, 20, 9, 9, 'lair', 'The Tomb of the Count', 'His coffin, on a dais, under a canopy of black stone. In daylight he lies in it. In the Flood Edition, the Bloom has not dared to come within a hundred feet — the only clean room for a mile.', { read:'At the heart of the catacombs, a chamber of black marble. On a dais in the middle, a coffin of dark wood bound in silver. The candles around it are lit. There is no dust here at all.' });
  for (const [x, y] of [[23, 24], [33, 24]]) L.doors.push([x, y, 'locked']);
  for (const [x, y] of [[28, 19], [28, 29]]) L.doors.push([x, y, 'locked']);
  L.paths.push({ w:1, pts:[22, 24, 24, 24] }, { w:1, pts:[32, 24, 34, 24] }, { w:1, pts:[28, 18, 28, 20] }, { w:1, pts:[28, 28, 28, 30] });
  // the crypts: two by two in each block of the grid
  let n = 0;
  const blocks = [[12, 17, 11, 22], [24, 29, 23, 34], [36, 41, 35, 47]];   // [left crypt x, right crypt x, west corridor + 1, east corridor]
  for (const [lx, rx, wcx, ecx] of blocks) for (const ys of [[8, 13], [20, 25], [32, 37]]) for (const y of ys){
    if (lx === 24 && y >= 20 && y <= 28) continue;                      // the tomb's block
    for (const [x, door] of [[lx, [wcx - 1, wcx]], [rx, [rx + 4, ecx]]]){
      const name = g() < .25 ? `Crypt of the ${pick(FAMILY, g)} family` : `Crypt of ${pick(FIRST, g)} ${pick(FAMILY, g)}`;
      room(L, `c${n}`, x, y, 4, 4, 'crypt', name, pick(CRYPT, g), { dress:true });
      const dy = y + 1 + Math.floor(g() * 2), [from, to] = door;
      L.paths.push({ w:1, pts:x === lx ? [to, dy, x, dy] : [x + 3, dy, to, dy] });
      L.doors.push([x === lx ? x - 1 : x + 4, dy, g() < .15 ? 'secret' : g() < .3 ? 'locked' : 'closed']); n++;
      void from;
    }
  }
  L.props.push(P('coffin', 28, 23, 0), P('candelabra', 25, 21), P('candelabra', 31, 21), P('candelabra', 25, 27), P('candelabra', 31, 27), P('statue', 24, 20), P('statue', 32, 20), P('statue', 24, 28), P('statue', 32, 28), P('rug', 27, 25, 0),
    P('statue', 45, 43), P('statue', 51, 43));
  for (let k = 0; k < 6; k++){ const t = pick([[16, 6], [28, 6], [40, 6], [16, 18], [40, 18], [16, 30], [40, 30], [10, 12], [22, 38], [34, 12], [47, 24], [28, 46]], g); L.traps.push([t[0], t[1], pick(['pit', 'wire', 'bell'], g)]); }
  return strip(L);
}

export function ravenloftLayout(part, seed = 'ravenloft'){
  const g = mulberry32(hashSeed(`${seed}|castle|${part}`)); g(); g();
  return [approach, halls, upper, dungeons, catacombs][part]?.(g) || null;
}
