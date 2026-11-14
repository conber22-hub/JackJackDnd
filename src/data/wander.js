/* 🗡 THE WANDERER's words: the companions a hero can meet and take along, and what the valley says as they go
   (game/wander.js, engine/wander.js). The companions are this game's own people, not the book's. */

/* A companion: who they are, where they wait (a valley place, and near what), their sheet (class, species,
   weapons, spells: built with engine/hero.js like any hero; near: a word in the name of the room they wait in), and the talk: what they say when met, the ask, and
   what it takes to win them over (a skill check the game rolls for the hero, or nothing at all). */
export const COMPANIONS = [
  { id:'ilse', name:'Ilse Varga', cls:'Fighter', sp:'Human', place:'village', near:'square', color:'#9a6a4a',
    weapons:['Halberd', 'Light Crossbow'], spells:[],
    title:'the last of the village watch', blurb:'A tall woman in a watch-coat three sizes too big for anyone, a notched halberd across her knees.',
    hello:'"Another one out of the fog. You have the look: lost, armed, not yet sorry." She does not get up. "Ilse. I kept the watch here, when there was a watch."',
    ask:'"Where am I going? Nowhere. That is the trouble with this valley: every road comes back to the gallows."',
    pitch:'You tell her the road west goes somewhere, and you mean to find where.',
    yes:'She is on her feet before you finish. "Then I am coming. If I die out there, at least it will be somewhere new."',
    no:'"Words. Everybody has words." She turns back to the fire. "Come back when you have done something."',
    check:{ skill:'Persuasion', dc:10, alt:'Intimidation' }, join:'Ilse Varga joins you, halberd on her shoulder.' },
  { id:'dorin', name:'Brother Dorin', cls:'Cleric', sp:'Human', place:'village', near:'church', color:'#7d7a9a',
    weapons:['Mace'], spells:['Sacred Flame', 'Cure Wounds', 'Guiding Bolt', 'Bless'],
    title:'a priest who stopped praying', blurb:'A thin man in a grey habit, sitting on the church steps with a cold candle in his hands.',
    hello:'"The Morninglord does not answer here." He says it the way other men say good morning. "I am Dorin. I still have the hands for it, if not the faith."',
    ask:'"I heal whoever asks. Nobody asks. They have stopped expecting to get better."',
    pitch:'You ask him to come and heal those who still fight, on the road.',
    yes:'He blows on the candle, and for a moment it catches. He looks at it a long time. "Well. One more try, then."',
    no:'"No. Not yet." He folds his hands round the candle again. "Ask me when you have bled for something."',
    check:{ skill:'Insight', dc:11, alt:'Persuasion' }, join:'Brother Dorin joins you, the candle tucked into his belt.' },
  { id:'tamas', name:'Tamas Holt', cls:'Rogue', sp:'Halfling', place:'vallaki', near:'gate', color:'#5f7a52',
    weapons:['Shortsword', 'Shortbow'], spells:[],
    title:'a lamplighter with light fingers', blurb:'A halfling on a crate by the gate, a lamplighter\'s pole across his lap and somebody else\'s purse in his coat.',
    hello:'"You came up the west road? Through all that?" He grins. "Tamas. I light the lamps, and I count what the Baron forgets he owns."',
    ask:'"This town smiles because it is told to. I would rather be somewhere that frowns honestly."',
    pitch:'You offer him the road, and a fair share of whatever it gives.',
    yes:'"A fair share. Nobody has offered me a fair anything in years." He shoulders the pole. "Lead on."',
    no:'"Mm. I have heard better offers from the gallows." He goes back to counting.',
    check:{ skill:'Persuasion', dc:12, alt:'Deception' }, join:'Tamas Holt joins you, pole on his shoulder.' },
];
export const companionById = id => COMPANIONS.find(c => c.id === id) || null;

