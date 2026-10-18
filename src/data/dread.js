/* DREAD LEVELS 1–10 — the Seep's tide, from first damp to full collapse.
   Look:  fog = mist thickness · amb = light that survives · hue = torch colour · flick = torch flicker
   Rules (these run automatically during combat):
     shift  chance the combat floor rearranges at the end of each round
     bud    chance a Seepling buds from a Seep Nest (or a fresh corpse) at the end of each round
     regen  HP every Seep creature regains at the start of its turn
     hit    bonus to hit for every Seep creature
     raise  chance each unclaimed host corpse on the combat floor is taken by the Seep at round's end
   text = what the DM reads out when the Dread climbs to this level.
   Edit names and text freely — or in the app, Dread tab. */
export const DREAD = [
  null,
  { n:'Uneasy Gloom',        fog:.016, amb:.62, hue:'#ffb870', flick:.04, shift:0,   bud:0,   regen:0, hit:0, raise:0,
    text:'Ordinary dark. Wax, wet stone, the smell of a church that has not been swept in a year.' },
  { n:'Damp Stone',          fog:.020, amb:.56, hue:'#ffb46a', flick:.06, shift:0,   bud:0,   regen:0, hit:0, raise:0,
    text:'Every surface sweats. Water beads on the ceiling and does not fall. Somewhere below, the font is still running.' },
  { n:'Spore Drift',         fog:.024, amb:.50, hue:'#ffa860', flick:.08, shift:0,   bud:0,   regen:0, hit:0, raise:0,
    text:'Pale motes hang in the torchlight, turning slowly against the draught. Breathe through cloth.' },
  { n:'Weeping Walls',       fog:.028, amb:.46, hue:'#ff9a58', flick:.10, shift:0,   bud:0,   regen:1, hit:0, raise:0,
    text:'Grey-green seams have opened in the mortar. They glisten. The Seep knits its wounds closed now.' },
  { n:'The Tide Stirs',      fog:.032, amb:.42, hue:'#ff8a50', flick:.13, shift:0,   bud:.20, regen:2, hit:0, raise:0,
    text:'A sound like a held breath let out, very far down. Little sacs are budding in the corners.' },
  { n:'Shifting Halls',      fog:.037, amb:.38, hue:'#ff7a4a', flick:.16, shift:.15, bud:.25, regen:3, hit:0, raise:.10,
    text:'The stone has started to move when no one is looking. The map in your head is already wrong.' },
  { n:'Biomass Bloom',       fog:.043, amb:.33, hue:'#ff6544', flick:.20, shift:.25, bud:.30, regen:4, hit:1, raise:.20,
    text:'Membrane carpets the floor. The dead do not stay where they fall — the Seep is collecting them.' },
  { n:'The Seep Rises',      fog:.049, amb:.29, hue:'#e8553e', flick:.24, shift:.35, bud:.40, regen:5, hit:1, raise:.30,
    text:'The water is at your ankles and it is warm. Every Seep-thing moves like it has been told where you are.' },
  { n:'Choir of the Taken',  fog:.056, amb:.25, hue:'#d4403a', flick:.30, shift:.50, bud:.50, regen:6, hit:2, raise:.40,
    text:'They are singing now — all of them, in the voices of everyone the Seep has eaten. Some of those voices you know.' },
  { n:'Reality Collapse',    fog:.066, amb:.20, hue:'#c22a34', flick:.38, shift:.65, bud:.65, regen:8, hit:2, raise:.55,
    text:'The Undertow is awake and the Dread Zone has stopped pretending to be a place. Run, or become part of it.' },
];

export const WHISPERS = [
  'the halls remember a different shape', 'count your hands', 'you came down more stairs than you climbed',
  'the font is still running', 'it knows your name — in his voice', 'silver tastes like blood down here',
  'something is wearing the miner\'s boots', 'don\'t let it hear you breathe', 'the door you came through is gone',
  'he sold the bones, and the water followed', 'many voices, one mouth', 'that was a room a moment ago',
  'the saint is still praying', 'it is learning your footsteps', 'there were five of you. weren\'t there?',
  'join us — there is room', 'we were pilgrims too', 'the tide does not hate you. it is hungry',
  'one mind. one hymn. one body', 'your wounds are doors', 'it is not dead. it is digesting',
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
};
