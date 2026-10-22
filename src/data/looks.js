/* LOOKS — the parts a figure is built from (render/forge.js), and the presets for the folk and foes of Barovia.
   A look is a small recipe ({ body, skin, hair, outfit, main, off, … }); engine/look.js fills it in from a
   character sheet, rolls one for an NPC, or takes a creature's preset and varies it so no two zombies match.
   Add a preset for any creature id below and its minis use the forge instead of their old shape. */

// Bodies: proportions (height, shoulders, heft, head size) and what comes with them.
export const BODIES = {
  human:      { n:'Human', h:1, sh:1, heft:1, head:1, ears:'round' },
  elf:        { n:'Elf', h:1.04, sh:.92, heft:.85, head:.96, ears:'long' },
  dwarf:      { n:'Dwarf', h:.8, sh:1.18, heft:1.35, head:1.08, ears:'round', beard:true },
  halfling:   { n:'Halfling', h:.68, sh:.9, heft:1.05, head:1.12, ears:'pointed' },
  gnome:      { n:'Gnome', h:.64, sh:.85, heft:.95, head:1.2, ears:'pointed', nose:1.6 },
  orc:        { n:'Orc', h:1.05, sh:1.15, heft:1.25, head:1.04, ears:'pointed', tusks:true },
  tiefling:   { n:'Tiefling', h:1, sh:1, heft:.95, head:1, ears:'pointed', horns:'curled', tail:true },
  dragonborn: { n:'Dragonborn', h:1.08, sh:1.15, heft:1.2, head:1.05, ears:'none', snout:true, tail:true, horns:'swept' },
  goliath:    { n:'Goliath', h:1.18, sh:1.25, heft:1.35, head:.95, ears:'round', marks:true },
  zombie:     { n:'Risen dead', h:.98, sh:.95, heft:.9, head:1, ears:'round', dead:true },
  skeleton:   { n:'Skeleton', h:1, sh:.9, heft:.6, head:1, ears:'none', bones:true },
  vampire:    { n:'Vampire', h:1.05, sh:1.02, heft:.9, head:.98, ears:'pointed', fangs:true },
};
export const SKINS = ['#f2d4bf', '#e8bf9f', '#d9a57e', '#c48a5f', '#a86e47', '#8a5634', '#6b3f26', '#4a2c1c'];
export const SKINS_FANTASY = { orc:['#7f9a5a', '#6e8a4c', '#8fa36a', '#5f7a52', '#9a9a7a'], tiefling:['#b0443c', '#8a3550', '#6a3a7a', '#c25a3c', '#7a4a6a', '#d9a58a'],
  dragonborn:['#a0302a', '#2f6aa0', '#b08a3a', '#3a8a4a', '#d8d8e0', '#2a2a30', '#b06a2a', '#c0b040'], goliath:['#9a9aa0', '#8a8278', '#a8a098', '#7a7a82'],
  zombie:['#8f9d7a', '#7d8a72', '#9b8fa8', '#8a8a78', '#a29a84'], skeleton:['#d8d4c4', '#ccc8b6', '#e0ddd0'], vampire:['#e4dde2', '#d8d0d8', '#ece6ea'], drow:['#4a4a64', '#3e3a52', '#5a5470'] };
export const HAIR_COLS = ['#1c1714', '#3a2a1e', '#5a3a22', '#8a5a2c', '#b8823a', '#d8b46a', '#e8dcc0', '#9a9a9a', '#e6e6e6', '#7a2a1e', '#a83a24', '#2a2a3a'];
export const RAGS = ['#6a6050', '#5a5a4a', '#6e5a44', '#5a4a44', '#4e5a52', '#7a6a58'];
export const CLOTHS = ['#7a2a2a', '#3a4a6a', '#3f5a3a', '#5a3a6a', '#6a5a3a', '#2a2a30', '#8a6a3a', '#4a5a5a', '#6a2a3a', '#a08a6a', '#3a3a4a', '#5a4a3a'];
export const METALS = { steel:'#a8adb5', iron:'#6e7076', brass:'#c09a50', black:'#2e2e34', silver:'#d8dce2', rust:'#8a5a3e' };

