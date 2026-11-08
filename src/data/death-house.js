/* Original VTT floor plans based on the room sequence of Death House.
   Layout order follows the expedition, so the normal stair action advances
   through the upper storeys before the concealed descent from the attic. */
const stair = {
  first:[19, 16], second:[19, 14], attic:[9, 8],
  dungeon:[18, 23], ritual:[18, 28],
};
const path = (...pts) => ({ pts });
const room = (x, y, w, h, name, notes, type = 'chamber', read) =>
  [x, y, w, h, type, name, notes, read ? { read } : {}];

const ground = {
  name:'Durst House · Ground Floor',
  next:stair.first,
  exits:{ down:'Continue upstairs' },
  rooms:[
    room(13, 25, 5, 3, 'Portico', 'Use Rose and Thorn’s plea on the street here. Their story gives the party a reason to enter.', 'entrance', 'Two hooks flank the door. One still holds a child’s coat.'),
    room(13, 21, 5, 3, 'Foyer', 'The Durst crest makes the windmill a recurring clue.'),
    room(8, 21, 4, 3, 'Cloakroom', 'The coats look ready for an outing that never happened.'),
    room(10, 15, 12, 5, 'Main Hall', 'Give them time to examine the carved panelling before the house starts answering back.', 'chamber', 'Every polished board shines. The flowers in the carvings turn their faces toward the stairs.'),
    room(3, 14, 6, 6, 'Den of Wolves', 'This is the return point if the DM uses the one-way escape hatch from below.'),
    room(23, 14, 6, 5, 'Kitchen', 'The service lift is a scene detail. Resolve an attempt to use it from the book.'),
    room(24, 9, 5, 4, 'Pantry', 'Fresh-looking food sits beside completely dry jars.'),
    room(12, 6, 9, 8, 'Dining Room', 'The place settings suggest the family is due home at any minute.'),
  ],
  paths:[
    path(15,25,15,23), path(11,22,13,22), path(15,21,15,19), path(8,17,10,17),
    path(21,17,23,17), path(26,14,26,12), path(16,15,16,13),
  ],
  doors:[[15,24], [12,22], [9,17], [22,17], [26,13], [16,14]],
  props:[
    ['hearth',10,15], ['banner',13,21], ['shelf',8,21], ['hearth',3,14],
    ['rug',5,15], ['chair',7,18], ['table',6,18], ['chest',4,19],
    ['hearth',28,14], ['table',25,15], ['shelf',28,17], ['sacks',24,9], ['barrel',28,9],
    ['longtable',15,9,1], ['chair',14,9], ['chair',17,9], ['chair',15,8], ['chair',16,10],
    ['hearth',12,6], ['candelabra',20,6],
  ],
};

const first = {
  name:'Durst House · Library Storey',
  next:stair.second,
  exits:{ up:'Main hall', down:'Continue upstairs' },
  rooms:[
    room(10, 13, 12, 6, 'Upper Hall', 'The family portrait shows a baby in Gustav’s arms. Let the players notice where Elisabeth is looking.', 'entrance', 'The painted family looks over the landing. Only the infant is asleep.'),
    room(3, 12, 6, 6, 'Library', 'The desk holds the key to the children’s room. Use the book to adjudicate finding and using it.'),
    room(3, 7, 6, 4, 'Hidden Study', 'This is where the party can find Strahd’s letter and learn what the cult meant to him. Read the letter from the book. It can prompt the attic reveal later.'),
    room(23, 12, 6, 5, 'Servants’ Room', 'The uniforms are in order. There is nobody here to wear them.'),
    room(12, 5, 9, 7, 'Conservatory', 'A whisper carries through the music room even when nobody touches the keys.'),
  ],
  paths:[path(8,15,10,15), path(6,12,6,10), path(21,15,23,15), path(16,13,16,11)],
  doors:[[9,15], [6,11,'secret'], [22,15], [16,12]],
  props:[
    ['armor',11,13], ['armor',21,17], ['hearth',13,17],
    ['desk',6,15], ['chair',5,15], ['bookshelf',3,12], ['bookshelf',3,15],
    ['bookshelf',7,12], ['chest',4,8], ['bones',7,8], ['shelf',3,9],
    ['bed',26,12], ['bed',28,12], ['chest',26,14], ['wardrobe',28,16],
    ['organ',12,5], ['rug',16,7], ['chair',19,6], ['candelabra',20,5],
  ],
};

