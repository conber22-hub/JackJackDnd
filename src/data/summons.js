/* ⚙ What a Calling's summoning features call (ChatGPT's data/callings.js: { k:'summon', what, hp:'5*lvl', lasts:'1min' }):
   an ally on the party's side for a minute, drawn as the bestiary creature it's most like (bid), its numbers set by
   the one who called it (engine/mech.js summonToken): hit points from the feature, its strike at the caller's
   proficiency and best ability, its damage plus their proficiency. */
export const SUMMONS = {
  ghostlight:{ bid:'will-o-wisp', name:'Ghostlight', color:'#9fd8ff', ac:13, speed:30, size:1,
    atk:{ n:'Cold Light', d:'1d8', t:'radiant' },
    words:'A lamp-flame with no lamp, the colour of a screen left on in an empty room. It remembers what it sees.' },
  'spore-form':{ bid:'sporeling', name:'Spore-form', color:'#9cc23c', ac:12, speed:30, size:1,
    atk:{ n:'Spore Lash', d:'1d8', t:'poison' },
    words:'Something the Chorus grew for you out of what was lying near. It moves when you think of moving.' },
  wolf:{ bid:'wolf', name:'Mist wolf', color:'#8a9aa8', ac:13, speed:40, size:1,
    atk:{ n:'Bite', d:'1d6', t:'piercing' },
    words:'Grey as the fog it came out of, and quiet until it isn\'t.' },
};
