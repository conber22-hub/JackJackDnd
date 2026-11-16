/* Things to find and read in Barovia: the small first set, until ChatGPT's fuller pack (docs/chatgpt/finds.md:
   src/data/finds.js) takes over. All our own words. engine/finds-lite.js places them and rolls what they give. */

export const READ = {
  gravestone:[
    'Here lies Stefan Brezan. He went to fetch the priest.',
    'Mila, aged seven. She is not to be called for, however she asks.',
    'Dorin Vlasca, cooper. His barrels held. He did not.',
    'Anca and Ilie. Married forty years; buried a week apart; not speaking.',
    'NO NAME. The stone is newer than the others, and the earth is turned.',
    'Old Marta, who kept the bees. The hives went quiet the same night.',
    'Here lies a stranger who asked the way to the castle. We told him.',
    'Petru Dragu. Sleep, and do not answer the door.',
    'In memory of the Lazar boys, lost in the woods. Their father still looks.',
    'Ileana, loved. Someone has scratched a second date beneath the first.',
    'Grigore the miller, who ground for us all. Not flour, at the end.',
    'Vasile, fourth of that name. The other three are buried facing away.',
  ],
  shrine:[
    'A wooden sun, its gilt long gone. Someone has left a candle stub and three copper coins.',
    'A shrine to the Morninglord. The prayer carved on it has been worn smooth by thumbs.',
    'A niche with a clay saint. Her face has been turned to the wall.',
    'Dried flowers, a lock of hair tied with thread, and a child\'s drawing of the sun.',
    'A shrine to Mother Night, newer than it should be. The offering bowl is still wet.',
    'A cracked icon of Saint Markovia. Fresh wax has been pressed into the crack.',
  ],
  carving:[
    'Cut deep into the bark: DO NOT FOLLOW THE LIGHTS.',
    'Initials in a heart, and under them, in another hand: GONE.',
    'Tally marks, dozens of them. The last few are scratched, not cut.',
    '"Ismark was here" — and below it, smaller, "and went home".',
    'A crude sun, its rays scored again and again until the wood split.',
    'An arrow pointing back the way you came, and the word: BACK.',
    'Three names. Two have been crossed out by the same blade.',
    'A wolf\'s head, carved well and with care, by someone who had time.',
  ],
  notice:[
    'BY ORDER OF THE BURGOMASTER: doors shut and barred at dusk. No exceptions.',
    'MISSING: Dana, aged nine, red scarf. Last seen by the well. Ask at the church.',
    'Wanted: a man to dig. Good pay. Ask for Doru at the tavern before dark.',
    'Wolves seen by the river road. Travellers go in threes or not at all.',
    'The Festival of the Blazing Sun will be joyful. Attendance is required.',
    'Lost: one black dog, answers to nothing. If found, do not let it in.',
    'Salt for sale, a copper a handful. Line your sills.',
    'The bell will ring at dusk. When it rings a second time, do not open.',
  ],
  statue:[
    'A soldier in old armour, his sword broken at the hilt. Moss has filled his eyes.',
    'A weeping woman in stone. Rainwater runs down her cheeks in the right places.',
    'A nobleman with the Zarovich nose. The plinth\'s name has been chiselled away.',
    'A saint with open hands. Somebody has put a raven\'s feather in each.',
  ],
  well:[
    'You lean over. Far down, the water gives your face back, a moment late.',
    'A bucket on a fraying rope. The water smells of iron and old leaves.',
    'Coins at the bottom, silver among the copper. Nobody fishes them out.',
    'A cover has been nailed half over it. From below, a slow drip.',
  ],
  milestone:[
    'A milestone, the numbers worn away. A ribbon is tied round it, faded grey.',
    'Carved: VALLAKI, and an arrow. Someone has added a skull beside the arrow.',
    'Moss over everything but a single word: HOME.',
    'A stone with a sun on it. The road beyond it seems a little darker.',
  ],
};

export const PAGES = [
  { id:'tolan-1', thread:'tolan', n:1, title:'A tinker\'s diary, page 1', text:'Came through the fog on the third day. The guard at the gates was not a guard. He was not anything. We drove past him and he did not turn his head.', where:['road', 'village'] },
  { id:'tolan-2', thread:'tolan', n:2, title:'A tinker\'s diary, page 2', text:'The village has no market. They trade in salt and silence. A woman bought a needle with a lock of her daughter\'s hair and would not say why.', where:['village', 'town'] },
  { id:'tolan-3', thread:'tolan', n:3, title:'A tinker\'s diary, page 3', text:'The mule will not go west. I have stopped asking it to. Tonight there were lights in the trees, low, and they kept pace with us.', where:['road', 'woods'] },
  { id:'tolan-4', thread:'tolan', n:4, title:'A tinker\'s diary, last page', text:'If anyone reads this: the road turns back on itself. Do not trust the milestones. Do not trust the fog. Do not trust me, if you meet me.', where:['road', 'woods'] },
  { id:'ledger', title:'A page from a ledger', text:'Received of the Vistani: wine, six barrels. Paid: two sheep, one silver mirror, and the name of the miller\'s eldest. Balance: owed.', where:['village', 'town', 'interior'] },
  { id:'letter', title:'An unsent letter', text:'Dear Anya, the harvest failed again but we are well. Father says the castle has asked for nothing this year. I do not know why that frightens him more.', where:['interior', 'village'] },
  { id:'hymn', title:'A torn hymn sheet', text:'Lord of the morning, find us at the door; / we kept the candle and we kept the floor. The last line has been written over in charcoal: HE DOES NOT COME.', where:['church', 'interior', 'village'] },
  { id:'map', title:'A scrap of map', text:'The road from the gates, drawn badly. Someone has marked a spot in the woods with an X and written: NOT HERE. FURTHER.', where:['road', 'woods'] },
];