// The first thing the Wanderer sees.
export const WAKE = {
  title:'You wake in the Village of Barovia',
  flair:'Cold stone under you, fog in your mouth. You do not remember the road in, only the wall of white behind you, and the feeling of being watched from somewhere high. A tavern has one window lit. The church bell does not ring.',
  lines:['Walk with the left stick (or WASD). Ⓐ (Space) talks, opens and climbs. ☰ (M) is the menu: travel, rest and save.'],
};

// What the road says when something comes out of the trees (one at random), and when a fight is over.
export const AMBUSH = [
  'The birds stop. Then the trees move.',
  'Something has been walking beside you in the fog for a while now. It stops pretending.',
  'A shape on the road ahead, and another behind.',
  'The smell reaches you first: wet fur, and old blood.',
];
export const WON = ['The road is quiet again. It will not stay that way.', 'You catch your breath. Somewhere up the valley, a window in the castle goes dark.', 'Nothing else comes. Not yet.'];
export const LOST = { title:'The Mists close over you', flair:'You fall, and the fog comes down, and for a long time there is nothing at all. Then: cold stone, and a lit window, as if none of it happened. It did.' };

/* ---------- the long road (engine/wander-life.js) ---------- */
/* What each companion thinks of a deed (a roadside choice's tags; engine/wander-life.js reactions), and what they say
   when it moves them, and about the hero as they come to feel. Their own quest opens at `need` approval. */
export const LIKES = {
  ilse:{ mercy:6, brave:5, law:4, greed:-5, cruel:-10, cold:-3 },
  dorin:{ mercy:10, faith:8, brave:2, cruel:-12, greed:-4, cold:-5 },
  tamas:{ greed:6, clever:6, brave:2, law:-5, faith:-3, cruel:-6 },
};
export const MOOD = {
  ilse:{ up:'Ilse nods, once. That is a lot, from her.', down:'Ilse says nothing. Her jaw says it for her.',
    devoted:'"You are the first person in years I would follow into the dark without asking why."', warm:'"You are not as lost as you look."',
    wary:'"I am still deciding about you."', cold:'"Do not mistake me for your dog."', leaving:'"We are done. I will find my own way back."' },
  dorin:{ up:'Dorin touches the cold candle at his belt, as if checking it is still there.', down:'Dorin looks away, and murmurs something that is almost a prayer.',
    devoted:'"Something in me is waking up. I think it is you that woke it."', warm:'"You are kinder than this valley deserves."',
    wary:'"I watch what you do. It is what I have instead of faith."', cold:'"I came to heal. Not to bless whatever this is."', leaving:'"I will not walk behind you any further. Go with whatever god will have you."' },
  tamas:{ up:'Tamas grins and mouths: "Nice."', down:'Tamas rolls his eyes so hard you can hear it.',
    devoted:'"Partner. Real partner. I have never had one of those."', warm:'"You are all right. For someone who walks into fog on purpose."',
    wary:'"Still counting the angles on you."', cold:'"I have worked for worse. Not much worse."', leaving:'"This is where I get off. Do not follow me; I am very good at not being found."' },
};

/* Quests. from: 'start' (given on waking), 'folk' (the first of the village folk the hero talks to), or a companion's id
   (asked for when they like the hero enough: need). Steps: arrive at a place, win fights (on a road: road:true; near:
   a road to or from that place), or rest the night somewhere. */
