/* THE VALLEY OF BAROVIA — the overworld. Places on a stylised map (x 0–100 west→east, y 0–64 north→south),
   the roads between them, and the things the road throws at travellers. Nothing here reprints the module:
   the descriptions are table notes, and the book has the real places.
   kind   picks the arrival landmark the road generator builds (engine/overland.js)
   map    the template the "Enter" button builds when the party arrives ('landmark' = the road's own arrival
          clearing, as a map of its own) · maps: more than one to choose from
   state  the id in the Story tab's Places list, so a place's mood (quiet, watched, blooming…) is shared
   lab    where the name sits on the map: below (default), n = above, w = to the left
   len    how many stretches of road (maps) a road takes · way: road | path | trail · river: it crosses water */
export const VALLEY_PLACES = [
  { id:'mists', name:'The Mist Wall', x:95, y:22, lab:'w', kind:'mists', map:'landmark', state:null, sessions:[0],
    blurb:'Where the Salt Road ended. Behind them, fog the colour of old pewter. There is no way back through it.' },
  { id:'gates', name:'The Gates of Barovia', x:89, y:30, kind:'gates', map:'landmark', state:null, sessions:[1],
    blurb:'Two stone guardians, headless, either side of a gate that opens for you and does not open again.' },
  { id:'village', name:'Village of Barovia', x:80, y:37, kind:'village', map:'barovia', state:'village', sessions:[1, 2, 3],
    blurb:'Shuttered houses in permanent fog, a tavern with one lit window, a church on a rise — and the tall narrow house at the edge of town.' },
  { id:'crossroads', name:'The Gallows Crossroads', x:68, y:32, lab:'n', kind:'crossroads', map:'landmark', state:null, sessions:[4],
    blurb:'Where the Svalich Road meets the river and the castle road. A gallows that is never empty for long.' },
  { id:'castle', name:'Castle Ravenloft', x:71, y:46, kind:'castle', map:'ravenloft', state:'castle', sessions:[],
    blurb:'On its pillar of rock above the valley. The bridge, the gate, the dinner table. Not yet.' },
  { id:'coffin', name:'The Iron Coffin', x:62, y:17, kind:'coffin', map:'ironcoffin', state:'crash', sessions:[5],
    blurb:'A burned furrow through the Svalich Woods, and at the end of it the iron thing that fell. Wolves will not go near.' },
  { id:'tser', name:'Tser Pool', x:57, y:30, kind:'camp', map:'tserpool', state:'tser', sessions:[4],
    blurb:'Painted wagons, a fire that is always lit, a pool that reflects the wrong sky. The cards are read here.' },
  { id:'bonegrinder', name:'Old Bonegrinder', x:47, y:25, kind:'mill', map:'bonegrinder', state:'bonegrinder', sessions:[6],
    blurb:'A crooked windmill on a hill above the road, and the smell of baking that never quite covers the other smell.' },
  { id:'vallaki', name:'Vallaki', x:36, y:31, kind:'town', map:'vallaki', maps:['vallaki', 'standral'], state:'vallaki', sessions:[7, 8, 9, 10],
    blurb:'A palisade town on the lake that insists, loudly, that all will be well. Saint Andral\'s church is here.' },
  { id:'lake', name:'Lake Zarovich', x:30, y:21, kind:'lake', map:'lakeshore', state:null, sessions:[],
    blurb:'Black water, a fisherman\'s jetty, and a mist that sits on the lake like a lid.' },
  { id:'argyn', name:'Argynvostholt', x:42, y:12, kind:'ruin', map:'argyn', state:'argyn', sessions:[],
    blurb:'A burned mansion on the cliffs where an old order of knights failed. Its beacon has been dark a long time.' },
  { id:'berez', name:'Berez', x:37, y:47, kind:'swamp', map:'berez', state:'berez', sessions:[],
    blurb:'A drowned village in the river marsh. Huts on stilts, and one that walks.' },
  { id:'winery', name:'The Wizard of Wines', x:21, y:38, kind:'vineyard', map:'winery', state:'winery', sessions:[],
    blurb:'Vineyards on a slope, a winery that keeps the valley drinking — and a last wagon that never arrived.' },
  { id:'krezk', name:'Krezk', x:12, y:28, kind:'town', map:'krezk', state:'krezk', sessions:[],
    blurb:'A walled village under the abbey on the mountain. The gate opens for those who bring wine.' },
  { id:'yester', name:'Yester Hill', x:6, y:16, kind:'hill', map:'yester', state:null, sessions:[],
    blurb:'A bare hill with a ring of stones and a tree that is not a tree. The druids sing to it.' },
  { id:'tower', name:'The Lonely Tower', x:27, y:55, kind:'tower', map:'tower', state:null, sessions:[],
    blurb:'A stone tower on an island in a tarn. Someone has been living in it who does not want visitors.' },
];

