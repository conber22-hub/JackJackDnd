// Original landmarks use the existing road generator's arrival layouts.
export const TRAIL_SITES = [
  { name: 'The Cinder Orchard', kind: 'ruin', blurb: 'Apple trees grow through the stones of a burned house. Someone has tied the new shoots with red cord.' },
  { name: 'The Last Milestone', kind: 'hill', blurb: 'A ring of mileposts faces inward. One has fresh chalk marks counting days instead of miles.' },
  { name: 'Blue Lantern Hollow', kind: 'camp', blurb: 'An empty camp sits below a blue lantern. The embers are warm and the kettle is full.' },
  { name: 'The Tallow Pool', kind: 'lake', blurb: 'Wax floats around a wooden jetty. A boat has been tied there with a strip of mourning cloth.' },
  { name: 'Reedcutter’s Rest', kind: 'swamp', blurb: 'A hut stands above the flooded reeds. A clean path of cut stalks leads right to its door.' },
  { name: 'The Ashen Fold', kind: 'hill', blurb: 'A low circle of stones shelters the bones of a sheep. A copper bell still hangs above the entrance.' },
  { name: 'The Widow’s Ford', kind: 'camp', blurb: 'Two narrow wagons wait beside the water. Their owners have laid a dry path of planks between them.' },
  { name: 'Charcoal House', kind: 'ruin', blurb: 'Charcoal stains run down an old wall. A little shelter has been built under the only part still standing.' },
  { name: 'The Black Sluice', kind: 'swamp', blurb: 'Cold water pours under a leaning hut. In the mud beside it, fresh bootprints make a wide circle.' },
  { name: 'The Quiet Jetty', kind: 'lake', blurb: 'Three ropes hang into the water. The longest pulls taut whenever the shore falls silent.' },
  { name: 'The Stone Fingers', kind: 'hill', blurb: 'Five slabs lean away from the wind. The gap between the last two is just wide enough for a person.' },
  { name: 'The Split Hearth', kind: 'ruin', blurb: 'Two chimneys share a single cracked hearth. Someone has cooked on the side that still draws smoke.' },
];

export const TRAIL_SIGNS = {
  first: 'A narrow track leaves the road. Stones have been set along both edges.',
  left: 'A lower track runs between wet roots. Its stones have been polished by boots.',
  right: 'The track climbs to a break in the trees. A strip of pale cloth hangs above the turn.',
  rejoin: 'The last bend carries the sound of wagon wheels from somewhere ahead.',
};

// These links rejoin ordinary roads. None bypass the Mist Wall or the castle gate.
export const TRAIL_REJOINS = {
  'r-east': 'tser',
  'r-west': 'vallaki',
  'r-argyn': 'lake',
  'r-winery': 'krezk',
  'r-berez': 'tower',
  'r-krezk': 'yester',
};
