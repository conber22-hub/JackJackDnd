/* OBJECTS — the rules for furniture you can use: what it's made of, whether it opens, whether a hero beside it
   can push it, topple it or smash it, and where it ends up. Pure: works on a floor and plain objects, no DOM.
   The rolls and the table-facing side (cards, sounds, sharing) are in game/objects.js. */
import { OBJECTS, MAT_AC, OBJ_HP, MOVE_DC, FLAT } from '../data/objects.js';
import { PROPS, propSize } from '../data/props.js';
import { walk } from './tiles.js';

export const objInfo = k => OBJECTS[k] || null;
export const objAC = p => MAT_AC[objInfo(p.k)?.m] ?? 15;
export const objMaxHp = p => { const o = objInfo(p.k); return o ? OBJ_HP[o.sz || 'M'][o.frail ? 0 : 1] : 0; };
export const objHp = p => p.hp ?? objMaxHp(p);
export const propName = p => (PROPS[p.k]?.n || 'thing').toLowerCase();
// A prop the heroes can do something with (open, search, push, topple, smash, or a stash or a hidden door).
export const isObject = p => (!!objInfo(p.k) && !objInfo(p.k).flat) || !!p.stash || !!p.hides;   // a rug only if something's under it

// The squares a prop covers.
export function propSquares(p){ const s = propSize(p), out = []; for (let y = p.y; y < p.y + s.h; y++) for (let x = p.x; x < p.x + s.w; x++) out.push({ x, y }); return out; }
// Is a creature (size n) standing next to the prop (or on it)?
export function besideProp(t, p){
  const s = propSize(p), n = t.size || 1;
  return t.x <= p.x + s.w && t.x + n - 1 >= p.x - 1 && t.y <= p.y + s.h && t.y + n - 1 >= p.y - 1;
}
// Which way a hero beside it would shove it: straight away from them, along one axis (null from a corner).
export function pushDir(t, p){
  const s = propSize(p), n = t.size || 1;
  const dx = t.x + n - 1 < p.x ? 1 : t.x > p.x + s.w - 1 ? -1 : 0, dy = t.y + n - 1 < p.y ? 1 : t.y > p.y + s.h - 1 ? -1 : 0;
  if (dx && dy) return null;
  if (!dx && !dy) return null;   // standing on it
  return { dx, dy };
}

const occupiedBy = (f, x, y, self, tokens) => {
  if (tokens?.some(t => !t.dead && !t.flags?.gone && x >= t.x && x < t.x + (t.size || 1) && y >= t.y && y < t.y + (t.size || 1))) return 'someone is in the way';
  for (const q of f.props || []){
    if (q === self || FLAT.has(q.k) || q.broken) continue;
    const s = propSize(q); if (x >= q.x && x < q.x + s.w && y >= q.y && y < q.y + s.h) return `the ${propName(q)} is in the way`;
  }
  return null;
};
const isDoorOrStairs = (f, x, y) => (f.doors || []).some(d => d.i === y * f.W + x) || [f.up, f.down].some(s => s && s.x === x && s.y === y);

/* Pushing one square: the new squares must be open floor (not a wall, a door or the stairs), with nobody and
   nothing upright on them. → { x, y } where it ends up, or { why } */
export function pushTarget(f, p, dx, dy, tokens = []){
  const s = propSize(p), nx = p.x + dx, ny = p.y + dy;
  for (let y = ny; y < ny + s.h; y++) for (let x = nx; x < nx + s.w; x++){
    if (x >= p.x && x < p.x + s.w && y >= p.y && y < p.y + s.h) continue;   // it's already there
    if (x < 0 || y < 0 || x >= f.W || y >= f.H || !walk(f.grid[y * f.W + x])) return { why:'there is a wall behind it' };
    if (isDoorOrStairs(f, x, y)) return { why:'it would block the way' };
    const occ = occupiedBy(f, x, y, p, tokens); if (occ) return { why:occ };
  }
  return { x:nx, y:ny };
}
/* Toppling a tall piece away from the hero: it falls across up to `len` squares beyond its footprint (a wall
   stops it short). → { x, y, w, h, hit:[squares it lands on] } or { why } */