export const TRINKETS = [
  { n:'Tin wolf charm', gp:1 }, { n:'Child\'s tooth in a locket', gp:2 }, { n:'Candle stub stamped with a sun', gp:0 },
  { n:'Silver thimble', gp:3 }, { n:'Bone dice, one missing a face', gp:1 }, { n:'Rosary of dried rowan berries', gp:1 },
  { n:'Brass key to nothing', gp:1 }, { n:'Pressed violet in wax paper', gp:0 }, { n:'Cracked hand mirror', gp:2 },
  { n:'Vistani coin with a hole in it', gp:2 }, { n:'Wooden saint, thumb-sized', gp:1 }, { n:'Ribbon of faded red silk', gp:0 },
];

// Outcomes: weighted { w, say, gp?, trinket?, page?, potion? }
export const SEARCH = {
  barrel:[{ w:5, say:'Rainwater, and something drowned in it a long time ago.' }, { w:3, say:'Salt, gone hard. Nothing else.' }, { w:1, say:'Under the false bottom, a little purse.', gp:4 }, { w:1, say:'A bottle wrapped in sacking.', potion:true }],
  crate:[{ w:5, say:'Straw and mouse droppings.' }, { w:2, say:'Old tools, rusted to one piece.' }, { w:2, say:'Wedged in a corner, something small.', trinket:true }, { w:1, say:'A few coins someone hid and forgot.', gp:3 }],
  sacks:[{ w:5, say:'Grain, grey with mould.' }, { w:2, say:'Wool, and a moth that flies straight at your face.' }, { w:1, say:'Folded inside, a page.', page:true }],
  chest:[{ w:3, say:'Linen, and the smell of cedar.' }, { w:3, say:'Coins wrapped in a stocking.', gp:6 }, { w:2, say:'A keepsake, kept carefully.', trinket:true }, { w:1, say:'A small flask, stoppered with wax.', potion:true }],
  bookshelf:[{ w:5, say:'Prayers, almanacs, a herbal with the pages stuck together.' }, { w:2, say:'Pressed between two books, a page in another hand.', page:true }, { w:1, say:'A hollowed book with coins in it.', gp:5 }],
  desk:[{ w:4, say:'Dried ink and a broken pen.' }, { w:3, say:'A letter, never sent.', page:true }, { w:1, say:'A drawer with a false back.', gp:4 }],
  wardrobe:[{ w:5, say:'Coats that smell of someone.' }, { w:2, say:'A pocket with something in it.', trinket:true }],
  cart:[{ w:4, say:'Mud, straw, a broken wheel pin.' }, { w:2, say:'Under the seat, a few coins.', gp:2 }],
  wagon:[{ w:4, say:'Empty, but for a child\'s shoe.' }, { w:2, say:'Tucked behind a board, a page.', page:true }],
  coffin:[{ w:4, say:'Dust. Only dust. You are almost sure.' }, { w:1, say:'A grave-gift, left for the dead.', trinket:true }],
  hay:[{ w:5, say:'Hay. Something rustles away inside it.' }, { w:1, say:'A glint in the straw.', gp:1 }],
  woodpile:[{ w:5, say:'Split logs, damp through.' }, { w:1, say:'A small tin box, hidden in the stack.', gp:3 }],
};
export const GLINT = {
  village:[{ w:4, say:'A few coppers in the mud.', gp:1 }, { w:3, say:'A small thing someone dropped.', trinket:true }, { w:2, say:'A page caught on a nail.', page:true }, { w:1, say:'A stoppered vial, still full.', potion:true }],
  town:[{ w:4, say:'A coin, pressed into the cobbles.', gp:2 }, { w:3, say:'Something small and lost.', trinket:true }, { w:2, say:'A page, folded small.', page:true }],
  road:[{ w:3, say:'A purse, slashed open, with a little left in it.', gp:3 }, { w:3, say:'A keepsake in the grass.', trinket:true }, { w:3, say:'A page blowing in the ditch.', page:true }, { w:1, say:'A traveller\'s healing draught.', potion:true }],
  woods:[{ w:3, say:'Coins scattered among the roots.', gp:2 }, { w:3, say:'Something hung on a branch.', trinket:true }, { w:3, say:'A page, rain-stained.', page:true }],
  interior:[{ w:4, say:'A coin under the floorboard.', gp:2 }, { w:3, say:'A keepsake.', trinket:true }, { w:2, say:'A page tucked away.', page:true }],
};
export const HOW_MANY = { village:{ min:3, max:5, hidden:2 }, town:{ min:3, max:5, hidden:2 }, road:{ min:2, max:4, hidden:1 }, woods:{ min:2, max:4, hidden:1 }, interior:{ min:1, max:2, hidden:1 }, crypt:{ min:1, max:3, hidden:1 }, church:{ min:1, max:2, hidden:0 }, castle:{ min:1, max:3, hidden:2 }, camp:{ min:1, max:3, hidden:1 } };
