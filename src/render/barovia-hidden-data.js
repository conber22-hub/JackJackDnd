/* Barovia V: original scene text and model-state pairs. No copyrighted module passages. */
export const HIDDEN_SITES = Object.freeze([
  {
    "id": "svalich_road_hatch",
    "title": "The Stone That Rings Hollow",
    "kind": "entrance",
    "biomes": [
      "roadside",
      "forest"
    ],
    "roads": [
      "r-east",
      "r-west",
      "r-gates",
      "r-vallaki"
    ],
    "footprint": [
      3,
      3
    ],
    "approach": "A loose paving stone clicks twice beneath a boot.",
    "reveal": "A narrow hatch reveals steps cut into a much older road.",
    "return": "A wet handprint marks the underside of the stone.",
    "sealed": "svalich_road_hatch_sealed",
    "revealed": "svalich_road_hatch_revealed"
  },
  {
    "id": "blackroot_hollow_oak",
    "title": "The Listening Oak",
    "kind": "entrance",
    "biomes": [
      "forest",
      "graveyard"
    ],
    "roads": [
      "r-cut",
      "r-west",
      "r-east",
      "r-argyn",
      "r-mist"
    ],
    "footprint": [
      4,
      4
    ],
    "approach": "A hollow oak exhales warm air in a cold wood.",
    "reveal": "A bark panel swings aside to a root-lined descending stair.",
    "return": "The opening has grown a fresh ring of wood around its rim.",
    "sealed": "blackroot_hollow_oak_sealed",
    "revealed": "blackroot_hollow_oak_revealed"
  },
  {
    "id": "boulder_moss_curtain",
    "title": "The Green Curtain",
    "kind": "entrance",
    "biomes": [
      "mountain",
      "corruption"
    ],
    "roads": [
      "r-argyn",
      "r-krezk",
      "r-yester",
      "r-cut"
    ],
    "footprint": [
      4,
      3
    ],
    "approach": "A sheet of moss ripples across a cliff without wind.",
    "reveal": "Behind it is a dry, hewn threshold lit by spores.",
    "return": "The spore light spells a name in the stone.",
    "sealed": "boulder_moss_curtain_sealed",
    "revealed": "boulder_moss_curtain_revealed"
  },
  {
    "id": "dry_well_ladder",
    "title": "The Well Without Water",
    "kind": "entrance",
    "biomes": [
      "village",
      "farmland"
    ],
    "roads": [
      "r-vallaki",
      "r-winery",
      "r-gates",
      "r-krezk"
    ],
    "footprint": [
      3,
      3
    ],
    "approach": "An old well sounds hollow, even when a pebble hits the bottom.",
    "reveal": "The wooden lid conceals a ladder carved into the stone shaft.",
    "return": "A bucket hangs halfway up. It was not there before.",
    "sealed": "dry_well_ladder_sealed",
    "revealed": "dry_well_ladder_revealed"
  },
  {
    "id": "ossuary_gravestone",
    "title": "The Wrong Burial",
    "kind": "crypt",
    "biomes": [
      "graveyard",
      "roadside"
    ],
    "roads": [
      "r-east",
      "r-castle",
      "r-argyn",
      "r-gates"
    ],
    "footprint": [
      3,
      3
    ],
    "approach": "A grave slab lies too level in soil softened by rain.",
    "reveal": "Below the slab, cramped ossuary steps descend to a sealed passage.",
    "return": "One more name has appeared on the stone.",
    "sealed": "ossuary_gravestone_sealed",
    "revealed": "ossuary_gravestone_revealed"
  },
  {
    "id": "bridge_floodgate",
    "title": "The Weeping Culvert",
    "kind": "culvert",
    "biomes": [
      "marsh",
      "roadside"
    ],
    "roads": [
      "r-tser",
      "r-berez",
      "r-tower",
      "r-east"
    ],
    "footprint": [
      4,
      3
    ],
    "approach": "Water drains under the bridge, but the bars are warm.",
    "reveal": "A hidden iron grille folds upward. Someone has used the tunnel recently.",
    "return": "A fresh lantern glows beyond the waterline.",
    "sealed": "bridge_floodgate_sealed",
    "revealed": "bridge_floodgate_revealed"
  },
  {
    "id": "straw_barn_hatch",
    "title": "The Hay That Breathes",
    "kind": "entrance",
    "biomes": [
      "farmland",
      "village"
    ],
    "roads": [
      "r-winery",
      "r-krezk",
      "r-vallaki"
    ],
    "footprint": [
      4,
      3
    ],
    "approach": "Hay has been piled into a perfect square on the barn floor.",
    "reveal": "A slatted hatch conceals a cellar beneath the stalls.",
    "return": "The straw has been brushed into the shape of a sleeping person.",
    "sealed": "straw_barn_hatch_sealed",
    "revealed": "straw_barn_hatch_revealed"
  },
  {
    "id": "tser_reed_den",
    "title": "The Reedbank Mouth",
    "kind": "entrance",
    "biomes": [
      "marsh",
      "forest"
    ],
    "roads": [
      "r-tser",
      "r-berez",
      "r-lake",
      "r-tower"
    ],
    "footprint": [
      4,
      4
    ],
    "approach": "Reeds bend in a ring around dry earth.",
    "reveal": "A root-bound passage opens where the water should be.",
    "return": "The reeds move toward the party, not the wind.",
    "sealed": "tser_reed_den_sealed",
    "revealed": "tser_reed_den_revealed"
  },
  {
    "id": "bonegrinder_ash_chute",
    "title": "The Ash Below the Mill",
    "kind": "entrance",
    "biomes": [
      "farmland",
      "corruption"
    ],
    "roads": [
      "r-west",
      "r-vallaki",
      "r-cut"
    ],
    "footprint": [
      3,
      3
    ],
    "approach": "The abandoned mill chute smells of warm flour and cold ash.",
    "reveal": "The millstone rolls aside, uncovering steep stairs beneath the axle.",
    "return": "Fresh flour dust falls upward from the opening.",
    "sealed": "bonegrinder_ash_chute_sealed",
    "revealed": "bonegrinder_ash_chute_revealed"
  },
  {
    "id": "hunter_cairn_cache",
    "title": "The Hunters Who Never Came Back",
    "kind": "refuge",
    "biomes": [
      "forest",
      "mountain"
    ],
    "roads": [
      "r-cut",
      "r-argyn",
      "r-yester"
    ],
    "footprint": [
      3,
      3
    ],
    "approach": "An arrowhead has been wedged into the highest stone.",
    "reveal": "The cairn turns on a buried pivot, showing a narrow escape shaft.",
    "return": "A new arrowhead points toward the party camp.",
    "sealed": "hunter_cairn_cache_sealed",
    "revealed": "hunter_cairn_cache_revealed"
  },
  {
    "id": "inn_floor_cellar",
    "title": "The Cold Hearth",
    "kind": "entrance",
    "biomes": [
      "village",
      "roadside"
    ],
    "roads": [
      "r-gates",
      "r-vallaki",
      "r-krezk"
    ],
    "footprint": [
      3,
      3
    ],
    "approach": "One floorboard below the hearth is warmer than the rest.",
    "reveal": "The cellar latch lifts to reveal a dark room that should not fit below.",
    "return": "A second latch has been fitted from inside.",
    "sealed": "inn_floor_cellar_sealed",
    "revealed": "inn_floor_cellar_revealed"
  },
  {
    "id": "raven_guardian_crypt",
    "title": "The Vigil Below",
    "kind": "crypt",
    "biomes": [
      "graveyard",
      "mountain"
    ],
    "roads": [
      "r-castle",
      "r-argyn",
      "r-yester"
    ],
    "footprint": [
      4,
      3
    ],
    "approach": "A headless sentinel guards a moss-covered plinth.",
    "reveal": "The plinth slides to reveal a crypt door and a descending threshold.",
    "return": "Stone wings have been scored into the sentinel back.",
    "sealed": "raven_guardian_crypt_sealed",
    "revealed": "raven_guardian_crypt_revealed"
  }
]);
export const HIDDEN_SITE_BY_ID = Object.freeze(Object.fromEntries(HIDDEN_SITES.map(s=>[s.id,s])));
