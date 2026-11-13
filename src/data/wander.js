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