export const QUESTS = [
  { id:'west', from:'start', title:'The road west', text:'Every road in this valley seems to bend back toward the village. Somewhere west, they say, is a town with walls, and people who still light lamps. Find it.',
    steps:[{ k:'arrive', place:'vallaki', say:'Reach Vallaki, west along the Old Svalich Road' }], reward:{ xp:300, gp:25, text:'Walls. Lamps. People who look at you and do not quite smile. It is not safe here, but it is somewhere.' } },
  { id:'wolves', from:'folk', title:'Thin the wolves', text:'"The wolves are thick on the road this year. Kill a few and the burgomaster\'s house will pay. Nobody else will go."',
    steps:[{ k:'win', road:true, n:2, say:'Win two fights on the roads' }, { k:'arrive', place:'village', say:'Go back to the Village of Barovia for the bounty' }],
    reward:{ xp:150, gp:30, item:'Potion of Healing', text:'A servant at the burgomaster\'s door counts out the coins without looking at you, and shuts the door before you have finished counting them yourself.' } },
  { id:'ilse-post', from:'ilse', need:25, title:'The last post', text:'"The watch kept a post at the crossroads, by the gallows. I was the last one to stand it. I want to see it again, and I want whatever is on that road to know I came back."',
    steps:[{ k:'arrive', place:'crossroads', say:'Take Ilse to the Gallows Crossroads' }, { k:'win', road:true, near:'crossroads', say:'Win a fight on a road to or from the crossroads' }],
    reward:{ xp:200, approve:{ ilse:20 }, text:'Ilse wipes her halberd on the grass and looks up at the empty gibbet for a long time. "There. Relieved of duty." She almost smiles.' } },
  { id:'dorin-candle', from:'dorin', need:25, title:'A candle for Krezk', text:'"There is an abbey above Krezk. They say the light there still answers. I would like to light this candle in it, and see what happens."',
    steps:[{ k:'arrive', place:'krezk', say:'Take Brother Dorin to Krezk' }, { k:'rest', place:'krezk', say:'Spend a night in Krezk' }],
    reward:{ xp:250, approve:{ dorin:25 }, item:'Potion of Healing', text:'In the night Dorin comes back from the abbey with the candle lit, cupping it like a living thing. He does not say what happened. He does not need to.' } },
  { id:'tamas-ledger', from:'tamas', need:25, title:'The Baron\'s ledger', text:'"The Baron keeps a ledger of what everyone in Vallaki owes him. I would like to keep it for a night. Just to read it. Mostly."',
    steps:[{ k:'arrive', place:'vallaki', say:'Take Tamas to Vallaki' }, { k:'rest', place:'vallaki', say:'Spend a night in Vallaki while Tamas works' }],
    reward:{ xp:200, gp:60, approve:{ tamas:20 }, text:'Tamas is back before dawn, ink on his fingers and a bag that clinks. "Half the town owes the Baron for its own lamp oil. Well. Not any more."' } },
];
export const questById = id => QUESTS.find(q => q.id === id) || null;

/* Roadside scenes: met on the road now and then, each once a run. A choice's check is the hero's skill (the game rolls
   the d20); tags are what the companions make of it; ok / fail: what comes of it (xp, gp, item, heal: everyone,
   hurt: the hero, gaze: the Count's attention). */
