/* Barovia Character Codex VII. Wholly original homebrew; not core 5e rules.
   Manual rules unless explicitly automated by the VTT. Do not treat as balance-certified.
   No content from the private .prism file is copied into this public repository. */
export const BAROVIA_CODEX = {
  "version": 7,
  "name": "Barovia: The Character Codex",
  "license": "Original table homebrew; no third-party source material reproduced",
  "classes": {
    "Lantern Marshal": {
      "name": "Lantern Marshal",
      "hd": 10,
      "saves": [
        "Str",
        "Wis"
      ],
      "primary": [
        "Str",
        "Wis"
      ],
      "armor": "medium+shield",
      "skills": [
        "Athletics",
        "Insight",
        "Intimidation",
        "Medicine",
        "Perception",
        "Religion",
        "Survival"
      ],
      "skillChoices": 2,
      "casting": "half",
      "pitch": "An oathkeeper who lights the road for others, measuring every victory by the lives carried home.",
      "features": {
        "1": [
          {
            "name": "Keeper of the Wick",
            "text": "Carry a consecrated lantern; once per long rest, let an ally reroll a failed death save while within 15 feet."
          }
        ],
        "2": [
          {
            "name": "Watchful Step",
            "text": "Gain proficiency in Perception, or expertise in it if already proficient."
          }
        ],
        "3": [
          {
            "name": "Order Initiation",
            "text": "Choose an order; gain its level-3 feature."
          }
        ],
        "4": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Lantern Marshal gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "5": [
          {
            "name": "Stand the Line",
            "text": "When an adjacent ally is hit, use your reaction to reduce damage by 1d8 + Wisdom modifier; proficiency bonus uses per long rest."
          }
        ],
        "6": [
          {
            "name": "Sheltering Circle",
            "text": "Allies within 10 feet of your lit lantern have advantage on checks to resist magical fear once per short rest."
          }
        ],
        "7": [
          {
            "name": "Two-Way Signal",
            "text": "Once per rest, silently mark a visible ally; each of you knows the other's direction until dawn."
          }
        ],
        "8": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Lantern Marshal gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "9": [
          {
            "name": "Lanternfire",
            "text": "Your lantern can reveal invisible footprints in a 15-foot radius for ten minutes, once per long rest."
          }
        ],
        "10": [
          {
            "name": "Shared Vigil",
            "text": "During a short rest, two allies may recover one additional Hit Die each."
          }
        ],
        "11": [
          {
            "name": "Unbroken Formation",
            "text": "One ally within 10 feet may move 10 feet as your reaction after you take a hit; no opportunity attacks from your attacker."
          }
        ],
        "12": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Lantern Marshal gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "13": [
          {
            "name": "Call the Lost",
            "text": "Once per long rest, learn whether a named creature is alive within one mile, unless warded."
          }
        ],
        "14": [
          {
            "name": "Second Flame",
            "text": "You can activate Sheltering Circle twice between rests."
          }
        ],
        "15": [
          {
            "name": "Road Without End",
            "text": "Ignore one level of exhaustion imposed by travel until you finish a long rest."
          }
        ],
        "16": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Lantern Marshal gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "17": [
          {
            "name": "The Quiet Bell",
            "text": "Once per long rest, suppress hostile magical sounds in a 20-foot radius for one round."
          }
        ],
        "18": [
          {
            "name": "Last Defender",
            "text": "When you fall to 0 HP, you may first allow two allies to move up to half speed without reactions, once per long rest."
          }
        ],
        "19": [
          {
            "name": "Epic Boon",
            "text": "Your Lantern Marshal gains Epic Boon. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "20": [
          {
            "name": "Light Returned",
            "text": "The first time each long rest an ally within 30 feet would fall to 0 HP, it instead remains at 1 HP; your lantern goes dark until dawn."
          }
        ]
      },
      "subclassLevel": 3,
      "subclasses": [
        "Order of the Golden Wick",
        "Order of the Black Lantern"
      ],
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Veilwalker": {
      "name": "Veilwalker",
      "hd": 8,
      "saves": [
        "Dex",
        "Wis"
      ],
      "primary": [
        "Dex",
        "Wis"
      ],
      "armor": "light",
      "skills": [
        "Acrobatics",
        "Deception",
        "Insight",
        "Investigation",
        "Perception",
        "Sleight of Hand",
        "Stealth",
        "Survival"
      ],
      "skillChoices": 2,
      "casting": null,
      "pitch": "A courier of secret paths who fights with direction, silence, and the places enemies refuse to look.",
      "features": {
        "1": [
          {
            "name": "Path Memory",
            "text": "After traveling a route once, remember its visible forks and landmarks without a check."
          }
        ],
        "2": [
          {
            "name": "Quick Cut",
            "text": "Bonus action Disengage proficiency bonus times per long rest."
          }
        ],
        "3": [
          {
            "name": "Veil Discipline",
            "text": "Choose a discipline; gain its level-3 feature."
          }
        ],
        "4": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Veilwalker gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "5": [
          {
            "name": "Second Step",
            "text": "Once per turn after hitting with a finesse weapon, move 5 feet without provoking from that creature."
          }
        ],
        "6": [
          {
            "name": "False Trail",
            "text": "During an hour of travel, hide tracks for up to six willing travelers; once per long rest."
          }
        ],
        "7": [
          {
            "name": "No Footprint",
            "text": "Difficult terrain caused by mud, snow, or roots costs you no extra movement."
          }
        ],
        "8": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Veilwalker gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "9": [
          {
            "name": "Borrowed Shadow",
            "text": "As a reaction while in dim light, impose disadvantage on one attack against you; twice per long rest."
          }
        ],
        "10": [
          {
            "name": "Whisper Route",
            "text": "Designate one ally at dawn; you can communicate basic direction by touch at any time."
          }
        ],
        "11": [
          {
            "name": "Through the Crack",
            "text": "Squeeze through openings sized for a creature one size smaller without penalty, if physically possible."
          }
        ],
        "12": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Veilwalker gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "13": [
          {
            "name": "Never Here",
            "text": "Once per long rest, when targeted you may move 10 feet before the attack resolves, if you can see the source."
          }
        ],
        "14": [
          {
            "name": "The Quiet Hand",
            "text": "Gain expertise in one noncombat skill you are proficient in."
          }
        ],
        "15": [
          {
            "name": "Road Ghost",
            "text": "You cannot be tracked by mundane means unless you leave an intentional sign."
          }
        ],
        "16": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Veilwalker gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "17": [
          {
            "name": "Outrun the Name",
            "text": "After failing a Dexterity save, reroll it; once per long rest."
          }
        ],
        "18": [
          {
            "name": "Three Places",
            "text": "Once per long rest as an action, move up to your speed and take the Hide action, crossing enemies' reach without opportunity attacks."
          }
        ],
        "19": [
          {
            "name": "Epic Boon",
            "text": "Your Veilwalker gains Epic Boon. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "20": [
          {
            "name": "Exit Wound",
            "text": "Once per turn, after a successful finesse hit on a creature that has not acted this round, deal an extra 2d6 damage; this bonus cannot stack with a similar feature granted by the DM."
          }
        ]
      },
      "subclassLevel": 3,
      "subclasses": [
        "The Ravensworn",
        "The Keyless"
      ],
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Ashbinder": {
      "name": "Ashbinder",
      "hd": 6,
      "saves": [
        "Int",
        "Wis"
      ],
      "primary": [
        "Int",
        "Wis"
      ],
      "armor": "none",
      "skills": [
        "Arcana",
        "History",
        "Investigation",
        "Medicine",
        "Nature",
        "Religion"
      ],
      "skillChoices": 2,
      "casting": "full",
      "pitch": "An occult scholar who writes wards in cold ash, and knows that the shape of a ruin is another language.",
      "features": {
        "1": [
          {
            "name": "Ash Script",
            "text": "Record one harmless symbol in ash that persists until washed away; you can read any of your marks within 30 feet."
          }
        ],
        "2": [
          {
            "name": "Cinder Preparation",
            "text": "After a long rest, designate one known ritual as prepared without counting it against your own allotment."
          }
        ],
        "3": [
          {
            "name": "Ash Tradition",
            "text": "Choose a tradition; gain its level-3 feature."
          }
        ],
        "4": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Ashbinder gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "5": [
          {
            "name": "Pattern Break",
            "text": "As a reaction, grant +2 to one ally's saving throw against magic within 30 feet, twice per long rest."
          }
        ],
        "6": [
          {
            "name": "Cold Crucible",
            "text": "You can create a small harmless flame or extinguish a nonmagical flame without a slot."
          }
        ],
        "7": [
          {
            "name": "Warding Ash",
            "text": "Mark a doorway; the first undead crossing it before dawn is outlined in faint silver light for one minute."
          }
        ],
        "8": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Ashbinder gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "9": [
          {
            "name": "Unwritten Memory",
            "text": "Once per long rest, reconstruct the last spoken sentence near an intact unburned page or inscription; DM determines ambiguity."
          }
        ],
        "10": [
          {
            "name": "Ashen Sight",
            "text": "Your light cantrips reveal the edges of invisible writing for one minute, once per rest."
          }
        ],
        "11": [
          {
            "name": "Scour the Seal",
            "text": "When you dispel a magical glyph, learn the school of the spell that made it."
          }
        ],
        "12": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Ashbinder gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "13": [
          {
            "name": "Borrowed Ember",
            "text": "Once per short rest, regain one expended first-level spell slot, but never above your normal slot maximum."
          }
        ],
        "14": [
          {
            "name": "Precise Circle",
            "text": "Friendly creatures in your ritual circles ignore the first 5 feet of magical difficult terrain on their turns."
          }
        ],
        "15": [
          {
            "name": "Book of Last Names",
            "text": "When you speak an undead creature's true name, learn whether it is controlled by another creature."
          }
        ],
        "16": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Ashbinder gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "17": [
          {
            "name": "Ash Remembers",
            "text": "One use of Unwritten Memory per short rest instead of per long rest."
          }
        ],
        "18": [
          {
            "name": "Ruin's Answer",
            "text": "Once per long rest, ask a destroyed structure one yes/no question about its last day; the DM answers according to lingering impressions."
          }
        ],
        "19": [
          {
            "name": "Epic Boon",
            "text": "Your Ashbinder gains Epic Boon. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "20": [
          {
            "name": "White Furnace",
            "text": "Once per long rest, when you cast a spell of level 5 or lower using a slot, restore an ally within 30 feet for 2d8 HP and remove the frightened condition from it."
          }
        ]
      },
      "subclassLevel": 3,
      "subclasses": [
        "The White Ash",
        "The Furnace Choir"
      ],
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Thornbound": {
      "name": "Thornbound",
      "hd": 10,
      "saves": [
        "Con",
        "Wis"
      ],
      "primary": [
        "Con",
        "Wis"
      ],
      "armor": "medium+shield",
      "skills": [
        "Animal Handling",
        "Athletics",
        "Insight",
        "Medicine",
        "Nature",
        "Perception",
        "Survival"
      ],
      "skillChoices": 2,
      "casting": "half",
      "pitch": "A guardian of living boundaries who takes on a fraction of the land’s wounds to keep its inhabitants alive.",
      "features": {
        "1": [
          {
            "name": "Briar Pact",
            "text": "Touch a plant to learn whether it was injured within the previous hour; the memory is sensory, not speech."
          }
        ],
        "2": [
          {
            "name": "Rooted Guard",
            "text": "When you stand still for a turn, gain +1 AC against the first melee attack before your next turn."
          }
        ],
        "3": [
          {
            "name": "Thorn Oath",
            "text": "Choose an oath; gain its level-3 feature."
          }
        ],
        "4": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Thornbound gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "5": [
          {
            "name": "Riven Hedge",
            "text": "Once per long rest, create 10 feet of nonmagical thorny difficult terrain until the end of your next turn."
          }
        ],
        "6": [
          {
            "name": "Wild Watch",
            "text": "Gain advantage on checks to identify unnatural plant growth or spore infestations."
          }
        ],
        "7": [
          {
            "name": "Verdant Claim",
            "text": "Plants in a 5-foot space cannot be magically withered for one minute, once per rest."
          }
        ],
        "8": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Thornbound gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "9": [
          {
            "name": "Barkskin Memory",
            "text": "Once per long rest as a reaction, reduce slashing damage by 1d10 + Wisdom modifier."
          }
        ],
        "10": [
          {
            "name": "Mercy of the Soil",
            "text": "During a short rest, an ally who expends a Hit Die gains temporary HP equal to your proficiency bonus."
          }
        ],
        "11": [
          {
            "name": "Heartroot",
            "text": "Once per rest, stabilize a creature within 15 feet by causing roots to brace its wounds."
          }
        ],
        "12": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Thornbound gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "13": [
          {
            "name": "Green Silence",
            "text": "Twice per long rest, command natural foliage to conceal a stationary camp from distant sight for one hour."
          }
        ],
        "14": [
          {
            "name": "The Unrotted",
            "text": "Advantage on saves against nonmagical poison; your skin visibly bears living bark veins."
          }
        ],
        "15": [
          {
            "name": "Briar Charge",
            "text": "Once on each of your turns after moving 15 feet, you may push a creature hit by a melee attack 5 feet if it is no more than one size larger."
          }
        ],
        "16": [
          {
            "name": "Ability Score Improvement",
            "text": "Your Thornbound gains Ability Score Improvement. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "17": [
          {
            "name": "Season's Reversal",
            "text": "Once per long rest, clear nonmagical blight from a 20-foot garden or plot over ten minutes."
          }
        ],
        "18": [
          {
            "name": "Against the Harvest",
            "text": "Once per long rest, when an ally is grappled or restrained by a plant, free it as a reaction within 30 feet."
          }
        ],
        "19": [
          {
            "name": "Epic Boon",
            "text": "Your Thornbound gains Epic Boon. Consult the table for its narrative trigger; the DM adjudicates its effect."
          }
        ],
        "20": [
          {
            "name": "One Last Spring",
            "text": "Once per long rest, when you would be reduced to 0 HP, remain at 1 HP instead and create a 15-foot zone of flowering difficult terrain for enemies for one minute."
          }
        ]
      },
      "subclassLevel": 3,
      "subclasses": [
        "The Briar Covenant",
        "The Hollow Orchard"
      ],
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    }
  },
  "subclasses": {
    "Path of the Last Hearth": {
      "name": "Path of the Last Hearth",
      "className": "Barbarian",
      "pitch": "Rage as a protective promise rather than a hunger.",
      "features": {
        "3": [
          {
            "name": "Hearthrage",
            "text": "When you rage, one ally within 10 feet gains temporary HP equal to your proficiency bonus."
          }
        ],
        "6": [
          {
            "name": "Body at the Door",
            "text": "During rage, use your reaction to swap places with a willing adjacent ally targeted by an attack."
          }
        ],
        "10": [
          {
            "name": "Ash Unbroken",
            "text": "At the end of a short rest, choose one ally to gain advantage on its next save against fear."
          }
        ],
        "14": [
          {
            "name": "Last Hearth Standing",
            "text": "Once per long rest when raging, a hit that would drop an adjacent ally to 0 HP leaves it at 1 HP instead."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "College of Unheard Bells": {
      "name": "College of Unheard Bells",
      "className": "Bard",
      "pitch": "Messages hidden in rhythm, memory and absence.",
      "features": {
        "3": [
          {
            "name": "No-Bell Chorus",
            "text": "Give one creature your Inspiration silently within 30 feet when you can see it."
          }
        ],
        "6": [
          {
            "name": "Dissonant Toll",
            "text": "Once per short rest after giving Inspiration, one hostile creature within 30 feet suffers -1d4 on its next Insight check."
          }
        ],
        "10": [
          {
            "name": "Borrowed Refrain",
            "text": "During a rest, recover the exact melody you heard in the past 24 hours."
          }
        ],
        "14": [
          {
            "name": "The Bell Remembers",
            "text": "Once per long rest, an ally who expended your Inspiration can reroll its check and use either result."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Domain of the Dying Candle": {
      "name": "Domain of the Dying Candle",
      "className": "Cleric",
      "pitch": "Protect the light that remains.",
      "features": {
        "3": [
          {
            "name": "Vigil Spark",
            "text": "When you heal a creature, it can also stand from prone without spending movement, once per turn."
          }
        ],
        "6": [
          {
            "name": "Conserved Flame",
            "text": "Once per short rest, a creature in your light has advantage on a death save."
          }
        ],
        "10": [
          {
            "name": "Quiet Mercy",
            "text": "Your healing suppresses mundane pain and panic for one minute in a willing creature."
          }
        ],
        "14": [
          {
            "name": "Final Benediction",
            "text": "Once per long rest, when a willing creature within 30 feet fails a death save, treat the result as a success."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Circle of Blackwater": {
      "name": "Circle of Blackwater",
      "className": "Druid",
      "pitch": "The marsh keeps what the river will not.",
      "features": {
        "3": [
          {
            "name": "Blackwater Gift",
            "text": "Gain a swim speed equal to your walking speed while unarmored."
          }
        ],
        "6": [
          {
            "name": "Reed Mirror",
            "text": "Once per long rest, create a stationary watery duplicate for one minute that can be seen but cannot act."
          }
        ],
        "10": [
          {
            "name": "Sunken Path",
            "text": "Your allies ignore natural marsh difficult terrain while following you within 10 feet."
          }
        ],
        "14": [
          {
            "name": "Lake of Second Faces",
            "text": "Once per long rest, learn the last creature reflected in an undisturbed pool you touch."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Gravewatch Sentinel": {
      "name": "Gravewatch Sentinel",
      "className": "Fighter",
      "pitch": "A soldier who knows how long a siege can last.",
      "features": {
        "3": [
          {
            "name": "Pale Stand",
            "text": "While wielding a shield, reduce one adjacent ally's damage by 2 as a reaction; once per short rest."
          }
        ],
        "7": [
          {
            "name": "Silent Muster",
            "text": "During a rest, grant one ally advantage on its next initiative roll."
          }
        ],
        "10": [
          {
            "name": "Gravewise Footing",
            "text": "Ignore nonmagical rubble difficult terrain."
          }
        ],
        "15": [
          {
            "name": "Hold Until Dawn",
            "text": "Once per long rest, when an ally within 10 feet drops to 0 HP, it instead drops to 1 HP."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Way of the Veiled Step": {
      "name": "Way of the Veiled Step",
      "className": "Monk",
      "pitch": "An empty road can be the sharpest weapon.",
      "features": {
        "3": [
          {
            "name": "Mist Foot",
            "text": "Once per short rest, move 10 feet through an enemy's reach without provoking."
          }
        ],
        "6": [
          {
            "name": "Breath Without Witness",
            "text": "You can hold your breath for ten minutes; your breathing is inaudible."
          }
        ],
        "10": [
          {
            "name": "Footfall Unmade",
            "text": "After using Step of the Wind, you leave no visible tracks until your next turn."
          }
        ],
        "14": [
          {
            "name": "Unseen Arrival",
            "text": "Once per long rest, when you begin your turn hidden, your first unarmed hit deals 2d6 extra psychic damage."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Oath of the Unbroken Gate": {
      "name": "Oath of the Unbroken Gate",
      "className": "Paladin",
      "pitch": "A vow that no innocents pass into the dark alone.",
      "features": {
        "3": [
          {
            "name": "Gate Oath",
            "text": "Once per long rest, as a bonus action mark a five-foot opening; allies crossing it gain temporary HP equal to your Charisma modifier."
          }
        ],
        "6": [
          {
            "name": "Unyielding Lintel",
            "text": "Allies within your aura cannot be unwillingly pushed through a doorway or portal while conscious."
          }
        ],
        "10": [
          {
            "name": "Threshold of Mercy",
            "text": "When you restore HP to an ally, that ally ignores opportunity attacks from one creature until its next turn."
          }
        ],
        "14": [
          {
            "name": "No One Left Outside",
            "text": "Once per long rest, teleport to an ally you can see within 30 feet who is below half HP."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Mist-Hound Conclave": {
      "name": "Mist-Hound Conclave",
      "className": "Ranger",
      "pitch": "The trail itself is the companion.",
      "features": {
        "3": [
          {
            "name": "Grey Scent",
            "text": "Gain advantage on Survival checks to track creatures through mist and rain."
          }
        ],
        "6": [
          {
            "name": "Hound's Warning",
            "text": "Once per short rest, you and one ally cannot be surprised by a creature you can hear approaching."
          }
        ],
        "10": [
          {
            "name": "Crosswind Hunter",
            "text": "Your ranged attacks ignore half cover created by natural fog and foliage."
          }
        ],
        "14": [
          {
            "name": "The Last Trail",
            "text": "Once per long rest, name a creature you have tracked; for one hour you know the direction of its most recent footprints within one mile."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Knifewhisper": {
      "name": "Knifewhisper",
      "className": "Rogue",
      "pitch": "One breath, one note, one missing key.",
      "features": {
        "3": [
          {
            "name": "Quiet Blade",
            "text": "If you hit a creature while hidden, it cannot shout until the beginning of its next turn; once per short rest."
          }
        ],
        "7": [
          {
            "name": "Key Memory",
            "text": "After examining a mundane lock for a minute, you gain advantage on one check to open a lock of the same make."
          }
        ],
        "10": [
          {
            "name": "Veiled Warning",
            "text": "Once per short rest, use your reaction to grant an ally within 10 feet +2 AC against one attack."
          }
        ],
        "15": [
          {
            "name": "Last Word",
            "text": "Once per long rest, when you hit a creature that has not acted this round, add 3d6 psychic damage."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Bloodmoon Sorcery": {
      "name": "Bloodmoon Sorcery",
      "className": "Sorcerer",
      "pitch": "Moonlight heard beating inside the veins.",
      "features": {
        "3": [
          {
            "name": "Crimson Tide",
            "text": "Once per long rest after casting a spell, gain temporary HP equal to its slot level + Charisma modifier."
          }
        ],
        "6": [
          {
            "name": "Lunar Bend",
            "text": "Once per short rest, change a spell's harmless visual signature to bloodred moonlight."
          }
        ],
        "10": [
          {
            "name": "Heart Clock",
            "text": "Advantage on Arcana checks to identify blood-related curses."
          }
        ],
        "14": [
          {
            "name": "Eclipse Within",
            "text": "Once per long rest, resist one instance of necrotic damage, halving it."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "The Hollow Saint": {
      "name": "The Hollow Saint",
      "className": "Warlock",
      "pitch": "A patron represented by a shrine with no saint.",
      "features": {
        "3": [
          {
            "name": "Empty Reliquary",
            "text": "Once per short rest, your whispered plea grants one ally +1d4 on a single Religion or Insight check."
          }
        ],
        "6": [
          {
            "name": "Absent Grace",
            "text": "Gain advantage on saves to resist magical compulsion to kneel or worship."
          }
        ],
        "10": [
          {
            "name": "Blasphemous Silence",
            "text": "Once per long rest, cancel the sound of your own footsteps for one minute."
          }
        ],
        "14": [
          {
            "name": "The Unnamed Answer",
            "text": "Once per long rest, ask your patron one yes/no question about a place you can see; it may answer in symbols."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "School of Lost Hours": {
      "name": "School of Lost Hours",
      "className": "Wizard",
      "pitch": "Time is a room with doors someone misplaced.",
      "features": {
        "3": [
          {
            "name": "Missed Minute",
            "text": "Once per long rest, add 1d4 to initiative after seeing your roll."
          }
        ],
        "6": [
          {
            "name": "Margin Note",
            "text": "A ritual you cast leaves a small, visible countdown sigil known only to you."
          }
        ],
        "10": [
          {
            "name": "Hourglass Memory",
            "text": "You recall the exact time of any event you witnessed in the previous seven days."
          }
        ],
        "14": [
          {
            "name": "Borrow Tomorrow",
            "text": "Once per long rest, when you fail an Intelligence save, reroll it."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Order of the Golden Wick": {
      "name": "Order of the Golden Wick",
      "className": "Lantern Marshal",
      "pitch": "A bright line between innocents and predators.",
      "features": {
        "3": [
          {
            "name": "Guiding Halo",
            "text": "An ally next to your lit lantern ignores the first 5 feet of difficult terrain each turn."
          }
        ],
        "6": [
          {
            "name": "Warm Shelter",
            "text": "Your rest fires grant each resting companion two temporary HP at dawn."
          }
        ],
        "10": [
          {
            "name": "Hands of the Watch",
            "text": "Once per rest, stabilize a creature within 15 feet as a bonus action."
          }
        ],
        "14": [
          {
            "name": "Dawn Answer",
            "text": "Once per long rest, after an ally fails a death save, turn it into a success."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "Order of the Black Lantern": {
      "name": "Order of the Black Lantern",
      "className": "Lantern Marshal",
      "pitch": "Hide the light so the hunted can survive.",
      "features": {
        "3": [
          {
            "name": "Shuttered Flame",
            "text": "Your lantern can illuminate only creatures you choose within 10 feet for one minute."
          }
        ],
        "6": [
          {
            "name": "Trapped Glow",
            "text": "Once per rest, mark a spot; the next hostile creature crossing it sheds dim light one round."
          }
        ],
        "10": [
          {
            "name": "Night Drill",
            "text": "Allies following you have advantage on one group Stealth check per day."
          }
        ],
        "14": [
          {
            "name": "Black Beacon",
            "text": "Once per long rest, illuminate an invisible creature you can see for one minute."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "The Ravensworn": {
      "name": "The Ravensworn",
      "className": "Veilwalker",
      "pitch": "The feather is both message and warning.",
      "features": {
        "3": [
          {
            "name": "Raven Signal",
            "text": "Once per short rest, communicate three words to a visible ally within 120 feet without sound."
          }
        ],
        "6": [
          {
            "name": "Shadow Perch",
            "text": "Gain advantage on Stealth checks while atop walls and branches."
          }
        ],
        "10": [
          {
            "name": "Wingbreak",
            "text": "Once per rest, force a creature that hits you with a melee attack to make a DC 8+PB+Dex save or lose reactions until next turn."
          }
        ],
        "14": [
          {
            "name": "Last Feather",
            "text": "Once per long rest, when a creature you can see attacks an ally, impose disadvantage on that roll."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "The Keyless": {
      "name": "The Keyless",
      "className": "Veilwalker",
      "pitch": "No threshold stays closed forever.",
      "features": {
        "3": [
          {
            "name": "Soft Latch",
            "text": "Once per short rest, gain advantage on a check to open a mundane lock."
          }
        ],
        "6": [
          {
            "name": "Framewalker",
            "text": "Entering or exiting a window costs you no additional movement."
          }
        ],
        "10": [
          {
            "name": "Silent Entry",
            "text": "Once per short rest, an opened mundane door makes no sound for ten minutes."
          }
        ],
        "14": [
          {
            "name": "Pass Without Passage",
            "text": "Once per long rest, teleport between two unlocked doorways within 30 feet that you can see."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "The White Ash": {
      "name": "The White Ash",
      "className": "Ashbinder",
      "pitch": "Burn infection without burning the patient.",
      "features": {
        "3": [
          {
            "name": "Pale Trace",
            "text": "You can identify mundane infectious residues by sight."
          }
        ],
        "6": [
          {
            "name": "Quarantine Geometry",
            "text": "Once per long rest, draw a five-foot ward that grants advantage on one save against spores."
          }
        ],
        "10": [
          {
            "name": "Clean Cinder",
            "text": "Once per short rest, remove a nonmagical disease from drinking water in a five-foot cube."
          }
        ],
        "14": [
          {
            "name": "Purity of the Furnace",
            "text": "Once per long rest, end one magical poison effect on an ally by touching it."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "The Furnace Choir": {
      "name": "The Furnace Choir",
      "className": "Ashbinder",
      "pitch": "Hear the language of coals and old engines.",
      "features": {
        "3": [
          {
            "name": "Coal Canticle",
            "text": "Speak to a nonmagical flame to learn its fuel type."
          }
        ],
        "6": [
          {
            "name": "Sealed Ember",
            "text": "Once per short rest, keep a flame alive through wind and rain for one hour."
          }
        ],
        "10": [
          {
            "name": "Iron Hymn",
            "text": "Allies within 10 feet gain +1 on checks to operate a forge or mechanism."
          }
        ],
        "14": [
          {
            "name": "Furnace Verdict",
            "text": "Once per long rest, your fire damage ignores resistance on one spell you cast."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "The Briar Covenant": {
      "name": "The Briar Covenant",
      "className": "Thornbound",
      "pitch": "Protect by binding the ground beneath you.",
      "features": {
        "3": [
          {
            "name": "Hedge Skin",
            "text": "When you use Rooted Guard, the first creature to miss you in melee takes 1 piercing damage."
          }
        ],
        "6": [
          {
            "name": "Briar Line",
            "text": "Once per long rest, create a ten-foot hedge that provides half cover until dawn."
          }
        ],
        "10": [
          {
            "name": "Uncut Thorn",
            "text": "You have advantage on checks to escape plant-based restraints."
          }
        ],
        "14": [
          {
            "name": "Guardian Root",
            "text": "Once per long rest, a plant adjacent to you takes damage in your place, reducing one hit by 2d8."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    },
    "The Hollow Orchard": {
      "name": "The Hollow Orchard",
      "className": "Thornbound",
      "pitch": "What rots nourishes what remains.",
      "features": {
        "3": [
          {
            "name": "Autumn Sap",
            "text": "Once per short rest, give a dying plant one week of healthy life."
          }
        ],
        "6": [
          {
            "name": "Grafted Memory",
            "text": "Learn what weather a fruit tree survived last season by touching it."
          }
        ],
        "10": [
          {
            "name": "Rot Exchange",
            "text": "Once per long rest, cure one ally of poisoned but you become poisoned for one minute."
          }
        ],
        "14": [
          {
            "name": "Last Harvest",
            "text": "Once per long rest, when you fall below half HP, allies within 10 feet gain temporary HP equal to your Wisdom modifier."
          }
        ]
      },
      "src": "Original Barovia character homebrew, Pack VII (2026)",
      "manualRules": true
    }
  },
  "species": {
    "Ashkin": {
      "name": "Ashkin",
      "speed": 30,
      "size": "Medium",
      "traits": [
        {
          "name": "Cinder Lungs",
          "text": "You have advantage on checks to breathe through smoke and ash, but not poisonous gas."
        },
        {
          "name": "Glowmark",
          "text": "Once per long rest, cause one palm to emit dim light for an hour."
        },
        {
          "name": "Furnace Memory",
          "text": "Gain proficiency in History or Investigation."
        }
      ],
      "lore": "Descendants of smiths who returned from a fire that never stopped burning.",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Mireborn": {
      "name": "Mireborn",
      "speed": 30,
      "size": "Medium",
      "traits": [
        {
          "name": "Bogstride",
          "text": "Nonmagical mud costs you no extra movement."
        },
        {
          "name": "Stillwater Breath",
          "text": "Hold your breath for up to 15 minutes."
        },
        {
          "name": "Reedwise",
          "text": "Gain proficiency in Nature or Survival."
        }
      ],
      "lore": "Raised where floodwater has swallowed the names of villages.",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Duskling": {
      "name": "Duskling",
      "speed": 30,
      "size": "Small",
      "traits": [
        {
          "name": "Dusk Eyes",
          "text": "You have darkvision 60 feet."
        },
        {
          "name": "Hedge Runner",
          "text": "Move through the space of any creature larger than you; you cannot end there."
        },
        {
          "name": "Watch the Windows",
          "text": "Gain proficiency in Perception."
        }
      ],
      "lore": "Small travelers who never cross the same threshold twice.",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Bellforged": {
      "name": "Bellforged",
      "speed": 30,
      "size": "Medium",
      "traits": [
        {
          "name": "Brass Echo",
          "text": "As an action, emit a clear bell note audible up to 60 feet, once per short rest."
        },
        {
          "name": "Steady Frame",
          "text": "Advantage on checks to avoid being knocked prone by wind."
        },
        {
          "name": "Clockmaker",
          "text": "Proficiency with tinkers tools."
        }
      ],
      "lore": "Once-living souls sheltered in modest iron and oak bodies.",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Gravekin": {
      "name": "Gravekin",
      "speed": 30,
      "size": "Medium",
      "traits": [
        {
          "name": "Last Rites",
          "text": "Gain proficiency in Religion or Medicine."
        },
        {
          "name": "Quiet Nerves",
          "text": "Advantage on saves against being frightened by undead once per long rest."
        },
        {
          "name": "Mortal Breath",
          "text": "You are living, can be healed normally, and are not undead."
        }
      ],
      "lore": "Living children of gravekeepers whose dreams carry cemetery songs.",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Thornmarked": {
      "name": "Thornmarked",
      "speed": 30,
      "size": "Medium",
      "traits": [
        {
          "name": "Green Blood",
          "text": "You can communicate simple emotional impressions with ordinary plants by touch; they cannot answer questions."
        },
        {
          "name": "Briar Hands",
          "text": "Advantage on checks to climb living trees."
        },
        {
          "name": "Fieldcraft",
          "text": "Gain proficiency in Nature."
        }
      ],
      "lore": "Travelers born with barklike scars after the valley blossomed in the wrong season.",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Palecrest": {
      "name": "Palecrest",
      "speed": 30,
      "size": "Medium",
      "traits": [
        {
          "name": "Mountain Footing",
          "text": "You have advantage on checks to keep your balance on stone slopes."
        },
        {
          "name": "Thin Air",
          "text": "Hold your breath twice as long as a typical humanoid."
        },
        {
          "name": "Peak Memory",
          "text": "Gain proficiency in Athletics or Survival."
        }
      ],
      "lore": "The pale mountain families who hear avalanches before they happen.",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Crowblood": {
      "name": "Crowblood",
      "speed": 30,
      "size": "Medium",
      "traits": [
        {
          "name": "Raven-Taught",
          "text": "Gain proficiency in Insight or Perception."
        },
        {
          "name": "Borrowed Cry",
          "text": "Mimic a short nonverbal bird call you have heard; not speech."
        },
        {
          "name": "Feather Omen",
          "text": "Once per long rest, gain advantage on a check to locate a familiar landmark."
        }
      ],
      "lore": "People marked by a covenant with watchers that know the safe road.",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    }
  },
  "backgrounds": {
    "Grave Tender": {
      "name": "Grave Tender",
      "abilities": [
        "Wis",
        "Con",
        "Int"
      ],
      "skills": [
        "Medicine",
        "Religion"
      ],
      "feat": "Salt-Ring Keeper",
      "tool": "Herbalism kit",
      "hook": "Which grave is missing its occupant?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Night Ferryman": {
      "name": "Night Ferryman",
      "abilities": [
        "Dex",
        "Wis",
        "Con"
      ],
      "skills": [
        "Athletics",
        "Survival"
      ],
      "feat": "River-Bound",
      "tool": "Vehicles (water)",
      "hook": "What knocked three times beneath your boat?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Plague Bellringer": {
      "name": "Plague Bellringer",
      "abilities": [
        "Con",
        "Cha",
        "Wis"
      ],
      "skills": [
        "Religion",
        "Perception"
      ],
      "feat": "Bellward",
      "tool": "Musical instrument",
      "hook": "Whose name was the final toll for?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Road Cartographer": {
      "name": "Road Cartographer",
      "abilities": [
        "Int",
        "Wis",
        "Dex"
      ],
      "skills": [
        "Investigation",
        "Survival"
      ],
      "feat": "Marker Reader",
      "tool": "Cartographer tools",
      "hook": "Which road exists on no map except yours?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Candle Keeper": {
      "name": "Candle Keeper",
      "abilities": [
        "Wis",
        "Cha",
        "Con"
      ],
      "skills": [
        "Insight",
        "Religion"
      ],
      "feat": "Wickwise",
      "tool": "Calligrapher tools",
      "hook": "Whose candle do you refuse to extinguish?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Wolf Tracker": {
      "name": "Wolf Tracker",
      "abilities": [
        "Dex",
        "Wis",
        "Str"
      ],
      "skills": [
        "Perception",
        "Survival"
      ],
      "feat": "Quiet Boot",
      "tool": "Leatherworker tools",
      "hook": "Which wolf waits for you at the treeline?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Relic Smuggler": {
      "name": "Relic Smuggler",
      "abilities": [
        "Dex",
        "Cha",
        "Int"
      ],
      "skills": [
        "Deception",
        "Sleight of Hand"
      ],
      "feat": "False Compartments",
      "tool": "Thieves tools",
      "hook": "What relic did you deliver to the wrong person?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Weather Scribe": {
      "name": "Weather Scribe",
      "abilities": [
        "Int",
        "Wis",
        "Con"
      ],
      "skills": [
        "Nature",
        "Investigation"
      ],
      "feat": "Storm Reader",
      "tool": "Calligrapher tools",
      "hook": "What did yesterday’s rain spell on the windows?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Ash Harvester": {
      "name": "Ash Harvester",
      "abilities": [
        "Con",
        "Str",
        "Wis"
      ],
      "skills": [
        "Athletics",
        "Nature"
      ],
      "feat": "Cinderproof",
      "tool": "Smith tools",
      "hook": "What remained burning in the ashes you gathered?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Lake Diver": {
      "name": "Lake Diver",
      "abilities": [
        "Dex",
        "Con",
        "Wis"
      ],
      "skills": [
        "Athletics",
        "Investigation"
      ],
      "feat": "Blackwater Lungs",
      "tool": "Vehicles (water)",
      "hook": "What did you leave chained below the jetty?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Abandoned Heir": {
      "name": "Abandoned Heir",
      "abilities": [
        "Cha",
        "Int",
        "Wis"
      ],
      "skills": [
        "History",
        "Persuasion"
      ],
      "feat": "Last Name",
      "tool": "Forgery kit",
      "hook": "Why does a stranger carry your family seal?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Gate Watcher": {
      "name": "Gate Watcher",
      "abilities": [
        "Str",
        "Con",
        "Wis"
      ],
      "skills": [
        "Insight",
        "Perception"
      ],
      "feat": "Threshold Sentinel",
      "tool": "Mason tools",
      "hook": "What walked through the gate after the watch changed?",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    }
  },
  "feats": {
    "Salt-Ring Keeper": {
      "name": "Salt-Ring Keeper",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "Trace a five-foot ring of salt during a rest; your group learns whether a creature crosses it during the next hour, but the ring does not stop the creature.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "River-Bound": {
      "name": "River-Bound",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "You can swim half your walking speed in ordinary water and identify the safest visible landing on a riverbank.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Bellward": {
      "name": "Bellward",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "Once per long rest, toll a handheld bell to grant an ally advantage on one save against the frightened condition within 30 feet.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Marker Reader": {
      "name": "Marker Reader",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "With one minute of study, identify the direction of the nearest traveled road you have already crossed.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Wickwise": {
      "name": "Wickwise",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "A mundane flame you light lasts twice as long; once per long rest, use it to grant +1d4 to an ally’s Perception check in darkness.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Quiet Boot": {
      "name": "Quiet Boot",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "Once per short rest, reroll a failed Stealth check made while stationary.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "False Compartments": {
      "name": "False Compartments",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "During a short rest, hide one Tiny object in your clothing; a searcher has disadvantage on checks to locate it until you move it.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Storm Reader": {
      "name": "Storm Reader",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "Once per long rest, predict whether a natural storm will begin within the next hour; the DM answers truthfully if weather is natural.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Cinderproof": {
      "name": "Cinderproof",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "Gain advantage on saving throws against nonmagical choking smoke, not poison gas.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Blackwater Lungs": {
      "name": "Blackwater Lungs",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "Hold your breath for ten minutes; you can orient yourself in dark water by the feel of current.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Last Name": {
      "name": "Last Name",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "Once per long rest, gain advantage on one Persuasion check with someone familiar with your family name.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Threshold Sentinel": {
      "name": "Threshold Sentinel",
      "category": "Origin",
      "minimumLevel": 1,
      "text": "When you take the Ready action to defend a doorway, gain temporary HP equal to your proficiency bonus, once per short rest.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Coffin Listener": {
      "name": "Coffin Listener",
      "category": "General",
      "minimumLevel": 4,
      "text": "You have advantage on Investigation checks to locate movement or scraping within a wooden container.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Mist Cartographer": {
      "name": "Mist Cartographer",
      "category": "General",
      "minimumLevel": 4,
      "text": "After traveling through magical fog, you can make a map of the physical path you took with one hour of work.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Scarecrow Breaker": {
      "name": "Scarecrow Breaker",
      "category": "General",
      "minimumLevel": 4,
      "text": "When you hit a construct made primarily of straw, it cannot take reactions until your next turn, once per short rest.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Chapel Refuge": {
      "name": "Chapel Refuge",
      "category": "General",
      "minimumLevel": 4,
      "text": "Once per long rest, after spending ten minutes at a consecrated shrine, grant one ally 1d6 temporary HP.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Warded Blood": {
      "name": "Warded Blood",
      "category": "General",
      "minimumLevel": 4,
      "text": "Once per long rest, gain advantage on a saving throw against a spore-borne or curse-borne effect.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Cold Iron Grip": {
      "name": "Cold Iron Grip",
      "category": "General",
      "minimumLevel": 4,
      "text": "You gain advantage on Athletics checks to keep hold of a metal object against being disarmed.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Raven Pact": {
      "name": "Raven Pact",
      "category": "General",
      "minimumLevel": 4,
      "text": "As a ritual, leave food for local ravens; you gain advantage on your next Survival check to follow a trail, once per long rest.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Ashen Resolve": {
      "name": "Ashen Resolve",
      "category": "General",
      "minimumLevel": 4,
      "text": "Once per long rest, when you fail a Constitution saving throw, add 1d4 to the result, potentially succeeding.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Oathscarred": {
      "name": "Oathscarred",
      "category": "General",
      "minimumLevel": 4,
      "text": "After making a promise before allies, gain advantage on one check made directly to fulfill it that day; once per long rest.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Wolf-Wise": {
      "name": "Wolf-Wise",
      "category": "General",
      "minimumLevel": 4,
      "text": "You have advantage on Animal Handling checks against ordinary wolves, though not undead or magical wolves.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Briar Athlete": {
      "name": "Briar Athlete",
      "category": "General",
      "minimumLevel": 4,
      "text": "Ignore difficult terrain caused by nonmagical roots for the first ten feet of your turn.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Grave Reader": {
      "name": "Grave Reader",
      "category": "General",
      "minimumLevel": 4,
      "text": "Identify approximate age of a grave from soil and weathering with one minute of inspection.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Tomb Compass": {
      "name": "Tomb Compass",
      "category": "General",
      "minimumLevel": 4,
      "text": "After navigating a stone dungeon for ten minutes, know the direction of the exit you entered through unless teleportation intervened.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Unlit Watch": {
      "name": "Unlit Watch",
      "category": "General",
      "minimumLevel": 4,
      "text": "While stationary in darkness, creatures cannot find you solely from the sound of your breathing.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Glassmaker": {
      "name": "Glassmaker",
      "category": "General",
      "minimumLevel": 4,
      "text": "You can improvise a mundane spyglass or signal mirror over a short rest if suitable materials are available; it breaks after use.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Dawn Resilience": {
      "name": "Dawn Resilience",
      "category": "General",
      "minimumLevel": 4,
      "text": "Once per long rest, when you gain temporary HP, add your proficiency bonus to that amount.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Quiet Revelator": {
      "name": "Quiet Revelator",
      "category": "General",
      "minimumLevel": 4,
      "text": "Once per short rest, you can discern if someone is deliberately concealing a noise, provided you can normally hear it.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Pale Mountain Step": {
      "name": "Pale Mountain Step",
      "category": "General",
      "minimumLevel": 4,
      "text": "Reduce the first 10 feet of falling distance after you deliberately jump from natural stone.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Lantern Duelist": {
      "name": "Lantern Duelist",
      "category": "General",
      "minimumLevel": 4,
      "text": "While holding a lit lantern in your off hand, once per short rest impose -1d4 on one enemy melee attack against you.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "One More Night": {
      "name": "One More Night",
      "category": "General",
      "minimumLevel": 4,
      "text": "Once per long rest, when you finish a short rest with 0 Hit Dice left, recover 1 expended Hit Die.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Echo Listener": {
      "name": "Echo Listener",
      "category": "General",
      "minimumLevel": 4,
      "text": "Gain advantage on Investigation checks to identify the direction of a sound heard through masonry.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Copper Sigil": {
      "name": "Copper Sigil",
      "category": "General",
      "minimumLevel": 4,
      "text": "When you take lightning damage, reduce it by your proficiency bonus once per long rest.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Mourners Friend": {
      "name": "Mourners Friend",
      "category": "General",
      "minimumLevel": 4,
      "text": "After spending an hour comforting a grieving creature, gain advantage on your next Insight check against it within a day.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Hollow Key": {
      "name": "Hollow Key",
      "category": "General",
      "minimumLevel": 4,
      "text": "Once per long rest, gain advantage on one check to force open a mundane locked door that you have previously examined.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Gatehold": {
      "name": "Gatehold",
      "category": "Fighting Style",
      "minimumLevel": 4,
      "text": "While using a shield in a narrow passage, gain +1 AC against the first melee attack each round.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Lantern Guard": {
      "name": "Lantern Guard",
      "category": "Fighting Style",
      "minimumLevel": 4,
      "text": "You may pick up or set down a lantern as part of your movement; once per turn on a melee hit while carrying one, deal +1 fire damage.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Coffin Nail": {
      "name": "Coffin Nail",
      "category": "Fighting Style",
      "minimumLevel": 4,
      "text": "Once per turn, when you hit a creature with a one-handed piercing weapon, you can prevent it moving 5 feet by a reaction until your next turn; once per short rest.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Reed Spear": {
      "name": "Reed Spear",
      "category": "Fighting Style",
      "minimumLevel": 4,
      "text": "When you Ready a spear attack against an approaching enemy, add +1 to its attack roll.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Stonewall Stance": {
      "name": "Stonewall Stance",
      "category": "Fighting Style",
      "minimumLevel": 4,
      "text": "If you have not moved this turn, gain advantage on your next check to resist a shove until your next turn.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Mercy Blade": {
      "name": "Mercy Blade",
      "category": "Fighting Style",
      "minimumLevel": 4,
      "text": "Once per turn, reduce damage from your melee weapon by up to your proficiency bonus, declaring the blow nonlethal.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Ravenflight Archery": {
      "name": "Ravenflight Archery",
      "category": "Fighting Style",
      "minimumLevel": 4,
      "text": "After a ranged attack from elevated ground, move 5 feet without provoking attacks from your target; once per turn.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Ashen Counter": {
      "name": "Ashen Counter",
      "category": "Fighting Style",
      "minimumLevel": 4,
      "text": "Once per short rest, after a melee attack misses you, use a reaction to make one attack with a light weapon you wield.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Boon of the Last Lantern": {
      "name": "Boon of the Last Lantern",
      "category": "Epic Boon",
      "minimumLevel": 19,
      "text": "Once per long rest, when you and nearby allies would be magically plunged into darkness, your light instead persists for one round.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Boon of the Road Beyond": {
      "name": "Boon of the Road Beyond",
      "category": "Epic Boon",
      "minimumLevel": 19,
      "text": "Once per long rest, travel instantly with up to five willing allies along an already-known short path of no more than one mile; DM approves line of travel.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Boon of the Unforgotten": {
      "name": "Boon of the Unforgotten",
      "category": "Epic Boon",
      "minimumLevel": 19,
      "text": "Once per long rest, an ally who dies within 30 feet may speak one final sentence before its spirit departs; this does not revive them.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    "Boon of Spring After Ash": {
      "name": "Boon of Spring After Ash",
      "category": "Epic Boon",
      "minimumLevel": 19,
      "text": "Once per long rest, restore one acre of nonmagical blighted vegetation over an hour, leaving magically cursed areas unchanged.",
      "repeatable": false,
      "manualRules": true,
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    }
  },
  "spells": [
    {
      "name": "Candle Compass",
      "level": 0,
      "school": "Divination",
      "range": "60",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Bard",
        "Cleric",
        "Druid",
        "Wizard",
        "Lantern Marshal"
      ],
      "text": "A candle points toward the nearest visible safe path you have traveled today. It cannot reveal a hidden passage.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Ashmark",
      "level": 0,
      "school": "Transmutation",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Druid",
        "Sorcerer",
        "Wizard",
        "Ashbinder"
      ],
      "text": "Draw an ash symbol on a solid surface. Only creatures you name can see its cold gray glow.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Reed Whisper",
      "level": 0,
      "school": "Divination",
      "range": "30",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 minute",
      "classes": [
        "Bard",
        "Druid",
        "Ranger",
        "Thornbound"
      ],
      "text": "A patch of grass repeats the last loud sound within ten feet of it, distorted by wind.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Grave Glow",
      "level": 0,
      "school": "Evocation",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "10 minutes",
      "classes": [
        "Cleric",
        "Paladin",
        "Warlock",
        "Lantern Marshal"
      ],
      "text": "Touch a pebble; it shines with dim silver light and briefly brightens near an open grave.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Borrowed Knock",
      "level": 0,
      "school": "Illusion",
      "range": "60",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Bard",
        "Sorcerer",
        "Warlock",
        "Veilwalker"
      ],
      "text": "Make one clearly audible knock arise from a door you can see, without opening it.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Frostprint",
      "level": 0,
      "school": "Divination",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Druid",
        "Ranger",
        "Wizard",
        "Ashbinder"
      ],
      "text": "Reveal fresh footprints on a ten-foot patch of ground for a breath, without showing who made them.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "A Door Remembers",
      "level": 1,
      "school": "Divination",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Bard",
        "Cleric",
        "Wizard",
        "Ashbinder"
      ],
      "text": "Touch a door to hear one sound it made when last opened. A sealed door reveals nothing beyond its own noise.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Hearthward",
      "level": 1,
      "school": "Abjuration",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Cleric",
        "Druid",
        "Paladin",
        "Lantern Marshal"
      ],
      "text": "Mark one willing creature with soot. Once during the duration it gains advantage on a save against being frightened; spell then ends.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Mudglass",
      "level": 1,
      "school": "Transmutation",
      "range": "30",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "10 minutes",
      "classes": [
        "Druid",
        "Ranger",
        "Sorcerer",
        "Thornbound"
      ],
      "text": "Turn a five-foot puddle into clear, walkable glasslike mud; it breaks harmlessly after the spell.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Crows Warning",
      "level": 1,
      "school": "Divination",
      "range": "Self",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Bard",
        "Druid",
        "Ranger",
        "Warlock"
      ],
      "text": "You hear a distant raven whenever an unseen Large creature moves within thirty feet; total cover blocks the warning.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Wick of Mercy",
      "level": 1,
      "school": "Abjuration",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Cleric",
        "Paladin",
        "Ashbinder",
        "Lantern Marshal"
      ],
      "text": "A living creature at zero HP becomes stable and wakes after one minute with one HP; it cannot benefit again until a long rest.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "False Window",
      "level": 1,
      "school": "Illusion",
      "range": "60",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "10 minutes",
      "classes": [
        "Bard",
        "Sorcerer",
        "Warlock",
        "Wizard"
      ],
      "text": "Create a false glowing window on a solid wall; physical inspection reveals stone or wood beneath.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Brine Circle",
      "level": 2,
      "school": "Abjuration",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Cleric",
        "Druid",
        "Paladin",
        "Ashbinder"
      ],
      "text": "Place a ring of salt up to ten feet across. Its outline flashes when an undead creature crosses, but it does not block passage.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Wolfglass",
      "level": 2,
      "school": "Divination",
      "range": "Self",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "10 minutes",
      "classes": [
        "Druid",
        "Ranger",
        "Warlock",
        "Veilwalker"
      ],
      "text": "For ten minutes your vision reveals fresh animal tracks as faint blue lines within thirty feet.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Tarn Mirror",
      "level": 2,
      "school": "Illusion",
      "range": "60",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 minute",
      "classes": [
        "Bard",
        "Sorcerer",
        "Warlock",
        "Wizard"
      ],
      "text": "A still pool reflects an empty landscape instead of nearby creatures; contact dispels the image.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Bitter Reed",
      "level": 2,
      "school": "Transmutation",
      "range": "30",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 minute",
      "classes": [
        "Druid",
        "Ranger",
        "Thornbound"
      ],
      "text": "Reeds in a ten-foot-square patch rise to waist height, giving half cover without trapping creatures.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Bell of Names",
      "level": 2,
      "school": "Divination",
      "range": "Self",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Bard",
        "Cleric",
        "Paladin",
        "Wizard"
      ],
      "text": "Speak a name while ringing a bell. Learn whether the named creature has been within sixty feet in the last day; a ward prevents this.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Chimney Flight",
      "level": 2,
      "school": "Transmutation",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 minute",
      "classes": [
        "Druid",
        "Sorcerer",
        "Wizard",
        "Ashbinder"
      ],
      "text": "One willing creature becomes a harmless spiral of warm ash to pass through a nonmagical opening at least one inch wide, ending in a safe empty space.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "The Empty Procession",
      "level": 3,
      "school": "Illusion",
      "range": "90",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "10 minutes",
      "classes": [
        "Bard",
        "Sorcerer",
        "Warlock",
        "Wizard"
      ],
      "text": "Create distant footsteps and lantern lights moving along one hundred feet of road; figures cannot interact physically.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Cinder Guard",
      "level": 3,
      "school": "Abjuration",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Cleric",
        "Druid",
        "Paladin",
        "Ashbinder"
      ],
      "text": "One willing creature gains resistance to cold damage; its shadow smells faintly of ash.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Gravewater Witness",
      "level": 3,
      "school": "Divination",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Cleric",
        "Druid",
        "Wizard",
        "Thornbound"
      ],
      "text": "Touch naturally collected gravewater to glimpse the most recent living creature reflected in it.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Black Orchard",
      "level": 3,
      "school": "Transmutation",
      "range": "60",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Druid",
        "Ranger",
        "Warlock",
        "Thornbound"
      ],
      "text": "A fifteen-foot-radius stand of illusory black trees provides visual obscurity but no physical cover.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Lanterngate",
      "level": 3,
      "school": "Abjuration",
      "range": "30",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 minute",
      "classes": [
        "Cleric",
        "Paladin",
        "Wizard",
        "Lantern Marshal"
      ],
      "text": "Ward a visible doorway for one minute; allies crossing it gain two temporary HP, once per casting.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Salt the Echo",
      "level": 3,
      "school": "Abjuration",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Cleric",
        "Paladin",
        "Warlock",
        "Ashbinder"
      ],
      "text": "Suppress magical whispering that originates in one unattended object; a creature holding it can resist with a Wisdom save.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "When the Road Forks",
      "level": 4,
      "school": "Divination",
      "range": "Self",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Bard",
        "Cleric",
        "Druid",
        "Wizard"
      ],
      "text": "Learn which of two visible roads leads closer to one place you have personally visited; magical redirection may distort the answer.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "The Quiet House",
      "level": 4,
      "school": "Abjuration",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Concentration, up to 10 minutes",
      "classes": [
        "Bard",
        "Cleric",
        "Paladin",
        "Wizard"
      ],
      "text": "Sound cannot pass through the walls of one small room for ten minutes; it does not prevent entry.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Drowned Footfall",
      "level": 4,
      "school": "Transmutation",
      "range": "Touch",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Concentration, up to 1 hour",
      "classes": [
        "Druid",
        "Ranger",
        "Sorcerer",
        "Thornbound"
      ],
      "text": "Up to four willing creatures make no sound while moving across water or wet ground; they still leave tracks.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Borrow the Bell",
      "level": 4,
      "school": "Illusion",
      "range": "90",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "1 minute",
      "classes": [
        "Bard",
        "Sorcerer",
        "Warlock",
        "Ashbinder"
      ],
      "text": "Project a realistic tolling bell from a point you see, with the call of one creature you have heard.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Hollow Moonfire",
      "level": 4,
      "school": "Evocation",
      "range": "90",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Cleric",
        "Sorcerer",
        "Warlock",
        "Wizard"
      ],
      "text": "A pale ring ignites at a point, revealing invisible creatures in a ten-foot radius until the end of your next turn; it deals no damage.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Ashen Ferry",
      "level": 4,
      "school": "Conjuration",
      "range": "30",
      "castingTime": "Action",
      "components": "V, S",
      "duration": "10 minutes",
      "classes": [
        "Druid",
        "Sorcerer",
        "Wizard",
        "Veilwalker"
      ],
      "text": "Summon a stationary raft of cold ash that supports up to four Medium creatures on still water for ten minutes.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "The Door That Stayed",
      "level": 5,
      "school": "Abjuration",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Cleric",
        "Paladin",
        "Warlock",
        "Wizard"
      ],
      "text": "A mundane doorway cannot close or latch for one hour, though it can be blocked physically.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Remember the Drowned",
      "level": 5,
      "school": "Divination",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Cleric",
        "Druid",
        "Wizard",
        "Ashbinder"
      ],
      "text": "Touch an object recovered from a river to see a silent five-second image of the moment it fell in, if any.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Unmourned Army",
      "level": 5,
      "school": "Illusion",
      "range": "120",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Bard",
        "Sorcerer",
        "Warlock",
        "Wizard"
      ],
      "text": "Phantasmal silhouettes march across a sixty-foot roadway, blocking sight beyond them but never preventing movement.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Mercy Against Roots",
      "level": 5,
      "school": "Abjuration",
      "range": "60",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Cleric",
        "Druid",
        "Paladin",
        "Thornbound"
      ],
      "text": "End one magical plant-grapple on a creature within range; does not end other conditions.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Seal the Choir",
      "level": 5,
      "school": "Abjuration",
      "range": "60",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Cleric",
        "Warlock",
        "Wizard",
        "Ashbinder"
      ],
      "text": "For one minute creatures inside a fifteen-foot sphere cannot send telepathic messages outside it; ordinary speech still works.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Night Orchard Bloom",
      "level": 5,
      "school": "Transmutation",
      "range": "90",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Druid",
        "Ranger",
        "Sorcerer",
        "Thornbound"
      ],
      "text": "Cause a sixty-foot patch of existing natural growth to erupt with black blossoms, lightly obscuring it for enemies and allies alike.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Carry Home the Flame",
      "level": 6,
      "school": "Conjuration",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Cleric",
        "Druid",
        "Paladin",
        "Lantern Marshal"
      ],
      "text": "Teleport up to three willing creatures touching you to a sanctuary you have rested in today, within five miles; wards may prevent arrival.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Buried Map",
      "level": 6,
      "school": "Divination",
      "range": "Self",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Bard",
        "Druid",
        "Wizard",
        "Ashbinder"
      ],
      "text": "Know the shape of natural caves beneath you for five hundred feet in a horizontal radius, but not their occupants or doors.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Silence in the Root",
      "level": 6,
      "school": "Abjuration",
      "range": "120",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Druid",
        "Warlock",
        "Wizard",
        "Thornbound"
      ],
      "text": "Suppress communication between magically linked plant creatures within a twenty-foot-radius sphere, without harming them.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "The Mourning Wind",
      "level": 6,
      "school": "Illusion",
      "range": "120",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "10 minutes",
      "classes": [
        "Bard",
        "Sorcerer",
        "Warlock",
        "Wizard"
      ],
      "text": "A wind carries familiar voices through a town; listeners can identify it as an illusion with an Investigation check against your spell DC.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Lantern of the Third Watch",
      "level": 6,
      "school": "Divination",
      "range": "Self",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Cleric",
        "Paladin",
        "Wizard",
        "Lantern Marshal"
      ],
      "text": "A hovering light marks all visible exits within sixty feet in distinct colors; secret doors remain concealed.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Salt Upon the Sea",
      "level": 6,
      "school": "Abjuration",
      "range": "120",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "1 minute",
      "classes": [
        "Cleric",
        "Druid",
        "Sorcerer",
        "Ashbinder"
      ],
      "text": "Conjure a line of suspended salt over water, preventing magical fog from crossing that line for one minute.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Names Under Stone",
      "level": 7,
      "school": "Divination",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Cleric",
        "Warlock",
        "Wizard",
        "Ashbinder"
      ],
      "text": "Read the names last spoken near a standing stone in the previous century; ancient magic can silence some names.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Ashes of Yesterday",
      "level": 7,
      "school": "Transmutation",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Druid",
        "Sorcerer",
        "Wizard",
        "Ashbinder"
      ],
      "text": "Restore one nonmagical object destroyed by ordinary fire in the previous day, no larger than a five-foot cube.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "The Wolf Who Wasn't",
      "level": 7,
      "school": "Illusion",
      "range": "120",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 10 minutes",
      "classes": [
        "Bard",
        "Druid",
        "Warlock",
        "Veilwalker"
      ],
      "text": "Create a convincing phantom pack of wolves that patrol a line you designate, but cannot attack or physically block passage.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Road of Mourning",
      "level": 7,
      "school": "Conjuration",
      "range": "Self",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "1 minute",
      "classes": [
        "Bard",
        "Cleric",
        "Wizard",
        "Lantern Marshal"
      ],
      "text": "Create a temporary one-hundred-foot straight path of pale cobbles over stable ground; it cannot bridge open chasms or water.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Gallows Rest",
      "level": 7,
      "school": "Abjuration",
      "range": "60",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Cleric",
        "Paladin",
        "Warlock",
        "Ashbinder"
      ],
      "text": "Prevent an area of magical necromantic animation within a twenty-foot radius; affected undead are not destroyed and may leave.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Orchard of the Unlost",
      "level": 7,
      "school": "Transmutation",
      "range": "90",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Druid",
        "Sorcerer",
        "Wizard",
        "Thornbound"
      ],
      "text": "Rejuvenate one acre of mundane diseased orchard for an hour; the land returns to its previous state afterward.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "The Ninth Toll",
      "level": 8,
      "school": "Divination",
      "range": "Self",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Bard",
        "Cleric",
        "Warlock",
        "Wizard"
      ],
      "text": "Learn one imminent event that threatens a named ally within the next hour, expressed as a brief bell-vision, never a guaranteed future.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Lantern Between Worlds",
      "level": 8,
      "school": "Abjuration",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Cleric",
        "Paladin",
        "Wizard",
        "Lantern Marshal"
      ],
      "text": "Protect one willing creature against being moved unwillingly between planes for one minute.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Hollow Sky",
      "level": 8,
      "school": "Illusion",
      "range": "120",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 10 minutes",
      "classes": [
        "Bard",
        "Sorcerer",
        "Warlock",
        "Wizard"
      ],
      "text": "Turn a two-hundred-foot patch of visible sky into the illusion of an impossible eclipse, with no actual dimming of sunlight.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Restore the Road",
      "level": 8,
      "school": "Transmutation",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Druid",
        "Wizard",
        "Ashbinder",
        "Thornbound"
      ],
      "text": "Rebuild up to three hundred feet of collapsed mundane roadway over stable ground; this cannot create material over an unsupported span.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Blackwater Covenant",
      "level": 8,
      "school": "Abjuration",
      "range": "90",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Cleric",
        "Druid",
        "Warlock",
        "Thornbound"
      ],
      "text": "Creatures you designate within a thirty-foot pool cannot be unwillingly dragged beneath the surface for the duration.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Borrow a Name From Stone",
      "level": 8,
      "school": "Divination",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Cleric",
        "Warlock",
        "Wizard",
        "Ashbinder"
      ],
      "text": "Touch a grave and learn the deceased's full name and one willingly spoken regret, if their spirit remains accessible.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "The Valley Remembers",
      "level": 9,
      "school": "Divination",
      "range": "Self",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Bard",
        "Cleric",
        "Druid",
        "Wizard"
      ],
      "text": "Witness a sweeping illusory history of one mile of countryside over the last day, without identifying obscured creatures.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "The Dawn We Were Denied",
      "level": 9,
      "school": "Abjuration",
      "range": "120",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "1 hour",
      "classes": [
        "Cleric",
        "Druid",
        "Paladin",
        "Lantern Marshal"
      ],
      "text": "Create true sunlight in a thirty-foot radius for one hour, but the effect cannot move with you or override another deity's domain without consent.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "One More Village",
      "level": 9,
      "school": "Transmutation",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "24 hours",
      "classes": [
        "Druid",
        "Wizard",
        "Thornbound"
      ],
      "text": "Restore nonmagical structures and crops in a ruined hamlet to the condition they had one year ago for one day. No creatures return.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "The Final Door",
      "level": 9,
      "school": "Abjuration",
      "range": "Touch",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "10 minutes",
      "classes": [
        "Cleric",
        "Paladin",
        "Warlock",
        "Ashbinder"
      ],
      "text": "Seal one ordinary door against any magical opening below ninth-level magic for ten minutes; mundane destruction still works.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "A Hundred Unheard Bells",
      "level": 9,
      "school": "Illusion",
      "range": "120",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Concentration, up to 1 minute",
      "classes": [
        "Bard",
        "Sorcerer",
        "Warlock",
        "Wizard"
      ],
      "text": "Fill a battlefield with illusory bells and the silhouettes of those who mourn it; creatures can resist the distraction with a Wisdom saving throw.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    },
    {
      "name": "Green Without the Hunger",
      "level": 9,
      "school": "Transmutation",
      "range": "120",
      "castingTime": "1 minute",
      "components": "V, S",
      "duration": "Instantaneous",
      "classes": [
        "Druid",
        "Cleric",
        "Wizard",
        "Thornbound"
      ],
      "text": "Turn one hundred feet of magically infested plants into dormant harmless foliage for one hour; intelligent infection beyond the plants remains.",
      "mode": "manual",
      "src": "Original Barovia character homebrew, Pack VII (2026)"
    }
  ],
  "starters": [
    {
      "name": "The Candle Captain",
      "className": "Lantern Marshal",
      "subclass": "Order of the Golden Wick",
      "species": "Ashkin",
      "background": "Gate Watcher",
      "hook": "Defend a doorway that nobody else can hold."
    },
    {
      "name": "The Svalich Ghost",
      "className": "Veilwalker",
      "subclass": "The Ravensworn",
      "species": "Crowblood",
      "background": "Road Cartographer",
      "hook": "Find the path that vanished last winter."
    },
    {
      "name": "The Ash Archivist",
      "className": "Ashbinder",
      "subclass": "The White Ash",
      "species": "Ashkin",
      "background": "Plague Bellringer",
      "hook": "Read the names scraped off a shrine."
    },
    {
      "name": "The Briar Witness",
      "className": "Thornbound",
      "subclass": "The Hollow Orchard",
      "species": "Thornmarked",
      "background": "Ash Harvester",
      "hook": "Save the last good fruit tree in Barovia."
    },
    {
      "name": "The Bellless Courier",
      "className": "Veilwalker",
      "subclass": "The Keyless",
      "species": "Duskling",
      "background": "Relic Smuggler",
      "hook": "Deliver a message to a dead recipient."
    },
    {
      "name": "The Black Warden",
      "className": "Lantern Marshal",
      "subclass": "Order of the Black Lantern",
      "species": "Gravekin",
      "background": "Grave Tender",
      "hook": "Keep a hunted family unseen until sunrise."
    },
    {
      "name": "The Furnace Scholar",
      "className": "Ashbinder",
      "subclass": "The Furnace Choir",
      "species": "Bellforged",
      "background": "Weather Scribe",
      "hook": "Discover why the forge burns with no fuel."
    },
    {
      "name": "The Reed Knight",
      "className": "Thornbound",
      "subclass": "The Briar Covenant",
      "species": "Mireborn",
      "background": "Lake Diver",
      "hook": "Reclaim a causeway from the marsh."
    },
    {
      "name": "The Pale Trailblazer",
      "className": "Veilwalker",
      "subclass": "The Ravensworn",
      "species": "Palecrest",
      "background": "Wolf Tracker",
      "hook": "Bring the missing hunters home."
    },
    {
      "name": "The Unburnt Scribe",
      "className": "Ashbinder",
      "subclass": "The White Ash",
      "species": "Duskling",
      "background": "Candle Keeper",
      "hook": "Find the one page that fire refused to eat."
    },
    {
      "name": "The Silent Ferryman",
      "className": "Lantern Marshal",
      "subclass": "Order of the Golden Wick",
      "species": "Mireborn",
      "background": "Night Ferryman",
      "hook": "Carry a stranger over black water without asking their name."
    },
    {
      "name": "The Last Parishioner",
      "className": "Thornbound",
      "subclass": "The Hollow Orchard",
      "species": "Gravekin",
      "background": "Abandoned Heir",
      "hook": "Replant the churchyard after the dead rise."
    }
  ]
};
