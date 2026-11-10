/* Vallaki, an original VTT street plan based on the relative geography in Chapter 5.
   North is at the top. This fits even the 32-square map editor preset.
   Keep building order stable: the Maps shelf keys interiors by building index. */
export function vallakiLayout(){
  const palisade = [
    [6, 4], [23, 4], [23, 6], [26, 6], [26, 8], [28, 8], [28, 22],
    [25, 22], [25, 26], [6, 26], [6, 23], [3, 23], [3, 8], [6, 8], [6, 4],
  ];
  const doors = [[3, 14, 'closed'], [28, 17, 'closed'], [18, 4, 'closed']];
  // gate posts round each gate, the lantern on the town's side (west, east, north)
  const props = [['postern', 3, 14, 0], ['postern', 28, 17, 2], ['postern', 18, 4, 1]], fill = [];
  for (let i = 1; i < palisade.length; i++){
    const [x0, y0] = palisade[i - 1], [x1, y1] = palisade[i];
    const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0);
    for (let x = x0, y = y0; x !== x1 || y !== y1; x += dx, y += dy){
      if (doors.some(([gx, gy]) => gx === x && gy === y)) continue;
      fill.push([x, y]);
      props.push(['palisade', x, y, dy ? 1 : 0]);
    }
  }

  const outdoor = (ground = 'dirt') => ({ outdoor:true, ground });
  return {
    name:'Vallaki',
    rooms:[
      [29, 16, 2, 3, 'entrance', 'Morning Gate', 'The Old Svalich Road ends at a gate under watch.', outdoor()],
      [1, 13, 2, 3, 'chamber', 'Sunset Gate', 'West, the road slips back into the trees.', outdoor()],
      [17, 1, 3, 3, 'chamber', 'Zarovich Gate', 'Cart ruts give way to foot tracks toward the lake.', outdoor()],
      [4, 16, 3, 2, 'chamber', 'Sunset Gate lodge', 'Wet cloaks hang by the street entrance.'],
      [26, 20, 2, 2, 'chamber', 'Morning Gate lodge', 'A spare lantern waits beside the bench.'],
      [19, 5, 3, 2, 'chamber', 'Zarovich Gate lodge', 'The sound of the lake road carries to the threshold.'],
      [10, 8, 3, 5, 'crypt', 'St. Andral’s churchyard', 'Fresh flowers lean against a weathered grave marker.', outdoor('grass')],
      [20, 13, 5, 5, 'chamber', 'Town Square', 'A festival notice curls in the damp across from a market stall.', outdoor('cobble')],
      [25, 11, 3, 5, 'chamber', 'Arasek Stockyard', 'Wheel tracks weave between the carts and stacks of crates.', outdoor()],
      [2, 27, 8, 4, 'chamber', 'Vistani Camp', 'A fire burns between the wagons on the slope outside town.', outdoor('grass')],
    ],
    paths:[
      { w:2, pts:[4, 14, 15, 14, 15, 17, 26, 17] },
      { pts:[1, 14, 4, 14] },
      { pts:[26, 17, 30, 17] },
      { pts:[18, 2, 18, 17] },
      { pts:[18, 11, 22, 11] },
      { pts:[18, 6, 17, 6] },
      { pts:[11, 7, 11, 14] },
      { pts:[7, 13, 7, 21, 9, 21] },
      { pts:[7, 16, 10, 16, 10, 15] },
      { pts:[13, 15, 13, 17] },
      { pts:[15, 18, 15, 21, 18, 21, 18, 17] },
      { pts:[15, 13, 15, 14] },
      { pts:[20, 17, 20, 19] },
      { pts:[24, 17, 24, 19] },
      { pts:[27, 17, 27, 20] },
      { pts:[26, 15, 26, 17] },
      { pts:[1, 14, 1, 29, 3, 29] },
    ],
    doors,
    fill,
    clear:fill,
    buildings:[
      { x:5, y:9, w:5, h:4, name:'St. Andral’s Church', door:'s', tall:true, noChimney:true, wall:'#77736c', roof:'#393d48' },
      { x:13, y:9, w:5, h:4, name:'Blue Water Inn', door:'s', tall:true, wall:'#80705d', roof:'#394b65' },
      { x:12, y:22, w:6, h:3, name:'Burgomaster’s Mansion', door:'n', tall:true, wall:'#8c776a', roof:'#713c42' },
      { x:20, y:7, w:5, h:4, name:'Wachterhaus Manor', door:'s', tall:true, dark:true, wall:'#60565d', roof:'#3c323d' },
      { x:22, y:20, w:4, h:2, name:'Coffin Maker’s Shop', door:'n', dark:true, wall:'#605447', roof:'#403b35' },
      { x:12, y:18, w:3, h:3, name:'Blinsky Toys Shop', door:'n', roof:'#5d3f62' },
      { x:9, y:5, w:4, h:2, name:'House', door:'s', dark:true },
      { x:14, y:5, w:3, h:3, name:'House', door:'e' },
      { x:8, y:17, w:4, h:3, name:'Cottage', door:'n' },
      { x:4, y:18, w:3, h:3, name:'House', door:'e', dark:true },
      { x:8, y:22, w:3, h:3, name:'Cottage', door:'n', dark:true },
      { x:19, y:20, w:3, h:4, name:'House', door:'n' },
    ],
    props:[
      ...props,
      ['lamppost', 2, 13], ['lamppost', 29, 16], ['lamppost', 17, 3],
      ['gravestone', 10, 9], ['gravestone', 12, 9], ['gravestone', 12, 11],
      ['signpost', 14, 13], ['barrel', 16, 13],
      ['well', 23, 15], ['signpost', 20, 13], ['stall', 21, 14], ['bench', 23, 13],
      ['cart', 26, 12], ['crate', 27, 14], ['barrel', 25, 14],
      ['lamppost', 16, 21], ['woodpile', 21, 19], ['crate', 26, 19],
      ['vardo', 2, 27], ['vardo', 8, 28], ['campfire', 5, 29], ['stool', 6, 29],
    ],
  };
}
