import { TIPS, COOLDOWN_MS, FIGHT_COOLDOWN_MS } from '../data/coach.js';

// Closed vocabulary: equality (scalar), eq/ne, numeric lt/lte/gt/gte,
// in (one of), includes (array membership), present (non-null). All clauses AND.
const DEFAULTS = {
  now:0, mode:'', where:'', fight:false, myTurn:false, round:0, hp:0, maxHp:0,
  down:false, conditions:[], moveLeft:0, target:null, 'target.name':'',
  'target.inReach':false, 'target.seen':false, foesSeen:0, alliesDown:0,
  hasSpells:false, slotsLeft:0, cantrips:0, hasHealing:false, potions:0,
  onStairs:'', doorNear:null, 'doorNear.open':false, 'doorNear.locked':false,
  cardUp:false, menuOpen:false, sheetOpen:false, waitingOnDM:false,
  justDid:'', idleMs:0, sessionMs:0,
};
export const CONDITION_KEYS = [...Object.keys(DEFAULTS), 'hp/maxHp'];
export const LABELS = {
  handheld:{ A:'A', B:'B', X:'X', Y:'Y', L:'L', R:'R', SELECT:'Select', START:'Start', VIEW:'View', DPAD:'the D-pad' },
  pad:{ A:'Ⓐ', B:'Ⓑ', X:'LT', Y:'Ⓨ', L:'LB', R:'RB', SELECT:'Back', START:'Start', VIEW:'right-stick click', DPAD:'the stick' },
  keys:{ A:'Space', B:'Esc', X:'G', Y:'R', L:'Shift+Tab', R:'Tab', SELECT:'I', START:'M', VIEW:'V', DPAD:'WASD' },
  touch:{ A:'tap Strike', B:'tap End turn', X:'tap Spells', Y:'tap Actions', L:'tap a foe', R:'tap a foe', SELECT:'tap Hero', START:'tap Menu', VIEW:'tap View', DPAD:'tap the ground' },
};
function value(key, snapshot){
  if (key === 'hp/maxHp'){
    const hp = snapshot.hp ?? 0, max = snapshot.maxHp ?? 0;
    return Number.isFinite(hp) && Number.isFinite(max) && max > 0 ? hp / max : null;
  }
  return key.split('.').reduce((v, k) => v && Object.hasOwn(v, k) ? v[k] : undefined, snapshot) ?? DEFAULTS[key];
}
function matches(v, rule){
  if (rule === null || typeof rule !== 'object') return v === rule;
  if (Array.isArray(rule) || !Object.keys(rule).length) return false;
  return Object.entries(rule).every(([op, n]) => {
    if (op === 'eq') return v === n;
    if (op === 'ne') return v !== n;
    if (op === 'in') return Array.isArray(n) && n.includes(v);
    if (op === 'includes') return Array.isArray(v) && v.includes(n);
    if (op === 'present') return typeof n === 'boolean' && (v !== null && v !== undefined && v !== '') === n;
    if (!Number.isFinite(v) || !Number.isFinite(n)) return false;
    if (op === 'lt') return v < n;
    if (op === 'lte') return v <= n;
    if (op === 'gt') return v > n;
    if (op === 'gte') return v >= n;
    return false;
  });
}
export function test(when, snapshot = {}){
  if (!when || typeof when !== 'object' || Array.isArray(when)) return false;
  return Object.entries(when).every(([k, rule]) => CONDITION_KEYS.includes(k) && matches(value(k, snapshot ?? {}), rule));
}
export function fill(text, mode = 'handheld'){
  const labels = Object.hasOwn(LABELS, mode) ? LABELS[mode] : LABELS.handheld;
  return text.replace(/\{([A-Z]+)\}/g, (whole, key) => Object.hasOwn(labels, key) ? labels[key] : whole);
}
export function reset(){ return { seen:{}, lastAt:null, muted:false, learnt:{} }; }
function copy(memory = {}){
  return { seen:{ ...memory.seen }, lastAt:Number.isFinite(memory.lastAt) ? memory.lastAt : null,
    muted:memory.muted === true, learnt:{ ...memory.learnt } };
}
export function learn(memory = {}, action){
  const out = copy(memory);
  if (TIPS.some(t => t.teaches === action)) out.learnt[action] = true;
  // A successful strike demonstrates reach; walking alone does not.
  if (action === 'strike') out.learnt.reach = true;
  return out;
}
export function mute(memory = {}, on = true){ return { ...copy(memory), muted:!!on }; }
export function nextTip(snapshot = {}, memory = {}){
  // Learning still happens behind menus and while muted; justDid is an observed action.
  const out = learn(memory, snapshot.justDid), none = () => ({ tip:null, memory:out });
  const now = Number.isFinite(snapshot.now) ? Math.max(0, snapshot.now) : 0;
  // A new session may restart the app's monotonic clock. Rebase once, keeping learned skills.
  if (out.lastAt !== null && now < out.lastAt) out.lastAt = now;
  if (out.muted || snapshot.cardUp || snapshot.menuOpen || snapshot.sheetOpen) return none();
  const gap = snapshot.fight ? FIGHT_COOLDOWN_MS : COOLDOWN_MS;
  let best = null;
  for (const t of TIPS){
    if ((t.once !== false && out.seen[t.id] > 0) || out.learnt[t.teaches]) continue;
    if (!t.after.every(id => out.seen[id] > 0) || !test(t.when, snapshot)) continue;
    // cooldownMs is a tip-specific minimum gap since ANY tip (memory stores one timestamp).
    if (out.lastAt !== null && now - out.lastAt < Math.max(gap, t.cooldownMs)) continue;
    if (!best || t.priority > best.priority) best = t;
  }
  if (!best) return none();
  out.seen[best.id] = (out.seen[best.id] || 0) + 1;
  out.lastAt = now;
  return { tip:{ id:best.id, text:fill(best.text, snapshot.mode),
    buttons:[...new Set([...best.text.matchAll(/\{([A-Z]+)\}/g)].map(m => m[1]))], priority:best.priority }, memory:out };
}
