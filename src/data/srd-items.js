/* This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of
   the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the
   Creative Commons Attribution 4.0 International License, available at
   https://creativecommons.org/licenses/by/4.0/legalcode.
   Changes: structured equipment, prices in GP, weights in pounds; conservative bonus fields and variant tables.
   Generated from downfallx/dnd-5e-srd-markdown, commit 1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4.
   Source SHA-256: equipment.md: eef7cb0529d933ce10983fb2c16f51ce8b7ea8044bd0b5961fba5f472b6e9970, magic-items.md: 96c71ad35dddf0e79e47ac3d7bbe96704b5209c1f6e1bf01d543080789e18e98
   Markdown/HTML descriptions are data, not trusted markup. */
export const SRD_WEAPONS = [
  {
    "n": "Club",
    "d": "1d4",
    "ty": "bludgeoning",
    "p": "L",
    "rng": 0,
    "ms": "Slow",
    "cat": "s",
    "properties": "Light",
    "weight": 2.0,
    "cost": 0.1,
    "weightText": "2 lb.",
    "costText": "1 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dagger",
    "d": "1d4",
    "ty": "piercing",
    "p": "FLT",
    "rng": [
      20,
      60
    ],
    "ms": "Nick",
    "cat": "s",
    "properties": "Finesse, Light, Thrown (Range 20/60)",
    "weight": 1.0,
    "cost": 2.0,
    "weightText": "1 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Greatclub",
    "d": "1d8",
    "ty": "bludgeoning",
    "p": "2",
    "rng": 0,
    "ms": "Push",
    "cat": "s",
    "properties": "Two-Handed",
    "weight": 10.0,
    "cost": 0.2,
    "weightText": "10 lb.",
    "costText": "2 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Handaxe",
    "d": "1d6",
    "ty": "slashing",
    "p": "LT",
    "rng": [
      20,
      60
    ],
    "ms": "Vex",
    "cat": "s",
    "properties": "Light, Thrown (Range 20/60)",
    "weight": 2.0,
    "cost": 5.0,
    "weightText": "2 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Javelin",
    "d": "1d6",
    "ty": "piercing",
    "p": "T",
    "rng": [
      30,
      120
    ],
    "ms": "Slow",
    "cat": "s",
    "properties": "Thrown (Range 30/120)",
    "weight": 2.0,
    "cost": 0.5,
    "weightText": "2 lb.",
    "costText": "5 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Light Hammer",
    "d": "1d4",
    "ty": "bludgeoning",
    "p": "LT",
    "rng": [
      20,
      60
    ],
    "ms": "Nick",
    "cat": "s",
    "properties": "Light, Thrown (Range 20/60)",
    "weight": 2.0,
    "cost": 2.0,
    "weightText": "2 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mace",
    "d": "1d6",
    "ty": "bludgeoning",
    "p": "",
    "rng": 0,
    "ms": "Sap",
    "cat": "s",
    "properties": "—",
    "weight": 4.0,
    "cost": 5.0,
    "weightText": "4 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Quarterstaff",
    "d": "1d6",
    "ty": "bludgeoning",
    "p": "V:1d8",
    "rng": 0,
    "ms": "Topple",
    "cat": "s",
    "properties": "Versatile (1d8)",
    "weight": 4.0,
    "cost": 0.2,
    "weightText": "4 lb.",
    "costText": "2 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sickle",
    "d": "1d4",
    "ty": "slashing",
    "p": "L",
    "rng": 0,
    "ms": "Nick",
    "cat": "s",
    "properties": "Light",
    "weight": 2.0,
    "cost": 1.0,
    "weightText": "2 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Spear",
    "d": "1d6",
    "ty": "piercing",
    "p": "TV:1d8",
    "rng": [
      20,
      60
    ],
    "ms": "Sap",
    "cat": "s",
    "properties": "Thrown (Range 20/60), Versatile (1d8)",
    "weight": 3.0,
    "cost": 1.0,
    "weightText": "3 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dart",
    "d": "1d4",
    "ty": "piercing",
    "p": "FT",
    "rng": [
      20,
      60
    ],
    "ms": "Vex",
    "cat": "sr",
    "properties": "Finesse, Thrown (Range 20/60)",
    "weight": 0.25,
    "cost": 0.05,
    "weightText": "1/4 lb.",
    "costText": "5 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Light Crossbow",
    "d": "1d8",
    "ty": "piercing",
    "p": "2A",
    "rng": [
      80,
      320
    ],
    "ms": "Slow",
    "cat": "sr",
    "properties": "Ammunition (Range 80/320; Bolt), Loading, Two-Handed",
    "weight": 5.0,
    "cost": 25.0,
    "weightText": "5 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Shortbow",
    "d": "1d6",
    "ty": "piercing",
    "p": "2A",
    "rng": [
      80,
      320
    ],
    "ms": "Vex",
    "cat": "sr",
    "properties": "Ammunition (Range 80/320; Arrow), Two-Handed",
    "weight": 2.0,
    "cost": 25.0,
    "weightText": "2 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sling",
    "d": "1d4",
    "ty": "bludgeoning",
    "p": "A",
    "rng": [
      30,
      120
    ],
    "ms": "Slow",
    "cat": "sr",
    "properties": "Ammunition (Range 30/120; Bullet)",
    "weight": 0,
    "cost": 0.1,
    "weightText": "—",
    "costText": "1 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Battleaxe",
    "d": "1d8",
    "ty": "slashing",
    "p": "V:1d10",
    "rng": 0,
    "ms": "Topple",
    "cat": "m",
    "properties": "Versatile (1d10)",
    "weight": 4.0,
    "cost": 10.0,
    "weightText": "4 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Flail",
    "d": "1d8",
    "ty": "bludgeoning",
    "p": "",
    "rng": 0,
    "ms": "Sap",
    "cat": "m",
    "properties": "—",
    "weight": 2.0,
    "cost": 10.0,
    "weightText": "2 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Glaive",
    "d": "1d10",
    "ty": "slashing",
    "p": "H2R",
    "rng": 0,
    "ms": "Graze",
    "cat": "m",
    "properties": "Heavy, Reach, Two-Handed",
    "weight": 6.0,
    "cost": 20.0,
    "weightText": "6 lb.",
    "costText": "20 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Greataxe",
    "d": "1d12",
    "ty": "slashing",
    "p": "H2",
    "rng": 0,
    "ms": "Cleave",
    "cat": "m",
    "properties": "Heavy, Two-Handed",
    "weight": 7.0,
    "cost": 30.0,
    "weightText": "7 lb.",
    "costText": "30 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Greatsword",
    "d": "2d6",
    "ty": "slashing",
    "p": "H2",
    "rng": 0,
    "ms": "Graze",
    "cat": "m",
    "properties": "Heavy, Two-Handed",
    "weight": 6.0,
    "cost": 50.0,
    "weightText": "6 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Halberd",
    "d": "1d10",
    "ty": "slashing",
    "p": "H2R",
    "rng": 0,
    "ms": "Cleave",
    "cat": "m",
    "properties": "Heavy, Reach, Two-Handed",
    "weight": 6.0,
    "cost": 20.0,
    "weightText": "6 lb.",
    "costText": "20 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Lance",
    "d": "1d10",
    "ty": "piercing",
    "p": "H2R",
    "rng": 0,
    "ms": "Topple",
    "cat": "m",
    "properties": "Heavy, Reach, Two-Handed (unless mounted)",
    "weight": 6.0,
    "cost": 10.0,
    "weightText": "6 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Longsword",
    "d": "1d8",
    "ty": "slashing",
    "p": "V:1d10",
    "rng": 0,
    "ms": "Sap",
    "cat": "m",
    "properties": "Versatile (1d10)",
    "weight": 3.0,
    "cost": 15.0,
    "weightText": "3 lb.",
    "costText": "15 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Maul",
    "d": "2d6",
    "ty": "bludgeoning",
    "p": "H2",
    "rng": 0,
    "ms": "Topple",
    "cat": "m",
    "properties": "Heavy, Two-Handed",
    "weight": 10.0,
    "cost": 10.0,
    "weightText": "10 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Morningstar",
    "d": "1d8",
    "ty": "piercing",
    "p": "",
    "rng": 0,
    "ms": "Sap",
    "cat": "m",
    "properties": "—",
    "weight": 4.0,
    "cost": 15.0,
    "weightText": "4 lb.",
    "costText": "15 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Pike",
    "d": "1d10",
    "ty": "piercing",
    "p": "H2R",
    "rng": 0,
    "ms": "Push",
    "cat": "m",
    "properties": "Heavy, Reach, Two-Handed",
    "weight": 18.0,
    "cost": 5.0,
    "weightText": "18 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rapier",
    "d": "1d8",
    "ty": "piercing",
    "p": "F",
    "rng": 0,
    "ms": "Vex",
    "cat": "m",
    "properties": "Finesse",
    "weight": 2.0,
    "cost": 25.0,
    "weightText": "2 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Scimitar",
    "d": "1d6",
    "ty": "slashing",
    "p": "FL",
    "rng": 0,
    "ms": "Nick",
    "cat": "m",
    "properties": "Finesse, Light",
    "weight": 3.0,
    "cost": 25.0,
    "weightText": "3 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Shortsword",
    "d": "1d6",
    "ty": "piercing",
    "p": "FL",
    "rng": 0,
    "ms": "Vex",
    "cat": "m",
    "properties": "Finesse, Light",
    "weight": 2.0,
    "cost": 10.0,
    "weightText": "2 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Trident",
    "d": "1d8",
    "ty": "piercing",
    "p": "TV:1d10",
    "rng": [
      20,
      60
    ],
    "ms": "Topple",
    "cat": "m",
    "properties": "Thrown (Range 20/60), Versatile (1d10)",
    "weight": 4.0,
    "cost": 5.0,
    "weightText": "4 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Warhammer",
    "d": "1d8",
    "ty": "bludgeoning",
    "p": "V:1d10",
    "rng": 0,
    "ms": "Push",
    "cat": "m",
    "properties": "Versatile (1d10)",
    "weight": 5.0,
    "cost": 15.0,
    "weightText": "5 lb.",
    "costText": "15 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "War Pick",
    "d": "1d8",
    "ty": "piercing",
    "p": "V:1d10",
    "rng": 0,
    "ms": "Sap",
    "cat": "m",
    "properties": "Versatile (1d10)",
    "weight": 2.0,
    "cost": 5.0,
    "weightText": "2 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Whip",
    "d": "1d4",
    "ty": "slashing",
    "p": "FR",
    "rng": 0,
    "ms": "Slow",
    "cat": "m",
    "properties": "Finesse, Reach",
    "weight": 3.0,
    "cost": 2.0,
    "weightText": "3 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Blowgun",
    "d": "1",
    "ty": "piercing",
    "p": "A",
    "rng": [
      25,
      100
    ],
    "ms": "Vex",
    "cat": "mr",
    "properties": "Ammunition (Range 25/100; Needle), Loading",
    "weight": 1.0,
    "cost": 10.0,
    "weightText": "1 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Hand Crossbow",
    "d": "1d6",
    "ty": "piercing",
    "p": "LA",
    "rng": [
      30,
      120
    ],
    "ms": "Vex",
    "cat": "mr",
    "properties": "Ammunition (Range 30/120; Bolt), Light, Loading",
    "weight": 3.0,
    "cost": 75.0,
    "weightText": "3 lb.",
    "costText": "75 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Heavy Crossbow",
    "d": "1d10",
    "ty": "piercing",
    "p": "H2A",
    "rng": [
      100,
      400
    ],
    "ms": "Push",
    "cat": "mr",
    "properties": "Ammunition (Range 100/400; Bolt), Heavy, Loading, Two-Handed",
    "weight": 18.0,
    "cost": 50.0,
    "weightText": "18 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Longbow",
    "d": "1d8",
    "ty": "piercing",
    "p": "H2A",
    "rng": [
      150,
      600
    ],
    "ms": "Slow",
    "cat": "mr",
    "properties": "Ammunition (Range 150/600; Arrow), Heavy, Two-Handed",
    "weight": 2.0,
    "cost": 50.0,
    "weightText": "2 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Musket",
    "d": "1d12",
    "ty": "piercing",
    "p": "2A",
    "rng": [
      40,
      120
    ],
    "ms": "Slow",
    "cat": "mr",
    "properties": "Ammunition (Range 40/120; Bullet), Loading, Two-Handed",
    "weight": 10.0,
    "cost": 500.0,
    "weightText": "10 lb.",
    "costText": "500 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Pistol",
    "d": "1d10",
    "ty": "piercing",
    "p": "A",
    "rng": [
      30,
      90
    ],
    "ms": "Vex",
    "cat": "mr",
    "properties": "Ammunition (Range 30/90; Bullet), Loading",
    "weight": 3.0,
    "cost": 250.0,
    "weightText": "3 lb.",
    "costText": "250 GP",
    "src": "SRD 5.2.1"
  }
];
export const ARMOR_ITEMS = [
  {
    "n": "Padded Armor",
    "ac": 11,
    "dex": 99,
    "t": "light",
    "acText": "11 + Dex modifier",
    "strength": 0,
    "stealth": true,
    "weight": 8.0,
    "cost": 5.0,
    "weightText": "8 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Leather Armor",
    "ac": 11,
    "dex": 99,
    "t": "light",
    "acText": "11 + Dex modifier",
    "strength": 0,
    "stealth": false,
    "weight": 10.0,
    "cost": 10.0,
    "weightText": "10 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Studded Leather Armor",
    "ac": 12,
    "dex": 99,
    "t": "light",
    "acText": "12 + Dex modifier",
    "strength": 0,
    "stealth": false,
    "weight": 13.0,
    "cost": 45.0,
    "weightText": "13 lb.",
    "costText": "45 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Hide Armor",
    "ac": 12,
    "dex": 2,
    "t": "medium",
    "acText": "12 + Dex modifier (max 2)",
    "strength": 0,
    "stealth": false,
    "weight": 12.0,
    "cost": 10.0,
    "weightText": "12 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Chain Shirt",
    "ac": 13,
    "dex": 2,
    "t": "medium",
    "acText": "13 + Dex modifier (max 2)",
    "strength": 0,
    "stealth": false,
    "weight": 20.0,
    "cost": 50.0,
    "weightText": "20 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Scale Mail",
    "ac": 14,
    "dex": 2,
    "t": "medium",
    "acText": "14 + Dex modifier (max 2)",
    "strength": 0,
    "stealth": true,
    "weight": 45.0,
    "cost": 50.0,
    "weightText": "45 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Breastplate",
    "ac": 14,
    "dex": 2,
    "t": "medium",
    "acText": "14 + Dex modifier (max 2)",
    "strength": 0,
    "stealth": false,
    "weight": 20.0,
    "cost": 400.0,
    "weightText": "20 lb.",
    "costText": "400 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Half Plate Armor",
    "ac": 15,
    "dex": 2,
    "t": "medium",
    "acText": "15 + Dex modifier (max 2)",
    "strength": 0,
    "stealth": true,
    "weight": 40.0,
    "cost": 750.0,
    "weightText": "40 lb.",
    "costText": "750 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring Mail",
    "ac": 14,
    "dex": 0,
    "t": "heavy",
    "acText": "14",
    "strength": 0,
    "stealth": true,
    "weight": 40.0,
    "cost": 30.0,
    "weightText": "40 lb.",
    "costText": "30 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Chain Mail",
    "ac": 16,
    "dex": 0,
    "t": "heavy",
    "acText": "16",
    "strength": 13,
    "stealth": true,
    "weight": 55.0,
    "cost": 75.0,
    "weightText": "55 lb.",
    "costText": "75 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Splint Armor",
    "ac": 17,
    "dex": 0,
    "t": "heavy",
    "acText": "17",
    "strength": 15,
    "stealth": true,
    "weight": 60.0,
    "cost": 200.0,
    "weightText": "60 lb.",
    "costText": "200 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Plate Armor",
    "ac": 18,
    "dex": 0,
    "t": "heavy",
    "acText": "18",
    "strength": 15,
    "stealth": true,
    "weight": 65.0,
    "cost": 1500.0,
    "weightText": "65 lb.",
    "costText": "1,500 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Shield",
    "ac": 2,
    "dex": 0,
    "t": "shield",
    "acText": "+2",
    "strength": 0,
    "stealth": false,
    "weight": 6.0,
    "cost": 10.0,
    "weightText": "6 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  }
];
export const TOOLS = [
  {
    "n": "Alchemist's Supplies",
    "text": "**Ability:** Intelligence **Weight:** 8 lb.\n**Utilize:** Identify a substance (DC 15), or start a fire (DC 15)\n**Craft:** Acid, Alchemist's Fire, Component Pouch, Oil, Paper, Perfume",
    "ability": "Intelligence",
    "weight": 8.0,
    "cost": 50.0,
    "weightText": "8 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Brewer's Supplies",
    "text": "**Ability:** Intelligence **Weight:** 9 lb.\n**Utilize:** Detect poisoned drink (DC 15), or identify alcohol (DC 10)\n**Craft:** Antitoxin",
    "ability": "Intelligence",
    "weight": 9.0,
    "cost": 20.0,
    "weightText": "9 lb.",
    "costText": "20 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Calligrapher's Supplies",
    "text": "**Ability:** Dexterity **Weight:** 5 lb.\n**Utilize:** Write text with impressive flourishes that guard against forgery (DC 15)\n**Craft:** Ink, _Spell Scroll_",
    "ability": "Dexterity",
    "weight": 5.0,
    "cost": 10.0,
    "weightText": "5 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Carpenter's Tools",
    "text": "**Ability:** Strength **Weight:** 6 lb.\n**Utilize:** Seal or pry open a door or container (DC 20)\n**Craft:** Club, Greatclub, Quarterstaff, Barrel, Chest, Ladder, Pole, Portable Ram, Torch",
    "ability": "Strength",
    "weight": 6.0,
    "cost": 8.0,
    "weightText": "6 lb.",
    "costText": "8 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cartographer's Tools",
    "text": "**Ability:** Wisdom **Weight:** 6 lb.\n**Utilize:** Draft a map of a small area (DC 15)\n**Craft:** Map",
    "ability": "Wisdom",
    "weight": 6.0,
    "cost": 15.0,
    "weightText": "6 lb.",
    "costText": "15 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cobbler's Tools",
    "text": "**Ability:** Dexterity **Weight:** 5 lb.\n**Utilize:** Modify footwear to give Advantage on the wearer's next Dexterity (Acrobatics) check (DC 10)\n**Craft:** Climber's Kit",
    "ability": "Dexterity",
    "weight": 5.0,
    "cost": 5.0,
    "weightText": "5 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cook's Utensils",
    "text": "**Ability:** Wisdom **Weight:** 8 lb.\n**Utilize:** Improve food's flavor (DC 10), or detect spoiled or poisoned food (DC 15)\n**Craft:** Rations",
    "ability": "Wisdom",
    "weight": 8.0,
    "cost": 1.0,
    "weightText": "8 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Glassblower's Tools",
    "text": "**Ability:** Intelligence **Weight:** 5 lb.\n**Utilize:** Discern what a glass object held in the past 24 hours (DC 15)\n**Craft:** Glass Bottle, Magnifying Glass, Spyglass, Vial",
    "ability": "Intelligence",
    "weight": 5.0,
    "cost": 30.0,
    "weightText": "5 lb.",
    "costText": "30 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Jeweler's Tools",
    "text": "**Ability:** Intelligence **Weight:** 2 lb.\n**Utilize:** Discern a gem's value (DC 15)\n**Craft:** Arcane Focus, Holy Symbol",
    "ability": "Intelligence",
    "weight": 2.0,
    "cost": 25.0,
    "weightText": "2 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Leatherworker's Tools",
    "text": "**Ability:** Dexterity **Weight:** 5 lb.\n**Utilize:** Add a design to a leather item (DC 10)\n**Craft:** Sling, Whip, Hide Armor, Leather Armor, Studded Leather Armor, Backpack, Crossbow Bolt Case, Map or Scroll Case, Parchment, Pouch, Quiver, Waterskin",
    "ability": "Dexterity",
    "weight": 5.0,
    "cost": 5.0,
    "weightText": "5 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mason's Tools",
    "text": "**Ability:** Strength **Weight:** 8 lb.\n**Utilize:** Chisel a symbol or hole in stone (DC 10)\n**Craft:** Block and Tackle",
    "ability": "Strength",
    "weight": 8.0,
    "cost": 10.0,
    "weightText": "8 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Painter's Supplies",
    "text": "**Ability:** Wisdom **Weight:** 5 lb.\n**Utilize:** Paint a recognizable image of something you've seen (DC 10)\n**Craft:** Druidic Focus, Holy Symbol",
    "ability": "Wisdom",
    "weight": 5.0,
    "cost": 10.0,
    "weightText": "5 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potter's Tools",
    "text": "**Ability:** Intelligence **Weight:** 3 lb.\n**Utilize:** Discern what a ceramic object held in the past 24 hours (DC 15)\n**Craft:** Jug, Lamp",
    "ability": "Intelligence",
    "weight": 3.0,
    "cost": 10.0,
    "weightText": "3 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Smith's Tools",
    "text": "**Ability:** Strength **Weight:** 8 lb.\n**Utilize:** Pry open a door or container (DC 20)\n**Craft:** Any Melee weapon (except Club, Greatclub, Quarterstaff, and Whip), Medium armor (except Hide), Heavy armor, Ball Bearings, Bucket, Caltrops, Chain, Crowbar, Firearm Bullets, Grappling Hook, Iron Pot, Iron Spikes, Sling Bullets",
    "ability": "Strength",
    "weight": 8.0,
    "cost": 20.0,
    "weightText": "8 lb.",
    "costText": "20 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Tinker's Tools",
    "text": "**Ability:** Dexterity **Weight:** 10 lb.\n**Utilize:** Assemble a Tiny item composed of scrap, which falls apart in 1 minute (DC 20)\n**Craft:** Musket, Pistol, Bell, Bullseye Lantern, Flask, Hooded Lantern, Hunting Trap, Lock, Manacles, Mirror, Shovel, Signal Whistle, Tinderbox",
    "ability": "Dexterity",
    "weight": 10.0,
    "cost": 50.0,
    "weightText": "10 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Weaver's Tools",
    "text": "**Ability:** Dexterity **Weight:** 5 lb.\n**Utilize:** Mend a tear in clothing (DC 10), or sew a Tiny design (DC 10)\n**Craft:** Padded Armor, Basket, Bedroll, Blanket, Fine Clothes, Net, Robe, Rope, Sack, String, Tent, Traveler's Clothes",
    "ability": "Dexterity",
    "weight": 5.0,
    "cost": 1.0,
    "weightText": "5 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Woodcarver's Tools",
    "text": "**Ability:** Dexterity **Weight:** 5 lb.\n**Utilize:** Carve a pattern in wood (DC 10)\n**Craft:** Club, Greatclub, Quarterstaff, Ranged weapons (except Pistol, Musket, and Sling), Arcane Focus, Arrows, Bolts, Druidic Focus, Ink Pen, Needles",
    "ability": "Dexterity",
    "weight": 5.0,
    "cost": 1.0,
    "weightText": "5 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Disguise Kit",
    "text": "**Ability:** Charisma **Weight:** 3 lb.\n**Utilize:** Apply makeup (DC 10)\n**Craft:** Costume",
    "ability": "Charisma",
    "weight": 3.0,
    "cost": 25.0,
    "weightText": "3 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Forgery Kit",
    "text": "**Ability:** Dexterity **Weight:** 5 lb.\n**Utilize:** Mimic 10 or fewer words of someone else's handwriting (DC 15), or duplicate a wax seal (DC 20)",
    "ability": "Dexterity",
    "weight": 5.0,
    "cost": 15.0,
    "weightText": "5 lb.",
    "costText": "15 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Gaming Set",
    "text": "**Ability:** Wisdom **Weight:** —\n**Utilize:** Discern whether someone is cheating (DC 10), or win the game (DC 20)\n**Variants:** Dice (1 SP), dragonchess (1 GP), playing cards (5 SP), three-dragon ante (1 GP)",
    "ability": "Wisdom",
    "weight": 0,
    "cost": null,
    "weightText": "—",
    "costText": "Varies",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Dice",
        "weight": 0,
        "cost": 0.1,
        "weightText": "—",
        "costText": "1 SP"
      },
      {
        "n": "Dragonchess",
        "weight": 0,
        "cost": 1.0,
        "weightText": "—",
        "costText": "1 GP"
      },
      {
        "n": "Playing cards",
        "weight": 0,
        "cost": 0.5,
        "weightText": "—",
        "costText": "5 SP"
      },
      {
        "n": "Three-dragon ante",
        "weight": 0,
        "cost": 1.0,
        "weightText": "—",
        "costText": "1 GP"
      }
    ]
  },
  {
    "n": "Herbalism Kit",
    "text": "**Ability:** Intelligence **Weight:** 3 lb.\n**Utilize:** Identify a plant (DC 10)\n**Craft:** Antitoxin, Candle, Healer's Kit, _Potion of Healing_",
    "ability": "Intelligence",
    "weight": 3.0,
    "cost": 5.0,
    "weightText": "3 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Musical Instrument",
    "text": "**Ability:** Charisma **Weight:** Varies\n**Utilize:** Play a known tune (DC 10), or improvise a song (DC 15)\n**Variants:** Bagpipes (30 GP, 6 lb.), drum (6 GP, 3 lb.), dulcimer (25 GP, 10 lb.), flute (2 GP, 1 lb.), horn (3 GP, 2 lb.), lute (35 GP, 2 lb.), lyre (30 GP, 2 lb.), pan flute (12 GP, 2 lb.), shawm (2 GP, 1 lb.), viol (30 GP, 1 lb.)",
    "ability": "Charisma",
    "weight": null,
    "cost": null,
    "weightText": "Varies",
    "costText": "Varies",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Bagpipes",
        "weight": 6.0,
        "cost": 30.0,
        "weightText": "6 lb.",
        "costText": "30 GP"
      },
      {
        "n": "Drum",
        "weight": 3.0,
        "cost": 6.0,
        "weightText": "3 lb.",
        "costText": "6 GP"
      },
      {
        "n": "Dulcimer",
        "weight": 10.0,
        "cost": 25.0,
        "weightText": "10 lb.",
        "costText": "25 GP"
      },
      {
        "n": "Flute",
        "weight": 1.0,
        "cost": 2.0,
        "weightText": "1 lb.",
        "costText": "2 GP"
      },
      {
        "n": "Horn",
        "weight": 2.0,
        "cost": 3.0,
        "weightText": "2 lb.",
        "costText": "3 GP"
      },
      {
        "n": "Lute",
        "weight": 2.0,
        "cost": 35.0,
        "weightText": "2 lb.",
        "costText": "35 GP"
      },
      {
        "n": "Lyre",
        "weight": 2.0,
        "cost": 30.0,
        "weightText": "2 lb.",
        "costText": "30 GP"
      },
      {
        "n": "Pan flute",
        "weight": 2.0,
        "cost": 12.0,
        "weightText": "2 lb.",
        "costText": "12 GP"
      },
      {
        "n": "Shawm",
        "weight": 1.0,
        "cost": 2.0,
        "weightText": "1 lb.",
        "costText": "2 GP"
      },
      {
        "n": "Viol",
        "weight": 1.0,
        "cost": 30.0,
        "weightText": "1 lb.",
        "costText": "30 GP"
      }
    ]
  },
  {
    "n": "Navigator's Tools",
    "text": "**Ability:** Wisdom **Weight:** 2 lb.\n**Utilize:** Plot a course (DC 10), or determine position by stargazing (DC 15)",
    "ability": "Wisdom",
    "weight": 2.0,
    "cost": 25.0,
    "weightText": "2 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Poisoner's Kit",
    "text": "**Ability:** Intelligence **Weight:** 2 lb.\n**Utilize:** Detect a poisoned object (DC 10)\n**Craft:** Basic Poison",
    "ability": "Intelligence",
    "weight": 2.0,
    "cost": 50.0,
    "weightText": "2 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Thieves' Tools",
    "text": "**Ability:** Dexterity **Weight:** 1 lb.\n**Utilize:** Pick a lock (DC 15), or disarm a trap (DC 15)",
    "ability": "Dexterity",
    "weight": 1.0,
    "cost": 25.0,
    "weightText": "1 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  }
];
export const GEAR = [
  {
    "n": "Acid",
    "type": "Adventuring Gear",
    "text": "When you take the Attack action, you can replace one of your attacks with throwing a vial of Acid. Target one creature or object you can see within 20 feet of yourself. The target must succeed on a Dexterity saving throw (DC 8 plus your Dexterity modifier and Proficiency Bonus) or take 2d6 Acid damage.",
    "weight": 1.0,
    "cost": 25.0,
    "weightText": "1 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Alchemist's Fire",
    "type": "Adventuring Gear",
    "text": "When you take the Attack action, you can replace one of your attacks with throwing a flask of Alchemist's Fire. Target one creature or object you can see within 20 feet of yourself. The target must succeed on a Dexterity saving throw (DC 8 plus your Dexterity modifier and Proficiency Bonus) or take 1d4 Fire damage and start burning (see \"Rules Glossary\").",
    "weight": 1.0,
    "cost": 50.0,
    "weightText": "1 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ammunition",
    "type": "Adventuring Gear",
    "text": "Ammunition is required by a weapon that has the Ammunition property. A weapon's description specifies the type of ammunition used by the weapon. The Ammunition table lists the different types and the amount you get when you buy them. The table also lists the item that is typically used to store each type; storage must be bought separately.\n\n\n\n**Ammunition**\n\n<table>\n  <thead>\n    <tr>\n      <th>Type</th>\n      <th>Amount</th>\n      <th>Storage</th>\n      <th>Weight</th>\n      <th>Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Arrows</td>\n      <td>20</td>\n      <td>Quiver</td>\n      <td>1 lb.</td>\n      <td>1 GP</td>\n    </tr>\n    <tr>\n      <td>Bolts</td>\n      <td>20</td>\n      <td>Case</td>\n      <td>1½ lb.</td>\n      <td>1 GP</td>\n    </tr>\n    <tr>\n      <td>Bullets, Firearm</td>\n      <td>10</td>\n      <td>Pouch</td>\n      <td>2 lb.</td>\n      <td>3 GP</td>\n    </tr>\n    <tr>\n      <td>Bullets, Sling</td>\n      <td>20</td>\n      <td>Pouch</td>\n      <td>1½ lb.</td>\n      <td>4 CP</td>\n    </tr>\n    <tr>\n      <td>Needles</td>\n      <td>50</td>\n      <td>Pouch</td>\n      <td>1 lb.</td>\n      <td>1 GP</td>\n    </tr>\n  </tbody>\n</table>",
    "weight": null,
    "cost": null,
    "weightText": "Varies",
    "costText": "Varies",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Arrows",
        "weight": 1.0,
        "cost": 1.0,
        "weightText": "1 lb.",
        "costText": "1 GP",
        "amount": 20,
        "storage": "Quiver"
      },
      {
        "n": "Bolts",
        "weight": 1.5,
        "cost": 1.0,
        "weightText": "1½ lb.",
        "costText": "1 GP",
        "amount": 20,
        "storage": "Case"
      },
      {
        "n": "Bullets, Firearm",
        "weight": 2.0,
        "cost": 3.0,
        "weightText": "2 lb.",
        "costText": "3 GP",
        "amount": 10,
        "storage": "Pouch"
      },
      {
        "n": "Bullets, Sling",
        "weight": 1.5,
        "cost": 0.04,
        "weightText": "1½ lb.",
        "costText": "4 CP",
        "amount": 20,
        "storage": "Pouch"
      },
      {
        "n": "Needles",
        "weight": 1.0,
        "cost": 1.0,
        "weightText": "1 lb.",
        "costText": "1 GP",
        "amount": 50,
        "storage": "Pouch"
      }
    ]
  },
  {
    "n": "Antitoxin",
    "type": "Adventuring Gear",
    "text": "As a Bonus Action, you can drink a vial of Antitoxin to gain Advantage on saving throws to avoid or end the Poisoned condition for 1 hour.",
    "weight": 0,
    "cost": 50.0,
    "weightText": "—",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Arcane Focus",
    "type": "Adventuring Gear",
    "text": "An Arcane Focus takes one of the forms in the Arcane Focuses table and is bejeweled or carved to channel arcane magic. A Sorcerer, Warlock, or Wizard can use such an item as a Spellcasting Focus.\n\n**Arcane Focuses**\n\n<table>\n  <thead>\n    <tr>\n      <th>Focus</th>\n      <th>Weight</th>\n      <th>Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Crystal</td>\n      <td>1 lb.</td>\n      <td>10 GP</td>\n    </tr>\n    <tr>\n      <td>Orb</td>\n      <td>3 lb.</td>\n      <td>20 GP</td>\n    </tr>\n    <tr>\n      <td>Rod</td>\n      <td>2 lb.</td>\n      <td>10 GP</td>\n    </tr>\n    <tr>\n      <td>Staff (also a Quarterstaff)</td>\n      <td>4 lb.</td>\n      <td>5 GP</td>\n    </tr>\n    <tr>\n      <td>Wand</td>\n      <td>1 lb.</td>\n      <td>10 GP</td>\n    </tr>\n  </tbody>\n</table>",
    "weight": null,
    "cost": null,
    "weightText": "Varies",
    "costText": "Varies",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Crystal",
        "weight": 1.0,
        "cost": 10.0,
        "weightText": "1 lb.",
        "costText": "10 GP"
      },
      {
        "n": "Orb",
        "weight": 3.0,
        "cost": 20.0,
        "weightText": "3 lb.",
        "costText": "20 GP"
      },
      {
        "n": "Rod",
        "weight": 2.0,
        "cost": 10.0,
        "weightText": "2 lb.",
        "costText": "10 GP"
      },
      {
        "n": "Staff (also a Quarterstaff)",
        "weight": 4.0,
        "cost": 5.0,
        "weightText": "4 lb.",
        "costText": "5 GP"
      },
      {
        "n": "Wand",
        "weight": 1.0,
        "cost": 10.0,
        "weightText": "1 lb.",
        "costText": "10 GP"
      }
    ]
  },
  {
    "n": "Backpack",
    "type": "Adventuring Gear",
    "text": "A Backpack holds up to 30 pounds within 1 cubic foot. It can also serve as a saddlebag.",
    "weight": 5.0,
    "cost": 2.0,
    "weightText": "5 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ball Bearings",
    "type": "Adventuring Gear",
    "text": "As a Utilize action, you can spill Ball Bearings from their pouch. They spread to cover a level, 10-foot-square area within 10 feet of yourself. A creature that enters this area for the first time on a turn must succeed on a DC 10 Dexterity saving throw or have the Prone condition. It takes 10 minutes to recover the Ball Bearings.",
    "weight": 2.0,
    "cost": 1.0,
    "weightText": "2 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Barrel",
    "type": "Adventuring Gear",
    "text": "A Barrel holds up to 40 gallons of liquid or up to 4 cubic feet of dry goods.",
    "weight": 70.0,
    "cost": 2.0,
    "weightText": "70 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Basket",
    "type": "Adventuring Gear",
    "text": "A Basket holds up to 40 pounds within 2 cubic feet.",
    "weight": 2.0,
    "cost": 0.4,
    "weightText": "2 lb.",
    "costText": "4 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bedroll",
    "type": "Adventuring Gear",
    "text": "A Bedroll sleeps one Small or Medium creature. While in a Bedroll, you automatically succeed on saving throws against extreme cold (see \"Gameplay Toolbox\").",
    "weight": 7.0,
    "cost": 1.0,
    "weightText": "7 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bell",
    "type": "Adventuring Gear",
    "text": "When rung as a Utilize action, a Bell produces a sound that can be heard up to 60 feet away.",
    "weight": 0,
    "cost": 1.0,
    "weightText": "—",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Blanket",
    "type": "Adventuring Gear",
    "text": "While wrapped in a blanket, you have Advantage on saving throws against extreme cold (see \"Gameplay Toolbox\").",
    "weight": 3.0,
    "cost": 0.5,
    "weightText": "3 lb.",
    "costText": "5 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Block and Tackle",
    "type": "Adventuring Gear",
    "text": "A Block and Tackle allows you to hoist up to four times the weight you can normally lift.",
    "weight": 5.0,
    "cost": 1.0,
    "weightText": "5 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Book",
    "type": "Adventuring Gear",
    "text": "A Book contains fiction or nonfiction. If you consult an accurate nonfiction Book about its topic, you gain a +5 bonus to Intelligence (Arcana, History, Nature, or Religion) checks you make about that topic.",
    "weight": 5.0,
    "cost": 25.0,
    "weightText": "5 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bottle, Glass",
    "type": "Adventuring Gear",
    "text": "A Glass Bottle holds up to 1½ pints.",
    "weight": 2.0,
    "cost": 2.0,
    "weightText": "2 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bucket",
    "type": "Adventuring Gear",
    "text": "A Bucket holds up to half a cubic foot of contents.",
    "weight": 2.0,
    "cost": 0.05,
    "weightText": "2 lb.",
    "costText": "5 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Burglar's Pack",
    "type": "Pack",
    "text": "A Burglar's Pack contains the following items: Backpack, Ball Bearings, Bell, 10 Candles, Crowbar, Hooded Lantern, 7 flasks of Oil, 5 days of Rations, Rope, Tinderbox, and Waterskin.",
    "weight": 42.0,
    "cost": 16.0,
    "weightText": "42 lb.",
    "costText": "16 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Caltrops",
    "type": "Adventuring Gear",
    "text": "As a Utilize action, you can spread Caltrops from their bag to cover a 5-foot-square area within 5 feet of yourself. A creature that enters this area for the first time on a turn must succeed on a DC 15 Dexterity saving throw or take 1 Piercing damage and have its Speed reduced to 0 until the start of its next turn. It takes 10 minutes to recover the Caltrops.",
    "weight": 2.0,
    "cost": 1.0,
    "weightText": "2 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Candle",
    "type": "Adventuring Gear",
    "text": "For 1 hour, a lit Candle sheds Bright Light in a 5-foot radius and Dim Light for an additional 5 feet.",
    "weight": 0,
    "cost": 0.01,
    "weightText": "—",
    "costText": "1 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Case, Crossbow Bolt",
    "type": "Adventuring Gear",
    "text": "A Crossbow Bolt Case holds up to 20 Bolts.",
    "weight": 1.0,
    "cost": 1.0,
    "weightText": "1 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Case, Map or Scroll",
    "type": "Adventuring Gear",
    "text": "A Map or Scroll Case holds up to 10 sheets of paper or 5 sheets of parchment.",
    "weight": 1.0,
    "cost": 1.0,
    "weightText": "1 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Chain",
    "type": "Adventuring Gear",
    "text": "As a Utilize action, you can wrap a Chain around an unwilling creature within 5 feet of yourself that has the Grappled, Incapacitated, or Restrained condition if you succeed on a DC 13 Strength (Athletics) check. If the creature's legs are bound, the creature has the Restrained condition until it escapes. Escaping the Chain requires the creature to make a successful DC 18 Dexterity (Acrobatics) check as an action. Bursting the Chain requires a successful DC 20 Strength (Athletics) check as an action.",
    "weight": 10.0,
    "cost": 5.0,
    "weightText": "10 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Chest",
    "type": "Adventuring Gear",
    "text": "A Chest holds up to 12 cubic feet of contents.",
    "weight": 25.0,
    "cost": 5.0,
    "weightText": "25 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Climber's Kit",
    "type": "Adventuring Gear",
    "text": "A Climber's Kit includes boot tips, gloves, pitons, and a harness. As a Utilize action, you can use the Climber's Kit to anchor yourself; when you do, you can't fall more than 25 feet from the anchor point, and you can't move more than 25 feet from there without undoing the anchor as a Bonus Action.",
    "weight": 12.0,
    "cost": 25.0,
    "weightText": "12 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Clothes, Fine",
    "type": "Adventuring Gear",
    "text": "Fine Clothes are made of expensive fabrics and adorned with expertly crafted details. Some events and locations admit only people wearing these clothes.",
    "weight": 6.0,
    "cost": 15.0,
    "weightText": "6 lb.",
    "costText": "15 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Clothes, Traveler's",
    "type": "Adventuring Gear",
    "text": "Traveler's Clothes are resilient garments designed for travel in various environments.",
    "weight": 4.0,
    "cost": 2.0,
    "weightText": "4 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Component Pouch",
    "type": "Adventuring Gear",
    "text": "A Component Pouch is watertight and filled with compartments that hold all the free Material components of your spells.",
    "weight": 2.0,
    "cost": 25.0,
    "weightText": "2 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Costume",
    "type": "Adventuring Gear",
    "text": "While wearing a Costume, you have Advantage on any ability check you make to impersonate the person or type of person it represents.",
    "weight": 4.0,
    "cost": 5.0,
    "weightText": "4 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Crowbar",
    "type": "Adventuring Gear",
    "text": "Using a Crowbar gives you Advantage on Strength checks where the Crowbar's leverage can be applied.",
    "weight": 5.0,
    "cost": 2.0,
    "weightText": "5 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Diplomat's Pack",
    "type": "Pack",
    "text": "A Diplomat's Pack contains the following items: Chest, Fine Clothes, Ink, 5 Ink Pens, Lamp, 2 Map or Scroll Cases, 4 flasks of Oil, 5 sheets of Paper, 5 sheets of Parchment, Perfume, and Tinderbox.",
    "weight": 39.0,
    "cost": 39.0,
    "weightText": "39 lb.",
    "costText": "39 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Druidic Focus",
    "type": "Adventuring Gear",
    "text": "A Druidic Focus takes one of the forms in the Druidic Focuses table and is carved, tied with ribbon, or painted to channel primal magic. A Druid or Ranger can use such an object as a Spellcasting Focus.\n\n**Druidic Focuses**\n\n<table>\n  <thead>\n    <tr>\n      <th>Focus</th>\n      <th>Weight</th>\n      <th>Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Sprig of mistletoe</td>\n      <td>—</td>\n      <td>1 GP</td>\n    </tr>\n    <tr>\n      <td>Wooden staff (also a Quarterstaff)</td>\n      <td>4 lb.</td>\n      <td>5 GP</td>\n    </tr>\n    <tr>\n      <td>Yew wand</td>\n      <td>1 lb.</td>\n      <td>10 GP</td>\n    </tr>\n  </tbody>\n</table>",
    "weight": null,
    "cost": null,
    "weightText": "Varies",
    "costText": "Varies",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Sprig of mistletoe",
        "weight": 0,
        "cost": 1.0,
        "weightText": "—",
        "costText": "1 GP"
      },
      {
        "n": "Wooden staff (also a Quarterstaff)",
        "weight": 4.0,
        "cost": 5.0,
        "weightText": "4 lb.",
        "costText": "5 GP"
      },
      {
        "n": "Yew wand",
        "weight": 1.0,
        "cost": 10.0,
        "weightText": "1 lb.",
        "costText": "10 GP"
      }
    ]
  },
  {
    "n": "Dungeoneer's Pack",
    "type": "Pack",
    "text": "A Dungeoneer's Pack contains the following items: Backpack, Caltrops, Crowbar, 2 flasks of Oil, 10 days of Rations, Rope, Tinderbox, 10 Torches, and Waterskin.",
    "weight": 55.0,
    "cost": 12.0,
    "weightText": "55 lb.",
    "costText": "12 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Entertainer's Pack",
    "type": "Pack",
    "text": "An Entertainer's Pack contains the following items: Backpack, Bedroll, Bell, Bullseye Lantern, 3 Costumes, Mirror, 8 flasks of Oil, 9 days of Rations, Tinderbox, and Waterskin.",
    "weight": 58.5,
    "cost": 40.0,
    "weightText": "58½ lb.",
    "costText": "40 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Explorer's Pack",
    "type": "Pack",
    "text": "An Explorer's Pack contains the following items: Backpack, Bedroll, 2 flasks of Oil, 10 days of Rations, Rope, Tinderbox, 10 Torches, and Waterskin.",
    "weight": 55.0,
    "cost": 10.0,
    "weightText": "55 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Flask",
    "type": "Adventuring Gear",
    "text": "A Flask holds up to 1 pint.",
    "weight": 1.0,
    "cost": 0.02,
    "weightText": "1 lb.",
    "costText": "2 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Grappling Hook",
    "type": "Adventuring Gear",
    "text": "As a Utilize action, you can throw the Grappling Hook at a railing, a ledge, or another catch within 50 feet of yourself, and the hook catches on if you succeed on a DC 13 Dexterity (Acrobatics) check. If you tied a Rope to the hook, you can then climb it.",
    "weight": 4.0,
    "cost": 2.0,
    "weightText": "4 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Healer's Kit",
    "type": "Adventuring Gear",
    "text": "A Healer's Kit has ten uses. As a Utilize action, you can expend one of its uses to stabilize an Unconscious creature that has 0 Hit Points without needing to make a Wisdom (Medicine) check.",
    "weight": 3.0,
    "cost": 5.0,
    "weightText": "3 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Holy Symbol",
    "type": "Adventuring Gear",
    "text": "A Holy Symbol takes one of the forms in the Holy Symbol table and is bejeweled or painted to channel divine magic. A Cleric or Paladin can use a Holy Symbol as a Spellcasting Focus.\n\nThe table indicates whether a Holy Symbol needs to be held, worn, or borne on fabric (such as a tabard or banner) or a Shield.\n\n**Holy Symbols**\n\n<table>\n  <thead>\n    <tr>\n      <th>Symbol</th>\n      <th>Weight</th>\n      <th>Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Amulet (worn or held)</td>\n      <td>1 lb.</td>\n      <td>5 GP</td>\n    </tr>\n    <tr>\n      <td>Emblem (borne on fabric or a Shield)</td>\n      <td>—</td>\n      <td>5 GP</td>\n    </tr>\n    <tr>\n      <td>Reliquary (held)</td>\n      <td>2 lb.</td>\n      <td>5 GP</td>\n    </tr>\n  </tbody>\n</table>",
    "weight": null,
    "cost": null,
    "weightText": "Varies",
    "costText": "Varies",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Amulet (worn or held)",
        "weight": 1.0,
        "cost": 5.0,
        "weightText": "1 lb.",
        "costText": "5 GP"
      },
      {
        "n": "Emblem (borne on fabric or a Shield)",
        "weight": 0,
        "cost": 5.0,
        "weightText": "—",
        "costText": "5 GP"
      },
      {
        "n": "Reliquary (held)",
        "weight": 2.0,
        "cost": 5.0,
        "weightText": "2 lb.",
        "costText": "5 GP"
      }
    ]
  },
  {
    "n": "Holy Water",
    "type": "Adventuring Gear",
    "text": "When you take the Attack action, you can replace one of your attacks with throwing a flask of Holy Water. Target one creature you can see within 20 feet of yourself. The target must succeed on a Dexterity saving throw (DC 8 plus your Dexterity modifier and Proficiency Bonus) or take 2d8 Radiant damage if it is a Fiend or an Undead.",
    "weight": 1.0,
    "cost": 25.0,
    "weightText": "1 lb.",
    "costText": "25 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Hunting Trap",
    "type": "Adventuring Gear",
    "text": "As a Utilize action, you can set a Hunting Trap, which is a sawtooth steel ring that snaps shut when a creature steps on a pressure plate in the center.\n\nThe trap is affixed by a heavy chain to an immobile object, such as a tree or a spike driven into the ground. A creature that steps on the plate must succeed on a DC 13 Dexterity saving throw or take 1d4 Piercing damage and have its Speed reduced to 0 until the start of its next turn. Thereafter, until the creature breaks free of the trap, its movement is limited by the length of the chain (typically 3 feet). A creature can use its action to make a DC 13 Strength (Athletics) check, freeing itself or another creature within its reach on a success. Each failed check deals 1 Piercing damage to the trapped creature.",
    "weight": 25.0,
    "cost": 5.0,
    "weightText": "25 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ink",
    "type": "Adventuring Gear",
    "text": "Ink comes in a 1-ounce bottle, which provides enough ink to write about 500 pages.",
    "weight": 0,
    "cost": 10.0,
    "weightText": "—",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ink Pen",
    "type": "Adventuring Gear",
    "text": "Using Ink, an Ink Pen is used to write or draw.",
    "weight": 0,
    "cost": 0.02,
    "weightText": "—",
    "costText": "2 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Jug",
    "type": "Adventuring Gear",
    "text": "A Jug holds up to 1 gallon.",
    "weight": 4.0,
    "cost": 0.02,
    "weightText": "4 lb.",
    "costText": "2 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ladder",
    "type": "Adventuring Gear",
    "text": "A Ladder is 10 feet tall. You must climb to move up or down it.",
    "weight": 25.0,
    "cost": 0.1,
    "weightText": "25 lb.",
    "costText": "1 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Lamp",
    "type": "Adventuring Gear",
    "text": "A Lamp burns Oil as fuel to cast Bright Light in a 15-foot radius and Dim Light for an additional 30 feet.",
    "weight": 1.0,
    "cost": 0.5,
    "weightText": "1 lb.",
    "costText": "5 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Lantern, Bullseye",
    "type": "Adventuring Gear",
    "text": "A Bullseye Lantern burns Oil as fuel to cast Bright Light in a 60-foot Cone and Dim Light for an additional 60 feet.",
    "weight": 2.0,
    "cost": 10.0,
    "weightText": "2 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Lantern, Hooded",
    "type": "Adventuring Gear",
    "text": "A Hooded Lantern burns Oil as fuel to cast Bright Light in a 30-foot radius and Dim Light for an additional 30 feet. As a Bonus Action, you can lower the hood, reducing the light to Dim Light in a 5-foot radius, or raise it again.",
    "weight": 2.0,
    "cost": 5.0,
    "weightText": "2 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Lock",
    "type": "Adventuring Gear",
    "text": "A Lock comes with a key. Without the key, a creature can use Thieves' Tools to pick this Lock with a successful DC 15 Dexterity (Sleight of Hand) check.",
    "weight": 1.0,
    "cost": 10.0,
    "weightText": "1 lb.",
    "costText": "10 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Magnifying Glass",
    "type": "Adventuring Gear",
    "text": "A Magnifying Glass grants Advantage on any ability check made to appraise or inspect a highly detailed item. Lighting a fire with a Magnifying Glass requires light as bright as sunlight to focus, tinder to ignite, and about 5 minutes for the fire to ignite.",
    "weight": 0,
    "cost": 100.0,
    "weightText": "—",
    "costText": "100 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Manacles",
    "type": "Adventuring Gear",
    "text": "As a Utilize action, you can use Manacles to bind an unwilling Small or Medium creature within 5 feet of yourself that has the Grappled, Incapacitated, or Restrained condition if you succeed on a DC 13 Dexterity (Sleight of Hand) check. While bound, a creature has Disadvantage on attack rolls, and the creature is Restrained if the Manacles are attached to a chain or hook that is fixed in place. Escaping the Manacles requires a successful DC 20 Dexterity (Sleight of Hand) check as an action. Bursting them requires a successful DC 25 Strength (Athletics) check as an action.\n\nEach set of Manacles comes with a key. Without the key, a creature can use Thieves' Tools to pick the Manacles' lock with a successful DC 15 Dexterity (Sleight of Hand) check.",
    "weight": 6.0,
    "cost": 2.0,
    "weightText": "6 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Map",
    "type": "Adventuring Gear",
    "text": "If you consult an accurate Map, you gain a +5 bonus to Wisdom (Survival) checks you make to find your way in the place represented on it.",
    "weight": 0,
    "cost": 1.0,
    "weightText": "—",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mirror",
    "type": "Adventuring Gear",
    "text": "A handheld steel Mirror is useful for personal cosmetics but also for peeking around corners and reflecting light as a signal.",
    "weight": 0.5,
    "cost": 5.0,
    "weightText": "1/2 lb.",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Net",
    "type": "Adventuring Gear",
    "text": "When you take the Attack action, you can replace one of your attacks with throwing a Net. Target a creature you can see within 15 feet of yourself. The target must succeed on a Dexterity saving throw (DC 8 plus your Dexterity modifier and Proficiency Bonus) or have the Restrained condition until it escapes. The target succeeds automatically if it is Huge or larger.\n\nTo escape, the target or a creature within 5 feet of it must take an action to make a DC 10 Strength (Athletics) check, freeing the Restrained creature on a success. Destroying the Net (AC 10; 5 HP; Immunity to Bludgeoning, Poison, and Psychic damage) also frees the target, ending the effect.",
    "weight": 3.0,
    "cost": 1.0,
    "weightText": "3 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Oil",
    "type": "Adventuring Gear",
    "text": "You can douse a creature, object, or space with Oil or use it as fuel, as detailed below.\n\n_Dousing a Creature or an Object._ When you take the Attack action, you can replace one of your attacks with throwing an Oil flask. Target one creature or object within 20 feet of yourself. The target must succeed on a Dexterity saving throw (DC 8 plus your Dexterity modifier and Proficiency Bonus) or be covered in oil. If the target takes Fire damage before the oil dries (after 1 minute), the target takes an extra 5 Fire damage from burning oil.\n\n_Dousing a Space._ You can take the Utilize action to pour an Oil flask on level ground to cover a 5-foot-square area within 5 feet of yourself. If lit, the oil burns until the end of the turn 2 rounds from when the oil was lit (or 12 seconds) and deals 5 Fire damage to any creature that enters the area or ends its turn there. A creature can take this damage only once per turn.\n\n_Fuel._ Oil serves as fuel for Lamps and Lanterns. Once lit, a flask of Oil burns for 6 hours in a Lamp or Lantern. That duration doesn't need to be consecutive; you can extinguish the burning Oil (as a Utilize action) and rekindle it again until it has burned for a total of 6 hours.",
    "weight": 1.0,
    "cost": 0.1,
    "weightText": "1 lb.",
    "costText": "1 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Paper",
    "type": "Adventuring Gear",
    "text": "One sheet of Paper can hold about 250 handwritten words.",
    "weight": 0,
    "cost": 0.2,
    "weightText": "—",
    "costText": "2 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Parchment",
    "type": "Adventuring Gear",
    "text": "One sheet of Parchment can hold about 250 handwritten words.",
    "weight": 0,
    "cost": 0.1,
    "weightText": "—",
    "costText": "1 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Perfume",
    "type": "Adventuring Gear",
    "text": "Perfume comes in a 4-ounce vial. For 1 hour after applying Perfume to yourself, you have Advantage on Charisma (Persuasion) checks made to influence an Indifferent Humanoid within 5 feet of yourself.",
    "weight": 0,
    "cost": 5.0,
    "weightText": "—",
    "costText": "5 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Poison, Basic",
    "type": "Adventuring Gear",
    "text": "As a Bonus Action, you can use a vial of Basic Poison to coat one weapon or up to three pieces of ammunition. A creature that takes Piercing or Slashing damage from the poisoned weapon or ammunition takes an extra 1d4 Poison damage. Once applied, the poison retains potency for 1 minute or until its damage is dealt, whichever comes first.",
    "weight": 0,
    "cost": 100.0,
    "weightText": "—",
    "costText": "100 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Pole",
    "type": "Adventuring Gear",
    "text": "A Pole is 10 feet long. You can use it to touch something up to 10 feet away. If you must make a Strength (Athletics) check as part of a High or Long Jump, you can use the Pole to vault, giving yourself Advantage on the check.",
    "weight": 7.0,
    "cost": 0.05,
    "weightText": "7 lb.",
    "costText": "5 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Pot, Iron",
    "type": "Adventuring Gear",
    "text": "An Iron Pot holds up to 1 gallon.",
    "weight": 10.0,
    "cost": 2.0,
    "weightText": "10 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Healing",
    "type": "Adventuring Gear",
    "text": "This potion is a magic item. As a Bonus Action, you can drink it or administer it to another creature within 5 feet of yourself. The creature that drinks the magical red fluid in this vial regains 2d4 + 2 Hit Points.",
    "weight": 0.5,
    "cost": 50.0,
    "weightText": "1/2 lb.",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Pouch",
    "type": "Adventuring Gear",
    "text": "A Pouch holds up to 6 pounds within one-fifth of a cubic foot.",
    "weight": 1.0,
    "cost": 0.5,
    "weightText": "1 lb.",
    "costText": "5 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Priest's Pack",
    "type": "Pack",
    "text": "A Priest's Pack contains the following items: Backpack, Blanket, Holy Water, Lamp, 7 days of Rations, Robe, and Tinderbox.",
    "weight": 29.0,
    "cost": 33.0,
    "weightText": "29 lb.",
    "costText": "33 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Quiver",
    "type": "Adventuring Gear",
    "text": "A Quiver holds up to 20 Arrows.",
    "weight": 1.0,
    "cost": 1.0,
    "weightText": "1 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ram, Portable",
    "type": "Adventuring Gear",
    "text": "You can use a Portable Ram to break down doors. When doing so, you gain a +4 bonus to the Strength check. One other character can help you use the ram, giving you Advantage on this check.",
    "weight": 35.0,
    "cost": 4.0,
    "weightText": "35 lb.",
    "costText": "4 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rations",
    "type": "Adventuring Gear",
    "text": "Rations consist of travel-ready food, including jerky, dried fruit, hardtack, and nuts. See \"Malnutrition\" in \"Rules Glossary\" for the risks of not eating.",
    "weight": 2.0,
    "cost": 0.5,
    "weightText": "2 lb.",
    "costText": "5 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Robe",
    "type": "Adventuring Gear",
    "text": "A Robe has vocational or ceremonial significance. Some events and locations admit only people wearing a Robe bearing certain colors or symbols.",
    "weight": 4.0,
    "cost": 1.0,
    "weightText": "4 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rope",
    "type": "Adventuring Gear",
    "text": "As a Utilize action, you can tie a knot with Rope if you succeed on a DC 10 Dexterity (Sleight of Hand) check. The Rope can be burst with a successful DC 20 Strength (Athletics) check.\n\nYou can bind an unwilling creature with the Rope only if the creature has the Grappled, Incapacitated, or Restrained condition. If the creature's legs are bound, the creature has the Restrained condition until it escapes. Escaping the Rope requires the creature to make a successful DC 15 Dexterity (Acrobatics) check as an action.",
    "weight": 5.0,
    "cost": 1.0,
    "weightText": "5 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sack",
    "type": "Adventuring Gear",
    "text": "A Sack holds up to 30 pounds within 1 cubic foot.",
    "weight": 0.5,
    "cost": 0.01,
    "weightText": "1/2 lb.",
    "costText": "1 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Scholar's Pack",
    "type": "Pack",
    "text": "A Scholar's Pack contains the following items: Backpack, Book, Ink, Ink Pen, Lamp, 10 flasks of Oil, 10 sheets of Parchment, and Tinderbox.",
    "weight": 22.0,
    "cost": 40.0,
    "weightText": "22 lb.",
    "costText": "40 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Shovel",
    "type": "Adventuring Gear",
    "text": "Working for 1 hour, you can use a Shovel to dig a hole that is 5 feet on each side in soil or similar material.",
    "weight": 5.0,
    "cost": 2.0,
    "weightText": "5 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Signal Whistle",
    "type": "Adventuring Gear",
    "text": "When blown as a Utilize action, a Signal Whistle produces a sound that can be heard up to 600 feet away.",
    "weight": 0,
    "cost": 0.05,
    "weightText": "—",
    "costText": "5 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Spell Scroll (Cantrip)",
    "type": "Adventuring Gear",
    "text": "A _Spell Scroll_ (Cantrip) or _Spell Scroll_ (Level 1) is a magic item that bears the words of a cantrip or level 1 spell, respectively, determined by the scroll's creator. If the spell is on your class's spell list, you can read the scroll and cast the spell using its normal casting time and without providing any Material components.\n\nIf the spell requires a saving throw or an attack roll, the spell save DC is 13, and the attack bonus is +5. The scroll disintegrates when the casting is completed.",
    "weight": 0,
    "cost": 30.0,
    "weightText": "—",
    "costText": "30 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Spell Scroll (Level 1)",
    "type": "Adventuring Gear",
    "text": "A _Spell Scroll_ (Cantrip) or _Spell Scroll_ (Level 1) is a magic item that bears the words of a cantrip or level 1 spell, respectively, determined by the scroll's creator. If the spell is on your class's spell list, you can read the scroll and cast the spell using its normal casting time and without providing any Material components.\n\nIf the spell requires a saving throw or an attack roll, the spell save DC is 13, and the attack bonus is +5. The scroll disintegrates when the casting is completed.",
    "weight": 0,
    "cost": 50.0,
    "weightText": "—",
    "costText": "50 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Spikes, Iron",
    "type": "Adventuring Gear",
    "text": "Iron Spikes come in bundles of ten. As a Utilize action, you can use a blunt object, such as a Light Hammer, to hammer a spike into wood, earth, or a similar material. You can do so to jam a door shut or to then tie a Rope or Chain to the Spike.",
    "weight": 5.0,
    "cost": 1.0,
    "weightText": "5 lb.",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Spyglass",
    "type": "Adventuring Gear",
    "text": "Objects viewed through a Spyglass are magnified to twice their size.",
    "weight": 1.0,
    "cost": 1000.0,
    "weightText": "1 lb.",
    "costText": "1,000 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "String",
    "type": "Adventuring Gear",
    "text": "String is 10 feet long. You can tie a knot in it as a Utilize action.",
    "weight": 0,
    "cost": 0.1,
    "weightText": "—",
    "costText": "1 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Tent",
    "type": "Adventuring Gear",
    "text": "A Tent sleeps up to two Small or Medium creatures.",
    "weight": 20.0,
    "cost": 2.0,
    "weightText": "20 lb.",
    "costText": "2 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Tinderbox",
    "type": "Adventuring Gear",
    "text": "A Tinderbox is a small container holding flint, fire steel, and tinder (usually dry cloth soaked in light oil) used to kindle a fire. Using it to light a Candle, Lamp, Lantern, or Torch—or anything else with exposed fuel—takes a Bonus Action. Lighting any other fire takes 1 minute.",
    "weight": 1.0,
    "cost": 0.5,
    "weightText": "1 lb.",
    "costText": "5 SP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Torch",
    "type": "Adventuring Gear",
    "text": "A Torch burns for 1 hour, casting Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. When you take the Attack action, you can attack with the Torch, using it as a Simple Melee weapon. On a hit, the target takes 1 Fire damage.",
    "weight": 1.0,
    "cost": 0.01,
    "weightText": "1 lb.",
    "costText": "1 CP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Vial",
    "type": "Adventuring Gear",
    "text": "A Vial holds up to 4 ounces.",
    "weight": 0,
    "cost": 1.0,
    "weightText": "—",
    "costText": "1 GP",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Waterskin",
    "type": "Adventuring Gear",
    "text": "A Waterskin holds up to 4 pints. If you don't drink sufficient water, you risk dehydration (see \"Rules Glossary\").",
    "weight": 5.0,
    "cost": 0.2,
    "weightText": "5 lb. (full)",
    "costText": "2 SP",
    "src": "SRD 5.2.1"
  }
];
export const MAGIC_ITEMS = [
  {
    "n": "Adamantine Armor",
    "type": "Armor (Any Medium or Heavy, Except Hide Armor)",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This suit of armor is reinforced with adamantine, one of the hardest substances in existence. While you're wearing it, any Critical Hit against you becomes a normal hit.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ammunition, +1, +2, or +3",
    "type": "Weapon (Any Ammunition)",
    "rarity": "Uncommon (+1), Rare (+2), or Very Rare (+3)",
    "attune": "",
    "text": "You have a bonus to attack rolls and damage rolls made with this piece of magic ammunition. The bonus is determined by the rarity of the ammunition. Once it hits a target, the ammunition is no longer magical.\n\nThis ammunition is typically found or sold in quantities of ten or twenty pieces. Ten pieces of this ammunition are equivalent in value to a potion of the same rarity.",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Ammunition, +1",
        "rarity": "Uncommon",
        "atk": 1,
        "dmgBonus": 1
      },
      {
        "n": "Ammunition, +2",
        "rarity": "Rare",
        "atk": 2,
        "dmgBonus": 2
      },
      {
        "n": "Ammunition, +3",
        "rarity": "Very Rare",
        "atk": 3,
        "dmgBonus": 3
      }
    ]
  },
  {
    "n": "Ammunition of Slaying",
    "type": "Weapon (Any Ammunition)",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This magic ammunition is meant to slay creatures of a particular type, which the GM chooses or determines randomly by rolling on the table below. If a creature of that type takes damage from the ammunition, the creature makes a DC 17 Constitution saving throw, taking an extra 6d10 Force damage on a failed save or half as much extra damage on a successful one.\n\nAfter dealing its extra damage to a creature, the ammunition becomes nonmagical.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Creature Type</th>\n      <th>1d100</th>\n      <th>Creature Type</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–10</td>\n      <td>Aberrations</td>\n      <td>51–60</td>\n      <td>Fey</td>\n    </tr>\n    <tr>\n      <td>11–15</td>\n      <td>Beasts</td>\n      <td>61–70</td>\n      <td>Fiends</td>\n    </tr>\n    <tr>\n      <td>16–20</td>\n      <td>Celestials</td>\n      <td>71–75</td>\n      <td>Giants</td>\n    </tr>\n    <tr>\n      <td>21–25</td>\n      <td>Constructs</td>\n      <td>76–80</td>\n      <td>Monstrosities</td>\n    </tr>\n    <tr>\n      <td>26–35</td>\n      <td>Dragons</td>\n      <td>81–85</td>\n      <td>Oozes</td>\n    </tr>\n    <tr>\n      <td>36–45</td>\n      <td>Elementals</td>\n      <td>86–90</td>\n      <td>Plants</td>\n    </tr>\n    <tr>\n      <td>46–50</td>\n      <td>Humanoids</td>\n      <td>91–00</td>\n      <td>Undead</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Amulet of Health",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "Your Constitution is 19 while you wear this amulet. It has no effect on you if your Constitution is 19 or higher without it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Amulet of Proof against Detection and Location",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this amulet, you can't be targeted by Divination spells or perceived through magical scrying sensors unless you allow it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Amulet of the Planes",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While wearing this amulet, you can take a Magic action to name a location that you are familiar with on another plane of existence. Then make a DC 15 Intelligence (Arcana) check. On a successful check, you cast _Plane Shift_. On a failed check, you and each creature and object within 15 feet of you travel to a random destination determined by rolling 1d100 and consulting the following table.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Destination</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–60</td>\n      <td>Random location on the plane you named</td>\n    </tr>\n    <tr>\n      <td>61–70</td>\n      <td>Random location on an Inner Plane determined by rolling 1d6: on a 1, the Plane of Air; on a 2, the Plane of Earth; on a 3, the Plane of Fire; on a 4, the Plane of Water; on a 5, the Feywild; on a 6, the Shadowfell</td>\n    </tr>\n    <tr>\n      <td>71–80</td>\n      <td>Random location on an Outer Plane determined by rolling 1d8: on a 1, Arborea; on a 2, Arcadia; on a 3, the Beastlands; on a 4, Bytopia; on a 5, Elysium; on a 6, Mechanus; on a 7, Mount Celestia; on an 8, Ysgard</td>\n    </tr>\n    <tr>\n      <td>81–90</td>\n      <td>Random location on an Outer Plane determined by rolling 1d8: on a 1, the Abyss; on a 2, Acheron; on a 3, Carceri; on a 4, Gehenna; on a 5, Hades; on a 6, Limbo; on a 7, the Nine Hells; on an 8, Pandemonium</td>\n    </tr>\n    <tr>\n      <td>91–00</td>\n      <td>Random location on the Astral Plane</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Animated Shield",
    "type": "Armor (Shield)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While holding this Shield, you can take a Bonus Action to cause it to animate. The Shield leaps into the air and hovers in your space to protect you as if you were wielding it, leaving your hands free. The Shield remains animate for 1 minute, until you take a Bonus Action to end this effect, or until you die or have the Incapacitated condition, at which point the Shield falls to the ground or into your hand if you have one free.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Apparatus of the Crab",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "",
    "text": "This item first appears to be a sealed iron barrel weighing 500 pounds. The barrel has a hidden catch, which can be found with a successful DC 20 Intelligence (Investigation) check. Releasing the catch unlocks a hatch at one end of the barrel, allowing two Medium or smaller creatures to crawl inside. Ten levers are set in a row at the far end, each in a neutral position, able to move up or down. When certain levers are used, the apparatus transforms to resemble a giant lobster.\n\nThe _Apparatus of the Crab_ is a Large object with the following statistics: AC 20; HP 200; Speed 30 ft., Swim 30 ft. (or 0 ft. for both if the legs aren't extended); Immunity to Poison and Psychic damage.\n\nTo be used as a vehicle, the apparatus requires one pilot. While the apparatus's hatch is closed, the compartment is airtight and watertight. The compartment holds enough air for 10 hours of breathing, divided by the number of breathing creatures inside.\n\nThe apparatus floats on water. It can also go underwater to a depth of 900 feet. Below that, the vehicle takes 2d6 Bludgeoning damage each minute from pressure.\n\nA creature in the compartment can take a Utilize action to move as many as two of the apparatus's levers up or down. After each use, a lever goes back to its neutral position. Each lever, from left to right, functions as shown in the Apparatus of the Crab Levers table.\n\n**Apparatus of the Crab Levers**\n\n<table>\n  <thead>\n    <tr>\n      <th>Lever</th>\n      <th>Up</th>\n      <th>Down</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1</td>\n      <td>Legs extend, allowing the apparatus to walk and swim.</td>\n      <td>Legs retract, reducing the apparatus's Speed and Swim Speed to 0 and making it unable to benefit from bonuses to speed.</td>\n    </tr>\n    <tr>\n      <td>2</td>\n      <td>Forward window shutter opens.</td>\n      <td>Forward window shutter closes.</td>\n    </tr>\n    <tr>\n      <td>3</td>\n      <td>Side window shutters open (two per side).</td>\n      <td>Side window shutters close (two per side).</td>\n    </tr>\n    <tr>\n      <td>4</td>\n      <td>Two claws extend from the front side of the apparatus.</td>\n      <td>The claws retract.</td>\n    </tr>\n    <tr>\n      <td>5</td>\n      <td>Each extended claw makes the following melee attack: +8 to hit, reach 5 ft. Hit: 7 (2d6) Bludgeoning damage.</td>\n      <td>Each extended claw makes the following melee attack: +8 to hit, reach 5 ft. Hit: The target has the Grappled condition (escape DC 15).</td>\n    </tr>\n    <tr>\n      <td>6</td>\n      <td>The apparatus walks or swims forward provided its legs are extended.</td>\n      <td>The apparatus walks or swims backward provided its legs are extended.</td>\n    </tr>\n    <tr>\n      <td>7</td>\n      <td>The apparatus turns 90 degrees counterclockwise provided its legs are extended.</td>\n      <td>The apparatus turns 90 degrees clockwise provided its legs are extended.</td>\n    </tr>\n    <tr>\n      <td>8</td>\n      <td>Eyelike fixtures emit Bright Light in a 30-foot radius and Dim Light for an additional 30 feet.</td>\n      <td>The light turns off.</td>\n    </tr>\n    <tr>\n      <td>9</td>\n      <td>The apparatus sinks up to 20 feet if it's in liquid.</td>\n      <td>The apparatus rises up to 20 feet if it's in liquid.</td>\n    </tr>\n    <tr>\n      <td>10</td>\n      <td>The rear hatch unseals and opens.</td>\n      <td>The rear hatch closes and seals.</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Armor, +1, +2, or +3",
    "type": "Armor (Any Light, Medium, or Heavy)",
    "rarity": "Rare (+1), Very Rare (+2), or Legendary (+3)",
    "attune": "",
    "text": "You have a bonus to Armor Class while wearing this armor. The bonus is determined by its rarity.",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Armor, +1",
        "rarity": "Rare",
        "ac": 1
      },
      {
        "n": "Armor, +2",
        "rarity": "Very Rare",
        "ac": 2
      },
      {
        "n": "Armor, +3",
        "rarity": "Legendary",
        "ac": 3
      }
    ]
  },
  {
    "n": "Armor of Invulnerability",
    "type": "Armor (Plate Armor)",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "You have Resistance to Bludgeoning, Piercing, and Slashing damage while you wear this armor.\n\n**_Metal Shell._** You can take a Magic action to give yourself Immunity to Bludgeoning, Piercing, and Slashing damage for 10 minutes or until you are no longer wearing the armor. Once this property is used, it can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Armor of Resistance",
    "type": "Armor (Any Light, Medium, or Heavy)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "You have Resistance to one type of damage while you wear this armor. The GM chooses the type or determines it randomly by rolling on the following table.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d10</th>\n      <th>Damage Type</th>\n      <th>1d10</th>\n      <th>Damage Type</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1</td>\n      <td>Acid</td>\n      <td>6</td>\n      <td>Necrotic</td>\n    </tr>\n    <tr>\n      <td>2</td>\n      <td>Cold</td>\n      <td>7</td>\n      <td>Poison</td>\n    </tr>\n    <tr>\n      <td>3</td>\n      <td>Fire</td>\n      <td>8</td>\n      <td>Psychic</td>\n    </tr>\n    <tr>\n      <td>4</td>\n      <td>Force</td>\n      <td>9</td>\n      <td>Radiant</td>\n    </tr>\n    <tr>\n      <td>5</td>\n      <td>Lightning</td>\n      <td>10</td>\n      <td>Thunder</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Armor of Vulnerability",
    "type": "Armor (Any Light, Medium, or Heavy)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While wearing this armor, you have Resistance to one of the following damage types: Bludgeoning, Piercing, or Slashing. The GM chooses the type or determines it randomly.\n\n_Curse._ This armor is cursed, a fact that is revealed only when the _Identify_ spell is cast on the armor or you attune to it. Attuning to the armor curses you until you are targeted by a _Remove Curse_ spell or similar magic; removing the armor fails to end the curse. While cursed, you have Vulnerability to two of the three damage types associated with the armor (not the one to which it grants Resistance).",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Arrow-Catching Shield",
    "type": "Armor (Shield)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "You gain a +2 bonus to Armor Class against ranged attack rolls while you wield this Shield. This bonus is in addition to the Shield's normal bonus to AC.\n\nWhenever an attacker makes a ranged attack roll against a target within 5 feet of you, you can take a Reaction to become the target of the attack instead.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bag of Beans",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This heavy cloth bag contains 3d4 dry beans when found. The bag weighs half a pound regardless of how many beans it contains and becomes a non-magical item when it no longer contains any beans.\n\nIf you dump one or more beans out of the bag, they explode in a 10-foot-radius Sphere centered on them. All the dumped beans are destroyed in the explosion, and each creature in the Sphere, including you, makes a DC 15 Dexterity saving throw, taking 5d4 Force damage on a failed save or half as much damage on a successful one.\n\nIf you remove a bean from the bag, plant it in dirt or sand, and then water it, the bean disappears as it produces an effect 1 minute later from the ground where it was planted. The GM can choose an effect from the following table or determine it randomly.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Effect</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01</td>\n      <td>5d4 toadstools sprout. If a creature eats a toadstool, roll any die. On an odd roll, the eater must succeed on a DC 15 Constitution saving throw or take 5d6 Poison damage and have the Poisoned condition for 1 hour. On an even roll, the eater gains 5d6 Temporary Hit Points for 1 hour.</td>\n    </tr>\n    <tr>\n      <td>02–10</td>\n      <td>A geyser erupts and spouts water, beer, mayonnaise, tea, vinegar, wine, or oil (GM's choice) 30 feet into the air for 1d4 minutes.</td>\n    </tr>\n    <tr>\n      <td>11–20</td>\n      <td>A Treant sprouts. Roll any die. On an odd roll, the treant is Chaotic Evil. On an even roll, the treant is Chaotic Good.</td>\n    </tr>\n    <tr>\n      <td>21–30</td>\n      <td>An animate but immobile stone statue in your likeness rises and makes verbal threats against you. If you leave it and others come near, it describes you as the most heinous of villains and directs the newcomers to find and attack you. If you are on the same plane of existence as the statue, it knows where you are. The statue becomes inanimate after 24 hours.</td>\n    </tr>\n    <tr>\n      <td>31–40</td>\n      <td>A campfire with green flames springs forth and burns for 24 hours or until it is extinguished.</td>\n    </tr>\n    <tr>\n      <td>41–50</td>\n      <td>Three Shrieker Fungi sprout.</td>\n    </tr>\n    <tr>\n      <td>51–60</td>\n      <td>1d4 + 4 bright-pink toads crawl forth. Whenever a toad is touched, it transforms into a Large or smaller monster of the GM's choice that acts in accordance with its alignment and nature. The monster remains for 1 minute, then disappears in a puff of bright-pink smoke.</td>\n    </tr>\n    <tr>\n      <td>61–70</td>\n      <td>A hungry Bulette burrows up and attacks.</td>\n    </tr>\n    <tr>\n      <td>71–80</td>\n      <td>A fruit tree grows. It has 1d10 + 20 fruit, 1d8 of which act as randomly determined potions. The tree vanishes after 1 hour. Picked fruit remains, retaining any magic for 30 days.</td>\n    </tr>\n    <tr>\n      <td>81–90</td>\n      <td>A nest of 1d4 + 3 rainbow-colored eggs springs up. Any creature that eats an egg makes a DC 20 Constitution saving throw. On a successful save, a creature permanently increases its lowest ability score by 1, randomly choosing among equally low scores. On a failed save, the creature takes 10d6 Force damage from an internal explosion.</td>\n    </tr>\n    <tr>\n      <td>91–95</td>\n      <td>A pyramid with a 60-foot-square base bursts upward. Inside is a burial chamber containing a Mummy, a Mummy Lord, or some other Undead of the GM's choice. Its sarcophagus contains treasure of the GM's choice.</td>\n    </tr>\n    <tr>\n      <td>96–00</td>\n      <td>A giant beanstalk sprouts, growing to a height of the GM's choice. The top leads where the GM chooses, such as to a great view, a cloud giant's castle, or another plane of existence.</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bag of Devouring",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This bag resembles a _Bag of Holding_ but is a feeding orifice for a gigantic extradimensional creature. Turning the bag inside out closes the orifice.\n\nThe extradimensional creature attached to the bag can sense whatever is placed inside the bag. Animal or vegetable matter placed wholly in the bag is devoured and lost forever. When part of a living creature is placed in the bag, as happens when someone reaches inside it, there is a 50 percent chance that the creature is pulled inside the bag. A creature inside the bag can take an action to try to escape, doing so with a successful DC 15 Strength (Athletics) check. Another creature can take an action to reach into the bag to pull a creature out, doing so with a successful DC 20 Strength (Athletics) check, provided the puller isn't pulled inside the bag first. Any creature that starts its turn inside the bag is devoured, its body destroyed.\n\nInanimate objects can be stored in the bag, which can hold a cubic foot of such material. However, once each day, the bag swallows any objects inside it and spits them out into another plane of existence. The GM determines the time and plane.\n\nIf the bag is pierced or torn, it is destroyed, and anything contained within it is transported to a random location on the Astral Plane.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bag of Holding",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This bag has an interior space considerably larger than its outside dimensions—roughly 2 feet square and 4 feet deep on the inside. The bag can hold up to 500 pounds, not exceeding a volume of 64 cubic feet. The bag weighs 5 pounds, regardless of its contents. Retrieving an item from the bag requires a Utilize action.\n\nIf the bag is overloaded, pierced, or torn, it is destroyed, and its contents are scattered in the Astral Plane. If the bag is turned inside out, its contents spill forth unharmed, but the bag must be put right before it can be used again. The bag holds enough air for 10 minutes of breathing, divided by the number of breathing creatures inside.\n\nPlacing a _Bag of Holding_ inside an extradimensional space created by a _Handy Haversack_, _Portable Hole_, or similar item instantly destroys both items and opens a gate to the Astral Plane. The gate originates where the one item was placed inside the other. Any creature within a 10-foot-radius Sphere centered on the gate is sucked through it to a random location on the Astral Plane. The gate then closes. The gate is one-way and can't be reopened.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bag of Tricks",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This bag made from gray, rust, or tan cloth appears empty. Reaching inside the bag, however, reveals the presence of a small, fuzzy object.\n\nYou can take a Magic action to pull the fuzzy object from the bag and throw it up to 20 feet. When the object lands, it transforms into a creature you determine by rolling on the table that corresponds to the bag's color. See \"Monsters\" for the creature's stat block. The creature vanishes at the next dawn or when it is reduced to 0 Hit Points.\n\nThe creature is Friendly to you and your allies, and it acts immediately after you on your Initiative count. You can take a Bonus Action to command how the creature moves and what action it takes on its next turn, such as attacking an enemy. In the absence of such orders, the creature acts in a fashion appropriate to its nature.\n\nOnce three fuzzy objects have been pulled from the bag, the bag can't be used again until the next dawn.\n\n**Gray Bag of Tricks**\n\n<table>\n  <thead>\n    <tr>\n      <th>1d8</th>\n      <th>Creature</th>\n      <th>1d8</th>\n      <th>Creature</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1</td>\n      <td>Weasel</td>\n      <td>5</td>\n      <td>Panther</td>\n    </tr>\n    <tr>\n      <td>2</td>\n      <td>Giant Rat</td>\n      <td>6</td>\n      <td>Giant Badger</td>\n    </tr>\n    <tr>\n      <td>3</td>\n      <td>Badger</td>\n      <td>7</td>\n      <td>Dire Wolf</td>\n    </tr>\n    <tr>\n      <td>4</td>\n      <td>Boar</td>\n      <td>8</td>\n      <td>Giant Elk</td>\n    </tr>\n  </tbody>\n</table>\n\n**Rust Bag of Tricks**\n\n<table>\n  <thead>\n    <tr>\n      <th>1d8</th>\n      <th>Creature</th>\n      <th>1d8</th>\n      <th>Creature</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1</td>\n      <td>Rat</td>\n      <td>5</td>\n      <td>Giant Goat</td>\n    </tr>\n    <tr>\n      <td>2</td>\n      <td>Owl</td>\n      <td>6</td>\n      <td>Giant Boar</td>\n    </tr>\n    <tr>\n      <td>3</td>\n      <td>Mastiff</td>\n      <td>7</td>\n      <td>Lion</td>\n    </tr>\n    <tr>\n      <td>4</td>\n      <td>Goat</td>\n      <td>8</td>\n      <td>Brown Bear</td>\n    </tr>\n  </tbody>\n</table>\n\n**Tan Bag of Tricks**\n\n<table>\n  <thead>\n    <tr>\n      <th>1d8</th>\n      <th>Creature</th>\n      <th>1d8</th>\n      <th>Creature</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1</td>\n      <td>Jackal</td>\n      <td>5</td>\n      <td>Black Bear</td>\n    </tr>\n    <tr>\n      <td>2</td>\n      <td>Ape</td>\n      <td>6</td>\n      <td>Giant Weasel</td>\n    </tr>\n    <tr>\n      <td>3</td>\n      <td>Baboon</td>\n      <td>7</td>\n      <td>Giant Hyena</td>\n    </tr>\n    <tr>\n      <td>4</td>\n      <td>Axe Beak</td>\n      <td>8</td>\n      <td>Tiger</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bead of Force",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This small black sphere measures 3/4 of an inch in diameter and weighs an ounce. Typically, 1d4 + 4 _Beads of Force_ are found together.\n\nYou can take a Magic action to throw the bead up to 60 feet. The bead explodes in a 10-foot-radius Sphere on impact and is destroyed. Each creature\nin the Sphere must succeed on a DC 15 Dexterity saving throw or take 5d4 Force damage. A sphere of transparent force then encloses the area for 1 minute. Any creature that failed the save and is completely within the area is trapped inside this sphere. Creatures that succeeded on the save or are partially within the area are pushed away from the center of the sphere until they are no longer inside it. Only breathable air can pass through the sphere's wall. No attack or other effect can pass through.\n\nAn enclosed creature can take a Utilize action to push against the sphere's wall, moving the sphere up to half the creature's Speed. The sphere can be picked up, and its magic causes it to weigh only 1 pound, regardless of the weight of creatures inside.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bead of Nourishment",
    "type": "Wondrous Item",
    "rarity": "Common",
    "attune": "",
    "text": "This flavorless, gelatinous bead dissolves on your tongue and provides as much nourishment as 1 day of Rations.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Belt of Dwarvenkind",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While wearing this belt, you gain the following benefits:\n\n**Dwarvish.** You know Dwarvish.\n\n**Friend of Dwarvenkind.** You have Advantage on Charisma (Persuasion) checks made to interact with dwarves and duergar.\n\n**Toughness.** Your Constitution increases by 2, to a maximum of 20.\n\nIn addition, while attuned to the belt, you have a 50 percent chance each day at dawn of growing a full beard if you can grow one, or a thicker beard if you already have one.\n\nIf you aren't a dwarf or duergar, you gain the following additional benefits while wearing the belt:\n\n**Darkvision.** You have Darkvision with a range of 60 feet.\n\n**Resilience.** You have Resistance to Poison damage. You also have Advantage on saving throws you make to avoid or end the Poisoned condition.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Belt of Giant Strength",
    "type": "Wondrous Item",
    "rarity": "Rarity Varies",
    "attune": "Requires Attunement",
    "text": "While wearing this belt, your Strength changes to a score granted by the belt. The type of giant determines the score (see the table below). The item has no effect on you if your Strength without the belt is equal to or greater than the belt's score.\n\n<table>\n  <thead>\n    <tr>\n      <th>Belt</th>\n      <th>Str.</th>\n      <th>Rarity</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Belt of Giant Strength (hill)</td>\n      <td>21</td>\n      <td>Rare</td>\n    </tr>\n    <tr>\n      <td>Belt of Giant Strength (frost or stone)</td>\n      <td>23</td>\n      <td>Very Rare</td>\n    </tr>\n    <tr>\n      <td>Belt of Giant Strength (fire)</td>\n      <td>25</td>\n      <td>Very Rare</td>\n    </tr>\n    <tr>\n      <td>Belt of Giant Strength (cloud)</td>\n      <td>27</td>\n      <td>Legendary</td>\n    </tr>\n    <tr>\n      <td>Belt of Giant Strength (storm)</td>\n      <td>29</td>\n      <td>Legendary</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Berserker Axe",
    "type": "Weapon (Battleaxe, Greataxe, or Halberd)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon. In addition, while you are attuned to this weapon, your Hit Point maximum increases by 1 for each level you have attained.\n\n_Curse._ This weapon is cursed, and becoming attuned to it extends the curse to you. As long as you remain cursed, you are unwilling to part with the weapon, keeping it within reach at all times. You also have Disadvantage on attack rolls with weapons other than this one.\n\nWhenever another creature damages you while the weapon is in your possession, you must succeed on a DC 15 Wisdom saving throw or go berserk. This berserk state ends when you start your turn and there are no creatures within 60 feet of you that you can see or hear.\n\nWhile berserk, you regard the creature nearest to you that you can see or hear as your enemy. If there are multiple possible creatures, choose one at random. On each of your turns, you must move as close to the creature as possible and take the Attack action, targeting the creature. If you're unable to get close enough to the creature to attack it with the weapon, your turn ends after you've used up all your available movement. If the creature dies or can no longer be seen or heard by you, the next nearest creature that you can see or hear becomes your new target.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Boots of Elvenkind",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "While you wear these boots, your steps make no sound, regardless of the surface you are moving across. You also have Advantage on Dexterity (Stealth) checks.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Boots of Levitation",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While you wear these boots, you can cast _Levitate_ on yourself.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Boots of Speed",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While you wear these boots, you can take a Bonus Action to click the boots' heels together. If you do, the boots double your Speed, and any creature that makes an Opportunity Attack against you has Disadvantage on the attack roll. If you click your heels together again, you end the effect.\n\nWhen you've used the boots' property for a total of 10 minutes, the magic ceases to function for you until you finish a Long Rest.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Boots of Striding and Springing",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While you wear these boots, your Speed becomes 30 feet unless your Speed is higher, and your Speed isn't reduced by you carrying weight in excess of your carrying capacity or wearing Heavy Armor.\n\nOnce on each of your turns, you can jump up to 30 feet by spending only 10 feet of movement.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Boots of the Winterlands",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "These furred boots are snug and feel warm. While wearing them, you gain the following benefits.\n\n_Cold Resistance._ You have Resistance to Cold damage and can tolerate temperatures of 0 degrees Fahrenheit or lower without any additional protection.\n\n_Winter Strider._ You ignore Difficult Terrain created by ice or snow.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bowl of Commanding Water Elementals",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "While this bowl is filled with water and you are within 5 feet of it, you can take a Magic action to summon a Water Elemental. The elemental appears in an unoccupied space as close to the bowl as possible, understands your languages, obeys your commands, and takes its turn immediately after you on your Initiative count. The elemental disappears after 1 hour, when it dies, or when you dismiss it as a Bonus Action. The bowl can't be used this way again until the next dawn.\n\nThe bowl is about 1 foot in diameter and half as deep. It holds about 3 gallons.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Bracers of Archery",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing these bracers, you have proficiency with the Longbow and Shortbow, and you gain a +2 bonus to damage rolls made with such weapons.",
    "src": "SRD 5.2.1",
    "dmgBonus": 2,
    "appliesTo": [
      "Longbow",
      "Shortbow"
    ]
  },
  {
    "n": "Bracers of Defense",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While wearing these bracers, you gain a +2 bonus to Armor Class if you are wearing no armor and using no Shield.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Brazier of Commanding Fire Elementals",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "While you are within 5 feet of this brazier, you can take a Magic action to summon a Fire Elemental. The elemental appears in an unoccupied space as close to the brazier as possible, understands your languages, obeys your commands, and takes its turn immediately after you on your Initiative count. The elemental disappears after 1 hour, when it dies, or when you dismiss it as a Bonus Action. The brazier can't be used this way again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Brooch of Shielding",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this brooch, you have Resistance to Force damage, and you have Immunity to damage from the _Magic Missile_ spell.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Broom of Flying",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "This wooden broom functions like a mundane broom until you stand astride it and take a Magic action to make it hover beneath you, at which time it can be ridden in the air. It has a Fly Speed of 50 feet. It can carry up to 400 pounds, but its Fly Speed becomes 30 feet while carrying over 200 pounds. The broom stops hovering when you land or when you're no longer riding it.\n\nAs a Magic action, you can send the broom to travel alone to a destination within 1 mile of you if you name the location and are familiar with it. The broom comes back to you when you take a Magic action and use a command word if the broom is still within 1 mile of you.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Candle of Invocation",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "This candle's magic is activated when the candle is lit, which requires a Magic action. After burning for 4 hours, the candle is destroyed. You can snuff it out early for use at a later time. Deduct the time it burned in increments of 1 minute from its total burn time.\n\nWhile lit, the candle sheds Dim Light in a 30-foot radius. While you are within that light, you have Advantage on D20 Tests. In addition, a Cleric or Druid in the light can cast level 1 spells they have prepared without expending spell slots.\n\nAlternatively, when you light the candle for the first time, you can cast _Gate_ with it. Doing so destroys the candle. The portal created by the spell\nlinks to a particular Outer Plane chosen by the GM or determined by rolling on the following table.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Outer Plane</th>\n      <th>1d100</th>\n      <th>Outer Plane</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–05</td>\n      <td>Abyss</td>\n      <td>55–59</td>\n      <td>Gehenna</td>\n    </tr>\n    <tr>\n      <td>06–10</td>\n      <td>Acheron</td>\n      <td>60–64</td>\n      <td>Hades</td>\n    </tr>\n    <tr>\n      <td>11–17</td>\n      <td>Arborea</td>\n      <td>65–69</td>\n      <td>Limbo</td>\n    </tr>\n    <tr>\n      <td>18–25</td>\n      <td>Arcadia</td>\n      <td>70–77</td>\n      <td>Mechanus</td>\n    </tr>\n    <tr>\n      <td>26–33</td>\n      <td>Beastlands</td>\n      <td>78–85</td>\n      <td>Mount Celestia</td>\n    </tr>\n    <tr>\n      <td>34–41</td>\n      <td>Bytopia</td>\n      <td>86–90</td>\n      <td>Nine Hells</td>\n    </tr>\n    <tr>\n      <td>42–46</td>\n      <td>Carceri</td>\n      <td>91–95</td>\n      <td>Pandemonium</td>\n    </tr>\n    <tr>\n      <td>47–54</td>\n      <td>Elysium</td>\n      <td>96–00</td>\n      <td>Ysgard</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cape of the Mountebank",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This cape smells faintly of brimstone. While wearing it, you can use it to cast _Dimension Door_ as a Magic action. This property can't be used again until the next dawn.\n\nWhen you teleport with that spell, you leave behind a cloud of smoke. The space you left is Lightly Obscured by that smoke until the end of your next turn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Carpet of Flying",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "You can make this carpet hover and fly by taking a Magic action and using the carpet's command word. It moves according to your directions if you are within 30 feet of it.\n\nFour sizes of _Carpet of Flying_ exist. The GM chooses the size of a given carpet or determines it randomly by rolling on the following table. A carpet can carry up to twice the weight shown on the table, but its Fly Speed is halved if it carries more than its normal capacity.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Size</th>\n      <th>Capacity</th>\n      <th>Fly Speed</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–20</td>\n      <td>3 ft. × 5 ft.</td>\n      <td>200 lb.</td>\n      <td>80 feet</td>\n    </tr>\n    <tr>\n      <td>21–55</td>\n      <td>4 ft. × 6 ft.</td>\n      <td>400 lb.</td>\n      <td>60 feet</td>\n    </tr>\n    <tr>\n      <td>56–80</td>\n      <td>5 ft. × 7 ft.</td>\n      <td>600 lb.</td>\n      <td>40 feet</td>\n    </tr>\n    <tr>\n      <td>81–00</td>\n      <td>6 ft. × 9 ft.</td>\n      <td>800 lb.</td>\n      <td>30 feet</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Censer of Controlling Air Elementals",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "While gently swinging this censer, you can take a Magic action to summon an Air Elemental. The elemental appears in an unoccupied space as close to the censer as possible, understands your languages, obeys your commands, and takes its turn immediately after you on your Initiative count. The elemental disappears after 1 hour, when it dies, or when you dismiss it as a Bonus Action. The censer can't be used this way again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Chime of Opening",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This hollow metal tube measures about 1 foot long and weighs 1 pound. As a Magic action, you can strike the chime to cast _Knock_. The spell's customary knocking sound is replaced by the clear, ringing tone of the chime, which is audible out to 300 feet.\n\nThe chime can be used 10 times. After the tenth time, it cracks and becomes useless.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Circlet of Blasting",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "While wearing this circlet, you can cast _Scorching Ray_ with it (+5 to hit). The circlet can't cast this spell again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cloak of Arachnida",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "This fine garment is made of black silk interwoven with faint, silvery threads. While wearing it, you gain the following benefits.\n\n_Poison Resistance._ You have Resistance to Poison damage.\n\n_Spider Climb._ You have a Climb Speed equal to your Speed and can move up, down, and across vertical surfaces and along ceilings, while leaving your hands free.\n\n_Spider Walk._ You can't be caught in webs of any sort and can move through webs as if they were Difficult Terrain.\n\n_Web._ You can cast _Web_ (save DC 13). The web created by the spell fills twice its normal area. Once used, this property can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cloak of Displacement",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While you wear this cloak, it magically projects an illusion that makes you appear to be standing in a place near your actual location, causing any creature to have Disadvantage on attack rolls against you. If you take damage, the property ceases to function until the start of your next turn. This property is suppressed while your Speed is 0.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cloak of Elvenkind",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While you wear this cloak, Wisdom (Perception) checks made to perceive you have Disadvantage, and you have Advantage on Dexterity (Stealth) checks.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cloak of Invisibility",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "This cloak has 3 charges and regains 1d3 expended charges daily at dawn. While wearing the cloak, you can take a Magic action to pull its hood over your\nhead and expend 1 charge to give yourself the Invisible condition for 1 hour. The effect ends early if you pull the hood down (no action required) or cease wearing the cloak.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cloak of Protection",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "You gain a +1 bonus to Armor Class and saving throws while you wear this cloak.",
    "src": "SRD 5.2.1",
    "ac": 1,
    "saves": 1
  },
  {
    "n": "Cloak of the Bat",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While wearing this cloak, you have Advantage on Dexterity (Stealth) checks. In an area of Dim Light or Darkness, you can grip the edges of the cloak and use it to gain a Fly Speed of 40 feet. If you ever fail to grip the cloak's edges while flying in this way, or if you are no longer in Dim Light or Darkness, you lose this Fly Speed.\n\nWhile wearing the cloak in an area of Dim Light or Darkness, you can cast _Polymorph_ on yourself, shape-shifting into a Bat. While in that form, you retain your Intelligence, Wisdom, and Charisma scores. The cloak can't be used this way again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cloak of the Manta Ray",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this cloak, you can breathe underwater, and you have a Swim Speed of 60 feet.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Crystal Ball",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While touching this crystal orb, you can cast _Scrying_ (save DC 17) with it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Crystal Ball of Mind Reading",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "While touching this crystal orb, you can cast _Scrying_ (save DC 17) with it. In addition, you can cast _Detect Thoughts_ (save DC 17) targeting creatures you can see within 30 feet of the spell's sensor. You don't need to concentrate on this _Detect Thoughts_ spell to maintain it during its duration, but it ends if the _Scrying_ spell ends.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Crystal Ball of Telepathy",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "While touching this crystal orb, you can cast _Scrying_ (save DC 17) with it. In addition, you can communicate telepathically with creatures you can see within 30 feet of the spell's sensor. You can also cast _Suggestion_ (save DC 17) through the sensor on one of those creatures. You don't need to concentrate on this _Suggestion_ to maintain it during its duration, but it ends if _Scrying_ ends. You can't cast _Suggestion_ in this way again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Crystal Ball of True Seeing",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "While touching this crystal orb, you can cast _Scrying_ (save DC 17) with it. In addition, you have Truesight with a range of 120 feet centered on the spell's sensor.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cube of Force",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This cube is about an inch across. Each face has a distinct marking on it. You can press one of those faces, expend the number of charges required for it, and thereby cast the spell associated with it (save DC 17), as shown in the Cube of Force Faces table.\n\nThe cube starts with 10 charges, and it regains 1d6 expended charges daily at dawn.\n\n**Cube of Force Faces**\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Mage Armor</td>\n      <td>1</td>\n    </tr>\n    <tr>\n      <td>Shield</td>\n      <td>1</td>\n    </tr>\n    <tr>\n      <td>Tiny Hut</td>\n      <td>3</td>\n    </tr>\n    <tr>\n      <td>Private Sanctum</td>\n      <td>4</td>\n    </tr>\n    <tr>\n      <td>Resilient Sphere</td>\n      <td>4</td>\n    </tr>\n    <tr>\n      <td>Wall of Force</td>\n      <td>5</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Cubic Gate",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "",
    "text": "This cube is 3 inches across and radiates palpable magical energy. The six sides of the cube are each keyed to a different plane of existence, one of which is the Material Plane. The other sides are linked to planes determined by the GM.\n\nThe cube has 3 charges and regains 1d3 expended charges daily at dawn. As a Magic action, you can expend 1 of the cube's charges to cast one of the following spells using the cube.\n\n_Gate._ Pressing one side of the cube, you cast _Gate_, opening a portal to the plane of existence keyed to that side.\n\n_Plane Shift._ Pressing one side of the cube twice, you cast _Plane Shift_, transporting the targets to the plane of existence keyed to that side.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dagger of Venom",
    "type": "Weapon (Dagger)",
    "rarity": "Rare",
    "attune": "",
    "text": "You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon.\n\nYou can take a Bonus Action to magically coat the blade with poison. The poison remains for 1 minute or until an attack using this weapon hits a creature. That creature must succeed on a DC 15 Constitution saving throw or take 2d10 Poison damage and have the Poisoned condition for 1 minute. The weapon can't be used this way again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dancing Sword",
    "type": "Weapon (Greatsword, Longsword, Rapier, Scimitar, or Shortsword)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "You can take a Bonus Action to toss this magic weapon into the air. When you do so, the weapon begins to hover, flies up to 30 feet, and attacks one creature of your choice within 5 feet of itself. The weapon uses your attack roll and adds your ability modifier to damage rolls.\n\nWhile the weapon hovers, you can take a Bonus Action to cause it to fly up to 30 feet to another spot within 30 feet of you. As part of the same Bonus Action, you can cause the weapon to attack one creature within 5 feet of the weapon.\n\nAfter the hovering weapon attacks for the fourth time, it flies back to you and tries to return to your hand. If you have no hand free, the weapon falls to the ground in your space. If the weapon has no unobstructed path to you, it moves as close to you as it can and then falls to the ground. It also ceases to hover if you grasp it or are more than 30 feet away from it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Decanter of Endless Water",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This stoppered flask sloshes when shaken, as if it contains water. The decanter weighs 2 pounds.\n\nYou can take a Magic action to remove the stopper and issue one of three command words, whereupon an amount of fresh water or salt water (your choice) pours out of the flask. The water stops pouring out at the start of your next turn. Choose from the following command words:\n\n**Splash.** The decanter produces 1 gallon of water.\n**Fountain.** The decanter produces 5 gallons of water.\n**Geyser.** The decanter produces 30 gallons of water that gushes forth in a Line 30 feet long and 1 foot wide. If you're holding the decanter, you can aim the geyser in one direction (no action required). One creature of your choice in the Line must succeed on a DC 13 Strength saving throw or take 1d4 Bludgeoning damage and have the Prone condition. Instead of a creature, you can target one object in the Line that isn't being worn or carried and that weighs no more than 200 pounds. The object is knocked over by the geyser.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Deck of Illusions",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This box contains a set of cards. A full deck has 34 cards: 32 depicting specific creatures and two with a mirrored surface. A deck found as treasure is usually missing 1d20 − 1 cards.\n\nThe magic of the deck functions only if its cards are drawn at random. You can take a Magic action to draw a card at random from the deck and throw it to the ground at a point within 30 feet of yourself. An illusion of a creature, determined by rolling on the Deck of Illusions table, forms over the thrown card and remains until dispelled. The illusory creature created by the card looks and behaves like a real creature of its kind, except that it can do no harm. While you are within 120 feet of the illusory creature and can see it, you can take a Magic action to move it anywhere within 30 feet of its card.\n\nAny physical interaction with the illusory creature reveals it to be false, because objects pass through it. A creature that takes a Study action to visually inspect the illusory creature identifies it as an illusion with a successful DC 15 Intelligence (Investigation) check. The illusion lasts until its card is moved or the illusion is dispelled (using a _Dispel Magic_ spell or a similar effect). When the illusion ends, the image on its card disappears, and that card can't be used again.\n\n**Deck of Illusions**\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Illusion*</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–03</td>\n      <td>Adult Red Dragon</td>\n    </tr>\n    <tr>\n      <td>04–06</td>\n      <td>Archmage</td>\n    </tr>\n    <tr>\n      <td>07–09</td>\n      <td>Assassin</td>\n    </tr>\n    <tr>\n      <td>10–12</td>\n      <td>Bandit Captain</td>\n    </tr>\n    <tr>\n      <td>13–15</td>\n      <td>Basilisk</td>\n    </tr>\n    <tr>\n      <td>16–18</td>\n      <td>Berserker</td>\n    </tr>\n    <tr>\n      <td>19–21</td>\n      <td>Bugbear Warrior</td>\n    </tr>\n    <tr>\n      <td>22–24</td>\n      <td>Cloud Giant</td>\n    </tr>\n    <tr>\n      <td>25–27</td>\n      <td>Druid</td>\n    </tr>\n    <tr>\n      <td>28–30</td>\n      <td>Erinyes</td>\n    </tr>\n    <tr>\n      <td>31–33</td>\n      <td>Ettin</td>\n    </tr>\n    <tr>\n      <td>34–36</td>\n      <td>Fire Giant</td>\n    </tr>\n    <tr>\n      <td>37–39</td>\n      <td>Frost Giant</td>\n    </tr>\n    <tr>\n      <td>40–42</td>\n      <td>Gnoll Warrior</td>\n    </tr>\n    <tr>\n      <td>43–45</td>\n      <td>Goblin Warrior</td>\n    </tr>\n    <tr>\n      <td>46–48</td>\n      <td>Guardian Naga</td>\n    </tr>\n    <tr>\n      <td>49–51</td>\n      <td>Hill Giant</td>\n    </tr>\n    <tr>\n      <td>52–54</td>\n      <td>Hobgoblin Warrior</td>\n    </tr>\n    <tr>\n      <td>55–57</td>\n      <td>Incubus</td>\n    </tr>\n    <tr>\n      <td>58–60</td>\n      <td>Iron Golem</td>\n    </tr>\n    <tr>\n      <td>61–63</td>\n      <td>Knight</td>\n    </tr>\n    <tr>\n      <td>64–66</td>\n      <td>Kobold Warrior</td>\n    </tr>\n    <tr>\n      <td>67–69</td>\n      <td>Lich</td>\n    </tr>\n    <tr>\n      <td>70–72</td>\n      <td>Medusa</td>\n    </tr>\n    <tr>\n      <td>73–75</td>\n      <td>Night Hag</td>\n    </tr>\n    <tr>\n      <td>76–78</td>\n      <td>Ogre</td>\n    </tr>\n    <tr>\n      <td>79–81</td>\n      <td>Oni</td>\n    </tr>\n    <tr>\n      <td>82–84</td>\n      <td>Priest</td>\n    </tr>\n    <tr>\n      <td>85–87</td>\n      <td>Succubus</td>\n    </tr>\n    <tr>\n      <td>88–90</td>\n      <td>Troll</td>\n    </tr>\n    <tr>\n      <td>91–93</td>\n      <td>Veteran Warrior</td>\n    </tr>\n    <tr>\n      <td>94–96</td>\n      <td>Wyvern</td>\n    </tr>\n    <tr>\n      <td>97–00</td>\n      <td>The card drawer</td>\n    </tr>\n  </tbody>\n</table>\n\n\\*Stat blocks for these creatures (except the card drawer) appear in \"Monsters.\"",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Defender",
    "type": "Weapon (Any Melee Weapon)",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "You gain a +3 bonus to attack rolls and damage rolls made with this magic weapon.\n\nThe first time you attack with the weapon on each of your turns, you can transfer some or all of the weapon's bonus to your Armor Class. For example, you could reduce the bonus to your attack rolls and damage rolls to +1 and gain a +2 bonus to Armor Class. The adjusted bonuses remain in effect until the start of your next turn, although you must hold the weapon to gain a bonus to AC from it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Demon Armor",
    "type": "Armor (Any Light, Medium, or Heavy)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While wearing this armor, you gain a +1 bonus to Armor Class, and you know Abyssal. In addition, the armor's clawed gauntlets allow your Unarmed Strikes to deal 1d8 Slashing damage instead of the usual Bludgeoning damage, and you gain a +1 bonus to the attack and damage rolls of your Unarmed Strikes.\n\n_Curse._ Once you don this cursed armor, you can't doff it unless you are targeted by a _Remove Curse_ spell or similar magic. While wearing the armor, you have Disadvantage on attack rolls against demons and on saving throws against their spells and special abilities.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dimensional Shackles",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "You can take a Utilize action to place these shackles on a creature that has the Incapacitated condition. The shackles adjust to fit a creature of Small to Large size. The shackles prevent a creature bound by them from using any method of extradimensional movement, including teleportation or travel to a different plane of existence. They don't prevent the creature from passing through an interdimensional portal.\n\nYou and any creature you designate when you use the shackles can take a Utilize action to remove them. Once every 30 days, the bound creature can make a DC 30 Strength (Athletics) check. On a successful check, the creature breaks free and destroys the shackles.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dragon Orb",
    "type": "Wondrous Item",
    "rarity": "Artifact",
    "attune": "Requires Attunement",
    "text": "An orb is an etched crystal globe about 10 inches in diameter. When used, it grows to about 20 inches in diameter, and mist swirls inside it.\n\nWhile attuned to an orb, you can take a Magic action to peer into the orb's depths. You must then make a DC 15 Charisma saving throw. On a successful save, you control the orb for as long as you remain attuned to it. On a failed save, the orb imposes the Charmed condition on you for as long as you remain attuned to it.\n\nWhile you are Charmed by the orb, you can't voluntarily end your Attunement to it, and the orb casts _Suggestion_ on you at will (save DC 18), urging you to work toward the evil ends it desires. The dragon essence within the orb might want many things: the annihilation of a particular society or organization, freedom from the orb, to spread suffering in the world, to advance the worship of Tiamat, or something else the GM decides.\n\n_Spells._ The orb has 7 charges and regains 1d4 + 3 expended charges daily at dawn. If you control the orb, you can cast one of the spells on the following table from it. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Cure Wounds (level 9 version)</td>\n      <td>4</td>\n    </tr>\n    <tr>\n      <td>Daylight</td>\n      <td>1</td>\n    </tr>\n    <tr>\n      <td>Death Ward</td>\n      <td>2</td>\n    </tr>\n    <tr>\n      <td>Detect Magic</td>\n      <td>0</td>\n    </tr>\n    <tr>\n      <td>Scrying (save DC 18)</td>\n      <td>3</td>\n    </tr>\n  </tbody>\n</table>\n\n_Call Dragons._ While you control the orb, you can take a Magic action to cause the orb to issue a telepathic call that extends in all directions for 40 miles. Chromatic dragons in range feel compelled to come to the orb as soon as possible by the most direct route. Dragon deities such as Tiamat are unaffected by this call. Chromatic dragons drawn to the orb might be Hostile toward you for compelling them against their will. Once you have used this property, it can't be used again for 1 hour.\n\n_Destroying an Orb._ A _Dragon Orb_ has AC 20 and is destroyed if it takes damage from a +3 _Weapon_ or a _Disintegrate_ spell. Nothing else can harm it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dragon Scale Mail",
    "type": "Armor (Scale Mail)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "Dragon Scale Mail is made of the scales of one kind of dragon. Sometimes dragons collect their cast-off\nscales and gift them. Other times, hunters carefully preserve the hide of a dead dragon. In either case, _Dragon Scale Mail_ is highly valued.\n\nWhile wearing this armor, you gain a +1 bonus to Armor Class, you have Advantage on saving throws against the breath weapons of Dragons, and you have Resistance to one damage type determined by the kind of dragon that provided the scales (see the accompanying table).\n\nAdditionally, you can focus your senses as a Magic action to discern the distance and direction to the closest dragon within 30 miles of yourself that is of the same type as the armor. This action can't be used again until the next dawn.\n\n<table>\n  <thead>\n    <tr>\n      <th>Dragon</th>\n      <th>Resistance</th>\n      <th>Dragon</th>\n      <th>Resistance</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Black</td>\n      <td>Acid</td>\n      <td>Gold</td>\n      <td>Fire</td>\n    </tr>\n    <tr>\n      <td>Blue</td>\n      <td>Lightning</td>\n      <td>Green</td>\n      <td>Poison</td>\n    </tr>\n    <tr>\n      <td>Brass</td>\n      <td>Fire</td>\n      <td>Red</td>\n      <td>Fire</td>\n    </tr>\n    <tr>\n      <td>Bronze</td>\n      <td>Lightning</td>\n      <td>Silver</td>\n      <td>Cold</td>\n    </tr>\n    <tr>\n      <td>Copper</td>\n      <td>Acid</td>\n      <td>White</td>\n      <td>Cold</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dragon Slayer",
    "type": "Weapon (Any Simple or Martial)",
    "rarity": "Rare",
    "attune": "",
    "text": "You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon.\n\nThe weapon deals an extra 3d6 damage of the weapon's type if the target is a Dragon.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dust of Disappearance",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This powder resembles fine sand. There is enough of it for one use. When you take a Utilize action to throw the dust into the air, you and each creature and object within a 10-foot Emanation originating from you have the Invisible condition for 2d4 minutes. The duration is the same for all subjects, and the dust is consumed when its magic takes effect. Immediately after an affected creature makes an attack roll, deals damage, or casts a spell, the Invisible condition ends for that creature.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dust of Dryness",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This small packet contains 1d6 + 4 pinches of dust. As a Utilize action, you can sprinkle a pinch of the dust over water, turning up to a 15-foot Cube of water into one marble-sized pellet, which floats or rests near where the dust was sprinkled. The pellet's weight is negligible. A creature can take a Utilize action to smash the pellet against a hard surface, causing the pellet to shatter and release the water the dust absorbed. Doing so destroys the pellet and ends its magic.\n\nAs a Utilize action, you can sprinkle a pinch of the dust on an Elemental within 5 feet of yourself that is composed mostly of water (such as a **Water Elemental**). Such a creature exposed to a pinch of the dust makes a DC 13 Constitution saving throw, taking 10d6 Necrotic damage on a failed save or half as much damage on a successful one.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dust of Sneezing and Choking",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "Found in a small container, this powder resembles _Dust of Disappearance_, and _Identify_ reveals it to be such. There is enough of it for one use.\n\nAs a Utilize action, you can throw the dust into the air, forcing yourself and every creature in a 30-foot Emanation originating from you to make a DC 15 Constitution saving throw. Constructs, Elementals, Oozes, Plants, and Undead succeed on the save automatically.\n\nOn a failed save, a creature begins sneezing uncontrollably; it has the Incapacitated condition and is suffocating. The creature repeats the save at the end of each of its turns, ending the effect on itself on a success. The effect also ends on any creature targeted by a _Lesser Restoration_ spell.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dwarven Plate",
    "type": "Armor (Half Plate Armor or Plate Armor)",
    "rarity": "Very Rare",
    "attune": "",
    "text": "While wearing this armor, you gain a +2 bonus to Armor Class. In addition, if an effect moves you against your will along the ground, you can take a Reaction to reduce the distance you are moved by up to 10 feet.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Dwarven Thrower",
    "type": "Weapon (Warhammer)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement by a Dwarf or a Creature Attuned to a Belt of Dwarvenkind",
    "text": "You gain a +3 bonus to attack rolls and damage rolls made with this magic weapon. It has the Thrown property with a normal range of 20 feet and a long range of 60 feet. When you hit with a ranged attack using this weapon, it deals an extra 1d8 Force damage, or an extra 2d8 Force damage if the target is a Giant. Immediately after hitting or missing, the weapon flies back to your hand.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Efficient Quiver",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "Each of the quiver's three compartments connects to an extradimensional space that allows the quiver to hold numerous items while never weighing more than 2 pounds. The shortest compartment can hold up to 60 Arrows, Bolts, or similar objects. The midsize compartment holds up to 18 Javelins or similar objects. The longest compartment holds up to 6 long objects, such as bows, Quarterstaffs, or Spears.\n\nYou can draw any item the quiver contains as if doing so from a regular quiver or scabbard.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Efreeti Bottle",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "When you take a Magic action to remove the stopper of this painted brass bottle, a cloud of thick smoke flows out of it. At the end of your turn, the smoke disappears with a flash of harmless fire, and an **Efreeti** appears in an unoccupied space within 30 feet of you.\n\nThe first time the bottle is opened, the GM rolls on the following table to determine what happens.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d10</th>\n      <th>Effect</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1</td>\n      <td>The efreeti attacks you. After fighting for 5 rounds, the efreeti disappears, and the bottle loses its magic.</td>\n    </tr>\n    <tr>\n      <td>2–9</td>\n      <td>The efreeti understands your languages and obeys your commands for 1 hour, after which it returns to the bottle, and a new stopper contains it. The stopper can't be removed for 24 hours. The next two times the bottle is opened, the same effect occurs. If the bottle is opened a fourth time, the efreeti escapes and disappears, and the bottle loses its magic.</td>\n    </tr>\n    <tr>\n      <td>10</td>\n      <td>The efreeti understands your languages and can cast Wish once for you. It disappears when it grants the wish or after 1 hour, and the bottle loses its magic.</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Elemental Gem",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This gem contains a mote of elemental energy. When you take a Utilize action to break the gem, an elemental is summoned (see \"Monsters\" for its stat block), and the gem ceases to be magical. The elemental appears in an unoccupied space as close to the broken gem as possible, understands your languages, obeys your commands, and takes its turn immediately after you on your Initiative count. The elemental disappears after 1 hour, when it dies, or when you dismiss it as a Bonus Action. The type of gem determines the elemental, as shown in the following table.\n\n<table>\n  <thead>\n    <tr>\n      <th>Gem</th>\n      <th>Summoned Elemental</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Blue sapphire</td>\n      <td>Air Elemental</td>\n    </tr>\n    <tr>\n      <td>Emerald</td>\n      <td>Water Elemental</td>\n    </tr>\n    <tr>\n      <td>Red corundum</td>\n      <td>Fire Elemental</td>\n    </tr>\n    <tr>\n      <td>Yellow diamond</td>\n      <td>Earth Elemental</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Elixir of Health",
    "type": "Potion",
    "rarity": "Rare",
    "attune": "",
    "text": "When you drink this potion, you are cured of all magical contagions. In addition, the following conditions end on you: Blinded, Deafened, Paralyzed, and Poisoned.\n\nThe clear, red liquid has tiny bubbles of light in it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Elven Chain",
    "type": "Armor (Chain Mail or Chain Shirt)",
    "rarity": "Rare",
    "attune": "",
    "text": "You gain a +1 bonus to Armor Class while you wear this armor. You are considered trained with this armor even if you lack training with Medium or Heavy armor.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Energy Bow",
    "type": "Weapon (Longbow or Shortbow)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon, which has no string. Each time you pull your arm back in a firing motion, a magical arrow made of golden energy appears nocked and ready to fire. An arrow produced by this weapon deals Force damage instead of Piercing damage on a hit, and it disappears after it hits or misses its target. Until it disappears, the arrow emits Bright Light in a 20-foot radius and Dim Light for an additional 20 feet.\n\nThis weapon has the following additional properties.\n\n_Arrow of Restraint._ Whenever you use this weapon to make a ranged attack against a creature, you can try to restrain the target instead of dealing damage to it. If the arrow hits, the target must succeed on a DC 15 Strength saving throw or have the Restrained condition for 1 minute. As an action, a creature Restrained by an arrow can make a DC 20 Strength (Athletics) check to try to break the restraint, ending the effect on itself on a successful check.\n\n_Arrow of Transport._ As a Magic action, you can fire one energy arrow from this weapon at a target you can see within 60 feet of yourself. The target can be either a willing Medium or smaller creature or an object that isn't being worn or carried, provided the object is small enough to fit inside a 5-foot Cube. The arrow teleports the target to an unoccupied space you can see within 10 feet of you.\n\n_Energy Ladder._ As a Magic action, you can loose a flurry of energy arrows from this weapon at a wall up to 60 feet away from yourself. The arrows become glowing rungs that stick out of the wall, forming a magical ladder up to 60 feet long on the wall. This ladder lasts for 1 minute before disappearing.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Eversmoking Bottle",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "As a Magic action, you can open or close this bottle. Opening the bottle causes thick smoke to billow out, forming a cloud that fills a 60-foot Emanation originating from the bottle. The area within the smoke is Heavily Obscured.\n\nEach minute the bottle remains open, the size of the Emanation increases by 10 feet until it reaches its maximum size of 120 feet.\nClosing the bottle causes the cloud to become fixed in place until it disperses after 10 minutes. A strong wind (such as that created by the _Gust of Wind_ spell) disperses the cloud after 1 minute.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Eyes of Charming",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "These crystal lenses fit over the eyes. They have 3 charges. While wearing them, you can expend 1 or more charges to cast _Charm Person_ (save DC 13). For 1 charge, you cast the level 1 version of the spell. You increase the spell's level by one for each additional charge you expend. The lenses regain all expended charges daily at dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Eyes of Minute Seeing",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "These crystal lenses fit over the eyes. While wearing them, your vision improves significantly out to a range of 1 foot, granting you Darkvision within that range and Advantage on Intelligence (Investigation) checks made to examine something within that range.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Eyes of the Eagle",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "These crystal lenses fit over the eyes. While wearing them, you have Advantage on Wisdom (Perception) checks that rely on sight. In conditions of clear visibility, you can make out details of even extremely distant creatures and objects as small as 2 feet across.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Feather Token",
    "type": "Wondrous Item",
    "rarity": "Rarity Varies",
    "attune": "",
    "text": "This object looks like a feather. Different types of feather tokens exist, each with a different single-use effect. The GM chooses the kind of token or determines it randomly by rolling on the Feather Tokens table. The type of token determines its rarity.\n\n_Anchor (Uncommon)._ You can take a Magic action to touch the token to a boat or ship. For the next 24 hours, the vessel can't be moved by any means. Touching the token to the vessel again ends the effect. When the effect ends, the token disappears.\n\n_Bird (Rare)._ You can take a Magic action to toss the token 5 feet into the air. The token disappears and an enormous, multicolored bird takes its place. The bird has the statistics of a **Roc**, but it can't attack. It obeys your simple commands and can carry up to 500 pounds while flying at its maximum speed (16 miles per hour for a maximum of 144 miles per day, with a 1-hour rest for every 3 hours of flying) or 1,000 pounds at half that speed. The bird disappears after flying its maximum distance for a day or if it drops to 0 Hit Points. You can dismiss the bird as a Magic action.\n\n_Fan (Uncommon)._ If you are on a boat or ship, you can take a Magic action to toss the token up to 10 feet in the air. The token disappears, and a giant flapping fan takes its place. The fan floats and creates a strong wind. This wind can fill the sails of one ship, increasing its speed by 5 miles per hour for 8 hours. You can dismiss the fan as a Magic action.\n\n_Swan Boat (Rare)._ You can take a Magic action to touch the token to a body of water at least 60 feet in diameter. The token disappears, and a 50-foot-long, 20-foot-wide boat shaped like a swan takes its place. The boat is self-propelled and moves across water at a speed of 6 miles per hour. You can take a Magic action while on the boat to command it to move or to turn up to 90 degrees. The boat remains for 24 hours and then disappears. You can dismiss the boat as a Magic action.\n\n_Tree (Uncommon)._ You must be outdoors to use this token. You can take a Magic action to touch it to an unoccupied space on the ground. The token disappears, and in its place a nonmagical oak tree springs into existence. The tree is 60 feet tall and has a 5-foot-diameter trunk, and its branches at the top spread out in a 20-foot radius.\n\n_Whip (Rare)._ You can take a Magic action to throw the token to a point within 10 feet of yourself. The token disappears, and a floating whip takes its place. You can then take a Bonus Action to make a melee spell attack against a creature within 10 feet of the whip, with an attack bonus of +9. On a hit, the target takes 1d6 + 5 Force damage.\n\nAs a Bonus Action, you can direct the whip to fly up to 20 feet and repeat the attack against a creature within 10 feet of the whip. The whip disappears after 1 hour, when you take a Magic action to dismiss it, or when you die or have the Incapacitated condition.\n\n**Feather Tokens**\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Token</th>\n      <th>Rarity</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–20</td>\n      <td>Anchor</td>\n      <td>Uncommon</td>\n    </tr>\n    <tr>\n      <td>21–35</td>\n      <td>Bird</td>\n      <td>Rare</td>\n    </tr>\n    <tr>\n      <td>36–50</td>\n      <td>Fan</td>\n      <td>Uncommon</td>\n    </tr>\n    <tr>\n      <td>51–65</td>\n      <td>Swan boat</td>\n      <td>Rare</td>\n    </tr>\n    <tr>\n      <td>66–90</td>\n      <td>Tree</td>\n      <td>Uncommon</td>\n    </tr>\n    <tr>\n      <td>91–00</td>\n      <td>Whip</td>\n      <td>Rare</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Figurine of Wondrous Power",
    "type": "Wondrous Item",
    "rarity": "Rarity Varies",
    "attune": "",
    "text": "A _Figurine of Wondrous Power_ is a statuette small enough to fit in a pocket. If you take a Magic action to throw the figurine to a point on the ground within 60 feet of yourself, the figurine becomes a living creature specified in the figurine's description below. If the space where the creature would appear is occupied by other creatures or objects, or\nif there isn't enough space for the creature, the figurine doesn't become a creature.\n\nThe creature is Friendly to you and your allies. It understands your languages, obeys your commands, and takes its turn immediately after you on your Initiative count. If you issue no commands, the creature defends itself but takes no other actions.\n\nThe creature exists for a duration specific to each figurine. At the end of the duration, the creature reverts to its figurine form. It reverts to a figurine early if its creature form drops to 0 Hit Points or if you take a Magic action while touching the creature to make it revert to figurine form. When the creature becomes a figurine again, its property can't be used again until a certain amount of time has passed, as specified in the figurine's description.\n\n**Bronze Griffon (Rare).** This bronze statuette is of a griffon rampant. It can become a **Griffon** for up to 6 hours. Once it has been used, it can't be used again until 5 days have passed.\n\n**Ebony Fly (Rare).** This ebony statuette, carved in the likeness of a horsefly, can become a **Giant Fly** (see the accompanying stat block) for up to 12 hours and can be ridden as a mount. Once it has been used, it can't be used again until 2 days have passed.\n\n#### Giant Fly\n\n_Large Beast, Unaligned_\n\n**AC** 11 **Initiative** +1 (11)\n**HP** 19 (3d10 + 3)\n**Speed** 30 ft., Fly 60 ft.\n\n<table>\n  <thead>\n    <tr>\n      <th></th>\n      <th>MOD</th>\n      <th>SAVE</th>\n      <th></th>\n      <th>MOD</th>\n      <th>SAVE</th>\n      <th></th>\n      <th>MOD</th>\n      <th>SAVE</th>\n      <th colspan=\"3\"></th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>STR</td>\n      <td>14</td>\n      <td>+2</td>\n      <td>+2</td>\n      <td>DEX</td>\n      <td>13</td>\n      <td>+1</td>\n      <td>+1</td>\n      <td>CON</td>\n      <td>13</td>\n      <td>+1</td>\n      <td>+1</td>\n    </tr>\n    <tr>\n      <td>INT</td>\n      <td>2</td>\n      <td>−4</td>\n      <td>−4</td>\n      <td>WIS</td>\n      <td>10</td>\n      <td>+0</td>\n      <td>+0</td>\n      <td>CHA</td>\n      <td>3</td>\n      <td>−4</td>\n      <td>−4</td>\n    </tr>\n  </tbody>\n</table>\n\n**Senses** Darkvision 60 ft., Passive Perception 10\n**Languages** None\n**CR** 0 (XP 0; PB +2)\n\n**Golden Lions (Rare).** These gold statuettes of lions are always created in pairs. You can use one figurine or both simultaneously. Each can become a **Lion** for up to 1 hour. Once a lion has been used, it can't be used again until 7 days have passed.\n\n**Ivory Goats (Rare).** These ivory statuettes of goats are always created in sets of three. Each goat looks unique and functions differently from the others. Their properties are as follows:\n\n**Goat of Terror.** This figurine can become a **Giant Goat** for up to 3 hours. The goat can't attack, but you can (harmlessly) remove its horns and use them as weapons. One horn becomes a _+1 Lance_, and the other becomes a _+2 Longsword_. Removing a horn requires a Magic action, and the weapons disappear and the horns return when the goat reverts to figurine form. While you ride the goat, any Hostile creature that starts its turn within\n\na 30-foot Emanation originating from the goat must succeed on a DC 15 Wisdom saving throw or have the Frightened condition for 1 minute, until you are no longer riding the goat, or until the goat reverts to figurine form. The Frightened creature repeats the save at the end of each of its turns, ending the effect on itself on a success. Once it succeeds on the save, a creature is immune to this effect for the next 24 hours. Once the figurine has been used, it can't be used again until 15 days have passed.\n\n**Goat of Traveling.** This figurine can become a Large goat with the same statistics as a **Riding Horse**. It has 24 charges, and each hour or portion thereof it spends in goat form costs 1 charge. While it has charges, you can use it as often as you wish. When it runs out of charges, it reverts to a figurine and can't be used again until 7 days have passed, when it regains all expended charges.\n\n**Goat of Travail.** This figurine can become a Giant **Goat** for up to 3 hours. Once it has been used, it can't be used again until 30 days have passed.\n\n**Marble Elephant (Rare).** This marble statuette resembles a trumpeting elephant. It can become an **Elephant** for up to 24 hours. Once it has been used, it can't be used again until 7 days have passed.\n\n**Obsidian Steed (Very Rare).** This polished obsidian horse can become a **Nightmare** for up to 24 hours. The nightmare fights only to defend itself. Once it has been used, it can't be used again until 5 days have passed.\n\nThe figurine has a 10 percent chance each time you use it to ignore your orders, including a command to revert to figurine form. If you mount the nightmare while it is ignoring your orders, you and the nightmare are instantly transported to a random location on the plane of Hades, where the nightmare reverts to figurine form.\n\n**Onyx Dog (Rare).** This onyx statuette of a dog can become a **Mastiff** for up to 6 hours. The mastiff has an Intelligence of 8 and can speak Common. It also has Blindsight with a range of 60 feet. Once it has been used, it can't be used again until 7 days have passed.\n\n**Serpentine Owl (Rare).** This serpentine statuette of an owl can become a **Giant Owl** for up to 8 hours. The owl can communicate telepathically with you at any range if you and it are on the same plane of existence. Once it has been used, it can't be used again until 2 days have passed.\n\n**Silver Raven (Uncommon).** This silver statuette of a raven can become a **Raven** for up to 12 hours. Once it has been used, it can't be used again until 2 days have passed. While in raven form, the figurine grants you the ability to cast _Animal Messenger_ on it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Flame Tongue",
    "type": "Weapon (Any Melee Weapon)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While holding this magic weapon, you can take a Bonus Action and use a command word to cause flames to engulf the damage-dealing part of the weapon. These flames shed Bright Light in a 40-foot radius and Dim Light for an additional 40 feet. While the weapon is ablaze, it deals an extra 2d6 Fire damage on a hit. The flames last until you take a Bonus Action to issue the command again or until you drop, stow, or sheathe the weapon.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Folding Boat",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This object appears as a wooden box that measures 12 inches long, 6 inches wide, and 6 inches deep. It weighs 4 pounds and floats. It can be opened to store items inside. This item also has three command words, each requiring a Magic action to use:\n\n**First Command Word.** The box unfolds into a Rowboat.\n\n**Second Command Word.** The box unfolds into a Keelboat.\n\n**Third Command Word.** The _Folding Boat_ folds back into a box if no creatures are aboard. Any objects in the vessel that can't fit inside the box remain outside the box as it folds. Any objects in the vessel that can fit inside the box do so.\n\nWhen the box becomes a vessel, its weight becomes that of a normal vessel its size, and anything that was stored in the box remains in the boat.\n\nStatistics for the Rowboat and Keelboat appear in \"Equipment.\" If either vessel is reduced to 0 Hit Points, the _Folding Boat_ is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Frost Brand",
    "type": "Weapon (Glaive, Greatsword, Longsword, Rapier, Scimitar, or Shortsword)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "When you hit with an attack roll using this magic weapon, the target takes an extra 1d6 Cold damage. In addition, while you hold the weapon, you have Resistance to Fire damage.\n\nIn freezing temperatures, the weapon sheds Bright Light in a 10-foot radius and Dim Light for an additional 10 feet.\n\nWhen you draw this weapon, you can extinguish all nonmagical flames within 30 feet of yourself. Once used, this property can't be used again for 1 hour.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Gauntlets of Ogre Power",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "Your Strength is 19 while you wear these gauntlets. They have no effect on you if your Strength is 19 or higher without them.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Gem of Brightness",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This prism has 50 charges. While you are holding it, you can take a Magic action and use one of three command words to cause one of the following effects:\n\n**First Command Word.** The gem sheds Bright Light in a 30-foot radius and Dim Light for an additional 30 feet. This effect doesn't expend a charge. It lasts until you take a Bonus Action to repeat the command word or until you use another function of the gem.\n\n**Second Command Word.** You expend 1 charge and cause the gem to fire a brilliant beam of light at one creature you can see within 60 feet of yourself. The creature must succeed on a DC 15 Constitution saving throw or have the Blinded condition for 1 minute. The creature repeats the save at the end of each of its turns, ending the effect on itself on a success.\n\n**Third Command Word.** You expend 5 charges and cause the gem to flare with intense light in a 30-foot Cone. Each creature in the Cone makes a saving throw as if struck by the beam created with the second command word.\n\nWhen all of the gem's charges are expended, the gem becomes a nonmagical jewel worth 50 GP.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Gem of Seeing",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This gem has 3 charges. As a Magic action, you can expend 1 charge. For the next 10 minutes, you have Truesight out to 120 feet when you peer through the gem.\n\nThe gem regains 1d3 expended charges daily at dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Giant Slayer",
    "type": "Weapon (Any Simple or Martial)",
    "rarity": "Rare",
    "attune": "",
    "text": "You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon.\n\nWhen you hit a Giant with this weapon, the Giant takes an extra 2d6 damage of the weapon's type and must succeed on a DC 15 Strength saving throw or have the Prone condition.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Glamoured Studded Leather",
    "type": "Armor (Studded Leather Armor)",
    "rarity": "Rare",
    "attune": "",
    "text": "While wearing this armor, you gain a +1 bonus to Armor Class. You can also take a Bonus Action to\ncause the armor to assume the appearance of a normal set of clothing or some other kind of armor. You decide what it looks like—including color, style, and accessories—but the armor retains its normal bulk and weight. The illusory appearance lasts until you use this property again or doff the armor.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Gloves of Missile Snaring",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "If you're hit by an attack roll made with a Ranged or Thrown weapon while wearing these gloves, you can take a Reaction to reduce the damage by 1d10 plus your Dexterity modifier if you have a free hand. If you reduce the damage to 0, you can catch the ammunition or weapon if it is small enough for you to hold in that hand.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Gloves of Swimming and Climbing",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing these gloves, you have a Climb Speed and a Swim Speed equal to your Speed, and you gain a +5 bonus to Strength (Athletics) checks made to climb or swim.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Gloves of Thievery",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "These gloves are imperceptible while worn. While wearing them, you gain a +5 bonus to Dexterity (Sleight of Hand) checks.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Goggles of Night",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "While wearing these dark lenses, you have Darkvision out to 60 feet. If you already have Darkvision, wearing the goggles increases its range by 60 feet.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Hammer of Thunderbolts",
    "type": "Weapon (Maul or Warhammer)",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon.\n\nThe weapon has 5 charges. You can expend 1 charge and make a ranged attack with the weapon, hurling it as if it had the Thrown property with a normal range of 20 feet and a long range of 60 feet. If the attack hits, the weapon unleashes a thunderclap audible out to 300 feet. The target and every creature within 30 feet of it other than you must succeed on a DC 17 Constitution saving throw or have the Stunned condition until the end of your next turn. Immediately after hitting or missing, the weapon flies back to your hand. The weapon regains 1d4 + 1 expended charges daily at dawn.\n\n_Giant's Bane._ While you are attuned to the weapon and wearing either a _Belt of Giant Strength_ or _Gauntlets of Ogre Power_ to which you are also attuned, you gain the following benefits:\n\n_Giants' Bane._ When you roll a 20 on the d20 for an attack roll made with this weapon against a Giant, the creature must succeed on a DC 17 Constitution saving throw or die.\n\n_Might of Giants._ The Strength score bestowed by your _Belt of Giant Strength_ or _Gauntlets of Ogre Power_ increases by 4, to a maximum of 30.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Handy Haversack",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This backpack has a central pouch and two side pouches, each of which is an extradimensional space. Each side pouch can hold up to 200 pounds of material, not exceeding a volume of 25 cubic feet. The central pouch can hold up to 500 pounds of material, not exceeding a volume of 64 cubic feet. The haversack always weighs 5 pounds, regardless of its contents.\n\nRetrieving an item from the haversack requires a Utilize action or a Bonus Action (your choice). When you reach into the haversack for a specific item, the item is always magically on top.\n\nIf any of its pouches is overloaded, pierced, or torn, the haversack ruptures and is destroyed. If the haversack is destroyed, its contents are lost forever, although an Artifact always turns up again somewhere. If the haversack is turned inside out, its contents spill forth unharmed, and the haversack must be put right before it can be used again.\n\nEach pouch of the haversack holds enough air for 10 minutes of breathing, divided by the number of breathing creatures inside.\n\nPlacing the haversack inside an extradimensional space created by a _Bag of Holding_, _Portable Hole_, or similar item instantly destroys both items and opens a gate to the Astral Plane. The gate originates where the one item was placed inside the other. Any creature within 10 feet of the gate and not behind Total Cover is sucked through it and deposited in a random location on the Astral Plane. The gate then closes. The gate is one-way only and can't be reopened.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Hat of Disguise",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this hat, you can cast the _Disguise Self_ spell. The spell ends if the hat is removed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Hat of Many Spells",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "Requires Attunement by a Wizard",
    "text": "This pointed hat has the following properties.\n\n_Spellcasting Focus._ While holding the hat, you can use it as a Spellcasting Focus for your Wizard spells. Any spell you cast using the hat gains a special Somatic component: you must reach into the hat and \"pull\" the spell out of it.\n_Unknown Spell._ While holding the hat, you can try to cast a level 1+ spell you don't know. The spell must be on the Wizard spell list, it must be of a level you can cast, and it can't have Material components costing more than 1,000 GP. Once you decide on the spell, you must expend a spell slot of the spell's level. Then, to determine whether you cast the spell, make an Intelligence (Arcana) check (DC 10 plus the spell's level). On a successful check, you cast the spell using its normal casting time, and you can't use this property again until you finish a Short or Long Rest. On a failed check, you fail to cast the spell and a random effect occurs instead, determined by rolling on the following table.\n\nAny spell you cast from the hat uses your spell save DC and spell attack bonus.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Effect</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–50</td>\n      <td>You cast a random spell determined by rolling 1d10: on a **1**, *Enlarge/Reduce* (enlarge effect); on a **2**, *Enlarge/Reduce* (reduce effect); on a **3**, *Faerie Fire*; on a **4**, *Fireball*; on a **5**, *Gust of Wind*; on a **6**, *Invisibility* (cast on yourself); on a **7**, *Lightning Bolt*; on an **8**, *Phantasmal Force*; on a **9**, *Polymorph*; on a **10**, *Stinking Cloud*.</td>\n    </tr>\n    <tr>\n      <td>51–55</td>\n      <td>You have the Stunned condition until the end of your next turn, believing something awesome just happened.</td>\n    </tr>\n    <tr>\n      <td>56–60</td>\n      <td>A harmless swarm of butterflies fills a 10-foot Cube within 30 feet of yourself. The swarm disperses after 1 minute.</td>\n    </tr>\n    <tr>\n      <td>61–65</td>\n      <td>You pull a nonmagical object out of the hat. Roll 1d4 to determine the object: on a **1**, a vial of Acid; on a **2**, a flask of Alchemist's Fire; on a **3**, a Crowbar; on a **4**, a lit Torch.</td>\n    </tr>\n    <tr>\n      <td>66–70</td>\n      <td>You suffer a bout of magic sickness and have the Poisoned condition for 1 hour.</td>\n    </tr>\n    <tr>\n      <td>71–75</td>\n      <td>You have the Petrified condition until the end of your next turn.</td>\n    </tr>\n    <tr>\n      <td>76–80</td>\n      <td>You pull a nonmagical object out of the hat. Roll 1d4 to determine the object: on a **1**, a Dagger; on a **2**, a Rope with a Grappling Hook tied to one end; on a **3**, a bag of Caltrops; on a **4**, a gem worth 50 GP.</td>\n    </tr>\n    <tr>\n      <td>81–85</td>\n      <td>A creature appears in an unoccupied space as close to you as possible. The creature isn't under your control and acts as it normally would, and it disappears after 1 hour or when it drops to 0 Hit Points. Roll 1d4 to determine the creature: on a **1**, a **Camel**; on a **2**, a **Constrictor Snake**; on a **3**, an **Elephant**; on a **4**, a **Mule**.</td>\n    </tr>\n    <tr>\n      <td>86–90</td>\n      <td>A Hostile **Swarm of Bats** flies out of the hat, occupies your space, and attacks you.</td>\n    </tr>\n    <tr>\n      <td>91–95</td>\n      <td>A vertical, 10-foot-diameter, two-way portal to another plane of existence opens in an unoccupied space within 30 feet of you and remains open until the end of your next turn. The GM determines where it leads.</td>\n    </tr>\n    <tr>\n      <td>96–00</td>\n      <td>You pull a magic item out of the hat. Roll 1d6 to determine the item's rarity: on a **1–3**, Common; on a **4–5**, Uncommon; on a **6**, Rare. The GM chooses the item, which disappears after 1 hour if it's not consumed or destroyed before then.</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Headband of Intellect",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "Your Intelligence is 19 while you wear this headband. It has no effect on you if your Intelligence is 19 or higher without it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Helm of Brilliance",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "This helm is set with 1d10 diamonds, 2d10 rubies, 3d10 fire opals, and 4d10 opals. Any gem pried from the helm crumbles to dust. When all the gems are removed or destroyed, the helm loses its magic.\n\nYou gain the following benefits while wearing the helm.\n\n_Diamond Light._ As long as it has at least one diamond, the helm emits a 30-foot Emanation. When at least one Undead is within that area, the Emanation is filled with Dim Light. Any Undead that starts its turn in that area takes 1d6 Radiant damage.\n\n_Fire Opal Flames._ As long as the helm has at least one fire opal, you can take a Magic action to cause one weapon you are holding to burst into flames. The flames emit Bright Light in a 10-foot radius and Dim Light for an additional 10 feet. The flames are harmless to you and the weapon. When you hit with an attack using the blazing weapon, the target takes an extra 1d6 Fire damage. The flames last until you take a Bonus Action to extinguish them or until you drop or stow the weapon.\n\n_Ruby Resistance._ As long as the helm has at least one ruby, you have Resistance to Fire damage.\n\n_Spells._ You can cast one of the following spells (save DC 18), using one of the helm's gems of the specified type as a component: _Daylight_ (opal), _Fireball_ (fire opal), _Prismatic Spray_ (diamond), or _Wall of Fire_ (ruby). The gem is destroyed when the spell is cast and disappears from the helm.\n\n_Taking Fire Damage._ Roll 1d20 if you are wearing the helm and take Fire damage as a result of failing\na saving throw against a spell. On a roll of 1, the helm emits beams of light from its remaining gems and is then destroyed. Each creature within a 60-foot Emanation originating from you must succeed on a DC 17 Dexterity saving throw or be struck by a beam, taking Radiant damage equal to the number of gems in the helm.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Helm of Comprehending Languages",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "While wearing this helm, you can cast _Comprehend Languages_ from it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Helm of Telepathy",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this helm, you have telepathy with a range of 30 feet, and you can cast _Detect Thoughts_ or _Suggestion_ (save DC 13) from the helm. Once either spell is cast from the helm, that spell can't be cast from it again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Helm of Teleportation",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This helm has 3 charges. While wearing it, you can expend 1 charge to cast _Teleport_ from it. The helm regains 1d3 expended charges daily at dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Holy Avenger",
    "type": "Weapon (Any Simple or Martial)",
    "rarity": "Legendary",
    "attune": "Requires Attunement by a Paladin",
    "text": "You gain a +3 bonus to attack rolls and damage rolls made with this magic weapon. When you hit a Fiend or an Undead with it, that creature takes an extra 2d10 Radiant damage.\n\nWhile you hold the drawn weapon, it creates a 10-foot Emanation originating from you. You and all creatures Friendly to you in the Emanation have Advantage on saving throws against spells and other magical effects. If you have 17 or more levels in the Paladin class, the size of the Emanation increases to 30 feet.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Horn of Blasting",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "You can take a Magic action to blow the horn, which emits a thunderous blast in a 30-foot Cone that is audible out to 600 feet. Each creature in the Cone makes a DC 15 Constitution saving throw. On a failed save, a creature takes 5d8 Thunder damage and has the Deafened condition for 1 minute. On a successful save, a creature takes half as much damage only. Glass or crystal objects in the Cone that aren't being worn or carried take 10d8 Thunder damage.\n\nEach use of the horn's magic has a 20 percent chance of causing the horn to explode. The explosion deals 10d6 Force damage to the user and destroys the horn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Horn of Valhalla",
    "type": "Wondrous Item",
    "rarity": "Rare (Silver or Brass), Very Rare (Bronze), or Legendary (Iron)",
    "attune": "",
    "text": "You can take a Magic action to blow this horn. In response, warrior spirits from the plane of Ysgard appear in unoccupied spaces within 60 feet of you. Each spirit uses the **Berserker** stat block and returns to Ysgard after 1 hour or when it drops to 0 Hit Points. The spirits look like living, breathing warriors, and they have Immunity to the Charmed and Frightened conditions. Once you use the horn, it can't be used again until 7 days have passed.\n\nFour types of _Horn of Valhalla_ are known to exist, each made of a different metal. The horn's type determines how many spirits it summons, as well as the requirement for its use. The GM chooses the horn's type or determines it randomly by rolling on the following table.\n\nIf you blow the horn without meeting its requirement, the summoned spirits attack you. If you meet the requirement, they are Friendly to you and your allies and follow your commands.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Horn Type</th>\n      <th>Spirits</th>\n      <th>Requirement</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–40</td>\n      <td>Silver</td>\n      <td>2</td>\n      <td>None</td>\n    </tr>\n    <tr>\n      <td>41–75</td>\n      <td>Brass</td>\n      <td>3</td>\n      <td>Proficiency with all Simple weapons</td>\n    </tr>\n    <tr>\n      <td>76–90</td>\n      <td>Bronze</td>\n      <td>4</td>\n      <td>Training with all Medium armor</td>\n    </tr>\n    <tr>\n      <td>91–00</td>\n      <td>Iron</td>\n      <td>5</td>\n      <td>Proficiency with all Martial weapons</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Horseshoes of a Zephyr",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "These horseshoes come in a set of four. As a Magic action, you can touch one of the horseshoes to the hoof of a horse or similar creature, whereupon the horseshoe affixes itself to the hoof. Removing a horseshoe also takes a Magic action.\n\nWhile all four shoes are affixed to the hooves of a horse or similar creature, they allow the creature to move normally while floating 4 inches above a surface. This effect means the creature can cross or stand above nonsolid or unstable surfaces, such as water or lava. The creature leaves no tracks and ignores Difficult Terrain. In addition, the creature can travel for up to 12 hours a day without gaining Exhaustion levels from extended travel.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Horseshoes of Speed",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "These horseshoes come in a set of four. As a Magic action, you can touch one of the horseshoes to the hoof of a horse or similar creature, whereupon the horseshoe affixes itself to the hoof. Removing a horseshoe also takes a Magic action.\n\nWhile all four horseshoes are attached to the same creature, its Speed is increased by 30 feet.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Immovable Rod",
    "type": "Rod",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This iron rod has a button on one end. You can take a Utilize action to press the button, which causes the rod to become magically fixed in place. Until you or another creature takes a Utilize action to push the button again, the rod doesn't move, even if it defies gravity. The rod can hold up to 8,000 pounds of weight. More weight causes the rod to deactivate and fall. A creature can take a Utilize action to make a DC 30 Strength (Athletics) check, moving the fixed rod up to 10 feet on a successful check.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Instant Fortress",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "As a Magic action, you can place this 1-inch adamantine statuette on the ground and, using a command word, cause it to grow rapidly into a square adamantine tower. Repeating the command word causes the tower to revert to statuette form, which works only if the tower is empty. Each creature in the area where the tower appears is pushed to an unoccupied space outside but next to the tower. Objects in the area that aren't being worn or carried are also pushed clear of the tower.\n\nThe tower is 20 feet on a side and 30 feet high, with arrow slits on all sides and a battlement atop it. Its interior is divided into two floors, with a ladder, staircase, or ramp (your choice) connecting them. This ladder, staircase, or ramp ends at a trapdoor leading to the roof. When created, the tower has a single door at ground level on the side facing you. The door opens only at your command, which you can issue as a Bonus Action. It is immune to the _Knock_ spell and similar magic.\n\nMagic prevents the tower from being tipped over. The roof, the door, and the walls each have AC 20; HP 100; Immunity to Bludgeoning, Piercing, and Slashing damage except that which is dealt by siege equipment; and Resistance to all other damage.\n\nShrinking the tower back down to statuette form doesn't repair damage to the tower. Only a _Wish_ spell can repair the tower (this use of the spell counts as replicating a spell of level 8 or lower). Each casting of _Wish_ causes the tower to regain all its Hit Points.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ioun Stone",
    "type": "Wondrous Item",
    "rarity": "Rarity Varies",
    "attune": "Requires Attunement",
    "text": "Roughly marble sized, _Ioun Stones_ are named after Ioun, a god of knowledge and prophecy revered on some worlds. Many types of _Ioun Stones_ exist, each type a distinct combination of shape and color.\n\nWhen you take a Magic action to toss an _Ioun Stone_ into the air, the stone orbits your head at a distance of 1d3 feet, conferring its benefit to you while doing so. You can have up to three _Ioun Stones_ orbiting your head at the same time.\n\nEach _Ioun Stone_ orbiting your head is considered to be an object you are wearing. The orbiting stone avoids contact with other creatures and objects, adjusting its orbit to avoid collisions and thwarting all attempts by other creatures to attack or snatch it.\n\nAs a Utilize action, you can seize and stow any number of _Ioun Stones_ orbiting your head. If your Attunement to an _Ioun Stone_ ends while it's orbiting your head, the stone falls as though you had dropped it.\n\nThe type of stone determines its rarity and effects.\n\n_Absorption (Very Rare)_. While this pale lavender ellipsoid orbits your head, you can take a Reaction to cancel a spell of level 4 or lower cast by a creature you can see. A canceled spell has no effect, and any resources used to cast it are wasted. Once the stone has canceled 20 levels of spells, it burns out, turns dull gray, and loses its magic.\n\n_Agility (Very Rare)_. Your Dexterity increases by 2, to a maximum of 20, while this deep-red sphere orbits your head.\n\n_Awareness (Rare)_. While this dark-blue rhomboid orbits your head, you have Advantage on Initiative rolls and Wisdom (Perception) checks.\n\n_Fortitude (Very Rare)_. Your Constitution increases by 2, to a maximum of 20, while this pink rhomboid orbits your head.\n\n_Greater Absorption (Legendary)_. While this marbled lavender and green ellipsoid orbits your head, you can take a Reaction to cancel a spell of level 8 or lower cast by a creature you can see. A canceled spell has no effect, and any resources used to cast it are wasted. Once the stone has canceled 20 levels of spells, it burns out, turns dull gray, and loses its magic.\n\n_Insight (Very Rare)_. Your Wisdom increases by 2, to a maximum of 20, while this incandescent blue sphere orbits your head.\n\n_Intellect (Very Rare)_. Your Intelligence increases by 2, to a maximum of 20, while this marbled scarlet and blue sphere orbits your head.\n\n_Leadership (Very Rare)_. Your Charisma increases by 2, to a maximum of 20, while this marbled pink and green sphere orbits your head.\n_Mastery (Legendary)._ Your Proficiency Bonus increases by 1 while this pale green prism orbits your head.\n\n_Protection (Rare)._ You gain a +1 bonus to Armor Class while this dusty-rose prism orbits your head.\n\n_Regeneration (Legendary)._ You regain 15 Hit Points at the end of each hour this pearly white spindle orbits your head if you have at least 1 Hit Point.\n\n_Reserve (Rare)._ This vibrant purple prism stores spells cast into it, holding them until you use them. The stone can store up to 4 levels of spells at a time. When found, it contains 1d4 levels of stored spells chosen by the GM.\n\nAny creature can cast a spell of level 1 through 4 into the stone by touching it as the spell is cast. The spell has no effect, other than to be stored in the stone. If the stone can't hold the spell, the spell is expended without effect. The level of the slot used to cast the spell determines how much space it uses.\n\nWhile this stone orbits your head, you can cast any spell stored in it. The spell uses the slot level, spell save DC, spell attack bonus, and spellcasting ability of the original caster but is otherwise treated as if you cast the spell. The spell cast from the stone is no longer stored in it, freeing up space.\n\n_Strength (Very Rare)._ Your Strength increases by 2, to a maximum of 20, while this pale blue rhomboid orbits your head.\n\n_Sustenance (Rare)._ You don't need to eat or drink while this clear spindle orbits your head.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Iron Bands",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This rusty iron sphere measures 3 inches in diameter and weighs 1 pound. You can take a Magic action to throw the sphere at a Huge or smaller creature you can see within 60 feet of yourself. As the sphere moves through the air, it opens into a tangle of metal bands.\n\nMake a ranged attack roll with an attack bonus equal to your Dexterity modifier plus your Proficiency Bonus. On a hit, the target has the Restrained condition until you take a Bonus Action to issue a command that releases it. Doing so or missing with the attack causes the bands to contract and become a sphere once more.\n\nA creature that can touch the bands, including the one Restrained, can take an action to make a DC 20 Strength (Athletics) check to break the iron bands. On a successful check, the item is destroyed, and the Restrained creature is freed. On a failed check, any further attempts made by that creature automatically fail until 24 hours have elapsed.\n\nOnce the bands are used, they can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Iron Flask",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "",
    "text": "While holding this brass-stoppered iron flask, you can take a Magic action to target a creature that you can see within 60 feet of yourself. If the flask is empty and the target is native to a plane of existence other than the one you're on, the target must succeed on a DC 17 Wisdom saving throw or be trapped in the flask. If the target has been trapped by the flask before, it has Advantage on the save. Once trapped, a creature remains in the flask until released. The flask can hold only one creature at a time. A creature trapped in the flask doesn't age and doesn't need to breathe, eat, or drink.\n\nYou can take a Magic action to remove the flask's stopper and release the creature in the flask. The creature then obeys your commands for 1 hour, understanding those commands even if it doesn't know the language in which the commands are given. If you issue no commands or give the creature a command that is likely to result in its death or imprisonment, it defends itself but otherwise takes no actions. At the end of the duration, the creature acts in accordance with its normal disposition and alignment.\n\nAn _Identify_ spell reveals if the flask contains a creature, but the only way to determine the type of creature is to open the flask. A newly discovered _Iron Flask_ might already contain a creature chosen by the GM.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Javelin of Lightning",
    "type": "Weapon (Javelin)",
    "rarity": "Uncommon",
    "attune": "",
    "text": "Each time you make an attack roll with this magic weapon and hit, you can have it deal Lightning damage instead of Piercing damage.\n\n_Lightning Bolt._ When you throw this weapon at a target no farther than 120 feet from you, you can forgo making a ranged attack roll and instead turn the weapon into a bolt of lightning. This bolt forms a 5-foot-wide Line between you and the target. The target and each other creature in the Line (excluding you) makes a DC 13 Dexterity saving throw, taking 4d6 Lightning damage on a failed save or half as much damage on a successful one. Immediately after dealing this damage, the weapon reappears in your hand. This property can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Lantern of Revealing",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "While lit, this hooded lantern burns for 6 hours on 1 pint of oil, shedding Bright Light in a 30-foot radius and Dim Light for an additional 30 feet. Invisible creatures and objects are visible as long as they are in the lantern's Bright Light. You can take a Utilize\naction to lower the hood, reducing the lantern's light to Dim Light in a 5-foot radius.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Luck Blade",
    "type": "Weapon (Glaive, Greatsword, Longsword, Rapier, Scimitar, Sickle, or Shortsword)",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon. While the weapon is on your person, you also gain a +1 bonus to saving throws.\n\n_Luck._ If the weapon is on your person, you can call on its luck (no action required) to reroll one failed D20 Test if you don't have the Incapacitated condition. You must use the second roll. Once used, this property can't be used again until the next dawn.\n\n_Wish._ The weapon has 1d3 charges. While holding it, you can expend 1 charge and cast _Wish_ from it. Once used, this property can't be used again until the next dawn. The weapon loses this property if it has no charges.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mace of Disruption",
    "type": "Weapon (Mace)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "When you hit a Fiend or an Undead with this magic weapon, that creature takes an extra 2d6 Radiant damage. If the target has 25 Hit Points or fewer after taking this damage, it must succeed on a DC 15 Wisdom saving throw or be destroyed. On a successful save, the creature has the Frightened condition until the end of your next turn.\n\n_Light._ While you hold this weapon, it sheds Bright Light in a 20-foot radius and Dim Light for an additional 20 feet.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mace of Smiting",
    "type": "Weapon (Mace)",
    "rarity": "Rare",
    "attune": "",
    "text": "You gain a +1 bonus to attack rolls and damage rolls made with this magic weapon. The bonus increases to +3 when you use the weapon to attack a Construct.\n\nWhen you roll a 20 on an attack roll made with this weapon, the target takes an extra 7 Bludgeoning damage, or 14 Bludgeoning damage if it's a Construct. If a Construct has 25 Hit Points or fewer after taking this damage, it is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mace of Terror",
    "type": "Weapon (Mace)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This magic weapon has 3 charges and regains 1d3 expended charges daily at dawn. While holding the weapon, you can take a Magic action and expend 1 charge to release a wave of terror from it. Each creature of your choice within 30 feet of you must succeed on a DC 15 Wisdom saving throw or have the Frightened condition for 1 minute. While\n\nFrightened in this way, a creature must spend its turns trying to move as far away from you as it can, and it can't make Opportunity Attacks. For its action, it can use only the Dash action or try to escape from an effect that prevents it from moving. If it has nowhere it can move, the creature can take the Dodge action. At the end of each of its turns, a creature repeats the save, ending the effect on itself on a success.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mantle of Spell Resistance",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "You have Advantage on saving throws against spells while you wear this cloak.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Manual of Bodily Health",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This book contains health and nutrition tips, and its words are charged with magic. If you spend 48 hours over a period of 6 days or fewer studying the book's contents and practicing its guidelines, your Constitution increases by 2, to a maximum of 30. The manual then loses its magic but regains it in a century.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Manual of Gainful Exercise",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This book describes fitness exercises, and its words are charged with magic. If you spend 48 hours over a period of 6 days or fewer studying the book's contents and practicing its guidelines, your Strength increases by 2, to a maximum of 30. The manual then loses its magic but regains it in a century.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Manual of Golems",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This tome contains information and incantations necessary to make a particular type of golem. The GM chooses the type or determines it randomly by rolling on the accompanying table. To decipher and use the manual, you must be a spellcaster with at least two level 5 spell slots. A creature that can't use a _Manual of Golems_ and attempts to read it takes 6d6 Psychic damage.\n\nTo create a golem, you must spend the time shown on the table, working without interruption with the manual at hand and resting no more than 8 hours per day. You must also pay the specified cost to purchase supplies.\n\nOnce you finish creating the golem, the book is consumed in eldritch flames. The golem becomes animate when the ashes of the manual are sprinkled on it. See \"Monsters\" for the golem's stat block. The golem is under your control, and it understands and obeys your commands.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d20</th>\n      <th>Golem</th>\n      <th>Time</th>\n      <th>Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1–5</td>\n      <td>Clay Golem</td>\n      <td>30 days</td>\n      <td>65,000 GP</td>\n    </tr>\n    <tr>\n      <td>6–17</td>\n      <td>Flesh Golem</td>\n      <td>60 days</td>\n      <td>50,000 GP</td>\n    </tr>\n    <tr>\n      <td>18</td>\n      <td>Iron Golem</td>\n      <td>120 days</td>\n      <td>100,000 GP</td>\n    </tr>\n    <tr>\n      <td>19–20</td>\n      <td>Stone Golem</td>\n      <td>90 days</td>\n      <td>80,000 GP</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Manual of Quickness of Action",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This book contains coordination and balance exercises, and its words are charged with magic. If you spend 48 hours over a period of 6 days or fewer studying the book's contents and practicing its guidelines, your Dexterity increases by 2, to a maximum of 30. The manual then loses its magic but regains it in a century.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Marvelous Pigments",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This fine wooden box contains 1d4 pots of pigment and a brush (weighing 1 pound in total).\n\nUsing the brush and expending 1 pot of pigment, you can paint any number of three-dimensional objects and terrain features (such as walls, doors, trees, flowers, weapons, webs, and pits), provided these elements are all confined to a 20-foot Cube. The effort takes 10 minutes (regardless of the number of elements you create), during which time you must remain in the Cube, and requires Concentration. If your Concentration is broken or you leave the Cube before the work is done, all the painted elements vanish, and the pot of pigment is wasted.\n\nWhen the work is done, all the painted objects and terrain features become real. Thus, painting a door on a wall creates an actual door, which can be opened to whatever is beyond. Painting a pit creates a real pit, the entire depth of which must lie within the 20-foot Cube.\n\nNo object created by a pot of pigment can have a value greater than 25 GP, and the total value of all objects created by a pot of pigment can't exceed 500 GP. If you paint objects of greater value (such as a large pile of gold), they look authentic, but close inspection reveals they're made from paste, cookies, or some other worthless material.\n\nIf you paint a form of energy such as fire or lightning, the energy dissipates as soon as you complete the painting, doing no harm.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Medallion of Thoughts",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "The medallion has 5 charges. While wearing it, you can expend 1 charge to cast _Detect Thoughts_ (save DC 13) from it. The medallion regains 1d4 expended charges daily at dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mirror of Life Trapping",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "When this 4-foot-tall, 2-foot-wide mirror is viewed indirectly, its surface shows faint images of creatures. The mirror weighs 50 pounds, and it has AC 11, HP 10, Immunity to Poison and Psychic damage, and Vulnerability to Bludgeoning damage. It shatters and is destroyed when reduced to 0 Hit Points.\n\nIf the mirror is hanging on a vertical surface and you are within 5 feet of it, you can take a Magic action and use a command word to activate it. It remains activated until you take a Magic action and repeat the command word to deactivate it.\n\nAny creature other than you that sees its reflection in the activated mirror while within 30 feet of the mirror must succeed on a DC 15 Charisma saving throw or be trapped, along with anything it is wearing or carrying, in one of the mirror's twelve extradimensional cells. A creature that knows the mirror's nature makes the save with Advantage, and Constructs succeed on the save automatically.\n\nAn extradimensional cell is an infinite expanse filled with thick fog that reduces visibility to 10 feet. Creatures trapped in the mirror's cells don't age, and they don't need to eat, drink, or sleep. A creature trapped within a cell can escape using magic that permits planar travel. Otherwise, the creature is confined to the cell until freed.\n\nIf the mirror traps a creature but its twelve extradimensional cells are already occupied, the mirror frees one trapped creature at random to accommodate the new prisoner. A freed creature appears in an unoccupied space within sight of the mirror but facing away from it. If the mirror is shattered, all creatures it contains are freed and appear in unoccupied spaces near it.\n\nWhile within 5 feet of the mirror, you can take a Magic action to name one creature trapped in it or call out a particular cell by number. The creature named or contained in the named cell appears as an image on the mirror's surface. You and the creature can then communicate.\n\nIn a similar way, you can take a Magic action and use a second command word to free one creature trapped in the mirror. The freed creature appears, along with its possessions, in the unoccupied space nearest to the mirror and facing away from it.\n\nPlacing the mirror inside an extradimensional space created by a _Bag of Holding_, _Portable Hole_, or similar item instantly destroys both items and opens a gate to the Astral Plane. The gate originates where the one item was placed inside the other. Any creature within 10 feet of the gate and not behind Total Cover is sucked through it to a random location on the Astral Plane. The gate then closes. The gate is one-way only and can't be reopened.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mithral Armor",
    "type": "Armor (Any Medium or Heavy, Except Hide Armor)",
    "rarity": "Uncommon",
    "attune": "",
    "text": "Mithral is a light, flexible metal. Armor made of this substance can be worn under normal clothes. If the armor normally imposes Disadvantage on Dexterity (Stealth) checks or has a Strength requirement, the mithral version of the armor doesn't.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Mysterious Deck",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "",
    "text": "Usually found in a box or pouch, this deck contains a number of cards made of ivory or vellum. Most (75 percent) of these decks have thirteen cards, but some have twenty-two. Use the appropriate column of the Mysterious Deck table when randomly determining cards drawn from the deck.\n\nBefore you draw a card, you must declare how many cards you intend to draw and then draw them randomly. Any cards drawn in excess of this number have no effect. Otherwise, as soon as you draw a card from the deck, its magic takes effect. You must draw each card no more than 1 hour after the previous draw. If you fail to draw the chosen number, the remaining number of cards fly from the deck on their own and take effect all at once.\n\nOnce a card is drawn, it disappears. Unless the card is the Fool or Jester, the card reappears in the deck, making it possible to draw the same card twice. (Once the Fool or Jester has left the deck, reroll on the table if that card comes up again.)\n\n**Mysterious Deck**\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100 (13-Card Deck)</th>\n      <th>1d100 (22-Card Deck)</th>\n      <th>Card</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>—</td>\n      <td>01–05</td>\n      <td>Balance</td>\n    </tr>\n    <tr>\n      <td>—</td>\n      <td>06–10</td>\n      <td>Comet</td>\n    </tr>\n    <tr>\n      <td>—</td>\n      <td>11–14</td>\n      <td>Donjon</td>\n    </tr>\n    <tr>\n      <td>01–08</td>\n      <td>15–18</td>\n      <td>Euryale</td>\n    </tr>\n    <tr>\n      <td>—</td>\n      <td>19–23</td>\n      <td>Fates</td>\n    </tr>\n    <tr>\n      <td>09–16</td>\n      <td>24–27</td>\n      <td>Flames</td>\n    </tr>\n    <tr>\n      <td>—</td>\n      <td>28–31</td>\n      <td>Fool</td>\n    </tr>\n    <tr>\n      <td>—</td>\n      <td>32–36</td>\n      <td>Gem</td>\n    </tr>\n    <tr>\n      <td>17–24</td>\n      <td>37–41</td>\n      <td>Jester</td>\n    </tr>\n    <tr>\n      <td>25–32</td>\n      <td>42–46</td>\n      <td>Key</td>\n    </tr>\n    <tr>\n      <td>33–40</td>\n      <td>47–51</td>\n      <td>Knight</td>\n    </tr>\n    <tr>\n      <td>41–48</td>\n      <td>52–56</td>\n      <td>Moon</td>\n    </tr>\n    <tr>\n      <td>—</td>\n      <td>57–60</td>\n      <td>Puzzle</td>\n    </tr>\n    <tr>\n      <td>49–56</td>\n      <td>61–64</td>\n      <td>Rogue</td>\n    </tr>\n    <tr>\n      <td>57–64</td>\n      <td>65–68</td>\n      <td>Ruin</td>\n    </tr>\n    <tr>\n      <td>—</td>\n      <td>69–73</td>\n      <td>Sage</td>\n    </tr>\n  </tbody>\n</table>\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100 (13-Card Deck)</th>\n      <th>1d100 (22-Card Deck)</th>\n      <th>Card</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>65–72</td>\n      <td>74–77</td>\n      <td>Skull</td>\n    </tr>\n    <tr>\n      <td>73–80</td>\n      <td>78–82</td>\n      <td>Star</td>\n    </tr>\n    <tr>\n      <td>81–88</td>\n      <td>83–87</td>\n      <td>Sun</td>\n    </tr>\n    <tr>\n      <td>—</td>\n      <td>88–91</td>\n      <td>Talons</td>\n    </tr>\n    <tr>\n      <td>89–96</td>\n      <td>92–96</td>\n      <td>Throne</td>\n    </tr>\n    <tr>\n      <td>97–00</td>\n      <td>97–00</td>\n      <td>Void</td>\n    </tr>\n  </tbody>\n</table>\n\nEach card's effect is described below.\n\n_Balance._ You can increase one of your ability scores by 2, to a maximum of 22, provided you also decrease another one of your ability scores by 2. You can't decrease an ability that has a score of 5 or lower. Alternatively, you can choose not to adjust your ability scores, in which case this card has no effect.\n\n_Comet._ The next time you enter combat against one or more Hostile creatures, you can select one of them as your foe when you roll Initiative. If you reduce your foe to 0 Hit Points during that combat, you have Advantage on Death Saving Throws for 1 year. If someone else reduces your chosen foe to 0 Hit Points or you don't choose a foe, this card has no effect.\n\n_Donjon._ You disappear and become entombed in a state of suspended animation in an extradimensional sphere. Everything you're wearing and carrying disappears with you except for Artifacts, which stay behind in the space you occupied when you disappeared. You remain imprisoned until you are found and removed from the sphere. You can't be located by any Divination magic, but a _Wish_ spell can reveal the location of your prison. You draw no more cards.\n\n_Euryale._ The card's medusa-like visage curses you. You take a −2 penalty to saving throws while cursed in this way. Only a god or the magic of the Fates card can end this curse.\n\n_Fates._ Reality's fabric unravels and spins anew, allowing you to avoid or erase one event as if it never happened. You can use the card's magic as soon as you draw the card or at any other time before you die.\n\n_Flames._ A powerful devil becomes your enemy. The devil seeks your ruin and torments you, savoring your suffering before attempting to slay you. This enmity lasts until either you or the devil dies.\n\n_Fool._ You have Disadvantage on D20 Tests for the next 72 hours. Draw another card; this draw doesn't count as one of your declared draws.\n\n_Gem._ Twenty-five pieces of jewelry worth 2,000 GP each or fifty gems worth 1,000 GP each appear at your feet.\n\n_Jester._ You have Advantage on D20 Tests for the next 72 hours, or you can draw two additional cards beyond your declared draws.\n\n_Key._ A Rare or rarer magic weapon with which you are proficient appears on your person. The GM chooses the weapon.\n\n_Knight._ You gain the service of a **Knight**, who magically appears in an unoccupied space you choose within 30 feet of yourself. The knight has the same alignment as you and serves you loyally until death, believing the two of you have been drawn together by fate. Work with your GM to create a name and backstory for this NPC. The GM can use a different stat block to represent the knight, as desired.\n\n_Moon._ You gain the ability to cast _Wish_ 1d3 times.\n\n_Puzzle._ Permanently reduce your Intelligence or Wisdom by 1d4 + 1 (to a minimum score of 1). You can draw one additional card beyond your declared draws.\n\n_Rogue._ An NPC of the GM's choice becomes Hostile toward you. You don't know the identity of this NPC until they or someone else reveals it. Nothing less than a _Wish_ spell or divine intervention can end the NPC's hostility toward you.\n\n_Ruin._ All forms of wealth that you carry or own, other than magic items, are lost to you. Portable property vanishes. Businesses, buildings, and land you own are lost in a way that alters reality the least. Any documentation that proves you should own something lost to this card also disappears.\n\n_Sage._ At any time you choose within one year of drawing this card, you can ask a question in meditation and mentally receive a truthful answer to that question.\n\n_Skull._ An **Avatar of Death** (see the accompanying stat block) appears in an unoccupied space as close to you as possible. The avatar targets only you with its attacks, appearing as a ghostly skeleton clad in a tattered black robe and carrying a spectral scythe. The avatar disappears when it drops to 0 Hit Points or you die. If an ally of yours deals damage to the avatar, that ally summons another **Avatar of Death**. The new avatar appears in an unoccupied space as close to that ally as possible and targets only that ally with its attacks. You and your allies can each summon only one avatar as a consequence of this draw. A creature slain by an avatar can't be restored to life.\n\n_Star._ Increase one of your ability scores by 2, to a maximum of 24.\n\n_Sun._ A magic item (chosen by the GM) appears on your person. In addition, you gain 10 Temporary Hit Points daily at dawn until you die.\n\n_Talons._ Every magic item you wear or carry disintegrates. Artifacts in your possession vanish instead.\n\n_Throne._ You gain proficiency and Expertise in your choice of History, Insight, Intimidation, or Persuasion. In addition, you gain rightful ownership of a small keep somewhere in the world. However, the keep is currently home to one or more monsters, which must be cleared out before you can claim the keep as yours.\n\n_Void._ Your soul is drawn from your body and contained in an object in a place of the GM's choice. One or more powerful beings guard the place. While your soul is trapped in this way, your body is inert, ceases aging, and requires no food, air, or water. A _Wish_ spell can't return your soul to your body, but the spell reveals the location of the object that holds your soul. You draw no more cards.\n\n#### Avatar of Death\n\n_Medium Undead, Neutral Evil_\n\n**AC** 20 **Initiative** +3 (13) <br>\n**HP** Half the HP maximum of its summoner <br>\n**Speed** 60 ft., Fly 60 ft. (hover) <br>\n\n<table>\n  <thead>\n    <tr>\n      <th></th>\n      <th></th>\n      <th>MOD</th>\n      <th>SAVE</th>\n      <th></th>\n      <th></th>\n      <th>MOD</th>\n      <th>SAVE</th>\n      <th></th>\n      <th></th>\n      <th>MOD</th>\n      <th>SAVE</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td><strong>STR</strong></td>\n      <td>16</td>\n      <td>+3</td>\n      <td>+3</td>\n      <td><strong>DEX</strong></td>\n      <td>16</td>\n      <td>+3</td>\n      <td>+3</td>\n      <td><strong>CON</strong></td>\n      <td>16</td>\n      <td>+3</td>\n      <td>+3</td>\n    </tr>\n    <tr>\n      <td><strong>INT</strong></td>\n      <td>16</td>\n      <td>+3</td>\n      <td>+3</td>\n      <td><strong>WIS</strong></td>\n      <td>16</td>\n      <td>+3</td>\n      <td>+3</td>\n      <td><strong>CHA</strong></td>\n      <td>16</td>\n      <td>+3</td>\n      <td>+3</td>\n    </tr>\n  </tbody>\n</table>\n\n**Immunities** Necrotic, Poison; Charmed, Exhaustion, Frightened, Paralyzed, Petrified, Poisoned, Unconscious<br>\n**Senses** Truesight 60 ft., Passive Perception 13<br>\n**Languages** All languages known to its summoner<br>\n**CR** None (XP 0; PB equals its summoner's)\n\n### Traits\n\n<hr>\n\n**_Incorporeal Movement._** The avatar can move through other creatures and objects as if they were Difficult Terrain. It takes 5 (1d10) Force damage if it ends its turn inside an object.\n\n### Actions\n\n<hr>\n\n**_Multiattack._** The avatar makes a number of Reaping Scythe attacks equal to half the summoner's Proficiency Bonus (rounded up).\n\n**_Reaping Scythe._** _Melee Attack Roll:_ Automatic hit, reach 5 ft. _Hit:_ 7 (1d8 + 3) Slashing damage plus 4 (1d8) Necrotic damage.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Necklace of Adaptation",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this necklace, you can breathe normally in any environment, and you have Advantage on saving throws made to avoid or end the Poisoned condition.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Necklace of Fireballs",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This necklace has 1d6 + 3 beads hanging from it. You can take a Magic action to detach a bead and throw it up to 60 feet away. When it reaches the end of its trajectory, the bead detonates as a level 3 _Fireball_ (save DC 15).\n\nYou can hurl multiple beads, or even the whole necklace, at one time. When you do so, increase the damage of the _Fireball_ by 1d6 for each bead after the first (maximum 12d6).",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Necklace of Prayer Beads",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement by a Cleric, Druid, or Paladin",
    "text": "This necklace has 1d4 + 2 magic beads made from aquamarine, black pearl, or topaz. It also has many nonmagical beads made from stones such as amber, bloodstone, citrine, coral, jade, pearl, or quartz. If a magic bead is removed from the necklace, that bead loses its magic.\n\nSix types of magic beads exist. The GM decides the type of each bead on the necklace or determines it randomly by rolling on the table below. A necklace can have more than one bead of the same type. To use one, you must be wearing the necklace. Each bead contains a spell that you can cast from it as a Bonus Action (using your spell save DC if a save is necessary). Once a magic bead's spell is cast, that bead can't be used again until the next dawn.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d20</th>\n      <th>Bead</th>\n      <th>Spell</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1–6</td>\n      <td>Bead of Blessing</td>\n      <td>Bless</td>\n    </tr>\n    <tr>\n      <td>7–12</td>\n      <td>Bead of Curing</td>\n      <td>Cure Wounds (level 2 version)</td>\n    </tr>\n    <tr>\n      <td>13–16</td>\n      <td>Bead of Favor</td>\n      <td>Greater Restoration</td>\n    </tr>\n    <tr>\n      <td>17–18</td>\n      <td>Bead of Smiting</td>\n      <td>Shining Smite</td>\n    </tr>\n    <tr>\n      <td>19</td>\n      <td>Bead of Summons</td>\n      <td>Guardian of Faith</td>\n    </tr>\n    <tr>\n      <td>20</td>\n      <td>Bead of Wind Walking</td>\n      <td>Wind Walk</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Nine Lives Stealer",
    "type": "Weapon (Any Simple or Martial)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "You gain a +2 bonus to attack rolls and damage rolls made with this magic weapon.\n\n**_Life Stealing._** The weapon has 1d8 + 1 charges. When you attack a creature that has fewer than 100 Hit Points with this weapon and roll a 20 on the d20 for the attack roll, the creature must succeed on a DC 15 Constitution saving throw or be slain instantly as the sword tears its life force from its body. Constructs and Undead succeed on the save automatically. The weapon loses 1 charge if the creature is slain. When the weapon has no charges remaining, it loses this property.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Oathbow",
    "type": "Weapon (Longbow or Shortbow)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "When you nock an arrow on this bow, it whispers in Elvish, \"Swift defeat to my enemies.\" When you use this weapon to make a ranged attack, you can utter or sign the following command words: \"Swift death to you who have wronged me.\" The target of your attack becomes your sworn enemy until it dies or until dawn 7 days later. You can have only one such sworn enemy at a time. When your sworn enemy dies, you can choose a new one after the next dawn.\n\nWhen you make a ranged attack roll with this weapon against your sworn enemy, you have Advantage on the roll. In addition, your target gains no benefit from Half Cover or Three-Quarters Cover, and you suffer no Disadvantage due to long range. If the attack hits, your sworn enemy takes an extra 3d6 Piercing damage.\n\nWhile your sworn enemy lives, you have Disadvantage on attack rolls with all other weapons.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Oil of Etherealness",
    "type": "Potion",
    "rarity": "Rare",
    "attune": "",
    "text": "One vial of this oil can cover one Medium or smaller creature, along with the equipment it's wearing and carrying (one additional vial is required for each size category above Medium). Applying the oil takes 10 minutes. The affected creature then gains the effect of the _Etherealness_ spell for 1 hour.\n\nBeads of this cloudy, gray oil form on the outside of its container and quickly evaporate.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Oil of Sharpness",
    "type": "Potion",
    "rarity": "Very Rare",
    "attune": "",
    "text": "One vial of this oil can coat one Melee weapon or twenty pieces of ammunition, but only ammunition and Melee weapons that are nonmagical and deal Slashing or Piercing damage are affected. Applying the oil takes 1 minute, after which the oil magically seeps into whatever it coats, turning the coated weapon into a _+3 Weapon_ or the coated ammunition into _+3 Ammunition_.\n\nThis clear, gelatinous oil sparkles with tiny, ultrathin silver shards.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Oil of Slipperiness",
    "type": "Potion",
    "rarity": "Uncommon",
    "attune": "",
    "text": "One vial of this oil can cover one Medium or smaller creature, along with the equipment it's wearing and carrying (one additional vial is required for each size category above Medium). Applying the oil takes 10 minutes. The affected creature then gains the effect of the _Freedom of Movement_ spell for 8 hours.\n\nAlternatively, the oil can be poured on the ground as a Magic action, where it covers a 10-foot square, duplicating the effect of the _Grease_ spell in that area for 8 hours.\n\nThis sticky, black unguent is thick and heavy, but it flows quickly when poured.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Pearl of Power",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement by a Spellcaster",
    "text": "While this pearl is on your person, you can take a Magic action to regain one expended spell slot of level 3 or lower. Once you use the pearl, it can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Periapt of Health",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this pendant, you can take a Magic action to regain 2d4 + 2 Hit Points. Once used, this property can't be used again until the next dawn.\n\nIn addition, you have Advantage on saving throws to avoid or end the Poisoned condition while you wear this pendant.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Periapt of Proof against Poison",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This delicate silver chain has a brilliant-cut black gem pendant. While you wear it, you have Immunity to the Poisoned condition and Poison damage.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Periapt of Wound Closure",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this pendant, you gain the following benefits.\n\n**_Life Preservation._** Whenever you make a Death Saving Throw, you can change a roll of 9 or lower to a 10, turning a failed save into a successful one.\n\n**_Natural Healing Boost._** Whenever you roll a Hit Point Die to regain Hit Points, double the number of Hit Points it restores.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Philter of Love",
    "type": "Potion",
    "rarity": "Uncommon",
    "attune": "",
    "text": "The next time you see a creature within 10 minutes after drinking this philter, you are charmed by that creature and have the Charmed condition for 1 hour.\n\nThis rose-hued, effervescent liquid contains one easy-to-miss bubble shaped like a heart.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Pipes of Haunting",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "These pipes have 3 charges and regain 1d3 expended charges daily at dawn. You can take a Magic action to play them and expend 1 charge to create an eerie, spellbinding tune. Each creature of your choice within 30 feet of you must succeed on a DC 15 Wisdom saving throw or have the Frightened condition for 1 minute. A creature that fails the save repeats it at the end of each of its turns, ending the effect on itself on a success. A creature that succeeds on its save is immune to the effect of these pipes for 24 hours.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Pipes of the Sewers",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While these pipes are on your person, ordinary rats and giant rats are Indifferent toward you and won't attack you unless you threaten or harm them.\n\nThe pipes have 3 charges and regain 1d3 expended charges daily at dawn. If you play the pipes as a Magic action, you can take a Bonus Action to expend 1 to 3 charges, calling forth one Swarm of Rats with each expended charge if enough rats are within half a mile of you to be called in this fashion (as determined by the GM). If there aren't enough rats to form a swarm, the charge is wasted. Called swarms move toward the music by the shortest available route but aren't under your control otherwise.\n\nWhenever a Swarm of Rats that isn't under another creature's control comes within 30 feet of you while you are playing the pipes, the swarm makes a DC 15 Wisdom saving throw. On a successful save, the swarm behaves as it normally would and can't be swayed by the pipes' music for the next 24 hours. On a failed save, the swarm is swayed by the pipes' music and becomes Friendly to you and your allies for as long as you continue to play the pipes each round as a Magic action. A Friendly swarm obeys your commands. If you issue no commands to a Friendly swarm, it defends itself but otherwise takes no actions. If a Friendly swarm starts its turn more than 30 feet away from you, your control over that swarm ends, and the swarm behaves as it normally would and can't be swayed by the pipes' music for the next 24 hours.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Plate Armor of Etherealness",
    "type": "Armor (Half Plate Armor or Plate Armor)",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "While you're wearing this armor, you can take a Magic action and use a command word to gain the effect of the _Etherealness_ spell. The spell ends immediately if you remove the armor or take a Magic action to repeat the command word. This property of the armor can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Portable Hole",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This fine black cloth, soft as silk, is folded up to the dimensions of a handkerchief. It unfolds into a circular sheet 6 feet in diameter.\n\nYou can take a Magic action to unfold a _Portable Hole_ and place it on or against a solid surface, whereupon the _Portable Hole_ creates an\nextradimensional hole 10 feet deep. The cylindrical space within the hole exists on a different plane of existence, so it can't be used to create open passages. Any creature inside an open _Portable Hole_ can exit the hole by climbing out of it.\n\nYou can take a Magic action to close a _Portable Hole_ by taking hold of the edges of the cloth and folding it up. Folding the cloth closes the hole, and any creatures or objects within remain in the extradimensional space. No matter what's in it, the hole weighs next to nothing.\n\nIf the hole is folded up, a creature within the hole's extradimensional space can take an action to make a DC 10 Strength (Athletics) check. On a successful check, the creature forces its way out and appears within 5 feet of the _Portable Hole_. A closed _Portable Hole_ holds enough air for 1 hour of breathing, divided by the number of breathing creatures inside.\n\nPlacing a _Portable Hole_ inside an extradimensional space created by a _Bag of Holding_, _Handy Haversack_, or similar item instantly destroys both items and opens a gate to the Astral Plane. The gate originates where the one item was placed inside the other. Any creature within 10 feet of the gate and not behind Total Cover is sucked through it and deposited in a random location on the Astral Plane. The gate then closes. The gate is one-way only and can't be reopened.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Animal Friendship",
    "type": "Potion",
    "rarity": "Uncommon",
    "attune": "",
    "text": "When you drink this potion, you can cast the level 3 version of the _Animal Friendship_ spell (save DC 13).\n\nAgitating this potion's muddy liquid brings little bits into view: a fish scale, a hummingbird feather, a cat claw, or a squirrel hair.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Clairvoyance",
    "type": "Potion",
    "rarity": "Rare",
    "attune": "",
    "text": "When you drink this potion, you gain the effect of the _Clairvoyance_ spell (no Concentration required).\n\nAn eyeball bobs in this potion's yellowish liquid but vanishes when the potion is opened.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Climbing",
    "type": "Potion",
    "rarity": "Common",
    "attune": "",
    "text": "When you drink this potion, you gain a Climb Speed equal to your Speed for 1 hour. During this time, you have Advantage on Strength (Athletics) checks to climb.\n\nThis potion is separated into brown, silver, and gray layers resembling bands of stone. Shaking the bottle fails to mix the colors.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Diminution",
    "type": "Potion",
    "rarity": "Rare",
    "attune": "",
    "text": "When you drink this potion, you gain the \"reduce\" effect of the _Enlarge/Reduce_ spell for 1d4 hours (no Concentration required).\n\nThe red in the potion's liquid continuously contracts to a tiny bead and then expands to color the clear liquid around it. Shaking the bottle fails to interrupt this process.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Flying",
    "type": "Potion",
    "rarity": "Very Rare",
    "attune": "",
    "text": "When you drink this potion, you gain a Fly Speed equal to your Speed for 1 hour and can hover. If you're in the air when the potion wears off, you fall unless you have some other means of staying aloft.\n\nThis potion's clear liquid floats at the top of its container and has cloudy white impurities drifting in it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Gaseous Form",
    "type": "Potion",
    "rarity": "Rare",
    "attune": "",
    "text": "When you drink this potion, you gain the effect of the _Gaseous Form_ spell for 1 hour (no Concentration required) or until you end the effect as a Bonus Action.\n\nThis potion's container seems to hold fog that moves and pours like water.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Giant Strength",
    "type": "Potion",
    "rarity": "Rarity Varies",
    "attune": "",
    "text": "When you drink this potion, your Strength score changes for 1 hour. The type of giant determines the score (see the table below). The potion has no effect on you if your Strength is equal to or greater than that score.\n\nThis potion's transparent liquid has floating in it a sliver of light resembling a giant's fingernail.\n\n<table>\n  <thead>\n    <tr>\n      <th>Potion</th>\n      <th>Str.</th>\n      <th>Rarity</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Potion of Giant Strength (hill)</td>\n      <td>21</td>\n      <td>Uncommon</td>\n    </tr>\n    <tr>\n      <td>Potion of Giant Strength (frost or stone)</td>\n      <td>23</td>\n      <td>Rare</td>\n    </tr>\n    <tr>\n      <td>Potion of Giant Strength (fire)</td>\n      <td>25</td>\n      <td>Rare</td>\n    </tr>\n    <tr>\n      <td>Potion of Giant Strength (cloud)</td>\n      <td>27</td>\n      <td>Very Rare</td>\n    </tr>\n    <tr>\n      <td>Potion of Giant Strength (storm)</td>\n      <td>29</td>\n      <td>Legendary</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Growth",
    "type": "Potion",
    "rarity": "Uncommon",
    "attune": "",
    "text": "When you drink this potion, you gain the \"enlarge\" effect of the _Enlarge/Reduce_ spell for 10 minutes (no Concentration required).\n\nThe red in the potion's liquid continuously expands from a tiny bead to color the clear liquid around it and then contracts. Shaking the bottle fails to interrupt this process.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potions of Healing",
    "type": "Potion",
    "rarity": "Rarity Varies",
    "attune": "",
    "text": "You regain Hit Points when you drink this potion. The number of Hit Points depends on the potion's rarity, as shown in the table below.\n\nWhatever its potency, the potion's red liquid glimmers when agitated.\n\n<table>\n  <thead>\n    <tr>\n      <th>Potion</th>\n      <th>HP Regained</th>\n      <th>Rarity</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Potion of Healing</td>\n      <td>2d4 + 2</td>\n      <td>Common</td>\n    </tr>\n    <tr>\n      <td>Potion of Healing (greater)</td>\n      <td>4d4 + 4</td>\n      <td>Uncommon</td>\n    </tr>\n    <tr>\n      <td>Potion of Healing (superior)</td>\n      <td>8d4 + 8</td>\n      <td>Rare</td>\n    </tr>\n    <tr>\n      <td>Potion of Healing (supreme)</td>\n      <td>10d4 + 20</td>\n      <td>Very Rare</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Heroism",
    "type": "Potion",
    "rarity": "Rare",
    "attune": "",
    "text": "When you drink this potion, you gain 10 Temporary Hit Points that last for 1 hour. For the same duration, you are under the effect of the _Bless_ spell (no Concentration required).\n\nThis potion's blue liquid bubbles and steams as if boiling.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Invisibility",
    "type": "Potion",
    "rarity": "Rare",
    "attune": "",
    "text": "This potion's container looks empty but feels as though it holds liquid. When you drink the potion, you have the Invisible condition for 1 hour. The effect ends early if you make an attack roll, deal damage, or cast a spell.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Invulnerability",
    "type": "Potion",
    "rarity": "Rare",
    "attune": "",
    "text": "For 1 minute after you drink this potion, you have Resistance to all damage.\n\nThis potion's syrupy liquid looks like liquefied iron.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Longevity",
    "type": "Potion",
    "rarity": "Very Rare",
    "attune": "",
    "text": "When you drink this potion, your physical age is reduced by 1d6 + 6 years, to a minimum of 13 years. Each time you subsequently drink a _Potion of Longevity_, there is 10 percent cumulative chance that you instead age by 1d6 + 6 years.\n\nSuspended in this amber liquid is a tiny heart that, against all reason, is still beating. These ingredients vanish when the potion is opened.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Mind Reading",
    "type": "Potion",
    "rarity": "Rare",
    "attune": "",
    "text": "When you drink this potion, you gain the effect of the _Detect Thoughts_ spell (save DC 13) for 10 minutes (no Concentration required).\n\nThis potion's dense, purple liquid has an ovoid cloud of pink floating in it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Poison",
    "type": "Potion",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This concoction looks, smells, and tastes like a _Potion of Healing_ or another beneficial potion. However, it is actually poison masked by illusion magic. _Identify_ reveals its true nature.\n\nIf you drink this potion, you take 4d6 Poison damage and must succeed on a DC 13 Constitution saving throw or have the Poisoned condition for 1 hour.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Resistance",
    "type": "Potion",
    "rarity": "Uncommon",
    "attune": "",
    "text": "When you drink this potion, you have Resistance to one type of damage for 1 hour. The GM chooses the type or determines it randomly by rolling on the following table.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d10</th>\n      <th>Damage Type</th>\n      <th>1d10</th>\n      <th>Damage Type</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1</td>\n      <td>Acid</td>\n      <td>6</td>\n      <td>Necrotic</td>\n    </tr>\n    <tr>\n      <td>2</td>\n      <td>Cold</td>\n      <td>7</td>\n      <td>Poison</td>\n    </tr>\n    <tr>\n      <td>3</td>\n      <td>Fire</td>\n      <td>8</td>\n      <td>Psychic</td>\n    </tr>\n    <tr>\n      <td>4</td>\n      <td>Force</td>\n      <td>9</td>\n      <td>Radiant</td>\n    </tr>\n    <tr>\n      <td>5</td>\n      <td>Lightning</td>\n      <td>10</td>\n      <td>Thunder</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Speed",
    "type": "Potion",
    "rarity": "Very Rare",
    "attune": "",
    "text": "When you drink this potion, you gain the effect of the _Haste_ spell for 1 minute (no Concentration required) without suffering the wave of lethargy that typically occurs when the effect ends.\n\nThis potion's yellow fluid is streaked with black and swirls on its own.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Vitality",
    "type": "Potion",
    "rarity": "Very Rare",
    "attune": "",
    "text": "When you drink this potion, it removes any Exhaustion levels you have and ends the Poisoned condition on you. For the next 24 hours, you regain the maximum number of Hit Points for any Hit Point Die you spend.\n\nThis potion's crimson liquid regularly pulses with dull light, calling to mind a heartbeat.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Potion of Water Breathing",
    "type": "Potion",
    "rarity": "Uncommon",
    "attune": "",
    "text": "You can breathe underwater for 24 hours after drinking this potion.\nThis potion's cloudy green fluid smells of the sea and has a jellyfish-like bubble floating in it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Quarterstaff of the Acrobat",
    "type": "Weapon (Quarterstaff)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "You have a +2 bonus to attack rolls and damage rolls made with this magic weapon.\n\nWhile holding this weapon, you can cause it to emit green Dim Light out to 10 feet, either as a Bonus Action or after you roll Initiative, or you can extinguish the light as a Bonus Action.\n\nWhile holding this weapon, you can take a Bonus Action to alter its form, turning it into a 6-inch rod (for ease of storage) or a 10-foot pole, or reverting it a Quarterstaff; the weapon will elongate only as far as the surrounding space allows.\n\nIn certain forms, the weapon has the following additional properties.\n\n_Acrobatic Assist (Quarterstaff and 10-Foot Pole Forms Only)._ While holding this weapon, you have Advantage on Dexterity (Acrobatics) checks.\n\n_Attack Deflection (Quarterstaff Form Only)._ When you are hit by an attack while holding the weapon, you can take a Reaction to twirl the weapon around you, gaining a +5 bonus to your Armor Class against the triggering attack, potentially causing the attack to miss you. You can't use this property again until you finish a Short or Long Rest.\n\n_Ranged Weapon (Quarterstaff Form Only)._ This weapon has the Thrown property with a normal range of 30 feet and a long range of 120 feet. Immediately after you make a ranged attack with the weapon, it flies back to your hand.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Animal Influence",
    "type": "Ring",
    "rarity": "Rare",
    "attune": "",
    "text": "This ring has 3 charges, and it regains 1d3 expended charges daily at dawn. While wearing the ring, you can expend 1 charge to cast one of the following spells (save DC 13) from it:\n\n- _Animal Friendship_\n- _Fear_ (affects Beasts only)\n- _Speak with Animals_",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Djinni Summoning",
    "type": "Ring",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "While wearing this ring, you can take a Magic action to summon a particular **Djinni** from the Elemental Plane of Air. The djinni appears in an unoccupied space you choose within 120 feet of yourself. It remains as long as you maintain Concentration, to a maximum of 1 hour, or until it drops to 0 Hit Points.\n\nWhile summoned, the djinni is Friendly to you and your allies, and it obeys your commands. If you fail to command it, the djinni defends itself against attackers but takes no other actions.\n\nAfter the djinni departs, it can't be summoned again for 24 hours, and the ring becomes nonmagical if the djinni dies.\n\n_Rings of Djinni Summoning_ are often created by the djinn they summon and given to mortals as gifts of friendship or tokens of esteem.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Elemental Command",
    "type": "Ring",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "Each _Ring of Elemental Command_ is linked to one of the four Elemental Planes. The GM chooses or randomly determines the linked plane. For example, a _Ring of Elemental Command_ (air) is linked to the Elemental Plane of Air.\n\nEvery _Ring of Elemental Command_ has the following two properties:\n\n**Elemental Bane.** While wearing the ring, you have Advantage on attack rolls against Elementals and they have Disadvantage on attack rolls against you.\n\n**Elemental Compulsion.** While wearing the ring, you can take a Magic action to try to compel an Elemental you see within 60 feet of yourself. The Elemental makes a DC 18 Wisdom saving throw. On a failed save, the Elemental has the Charmed condition until the start your next turn, and you determine what it does with its move and action on its next turn.\n\n_Elemental Focus._ While wearing the ring, you benefit from additional properties corresponding to the ring's linked Elemental Plane:\n\n**Air.** You know Auran, you have Resistance to Lightning damage, and you have a Fly Speed equal to your Speed and can hover.\n\n**Earth.** You know Terran, and you have Resistance to Acid damage. Terrain composed of rubble, rocks, or dirt isn't Difficult Terrain for you. In addition, you can move through solid earth or rock as if those areas were Difficult Terrain without disturbing the matter through which you pass. If you end your turn in solid earth or rock, you are shunted out to the nearest unoccupied space you last occupied.\n\n**Fire.** You know Ignan, and you have Immunity to Fire damage.\n\n**Water.** You know Aquan, you gain a Swim Speed of 60 feet, and you can breathe underwater.\n\n_Spellcasting._ The ring has 5 charges and regains 1d4 + 1 expended charges daily at dawn. While wearing the ring, you can cast a spell from it. Choose the spell from the list of available spells based on the Elemental Plane the ring is linked to, as shown in the following table. The table indicates how many charges you must expend to cast the spell, which has a save DC of 18.\n\n<table>\n  <thead>\n    <tr>\n      <th>Plane</th>\n      <th>Spells (Charges)</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Air</td>\n      <td>*Chain Lightning* (3 charges), *Feather Fall* (0 charges), *Gust of Wind* (2 charges), *Wind Wall* (1 charge)</td>\n    </tr>\n    <tr>\n      <td>Earth</td>\n      <td>*Earthquake* (5 charges), *Stone Shape* (2 charges), *Stoneskin* (3 charges), *Wall of Stone* (3 charges)</td>\n    </tr>\n    <tr>\n      <td>Fire</td>\n      <td>*Burning Hands* (1 charge), *Fireball* (2 charges), *Fire Storm* (4 charges), *Wall of Fire* (3 charges)</td>\n    </tr>\n    <tr>\n      <td>Water</td>\n      <td>*Create or Destroy Water* (1 charge), *Ice Storm* (2 charges), *Tsunami* (5 charges), *Wall of Ice* (3 charges), *Water Walk* (2 charges)</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Evasion",
    "type": "Ring",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This ring has 3 charges, and it regains 1d3 expended charges daily at dawn. When you fail a Dexterity saving throw while wearing the ring, you can take a Reaction to expend 1 charge to succeed on that save instead.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Feather Falling",
    "type": "Ring",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "When you fall while wearing this ring, you descend 60 feet per round and take no damage from falling.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Free Action",
    "type": "Ring",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While you wear this ring, Difficult Terrain doesn't cost you extra movement. In addition, magic can neither reduce any of your Speeds nor cause you to have the Paralyzed or Restrained condition.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Invisibility",
    "type": "Ring",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "While wearing this ring, you can take a Magic action to give yourself the Invisible condition. You remain Invisible until the ring is removed or until you take a Bonus Action to become visible again.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Jumping",
    "type": "Ring",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this ring, you can cast _Jump_ from it, but can target only yourself when you do so.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Mind Shielding",
    "type": "Ring",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While wearing this ring, you are immune to magic that allows other creatures to read your thoughts, determine whether you are lying, know your alignment, or know your creature type. Creatures can telepathically communicate with you only if you allow it.\n\nYou can take a Magic action to cause the ring to become imperceptible until you take another Magic action to make it perceptible, until you remove the ring, or until you die.\n\nIf you die while wearing the ring, your soul enters it, unless it already houses a soul. You can remain in the ring or depart for the afterlife. As long as your soul is in the ring, you can telepathically communicate with any creature wearing it. A wearer can't prevent this telepathic communication.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Protection",
    "type": "Ring",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "You gain a +1 bonus to Armor Class and saving throws while wearing this ring.",
    "src": "SRD 5.2.1",
    "ac": 1,
    "saves": 1
  },
  {
    "n": "Ring of Regeneration",
    "type": "Ring",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While wearing this ring, you regain 1d6 Hit Points every 10 minutes if you have at least 1 Hit Point. If you lose a body part, the ring causes the missing part to regrow and return to full functionality after 1d6 + 1 days if you have at least 1 Hit Point the whole time.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Resistance",
    "type": "Ring",
    "rarity": "Rare",
    "attune": "",
    "text": "You have Resistance to one damage type while wearing this ring. The gemstone in the ring indicates the type, which the GM chooses or determines randomly by rolling on the following table.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d10</th>\n      <th>Damage Type</th>\n      <th>Gemstone</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1</td>\n      <td>Acid</td>\n      <td>Pearl</td>\n    </tr>\n    <tr>\n      <td>2</td>\n      <td>Cold</td>\n      <td>Tourmaline</td>\n    </tr>\n    <tr>\n      <td>3</td>\n      <td>Fire</td>\n      <td>Garnet</td>\n    </tr>\n    <tr>\n      <td>4</td>\n      <td>Force</td>\n      <td>Sapphire</td>\n    </tr>\n    <tr>\n      <td>5</td>\n      <td>Lightning</td>\n      <td>Citrine</td>\n    </tr>\n    <tr>\n      <td>6</td>\n      <td>Necrotic</td>\n      <td>Jet</td>\n    </tr>\n    <tr>\n      <td>7</td>\n      <td>Poison</td>\n      <td>Amethyst</td>\n    </tr>\n    <tr>\n      <td>8</td>\n      <td>Psychic</td>\n      <td>Jade</td>\n    </tr>\n    <tr>\n      <td>9</td>\n      <td>Radiant</td>\n      <td>Topaz</td>\n    </tr>\n    <tr>\n      <td>10</td>\n      <td>Thunder</td>\n      <td>Spinel</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Shooting Stars",
    "type": "Ring",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "You can cast _Dancing Lights_ or _Light_ from the ring.\n\nThe ring has 6 charges and regains 1d6 expended charges daily at dawn. You can expend its charges to use the properties below.\n\n**_Faerie Fire._** You can expend 1 charge to cast _Faerie Fire_ from the ring.\n\n**_Lightning Spheres._** You can expend 2 charges as a Magic action to create up to four 3-foot-diameter spheres of lightning. Each sphere appears in an unoccupied space you can see within 120 feet of yourself. The spheres last as long as you maintain Concentration, up to 1 minute. Each sphere sheds Dim Light in a 30-foot radius.\n\nAs a Bonus Action, you can move each sphere up to 30 feet, but no farther than 120 feet away from yourself. The first time the sphere comes within 5 feet of a creature other than you that isn't behind Total Cover, the sphere discharges lightning at that creature and disappears. That creature makes a DC 15 Dexterity saving throw. On a failed save, the creature takes Lightning damage based on the number of spheres you created, as shown in the following table. On a successful save, the creature takes half as much damage.\n\n<table>\n  <thead>\n    <tr>\n      <th>Number of Spheres</th>\n      <th>Lightning Damage</th>\n      <th>Number of Spheres</th>\n      <th>Lightning Damage</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>1</td>\n      <td>4d12</td>\n      <td>3</td>\n      <td>2d6</td>\n    </tr>\n    <tr>\n      <td>2</td>\n      <td>5d4</td>\n      <td>4</td>\n      <td>2d4</td>\n    </tr>\n  </tbody>\n</table>\n\n_Shooting Stars._ You can expend 1 to 3 charges as a Magic action. For every charge you expend, you launch a glowing mote of light from the ring at a point you can see within 60 feet of yourself. Each creature in a 15-foot Cube originating from that point is showered in sparks and makes a DC 15 Dexterity saving throw, taking 5d4 Radiant damage on a failed save or half as much damage on a successful one.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Spell Storing",
    "type": "Ring",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This ring stores spells cast into it, holding them until the attuned wearer uses them. The ring can store up to 5 levels worth of spells at a time. When found, it contains 1d6 − 1 levels of stored spells chosen by the GM.\n\nAny creature can cast a spell of level 1 through 5 into the ring by touching the ring as the spell is cast. The spell has no effect other than to be stored in the ring. If the ring can't hold the spell, the spell is expended without effect. The level of the slot used to cast the spell determines how much space it uses.\n\nWhile wearing this ring, you can cast any spell stored in it. The spell uses the slot level, spell save DC, spell attack bonus, and spellcasting ability of the original caster but is otherwise treated as if you cast the spell. The spell cast from the ring is no longer stored in it, freeing up space.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Spell Turning",
    "type": "Ring",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "While wearing this ring, you have Advantage on saving throws against spells. If you succeed on the save for a spell of level 7 or lower, the spell has no effect on you. If that spell targeted only you and didn't create an area of effect, you can take a Reaction to deflect the spell back at the spell's caster; the caster must make a saving throw against the spell using their own spell save DC.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Swimming",
    "type": "Ring",
    "rarity": "Uncommon",
    "attune": "",
    "text": "You have a Swim Speed of 40 feet while wearing this ring.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Telekinesis",
    "type": "Ring",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While wearing this ring, you can cast _Telekinesis_ from it.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of the Ram",
    "type": "Ring",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This ring has 3 charges and regains 1d3 expended charges daily at dawn. While wearing the ring, you can take a Magic action to expend 1 to 3 charges to make a ranged spell attack against one creature you can see within 60 feet of yourself. The ring produces a spectral ram's head and makes its attack roll with a +7 bonus. On a hit, for each charge you spend, the target takes 2d10 Force damage and is pushed 5 feet away from you.\n\nAlternatively, you can expend 1 to 3 of the ring's charges as a Magic action to try to break a nonmagical object you can see within 60 feet of yourself that isn't being worn or carried. The ring makes a Strength check with a +5 bonus for each charge you spend.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Three Wishes",
    "type": "Ring",
    "rarity": "Legendary",
    "attune": "",
    "text": "While wearing this ring, you can expend 1 of its 3 charges to cast _Wish_ from it. The ring becomes nonmagical when you use the last charge.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Warmth",
    "type": "Ring",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "If you take Cold damage while wearing this ring, the ring reduces the damage you take by 2d8.\n\nIn addition, while wearing this ring, you and everything you wear and carry are unharmed by temperatures of 0 degrees Fahrenheit or lower.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of Water Walking",
    "type": "Ring",
    "rarity": "Uncommon",
    "attune": "",
    "text": "While wearing this ring, you cast _Water Walk_ from it, targeting only yourself.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Ring of X-ray Vision",
    "type": "Ring",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While wearing this ring, you can take a Magic action to gain X-ray vision with a range of 30 feet for 1 minute. To you, solid objects within that radius appear transparent and don't prevent light from passing through them. The vision can penetrate 1 foot of stone, 1 inch of common metal, or up to 3 feet of wood or dirt. Thicker substances or a thin sheet of lead block the vision.\n\nWhenever you use the ring again before taking a Long Rest, you must succeed on a DC 15 Constitution saving throw or gain 1 Exhaustion level.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Robe of Eyes",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This robe is adorned with eyelike patterns. While you wear the robe, you gain the following benefits:\n\n**All-Around Vision.** The robe gives you Advantage on Wisdom (Perception) checks that rely on sight.\n\n**Special Senses.** You have Darkvision and Truesight, both with a range of 120 feet.\n\n_Drawbacks._ A _Light_ spell cast on the robe or a _Daylight_ spell cast within 5 feet of the robe gives you the Blinded condition for 1 minute. At the end of each of your turns, you make a Constitution saving throw (DC 11 for _Light_ or DC 15 for _Daylight_), ending the condition on yourself on a success.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Robe of Scintillating Colors",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "This robe has 3 charges, and it regains 1d3 expended charges daily at dawn. While you wear it, you can take a Magic action and expend 1 charge to cause the garment to display a shifting pattern of dazzling hues until the end of your next turn. During this time, the robe sheds Bright Light in a 30-foot radius and Dim Light for an additional 30 feet, and creatures that can see you have Disadvantage on attack rolls against you. Any creature in the Bright Light that can see you when the robe's power is activated must succeed on a DC 15 Wisdom saving throw or have the Stunned condition until the effect ends.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Robe of Stars",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "This black or dark-blue robe is embroidered with small white or silver stars. You gain a +1 bonus to saving throws while you wear it.\n\nSix stars, located on the robe's upper-front portion, are particularly large. While wearing this robe, you can take a Magic action to remove one of the stars and expend it to cast the level 5 version of _Magic Missile_. Daily at dusk, 1d6 removed stars reappear on the robe.\n\nWhile you wear the robe, you can take a Magic action to enter the Astral Plane along with everything you are wearing and carrying. You remain there until you take a Magic action to return to the plane you were on. You reappear in the last space you occupied or, if that space is occupied, the nearest unoccupied space.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Robe of the Archmagi",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "Requires Attunement by a Sorcerer, Warlock, or Wizard",
    "text": "This elegant garment is made from exquisite cloth and adorned with runes.\n\nYou gain these benefits while wearing the robe.\n\n_Armor._ If you aren't wearing armor, your base Armor Class is 15 plus your Dexterity modifier.\n\n_Magic Resistance._ You have Advantage on saving throws against spells and other magical effects.\n\n_War Mage._ Your spell save DC and spell attack bonus each increase by 2.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Robe of Useful Items",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This robe has cloth patches of various shapes and colors covering it. While wearing the robe, you can take a Magic action to detach one of the patches, causing it to become the object or creature it represents. Once the last patch is removed, the robe becomes an ordinary garment.\n\nThe robe has two of each of the following patches:\n\n- Bullseye Lantern (filled and lit)\n- Dagger\n- Mirror\n- Pole\n- Rope (coiled)\n- Sack\n\nIn addition, the robe has 4d4 other patches. The GM chooses the patches or determines them randomly by rolling on the following table.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Patch</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–08</td>\n      <td>Bag of 100 GP</td>\n    </tr>\n    <tr>\n      <td>09–15</td>\n      <td>Silver coffer (1 foot long, 6 inches wide and deep) worth 500 GP</td>\n    </tr>\n    <tr>\n      <td>16–22</td>\n      <td>Iron door (up to 10 feet wide and 10 feet high, barred on one side of your choice), which you can place in an opening you can reach; it conforms to fit the opening, attaching and hinging itself</td>\n    </tr>\n    <tr>\n      <td>23–30</td>\n      <td>10 gems worth 100 GP each</td>\n    </tr>\n    <tr>\n      <td>31–44</td>\n      <td>Wooden ladder (24 feet long)</td>\n    </tr>\n    <tr>\n      <td>45–51</td>\n      <td>Riding Horse with a Riding Saddle</td>\n    </tr>\n    <tr>\n      <td>52–59</td>\n      <td>Open pit (a 10-foot Cube), which you can place on the ground within 10 feet of yourself</td>\n    </tr>\n    <tr>\n      <td>60–68</td>\n      <td>4 Potions of Healing</td>\n    </tr>\n    <tr>\n      <td>69–75</td>\n      <td>Rowboat (12 feet long)</td>\n    </tr>\n    <tr>\n      <td>76–83</td>\n      <td>Spell Scroll containing one spell of level 1, 2, or 3 (your choice)</td>\n    </tr>\n    <tr>\n      <td>84–90</td>\n      <td>2 Mastiffs</td>\n    </tr>\n    <tr>\n      <td>91–96</td>\n      <td>Window (2 feet by 4 feet, up to 2 feet deep), which you can place on a vertical surface you can reach</td>\n    </tr>\n    <tr>\n      <td>97–00</td>\n      <td>Portable Ram</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rod of Absorption",
    "type": "Rod",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While holding this rod, you can take a Reaction to absorb a spell that is targeting only you and doesn't create an area of effect. The absorbed spell's effect is canceled, and the spell's energy—not the spell itself—is stored in the rod. The energy has the same level as the spell when it was cast. A canceled spell dissipates with no effect, and any resources used to cast it are wasted. The rod can absorb and store up to 50 levels of energy over the course of its existence. Once the rod absorbs 50 levels of energy, it can't absorb more. If you are targeted by a spell that the rod can't store, the rod has no effect on that spell.\n\nWhen you become attuned to the rod, you know how many levels of energy the rod has absorbed over the course of its existence and how many levels of spell energy it currently has stored.\n\nIf you are a spellcaster holding the rod, you can convert energy stored in it into spell slots to cast spells you have prepared or know. You can create spell slots only of a level equal to or lower than your own spell slots, up to a maximum of level 5. You use the stored levels in place of your slots but otherwise cast the spell as normal. For example, you can use 3 levels stored in the rod as a level 3 spell slot.\n\nA newly found rod typically has 1d10 levels of spell energy stored in it. A rod that can no longer absorb spell energy and has no energy remaining becomes nonmagical.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rod of Alertness",
    "type": "Rod",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "This rod has the following properties.\n\n_Alertness._ While holding the rod, you have Advantage on Wisdom (Perception) checks and on Initiative rolls.\n\n_Spells._ While holding the rod, you can cast the following spells from it:\n\n- _Detect Evil and Good_\n- _Detect Magic_\n- _Detect Poison and Disease_\n- _See Invisibility_\n\n_Protective Aura._ As a Magic action, you can plant the haft end of the rod in the ground, whereupon the rod's head sheds Bright Light in a 60-foot radius and Dim Light for an additional 60 feet. While in that Bright Light, you and your allies gain a +1 bonus to Armor Class and saving throws and can sense the location of any Invisible creature that is also in the Bright Light.\n\nThe rod's head stops glowing and the effect ends after 10 minutes or when a creature takes a Magic action to pull the rod from the ground. Once used, this property can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rod of Lordly Might",
    "type": "Rod",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "This rod has a flanged head, and it functions as a magic Mace that grants a +3 bonus to attack rolls and damage rolls made with it. The rod has properties associated with six different buttons that are set in a row along the haft. It has three other properties as well, detailed below.\n\n_Buttons._ You can press one of the following buttons as a Bonus Action; a button's effect lasts until you push a different button or until you push the same button again, which causes the rod to revert to its normal form:\n\n**Button 1.** A fiery blade sprouts from the end opposite the rod's flanged head. The flames shed Bright Light in a 40-foot radius and Dim Light for an additional 40 feet, and the blade functions as a magic Longsword or Shortsword (your choice) that deals an extra 2d6 Fire damage on a hit.\n\n**Button 2.** The rod's flanged head folds down and two crescent-shaped blades spring out, transforming the rod into a magic Battleaxe that grants a +3 bonus to attack rolls and damage rolls made with it.\n\n**Button 3.** The rod's flanged head folds down, a spear point springs from the rod's tip, and the rod's handle lengthens into a 6-foot haft, transforming the rod into a magic Spear that grants a +3 bonus to attack rolls and damage rolls made with it.\n\n**Button 4.** The rod transforms into a climbing pole up to 50 feet long (you specify the length), though the rod's buttons remain within your reach. In surfaces as hard as granite, a spike at the bottom and three hooks at the top anchor the pole. Horizontal bars 3 inches long fold out from the sides, 1 foot apart, forming a ladder. The pole can bear up to 4,000 pounds. More weight or lack of solid anchoring causes the rod to revert to its normal form.\n\n**Button 5.** The rod transforms into a handheld battering ram and grants its user a +10 bonus to Strength (Athletics) checks made to break through doors, barricades, and other barriers.\n\n**Button 6.** The rod assumes or remains in its normal form and indicates magnetic north. (Nothing happens if this function of the rod is used in a location that has no magnetic north.) The rod also gives you knowledge of your approximate depth beneath the ground or your height above it.\n\n_Drain Life._ When you hit a creature with a melee attack using the rod, you can force the target to make a DC 17 Constitution saving throw. On a failed save, the target takes an extra 4d6 Necrotic damage, and you regain a number of Hit Points equal to half that Necrotic damage. Once used, this property can't be used again until the next dawn.\n\n_Paralyze._ When you hit a creature with a melee attack using the rod, you can force the target to make a DC 17 Constitution saving throw. On a failed save, the target has the Paralyzed condition for 1 minute. The target repeats the save at the end of each of its turns, ending the effect on a success. Once used, this property can't be used again until the next dawn.\n\n_Terrify._ While holding the rod, you can take a Magic action to force each creature you can see within 30 feet of yourself to make a DC 17 Wisdom saving throw. On a failed save, a target has the Frightened condition for 1 minute. A Frightened target repeats the save at the end of each of its turns, ending the effect on itself on a success. Once used, this property can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rod of Resurrection",
    "type": "Rod",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "The rod has 5 charges. While you hold it, you can cast one of the following spells from it: _Heal_ (expends 1 charge) or _Resurrection_ (expends 5 charges).\n\nThe rod regains 1 expended charge daily at dawn. If you expend the last charge, roll 1d20. On a 1, the rod disappears in a harmless burst of radiance.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rod of Rulership",
    "type": "Rod",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "You can take a Magic action to present the rod and command obedience from each creature of your choice that you can see within 120 feet of yourself. Each target must succeed on a DC 15 Wisdom saving throw or have the Charmed condition for 8 hours. While Charmed in this way, the creature regards you as its trusted leader. If harmed by you or your allies or commanded to do something contrary to its nature, a target ceases to be Charmed in this way. Once used, this property can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rod of Security",
    "type": "Rod",
    "rarity": "Very Rare",
    "attune": "",
    "text": "While holding this rod, you can take a Magic action to activate it. The rod then instantly transports you and up to 199 other willing creatures you can see to a demiplane. You choose the form the demiplane takes. It could be a tranquil garden, a cheery tavern, an immense palace, a tropical island, a fantastic carnival, or whatever else you can imagine. Regardless of its nature, the demiplane contains enough water and food to sustain its visitors, and the demiplane's environment can't harm its occupants. Everything else that can be interacted with there can exist only there. For example, a flower picked from a garden there disappears if it is taken outside the demiplane.\n\nFor each hour spent in the demiplane, a visitor regains Hit Points as if it had spent 1 Hit Point Die. Also, creatures don't age while there, although time passes normally. Visitors can remain there for up to 200 days divided by the number of creatures present (round down).\n\nWhen the time runs out or you take a Magic action to end the effect, all visitors reappear in the location they occupied when you activated the rod or an unoccupied space nearest that location. Once used, this property can't be used again until 10 days have passed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rope of Climbing",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This 60-foot length of rope can hold up to 3,000 pounds. While holding one end of the rope, you can take a Magic action to command the other end of the rope to animate and move toward a destination you choose, up to the rope's length away from you. That end moves 10 feet on your turn when you first command it and 10 feet at the start of each of your subsequent turns until reaching its destination or until you tell it to stop. You can also tell the rope to fasten itself securely to an object or to unfasten itself, to knot or unknot itself, or to coil itself for carrying.\n\nIf you tell the rope to knot, large knots appear at 1-foot intervals along the rope. While knotted, the rope shortens to a 50-foot length and grants Advantage on ability checks made to climb using the rope.\n\nThe rope has AC 20, HP 20, and Immunity to Poison and Psychic damage. It regains 1 Hit Point every 5 minutes as long as it has at least 1 Hit Point. If the rope drops to 0 Hit Points, it is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Rope of Entanglement",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "This rope is 30 feet long. While holding one end of the rope, you can take a Magic action to command the other end to dart forward and entangle one creature you can see within 20 feet of yourself. The target must succeed on a DC 15 Dexterity saving throw or have the Restrained condition. You can release the target by letting go of your end of the rope (causing the rope to coil up in the target's space) or by using a Bonus Action to repeat the command (causing the rope to coil up in your hand).\n\nA target Restrained by the rope can take an action to make its choice of a DC 15 Strength (Athletics) or Dexterity (Acrobatics) check. On a successful check, the target is no longer Restrained by the rope. If you're still holding onto the rope when a target escapes from it, you can take a Reaction to command the rope to coil up in your hand; otherwise, the rope coils up in the target's space.\n\nThe rope has AC 20, HP 20, and Immunity to Poison and Psychic damage. It regains 1 Hit Point every 5 minutes as long as it has at least 1 Hit Point. If the rope drops to 0 Hit Points, it is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Scarab of Protection",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "This beetle-shaped medallion provides three benefits while it is on your person.\n\n_Defense._ You gain a +1 bonus to Armor Class.\n\n_Preservation._ The scarab has 12 charges. If you fail a saving throw against a Necromancy spell or a harmful effect originating from an Undead, you can take a Reaction to expend 1 charge and turn the failed save into a successful one. The scarab crumbles into powder and is destroyed when its last charge is expended.\n\n_Spell Resistance._ You have Advantage on saving throws against spells.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Scimitar of Speed",
    "type": "Weapon (Scimitar)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "You gain a +2 bonus to attack rolls and damage rolls made with this magic weapon. In addition, you can make one attack with it as a Bonus Action on each of your turns.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sending Stones",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "_Sending Stones_ come in pairs, with each stone carved to match the other so the pairing is easily recognized. While you touch one stone, you can cast _Sending_ from it. The target is the bearer of the other stone. If no creature bears the other stone, you know that fact as soon as you use the stone, and you don't cast the spell.\n\nOnce _Sending_ is cast using either stone, the stones can't be used again until the next dawn. If one of the stones in a pair is destroyed, the other one becomes nonmagical.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sentinel Shield",
    "type": "Armor (Shield)",
    "rarity": "Uncommon",
    "attune": "",
    "text": "While holding this Shield, you have Advantage on Initiative rolls and Wisdom (Perception) checks. The Shield is emblazoned with a symbol of an eye.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Shield, +1, +2, or +3",
    "type": "Armor (Shield)",
    "rarity": "Uncommon (+1), Rare (+2), or Very Rare (+3)",
    "attune": "",
    "text": "While holding this Shield, you have a bonus to Armor Class determined by the Shield's rarity, in addition to the Shield's normal bonus to AC.",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Shield, +1",
        "rarity": "Uncommon",
        "ac": 1
      },
      {
        "n": "Shield, +2",
        "rarity": "Rare",
        "ac": 2
      },
      {
        "n": "Shield, +3",
        "rarity": "Very Rare",
        "ac": 3
      }
    ]
  },
  {
    "n": "Shield of Missile Attraction",
    "type": "Armor (Shield)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While holding this Shield, you have Resistance to damage from attacks made with Ranged weapons.\n\n_Curse._ This Shield is cursed. Attuning to it curses you until you are targeted by a _Remove Curse_ spell or similar magic. Removing the Shield fails to end the curse on you. Whenever an attack with a Ranged weapon targets a creature within 10 feet of you, the curse causes you to become the target instead.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Shield of the Cavalier",
    "type": "Armor (Shield)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While holding this Shield, you have a +2 bonus to Armor Class. This bonus is in addition to the Shield's normal bonus to AC.\n\nThe Shield has the following additional properties that you can use while holding it.\n\n_Forceful Bash._ When you take the Attack action, you can make one of the attack rolls using the Shield against a target within 5 feet of yourself. Apply your Proficiency Bonus and Strength modifier to the attack roll. On a hit, the Shield deals Force damage to the target equal to 2d6 + 2 plus your Strength modifier, and if the target is a creature, you can push it up to 10 feet directly away from yourself. If the creature is your size or smaller, you can also knock it down, giving it the Prone condition.\n\n_Protective Field._ As a Reaction, when you or an ally you can see within 5 feet of you is targeted by an attack or makes a saving throw against an area of effect, you can use the Shield to create an immobile 5-foot Emanation originating from you. When the Emanation appears, any creatures or objects not fully contained within it are pushed into the nearest unoccupied spaces outside it. The attack or area of effect that triggered the Reaction has no effect on creatures and objects inside the Emanation, which lasts as long as you maintain Concentration, up to 1 minute. Nothing can pass into or out of the Emanation. A creature or object inside the Emanation can't be damaged by attacks or effects originating from outside, nor can a creature inside the Emanation damage anything outside it. Once this property is used, it can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Slippers of Spider Climbing",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While you wear these light shoes, you can move up, down, and across vertical surfaces and along ceilings, while leaving your hands free. You have a Climb Speed equal to your Speed. However, the slippers don't allow you to move this way on a slippery surface, such as one covered by ice or oil.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sovereign Glue",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "",
    "text": "This viscous, milky-white substance can form a permanent adhesive bond between any two objects. It must be stored in a jar or flask that has been coated inside with _Oil of Slipperiness_. When found, a container contains 1d6 + 1 ounces.\n\nOne ounce of the glue can cover a 1-foot square surface. Applying an ounce of _Sovereign Glue_ takes a Utilize action, and the applied glue takes 1 minute to set. Once it has done so, the bond it creates can be broken only by the application of _Universal Solvent_ or _Oil of Etherealness_, or with a _Wish_ spell.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Spellguard Shield",
    "type": "Armor (Shield)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While holding this Shield, you have Advantage on saving throws against spells and other magical effects, and spell attack rolls have Disadvantage against you.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Spell Scroll",
    "type": "Scroll",
    "rarity": "Rarity Varies",
    "attune": "",
    "text": "A _Spell Scroll_ bears the words of a single spell, written in a mystical cipher. If the spell is on your spell list, you can read the scroll and cast its spell without Material components. Otherwise, the scroll is unintelligible. Casting the spell by reading the scroll requires the spell's normal casting time. Once the spell is cast, the scroll crumbles to dust. If the casting is interrupted, the scroll isn't lost.\n\nIf the spell is on your spell list but of a higher level than you can normally cast, you make an ability check using your spellcasting ability to determine whether you cast the spell. The DC equals 10 plus the spell's level. On a failed check, the spell disappears from the scroll with no other effect.\n\nThe level of the spell on the scroll determines the spell's saving throw DC and attack bonus, as well as the scroll's rarity, as shown in the following table.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell Level</th>\n      <th>Rarity</th>\n      <th>Save DC</th>\n      <th>Attack Bonus</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Cantrip</td>\n      <td>Common</td>\n      <td>13</td>\n      <td>+5</td>\n    </tr>\n    <tr>\n      <td>1</td>\n      <td>Common</td>\n      <td>13</td>\n      <td>+5</td>\n    </tr>\n    <tr>\n      <td>2</td>\n      <td>Uncommon</td>\n      <td>13</td>\n      <td>+5</td>\n    </tr>\n    <tr>\n      <td>3</td>\n      <td>Uncommon</td>\n      <td>15</td>\n      <td>+7</td>\n    </tr>\n    <tr>\n      <td>4</td>\n      <td>Rare</td>\n      <td>15</td>\n      <td>+7</td>\n    </tr>\n    <tr>\n      <td>5</td>\n      <td>Rare</td>\n      <td>17</td>\n      <td>+9</td>\n    </tr>\n    <tr>\n      <td>6</td>\n      <td>Very Rare</td>\n      <td>17</td>\n      <td>+9</td>\n    </tr>\n    <tr>\n      <td>7</td>\n      <td>Very Rare</td>\n      <td>18</td>\n      <td>+10</td>\n    </tr>\n    <tr>\n      <td>8</td>\n      <td>Very Rare</td>\n      <td>18</td>\n      <td>+10</td>\n    </tr>\n    <tr>\n      <td>9</td>\n      <td>Legendary</td>\n      <td>19</td>\n      <td>+11</td>\n    </tr>\n  </tbody>\n</table>\n\n_Copying a Scroll into a Spellbook._ A Wizard spell on a _Spell Scroll_ can be copied into a spellbook. When a spell is copied in this way, the copier must succeed on an Intelligence (Arcana) check with a DC equal to 10 plus the spell's level. On a successful check, the spell is copied. Whether the check succeeds or fails, the _Spell Scroll_ is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sphere of Annihilation",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "",
    "text": "This 2-foot-diameter black sphere is a hole in the multiverse, hovering in space and stabilized by a magical field surrounding it.\n\nThe sphere obliterates all matter it passes through and all matter that passes through it. Artifacts are the exception. Unless an Artifact is susceptible to damage from a _Sphere of Annihilation_, it passes through the sphere unscathed. Anything else that touches the sphere but isn't wholly engulfed and obliterated by it takes 8d10 Force damage.\n\n_Controlling the Sphere._ A _Sphere of Annihilation_ is stationary until someone takes control of it. If you are within 60 feet of a sphere, you can take a Magic action to make a DC 25 Intelligence (Arcana) check. On a successful check, you control the sphere until the start of your next turn, and if it was under another creature's control, that creature loses control of the sphere. On a failed check, the sphere moves 10 feet toward you in a straight line.\n\nWhile in control of the sphere, you can take a Bonus Action to cause it to move in one direction of your choice, up to a number of feet equal to 5 times your Intelligence modifier (minimum 5 feet). Any creature whose space the sphere enters must succeed on a DC 19 Dexterity saving throw or be touched by it, taking 8d10 Force damage. A creature reduced to 0 Hit Points by this damage is obliterated, leaving its possessions behind but no other physical remains.\n\n_Sphere Interactions._ If the sphere comes into contact with a planar portal (such as that created by the _Gate_ spell) or an extradimensional space (such as that within a _Portable Hole_), the GM determines randomly what happens using the following table.\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Result</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–50</td>\n      <td>The sphere is destroyed.</td>\n    </tr>\n    <tr>\n      <td>51–85</td>\n      <td>The sphere moves through the portal or into the extradimensional space.</td>\n    </tr>\n    <tr>\n      <td>86–00</td>\n      <td>A spatial rift sends the sphere and each creature and object within 180 feet of the sphere to a random plane of existence.</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of Charming",
    "type": "Staff",
    "rarity": "Rare",
    "attune": "Requires Attunement by a Bard, Cleric, Druid, Sorcerer, Warlock, or Wizard",
    "text": "This staff has 10 charges. While holding the staff, you can use any of its properties:\n\n**Cast Spell.** You can expend 1 of the staff's charges to cast _Charm Person_, _Command_, or _Comprehend Languages_ from it using your spell save DC.\n\n**Reflect Enchantment.** If you succeed on a saving throw against an Enchantment spell that targets only you, you can take a Reaction to expend 1 charge from the staff and turn the spell back on its caster as if you had cast the spell.\n\n**Resist Enchantment.** If you fail a saving throw against an Enchantment spell that targets only you, you can turn your failed save into a successful one. You can't use this property of the staff again until the next dawn.\n\n_Regaining Charges._ The staff regains 1d8 + 2 expended charges daily at dawn. If you expend the last charge, roll 1d20. On a 1, the staff crumbles to dust and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of Fire",
    "type": "Staff",
    "rarity": "Very Rare",
    "attune": "Requires Attunement by a Druid, Sorcerer, Warlock, or Wizard",
    "text": "You have Resistance to Fire damage while you hold this staff.\n\n_Spells._ The staff has 10 charges. While holding the staff, you can cast one of the spells on the following table from it, using your spell save DC. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>*Burning Hands*</td>\n      <td>1</td>\n      <td>*Wall of Fire*</td>\n      <td>4</td>\n    </tr>\n    <tr>\n      <td>*Fireball*</td>\n      <td>3</td>\n      <td></td>\n      <td></td>\n    </tr>\n  </tbody>\n</table>\n\n_Regaining Charges._ The staff regains 1d6 + 4 expended charges daily at dawn. If you expend the last charge, roll 1d20. On a 1, the staff crumbles into cinders and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of Frost",
    "type": "Staff",
    "rarity": "Very Rare",
    "attune": "Requires Attunement by a Druid, Sorcerer, Warlock, or Wizard",
    "text": "You have Resistance to Cold damage while you hold this staff.\n\n_Spells._ The staff has 10 charges. While holding the staff, you can cast one of the spells on the following table from it, using your spell save DC. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>*Cone of Cold*</td>\n      <td>5</td>\n      <td>*Ice Storm*</td>\n      <td>4</td>\n    </tr>\n    <tr>\n      <td>*Fog Cloud*</td>\n      <td>1</td>\n      <td>*Wall of Ice*</td>\n      <td>4</td>\n    </tr>\n  </tbody>\n</table>\n\n_Regaining Charges._ The staff regains 1d6 + 4 expended charges daily at dawn. If you expend the last charge, roll 1d20. On a 1, the staff turns to water and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of Healing",
    "type": "Staff",
    "rarity": "Rare",
    "attune": "Requires Attunement by a Bard, Cleric, or Druid",
    "text": "This staff has 10 charges. While holding the staff, you can cast one of the spells on the following table from it, using your spellcasting ability modifier. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>*Cure Wounds*</td>\n      <td>1 charge per spell level (maximum 4 for a level 4 spell)</td>\n    </tr>\n    <tr>\n      <td>*Lesser Restoration*</td>\n      <td>2</td>\n    </tr>\n    <tr>\n      <td>*Mass Cure Wounds*</td>\n      <td>5</td>\n    </tr>\n  </tbody>\n</table>\n\n_Regaining Charges._ The staff regains 1d6 + 4 expended charges daily at dawn. If you expend the last charge, roll 1d20. On a 1, the staff vanishes in a flash of light, lost forever.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of Power",
    "type": "Staff",
    "rarity": "Very Rare",
    "attune": "Requires Attunement by a Sorcerer, Warlock, or Wizard",
    "text": "This staff has 20 charges and can be wielded as a magic Quarterstaff that grants a +2 bonus to attack rolls and damage rolls made with it. While holding it, you gain a +2 bonus to Armor Class, saving throws, and spell attack rolls.\n\n_Spells._ While holding the staff, you can cast one of the spells on the following table from it, using your spell save DC. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>*Cone of Cold*</td>\n      <td>5</td>\n    </tr>\n    <tr>\n      <td>*Fireball* (level 5 version)</td>\n      <td>5</td>\n    </tr>\n    <tr>\n      <td>*Globe of Invulnerability*</td>\n      <td>6</td>\n    </tr>\n    <tr>\n      <td>*Hold Monster*</td>\n      <td>5</td>\n    </tr>\n    <tr>\n      <td>*Levitate*</td>\n      <td>2</td>\n    </tr>\n    <tr>\n      <td>*Lightning Bolt* (level 5 version)</td>\n      <td>5</td>\n    </tr>\n    <tr>\n      <td>*Magic Missile*</td>\n      <td>1</td>\n    </tr>\n    <tr>\n      <td>*Ray of Enfeeblement*</td>\n      <td>1</td>\n    </tr>\n    <tr>\n      <td>*Wall of Force*</td>\n      <td>5</td>\n    </tr>\n  </tbody>\n</table>\n\n_Regaining Charges._ The staff regains 2d8 + 4 expended charges daily at dawn. If you expend the last charge, roll 1d20. On a 1, the staff retains its +2 bonus to attack rolls and damage rolls but loses all other properties. On a 20, the staff regains 1d8 + 2 charges.\n\n_Retributive Strike._ You can take a Magic action to break the staff over your knee or against a solid surface. The staff is destroyed and releases its magic in an explosion that fills a 30-foot Emanation originating from itself. You have a 50 percent chance to instantly travel to a random plane of existence, avoiding the explosion. If you fail to avoid the effect, you take Force damage equal to 16 times the number of charges in the staff. Each other creature in the area makes a DC 17 Dexterity saving throw. On a failed save, a creature takes Force damage equal to 4 times the number of charges in the staff. On a successful save, a creature takes half as much damage.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of Striking",
    "type": "Staff",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "This staff can be wielded as a magic Quarterstaff that grants a +3 bonus to attack rolls and damage rolls made with it.\n\nThe staff has 10 charges. When you hit with a melee attack using it, you can expend up to 3 charges. For each charge you expend, the target takes an extra 1d6 Force damage.\n\n_Regaining Charges._ The staff regains 1d6 + 4 expended charges daily at dawn. If you expend the last charge, roll 1d20. On a 1, the staff becomes a nonmagical Quarterstaff.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of Swarming Insects",
    "type": "Staff",
    "rarity": "Rare",
    "attune": "Requires Attunement by a Bard, Cleric, Druid, Sorcerer, Warlock, or Wizard",
    "text": "This staff has 10 charges.\n\n_Insect Cloud._ While holding the staff, you can take a Magic action and expend 1 charge to cause a swarm of harmless flying insects to fill a 30-foot Emanation originating from you. The insects remain for 10 minutes, making the area Heavily Obscured for creatures other than you. A strong wind (like that created by _Gust of Wind_) disperses the swarm and ends the effect.\n\n_Spells._ While holding the staff, you can cast one of the spells on the following table from it, using your spell save DC and spell attack modifier. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>*Giant Insect*</td>\n      <td>4</td>\n    </tr>\n    <tr>\n      <td>*Insect Plague*</td>\n      <td>5</td>\n    </tr>\n  </tbody>\n</table>\n\n_Regaining Charges._ The staff regains 1d6 + 4 expended charges daily at dawn. If you expend the last charge, roll 1d20. On a 1, a swarm of insects consumes and destroys the staff, then disperses.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of the Magi",
    "type": "Staff",
    "rarity": "Legendary",
    "attune": "Requires Attunement by a Sorcerer, Warlock, or Wizard",
    "text": "This staff has 50 charges and can be wielded as a magic Quarterstaff that grants a +2 bonus to attack rolls and damage rolls made with it. While you hold it, you gain a +2 bonus to spell attack rolls.\n\n_Spell Absorption._ While holding the staff, you have Advantage on saving throws against spells. In addition, you can take a Reaction when another creature casts a spell that targets only you. If you do, the staff absorbs the magic of the spell, canceling its effect and gaining a number of charges equal to the absorbed spell's level. However, if doing so brings the staff's total number of charges above 50, the staff explodes as if you activated its Retributive Strike (see below).\n\n_Spells._ While holding the staff, you can cast one of the spells on the following table from it, using your spell save DC. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>*Arcane Lock*</td>\n      <td>0</td>\n    </tr>\n    <tr>\n      <td>*Conjure Elemental*</td>\n      <td>7</td>\n    </tr>\n    <tr>\n      <td>*Detect Magic*</td>\n      <td>0</td>\n    </tr>\n    <tr>\n      <td>*Dispel Magic*</td>\n      <td>3</td>\n    </tr>\n    <tr>\n      <td>*Enlarge/Reduce*</td>\n      <td>0</td>\n    </tr>\n    <tr>\n      <td>*Fireball* (level 7 version)</td>\n      <td>7</td>\n    </tr>\n    <tr>\n      <td>*Flaming Sphere*</td>\n      <td>2</td>\n    </tr>\n    <tr>\n      <td>*Ice Storm*</td>\n      <td>4</td>\n    </tr>\n    <tr>\n      <td>*Invisibility*</td>\n      <td>2</td>\n    </tr>\n    <tr>\n      <td>*Knock*</td>\n      <td>2</td>\n    </tr>\n    <tr>\n      <td>*Light*</td>\n      <td>0</td>\n    </tr>\n    <tr>\n      <td>*Lightning Bolt* (level 7 version)</td>\n      <td>7</td>\n    </tr>\n    <tr>\n      <td>*Passwall*</td>\n      <td>5</td>\n    </tr>\n    <tr>\n      <td>*Plane Shift*</td>\n      <td>7</td>\n    </tr>\n    <tr>\n      <td>*Protection from Evil and Good*</td>\n      <td>0</td>\n    </tr>\n    <tr>\n      <td>*Telekinesis*</td>\n      <td>5</td>\n    </tr>\n    <tr>\n      <td>*Wall of Fire*</td>\n      <td>4</td>\n    </tr>\n    <tr>\n      <td>*Web*</td>\n      <td>2</td>\n    </tr>\n  </tbody>\n</table>\n\n_Regaining Charges._ The staff regains 4d6 + 2 expended charges daily at dawn. If you expend the last charge, roll 1d20. On a 20, the staff regains 1d12 + 1 charges.\n\n_Retributive Strike._ You can take a Magic action to break the staff over your knee or against a solid surface. The staff is destroyed and releases its magic in an explosion that fills a 30-foot Emanation originating from itself. You have a 50 percent chance to instantly travel to a random plane of existence, avoiding the explosion. If you fail to avoid the effect, you take Force damage equal to 16 times the number of charges in the staff. Each other creature in the area makes a DC 17 Dexterity saving throw. On a failed save, a creature takes Force damage equal to 6 times the number of charges in the staff. On a successful save, a creature takes half as much damage.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of the Python",
    "type": "Staff",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "As a Magic action, you can throw this staff so that it lands in an unoccupied space within 10 feet of you, causing the staff to become a **Giant Constrictor Snake** in that space. The snake is under your control and shares your Initiative count, taking its turn immediately after yours.\n\nOn your turn, you can mentally command the snake (no action required) if it is within 60 feet of you and you don't have the Incapacitated condition. You decide what action the snake takes and where it moves during its turn, or you can issue it a general command, such as to attack your enemies or guard a location. Absent commands from you, the snake defends itself.\n\nAs a Bonus Action, you can command the snake to revert to staff form in its current space, and you can't use the staff's property again for 1 hour. If the snake is reduced to 0 Hit Points, it dies and reverts to its staff form; the staff then shatters and is destroyed. If the snake reverts to staff form before losing all its Hit Points, it regains all of them.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of the Woodlands",
    "type": "Staff",
    "rarity": "Rare",
    "attune": "Requires Attunement by a Druid",
    "text": "This staff has 6 charges and can be wielded as a magic Quarterstaff that grants a +2 bonus to attack rolls and damage rolls made with it. While holding it, you have a +2 bonus to spell attack rolls.\n\n_Spells._ While holding the staff, you can cast one of the spells on the following table from it, using your spell save DC. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>*Animal Friendship*</td>\n      <td>1</td>\n    </tr>\n    <tr>\n      <td>*Awaken*</td>\n      <td>5</td>\n    </tr>\n    <tr>\n      <td>*Barkskin*</td>\n      <td>2</td>\n    </tr>\n    <tr>\n      <td>*Locate Animals or Plants*</td>\n      <td>2</td>\n    </tr>\n    <tr>\n      <td>*Pass without Trace*</td>\n      <td>2</td>\n    </tr>\n    <tr>\n      <td>*Speak with Animals*</td>\n      <td>1</td>\n    </tr>\n    <tr>\n      <td>*Speak with Plants*</td>\n      <td>3</td>\n    </tr>\n    <tr>\n      <td>*Wall of Thorns*</td>\n      <td>6</td>\n    </tr>\n  </tbody>\n</table>\n\n_Tree Form._ You can take a Magic action to plant one end of the staff in earth in an unoccupied space and expend 1 charge to transform the staff into a healthy tree. The tree is 60 feet tall and has a 5-foot-diameter trunk, and its branches at the top spread out in a 20-foot radius. The tree appears ordinary but radiates a faint aura of Transmutation magic that can be discerned with the _Detect Magic_ spell. While touching the tree and using a Magic action, you return the staff to its normal form. Any creature in the tree falls when the tree reverts to a staff.\n\n_Regaining Charges._ The staff regains 1d6 expended charges daily at dawn. If you expend the last charge, roll 1d20. On a 1, the staff loses its properties and becomes a nonmagical Quarterstaff.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of Thunder and Lightning",
    "type": "Staff",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "This staff can be wielded as a magic Quarterstaff that grants a +2 bonus to attack rolls and damage rolls made with it. It also has the following additional properties. Once one of these properties is used, it can't be used again until the next dawn.\n\n_Lightning._ When you hit with a melee attack using the staff, you can cause the target to take an extra 2d6 Lightning damage (no action required).\n\n_Thunder._ When you hit with a melee attack using the staff, you can cause the staff to emit a crack of thunder audible out to 300 feet (no action required). The target you hit must succeed on a DC 17 Constitution saving throw or have the Stunned condition until the end of your next turn.\n\n**_Thunder and Lightning._** Immediately after you hit with a melee attack using the staff, you can take a Bonus Action to use the Lightning and Thunder properties (see above) at the same time. Doing so doesn't expend the daily use of those properties, only the use of this one.\n\n_Lightning Strike._ You can take a Magic action to cause a bolt of lightning to leap from the staff's tip in a Line that is 5 feet wide and 120 feet long. Each creature in that Line makes a DC 17 Dexterity saving throw, taking 9d6 Lightning damage on a failed save or half as much damage on a successful one.\n\n_Thunderclap._ You can take a Magic action to cause the staff to produce a thunderclap audible out to 600 feet. Every creature within a 60-foot Emanation originating from you makes a DC 17 Constitution saving throw. On a failed save, a creature takes 2d6 Thunder damage and has the Deafened condition for 1 minute. On a successful save, a creature takes half as much damage only.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Staff of Withering",
    "type": "Staff",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This staff has 3 charges and regains 1d3 expended charges daily at dawn.\n\nThe staff can be wielded as a magic Quarterstaff. On a hit, it deals damage as a normal Quarterstaff, and you can expend 1 charge to deal an extra 2d10 Necrotic damage to the target and force it to make a DC 15 Constitution saving throw. On a failed save, the target has Disadvantage for 1 hour on any ability check or saving throw that uses Strength or Constitution.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Stone of Controlling Earth Elementals",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "",
    "text": "While touching this 5-pound stone to the ground, you can take a Magic action to summon an **Earth Elemental**. The elemental appears in an unoccupied space you choose within 30 feet of yourself, obeys your commands, and takes its turn immediately after you on your Initiative count. The elemental disappears after 1 hour, when it dies, or when you dismiss it as a Bonus Action. The stone can't be used this way again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Stone of Good Luck (Luckstone)",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "While this polished agate is on your person, you gain a +1 bonus to ability checks and saving throws.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sun Blade",
    "type": "Weapon (Longsword)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This item appears to be a sword hilt.\n\n_Blade of Radiance._ While grasping the hilt, you can take a Bonus Action to cause a blade of pure radiance to spring into existence or make the blade disappear. While the blade exists, this magic weapon functions as a Longsword with the Finesse property. If you are proficient with Longswords or Shortswords, you are proficient with the _Sun Blade_.\n\nYou gain a +2 bonus to attack rolls and damage rolls made with this weapon, which deals Radiant damage instead of Slashing damage. When you hit an Undead with it, that target takes an extra 1d8 Radiant damage.\n\n_Sunlight._ The sword's luminous blade emits Bright Light in a 15-foot radius and Dim Light for an additional 15 feet. The light is sunlight. While the blade persists, you can take a Magic action to expand or reduce its radius of Bright Light and Dim Light by 5 feet each, to a maximum of 30 feet each or a minimum of 10 feet each.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sword of Life Stealing",
    "type": "Weapon (Glaive, Greatsword, Longsword, Rapier, Scimitar, or Shortsword)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "When you attack a creature with this magic weapon and roll a 20 on the d20 for the attack roll, that target takes an extra 15 Necrotic damage if it isn't a Construct or an Undead, and you gain Temporary Hit Points equal to the amount of Necrotic damage taken.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sword of Sharpness",
    "type": "Weapon (Glaive, Greatsword, Longsword, or Scimitar)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "When you attack an object with this magic weapon and hit, maximize your weapon damage dice against the target.\n\nWhen you attack a creature with this weapon and roll a 20 on the d20 for the attack roll, that target takes an extra 14 Slashing damage and gains 1 Exhaustion level.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Sword of Wounding",
    "type": "Weapon (Glaive, Greatsword, Longsword, Rapier, Scimitar, or Shortsword)",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "When you hit a creature with an attack using this magic weapon, the target takes an extra 2d6 Necrotic damage and must succeed on a DC 15 Constitution saving throw or be unable to regain Hit Points for 1 hour. The target repeats the save at the end of each of its turns, ending the effect on itself on a success.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Talisman of Pure Good",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "Requires Attunement by a Cleric or Paladin",
    "text": "This talisman is a mighty symbol of goodness. A Fiend or an Undead that touches the talisman takes 8d6 Radiant damage and takes the damage again each time it ends its turn holding or carrying the talisman.\n\n_Holy Symbol._ You can use the talisman as a Holy Symbol. You gain a +2 bonus to spell attack rolls while you wear or hold it.\n\n_Pure Rebuke._ The talisman has 7 charges. While wearing or holding the talisman, you can take a Magic action to expend 1 charge and target one creature you can see on the ground within 120 feet of yourself. A flaming fissure opens under the target, and the target makes a DC 20 Dexterity saving throw. If the target is a Fiend or an Undead, it has Disadvantage on the save. On a failed save, the target falls into the fissure and is destroyed, leaving no remains. On a successful save, the target isn't cast into the fissure but takes 4d6 Psychic damage from the ordeal. In either case, the fissure then closes, leaving no trace of its existence. When you expend the last charge, the talisman disperses into motes of golden light and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Talisman of the Sphere",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "While holding or wearing this talisman, you have Advantage on any Intelligence (Arcana) check you make to control a _Sphere of Annihilation_. In addition, when you start your turn in control of a _Sphere of Annihilation_, you can take a Magic action to move it 10 feet plus a number of additional feet equal to 10 times your Intelligence modifier. This movement doesn't have to be in a straight line.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Talisman of Ultimate Evil",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "This item symbolizes unrepentant evil. A creature that isn't a Fiend or an Undead that touches the talisman takes 8d6 Necrotic damage and takes the damage again each time it ends its turn holding or carrying the talisman.\n\n_Holy Symbol._ You can use the talisman as a Holy Symbol. You gain a +2 bonus to spell attack rolls while you wear or hold it.\n\n_Ultimate End._ The talisman has 6 charges. While wearing or holding the talisman, you can take a Magic action to expend 1 charge and target one creature you can see on the ground within 120 feet of yourself. A flaming fissure opens under the target, and the target makes a DC 20 Dexterity saving throw. If the target is a Celestial, it has Disadvantage on the save. On a failed save, the target falls into the fissure and is destroyed, leaving no remains. On a successful save, the target isn't cast into the fissure but takes 4d6 Psychic damage from the ordeal. In either case, the fissure then closes, leaving no trace of its existence. When you expend the last charge, the talisman dissolves into foul-smelling slime and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Thunderous Greatclub",
    "type": "Weapon (Greatclub)",
    "rarity": "Very Rare",
    "attune": "Requires Attunement",
    "text": "While you are attuned to this magic weapon, your Strength is 20 unless your Strength is already equal to or greater than that score. The weapon deals an extra 1d8 Thunder damage to any creature it hits and an extra 3d8 Thunder damage to objects it hits that aren't being worn or carried.\n\nThe weapon has the following additional properties.\n\n_Clap of Thunder._ As a Magic action, you can strike the weapon against a hard surface to create a loud clap of thunder audible out to 300 feet. You also create a 30-foot Cone of thunderous energy. Each creature in the Cone must succeed on a DC 15 Strength saving throw or have the Prone condition. Nonmagical objects in the Cone that aren't being worn or carried take 3d8 Thunder damage.\n\n_Earthquake._ As a Magic action, you can strike the weapon against the ground to create an intense seismic disturbance in a 50-foot-radius circle centered on the point of impact. Structures in contact with the ground in that area take 50 Bludgeoning damage, and each creature on the ground in that area must succeed on a DC 20 Dexterity saving throw or have the Prone condition. If that creature is also concentrating, it must succeed on a DC 20 Constitution saving throw, or its Concentration is broken. In addition, you can cause a 30-foot-deep, 10-foot-wide fissure to open up on the ground anywhere in the area. Any creature on a spot where the fissure opens must make a DC 20 Dexterity saving throw, falling into the fissure on a failed save or moving with the fissure's edge on a successful one. Any structure on a spot where the fissure opens collapses into the fissure. Once you use this property, it can't be used again until the next dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Tome of Clear Thought",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This book contains memory and logic exercises, and its words are charged with magic. If you spend 48 hours over a period of 6 days or fewer studying the book's contents and practicing its guidelines, your Intelligence increases by 2, to a maximum of 30. The manual then loses its magic but regains it in a century.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Tome of Leadership and Influence",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This book contains guidelines for influencing and charming others, and its words are charged with magic. If you spend 48 hours over a period of 6 days or fewer studying the book's contents and practicing its guidelines, your Charisma increases by 2, to a maximum of 30. The manual then loses its magic but regains it in a century.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Tome of Understanding",
    "type": "Wondrous Item",
    "rarity": "Very Rare",
    "attune": "",
    "text": "This book contains intuition and insight exercises, and its words are charged with magic. If you spend 48 hours over a period of 6 days or fewer studying the book's contents and practicing its guidelines, your Wisdom increases by 2, to a maximum of 30. The manual then loses its magic, but regains it in a century.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Trident of Fish Command",
    "type": "Weapon (Trident)",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "This magic weapon has 3 charges, and it regains 1d3 expended charges daily at dawn. While you carry it, you can expend 1 charge to cast _Dominate Beast_ (save DC 15) from it on a Beast that has a Swim Speed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Universal Solvent",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "",
    "text": "This tube holds milky liquid with a strong alcohol smell. When found, a tube contains 1d6 + 1 ounces.\n\nYou can take a Utilize action to pour 1 or more ounces of solvent from the tube onto a surface within reach. Each ounce instantly dissolves up to 1 square foot of adhesive it touches, including _Sovereign Glue_.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Vicious Weapon",
    "type": "Weapon (Any Simple or Martial)",
    "rarity": "Rare",
    "attune": "",
    "text": "This magic weapon deals an extra 2d6 damage to any creature it hits. This extra damage is of the same type as the weapon's normal damage.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Vorpal Sword",
    "type": "Weapon (Glaive, Greatsword, Longsword, or Scimitar)",
    "rarity": "Legendary",
    "attune": "Requires Attunement",
    "text": "You gain a +3 bonus to attack rolls and damage rolls made with this magic weapon. In addition, the weapon ignores Resistance to Slashing damage.\n\nWhen you use this weapon to attack a creature that has at least one head and roll a 20 on the d20 for the attack roll, you cut off one of the creature's heads. The creature dies if it can't survive without the lost head. A creature is immune to this effect if it has Immunity to Slashing damage, if it doesn't have or need a head, or if the GM decides that the creature is too big for its head to be cut off with this weapon. Such a creature instead takes an extra 30 Slashing damage from the hit. If the creature has Legendary Resistance, it can expend one daily use of that trait to avoid losing its head, taking the extra damage instead.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Binding",
    "type": "Wand",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This wand has 7 charges.\n\n_Spells._ While holding the wand, you can cast one of the spells (save DC 17) on the following table from it. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>*Hold Monster*</td>\n      <td>5</td>\n    </tr>\n    <tr>\n      <td>*Hold Person*</td>\n      <td>2</td>\n    </tr>\n  </tbody>\n</table>\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into ashes and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Enemy Detection",
    "type": "Wand",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This wand has 7 charges. While holding it, you can take a Magic action to expend 1 charge. For 1 minute, you know the direction of the nearest creature Hostile to you within 60 feet, but not its distance from you. The wand can sense the presence of Hostile creatures that are Invisible, ethereal, disguised, or hidden, as well as those in plain sight. The effect ends if you stop holding the wand.\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into ashes and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Fear",
    "type": "Wand",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This wand has 7 charges.\n\n_Spells._ While holding the wand, you can cast one of the spells (save DC 15) on the following table from it. The table indicates how many charges you must expend to cast the spell.\n\n<table>\n  <thead>\n    <tr>\n      <th>Spell</th>\n      <th>Charge Cost</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>*Command* (flee or grovel only)</td>\n      <td>1</td>\n    </tr>\n    <tr>\n      <td>*Fear* (60-foot Cone)</td>\n      <td>3</td>\n    </tr>\n  </tbody>\n</table>\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into ashes and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Fireballs",
    "type": "Wand",
    "rarity": "Rare",
    "attune": "Requires Attunement by a Spellcaster",
    "text": "This wand has 7 charges. While holding it, you can expend no more than 3 charges to cast _Fireball_ (save DC 15) from it. For 1 charge, you cast the level 3 version of the spell. You can increase the spell's level by 1 for each additional charge you expend.\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into ashes and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Lightning Bolts",
    "type": "Wand",
    "rarity": "Rare",
    "attune": "Requires Attunement by a Spellcaster",
    "text": "This wand has 7 charges. While holding it, you can expend no more than 3 charges to cast _Lightning Bolt_ (save DC 15) from it. For 1 charge, you cast the level 3 version of the spell. You can increase the spell's level by 1 for each additional charge you expend.\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into ashes and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Magic Detection",
    "type": "Wand",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This wand has 3 charges. While holding it, you can expend 1 charge to cast _Detect Magic_ from it. The wand regains 1d3 expended charges daily at dawn.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Magic Missiles",
    "type": "Wand",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This wand has 7 charges. While holding it, you can expend no more than 3 charges to cast _Magic Missile_ from it. For 1 charge, you cast the level 1 version of the spell. You can increase the spell's level by 1 for each additional charge you expend.\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into ashes and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Paralysis",
    "type": "Wand",
    "rarity": "Rare",
    "attune": "Requires Attunement by a Spellcaster",
    "text": "This wand has 7 charges. While holding it, you can take a Magic action to expend 1 charge to cause a thin blue ray to streak from the tip toward a creature you can see within 60 feet of yourself. The target must succeed on a DC 15 Constitution saving throw or have the Paralyzed condition for 1 minute. At the end of each of the target's turns, it repeats the save, ending the effect on itself on a success.\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into ashes and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Polymorph",
    "type": "Wand",
    "rarity": "Very Rare",
    "attune": "Requires Attunement by a Spellcaster",
    "text": "This wand has 7 charges. While holding it, you can expend 1 charge to cast _Polymorph_ (save DC 15) from it.\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into ashes and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Secrets",
    "type": "Wand",
    "rarity": "Uncommon",
    "attune": "",
    "text": "This wand has 3 charges and regains 1d3 expended charges daily at dawn. While holding it, you can take a Magic action to expend 1 charge, and if a secret door or trap is within 60 feet of you, the wand pulses and points at the one nearest to you.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of the War Mage, +1, +2, or +3",
    "type": "Wand",
    "rarity": "Uncommon (+1), Rare (+2), or Very Rare (+3)",
    "attune": "Requires Attunement by a Spellcaster",
    "text": "While holding this wand, you gain a bonus to spell attack rolls determined by the wand's rarity. In addition, you ignore Half Cover when making a spell attack roll.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Web",
    "type": "Wand",
    "rarity": "Uncommon",
    "attune": "Requires Attunement by a Spellcaster",
    "text": "This wand has 7 charges. While holding it, you can expend 1 charge to cast _Web_ (save DC 13) from it.\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into ashes and is destroyed.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wand of Wonder",
    "type": "Wand",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "This wand has 7 charges. While holding it, you can take a Magic action to expend 1 charge while choosing a point within 120 feet of yourself. That location becomes the point of origin of a spell or other magical effect determined by rolling on the Wand of Wonder Effects table. Spells cast from the wand have a save DC of 15. If a spell's maximum range is normally less than 120 feet, it becomes 120 feet when cast from the wand. If an effect has multiple possible subjects, the GM determines randomly which among them are affected.\n\n_Regaining Charges._ The wand regains 1d6 + 1 expended charges daily at dawn. If you expend the wand's last charge, roll 1d20. On a 1, the wand crumbles into dust and is destroyed.\n\n**Wand of Wonder Effects**\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Effect</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>01–20</td>\n      <td>You cast a spell originating from the chosen point. Roll 1d10 to determine the spell: on a 1–2, Darkness; on a 3–4, Faerie Fire; on a 5–6, Fireball; on a 7–8, Slow; on a 9–10, Stinking Cloud.</td>\n    </tr>\n    <tr>\n      <td>21–25</td>\n      <td>Nothing happens at the chosen point of origin. Instead, you have the Stunned condition until the start of your next turn, believing something awesome just happened.</td>\n    </tr>\n    <tr>\n      <td>26–30</td>\n      <td>You cast Gust of Wind. The Line created by the spell extends from you to the chosen point of origin.</td>\n    </tr>\n    <tr>\n      <td>31–35</td>\n      <td>Nothing happens at the chosen point of origin. Instead, you take 1d6 Psychic damage.</td>\n    </tr>\n    <tr>\n      <td>36–40</td>\n      <td>Heavy rain falls for 1 minute in a 120-foot-high, 60-foot-radius Cylinder centered on the chosen point of origin. During that time, the area of effect is Lightly Obscured.</td>\n    </tr>\n    <tr>\n      <td>41–45</td>\n      <td>A cloud of 600 oversized butterflies fills a 60-foot-high, 30-foot-radius Cylinder centered on the chosen point of origin. The butterflies remain for 10 minutes, during which time the area of effect is Heavily Obscured.</td>\n    </tr>\n    <tr>\n      <td>46–50</td>\n      <td>You cast Lightning Bolt. The Line created by the spell extends from you to the chosen point of origin.</td>\n    </tr>\n    <tr>\n      <td>51–55</td>\n      <td>The creature closest to the chosen point of origin is enlarged as if you had cast Enlarge/ Reduce on it. If the target isn't you and can't be affected by that spell, you become the target instead.</td>\n    </tr>\n    <tr>\n      <td>56–60</td>\n      <td>A magically formed creature appears in an unoccupied space as close to the chosen point of origin as possible. The creature isn't under your control, acts as it normally would, and disappears after 1 hour or when it drops to 0 Hit Points. Roll 1d4 to determine which creature appears. On a 1, a Rhinoceros appears; on a 2, an Elephant appears; and on a 3–4, a Rat appears.</td>\n    </tr>\n    <tr>\n      <td>61–64</td>\n      <td>Grass covers a 60-foot-radius circle of ground, with the center of that circle as close to the chosen point of origin as possible. Grass that's already there grows to ten times its normal size and remains overgrown for 1 minute.</td>\n    </tr>\n  </tbody>\n</table>\n\n<table>\n  <thead>\n    <tr>\n      <th>1d100</th>\n      <th>Effect</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>65–68</td>\n      <td>An object of the GM's choice disappears into the Ethereal Plane. The object must be neither worn nor carried, within 120 feet of the chosen point of origin, and no larger than 10 feet in any dimension. If there are no such objects in range, nothing happens.</td>\n    </tr>\n    <tr>\n      <td>69–72</td>\n      <td>Nothing happens at the chosen point of origin. Instead, you shrink as if you had cast Enlarge/ Reduce on yourself and remain in that state for 1 minute.</td>\n    </tr>\n    <tr>\n      <td>73–77</td>\n      <td>Leaves grow from the creature nearest to the chosen point of origin. Unless they are picked off, the leaves turn brown and fall off after 24 hours.</td>\n    </tr>\n    <tr>\n      <td>78–82</td>\n      <td>Nothing happens at the chosen point of origin. Instead, a burst of colorful, shimmering light extends from you in a 30-foot Emanation. Each creature in the area must succeed on a DC 15 Constitution saving throw or have the Blinded condition for 1 minute. A creature repeats the save at the end of each of its turns, ending the effect on itself on a success.</td>\n    </tr>\n    <tr>\n      <td>83–87</td>\n      <td>Nothing happens at the chosen point of origin. Instead, you cast Invisibility on yourself.</td>\n    </tr>\n    <tr>\n      <td>88–92</td>\n      <td>Nothing happens at the chosen point of origin. Instead, a stream of 1d4 × 10 gems, each worth 1 GP, shoots from the wand's tip in a Line 30 feet long and 5 feet wide toward the chosen point of origin. Each gem deals 1 Bludgeoning damage, and the total damage of the gems is divided equally among all creatures in the Line.</td>\n    </tr>\n    <tr>\n      <td>93–97</td>\n      <td>You cast Polymorph, targeting the creature closest to the chosen point of origin. Roll 1d4 to determine the target's new form. On a 1, the new form is a Black Bear; on a 2, the new form is a Giant Wasp; on a 3–4, the new form is a Frog.</td>\n    </tr>\n    <tr>\n      <td>98–00</td>\n      <td>The creature closest to the chosen point of origin makes a DC 15 Constitution saving throw. On a failed save, the creature has the Restrained condition and begins to turn to stone. While Restrained in this way, the creature repeats the save at the end of its next turn. On a successful save, the effect ends. On a failed save, the creature has the Petrified condition instead of the Restrained condition. The petrification lasts until the creature is freed by the Greater Restoration spell or similar magic.</td>\n    </tr>\n  </tbody>\n</table>",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Weapon, +1, +2, or +3",
    "type": "Weapon (Any Simple or Martial)",
    "rarity": "Uncommon (+1), Rare (+2), or Very Rare (+3)",
    "attune": "",
    "text": "You have a bonus to attack rolls and damage rolls made with this magic weapon. The bonus is determined by the weapon's rarity.",
    "src": "SRD 5.2.1",
    "variants": [
      {
        "n": "Weapon, +1",
        "rarity": "Uncommon",
        "atk": 1,
        "dmgBonus": 1
      },
      {
        "n": "Weapon, +2",
        "rarity": "Rare",
        "atk": 2,
        "dmgBonus": 2
      },
      {
        "n": "Weapon, +3",
        "rarity": "Very Rare",
        "atk": 3,
        "dmgBonus": 3
      }
    ]
  },
  {
    "n": "Weapon of Warning",
    "type": "Weapon (Any Simple or Martial)",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "As long as this weapon is within your reach and you are attuned to it, you and allies within 30 feet of you gain the following benefits.\n\n_Alarm._ The weapon magically awakens each subject who is sleeping naturally when combat begins. This benefit doesn't wake a subject from magically induced sleep.\n\n_Supernatural Readiness._ Each subject has Advantage on its Initiative rolls.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Well of Many Worlds",
    "type": "Wondrous Item",
    "rarity": "Legendary",
    "attune": "",
    "text": "This fine black cloth, soft as silk, is folded up to the dimensions of a handkerchief. It unfolds into a circular sheet 6 feet in diameter.\n\nYou can take a Magic action to unfold the _Well of Many Worlds_ and place it on a solid surface, whereupon it forms a two-way, 6-foot-diameter, circular portal to another world or plane of existence. Each time the item opens a portal, the GM decides where it leads. The portal remains open until a creature within 5 feet of it takes a Magic action to close it by taking hold of the edges of the cloth and folding it up.\n\nOnce the _Well of Many Worlds_ has opened a portal, it can't do so again for 1d8 hours.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wind Fan",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "",
    "text": "While holding this fan, you can cast _Gust of Wind_ (save DC 13) from it. Each subsequent time the fan is used before the next dawn, it has a cumulative 20 percent chance of not working; if the fan fails to work, it tears into useless, nonmagical tatters.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Winged Boots",
    "type": "Wondrous Item",
    "rarity": "Uncommon",
    "attune": "Requires Attunement",
    "text": "These boots have 4 charges and regain 1d4 expended charges daily at dawn. While wearing the boots, you can take a Magic action to expend 1 charge, gaining a Fly Speed of 30 feet for 1 hour. If you are flying when the duration expires, you descend at a rate of 30 feet per round until you land.",
    "src": "SRD 5.2.1"
  },
  {
    "n": "Wings of Flying",
    "type": "Wondrous Item",
    "rarity": "Rare",
    "attune": "Requires Attunement",
    "text": "While wearing this cloak, you can take a Magic action to turn the cloak into a pair of wings on your back. The wings lasts for 1 hour or until you end the effect early as a Magic action. The wings give you a Fly Speed of 60 feet. If you are aloft when the wings disappear, you fall. When the wings disappear, you can't use them again for 1d12 hours.",
    "src": "SRD 5.2.1"
  }
];
