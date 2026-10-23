/* SRD 5.2 (2024) RULES DATA for the character creator, levels 1–20.
   This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of
   the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the
   Creative Commons Attribution 4.0 International License, available at
   https://creativecommons.org/licenses/by/4.0/legalcode. Changes: structured rules data and summaries.
   The classes / species / backgrounds / weapons / spells lists follow the Battle Table's Skirmish data,
   extended to level 20. Each class carries its one SRD subclass. */
export const ABILITIES = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
export const ABILITY_NAMES = { Str:'Strength', Dex:'Dexterity', Con:'Constitution', Int:'Intelligence', Wis:'Wisdom', Cha:'Charisma' };
export const mod = s => Math.floor((s - 10) / 2);
export const profBonus = L => L >= 17 ? 6 : L >= 13 ? 5 : L >= 9 ? 4 : L >= 5 ? 3 : 2;
export const MAX_LEVEL = 20;
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_COST = { 8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9 };

export const SKILLS = {
  Acrobatics:'Dex', 'Animal Handling':'Wis', Arcana:'Int', Athletics:'Str', Deception:'Cha', History:'Int', Insight:'Wis', Intimidation:'Cha',
  Investigation:'Int', Medicine:'Wis', Nature:'Int', Perception:'Wis', Performance:'Cha', Persuasion:'Cha', Religion:'Int', 'Sleight of Hand':'Dex', Stealth:'Dex', Survival:'Wis',
};
const ALL_SKILLS = Object.keys(SKILLS);

