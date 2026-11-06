// Original people, not the campaign's named characters. IDs are stable content keys.
export const FIRST_NAMES = {
  male: 'Velorin Bradan Oltimir Radoven Tovran Miravel Soradin Drazel Petruv Costelin Boradin Nestorin Lucovan Gavrel Stavor Dobrek Vasilek Ilaren Mirodan Ruzvan Teodrin Zorvel Cradin Danovel'.split(' '),
  female: 'Velina Bravena Oltana Radina Tovrena Mirava Soradina Drazena Petruna Costela Borana Nestara Lucova Gavrena Stavena Dobrela Vasilna Ilara Mirova Ruzana Teodara Zorina Cradela Danova'.split(' '),
  neutral: 'Velen Bravi Olti Raden Tovi Miren Sori Drazi Petri Costi Bori Nesti Luci Gavri Stavi Dobri Vasli Ilari Miri Ruzi Teodi Zori Cradi Dani'.split(' '),
};
export const FAMILY_NAMES = 'Brumescu Cernovar Dobravec Fagurel Ghernov Hradules Ilvanec Jorvadu Keldescu Luncovar Maroves Nucarel Oltaves Pradules Roscovan Seldaru Targovan Ulmores Vardescu Zimbranu Bistravel Corbules Dravonec Ferovan Gorules Halmecu Istravel Jarnescu Krovadu Livenec Mardules Norvacu Ordelin Paltives Runcarel Sobranu Tisovec Urdenec Veldaru Zorules Cernecu Dalmores Frunzel Grovanu'.split(' ');
export const VISTANI_NAMES = 'Alzari Beshana Corali Dovesh Eshara Farovi Ghalena Heshin Ilzara Jorashi Keshava Lureni Mavashi Neshali Orvani Pashena Qeravi Roshali Savelu Terashi Uvani Varosha Yeshari Zaluni'.split(' ');
export const NICKNAMES = [
  'Two-Coin {first}', '{first} of the Blue Door', 'Quiet {first}', 'Little Bell {first}',
  'Mudboot {first}', 'Red Scarf {first}', 'Quickstep {first}', 'Thistle {first}',
  'Candle {first}', 'Lucky Nail {first}', 'Rook {first}', 'Tin Cup {first}',
  'Copper {first}', 'Hearthside {first}', 'Raincoat {first}', 'Button {first}',
  'Small Voice {first}', 'Sparrow {first}', 'Blue Thread {first}', 'Half-Smile {first}',
  'Nutmeg {first}', 'Lantern {first}', 'Bramble {first}', 'Patchwork {first}',
];
export const TRAITS = [
  'a burn scar across one thumb', 'a fringe cut with kitchen shears', 'boots tied with blue string',
  'a coat patched with sailcloth', 'ink stains beneath the nails', 'a copper button on a cord',
  'a pale streak in dark hair', 'one eyebrow divided by a scar', 'a cap sewn with tiny leaves',
  'a woollen scarf despite the warmth', 'a chipped front tooth', 'a little bell wrapped in cloth',
  'a habit of watching doorways', 'fingers that drum in threes', 'a smile that vanishes abruptly',
  'a tendency to count passing carts', 'hands tucked inside long sleeves', 'a slight limp on wet stones',
  'a nose reddened by the wind', 'a spray of freckles across the cheeks', 'a missing coat buckle',
  'a white feather caught in a hatband', 'a leather pouch full of smooth stones', 'sleeves dusted with flour',
  'a ribbon tied round one wrist', 'a tin brooch shaped like a fish', 'a neat row of mismatched buttons',
  'a habit of touching the doorpost', 'a gaze fixed just above your shoulder', 'a thumbnail stained with berries',
  'a lock of hair that will not lie flat', 'a soft whistle between breaths', 'a habit of stepping over cracks',
  'a pocket bulging with folded paper', 'a tiny wooden bird on a string', 'a boot repaired with wire',
  'a habit of smoothing empty pockets', 'a knitted glove with one bright finger', 'a thin scar beneath the chin',
  'a restless glance towards the hills', 'a coat smelling faintly of apples', 'a stubborn cowlick',
  'a habit of bowing to empty windows', 'a smile stronger on one side',
];
export const VOICES = [
  'speaks to your shoulder, never your face', 'turns every statement into a question',
  'clips each phrase as if words cost money', 'repeats the last important word softly',
  'whispers even beside a roaring fire', 'pauses before names as though tasting them',
  'speaks with careful, old-fashioned courtesy', 'rushes the middle of every sentence',
  'drawls the vowels and snaps the consonants', 'sounds amused until the final word',
  'speaks in a low, steady sing-song', 'takes a breath halfway through each thought',
  'enunciates as if teaching someone to read', 'lets questions trail away unanswered',
  'speaks briskly while looking elsewhere', 'lowers the voice whenever a door opens',
  'laughs once before saying anything serious', 'speaks slowly enough to count the words',
  'sounds permanently surprised by the listener', 'uses a gentle voice with a hard ending',
  'murmurs first, then repeats more clearly', 'stresses little words instead of names',
  'keeps an even rhythm like a turning wheel', 'swallows the end of every sentence',
  'speaks warmly without quite smiling', 'answers in a dry, level rasp',
  'adds a tiny upward lilt to names', 'leaves a long silence after each answer',
];
// Infinitive phrases: useful directly in hooks and conversation.
export const WANTS = [
  'recover the iron stolen from the forge', 'replace the cracked chapel bell', 'pay the winter room tax',
  'find the missing wedding ring', 'buy back a coat pawned for drink', 'retrieve a cart seized at the gate',
  'clear a relative of stealing bread', 'save seed grain from the tithe', 'find a lost wooden dog',
  'get a dry corner before the frost', 'repair a wagon axle before departure', 'destroy an unjust arrest warrant',
  'put names to the unmarked graves', 'gather feverfew beyond the wolf fence', 'mend the millrace before it freezes',
  'learn why the road bells ring without wind', 'bring a letter to a missing parent', 'leave a locked cellar alive',
  'have a stolen burial shroud returned', 'bring clean water to the upper lane', 'recover a family recipe from a burned house',
  'find a witness willing to speak', 'bury a faithful dog before the ground hardens', 'keep the soup kitchen open',
  'trade a silver spoon for medicine', 'find a safe roof for a younger sibling', 'settle a debt before the collector comes',
  'recover a basket left beside the old well', 'learn who keeps moving the boundary stones', 'obtain candles for a winter vigil',
  'hear a missing friend sing once more', 'rescue a neighbour trapped by a fallen tree',
];
export const FEARS = [
  'the forge going cold before winter', 'the chapel answering its own prayers', 'a guest who leaves no footprints',
  'a familiar knock from beneath the floor', 'waking without the last keepsake of home', 'the gate closing on the wrong side of the cart',
  'being ordered to arrest a relative', 'the seed grain sprouting black', 'the scratching inside the toy chest',
  'frost settling on the only dry blanket', 'a wheel breaking on the mist road', 'a warrant bearing their own name',
  'finding a fresh grave already occupied', 'the fever returning with the thaw', 'the millwheel turning against the water',
  'bells tolling from an empty roadside shrine', 'a letter arriving in a dead parent’s hand', 'the cellar key being lost',
  'a shroud warm to the touch', 'the well reflecting an unfamiliar sky', 'smoke rising from a house without a hearth',
  'a witness forgetting a face overnight', 'pawprints stopping at the bedroom door', 'the soup kettle coming back empty',
  'the Count noticing a missing tithe', 'the Count asking for a family name', 'the Count’s carriage stopping outside',
  'a servant of the Count counting the windows', 'the Count recognising a borrowed seal', 'the Count reading an unsent letter',
  'the Count sending an invitation for one', 'the Count learning who sheltered a stranger',
];
// The last eight fears and secrets concern the Count. Slips suggest, never confess.
export const COUNT_FEAR_START = 24;
export const SECRETS = [
  ['forge iron', 'Hid stolen iron beneath the forge to pay for a neighbour’s burial.', 'Iron is heavy enough to hide all sorts of grief.'],
  ['chapel bell', 'Cut the chapel bell rope after hearing it speak a sibling’s name.', 'Some bells are kinder left quiet.'],
  ['winter tax', 'Keeps a second rent ledger behind the inn’s broken hearth tile.', 'A house can have more than one account of a winter.'],
  ['wedding ring', 'Sold a wedding ring and buried an empty box at the crossroads.', 'Not every buried box holds what it should.'],
  ['pawned coat', 'Sewed a smuggler’s map into the lining of a pawned coat.', 'Linings wear differently from the outside.'],
  ['gate cart', 'Moved a seized cart at night using a copied gate key.', 'Old locks are less lonely than people think.'],
  ['bread theft', 'Planted a loaf in the watch captain’s pantry to protect a cousin.', 'Bread has a way of turning up somewhere unexpected.'],
  ['seed grain', 'Buried untithed grain in jars under the sheep pen.', 'Some fields grow things even beneath the animals.'],
  ['wooden dog', 'Saw a wooden dog move and locked it inside a flour tin.', 'Wood ought to stay where you leave it.'],
  ['dry blanket', 'Took a blanket from a shuttered house and left a stone in payment.', 'A stone can look like a fair price in the dark.'],
  ['wagon axle', 'Carries an escaped prisoner’s farewell letter inside a hollow axle.', 'Wheels can carry more than a wagon.'],
  ['arrest warrant', 'Changed a date on a warrant to give a neighbour time to flee.', 'Ink dries slowly when it matters.'],
  ['unmarked graves', 'Marked an empty grave to hide someone’s escape across the ridge.', 'An inscription is not proof of what lies beneath.'],
  ['feverfew', 'Knows the feverfew garden grows over a concealed stair.', 'Gardens sometimes have a lower floor.'],
  ['millrace', 'Blocked the millrace to expose a locked box in its bed.', 'Low water shows things a miller might miss.'],
  ['road bells', 'Rings a hidden road bell to warn fugitives of patrols.', 'Wind is not the only reason a bell might ring.'],
  ['missing parent', 'Hides letters from a parent living under another name.', 'Names can be folded away like paper.'],
  ['cellar key', 'Keeps a spare cellar key inside a hollow candle.', 'Wax keeps more than a flame safe.'],
  ['burial shroud', 'Unpicked a burial shroud to recover a message sewn into its hem.', 'A hem can hold a last word.'],
  ['old well', 'Lowered a stolen watch badge into the old well on a fishing line.', 'Not everything in a well has sunk.'],
  ['burned house', 'Rescued a forbidden family register before a house was burned.', 'Paper can survive where a roof cannot.'],
  ['missing witness', 'Shelters a witness in a disused charcoal hut.', 'Charcoal smoke hides other sorts of warmth.'],
  ['faithful dog', 'Lets a supposedly dead dog sleep beneath the back step.', 'Sometimes a grave is only a story for the neighbours.'],
  ['soup kitchen', 'Feeds a fugitive with portions counted as kitchen waste.', 'Peelings make better meals than the books suggest.'],
  ['missing tithe', 'Hid the Count’s missing tithe beneath a false grain-bin floor.', 'A full bin can have a surprisingly shallow bottom.'],
  ['family name', 'Removed a family name from a list intended for the Count.', 'A blank line can be a kindness.'],
  ['black carriage', 'Saw the Count’s carriage unload an empty coffin behind the bakehouse.', 'A carriage need not carry a passenger to need a coffin.'],
  ['counted windows', 'Covered a window to conceal a guest from the Count’s servant.', 'Curtains can change the size of a house.'],
  ['borrowed seal', 'Pressed the Count’s seal into bread dough to make a secret copy.', 'Dough remembers a shape for a little while.'],
  ['unsent letter', 'Intercepted a letter reporting a neighbour to the Count.', 'Some letters are best left between their folds.'],
  ['invitation', 'Burned an invitation from the Count and scattered its ashes in the millpond.', 'Fine paper makes such small ashes.'],
  ['sheltered stranger', 'Hid a stranger from the Count’s riders in an empty rain barrel.', 'An empty barrel is not always empty.'],
].map(([subject, text, slip], i) => ({ id: `secret-${i}`, subject, text, slip, count: i >= 24 }));

