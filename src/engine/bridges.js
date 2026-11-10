/* 🌉 BRIDGES — where a road crosses a river the generator lays 'bridge' planks, square by square (engine/overland.js).
   This finds each solid patch of them, so the renderer can stand one whole bridge over it (render/floors.js), and says
   which way it runs: across the water, so the river lies along its sides. Pure: no DOM, no Three.js. */

// → [{ x, y, w, h, ew (it runs east–west), cells:[index…], id (a plank's, for picking) }] for patches at least 2 by 2.
export function plankBridges(f){
  const planks = (f?.props || []).filter(p => p.k === 'bridge' && !p.broken);
  if (planks.length < 4) return [];
  const W = f.W, at = new Map(planks.map(p => [p.y * W + p.x, p])), done = new Set(), water = new Set(f.water || []), out = [];
  for (const start of at.keys()){
    if (done.has(start)) continue;
    const cells = [], todo = [start]; done.add(start);
    while (todo.length){
      const i = todo.pop(), x = i % W, y = (i / W) | 0; cells.push(i);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = x + dx, ny = y + dy, j = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= f.H || done.has(j) || !at.has(j)) continue; done.add(j); todo.push(j); }
    }
    let x0 = W, y0 = f.H, x1 = -1, y1 = -1;
    for (const i of cells){ const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (w < 2 || h < 2 || cells.length !== w * h) continue;   // (a jetty's line of planks, or a ragged patch, stays planks)
    // the river lies along its sides: north and south of a bridge that runs east–west
    let ns = 0, ew = 0;
    for (let x = x0; x <= x1; x++){ if (water.has((y0 - 1) * W + x)) ns++; if (water.has((y1 + 1) * W + x)) ns++; }
    for (let y = y0; y <= y1; y++){ if (water.has(y * W + x0 - 1)) ew++; if (water.has(y * W + x1 + 1)) ew++; }
    if (!ns && !ew) continue;                                  // (planks over dry ground: a boardwalk, not a bridge)
    out.push({ x:x0, y:y0, w, h, ew:ns >= ew, cells:cells.sort((a, b) => a - b), id:at.get(start).id });
  }
  return out;
}
