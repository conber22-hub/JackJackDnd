/* PROPS — furniture and set dressing you can drop on any square (Build tab → Props).
   Props are scenery: they don't block movement or sight (walls do that), the way tokens of furniture
   work on Roll20 and Foundry. A prop sits at x, y (its top-left square), covers w × h squares, and turns
   in quarter turns (rot 0–3). The 3D pieces are built in render/props.js.
   cat groups the palette in the Build tab. */
export const PROP_CATS = { tavern:'Tavern & house', village:'Village', road:'Road & wild', barovia:'Barovia', dungeon:'Dungeon' };

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
  // dungeon
  chest:      { n:'Chest',           cat:'dungeon', w:1, h:1 },
  altar:      { n:'Altar',           cat:'dungeon', w:1, h:2 },
  coffin:     { n:'Coffin',          cat:'dungeon', w:1, h:2 },
  pillar:     { n:'Pillar',          cat:'dungeon', w:1, h:1 },
  bones:      { n:'Bones',           cat:'dungeon', w:1, h:1 },
  brazier:    { n:'Brazier',         cat:'dungeon', w:1, h:1 },
};

// The squares a prop covers, after turning.
export function propSize(p){ const d = PROPS[p.k] || { w:1, h:1 }; return (p.rot || 0) % 2 ? { w:d.h, h:d.w } : { w:d.w, h:d.h }; }
export function propAt(f, x, y){
  for (let i = (f.props || []).length - 1; i >= 0; i--){ const p = f.props[i], s = propSize(p); if (x >= p.x && x < p.x + s.w && y >= p.y && y < p.y + s.h) return p; }
  return null;
}
