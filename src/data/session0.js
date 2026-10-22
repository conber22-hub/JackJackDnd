/* SESSION 0 — THE SALT ROAD. Three hand-built floors (see layoutFloor in engine/generator.js):
   the Lantern & Ladle tavern, the village of Hollin's Ford, and the Old Salt Road out to where the salt
   carriage went over. Floors stack, so each floor's exit sits on the same square as the next floor's arrival.
   Rooms: [x, y, w, h, type, name, DM notes, { outdoor }] · paths: { w, pts } · doors: [x, y, state]
   buildings: solid houses on the village and road floors · props: [kind, x, y, quarter-turns] */
const tavern = {
  name:'The Lantern & Ladle',
  exits:{ down:'Out to Hollin\'s Ford' },
  rooms:[
    [8, 8, 17, 11, 'chamber', 'The Common Room', 'Low beams, a good fire, eleven regulars and a bland stew. Marta Holloway has cooked for three days without salt and everyone has noticed.'],
    [26, 8, 7, 6, 'chamber', 'Kitchen', 'The stew pot, a second hearth, and Marta\'s list pinned to a beam: SALT (2 sacks). SALT. SALT!!'],
    [26, 15, 7, 4, 'chamber', 'Larder', 'Two salt crocks, both scraped to the glaze. Hams going soft on their hooks. Without salt, the winter meat spoils in a week.'],
    [8, 20, 6, 4, 'chamber', 'The Snug', 'A private booth. A stranger in good grey wool has paid for it all evening and touched nothing but the wine. (See the session notes.)'],
    [15, 20, 11, 7, 'chamber', 'Stable Yard', 'Pim\'s empty salt cart waits by the trough. The gate to the village is on the south side.', { outdoor:true }],
    [27, 20, 6, 6, 'chamber', 'Stables', 'Two tired horses and Pim, the stable boy, who saw the carriage leave the coast-house a week ago. He is sure it was not late. He is sure it was taken.'],
  ],
  paths:[
    { w:1, pts:[24, 10, 26, 10] }, { w:1, pts:[29, 13, 29, 15] }, { w:1, pts:[10, 18, 10, 20] },
    { w:1, pts:[18, 18, 18, 20] }, { w:1, pts:[25, 22, 27, 22] },
  ],
  doors:[[25, 10, 'closed'], [29, 14, 'closed'], [10, 19, 'closed'], [18, 19, 'open'], [26, 22, 'open']],
  down:[20, 26],
  props:[
    ['hearth', 15, 8, 1], ['bar', 22, 10, 0], ['shelf', 24, 12, 0], ['kegs', 23, 16, 0], ['rug', 12, 12, 0],
    ['table', 10, 11], ['chair', 9, 11, 3], ['chair', 11, 11, 1], ['chair', 10, 10, 0],
    ['table', 13, 14], ['chair', 12, 14, 3], ['chair', 14, 14, 1], ['chair', 13, 15, 2],
    ['table', 10, 16], ['chair', 9, 16, 3], ['chair', 11, 16, 1],
    ['table', 17, 15], ['chair', 16, 15, 3], ['chair', 18, 15, 1], ['chair', 17, 16, 2],
    ['longtable', 18, 10, 1], ['bench', 18, 9, 1], ['bench', 18, 11, 1],
    ['stool', 21, 11], ['stool', 21, 12], ['stool', 21, 13], ['candelabra', 8, 8], ['candelabra', 24, 18], ['barrel', 8, 18], ['barrel', 9, 18],
    ['cauldron', 28, 9], ['hearth', 32, 9, 2], ['longtable', 28, 11, 1], ['sacks', 26, 13], ['barrel', 31, 13],
    ['saltcrock', 27, 15], ['saltcrock', 28, 15], ['shelf', 32, 16, 2], ['crate', 26, 18], ['sacks', 29, 18], ['barrel', 30, 18],
    ['table', 10, 21], ['chair', 9, 21, 3], ['chair', 11, 21, 1], ['candelabra', 13, 23], ['bench', 8, 22, 1],
    ['cart', 17, 22, 0], ['hay', 24, 20], ['hay', 25, 21], ['trough', 22, 24, 1], ['barrel', 15, 20], ['lamppost', 15, 26], ['fence', 19, 26, 0], ['fence', 21, 26, 0],
    ['hay', 31, 21], ['hay', 32, 24], ['trough', 28, 24, 1], ['sacks', 27, 21],
  ],
};

