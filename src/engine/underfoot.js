/* 👣 WHAT'S UNDERFOOT — what a step on a square feels like, for the puff, splash, print or rustle it leaves and the sound
   it makes (render/stepfx.js, audio/sound.js). Pure.
     f: { W, grid, shallow?:[square index], water?, props?:[{ k, x, y }], rooms?:[{ x, y, w, h, outdoor, crop }] }
     opts: { indoors, snow (0–1), wet (0–1) }
   → 'splash' (a ford, a puddle) · 'snow' (prints) · 'mud' (wet ground) · 'rustle' (brush, crops) · 'dust' (a dry road)
     · 'grass' (dry open ground: no mark) · 'stone' (indoors: no mark) */
import { T } from './tiles.js';

const BRUSH = new Set(['bush', 'hay', 'wheat', 'barley', 'cabbage', 'pumpkin', 'orchard', 'bloomgrowth', 'vines']);
export function underfoot(f, x, y, { indoors = false, snow = 0, wet = 0 } = {}){
  if (!f?.grid) return 'stone';
  const i = y * f.W + x;
  if ((f.shallow || []).includes(i) || (f.props || []).some(p => p.k === 'puddle' && p.x === x && p.y === y)) return 'splash';
  if (indoors) return 'stone';
  const room = (f.rooms || []).filter(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h).sort((a, b) => a.w * a.h - b.w * b.h)[0];   // (the smallest that holds it)
  if (room && !room.outdoor && !f.outdoor) return 'stone';
  if (snow >= .4) return 'snow';
  if (room?.crop || (f.props || []).some(p => BRUSH.has(p.k) && p.x === x && p.y === y)) return 'rustle';
  if (wet >= .5) return 'mud';
  return f.grid[i] === T.HALL ? 'dust' : 'grass';
}
// Footprints go left, right, left: the side for the n-th step, and the angle of a step (dx, dy on the map) for a print
export const printSide = n => n % 2 ? 1 : -1;
export const stepAngle = (dx, dy) => Math.atan2(dx, dy);
