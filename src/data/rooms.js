/* Room types (DM-only colours) and the names the generator draws from. */
export const ROOM_TYPES = {
  chamber:  { label:'Chamber',      color:'#6a625c' },
  entrance: { label:'Stair Landing',color:'#d6a85e' },
  safe:     { label:'Sanctuary',    color:'#4fb3ad' },
  trap:     { label:'Trap',         color:'#d0393b' },
  treasure: { label:'Treasure',     color:'#e8b938' },
  lair:     { label:'Lair',         color:'#9b6be0' },
  shrine:   { label:'Shrine',       color:'#d6d9e4' },
  crypt:    { label:'Crypt',        color:'#78a275' },
  nest:     { label:'Seep Nest',    color:'#a6d13a' },
};

export const ROOM_NAMES = {
  chamber:['Collapsed Vestry','Bone-Dust Hall','Pillared Gallery','Drip Chamber','Weeping Antechamber','Split Nave','Ore Cart Junction','Hollow Refectory','Choir Loft','Flooded Cloister'],
  entrance:['Stair Landing','Spiral Descent','The Long Stair','Broken Landing'],
  safe:['Candle Chapel','Salt-Ringed Cell','Saint\'s Alcove','Dry Cistern'],
  trap:['Hinged Floor Hall','Silver-Wire Passage','Drowning Room','The Grinding Gallery','Collapsing Shaft','Spore-Vent Gallery'],
  treasure:['Reliquary Vault','Paymaster\'s Strongroom','Silver Seam','Tithe Cache'],
  lair:['Gnawing Den','Ossuary Nest','The Wet Throne','Feeding Pit','Husk Muster'],
  shrine:['Shrine of the Font','Andral\'s Ossuary','Votive Hall','Altar of Bones'],
  crypt:['Sealed Crypt','Family Niches','Pauper\'s Ossuary','Abbot\'s Tomb'],
  nest:['Seep Pool','Membrane Hall','Budding Chamber','The Rot-Font','Gestation Vault','Spore Gallery'],
};

/* Traps that fire when a creature steps on them.
   save: ability (or 'none') · dc: save DC · find: DC to spot or disarm · dice/type: damage · rad: squares around the tile
   cond: condition on a failed save · fx: extra effects (same fx language as the bestiary, plus 'pit' = fall a floor) */
export const TRAP_KINDS = {
  pit:     { n:'Hinged Floor',      icon:'⇣', save:'dex', dc:14, find:14, dice:'2d6',  type:'bludgeoning', rad:0, fx:['pit'],
             f:'The flagstone tips on a hinge. Below it is the floor below.' },
  wire:    { n:'Silver Wire',       icon:'⌇', save:'dex', dc:13, find:15, dice:'3d6',  type:'slashing',    rad:0,
             f:'A hair-thin silver wire, strung at throat height, sings as it cuts.' },
  spore:   { n:'Spore Vent',        icon:'☁', save:'con', dc:13, find:13, dice:'2d8',  type:'poison',      rad:1, cond:'poisoned', fx:['spawn:seepling:1d2'],
             f:'A membrane blister underfoot pops. The air goes green and something small falls out.' },
  font:    { n:'Drowning Font',     icon:'≋', save:'str', dc:14, find:12, dice:'2d6',  type:'bludgeoning', rad:1, cond:'restrained',
             f:'The floor drains into a font that was never there. The water pulls.' },
  grinder: { n:'Bone Grinder',      icon:'⚙', save:'dex', dc:15, find:14, dice:'4d8',  type:'piercing',    rad:0,
             f:'The walls are teeth. They close.' },
  bell:    { n:'Tolling Bell',      icon:'🔔', save:'none',dc:0,  find:12, dice:'0',    type:'thunder',     rad:0, fx:['dread+1','alert'],
             f:'A tripwire, a pulley, and somewhere far off a bell begins to ring. Everything down here heard it.' },
  hands:   { n:'Grasping Floor',    icon:'✋', save:'str', dc:13, find:13, dice:'1d6',  type:'bludgeoning', rad:1, cond:'grappled', fx:[],
             f:'Pale fingers push up between the flagstones and close.' },
  collapse:{ n:'Collapsing Shaft',  icon:'▼', save:'dex', dc:15, find:15, dice:'4d10', type:'bludgeoning', rad:1,
             f:'Timber screams. The ceiling comes down in a single piece.' },
};

/* Door states: open (passable, see through) · closed (passable, opens as you walk in, blocks sight)
   locked (blocks until picked or forced) · secret (looks like wall to players until found) */
export const DOOR_STATES = {
  open:   { label:'Open',   color:'#8b6a3e' },
  closed: { label:'Closed', color:'#6b4a2a' },
  locked: { label:'Locked', color:'#c8cbd6' },
  secret: { label:'Secret', color:'#9b77dc' },
};
