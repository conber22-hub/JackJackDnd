/* THE COUNT'S COURT — what the nemesis system (engine/nemesis.js) builds his servants from. All invented for this
   app: names, kinds, strengths, weaknesses and the things they say. Edit freely.
   kind: what one is — base (a creature id in the bestiary), retinue (what runs with it), epithets, and where it likes to be.
   RANKS: from a hunter to one of his Chosen; each rank up makes them tougher and brings more followers. */
export const RANKS = [null,
  { n:'Hunter',  hp:1,    ac:0, hit:0, dmg:0, retinue:1 },
  { n:'Captain', hp:1.3,  ac:1, hit:1, dmg:1, retinue:2 },
  { n:'Warlord', hp:1.6,  ac:1, hit:2, dmg:2, retinue:3 },
  { n:'Chosen',  hp:2,    ac:2, hit:3, dmg:3, retinue:4 },
];
export const KINDS = {
  hound:   { n:'Werewolf',       base:'werewolf',    retinue:['barovian-wolf', 'count-s-wolf'], haunts:['tser', 'crossroads', 'yester', 'lake'],
             epithets:['the Hound-Lord', 'Who Runs Before the Pack', 'of the Long Howl', 'the Moon-Bitten', 'Who Wears a Man'] },
  spawn:   { n:'Vampire spawn',  base:'night-spawn', retinue:['swarm-of-bats'], haunts:['village', 'castle', 'vallaki', 'argyn'],
             epithets:['the Thirsting', 'His Lantern-Bearer', 'Who Was a Bride', 'the Pale Steward', 'Who Smiles Too Wide'] },
  ghoul:   { n:'Ghoul',          base:'grave-ghoul', retinue:['ghoul', 'zombie'], haunts:['village', 'berez', 'crossroads', 'krezk'],
             epithets:['the Gravedigger', 'Who Eats Last', 'the Sexton', 'of the Open Graves'] },
  hag:     { n:'Hag',            base:'night-hag',   retinue:['scarecrow', 'scarecrow-watcher'], haunts:['bonegrinder', 'berez', 'yester'],
             epithets:['Granny', 'the Pie-Woman', 'Who Buys Children', 'of the Crooked Mill'] },
  revenant:{ n:'Revenant',       base:'revenant',    retinue:['skeleton'], haunts:['argyn', 'krezk', 'tower'],
             epithets:['the Unquiet', 'Who Kept His Oath Wrong', 'the Last of the Order', 'of the Burned Hall'] },
  turncoat:{ n:'Brigand',        base:'bandit-captain', retinue:['bandit'], haunts:['vallaki', 'tser', 'winery', 'crossroads'],
             epithets:['the Turncoat', 'Who Sold the Ferry', 'the Toll-Taker', 'Silver-Tongue'] },
  wight:   { n:'Wight',          base:'wight',       retinue:['zombie', 'skeleton'], haunts:['castle', 'argyn', 'coffin'],
             epithets:['the Grey Captain', 'Who Counts the Dead', 'the Gatekeeper', 'of the Long Watch'] },
  mist:    { n:'Mist thing',     base:'mist-thing',  retinue:['will-o-wisp'], haunts:['mists', 'gates', 'lake', 'berez'],
             epithets:['Who Walks in the White', 'the Breath of the Valley', 'the Unseen Guest'] },
};
export const NAMES = ['Vasili', 'Ilsa', 'Dmitri', 'Mirela', 'Kasimir', 'Bogdan', 'Radu', 'Anca', 'Grigor', 'Sorina', 'Toma', 'Ludmila', 'Pavel', 'Zofia',
  'Andrei', 'Valeska', 'Stefan', 'Oana', 'Mihai', 'Irena', 'Costin', 'Elisabeta', 'Nikolai', 'Agata', 'Lazar', 'Veronika', 'Petru', 'Daciana'];

/* Strengths: some change the creature at the table (applied when it's put on the map), the rest are for the DM.
   Weaknesses: `vuln` doubles that damage, and dying to its weakness is the only death that keeps it down. */
export const STRENGTHS = {
  ambusher:  { n:'Ambusher',      text:'Strikes from hiding: its side is surprised only if the party spots it first (DC 15 Perception).' },
  packmaster:{ n:'Pack-master',   text:'Never alone: two more of its followers.', retinue:2 },
  thickhide: { n:'Thick hide',    text:'+2 AC.', ac:2 },
  brutal:    { n:'Brutal',        text:'+2 damage on every hit.', dmg:2 },
  relentless:{ n:'Relentless',    text:'The first time it would drop to 0 HP in a fight, it drops to 1 instead.' },
  mistwalk:  { n:'Mist-walker',   text:'Bloodied, it can walk into the mist and be gone (the DM decides; it will be back).' },
  cunning:   { n:'Cunning',       text:'Knows how the party fights: advantage on its first attack against its grudge.' },
  regal:     { n:'His favour',    text:'Regains 5 HP at the start of each of its turns.', regen:5 },
};
export const WEAKNESSES = {
  fire:     { n:'Fire',           text:'Fire burns it twice over. A death by fire keeps it down.', vuln:'fire' },
  radiant:  { n:'Radiant light',  text:'Radiant burns it twice over. A death by the light keeps it down.', vuln:'radiant' },
  silver:   { n:'Silver',         text:'A silvered weapon cuts it twice over (the DM doubles it). A death by silver keeps it down.' },
  holy:     { n:'Holy water',     text:'Holy water and a holy symbol make it flinch (Wisdom save DC 13 or it loses its next turn).' },
  vain:     { n:'Vanity',         text:'Mock it and it must answer: a Charisma (Intimidation or Deception) check DC 13 draws all its attacks to you.' },
  name:     { n:'Its true name',  text:'Speak the name it had in life and it hesitates (it loses its reaction and has disadvantage for a round).' },
  water:    { n:'Running water',  text:'It will not cross running water, and a ford or a brook stops it cold.' },
};
// What they say. {hero} is their grudge, {place} where it happened, {scar} what it carries from it.
export const TAUNTS = {
  first:   ['You are new. The valley likes new things. So do I.', 'He told me you would come this way. He is never wrong about roads.', 'Run, if you like. I enjoy the running more than the end.'],
  grudge:  ['{hero}. I have thought about you every night since {place}.', 'You left me at {place}, {hero}. You should have stayed to be sure.', 'Barovia gave me back, {hero}. It wanted to see this.'],
  scarred: ['Look what you did to me, {hero}. Look. ({scar})', 'The {scar} still hurts. I will share it with you.'],
  won:     ['Again? You have learned nothing since {place}.', 'I let you live at {place}, {hero}. I want you to know that.'],
};
