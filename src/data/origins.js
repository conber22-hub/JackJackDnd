export const ORIGINS = {
  "drawn-ancient": {
    "id": "drawn-ancient",
    "name": "Bronze at Dawn",
    "group": "drawn",
    "like": "Human",
    "blurb": "You stepped out of the front rank to fetch water. When you turned back, the shields behind you were headstones.",
    "look": "Bronze cheek plates, a red wool cloak and a drinking cup on a cord.",
    "traits": [
      {
        "n": "Camp Discipline",
        "text": "After a long rest receive Heroic Inspiration."
      },
      {
        "n": "Old Trade",
        "text": "Choose one extra skill and one extra origin feat."
      }
    ]
  },
  "drawn-medieval": {
    "id": "drawn-medieval",
    "name": "Winter Levy",
    "group": "drawn",
    "like": "Human",
    "blurb": "You gave an oath on a frozen ford. Your lord and his banner crossed. The river brought you here.",
    "look": "Stitched gambeson, bent iron oath ring, a pilgrim badge sewn inside.",
    "traits": [
      {
        "n": "Keep the Watch",
        "text": "Finish a long rest with Heroic Inspiration."
      },
      {
        "n": "Life Before Arms",
        "text": "Choose one additional skill and origin feat."
      }
    ]
  },
  "drawn-future": {
    "id": "drawn-future",
    "name": "Last Signal",
    "group": "drawn",
    "like": "Orc",
    "blurb": "The last signal in your ear gave a landing time. It has been counting down for three Barovian winters.",
    "look": "Cracked night visor, mismatched seals and linen wound round a dead indicator.",
    "traits": [
      {
        "n": "Failing Night-Sight",
        "text": "The visor picks out shapes in darkness to 120 feet."
      },
      {
        "n": "Reserve Cell",
        "text": "Dash as a bonus action and gain temporary HP equal to proficiency, proficiency uses per short or long rest."
      },
      {
        "n": "Suit Lock",
        "text": "Once per long rest, a blow that drops you to zero without killing you leaves you at one HP."
      }
    ]
  },
  "village-born": {
    "id": "village-born",
    "name": "Hearth Child",
    "group": "barovian",
    "like": "Human",
    "blurb": "Your village had one oven and one bell. You could tell who needed help by the hour each was lit or rung.",
    "look": "Patched boots, a baker’s scraper and a little flour in every seam.",
    "traits": [
      {
        "n": "Morning Bread",
        "text": "Gain Heroic Inspiration when you finish a long rest."
      },
      {
        "n": "Neighbour’s Trade",
        "text": "Choose one extra skill and one extra origin feat."
      }
    ]
  },
  "vistani-raised": {
    "id": "vistani-raised",
    "name": "Of the Wagon Fires",
    "group": "barovian",
    "like": "Human",
    "blurb": "Three households raised you. Each keeps a place for you at supper, wherever the wheels have stopped.",
    "look": "Road cloak with three different patches, a folding stool and a spare bowl.",
    "traits": [
      {
        "n": "First Cup",
        "text": "After a long rest gain Heroic Inspiration."
      },
      {
        "n": "Many Teachers",
        "text": "Choose an additional skill and origin feat."
      }
    ]
  },
  "old-blood": {
    "id": "old-blood",
    "name": "Distant Branch",
    "group": "barovian",
    "like": "Tiefling",
    "blurb": "A name was cut from the family tree. On winter nights the scar still beads red sap.",
    "look": "High collar, dark spectacles and an inherited seal worn face down.",
    "traits": [
      {
        "n": "Night Inheritance",
        "text": "See through darkness to sixty feet."
      },
      {
        "n": "Estate Secret",
        "text": "Your legacy grants a resistance and cantrip, then spells at levels three and five."
      },
      {
        "n": "Drawing Room Voice",
        "text": "You know the minor wonder-working cantrip Thaumaturgy."
      }
    ],
    "opts": {
      "Family secret": [
        "Coal cellar",
        "Bitter orchard",
        "Crypt key"
      ]
    },
    "classicOptions": {
      "Coal cellar": "Infernal",
      "Bitter orchard": "Abyssal",
      "Crypt key": "Chthonic"
    }
  },
  "dusk-folk": {
    "id": "dusk-folk",
    "name": "Dusk-Folk",
    "group": "kin",
    "like": "Elf",
    "blurb": "Your people keep memories by reciting them to the last light. Lately the dusk has been answering back.",
    "look": "Long cloak of plum wool, silver thread at the temples, a rosewood tally.",
    "traits": [
      {
        "n": "Half-Dream",
        "text": "Four hours of trance complete your rest"
      },
      {
        "n": " magic cannot put you to sleep."
      },
      {
        "n": "Gloaming Eye",
        "text": "See in darkness to sixty feet and gain Perception proficiency."
      },
      {
        "n": "Remembered Roads",
        "text": "Your lineage grants its gifts. Roll saves against charm with advantage."
      }
    ],
    "opts": {
      "Twilight home": [
        "Belfry",
        "Alderwood",
        "Deep stair"
      ]
    },
    "classicOptions": {
      "Belfry": "High Elf",
      "Alderwood": "Wood Elf",
      "Deep stair": "Drow"
    }
  },
  "hill-born": {
    "id": "hill-born",
    "name": "Hill-Born",
    "group": "kin",
    "like": "Dwarf",
    "blurb": "Your oldest doors open inward so the hill can never bar them. You know which walls are listening.",
    "look": "Low miner’s hood, chalk thumbprints, broad bronze belt.",
    "traits": [
      {
        "n": "Stone Listener",
        "text": "Darkvision reaches 120 feet. Call on your stone sense to feel movement through worked or natural rock."
      },
      {
        "n": "Bitter Water",
        "text": "Resist poison damage and roll saves against poison with advantage."
      },
      {
        "n": "Deep Roots",
        "text": "Add one maximum HP per level."
      }
    ]
  },
  "threshold-kin": {
    "id": "threshold-kin",
    "name": "Threshold Kin",
    "group": "kin",
    "like": "Halfling",
    "blurb": "Your people built their houses under the long steps to the abbey. Even its ghosts watch where they tread.",
    "look": "Small figure, felt soles and a key hung from a braided stair cord.",
    "traits": [
      {
        "n": "Second Chance",
        "text": "Reroll a natural one on a d20 test and use the new roll."
      },
      {
        "n": "Underfoot",
        "text": "Pass through larger creatures’ spaces and hide behind a creature at least one size larger."
      },
      {
        "n": "Quiet Nerve",
        "text": "Roll saves against fear with advantage."
      }
    ]
  }
};
export const BACKS = {
  "levy-veteran": {
    "id": "levy-veteran",
    "name": "Levy Veteran",
    "like": "Soldier",
    "ab": [
      "Str",
      "Dex",
      "Con"
    ],
    "skills": [
      "Athletics",
      "Intimidation"
    ],
    "feat": "hold-the-line",
    "blurb": "You remember the hands that closed the shield gap at your left.",
    "gear": "A dented shield boss and a folded pay warrant."
  },
  "field-dresser": {
    "id": "field-dresser",
    "name": "Field Dresser",
    "like": "Acolyte",
    "ab": [
      "Int",
      "Wis",
      "Cha"
    ],
    "skills": [
      "Insight",
      "Religion"
    ],
    "feat": "no-one-left-behind",
    "blurb": "You stitched by lantern light while someone read the names aloud.",
    "gear": "A roll of clean linen and blunt shears."
  },
  "ash-indexer": {
    "id": "ash-indexer",
    "name": "Ash Indexer",
    "like": "Sage",
    "ab": [
      "Con",
      "Int",
      "Wis"
    ],
    "skills": [
      "Arcana",
      "History"
    ],
    "feat": "old-habits",
    "blurb": "You filed what survived the library fire, including its borrowers’ debts.",
    "gear": "Slate index cards and an iron stylus."
  },
  "river-runner": {
    "id": "river-runner",
    "name": "River Runner",
    "like": "Criminal",
    "ab": [
      "Dex",
      "Con",
      "Int"
    ],
    "skills": [
      "Sleight of Hand",
      "Stealth"
    ],
    "feat": "steady-hands",
    "blurb": "You moved flour across the toll line under the eyes of hungry guards.",
    "gear": "A hollow punt pole and a brass tally."
  },
  "boundary-walker": {
    "id": "boundary-walker",
    "name": "Boundary Walker",
    "like": "Criminal",
    "ab": [
      "Dex",
      "Con",
      "Int"
    ],
    "skills": [
      "Sleight of Hand",
      "Stealth"
    ],
    "feat": "first-footfall",
    "blurb": "You scouted the valley road by the dew missing from the brambles.",
    "gear": "A knotted pace cord and a spare bootlace."
  },
  "bell-founder": {
    "id": "bell-founder",
    "name": "Bell Founder",
    "like": "Sage",
    "ab": [
      "Con",
      "Int",
      "Wis"
    ],
    "skills": [
      "Arcana",
      "History"
    ],
    "feat": "relic-tinker",
    "blurb": "You cast the bell that rang the night your workshop disappeared.",
    "gear": "A casting spoon and a sliver of cracked bronze."
  },
  "wayside-deacon": {
    "id": "wayside-deacon",
    "name": "Wayside Deacon",
    "like": "Acolyte",
    "ab": [
      "Int",
      "Wis",
      "Cha"
    ],
    "skills": [
      "Insight",
      "Religion"
    ],
    "feat": "lamp-rite",
    "blurb": "You kept a shelter where strangers could sleep through the dark hours.",
    "gear": "A tin lamp and a register of guests."
  },
  "sounding-lead": {
    "id": "sounding-lead",
    "name": "Sounding Lead",
    "like": "Soldier",
    "ab": [
      "Str",
      "Dex",
      "Con"
    ],
    "skills": [
      "Athletics",
      "Intimidation"
    ],
    "feat": "keel-brace",
    "blurb": "You stood deck watch and measured the black water off the shoals.",
    "gear": "A lead weight and a waxed knot chart."
  },
  "parish-sexton": {
    "id": "parish-sexton",
    "name": "Parish Sexton",
    "like": "Acolyte",
    "ab": [
      "Int",
      "Wis",
      "Cha"
    ],
    "skills": [
      "Insight",
      "Religion"
    ],
    "feat": "last-office",
    "blurb": "You cut graves before the frost set and kept the names in order.",
    "gear": "A folding rule and a coil of lowering rope."
  },
  "toll-fugitive": {
    "id": "toll-fugitive",
    "name": "Toll Fugitive",
    "like": "Criminal",
    "ab": [
      "Dex",
      "Con",
      "Int"
    ],
    "skills": [
      "Sleight of Hand",
      "Stealth"
    ],
    "feat": "back-gate",
    "blurb": "A magistrate still wants the key you took off its hook.",
    "gear": "A filed key blank and a faded toll stamp."
  }
};
export const FEATS = {
  "hold-the-line": {
    "id": "hold-the-line",
    "name": "Hold the Line",
    "cat": "origin",
    "req": "None",
    "like": "Savage Attacker",
    "text": "Once per turn on a weapon hit, roll the weapon dice twice and choose either result.",
    "mech": {
      "k": "like",
      "feature": "Savage Attacker"
    }
  },
  "no-one-left-behind": {
    "id": "no-one-left-behind",
    "name": "No One Left Behind",
    "cat": "origin",
    "req": "None",
    "like": "Magic Initiate",
    "text": "Learn two cantrips and one first-level spell from the priestly list. Always prepare that spell and cast it free once per long rest.",
    "mech": {
      "k": "like",
      "feature": "Magic Initiate"
    }
  },
  "old-habits": {
    "id": "old-habits",
    "name": "Old Habits",
    "cat": "origin",
    "req": "None",
    "like": "Magic Initiate",
    "text": "Learn two cantrips and one first-level spell from the scholarly list. Always prepare that spell and cast it free once per long rest.",
    "mech": {
      "k": "like",
      "feature": "Magic Initiate"
    }
  },
  "steady-hands": {
    "id": "steady-hands",
    "name": "Steady Hands",
    "cat": "origin",
    "req": "None",
    "like": "Alert",
    "text": "Add proficiency to initiative. Immediately after rolling, you and a willing ally may exchange initiative if neither is incapacitated.",
    "mech": {
      "k": "like",
      "feature": "Alert"
    }
  },
  "first-footfall": {
    "id": "first-footfall",
    "name": "First Footfall",
    "cat": "origin",
    "req": "None",
    "like": "Alert",
    "text": "Add proficiency to initiative. Immediately after rolling, you and a willing ally may exchange initiative if neither is incapacitated.",
    "mech": {
      "k": "like",
      "feature": "Alert"
    }
  },
  "relic-tinker": {
    "id": "relic-tinker",
    "name": "Relic Tinker",
    "cat": "origin",
    "req": "None",
    "like": "Magic Initiate",
    "text": "Learn two cantrips and one first-level spell from the scholarly list. Always prepare that spell and cast it free once per long rest.",
    "mech": {
      "k": "like",
      "feature": "Magic Initiate"
    }
  },
  "lamp-rite": {
    "id": "lamp-rite",
    "name": "Lamp Rite",
    "cat": "origin",
    "req": "None",
    "like": "Magic Initiate",
    "text": "Learn two cantrips and one first-level spell from the priestly list. Always prepare that spell and cast it free once per long rest.",
    "mech": {
      "k": "like",
      "feature": "Magic Initiate"
    }
  },
  "keel-brace": {
    "id": "keel-brace",
    "name": "Keel Brace",
    "cat": "origin",
    "req": "None",
    "like": "Savage Attacker",
    "text": "Once per turn on a weapon hit, roll the weapon dice twice and choose either result.",
    "mech": {
      "k": "like",
      "feature": "Savage Attacker"
    }
  },
  "last-office": {
    "id": "last-office",
    "name": "Last Office",
    "cat": "origin",
    "req": "None",
    "like": "Magic Initiate",
    "text": "Learn two cantrips and one first-level spell from the priestly list. Always prepare that spell and cast it free once per long rest.",
    "mech": {
      "k": "like",
      "feature": "Magic Initiate"
    }
  },
  "back-gate": {
    "id": "back-gate",
    "name": "Back Gate",
    "cat": "origin",
    "req": "None",
    "like": "Alert",
    "text": "Add proficiency to initiative. Immediately after rolling, you and a willing ally may exchange initiative if neither is incapacitated.",
    "mech": {
      "k": "like",
      "feature": "Alert"
    }
  },
  "second-breath": {
    "id": "second-breath",
    "name": "Second Breath",
    "cat": "general",
    "req": "Level 4+",
    "like": null,
    "text": "As a bonus action gain temporary HP equal to 1d6 plus your level.",
    "mech": {
      "k": "tempHp",
      "amount": "1d6+lvl",
      "when": "bonus"
    }
  },
  "lantern-step": {
    "id": "lantern-step",
    "name": "Lantern Step",
    "cat": "general",
    "req": "Level 4+",
    "like": null,
    "text": "After hiding, move ten feet without provoking opportunity attacks.",
    "mech": {
      "k": "move",
      "feet": 10,
      "when": "afterHide",
      "provokes": false
    }
  },
  "cold-watch": {
    "id": "cold-watch",
    "name": "Cold Watch",
    "cat": "general",
    "req": "Level 4+",
    "like": null,
    "text": "You resist cold damage.",
    "mech": {
      "k": "resist",
      "types": [
        "cold"
      ],
      "when": "always"
    }
  },
  "iron-stomach": {
    "id": "iron-stomach",
    "name": "Iron Stomach",
    "cat": "general",
    "req": "Level 4+",
    "like": null,
    "text": "You resist poison damage.",
    "mech": {
      "k": "resist",
      "types": [
        "poison"
      ],
      "when": "always"
    }
  },
  "pike-hedge": {
    "id": "pike-hedge",
    "name": "Pike Hedge",
    "cat": "general",
    "req": "Level 4+",
    "like": null,
    "text": "Your first hit each turn deals an extra 1d4 piercing damage.",
    "mech": {
      "k": "extraDamage",
      "dice": "1d4",
      "type": "piercing",
      "when": "firstHitEachTurn"
    }
  },
  "cairn-keeper": {
    "id": "cairn-keeper",
    "name": "Cairn Keeper",
    "cat": "general",
    "req": "Level 4+",
    "like": null,
    "text": "Roll saves against fear with advantage.",
    "mech": {
      "k": "advantage",
      "on": "save",
      "vs": "frightened",
      "when": "always"
    }
  },
  "drag-clear": {
    "id": "drag-clear",
    "name": "Drag Clear",
    "cat": "general",
    "req": "Level 4+",
    "like": null,
    "text": "When an ally falls, move ten feet towards them without provoking.",
    "mech": {
      "k": "reaction",
      "trigger": "allyDown",
      "does": {
        "k": "move",
        "feet": 10,
        "when": "reaction",
        "provokes": false
      }
    }
  },
  "mercy-stitch": {
    "id": "mercy-stitch",
    "name": "Mercy Stitch",
    "cat": "general",
    "req": "Level 4+",
    "like": null,
    "text": "As an action, heal a creature within five feet for 1d8 plus Wisdom HP. Uses equal proficiency per long rest.",
    "mech": {
      "k": "heal",
      "amount": "1d8+wis",
      "range": 5,
      "uses": "pb/longRest"
    }
  },
  "seep-scarred": {
    "id": "seep-scarred",
    "name": "Seep-Scarred",
    "cat": "general",
    "req": "Level 4+; Seep-touched",
    "like": null,
    "text": "As a bonus action gain 1d10 plus level temporary HP. Lose one maximum HP until your next long rest.",
    "mech": {
      "k": "tempHp",
      "amount": "1d10+lvl",
      "when": "bonus",
      "also": [
        {
          "k": "seepCost",
          "what": "Lose one maximum HP until your next long rest."
        }
      ]
    }
  },
  "choir-tooth": {
    "id": "choir-tooth",
    "name": "Choir Tooth",
    "cat": "general",
    "req": "Level 4+; Seep-touched",
    "like": null,
    "text": "On a critical hit, add 2d6 necrotic damage. Lose one unspent hit die; without one you cannot invoke.",
    "mech": {
      "k": "extraDamage",
      "dice": "2d6",
      "type": "necrotic",
      "when": "crit",
      "also": [
        {
          "k": "seepCost",
          "what": "Lose one unspent hit die; without one you cannot invoke."
        }
      ]
    }
  },
  "spore-courier": {
    "id": "spore-courier",
    "name": "Spore Courier",
    "cat": "general",
    "req": "Level 4+; Seep-touched",
    "like": null,
    "text": "After a Dash, move twenty extra feet without provoking. You leave a luminous trail for one hour.",
    "mech": {
      "k": "move",
      "feet": 20,
      "when": "afterDash",
      "provokes": false,
      "also": [
        {
          "k": "seepCost",
          "what": "You leave a luminous trail for one hour."
        }
      ]
    }
  },
  "mould-lantern": {
    "id": "mould-lantern",
    "name": "Mould Lantern",
    "cat": "general",
    "req": "Level 4+; Seep-touched",
    "like": null,
    "text": "Call a ghostlight for one minute with five HP per level. Until it goes dark you cannot hide.",
    "mech": {
      "k": "summon",
      "what": "ghostlight",
      "hp": "5*lvl",
      "lasts": "1min",
      "also": [
        {
          "k": "seepCost",
          "what": "Until it goes dark you cannot hide."
        }
      ]
    }
  },
  "last-hearth": {
    "id": "last-hearth",
    "name": "Last Hearth",
    "cat": "epic",
    "req": "Level 19+",
    "like": null,
    "text": "Allies within ten feet gain advantage on saves against fear.",
    "mech": {
      "k": "aura",
      "radius": 10,
      "gives": {
        "k": "advantage",
        "on": "save",
        "vs": "frightened",
        "when": "always"
      }
    }
  },
  "winter-standard": {
    "id": "winter-standard",
    "name": "Winter Standard",
    "cat": "epic",
    "req": "Level 19+",
    "like": null,
    "text": "Allies within ten feet resist cold damage.",
    "mech": {
      "k": "aura",
      "radius": 10,
      "gives": {
        "k": "resist",
        "types": [
          "cold"
        ],
        "when": "always"
      }
    }
  }
};