export const HAIR = ['bald', 'short', 'crop', 'long', 'tied', 'braid', 'topknot', 'wild', 'mohawk', 'bun'];
export const BEARDS = ['none', 'stubble', 'short', 'full', 'long', 'braided', 'moustache'];
export const HORNS = ['none', 'curled', 'swept', 'small', 'ram'];
export const OUTFITS = { robe:'Robes', tunic:'Tunic and breeches', leather:'Leathers', hide:'Hide and fur', chain:'Chain mail', half:'Breastplate', plate:'Plate armour', monk:'Wrapped gi', rags:'Rags', noble:'Noble finery', vestments:'Vestments' };
export const CLOAKS = { none:'None', cloak:'Cloak', hood:'Hooded cloak', cape:'Short cape', mantle:'High-collared mantle' };
export const HELMS = { none:'None', cap:'Leather cap', open:'Open helm', great:'Great helm', circlet:'Circlet', hat:'Wide-brimmed hat', pointed:'Pointed hat' };
export const WEAPON_MODELS = ['none', 'sword', 'shortsword', 'greatsword', 'rapier', 'scimitar', 'dagger', 'axe', 'greataxe', 'mace', 'hammer', 'maul', 'club', 'spear', 'glaive', 'staff', 'bow', 'longbow', 'crossbow', 'sickle', 'whip', 'trident'];
export const OFFHANDS = { none:'Nothing', shield:'Shield', dagger:'Dagger', torch:'Torch', lantern:'Lantern', book:'Spellbook', orb:'Orb', holy:'Holy symbol', claw:'Bare claws' };
export const POSES = { hero:'Heroic', ready:'On guard', caster:'Spellcaster', sneak:'Sly', regal:'Regal', slump:'Shambling', stiff:'Stiff' };

// SRD weapon names (and a monster's attack names) → the model in its hand
export const WEAPON_OF = [
  [/great ?sword|two-handed sword/i, 'greatsword'], [/great ?axe/i, 'greataxe'], [/maul|great ?club/i, 'maul'], [/war ?hammer|light hammer|hammer/i, 'hammer'],
  [/glaive|halberd|pike|scythe/i, 'glaive'], [/trident/i, 'trident'], [/spear|javelin|lance/i, 'spear'], [/quarterstaff|staff/i, 'staff'],
  [/long ?bow/i, 'longbow'], [/short ?bow|\bbow\b/i, 'bow'], [/crossbow/i, 'crossbow'], [/rapier/i, 'rapier'], [/scimitar|sabre|saber|cutlass/i, 'scimitar'],
  [/short ?sword/i, 'shortsword'], [/long ?sword|sword|blade/i, 'sword'], [/battle ?axe|hand ?axe|axe|war pick|pick/i, 'axe'],
  [/mace|morning ?star|flail/i, 'mace'], [/club|cudgel/i, 'club'], [/dagger|knife|dart|stiletto/i, 'dagger'], [/sickle/i, 'sickle'], [/whip|lash/i, 'whip'],
];
export const weaponModel = name => (WEAPON_OF.find(([re]) => re.test(name || '')) || [null, null])[1];
export const TWO_HANDED = new Set(['greatsword', 'greataxe', 'maul', 'glaive', 'staff', 'bow', 'longbow', 'crossbow']);

// How each class dresses and stands when the sheet doesn't say otherwise
export const CLASS_STYLE = {
  Barbarian:{ outfit:'hide', pose:'hero', cloak:'none', build:.8 }, Bard:{ outfit:'tunic', pose:'sneak', cloak:'cape', helm:'hat' },
  Cleric:{ outfit:'vestments', pose:'ready', cloak:'cloak', off:'holy' }, Druid:{ outfit:'robe', pose:'caster', cloak:'hood', main:'staff' },
  Fighter:{ outfit:'chain', pose:'ready', cloak:'cape' }, Monk:{ outfit:'monk', pose:'ready', cloak:'none' },
  Paladin:{ outfit:'plate', pose:'hero', cloak:'cloak' }, Ranger:{ outfit:'leather', pose:'ready', cloak:'hood' },
  Rogue:{ outfit:'leather', pose:'sneak', cloak:'hood' }, Sorcerer:{ outfit:'robe', pose:'caster', cloak:'mantle', off:'orb' },
  Warlock:{ outfit:'robe', pose:'caster', cloak:'mantle', off:'book' }, Wizard:{ outfit:'robe', pose:'caster', cloak:'cloak', main:'staff', helm:'pointed' },
};
export const ARMOR_OUTFIT = { None:null, Leather:'leather', 'Studded Leather':'leather', Hide:'hide', 'Chain Shirt':'chain', 'Scale Mail':'chain', Breastplate:'half', 'Half Plate':'half', 'Ring Mail':'chain', 'Chain Mail':'chain', Splint:'plate', Plate:'plate' };

/* Presets for creatures (by bestiary id). Each is a partial look; `vary` lists what changes between one of them and
   the next (skin, hair, height, cloth, pose tilt). Folk get villager colours; the dead get the grave's. */