const second = {
  name:'Durst House · Bedrooms',
  next:stair.attic,
  exits:{ up:'Upper hall', down:'Continue upstairs' },
  rooms:[
    room(15, 12, 8, 5, 'Balcony Hall', 'Place the animated armour here when the party reaches this landing.', 'entrance'),
    room(16, 5, 7, 6, 'Durst Bedroom', 'Everything is scaled for comfort except the space between the two sides of the bed.'),
    room(17, 1, 5, 3, 'Rear Balcony', 'The mists swallow any view down to the street.'),
    room(24, 12, 5, 5, 'Bathroom', 'Something drips, but the floor under the basin is dry.'),
    room(24, 19, 4, 4, 'Linen Closet', 'Draw attention to the corner that no one has dusted.'),
    room(7, 11, 7, 7, 'Nursemaid’s Room', 'The mirror conceals the stair to the attic. The specter belongs at the nursery threshold.'),
    room(7, 19, 6, 4, 'Nursery', 'Walter’s crib gives the party the second half of the story the children told outside.', 'chamber', 'A blanket lies folded in the cradle. The fold rises a little, then settles.'),
    room(3, 12, 3, 5, 'Front Balcony', 'From here the portico looks impossibly far away.'),
    room(8, 7, 3, 3, 'Stair Alcove', 'The stair behind the mirror ends in the attic.'),
  ],
  paths:[
    path(19,12,19,10), path(19,5,19,3), path(22,14,24,14), path(21,16,21,20,24,20),
    path(15,14,13,14), path(10,17,10,19), path(5,14,7,14), path(9,11,9,9),
  ],
  doors:[[19,11], [19,4], [23,14], [23,20], [14,14], [10,18], [6,14], [9,10,'secret']],
  props:[
    ['armor',22,12], ['hearth',16,5], ['bed',20,6], ['wardrobe',22,9],
    ['trough',28,15], ['chest',24,21], ['cobweb',27,19],
    ['bed',8,13], ['wardrobe',12,11], ['chair',12,15], ['cobweb',7,16],
    ['cradle',9,20], ['cobweb',12,22], ['cobweb',8,8],
  ],
};

const attic = {
  name:'Durst House · Attic',
  next:stair.dungeon,
  exits:{ up:'Return to the house', down:'Continue' },
  rooms:[
    room(8, 7, 5, 4, 'Attic Landing', 'Let the sound from below stop while the party is still on the stairs.', 'entrance'),
    room(10, 12, 12, 3, 'Attic Hall', 'The dust is old enough to have its own layers.'),
    room(14, 7, 4, 4, 'Spare Bedroom', 'The bedding has never been turned down.'),
    room(19, 7, 5, 4, 'Spare Room', 'A chair and a chest have been dragged away from the light.'),
    room(9, 16, 6, 5, 'Storage Room', 'The nursemaid’s remains are here. Check the book before using her specter here and in the nursery.'),
    room(17, 16, 6, 5, 'Children’s Room', 'Rose and Thorn are here. The dollhouse shows what the walls have been hiding.', 'chamber', 'The toy house is this house, down to the door you just opened. In miniature, it has one more door.'),
    room(17, 22, 4, 3, 'Spiral Shaft', 'Use the appendix’s reveal cues. Change the adjoining secret door to closed or open from the DM controls once the house lets the way appear.'),
  ],
  paths:[
    path(10,10,10,12), path(16,10,16,12), path(20,10,20,12), path(12,14,12,16),
    path(19,14,19,16), path(18,20,18,22),
  ],
  // Ordinary searching cannot make this door appear before the DM’s story cue.
  doors:[[16,11], [20,11], [12,15], [19,15,'locked'], [18,21,'secret',Number.MAX_SAFE_INTEGER]],
  props:[
    ['cobweb',8,7], ['cobweb',21,12], ['bed',14,7], ['chest',16,9], ['chair',22,8],
    ['crate',9,17], ['crate',10,18], ['bones',13,19], ['cobweb',14,20],
    ['bed',17,17], ['bed',22,17], ['chest',22,19], ['dollhouse',21,20], ['bones',19,18], ['cobweb',17,20],
  ],
};

