/* LEGENDARY & LAIR ACTIONS — for the creatures that get them. Keyed by bestiary id (a bestiary entry can also
   carry its own `legendary` / `lair` / `resist`, which wins).
   legendary: { n: actions a round (back at the start of its turn), acts:[{ n, cost, atk: index of one of its
              attacks (the DM then taps the target) | fx: an effect (the fx language in game/combat.js), f: flair }] }
   lair:      actions on initiative 20, one a round, never the same one twice in a row
   resist:    Legendary Resistance uses a day */
export const LEGENDARY = {
  vampire:{ resist:3,
    legendary:{ n:3, acts:[
      { n:'Deathless Strike', cost:1, atk:0, f:'It is simply somewhere else, closer, and its hand is already moving.' },
      { n:'Beguile', cost:2, fx:'save:wis:17:charmed:random', f:'"Look at me." It is not a request.' },
      { n:'Mist Form', cost:1, fx:'note', f:'It comes apart into mist — or pulls itself back together, smiling.' } ] },
    lair:[
      { n:'The bats come down', fx:'spawn:swarm-of-bats:1@party', f:'The rafters empty all at once.' },
      { n:'A door that was not there', fx:'note', f:'The DM seals one door or opens one that did not exist a moment ago.' },
      { n:'His shadow moves on its own', fx:'party:wis:15:2d6:psychic:frightened:random', f:'The candlelight throws the wrong shadow, and the shadow reaches.' },
      { n:'The portraits watch', fx:'whim:roll', f:'Every painted eye in the room turns. Somewhere, he laughs.' } ] },
  mind:{
    legendary:{ n:2, acts:[
      { n:'Tendril Lash', cost:1, atk:0 },
      { n:'Call the Seep', cost:2, fx:'spawn:seepling:3', f:'The walls answer it.' } ] } },
  undertow:{
    legendary:{ n:3, acts:[
      { n:'Tide Lash', cost:1, atk:0 },
      { n:'Call the Seep', cost:1, fx:'spawn:seepling:3' },
      { n:'Mind-Flood', cost:3, fx:'aoe:12:wis:20:4d10:psychic:stunned', f:'Every voice it has ever stolen speaks at once.' } ] },
    lair:[
      { n:'The water rises', fx:'note', f:'Black water to the knee everywhere on this floor: difficult terrain until the next lair action.' },
      { n:'A corpse gets up', fx:'spawn:husk:1@corpse', f:'One of the dead in the water sits up.' },
      { n:'The halls shift', fx:'shift', f:'The whole floor bends toward it.' } ] },
  andral:{ resist:3,
    legendary:{ n:3, acts:[
      { n:'Hallowed Ray', cost:1, atk:1 },
      { n:'Nail Step', cost:1, fx:'note', f:'He is thirty feet away, and the nails of his halo ring as they settle.' },
      { n:'Reorganize Sector', cost:3, fx:'shift', f:'The saint gestures. The labyrinth obeys.' } ] },
    lair:[
      { n:'The Whim Die', fx:'whim:roll', f:'The font stirs. Something above it is amused.' },
      { n:'The font floods', fx:'party:str:18:0:-:restrained:random', f:'Silver-black water bursts out of the floor around one of them.' },
      { n:'A door seals itself', fx:'note', f:'The DM picks a door: it locks, and the lock is a saint\'s seal (DC 20).' } ] },
  andral2:{ resist:3,
    legendary:{ n:3, acts:[
      { n:'Corrupted Ray', cost:1, atk:1 },
      { n:'Seed the Faithful', cost:2, fx:'spawn:seepling:4@party' },
      { n:'Reorganize Sector', cost:3, fx:'shift' } ] },
    lair:[
      { n:'The font floods', fx:'party:str:18:0:-:restrained:random', f:'Water the colour of rot comes up through the stone.' },
      { n:'Two hymns', fx:'party:wis:18:3d6:psychic:frightened:random', f:'Somewhere below, the saint\'s choir and the Seep\'s are singing the same note.' } ] },
};
