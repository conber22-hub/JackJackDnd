/* Blue Water Inn. Original layouts based on the room relationships in Chapter 5.
   Coordinates are shared across floors so the standard stair actions work. */
export const BLUE_WATER_INN = 'Blue Water Inn';
const porch = { outdoor:true, ground:'cobble', read:'A lamp burns by the door, even in daylight.' };
const yard = { outdoor:true, ground:'dirt' };
const W = 32, H = 32;
const ground = {
  W, H, name:BLUE_WATER_INN, out:[26, 16],
  rooms:[
    [24, 14, 5, 5, 'entrance', 'Front porch', 'Ask who came in behind the party. A watch patrol might stop here without coming inside.', porch],
    [13, 10, 10, 11, 'safe', 'Taproom', 'Danika Martikov tends the bar. The wolf hunters may offer news of the roads, and Rictavio may be holding court.', { read:'Firelight catches on the damp hems of coats hung beside the door. Someone has already set out clean cups.' }],
    [7, 11, 5, 7, 'chamber', 'Kitchen', 'Urwin Martikov does the cooking. An inquiry about deliveries can start here without the whole taproom hearing it.', { read:'A pot simmers at the hearth. The knife on the worktable has just been set down.' }],
    [14, 4, 7, 5, 'chamber', 'Wine store', 'Use the empty space by the casks to show the shortage before anyone brings it up. Restock the room if the party helps restore deliveries.'],
    [1, 9, 5, 7, 'chamber', 'Stable yard', 'The side gate gives delivery crews a way around the taproom.', yard],
    [2, 17, 5, 8, 'chamber', 'Stable', 'Rictavio stables Drusilla here. His painted wagon is kept at the Arasek Stockyard.'],
    [8, 20, 4, 4, 'chamber', 'Tack store', 'A peg for every bridle, with enough room to mend a broken strap.'],
  ],
  paths:[
    { pts:[22, 16, 24, 16] }, { pts:[11, 14, 13, 14] },
    { pts:[16, 8, 16, 10] }, { pts:[5, 13, 7, 13] },
    { pts:[4, 15, 4, 17] }, { pts:[6, 22, 8, 22] },
  ],
  doors:[[23, 16, 'closed'], [12, 14, 'closed'], [16, 9, 'closed'], [6, 13, 'closed'], [4, 16, 'closed'], [7, 22, 'closed']],
  props:[
    ['lantern', 27, 14], ['bench', 28, 16], ['lamppost', 2, 10],
    ['hearth', 13, 11], ['bar', 17, 10, 1], ['kegs', 21, 10],
    ['table', 16, 13], ['chair', 15, 13, 3], ['chair', 17, 13, 1],
    ['table', 19, 15], ['chair', 19, 14], ['chair', 19, 16, 2],
    ['longtable', 14, 18, 1], ['bench', 14, 17, 1], ['bench', 14, 19, 1],
    ['hearth', 7, 11], ['cauldron', 8, 12], ['table', 10, 12], ['shelf', 11, 16],
    ['barrel', 14, 4], ['barrel', 15, 4], ['barrel', 18, 4], ['kegs', 19, 6], ['crate', 15, 7],
    ['trough', 2, 18], ['trough', 6, 18], ['hay', 2, 23], ['hay', 6, 24],
    ['shelf', 8, 20], ['chest', 10, 23], ['woodpile', 1, 14],
  ],
};

