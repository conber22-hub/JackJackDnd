/* 🍎 ORCHARDS — a field of apple trees (an outdoor room's crop 'orchard', data/props.js CROPS), in a village's fields
   and beside the roads. The trees stand where four squares meet, two squares apart, every other row set over by one,
   so a hero walks between them; they are only the look (render/floors.js: the wilds pack's orchard apple), the
   squares stay open ground. Where the Bloom is loose some of them are its bloomed twin (engine/bloom-woods.js), and
   when the Count looks hard enough for the fields to blight, some of them stand dead. Pure: no DOM, no Three.js. */

/* The trees of an orchard room {x, y, w, h}: → [[cx, cy]…], each the corner where squares (cx-1, cy-1), (cx, cy-1),
   (cx-1, cy) and (cx, cy) meet, all four inside the room. */
export function orchardTrees(r){
  const out = [];
  for (let cy = r.y + 1, row = 0; cy < r.y + r.h; cy += 2, row++)
    for (let cx = r.x + 1 + (row % 2); cx < r.x + r.w; cx += 2) out.push([cx, cy]);
  return out;
}

/* What one tree is: 'healthy', 'bloomed' or 'dead'. bloom: the floor's (0–1); wither: how hard the land withers
   (0–5, the fields blight from 3); rb, rw: the tree's own two numbers (0–1), the same at every device. */
export function orchardTree(bloom = 0, wither = 0, rb = 1, rw = 1){
  if (wither >= 3 && rw < (wither - 2) * .18) return 'dead';
  return rb < Math.max(0, Math.min(1, Number(bloom) || 0)) ? 'bloomed' : 'healthy';
}
