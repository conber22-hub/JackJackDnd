/* TARGETING — how far an attack reaches, what cover a target has, and which squares a spell's area covers.
   Pure: reads `state`, no DOM, no Three.js. Distances are in squares (5 ft.), measured between footprints with
   diagonals counting as one square, as on the battle grid.
   · Ranges: melee reach (1, or 2 for reach weapons); a weapon's normal / long range (beyond normal: disadvantage);
     spells' ranges from the SRD. A ranged attack with a hostile creature next to the attacker has disadvantage.
   · Cover (the grid rule): pick a corner of the attacker's space, draw lines to the four corners of the target's
     square; lines through walls or closed doors count. 1–2 blocked: half cover (+2 AC), 3: three-quarters (+5),
     all 4: total cover (can't be targeted). A creature in the way gives half cover. Lines along an edge don't count.
   · Areas: sphere / cylinder (radius), cube (side), cone and line (length) and aura (radius around the caster).
     Cones, lines, auras and cubes with no range start at the caster; the rest are centred on a square in range.
     An area doesn't go round walls: a square is hit only if a line from the area's origin reaches it. */
import { state, side } from './state.js';
import { walk } from './tiles.js';
import { passSight, lineClear, canSee } from './grid.js';
import { isMelee, reachOf, gap, tokGap } from './movement.js';

const FT = 5;
const NO_REACTION = ['paralyzed', 'stunned', 'incapacitated', 'unconscious'];
const sq = ft => Math.max(0, Math.round(ft / FT));

/* ---------- ranges ---------- */
// { melee: reach in squares (0 = not a melee attack), near, far: ranged reach in squares (0 = none) }
export function attackProfile(a){
  const melee = isMelee(a) ? reachOf(a) : 0;
  const named = /\((\d+)(?:\s*\/\s*(\d+))?\s*ft\.?\)/i.exec(a?.n || '');
  const r = a?.rng || (named ? [+named[1], named[2] ? +named[2] : undefined] : null);
  let near = 0, far = 0;
  if (r && !(r[0] <= FT && !r[1])){ near = sq(r[0]); far = sq(r[1] ?? r[0]); }
  else if (!melee){ near = 16; far = 64; }                 // a bow or a spit with no range written: 80/320 ft.
  return { melee, near, far };
}
// Is a hostile creature (able to act) right next to this one? Ranged attacks then have disadvantage.
export const hemmedIn = (t, tokens = state.tokens) => tokens.some(o => o.id !== t.id && o.floor === t.floor && !o.dead && !o.flags?.gone && side(o) !== side(t) && tokGap(t, o) <= 1 && !(o.conds || []).some(c => NO_REACTION.includes(c.n)));
/* Can `a` (attack) from `att` reach `tg`? → { ok, d (squares), kind:'melee'|'ranged', long, close, why } */
export function rangeCheck(att, tg, a){
  const p = attackProfile(a), d = tokGap(att, tg);
  if (att.floor !== tg.floor) return { ok:false, d, why:'on another floor' };
  if (p.melee && d <= p.melee) return { ok:true, d, kind:'melee' };
  if (p.far && d <= p.far) return { ok:true, d, kind:'ranged', long:d > p.near, close:hemmedIn(att) };
  const most = Math.max(p.melee, p.far);
  return { ok:false, d, why:`out of ${p.far ? 'range' : 'reach'} (${most * FT} ft.; it's ${d * FT} ft. away)` };
}
// How far a spell reaches, in squares (0 = self, 1 = touch).
export const spellReach = sp => sq(sp?.r ?? 60);

