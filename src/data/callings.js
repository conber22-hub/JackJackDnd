export const MECHS = [
  {
    "k": "text",
    "fields": []
  },
  {
    "k": "extraDamage",
    "fields": [
      "dice",
      "type",
      "when"
    ]
  },
  {
    "k": "tempHp",
    "fields": [
      "amount",
      "when"
    ]
  },
  {
    "k": "resist",
    "fields": [
      "types",
      "when"
    ]
  },
  {
    "k": "aura",
    "fields": [
      "radius",
      "gives"
    ]
  },
  {
    "k": "reaction",
    "fields": [
      "trigger",
      "does"
    ]
  },
  {
    "k": "heal",
    "fields": [
      "amount",
      "range",
      "uses"
    ]
  },
  {
    "k": "advantage",
    "fields": [
      "on",
      "vs",
      "when"
    ]
  },
  {
    "k": "move",
    "fields": [
      "feet",
      "when",
      "provokes"
    ]
  },
  {
    "k": "summon",
    "fields": [
      "what",
      "hp",
      "lasts"
    ]
  },
  {
    "k": "seepCost",
    "fields": [
      "what"
    ]
  },
  {
    "k": "ward",
    "fields": [
      "max",
      "recharge"
    ]
  },
  {
    "k": "holdAtOne",
    "fields": [
      "uses"
    ],
    "text": "When damage would drop the bearer to zero without killing outright, leave them at one HP and spend a use."
  },
  {
    "k": "burst",
    "fields": [
      "radius",
      "dice",
      "type",
      "when",
      "targets",
      "uses"
    ],
    "text": "Deal the listed damage to each eligible creature within the radius when the trigger occurs, spending a use."
  },
  {
    "k": "like",
    "fields": [
      "feature"
    ],
    "text": "Use the named feature of this chassis at its normal level."
  }
];
export const CALLINGS = {
  "vanguard": {
    "id": "vanguard",
    "name": "Vanguard",
    "chassis": "Fighter",
    "emblem": "⛨",
    "color": "#7aafbc",
    "era": "far-future",
    "blurb": "The suit remembers the last order. Its wearer must decide whether the order still holds here.",
    "look": "Scored breastplate, one lit shoulder gauge, shield arm held forward.",
    "signature": {
      "n": "Ward",
      "text": "A field of force absorbs damage before your flesh. Its capacity is four plus twice your level. One round untouched brings it back."
    },
    "rename": {
      "Action Surge": {
        "n": "Redline",
        "text": "Spend a surge use for one additional action this turn, except the Magic action. Recover on a short or long rest."
      },
      "Action Surge (two uses)": {
        "n": "Reserve Cell",
        "text": "Use Redline twice between rests, but only once on a turn."
      },
      "Extra Attack": {
        "n": "Follow Through",
        "text": "Make two attacks when you take the Attack action on your turn."
      },
      "Fighting Style": {
        "n": "School of Arms",
        "text": "Gain a fighting style feat for which your training qualifies you."
      },
      "Indomitable": {
        "n": "Override",
        "text": "Reroll a failed save with your level as a bonus. Take the new result. Recover the use on a long rest."
      },
      "Indomitable (three uses)": {
        "n": "Last Override",
        "text": "Your save reroll now has three uses per long rest."
      },
      "Indomitable (two uses)": {
        "n": "Double Override",
        "text": "Your save reroll now has two uses per long rest."
      },
      "Second Wind": {
        "n": "Field Patch",
        "text": "As a bonus action spend a patch use to regain 1d10 HP plus your level."
      },
      "Studied Attacks": {
        "n": "Sight Correction",
        "text": "After missing a creature, gain advantage on your next attack against it before your next turn ends."
      },
      "Tactical Master": {
        "n": "Switch Grip",
        "text": "On a hit with a mastered weapon, replace its mastery with pushing, slowing or sapping."
      },
      "Tactical Mind": {
        "n": "Failure Review",
        "text": "Spend a patch use to add 1d10 to a failed ability check. Keep the use if it still fails."
      },
      "Tactical Shift": {
        "n": "Slip the Fence",
        "text": "When you patch as a bonus action, also move up to half speed without provoking opportunity attacks."
      },
      "Three Extra Attacks": {
        "n": "Four-Beat Drill",
        "text": "Attack four times with your Attack action on your turn."
      },
      "Two Extra Attacks": {
        "n": "Three-Beat Drill",
        "text": "Attack three times with your Attack action on your turn."
      },
      "Weapon Mastery": {
        "n": "Arms Drill",
        "text": "Use the mastery properties of your trained weapon types. Retrain a weapon choice at a long rest."
      }
    },
    "paths": [
      {
        "id": "hoplite",
        "name": "Hoplite",
        "blurb": "Close shields until your neighbour’s shadow touches yours.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Shield Rim",
              "text": "Gain 1d6+lvl temporary HP after a rest.",
              "mech": {
                "k": "tempHp",
                "amount": "1d6+lvl",
                "when": "rest"
              }
            }
          ],
          "7": [
            {
              "n": "Spear Lane",
              "text": "Deal 1d4 extra piercing damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d4",
                "type": "piercing",
                "when": "firstHitEachTurn"
              }
            }
          ],
          "10": [
            {
              "n": "Lock Shields",
              "text": "When an ally is hit, use your reaction to move ten feet towards them without provoking.",
              "mech": {
                "k": "reaction",
                "trigger": "allyHit",
                "does": {
                  "k": "move",
                  "feet": 10,
                  "provokes": false,
                  "when": "reaction"
                }
              }
            }
          ],
          "15": [
            {
              "n": "Bronze Chorus",
              "text": "You and allies within ten feet have advantage on saves against being frightened.",
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
            }
          ],
          "18": [
            {
              "n": "The Unbroken Rank",
              "text": "Gain 1d10+lvl temporary HP as a bonus action.",
              "mech": {
                "k": "tempHp",
                "amount": "1d10+lvl",
                "when": "bonus"
              }
            }
          ]
        }
      },
      {
        "id": "breacher",
        "name": "Breacher",
        "blurb": "You count doors by the sound the hinges make.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "First Through the Breach",
              "text": "Move 15 feet when initiative is rolled without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 15,
                "when": "initiative",
                "provokes": false
              }
            }
          ],
          "7": [
            {
              "n": "Pile Driver",
              "text": "Deal 1d6 extra thunder damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "thunder",
                "when": "firstHitEachTurn"
              }
            }
          ],
          "10": [
            {
              "n": "Clear the Sill",
              "text": "Move 10 feet after an attack without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "afterAttack",
                "provokes": false
              }
            }
          ],
          "15": [
            {
              "n": "Blast Mantle",
              "text": "You resist fire damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "fire"
                ],
                "when": "always"
              }
            }
          ],
          "18": [
            {
              "n": "Last Charge",
              "text": "Deal 3d6 extra force damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "3d6",
                "type": "force",
                "when": "crit"
              }
            }
          ]
        }
      },
      {
        "id": "hollowed",
        "name": "Hollowed",
        "blurb": "Something fills the holes in your armour from inside.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Packed Wound",
              "text": "Once per long rest, when a blow would drop you to zero without killing you outright, let the rot hold you at one HP.",
              "mech": {
                "k": "holdAtOne",
                "uses": "1/longRest",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "Each invocation reduces maximum HP by one until a long rest."
                  }
                ]
              }
            }
          ],
          "7": [
            {
              "n": "Hollow Step",
              "text": "Move 10 feet when an ally within ten feet falls without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "allyDown",
                "provokes": false,
                "also": [
                  {
                    "k": "seepCost",
                    "what": "Each invocation reduces maximum HP by one until a long rest."
                  }
                ]
              }
            }
          ],
          "10": [
            {
              "n": "Vacant Ribs",
              "text": "As a bonus action, invoke this gift for one minute. You resist necrotic damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "necrotic"
                ],
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "Each invocation reduces maximum HP by one until a long rest."
                  }
                ]
              }
            }
          ],
          "15": [
            {
              "n": "Cold Tenant",
              "text": "Deal 1d6 extra necrotic damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "necrotic",
                "when": "firstHitEachTurn",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "Each invocation reduces maximum HP by one until a long rest."
                  }
                ]
              }
            }
          ],
          "18": [
            {
              "n": "Refusal of Earth",
              "text": "Gain 1d10+lvl temporary HP as a bonus action.",
              "mech": {
                "k": "tempHp",
                "amount": "1d10+lvl",
                "when": "bonus",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "Each invocation reduces maximum HP by one until a long rest."
                  }
                ]
              }
            }
          ]
        },
        "cost": "Each invocation reduces maximum HP by one until a long rest."
      }
    ]
  },
  "huscarl": {
    "id": "huscarl",
    "name": "Huscarl",
    "chassis": "Barbarian",
    "emblem": "🪓",
    "color": "#b87b49",
    "era": "medieval",
    "blurb": "The hall is centuries away. You still count the people at the fire before you sleep.",
    "look": "Iron rings sewn into wool, notches on a round shield, axe at rest.",
    "signature": {
      "n": "Fury",
      "text": "As a bonus action without heavy armour, enter fury. Gain strength advantage, bonus strength damage and resistance to physical blows. Keep it going by attacking, forcing a save or spending a bonus action."
    },
    "rename": {
      "Brutal Strike": {
        "n": "Break Their Footing",
        "text": "Give up advantage on one reckless Strength attack. A hit adds a damage die and a debilitating effect."
      },
      "Danger Sense": {
        "n": "Loose Floorboard",
        "text": "Roll Dexterity saves with advantage while you can act."
      },
      "Extra Attack": {
        "n": "Follow Through",
        "text": "Make two attacks when you take the Attack action on your turn."
      },
      "Fast Movement": {
        "n": "Hall Runner",
        "text": "Gain 10 feet of speed outside heavy armour."
      },
      "Feral Instinct": {
        "n": "First Through",
        "text": "Roll initiative with advantage."
      },
      "Improved Brutal Strike": {
        "n": "Split the Guard",
        "text": "Expand your choices of disabling blows at level 13. At 17 deal two extra dice and choose two different effects."
      },
      "Indomitable Might": {
        "n": "Lift the Lintel",
        "text": "Use your Strength score in place of a lower Strength check or Strength save total."
      },
      "Instinctive Pounce": {
        "n": "Threshold Leap",
        "text": "Move up to half your speed as part of entering fury."
      },
      "Persistent Rage": {
        "n": "Banked Coals",
        "text": "Once per long rest regain all fury uses on initiative. Fury lasts ten minutes without tending, ending early on unconsciousness or heavy armour."
      },
      "Primal Champion": {
        "n": "Pillars of the Hall",
        "text": "Raise Strength and Constitution by four each, up to 25."
      },
      "Primal Knowledge": {
        "n": "Hall Lessons",
        "text": "Learn another calling skill. During fury you may use Strength for Acrobatics, Intimidation, Perception, Stealth or Survival."
      },
      "Rage": {
        "n": "Fury",
        "text": "As a bonus action without heavy armour, enter fury. Gain strength advantage, bonus strength damage and resistance to physical blows. Keep it going by attacking, forcing a save or spending a bonus action."
      },
      "Reckless Attack": {
        "n": "Open Guard",
        "text": "On your first attack, expose yourself. Strength attacks have advantage until your next turn starts, as do attacks against you."
      },
      "Relentless Rage": {
        "n": "Still at the Door",
        "text": "When fury would end in a fall to zero, a Constitution save can keep you upright at twice your level in HP. Repeated saves get harder."
      },
      "Unarmored Defense": {
        "n": "Bare Guard",
        "text": "Without armour, add Constitution and Dexterity to 10 for AC. A shield is allowed."
      },
      "Weapon Mastery": {
        "n": "Arms Drill",
        "text": "Use the mastery properties of your trained weapon types. Retrain a weapon choice at a long rest."
      }
    },
    "paths": [
      {
        "id": "shieldbiter",
        "name": "Shieldbiter",
        "blurb": "When the hall door caves, you meet it with your teeth bared.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Rim of Teeth",
              "text": "During fury, the first target you hit after committing to an open guard on your turn takes extra d6s of the weapon’s damage type equal to your fury damage bonus.",
              "mech": {
                "k": "like",
                "feature": "Berserker: Frenzy"
              }
            }
          ],
          "6": [
            {
              "n": "Winter Hide",
              "text": "You resist cold damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "cold"
                ],
                "when": "always"
              }
            }
          ],
          "10": [
            {
              "n": "Red Notch",
              "text": "Deal 2d6 extra slashing damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "2d6",
                "type": "slashing",
                "when": "crit"
              }
            }
          ],
          "14": [
            {
              "n": "Hall Roar",
              "text": "You and allies within ten feet have advantage on saves against being frightened.",
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
            }
          ]
        }
      },
      {
        "id": "hearth-sworn",
        "name": "Hearth-Sworn",
        "blurb": "The place at your right hand is someone’s way home.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Benchmate",
              "text": "When an ally is hit, use your reaction to move ten feet towards them without provoking.",
              "mech": {
                "k": "reaction",
                "trigger": "allyHit",
                "does": {
                  "k": "move",
                  "feet": 10,
                  "provokes": false,
                  "when": "reaction"
                }
              }
            }
          ],
          "6": [
            {
              "n": "Banked Hearth",
              "text": "Gain 1d6+lvl temporary HP after a rest.",
              "mech": {
                "k": "tempHp",
                "amount": "1d6+lvl",
                "when": "rest"
              }
            }
          ],
          "10": [
            {
              "n": "Drag to Shelter",
              "text": "Move 10 feet when an ally within ten feet falls without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "allyDown",
                "provokes": false
              }
            }
          ],
          "14": [
            {
              "n": "Ring of Embers",
              "text": "You and allies within ten feet have advantage on saves against being frightened.",
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
            }
          ]
        }
      },
      {
        "id": "rotblood",
        "name": "Rotblood",
        "blurb": "Your pulse runs ahead of the axe.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Red Blisters",
              "text": "Deal 1d6 extra necrotic damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "necrotic",
                "when": "firstHitEachTurn",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After each invocation lose HP equal to proficiency. This loss bypasses temporary HP."
                  }
                ]
              }
            }
          ],
          "6": [
            {
              "n": "Hungry Marrow",
              "text": "Gain 1d8+lvl temporary HP when you bring a foe to zero HP.",
              "mech": {
                "k": "tempHp",
                "amount": "1d8+lvl",
                "when": "kill",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After each invocation lose HP equal to proficiency. This loss bypasses temporary HP."
                  }
                ]
              }
            }
          ],
          "10": [
            {
              "n": "Black Scab",
              "text": "As a bonus action, invoke this gift for one minute. You resist necrotic damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "necrotic"
                ],
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After each invocation lose HP equal to proficiency. This loss bypasses temporary HP."
                  }
                ]
              }
            }
          ],
          "14": [
            {
              "n": "Burst Vessel",
              "text": "Deal 2d6 extra slashing damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "2d6",
                "type": "slashing",
                "when": "crit",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After each invocation lose HP equal to proficiency. This loss bypasses temporary HP."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After each invocation lose HP equal to proficiency. This loss bypasses temporary HP."
      }
    ]
  },
  "outrider": {
    "id": "outrider",
    "name": "Outrider",
    "chassis": "Rogue",
    "emblem": "🗡",
    "color": "#899384",
    "era": "any",
    "blurb": "Before the wagons enter a village, someone must find out why its dogs have stopped barking.",
    "look": "Mud to the knees, wrapped buckles and a map folded to one bend.",
    "signature": {
      "n": "Mistcloak",
      "text": "After you successfully hide, turn invisible until the start of your next turn or until you attack or cast."
    },
    "rename": {
      "Cunning Action": {
        "n": "Slip Away",
        "text": "Dash, disengage or hide as a bonus action."
      },
      "Cunning Strike": {
        "n": "Cut and Run",
        "text": "Trade ambush dice for poisoning, tripping or withdrawing after the hit."
      },
      "Devious Strikes": {
        "n": "Quiet Work",
        "text": "Trade ambush dice to daze, knock out or obscure a foe’s sight."
      },
      "Elusive": {
        "n": "No Opening",
        "text": "While able to act, attacks against you cannot have advantage."
      },
      "Evasion": {
        "n": "Through the Gap",
        "text": "On Dexterity saves that normally halve damage, take none on success and half on failure unless incapacitated."
      },
      "Expertise": {
        "n": "Veteran Practice",
        "text": "Double proficiency on checks made with your chosen proficient skills."
      },
      "Improved Cunning Strike": {
        "n": "Double Feint",
        "text": "Apply up to two different ambush effects to one hit, paying both dice costs."
      },
      "Reliable Talent": {
        "n": "Practised Hands",
        "text": "On a proficient skill or tool check treat a d20 roll beneath ten as ten."
      },
      "Slippery Mind": {
        "n": "Closed Book",
        "text": "Gain proficiency in Wisdom and Charisma saves."
      },
      "Sneak Attack": {
        "n": "Ambush",
        "text": "Once per turn add your ambush dice to a finesse or ranged hit with advantage, or with an active ally beside the target and no disadvantage."
      },
      "Steady Aim": {
        "n": "Held Breath",
        "text": "Before moving, use a bonus action for advantage on your next attack this turn. Your speed becomes zero for the turn."
      },
      "Stroke of Luck": {
        "n": "Last Coin",
        "text": "Once per short or long rest turn a failed d20 test into a natural twenty."
      },
      "Thieves' Cant": {
        "n": "Road Signs",
        "text": "Read the hidden road dialect and learn one additional language."
      },
      "Uncanny Dodge": {
        "n": "Roll With It",
        "text": "Use a reaction to halve damage from an attack you see hit you."
      },
      "Weapon Mastery": {
        "n": "Arms Drill",
        "text": "Use the mastery properties of your trained weapon types. Retrain a weapon choice at a long rest."
      }
    },
    "paths": [
      {
        "id": "horse-archer",
        "name": "Horse-Archer",
        "blurb": "Even on foot you measure the road in strides of a vanished horse.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Rein Hand",
              "text": "After a ranged weapon attack, move ten feet without provoking. If mounted, the mount makes this move instead.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "afterRangedAttackRiderOrMount",
                "provokes": false
              }
            }
          ],
          "9": [
            {
              "n": "Loose in Passing",
              "text": "Deal 1d4 extra piercing damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d4",
                "type": "piercing",
                "when": "firstHitEachTurn"
              }
            }
          ],
          "13": [
            {
              "n": "Broken Pursuit",
              "text": "Move 20 feet after dashing without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 20,
                "when": "afterDash",
                "provokes": false
              }
            }
          ],
          "17": [
            {
              "n": "Far Hoof",
              "text": "Deal 2d6 extra slashing damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "2d6",
                "type": "slashing",
                "when": "crit"
              }
            }
          ]
        }
      },
      {
        "id": "saboteur",
        "name": "Saboteur",
        "blurb": "An empty doorway is the tool you trust most.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Snare Wire",
              "text": "Spend ten minutes rigging a visible tripline. The first creature to cross must pass a Dexterity save (DC 8 + proficiency + Dexterity) or fall prone.",
              "mech": {
                "k": "text"
              }
            }
          ],
          "9": [
            {
              "n": "Smoke Exit",
              "text": "Move 15 feet after hiding without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 15,
                "when": "afterHide",
                "provokes": false
              }
            }
          ],
          "13": [
            {
              "n": "Cracked Lintel",
              "text": "Deal 1d6 extra thunder damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "thunder",
                "when": "firstHitEachTurn"
              }
            }
          ],
          "17": [
            {
              "n": "Broken Cog",
              "text": "Deal 3d6 extra force damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "3d6",
                "type": "force",
                "when": "crit"
              }
            }
          ]
        }
      },
      {
        "id": "carrier",
        "name": "Carrier",
        "blurb": "Every spore in the satchel knows your footsteps.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Dust Lung",
              "text": "As a bonus action, invoke this gift for one minute. You resist poison damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "poison"
                ],
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your tracks shine for one hour. Checks to follow them have advantage."
                  }
                ]
              }
            }
          ],
          "9": [
            {
              "n": "Burst Satchel",
              "text": "Once per long rest, when you drop to zero HP, release spores. Each enemy within five feet takes 2d6 poison damage.",
              "mech": {
                "k": "burst",
                "radius": 5,
                "dice": "2d6",
                "type": "poison",
                "when": "selfDown",
                "targets": "enemies",
                "uses": "1/longRest",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your tracks shine for one hour. Checks to follow them have advantage."
                  }
                ]
              }
            }
          ],
          "13": [
            {
              "n": "Spore Wake",
              "text": "Deal 1d6 extra necrotic damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "necrotic",
                "when": "firstHitEachTurn",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your tracks shine for one hour. Checks to follow them have advantage."
                  }
                ]
              }
            }
          ],
          "17": [
            {
              "n": "Last Envelope",
              "text": "Gain 1d8+lvl temporary HP when you bring a foe to zero HP.",
              "mech": {
                "k": "tempHp",
                "amount": "1d8+lvl",
                "when": "kill",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your tracks shine for one hour. Checks to follow them have advantage."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After invoking, your tracks shine for one hour. Checks to follow them have advantage."
      }
    ]
  },
  "marksman": {
    "id": "marksman",
    "name": "Marksman",
    "chassis": "Ranger",
    "emblem": "🏹",
    "color": "#889e62",
    "era": "any",
    "blurb": "The road has a hundred distances. You can name them all from the church door.",
    "look": "Weather hood, range knots on a cord and a steady elbow.",
    "signature": {
      "n": "Set Sight",
      "text": "Remain still and use a bonus action to gain advantage on your next ranged attack this turn. Your speed becomes zero for the turn."
    },
    "rename": {
      "Deft Explorer": {
        "n": "Range Book",
        "text": "Double proficiency in one trained skill and learn two languages."
      },
      "Expertise": {
        "n": "Veteran Practice",
        "text": "Double proficiency on checks made with your chosen proficient skills."
      },
      "Extra Attack": {
        "n": "Follow Through",
        "text": "Make two attacks when you take the Attack action on your turn."
      },
      "Favored Enemy": {
        "n": "Called Shot",
        "text": "Always prepare the quarry-marking spell and use its free daily castings for your level."
      },
      "Feral Senses": {
        "n": "Feel the Footfall",
        "text": "Gain blindsight out to thirty feet."
      },
      "Fighting Style": {
        "n": "School of Arms",
        "text": "Gain a fighting style feat for which your training qualifies you."
      },
      "Foe Slayer": {
        "n": "Deep Quarry Mark",
        "text": "Your quarry mark deals a d10 instead of a d6."
      },
      "Nature's Veil": {
        "n": "Grey Mantle",
        "text": "As a bonus action become invisible until your next turn ends. Wisdom modifier uses per long rest, minimum one."
      },
      "Precise Hunter": {
        "n": "Sure Quarry",
        "text": "Gain advantage on attacks against your marked quarry."
      },
      "Relentless Hunter": {
        "n": "Unbroken Sightline",
        "text": "Damage cannot break concentration on your quarry mark."
      },
      "Roving": {
        "n": "Cross Country",
        "text": "Outside heavy armour, add ten feet of speed and gain climb and swim speeds equal to your speed."
      },
      "Spellcasting": {
        "n": "Field Litany",
        "text": "Prepare spells from your calling list and expend a slot of sufficient level to cast a prepared spell. Cantrips need no slot."
      },
      "Tireless": {
        "n": "Sleep in the Saddle",
        "text": "As a Magic action gain 1d8 plus Wisdom temporary HP, Wisdom uses per long rest (minimum one). A short rest removes one exhaustion level."
      },
      "Weapon Mastery": {
        "n": "Arms Drill",
        "text": "Use the mastery properties of your trained weapon types. Retrain a weapon choice at a long rest."
      }
    },
    "paths": [
      {
        "id": "yeoman",
        "name": "Yeoman",
        "blurb": "Your bow was cut where the parish buried its dead.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "First Shaft",
              "text": "Deal 1d4 extra piercing damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d4",
                "type": "piercing",
                "when": "firstHitEachTurn"
              }
            }
          ],
          "7": [
            {
              "n": "Plant the Heel",
              "text": "Roll saves against being prone with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "prone",
                "when": "always"
              }
            }
          ],
          "11": [
            {
              "n": "Arrow Lane",
              "text": "Move 10 feet after an attack without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "afterAttack",
                "provokes": false
              }
            }
          ],
          "15": [
            {
              "n": "Volley Bell",
              "text": "Once per short rest, after a ranged weapon hit, deal 2d6 piercing damage to each enemy within five feet of the target, including the target.",
              "mech": {
                "k": "burst",
                "radius": 5,
                "dice": "2d6",
                "type": "piercing",
                "when": "rangedHitAtTarget",
                "targets": "enemies",
                "uses": "1/shortRest"
              }
            }
          ]
        }
      },
      {
        "id": "long-watch",
        "name": "Long Watch",
        "blurb": "Your eye stays on one window until a candle moves.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Dawn Blind",
              "text": "Move 15 feet after hiding without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 15,
                "when": "afterHide",
                "provokes": false
              }
            }
          ],
          "7": [
            {
              "n": "Patient Draw",
              "text": "Roll saves against being frightened with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "frightened",
                "when": "always"
              }
            }
          ],
          "11": [
            {
              "n": "Last Sighting",
              "text": "Deal 3d6 extra force damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "3d6",
                "type": "force",
                "when": "crit"
              }
            }
          ],
          "15": [
            {
              "n": "Silent Descent",
              "text": "Move 20 feet after dashing without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 20,
                "when": "afterDash",
                "provokes": false
              }
            }
          ]
        }
      },
      {
        "id": "seepsight",
        "name": "Seepsight",
        "blurb": "Your sight follows the threads behind infected eyes.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Thread Reader",
              "text": "Examine a site for a minute. Learn whether the Seep passed through in the last day and which way it left.",
              "mech": {
                "k": "text",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, lose ordinary colour vision until a short rest. Checks relying on colour fail."
                  }
                ]
              }
            }
          ],
          "7": [
            {
              "n": "Black Iris",
              "text": "As a bonus action, invoke this gift for one minute. Roll saves against being charmed with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "charmed",
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, lose ordinary colour vision until a short rest. Checks relying on colour fail."
                  }
                ]
              }
            }
          ],
          "11": [
            {
              "n": "Sever the Strand",
              "text": "Deal 1d8 extra radiant damage on a hit against a Seep creature.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d8",
                "type": "radiant",
                "when": "vsSeep",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, lose ordinary colour vision until a short rest. Checks relying on colour fail."
                  }
                ]
              }
            }
          ],
          "15": [
            {
              "n": "Witness Mark",
              "text": "As a bonus action, invoke this gift for one minute. You and allies within ten feet have advantage on saves against being charmed.",
              "mech": {
                "k": "aura",
                "radius": 10,
                "gives": {
                  "k": "advantage",
                  "on": "save",
                  "vs": "charmed",
                  "when": "always"
                },
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, lose ordinary colour vision until a short rest. Checks relying on colour fail."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After invoking, lose ordinary colour vision until a short rest. Checks relying on colour fail."
      }
    ]
  },
  "warden": {
    "id": "warden",
    "name": "Warden",
    "chassis": "Paladin",
    "emblem": "⚜",
    "color": "#c3a563",
    "era": "medieval",
    "blurb": "You swore before witnesses. The last witness is buried, but the oath still knows your voice.",
    "look": "Plain surcoat over mail, wax seal under the gorget.",
    "signature": {
      "n": "Oath-Strike",
      "text": "Keep the radiant striking spell prepared and cast it once per long rest without spending a slot."
    },
    "rename": {
      "Abjure Foes": {
        "n": "Speak the Sentence",
        "text": "Spend a sacred charge as a Magic action to frighten foes within 60 feet on a failed Wisdom save and restrict their actions."
      },
      "Aura Expansion": {
        "n": "Widen the Circle",
        "text": "Your shelter reaches thirty feet."
      },
      "Aura of Courage": {
        "n": "Circle of Nerve",
        "text": "You and allies inside your shelter are immune to fear."
      },
      "Aura of Protection": {
        "n": "Circle of Shelter",
        "text": "Conscious and able to act, add your Charisma modifier (minimum one) to your saves and allies’ saves within ten feet."
      },
      "Channel Divinity": {
        "n": "Oath Reserve",
        "text": "Spend a use of your sacred reserve to invoke an available rite. A short rest returns one use, a long rest all."
      },
      "Extra Attack": {
        "n": "Follow Through",
        "text": "Make two attacks when you take the Attack action on your turn."
      },
      "Faithful Steed": {
        "n": "Road Companion",
        "text": "Keep the steed-summoning spell prepared and cast it free once per long rest."
      },
      "Fighting Style": {
        "n": "School of Arms",
        "text": "Gain a fighting style feat for which your training qualifies you."
      },
      "Lay on Hands": {
        "n": "Hands of Mercy",
        "text": "Spend HP from a pool of five per level as a bonus action to heal by touch. Five points can remove poison instead."
      },
      "Paladin's Smite": {
        "n": "Oath-Strike",
        "text": "Keep the radiant striking spell prepared and cast it once per long rest without spending a slot."
      },
      "Radiant Strikes": {
        "n": "Bright Iron",
        "text": "Melee weapon and unarmed hits deal an extra 1d8 radiant damage."
      },
      "Restoring Touch": {
        "n": "Lift the Burden",
        "text": "When healing by touch, spend five pool points per condition to lift blindness, charm, deafness, fear, paralysis or stunning."
      },
      "Spellcasting": {
        "n": "Field Litany",
        "text": "Prepare spells from your calling list and expend a slot of sufficient level to cast a prepared spell. Cantrips need no slot."
      },
      "Weapon Mastery": {
        "n": "Arms Drill",
        "text": "Use the mastery properties of your trained weapon types. Retrain a weapon choice at a long rest."
      }
    },
    "paths": [
      {
        "id": "templar",
        "name": "Templar",
        "blurb": "An old key hangs from the crossguard where a jewel once sat.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Pilgrim Guard",
              "text": "Gain 1d6+lvl temporary HP after a rest.",
              "mech": {
                "k": "tempHp",
                "amount": "1d6+lvl",
                "when": "rest"
              }
            }
          ],
          "7": [
            {
              "n": "Processional",
              "text": "You and allies within ten feet have advantage on saves against being frightened.",
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
            }
          ],
          "15": [
            {
              "n": "Consecrate Iron",
              "text": "Deal 1d8 extra radiant damage on a hit against a Seep creature.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d8",
                "type": "radiant",
                "when": "vsSeep"
              }
            }
          ],
          "20": [
            {
              "n": "Keep the Chapel",
              "text": "Gain 1d10+lvl temporary HP as a bonus action.",
              "mech": {
                "k": "tempHp",
                "amount": "1d10+lvl",
                "when": "bonus"
              }
            }
          ]
        }
      },
      {
        "id": "last-bastion",
        "name": "Last Bastion",
        "blurb": "You keep the road open for those who must be carried.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Reach the Fallen",
              "text": "Move 10 feet when an ally within ten feet falls without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "allyDown",
                "provokes": false
              }
            }
          ],
          "7": [
            {
              "n": "Shoulder the Door",
              "text": "When an ally is hit, use your reaction to move ten feet towards them without provoking.",
              "mech": {
                "k": "reaction",
                "trigger": "allyHit",
                "does": {
                  "k": "move",
                  "feet": 10,
                  "provokes": false,
                  "when": "reaction"
                }
              }
            }
          ],
          "15": [
            {
              "n": "Bind in Place",
              "text": "As an action heal a creature within five feet for 1d8+wis HP. Uses equal proficiency per long rest.",
              "mech": {
                "k": "heal",
                "amount": "1d8+wis",
                "range": 5,
                "uses": "pb/longRest"
              }
            }
          ],
          "20": [
            {
              "n": "Homeward Bell",
              "text": "As an action heal a creature within five feet for 2d8+wis HP. Uses equal proficiency per long rest.",
              "mech": {
                "k": "heal",
                "amount": "2d8+wis",
                "range": 5,
                "uses": "pb/longRest"
              }
            }
          ]
        }
      },
      {
        "id": "penitent",
        "name": "Penitent",
        "blurb": "An iron chain holds the rot against your ribs.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Brand the Blight",
              "text": "Deal 1d8 extra radiant damage on a hit against a Seep creature.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d8",
                "type": "radiant",
                "when": "vsSeep",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your speed drops by five feet until your next turn ends."
                  }
                ]
              }
            }
          ],
          "7": [
            {
              "n": "Chain Mantle",
              "text": "As a bonus action, invoke this gift for one minute. You resist necrotic damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "necrotic"
                ],
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your speed drops by five feet until your next turn ends."
                  }
                ]
              }
            }
          ],
          "15": [
            {
              "n": "Unburden",
              "text": "As an action heal a creature within five feet for 2d8+wis HP. Uses equal proficiency per long rest.",
              "mech": {
                "k": "heal",
                "amount": "2d8+wis",
                "range": 5,
                "uses": "pb/longRest",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your speed drops by five feet until your next turn ends."
                  }
                ]
              }
            }
          ],
          "20": [
            {
              "n": "Last Scourge",
              "text": "Deal 3d6 extra force damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "3d6",
                "type": "force",
                "when": "crit",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your speed drops by five feet until your next turn ends."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After invoking, your speed drops by five feet until your next turn ends."
      }
    ]
  },
  "chaplain": {
    "id": "chaplain",
    "name": "Chaplain",
    "chassis": "Cleric",
    "emblem": "✚",
    "color": "#d4ba95",
    "era": "any",
    "blurb": "You learnt the words of burial first. Everything since has been an effort to say them less often.",
    "look": "Linen rolls in oiled pockets, bell cord tied round the wrist.",
    "signature": {
      "n": "Field Rites",
      "text": "Use your prepared healing rites and spell slots to restore the wounded. Wisdom governs your rites."
    },
    "rename": {
      "Blessed Strikes": {
        "n": "Consecrated Edge",
        "text": "Choose extra radiant or necrotic weapon damage once a turn, or add Wisdom to calling cantrip damage."
      },
      "Channel Divinity": {
        "n": "Call the Faithful",
        "text": "Spend a use of your sacred reserve to invoke an available rite. A short rest returns one use, a long rest all."
      },
      "Divine Intervention": {
        "n": "Petition at Dawn",
        "text": "Once per long rest invoke a calling spell of level five or lower that normally takes no reaction, without components or a slot."
      },
      "Divine Order": {
        "n": "Field Commission",
        "text": "Choose training in heavy armour and martial weapons or extra studies and a cantrip."
      },
      "Greater Divine Intervention": {
        "n": "Petition Beyond the Veil",
        "text": "You may petition for a wish. After doing so, wait 2d4 long rests before invoking the petition again."
      },
      "Improved Blessed Strikes": {
        "n": "Double Consecration",
        "text": "Your weapon blessing gains another die, or your damaging cantrips can grant temporary HP equal to twice Wisdom."
      },
      "Sear Undead": {
        "n": "Hot Bellmetal",
        "text": "When you turn the dead, add radiant damage to every creature that fails its save."
      },
      "Spellcasting": {
        "n": "Field Rites",
        "text": "Prepare rites from your calling list. Cast with Wisdom and spend a slot of at least the rite’s level, except for cantrips."
      }
    },
    "paths": [
      {
        "id": "corpsman",
        "name": "Corpsman",
        "blurb": "You carry a door off its hinges for a stretcher.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Close the Wound",
              "text": "Once per proficiency bonus per long rest, use an action to heal a creature within five feet for 1d8 + Wisdom HP. This brings a dying ally back to consciousness.",
              "mech": {
                "k": "heal",
                "amount": "1d8+wis",
                "range": 5,
                "uses": "pb/longRest"
              }
            }
          ],
          "6": [
            {
              "n": "Under Fire",
              "text": "Move 10 feet when an ally within ten feet falls without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "allyDown",
                "provokes": false
              }
            }
          ],
          "17": [
            {
              "n": "Second Dressing",
              "text": "As an action heal a creature within five feet for 2d8+wis HP. Uses equal proficiency per long rest.",
              "mech": {
                "k": "heal",
                "amount": "2d8+wis",
                "range": 5,
                "uses": "pb/longRest"
              }
            }
          ]
        }
      },
      {
        "id": "bell-keeper",
        "name": "Bell-Keeper",
        "blurb": "The dead know which bell summons them and which sends them home.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Passing Toll",
              "text": "Deal 1d6 extra thunder damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "thunder",
                "when": "firstHitEachTurn"
              }
            }
          ],
          "6": [
            {
              "n": "Noon at the Grave",
              "text": "Deal 1d8 extra radiant damage on a hit against a Seep creature.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d8",
                "type": "radiant",
                "when": "vsSeep"
              }
            }
          ],
          "17": [
            {
              "n": "Parish Ring",
              "text": "You and allies within ten feet have advantage on saves against being frightened.",
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
            }
          ]
        }
      },
      {
        "id": "mender-of-the-choir",
        "name": "Mender of the Choir",
        "blurb": "The sutures hum in the voice of the patient.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Living Thread",
              "text": "As an action heal a creature within five feet for 1d8+wis HP. Uses equal proficiency per long rest.",
              "mech": {
                "k": "heal",
                "amount": "1d8+wis",
                "range": 5,
                "uses": "pb/longRest",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "Lose one hit die after each invocation. Without an unspent hit die you cannot invoke."
                  }
                ]
              }
            }
          ],
          "6": [
            {
              "n": "Choir Stitch",
              "text": "As an action heal a creature within five feet for 2d8+wis HP. Uses equal proficiency per long rest.",
              "mech": {
                "k": "heal",
                "amount": "2d8+wis",
                "range": 5,
                "uses": "pb/longRest",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "Lose one hit die after each invocation. Without an unspent hit die you cannot invoke."
                  }
                ]
              }
            }
          ],
          "17": [
            {
              "n": "Mercy Knot",
              "text": "Gain 1d10+lvl temporary HP as a bonus action.",
              "mech": {
                "k": "tempHp",
                "amount": "1d10+lvl",
                "when": "bonus",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "Lose one hit die after each invocation. Without an unspent hit die you cannot invoke."
                  }
                ]
              }
            }
          ]
        },
        "cost": "Lose one hit die after each invocation. Without an unspent hit die you cannot invoke."
      }
    ]
  },
  "archivist": {
    "id": "archivist",
    "name": "Archivist",
    "chassis": "Wizard",
    "emblem": "📜",
    "color": "#a29abf",
    "era": "far-future",
    "blurb": "The sealed vault yielded one working lamp. On the road it asks after people dead for a thousand years.",
    "look": "Amber lens on a belt chain, slate and chalk, shutters black with soot.",
    "signature": {
      "n": "The Ghostlight",
      "text": "During a rest, ask the lantern to recall one thing it has witnessed. The DM recounts what its damaged record kept."
    },
    "rename": {
      "Arcane Recovery": {
        "n": "Rekindle the Wick",
        "text": "Once per long rest after a short rest, recover slots totalling at most half your level rounded up, none above fifth level."
      },
      "Memorize Spell": {
        "n": "Turn the Lens",
        "text": "After a short rest exchange one prepared protocol for another from your book."
      },
      "Ritual Adept": {
        "n": "Margin Notes",
        "text": "Cast ritual-tagged protocols from your book as rituals without preparing them."
      },
      "Scholar": {
        "n": "Index Hand",
        "text": "Double proficiency in a chosen trained academic skill."
      },
      "Signature Spells": {
        "n": "Twin Seals",
        "text": "Keep two third-level protocols prepared. Cast each once at base level without a slot per short or long rest."
      },
      "Spell Mastery": {
        "n": "Worn Grooves",
        "text": "Choose first- and second-level protocols with an action casting time. Keep them prepared and cast at base level without slots."
      },
      "Spellcasting": {
        "n": "Protocols",
        "text": "Record protocols in your book, prepare a selection and cast from that selection using Intelligence and your spell slots."
      }
    },
    "paths": [
      {
        "id": "librarian-of-ashes",
        "name": "Librarian of Ashes",
        "blurb": "A burnt book can still give evidence.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Read the Cinders",
              "text": "Given ten minutes with a burnt page, recover one legible sentence. The DM chooses a sentence that once stood there.",
              "mech": {
                "k": "text"
              }
            }
          ],
          "6": [
            {
              "n": "Ember Sleeve",
              "text": "You resist fire damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "fire"
                ],
                "when": "always"
              }
            }
          ],
          "10": [
            {
              "n": "Witness Lamp",
              "text": "Call one ghostlight for one minute as an action. It has five HP per calling level.",
              "mech": {
                "k": "summon",
                "what": "ghostlight",
                "hp": "5*lvl",
                "lasts": "1min"
              }
            }
          ],
          "14": [
            {
              "n": "Last Catalogue",
              "text": "You and allies within ten feet have advantage on saves against being charmed.",
              "mech": {
                "k": "aura",
                "radius": 10,
                "gives": {
                  "k": "advantage",
                  "on": "save",
                  "vs": "charmed",
                  "when": "always"
                }
              }
            }
          ]
        }
      },
      {
        "id": "strategist",
        "name": "Strategist",
        "blurb": "You keep one piece in your pocket for the move nobody sees.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "First Disposition",
              "text": "Move 15 feet when initiative is rolled without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 15,
                "when": "initiative",
                "provokes": false
              }
            }
          ],
          "6": [
            {
              "n": "Reserve File",
              "text": "When an ally is hit, use your reaction to move ten feet towards them without provoking.",
              "mech": {
                "k": "reaction",
                "trigger": "allyHit",
                "does": {
                  "k": "move",
                  "feet": 10,
                  "provokes": false,
                  "when": "reaction"
                }
              }
            }
          ],
          "10": [
            {
              "n": "Retreat by Files",
              "text": "Move 10 feet after an attack without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "afterAttack",
                "provokes": false
              }
            }
          ],
          "14": [
            {
              "n": "Rally Square",
              "text": "You and allies within ten feet have advantage on saves against being frightened.",
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
            }
          ]
        }
      },
      {
        "id": "whispered-archive",
        "name": "Whispered Archive",
        "blurb": "Sometimes the lamp completes a sentence you have never read.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Borrowed Page",
              "text": "Given ten minutes with a burnt page, recover one legible sentence. The DM chooses a sentence that once stood there.",
              "mech": {
                "k": "text",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, the Chorus learns the last truthful answer you received from your lamp."
                  }
                ]
              }
            }
          ],
          "6": [
            {
              "n": "Index Ghost",
              "text": "Call one ghostlight for one minute as an action. It has five HP per calling level.",
              "mech": {
                "k": "summon",
                "what": "ghostlight",
                "hp": "5*lvl",
                "lasts": "1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, the Chorus learns the last truthful answer you received from your lamp."
                  }
                ]
              }
            }
          ],
          "10": [
            {
              "n": "Closed Stacks",
              "text": "As a bonus action, invoke this gift for one minute. Roll saves against being charmed with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "charmed",
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, the Chorus learns the last truthful answer you received from your lamp."
                  }
                ]
              }
            }
          ],
          "14": [
            {
              "n": "Last Annotation",
              "text": "Deal 1d6 extra necrotic damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "necrotic",
                "when": "firstHitEachTurn",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, the Chorus learns the last truthful answer you received from your lamp."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After invoking, the Chorus learns the last truthful answer you received from your lamp."
      }
    ]
  },
  "relicborn": {
    "id": "relicborn",
    "name": "Relicborn",
    "chassis": "Sorcerer",
    "emblem": "✦",
    "color": "#72bac1",
    "era": "far-future",
    "blurb": "An old shard woke beneath your ribs when the bells rang. The First Builders left no instructions.",
    "look": "Light leaks through seams in a heavy coat; one glove is lined with lead.",
    "signature": {
      "n": "Shardfire",
      "text": "As a bonus action wake the shard for a minute: +1 spell save DC and advantage on calling spell attacks. Twice per long rest."
    },
    "rename": {
      "Arcane Apotheosis": {
        "n": "Unbroken Lattice",
        "text": "While the shard is awake one alteration on each of your turns costs no points."
      },
      "Font of Magic": {
        "n": "Shard Reserve",
        "text": "Spend shard points to create slots or consume slots to regain points, within your level’s limits."
      },
      "Innate Sorcery": {
        "n": "Shardfire",
        "text": "As a bonus action wake the shard for a minute: +1 spell save DC and advantage on calling spell attacks. Twice per long rest."
      },
      "Metamagic": {
        "n": "Refract",
        "text": "Spend points on learned alterations when casting a spell, obeying the chosen alteration’s limits."
      },
      "Sorcerous Restoration": {
        "n": "Warm the Shard",
        "text": "Once per long rest, recover points equal to half your level (round down) on finishing a short rest."
      },
      "Sorcery Incarnate": {
        "n": "Double Refraction",
        "text": "Spend two points to wake an empty shard. While awake you can use two alterations on one spell."
      },
      "Spellcasting": {
        "n": "Shard Geometry",
        "text": "Prepare spells from your calling list and expend a slot of sufficient level to cast a prepared spell. Cantrips need no slot."
      }
    },
    "paths": [
      {
        "id": "lattice",
        "name": "Lattice",
        "blurb": "The shard remembers the shape of a bridge.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Span of Glass",
              "text": "As an action shape a ten-foot span of solid light between two supports. It holds one creature at a time for one minute, once per short rest.",
              "mech": {
                "k": "text"
              }
            }
          ],
          "6": [
            {
              "n": "Mirror Edge",
              "text": "Deal 3d6 extra force damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "3d6",
                "type": "force",
                "when": "crit"
              }
            }
          ],
          "14": [
            {
              "n": "Lattice Skin",
              "text": "Gain 1d6+lvl temporary HP after a rest.",
              "mech": {
                "k": "tempHp",
                "amount": "1d6+lvl",
                "when": "rest"
              }
            }
          ],
          "18": [
            {
              "n": "Walking Prism",
              "text": "Call one ghostlight for one minute as an action. It has five HP per calling level.",
              "mech": {
                "k": "summon",
                "what": "ghostlight",
                "hp": "5*lvl",
                "lasts": "1min"
              }
            }
          ]
        }
      },
      {
        "id": "keyed",
        "name": "Keyed",
        "blurb": "Dead machinery stirs at the sound of your breath.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Wake the Lock",
              "text": "Study a sealed relic for a minute. Learn which piece once supplied its power and whether that piece is still present.",
              "mech": {
                "k": "text"
              }
            }
          ],
          "6": [
            {
              "n": "Ground Wire",
              "text": "You resist fire damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "fire"
                ],
                "when": "always"
              }
            }
          ],
          "14": [
            {
              "n": "Keyway Step",
              "text": "Move 15 feet after hiding without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 15,
                "when": "afterHide",
                "provokes": false
              }
            }
          ],
          "18": [
            {
              "n": "Turn the Engine",
              "text": "Deal 1d6 extra thunder damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "thunder",
                "when": "firstHitEachTurn"
              }
            }
          ]
        }
      },
      {
        "id": "fused",
        "name": "Fused",
        "blurb": "Two lights fight under the skin and neither casts a shadow.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Split Filament",
              "text": "Deal 1d6 extra necrotic damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "necrotic",
                "when": "firstHitEachTurn",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, take one force damage per calling level. Resistance cannot reduce it."
                  }
                ]
              }
            }
          ],
          "6": [
            {
              "n": "Hot Socket",
              "text": "As a bonus action, invoke this gift for one minute. You resist fire damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "fire"
                ],
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, take one force damage per calling level. Resistance cannot reduce it."
                  }
                ]
              }
            }
          ],
          "14": [
            {
              "n": "Broken Prism",
              "text": "Deal 3d6 extra force damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "3d6",
                "type": "force",
                "when": "crit",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, take one force damage per calling level. Resistance cannot reduce it."
                  }
                ]
              }
            }
          ],
          "18": [
            {
              "n": "Second Skeleton",
              "text": "Gain 1d10+lvl temporary HP as a bonus action.",
              "mech": {
                "k": "tempHp",
                "amount": "1d10+lvl",
                "when": "bonus",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, take one force damage per calling level. Resistance cannot reduce it."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After invoking, take one force damage per calling level. Resistance cannot reduce it."
      }
    ]
  },
  "seepbound": {
    "id": "seepbound",
    "name": "Seepbound",
    "chassis": "Warlock",
    "emblem": "☣",
    "color": "#88934e",
    "era": "barovian",
    "blurb": "You made terms with the Chorus so someone else could go free. It kept a copy of the bargain in your bones.",
    "look": "Black wax beneath the nails, reed veil, a contract folded into a sleeve.",
    "signature": {
      "n": "The Pact",
      "text": "Cast your prepared gifts using pact slots. Spent slots return after a short or long rest."
    },
    "rename": {
      "Contact Patron": {
        "n": "Audience Below",
        "text": "Keep the other-plane contact spell prepared. Cast it free once per long rest to reach the Chorus and automatically pass its save."
      },
      "Eldritch Invocations": {
        "n": "Clauses in Bone",
        "text": "Choose enduring gifts from the Chorus, respecting each gift’s requirements."
      },
      "Eldritch Master": {
        "n": "Final Settlement",
        "text": "Your one-minute rite now restores every pact slot."
      },
      "Magical Cunning": {
        "n": "Call in a Debt",
        "text": "After a one-minute rite recover up to half your pact slots, rounded up. Once per long rest."
      },
      "Mystic Arcanum (level 6 spell)": {
        "n": "Article 6",
        "text": "Choose one level 6 pact gift. Cast it once per long rest without spending a slot."
      },
      "Mystic Arcanum (level 7 spell)": {
        "n": "Article 7",
        "text": "Choose one level 7 pact gift. Cast it once per long rest without spending a slot."
      },
      "Mystic Arcanum (level 8 spell)": {
        "n": "Article 8",
        "text": "Choose one level 8 pact gift. Cast it once per long rest without spending a slot."
      },
      "Mystic Arcanum (level 9 spell)": {
        "n": "Article 9",
        "text": "Choose one level 9 pact gift. Cast it once per long rest without spending a slot."
      },
      "Pact Magic": {
        "n": "The Pact",
        "text": "Cast your prepared gifts using pact slots. Spent slots return after a short or long rest."
      }
    },
    "paths": [
      {
        "id": "voice-of-the-chorus",
        "name": "Voice of the Chorus",
        "blurb": "The sick turn to listen before you speak.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Shared Tongue",
              "text": "Address an infected creature through the Chorus. It understands one sentence you speak, even without a shared language.",
              "mech": {
                "k": "text"
              }
            }
          ],
          "6": [
            {
              "n": "Choir Marshal",
              "text": "Roll saves against being charmed with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "charmed",
                "when": "always"
              }
            }
          ],
          "10": [
            {
              "n": "Borrowed Throat",
              "text": "You and allies within ten feet have advantage on saves against being charmed.",
              "mech": {
                "k": "aura",
                "radius": 10,
                "gives": {
                  "k": "advantage",
                  "on": "save",
                  "vs": "charmed",
                  "when": "always"
                }
              }
            }
          ],
          "14": [
            {
              "n": "Order of Silence",
              "text": "Roll saves against being frightened with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "frightened",
                "when": "always"
              }
            }
          ]
        }
      },
      {
        "id": "the-swarm",
        "name": "The Swarm",
        "blurb": "Little shapes return each night with pieces of your dreams.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Small Envoy",
              "text": "As an action, call one spore-form for a minute. Its HP is five times your level. Calling another dismisses the first.",
              "mech": {
                "k": "summon",
                "what": "spore-form",
                "hp": "5*lvl",
                "lasts": "1min"
              }
            }
          ],
          "6": [
            {
              "n": "Husk Coat",
              "text": "Gain 1d6+lvl temporary HP after a rest.",
              "mech": {
                "k": "tempHp",
                "amount": "1d6+lvl",
                "when": "rest"
              }
            }
          ],
          "10": [
            {
              "n": "Scavenger Tithe",
              "text": "Gain 1d8+lvl temporary HP when you bring a foe to zero HP.",
              "mech": {
                "k": "tempHp",
                "amount": "1d8+lvl",
                "when": "kill"
              }
            }
          ],
          "14": [
            {
              "n": "Scuttle",
              "text": "Move 10 feet after an attack without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "afterAttack",
                "provokes": false
              }
            }
          ]
        }
      },
      {
        "id": "the-bloom",
        "name": "The Bloom",
        "blurb": "Green flowers open where your shadow falls.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "First Corolla",
              "text": "Deal 1d6 extra necrotic damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "necrotic",
                "when": "firstHitEachTurn",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, flowers betray your position. You cannot hide until your next turn ends."
                  }
                ]
              }
            }
          ],
          "6": [
            {
              "n": "Nurse Bed",
              "text": "Call one spore-form for one minute as an action. It has five HP per calling level.",
              "mech": {
                "k": "summon",
                "what": "spore-form",
                "hp": "5*lvl",
                "lasts": "1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, flowers betray your position. You cannot hide until your next turn ends."
                  }
                ]
              }
            }
          ],
          "10": [
            {
              "n": "Black Nectar",
              "text": "As an action heal a creature within five feet for 2d8+wis HP. Uses equal proficiency per long rest.",
              "mech": {
                "k": "heal",
                "amount": "2d8+wis",
                "range": 5,
                "uses": "pb/longRest",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, flowers betray your position. You cannot hide until your next turn ends."
                  }
                ]
              }
            }
          ],
          "14": [
            {
              "n": "Garden at Night",
              "text": "As a bonus action, invoke this gift for one minute. You resist necrotic damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "necrotic"
                ],
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, flowers betray your position. You cannot hide until your next turn ends."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After invoking, flowers betray your position. You cannot hide until your next turn ends."
      }
    ]
  },
  "herald": {
    "id": "herald",
    "name": "Herald",
    "chassis": "Bard",
    "emblem": "🥁",
    "color": "#bb716a",
    "era": "any",
    "blurb": "Your company walked out of the fog one drum short. At dusk you hear the missing drum keeping time.",
    "look": "Shoulder drum, patched pennant and two sticks cut from the same tree.",
    "signature": {
      "n": "Cadence",
      "text": "As a bonus action give a nearby ally who hears or sees you a die to add after failing a d20 test. It lasts one hour."
    },
    "rename": {
      "Bardic Inspiration": {
        "n": "Cadence",
        "text": "As a bonus action give a nearby ally who hears or sees you a die to add after failing a d20 test. It lasts one hour."
      },
      "Countercharm": {
        "n": "Break the Measure",
        "text": "When you or an ally within 30 feet fails a save against charm or fear, use a reaction to allow a reroll with advantage."
      },
      "Expertise": {
        "n": "Veteran Practice",
        "text": "Double proficiency on checks made with your chosen proficient skills."
      },
      "Font of Inspiration": {
        "n": "Second Measure",
        "text": "Recover cadence dice after a short or long rest. You may exchange a spell slot for one use."
      },
      "Jack of All Trades": {
        "n": "Odd Jobs",
        "text": "Add half proficiency, rounded down, to skill checks that otherwise lack proficiency."
      },
      "Magical Secrets": {
        "n": "Borrowed Anthems",
        "text": "From level 10, include priestly, woodland and scholarly spells among the spells you learn."
      },
      "Spellcasting": {
        "n": "Signal Book",
        "text": "Prepare spells from your calling list and expend a slot of sufficient level to cast a prepared spell. Cantrips need no slot."
      },
      "Superior Inspiration": {
        "n": "Keep the Beat",
        "text": "On initiative, replenish your cadence up to two uses if you have fewer."
      },
      "Words of Creation": {
        "n": "Last Refrain",
        "text": "Keep the words of killing and healing prepared. When casting either, you may also target a second creature within ten feet of the first."
      }
    },
    "paths": [
      {
        "id": "drummer",
        "name": "Drummer",
        "blurb": "Your drum has a quiet face for funerals and a loud one for the living.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Double Time",
              "text": "Move 15 feet when initiative is rolled without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 15,
                "when": "initiative",
                "provokes": false
              }
            }
          ],
          "6": [
            {
              "n": "Marching Stroke",
              "text": "Move 10 feet after an attack without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "afterAttack",
                "provokes": false
              }
            }
          ],
          "14": [
            {
              "n": "Groundbeat",
              "text": "Deal 1d6 extra thunder damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "thunder",
                "when": "firstHitEachTurn"
              }
            }
          ]
        }
      },
      {
        "id": "standard-bearer",
        "name": "Standard-Bearer",
        "blurb": "A torn flag still tells the lost where to stand.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Rally Cloth",
              "text": "Gain 1d6+lvl temporary HP after a rest.",
              "mech": {
                "k": "tempHp",
                "amount": "1d6+lvl",
                "when": "rest"
              }
            }
          ],
          "6": [
            {
              "n": "Colour Guard",
              "text": "When an ally is hit, use your reaction to move ten feet towards them without provoking.",
              "mech": {
                "k": "reaction",
                "trigger": "allyHit",
                "does": {
                  "k": "move",
                  "feet": 10,
                  "provokes": false,
                  "when": "reaction"
                }
              }
            }
          ],
          "14": [
            {
              "n": "Silk Square",
              "text": "You and allies within ten feet have advantage on saves against being frightened.",
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
            }
          ]
        }
      },
      {
        "id": "hollow-voice",
        "name": "Hollow Voice",
        "blurb": "The echo keeps singing after your mouth is shut.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Dead Note",
              "text": "As a bonus action, invoke this gift for one minute. Roll saves against being frightened with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "frightened",
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After each invocation, speech above a whisper is impossible until the end of your next turn."
                  }
                ]
              }
            }
          ],
          "6": [
            {
              "n": "Rot Canticle",
              "text": "Deal 1d6 extra necrotic damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "necrotic",
                "when": "firstHitEachTurn",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After each invocation, speech above a whisper is impossible until the end of your next turn."
                  }
                ]
              }
            }
          ],
          "14": [
            {
              "n": "Empty Choir",
              "text": "As a bonus action, invoke this gift for one minute. You and allies within ten feet have advantage on saves against being charmed.",
              "mech": {
                "k": "aura",
                "radius": 10,
                "gives": {
                  "k": "advantage",
                  "on": "save",
                  "vs": "charmed",
                  "when": "always"
                },
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After each invocation, speech above a whisper is impossible until the end of your next turn."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After each invocation, speech above a whisper is impossible until the end of your next turn."
      }
    ]
  },
  "mistwalker": {
    "id": "mistwalker",
    "name": "Mistwalker",
    "chassis": "Druid",
    "emblem": "🌫",
    "color": "#87a69b",
    "era": "barovian",
    "blurb": "In the valley even the footpaths migrate. You learnt to follow them by watching the wolves.",
    "look": "Wet wool, bark clasps and paws embroidered inside the hem.",
    "signature": {
      "n": "Mistshape",
      "text": "As a bonus action assume a known beast form allowed at your level, retaining your own HP and gaining temporary HP equal to your level."
    },
    "rename": {
      "Archdruid": {
        "n": "Keeper of the Last Wood",
        "text": "Recover a shape use on initiative if empty, exchange shape uses for a spell slot once per long rest, and age slowly."
      },
      "Beast Spells": {
        "n": "Words Through Fur",
        "text": "Cast in beast form except spells with costly or consumed material components."
      },
      "Druidic": {
        "n": "Fog Signs",
        "text": "Read and leave the woodfolk’s hidden signs. Keep the spell for speaking with animals prepared."
      },
      "Elemental Fury": {
        "n": "Briar Temper",
        "text": "Choose an elemental boost to one weapon or beast hit per turn, or add Wisdom to calling cantrip damage."
      },
      "Improved Elemental Fury": {
        "n": "Deepwood Temper",
        "text": "Your elemental blow gains a die, or your ranged calling cantrips gain 300 feet of reach."
      },
      "Primal Order": {
        "n": "Woodland Charge",
        "text": "Choose martial and medium armour training, or an extra cantrip and woodland learning."
      },
      "Spellcasting": {
        "n": "Hedge Words",
        "text": "Prepare spells from your calling list and expend a slot of sufficient level to cast a prepared spell. Cantrips need no slot."
      },
      "Wild Companion": {
        "n": "Fog Familiar",
        "text": "Spend a shape use or a spell slot to call a fey familiar without material components. It leaves at your next long rest."
      },
      "Wild Resurgence": {
        "n": "Borrowed Hide",
        "text": "When empty, exchange a spell slot for a shape use. Once per long rest trade a shape use for a first-level slot."
      },
      "Wild Shape": {
        "n": "Mistshape",
        "text": "As a bonus action assume a known beast form allowed at your level, retaining your own HP and gaining temporary HP equal to your level."
      }
    },
    "paths": [
      {
        "id": "wolfkin",
        "name": "Wolfkin",
        "blurb": "You count your pack by scent when the fog takes their faces.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Answering Howl",
              "text": "Call one wolf for one minute as an action. It has five HP per calling level.",
              "mech": {
                "k": "summon",
                "what": "wolf",
                "hp": "5*lvl",
                "lasts": "1min"
              }
            }
          ],
          "6": [
            {
              "n": "Flank Path",
              "text": "Move 10 feet after an attack without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "afterAttack",
                "provokes": false
              }
            }
          ],
          "10": [
            {
              "n": "Rime Coat",
              "text": "You resist cold damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "cold"
                ],
                "when": "always"
              }
            }
          ],
          "14": [
            {
              "n": "Pack Circle",
              "text": "You and allies within ten feet have advantage on saves against being frightened.",
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
            }
          ]
        }
      },
      {
        "id": "grove-keeper",
        "name": "Grove-Keeper",
        "blurb": "You know which trees have roots in the crypt.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Root Stance",
              "text": "Roll saves against being prone with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "prone",
                "when": "always"
              }
            }
          ],
          "6": [
            {
              "n": "Sap Dressing",
              "text": "As an action heal a creature within five feet for 1d8+wis HP. Uses equal proficiency per long rest.",
              "mech": {
                "k": "heal",
                "amount": "1d8+wis",
                "range": 5,
                "uses": "pb/longRest"
              }
            }
          ],
          "10": [
            {
              "n": "Bark Shelter",
              "text": "Gain 1d6+lvl temporary HP after a rest.",
              "mech": {
                "k": "tempHp",
                "amount": "1d6+lvl",
                "when": "rest"
              }
            }
          ],
          "14": [
            {
              "n": "Green Vigil",
              "text": "You and allies within ten feet have advantage on saves against being charmed.",
              "mech": {
                "k": "aura",
                "radius": 10,
                "gives": {
                  "k": "advantage",
                  "on": "save",
                  "vs": "charmed",
                  "when": "always"
                }
              }
            }
          ]
        }
      },
      {
        "id": "mycelial",
        "name": "Mycelial",
        "blurb": "You feel the weight of feet through a hundred buried threads.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Root Listener",
              "text": "Examine a site for a minute. Learn whether the Seep passed through in the last day and which way it left.",
              "mech": {
                "k": "text",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your feet take root. Your speed is zero until your next turn starts."
                  }
                ]
              }
            }
          ],
          "6": [
            {
              "n": "Spore Runner",
              "text": "Call one spore-form for one minute as an action. It has five HP per calling level.",
              "mech": {
                "k": "summon",
                "what": "spore-form",
                "hp": "5*lvl",
                "lasts": "1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your feet take root. Your speed is zero until your next turn starts."
                  }
                ]
              }
            }
          ],
          "10": [
            {
              "n": "Mould Veil",
              "text": "As a bonus action, invoke this gift for one minute. You resist poison damage.",
              "mech": {
                "k": "resist",
                "types": [
                  "poison"
                ],
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your feet take root. Your speed is zero until your next turn starts."
                  }
                ]
              }
            }
          ],
          "14": [
            {
              "n": "Dark Fruiting",
              "text": "Gain 1d8+lvl temporary HP when you bring a foe to zero HP.",
              "mech": {
                "k": "tempHp",
                "amount": "1d8+lvl",
                "when": "kill",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, your feet take root. Your speed is zero until your next turn starts."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After invoking, your feet take root. Your speed is zero until your next turn starts."
      }
    ]
  },
  "pankratiast": {
    "id": "pankratiast",
    "name": "Pankratiast",
    "chassis": "Monk",
    "emblem": "👊",
    "color": "#bd8862",
    "era": "ancient",
    "blurb": "The sand of the Games gave way to grave soil under your heels. Here the bell seldom ends a bout.",
    "look": "Linen hand wraps, broken laurel pin and a wrestler’s low stance.",
    "signature": {
      "n": "Breath",
      "text": "Spend breath points on extra strikes, defence or footwork. Recover the pool on a short or long rest."
    },
    "rename": {
      "Acrobatic Movement": {
        "n": "Wall Runner",
        "text": "Travel on vertical surfaces and liquid on your turn without falling during that movement."
      },
      "Body and Mind": {
        "n": "Laurel of Iron",
        "text": "Raise Dexterity and Wisdom by four each, up to 25."
      },
      "Deflect Attacks": {
        "n": "Turn the Wrist",
        "text": "Use your reaction to reduce physical attack damage by 1d10 plus Dexterity and level. If reduced to zero you may spend breath to redirect it."
      },
      "Deflect Energy": {
        "n": "Catch the Spark",
        "text": "Your deflection now works against attacks of every damage type."
      },
      "Disciplined Survivor": {
        "n": "Iron Discipline",
        "text": "Gain proficiency in all saves. Spend a breath to reroll a failed save and use the new roll."
      },
      "Empowered Strikes": {
        "n": "Stone Knuckles",
        "text": "Each unarmed hit can deal force damage instead."
      },
      "Evasion": {
        "n": "Through the Gap",
        "text": "On Dexterity saves that normally halve damage, take none on success and half on failure unless incapacitated."
      },
      "Extra Attack": {
        "n": "Follow Through",
        "text": "Make two attacks when you take the Attack action on your turn."
      },
      "Heightened Focus": {
        "n": "Deep Reserve",
        "text": "Improve your breath techniques: an extra flurry strike, temporary HP on defence, and carry a companion during your wind step."
      },
      "Martial Arts": {
        "n": "Sand Ring",
        "text": "With no armour or shield, use Dexterity and your training die for unarmed strikes and trained weapons. You can strike unarmed as a bonus action."
      },
      "Monk's Focus": {
        "n": "Breath",
        "text": "Spend breath points on extra strikes, defence or footwork. Recover the pool on a short or long rest."
      },
      "Perfect Focus": {
        "n": "Four Slow Breaths",
        "text": "On initiative, if below four breath points and not using your opening recovery, return to four."
      },
      "Self-Restoration": {
        "n": "Clear the Blood",
        "text": "At the end of your turn remove charm, fear or poison from yourself. Lack of food and drink no longer gives exhaustion."
      },
      "Slow Fall": {
        "n": "Roll the Landing",
        "text": "Use a reaction to reduce falling damage by five times your level."
      },
      "Stunning Strike": {
        "n": "Empty Lungs",
        "text": "Once on your turn, spend a breath on a hit to force a Constitution save. Failure stuns until your next turn starts."
      },
      "Superior Defense": {
        "n": "Brace for the Bell",
        "text": "At the start of your turn spend three breath for a minute of resistance to all damage except force, ending early if incapacitated."
      },
      "Unarmored Defense": {
        "n": "Sand Guard",
        "text": "Without armour or shield, your AC is 10 plus your Dexterity and Wisdom modifiers."
      },
      "Unarmored Movement": {
        "n": "Barefoot Mile",
        "text": "Your speed increases with level while wearing neither armour nor shield."
      },
      "Uncanny Metabolism": {
        "n": "Opening Breath",
        "text": "Once per long rest on initiative regain every breath point and heal your level plus a training die."
      }
    },
    "paths": [
      {
        "id": "olympian",
        "name": "Olympian",
        "blurb": "The judge is gone. The chalk marks remain.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Starting Stone",
              "text": "Move 15 feet when initiative is rolled without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 15,
                "when": "initiative",
                "provokes": false
              }
            }
          ],
          "6": [
            {
              "n": "Sand Throw",
              "text": "Deal 1d6 extra thunder damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "thunder",
                "when": "firstHitEachTurn"
              }
            }
          ],
          "11": [
            {
              "n": "Long Course",
              "text": "Move 20 feet after dashing without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 20,
                "when": "afterDash",
                "provokes": false
              }
            }
          ],
          "17": [
            {
              "n": "Laurel Stand",
              "text": "Roll saves against being prone with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "prone",
                "when": "always"
              }
            }
          ]
        }
      },
      {
        "id": "pit-fighter",
        "name": "Pit-Fighter",
        "blurb": "There were no rules below the arena stairs.",
        "seep": false,
        "features": {
          "3": [
            {
              "n": "Inside Elbow",
              "text": "Deal 1d4 extra piercing damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d4",
                "type": "piercing",
                "when": "firstHitEachTurn"
              }
            }
          ],
          "6": [
            {
              "n": "Low Step",
              "text": "Move 10 feet after an attack without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 10,
                "when": "afterAttack",
                "provokes": false
              }
            }
          ],
          "11": [
            {
              "n": "Iron Chin",
              "text": "Gain 1d6+lvl temporary HP after a rest.",
              "mech": {
                "k": "tempHp",
                "amount": "1d6+lvl",
                "when": "rest"
              }
            }
          ],
          "17": [
            {
              "n": "Crowd Silencer",
              "text": "Deal 2d6 extra slashing damage on a critical hit.",
              "mech": {
                "k": "extraDamage",
                "dice": "2d6",
                "type": "slashing",
                "when": "crit"
              }
            }
          ]
        }
      },
      {
        "id": "twisted",
        "name": "Twisted",
        "blurb": "The arm that brings you back to guard has one joint too many.",
        "seep": true,
        "features": {
          "3": [
            {
              "n": "Double Joint",
              "text": "As a bonus action, invoke this gift for one minute. Roll saves against being grappled with advantage.",
              "mech": {
                "k": "advantage",
                "on": "save",
                "vs": "grappled",
                "when": "invoked1min",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, one hand curls shut around nothing. It cannot hold equipment until your next turn starts."
                  }
                ]
              }
            }
          ],
          "6": [
            {
              "n": "Reaching Tendon",
              "text": "When an ally is hit, use your reaction to move ten feet towards them without provoking.",
              "mech": {
                "k": "reaction",
                "trigger": "allyHit",
                "does": {
                  "k": "move",
                  "feet": 10,
                  "provokes": false,
                  "when": "reaction"
                },
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, one hand curls shut around nothing. It cannot hold equipment until your next turn starts."
                  }
                ]
              }
            }
          ],
          "11": [
            {
              "n": "Coil Spring",
              "text": "Move 20 feet after dashing without provoking opportunity attacks.",
              "mech": {
                "k": "move",
                "feet": 20,
                "when": "afterDash",
                "provokes": false,
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, one hand curls shut around nothing. It cannot hold equipment until your next turn starts."
                  }
                ]
              }
            }
          ],
          "17": [
            {
              "n": "Black Knuckle",
              "text": "Deal 1d6 extra necrotic damage on your first hit each turn.",
              "mech": {
                "k": "extraDamage",
                "dice": "1d6",
                "type": "necrotic",
                "when": "firstHitEachTurn",
                "also": [
                  {
                    "k": "seepCost",
                    "what": "After invoking, one hand curls shut around nothing. It cannot hold equipment until your next turn starts."
                  }
                ]
              }
            }
          ]
        },
        "cost": "After invoking, one hand curls shut around nothing. It cannot hold equipment until your next turn starts."
      }
    ]
  }
};
