/* STRAHD'S GAZE 1–10 — how closely the Count is watching the heroes. (In the code and in saves this is
   still the "dread" field, so older saves keep working.)
   Look:  fog = mist thickness · amb = light that survives · hue = torch colour · flick = torch flicker
   Rules (these run automatically during combat):
     shift  chance the combat floor rearranges at the end of each round (Barovia moves its own walls)
     regen  HP each of his creatures (the Barovia family: wolves, bats, his dead, his spawn) regains at the start of its turn
     hit    bonus to hit for each of his creatures
     raise  chance each fallen humanoid on the combat floor gets back up as one of his zombies at round's end
     charm  at the end of each round one hero makes a Wisdom save against this DC or is charmed until the next round
   text = what the DM reads out when the Gaze rises to this level.
   Edit names and text freely — or in the app, Gaze tab. */
export const DREAD = [
  null,
  { n:'Unnoticed',                 fog:.016, amb:.62, hue:'#ffb870', flick:.04, shift:0,   regen:0, hit:0, raise:0,   charm:0,
    text:'The valley has not turned its head yet. Somewhere a raven is preening. Enjoy it.' },
  { n:'A Raven Lingers',           fog:.020, amb:.56, hue:'#ffb46a', flick:.06, shift:0,   regen:0, hit:0, raise:0,   charm:0,
    text:'A raven keeps pace with you, branch to branch. It does not caw. It only watches, and then it leaves to tell someone.' },
  { n:'The Wolves Know Your Scent', fog:.024, amb:.50, hue:'#ffa860', flick:.08, shift:0,   regen:0, hit:0, raise:0,   charm:0,
    text:'A howl, far off, and an answer much closer. They are not hunting yet. They are learning the way you walk.' },
  { n:'An Open Door',              fog:.028, amb:.46, hue:'#ff9a58', flick:.10, shift:0,   regen:0, hit:0, raise:0,   charm:0,
    text:'Every door you try was already unlatched. The mist parts a little too politely. Someone is expecting you.' },
  { n:'He Has Learned Your Names', fog:.032, amb:.42, hue:'#ff8a50', flick:.13, shift:0,   regen:1, hit:0, raise:0,   charm:0,
    text:'The next whisper uses your names — all of them, in order, as if he had been practising. His creatures close their wounds now.' },
  { n:'The Land Rearranges',       fog:.037, amb:.38, hue:'#ff7a4a', flick:.16, shift:.15, regen:2, hit:0, raise:0,   charm:0,
    text:'Roads loop back on themselves. A wall stands where a door was. Barovia is moving the furniture for his amusement.' },
  { n:'His Servants Hurry',        fog:.043, amb:.33, hue:'#ff6544', flick:.20, shift:.2,  regen:3, hit:1, raise:.1,  charm:0,
    text:'Everything that answers to him moves faster now and bites harder. Bats in daylight. Wolves at the door. The dead do not stay down.' },
  { n:'The Charm',                 fog:.049, amb:.29, hue:'#e8553e', flick:.24, shift:.25, regen:4, hit:1, raise:.2,  charm:13,
    text:'His voice is inside your head now, warm as mulled wine. Each moment one of you must remember who you are, and whose side you are on.' },
  { n:'The Host Arrives',          fog:.056, amb:.25, hue:'#d4403a', flick:.30, shift:.35, regen:5, hit:2, raise:.3,  charm:14,
    text:'Candles you did not light are burning. A chair has been pulled out for you. He is close enough to touch, and he is smiling.' },
  { n:'His Full Attention',        fog:.066, amb:.20, hue:'#c22a34', flick:.38, shift:.5,  regen:6, hit:2, raise:.4,  charm:15,
    text:'The sky goes red behind the clouds and every living thing in the valley turns toward you at once. This is what it is to be wanted.' },
];

// What the DM's screen murmurs while the Gaze is 3 or higher (the Count, mostly; the Bloom, sometimes).
export const WHISPERS = [
  'you are my guests', 'I have set a place for you', 'the door was never locked', 'come closer',
  'you walk so beautifully into the dark', 'say your name again. I like the sound of it', 'every road here ends at my table',
  'rest. I will keep watch', 'one of your friends is lying to you', 'the wine is safe. trust me',
  'how long since anyone looked at you like this?', 'you could stay', 'they will not miss you',
  'such brave little lights', 'the mists are mine. so are you', 'I was a soldier once, too',
  'run, if it pleases you. I do enjoy the chase', 'the Bloom is not your enemy. I am. is that not simpler?',
  'the font is still running', 'many voices, one mouth', 'it is not dead. it is digesting',
];

export const CONDITIONS = {
  prone:       { icon:'⤓', color:'#c9a46a' },
  restrained:  { icon:'⛓', color:'#d0393b', stop:true },
  grappled:    { icon:'✊', color:'#e6d3b8', stop:true },
  frightened:  { icon:'☠', color:'#9b77dc' },
  blinded:     { icon:'◌', color:'#8a8f99' },
  paralyzed:   { icon:'✖', color:'#e8b938', stop:true },
  poisoned:    { icon:'☣', color:'#9cc23c' },
  stunned:     { icon:'✷', color:'#e8b938', stop:true },
  'no healing':{ icon:'✚', color:'#b3303a' },
  seeded:      { icon:'☣', color:'#9cc23c' },
  charmed:     { icon:'♥', color:'#d97aa6' },
  incapacitated:{ icon:'⊘', color:'#8a8f99', stop:true },
};
