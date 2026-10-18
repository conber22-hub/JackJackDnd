/* SRD 5.2 (2024) RULES DATA for the character creator, levels 1–10.
   System Reference Document 5.2 © Wizards of the Coast, Creative Commons Attribution 4.0.
   The classes / species / backgrounds / weapons / spells lists follow the Battle Table's Skirmish data,
   extended to level 10. Each class carries its one SRD subclass. */
export const ABILITIES = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
export const ABILITY_NAMES = { Str:'Strength', Dex:'Dexterity', Con:'Constitution', Int:'Intelligence', Wis:'Wisdom', Cha:'Charisma' };
export const mod = s => Math.floor((s - 10) / 2);
export const profBonus = L => L >= 9 ? 4 : L >= 5 ? 3 : 2;
export const MAX_LEVEL = 10;
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_COST = { 8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9 };

export const SKILLS = {
  Acrobatics:'Dex', 'Animal Handling':'Wis', Arcana:'Int', Athletics:'Str', Deception:'Cha', History:'Int', Insight:'Wis', Intimidation:'Cha',
  Investigation:'Int', Medicine:'Wis', Nature:'Int', Perception:'Wis', Performance:'Cha', Persuasion:'Cha', Religion:'Int', 'Sleight of Hand':'Dex', Stealth:'Dex', Survival:'Wis',
};
const ALL_SKILLS = Object.keys(SKILLS);