/* ---------- cover ---------- */
const EPS = 1e-6, EDGE = .02;
// Does the segment P→Q pass through the inside of square (x, y) (not just along its edge)? (Liang–Barsky clip)
function crosses(px, py, qx, qy, x, y){
  let t0 = 0, t1 = 1; const dx = qx - px, dy = qy - py;
  for (const [p, q] of [[-dx, px - (x + EDGE)], [dx, (x + 1 - EDGE) - px], [-dy, py - (y + EDGE)], [dy, (y + 1 - EDGE) - py]]){
    if (Math.abs(p) < EPS){ if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0){ if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t1 - t0 > EPS;
}
// Squares a segment passes through the inside of.
function squaresOn(px, py, qx, qy){
  const out = [];
  for (let y = Math.floor(Math.min(py, qy)) - 1; y <= Math.floor(Math.max(py, qy)); y++)
    for (let x = Math.floor(Math.min(px, qx)) - 1; x <= Math.floor(Math.max(px, qx)); x++) if (crosses(px, py, qx, qy, x, y)) out.push([x, y]);
  return out;
}
// A line running exactly along a grid line passes the edge of what's beside it — unless there is solid wall on
// both sides, which is a seam through the middle of a wall, not an edge.
function seam(px, py, qx, qy, wall){
  if (py === qy && Number.isInteger(py)){ for (let x = Math.min(px, qx); x < Math.max(px, qx); x++) if (wall(x, py - 1) && wall(x, py)) return true; }
  if (px === qx && Number.isInteger(px)){ for (let y = Math.min(py, qy); y < Math.max(py, qy); y++) if (wall(px - 1, y) && wall(px, y)) return true; }
  return false;
}
export const COVER = { none:0, half:2, three:5, total:Infinity };
const RANK = ['none', 'half', 'three', 'total'];
/* The cover a target has from an attacker (or from an area's origin: pass a 1-square "creature" there).
   → { cover:'none'|'half'|'three'|'total', ac:0|2|5, lines:[[x0,y0,x1,y1,blocked]…] (the best corner's lines, for drawing) }
   creatures:false ignores creatures in the way (areas spread past people). */
export function coverOf(att, tg, { creatures = true, tokens = state.tokens } = {}){
  const f = state.floors[tg.floor], as = att.size || 1, ts = tg.size || 1;
  const wall = (x, y) => x < 0 || y < 0 || x >= f.W || y >= f.H || !passSight(f, y * f.W + x);
  const occ = creatures ? new Set(tokens.filter(o => o.floor === tg.floor && !o.dead && !o.flags?.gone && o.id !== att.id && o.id !== tg.id)
    .flatMap(o => { const out = []; for (let dy = 0; dy < (o.size || 1); dy++) for (let dx = 0; dx < (o.size || 1); dx++) out.push(`${o.x + dx},${o.y + dy}`); return out; })) : new Set();
  let best = null;
  for (let ay = att.y; ay <= att.y + as; ay++) for (let ax = att.x; ax <= att.x + as; ax++){
    for (let sy = tg.y; sy < tg.y + ts; sy++) for (let sx = tg.x; sx < tg.x + ts; sx++){
      let walls = 0, people = false; const lines = [];
      for (const [cx, cy] of [[sx, sy], [sx + 1, sy], [sx, sy + 1], [sx + 1, sy + 1]]){
        const hit = squaresOn(ax, ay, cx, cy).filter(([x, y]) => !(x >= att.x && x < att.x + as && y >= att.y && y < att.y + as) && !(x >= tg.x && x < tg.x + ts && y >= tg.y && y < tg.y + ts));
        const w = hit.some(([x, y]) => wall(x, y)) || seam(ax, ay, cx, cy, wall), p = !w && hit.some(([x, y]) => occ.has(`${x},${y}`));
        if (w) walls++; if (p) people = true;
        lines.push([ax, ay, cx, cy, w ? 2 : p ? 1 : 0]);
      }
      const c = walls >= 4 ? 'total' : walls >= 3 ? 'three' : walls >= 1 ? 'half' : people ? 'half' : 'none';
      if (!best || RANK.indexOf(c) < RANK.indexOf(best.cover)) best = { cover:c, lines };
      if (best.cover === 'none') return { ...best, ac:0 };
    }
  }
  return { ...best, ac:COVER[best.cover] === Infinity ? 0 : COVER[best.cover] };
}
export const coverLabel = c => ({ half:'half cover (+2 AC)', three:'three-quarters cover (+5 AC)', total:'total cover' })[c] || '';

/* ---------- areas ---------- */
// The shape of a spell's area: { shape, size (squares), range (squares, 0 = from the caster) } or null.
export function areaOf(sp){
  if (!sp?.area) return null;
  const [shape, ft] = sp.area;
  return { shape, size:Math.max(1, sq(ft)), range:spellReach(sp) };
}
const centre = t => ({ x:t.x + (t.size || 1) / 2, y:t.y + (t.size || 1) / 2 });
const snap8 = (dx, dy) => { const k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)); return [Math.round(Math.cos(k * Math.PI / 4)), Math.round(Math.sin(k * Math.PI / 4))]; };
/* The squares an area covers when `caster` aims it at square `aim`. → { squares:Set<index>, origin:{x,y}, ok, why }
   ok:false when the point is out of range or out of sight (the squares are still worked out, for the preview). */
