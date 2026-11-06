/* THE GARRISON AND THE HOARDS AT THE TABLE — Codex's engine/garrison.js and engine/hoard.js on a planned site.
   - Stock the site (Maps tab): the plan's fights become creatures in their rooms, each group with its posture (on
     guard, asleep, in its lair, at a ritual, on patrol). f.garrison holds the garrison's state; each creature's token
     carries its group (t.garrison).
   - When a fight starts on a stocked floor, the noise spreads along the floor's ways (doors muffle it, secret ones
     more): the DM gets a card saying who heard, who's coming and when, with a button to bring the arrivals in.
     When the fight ends the garrison calms, warier than before.
   - Hoards: each room the plan gives treasure has a hoard (made when the floor is planned: engine/generator.js), its
     keys too. The DM gives a room's hoard to the party from its card: the coins shared out, the things into the
     packs. Taking the Count's own marked item raises his Gaze. */
import { state, ui, log, tokById, makeMonster } from '../engine/state.js';
import { stock, raise, calm } from '../engine/garrison.js';
import { split, value } from '../engine/hoard.js';
import { siteGraph } from '../engine/sitegraph.js';
import { BEST, bestList } from '../data/bestiary.js';
import { freeFootprint, roomAt, roomById } from '../engine/generator.js';
import { buildFloor } from '../render/floors.js';
import { syncTokens } from '../render/minis.js';
import { toast, showCard } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { changed, snapshot } from './session.js';
import { addToInit } from './combat.js';
import { setDread } from './actions.js';
import { uid, esc } from '../util/core.js';

const partyLevels = () => { const pcs = state.tokens.filter(t => t.kind === 'pc' && !t.dead); return pcs.length ? pcs.map(t => t.level || 1) : [3, 3, 3, 3]; };
const groupTokens = (L, id) => state.tokens.filter(t => t.floor === L && t.garrison === id && !t.dead);
const roomName = (f, id) => roomById(f, id)?.name || 'a room';

// Stock the site: its fights become creatures in their rooms. → how many creatures were placed
export function stockSite(L){
  const f = state.floors[L]; if (!f?.site){ toast('This floor has no site plan to stock.'); return 0; }
  if (f.garrison){ toast('The site is already stocked.'); return 0; }
  snapshot('stock the site');
  const g = siteGraph(f); g.doors = (f.doors || []).map(d => ({ id:d.id, state:d.state }));
  const gs = stock(f.site, g, { list:bestList(), levels:partyLevels(), gaze:state.dread || 1, rng:Math.random });
  const taken = new Set(state.tokens.filter(t => t.floor === L).map(t => t.y * f.W + t.x));
  let n = 0;
  for (const grp of gs.groups){
    const r = roomById(f, grp.room); if (!r) continue;
    for (const m of grp.members) for (let k = 0; k < m.n; k++){
      const b = BEST[m.b]; if (!b) continue;
      const spot = freeFootprint(f, r, b.size || 1, taken, Math.random); if (!spot) continue;
      const t = makeMonster(m.b, L, spot.x, spot.y); t.garrison = grp.id; state.tokens.push(t); n++;
      for (let dy = 0; dy < (b.size || 1); dy++) for (let dx = 0; dx < (b.size || 1); dx++) taken.add((spot.y + dy) * f.W + spot.x + dx);
    }
  }
  f.garrison = gs;
  log(`⚔ ${f.site.name} stocked: ${n} creatures in ${gs.groups.length} groups.`, true);
  buildFloor(L); syncTokens(); changed(); renderPanel();
  return n;
}

