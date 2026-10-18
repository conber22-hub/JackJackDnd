/* FLOOR THEMES — colours, room mix, Grok prompt, and who lives there.
   The first four are the default descent (cycled by depth). Floors store the theme's index, so add new
   themes at the END of the list to keep old saves pointing at the right look.
   denizens: encounter groups the "Populate" button and templates drop into matching rooms.
     where = room types it likes · group = [[creature id, count or dice], ...] */
export const THEMES = [
  { id:'undercroft', name:'The Undercroft of St. Andral', floor:'#4b454a', hall:'#37323a', wall:'#2c2731', trim:'#c8cbd6', mist:'#6b6577',
    weights:{chamber:4,crypt:3,shrine:2,trap:2,treasure:1,safe:1,lair:1},
    prompt:'grimdark gothic church undercroft, vaulted stone crypt corridors, bone niches, guttering candles, silver reliquaries, fog on the floor, Ravenloft, top-down dungeon battlemap, painterly',
    denizens:[
      { where:['crypt','lair'], group:[['candlewight',1],['seepling','1d3']] },
      { where:['shrine','crypt'], group:[['unbaptized',1]] },
      { where:['lair','chamber'], group:[['husk',2],['seepling',2]] },
      { where:['lair'], group:[['bellmouth',2]] },
      { where:['chamber'], group:[['husktemplar',1],['husk',1]] },
    ] },
  { id:'silver', name:'The Silver Vein', floor:'#4e4338', hall:'#3a3129', wall:'#2e271f', trim:'#e3e7ee', mist:'#7a7062',
    weights:{chamber:4,trap:3,treasure:2,lair:1,safe:1,crypt:1,nest:1},
    prompt:'abandoned dwarven silver mine, timber-braced tunnels, glittering silver seams in black rock, rusted ore carts, dust in lantern light, gothic horror, top-down dungeon battlemap, painterly',
    denizens:[
      { where:['chamber','lair'], group:[['silverlung',3]] },
      { where:['lair','nest'], group:[['husk',2],['bloat',1]] },
      { where:['nest'], group:[['seepling','1d4+2'],['bloat',1]] },
      { where:['lair'], group:[['stalker',1],['seepling',2]] },
      { where:['crypt'], group:[['weaver',1]] },
    ] },
  { id:'hands', name:'The Hand-Warrens', floor:'#55413f', hall:'#40302f', wall:'#2f2325', trim:'#e6d3b8', mist:'#7a5d5a',
    weights:{chamber:3,lair:3,trap:2,crypt:2,nest:1,treasure:1},
    prompt:'claustrophobic burrowed tunnels with thousands of pale hand-prints and finger-gouges on the walls, bones pressed into clay, red-tinged torchlight, horror, top-down dungeon battlemap, painterly',
    denizens:[
      { where:['chamber','trap'], group:[['handswarm',2]] },
      { where:['lair'], group:[['handmass',1]] },
      { where:['crypt'], group:[['weaver',1],['handswarm',1]] },
      { where:['lair','nest'], group:[['quill',1],['husk',2]] },
    ] },
  { id:'undertow', name:'The Undertow', floor:'#303b2d', hall:'#262f23', wall:'#1c231a', trim:'#a6d13a', mist:'#4f6a3e',
    weights:{nest:4,chamber:2,lair:2,trap:1,treasure:1,crypt:1},
    prompt:'flooded cavern overgrown with grey-green parasitic membrane, glowing pustules, half-absorbed corpses in the walls, black water, sickly green bioluminescence, cosmic horror, top-down dungeon battlemap, painterly',
    denizens:[
      { where:['nest'], group:[['seepling','1d4+2'],['bloat',2]] },
      { where:['lair'], group:[['bulwark',1],['quill',2]] },
      { where:['lair','chamber'], group:[['stalker',2]] },
      { where:['nest','lair'], group:[['colossus',1]] },
    ],
    boss:'undertow' },
  { id:'chapel', name:'The Chapel of Saint Andral', floor:'#57504a', hall:'#463f3a', wall:'#3b3436', trim:'#e0cf9e', mist:'#8a8494',
    weights:{chamber:4,shrine:3,safe:2,crypt:1,treasure:1,trap:1},
    prompt:'ruined gothic village church above ground, broken pews, shattered stained glass, moonlight through a collapsed roof, overturned font leaking dark water, Barovia, top-down dungeon battlemap, painterly',
    denizens:[
      { where:['chamber','shrine'], group:[['husk',2]] },
      { where:['crypt'], group:[['spawn',1]] },
      { where:['chamber'], group:[['bellmouth',1],['seepling',2]] },
    ] },
  { id:'ossuary', name:'The Ossuary Deeps', floor:'#4a4640', hall:'#38352f', wall:'#2a2723', trim:'#efe4c8', mist:'#77705f',
    weights:{crypt:4,chamber:3,shrine:2,trap:2,lair:1,treasure:1},
    prompt:'endless ossuary catacombs, walls built from stacked skulls and femurs, bone chandeliers, narrow arches, candle stubs in eye sockets, gothic horror, top-down dungeon battlemap, painterly',
    denizens:[
      { where:['crypt'], group:[['candlewight',2]] },
      { where:['lair','crypt'], group:[['weaver',1]] },
      { where:['shrine'], group:[['unbaptized',2]] },
      { where:['chamber'], group:[['husktemplar',2]] },
    ] },
  { id:'womb', name:'The Budding Womb', floor:'#3c3a2c', hall:'#2f2d22', wall:'#232218', trim:'#c6ff5a', mist:'#5e6a3a',
    weights:{nest:5,lair:2,chamber:2,trap:1},
    prompt:'living hive chamber of the parasite, walls of pulsing grey-green flesh and fused bones, glowing egg sacs, a giant brain-like mass at the center, ribbed tunnels like veins, cosmic horror, top-down dungeon battlemap, painterly',
    denizens:[
      { where:['nest'], group:[['seepling','2d4']] },
      { where:['lair'], group:[['mind',1],['seepling',3]] },
      { where:['nest','lair'], group:[['bloat',2],['husk',2]] },
      { where:['chamber'], group:[['stalker',1],['quill',1]] },
    ],
    boss:'mind' },
];
export const themeIndex = id => { const i = THEMES.findIndex(t => t.id === id); return i < 0 ? 0 : i; };

