/* WHAT'S INSIDE — searching next to a container (Search on a hero's card) opens it: one roll on its table.
   Each entry: [weight, text]. {coins} rolls a small purse. Write your own, or swap any line for something
   from your campaign; a line starting with "DM:" is a nudge for the DM rather than a find. */
const COINS = () => { const r = Math.random(); return r < .5 ? `${1 + Math.floor(Math.random() * 6) * 2} copper pieces` : r < .85 ? `${2 + Math.floor(Math.random() * 10)} silver pieces` : `${1 + Math.floor(Math.random() * 6)} gold pieces, old coins with a dead king's face`; };
export const LOOT = {
  chest:[[4, '{coins}'], [2, 'A potion of healing (2d4 + 2), the wax seal unbroken.'], [2, 'A silvered dagger wrapped in oilcloth.'], [2, 'A bundle of letters tied with black ribbon, all to the same woman, none sent.'],
    [1, 'A holy symbol of the Morninglord, the gilt worn off by a thumb.'], [1, 'A vial of holy water.'], [1, 'Moth-eaten clothes, a good cloak among them.'], [1, 'Nothing. The bottom of the chest has been scratched through from beneath.']],
  coffin:[[3, 'Bones in a burial shroud, and a copper coin on each eye ({coins}).'], [2, 'A ring of tarnished silver, too small for any living finger.'], [2, 'Empty. The silk lining is still warm.'],
    [1, 'A sprig of dried garlic someone tucked in with the dead.'], [1, 'DM: the occupant opens its eyes. (A zombie, or worse, at your Gaze.)'], [1, 'Grave dirt — this coffin was dug up and brought here.']],
  sarcophagus:[[3, 'A noble\'s bones in rotted finery, a sword laid along them (a longsword, old but sound).'], [2, 'Grave goods: a silver goblet and a jewelled brooch (worth 25 gp together).'],
    [2, 'The lid is carved inside with scratch marks and a single word: OUT.'], [1, 'Empty, and clean, and recently used.'], [1, 'DM: a ghost rises from it and asks the party why they have come.']],
  desk:[[3, 'A diary, the last entry unfinished mid-word.'], [2, 'A key on a red ribbon (it opens something on this floor — the DM decides what).'], [2, 'Ink, quills, sealing wax, and a letter that begins "If you are reading this, I failed."'],
    [1, '{coins}'], [1, 'A hand-drawn map of this place, with one room crossed out.'], [1, 'A spell scroll (one 1st-level spell, the DM\'s choice).']],
  bookshelf:[[3, 'Sermons, ledgers, a book of family trees with one name inked over.'], [2, 'A hollow book with something inside: {coins}.'], [1, 'A spell scroll tucked between the pages of a hymnal.'],
    [1, 'A children\'s book of Barovian folk tales. One page has been read so often it falls open on its own.'], [1, 'Pulling one book makes a click somewhere in the wall. DM: a secret door nearby is found.']],
  wardrobe:[[3, 'Good clothes, mothballs, a pair of small shoes set neatly at the bottom.'], [2, 'A heavy cloak lined with fur, and in its pocket {coins}.'], [1, 'DM: a frightened child is hiding inside, and will not come out for anyone who does not kneel.'], [1, 'The back panel opens onto darkness and a draught.']],
  crate:[[3, 'Salt, a whole sack of it, dry and clean.'], [3, 'Rations, rope, lamp oil — a week\'s supplies.'], [2, '{coins}'], [1, 'Garlic, braided in long ropes.'], [1, 'Straw, and something in the straw that bites (a swarm of rats).']],
  barrel:[[3, 'Wine, gone to vinegar.'], [2, 'Pickled fish. You do not want to look closer.'], [2, 'Water, fresh, cold and clean.'], [1, 'Salt pork, and under it {coins}.'], [1, 'Empty, with breathing holes cut in the lid.']],
  sacks:[[3, 'Flour, grey with age.'], [2, 'Salt — enough to draw a ring around a sleeping party.'], [2, 'Turnips and onions.'], [1, '{coins}, hidden in the grain.']],
  cradle:[[3, 'A knitted blanket and a rattle shaped like a little wolf.'], [1, 'DM: it is still warm, and something small has just been taken out of it.'], [1, 'A lock of fair hair tied with a ribbon.']],
  dollhouse:[[3, 'Tiny furniture, perfectly made. A doll lies in the tiny bed of the tiny nursery.'], [1, 'The dolls are posed in the same rooms as the party, and there is one more doll than there are of you.'], [1, 'A key small enough for a doll, which fits a real lock somewhere.']],
  altar:[[3, 'Candle stubs and an offering bowl with {coins}.'], [2, 'A holy symbol, a vial of holy water, a book of prayers.'], [1, 'Dried blood in the channel cut into the stone.'], [1, 'DM: whoever searched it feels watched, kindly. (Advantage on their next save.)']],
  cage:[[3, 'Bones, small ones.'], [1, 'A key on a nail just out of reach of anyone inside.'], [1, 'Scratched into the bars: a tally of days, and a name.']],
  minecart:[[3, 'Silver ore, worth 10 gp to the right buyer.'], [2, 'Tools: picks, a lamp, a broken lunch pail.'], [1, 'A miner\'s helmet with a hole in it.']],
  ore:[[2, 'A vein of good silver: a hammer and an hour gets 2d6 gp worth.'], [1, 'Fool\'s silver. It crumbles.']],
  vardo:[[3, 'Spices, scarves, a fortune-teller\'s deck missing one card.'], [2, '{coins}, and a knife.'], [1, 'A bottle of very good wine with no label.']],
};
export const SEARCHABLE = new Set(Object.keys(LOOT));
export function rollLoot(k){
  const t = LOOT[k]; if (!t) return null;
  let r = Math.random() * t.reduce((a, [w]) => a + w, 0);
  for (const [w, text] of t){ r -= w; if (r <= 0) return text.replace('{coins}', COINS()); }
  return t[0][1].replace('{coins}', COINS());
}