export function toppleTarget(f, p, dx, dy){
  const o = objInfo(p.k); if (!o?.tall) return { why:'it is not tall enough to topple' };
  const s = propSize(p); let len = 0;
  for (let k = 1; k <= (o.len || 1); k++){
    let ok = true;
    for (let y = p.y; y < p.y + s.h && ok; y++) for (let x = p.x; x < p.x + s.w && ok; x++){
      const X = x + dx * k, Y = y + dy * k;
      if (X < 0 || Y < 0 || X >= f.W || Y >= f.H || !walk(f.grid[Y * f.W + X]) || isDoorOrStairs(f, X, Y)) ok = false;
      else for (const q of f.props || []){ if (q === p || FLAT.has(q.k) || q.broken || q.fallen) continue; const qs = propSize(q); if (X >= q.x && X < q.x + qs.w && Y >= q.y && Y < q.y + qs.h && objInfo(q.k)?.tall) ok = false; }
    }
    if (!ok) break; len = k;
  }
  if (!len) return { why:'there is no room for it to fall' };
  // it lies from its base to where its top lands: the old footprint stretched `len` squares that way
  const x = dx < 0 ? p.x - len : p.x, y = dy < 0 ? p.y - len : p.y, w = s.w + Math.abs(dx) * len, h = s.h + Math.abs(dy) * len;
  const hit = []; for (let k = 1; k <= len; k++) for (let yy = p.y; yy < p.y + s.h; yy++) for (let xx = p.x; xx < p.x + s.w; xx++) hit.push({ x:xx + dx * k, y:yy + dy * k });
  return { x, y, w, h, hit, len };
}
// Put a toppled piece on its side (it remembers where it stood, for drawing the fall).
export function lieDown(f, p, dx, dy, at){
  const s = propSize(p);
  p.fallen = { dx, dy, ox:p.x, oy:p.y, ow:s.w, oh:s.h };
  p.x = at.x; p.y = at.y; p.fw = at.w; p.fh = at.h; p.open = false;
  f.propsV = (f.propsV || 0) + 1;
}
export function movedTo(f, p, at){ p.x = at.x; p.y = at.y; f.propsV = (f.propsV || 0) + 1; }
// Damage to an object: → true if that broke it.
export function damageObject(f, p, n){
  if (p.broken || n <= 0) return false;
  p.hp = Math.max(0, objHp(p) - n);
  if (p.hp > 0) return false;
  p.broken = true; p.open = false; delete p.lock; delete p.swung;
  f.propsV = (f.propsV || 0) + 1;
  return true;
}
export const fallDamage = p => { const [dice, type] = String(objInfo(p.k)?.fall || '1d6').split(' '); return { dice, type:type || 'bludgeoning' }; };

/* What a hero (or the DM) can do with it right now. → [{ act, label, why? }] — why: shown greyed out with the reason.
   dm: the DM's card offers everything (the nearest hero does it). door: the secret door this piece hides, if any. */
export function objectActs(f, p, t, { dm = false, door = null } = {}){
  const o = objInfo(p.k), out = [], near = !!t && besideProp(t, p);
  if (!dm && !near) return [{ act:'', label:'Stand next to it', why:'too far away' }];
  if (p.broken) return [{ act:'', label:`Broken — ${propName(p)} in pieces`, why:'nothing left to do' }];
  if (o?.open && !p.fallen){
    if (p.open) out.push({ act:'close', label:o.open === 'doors' ? 'Close the doors' : o.open === 'drawer' ? 'Shut the drawer' : 'Close it' });
    else if (p.lock){ out.push({ act:'pick', label:`🗝 Pick the lock` }, { act:'force', label:'💥 Force it' }); }
    else out.push({ act:'open', label:o.heavy ? `Heave the lid (Str DC ${o.heavy})` : o.open === 'doors' ? 'Open the doors' : o.open === 'drawer' ? 'Open the drawer' : 'Open it' });
  }
  if (door && door.state !== 'secret' && !p.swung && !p.fallen) out.push({ act:'swing', label:'↪ Swing it aside' });
  if (o && o.move !== 'fixed' && !p.fallen){
    const dir = t && pushDir(t, p);
    const dc = MOVE_DC[o.move] || 0;
    out.push({ act:'push', label:`⇥ Push${dc ? ` (DC ${dc})` : ''}`, why:!t ? 'nobody near' : !dir ? 'stand square-on to one side' : pushTarget(f, p, dir.dx, dir.dy).why });
    if (o.tall) out.push({ act:'topple', label:`⤵ Topple it${o.move === 'heavy' ? ' (DC 13)' : ''}`, why:!t ? 'nobody near' : !dir ? 'stand square-on to one side' : toppleTarget(f, p, dir.dx, dir.dy).why });
  }
  if (o && !o.flat) out.push({ act:'smash', label:`🔨 Smash (AC ${objAC(p)}, ${objHp(p)} HP)` });
  return out;
}
