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
