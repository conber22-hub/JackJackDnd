/* Daily wages in gold, and original signs of a watcher's divided loyalty. */
export const RATES = {
  farmer:.2, smith:1, elder:.2, watch:.5, priest:.5, beggar:.2,
  traveller:.3, peddler:.4, pilgrim:.2, hermit:.3,
};
export const SKILL_OF = {
  farmer:'labour', smith:'craft', elder:'cook', watch:'guard', priest:'cook',
  beggar:'scout', traveller:'scout', peddler:'scout', pilgrim:'cook', hermit:'scout',
};
export const TELLS = [
  'A second set of footprints leads away from the gate at dusk.',
  'A sealed scrap is hidden beneath a loose floorboard.',
  'They know the hour of a raid before the alarm sounds.',
  'A stranger receives a silent nod across the market.',
  'Their lantern flashes twice towards the distant ridge.',
  'They keep a careful list of who sleeps in each room.',
  'A wax seal is found pressed into their coat lining.',
  'They ask too often when the watch changes.',
  'A message is tucked inside a hollow fence post.',
  'They return from the woods with clean boots after rain.',
];
export const MORALE_LINES = {
  raid:{stay:['They hold the gate through the attack.'],leave:['They flee when the gate is struck.']},
  unpaid:{stay:['They remain, hoping for their wages.'],leave:['They leave rather than work another day unpaid.']},
  horror:{stay:['They steady themselves and remain.'],leave:['The sight is too much; they depart.']},
  death:{stay:['They mourn, but stay beside the others.'],leave:['They will not risk another death here.']},
};
