/* Original, unofficial Halo Flood-inspired homebrew for Curse of Strahd: Flood Edition.
   The campaign calls the infestation the Bloom above ground and the Seep beneath Saint Andral's.
   These are new table rules, not Halo canon or published D&D spells. Balance requires playtesting.
   Keep unsupported effects manual; the current engine interprets util + d as Divine Smite. */
const source = { src:'Flood Edition homebrew', homebrew:true };
export const FLOOD_SPELLS = [
  {
    n:'Spore Needle', l:0, c:'DKW', k:'atk', r:60, d:'1d6', ty:'necrotic', cs:1,
    school:'Necromancy', time:'Action', range:'60 feet', comp:'V, S', dur:'Instantaneous',
    text:'You compress dead spores into a brittle needle and fire it at one creature within range. Make a ranged spell attack. On a hit, the target takes 1d6 Necrotic damage. The needle crumbles immediately and cannot cause an infection. The damage increases to 2d6 at character level 5, 3d6 at level 11 and 4d6 at level 17.',
    ...source,
  },
  {
    n:'Quarantine Seal', l:1, c:'CDPRW', k:'util', r:5,
    school:'Abjuration', time:'Action', range:'Touch', comp:'V, S, M (a clean strip of linen)', dur:'Concentration, up to 10 minutes', conc:true,
    text:'Touch one willing creature. A thin silver lattice covers its mouth, eyes and wounds without obstructing its senses or breathing. For the duration, it has Advantage on saving throws against the Bloom or Seep’s infection and cannot inhale their spores. This spell does not remove an existing infection or prevent injury from an attack that carries one.',
    hl:'Target one additional willing creature for each slot level above 1, touching each during the casting.',
    ...source,
  },
  {
    n:'Cyst Rupture', l:2, c:'DSKW', k:'save', r:60, sv:'dex', d:'3d6', ty:'acid', half:true, area:['sphere', 10],
    school:'Evocation', time:'Action', range:'60 feet', comp:'V, S, M (a dried seed husk)', dur:'Instantaneous',
    text:'A translucent cyst swells at a point you can see within range and bursts into corrosive fluid. Each creature in a 10-foot-radius Sphere centred there makes a Dexterity saving throw, taking 3d6 Acid damage on a failure or half as much on a success. The fluid becomes harmless after dealing damage. It contains no living infection.',
    hl:'The damage increases by 1d6 for each slot level above 2.',
    ...source,
  },
  {
    n:'Synapse Sever', l:3, c:'BCKW', k:'util', r:60,
    school:'Abjuration', time:'Action', range:'60 feet', comp:'V, S', dur:'Concentration, up to 1 minute', conc:true,
    text:'Choose one creature you can see within range that shares the Bloom or Seep’s collective awareness. It makes an Intelligence saving throw. On a failure, it cannot send or receive information through that collective, and it cannot take Reactions. It retains its own senses and can act independently. At the end of each of its turns it repeats the save, ending the spell on a success. Creatures outside the collective are unaffected.',
    ...source,
  },
  {
    n:'Carrier’s Lure', l:4, c:'BDKW', k:'util', r:90,
    school:'Illusion', time:'Action', range:'90 feet', comp:'V, S, M (a sealed vial of ash)', dur:'Concentration, up to 1 minute', conc:true,
    text:'At a point you can see within range, create a false pulse of uninfected life in a 15-foot-radius Sphere. When a Bloom or Seep creature starts its turn within 60 feet of that point, it makes a Wisdom saving throw. On a failure, it must spend at least half its available movement approaching the point by a safe route before moving elsewhere. The spell never forces it into an obvious hazard and does not dictate its actions. On a successful save, it is immune to this casting. No other creature perceives the pulse.',
    ...source,
  },
  {
    n:'Recall the Lost', l:5, c:'BCD', k:'util', r:5,
    school:'Abjuration', time:'1 minute', range:'Touch', comp:'V, S, M (silver salts worth 250 GP, consumed)', dur:'Instantaneous',
    text:'Throughout the casting, touch a living, willing or Incapacitated creature infected by the Bloom or Seep. Name a memory freely offered by that creature before its infection, or by someone who knew it. End its Seeded condition and one effect by which the infestation controls its actions. This spell cannot restore a dead host, undo physical transformation or erase memories absorbed by the collective. A creature can benefit from this spell only once per Long Rest.',
    ...source,
  },
  {
    n:'Starfire Quarantine', l:6, c:'CDSW', k:'save', r:120, sv:'dex', d:'10d6', ty:'radiant', half:true, area:['sphere', 20],
    school:'Evocation', time:'Action', range:'120 feet', comp:'V, S, M (a sliver of polished obsidian)', dur:'Instantaneous',
    text:'Cold white fire flashes in a 20-foot-radius Sphere centred on a point you can see within range. Each creature in the Sphere makes a Dexterity saving throw, taking 10d6 Radiant damage on a failure or half as much on a success. Unattended Bloom and Seep spores in the area are destroyed. This does not cure an infected host or damage objects other than those spores.',
    hl:'The damage increases by 1d6 for each slot level above 6.',
    ...source,
  },
  {
    n:'Silence the Chorus', l:7, c:'BCKW', k:'util', r:120,
    school:'Abjuration', time:'Action', range:'120 feet', comp:'V, S, M (a cracked handbell)', dur:'Concentration, up to 1 minute', conc:true,
    text:'Choose a point you can see within range. In a 30-foot-radius Sphere centred there, creatures cannot communicate telepathically or share information through the Bloom or Seep’s collective awareness. Existing infections and physical senses remain. A creature that would receive a new command through such a link receives nothing instead; an earlier command is not cancelled. The Sphere also blocks telepathic messages that cross its boundary. Ordinary speech and other sounds pass freely.',
    ...source,
  },
  {
    n:'Biomass Prison', l:8, c:'DKW', k:'util', r:60,
    school:'Transmutation', time:'Action', range:'60 feet', comp:'V, S, M (a glass vessel worth 500 GP)', dur:'Concentration, up to 1 minute', conc:true,
    text:'Choose a Huge or smaller Bloom or Seep creature you can see within range. It makes a Constitution saving throw. On a failure, its outer biomass hardens into a porous shell: it is Restrained and cannot regain Hit Points. At the end of each of its turns, it repeats the save, ending the spell on a success. The shell does not block attacks, damage or line of sight. The target retains its other abilities, and the spell does not affect creatures attached to it as separate hosts.',
    ...source,
  },
  {
    n:'Sever the Gravemind', l:9, c:'CDKW', k:'util', r:120,
    school:'Abjuration', time:'Action', range:'120 feet', comp:'V, S, M (a silver neural lattice worth 5,000 GP, consumed)', dur:'Concentration, up to 1 minute', conc:true,
    text:'Choose a point you can see within range. For the duration, Bloom and Seep creatures within a 60-foot-radius Sphere centred there lose their shared awareness, cannot transmit memories to their collective, and cannot control other creatures through that collective. Each affected creature makes an Intelligence saving throw when it first enters the Sphere or starts its turn there. On a failure, it is Stunned until the start of its next turn. A creature makes this save only once per casting. Creatures retain their individual memories, and leaving the Sphere restores their link. This spell neither destroys a distant Gravemind nor resurrects absorbed hosts.',
    ...source,
  },
];
// The existing manual-spell card reads note; make these homebrew rules available without a UI change.
for (const spell of FLOOD_SPELLS) spell.note = spell.text + (spell.hl ? ` Higher slots: ${spell.hl}` : '');
