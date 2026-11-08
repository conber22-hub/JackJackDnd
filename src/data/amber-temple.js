/* An original, compressed two-floor plan for Chapter 13. North is at the
   top. The app's paired stair tiles represent the main overlook descent. */
const path = (...pts) => ({ pts });
const descent = [16, 16];
const upper = {
  name:'Amber Temple · Upper Galleries',
  next:descent,
  exits:{ down:'Temple floor' },
  rooms:[
    [13,25,7,5,'entrance','Mountain Facade','Begin on the Mount Ghakis approach. Use the chapter’s cold rules if the party arrives unprepared.', {outdoor:true,ground:'cobble',read:'Snow sweeps past the entrance. The figures carved into the rock have worn smooth everywhere except their hands.'}],
    [14,19,5,5,'chamber','Entrance Hall','The sound of boots carries from here to the overlook.'],
    [13,15,7,3,'chamber','Overlook','Describe the great statue below. Neferon and the flameskulls can use the book’s sightlines and ambush positions.', {read:'The broken railing ends under your hand. A figure waits at the far end of the hall below. When you move the light, its face stays black.'}],
    [4,12,5,8,'chamber','Upper West Hall','The west side gives the party a route around the overlook.'],
    [2,22,6,5,'chamber','West Barracks','Beds have been pushed against the wall to make room for whoever shelters here.'],
    [23,12,5,8,'chamber','Upper East Hall','Describe arrow slits facing the great chamber. The balcony void is represented by the gap between wings.'],
    [24,23,5,4,'chamber','East Barracks','A frozen boot still stands upright beside a bare bunk.'],
    [10,6,12,2,'chamber','North Gallery','It is quieter here. You can hear each member of the party breathe.'],
    [23,5,6,5,'chamber','Upper East Landing','Use this landing for the optional eastern stair from the book if needed.'],
    [24,1,5,3,'chamber','Watch Room','Someone dragged a chair away from its original watch position.'],
    [3,3,6,3,'lair','Exethanter’s Rooms','Begin with the lich’s failing memory. Recovering it can change what the party learns about Strahd and how they pass the temple’s doors.'],
    [2,7,3,3,'chamber','Concealed Chamber','Consult area X28 for what Exethanter hides here.'],
    [12,1,9,4,'chamber','Amber Library','Consult area X30 for the books and the secondary spiral descent into the Amber Vault.'],
  ],
  paths:[
    path(16,25,16,23),path(16,19,16,17),path(14,21,7,21,7,19),path(18,21,25,21,25,19),
    path(5,22,5,19),path(25,23,25,21),
    path(8,12,8,7,10,7),path(21,7,23,7),path(24,9,24,12),path(26,5,26,3),
    path(7,5,7,7,8,7),path(3,5,3,7),path(16,4,16,6),
  ],
  doors:[[5,21],[25,22],[26,4,'locked'],[7,6,'secret'],[3,6,'secret'],[16,5]],
  props:[
    ['statue',13,26],['statue',19,26],['rubble',14,17],['rubble',13,15],
    ['bench',4,22],['bedroll',3,25],['crate',26,25],['rubble',27,14],
    ['chair',24,2],['rug',4,3],['candelabra',8,3],['chest',4,9],
    ['bookshelf',12,1],['bookshelf',20,1],['bookshelf',20,3],['desk',14,2],['chair',15,2],
  ],
};

const lower = {
  name:'Amber Temple · Vaults and Catacombs',
  up:descent,
  exits:{ up:'Overlook' },
  rooms:[
    [11,8,11,14,'entrance','Temple of Lost Secrets','Neferon guards the temple from the statue. Use Chapter 13 for his actual perch, lines of sight and cover.', {read:'At floor level the statue seems taller. The hollow where its face should be turns the light back on you.'}],
    [5,10,5,12,'chamber','Lower West Hall','The fallen stone suggests a way round the guarded nave.'],
    [1,13,3,5,'crypt','West Vestige Vault','Run these sarcophagi from the book. Let the DM share the first offer privately with the character who touches the amber.'],
    [23,11,6,12,'chamber','Lower East Hall','The witches are working on the amber doors. Use the book to stage their response to the party.'],
    [23,5,6,5,'chamber','East Landing','The original temple has more ways up than the engine’s paired stairs can represent.'],
    [24,24,5,5,'crypt','East Vestige Vault','Describe the sealed amber before revealing anything that answers from inside.'],
    [12,23,10,6,'crypt','Catacombs','Show what the temple kept of its first defenders.'],
    [4,24,6,5,'chamber','West Annex','Several niches have already been broken open.'],
    [12,1,10,5,'crypt','Amber Vault','West: Vampyr. South: Tenebrous. East: Zhudun. Run their offers and consequences from Chapter 13. Stage Strahd’s spawn in the crates by the book.', {read:'Three amber blocks wait around the room. The closest has something in it that looks too small to cast the shadow it casts.'}],
    [24,1,5,3,'chamber','Treasure Room','The fissure leads from here into the Amber Vault. Resolve the amber golem and treasure from the book.'],
    [5,3,5,5,'chamber','West Vault','Use the west vaults for additional dark gifts if this expedition calls for them.'],
  ],
  paths:[
    path(9,16,11,16),path(3,15,5,15),path(21,16,23,16),path(25,11,25,9),
    path(26,22,26,24),path(17,21,17,23),path(9,26,12,26),path(7,21,7,24),
    path(16,8,16,5),path(21,2,24,2),path(7,7,7,10),
  ],
  doors:[[4,15,'locked'],[26,23,'locked'],[11,26],[7,8,'locked']],
  props:[
    ['statue',16,9],['pillar',13,11],['pillar',19,11],['pillar',13,19],['pillar',19,19],
    ['rubble',11,9],['bones',2,17],['sarcophagus',1,13],['sarcophagus',28,25],['sarcophagus',24,26],
    ['sarcophagus',13,24],['sarcophagus',20,26],['bones',16,28],['bones',5,25],
    ['sarcophagus',12,3],['sarcophagus',16,5,1],['sarcophagus',21,3],['crate',17,2],['crate',18,3],
    ['chest',28,1],['statue',26,1],['rubble',22,2],['sarcophagus',5,4],
  ],
};
export const AMBER_TEMPLE = [{theme:'amber',layout:upper}, {theme:'amber',layout:lower}];
