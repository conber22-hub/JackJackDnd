/* Small, self-contained pursuits for a few days away from the dungeon. */
export const ACTIVITIES = [
  { id:'recuperate', n:'Recuperate', days:3, cost:0, needs:{place:'somewhere safe'}, flavour:'Find a safe bed and recover your strength.' },
  { id:'work', n:'Work for pay', days:1, cost:0, needs:{place:['village','town'],skill:'any skill',tool:'a proficient tool'}, flavour:'Take honest work from the folk of the valley.' },
  { id:'train', n:'Train', days:10, cost:1, needs:{place:'not the road',teacher:true}, flavour:'Learn a language or a craft from a willing teacher.' },
  { id:'research', n:'Research', days:1, cost:0, needs:{place:'town',workshop:'library',skill:'History'}, flavour:'Look for answers among old records and shelves.' },
  { id:'carouse', n:'Carouse', days:1, cost:2, needs:{place:['village','town'],skill:'Persuasion'}, flavour:'Make acquaintances in a tavern, and risk an argument.' },
  { id:'watch', n:'Keep watch', days:1, cost:0, needs:{place:'holding'}, flavour:'Mind the gate and keep an eye on strangers.' },
  { id:'craft', n:'Craft', days:1, cost:0, needs:{}, flavour:'Set aside eight hours each day for making things.' },
];
