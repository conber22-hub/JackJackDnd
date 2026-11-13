/* 🗡 THE WANDERER's director — the rules the game keeps when there is no DM: one hero (and whoever they talk into
   coming along) walking Barovia, with the Dark Powers deciding what comes out of the fog. Pure, no DOM: game/wander.js
   asks it, and does what it says with the app's own actions.
     · ambushes on the road: quiet for a while after a fight or an arrival, then more likely with every step, at night
       and under his Gaze; the first one on a new hero's first road is never far off, and never more than they can take
     · who comes: a pack built from the encounter budget (engine/encounter.js) out of the road's own creatures
     · winning a companion over: the hero's best of two skills against the companion's number, on a d20 the game rolls
     · followers: each walks to where the one ahead of them stood
     · the end of a stretch of road: its way on, or the far end from where it came in */
import { buildEncounter, xpOf } from './encounter.js';
import { walk } from './tiles.js';

export const QUIET_STEPS = 10;   // after a fight, an arrival or a new stretch: this many steps of nothing at all

export function newWander({ heroId, seed }){
  return { v:1, heroId, seed:String(seed || 'wander'), party:[], met:{}, quiet:0, ambushes:0, fights:0, xp:0, seen:[] };
}

// The chance, this step, that something comes out of the trees.
export function ambushChance({ quiet = 0, gaze = 1, night = false, ambushes = 0 } = {}){
  if (quiet < QUIET_STEPS) return 0;
  if (!ambushes && quiet >= 40) return 1;   // a new hero's first road: something comes before long
  return Math.min(.25, .015 + Math.max(0, gaze - 1) * .01 + (night ? .02 : 0) + Math.max(0, quiet - QUIET_STEPS) * .001);
}

// How hard, and out of which creatures: the first fight is gentle, the Count's attention makes later ones worse.
export const ROADSIDE = ['wolf', 'barovian-wolf', 'dire-wolf', 'swarm-of-bats', 'zombie', 'skeleton', 'ghoul', 'scarecrow', 'count-s-wolf', 'bloomed-wolf', 'werewolf', 'wight'];
const BY_NIGHT = ['zombie', 'skeleton', 'ghoul', 'wight'];   // the dead walk the road by day only when he is watching hard
export function ambushDifficulty({ ambushes = 0, gaze = 1 } = {}, rng = Math.random){
  if (!ambushes) return 'low';
  if (gaze >= 4 && rng() < .4) return 'high';
  return rng() < .5 ? 'low' : 'moderate';
}
/* best: the bestiary (BEST) → { difficulty, group:[{ bid, n }], xp }. levels: the party's. A pack nobody could
   build (a level the road's creatures can't fill) falls back to two wolves, which every road has. */
export function planAmbush(best, { levels = [1], gaze = 1, ambushes = 0, night = false, bloom = false } = {}, rng = Math.random){
  const difficulty = ambushDifficulty({ ambushes, gaze }, rng);
  const ids = ROADSIDE.filter(id => best[id] && (bloom || id !== 'bloomed-wolf') && (night || !BY_NIGHT.includes(id) || gaze >= 3));
  const list = ids.map(id => ({ ...best[id], id, fam:'road' }));
  const e = buildEncounter(list, { levels, difficulty, gaze, fam:'road', rng });
  const group = e.group.length ? e.group : best.wolf ? [{ bid:'wolf', n:2 }] : [];
  return { difficulty, group, xp:group.reduce((s, g) => s + xpOf(best[g.bid]) * g.n, 0) };
}

/* Winning a companion over. skills: the hero's (engine/hero.js heroStats().skills); d20: the roll.
   → { ok, skill, bonus, total, dc } (a 20 always works; a companion with no check just comes) */
export function recruitRoll(c, skills = {}, d20 = 10){
  const ch = c?.check; if (!ch) return { ok:true, skill:null, bonus:0, total:d20, dc:0 };
  const opts = [ch.skill, ch.alt].filter(Boolean).map(s => [s, +skills[s] || 0]).sort((a, b) => b[1] - a[1]);
  const [skill, bonus] = opts[0], total = d20 + bonus;
  return { ok:d20 === 20 || total >= ch.dc, skill, bonus, total, dc:ch.dc };
}

// Where each follower walks: the k-th to where the hero stood k steps ago (trail: newest first).
export const followSpot = (trail, k) => trail[Math.min(k, trail.length - 1)] || null;
// The trail after the hero steps from `from` (kept as long as the party).
export const pushTrail = (trail, from, n) => [from, ...trail.filter(p => p.x !== from.x || p.y !== from.y)].slice(0, Math.max(1, n));

/* Where a stretch of road ends: its way on (down), or else the open square farthest (by walking) from where it comes
   in (up, or the first room). f: a floor → { x, y } | null */
export function roadEnd(f){
  if (!f?.grid) return null;
  if (f.down) return { x:f.down.x, y:f.down.y };
  const start = f.up || (f.rooms?.[0] && { x:f.rooms[0].cx, y:f.rooms[0].cy }); if (!start) return null;
  const { W, H, grid } = f, dist = new Int32Array(W * H).fill(-1), q = [start.y * W + start.x];
  if (!walk(grid[q[0]])) return null;
  dist[q[0]] = 0; let far = q[0];
  for (let h = 0; h < q.length; h++){ const i = q[h], x = i % W, y = (i / W) | 0;
    if (dist[i] > dist[far]) far = i;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = x + dx, ny = y + dy, j = ny * W + nx;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || dist[j] >= 0 || !walk(grid[j])) continue; dist[j] = dist[i] + 1; q.push(j); } }
  return { x:far % W, y:(far / W) | 0 };
}

// The next foe to aim at: list sorted nearest first; dir 1 or -1 from the current one.
export function cycleTarget(list, currentId, dir = 1){
  if (!list.length) return null;
  const k = list.findIndex(t => t.id === currentId);
  return list[k < 0 ? 0 : (k + dir + list.length) % list.length];
}

// Is the whole party down (nobody left standing)?
export const partyDown = members => members.length > 0 && members.every(t => !t || t.dead || t.hp <= 0 || t.flags?.gone);