// A fight breaks out at (x, y): the garrison hears it. The DM is told who's coming, and can bring them in.
export function alarmAt(L, x, y, loud = 3){
  const f = state.floors[L]; if (!f?.garrison) return null;
  const r = roomAt(f, x, y) || nearestRoomTo(f, x, y); if (!r) return null;
  // (each group's strength now, from its living creatures, so the beaten flee)
  for (const g of f.garrison.groups){ const ts = state.tokens.filter(t => t.floor === L && t.garrison === g.id);
    if (ts.length) g.hpFraction = ts.reduce((s, t) => s + (t.dead ? 0 : Math.max(0, t.hp) / Math.max(1, t.maxHp)), 0) / ts.length; }
  f.garrison.graph.doors = (f.doors || []).map(d => ({ id:d.id, state:d.state }));
  const s = raise(f.garrison, { room:r.id, loud, round:f.garrison.round || 0 }); f.garrison = s;
  const moves = s.moves;
  if (!moves.length){ log(`🔔 The fight in ${r.name} goes unheard.`, true); changed(); return s; }
  const lines = moves.map(m => {
    const who = groupTokens(L, m.group)[0]?.name || 'A group';
    if (m.kind === 'wait') return `👁 ${esc(who)} in ${esc(roomName(f, m.from))} hold back: ${esc(m.why)}`;
    if (m.kind === 'runner') return `🏃 A runner from ${esc(roomName(f, m.from))} to ${esc(roomName(f, m.to))}: there in ${m.arrives - (s.round || 0)} round(s).`;
    return `⚔ ${esc(who)} from ${esc(roomName(f, m.from))} → ${esc(roomName(f, m.to))}, in ${m.arrives - (s.round || 0)} round(s). <span class="muted">${esc(m.why)}</span>`;
  });
  const coming = moves.filter(m => m.kind === 'group' && m.to !== m.from);
  if (coming.length) lines.push(`<button class="btn small primary" data-act="garrisonArrive">⚔ Bring them in now</button>`);
  showCard({ kind:'bad', title:'🔔 The site hears the fight', sub:r.name, lines }, false);   // (the DM's alone)
  log(`🔔 The fight in ${r.name} is heard: ${coming.length} group(s) coming.`, true);
  changed();
  return s;
}
const nearestRoomTo = (f, x, y) => f.rooms.reduce((a, r) => !a || Math.abs(r.cx - x) + Math.abs(r.cy - y) < Math.abs(a.cx - x) + Math.abs(a.cy - y) ? r : a, null);

// The groups on their way arrive: their creatures step in at the room's edge and join the fight.
export function garrisonArrive(L = ui.floor){
  const f = state.floors[L]; if (!f?.garrison) return 0;
  const taken = new Set(state.tokens.filter(t => t.floor === L && !t.dead).map(t => t.y * f.W + t.x)); let n = 0;
  for (const g of f.garrison.groups){
    const m = g.pending; if (!m) continue;
    const r = roomById(f, m.to); if (!r) continue;
    for (const t of groupTokens(L, g.id)){
      const spot = freeFootprint(f, r, t.size || 1, taken, Math.random); if (!spot) continue;
      taken.delete(t.y * f.W + t.x); t.x = spot.x; t.y = spot.y; taken.add(spot.y * f.W + spot.x);
      if (state.combat.active) addToInit(t); n++;
    }
    g.room = m.to; delete g.pending;
  }
  if (n){ log(`⚔ ${n} creature(s) arrive.`, true); syncTokens(); changed(); renderPanel(); }
  return n;
}
// The fight is over: the garrison calms (minutes pass), back to their posts, warier.
export function garrisonCalm(L, minutes = 10){
  const f = state.floors[L]; if (!f?.garrison) return;
  f.garrison = calm(f.garrison, minutes);
}

/* The room's hoard into the party: coins shared among the heroes on this floor (the remainder to the first), the
   things and the keys into the first hero's pack. The Count's marked item raises his Gaze. */
export function giveHoard(L, roomId){
  const f = state.floors[L], r = f && roomById(f, roomId), h = r?.hoard; if (!h || h.given) return;
  const heroes = state.tokens.filter(t => t.floor === L && t.kind === 'pc' && !t.dead && t.charId && state.characters?.[t.charId]);
  if (!heroes.length){ toast('No hero on this floor to carry it.'); return; }
  snapshot('hoard');
  const { shares, remainder } = split(h, heroes.length);
  heroes.forEach((t, i) => { const c = state.characters[t.charId]; c.coins ||= {};
    for (const [k, v] of Object.entries(shares[i])) c.coins[k] = (c.coins[k] || 0) + v + (i === 0 ? remainder[k] || 0 : 0); });
  const first = state.characters[heroes[0].charId]; first.inv ||= [];
  for (const it of [...(h.items || []), ...(h.keys || [])]) first.inv.push({ id:uid(), n:it.n || it.name, qty:it.qty || 1, equipped:false, attuned:false, ...(it.kind === 'key' ? { key:true, opens:it.opens || [] } : {}), ...(it.desc ? { note:it.desc } : {}) });
  for (const a of h.art || []) first.inv.push({ id:uid(), n:a.desc, qty:1, equipped:false, attuned:false, note:`Worth about ${a.gp} gp.` });
  h.given = true;
  const his = (h.items || []).find(it => it.counts || it.gazeOnTake);
  log(`💰 The party takes the hoard in ${r.name}: ${value(h)} gp in all.`);
  if (his){ setDread((state.dread || 1) + (his.gazeOnTake || 1)); log(`👁 ${his.n} was his. The Count notices.`, true); }
  changed(); renderPanel();
}
