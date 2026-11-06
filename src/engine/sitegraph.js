/* SITE GRAPH — a generated floor as the site planner (engine/sites.js, ChatGPT's) sees it: rooms and the ways
   between them, and then the planner's plan put into the floor. Pure: no DOM, no Three.js.
   - siteGraph(f): { rooms:[{ id, x, y, w, h, type, size }], links:[{ a, b, kind, doors:[door ids] }], up, down }
     Each open square belongs to the room whose box holds it (the nearest middle where boxes overlap, as a cavern's
     do). Two rooms are linked when a walk through the tunnels (or straight across) joins them; the link is a
     'door' when every such walk passes a door (those doors are listed), 'open' when one needn't, 'secret' when
     the only way is a secret door.
   - applySite(f, plan, g): the locks on their doors, and each room's role, faction, read-aloud, notes and clue. */
import { T, walk } from './tiles.js';

export function siteGraph(f){
  const W = f.W, N = W * f.H, own = new Int32Array(N).fill(-1), doorAt = new Map((f.doors || []).map(d => [d.i, d]));
  for (let i = 0; i < N; i++){
    if (!walk(f.grid[i]) || doorAt.has(i)) continue;
    const x = i % W, y = (i / W) | 0; let best = -1, bd = Infinity;
    for (const r of f.rooms) if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h){ const d = (r.cx - x) ** 2 + (r.cy - y) ** 2; if (d < bd){ bd = d; best = r.id; } }
    own[i] = best;
  }
  // from each room, walk the squares that belong to no room; meeting another room's square is a link
  const pair = new Map();   // 'a|b' -> { open, secretOnly, doors:Set }
  const note = (a, b, doors, secret) => {
    const k = a < b ? `${a}|${b}` : `${b}|${a}`; let e = pair.get(k);
    if (!e){ e = { a:Math.min(a, b), b:Math.max(a, b), open:false, doors:new Set(), secret:true }; pair.set(k, e); }
    if (!doors.length) e.open = true; else doors.forEach(d => e.doors.add(d));
    if (!secret) e.secret = false;
  };
  const steps = [1, -1, W, -W];
  for (const r of f.rooms){
    // (each square remembers the doors on the way to it; the first way found is kept, with a doorless way preferred)
    const seen = new Map(), q = [];
    for (let i = 0; i < N; i++) if (own[i] === r.id) for (const s of steps){ const j = i + s; if (j < 0 || j >= N || Math.abs((j % W) - (i % W)) > 1) continue;
      if (own[j] >= 0 && own[j] !== r.id) note(r.id, own[j], [], false);
      else if (own[j] < 0 && walk(f.grid[j]) && !seen.has(j)){ const d = doorAt.get(j); seen.set(j, d ? [d] : []); q.push(j); } }
    for (let n = 0; n < q.length; n++){
      const i = q[n], via = seen.get(i);
      for (const s of steps){ const j = i + s; if (j < 0 || j >= N || Math.abs((j % W) - (i % W)) > 1 || !walk(f.grid[j])) continue;
        if (own[j] >= 0){ if (own[j] !== r.id) note(r.id, own[j], via.map(d => d.id), via.some(d => d.state === 'secret')); continue; }
        const d = doorAt.get(j), next = d ? [...via, d] : via;
        if (!seen.has(j) || (seen.get(j).length > next.length)){ seen.set(j, next); q.push(j); } }
    }
  }
  const links = [...pair.values()].map(e => ({ a:e.a, b:e.b, kind:e.open ? 'open' : e.secret ? 'secret' : 'door', doors:e.open ? [] : [...e.doors] }));
  const roomOf = s => { if (!s) return null; const o = own[s.y * W + s.x]; if (o >= 0) return o;
    let best = null, bd = Infinity; for (const r of f.rooms){ const d = Math.abs(r.cx - s.x) + Math.abs(r.cy - s.y); if (d < bd){ bd = d; best = r.id; } } return best; };
  return {
    // (size is the room's box, as the planner reckons it; the top floor's way in is its first room, where the party starts)
    rooms:f.rooms.map(r => ({ id:r.id, x:r.x, y:r.y, w:r.w, h:r.h, type:r.type, size:r.w * r.h })),
    links, up:f.up ? roomOf(f.up) : f.rooms[0]?.id ?? null, down:roomOf(f.down),
  };
}

// Put a plan into the floor: locked and sealed doors (with their keys named), secret ones, and each room's part.
export function applySite(f, plan, g){
  const doors = new Map((f.doors || []).map(d => [d.id, d])), name = id => f.rooms.find(r => r.id === id)?.name || 'a room';
  for (const lock of plan.locks || []){
    const link = g.links.find(l => (l.a === lock.a && l.b === lock.b) || (l.a === lock.b && l.b === lock.a)); if (!link) continue;
    for (const id of link.doors){ const d = doors.get(id); if (!d) continue;
      if (lock.kind === 'secret') d.state = 'secret';
      else if (d.state === 'secret') continue;   // (a secret door stays secret; finding it is the lock)
      else { d.state = 'locked'; d.dc = lock.kind === 'sealed' ? 20 : 15; d.key = lock.key?.name || null; } }
  }
  for (const r of f.rooms){
    const p = plan.rooms?.[String(r.id)]; if (!p) continue;
    r.role = p.role; r.faction = p.faction || null; r.beat = p.beat || null; r.treasure = p.treasure || 0;
    if (p.encounter) r.encounter = p.encounter; else delete r.encounter;
    // a set piece keeps its own words; any other room opens with the site's line
    if (!r.vault && p.read) r.read = [p.read, r.read].filter(Boolean).join(' ');
    const clue = p.clue ? `🔎 Clue: ${p.clue.text}${p.clue.points != null ? ` (it points to ${name(+p.clue.points)}).` : ''}` : '';
    r.notes = [p.dm, clue, r.notes].filter(Boolean).join(' ');
  }
  // the planner names rooms by their part and number ("the treasury (room 4)"): give the DM the room's own name too
  const named = JSON.parse(JSON.stringify(plan).replace(/\(room (\d+)\)/g, (m, id) => `(${JSON.stringify(name(+id)).slice(1, -1)})`));
  for (const r of f.rooms){ const p = named.rooms?.[String(r.id)]; if (!p) continue;
    if (!r.vault && p.read) r.read = r.read.replace(plan.rooms[String(r.id)].read, p.read);
    r.notes = r.notes.replace(plan.rooms[String(r.id)].dm, p.dm).replace(/\(room (\d+)\)/g, (m, id) => `(${name(+id)})`); }
  f.site = named;   // (the whole plan, for the DM's page: engine/sites.js describeSite; players get only its name)
  return f;
}
