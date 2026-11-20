/* ⚙ THE CALLINGS' MECHANICS, pure (docs/homebrew/callings.md; each Calling's and Path's feature carries a `mech`, from
   ChatGPT's data/callings.js). Two pieces every feature leans on:
     · amountOf(expr, ctx, roll): an amount written the way the data writes it — '1d10+lvl', 'lvl*2', '2d8+wis',
       'pb', '5*lvl', 'half lvl' — read safely (no eval): numbers, dice, the hero's level, proficiency bonus and
       ability modifiers, + - * and parentheses. Dice come from roll(n, sides) so the tests can fix them.
     · the Ward (the Vanguard's signature): a shimmer of force that soaks blows before hit points, and comes back
       whole at the start of your turn if nothing got through it, or to you, since your last turn.
   No DOM, no Three.js: game/combat.js and the fight's turn loop apply them. */

const ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const dflt = (n, s) => { let t = 0; for (let i = 0; i < n; i++) t += 1 + Math.floor(Math.random() * s); return t; };

// Tokens: numbers, NdM, names, operators, parentheses.
function lex(s){
  const out = []; const re = /\s*(\d+d\d+|\d+|[a-z]+|[-+*/()])/gy; let m, i = 0;
  s = String(s).toLowerCase().replace(/\bhalf\s+(\w+)/g, '($1/2)');
  re.lastIndex = 0;
  while (i < s.length){
    re.lastIndex = i; m = re.exec(s); if (!m) { if (/^\s*$/.test(s.slice(i))) break; return null; }
    out.push(m[1]); i = re.lastIndex;
  }
  return out;
}
/* The amount an expression comes to. ctx: { lvl, pb, mods:{ str…cha } } (or the abilities as scores in ctx.ab).
   roll(n, sides) → the dice's total. Unknown names count 0; anything unreadable is 0. Never below 0; halves round
   down. */
export function amountOf(expr, ctx = {}, roll = dflt){
  if (typeof expr === 'number') return Math.max(0, Math.floor(expr));
  const t = lex(expr ?? ''); if (!t || !t.length) return 0;
  const lvl = Math.max(1, +ctx.lvl || 1), pb = +ctx.pb || (2 + Math.floor((lvl - 1) / 4));
  const mod = a => ctx.mods?.[a] ?? (ctx.ab?.[a] != null ? Math.floor((ctx.ab[a] - 10) / 2) : ctx.ab?.[a[0].toUpperCase() + a.slice(1)] != null ? Math.floor((ctx.ab[a[0].toUpperCase() + a.slice(1)] - 10) / 2) : 0);
  let i = 0;
  const atom = () => {
    const k = t[i++];
    if (k === undefined) throw 0;
    if (k === '(') { const v = sum(); if (t[i++] !== ')') throw 0; return v; }
    if (k === '-') return -atom();
    if (/^\d+d\d+$/.test(k)) { const [n, s] = k.split('d').map(Number); return n > 0 && s > 0 && n <= 100 ? roll(n, s) : 0; }
    if (/^\d+$/.test(k)) return +k;
    if (k === 'lvl' || k === 'level') return lvl;
    if (k === 'pb' || k === 'prof') return pb;
    if (ABIL.includes(k)) return mod(k);
    if (/^[a-z]+$/.test(k)) return 0;
    throw 0;
  };
  const prod = () => { let v = atom(); while (t[i] === '*' || t[i] === '/'){ const op = t[i++], r = atom(); v = op === '*' ? v * r : r ? Math.floor(v / r) : 0; } return v; };
  const sum = () => { let v = prod(); while (t[i] === '+' || t[i] === '-'){ const op = t[i++], r = prod(); v = op === '+' ? v + r : v - r; } return v; };
  try { const v = sum(); if (i !== t.length) return 0; return Math.max(0, Math.floor(v)); } catch { return 0; }
}

/* ---------- the Ward ----------
   ward = { max, now, hit } — hit: something got through it, or it was struck, since the start of your last turn. */
export const WARD_MAX = 'lvl*2+4';
export function newWard(ctx = {}, maxExpr = WARD_MAX){ const max = amountOf(maxExpr, ctx, () => 0); return { max, now:max, hit:false }; }
// A blow of n (after resistances) on someone with a ward: how much it soaks and how much gets through.
export function wardSoak(ward, n){
  n = Math.max(0, Math.floor(+n || 0));
  if (!ward || !(ward.max > 0)) return { ward, soaked:0, through:n, broke:false };
  const now = Math.max(0, ward.now || 0), soaked = Math.min(now, n), left = now - soaked;
  return { ward:{ ...ward, now:left, hit:ward.hit || n > 0 }, soaked, through:n - soaked, broke:now > 0 && left === 0 };
}
// The start of the bearer's turn: whole again if nothing touched them since the last one; then the count starts over.
export function wardTurn(ward){
  if (!ward || !(ward.max > 0)) return { ward, back:false };
  const back = !ward.hit && ward.now < ward.max;
  return { ward:{ ...ward, now:back ? ward.max : ward.now, hit:false }, back };
}
// A rest (short or long): whole.
export const wardRest = ward => ward && ward.max > 0 ? { ...ward, now:ward.max, hit:false } : ward;
// For a bar: 0..1
export const wardFrac = ward => ward && ward.max > 0 ? Math.max(0, Math.min(1, (ward.now || 0) / ward.max)) : 0;