const upper = {
  W, H, name:'Inn upper rooms',
  rooms:[
    [16, 19, 7, 3, 'chamber', 'Guest landing', 'The stair from the taproom opens onto the gallery.'],
    [21, 10, 2, 9, 'chamber', 'Taproom gallery', 'Voices from the taproom carry up here. Leave the space west of the gallery clear.'],
    [16, 8, 7, 2, 'chamber', 'Upper passage', 'Keep the guest doors and the service passage separate.'],
    [25, 9, 5, 5, 'safe', 'East guest room', 'The innkeeper can open this door for guests.'],
    [25, 15, 5, 5, 'safe', 'South guest room', 'An extra blanket has been left folded on the end of the bed.'],
    [16, 3, 7, 4, 'safe', 'Shared guest room', 'Set the beds aside for a group that wants to stay together.'],
    [10, 7, 4, 5, 'chamber', 'Rictavio’s room', 'A private room. A late arrival might hear him returning from the stable.'],
    [8, 13, 6, 3, 'chamber', 'Service passage', 'The concealed door at the east end opens back to the guest gallery.'],
    [7, 3, 6, 3, 'chamber', 'Boys’ room', 'A half-finished game has been left beside the toy chest.'],
    [8, 17, 5, 5, 'chamber', 'Martikov bedroom', 'The attic hatch is represented by the hidden access just south of the room. The concealed western door leads to the loft.'],
    [2, 17, 5, 7, 'chamber', 'Ravens’ loft', 'The loft overlooks the stable. The ravens have a good view of anyone crossing it.'],
    [8, 23, 3, 3, 'chamber', 'Private landing', 'Use the stairs here for the hatch to the attic.'],
  ],
  paths:[
    { pts:[22, 9, 22, 10] }, { pts:[22, 18, 22, 19] },
    { pts:[22, 11, 25, 11] }, { pts:[22, 17, 25, 17] }, { pts:[19, 6, 19, 8] },
    { pts:[13, 9, 16, 9] }, { pts:[15, 9, 15, 14, 13, 14] },
    { pts:[8, 5, 8, 13] }, { pts:[10, 15, 10, 17] },
    { pts:[6, 19, 8, 19] }, { pts:[9, 21, 9, 23] },
  ],
  doors:[
    [24, 11, 'locked'], [24, 17, 'locked'], [19, 7, 'locked'], [14, 9, 'locked'],
    [14, 14, 'secret'], [8, 6, 'closed'], [10, 16, 'closed'], [7, 19, 'secret'], [9, 22, 'secret'],
  ],
  props:[
    ['lantern', 16, 19], ['lantern', 21, 12],
    ['bed', 28, 9], ['chest', 29, 12], ['bed', 28, 15], ['chest', 29, 18],
    ['bed', 17, 3], ['bed', 19, 3], ['bed', 21, 3],
    ['bed', 10, 7], ['desk', 12, 11], ['chest', 10, 11],
    ['bed', 7, 3], ['bed', 12, 3], ['chest', 10, 4],
    ['bed', 12, 17], ['wardrobe', 8, 20],
    ['hay', 2, 17], ['hay', 2, 21], ['ravens', 3, 17], ['ravens', 5, 22],
  ],
};

const attic = {
  W, H, name:'Inn attic',
  rooms:[[8, 19, 5, 7, 'chamber', 'Attic', 'Keep this room behind the family’s concealed access. The little eave opening is for birds; heroes enter through the hatch.']],
  props:[['hay', 8, 19], ['hay', 12, 20], ['hay', 8, 22], ['chest', 11, 19], ['ravens', 12, 23]],
};

const floors = [
  { layout:ground, key:'ground', label:'Taproom and yard' },
  { layout:upper, key:'upper', label:'Guest gallery' },
  { layout:attic, key:'attic', label:'Ladder landing' },
];
const stairs = [[20, 19], [9, 24]];

// The template picker starts on floor zero. Go inside uses the engine’s usual top-first stack.
export function blueWaterInnPlan(topFirst = false){
  const ordered = topFirst ? [...floors].reverse() : floors;
  const landings = topFirst ? [...stairs].reverse() : stairs;
  return {
    name:BLUE_WATER_INN,
    order:ordered.map(f => f.key),
    floors:ordered.map(({ layout }, i) => ({
      ...layout, up:landings[i - 1], down:landings[i],
      exits:{ up:ordered[i - 1]?.label, down:ordered[i + 1]?.label },
    })),
  };
}
