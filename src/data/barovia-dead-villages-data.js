/* Barovia VI: Original Dead Villages visual asset catalogue.
 * 1 square = 5 feet = 1 Three.js world unit. Front door faces +Z.
 * These are render skins for existing layout.buildings, not collision meshes or world state.
 */
export const VILLAGE_STAGES = Object.freeze(['inhabited','abandoned','infested']);
export const VILLAGE_ARCHETYPES = Object.freeze([
  {
    "id": "svalich_cottage",
    "title": "Svalich Cottage",
    "footprint": [
      4,
      4
    ],
    "states": {
      "inhabited": "svalich_cottage_inhabited.glb",
      "abandoned": "svalich_cottage_abandoned.glb",
      "infested": "svalich_cottage_infested.glb"
    },
    "read": [
      "A line of lit candles in the windows.",
      "There is no chimney smoke.",
      "The moss reaches for a knock at the door."
    ]
  },
  {
    "id": "peat_hut",
    "title": "Peat-Cutter Hut",
    "footprint": [
      3,
      3
    ],
    "states": {
      "inhabited": "peat_hut_inhabited.glb",
      "abandoned": "peat_hut_abandoned.glb",
      "infested": "peat_hut_infested.glb"
    },
    "read": [
      "A family has left muddy boots by the door.",
      "A bundle hangs where a child once slept.",
      "Soft lights pulse beneath the roof straw."
    ]
  },
  {
    "id": "timber_longhouse",
    "title": "Timber Longhouse",
    "footprint": [
      6,
      4
    ],
    "states": {
      "inhabited": "timber_longhouse_inhabited.glb",
      "abandoned": "timber_longhouse_abandoned.glb",
      "infested": "timber_longhouse_infested.glb"
    },
    "read": [
      "A pot simmers for the missing woodcutters.",
      "Knives are driven into the threshold.",
      "Ribs of wood push through the shingles."
    ]
  },
  {
    "id": "gallows_watch",
    "title": "Palisade Watch House",
    "footprint": [
      3,
      3
    ],
    "states": {
      "inhabited": "gallows_watch_inhabited.glb",
      "abandoned": "gallows_watch_abandoned.glb",
      "infested": "gallows_watch_infested.glb"
    },
    "read": [
      "A watcher signals from the platform.",
      "The watch bell has a rope but no clapper.",
      "Something watches from inside the empty bell."
    ]
  },
  {
    "id": "morning_chapel",
    "title": "Morning Chapel",
    "footprint": [
      5,
      4
    ],
    "states": {
      "inhabited": "morning_chapel_inhabited.glb",
      "abandoned": "morning_chapel_abandoned.glb",
      "infested": "morning_chapel_infested.glb"
    },
    "read": [
      "Warm candles cling to the altar glass.",
      "A bell lies in pieces beneath the belfry.",
      "Roots wind through the windows like fingers."
    ]
  },
  {
    "id": "last_candle_inn",
    "title": "Last Candle Inn",
    "footprint": [
      6,
      5
    ],
    "states": {
      "inhabited": "last_candle_inn_inhabited.glb",
      "abandoned": "last_candle_inn_abandoned.glb",
      "infested": "last_candle_inn_infested.glb"
    },
    "read": [
      "A soft song drifts through the shutters.",
      "Chairs stand stacked against the doors.",
      "The windows glow a sickly green after dusk."
    ]
  },
  {
    "id": "mourners_ossuary",
    "title": "Mourner’s Ossuary",
    "footprint": [
      4,
      4
    ],
    "states": {
      "inhabited": "mourners_ossuary_inhabited.glb",
      "abandoned": "mourners_ossuary_abandoned.glb",
      "infested": "mourners_ossuary_infested.glb"
    },
    "read": [
      "Fresh flowers lie at the stone threshold.",
      "Every painted name is scraped away.",
      "Bone-colored blooms climb the lintel."
    ]
  },
  {
    "id": "river_granary",
    "title": "River Granary",
    "footprint": [
      4,
      4
    ],
    "states": {
      "inhabited": "river_granary_inhabited.glb",
      "abandoned": "river_granary_abandoned.glb",
      "infested": "river_granary_infested.glb"
    },
    "read": [
      "Fresh flour dust coats the landing.",
      "Grain leaks through split boards.",
      "Each sack has sprouted pale tendrils."
    ]
  },
  {
    "id": "market_stallhouse",
    "title": "Covered Market Hall",
    "footprint": [
      5,
      4
    ],
    "states": {
      "inhabited": "market_stallhouse_inhabited.glb",
      "abandoned": "market_stallhouse_abandoned.glb",
      "infested": "market_stallhouse_infested.glb"
    },
    "read": [
      "Stalls offer bread and a brass scale.",
      "A sale notice flaps where no merchant stands.",
      "Spore sacs sway beneath the canvas awning."
    ]
  },
  {
    "id": "bell_schoolhouse",
    "title": "Bell Schoolhouse",
    "footprint": [
      5,
      4
    ],
    "states": {
      "inhabited": "bell_schoolhouse_inhabited.glb",
      "abandoned": "bell_schoolhouse_abandoned.glb",
      "infested": "bell_schoolhouse_infested.glb"
    },
    "read": [
      "A slate marks today’s lessons.",
      "The students’ desks face the wall.",
      "Writing appears across the shuttered windows."
    ]
  },
  {
    "id": "charcoal_workshop",
    "title": "Charcoal Workshop",
    "footprint": [
      5,
      4
    ],
    "states": {
      "inhabited": "charcoal_workshop_inhabited.glb",
      "abandoned": "charcoal_workshop_abandoned.glb",
      "infested": "charcoal_workshop_infested.glb"
    },
    "read": [
      "A forge burns in spite of the rain.",
      "The bellows twitch when the room is empty.",
      "An iron-black growth blooms out of the forge."
    ]
  },
  {
    "id": "burgomaster_manor",
    "title": "Burgomaster’s Manor",
    "footprint": [
      7,
      5
    ],
    "states": {
      "inhabited": "burgomaster_manor_inhabited.glb",
      "abandoned": "burgomaster_manor_abandoned.glb",
      "infested": "burgomaster_manor_infested.glb"
    },
    "read": [
      "Every downstairs window is lit.",
      "All the portraits face their own walls.",
      "The roofline has grown crooked horns."
    ]
  }
]);
export const VILLAGE_ARCHETYPE_BY_ID = Object.freeze(Object.fromEntries(VILLAGE_ARCHETYPES.map(v=>[v.id,v])));
export const VILLAGE_MODEL_ROOT = '/assets/dead-villages/';