/* ---------- the features, in a fight ----------
   A token carries the features it has as mechs: [{ k, …fields, src:'Hoplite: Phalanx' }] (game/heroes.js builds them
   from its Calling and Path). Each kind is read here, pure, against a moment's flags (game/mechfx.js gathers them):
     ctx = { raging, bloodied, alone, allyNear, vsSeep, crit, firstHit, wardUp, wardDown, hpLow, … } (true / false)
   A mech's `when` (a word, or several joined by '+' meaning all, or '|' meaning any) must hold; none means always.
   Words the data uses for the same thing are read alike (fury = raging = rage). An unknown word never holds: a
   feature the game doesn't yet understand stays the DM's, never fires by mistake. */
const SAME = { fury:'raging', rage:'raging', raging:'raging', bloodied:'bloodied', alone:'alone', allyadjacent:'allyNear', allynear:'allyNear', ally:'allyNear',
  vsseep:'vsSeep', seep:'vsSeep', seeped:'vsSeep', infected:'vsSeep', firsthiteachturn:'firstHit', firsthit:'firstHit', onceperturn:'firstHit', crit:'crit', critical:'crit',
  always:'always', ward:'wardUp', wardup:'wardUp', warddown:'wardDown', wardbroken:'wardDown', hplow:'hpLow', neardeath:'hpLow', melee:'melee', ranged:'ranged',
  turnstart:'turnStart', kill:'kill', rest:'rest', bonus:'bonus' };
export const KNOWN_WHEN = Object.keys(SAME);
const holds1 = (w, ctx) => { const k = SAME[String(w).toLowerCase().replace(/[^a-z]/g, '')]; return k === 'always' ? true : !!(k && ctx?.[k]); };
export function whenHolds(when, ctx = {}){
  if (when == null || when === '') return true;
  const s = String(when);
  if (s.includes('|')) return s.split('|').some(p => whenHolds(p, ctx));
  return s.split('+').every(p => holds1(p.trim(), ctx));
}
const list = mechs => (Array.isArray(mechs) ? mechs : []).flatMap(m => m && typeof m === 'object' ? [m, ...(Array.isArray(m.also) ? m.also.map(x => ({ ...x, src:m.src })) : [])] : []);
// Advantage (or disadvantage) on an attack, a save or a check: { adv:[why], dis:[why] }. vs: an ability ('dex') or a
// condition ('frightened') the roll is against.
export function mechEdge(mechs, on, ctx = {}, vs = null){
  const adv = [], dis = [];
  for (const m of list(mechs)){
    if (m.k !== 'advantage' && m.k !== 'disadvantage') continue;
    if (m.on && m.on !== on) continue;
    if (m.vs && vs && String(m.vs).toLowerCase() !== String(vs).toLowerCase()) continue;
    if (m.vs && !vs && on !== 'attack') continue;
    if (!whenHolds(m.when, ctx)) continue;
    (m.k === 'advantage' ? adv : dis).push(m.src || m.k);
  }
  return { adv, dis };
}
// Damage types resisted right now
export function mechResist(mechs, ctx = {}){
  const out = new Set();
  for (const m of list(mechs)) if (m.k === 'resist' && whenHolds(m.when, ctx)) for (const t of m.types || []) out.add(String(t).toLowerCase());
  return [...out];
}
// Extra damage on a hit: [{ n, type, src }] (firstHit: only the first hit this turn counts for those that say so)
export function mechExtra(mechs, ctx = {}, roll){
  const out = [];
  for (const m of list(mechs)){
    if (m.k !== 'extraDamage' || !whenHolds(m.when, ctx)) continue;
    const n = amountOf(ctx.crit ? `${m.dice}+${m.dice}` : m.dice, ctx, roll);
    if (n > 0) out.push({ n, type:m.type || '', src:m.src || '' });
  }
  return out;
}
// Temporary hit points a moment gives (when: 'turnStart' | 'kill' | 'rest' | 'bonus'): the most of them (they don't stack)
export function mechTempHp(mechs, moment, ctx = {}, roll){
  let best = 0, src = '';
  for (const m of list(mechs)){
    if (m.k !== 'tempHp') continue;
    if ((m.when || 'bonus') !== moment && !String(m.when || '').split('|').includes(moment)) continue;
    const n = amountOf(m.amount, ctx, roll); if (n > best){ best = n; src = m.src || ''; }
  }
  return { n:best, src };
}
// The Ward a token's features give (the biggest), or null
export function mechWard(mechs, ctx = {}){
  let w = null;
  for (const m of list(mechs)) if (m.k === 'ward'){ const max = amountOf(m.max || WARD_MAX, ctx, () => 0); if (!w || max > w.max) w = { max, src:m.src || '' }; }
  return w;
}
// Temporary hit points: they soak before hit points, and the most you're given replaces, never adds to, what's left
export function tempSoak(thp, n){ const have = Math.max(0, thp || 0), s = Math.min(have, Math.max(0, n)); return { thp:have - s, soaked:s, through:Math.max(0, n) - s }; }
export const tempGive = (thp, n) => Math.max(thp || 0, n || 0);
