/* Supplemental spells already present in Dread Delve, kept outside the SRD count.
   These are original concise rules summaries, not transcriptions or a complete supplement library.
   See docs/codex/spell-library.md for source coverage. */
export const EXTRA_SPELLS = [
  {
    n:'Thorn Whip', l:0, c:'D', k:'util', r:30,
    school:'Transmutation', time:'Action', range:'30 feet', comp:'V, S, M (a thorny plant stem)', dur:'Instantaneous',
    text:'Make a melee spell attack against one creature within range. On a hit, it takes 1d6 Piercing damage. If it is Large or smaller, you may pull it up to 10 feet closer. The damage becomes 2d6 at character level 5, 3d6 at level 11 and 4d6 at level 17.',
    note:'Make a melee spell attack within 30 feet: 1d6 Piercing, then optionally pull a Large or smaller target up to 10 feet closer. Use 2d6 at level 5, 3d6 at level 11 and 4d6 at level 17.',
    src:'Existing supplemental spells',
  },
  {
    n:'Armor of Agathys', l:1, c:'K', k:'buff', r:0,
    school:'Abjuration', time:'Bonus Action', range:'Self', comp:'V, S, M (a shard of blue glass)', dur:'1 hour',
    text:'Gain 5 Temporary Hit Points and a coating of supernatural frost. While you have Temporary Hit Points, a creature that hits you with a melee attack takes 5 Cold damage. The spell ends early when you have no Temporary Hit Points.',
    hl:'Both the Temporary Hit Points and the Cold damage increase by 5 for each slot level above 1.',
    src:'Existing supplemental spells',
  },
  {
    n:'Toll the Dead', l:0, c:'CKW', k:'util', r:60,
    school:'Necromancy', time:'Action', range:'60 feet', comp:'V, S', dur:'Instantaneous',
    text:'Choose a creature you can see within range. It makes a Wisdom saving throw. On a failure, it takes 1d8 Necrotic damage, or 1d12 if it is missing any Hit Points. Add one damage die at character levels 5, 11 and 17, using the same die size.',
    note:'Wisdom save: 1d8 Necrotic, or 1d12 if the target is wounded. Use 2 dice at level 5, 3 at level 11 and 4 at level 17.',
    src:'Existing supplemental spells',
  },
  {
    n:'Word of Radiance', l:0, c:'C', k:'save', r:0, sv:'con', d:'1d6', ty:'radiant', cs:1, area:['aura', 5],
    school:'Evocation', time:'Action', range:'Self', comp:'V, M (a sunburst token)', dur:'Instantaneous',
    text:'Each creature you choose that you can see within 5 feet makes a Constitution saving throw. On a failure, it takes 1d6 Radiant damage. The damage becomes 2d6 at character level 5, 3d6 at level 11 and 4d6 at level 17.',
    note:'Choose visible targets within 5 feet; the area preview automatically excludes your allies.',
    src:'Existing supplemental spells',
  },
];
