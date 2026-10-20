/* WHAT GOES IN A ROOM — used by engine/dressing.js to furnish generated floors. Edit freely.
   A kit is a list of [prop, at least, at most, where]; where: wall (back to a wall) · corner · center · scatter.
   ROOM_USES: what an ordinary room in a house or castle turns out to be (it takes one of the names too).
   TYPE_KIT: what a room's type brings (a crypt's coffins, a shrine's altar…); THEME_KIT: the floor's clutter. */

export const ROOM_USES = {
  manor:[
    { id:'bedroom', names:['Bedchamber', 'The Master Bedroom', 'Guest Room', 'A Shuttered Bedroom'], kit:[['bed', 1, 1, 'wall'], ['wardrobe', 1, 1, 'wall'], ['rug', 0, 1, 'center'], ['chair', 0, 1, 'scatter'], ['candelabra', 0, 1, 'corner'], ['cobweb', 0, 1, 'corner']] },
    { id:'library', names:['Library', 'The Reading Room', 'Study'], min:12, kit:[['bookshelf', 2, 4, 'wall'], ['desk', 1, 1, 'wall'], ['chair', 1, 2, 'scatter'], ['candelabra', 1, 1, 'corner'], ['rug', 0, 1, 'center']] },
    { id:'dining', names:['Dining Room', 'The Long Table'], min:16, kit:[['longtable', 1, 1, 'center'], ['chair', 3, 6, 'scatter'], ['hearth', 0, 1, 'wall'], ['candelabra', 1, 2, 'corner'], ['shelf', 0, 1, 'wall']] },
    { id:'parlour', names:['Parlour', 'Drawing Room', 'The Sitting Room'], kit:[['rug', 1, 1, 'center'], ['hearth', 1, 1, 'wall'], ['chair', 2, 3, 'scatter'], ['table', 1, 1, 'center'], ['bookshelf', 0, 1, 'wall'], ['candelabra', 0, 1, 'corner']] },
    { id:'nursery', names:['Nursery', 'The Children\'s Room'], kit:[['cradle', 1, 1, 'corner'], ['dollhouse', 1, 1, 'wall'], ['bed', 1, 2, 'wall'], ['rug', 0, 1, 'center'], ['cobweb', 1, 1, 'corner']] },
    { id:'kitchen', names:['Kitchen', 'Scullery', 'Pantry'], kit:[['hearth', 1, 1, 'wall'], ['cauldron', 1, 1, 'scatter'], ['table', 1, 1, 'center'], ['shelf', 1, 2, 'wall'], ['barrel', 1, 2, 'corner'], ['sacks', 0, 2, 'corner']] },
    { id:'servants', names:['Servants\' Quarters', 'Maid\'s Room'], kit:[['bed', 1, 2, 'wall'], ['stool', 1, 1, 'scatter'], ['crate', 0, 1, 'corner'], ['cobweb', 0, 1, 'corner']] },
  ],
  castle:[
    { id:'hall', names:['Great Hall', 'The Feast Hall', 'Audience Chamber'], min:20, kit:[['longtable', 1, 2, 'center'], ['chair', 4, 8, 'scatter'], ['throne', 0, 1, 'wall'], ['banner', 2, 4, 'wall'], ['candelabra', 2, 3, 'corner'], ['hearth', 0, 1, 'wall']] },
    { id:'chapel', names:['Chapel', 'The Cold Chapel'], min:12, kit:[['altar', 1, 1, 'wall'], ['pew', 2, 6, 'center'], ['organ', 0, 1, 'wall'], ['candelabra', 2, 2, 'corner'], ['statue', 0, 2, 'corner']] },
    { id:'library', names:['Library', 'The Count\'s Study'], min:12, kit:[['bookshelf', 3, 5, 'wall'], ['desk', 1, 1, 'wall'], ['chair', 1, 2, 'scatter'], ['candelabra', 1, 2, 'corner'], ['rug', 0, 1, 'center']] },
    { id:'bedchamber', names:['Bedchamber', 'Guest Chamber', 'The Lady\'s Room'], kit:[['bed', 1, 1, 'wall'], ['wardrobe', 1, 2, 'wall'], ['rug', 1, 1, 'center'], ['desk', 0, 1, 'wall'], ['candelabra', 1, 1, 'corner']] },
    { id:'armoury', names:['Armoury', 'Guard Room'], kit:[['armor', 2, 4, 'wall'], ['rack', 0, 1, 'wall'], ['table', 1, 1, 'center'], ['stool', 1, 3, 'scatter'], ['barrel', 0, 2, 'corner'], ['brazier', 0, 1, 'scatter']] },
    { id:'gallery', names:['Portrait Gallery', 'Hall of Statues'], kit:[['statue', 2, 4, 'wall'], ['armor', 1, 2, 'wall'], ['banner', 1, 2, 'wall'], ['rug', 1, 1, 'center'], ['candelabra', 1, 2, 'corner']] },
    { id:'dungeon', names:['Cells', 'The Oubliette', 'Torture Chamber'], kit:[['cage', 1, 3, 'corner'], ['rack', 0, 1, 'center'], ['bones', 1, 3, 'scatter'], ['brazier', 1, 1, 'scatter'], ['cobweb', 0, 1, 'corner']] },
  ],
};
ROOM_USES.burned = ROOM_USES.castle.map(u => ({ ...u, kit:[...u.kit.filter(([k]) => !['rug', 'organ'].includes(k)), ['rubble', 2, 4, 'scatter'], ['cobweb', 1, 2, 'corner']] }));

