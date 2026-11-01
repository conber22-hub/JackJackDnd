/* ROOM FEATURES — what makes one room of a dungeon not like the next: knee-deep black water, a chasm with a rope
   bridge across it, a fall of the ceiling, two rows of pillars. Rolled per room by the floor's theme, at most one a room,
   never in a stair room, and never so that anything that could be walked to before is cut off.
   Floor data it adds (all square indexes; render/floors.js draws them, the rules read them):
     shallow  walkable water to the knee: difficult terrain (also in f.rough)
     chasm    a drop: not walkable, you can see (and shoot) across it, like water (kept solid through f.filled)
     span     walkable squares over the chasm: the rope bridge
   and pillars and rubble as props. The room gets `feature`, and a line for its read-aloud and the DM's notes.
   Pure: no DOM, no Three.js. */
import { T, walk } from './tiles.js';
import { carve } from './generator.js';
import { reachable } from './caves.js';

// chance a room of the theme gets each feature (rolled in this order; the first that fits wins)
const BY_THEME = {
  undercroft:{ pillared:.16, flooded:.1, collapsed:.1 },  silver:{ chasm:.16, collapsed:.14, flooded:.08 },
  hands:{ chasm:.12, collapsed:.12 },                      undertow:{ flooded:.35, chasm:.06 },
  chapel:{ pillared:.2, collapsed:.14 },                   ossuary:{ pillared:.2, chasm:.1, collapsed:.08 },
  womb:{ flooded:.28 },                                    cellar:{ flooded:.18, pillared:.14 },
  dungeon:{ flooded:.14, chasm:.1, pillared:.12 },         castle:{ pillared:.16 },
  burned:{ collapsed:.3 },                                 manor:{ collapsed:.06 },
};
export const FEATURE_TEXT = {
  flooded:  { read:'Black water stands to the knee across the floor. It is colder than it should be, and something brushes past a shin.',
              note:'Flooded: the water is difficult terrain.' },
  chasm:    { read:'A crack splits the floor, too wide to jump and black all the way down. A rope bridge sags across it, and creaks.',
              note:'Chasm: no way across but the rope bridge (one at a time is wise). A fall is a long one: 4d6 bludgeoning or worse, your call.' },
  collapsed:{ read:'Part of the ceiling has come down: a slope of broken stone and grey dust, and above it a dark hole that drips.',
              note:'Collapsed: the rubble is difficult terrain; the rest of the ceiling may not hold (a loud noise, DC 12 Dexterity save, 2d6).' },
  pillared: { read:'Pillars in two rows hold up the roof. Anything could be standing behind any of them.',
              note:'Pillars: half cover behind them; they block movement.' },
};

/* Give some of the floor's rooms a feature. Returns the list of [room, feature]. */
export function addFeatures(f, themeId, rng){
  const odds = BY_THEME[themeId]; if (!odds || !f.rooms?.length) return [];
  const W = f.W, start = f.up ? f.up.y * W + f.up.x : f.rooms[0].cy * W + f.rooms[0].cx, out = [];
  f.shallow ||= []; f.chasm ||= []; f.span ||= []; f.rough ||= []; f.props ||= [];
  for (const r of f.rooms){
    if (r.type === 'entrance' || r.stairsUp || r.stairsDown || r.feature) continue;
    for (const [kind, p] of Object.entries(odds)){
      if (rng() >= p) continue;
      const before = snapshot(f), was = reachable(f, start);
      if (!MAKE[kind](f, r, rng)) { restore(f, before); continue; }
      carve(f);
      // nothing that could be walked to before may be cut off by it
      const now = reachable(f, start);
      if ([...was].some(i => walk(f.grid[i]) && !now.has(i))){ restore(f, before); carve(f); continue; }
      r.feature = kind; r.notes = [r.notes, FEATURE_TEXT[kind].note].filter(Boolean).join(' ');
      out.push([r, kind]); break;
    }
  }
  return out;
}
const snapshot = f => ({ filled:f.filled.slice(), shallow:f.shallow.slice(), chasm:f.chasm.slice(), span:f.span.slice(), rough:f.rough.slice(), props:f.props.length, nextObj:f.nextObj });
function restore(f, s){ f.filled = s.filled; f.shallow = s.shallow; f.chasm = s.chasm; f.span = s.span; f.rough = s.rough; f.props.length = s.props; f.nextObj = s.nextObj; }

