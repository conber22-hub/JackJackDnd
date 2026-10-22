/* PROPS — furniture and set dressing you can drop on any square (Build tab → Props).
   Props never block sight (walls do that). For movement, minis climb onto low pieces (tables, crates, beds),
   hop fences and go round tall ones (shelves, statues, pillars): see PROP_TOP / PROP_HOP / PROP_BLOCK below.
   A prop sits at x, y (its top-left square), covers w × h squares, and turns
   in quarter turns (rot 0–3). The 3D pieces are built in render/props.js.
   cat groups the palette in the Build tab. */
export const PROP_CATS = { tavern:'Tavern & house', manor:'Manor & castle', village:'Village', road:'Road & wild', barovia:'Barovia', dungeon:'Dungeon', mine:'Mine & cave' };

export const PROPS = {
  // tavern & house
  table:      { n:'Round table',     cat:'tavern',  w:1, h:1 },
  longtable:  { n:'Long table',      cat:'tavern',  w:1, h:2 },
  chair:      { n:'Chair',           cat:'tavern',  w:1, h:1 },
  bench:      { n:'Bench',           cat:'tavern',  w:1, h:2 },
  stool:      { n:'Stool',           cat:'tavern',  w:1, h:1 },
  bar:        { n:'Bar counter',     cat:'tavern',  w:1, h:3 },
  shelf:      { n:'Bottle shelf',    cat:'tavern',  w:1, h:2 },
  hearth:     { n:'Hearth',          cat:'tavern',  w:1, h:2 },
  cauldron:   { n:'Stew pot',        cat:'tavern',  w:1, h:1 },
  saltcrock:  { n:'Salt crock',      cat:'tavern',  w:1, h:1 },
  bed:        { n:'Bed',             cat:'tavern',  w:1, h:2 },
  rug:        { n:'Rug',             cat:'tavern',  w:2, h:3 },
  candelabra: { n:'Candelabra',      cat:'tavern',  w:1, h:1 },
  barrel:     { n:'Barrel',          cat:'tavern',  w:1, h:1 },
  kegs:       { n:'Kegs',            cat:'tavern',  w:2, h:1 },
  crate:      { n:'Crate',           cat:'tavern',  w:1, h:1 },
  sacks:      { n:'Sacks',           cat:'tavern',  w:1, h:1 },
  // village
  well:       { n:'Well',            cat:'village', w:2, h:2 },
  stall:      { n:'Market stall',    cat:'village', w:2, h:1 },
  cart:       { n:'Hand cart',       cat:'village', w:1, h:2 },
  hay:        { n:'Hay bales',       cat:'village', w:1, h:1 },
  fence:      { n:'Fence',           cat:'village', w:1, h:1 },
  lamppost:   { n:'Lamp post',       cat:'village', w:1, h:1 },
  signpost:   { n:'Signpost',        cat:'village', w:1, h:1 },
  trough:     { n:'Trough',          cat:'village', w:1, h:2 },
  gravestone: { n:'Gravestone',      cat:'village', w:1, h:1 },
  shrine:     { n:'Roadside shrine', cat:'village', w:1, h:1 },
  anvil:      { n:'Anvil & forge',   cat:'village', w:2, h:1 },
  // road & wild
  carriage:   { n:'Carriage',        cat:'road',    w:2, h:3 },
  wreck:      { n:'Overturned carriage', cat:'road', w:3, h:3 },
  horse:      { n:'Fallen horse',    cat:'road',    w:1, h:2 },
  wheel:      { n:'Broken wheel',    cat:'road',    w:1, h:1 },
  saltspill:  { n:'Split salt sacks',cat:'road',    w:2, h:2 },
  pine:       { n:'Pine',            cat:'road',    w:1, h:1 },
  deadtree:   { n:'Dead tree',       cat:'road',    w:1, h:1 },
  stump:      { n:'Stump',           cat:'road',    w:1, h:1 },
  boulder:    { n:'Boulder',         cat:'road',    w:1, h:1 },
  log:        { n:'Fallen log',      cat:'road',    w:1, h:2 },
  bush:       { n:'Bush',            cat:'road',    w:1, h:1 },
  milestone:  { n:'Milestone',       cat:'road',    w:1, h:1 },
  lantern:    { n:'Lantern',         cat:'road',    w:1, h:1 },
  // Barovia (the overworld)
  gates:      { n:'The Gates of Barovia', cat:'barovia', w:2, h:5 },
  gallows:    { n:'Gallows',         cat:'barovia', w:2, h:2 },
  scarecrow:  { n:'Scarecrow',       cat:'barovia', w:1, h:1 },
  mist:       { n:'Mist bank',       cat:'barovia', w:2, h:2 },
  campfire:   { n:'Campfire',        cat:'barovia', w:1, h:1 },
  vardo:      { n:'Vistani wagon',   cat:'barovia', w:1, h:2 },
  bridge:     { n:'Bridge planks',   cat:'barovia', w:1, h:1 },
  ravens:     { n:'Ravens',          cat:'barovia', w:1, h:1 },
  palisade:   { n:'Palisade',        cat:'barovia', w:1, h:1 },
  rubble:     { n:'Rubble',          cat:'barovia', w:1, h:1 },
  hull:       { n:'Iron hull plate', cat:'barovia', w:2, h:2 },
  boat:       { n:'Rowing boat',     cat:'barovia', w:1, h:2 },
  stone:      { n:'Standing stone',  cat:'barovia', w:1, h:1 },
  bloomgrowth:{ n:'Bloom growth',    cat:'barovia', w:1, h:1 },
  vines:      { n:'Vine row',        cat:'barovia', w:1, h:3 },
  tent:       { n:'Tent',            cat:'barovia', w:2, h:2 },
  // manor & castle
  bookshelf:  { n:'Bookshelf',       cat:'manor',   w:1, h:2 },
  wardrobe:   { n:'Wardrobe',        cat:'manor',   w:1, h:1 },
  desk:       { n:'Writing desk',    cat:'manor',   w:1, h:1 },
  cradle:     { n:'Cradle',          cat:'manor',   w:1, h:1 },
  dollhouse:  { n:'Dollhouse',       cat:'manor',   w:1, h:1 },
  throne:     { n:'Throne',          cat:'manor',   w:1, h:1 },
  banner:     { n:'Banner',          cat:'manor',   w:1, h:1 },
  armor:      { n:'Suit of armour',  cat:'manor',   w:1, h:1 },
  pew:        { n:'Pew',             cat:'manor',   w:1, h:2 },
  organ:      { n:'Pipe organ',      cat:'manor',   w:2, h:1 },
  // dungeon
  statue:     { n:'Statue',          cat:'dungeon', w:1, h:1 },
  sarcophagus:{ n:'Sarcophagus',     cat:'dungeon', w:1, h:2 },
  cobweb:     { n:'Cobwebs',         cat:'dungeon', w:1, h:1 },
  cage:       { n:'Cage',            cat:'dungeon', w:1, h:1 },
  rack:       { n:'Rack',            cat:'dungeon', w:1, h:2 },
  chest:      { n:'Chest',           cat:'dungeon', w:1, h:1 },
  altar:      { n:'Altar',           cat:'dungeon', w:1, h:2 },
  coffin:     { n:'Coffin',          cat:'dungeon', w:1, h:2 },
  pillar:     { n:'Pillar',          cat:'dungeon', w:1, h:1 },
  bones:      { n:'Bones',           cat:'dungeon', w:1, h:1 },
  brazier:    { n:'Brazier',         cat:'dungeon', w:1, h:1 },
  // mine & cave
  minecart:   { n:'Mine cart',       cat:'mine',    w:1, h:1 },
  rails:      { n:'Rails',           cat:'mine',    w:1, h:1 },
  ore:        { n:'Silver ore',      cat:'mine',    w:1, h:1 },
  beam:       { n:'Pit props',       cat:'mine',    w:1, h:1 },
  fungus:     { n:'Pale fungus',     cat:'mine',    w:1, h:1 },
  puddle:     { n:'Black puddle',    cat:'mine',    w:1, h:1 },
};
// Props that give off light (candles, fire): the renderer puts a real flickering light on the nearest few.
export const LIT = { candelabra:1, brazier:1.3, hearth:1.6, lantern:.8, lamppost:1, campfire:1.6, altar:.7, cauldron:.8, anvil:.9, longtable:.5, organ:.4 };

