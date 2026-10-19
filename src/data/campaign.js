/* CURSE OF STRAHD — FLOOD EDITION · sessions 0 to 10
   A Flood-style overlay for a Barovia you already own the book for. Nothing here reprints the module:
   run the locations from your book, and use this for what is different, the beats, the read-alouds, the
   encounters (one tap puts them on the map) and the dungeons (one tap builds them).
   The desk material (faces, clocks, omens, roadside, dinner, rumours, stains, counsel) comes from your
   Battle Table's Dark Lord desk.

   THE PREMISE IN ONE BREATH
   Something fell out of the sky into the Svalich Woods: an iron vessel the size of a church, burning green.
   The Mists took it the way they take everything. What was inside climbed out. Above ground the valley calls it
   the Bloom. When it found the stolen-bones font beneath Saint Andral's in Vallaki and went into the water, it
   became the Seep, and it started to think. Strahd did not invite it. That is the whole of his interest in it.
   The Count is the weather. The Bloom is the insult. */

export const CAMPAIGN = {
  id:'cos-flood',
  name:'Curse of Strahd — Flood Edition',
  tagline:'The Count is the weather. The Bloom is the insult.',
  levels:'Level 1 → 6 across sessions 0–10 (milestone)',
  pillars:[
    'Gothic dread first, body horror second. The Bloom is loud; Barovia is quiet. Let them take turns.',
    'Strahd is a host, not a hunter, until he is offended. The Bloom offends him. Use that — he will help, for a price he names later.',
    'Every infection is a clock. Seeded people can be saved — with fire, faith, or Lesser Restoration — if someone cares enough to try.',
    'The land moves. His Gaze rises. His Whim grows. Make the tools on screen do the frightening.',
    'Salt is precious. The Bloom is wet and salt dries it; the valley has almost none, and he made sure of that.',
  ],
  // the "Seeded" rule, shared by Bloom and Seep (also in the bestiary and the app's combat)
  salt:'<b>Salt.</b> The Bloom is wet, and salt dries it. Bloom and Seep creatures will not willingly cross an unbroken line of salt (a sack lays about 30 ft.). A handful thrown at one (an action, ranged 10 ft.) deals 1d6 necrotic and it must use its next move to back away. A Seeded body packed in salt does not rise. Inside the mists, salt is almost impossible to buy.',
  seeded:'<b>Seeded.</b> A humanoid hit by a seeding attack (Sporeling latch, Seed Spit, a Carrier\'s Vent, a Seepling\'s Host Seed) that drops to 0 HP is Seeded: at the start of the next round it rises as a Bloom Vessel (or Seep-Husk below Saint Andral\'s) unless it gets magical healing or Lesser Restoration first, or the body takes fire or radiant damage. The app does all of this automatically.',
};

/* ---------- the clocks (Dark Lord desk) ---------- */
export const CLOCKS = [
  { id:'patience', label:'The Count\'s patience', max:6, start:2, full:'He arrives. Not to fight — to be seen. Dinner, a letter, a visit on the road.' },
  { id:'bloom', label:'Bloom tide', max:8, start:1, full:'At 4: cysts in a holy place. At 8: a Carrier walks a street in daylight. Raise his Gaze by one each time it fills a quarter: he takes it as an insult.' },
  { id:'riot', label:'Vallaki riot', max:4, start:0, full:'The square burns. The Baron\'s festival becomes a mob.' },
  { id:'abbey', label:'Abbey mercy', max:4, start:0, full:'The Abbot\'s experiments reach the Bloom. Krezk gets a Bloom farm.' },
  { id:'salt', label:'The salt runs out', max:6, start:0, full:'There is no salt left to lay on the dead. Every unburied body in the valley rises Seeded by the next dawn.' },
];
export const PLACES = [
  { id:'village', name:'Village of Barovia' }, { id:'woods', name:'Svalich Woods' }, { id:'tser', name:'Tser Pool camp' },
  { id:'crash', name:'The Iron Coffin (the crash)' }, { id:'bonegrinder', name:'Old Bonegrinder' }, { id:'vallaki', name:'Vallaki' },
  { id:'standral', name:'Saint Andral\'s Church' }, { id:'krezk', name:'Krezk / the Abbey' }, { id:'winery', name:'Wizard of Wines' },
  { id:'argyn', name:'Argynvostholt' }, { id:'castle', name:'Castle Ravenloft' }, { id:'berez', name:'Berez' },
];
export const PLACE_STATES = ['quiet', 'watched', 'sealed', 'blooming', 'burned', 'allied'];