// Indexes into WANTS/FEARS; places are ordinary locations, not geographical locks.
const role = (label, index, found, day, night, greeting, age = [18, 75], knows = ['haunt', 'report']) => ({
  label, wants: [index, 20 + index % 12], fears: [index, 16 + index % 8],
  knows, found, day, night, greeting, age,
});
export const ROLES = {
  smith: role('smith', 0, ['forge', 'market'], 'sorts bent nails beside the forge', 'banks the forge with damp ash', 'Mind the hot iron', [18, 75], ['weakness', 'report']),
  priest: role('priest', 1, ['chapel', 'graveyard'], 'replaces a guttering chapel candle', 'checks the chapel bolts', 'There is room on the bench'),
  innkeeper: role('innkeeper', 2, ['inn', 'well'], 'scrubs a cup with a clean rag', 'counts keys beneath a lantern', 'Come in and wipe your boots'),
  widow: role('widow', 3, ['home', 'market'], 'shakes crumbs out of a black shawl', 'sets an extra cup on the table', 'Sit where the draught cannot reach you', [35, 85]),
  drunk: role('drunk', 4, ['inn', 'square'], 'turns an empty cup between both hands', 'searches a coat for a missing button', 'I could do with a little company', [21, 75]),
  trader: role('trader', 5, ['market', 'gate'], 'checks a balance against a pebble', 'covers a stall with waxed cloth', 'What have you brought to trade', [18, 75], ['lure', 'report']),
  watchman: role('watchman', 6, ['gate', 'square'], 'inspects the gate hinge', 'shields a lantern from the road', 'Keep the gate clear', [18, 65], ['kill', 'report']),
  farmer: role('farmer', 7, ['field', 'market'], 'rubs a handful of grain between two palms', 'ties a shutter against the wind', 'You look as if you know the road'),
  child: role('child', 8, ['square', 'home'], 'lines up pebbles on a wall', 'peers round a tightly bolted door', 'Have you seen a wooden dog', [8, 15]),
  beggar: role('beggar', 9, ['chapel', 'square'], 'patches a blanket with blue thread', 'makes a bed behind the chapel step', 'Spare a moment if you have no coin'),
  vistana: role('Vistana', 10, ['camp', 'market'], 'checks the spokes of a wagon wheel', 'sets a kettle beside the campfire', 'The kettle will stretch to another cup', [18, 75], ['lure', 'weakness', 'report']),
  "burgomaster's man": role("burgomaster's agent", 11, ['hall', 'gate'], 'smooths a damp notice against a board', 'counts sealed papers by lamplight', 'There is a form for that', [18, 75], ['kill', 'report']),
  gravedigger: role('gravedigger', 12, ['graveyard', 'chapel'], 'scrapes clay from a spade', 'counts grave markers from the gate', 'Best keep to the path'),
  herbwife: role('herbwife', 13, ['garden', 'woodland'], 'ties bitter leaves into small bundles', 'turns drying herbs above the stove', 'Let me see those hands', [18, 85], ['weakness', 'haunt']),
  miller: role('miller', 14, ['mill', 'river'], 'tests the grain between two stones', 'listens to the millwheel through the wall', 'Speak up over the wheel'),
  pilgrim: role('pilgrim', 15, ['road', 'chapel'], 'repairs a strap on a travel bag', 'shelters a candle in both hands', 'Is the chapel still open'),
  elder: role('elder', 16, ['home', 'square'], 'sorts faded letters on a doorstep', 'warms a shawl beside the stove', 'You have the look of someone with news', [65, 89]),
  captive: role('captive', 17, ['cell', 'cellar'], 'feels along a locked door', 'listens at a gap beneath the door', 'Is there someone out there'),
  hermit: role('hermit', 18, ['woodland', 'hut'], 'hangs a washed cloth on a branch', 'feeds a small covered stove', 'Step where I have stepped'),
};
// Existing folk aliases. Dogs deliberately have no human profile.
ROLES.watch = { ...ROLES.watchman };
ROLES.peddler = { ...ROLES.trader };
ROLES.traveller = { ...ROLES.pilgrim, label: 'traveller' };
ROLES.lostChild = { ...ROLES.child, label: 'lost child' };
export const RELATIONS = {
  loves: { lines: ['{a} loves {b}, but has promised to leave before winter'], reply: 'I would like them to stay a little longer' },
  owes: { lines: ['{a} owes {b} three silver and a promise'], reply: 'We have unfinished business' },
  hates: { lines: ['{a} blames {b} for the loss of a winter’s wages'], reply: 'Ask someone with kinder memories' },
  fears: { lines: ['{a} fears that {b} will speak about the night at the gate'], reply: 'Keep my name out of that conversation' },
  serves: { lines: ['{a} works for {b} in exchange for a relative’s shelter'], reply: 'They know where to find me when work is needed' },
  'hides from': { lines: ['{a} hides from {b} whenever the debt bell rings'], reply: 'Do not tell them where we spoke' },
  'is kin to': { lines: ['{a} is kin to {b}, though their households no longer share bread'], reply: 'Families can have very long winters' },
  'informs on': { lines: ['{a} knows about {b} and the {subject}, and sells whispers to the watch'], reply: 'People leave more traces than they think' },
};