// hd · saves · caster ability · full/half/pact · weapon mastery count · armour · subclass · colour · starting array · skills [count, list]
// cantrips / prep: per level 1..20 · features: per level (rules text in FEATURES)
export const CLASSES = {
  Barbarian:{ hd:12, sv:['Str', 'Con'], cast:null, mastery:2, armor:'medium+shield', sub:'Path of the Berserker', color:'#b3542e',
    arr:{ Str:15, Dex:13, Con:14, Int:8, Wis:12, Cha:10 }, skills:[2, ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival']],
    features:{ 1:['Rage', 'Unarmored Defense', 'Weapon Mastery'], 2:['Danger Sense', 'Reckless Attack'], 3:['Primal Knowledge', 'Berserker: Frenzy'], 4:['Ability Score Improvement'], 5:['Extra Attack', 'Fast Movement'], 6:['Berserker: Mindless Rage'], 7:['Feral Instinct', 'Instinctive Pounce'], 8:['Ability Score Improvement'], 9:['Brutal Strike'], 10:['Berserker: Retaliation'],
      11:['Relentless Rage'], 12:['Ability Score Improvement'], 13:['Improved Brutal Strike'], 14:['Berserker: Intimidating Presence'], 15:['Persistent Rage'], 16:['Ability Score Improvement'], 17:['Improved Brutal Strike'], 18:['Indomitable Might'], 19:['Epic Boon'], 20:['Primal Champion'] } },
  Bard:{ hd:8, sv:['Dex', 'Cha'], cast:'Cha', full:true, sub:'College of Lore', color:'#9b5fb3', letter:'B', armor:'light',
    arr:{ Str:8, Dex:14, Con:13, Int:12, Wis:10, Cha:15 }, skills:[3, ALL_SKILLS],
    cantrips:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4], prep:[4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22], expertise:{ 2:2, 9:2 },
    features:{ 1:['Bardic Inspiration', 'Spellcasting'], 2:['Expertise', 'Jack of All Trades'], 3:['Lore: Bonus Proficiencies', 'Lore: Cutting Words'], 4:['Ability Score Improvement'], 5:['Font of Inspiration'], 6:['Lore: Magical Discoveries'], 7:['Countercharm'], 8:['Ability Score Improvement'], 9:['Expertise'], 10:['Magical Secrets'],
      11:[], 12:['Ability Score Improvement'], 13:[], 14:['Lore: Peerless Skill'], 15:[], 16:['Ability Score Improvement'], 17:[], 18:['Superior Inspiration'], 19:['Epic Boon'], 20:['Words of Creation'] } },
  Cleric:{ hd:8, sv:['Wis', 'Cha'], cast:'Wis', full:true, sub:'Life Domain', color:'#d9c46a', letter:'C', armor:'medium+shield',
    arr:{ Str:14, Dex:8, Con:13, Int:10, Wis:15, Cha:12 }, skills:[2, ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion']],
    cantrips:[3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5], prep:[4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22],
    features:{ 1:['Spellcasting', 'Divine Order'], 2:['Channel Divinity'], 3:['Life: Life Domain Spells', 'Life: Disciple of Life', 'Life: Preserve Life'], 4:['Ability Score Improvement'], 5:['Sear Undead'], 6:['Life: Blessed Healer'], 7:['Blessed Strikes'], 8:['Ability Score Improvement'], 10:['Divine Intervention'],
      11:[], 12:['Ability Score Improvement'], 13:[], 14:['Improved Blessed Strikes'], 15:[], 16:['Ability Score Improvement'], 17:['Life: Supreme Healing'], 18:[], 19:['Epic Boon'], 20:['Greater Divine Intervention'] } },
  Druid:{ hd:8, sv:['Int', 'Wis'], cast:'Wis', full:true, sub:'Circle of the Land', color:'#5f9a4a', letter:'D', armor:'light+shield',
    arr:{ Str:8, Dex:13, Con:14, Int:10, Wis:15, Cha:12 }, skills:[2, ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival']],
    cantrips:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4], prep:[4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22],
    features:{ 1:['Spellcasting', 'Druidic', 'Primal Order'], 2:['Wild Shape', 'Wild Companion'], 3:['Land: Circle Spells', 'Land: Land\'s Aid'], 4:['Ability Score Improvement'], 5:['Wild Resurgence'], 6:['Land: Natural Recovery'], 7:['Elemental Fury'], 8:['Ability Score Improvement'], 10:['Land: Nature\'s Ward'],
      11:[], 12:['Ability Score Improvement'], 13:[], 14:['Land: Nature\'s Sanctuary'], 15:['Improved Elemental Fury'], 16:['Ability Score Improvement'], 17:[], 18:['Beast Spells'], 19:['Epic Boon'], 20:['Archdruid'] } },
  Fighter:{ hd:10, sv:['Str', 'Con'], cast:null, mastery:3, armor:'heavy+shield', sub:'Champion', color:'#8a8f99', style:1,
    arr:{ Str:15, Dex:14, Con:13, Int:8, Wis:10, Cha:12 }, skills:[2, ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Persuasion', 'Perception', 'Survival']],
    asiExtra:[6,14],
    features:{ 1:['Fighting Style', 'Second Wind', 'Weapon Mastery'], 2:['Action Surge', 'Tactical Mind'], 3:['Champion: Improved Critical', 'Champion: Remarkable Athlete'], 4:['Ability Score Improvement'], 5:['Extra Attack', 'Tactical Shift'], 6:['Ability Score Improvement'], 7:['Champion: Additional Fighting Style'], 8:['Ability Score Improvement'], 9:['Indomitable', 'Tactical Master'], 10:['Champion: Heroic Warrior'],
      11:['Two Extra Attacks'], 12:['Ability Score Improvement'], 13:['Indomitable (two uses)', 'Studied Attacks'], 14:['Ability Score Improvement'], 15:['Champion: Superior Critical'], 16:['Ability Score Improvement'], 17:['Action Surge (two uses)', 'Indomitable (three uses)'], 18:['Champion: Survivor'], 19:['Epic Boon'], 20:['Three Extra Attacks'] } },
  Monk:{ hd:8, sv:['Str', 'Dex'], cast:null, sub:'Warrior of the Open Hand', color:'#4a8f9a', armor:'none',
    arr:{ Str:12, Dex:15, Con:13, Int:10, Wis:14, Cha:8 }, skills:[2, ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth']],
    features:{ 1:['Martial Arts', 'Unarmored Defense'], 2:['Monk\'s Focus', 'Unarmored Movement', 'Uncanny Metabolism'], 3:['Deflect Attacks', 'Open Hand Technique'], 4:['Ability Score Improvement', 'Slow Fall'], 5:['Extra Attack', 'Stunning Strike'], 6:['Empowered Strikes', 'Open Hand: Wholeness of Body'], 7:['Evasion'], 8:['Ability Score Improvement'], 9:['Acrobatic Movement'], 10:['Heightened Focus', 'Self-Restoration'],
      11:['Open Hand: Fleet Step'], 12:['Ability Score Improvement'], 13:['Deflect Energy'], 14:['Disciplined Survivor'], 15:['Perfect Focus'], 16:['Ability Score Improvement'], 17:['Open Hand: Quivering Palm'], 18:['Superior Defense'], 19:['Epic Boon'], 20:['Body and Mind'] } },
  Paladin:{ hd:10, sv:['Wis', 'Cha'], cast:'Cha', half:true, mastery:2, armor:'heavy+shield', sub:'Oath of Devotion', color:'#e0c060', letter:'P', style:2,
    arr:{ Str:15, Dex:10, Con:13, Int:8, Wis:12, Cha:14 }, skills:[2, ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion']],
    prep:[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15],
    features:{ 1:['Lay on Hands', 'Spellcasting', 'Weapon Mastery'], 2:['Fighting Style', 'Paladin\'s Smite'], 3:['Channel Divinity', 'Devotion: Oath of Devotion Spells', 'Devotion: Sacred Weapon'], 4:['Ability Score Improvement'], 5:['Extra Attack', 'Faithful Steed'], 6:['Aura of Protection'], 7:['Devotion: Aura of Devotion'], 8:['Ability Score Improvement'], 9:['Abjure Foes'], 10:['Aura of Courage'],
      11:['Radiant Strikes'], 12:['Ability Score Improvement'], 13:[], 14:['Restoring Touch'], 15:['Devotion: Smite of Protection'], 16:['Ability Score Improvement'], 17:[], 18:['Aura Expansion'], 19:['Epic Boon'], 20:['Devotion: Holy Nimbus'] } },
  Ranger:{ hd:10, sv:['Str', 'Dex'], cast:'Wis', half:true, mastery:2, armor:'medium+shield', sub:'Hunter', color:'#3f7a3a', letter:'R', style:2,
    arr:{ Str:12, Dex:15, Con:13, Int:8, Wis:14, Cha:10 }, skills:[3, ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']],
    prep:[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15], expertise:{ 2:1, 9:2 },
    features:{ 1:['Spellcasting', 'Favored Enemy', 'Weapon Mastery'], 2:['Deft Explorer', 'Fighting Style'], 3:['Hunter: Hunter\'s Prey', 'Hunter: Hunter\'s Lore'], 4:['Ability Score Improvement'], 5:['Extra Attack'], 6:['Roving'], 7:['Hunter: Defensive Tactics'], 8:['Ability Score Improvement'], 9:['Expertise'], 10:['Tireless'],
      11:['Hunter: Superior Hunter\'s Prey'], 12:['Ability Score Improvement'], 13:['Relentless Hunter'], 14:['Nature\'s Veil'], 15:['Hunter: Superior Hunter\'s Defense'], 16:['Ability Score Improvement'], 17:['Precise Hunter'], 18:['Feral Senses'], 19:['Epic Boon'], 20:['Foe Slayer'] } },
  Rogue:{ hd:8, sv:['Dex', 'Int'], cast:null, mastery:2, armor:'light', sub:'Thief', color:'#5a5a6a',
    arr:{ Str:12, Dex:15, Con:13, Int:14, Wis:10, Cha:8 }, skills:[4, ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Persuasion', 'Sleight of Hand', 'Stealth']],
    expertise:{ 1:2, 6:2 }, asiExtra:[10], tools:true,
    features:{ 1:['Expertise', 'Sneak Attack', 'Thieves\' Cant', 'Weapon Mastery'], 2:['Cunning Action'], 3:['Steady Aim', 'Thief: Fast Hands', 'Thief: Second-Story Work'], 4:['Ability Score Improvement'], 5:['Cunning Strike', 'Uncanny Dodge'], 6:['Expertise'], 7:['Evasion', 'Reliable Talent'], 8:['Ability Score Improvement'], 9:['Thief: Supreme Sneak'], 10:['Ability Score Improvement'],
      11:['Improved Cunning Strike'], 12:['Ability Score Improvement'], 13:['Thief: Use Magic Device'], 14:['Devious Strikes'], 15:['Slippery Mind'], 16:['Ability Score Improvement'], 17:['Thief: Thief\'s Reflexes'], 18:['Elusive'], 19:['Epic Boon'], 20:['Stroke of Luck'] } },
  Sorcerer:{ hd:6, sv:['Con', 'Cha'], cast:'Cha', full:true, sub:'Draconic Sorcery', color:'#c0453a', letter:'S', armor:'none',
    arr:{ Str:10, Dex:13, Con:14, Int:8, Wis:12, Cha:15 }, skills:[2, ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion']],
    cantrips:[4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6], prep:[2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22],
    features:{ 1:['Spellcasting', 'Innate Sorcery'], 2:['Font of Magic', 'Metamagic'], 3:['Draconic: Draconic Resilience', 'Draconic Spells'], 4:['Ability Score Improvement'], 5:['Sorcerous Restoration'], 6:['Draconic: Elemental Affinity'], 7:['Sorcery Incarnate'], 8:['Ability Score Improvement'], 10:['Metamagic'],
      11:[], 12:['Ability Score Improvement'], 13:[], 14:['Draconic: Dragon Wings'], 15:[], 16:['Ability Score Improvement'], 17:['Metamagic'], 18:['Draconic: Dragon Companion'], 19:['Epic Boon'], 20:['Arcane Apotheosis'] } },
  Warlock:{ hd:8, sv:['Wis', 'Cha'], cast:'Cha', pact:true, sub:'Fiend Patron', color:'#6a3a8a', letter:'K', armor:'light',
    arr:{ Str:8, Dex:14, Con:13, Int:12, Wis:10, Cha:15 }, skills:[2, ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion']],
    cantrips:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4], prep:[2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15],
    features:{ 1:['Eldritch Invocations', 'Pact Magic'], 2:['Magical Cunning'], 3:['Fiend: Fiend Spells', 'Fiend: Dark One\'s Blessing'], 4:['Ability Score Improvement'], 6:['Fiend: Dark One\'s Own Luck'], 8:['Ability Score Improvement'], 9:['Contact Patron'], 10:['Fiend: Fiendish Resilience'],
      11:['Mystic Arcanum (level 6 spell)'], 12:['Ability Score Improvement'], 13:['Mystic Arcanum (level 7 spell)'], 14:['Fiend: Hurl Through Hell'], 15:['Mystic Arcanum (level 8 spell)'], 16:['Ability Score Improvement'], 17:['Mystic Arcanum (level 9 spell)'], 18:[], 19:['Epic Boon'], 20:['Eldritch Master'] } },
  Wizard:{ hd:6, sv:['Int', 'Wis'], cast:'Int', full:true, sub:'Evoker', color:'#3a6ac0', letter:'W', armor:'none',
    arr:{ Str:8, Dex:14, Con:13, Int:15, Wis:12, Cha:10 }, skills:[2, ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Nature', 'Religion']],
    cantrips:[3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5], prep:[4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25],
    features:{ 1:['Spellcasting', 'Ritual Adept', 'Arcane Recovery'], 2:['Scholar'], 3:['Evoker: Evocation Savant', 'Evoker: Potent Cantrip'], 4:['Ability Score Improvement'], 5:['Memorize Spell'], 6:['Evoker: Sculpt Spells'], 8:['Ability Score Improvement'], 10:['Evoker: Empowered Evocation'],
      11:[], 12:['Ability Score Improvement'], 13:[], 14:['Evoker: Overchannel'], 15:[], 16:['Ability Score Improvement'], 17:[], 18:['Spell Mastery'], 19:['Epic Boon'], 20:['Signature Spells'] } },
};
export const SLOTS_FULL = [[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
export const SLOTS_HALF = [[2],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],[4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
export const PACT = [[1,1],[2,1],[2,2],[2,2],[2,3],[2,3],[2,4],[2,4],[2,5],[2,5],[3,5],[3,5],[3,5],[3,5],[3,5],[3,5],[4,5],[4,5],[4,5],[4,5]];   // [slots, slot level]

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
/* Feats a hero can take at an Ability Score Improvement level (SRD 5.2), in our own words. plus: abilities that
   get +1 · style: needs the Fighting Style feature · lists: Magic Initiate's spell lists · skills: how many. */
export const FEATS = {
  'Ability Score Improvement':{ text:'+2 to one ability, or +1 to two (none above 20).' },
  Alert:{ origin:true, text:'Add your Proficiency Bonus to Initiative; you may swap your Initiative with a willing ally\'s.' },
  Grappler:{ plus:['Str', 'Dex'], req:'Str or Dex 13+', text:'+1 Str or Dex. Your unarmed strike can damage and grapple at once; you have Advantage on attacks against a creature you\'re grappling; dragging it costs no extra movement.' },
  'Magic Initiate':{ origin:true, lists:{ C:'Cleric', D:'Druid', W:'Wizard' }, text:'Two cantrips and one level-1 spell from one list (pick them under Spells). Cast that spell once a long rest without a slot.' },
  'Savage Attacker':{ origin:true, text:'Once a turn when you hit with a weapon, roll its damage dice twice and use either roll.' },
  Skilled:{ origin:true, skills:3, text:'Proficiency in three skills of your choice.' },
  Archery:{ style:true, text:'+2 to attack rolls with ranged weapons.' },
  Defense:{ style:true, text:'+1 AC while you wear armour.' },
  'Great Weapon Fighting':{ style:true, text:'Treat 1s and 2s on the damage dice of two-handed and versatile weapons as 3s.' },
  'Two-Weapon Fighting':{ style:true, text:'Add your ability modifier to the damage of your extra light-weapon attack.' },
  Other:{ text:'Any other feat your DM allows: write its name and what it does. Most give +1 to an ability; a few give extra hit points.' },
};
export const STYLES = { Archery:'+2 to ranged weapon attacks', Defense:'+1 AC while armoured', Dueling:'+2 damage with a one-handed melee weapon and no other weapon', 'Great Weapon Fighting':'Treat 1s and 2s on weapon damage dice as 3s (two-handed/versatile)' };
export const INVOCATIONS = ['Agonizing Blast', 'Repelling Blast', 'Armor of Shadows', 'Devil\'s Sight', 'Eldritch Mind'];

// Full spell library (SRD 5.2.1 plus separately labelled supplemental and Flood homebrew spells).
// The spell library: the SRD data as generated (srd-spells.js) with the combat fields the table rolls with on top
// (spell-play.js: Magic Missile, Hold Person, Spirit Guardians… which the import left to the DM).
import { SPELLS as SPELL_LIBRARY } from './srd-spells.js';
import { TABLE_PLAY } from './spell-play.js';
export const SPELLS = SPELL_LIBRARY.map(s => TABLE_PLAY[s.n] ? { ...s, ...TABLE_PLAY[s.n] } : s);
export const SUBSPELLS = {
  'Life Domain':{ 3:['Bless', 'Cure Wounds', 'Aid', 'Lesser Restoration'], 5:['Mass Healing Word', 'Revivify'], 7:['Death Ward', 'Guardian of Faith'], 9:['Mass Cure Wounds', 'Raise Dead'] },
  'Fiend Patron':{ 3:['Burning Hands', 'Command', 'Scorching Ray'], 5:['Fireball'], 7:['Wall of Fire'], 9:['Flame Strike'] },
  'Draconic Sorcery':{ 3:['Chromatic Orb', 'Command'], 5:['Fear'], 7:['Banishment'], 9:['Hold Monster'] },
  'Oath of Devotion':{ 3:['Shield of Faith', 'Protection from Evil and Good'], 5:['Aid', 'Zone of Truth'], 9:['Dispel Magic'], 13:['Freedom of Movement', 'Guardian of Faith'], 17:['Commune', 'Flame Strike'] },
  'Circle of the Land':{ 3:['Hold Person', 'Moonbeam'], 5:['Fireball'], 7:['Ice Storm'], 9:['Cone of Cold'] },
  'College of Lore':{ 20:['Power Word Heal', 'Power Word Kill'] }, 'Hunter':{}, 'Evoker':{},
};

// Full SRD class and subclass descriptions; shared names include labelled class variants.
export { FEATURES } from './srd-features.js';
