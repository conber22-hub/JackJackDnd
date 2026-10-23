/* SPELLS AT THE TABLE — the combat fields the app rolls with, layered over the faithful SRD data (srd-spells.js,
   generated). The SRD import leaves anything it can't model exactly as 'util' (no dice), which is honest but
   means a Wizard's Magic Missile or a Cleric's Spirit Guardians rolled nothing. These put back what the table
   needs most: the main damage, the save and the condition the spell is cast for. What the dice can't carry
   (a pull, a heal-back, a choice of damage type, a repeated save) is in the note, for the DM.
   Spells that really are the DM's call stay manual: Bane (−1d4, no condition), Command (depends on the word),
   Heal, Meteor Swarm, Power Word Kill, Sorcerous Burst. srd.js applies these; tests/spells.test.js checks both. */
const save = (sv, extra) => ({ k:'save', sv, ...extra });
const atk = (d, ty, extra) => ({ k:'atk', d, ty, ...extra });

export const TABLE_PLAY = {
  // cantrips
  'Toll the Dead':save('wis', { d:'1d8', ty:'necrotic', cs:1, note:'1d12 instead if the target is missing any Hit Points.' }),
  'Produce Flame':atk('1d8', 'fire', { cs:1, r:60, note:'The flame also sheds Bright Light in a 20-foot radius until you hurl it.' }),
  'Thorn Whip':atk('1d6', 'piercing', { cs:1, note:'On a hit you can pull a Large or smaller target up to 10 feet toward you.' }),
  // level 1
  'Magic Missile':{ k:'auto', d:'3d4+3', ty:'force', up:'1d4+1', note:'Three darts that always hit (one die and +1 each); one more dart per slot level above 1.' },
  'Chromatic Orb':atk('3d8', 'chosen type', { note:'Choose acid, cold, fire, lightning, poison or thunder. Doubles on the dice can leap to another target (DM).' }),
  'Ice Knife':atk('1d10', 'piercing', { note:'Hit or miss, the shard explodes: each creature within 5 feet of the target makes a Dex save or takes 2d6 cold (DM).' }),
  'Dissonant Whispers':save('wis', { d:'3d6', ty:'psychic', half:true, note:'On a failed save the target must use its Reaction, if it can, to move as far from you as it can.' }),
  'Sleep':save('wis', { area:['sphere', 5], cond:'incapacitated', note:'At the end of its next turn it repeats the save; on a second failure it falls Unconscious (DM).' }),
  'Entangle':save('str', { area:['cube', 20], cond:'restrained', note:'The ground is Difficult Terrain while the spell lasts.' }),
  'Charm Person':save('wis', { cond:'charmed', note:'Advantage on the save if you or your allies are fighting it.' }),
  // level 2
  'Spiritual Weapon':atk('1d8', 'force', { again:1, note:'A Bonus Action on later turns moves it and attacks again.' }),
  'Hold Person':save('wis', { cond:'paralyzed', note:'It repeats the save at the end of each of its turns.' }),
  'Moonbeam':save('con', { d:'2d10', ty:'radiant', half:true, area:['sphere', 5], again:1, note:'Also when a creature enters the beam or ends its turn there; you can move it 60 feet.' }),
  'Web':save('dex', { area:['cube', 20], cond:'restrained', note:'The webs are Difficult Terrain and burn away in fire.' }),
  // level 3
  'Spirit Guardians':save('wis', { d:'3d8', ty:'radiant', half:true, area:['aura', 15], again:1, note:'Necrotic if you are evil. Enemies in the aura have half Speed.' }),
  'Hypnotic Pattern':save('wis', { area:['cube', 30], cond:'incapacitated', note:'Also Charmed, with Speed 0; damage or a shake ends it.' }),
  'Fear':save('wis', { area:['cone', 30], cond:'frightened', note:'A frightened creature drops what it holds and must Dash away from you.' }),
  'Vampiric Touch':atk('3d6', 'necrotic', { again:1, note:'You regain Hit Points equal to half the damage dealt.' }),
  // level 4
  'Ice Storm':save('dex', { d:'2d10+4d6', ty:'bludgeoning + cold', half:true, area:['cylinder', 20], note:'2d10 bludgeoning and 4d6 cold; the ground is Difficult Terrain until your next turn.' }),
  'Wall of Fire':save('dex', { d:'5d8', ty:'fire', half:true, area:['line', 60], note:'One side of the wall burns anyone who ends a turn within 10 feet of it.' }),
  'Banishment':save('cha', { cond:'incapacitated', note:'Banished to a harmless demiplane; if it is not native here and you hold Concentration for the full minute, it does not return.' }),
  'Guardian of Faith':save('dex', { d:'20', ty:'radiant', half:true, note:'Each time an enemy moves within 10 feet of the guardian or starts its turn there; 60 damage in all, then it vanishes.' }),
  // level 5
  'Flame Strike':save('dex', { d:'5d6+5d6', ty:'fire + radiant', half:true, area:['cylinder', 10] }),
  'Hold Monster':save('wis', { cond:'paralyzed', note:'It repeats the save at the end of each of its turns.' }),
};