export const VALLEY_ROADS = [
  { id:'r-mist',    a:'mists',       b:'gates',       name:'Out of the mist',                  len:1, way:'road',  mist:true },
  { id:'r-gates',   a:'gates',       b:'village',     name:'Old Svalich Road (the gates)',     len:2, way:'road' },
  { id:'r-east',    a:'village',     b:'crossroads',  name:'Old Svalich Road',                 len:2, way:'road',  river:true },
  { id:'r-castle',  a:'crossroads',  b:'castle',      name:'The castle road',                  len:2, way:'road' },
  { id:'r-cut',     a:'crossroads',  b:'coffin',      name:'The burned cut',                   len:2, way:'trail' },
  { id:'r-tser',    a:'crossroads',  b:'tser',        name:'The Tser Pool path',               len:1, way:'path',  river:true },
  { id:'r-west',    a:'tser',        b:'bonegrinder', name:'Old Svalich Road (west)',          len:2, way:'road' },
  { id:'r-vallaki', a:'bonegrinder', b:'vallaki',     name:'Old Svalich Road (to Vallaki)',    len:2, way:'road' },
  { id:'r-lake',    a:'vallaki',     b:'lake',        name:'The lake path',                    len:1, way:'path' },
  { id:'r-argyn',   a:'vallaki',     b:'argyn',       name:'The cliff path',                   len:2, way:'trail' },
  { id:'r-berez',   a:'vallaki',     b:'berez',       name:'The river path',                   len:2, way:'path',  river:true },
  { id:'r-winery',  a:'vallaki',     b:'winery',      name:'Old Svalich Road (to Krezk)',      len:2, way:'road' },
  { id:'r-krezk',   a:'winery',      b:'krezk',       name:'The Krezk road',                   len:2, way:'road' },
  { id:'r-yester',  a:'krezk',       b:'yester',      name:'The hill path',                    len:1, way:'trail' },
  { id:'r-tower',   a:'berez',       b:'tower',       name:'The tarn path',                    len:2, way:'trail', river:true },
];

/* What the road throws at them. One is rolled for each stretch (two when the Gaze is high).
   enc: creatures the DM can drop with one tap · module: the roadside set piece built for it
   gaze: only from this Gaze up · bloom: only once the Bloom is loose (Session 3 on, or the Bloom clock ticking) */
export const ROAD_EVENTS = [
  { w:4, label:'Wolves on the road', text:'Grey shapes keep pace in the trees on both sides. When the party stops, so do they.', enc:[['barovian-wolf', 3]], module:'den' },
  { w:2, label:'The Count\'s hounds', text:'A wolf the size of a pony sits in the middle of the road, waiting, as if it has been sent.', enc:[['count-s-wolf', 1], ['barovian-wolf', 2]], gaze:4, module:'den' },
  { w:3, label:'Scarecrows in the field', text:'A field of scarecrows beside the road, every one of them facing the road. There are no birds.', enc:[['scarecrow-watcher', 2]], module:'field' },
  { w:2, label:'The Mist Thing', text:'The mist on the road thickens into something that sits up.', enc:[['mist-thing', 1]], module:'mistbank' },
  { w:2, label:'Ghouls and a coffin', text:'Things in rags are dragging a coffin out of the ditch. Something inside it is knocking.', enc:[['grave-ghoul', 3]], module:'graves' },
  { w:2, label:'The dead in the ditch', text:'Bodies in the ditch, face down in the water. One of them is trying to stand.', enc:[['zombie', 3]], module:'graves' },
  { w:2, label:'Bats at dusk', text:'The light goes, and the air fills with wings.', enc:[['swarm-of-bats', 2]], gaze:3 },
  { w:2, label:'A rider in fine clothes', text:'A rider in a velvet coat, who knows their names and offers a shortcut. The shortcut is real. The price is a name spoken at dinner.', enc:[['dinner-guest', 1]], gaze:3, module:'shrine' },
  { w:2, label:'Bloomed wolves', text:'Wolves that move wrong — something grey-green has grown out through their ribs. They are not hungry. They are spreading.', enc:[['bloomed-wolf', 2]], bloom:true, module:'den' },
  { w:1, label:'Something in the canopy', text:'A wet click above, and the last person in line is gone from the road.', enc:[['bloom-stalker', 1]], bloom:true, gaze:4 },
  { w:3, label:'The hanged man', text:'A body turning on a rope from a dead tree beside the road. Fresh. There is a note in his pocket that he did not write.', module:'hanged' },
  { w:3, label:'An abandoned wagon', text:'A painted wagon, wheels deep in the mud, horses gone. A pot of stew still warm on the step.', module:'wagon' },
  { w:3, label:'A wayside shrine', text:'A little shrine to the Morninglord with fresh candles. Somebody lit them within the hour. Nobody is here.', module:'shrine' },
  { w:2, label:'A child\'s shoe', text:'One small shoe in the middle of the road, neatly placed, toe pointing the way they are going.' },
  { w:2, label:'The raven', text:'A raven lands on the milestone and walks along the road ahead of them for a mile. If they follow it, it is a friend.', module:'ravens' },
  { w:2, label:'Tracks in a ring', text:'Wolf tracks circling the road, round and round, as if something waited here for a long time and then left.' },
  { w:2, label:'A milestone scratched out', text:'The distance on the milestone has been scraped off and something else carved in: their own names.', module:'milestone' },
  { w:2, label:'A spilled cart', text:'A farmer\'s cart on its side, turnips everywhere, no farmer. His hat is in a tree.', module:'cart' },
  { w:2, label:'Grey-green on a log', text:'A fallen log furred with grey-green growth that pulses when you breathe on it. The Bloom has come this far.', bloom:true, module:'bloomlog' },
  { w:1, label:'A letter on a tree', text:'A letter nailed to a tree, sealed in red wax, addressed to one of them by name. It is an invitation.', gaze:2 },
  { w:2, label:'A fresh grave', text:'A fresh grave beside the road with a wooden marker and no name. The earth is moving, slightly.', module:'graves' },
  { w:2, label:'The road forks', text:'The road forks where it did not before. Both ways look the same. The mist decides.', module:'fork' },
  { w:1, label:'A Vistana on the road', text:'A Vistana walking alone, who will read a single card for anyone who shares their bread. The card is always true.', module:'camp' },
];
