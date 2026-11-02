/* RULES — movement allowance, turn order checks, and conditions with round durations. */
import { state, ui } from '../engine/state.js';
import { CONDITIONS } from '../data/dread.js';
import { log } from '../engine/state.js';
import { BREAKS_CONC } from '../engine/spellcast.js';
import { BEST } from '../data/bestiary.js';
import { applyDefenses, conditionImmune, defensesFor } from '../engine/defenses.js';
import { saveMods, speedOf, damageMods } from '../engine/conditions.js';
import { d } from '../util/core.js';

export const currentTurn = () => state.combat.active ? state.tokens.find(t => t.id === state.combat.order[state.combat.idx]) : null;
export const turnKey = () => `${state.combat.round}:${state.combat.idx}`;
export function canAct(t){ return !state.combat.active || currentTurn()?.id === t.id; }

export const hasCond = (t, n) => !!t.conds?.some(c => c.n === n);
// A creature's saving throw bonus for one ability (heroes from the creator have all six; others use one number).
export const saveBonus = (t, ab) => t.saves?.[String(ab).slice(0, 3).toLowerCase()] ?? t.saveMod ?? 0;
/* DEFENCES — what a creature resists, shrugs off or fears (engine/defenses.js reads them from its stat block),
   plus what it has on right now: Rage gives resistance to bludgeoning, piercing and slashing. */
const PHYS_TYPES = ['bludgeoning', 'piercing', 'slashing'];
const statDefs = new WeakMap();   // per bestiary entry (an edited creature is a new entry, so it's read afresh)
export function defencesOf(t){
  const b = BEST[t?.bid];
  let d = b ? statDefs.get(b) : null;
  // (its SRD stat block if the entry links one, else its own def, else its traits: engine/defenses.js defensesFor)
  if (b && !d) statDefs.set(b, d = defensesFor(b));
  d ||= { resist:[], immune:[], vuln:[], condImmune:[] };
  const own = t?.def;   // set on the token by the DM (or a nemesis's strengths), on top of its kind's
  const stone = hasCond(t, 'petrified') ? damageMods(t) : null;   // petrified: resistance to everything, can't be poisoned
  if (!own && !stone && !hasCond(t, 'raging')) return d;
  const join = k => [...new Set([...(d[k] || []), ...(own?.[k] || []), ...(stone?.[k] || []), ...(k === 'resist' && hasCond(t, 'raging') ? PHYS_TYPES : [])])];
  return { resist:join('resist'), immune:join('immune'), vuln:join('vuln'), condImmune:join('condImmune') };
}
/* Damage after defences: { n, why } — why is '', 'resistant', 'immune' or 'vulnerable' (for the card). */
export function defend(t, n, type){
  const ty = String(type || '').toLowerCase();
  if (!n || !ty || ty === 'manual') return { n, why:'' };
  const [l] = applyDefenses([{ t:ty, n }], defencesOf(t)).lines;
  return { n:l.n, why:l.why };
}
export const defNote = (r, was) => r.why ? ` <span class="muted">(${r.why}${r.n !== was ? `: ${was} → ${r.n}` : ''})</span>` : '';
export const immuneTo = (t, n) => conditionImmune(defencesOf(t), n);
/* A saving throw, with what its conditions do (engine/conditions.js): paralysed, stunned, petrified and unconscious
   fail Strength and Dexterity saves outright; restrained has disadvantage on Dexterity; exhaustion takes 2 a level.
   → { r, tot, auto, note }: tot is -99 on an automatic failure; note says why, for the card */
export function saveRoll(t, ab, extra = 0){
  const m = saveMods(t, ab);
  if (m.autoFail) return { r:0, tot:-99, auto:true, note:' <span class="muted">(fails automatically)</span>' };
  const r1 = d(20), r2 = d(20), adv = m.adv.length > 0, dis = m.dis.length > 0;
  const r = adv && !dis ? Math.max(r1, r2) : dis && !adv ? Math.min(r1, r2) : r1;
  const bits = [...(dis && !adv ? [`disadvantage: ${m.dis.join(', ')}`] : []), ...(m.penalty ? [`exhaustion −${m.penalty}`] : [])];
  return { r, tot:r + saveBonus(t, ab) + extra - m.penalty, auto:false, note:bits.length ? ` <span class="muted">(${bits.join(' · ')})</span>` : '' };
}
export const saveTxt = S => `${S.auto ? '✗' : S.tot}${S.note}`;
/* How a condition from a spell or a creature's action ends (data/spell-effects.js and data/monster-play.js, Codex's):
   how long it lasts, the save it repeats at the end of the creature's turns, what breaks it (being hurt by the caster's
   side; for Invisibility, attacking, dealing damage or casting), and the turn it runs out on.
   → { rounds, extra } for addCond; src: who did it (a token id), save/dc: the save that was made against it */