/* TEMPLATES — whole descents in one click. Each floor: theme id plus optional overrides
   rooms: room-count multiplier · roomSize: [min, max] side · doors: chance a corridor mouth gets a door
   locked / secret: share of those doors · traps: traps per Trap room · populate: drop denizens in
   autoLink false = no generated corridors (blank stone to build by hand) */
export const TEMPLATES = [
  { id:'andral', name:'The Descent of Saint Andral', blurb:'The classic four: church undercroft, silver mine, the Hand-Warrens, the Undertow.',
    floors:[{ theme:'undercroft' }, { theme:'silver' }, { theme:'hands', secret:.25 }, { theme:'undertow', doors:.15 }] },
  { id:'castle', name:'Castle above, crypt below, mine under that', blurb:'Start in the chapel ruins, go down through the crypts, end in the silver vein.',
    floors:[{ theme:'chapel', doors:.6, rooms:1.1 }, { theme:'ossuary' }, { theme:'silver', doors:.2 }] },
  { id:'outbreak', name:'Outbreak — the Seep ascends', blurb:'Every floor is already taken. Populated as you descend: the Budding Mind grows in the Womb, and the Undertow waits at the bottom.',
    floors:[{ theme:'undercroft', populate:true }, { theme:'silver', populate:true }, { theme:'womb', populate:true, boss:true }, { theme:'undertow', populate:true }] },
  { id:'labyrinth', name:'Andral\'s Labyrinth', blurb:'Many small rooms, many doors, many secrets. The hands know the way; you do not.',
    floors:[{ theme:'hands', rooms:1.6, roomSize:[3, 6], doors:.7, locked:.25, secret:.3, traps:2 }, { theme:'ossuary', rooms:1.5, roomSize:[3, 6], doors:.6, secret:.25, traps:2 }, { theme:'hands', rooms:1.6, roomSize:[3, 6], doors:.7, locked:.3, secret:.35, traps:2 }] },
  { id:'blank', name:'Blank stone (build by hand)', blurb:'One landing room per floor and nothing else. Draw rooms, corridors, doors and traps yourself in the Build tab.',
    floors:[{ blank:true }, { blank:true }, { blank:true }] },
];
