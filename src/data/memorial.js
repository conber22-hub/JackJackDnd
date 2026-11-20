/* 🕯 IN MEMORY OF CHANCE — "Dutcher", the Dutch Oven. Dread Delve is made in his memory: he loved Halo and history,
   and the Callings (docs/homebrew/callings.md) are built from both. These are the words the game says about him, in
   one place, for the DM to keep right: the dedication when the game opens (ui/dedication.js), the line at the foot of
   the start page, the Dutch Oven in the Village of Barovia, and the legend the village tells. */
export const MEMORIAL = {
  name:'Chance',
  called:['Dutcher', 'the Dutch Oven'],
  // the dedication: a quiet moment when the game opens, once each time it's opened
  title:'In memory of Chance',
  sub:'“Dutcher.” The Dutch Oven.',
  lines:[
    'He loved Halo and history.',
    'The soldiers of every age who wake in these Mists, and the warm hearth in the village, are for him.',
  ],
  // at the foot of the start page, always
  foot:'In memory of Chance, “Dutcher.” The hearth is still warm.',

  // 🔥 the Dutch Oven: a bakehouse and forge on the Village of Barovia's square (engine/settlement.js, the village's
  // `oven`). Its card shows the first time a hero steps inside on a journey (game/wander.js memorialSteps).
  oven:{
    name:'The Dutch Oven',
    notes:'Bakehouse and forge, the warmest room in Barovia. The oven has never gone cold. A soldier\'s helmet hangs over its mouth.',
    flair:'The warmest room in Barovia. The great iron oven has never once gone cold.',
    lines:[
      'Over the oven\'s mouth hangs a soldier\'s helmet, scorched and dented, from no war anyone in the valley has heard of.',
      'The village says it was his: <b>Dutcher</b>, who walked out of the Mists with it on his head, built this oven with his own hands, and kept the village fed through the winter the sun never came.',
      'Rest here, and wake here. The bread is always free.',
    ],
    // a night's rest under its roof
    rest:'The oven\'s warmth gets into your bones. In the morning there is bread by your boots, and the helmet over the fire seems to keep watch on the door.',
  },
  // 🪨 Dutcher's cairn, on the rise by the graveyard
  cairn:{
    name:'Dutcher\'s cairn',
    notes:'A cairn of river stones above the village, where Dutcher held the line when the Seep first came. There is always bread on the top stone.',
    flair:'River stones, piled shoulder-high on the rise above the village.',
    lines:[
      'When the Seep first came down the valley, it came this way, and a soldier from another age stood here and held it while the village got its children up the hill.',
      'Nobody knows what he was called before the Mists. The village called him Dutcher, and the Dutch Oven, and still does.',
      'There is always bread on the top stone. Nobody admits to leaving it.',
    ],
  },
};
