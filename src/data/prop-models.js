/* 3D MODELS FOR PROPS — which ready-made model stands in for a prop the app otherwise draws in code
   (src/render/props.js). All by Kay Lousberg (KayKit), CC0 (public domain), each pack with its LICENSE.txt:
   - public/assets/props/kaykit/: Dungeon Remastered (furniture, barrels, chests)
   - public/assets/props/halloween/: Halloween Bits (gravestones, a shrine, a bench, a dead tree)
   - public/assets/props/hexagon/: Medieval Hexagon (fences, a field wall, a wheelbarrow, sacks, lumber, a rock)
   Served beside the app and loaded the first time a prop needs one (a .glb, or a .gltf with its .bin and texture).
   The offline single file, or a model that can't load, keeps the hand-built prop.

   For each prop kind:
   - file: the model in public/assets/props/
   - top: the height in the model's own units of the surface heroes stand on (a table's top, a barrel's lid); the
     model is scaled so that lands on the app's own height for it (PROP_TOP), so climbing still lines up
   - height: for a prop nobody stands on, how tall it should stand, in squares
   - fit: how much of the prop's squares it may fill (it's never scaled bigger than that)
   - lid: the name of the part that opens (a chest's lid), hinged at its back edge
   - turn: a quarter turn (radians) to face it the way the app's prop faces */
export const PROP_MODELS = {
  barrel:     { file:'kaykit/barrel_large.glb',           top:2.0 },
  kegs:       { file:'kaykit/keg_decorated.glb',          top:2.05 },
  crate:      { file:'kaykit/box_large.glb',              top:1.5 },
  chest:      { file:'kaykit/chest.glb',                  top:.97, lid:'chest_lid' },
  table:      { file:'kaykit/table_medium.glb',           top:1.0 },
  longtable:  { file:'kaykit/table_long_decorated_A.glb', top:1.0 },
  chair:      { file:'kaykit/chair.glb',                  top:.5 },
  stool:      { file:'kaykit/stool.glb',                  top:.5 },
  bed:        { file:'kaykit/bed_decorated.glb',          top:.95 },
  candelabra: { file:'kaykit/candle_triple.glb',          height:.75 },
  // the village and the road (the graveyard and the roadside from Halloween Bits; the farm from the hexagon pack).
  // (Lanterns, lampposts and tents stay drawn: the drawn lanterns glow, and the pack's tent doesn't read as one.)
  gravestone: { file:'halloween/gravestone.gltf',         height:.75 },
  shrine:     { file:'halloween/shrine.gltf',             height:1.15 },
  bench:      { file:'halloween/bench.gltf',              top:.5, turn:Math.PI / 2 },
  deadtree:   { file:'halloween/tree_dead_large.gltf',    height:2.0, fit:1.2 },
  fence:      { file:'hexagon/fence_wood_straight.gltf',  height:.7, turn:Math.PI / 2, fit:1 },
  drystone:   { file:'hexagon/fence_stone_straight.gltf', height:.45, turn:Math.PI / 2, fit:1 },
  cart:       { file:'hexagon/wheelbarrow.gltf',          top:.15 },
  sacks:      { file:'hexagon/sack.gltf',                 height:.45 },
  woodpile:   { file:'hexagon/resource_lumber.gltf',      height:.35 },
  boulder:    { file:'hexagon/rock_single_C.gltf',        top:.19 },
};
export const MODEL_CREDIT = 'Props: KayKit (Dungeon Remastered, Halloween Bits, Medieval Hexagon) by Kay Lousberg (kaylousberg.com), CC0';