// Houses for the Build tab's House tool (solid buildings with roofs, on rock). w × h squares.
export const HOUSES = {
  cottage:  { n:'Cottage',  w:3, h:3 },
  house:    { n:'House',    w:4, h:4 },
  long:     { n:'Longhouse',w:6, h:4 },
  hall:     { n:'Hall',     w:6, h:5, tall:true },
  barn:     { n:'Barn',     w:5, h:4, noChimney:true },
  hut:      { n:'Hut',      w:3, h:3, noChimney:true, dark:true },
  tower:    { n:'Tower',    w:3, h:3, tower:true },
  windmill: { n:'Windmill', w:4, h:4, mill:true },
};

/* How minis meet each piece. PROP_TOP: they climb up and stand on it (its top, in units; getting onto it is
   difficult terrain). PROP_HOP: they hop over it (difficult terrain, feet stay on the floor). PROP_BLOCK: they go
   round it (it blocks movement but not sight). Anything else (rugs, mist, rails, puddles, bridges, gates): walk over. */
export const PROP_TOP = { table:.51, longtable:.51, chair:.29, bench:.29, stool:.33, bar:.64, bed:.45, barrel:.62, kegs:.6, crate:.56, sacks:.25, cart:.51, hay:.66,
  trough:.35, anvil:.7, stump:.3, boulder:.42, log:.37, rubble:.12, chest:.55, altar:.86, coffin:.46, desk:.72, cradle:.5, throne:.5, pew:.45, sarcophagus:.8,
  rack:.5, minecart:.64, cauldron:.5, saltcrock:.4, stall:.5, wreck:.3, wheel:.12, ore:.2, boat:.25 };
export const PROP_HOP = new Set(['fence']);
export const PROP_BLOCK = new Set(['shelf', 'hearth', 'bookshelf', 'wardrobe', 'statue', 'pillar', 'organ', 'armor', 'banner', 'lamppost', 'signpost', 'candelabra',
  'gravestone', 'shrine', 'cage', 'pine', 'deadtree', 'scarecrow', 'well', 'carriage', 'horse', 'vardo', 'tent', 'hull', 'beam', 'brazier', 'lantern', 'milestone',
  'dollhouse', 'gallows', 'palisade', 'stone']);
// The squares a prop covers, after turning (a toppled one lies across fw × fh squares).
export function propSize(p){ if (p.fw) return { w:p.fw, h:p.fh }; const d = PROPS[p.k] || { w:1, h:1 }; return (p.rot || 0) % 2 ? { w:d.h, h:d.w } : { w:d.w, h:d.h }; }
export function propAt(f, x, y){
  for (let i = (f.props || []).length - 1; i >= 0; i--){ const p = f.props[i], s = propSize(p); if (x >= p.x && x < p.x + s.w && y >= p.y && y < p.y + s.h) return p; }
  return null;
}
