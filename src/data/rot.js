// Stages replace one another. The conditions and roll edges are instructions for the table.
export const ROT_STAGES = [
  { stage:0, n:0, name:'Untouched', text:'Your breath is your own.', mechanics:[] },
  { stage:1, n:3, name:'Tinged', text:'Your sweat smells of wet pages.', mechanics:[
    { kind:'advantage', on:'save', against:'Seep spores', text:'Advantage on saves against Seep spores.' },
    { kind:'disadvantage', on:'check', ability:'cha', against:'unseeded creatures', text:'Disadvantage on Charisma checks to gain an unseeded creature’s trust.' },
  ] },
  { stage:2, n:8, name:'Rooted', text:'When you hold your breath, something keeps breathing.', mechanics:[
    { kind:'advantage', on:'save', against:'Seep spores', text:'Advantage on saves against Seep spores.' },
    { kind:'disadvantage', on:'save', against:'Seep', condition:'frightened', text:'Disadvantage on saves against being frightened by the Seep.' },
  ] },
  { stage:3, n:16, name:'Near Taken', text:'Your echo sometimes finishes the sentence for you.', mechanics:[
    { kind:'advantage', on:'check', ability:'wis', against:'nearby Seep', text:'Advantage on Wisdom checks to sense nearby Seep creatures.' },
    { kind:'disadvantage', on:'check', ability:'cha', against:'unseeded creatures', text:'Disadvantage on Charisma checks to gain an unseeded creature’s trust.' },
    { kind:'condition', condition:'deafened', trigger:'Seep enters within 5 feet', limit:'once per scene', duration:'until the end of your next turn', text:'The first time a Seep creature comes within 5 feet in a scene, its voice briefly deafens you to the world.' },
  ] },
  { stage:4, n:30, name:'Taken', text:'There is room in your voice for all the others.', mechanics:[
    { kind:'advantage', on:'check', ability:'wis', against:'nearby Seep', text:'Advantage on Wisdom checks to sense nearby Seep creatures.' },
    { kind:'disadvantage', on:'check', ability:'cha', against:'unseeded creatures', text:'Disadvantage on Charisma checks to gain an unseeded creature’s trust.' },
  ] },
];

export const ROT_SIGNS = {
  villager:[
    'There is nothing amiss that you can see.',
    'There is a smell of books left in the rain.',
    'Their cup stays cold even with both hands around it.',
    'Their echo speaks after everyone else has gone quiet.',
    'They smile as though someone behind you has come home.',
  ],
  priest:[
    'The blessing falls quietly. You recognise no sign of the rot.',
    'The blessing catches on the damp in their breath. The rot has touched them.',
    'The blessing fades between one breath and the next. The rot has put down roots.',
    'Two voices answer the blessing. The Chorus is close to taking them.',
    'The blessing comes back in a crowd of voices. They have been taken.',
  ],
  seep:[
    'A stranger. Warm, with no song in them.',
    'A little of our weather on their skin.',
    'Kin. There is a place for that voice already.',
    'Kin at the door. We can hear them from the far rooms.',
    'Ours. Their voice comes from every room at once.',
  ],
};

export const CHORUS_WHISPERS = {
  rest:[
    'Leave the latch up. We know how to sit quietly.',
    'Give us the edge of the blanket. You can keep the middle.',
    'There is still a warm place on the pillow where you used to lay your head.',
    'You needn’t keep watch in your sleep. We can count the footsteps.',
    'Tell us one thing you want to dream of. We will mind the rest.',
    'You can put down your name for a little while. We will hold it.',
  ],
  down:[
    'Stay where you are. We know the way back to your hands.',
    'Let us count the breaths. You have done enough counting.',
    'Look for the little light. We have kept it on for you.',
    'You don’t have to stand all at once. Lend us one knee.',
    'It is a long way to the floor alone. We are here now.',
    'You can let go of the stair rail. We are on the step below.',
  ],
  kill:[
    'Take your time. We will keep the room still.',
    'That was a difficult thing. We can carry the quiet after it.',
    'You can open your hand. Nothing here will take it from you.',
    'We saw you hesitate. We will remember that part for you.',
    'Someone ought to say you did well. May it be us?',
    'Keep the name if you need it. We can keep the rest.',
  ],
  alone:[
    'If you hum, we can take the lower part.',
    'Take the wider path. There is room beside you on that one.',
    'You always took your tea a little too hot. We remember.',
    'We like the way you say home. Say it again, just here.',
    'You can turn round. We won’t make a face you know unless you ask.',
    'You needn’t finish the story. We have been listening all the way.',
  ],
};

export const CHORUS_OFFERS = {
  rest:{ kind:'heal', amount:4, text:'Let us put back a little of what the road took. Recover 4 hit points for one mark.' },
  down:{ kind:'heal', amount:2, text:'We can lend you the next breath. Recover 2 hit points for one mark.' },
  kill:{ kind:'reroll', on:'d20', expires:'next long rest', text:'We can give you one more try. Reroll one of your d20 tests before your next long rest and keep the new result. It costs one mark now.' },
  alone:{ kind:'reveal', topic:'pursuer', text:'Give us one mark and we will tell you who is hunting you.' },
};

// The caller owns the scene, items and use ledger. These are per-hero limits except for the relic.
export const ROT_CURES = {
  holyPlace:{ remove:1, limit:'once per completed night at a clean holy place', text:'By dawn, one of the voices has fallen quiet.' },
  holyWater:{ remove:1, limit:'one flask and at most once between long rests', burn:{ dice:'1d4', type:'radiant' }, text:'The holy water burns. One mark washes away.' },
  chaplain:{ remove:2, calling:'chaplain', limit:'once per recipient between long rests', text:'The Chaplain speaks your name until it sounds like yours again.' },
  dutchOven:{ remove:1, limit:'once per completed night and once per visit', text:'The Seep never got Dutcher, and it doesn’t like the smell of his bread. In the morning, one mark is gone.' },
  andral:{ remove:4, limit:'one use of the relic in the campaign', text:'Saint Andral’s finger-bone is warm in your palm. For a moment you hear only your own breathing.' },
};

export const TAKEN_OUTCOMES = [
  { id:'walkIntoMist', name:'The figure in the fog', text:'The hero walks into the fog alive. The DM may bring them back as a recurring figure who knows roads the Chorus has forgotten.' },
  { id:'sharedVoice', name:'The night the Chorus speaks', text:'The hero remains with the party. On one agreed night a week the DM speaks and acts for them as the Chorus. The player has the hero the rest of the week.' },
  { id:'watchAtTheOven', name:'The watch by the oven', text:'The hero retires to keep watch outside the bakehouse. The bread lets them hear their own thoughts by the door. The Chorus still knows their name.' },
];