export const PRESETS = {
  commoner:      { body:'human', outfit:'tunic', main:'club', cloak:'none', pose:'ready', vary:['skin', 'hair', 'cloth', 'height', 'beard'] },
  bandit:        { body:'human', outfit:'leather', main:'scimitar', off:'dagger', cloak:'hood', pose:'sneak', c1:'#4a3a2a', vary:['skin', 'hair', 'height', 'beard', 'cloth'] },
  'bandit-captain':{ body:'human', outfit:'leather', main:'scimitar', off:'dagger', cloak:'cape', cloakCol:'#6a1a1a', pose:'hero', helm:'hat', vary:['skin', 'hair', 'beard'] },
  cultist:       { body:'human', outfit:'robe', main:'sickle', cloak:'hood', c1:'#4a1a26', cloakCol:'#3a1420', pose:'stiff', vary:['skin', 'height'] },
  'cult-fanatic':{ body:'human', outfit:'robe', main:'dagger', off:'book', cloak:'mantle', c1:'#3a0e1c', cloakCol:'#5a1020', pose:'caster', vary:['skin', 'hair'] },
  guard:         { body:'human', outfit:'chain', main:'spear', off:'shield', helm:'open', cloak:'none', c1:'#3a4a6a', shieldCol:'#3a4a6a', pose:'stiff', vary:['skin', 'height', 'beard'] },
  scout:         { body:'human', outfit:'leather', main:'longbow', cloak:'hood', c1:'#3f5a3a', cloakCol:'#2f4a2e', pose:'sneak', vary:['skin', 'hair', 'height'] },
  veteran:       { body:'human', outfit:'half', main:'sword', off:'dagger', cloak:'cape', pose:'hero', vary:['skin', 'hair', 'beard'] },
  noble:         { body:'human', outfit:'noble', main:'rapier', cloak:'mantle', pose:'regal', vary:['skin', 'hair', 'cloth'] },
  priest:        { body:'human', outfit:'vestments', main:'mace', off:'holy', cloak:'cloak', pose:'ready', vary:['skin', 'hair', 'beard'] },
  zombie:        { body:'zombie', outfit:'rags', main:'none', off:'claw', cloak:'none', pose:'slump', glow:true, eyes:'#ff5a4a', vary:['skin', 'hair', 'height', 'cloth', 'tilt'] },
  ghoul:         { body:'zombie', outfit:'rags', main:'none', off:'claw', cloak:'none', pose:'slump', skin:'#9b8fa8', glow:true, eyes:'#ff5a4a', hair:'bald', vary:['height', 'tilt'] },
  revenant:      { body:'zombie', outfit:'leather', main:'none', off:'claw', cloak:'cape', cloakCol:'#3a1a1a', pose:'hero', glow:true, eyes:'#ff8a3a', skin:'#8c6a62', vary:['hair'] },
  skeleton:      { body:'skeleton', outfit:'none', main:'shortsword', off:'shield', shieldCol:'#5a4a3a', metal:'rust', helm:'open', pose:'stiff', glow:true, eyes:'#ff5a4a', vary:['height', 'tilt', 'gear'] },
  wight:         { body:'zombie', outfit:'chain', main:'sword', cloak:'cape', cloakCol:'#1e1e24', metal:'iron', pose:'regal', glow:true, eyes:'#b0ff8a', skin:'#6f7f6a', hair:'long', hairCol:'#c8c8c0', vary:['height'] },
  vampire:       { body:'vampire', outfit:'noble', main:'none', off:'claw', cloak:'mantle', cloakCol:'#140a10', c1:'#1a1418', c2:'#7d1f2e', pose:'regal', glow:true, eyes:'#ff3030', hair:'tied', hairCol:'#141012', vary:[] },
};
// NPC kinds for the generator: a preset to start from, and what the DM sees on the button.
export const NPC_KINDS = {
  villager:{ n:'Villager', preset:'commoner' }, vistani:{ n:'Vistani', preset:'commoner', look:{ outfit:'tunic', c1:'#8a2a3a', c2:'#c0a040', cloak:'cape', cloakCol:'#5a2a6a', helm:'none' } },
  guard:{ n:'Guard', preset:'guard' }, priest:{ n:'Priest', preset:'priest' }, noble:{ n:'Noble', preset:'noble' },
  bandit:{ n:'Bandit', preset:'bandit' }, cultist:{ n:'Cultist', preset:'cultist' }, hunter:{ n:'Hunter', preset:'scout' },
  adventurer:{ n:'Adventurer', preset:null },
};