export const TYPE_KIT = {
  entrance:[['candelabra', 0, 1, 'corner'], ['rubble', 0, 1, 'corner']],
  safe:[['brazier', 1, 1, 'center'], ['bench', 1, 2, 'wall'], ['saltcrock', 1, 2, 'corner'], ['bed', 0, 1, 'wall']],
  trap:[['rubble', 1, 2, 'scatter'], ['bones', 1, 2, 'scatter']],
  treasure:[['chest', 1, 3, 'wall'], ['crate', 1, 2, 'corner'], ['barrel', 0, 2, 'corner'], ['candelabra', 0, 1, 'corner']],
  lair:[['bones', 2, 4, 'scatter'], ['rubble', 1, 2, 'scatter'], ['cage', 0, 1, 'corner']],
  shrine:[['altar', 1, 1, 'wall'], ['candelabra', 2, 2, 'corner'], ['statue', 0, 1, 'corner'], ['pew', 0, 2, 'center']],
  crypt:[['sarcophagus', 1, 3, 'wall'], ['coffin', 1, 3, 'wall'], ['bones', 0, 2, 'scatter'], ['candelabra', 0, 1, 'corner'], ['cobweb', 1, 2, 'corner']],
  nest:[['bloomgrowth', 3, 6, 'scatter'], ['puddle', 1, 2, 'scatter'], ['bones', 1, 2, 'scatter'], ['fungus', 0, 2, 'corner']],
};

export const THEME_KIT = {
  undercroft:[['pillar', 0, 2, 'center'], ['coffin', 0, 1, 'wall'], ['bones', 0, 1, 'scatter'], ['cobweb', 0, 2, 'corner'], ['candelabra', 0, 1, 'corner']],
  chapel:[['pew', 0, 3, 'center'], ['statue', 0, 1, 'corner'], ['candelabra', 0, 1, 'corner'], ['rubble', 0, 1, 'scatter']],
  ossuary:[['bones', 1, 3, 'scatter'], ['coffin', 0, 2, 'wall'], ['sarcophagus', 0, 1, 'wall'], ['cobweb', 0, 2, 'corner'], ['pillar', 0, 1, 'center']],
  silver:[['rails', 1, 3, 'scatter'], ['minecart', 0, 1, 'scatter'], ['beam', 1, 2, 'wall'], ['ore', 1, 2, 'corner'], ['crate', 0, 1, 'corner'], ['lantern', 0, 1, 'corner'], ['rubble', 0, 1, 'scatter']],
  hands:[['bones', 1, 2, 'scatter'], ['rubble', 0, 2, 'scatter'], ['coffin', 0, 1, 'wall'], ['cobweb', 0, 1, 'corner']],
  undertow:[['puddle', 1, 3, 'scatter'], ['bloomgrowth', 1, 3, 'scatter'], ['bones', 0, 2, 'scatter'], ['fungus', 0, 2, 'corner']],
  womb:[['bloomgrowth', 2, 4, 'scatter'], ['fungus', 1, 2, 'corner'], ['puddle', 0, 2, 'scatter'], ['bones', 0, 1, 'scatter']],
  manor:[['rug', 0, 1, 'center'], ['chair', 0, 1, 'scatter'], ['cobweb', 0, 1, 'corner']],
  castle:[['banner', 0, 2, 'wall'], ['armor', 0, 1, 'wall'], ['candelabra', 0, 1, 'corner'], ['rug', 0, 1, 'center']],
  burned:[['rubble', 1, 3, 'scatter'], ['bones', 0, 1, 'scatter'], ['statue', 0, 1, 'corner'], ['cobweb', 0, 1, 'corner']],
  wreck:[['hull', 0, 1, 'scatter'], ['rubble', 1, 2, 'scatter'], ['crate', 0, 2, 'corner'], ['bloomgrowth', 0, 2, 'scatter'], ['puddle', 0, 1, 'scatter']],
  mill:[['sacks', 1, 3, 'corner'], ['barrel', 0, 2, 'corner'], ['crate', 0, 2, 'wall'], ['hay', 0, 1, 'corner'], ['table', 0, 1, 'center'], ['cobweb', 0, 1, 'corner']],
  cellar:[['barrel', 1, 3, 'wall'], ['kegs', 0, 1, 'wall'], ['crate', 0, 2, 'corner'], ['shelf', 0, 1, 'wall'], ['cobweb', 1, 2, 'corner'], ['puddle', 0, 1, 'scatter']],
  woods:[['stump', 0, 2, 'scatter'], ['boulder', 0, 2, 'scatter'], ['log', 0, 1, 'scatter'], ['bush', 1, 3, 'scatter'], ['deadtree', 0, 1, 'scatter'], ['fungus', 0, 1, 'scatter']],
  village:[['barrel', 0, 1, 'corner'], ['crate', 0, 1, 'corner'], ['hay', 0, 1, 'corner']],
  tavern:[['table', 1, 2, 'center'], ['chair', 1, 3, 'scatter'], ['barrel', 0, 1, 'corner']],
  default:[['rubble', 0, 1, 'scatter'], ['bones', 0, 1, 'scatter'], ['cobweb', 0, 1, 'corner']],
};