export const MOMENTS = [
  { id:'cart', title:'A cart in the mud', text:'An old woman stands by a cart sunk to its axles in the road, a sack of turnips and a covered basket in the back. She does not ask for help. She just watches you come.',
    options:[
      { k:'push', label:'Put your shoulder to the wheel', check:{ skill:'Athletics', dc:11 }, tags:['mercy'], ok:{ text:'The cart lurches free. She presses a stoppered bottle into your hand: "For the road. It is not wine."', xp:50, item:'Potion of Healing' }, fail:{ text:'Your foot goes from under you and the wheel comes down on it. The cart comes free on the third try, and she thanks you quietly.', xp:25, hurt:3 } },
      { k:'basket', label:'Help yourself to the basket while she watches the wheel', check:{ skill:'Sleight of Hand', dc:12 }, tags:['greed', 'cruel'], ok:{ text:'Coins, a few, wrapped in a cloth. She never looks round.', gp:12 }, fail:{ text:'Her hand closes on your wrist, light as a bird and strong as a trap. "Go," she says. You go. Behind you, she begins to laugh.', gaze:1 } },
      { k:'by', label:'Walk on by', tags:['cold'], ok:{ text:'Her eyes follow you all the way round the bend.' } },
    ] },
  { id:'hanged', title:'A man on a rope', text:'A man hangs from an oak by the road, his toes just touching a stump, a board round his neck: THIEF. He is still alive. He sees you, and his lips move.',
    options:[
      { k:'cut', label:'Cut him down', tags:['mercy', 'brave'], ok:{ text:'He drops, gasping, and is gone into the trees before you can ask his name. Later you find he slipped a few coins into your pack as he passed. A thief to the last.', xp:50, gp:8 } },
      { k:'law', label:'Leave him. Someone hanged him for a reason', tags:['law', 'cold'], ok:{ text:'The board creaks. You do not look back.' } },
      { k:'boots', label:'Take his boots. He won\'t need them', tags:['cruel', 'greed'], ok:{ text:'Good boots. You get four silver for them later, and they never quite stop feeling warm.', gp:4, gaze:1 } },
    ] },
  { id:'shrine', title:'A roadside shrine', text:'A little stone house no bigger than a dog kennel, with the Morninglord\'s sun cut over the door. Inside: a bowl of tarnished coins, and the stub of a candle.',
    options:[
      { k:'pray', label:'Kneel and pray', check:{ skill:'Religion', dc:11 }, tags:['faith'], ok:{ text:'For a moment there is warmth on the back of your neck, like sun. Everyone\'s hurts ease.', heal:6, xp:25 }, fail:{ text:'Nothing. The fog, and the cold stone under your knees.' } },
      { k:'give', label:'Leave a coin in the bowl', tags:['faith', 'mercy'], ok:{ text:'The coin rings against the others. Somewhere far off, a bell answers, once.', gp:-1, xp:25 } },
      { k:'take', label:'Empty the bowl', tags:['greed'], ok:{ text:'Twenty-odd coins, most of them copper. The candle stub falls over as you lift the bowl.', gp:3, gaze:1 } },
    ] },
  { id:'peddler', title:'A peddler at a fire', text:'A Vistani peddler sits at a fire by the road, her wagon painted with eyes. "Potions, traveller. Red as heart\'s blood. Fifty gold, and cheap at the price."',
    options:[
      { k:'buy', label:'Buy a Potion of Healing (50 gp)', need:{ gp:50 }, tags:[], ok:{ text:'She wraps it in a scrap of silk. "Do not drink it before you need it."', gp:-50, item:'Potion of Healing' } },
      { k:'haggle', label:'Haggle', check:{ skill:'Persuasion', dc:13 }, need:{ gp:25 }, tags:['clever'], ok:{ text:'She laughs and takes twenty-five. "For the cheek."', gp:-25, item:'Potion of Healing' }, fail:{ text:'"Fifty," she says, and spits in the fire. "Or nothing."' } },
      { k:'tale', label:'Sit and trade stories', check:{ skill:'Performance', dc:10 }, tags:['clever'], ok:{ text:'She listens to all of it, and tells you one back about a man who walks into the mists and walks out again older. You do not sleep well, but you know the road better.', xp:50 }, fail:{ text:'She yawns. "Go on, then. Go on down your road."' } },
    ] },
  { id:'pup', title:'A pup in a snare', text:'A wolf pup, grey and starving, caught by its leg in a snare by the road. It snarls at you with everything it has. Somewhere in the trees, something bigger is listening.',
    options:[
      { k:'free', label:'Free it', check:{ skill:'Animal Handling', dc:12 }, tags:['mercy'], ok:{ text:'It bolts. A moment later a long howl goes up from the trees, and then, strangely, the road is quieter than it has been all day.', xp:50 }, fail:{ text:'Its teeth meet in your hand before it bolts.', hurt:4, xp:25 } },
      { k:'end', label:'End it quickly', tags:['cold'], ok:{ text:'Quick. Clean. The howl, when it comes, goes on a long time.' } },
      { k:'leave', label:'Leave it for the trappers', tags:['law'], ok:{ text:'Its whining follows you a long way.' } },
    ] },
];
export const momentById = id => MOMENTS.find(m => m.id === id) || null;