const crypts = {
  name:'Death House · Family Crypts',
  next:stair.ritual,
  exits:{ up:'Spiral stairs', down:'Lower chambers' },
  rooms:[
    room(16, 21, 5, 4, 'Spiral Stair Foot', 'Describe the chanting here. The words only become clear as they get closer.', 'entrance', 'One voice goes quiet as your foot meets the earth. The others keep time.'),
    room(16, 12, 5, 8, 'Crypt Passage', 'The family names give the party a way to connect these graves with the rooms above.'),
    room(10, 12, 4, 3, 'Rose’s Crypt', 'If the party brings Rose here, consult the book for laying her to rest.', 'crypt'),
    room(10, 16, 4, 3, 'Thorn’s Crypt', 'Thorn’s name is the one the party heard in the street.', 'crypt'),
    room(10, 20, 4, 3, 'Empty Crypt', 'Dust here has been disturbed beside the blank stone.', 'crypt'),
    room(23, 12, 4, 3, 'Gustav’s Crypt', 'The family has a place for Gustav. He is elsewhere.', 'crypt'),
    room(23, 16, 4, 3, 'Elisabeth’s Crypt', 'The stonework is alive with a small, dry sound.', 'crypt'),
    room(23, 20, 4, 3, 'Walter’s Crypt', 'The baby’s name is already here.', 'crypt'),
    room(14, 4, 8, 7, 'Cult Dining Hall', 'Echo the table upstairs. Down here the chairs have been pushed back in a hurry.'),
    room(23, 4, 6, 6, 'Well and Quarters', 'Use the water and sleeping spaces to suggest how long the cult lived beneath the house.'),
    room(8, 5, 5, 5, 'Initiates’ Quarters', 'The bare furnishings show how many people kept this place secret.'),
    room(3, 5, 4, 5, 'Larder', 'Pick one thing on the shelves the party thought they saw upstairs.'),
    room(14, 26, 8, 4, 'Darklord’s Shrine', 'The cult worshipped the Count. The letter upstairs tells the party what he thought of them.', 'shrine'),
    room(23, 26, 6, 4, 'Durst Quarters', 'The Dursts can surface here when the party disturbs what they kept.', 'lair'),
  ],
  paths:[
    path(18,21,18,19), path(18,12,18,10), path(13,13,16,13), path(13,17,16,17), path(13,21,16,21),
    path(20,13,23,13), path(20,17,23,17), path(20,21,23,21),
    path(21,7,23,7), path(12,7,14,7), path(6,7,8,7), path(19,24,19,26), path(21,27,23,27),
  ],
  doors:[[14,13], [14,17], [14,21], [22,13], [22,17], [22,21], [22,7], [13,7], [7,7], [22,27,'secret']],
  traps:[[18,11,'pit']],
  props:[
    ...[12,16,20].flatMap(y=>[['sarcophagus',10,y],['sarcophagus',26,y]]).filter(([,x,y])=>x!==10||y!==20),
    ['longtable',17,6,1], ['bones',15,9], ['stool',16,6], ['well',26,5],
    ['bedroll',24,8], ['bedroll',27,8], ['bedroll',8,6], ['chest',9,8], ['shelf',3,5], ['bones',5,8],
    ['statue',15,27], ['altar',16,26], ['bones',21,28], ['chest',26,27], ['wardrobe',28,26],
  ],
};

function lower(bloom) {
  const shallow = [];
  for (let y=5; y<15; y++) for (let x=12; x<24; x++){
    if (x<16 || x>20 || y<8 || y>11) shallow.push([x,y]);
  }
  return {
    name:bloom ? 'Death House · Bloom Nest' : 'Death House · Ritual Vault',
    exits:{ up:'Family crypts' },
    rooms:[
      room(16, 25, 5, 5, 'Lower Stair', 'The chanting resolves into words as the party reaches the reliquary.', 'entrance'),
      room(15, 18, 8, 6, 'Reliquary', 'Put one relic from the book in their path. Let its banality make the cult’s devotion worse.'),
      room(24, 18, 5, 5, 'Prison', 'Resolve the book’s hidden escape hatch as a one-way DM move to the Den of Wolves.'),
      room(11, 4, 14, 12, 'Ritual Chamber', bloom
        ? 'Keep the cult’s demand in the scene. The Bloom Vessel and its nest are the campaign’s replacement encounter.'
        : 'Run the cult’s demand and its consequences from Appendix B. Let the party decide how to answer.', bloom ? 'nest' : 'lair',
        'The water carries the echo of a hundred voices. The moment you see the altar, they all draw breath.'),
      room(5, 7, 5, 6, 'Refuse Alcove', bloom
        ? 'Something heavier than the Vessel moves here if the party overwhelms the nest.'
        : 'Lorghoth waits among the refuse. The DM decides when it moves.', 'lair'),
    ],
    paths:[path(18,25,18,23), path(22,20,24,20), path(18,15,18,18), path(9,10,11,10)],
    doors:[[23,20], [18,16,'locked']],
    shallow,
    props:[
      ['shelf',15,18], ['shelf',22,21], ['cage',28,18], ['bones',26,21],
      ['altar',17,9,1], ['pillar',13,6], ['pillar',22,6], ['pillar',13,13], ['pillar',22,13],
      ['bones',8,8], ['rubble',5,9],
      ...(bloom ? [['bloomgrowth',14,7], ['bloomgrowth',21,11], ['bloomgrowth',7,11]] : [['bones',6,11]]),
    ],
  };
}

export function deathHouseFloors(bloom = false){
  return [
    ...[ground,first,second,attic].map(layout => ({theme:'durst-house',layout})),
    {theme:'durst-crypt',layout:crypts},
    {theme:bloom?'womb':'durst-crypt',layout:lower(bloom)},
  ];
}
