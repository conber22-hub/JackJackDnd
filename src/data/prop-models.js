/* 3D MODELS FOR PROPS — which ready-made model stands in for a prop the app otherwise draws in code
   (src/render/props.js). The models are KayKit's Dungeon Remastered pack by Kay Lousberg, CC0 (public domain):
   public/assets/props/kaykit/ (LICENSE.txt there), served beside the app and loaded the first time a prop needs one.
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
};
export const MODEL_CREDIT = 'Props: KayKit Dungeon Remastered by Kay Lousberg (kaylousberg.com), CC0';
