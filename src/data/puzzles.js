// Original room text. Nothing here is copied from an adventure or rules book.
export const KINDS = [
  {id:'levers',name:'The mourning bells',blurb:'Iron levers wake bells beneath the stone. Their order matters.',difficulty:[1,2,3]},
  {id:'statues',name:'The sleepless choir',blurb:'Turn the mourners towards the northern altar; their neighbours turn with them.',difficulty:[1,2,3]},
  {id:'dials',name:'The sealed reliquary',blurb:'Six signs circle each dial. Read the carvings before trying the seal.',difficulty:[1,2,3]},
  {id:'riddle',name:'The speaking threshold',blurb:'A face in the door asks for one word before it will let you pass.',difficulty:[1,2,3]},
  {id:'mirrors',name:'The borrowed dawn',blurb:'Turn the silver panes until the light reaches the waiting eye.',difficulty:[1,2,3]},
  {id:'weights',name:'The last tribute',blurb:'Weigh the grave gifts. The scale accepts only the tribute it names.',difficulty:[1,2,3]},
];
export const SYMBOLS = [
  {id:'moon',name:'moon',glyph:'🌙'}, {id:'bat',name:'bat',glyph:'🦇'},
  {id:'key',name:'key',glyph:'🗝'}, {id:'candle',name:'candle',glyph:'🕯'},
  {id:'skull',name:'skull',glyph:'💀'}, {id:'rose',name:'rose',glyph:'🌹'},
  {id:'coffin',name:'coffin',glyph:'⚰'}, {id:'eye',name:'eye',glyph:'👁'},
];
export const CLUES = {
  levers:[
    'At the {step} toll, let the {lever} bell mourn.',
    'The {lever} bell must lend its voice to the {step} lament.',
    'For the {step} name on the stone, ring the {lever} bell.',
  ],
  dial:'The {position} seal awaits this sign: {omen}',
  dials:{
    moon:'A pale crescent watches the graves without a candle.',
    bat:'Leather wings fold beneath the chapel roof at dawn.',
    key:'A toothed sliver turns in the lock where no mouth can bite.',
    candle:'A thread burns in wax, spending its small body against the dark.',
    skull:'An empty grin keeps watch inside the bone of a vanished face.',
    rose:'Thorns guard red petals laid upon the newest grave.',
    coffin:'A long wooden bed shuts its lid upon the last sleeper.',
    eye:'One lid opens; the watcher sees you enter.',
  },
};
export const RIDDLES = [
  {text:'The lantern brings me into your cell, but I cannot warm it. I borrow your shape and lie against the wall. What am I?',answer:'shadow',also:['a shadow','my shadow'],hint:'Look where your body keeps the lantern from reaching.'},
  {text:'I stand vigil in a pool of my own making. My crown burns smaller as the mourners wait. What am I?',answer:'candle',also:['a candle','wax candle'],hint:'The flame is eating its own support.'},
  {text:'They opened me with iron, filled me with farewell, and gave me a stone for a name. What am I?',answer:'grave',also:['a grave','burial plot'],hint:'Think of the earth beneath a headstone.'},
  {text:'My teeth never eat. They enter an iron mouth and persuade a locked door to forget its duty. What am I?',answer:'key',also:['a key'],hint:'It turns inside a lock.'},
  {text:'I lend the road a white shroud. Trees lose their feet in me, yet your hand finds nothing to hold. What am I?',answer:'mist',also:['the mist','fog','the fog'],hint:'Cloud has settled down among the trees.'},
  {text:'No guard sees me enter, yet I grey his hair and crumble his tower. Every clock confesses my passing. What am I?',answer:'time',also:['time itself'],hint:'Count the years the tower has stood.'},
  {text:'When the last mourner stops speaking, I fill the chapel. Say my name aloud and you drive me away. What am I?',answer:'silence',also:['the silence','quiet'],hint:'Listen after the bell has stopped.'},
  {text:'The carpenter fitted my bed with a lid. Its sleeper will never ask him for a window. What am I?',answer:'coffin',also:['a coffin','casket','a casket'],hint:'Six bearers may carry this wooden bed.'},
  {text:'The grave keeps my letters after the face is gone. Speak me and those who remember turn towards you. What am I?',answer:'name',also:['a name','my name'],hint:'It is what the mourners called the person.'},
  {text:'You called into the crypt. I answered in your voice, though no throat waited below. What am I?',answer:'echo',also:['an echo'],hint:'Stone sends a sound back to its speaker.'},
  {text:'I travel red roads beneath your skin. A broken gate lets me stain the snow. What am I?',answer:'blood',also:['my blood'],hint:'A beating heart drives it round the body.'},
  {text:'Behind silver I keep a room that has no depth. Your double raises a hand there, but cannot step out. What am I?',answer:'mirror',also:['a mirror','looking glass','looking-glass'],hint:'Polished glass gives back your face.'},
];
export const FAIL = {
  1:['none','alarm','none','darts'],
  2:['darts','none','gas','alarm'],
  3:['blade','pit','gas','alarm'],
};
