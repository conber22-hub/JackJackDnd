/* ROOM SHAPES — the grid stays square (a square is 5 ft, and moving, reach and areas all count squares), but a room
   needn't be a rectangle. r.shape says which squares of its box are floor:
   - (none): a rectangle
   - 'round': a circle, or an oval in a long box
   - 'octagon': the corners cut off on the slant
   - 'cross': two arms crossing in the middle
   - 'ell-ne' / 'ell-nw' / 'ell-se' / 'ell-sw': an L, the named corner cut away
   The room's x, y, w, h stay its box (moving and resizing work as before), and its middle (cx, cy) is always floor,
   so the stairs and the tunnels laid to it still land inside. A room smaller than 5×5 stays a rectangle.
   Pure: no DOM, no Three.js. */

export const SHAPES = {
  '': 'Rectangle', round: 'Round', octagon: 'Octagon', cross: 'Cross',
  'ell-ne': 'L (north-east cut away)', 'ell-nw': 'L (north-west cut away)', 'ell-se': 'L (south-east cut away)', 'ell-sw': 'L (south-west cut away)',
};
export const SLANTED = new Set(['round', 'octagon']);   // shapes whose walls run on the slant (render/floors.js draws them as wedges)
export const MIN_SHAPED = 5;
export const isShaped = r => !!r?.shape && !!SHAPES[r.shape] && r.w >= MIN_SHAPED && r.h >= MIN_SHAPED;

// Is square (x, y) floor in room r? (false outside its box)
export function inShape(r, x, y){
  if (x < r.x || y < r.y || x >= r.x + r.w || y >= r.y + r.h) return false;
  if (!isShaped(r)) return true;
  const u = x - r.x, v = y - r.y, w = r.w, h = r.h;
  switch (r.shape){
    case 'round': { const dx = (u + .5 - w / 2) / (w / 2), dy = (v + .5 - h / 2) / (h / 2); return dx * dx + dy * dy <= 1.12; }
    case 'octagon': { const k = Math.max(1, Math.round(Math.min(w, h) * .3)); return Math.min(u, w - 1 - u) + Math.min(v, h - 1 - v) >= k; }
    case 'cross': {
      // arms about 45% of the box wide, and as even or odd as the box so they sit square in the middle
      const arm = n => { let a = Math.max(3, Math.round(n * .45)); if ((n - a) % 2) a++; return a; };
      return Math.abs(u + .5 - w / 2) < arm(w) / 2 || Math.abs(v + .5 - h / 2) < arm(h) / 2;
    }
    default: {   // an L: the named corner, a little under half each way, cut away (so the middle stays)
      const cw = Math.floor((w - 1) / 2), ch = Math.floor((h - 1) / 2), c = r.shape.slice(4);
      const inX = c.includes('e') ? u >= w - cw : u < cw, inY = c.includes('n') ? v < ch : v >= h - ch;
      return !(inX && inY);
    }
  }
}

// Every floor square of a room, as grid indices (W: the floor's width).
export function shapeSquares(r, W){
  const out = [];
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (inShape(r, x, y)) out.push(y * W + x);
  return out;
}

/* A shape for a generated room, from its own dice: most rooms stay rectangles; crypts, chapels and halls of the dead
   lean round and eight-sided. → '' | a key of SHAPES */
export function pickShape(r, rng, themeId = ''){
  if (r.w < MIN_SHAPED || r.h < MIN_SHAPED) return '';
  const solemn = ['chapel', 'ossuary', 'undercroft', 'castle', 'womb'].includes(themeId);
  const roll = rng(), long = Math.max(r.w, r.h) / Math.min(r.w, r.h) > 1.6;
  if (roll < (solemn ? .2 : .12)) return long ? 'octagon' : 'round';
  if (roll < (solemn ? .38 : .24)) return 'octagon';
  if (roll < (solemn ? .45 : .32)) return r.w >= 7 && r.h >= 7 ? 'cross' : 'octagon';
  if (roll < (solemn ? .55 : .44)) return 'ell-' + ['ne', 'nw', 'se', 'sw'][Math.floor(rng() * 4)];
  return '';
}
