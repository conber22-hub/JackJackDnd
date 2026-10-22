/* OBJECTS — what the heroes can do to the furniture: open it, pick its lock, push it, topple it, smash it.
   Numbers follow the SRD 5.2 rules for objects: Armor Class by what it's made of, Hit Points by its size
   (resilient things have more), and a Strength (Athletics) check to shift something heavy.
     m:    material → AC (MAT_AC)          sz: T(iny) S(mall) M(edium) L(arge) → HP (OBJ_HP)    frail: the fragile column
     move: light (no check) · medium (DC 10) · heavy (DC 15) · fixed (won't budge)
     open: it opens (lid, doors, drawer); heavy: lifting the lid is a Strength check of that DC
     tall: it can be toppled; len: how many squares it reaches once down; fall: the damage it does
     lockable: the dresser sometimes locks it
   Props not listed here (rugs aside) are scenery: puddles, cobwebs, rails, mist, trees, buildings' bits. */
export const MAT_AC = { cloth:11, glass:13, wood:15, bone:15, stone:17, iron:19 };
export const OBJ_HP = { T:[2, 5], S:[3, 10], M:[4, 18], L:[5, 27] };   // [fragile, resilient]
export const MOVE_DC = { light:0, medium:10, heavy:15 };

export const OBJECTS = {
  // tavern & house
  table:      { m:'wood', sz:'M', move:'light' },
  longtable:  { m:'wood', sz:'L', move:'medium' },
  chair:      { m:'wood', sz:'S', move:'light', frail:true },
  bench:      { m:'wood', sz:'M', move:'light' },
  stool:      { m:'wood', sz:'S', move:'light', frail:true },
  bar:        { m:'wood', sz:'L', move:'fixed' },
  shelf:      { m:'wood', sz:'L', move:'heavy', tall:true, len:2, fall:'2d6' },
  hearth:     { m:'stone', sz:'L', move:'fixed' },
  cauldron:   { m:'iron', sz:'M', move:'medium' },
  saltcrock:  { m:'glass', sz:'S', move:'medium', frail:true },
  bed:        { m:'wood', sz:'L', move:'medium' },
  candelabra: { m:'iron', sz:'M', move:'light', tall:true, len:1, fall:'1d4' },
  barrel:     { m:'wood', sz:'M', move:'medium', open:'lid' },
  kegs:       { m:'wood', sz:'L', move:'heavy' },
  crate:      { m:'wood', sz:'M', move:'medium', open:'lid' },
  sacks:      { m:'cloth', sz:'M', move:'medium', frail:true },
  rug:        { m:'cloth', sz:'L', move:'fixed', flat:true },
  // village & road
  stall:      { m:'wood', sz:'L', move:'heavy' },
  cart:       { m:'wood', sz:'L', move:'light' },
  hay:        { m:'cloth', sz:'M', move:'medium', frail:true },
  fence:      { m:'wood', sz:'M', move:'fixed', frail:true },
  trough:     { m:'wood', sz:'L', move:'heavy' },
  gravestone: { m:'stone', sz:'M', move:'fixed' },
  shrine:     { m:'stone', sz:'M', move:'fixed' },
  anvil:      { m:'iron', sz:'L', move:'fixed' },
  wheel:      { m:'wood', sz:'M', move:'light', frail:true },
  stump:      { m:'wood', sz:'M', move:'fixed' },
  boulder:    { m:'stone', sz:'L', move:'heavy' },
  log:        { m:'wood', sz:'L', move:'heavy' },
  milestone:  { m:'stone', sz:'M', move:'fixed' },
  lantern:    { m:'glass', sz:'T', move:'light', frail:true },
  scarecrow:  { m:'cloth', sz:'M', move:'fixed', frail:true },
  boat:       { m:'wood', sz:'L', move:'heavy' },
  stone:      { m:'stone', sz:'L', move:'fixed' },
  // manor & castle
  bookshelf:  { m:'wood', sz:'L', move:'heavy', tall:true, len:2, fall:'2d6' },
  wardrobe:   { m:'wood', sz:'L', move:'heavy', tall:true, len:2, fall:'2d6', open:'doors', lockable:true },
  desk:       { m:'wood', sz:'M', move:'medium', open:'drawer', lockable:true },
  cradle:     { m:'wood', sz:'S', move:'light', frail:true },
  dollhouse:  { m:'wood', sz:'S', move:'light', open:'front', frail:true },
  throne:     { m:'stone', sz:'L', move:'heavy' },
  banner:     { m:'cloth', sz:'M', move:'light', tall:true, len:2, fall:'1d4' },
  armor:      { m:'iron', sz:'M', move:'medium', tall:true, len:1, fall:'1d6' },
  pew:        { m:'wood', sz:'L', move:'heavy' },
  organ:      { m:'wood', sz:'L', move:'fixed' },
  // dungeon & mine
  statue:     { m:'stone', sz:'L', move:'heavy', tall:true, len:2, fall:'3d6' },
  sarcophagus:{ m:'stone', sz:'L', move:'fixed', open:'lid', heavy:15 },
  cage:       { m:'iron', sz:'M', move:'heavy', open:'door', lockable:true },
  rack:       { m:'wood', sz:'L', move:'heavy' },
  chest:      { m:'wood', sz:'S', move:'medium', open:'lid', lockable:true },
  altar:      { m:'stone', sz:'L', move:'fixed' },
  coffin:     { m:'wood', sz:'M', move:'heavy', open:'lid', heavy:10 },
  pillar:     { m:'stone', sz:'L', move:'fixed' },
  brazier:    { m:'iron', sz:'M', move:'medium', tall:true, len:1, fall:'1d6 fire' },
  minecart:   { m:'iron', sz:'M', move:'light' },
  beam:       { m:'wood', sz:'L', move:'fixed' },
};

