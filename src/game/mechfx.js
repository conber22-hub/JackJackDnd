/* ⚙ THE CALLINGS' FEATURES, IN A FIGHT — engine/mech.js reads each feature's `mech`, pure; this gathers the moment it's
   read against (is the bearer raging, bloodied, alone, beside an ally, striking something of the Seep…) and keeps
   what a token carries: t.mechs (its features' mechs, each with src, its name), t.ward (⛨) and t.thp (temporary
   hit points). game/rules.js and game/combat.js call in here; the Calling's data (ChatGPT's data/callings.js) gives
   the mechs (game/heroes.js applyMechs). */
import { state } from '../engine/state.js';
import { mechWard } from '../engine/mech.js';

const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const side = t => t?.kind === 'monster' ? 'foe' : 'party';
const up = o => o && !o.dead && o.hp > 0 && !o.flags?.gone;
const has = (t, n) => (t?.conds || []).some(c => c.n === n);
const seepy = t => !!t && (t.bid && /seep|bloom|husk|spore/.test(t.bid) || (t.tags || []).includes('seep') || !!t.flags?.seeded);

// The moment's flags for one token (extra: what the caller knows, e.g. { crit, firstHit, melee, vsSeep })
export function mechCtx(t, extra = {}){
  if (!t) return { ...extra };
  const others = (state?.tokens || []).filter(o => o !== t && o.floor === t.floor && up(o));
  const near = others.filter(o => cheb(o, t) <= 1);
  const allyNear = near.some(o => side(o) === side(t)), foesNear = near.some(o => side(o) !== side(t));
  const lvl = +(String(t.cls || '').match(/(\d+)/)?.[1]) || +t.lvl || 1;
  return { lvl, ab:t.ab || null, mods:t.mods || null,
    raging:has(t, 'raging'), bloodied:t.hp > 0 && t.hp <= (t.maxHp || 1) / 2, hpLow:t.hp > 0 && t.hp <= (t.maxHp || 1) / 4,
    allyNear, alone:!others.some(o => side(o) === side(t) && cheb(o, t) <= 6), foesNear,
    wardUp:(t.ward?.now || 0) > 0, wardDown:(t.ward?.max || 0) > 0 && !(t.ward?.now > 0), ...extra };
}
export const isSeep = seepy;

/* What applies to a token right now: its own features, and what the auras of those on its side within reach give it
   (a Warden's oath, a Herald's banner: { k:'aura', radius:10, gives:{ k:'advantage', on:'save' } }; feet, 5 a square).
   The bearer stands in its own aura. An aura that's down (its bearer down) gives nothing. */
export function mechsFor(t){
  if (!t) return [];
  const own = (t.mechs || []).filter(m => m.k !== 'aura');
  const out = [...own];
  for (const o of state?.tokens || []){
    if (!o.mechs?.length || o.floor !== t.floor || !up(o) || side(o) !== side(t)) continue;
    for (const m of o.mechs){ if (m.k !== 'aura' || !m.gives) continue;
      if (cheb(o, t) * 5 > (+m.radius || 10)) continue;
      for (const g of Array.isArray(m.gives) ? m.gives : [m.gives]) out.push({ ...g, src:o === t ? (m.src || 'aura') : `${m.src || 'aura'} (${o.name})` }); }
  }
  return out;
}
export const anyMechs = t => !!t && (t.mechs?.length > 0 || (state?.tokens || []).some(o => o.mechs?.some(m => m.k === 'aura')));

// The first hit this turn? (for the features that strike once a turn) — marks it taken
export function firstHitNow(a){
  const c = state?.combat, key = c?.active ? `${c.round}:${c.idx}` : `x${Date.now() >> 12}`;
  if (a.mechHit === key) return false;
  a.mechHit = key; return true;
}

// A token's features: set them, and its Ward with them (kept as it is if the Ward is the same size)
export function applyMechs(t, mechs = []){
  t.mechs = (Array.isArray(mechs) ? mechs : []).filter(m => m && typeof m === 'object' && m.k);
  const w = mechWard(t.mechs, mechCtx(t));
  if (!w || !(w.max > 0)) delete t.ward;
  else if (t.ward?.max !== w.max) t.ward = { max:w.max, now:w.max, hit:false };
  return t;
}