/* ---------- faces ---------- */
export const CAST = [
  { id:'count', name:'Strahd, the Count', look:'Tall, exact, always the most composed person in the room.',
    want:'To be chosen, not merely survived.', fear:'A story in his land that is not about him.',
    lever:'Pride. Insult the Bloom and he will help you kill it — for a price he names later.',
    line:'He speaks as if the table already agreed.', die:'If he dies the domain does not get kinder. It gets ownerless.' },
  { id:'ireena', name:'Ireena Kolyana', look:'A burgomaster\'s daughter who has already buried one life.',
    want:'A road that leaves the valley.', fear:'Becoming a costume in someone else\'s romance.',
    lever:'Protect the living in the village and she will walk into worse rooms with you.',
    line:'Short answers. She watches exits.', die:'Her death accelerates every clock. Do not spend her cheap.' },
  { id:'ismark', name:'Ismark Kolyanovich', look:'A man trying to fill a dead father\'s coat.',
    want:'To be taken seriously before he is ready.', fear:'That competence is a costume too.',
    lever:'Give him a job with a measurable end.', line:'He over-explains when frightened.', die:'Can die. The village gets meaner, not empty.' },
  { id:'eva', name:'Madam Eva', look:'Cards that have been handled too many winters.',
    want:'The reading to come true in the ugly way.', fear:'A party that refuses to be read.',
    lever:'Ask a question you are afraid of.', line:'She answers the question under the question.', die:'Do not kill her. The sandbox needs a compass.' },
  { id:'donavich', name:'Father Donavich', look:'A village priest whose holy symbol is worn shiny from being held, not used.',
    want:'One funeral that stays finished.', fear:'That the morning bells are a courtesy the dead no longer need.',
    lever:'Ask him to open the church at night. He will, and he will hate you for the gift.',
    line:'Soft. Then suddenly not.', die:'Can die. The churchyard goes blooming within two dawns.' },
  { id:'lucian', name:'Father Lucian (Saint Andral\'s)', look:'A careful man counting candles that keep going out.',
    want:'His church to be a sanctuary again.', fear:'Learning which of his flock did it.',
    lever:'Bring back the bones. He will owe you everything he has, which is not much.',
    line:'He blesses the water twice. It does not help.', die:'Can die. The font floods the nave by morning.' },
  { id:'vargas', name:'Baron Vargas Vallakovich', look:'A smile that is a locked gate.',
    want:'The walled town to look happy from the walls.', fear:'A festival that tells the truth.',
    lever:'Public humiliation or public praise — both work, both cost.', line:'Every sentence is for an audience.', die:'Killing him starts the Riot clock at 2.' },
  { id:'fiona', name:'Lady Fiona Wachter', look:'Mourning silk and a ledger of grudges.',
    want:'Vallaki under a hand that understands the Count.', fear:'Being caught with the wrong letter.',
    lever:'She will trade a secret about the Baron for one about the Bloom.', line:'Polite in a way that is a threat.', die:'Can die. Her sons get ideas.' },
  { id:'abbot', name:'The Abbot', look:'Kindness with the wiring exposed.',
    want:'To manufacture grace.', fear:'That mercy without wisdom is just another experiment.',
    lever:'Bring him something broken he is not allowed to touch.', line:'Gentle. Wrong.', die:'Can die. The abbey becomes a Bloom farm if you leave the bodies.' },
  { id:'van', name:'The last hunter', look:'Silvered kit that has been repaired more times than the man.',
    want:'One clean kill before the valley takes the rest.', fear:'Becoming useful to the Count.',
    lever:'Trade a true name of a Spawn for a place to sleep.', line:'He talks like a field report.', die:'Can die. Leave his journal; it is a map of mistakes.' },
  { id:'winemaker', name:'The vintner', look:'Purple under the nails, faith in the next harvest.',
    want:'The vines to answer to people again.', fear:'A season with no wedding and no wine.',
    lever:'Protect a wagon and you own a bottle that matters.', line:'He names wines like children.', die:'Can die. The cellar becomes a Bloom pantry.' },
  { id:'marta', name:'Marta Holloway (the Lantern & Ladle)', look:'Flour to the elbows, a ladle she holds like a sceptre.',
    want:'Her salt, her regulars fed, and one winter without anyone she loves going missing.', fear:'That the road is not safe any more, and never will be again.',
    lever:'Feed her a true story and she will feed you for a month.', line:'She tastes everything twice and says "hm."', die:'Session 0 only — she is outside the mists. Let her be the warm thing they remember.' },
  { id:'stranger', name:'The stranger in the Snug', look:'Pale, beautifully dressed, drinking nothing, tipping everyone.',
    want:'To see which of them would follow a friend into the dark.', fear:'Disappointing his master.',
    lever:'He answers one question honestly, then leaves while they are looking at the door.', line:'He speaks as if he has been told all their names already.', die:'He is not the Count. He works for him. He is gone before anyone can roll.' },
];

/* ---------- roll the night (Dark Lord desk) ---------- */
export const NIGHT = {
  omen:[
    'A church bell rings thirteen and then is ashamed.', 'Every dog in town stands up at the same second and looks west.',
    'Wine poured tonight will not catch the light.', 'A child\'s drawing of a wolf has too many joints.',
    'Mist in the shape of a dinner table, briefly, at a crossroads.', 'Crows refuse the chapel roof. They take the well instead.',
    'Someone finds a letter addressed to a player, in a hand they have seen on a castle seal.', 'A scarecrow has moved one field closer to town.',
    'The river runs uphill for the length of a held breath.', 'A cough in the pews that three people claim was theirs.',
    'Green light, very far off in the trees, the colour of nothing that burns.', 'The holy water in the font has a skin on it this morning.',
  ],
  road:[
    '3 Barovian Wolves + 1 Count\'s Wolf. They want a person, not meat. If they get a downed body they leave.',
    'A broken wagon, 2 Scarecrow Watchers pretending to be cargo. Tell: no birds.',
    'Night Spawn on the roof of a shrine, eating the bell-rope. It flees toward the castle if reduced below half.',
    'Mist Thing sits on the road. The road on the other side is not the same road (place them 2 hours off course or on a blooming pin).',
    'A vintner\'s cart, 1 vintner + 2 hirelings, pursued by 2 Bloomed Wolves. Save the cart or tick Bloom +1.',
    'Grave Ghouls (4) arguing over a coffin they have dragged into the ruts. The coffin has a living occupant.',
    'Dinner Guest on horseback, offering a shortcut. The shortcut is real. The price is a name spoken at dinner later.',
    '2 Bloom Stalkers in the canopy. They take the last person in marching order.',
  ],
  dinner:[
    'He seats the loudest player at his right. That player has Advantage on Insight and Disadvantage on leaving the room.',
    'An empty chair is set with a place. He does not say who it is for. If anyone asks, grow the Whim Die.',
    'The wine is safe. The bread is not. DC 14 Insight to notice the swap. Poison: poisoned 1 hour, and he learns a secret they speak while ill.',
    'A Dinner Guest makes a toast. Charm save or they answer one question honestly.',
    'He asks what they would burn to keep one person in the valley alive. Write the answer down. Use it in three sessions.',
    'The wolves under the table are not decoration. If steel comes out they stand first.',
    'He offers a true warning about the Bloom, free. The next favour costs a memory of a sunrise.',
    'Dessert is a letter. It is addressed to someone at the table who has not told the others their real name.',
  ],
  rumor:[
    'The burgomaster is paying extra to keep a particular grave closed.', 'A hunter came through last week with silver and left without his journal.',
    'The abbey is taking in the sick and not giving them back.', 'Something fell in the woods that was not weather. Wolves will not go near the burn.',
    'The winery\'s last wagon never arrived. The road smelled sweet.', 'Ireena walked the wall at dawn and did not look at the castle once. That is new.',
    'A Vistani reading last night ended with the reader putting the cards in the fire.', 'The priest has stopped blessing the well. He says the water is already listening.',
  ],
  stain:[
    'A silvered dagger that hums near Seeded flesh. Once per dawn it can end Seeded on a touch. The Count knows who holds it by dusk.',
    'A bottle of the good year. Drinking it together removes one level of exhaustion and ticks Patience +1.',
    'A wedding ring from an open grave. The wearer cannot be surprised by Undead. Wolves always know where they sleep.',
    'A child\'s ribbon from a Count\'s Wolf\'s teeth. Advantage on Insight against the Count. He will ask for it back, politely.',
    'A cyst-stone, cooled. As a lantern it sheds dim green light 10 ft and keeps Mist Things 15 ft away. Bloom creatures can see it through walls.',
    'A place card from dinner with a player\'s name already written. Tear it: one free success on a social roll in the castle. He writes another.',
  ],
  counsel:[
    'Invite them to dinner before you invite them to die. Hunger is a better leash than fangs.',
    'The Bloom is a guest who did not ask. Treat it as an insult to the house, not as a partner.',
    'If they hide in Vallaki, make the festivals louder. Peace that is performed is already rotting.',
    'Give them a victory that costs a name. They will remember the name longer than the hit points.',
    'Do not speak more than twice in a session. Arrive. Change one object. Leave a card.',
    'When they fight the Bloom, stand on a rooftop and watch. Clap once if they are brave.',
    'The woods close behind them only when they start to feel safe.',
    'Let Ireena choose. Every time you choose for her, you teach them you are the only adult.',
    'A clock that does not tick is furniture. Tick one tonight.',
    'If they ask the dead for help, the dead will help. The invoice arrives at dawn.',
    'Serve the wine first. People tell the truth while they are still flattered.',
    'A scarecrow that points is a map. Follow the finger once. Never twice.',
  ],
};

