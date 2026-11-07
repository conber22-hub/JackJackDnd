// Original, short lines written to fit between rolls at the table.
export const VOICE_TRIGGERS = [
  'attack', 'hit', 'miss', 'critical', 'spell', 'heal', 'help', 'guard', 'dodge', 'dash',
  'hurt', 'down', 'rally', 'retreat', 'interact', 'reveal',
];

export const DELIVERY = {
  steady: { rate: 0.96, pitch: 1 },
  quick: { rate: 1.13, pitch: 1.08 },
  low: { rate: 0.85, pitch: 0.72 },
  hush: { rate: 0.9, pitch: 0.91 },
};

export const VOICE_LINES = {
  hero: {
    attack: ['Eyes on me.', 'My turn.'],
    hit: ['That opened a gap.', 'Through the guard.'],
    miss: ['Too wide.', 'Still got another.'],
    critical: ['Right through!', 'That one counts!'],
    spell: ['Stand clear.', 'Let it take hold.'],
    heal: ['Stay with me.', 'Breathe. I have you.'],
    help: ['I’ll make room. You go.', 'On my mark, {target}.'],
    guard: ['Behind me.', 'I’ll hold this door.'],
    dodge: ['Too slow.', 'Come and catch me.'],
    dash: ['Move now.', 'Keep up.'],
    hurt: ['Still standing.', 'I felt that.'],
    down: ['Someone else take the light.', 'Keep going.'],
    rally: ['Together. One more step.', 'Look at me. We’re still here.'],
    retreat: ['Back to the last door!', 'Out, in pairs!'],
    interact: ['Give me a moment.', 'Let’s see what this does.'],
  },
  guard: {
    attack: ['Hands off the gate.', 'One step closer, then.'],
    hit: ['I warned you.', 'On the back foot now.'],
    miss: ['Stand still, damn you.'],
    critical: ['That ends the argument.'],
    spell: ['Watch the light.'],
    help: ['I’ll keep the lane clear.', 'Take the left. I have the right.'],
    guard: ['Hold this line.', 'Nobody through.'],
    hurt: ['That’s through the coat.'],
    down: ['Get them inside.'],
    rally: ['Dress the line!', 'Shoulder to shoulder.'],
    retreat: ['Fall back to the arch!'],
    interact: ['Let me try the latch.'],
  },
  villager: {
    attack: ['Leave us be!', 'I have had enough of this.'],
    spell: ['Let this be enough.'],
    heal: ['Hold the cloth against it.'],
    help: ['Here, take my hand.', 'I can keep the lamp steady.'],
    guard: ['I’ll keep watch.'],
    hurt: ['Ah! That’s deep.'],
    down: ['Tell them where I fell.'],
    rally: ['We can still get home.'],
    retreat: ['Back inside!'],
    interact: ['I know how this opens.'],
  },
  mob: {
    attack: ['Keep them in the lane!', 'Close the ring!'],
    hit: ['Press them!', 'There’s an opening!'],
    help: ['All at once!', 'Pull them apart!'],
    guard: ['Nobody slips through!'],
    hurt: ['They’re breaking the line!'],
    rally: ['Close ranks!', 'Together, you fools!'],
    retreat: ['Scatter!'],
  },
  mimic: {
    reveal: ['You called me a good dog. I’ve been thinking about that.', 'What a relief. I was getting tired of barking.'],
    attack: ['You should have listened to the dog.', 'The teeth were always real.'],
    spell: ['Oh, I can do more than fetch.'],
    help: ['I’ll tell you what I heard under the table.'],
    retreat: ['I know every way out of this yard.'],
  },
};

export const SPELL_VOICE_LINES = {
  'fire bolt': ['Catch.', 'A spark will do.'],
  'healing word': ['Come back to us.', 'Hear me. Stay.'],
  'cure wounds': ['Take my hand. Let the pain go.'],
  'bless': ['Let your hands be steady.'],
  'guidance': ['Easy. One thing at a time.'],
  'sacred flame': ['Light find you.'],
  'magic missile': ['There’s nowhere to duck.'],
  'shield': ['Nothing through.'],
  'hunters mark': ['There you are.'],
  'misty step': ['See you on the other side.'],
  'counterspell': ['Leave that word unfinished.'],
};

// [start Hz, end Hz, seconds, gain, waveform] for short non-verbal cues.
export const VOICE_SOUNDS = {
  'wolf-growl': { caption: 'A low growl.', parts: [[118, 70, 0.35, 0.17, 'sawtooth']] },
  'wolf-howl': { caption: 'A rising howl.', parts: [[240, 440, 0.63, 0.15, 'triangle'], [390, 270, 0.31, 0.09, 'sine']] },
  'wolf-yelp': { caption: 'A sharp yelp.', parts: [[590, 280, 0.18, 0.14, 'triangle']] },
  'dog-bark': { caption: 'Two sharp barks.', parts: [[210, 125, 0.14, 0.17, 'square'], [185, 110, 0.13, 0.14, 'sawtooth']] },
  'raven-caw': { caption: 'A rough caw.', parts: [[620, 390, 0.19, 0.13, 'sawtooth'], [510, 340, 0.16, 0.09, 'triangle']] },
  'horse-stamp': { caption: 'A hoof stamps.', parts: [[118, 45, 0.23, 0.21, 'sine']] },
  'horse-snort': { caption: 'A horse snorts.', parts: [[320, 180, 0.21, 0.10, 'sawtooth'], [190, 110, 0.12, 0.08, 'triangle']] },
  'small-squeak': { caption: 'A high, quick squeak.', parts: [[920, 1290, 0.1, 0.09, 'triangle']] },
  'beast-snarl': { caption: 'A short snarl.', parts: [[155, 92, 0.25, 0.15, 'sawtooth']] },
  'hollow-rattle': { caption: 'A dry rattle.', parts: [[86, 56, 0.16, 0.13, 'square'], [126, 72, 0.11, 0.07, 'triangle']] },
};

export const CREATURE_VOICES = {
  wolf: 'wolf', 'barovian-wolf': 'wolf', 'count-s-wolf': 'wolf', 'bloomed-wolf': 'wolf',
  'srd-wolf': 'wolf', 'srd-dire-wolf': 'wolf', 'srd-mastiff': 'dog',
  'srd-raven': 'raven', 'srd-swarm-of-ravens': 'raven',
  'srd-riding-horse': 'horse', 'srd-draft-horse': 'horse', 'srd-warhorse': 'horse',
  'srd-rat': 'small', 'srd-giant-rat': 'small', 'srd-bat': 'small',
};