const village = {
  name:'Hollin\'s Ford',
  exits:{ up:'Into the Lantern & Ladle', down:'Take the Old Salt Road' },
  rooms:[
    [13, 16, 15, 12, 'chamber', 'Market Square', 'The well, two stalls and too many people standing about. Everyone has a theory about the salt carriage. Use the rumour list.', { outdoor:true }],
    [15, 1, 11, 5, 'shrine', 'Chapel of the Morning Lord', 'Brother Tamsin blesses the road every season. This season he will bless a pouch of salt for each hero who asks — "salt keeps what is good from going bad."'],
    [2, 25, 6, 5, 'chamber', 'Brask Cottage', 'Ilka Brask, the teamster\'s wife, and their two boys. Aldo has driven the coast road for twenty years and is never late. She has kept his supper warm three nights running.'],
    [30, 24, 7, 6, 'chamber', 'Smithy', 'Old Hendry will lend a crowbar and a lantern. He shod the carriage horses himself and swears they could outrun wolves.'],
    [30, 13, 7, 6, 'chamber', 'Halloran\'s Provisions', 'Rope, oil, rations, torches. Not a grain of salt to sell. Halloran is quietly furious: he paid for half the load in advance.'],
  ],
  paths:[
    { w:3, pts:[20, 15, 20, 8] }, { w:1, pts:[20, 8, 20, 6] },
    { w:3, pts:[28, 21, 37, 21] },
    { w:3, pts:[12, 22, 3, 22] }, { w:1, pts:[5, 23, 5, 25] },
    { w:1, pts:[33, 22, 33, 24] }, { w:1, pts:[33, 18, 33, 20] },
  ],
  doors:[[20, 6, 'closed'], [5, 24, 'closed'], [33, 23, 'open'], [33, 19, 'closed']],
  down:[37, 21],
  buildings:[
    { x:15, y:28, w:11, h:6, name:'The Lantern & Ladle', door:'n', tall:true },
    { x:9, y:9, w:5, h:4, name:'Weaver\'s house', door:'e' },
    { x:9, y:13, w:4, h:4, name:'The Reeve\'s house', door:'e' },
    { x:22, y:9, w:5, h:5, name:'Cooper\'s yard', door:'w' },
    { x:2, y:17, w:4, h:4, name:'Cottage', door:'s' },
    { x:7, y:17, w:4, h:4, name:'Cottage', door:'s', dark:true },
    { x:9, y:24, w:4, h:4, name:'Cottage', door:'n' },
    { x:29, y:7, w:6, h:5, name:'Mill house', door:'s', dark:true },
  ],
  props:[
    ['well', 19, 20], ['stall', 14, 17, 0], ['stall', 24, 17, 0], ['stall', 14, 25, 2], ['cart', 26, 23, 0], ['hay', 26, 26],
    ['barrel', 27, 16], ['crate', 13, 16], ['lamppost', 13, 21], ['lamppost', 27, 22], ['signpost', 36, 20], ['milestone', 38, 22],
    ['trough', 28, 20, 1], ['bench', 17, 23, 1], ['sacks', 22, 25],
    ['altar', 19, 2, 1], ['bench', 16, 4, 1], ['bench', 22, 4, 1], ['candelabra', 16, 1], ['candelabra', 24, 1],
    ['table', 4, 27], ['chair', 3, 27, 3], ['bed', 7, 26, 0], ['hearth', 2, 25, 0], ['cauldron', 3, 28],
    ['anvil', 31, 26, 0], ['barrel', 35, 25], ['trough', 35, 27, 0], ['crate', 34, 28],
    ['shelf', 30, 13, 0], ['shelf', 36, 13, 2], ['crate', 32, 15], ['barrel', 34, 15], ['sacks', 31, 17], ['table', 34, 17],
    ['bush', 13, 27], ['bush', 27, 27], ['gravestone', 16, 5], ['gravestone', 24, 5],
  ],
};

const road = {
  name:'The Old Salt Road',
  exits:{ up:'Back to Hollin\'s Ford' },
  rooms:[
    [29, 9, 7, 6, 'shrine', 'Wayshrine Clearing', 'A roadside shrine to travellers, and the empty toll hut. Fresh cart ruts lead west — and a second set, narrower, that no one in the village can explain.', { outdoor:true }],
    [3, 20, 10, 9, 'lair', 'Where the Carriage Went Over', 'The carriage lies on its side. Both horses are dead — not eaten, bled. The salt sacks are split and the salt has burned a white ring into the mud that nothing has crossed. Aldo Brask is gone. His lantern is still lit.', { outdoor:true }],
    [3, 1, 9, 3, 'chamber', 'The Mist Wall', 'The road runs on into fog the colour of old pewter. The air smells like a church after the candles are put out. Past here the road is not this road any more.', { outdoor:true }],
  ],
  paths:[
    { w:3, pts:[37, 21, 28, 21, 28, 30, 9, 30] },
    { w:2, pts:[32, 19, 32, 15] },
    { w:2, pts:[7, 19, 7, 8] }, { w:1, pts:[7, 8, 7, 4] },
  ],
  buildings:[{ x:30, y:6, w:4, h:3, name:'Toll hut', door:'s', dark:true, noChimney:true }],
  props:[
    ['milestone', 36, 22], ['signpost', 29, 23], ['log', 27, 25, 0], ['boulder', 29, 28], ['stump', 24, 31], ['deadtree', 20, 29], ['bush', 14, 31],
    ['shrine', 32, 10], ['bench', 30, 12, 1], ['boulder', 35, 13], ['stump', 29, 14],
    ['wreck', 5, 22], ['horse', 10, 22, 0], ['horse', 8, 26, 1], ['saltspill', 3, 25], ['wheel', 11, 26], ['crate', 4, 21], ['sacks', 12, 27], ['lantern', 9, 21],
    ['boulder', 8, 12], ['deadtree', 10, 3], ['deadtree', 4, 2],
  ],
};

export const SALT_ROAD = { tavern, village, road };
