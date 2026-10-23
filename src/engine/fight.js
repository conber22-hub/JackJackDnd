/* FIGHTS — who's in one, the initiative order, and when it's won. Pure (game/combat.js rolls and runs it).
   Who's in: the party on that floor, and the creatures that are part of it — ones the party can see, ones close
   to them (12 squares), and ones already alerted. The rest of the floor (the far crypt, the villagers across
   town) stays out unless the DM ticks them in.
   2024 rules: initiative is a Dexterity check; a surprised creature rolls it at disadvantage. Identical
   creatures can share one roll (grouped), which keeps a pack of wolves acting together. */
import { CR_XP } from './encounter.js';
import { cheb } from '../util/core.js';

const party = t => t.kind !== 'monster';
const up = t => !t.dead && !t.flags?.gone;
export const NEAR = 12;

// → [{ t, in, why }] for everyone standing on floor L. seen: the squares the party can see now (Set of indexes).
export function fightCandidates(tokens, L, W, seen = new Set()){
  const here = tokens.filter(t => t.floor === L && up(t)), heroes = here.filter(party);
  return here.map(t => {
    if (party(t)) return { t, in:true, why:t.kind === 'pc' ? 'hero' : 'ally' };
    const sz = t.size || 1; let visible = false;
    for (let dy = 0; dy < sz && !visible; dy++) for (let dx = 0; dx < sz && !visible; dx++) if (seen.has((t.y + dy) * W + t.x + dx)) visible = true;
    const near = heroes.some(h => cheb(h.x, h.y, t.x, t.y) <= NEAR);
    if (visible) return { t, in:true, why:'in sight' };
    if (near) return { t, in:true, why:'close by' };
    if (t.flags?.alert) return { t, in:true, why:'alerted' };
    return { t, in:false, why:heroes.length ? 'far off' : 'no party here' };
  });
}

/* Roll initiative. list: the tokens in the fight. group: identical creatures (same bid) share a roll.
   surprise: 'party' or 'foes' — that side rolls at disadvantage. d20: the die (a function, for tests).
   fixed: { id: d20 } dice already rolled at the table (real dice), used as they are.
   → [{ id, roll, die }] best first; ties go to the better bonus, then the heroes. */
export function rollOrder(list, { group = true, surprise = 'none', d20, fixed = {} } = {}){
  const shared = new Map(), out = [];
  for (const t of list){
    const side = party(t) ? 'party' : 'foes', dis = surprise === side;
    const key = group && t.kind === 'monster' && t.bid ? t.bid : null;
    let die = Number.isInteger(fixed[t.id]) && fixed[t.id] >= 1 && fixed[t.id] <= 20 ? fixed[t.id] : key && shared.get(key);   // fixed: a die rolled at the table
    if (die === undefined || die === null){ const a = d20(), b = dis ? d20() : a; die = Math.min(a, b); if (key) shared.set(key, die); }
    out.push({ id:t.id, die, roll:die + (t.init || 0), init:t.init || 0, foe:!party(t), bid:t.bid || '' });
  }
  out.sort((a, b) => b.roll - a.roll || b.init - a.init || a.foe - b.foe || a.bid.localeCompare(b.bid));
  return out;
}

// Is the fight over? Every creature that came against the party is down (and there was at least one).
export function fightWon(order, byId){
  const foes = order.map(byId).filter(t => t && t.kind === 'monster');
  return foes.length > 0 && foes.every(t => (t.dead && !t.flags?.rising) || t.flags?.gone);
}
// XP for the creatures beaten in it (split among the heroes by the DM).
export const fightXp = (order, byId, BEST) => order.map(byId).filter(t => t && t.kind === 'monster' && t.dead).reduce((s, t) => s + (CR_XP[String(BEST[t.bid]?.cr)] ?? 0), 0);