const squares = r => { const out = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) out.push([x, y]); return out; };
const MAKE = {
  // most of the room under water: everything but a ragged dry rim
  flooded(f, r, rng){
    if (r.w * r.h < 12) return false;
    const W = f.W, cx = r.x + (r.w - 1) / 2, cy = r.y + (r.h - 1) / 2; let n = 0;
    for (const [x, y] of squares(r)){
      const i = y * W + x; if (f.grid[i] !== T.ROOM) continue;
      const d = Math.max(Math.abs(x - cx) / (r.w / 2), Math.abs(y - cy) / (r.h / 2));
      if (d < .55 + rng() * .5){ f.shallow.push(i); f.rough.push(i); n++; }
    }
    return n >= 6;
  },
  // a crack across the room, one or two squares wide, with a rope bridge where it is narrowest to cross
  chasm(f, r, rng){
    if (r.w < 5 || r.h < 5) return false;
    const W = f.W, across = rng() < .5;   // across: the crack runs top to bottom (so the bridge runs left to right)
    const len = across ? r.w : r.h, wide = len >= 8 && rng() < .5 ? 2 : 1;
    const at = (across ? r.x : r.y) + 2 + Math.floor(rng() * (len - 3 - wide)), mid = across ? r.cx : r.cy;
    if (mid >= at && mid < at + wide) return false;   // the room's middle stays floor (tunnels are laid from it)
    const along = across ? [r.y, r.y + r.h - 1] : [r.x, r.x + r.w - 1];
    // never where a tunnel comes in at either end of the crack
    for (let k = 0; k < wide; k++) for (const end of [along[0] - 1, along[1] + 1]){
      const x = across ? at + k : end, y = across ? end : at + k;
      if (x >= 0 && y >= 0 && x < W && y < f.H && walk(f.grid[y * W + x])) return false;
    }
    const bridge = along[0] + 1 + Math.floor(rng() * (along[1] - along[0] - 1));
    for (let s = along[0]; s <= along[1]; s++) for (let k = 0; k < wide; k++){
      const x = across ? at + k : s, y = across ? s : at + k, i = y * W + x;
      if (f.up && f.up.x === x && f.up.y === y || f.down && f.down.x === x && f.down.y === y) return false;
      if (s === bridge) f.span.push(i); else { f.filled.push(i); f.chasm.push(i); }
    }
    return true;
  },
  // a fall of rock against one wall: a few squares filled, rubble spilling out from them
  collapsed(f, r, rng){
    if (r.w < 4 || r.h < 4) return false;
    const W = f.W, side = Math.floor(rng() * 4), edge = [];
    for (const [x, y] of squares(r)) if ((side === 0 && x === r.x) || (side === 1 && x === r.x + r.w - 1) || (side === 2 && y === r.y) || (side === 3 && y === r.y + r.h - 1)) edge.push([x, y]);
    const mid = Math.floor(rng() * edge.length), fall = edge.slice(Math.max(0, mid - 1), mid + 2);
    const nearStairs = (x, y) => [f.up, f.down].some(s => s && Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);
    for (const [x, y] of fall) if (!nearStairs(x, y)) f.filled.push(y * W + x);
    // rubble on the squares in front of the fall
    const [ox, oy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][side], piled = new Set((f.props || []).map(p => p.y * W + p.x));
    for (const [x, y] of fall) for (const k of [1, 2]){
      const nx = x + ox * k, ny = y + oy * k + (k === 2 ? Math.round(rng() * 2 - 1) : 0);
      if (nx < r.x || ny < r.y || nx >= r.x + r.w || ny >= r.y + r.h || nearStairs(nx, ny) || piled.has(ny * W + nx) || f.filled.includes(ny * W + nx) || f.grid[ny * W + nx] !== T.ROOM || rng() < .25) continue;
      piled.add(ny * W + nx);
      f.props.push({ id:f.nextObj++, k:'rubble', x:nx, y:ny, rot:Math.floor(rng() * 4) });
    }
    return true;
  },
  // two rows of pillars down the long way of a big room, one square in from the walls
  pillared(f, r){
    if (r.w < 6 || r.h < 6) return false;
    const long = r.w >= r.h, add = [];
    for (let k = 1; k <= (long ? r.w : r.h) - 2; k += 2) for (const side of [1, (long ? r.h : r.w) - 2]){
      const x = long ? r.x + k : r.x + side, y = long ? r.y + side : r.y + k;
      if (f.grid[y * f.W + x] !== T.ROOM || [f.up, f.down].some(s => s && Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1)) continue;
      if ((f.doors || []).some(d => Math.abs(d.i % f.W - x) + Math.abs(((d.i / f.W) | 0) - y) <= 1)) continue;
      add.push({ id:f.nextObj++, k:'pillar', x, y, rot:0 });
    }
    if (add.length < 4) return false;
    f.props.push(...add);
    return true;
  },
};