// hd · saves · caster ability · full/half/pact · weapon mastery count · armour · subclass · colour · starting array · skills [count, list]
// cantrips / prep: per level 1..10 · features: per level (names only — your Player's Handbook or the SRD has the rules text)
export const CLASSES = {
  Barbarian:{ hd:12, sv:['Str', 'Con'], cast:null, mastery:2, armor:'medium+shield', sub:'Path of the Berserker', color:'#b3542e',
    arr:{ Str:15, Dex:13, Con:14, Int:8, Wis:12, Cha:10 }, skills:[2, ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival']],
    features:{ 1:['Rage', 'Unarmored Defense', 'Weapon Mastery'], 2:['Danger Sense', 'Reckless Attack'], 3:['Primal Knowledge', 'Berserker: Frenzy'], 4:['Ability Score Improvement'], 5:['Extra Attack', 'Fast Movement'], 6:['Berserker: Mindless Rage'], 7:['Feral Instinct', 'Instinctive Pounce'], 8:['Ability Score Improvement'], 9:['Brutal Strike'], 10:['Berserker: Retaliation'] } },
  Bard:{ hd:8, sv:['Dex', 'Cha'], cast:'Cha', full:true, sub:'College of Lore', color:'#9b5fb3', letter:'B', armor:'light',
    arr:{ Str:8, Dex:14, Con:13, Int:12, Wis:10, Cha:15 }, skills:[3, ALL_SKILLS],
    cantrips:[2,2,2,3,3,3,3,3,3,4], prep:[4,5,6,7,9,10,11,12,14,15], expertise:{ 2:2, 9:2 },
    features:{ 1:['Bardic Inspiration', 'Spellcasting'], 2:['Expertise', 'Jack of All Trades'], 3:['Lore: Bonus Proficiencies', 'Lore: Cutting Words'], 4:['Ability Score Improvement'], 5:['Font of Inspiration'], 6:['Lore: Magical Discoveries'], 7:['Countercharm'], 8:['Ability Score Improvement'], 9:['Expertise'], 10:['Magical Secrets'] } },
  Cleric:{ hd:8, sv:['Wis', 'Cha'], cast:'Wis', full:true, sub:'Life Domain', color:'#d9c46a', letter:'C', armor:'medium+shield',
    arr:{ Str:14, Dex:8, Con:13, Int:10, Wis:15, Cha:12 }, skills:[2, ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion']],
    cantrips:[3,3,3,4,4,4,4,4,4,5], prep:[4,5,6,7,9,10,11,12,14,15],
    features:{ 1:['Spellcasting', 'Divine Order'], 2:['Channel Divinity'], 3:['Life: Disciple of Life', 'Life: Preserve Life'], 4:['Ability Score Improvement'], 5:['Sear Undead'], 6:['Life: Blessed Healer'], 7:['Blessed Strikes'], 8:['Ability Score Improvement'], 10:['Divine Intervention'] } },
  Druid:{ hd:8, sv:['Int', 'Wis'], cast:'Wis', full:true, sub:'Circle of the Land', color:'#5f9a4a', letter:'D', armor:'light+shield',
    arr:{ Str:8, Dex:13, Con:14, Int:10, Wis:15, Cha:12 }, skills:[2, ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival']],
    cantrips:[2,2,2,3,3,3,3,3,3,4], prep:[4,5,6,7,9,10,11,12,14,15],
    features:{ 1:['Spellcasting', 'Druidic', 'Primal Order'], 2:['Wild Shape', 'Wild Companion'], 3:['Land: Circle Spells', 'Land: Land\'s Aid'], 4:['Ability Score Improvement'], 5:['Wild Resurgence'], 6:['Land: Natural Recovery'], 7:['Elemental Fury'], 8:['Ability Score Improvement'], 10:['Land: Nature\'s Ward'] } },
  Fighter:{ hd:10, sv:['Str', 'Con'], cast:null, mastery:3, armor:'heavy+shield', sub:'Champion', color:'#8a8f99', style:1,
    arr:{ Str:15, Dex:14, Con:13, Int:8, Wis:10, Cha:12 }, skills:[2, ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Persuasion', 'Perception', 'Survival']],
    asiExtra:[6],
    features:{ 1:['Fighting Style', 'Second Wind', 'Weapon Mastery'], 2:['Action Surge', 'Tactical Mind'], 3:['Champion: Improved Critical', 'Champion: Remarkable Athlete'], 4:['Ability Score Improvement'], 5:['Extra Attack', 'Tactical Shift'], 6:['Ability Score Improvement'], 7:['Champion: Additional Fighting Style'], 8:['Ability Score Improvement'], 9:['Indomitable', 'Tactical Master'], 10:['Champion: Heroic Warrior'] } },
  Monk:{ hd:8, sv:['Str', 'Dex'], cast:null, sub:'Warrior of the Open Hand', color:'#4a8f9a', armor:'none',
    arr:{ Str:12, Dex:15, Con:13, Int:10, Wis:14, Cha:8 }, skills:[2, ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth']],
    features:{ 1:['Martial Arts', 'Unarmored Defense'], 2:['Monk\'s Focus', 'Unarmored Movement', 'Uncanny Metabolism'], 3:['Deflect Attacks', 'Open Hand Technique'], 4:['Ability Score Improvement', 'Slow Fall'], 5:['Extra Attack', 'Stunning Strike'], 6:['Empowered Strikes', 'Open Hand: Wholeness of Body'], 7:['Evasion'], 8:['Ability Score Improvement'], 9:['Acrobatic Movement'], 10:['Heightened Focus', 'Self-Restoration'] } },
  Paladin:{ hd:10, sv:['Wis', 'Cha'], cast:'Cha', half:true, mastery:2, armor:'heavy+shield', sub:'Oath of Devotion', color:'#e0c060', letter:'P', style:2,
    arr:{ Str:15, Dex:10, Con:13, Int:8, Wis:12, Cha:14 }, skills:[2, ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion']],
    prep:[2,3,4,5,6,6,7,7,9,9],
    features:{ 1:['Lay on Hands', 'Spellcasting', 'Weapon Mastery'], 2:['Fighting Style', 'Paladin\'s Smite'], 3:['Channel Divinity', 'Devotion: Sacred Weapon'], 4:['Ability Score Improvement'], 5:['Extra Attack', 'Faithful Steed'], 6:['Aura of Protection'], 7:['Devotion: Aura of Devotion'], 8:['Ability Score Improvement'], 9:['Abjure Foes'], 10:['Aura of Courage'] } },
  Ranger:{ hd:10, sv:['Str', 'Dex'], cast:'Wis', half:true, mastery:2, armor:'medium+shield', sub:'Hunter', color:'#3f7a3a', letter:'R', style:2,
    arr:{ Str:12, Dex:15, Con:13, Int:8, Wis:14, Cha:10 }, skills:[3, ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']],
    prep:[2,3,4,5,6,6,7,7,9,9], expertise:{ 2:1, 9:2 },
    features:{ 1:['Spellcasting', 'Favored Enemy', 'Weapon Mastery'], 2:['Deft Explorer', 'Fighting Style'], 3:['Hunter: Hunter\'s Prey', 'Hunter: Hunter\'s Lore'], 4:['Ability Score Improvement'], 5:['Extra Attack'], 6:['Roving'], 7:['Hunter: Defensive Tactics'], 8:['Ability Score Improvement'], 9:['Expertise'], 10:['Tireless'] } },
  Rogue:{ hd:8, sv:['Dex', 'Int'], cast:null, mastery:2, armor:'light', sub:'Thief', color:'#5a5a6a',
    arr:{ Str:12, Dex:15, Con:13, Int:14, Wis:10, Cha:8 }, skills:[4, ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Persuasion', 'Sleight of Hand', 'Stealth']],
    expertise:{ 1:2, 6:2 }, asiExtra:[10], tools:true,
    features:{ 1:['Expertise', 'Sneak Attack', 'Thieves\' Cant', 'Weapon Mastery'], 2:['Cunning Action'], 3:['Steady Aim', 'Thief: Fast Hands', 'Thief: Second-Story Work'], 4:['Ability Score Improvement'], 5:['Cunning Strike', 'Uncanny Dodge'], 6:['Expertise'], 7:['Evasion', 'Reliable Talent'], 8:['Ability Score Improvement'], 9:['Thief: Supreme Sneak'], 10:['Ability Score Improvement'] } },
  Sorcerer:{ hd:6, sv:['Con', 'Cha'], cast:'Cha', full:true, sub:'Draconic Sorcery', color:'#c0453a', letter:'S', armor:'none',
    arr:{ Str:10, Dex:13, Con:14, Int:8, Wis:12, Cha:15 }, skills:[2, ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion']],
    cantrips:[4,4,4,5,5,5,5,5,5,6], prep:[2,4,6,7,9,10,11,12,14,15],
    features:{ 1:['Spellcasting', 'Innate Sorcery'], 2:['Font of Magic', 'Metamagic'], 3:['Draconic: Draconic Resilience', 'Draconic Spells'], 4:['Ability Score Improvement'], 5:['Sorcerous Restoration'], 6:['Draconic: Elemental Affinity'], 7:['Sorcery Incarnate'], 8:['Ability Score Improvement'], 10:['Metamagic'] } },
  Warlock:{ hd:8, sv:['Wis', 'Cha'], cast:'Cha', pact:true, sub:'Fiend Patron', color:'#6a3a8a', letter:'K', armor:'light',
    arr:{ Str:8, Dex:14, Con:13, Int:12, Wis:10, Cha:15 }, skills:[2, ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion']],
    cantrips:[2,2,2,3,3,3,3,3,3,4], prep:[2,3,4,5,6,7,8,9,10,10],
    features:{ 1:['Eldritch Invocations', 'Pact Magic'], 2:['Magical Cunning'], 3:['Fiend: Dark One\'s Blessing'], 4:['Ability Score Improvement'], 6:['Fiend: Dark One\'s Own Luck'], 8:['Ability Score Improvement'], 9:['Contact Patron'], 10:['Fiend: Fiendish Resilience'] } },
  Wizard:{ hd:6, sv:['Int', 'Wis'], cast:'Int', full:true, sub:'Evoker', color:'#3a6ac0', letter:'W', armor:'none',
    arr:{ Str:8, Dex:14, Con:13, Int:15, Wis:12, Cha:10 }, skills:[2, ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Nature', 'Religion']],
    cantrips:[3,3,3,4,4,4,4,4,4,5], prep:[4,5,6,7,9,10,11,12,14,15],
    features:{ 1:['Spellcasting', 'Ritual Adept', 'Arcane Recovery'], 2:['Scholar'], 3:['Evoker: Evocation Savant', 'Evoker: Potent Cantrip'], 4:['Ability Score Improvement'], 5:['Memorize Spell'], 6:['Evoker: Sculpt Spells'], 8:['Ability Score Improvement'], 10:['Evoker: Empowered Evocation'] } },
};
export const SLOTS_FULL = [[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2]];
export const SLOTS_HALF = [[2],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2]];
export const PACT = [[1,1],[2,1],[2,2],[2,2],[2,3],[2,3],[2,4],[2,4],[2,5],[2,5]];   // [slots, slot level]

export const SPECIES = {
  Dragonborn:{ spd:30, size:'Medium', opts:{ 'Draconic ancestry':['Black (acid)', 'Blue (lightning)', 'Brass (fire)', 'Bronze (lightning)', 'Copper (acid)', 'Gold (fire)', 'Green (poison)', 'Red (fire)', 'Silver (cold)', 'White (cold)'] },
    note:'Breath Weapon (replaces one attack): 15-ft cone or 30-ft line, Dex save. Resistance to its damage type. Darkvision 60 ft.' },
  Dwarf:{ spd:30, size:'Medium', note:'Dwarven Toughness (+1 HP per level). Poison resistance, Advantage vs Poisoned. Darkvision 120 ft. Stonecunning.' },
  Elf:{ spd:30, size:'Medium', opts:{ Lineage:['High Elf', 'Wood Elf', 'Drow'] }, note:'Fey Ancestry (Advantage vs Charmed). Darkvision 60 ft. Keen Senses (Perception proficiency). Trance.' },
  Gnome:{ spd:30, size:'Small', note:'Gnomish Cunning: Advantage on Int, Wis and Cha saves. Darkvision 60 ft.' },
  Goliath:{ spd:35, size:'Medium', opts:{ 'Giant ancestry':['Cloud\'s Jaunt', 'Fire\'s Burn', 'Frost\'s Chill', 'Hill\'s Tumble', 'Stone\'s Endurance', 'Storm\'s Thunder'] },
    note:'Giant Ancestry (uses = PB per long rest). Large Form from level 5. Powerful Build.' },
  Halfling:{ spd:30, size:'Small', note:'Luck: reroll a natural 1 on a d20 test. Brave (Advantage vs Frightened). Halfling Nimbleness. Naturally Stealthy.' },
  Human:{ spd:30, size:'Medium', note:'Resourceful: Heroic Inspiration after every long rest. Skillful (one extra skill). Versatile (an extra origin feat).' },
  Orc:{ spd:30, size:'Medium', note:'Adrenaline Rush (Bonus Action Dash + temp HP). Relentless Endurance (drop to 1 HP instead of 0, once per long rest). Darkvision 120 ft.' },
  Tiefling:{ spd:30, size:'Medium', opts:{ 'Fiendish legacy':['Infernal', 'Abyssal', 'Chthonic'] }, note:'Fiendish Legacy cantrip (and more spells at 3 and 5). Darkvision 60 ft. Otherworldly Presence.' },
};
export const BACKGROUNDS = {
  Acolyte:{ ab:['Int', 'Wis', 'Cha'], feat:'Magic Initiate (Cleric)', mi:'C', skills:['Insight', 'Religion'] },
  Criminal:{ ab:['Dex', 'Con', 'Int'], feat:'Alert', alert:true, skills:['Sleight of Hand', 'Stealth'], tools:true },
  Sage:{ ab:['Con', 'Int', 'Wis'], feat:'Magic Initiate (Wizard)', mi:'W', skills:['Arcana', 'History'] },
  Soldier:{ ab:['Str', 'Dex', 'Con'], feat:'Savage Attacker', savage:true, skills:['Athletics', 'Intimidation'] },
};
// n, damage, type, properties (F finesse, L light, T thrown, H heavy, 2 two-handed, V:die versatile, R reach, A ammunition), range, mastery, category
export const WEAPONS = [
  ['Club','1d4','bludgeoning','L',0,'Slow','s'],['Dagger','1d4','piercing','FLT',[20,60],'Nick','s'],
  ['Greatclub','1d8','bludgeoning','2',0,'Push','s'],['Handaxe','1d6','slashing','LT',[20,60],'Vex','s'],
  ['Javelin','1d6','piercing','T',[30,120],'Slow','s'],['Light Hammer','1d4','bludgeoning','LT',[20,60],'Nick','s'],
  ['Mace','1d6','bludgeoning','',0,'Sap','s'],['Quarterstaff','1d6','bludgeoning','V:1d8',0,'Topple','s'],
  ['Sickle','1d4','slashing','L',0,'Nick','s'],['Spear','1d6','piercing','TV:1d8',[20,60],'Sap','s'],
  ['Dart','1d4','piercing','FT',[20,60],'Vex','sr'],['Light Crossbow','1d8','piercing','A2',[80,320],'Slow','sr'],
  ['Shortbow','1d6','piercing','A2',[80,320],'Vex','sr'],['Sling','1d4','bludgeoning','A',[30,120],'Slow','sr'],
  ['Battleaxe','1d8','slashing','V:1d10',0,'Topple','m'],['Flail','1d8','bludgeoning','',0,'Sap','m'],
  ['Glaive','1d10','slashing','H2R',0,'Graze','m'],['Greataxe','1d12','slashing','H2',0,'Cleave','m'],
  ['Greatsword','2d6','slashing','H2',0,'Graze','m'],['Halberd','1d10','slashing','H2R',0,'Cleave','m'],
  ['Longsword','1d8','slashing','V:1d10',0,'Sap','m'],['Maul','2d6','bludgeoning','H2',0,'Topple','m'],
  ['Morningstar','1d8','piercing','',0,'Sap','m'],['Pike','1d10','piercing','H2R',0,'Push','m'],
  ['Rapier','1d8','piercing','F',0,'Vex','m'],['Scimitar','1d6','slashing','FL',0,'Nick','m'],
  ['Shortsword','1d6','piercing','FL',0,'Vex','m'],['Trident','1d8','piercing','TV:1d10',[20,60],'Topple','m'],
  ['Warhammer','1d8','bludgeoning','V:1d10',0,'Push','m'],['War Pick','1d8','piercing','V:1d10',0,'Sap','m'],
  ['Whip','1d4','slashing','FR',0,'Slow','m'],['Hand Crossbow','1d6','piercing','AL',[30,120],'Vex','mr'],
  ['Heavy Crossbow','1d10','piercing','AH2',[100,400],'Push','mr'],['Longbow','1d8','piercing','AH2',[150,600],'Slow','mr'],
].map(w => ({ n:w[0], d:w[1], ty:w[2], p:w[3], rng:w[4], ms:w[5], cat:w[6] }));
export const ARMOR = {
  None:{ ac:10, dex:99 }, Leather:{ ac:11, dex:99, t:'light' }, 'Studded Leather':{ ac:12, dex:99, t:'light' },
  Hide:{ ac:12, dex:2, t:'medium' }, 'Chain Shirt':{ ac:13, dex:2, t:'medium' }, 'Scale Mail':{ ac:14, dex:2, t:'medium' },
  Breastplate:{ ac:14, dex:2, t:'medium' }, 'Half Plate':{ ac:15, dex:2, t:'medium' },
  'Ring Mail':{ ac:14, dex:0, t:'heavy' }, 'Chain Mail':{ ac:16, dex:0, t:'heavy' }, Splint:{ ac:17, dex:0, t:'heavy' }, Plate:{ ac:18, dex:0, t:'heavy' },
};
export const STYLES = { Archery:'+2 to ranged weapon attacks', Defense:'+1 AC while armoured', Dueling:'+2 damage with a one-handed melee weapon and no other weapon', 'Great Weapon Fighting':'Treat 1s and 2s on weapon damage dice as 3s (two-handed/versatile)' };
export const INVOCATIONS = ['Agonizing Blast', 'Repelling Blast', 'Armor of Shadows', 'Devil\'s Sight', 'Eldritch Mind'];

/* spells (SRD 5.2 subset, levels 0–5)
   c: class letters B bard C cleric D druid P paladin R ranger S sorcerer K warlock W wizard
   k: atk (spell attack) · save · auto · heal · buff · util   d: damage / healing dice   ty: damage type
   sv: save ability · half: half on a save · area: [shape, feet] · cond: condition on a failed save · cs: cantrip scaling */
export const SPELLS = [
  // cantrips
  { n:'Fire Bolt', l:0, c:'SW', k:'atk', d:'1d10', ty:'fire', cs:1 },
  { n:'Ray of Frost', l:0, c:'SW', k:'atk', d:'1d8', ty:'cold', cs:1 },
  { n:'Shocking Grasp', l:0, c:'SW', k:'atk', d:'1d8', ty:'lightning', cs:1 },
  { n:'Chill Touch', l:0, c:'SKW', k:'atk', d:'1d10', ty:'necrotic', cs:1 },
  { n:'Poison Spray', l:0, c:'DSKW', k:'atk', d:'1d12', ty:'poison', cs:1 },
  { n:'Acid Splash', l:0, c:'SW', k:'save', sv:'dex', d:'1d6', ty:'acid', cs:1, area:['sphere', 5] },
  { n:'Eldritch Blast', l:0, c:'K', k:'atk', d:'1d10', ty:'force', beams:1 },
  { n:'Sacred Flame', l:0, c:'C', k:'save', sv:'dex', d:'1d8', ty:'radiant', cs:1 },
  { n:'Toll the Dead', l:0, c:'CKW', k:'save', sv:'wis', d:'1d8', ty:'necrotic', cs:1 },
  { n:'Word of Radiance', l:0, c:'C', k:'save', sv:'con', d:'1d6', ty:'radiant', cs:1, area:['aura', 5] },
  { n:'Vicious Mockery', l:0, c:'B', k:'save', sv:'wis', d:'1d6', ty:'psychic', cs:1 },
  { n:'Starry Wisp', l:0, c:'BD', k:'atk', d:'1d8', ty:'radiant', cs:1 },
  { n:'Produce Flame', l:0, c:'D', k:'atk', d:'1d8', ty:'fire', cs:1 },
  { n:'Thorn Whip', l:0, c:'D', k:'atk', d:'1d6', ty:'piercing', cs:1 },
  { n:'Shillelagh', l:0, c:'D', k:'buff' }, { n:'Guidance', l:0, c:'CD', k:'buff' }, { n:'Light', l:0, c:'BCSW', k:'util' },
  { n:'Mage Hand', l:0, c:'BSKW', k:'util' }, { n:'Prestidigitation', l:0, c:'BSKW', k:'util' }, { n:'Thaumaturgy', l:0, c:'C', k:'util' },
  { n:'Spare the Dying', l:0, c:'CD', k:'util' },
  // 1st
  { n:'Magic Missile', l:1, c:'SW', k:'auto', d:'3d4+3', ty:'force' },
  { n:'Burning Hands', l:1, c:'SW', k:'save', sv:'dex', d:'3d6', ty:'fire', half:1, area:['cone', 15] },
  { n:'Thunderwave', l:1, c:'BDSW', k:'save', sv:'con', d:'2d8', ty:'thunder', half:1, area:['cube', 15] },
  { n:'Chromatic Orb', l:1, c:'SW', k:'atk', d:'3d8', ty:'fire' },
  { n:'Ice Knife', l:1, c:'DSW', k:'atk', d:'1d10', ty:'piercing' },
  { n:'Guiding Bolt', l:1, c:'C', k:'atk', d:'4d6', ty:'radiant' },
  { n:'Inflict Wounds', l:1, c:'C', k:'save', sv:'con', d:'2d10', ty:'necrotic', half:1 },
  { n:'Cure Wounds', l:1, c:'BCDPR', k:'heal', d:'2d8' }, { n:'Healing Word', l:1, c:'BCD', k:'heal', d:'2d4' },
  { n:'Bless', l:1, c:'CP', k:'buff' }, { n:'Bane', l:1, c:'BC', k:'save', sv:'cha', cond:'frightened' },
  { n:'Command', l:1, c:'BCP', k:'save', sv:'wis', cond:'prone' },
  { n:'Dissonant Whispers', l:1, c:'B', k:'save', sv:'wis', d:'3d6', ty:'psychic', half:1, cond:'frightened' },
  { n:'Sleep', l:1, c:'BSW', k:'save', sv:'wis', cond:'incapacitated', area:['sphere', 5] },
  { n:'Entangle', l:1, c:'DR', k:'save', sv:'str', cond:'restrained', area:['cube', 20] },
  { n:'Faerie Fire', l:1, c:'BD', k:'buff' }, { n:'Shield', l:1, c:'SW', k:'buff' }, { n:'Mage Armor', l:1, c:'SW', k:'buff' },
  { n:'Shield of Faith', l:1, c:'CP', k:'buff' }, { n:'Hunter\'s Mark', l:1, c:'R', k:'buff' }, { n:'Hex', l:1, c:'K', k:'buff' },
  { n:'Armor of Agathys', l:1, c:'K', k:'buff' }, { n:'Hellish Rebuke', l:1, c:'K', k:'save', sv:'dex', d:'2d10', ty:'fire', half:1 },
  { n:'Divine Smite', l:1, c:'P', k:'util', d:'2d8', ty:'radiant' },
  { n:'Detect Magic', l:1, c:'BCDPRSW', k:'util' }, { n:'Protection from Evil and Good', l:1, c:'CPKW', k:'buff' },
  { n:'Charm Person', l:1, c:'BDSKW', k:'save', sv:'wis', cond:'charmed' },
  // 2nd
  { n:'Scorching Ray', l:2, c:'SW', k:'atk', d:'6d6', ty:'fire' },
  { n:'Shatter', l:2, c:'BSW', k:'save', sv:'con', d:'3d8', ty:'thunder', half:1, area:['sphere', 10] },
  { n:'Misty Step', l:2, c:'SKW', k:'util' }, { n:'Spiritual Weapon', l:2, c:'C', k:'atk', d:'1d8', ty:'force', addmod:1 },
  { n:'Hold Person', l:2, c:'BCDSKW', k:'save', sv:'wis', cond:'paralyzed' },
  { n:'Moonbeam', l:2, c:'D', k:'save', sv:'con', d:'2d10', ty:'radiant', half:1, area:['sphere', 5] },
  { n:'Aid', l:2, c:'BCDPR', k:'buff' }, { n:'Lesser Restoration', l:2, c:'BCDPR', k:'util', note:'Ends Blinded, Paralyzed, Poisoned — and burns the Bloom\'s seed out of a living host (ends Seeded).' },
  { n:'Silence', l:2, c:'BCR', k:'util' }, { n:'Invisibility', l:2, c:'BSKW', k:'buff' }, { n:'Web', l:2, c:'SW', k:'save', sv:'dex', cond:'restrained', area:['cube', 20] },
  { n:'Darkvision', l:2, c:'DRSW', k:'buff' }, { n:'Find Steed', l:2, c:'P', k:'util' }, { n:'Zone of Truth', l:2, c:'BCP', k:'util' },
  // 3rd
  { n:'Fireball', l:3, c:'SW', k:'save', sv:'dex', d:'8d6', ty:'fire', half:1, area:['sphere', 20] },
  { n:'Lightning Bolt', l:3, c:'SW', k:'save', sv:'dex', d:'8d6', ty:'lightning', half:1, area:['line', 100] },
  { n:'Spirit Guardians', l:3, c:'C', k:'save', sv:'wis', d:'3d8', ty:'radiant', half:1, area:['aura', 15] },
  { n:'Mass Healing Word', l:3, c:'BC', k:'heal', d:'2d4' },
  { n:'Hypnotic Pattern', l:3, c:'BSKW', k:'save', sv:'wis', cond:'incapacitated', area:['cube', 30] },
  { n:'Fear', l:3, c:'BSKW', k:'save', sv:'wis', cond:'frightened', area:['cone', 30] },
  { n:'Vampiric Touch', l:3, c:'SKW', k:'atk', d:'3d6', ty:'necrotic' },
  { n:'Revivify', l:3, c:'CP', k:'util' }, { n:'Daylight', l:3, c:'CDPRS', k:'util', note:'Sunlight. Vampires and spawn hate it; the Bloom shrivels from it.' },
  { n:'Remove Curse', l:3, c:'CPKW', k:'util' }, { n:'Dispel Magic', l:3, c:'BCDPSKW', k:'util' }, { n:'Counterspell', l:3, c:'SKW', k:'util' },
  { n:'Speak with Dead', l:3, c:'BC', k:'util' },
  // 4th
  { n:'Ice Storm', l:4, c:'DSW', k:'save', sv:'dex', d:'2d10+4d6', ty:'cold', half:1, area:['cylinder', 20] },
  { n:'Wall of Fire', l:4, c:'DSW', k:'save', sv:'dex', d:'5d8', ty:'fire', half:1, area:['line', 60] },
  { n:'Banishment', l:4, c:'CPSKW', k:'save', sv:'cha', cond:'incapacitated' },
  { n:'Guardian of Faith', l:4, c:'C', k:'save', sv:'dex', d:'20', ty:'radiant', half:1 },
  { n:'Death Ward', l:4, c:'CP', k:'buff' }, { n:'Greater Invisibility', l:4, c:'BSW', k:'buff' }, { n:'Dimension Door', l:4, c:'BSKW', k:'util' },
  // 5th
  { n:'Cone of Cold', l:5, c:'SW', k:'save', sv:'con', d:'8d8', ty:'cold', half:1, area:['cone', 60] },
  { n:'Flame Strike', l:5, c:'C', k:'save', sv:'dex', d:'5d6+5d6', ty:'fire + radiant', half:1, area:['cylinder', 10] },
  { n:'Mass Cure Wounds', l:5, c:'BCD', k:'heal', d:'5d8' }, { n:'Hold Monster', l:5, c:'BSKW', k:'save', sv:'wis', cond:'paralyzed' },
  { n:'Greater Restoration', l:5, c:'BCD', k:'util' }, { n:'Raise Dead', l:5, c:'BCP', k:'util' },
];
export const SUBSPELLS = {
  'Life Domain':{ 3:['Bless', 'Cure Wounds', 'Aid', 'Lesser Restoration'], 5:['Mass Healing Word', 'Revivify'], 7:['Death Ward', 'Guardian of Faith'], 9:['Mass Cure Wounds', 'Raise Dead'] },
  'Fiend Patron':{ 3:['Burning Hands', 'Command', 'Scorching Ray'], 5:['Fireball'], 7:['Wall of Fire'], 9:['Flame Strike'] },
  'Draconic Sorcery':{ 3:['Chromatic Orb', 'Command'], 5:['Fear'], 7:['Banishment'], 9:['Hold Monster'] },
  'Oath of Devotion':{ 3:['Shield of Faith', 'Protection from Evil and Good'], 5:['Aid', 'Zone of Truth'], 9:['Dispel Magic'] },
  'Circle of the Land':{ 3:['Hold Person', 'Moonbeam'], 5:['Fireball'], 7:['Ice Storm'], 9:['Cone of Cold'] },
  'College of Lore':{}, 'Hunter':{}, 'Evoker':{},
};