/* ---------- the fortune (fill in from your own card reading) ---------- */
export const FORTUNE = [
  { id:'tome', label:'The tome (his history)' }, { id:'symbol', label:'The holy symbol' }, { id:'sword', label:'The sword of sunlight' },
  { id:'ally', label:'The ally against him' }, { id:'lair', label:'Where he waits' },
];

/* ---------- the sessions ----------
   scene.enc  = an encounter the app can drop on the map: { label, group:[[creature id, count or dice]], where:'party'|'random'|'nest' }
   scene.delve = a dungeon the app can build: { template, floors, note }
   tick = clocks to move during or after the session (suggested) */
export const SESSIONS = [
  { n:0, title:'Session Zero — Salt for the Lantern & Ladle', level:'1', gaze:1, length:'3–4 hours',
    hook:'The salt carriage from the coast is three days late, and the best cook in Hollin\'s Ford cannot season a stew.',
    premise:'Session Zero in two halves. First the table: tone, safety, and heroes built in the app\'s character creator. Then a gentle first evening of play in the heroes\' home country, well before Barovia: a warm tavern with a bland stew, a village with too many theories, and the Old Salt Road out to where the carriage went over — and where the mists are waiting. It is the last ordinary night they will have for a long time. Make it cosy, so the fog means something.',
    book:'Nothing from the book yet. Hollin\'s Ford is outside Barovia; put it wherever your heroes come from. The mists take them at the end of this session, and session 1 opens at the Narrow House.',
    flood:'Salt matters in this edition. The Bloom is wet, and salt dries it: Bloom creatures will not cross an unbroken line of salt, a handful thrown at one burns it, and a Seeded body packed in salt does not rise. The Count knows. That is why the carriage never arrived, and why the valley inside the mists has almost none.',
    open:'Rain on the shutters, a fire that wants more wood, and eleven people in the Lantern & Ladle pretending the stew is fine. Marta Holloway stands in the kitchen doorway with her arms folded, watching you taste it. "Three days," she says, to no one in particular. "Three days late, and Aldo Brask has not been late once in twenty years." Out past the edge of the village, a dog will not stop barking at the road.',
    scenes:[
      { t:'Before we play: tone & safety', beats:[
        'Lines and veils: body horror, infection, harm to children, and being charmed or controlled (the Count does this, and it takes a hero\'s choices away for a moment). Decide what is off the table and what happens off-screen.',
        'Agree on an X-card or a simple "pause" word. The Bloom is meant to be uncomfortable, not cruel.',
        'Show them the top bar. Strahd\'s Gaze (1–10) is how closely he is watching: the mist thickens, the light reddens, his creatures fight harder, and from 8 his voice gets inside their heads. The Whim Die (🦇) is how he plays with them.',
        'Explain Seeded, and explain salt. Both are fair, and both are on screen.' ] },
      { t:'Build the heroes', beats:[
        'Each player opens the app, signs in with a name and a secret word, and uses Create a character. Level 1, standard array or point buy, SRD 5.2 classes, species and backgrounds.',
        'They join your table with the code; their sheet arrives on your Tokens tab and their token appears in the common room. You keep a copy even after they leave.',
        'Ask each player for: one person they would go back for, one thing they are ashamed of, and one reason they would walk into a fog that smells of churches.' ] },
      { t:'Bonds (go round the table)', beats:[
        'Each hero names one other hero they owe something to, and one they do not trust yet.',
        'Each hero names a smell that means home. Write them down: the Count will serve one of them at dinner, much later.' ] },
      { t:'The Lantern & Ladle', delve:{ template:'saltroad', floors:3, note:'Builds the tavern (floor 1), Hollin\'s Ford (floor 2) and the Old Salt Road (floor 3), furnished. Heroes already at the table start in the common room.' }, beats:[
        'Start with the heroes already in the common room, each with a reason to be here tonight. Read the opening.',
        'Marta Holloway has no salt: the stew is bland, the hams will spoil, and the winter meat cannot be cured. She offers 10 gp a head, and free suppers all winter, to whoever finds the carriage.',
        'Pim the stable boy saw the carriage leave the coast-house a week ago. "It wasn\'t late. Something took it." He wants to come along. Do not let him.',
        'The stranger in the Snug has drunk nothing all night and paid for everyone\'s wine. He asks one hero what they would do for a friend, answers one question honestly, and is gone when they look back.' ] },
      { t:'Hollin\'s Ford', beats:[
        'Floor 2: out through the stable-yard gate. The square is full of theories. Roll a Rumour, or use these: bandits on the coast road; wolves this far south; "the fog came down off the hills two nights ago, and it smelled like a church."',
        'Ilka Brask, the teamster\'s wife, in Brask Cottage: Aldo always stops at the wayshrine to light a candle for the road. If the candle is not lit, he never got that far.',
        'Brother Tamsin at the chapel blesses a pouch of salt for each hero who asks. Give it to them. They will need it.',
        'Halloran\'s Provisions sells everything but salt. Old Hendry at the smithy lends a crowbar and a lantern.' ] },
      { t:'The Old Salt Road', enc:{ label:'Wolves at the carriage', group:[['wolf', 3]], where:'nest' }, beats:[
        'Floor 3. An hour out of the village the road goes quiet: no birds. At the Wayshrine Clearing, Aldo\'s candle is lit, so he got this far. The toll hut is empty, and its door is open.',
        'Where the Carriage Went Over: the carriage on its side, both horses dead and bled white, the salt sacks split. The spilled salt has made a ring in the mud, and every set of tracks stops at its edge.',
        'Three wolves circle the ring and will not cross it. They are ordinary wolves, frightened and hungry. A hero who throws salt sends one yelping. Place them with the button and run a short, scrappy fight.',
        'In the carriage: Aldo\'s ledger (two sacks of salt for the Lantern & Ladle, paid), his lantern, still lit, and a calling card on black paper, unsigned, embossed with a single bat.' ] },
      { t:'The Mist Wall', beats:[
        'North of the clearing the road keeps going, into fog the colour of old pewter. Aldo\'s bootprints walk into it calmly, side by side with a second set that leaves no tread.',
        'Any hero who walks in comes out somewhere else. Any hero who turns back finds the clearing is in front of them again. The road home is gone.',
        'Raise the Gaze to 2 as the fog closes. Roll the Whim Die once, just to show them what it does.' ] },
      { t:'House rules', beats:[
        'Milestone levelling: 2 after the Narrow House\'s first night, 3 when they leave it, 4 after the Iron Coffin, 5 in Vallaki, 6 after Saint Andral\'s.',
        'Inspiration for playing fear well, and for being brave where he can see it (grow the Whim Die when they are).',
        'Death: three failed saves, as normal — unless Seeded. Raising the dead in Barovia always costs something the DM names.' ] },
    ],
    npcs:['marta', 'stranger'], loot:['Two sacks of salt from the carriage (a sack lays about 30 ft. of line, or forty handfuls)', 'A pouch of blessed salt per hero, from Brother Tamsin', 'Aldo Brask\'s ledger', 'A black calling card embossed with a bat'],
    tick:{ salt:1, patience:1 },
    ending:'End when the last hero steps into the mist. Ask each player what their hero is carrying in their left hand as they go. Then stop.',
    levelUp:'Start at 1.' },

  { n:1, title:'Into the Mists — The Narrow House', level:'1 → 2', gaze:2, length:'3–4 hours',
    hook:'Two children at the edge of the fog ask for help. Their house is very tall and very quiet.',
    premise:'The Mists take the party to the edge of a village that is not on any map. Two children beg them to save their baby brother from "the monster in the basement." The house is a gothic trap, and in the Flood Edition the old cult\'s cellar has started to grow.',
    book:'Run the Death House appendix from your book for the upper floors, the children, and the house\'s secrets. Use the app\'s Narrow House template for the map.',
    flood:'The cultists who once lived here dug their ritual chamber down toward something they called "the font beneath." The Bloom found the font first. The cellar walls are slick with grey-green membrane; the cult\'s old dead are half-absorbed into them, and some of them still move.',
    open:'The house leans over the road like a man trying to hear a secret. Every window is dark except one at the very top, where a small light moves from room to room as if someone is looking for something they lost.',
    scenes:[
      { t:'The fog and the children', beats:[
        'The road behind them is gone. The only shelter is the house. The children will not come in with them.',
        'Omen (roll one in the Campaign tab) as they cross the threshold.' ] },
      { t:'The upper house', delve:{ template:'deathhouse', floors:4, note:'Builds the whole house: two upper floors, the cellars, and the bloomed crypt. Start the party on floor 1.' }, beats:[
        'Portraits with scratched-out faces. A nursery that is too clean. Letters that tell the family\'s story (from your book).',
        'Keep the Gaze at 2. Every time they find a family secret, ask one player what their hero hears in the walls.' ] },
      { t:'Something in the walls', enc:{ label:'Rats in the walls', group:[['swarm-of-rats', 2]], where:'party' }, beats:[
        'The first fight is small and fast. Let the rats pour out of a wall that should be solid.' ] },
      { t:'The armour on the landing', enc:{ label:'Animated armour', group:[['animated-armor', 1]], where:'random' }, beats:[
        'It stands guard over a room the children told them not to open.' ] },
      { t:'The attic', enc:{ label:'The specter', group:[['specter', 1]], where:'random' }, beats:[
        'The children\'s room is here. What happened to them is in your book. Play it straight and sad.',
        'The secret way down starts here. Mark it on the map — it is a secret door until someone finds it.' ] },
    ],
    npcs:[], loot:['A family signet ring', 'Letters naming the cult and "the font beneath"', 'A silvered key'],
    tick:{ patience:1 },
    ending:'They find the way down. Something below them coughs, wetly, exactly once. End there.',
    levelUp:'Level 2 at the end of the session.' },

  { n:2, title:'The House Below — Cellars and the Font', level:'2 → 3', gaze:3, length:'3–4 hours',
    hook:'The cult dug down. Something dug up to meet them.',
    premise:'The cellars, the crypts of the family\'s cult, and the ritual chamber at the bottom. In the Flood Edition the chamber is a Bloom nest: the first time the party sees the infection up close, and the first time it sees them.',
    book:'Run the house\'s lower level from the Death House appendix — the crypts, the cult, the ritual — then swap the final monster for the Bloom nest below.',
    flood:'The "monster in the basement" was never the point. The cult\'s ritual pit is now a gestation chamber: a Bloom Vessel wearing the cult leader\'s robe, Sporelings in the bone niches, Cyst Nodes on the altar. If the party is doing well, let them hear something much bigger moving behind the far wall (a Carrier Hulk — do not send it unless they are winning easily).',
    open:'The stairs go down further than the house is tall. The air turns warm and sweet, like fruit left in a closed room. Somewhere ahead, many small things are breathing in unison.',
    scenes:[
      { t:'The crypts', beats:[
        'Floor 3 of the Narrow House delve. Use the Ossuary look. Ghouls and shadows from your book, or populate from the Build tab.',
        'Let them find a cultist\'s journal entry: "The font answers. It is not him that answers."' ],
        enc:{ label:'Crypt ghouls', group:[['ghoul', 2], ['shadow', 1]], where:'random' } },
      { t:'The first Seeded', beats:[
        'A cultist corpse in the niches is still warm and breathing. Lesser Restoration or fire saves the body from rising — or let it rise to teach the rule.',
        'Put a Seeded cultist on the map (Bestiary → Cultist), then apply the ☣ seeded condition and drop it to 0 HP. The app does the rest.' ],
        enc:{ label:'Seeded cultists', group:[['cultist', 2]], where:'random' } },
      { t:'The ritual chamber (Bloom nest)', enc:{ label:'The nest', group:[['bloom-vessel', 1], ['sporeling', 3], ['cyst-node', 2]], where:'nest' }, beats:[
        'Floor 4. Raise the Gaze to 4 when they enter: he has noticed what they found. The walls weep.',
        'The Vessel speaks the cult leader\'s last words in a voice that is not hers.',
        'Fire is the answer here. If nobody brought any, the lantern oil in the crypts is.' ] },
      { t:'If they are winning', enc:{ label:'Something bigger', group:[['carrier-hulk', 1]], where:'nest' }, beats:[
        'Only if the fight was easy. Otherwise, it stays behind the wall and the party hears it leave, going down.' ] },
      { t:'Getting out', beats:[
        'The house tries to keep them (your book has how). Let the Shift help: at Gaze 4, roll on the Shift table once as they flee.' ] },
    ],
    npcs:[], loot:['A cooled cyst-stone (see Stains)', 'The cult leader\'s robe — Bloom creatures ignore its wearer for one round', 'A map of "the font beneath" with Vallaki\'s church marked'],
    tick:{ bloom:1, salt:1 },
    ending:'Outside, the mist has parted onto a muddy road and a village under a castle on a cliff. A wolf sits in the road, watching. It does not attack. It leaves, toward the castle, to report.',
    levelUp:'Level 3 when they leave the house.' },

  { n:3, title:'The Village of Barovia — The Bloomed Chapel', level:'3', gaze:3, length:'3–4 hours',
    hook:'A dead burgomaster, a frightened daughter, and a church where the priest prays loudly to drown out the coughing below.',
    premise:'The village, the tavern, the Kolyana manor and the grieving siblings, and the church on the rise. In the Flood Edition the priest\'s secret in the undercroft is already Seeded: half vampire, half something worse, and the undercroft has bloomed.',
    book:'Run the Village of Barovia chapter: the tavern, the burgomaster\'s mansion, Ismark and Ireena, the shops, the church. Keep the story beats as written.',
    flood:'The priest\'s son was turned by the Count — and then something from the woods got into the undercroft and Seeded what was left. He is now a Night Spawn with Bloom in his veins (use Night Spawn; give him the ☣ seeded condition). If the party kills him with fire or radiant, the bloom dies with him. If not, he rises as a Vessel. The Heart\'s rest moment lives here.',
    open:'The village is quiet the way a held breath is quiet. Shutters closed at noon. One tavern with one lit window. Up on the rise, the church bell is being rung by hand, over and over, by someone who is very tired and very afraid to stop.',
    scenes:[
      { t:'The tavern and the siblings', beats:[
        'Ismark finds them. Let him over-explain. Ireena watches the exits.',
        'Roll a rumour. One of them is about the woods: something fell that was not weather.' ] },
      { t:'The village street', delve:{ template:'barovia', floors:2, note:'Floor 1 is the village street and houses, floor 2 the church undercroft.' }, beats:[
        'Zombies at the doors at night are your book\'s; the Flood twist is that one of them coughs.' ],
        enc:{ label:'Night street', group:[['zombie', 3], ['barovian-wolf', 2]], where:'party' } },
      { t:'The church and the undercroft', enc:{ label:'The priest\'s son', group:[['night-spawn', 1], ['sporeling', 3]], where:'random' }, beats:[
        'The undercroft is the Bloomed chapel. When it goes on the map, play it loud.',
        'The priest begs them not to kill his son. Let them choose. Every choice here is a bad one; let it be theirs.',
        'Raise the Gaze to 5 when the membrane on the walls starts to breathe. He is offended, and he is watching.' ] },
      { t:'The burial', beats:[
        'The burgomaster must be buried in consecrated ground — and the village\'s ground no longer is. Somebody has to bless it, or carry the coffin to a church that is still clean.',
        'The Count may appear at the edge of the churchyard (Patience full, or just because). He does not stay. He looks at the church, then at the party, and says one sentence about the Bloom.' ] },
    ],
    npcs:['ismark', 'ireena', 'donavich', 'count'], loot:['Holy water ×2 from the church — burns Bloom like fire', 'The burgomaster\'s letter (your book)'],
    tick:{ salt:1, bloom:1, patience:1 },
    ending:'Ismark asks them to take his sister to Vallaki, where the walls are high and the church is "still holy." As they agree, the church bell stops. Nobody was ringing it.',
    levelUp:'Stay at 3.' },

  { n:4, title:'The Road West — Tser Pool and the Cards', level:'3 → 4', gaze:3, length:'3 hours',
    hook:'An old woman by a river has been expecting them for a very long time.',
    premise:'The road out of the village, the crossroads, the gallows, and the camp by the river where Madam Eva reads the cards. This is the session that gives the campaign its compass — and the session where the party first sees the green light in the trees.',
    book:'Run the roads and Tser Pool from the Lands of Barovia chapter, including the card reading. Record what the cards say in the Campaign tab\'s Fortune box.',
    flood:'Madam Eva will not touch one card in her deck: it has grown a skin of grey-green. She says the deck has started to read the Bloom as well as the Count, and the Bloom\'s reading is always the same — "the font." She points the party toward the burned place in the woods: "Look at what fell. Then you will understand why he is afraid."',
    open:'The road west climbs into black pines. The fog sits in the trees like wool. At the crossroads the gallows creaks, though there is no wind, and the sign points to places that are not quite where they are.',
    scenes:[
      { t:'The road', enc:{ label:'Wolves on the road', group:[['barovian-wolf', 3], ['count-s-wolf', 1]], where:'party' }, beats:[
        'Roll roadside once. If it says Bloom, use it. If not, the wolves follow from a distance and leave when the party reaches the river.' ] },
      { t:'The camp by the pool', beats:[
        'Music, wine, a fire. Let it feel safe. Then the reading.',
        'Run the card reading from your book. Write each answer in the Fortune box (Campaign tab) so it is never lost.',
        'Madam Eva\'s Bloom card: hand it to a player. It is cold and damp.' ] },
      { t:'The green light', beats:[
        'On the walk back, far off in the trees, a pulse of green light the colour of nothing that burns.',
        'Scarecrows in a field turn their heads to follow it.' ],
        enc:{ label:'Scarecrows that point', group:[['scarecrow-watcher', 2]], where:'random' } },
    ],
    npcs:['eva', 'ireena', 'ismark'], loot:['A Vistani token: safe passage at any Vistani camp', 'The reading (record it!)'],
    tick:{ patience:1 },
    ending:'Ireena, who has said almost nothing all day, asks the party what they think fell in the woods. Then she asks if they are going to look. She is.',
    levelUp:'Level 4 at the end of this session or the next.' },

  { n:5, title:'The Iron Coffin', level:'4', gaze:5, length:'3–4 hours',
    hook:'Something fell out of the sky. Everyone in the valley knows where. No one goes there.',
    premise:'The heart of the Flood Edition. A burned cut through the Svalich Woods leads to a vast iron vessel lying on its side, half buried, still humming. Inside: the Bloom\'s first nest, the last log of whoever crewed it, and a Carrier Hulk that has been waiting for company.',
    book:'Nothing in your book — this is the Flood Edition\'s own location. Build it with the Iron Coffin template.',
    flood:'The vessel is not from any world the party knows. Its crew are all here, every one of them, in the walls. Its last log (read it aloud from a cracked panel) explains nothing and everything: "Quarantine failed. Course set for the nearest dead world. Do not let it reach a living one." The Mists brought it to Barovia anyway. The Count has been watching it from the castle for a month and has not come close. Ask the players why.',
    open:'The trees stop. Not burned — pushed. A furrow a quarter-mile long has been ploughed through the forest, and at the end of it the iron thing lies on its side like a drowned cathedral. Green light pulses somewhere inside, slow as a heartbeat. The wolves that followed you all day sit down at the treeline and will not come any closer.',
    scenes:[
      { t:'The burned cut', delve:{ template:'ironcoffin', floors:4, note:'Floor 1 is the woods around the crash; floors 2–3 the buckled decks; floor 4 the nest at the heart of the wreck.' }, beats:[
        'Bloomed wolves in the cut. The forest is quiet in a way that is wrong.' ],
        enc:{ label:'Bloomed pack', group:[['bloomed-wolf', 3], ['sporeling', 2]], where:'party' } },
      { t:'The decks', beats:[
        'The vessel is on its side: floors are walls, doors are trapdoors. The Shift here is the wreck settling (roll it once per floor).',
        'Raise the Gaze one step per deck. He wants to know what they find.' ],
        enc:{ label:'Deck crew', group:[['bloom-vessel', 2], ['bloom-stalker', 1]], where:'random' } },
      { t:'The log', beats:[
        'A cracked panel still lit. Read the last log aloud. Let the players argue about what it means.',
        'Somebody\'s name is in the crew list. It is a player\'s home-smell from Session Zero, written as a word in a language they cannot read. Do not explain.' ] },
      { t:'The nest', enc:{ label:'The first nest', group:[['carrier-hulk', 1], ['cyst-node', 2], ['sporeling', 3]], where:'nest' }, beats:[
        'The Carrier Hulk is the session\'s boss. It births a Sporeling every turn (automatic).',
        'If they burn the nest: Bloom −2, and the Count sends a letter that is almost congratulations.',
        'If they flee: Bloom +1 at dawn, and the green light is brighter the next night.' ] },
    ],
    npcs:['ireena', 'count'], loot:['A cyst-stone lantern (Stains)', 'A strange iron sidearm — DM\'s call: a +1 light crossbow that never needs reloading, until it does', 'The crew list'],
    tick:{ bloom:-2, patience:1 },
    ending:'Walking out, they find the wolves gone and a carriage on the road, black, empty, door open. A card on the seat in a fine hand: "Well done. You may use my road to Vallaki." Riding in it is the safest thing they could do. That is the problem.',
    levelUp:'Level 4 (if not already).' },

  { n:6, title:'Old Bonegrinder', level:'4 → 5', gaze:4, length:'3 hours',
    hook:'A windmill on the road to Vallaki sells pastries that make the village forget its sorrows.',
    premise:'The crooked windmill and the old woman who bakes there. In the Flood Edition the hags have been buying Bloom spores from the wreck and baking them into their dream-pastries: a village of happy, Seeded sleepers.',
    book:'Run the Old Bonegrinder chapter for the mill, the hags and their trade.',
    flood:'Some pastries in the basket carry spores. Anyone who eats one makes a DC 12 Con save or gains the ☣ seeded condition (removed by Lesser Restoration). The hags think they are farming the Bloom. The Bloom thinks it is farming the hags. Both are right.',
    open:'The windmill leans like it is listening for something underground. Its sails turn although you feel no wind. A sweet smell drifts down the hill: fresh bread, honey, and underneath it, something like fruit left too long in a closed room.',
    scenes:[
      { t:'The road', enc:{ label:'Roadside', group:[['grave-ghoul', 2]], where:'party' }, beats:['Roll roadside. Ireena wants to stop at the mill: she smells bread and remembers being happy once.'] },
      { t:'The mill', delve:{ template:'bonegrinder', floors:3, note:'Ground floor, loft, and the cellar nobody mentions.' }, beats:[
        'The baker is charming. Her daughters are not here, she says. They are.' ],
        enc:{ label:'The coven (scale to taste)', group:[['night-hag', 1], ['green-hag', 1]], where:'random' } },
      { t:'The cellar', enc:{ label:'Spore cellar', group:[['sporeling', 3], ['cyst-node', 1]], where:'random' }, beats:['Sacks of grey-green flour. A ledger of buyers in Vallaki. The Baron\'s steward is on it.'] },
    ],
    npcs:['ireena'], loot:['The hags\' ledger (names in Vallaki)', 'A dream-pastry, wrapped (evidence, or a weapon)'],
    tick:{ bloom:1 },
    ending:'Vallaki\'s walls are in sight. Its gate is closing early, and the guards are checking everyone\'s throats for coughs.',
    levelUp:'Level 5 on arrival in Vallaki.' },

  { n:7, title:'Vallaki — All Will Be Well', level:'5', gaze:3, length:'3–4 hours',
    hook:'A walled town where happiness is the law and the festival is mandatory.',
    premise:'Vallaki: the Baron, his festivals, the Wachter house, the inn, and the church of Saint Andral. The party arrives as heroes of the Iron Coffin — or as suspects, if anyone saw the carriage.',
    book:'Run the Vallaki chapter: the Baron and his festivals, the Blue Water Inn, Lady Wachter, the church of Saint Andral and its stolen bones. Introduce whichever Vallaki threads you like.',
    flood:'Vallaki is the Bloom\'s target. The font beneath Saint Andral\'s connects, through old silver workings, to everything below the valley; the Bloom found it the night the bones were stolen. Father Lucian has noticed the holy water grows a skin overnight. The Riot clock starts here.',
    open:'The walls of Vallaki are high and freshly whitewashed, and someone has painted "ALL WILL BE WELL" across the gate in letters taller than a man. The paint has run in the damp. From inside comes music — a festival — played very loudly, by people who are not smiling.',
    scenes:[
      { t:'The gate and the town', delve:{ template:'barovia', floors:1, note:'Reuse the village look for Vallaki\'s streets, or import your own Vallaki map in the Build tab.' }, beats:[
        'Throat checks at the gate. Ireena is noticed.',
        'The festival: let it be loud and wrong. Tick Riot if the party makes a scene.' ] },
      { t:'The church of Saint Andral', beats:[
        'Father Lucian. The bones are missing (your book). The font is skinned over with grey-green.',
        'Raise the Gaze to 4 inside the church. Something knocks, slowly, from under the floor.' ] },
      { t:'The town\'s secrets', beats:[
        'Lady Wachter will trade a secret about the Baron for one about the Bloom.',
        'The hags\' ledger names the Baron\'s steward. Who they tell decides how fast Riot ticks.' ] },
    ],
    npcs:['vargas', 'fiona', 'lucian', 'ireena'], loot:[], tick:{ riot:1, patience:1 },
    ending:'That night, the church bell of Saint Andral\'s rings once, from below the floor.',
    levelUp:'Level 5.' },

  { n:8, title:'The Bones of Saint Andral', level:'5', gaze:4, length:'3–4 hours',
    hook:'The bones were sold. The church is open to the dark. Find them before the font does.',
    premise:'The hunt for the stolen bones: the gravedigger who took them, the coffin maker who bought them, and the night attack on the church. In the Flood Edition, the night attack comes from both directions at once — the Count\'s spawn from the street, the Seep from the font.',
    book:'Run the Saint Andral\'s bones thread from the Vallaki chapter: the gravedigger, the coffin maker\'s shop and what waits in it, the attack on the church.',
    flood:'The coffin maker\'s upstairs room is your book\'s. His cellar is ours: a Seep-flooded crawlspace that drains toward the church. When the bones are found, the font in the church boils. The Count\'s spawn and the Seep arrive at the same time — and attack each other as well as the party. Let the party see that the Count hates the Seep as much as they do.',
    open:'The coffin maker\'s shop smells of sawdust and varnish and, faintly, of wet stone. Every coffin in the window is lidded. One of them is breathing.',
    scenes:[
      { t:'The coffin maker\'s shop', enc:{ label:'Upstairs (your book\'s spawn)', group:[['spawn', 2]], where:'random' }, beats:['Run it as written.'] },
      { t:'The cellar', enc:{ label:'The crawlspace', group:[['husk', 2], ['seepling', 3]], where:'random' }, beats:[
        'Seep-Husks of missing townsfolk. Their families are at the festival.',
        'The bones are here, in a sack, sweating silver.' ] },
      { t:'The church at night', delve:{ template:'standral', floors:5, note:'Builds Saint Andral\'s and the whole Dread Zone below. The fight is on floor 1 (the chapel).' }, beats:[
        'Spawn from the doors, Seep from the font. Three sides in one fight. Raise the Gaze to 6 — the Shift is now automatic.',
        'Returning the bones to the reliquary mid-fight: Gaze −2, and every Seep creature on floor 1 is stunned for a round.' ],
        enc:{ label:'From the font', group:[['husk', 2], ['seepling', 4], ['bloat', 1]], where:'random' } },
    ],
    npcs:['lucian', 'count', 'ireena'], loot:['The bones (return them!)', 'The coffin maker\'s ledger — he sold one finger-bone to someone else'],
    tick:{ patience:1, bloom:1, riot:1 },
    ending:'The bones are back. The church is holy again — mostly. Father Lucian shows them the crack in the font, which goes down, and down, and has steps cut into it.',
    levelUp:'Stay at 5.' },

  { n:9, title:'Beneath Saint Andral\'s — The Dread Zone', level:'5', gaze:5, length:'3–4 hours',
    hook:'The font goes down. So do they.',
    premise:'The Dread Zone: the undercroft, then the old silver workings the Khundrim dug and abandoned. This is Dread Delve\'s own dungeon — the halls shift, his Gaze climbs, and Saint Andral\'s hands are in the walls.',
    book:'Nothing in your book. Use the Saint Andral\'s delve (built last session) — floors 2 and 3.',
    flood:'Below the church the Bloom has become the Seep: it is in the water now, and it is learning to think. The Silver-Lung Miners are the Khundrim dead the Yield still clings to. Saint Andral himself is down here somewhere, half-saint, half-lich, praying over the font he can no longer keep clean.',
    open:'The steps cut into the crack are old — older than the church. Silver glitters in the walls. Far below, water is running uphill.',
    scenes:[
      { t:'The undercroft', beats:[
        'Floor 2. Candlewights, the Unbaptized, Husk-Templars of the church\'s old knights. Populate from the Build tab or place by hand.',
        'The first Shift happens behind them: the stairs up move. Use the d100 table.' ],
        enc:{ label:'Undercroft watch', group:[['candlewight', 1], ['husktemplar', 1], ['seepling', 2]], where:'random' } },
      { t:'The Silver Vein', beats:[
        'Floor 3. Silver-Lung Miners, Seep-Husks in mining kit, a Bloat-Mourner in a funeral shawl.',
        'A Khundrim hero can talk the miners down (Persuasion DC 15).' ],
        enc:{ label:'Miners', group:[['silverlung', 3], ['bloat', 1]], where:'random' } },
      { t:'The hands begin', beats:[
        'At the bottom of the vein, the walls are covered in handprints. From here on Hand-Swarms claw up out of the floor (Grasping Floor traps and Populate do it for you).' ] },
    ],
    npcs:[], loot:['Silver ore (silvered weapons for the party, given a smith in Vallaki)', 'A Khundrim miner\'s tag: Advantage on checks with the Khundrim dead'],
    tick:{ bloom:1 },
    ending:'A door of fused hands. Behind it, singing — in the voices of everyone the Seep has taken in Vallaki.',
    levelUp:'Level 6 at the end of this session or the next.' },

  { n:10, title:'The Hand-Warrens and the Undertow', level:'5 → 6', gaze:6, length:'4 hours',
    hook:'Something at the bottom of the valley is waking up. It wants to meet them.',
    premise:'The Hand-Warrens, Saint Andral, and the first sight of the Undertow. This is the end of the first arc, not of the campaign: the party cannot kill the Undertow at level 6, and should not try. The goal is to see it, survive it, and seal the font from below with what Saint Andral can give them.',
    book:'Nothing in your book. Saint Andral\'s statblock is in the Bestiary (scale him down hard, or play him as an ally who is losing).',
    flood:'Saint Andral is half-taken. He knows it. If the party reaches him while he is still himself, he will give them a choice: help him seal the font from below (he stays, and the Seep gets him), or carry him out (the font stays open and the Bloom tide jumps). Either way the Undertow wakes, speaks to them in the voice of someone they lost, and lets them go — because it wants them to carry it out.',
    open:'The tunnels are made of hands. Not carved: grown. Thousands of grey palms pressed into the clay, fingers curled toward the light of your torches, and every so often one of them closes.',
    scenes:[
      { t:'The Hand-Warrens', beats:[
        'Floor 4. Hand-Swarms split when they die. The Count is watching this fight with interest: turn the Whim Die to Auto.',
        'The Monstrosity of Hands is optional — at level 5 it is a run-away fight.' ],
        enc:{ label:'The hands', group:[['handswarm', 3]], where:'party' } },
      { t:'Saint Andral', enc:{ label:'The saint (half-taken)', group:[['andral', 1]], where:'random' }, beats:[
        'Talk first. He is lucid between sentences. Ask the party what they will do.',
        'If they fight him, he becomes Half-Taken at half HP (automatic). Do not let this be a fair fight — let them flee.' ] },
      { t:'The Undertow', beats:[
        'Floor 5. Do not roll initiative unless they insist. It is cathedral-sized and it speaks: in the voice of a hero\'s smell-of-home, in the voices of Vallaki\'s missing.',
        'It asks them to "carry it up." It offers a cure for one Seeded person they care about. The price is a cyst in their own chest.',
        'Raise the Gaze to 9, then 10 as they run. The Shift is constant. Let them get out — barely.' ],
        enc:{ label:'What it sends after them', group:[['stalker', 2], ['seepling', 4]], where:'party' } },
      { t:'Dinner', beats:[
        'Back in Vallaki, a black carriage is waiting. An invitation, in a fine hand: dinner at the castle, to discuss "our mutual guest."',
        'Roll a dinner beat. This is the start of Arc II: the Count and the party, uneasy allies against the Undertow — or not.' ] },
    ],
    npcs:['count', 'lucian', 'ireena'], loot:['A finger-bone of Saint Andral (if he gave it): once per dawn, end the Seeded condition on a touch', 'The Undertow\'s bargain — if anyone took it'],
    tick:{ bloom:2, patience:2, salt:1 },
    ending:'The carriage door opens by itself. Inside, a single place card, with a player\'s name already written on it, and under it: "Bring the girl."',
    levelUp:'Level 6.' },
];