export function timingFor(fx, { src = null, save = null, dc = null } = {}){
  if (!fx) return { rounds:1, extra:{} };
  const d = fx.dur, extra = { by:src };
  let rounds = !d ? 1 : d.unit === 'round' ? Math.max(1, d.n) : d.unit === 'minute' ? d.n * 10 : d.unit === 'hour' ? d.n * 600 : 1;
  if (fx.repeat && (fx.save || save) && dc) extra.rep = { phase:fx.repeat, save:fx.save || save, dc };
  if (fx.endsOn?.length) extra.ends = [...fx.endsOn];
  // "until the end of your next turn": it runs out on someone's turn, not by counting rounds
  if (fx.expires){ extra.exp = { phase:fx.expires.phase, who:fx.expires.who === 'source' ? src : fx.expires.who === 'current' ? currentTurn()?.id ?? src : 'self', next:!!fx.expires.next }; rounds = -1; }
  return { rounds, extra };
}
// force: the DM added it by hand, so it goes on even if the creature is immune. extra: its timing (timingFor). → whether it took hold
export function addCond(t, n, rounds = 1, src, force = false, extra = null){
  t.conds ||= [];
  if (!force && immuneTo(t, n)){ log(`${t.name} is immune to being ${n}.`); return false; }
  if (t.conc && BREAKS_CONC.has(n)) endConc(t, `is ${n}`);
  const c = t.conds.find(c => c.n === n), x = extra ? { ...extra, ...(extra.exp?.who === 'self' ? { exp:{ ...extra.exp, who:t.id } } : {}) } : null;
  if (c){ c.r = rounds < 0 || c.r < 0 ? -1 : Math.max(c.r, rounds); if (x) Object.assign(c, x); }
  else t.conds.push({ n, r:rounds, at:state.combat.active ? turnKey() : null, ...(src ? { src } : {}), ...(x || {}) });
  return true;
}
export function removeCond(t, n){ t.conds = (t.conds || []).filter(c => c.n !== n); }
/* A creature's turn starts or ends ('start' | 'end'): the saves it repeats to shake a condition off, and conditions on
   anyone that run out on this creature's turn. → lines for a card (empty: nothing happened) */
export function condPhase(t, phase){
  if (!t) return [];
  const key = turnKey(), out = [];
  for (const o of state.tokens) for (const c of [...(o.conds || [])]){
    if (c.exp?.who !== t.id || c.exp.phase !== phase) continue;
    if (c.exp.next && c.at === key) continue;   // put on during this very turn: it's the next one that counts
    removeCond(o, c.n); out.push(`${o.name} is no longer ${c.n}`);
  }
  for (const c of [...(t.conds || [])]){
    if (c.rep?.phase !== phase || t.dead) continue;
    const S = saveRoll(t, c.rep.save), ok = S.tot >= c.rep.dc;
    out.push(`${t.name} — ${String(c.rep.save).toUpperCase()} save ${saveTxt(S)} vs ${c.rep.dc}: <b>${ok ? `shakes off ${c.n}` : `still ${c.n}`}</b>`);
    if (ok) removeCond(t, c.n);
  }
  return out;
}
// Something a creature did (attack, castSpell, dealDamage) ends its own conditions that say so — Invisibility, mostly.
export function endOn(t, ev){
  const gone = (t?.conds || []).filter(c => c.ends?.includes(ev));
  for (const c of gone){ removeCond(t, c.n); log(`${t.name} is no longer ${c.n}.`); }
  return gone.length;
}
// End of a creature's own turn: tick its conditions (ones applied during this very turn wait one more).
export function tickConds(t){
  if (!t?.conds?.length) return;
  const key = turnKey();
  for (const c of t.conds){ if (c.at === key){ c.at = null; continue; } if (c.r > 0) c.r--; }
  t.conds = t.conds.filter(c => c.r !== 0);
}
export const stopped = t => (t.conds || []).some(c => CONDITIONS[c.n]?.stop);

// Squares a creature can still move. In a fight: its speed (twice that with the Dash) less what it has moved;
// crawling while prone costs double. dash:true asks what it would have if it took the Dash now.
export const speedSquares = t => Math.floor((t.speed || 30) / 5);
export function moveAllowance(t, { dash = false } = {}){
  if (ui.freeMove && ui.role === 'dm') return 999;
  // grappled, restrained and the like: nowhere; exhaustion: 5 ft. less a level (engine/conditions.js)
  if (speedOf(t, 999) === 0) return 0;
  let sq = Math.max(0, speedSquares(t) - Math.min(6, t.exhaustion || 0));
  if (state.combat.active){ sq *= t.dashed || dash ? 2 : 1; if (hasCond(t, 'prone')) sq = Math.floor(sq / 2); return Math.max(0, sq - (t.moved || 0)); }
  if (hasCond(t, 'prone')) sq = Math.floor(sq / 2);
  return Math.max(sq, 6) * 4;   // exploration pace outside combat
}

/* Concentration (engine/spellcast.js): t.conc = { n:spell } while a creature holds one. Ending it lifts the
   conditions that spell laid on anyone (src 'conc:<caster id>') and the sustained effect, if it was that one. */
// A fresh casting: whatever it held before ends first, even the same spell (a second Hold Person frees the first
// target). Using a sustained spell again on a later turn (Spiritual Weapon, Moonbeam) isn't a fresh casting: callers skip it.
export function startConc(t, name){
  if (t.conc) endConc(t, `starts concentrating on ${name}`);
  t.conc = { n:name };
}
export function endConc(t, why = ''){
  if (!t?.conc) return null;
  const n = t.conc.n, src = `conc:${t.id}`;
  t.conc = null;
  for (const o of state.tokens) if (o.conds?.some(c => c.src === src)) o.conds = o.conds.filter(c => c.src !== src);
  if (t.sustain === n) t.sustain = null;
  log(`🌀 ${t.name} ${why ? `${why} — ` : ''}${n} ends.`);
  return n;
}
