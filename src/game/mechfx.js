/* ⚙ THE CALLINGS' FEATURES, IN A FIGHT — engine/mech.js reads each feature's `mech`, pure; this gathers the moment it's
   read against (is the bearer raging, bloodied, alone, beside an ally, striking something of the Seep…) and keeps
   what a token carries: t.mechs (its features' mechs, each with src, its name), t.ward (⛨) and t.thp (temporary
   hit points). game/rules.js and game/combat.js call in here; the Calling's data (ChatGPT's data/callings.js) gives
   the mechs (game/heroes.js applyMechs). */
import { state } from '../engine/state.js';
import { mechWard, mechResources, amountOf, seepCosts, tempGive } from '../engine/mech.js';

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
  // the ones you use become resources (kept counts where they were already there)
  const ctx = mechCtx(t), rs = mechResources(t.mechs, ctx);
  t.resources = [...(t.resources || []).filter(r => r.use !== 'mech'), ...rs]; t.res ||= {};
  for (const r of rs) if (t.res[r.id] == null || t.res[r.id] > r.max) t.res[r.id] = r.max;
  const w = mechWard(t.mechs, ctx);
  if (!w || !(w.max > 0)) delete t.ward;
  else if (t.ward?.max !== w.max) t.ward = { max:w.max, now:w.max, hit:false };
  return t;
}

/* Using one (game/resources.js useFeature, use 'mech'): → the card's lines, or null when it can't. heal(t, n) is passed
   in (game/combat.js's, so its bus and checks run). And its price, if it's Seep-touched: hit point maximum gone until a
   long rest (t.seepDrain), or a mark of the rot (t.seepMarks), which the faithful can see. */
export function runMech(t, m, target, heal){
  const ctx = mechCtx(t), lines = [];
  if (m.k === 'heal'){
    const to = target || t; if (to.dead && to.kind === 'monster') return null;
    const n = Math.max(1, amountOf(m.amount || '1d8', ctx)); heal(to, n);
    lines.push(`${to === t ? '' : `${to.name} `}<b>+${n} HP</b> (${to.hp}/${to.maxHp})`);
  } else if (m.k === 'tempHp'){
    const n = amountOf(m.amount || '1d6', ctx); t.thp = tempGive(t.thp, n);
    lines.push(`<b>${t.thp} temporary hit points</b>`);
  } else return null;
  for (const c of seepCosts(m, ctx)){
    if (c.what === 'maxHp'){ const n = Math.min(c.n, Math.max(0, t.maxHp - 1)); t.seepDrain = (t.seepDrain || 0) + n; t.maxHp -= n; t.hp = Math.min(t.hp, t.maxHp);
      lines.push(`<span class="fam-seep">The rot takes its price: hit point maximum −${n} until a long rest.</span>`); }
    else { t.seepMarks = (t.seepMarks || 0) + c.n; lines.push(`<span class="fam-seep">The rot spreads under the skin (${t.seepMarks} mark${t.seepMarks === 1 ? '' : 's'}).</span>`); }
  }
  return lines;
}
// A long rest gives back what the rot drained
export function restoreDrain(t){ if (t?.seepDrain > 0){ t.maxHp += t.seepDrain; delete t.seepDrain; } }
