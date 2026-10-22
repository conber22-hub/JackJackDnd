/* MAPS — the campaign's library of maps. Every map the DM has built (a session's dungeon, a place in the Valley,
   a stretch of road, a delve from the generator) is kept in state.campaign.maps when the table moves on, with
   its fog, its doors, its furniture and whoever was left there, so going back finds it as the party left it.
   The party (heroes and the NPCs travelling with them) belongs to no map: it moves with the table.
   Pure: works on plain objects (game/maps.js does the switching, the scene and the players). */
import { passMove } from './grid.js';

// Who travels with the party between maps: every hero, and NPCs unless the DM has told them to stay put (🚩).
export const isTraveller = t => t.kind === 'pc' || (t.kind === 'npc' && !t.flags?.stay);

export const packFloor = f => ({ ...f, grid:f.grid.join(''), base:f.base ? f.base.join('') : null });
export const unpackFloor = f => ({ ...f, grid:[...String(f.grid)].map(Number), base:f.base ? [...String(f.base)].map(Number) : null });

/* A map, ready to shelve: its floors, its fog, the creatures that live there (not the party), and where the
   party stood when it left (to come back to the same spot). JSON-safe. */
export function packMap(s, kind = 'delve'){
  const party = s.tokens.filter(isTraveller), lead = party.find(t => !t.dead && !t.flags?.gone) || party[0];
  return JSON.parse(JSON.stringify({
    id:s.meta.mapId, key:s.meta.key || null, kind:s.meta.kind || kind, name:s.meta.name, meta:s.meta,
    floors:s.floors.map(packFloor),
    explored:Object.fromEntries(Object.entries(s.explored || {}).map(([k, v]) => [k, [...v]])),
    tokens:s.tokens.filter(t => !isTraveller(t)),
    left:lead ? { floor:lead.floor, x:lead.x, y:lead.y } : s.meta.left || null,
    savedAt:Date.now(),
  }));
}

/* Where the party comes in: where it left from (a map it's been to), else the way in (the stairs up or the
   road's start), else the middle of the first room. → { floor, x, y } */
export function arrivalAnchor(entryOrState){
  const e = entryOrState, left = e.left || e.meta?.left;
  if (left && e.floors?.[left.floor]) return { ...left };
  const f = e.floors?.[0]; if (!f) return { floor:0, x:0, y:0 };
  const way = f.up || f.exits?.up;
  if (way && Number.isFinite(way.x)) return { floor:0, x:way.x, y:way.y };
  const r = f.rooms?.[0]; return r ? { floor:0, x:r.cx ?? (r.x + (r.w >> 1)), y:r.cy ?? (r.y + (r.h >> 1)) } : { floor:0, x:f.W >> 1, y:f.H >> 1 };
}

/* Squares for the party around an anchor, nearest first (by walking, so nobody lands on the far side of a
   wall): open floor, not furniture you can't stand in, nobody there. The anchor itself goes to the leader.
   occupied(x, y) → true if someone is standing there. → [{ x, y }] one per traveller, as many as fit. */
export function arrivalSpots(f, at, n, occupied = () => false){
  const W = f.W, inside = (x, y) => x >= 0 && y >= 0 && x < W && y < f.H;
  // the anchor may be in a wall or off the map: start from the nearest open square instead
  let start = inside(at.x, at.y) && passMove(f, at.y * W + at.x) ? at.y * W + at.x : -1;
  for (let r = 1; start < 0 && r < Math.max(W, f.H); r++)
    for (let dy = -r; dy <= r && start < 0; dy++) for (let dx = -r; dx <= r && start < 0; dx++){ const x = at.x + dx, y = at.y + dy; if (inside(x, y) && passMove(f, y * W + x)) start = y * W + x; }
  if (start < 0) return [];
  const out = [], seen = new Set([start]), q = [start], ok = i => !occupied(i % W, (i / W) | 0);
  for (let h = 0; h < q.length && out.length < n; h++){
    const i = q[h];
    if (ok(i)) out.push({ x:i % W, y:(i / W) | 0 });
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){
      const x = (i % W) + dx, y = ((i / W) | 0) + dy, j = y * W + x;
      if (!inside(x, y) || seen.has(j) || !passMove(f, j)) continue;
      seen.add(j); q.push(j);
    }
  }
  return out;
}

// Roads pile up (one map per journey): keep the last few, oldest go first. → ids removed
export function trimRoads(lib, keep = 3){
  const roads = Object.values(lib).filter(e => e.kind === 'road').sort((a, b) => b.savedAt - a.savedAt);
  const gone = roads.slice(keep).map(e => e.id);
  for (const id of gone) delete lib[id];
  return gone;
}
// The library as a list for the panel: newest first, the kinds grouped by a label.
export const KIND_LABEL = { session:'Session', place:'Valley place', road:'Road', delve:'Delve', imported:'Imported', blank:'Hand-built' };
export const libraryList = lib => Object.values(lib || {}).sort((a, b) => b.savedAt - a.savedAt);
