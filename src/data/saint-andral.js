/* St. Andral’s in Vallaki. The published chapter uses the village church’s
   arrangement as a reference. These floor plans and furnishings are original. */
export const SAINT_ANDRAL = 'St. Andral’s Church';
const W = 32, H = 32;
const belowAltar = [15, 4];
const outdoor = ground => ({ outdoor:true, ground });

export function saintAndralSurface(bloom = false){
  const fence = [];
  for (let y = 6; y <= 20; y++){
    if (y !== 12) fence.push(['fence', 23, y, 1]);
    fence.push(['fence', 30, y, 1]);
  }
  for (let x = 24; x < 30; x++){
    fence.push(['fence', x, 6]);
    if (x !== 26) fence.push(['fence', x, 20]);
  }
  return {
    W, H, name:SAINT_ANDRAL, theme:'village', out:[15, 27],
    down:belowAltar.slice(),
    exits:{ down:bloom ? 'Below the church' : 'Lower landing' },
    rooms:[
      [11, 25, 9, 4, 'entrance', 'Church steps', 'At night the light here tells frightened people where to go.', outdoor('cobble')],
      [14, 16, 3, 8, 'chamber', 'Entry hall', 'During a crowded service, keep this way out clear of benches and congregants.'],
      [8, 16, 5, 3, 'chamber', 'Vestry', 'Yeska trims the candle wicks here before evening prayer.'],
      [8, 21, 5, 3, 'chamber', 'Father Lucian’s room', 'A bed, a jug of water and a chair facing the morning light.'],
      [18, 16, 5, 3, 'chamber', 'Candle store', 'Set aside candles for the people who come after dark.'],
      [18, 21, 5, 3, 'chamber', 'Parish office', 'The priest can speak privately here without emptying the church.'],
      [9, 7, 13, 8, 'shrine', 'Nave and altar', bloom
        ? 'Father Lucian keeps people back from the font. If the Seep comes up through it, the front doors and churchyard offer separate routes out.'
        : 'Father Lucian receives visitors at the altar. He can ask the party to stay behind after prayers to speak in private.',
        { read:'Light through the old glass lays narrow bands of colour across the aisle. One candle has burned down to the stone.' }],
      [18, 3, 4, 3, 'chamber', 'Foot of the belfry', 'The bell rope hangs here. The upper tower is handled as part of the scene.'],
      [14, 3, 3, 3, 'chamber', 'Altar recess', bloom
        ? 'Reveal this access when Lucian shows the party the way below the font.'
        : 'The replaced boards beside the altar cover the opening to the crypt. Use the concealed door to represent lifting them.'],
      [24, 7, 6, 13, 'chamber', 'Churchyard', 'Milivoj works among the graves. The side door leads back into the nave, and the yard gate opens to the street.', outdoor('grass')],
    ],
    paths:[
      { pts:[15, 25, 15, 23] }, { w:3, pts:[15, 15, 15, 15] },
      { pts:[12, 17, 14, 17] }, { pts:[16, 17, 18, 17] },
      { pts:[12, 22, 14, 22] }, { pts:[16, 22, 18, 22] },
      { pts:[19, 5, 19, 7] }, { pts:[15, 5, 15, 7] },
      { pts:[21, 12, 24, 12] }, { pts:[26, 19, 26, 27, 19, 27] },
    ],
    doors:[
      [15, 24, 'closed'], [13, 17, 'closed'], [17, 17, 'closed'],
      [13, 22, 'closed'], [17, 22, 'closed'], [19, 6, 'closed'],
      [15, 6, 'secret'], [22, 12, 'closed'], [26, 20, 'closed'],
    ],
    clear:fence.map(([, x, y]) => [x, y]),
    props:[
      ...fence,
      ['lamppost', 11, 25], ['bench', 19, 25],
      ['altar', 14, 8, 1], ['candelabra', 12, 8], ['candelabra', 17, 8],
      ['shrine', 10, 8], ...(bloom ? [['bloomgrowth', 11, 7]] : []), ['pew', 10, 10, 1], ['pew', 10, 12, 1],
      ['pew', 10, 14, 1], ['pew', 18, 10, 1], ['pew', 18, 12, 1], ['pew', 18, 14, 1],
      ['shelf', 8, 16], ['chest', 11, 16], ['bed', 8, 21], ['stool', 10, 22],
      ['shelf', 22, 16], ['crate', 20, 16], ['desk', 20, 21], ['chair', 21, 22],
      ['lantern', 20, 3], ['gravestone', 25, 8], ['gravestone', 28, 8],
      ['gravestone', 25, 10], ['gravestone', 28, 10], ['gravestone', 25, 14],
      ['gravestone', 28, 14], ['gravestone', 25, 17], ['gravestone', 28, 17],
      ['deadtree', 29, 18],
    ],
  };
}

export function saintAndralCrypt(){
  return {
    W, H, name:'The resting place', theme:'ossuary', up:belowAltar.slice(),
    exits:{ up:'Back to the altar' },
    rooms:[[14, 3, 3, 4, 'crypt', 'St. Andral’s crypt',
      'The bones are missing. Fresh scrapes show where the resting place was opened. If the bones are returned, use Chapter 5 to resolve the church’s protection.',
      { read:'The air is cold enough to sting. Pale scratches mark the edge of the open stone lid.' }]],
    props:[['sarcophagus', 16, 3], ['candelabra', 14, 6]],
  };
}