export function areaSquares(caster, area, aim){
  const f = state.floors[caster.floor], out = new Set(), W = f.W;
  const self = area.range === 0 || area.shape === 'aura', c = centre(caster), s = caster.size || 1;
  const inCaster = (x, y) => x >= caster.x && x < caster.x + s && y >= caster.y && y < caster.y + s;
  const open = (x, y) => x >= 0 && y >= 0 && x < W && y < f.H && walk(f.grid[y * W + x]);
  let ok = true, why = '';
  if (!self){
    const d = gap(caster.x, caster.y, s, aim.x, aim.y, 1);
    if (d > area.range){ ok = false; why = `out of range (${area.range * FT} ft.)`; }
    else if (!canSee(f, caster.x, caster.y, aim.x, aim.y)){ ok = false; why = 'out of sight'; }
  }
  const origin = self ? c : { x:aim.x + .5, y:aim.y + .5 };
  const reaches = (x, y) => lineClear(f, origin.x, origin.y, x + .5, y + .5);
  const add = (x, y) => { if (open(x, y) && reaches(x, y)) out.add(y * W + x); };
  const R = area.size;
  // the way it points (cones, lines, cubes from the caster, walls): from the caster's middle to the aimed square
  let vx = aim.x + .5 - c.x, vy = aim.y + .5 - c.y; const vl = Math.hypot(vx, vy) || 1;
  if (Math.hypot(vx, vy) < .01){ vx = 1; vy = 0; } else { vx /= vl; vy /= vl; }
  const box = (x0, y0, x1, y1, fn) => { for (let y = Math.max(0, y0); y <= Math.min(f.H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) fn(x, y); };
  switch (area.shape){
    case 'sphere': case 'cylinder':
      box(Math.floor(origin.x - R - 1), Math.floor(origin.y - R - 1), Math.ceil(origin.x + R), Math.ceil(origin.y + R), (x, y) => { if (Math.hypot(x + .5 - origin.x, y + .5 - origin.y) <= R + .01) add(x, y); });
      break;
    case 'aura':
      box(caster.x - R, caster.y - R, caster.x + s - 1 + R, caster.y + s - 1 + R, (x, y) => { if (!inCaster(x, y)) add(x, y); });
      break;
    case 'cube': {
      let x0, y0;
      if (self){
        const [dx, dy] = snap8(vx, vy);
        x0 = dx > 0 ? caster.x + s : dx < 0 ? caster.x - R : caster.x + Math.floor((s - R) / 2);
        y0 = dy > 0 ? caster.y + s : dy < 0 ? caster.y - R : caster.y + Math.floor((s - R) / 2);
      } else { x0 = aim.x - Math.floor((R - 1) / 2); y0 = aim.y - Math.floor((R - 1) / 2); }
      box(x0, y0, x0 + R - 1, y0 + R - 1, (x, y) => { if (!inCaster(x, y)) add(x, y); });
      break;
    }
    case 'cone': case 'line': {
      if (!self && area.shape === 'line'){
        // a wall (Wall of Fire): straight through the aimed square, across the way the caster is looking
        const wx = -vy, wy = vx, half = R / 2;
        box(Math.floor(origin.x - half - 1), Math.floor(origin.y - half - 1), Math.ceil(origin.x + half + 1), Math.ceil(origin.y + half + 1), (x, y) => {
          const px = x + .5 - origin.x, py = y + .5 - origin.y, along = px * wx + py * wy, across = Math.abs(px * vx + py * vy);
          if (Math.abs(along) <= half + .01 && across <= .55 && open(x, y)) out.add(y * W + x);
        });
        break;
      }
      box(Math.floor(c.x - R - 1), Math.floor(c.y - R - 1), Math.ceil(c.x + R + 1), Math.ceil(c.y + R + 1), (x, y) => {
        if (inCaster(x, y)) return;
        const px = x + .5 - c.x, py = y + .5 - c.y, along = px * vx + py * vy, perp = Math.abs(px * vy - py * vx);
        if (along <= 0 || along > R + .01) return;
        if (area.shape === 'cone' ? perp <= along / 2 + .25 : perp <= .55) add(x, y);
      });
      break;
    }
  }
  return { squares:out, origin, ok, why };
}
/* Who an area catches: anyone with a square of their space in it. An aura spares the caster's side (Spirit
   Guardians and Word of Radiance choose their targets); nothing else spares anyone — mind the Fireball. */
export function caughtIn(caster, area, squares, tokens = state.tokens){
  const f = state.floors[caster.floor];
  return tokens.filter(t => {
    if (t.floor !== caster.floor || t.dead || t.flags?.gone) return false;
    if (area.shape === 'aura' && (t.id === caster.id || side(t) === side(caster))) return false;
    for (let dy = 0; dy < (t.size || 1); dy++) for (let dx = 0; dx < (t.size || 1); dx++) if (squares.has((t.y + dy) * f.W + t.x + dx)) return true;
    return false;
  });
}
// The cover a creature has from an area's origin (for its Dexterity save: +2 or +5). Creatures don't shield.
export function coverFromOrigin(L, origin, t){
  const from = { floor:L, x:Math.min(Math.floor(origin.x), state.floors[L].W - 1), y:Math.floor(origin.y), size:1, id:'·origin' };
  return coverOf(from, t, { creatures:false });
}