// Props that never block a pushed piece: you can shove a crate across a rug or a puddle.
export const FLAT = new Set(['rug', 'puddle', 'rails', 'cobweb', 'mist', 'bones', 'fungus', 'bloomgrowth', 'saltspill', 'bridge']);

// What a toppled or smashed piece leaves behind, by what it was made of (the broken pieces' colours in render/props.js).
export const DEBRIS = {
  wood:'Splintered wood and bent nails.', stone:'Broken stone and grit.', iron:'Twisted iron.', glass:'Shards and a spreading stain.',
  cloth:'Torn cloth and spilled straw.', bone:'Bone splinters.',
};

// Hidden compartments the dresser tucks into furniture (found with Search). Original text; swap in your own.
export const STASHES = {
  bookshelf:['A hollowed-out book, and inside it {coins}.', 'Behind the back row, a bundle of letters in a cipher.', 'A slim volume that is not a book: a box, holding a silver key.'],
  desk:['A false bottom in the drawer: a deed to a house in Vallaki, and {coins}.', 'A secret drawer with a dried rose and a lock of dark hair.', 'Taped under the desk: a page torn from a diary.'],
  wardrobe:['A panel at the back lifts out: a pistol-sized crossbow and six bolts.', 'Sewn into a coat lining: {coins}.', 'A hatbox with a false base, holding a vial of holy water.'],
  chest:['A false bottom, and beneath it {coins}.', 'A second lid inside the lid: a letter of credit, long void.', 'Under the lining, a small silver mirror wrapped in black silk.'],
  coffin:['A cavity in the pillow: {coins} and a wedding ring.', 'Scratched inside the lid where only the dead could read it: a name, and a date next year.'],
  rug:['Under the rug, a loose board, and beneath it {coins}.', 'Under the rug, chalk lines: a protective circle, half rubbed out.', 'A trapdoor ring set flush in the floor, rusted shut. DM: what lies below is yours to decide.'],
  altar:['A stone in the base slides out: a reliquary with a fingerbone, warm to the touch.', 'Behind a loose panel, {coins} in offering-bags.'],
  crate:['Under the straw, packed in sawdust: three flasks of oil and a tinderbox.', 'Nailed under the lid: a smuggler\'s ledger.'],
  barrel:['The barrel has a false bottom: {coins} in an oilskin pouch.'],
  sarcophagus:['A loose stone in the base: a jewelled dagger (worth 50 gp).'],
};
