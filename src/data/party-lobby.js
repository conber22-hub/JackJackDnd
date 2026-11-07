export const LOBBY_SIZE = { width: 20, height: 14 };
export const LOBBY_SPAWNS = [
  [3, 4], [3, 6], [3, 8], [3, 10], [5, 4], [5, 6], [5, 8], [5, 10],
];

// Low walls divide the practice lanes. The west side is a place to gather.
export const LOBBY_WALLS = [[9, 5], [10, 5], [9, 9], [10, 9]];
export const PRACTICE_DUMMIES = [
  { id: 'straw', name: 'Straw Guard', x: 12, y: 3, ac: 11, save: 0 },
  { id: 'shield', name: 'Shield Stand', x: 15, y: 7, ac: 16, save: 2 },
  { id: 'lantern', name: 'Lantern Target', x: 17, y: 10, ac: 13, save: 4 },
];

export const LOBBY_SCENE = {
  theme: 'village',
  layout: {
    name: 'The Lantern Yard',
    rooms: [[1, 1, 18, 12, 'chamber', 'The Lantern Yard',
      'A fire burns beside the gate. Three practice targets wait beyond the low stone walls.', { outdoor: true, ground: 'cobble' }]],
    fill: LOBBY_WALLS,
    props: [['campfire', 2, 2], ['lantern', 6, 2], ['lamppost', 8, 2], ['hay', 17, 2], ['hay', 17, 4]],
  },
};
