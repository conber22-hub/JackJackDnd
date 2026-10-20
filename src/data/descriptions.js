/* READ-ALOUD — a short description for every generated room: one line from what the room is (its use or
   type), one from the floor around it (what you smell, hear, feel). The DM sees it on the room's card and can
   read it to the table; nothing here is from the published module. Edit freely. */

export const USE_LINES = {
  bedroom:['A bed with the covers turned down, as if someone was expected tonight. The pillow still holds the shape of a head.', 'Heavy curtains, a cold bed, a wardrobe door standing an inch open.', 'The sheets are clean. That is the strangest thing about this room.'],
  library:['Shelves to the ceiling, the spines faded to the same grey-brown. One book lies open on the desk, face down, as if set aside a moment ago.', 'The smell of old paper and candle smoke. A gap on one shelf where a book was taken out — recently; there is no dust in the gap.'],
  dining:['A long table laid for a meal nobody ate: plates, cutlery, a centrepiece of dead flowers. One chair has been pushed back.', 'The table is set for more guests than the house could hold. The wine in the glasses has dried to a red crust.'],
  parlour:['Chairs drawn up to a cold hearth, as if a conversation stopped mid-sentence. The clock on the mantel has stopped at the same minute as every other clock here.', 'A sitting room in faded velvet. Someone has turned every portrait to face the wall.'],
  nursery:['A small room in pale paint. A cradle rocks, very slightly, though the air is still.', 'Toys arranged in a neat circle on the rug, all facing the door. The dollhouse is a perfect copy of this house, down to the lit window.'],
  kitchen:['A kitchen gone cold: copper pots, a black hearth, a chopping block scored by years of knives. Something in the larder smells sweet.', 'Bread on the table, perfectly fresh. Everything else here has been dead for years.'],
  servants:['Narrow beds, a washstand, a uniform hung on a nail. The servants left in a hurry, or did not leave.', 'A cramped room under the eaves that smells of tallow and lye.'],
  hall:['A great hall under smoke-dark beams. Banners hang in the still air; at the head of the table a high chair waits.', 'The feast hall is lit, though no one lights the candles. Somewhere a single glass is set apart from the rest.'],
  chapel:['Pews face an altar under a cold window. The holy symbol above it has been turned upside down.', 'A small chapel. The candles burn, and the shadows they throw point the wrong way.'],
  bedchamber:['A guest chamber made ready — fresh water in the jug, a fire laid but not lit, a single rose on the pillow.', 'Rich hangings gone to rot at the hems. The mirror has been covered with a sheet.'],
  armoury:['Racks and stands of old armour, polished as if for inspection. One stand is empty.', 'A guard room: a table, a dice cup, and a meal half eaten long ago.'],
  gallery:['Statues in a line down the hall, each with its hands over its eyes but one.', 'Portraits of the same stern family, generation after generation. The eyes are the same in every face.'],
  dungeon:['Iron cages hang at different heights. One still turns slowly, as if it was just let go.', 'Chains on the walls, a drain in the floor, and the smell that drains never take away.'],
};

export const TYPE_LINES = {
  chamber:['An empty room, which in this place is its own kind of warning.', 'Bare stone and old dust. Footprints cross the floor — small ones, bare, that go in and do not come out.'],
  entrance:['The stair arrives here, worn hollow in the middle by more feet than you would like to imagine.', 'A landing at the foot of the stairs. The air from below is colder than it should be.'],
  safe:['A small dry room where someone has drawn a ring of salt on the floor and kept it unbroken. It feels like a held breath.', 'Candle stubs, a bedroll, a prayer scratched into the wall. Someone sheltered here, and the room remembers kindness.'],
  trap:['The floor here is too clean, the dust swept in a careful line around the edges.', 'Scratches on the walls at knee height, and a dark stain that runs into a gap between two flagstones.'],
  treasure:['Strongboxes and chests, stacked with care. The lock on the nearest has been oiled recently.', 'A vault. Dust lies thick on everything except a path to one particular chest.'],
  lair:['Bones, picked clean and arranged by size. Something lives here and likes order.', 'The stink hits first: wet fur, old blood. Gnawed things lie in heaps against the walls.'],
  shrine:['An altar stands under a niche where a saint once was. Wax has run down its sides in long pale tears.', 'Votive candles, hundreds of them, most long dead. A few are burning.'],
  crypt:['Niches in the walls, each with its occupant, each with a name scratched out.', 'Stone coffins in rows. One lid has been pushed aside from within; the scrape marks are on the inside.'],
  nest:['The walls here are soft. Grey-green growth furs every surface and pulses, faintly, in time with something far below.', 'A pool of dark water, and in it things that bob like fruit. They have faces.'],
};

export const THEME_LINES = {
  undercroft:['The air tastes of wet stone and old incense.', 'Water drips somewhere, slow and patient.'],
  chapel:['Cold light through broken glass. Your breath shows.', 'Somewhere above, a bell rope creaks in a wind you cannot feel.'],
  ossuary:['Skulls look down from every wall, packed in like cobbles.', 'Bone dust gets into everything: your teeth, your eyes, your sleep.'],
  silver:['Pick marks score the walls. Here and there a seam of silver catches your light and throws it back.', 'Timber props groan under the weight of the hill.'],
  hands:['The walls are pocked with small holes, the size of a fist. Something taps, deep inside the stone.', 'You keep thinking you feel a touch on your sleeve.'],
  undertow:['Black water stands ankle-deep, warmer than it should be.', 'Voices, almost, in the sound of the water. You could swear one of them says your name.'],
  womb:['The air is thick and sweet and warm, like breath.', 'Everything here grows. Everything here listens.'],
  manor:['The house is silent in the way a held breath is silent.', 'Dust on everything, and no dust on the banister.'],
  woods:['The trees lean in. The fog does the rest.', 'No birds. There are never any birds.'],
  wreck:['Iron plates, buckled and scorched, rise out of the earth like the ribs of something huge.', 'Grey-green threads run along every seam of the metal.'],
  mill:['Flour dust hangs in the air and settles on everything, pale as ash.', 'The great wheel creaks overhead, turning though there is no wind.'],
  castle:['Candles burn in sconces nobody tends. The stone is old and very cold.', 'Somewhere an organ plays three notes and stops.'],
  burned:['Charred beams overhead, ash underfoot. The fire was long ago; the smell of it is not.', 'Soot-black walls, and on them the pale outlines of shields that were taken down.'],
  cellar:['The smell of wine gone to vinegar, and under it something sweeter.', 'Barrels in the dark, and the drip of something that is not water.'],
  village:['Fog in the street, and shutters closed tight.', 'A dog barks once, far off, and stops.'],
  tavern:['Pipe smoke and woodsmoke, and the low murmur of people who do not want to be overheard.', 'The floorboards are sticky, the fire is warm, and nobody looks up.'],
};

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
// Two sentences for a room: its use (or type), then the floor's air.
export function describeRoom(r, themeId, rng){
  const first = (r.use && USE_LINES[r.use]) || TYPE_LINES[r.type] || TYPE_LINES.chamber;
  const second = THEME_LINES[themeId];
  return [pick(first, rng), second ? pick(second, rng) : ''].filter(Boolean).join(' ');
}
