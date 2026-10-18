/* Small helpers shared by everything: DOM lookup, dice, seeded random. No DOM or Three.js work happens at import time. */

export const $ = s => document.querySelector(s);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const uid = () => Math.random().toString(36).slice(2, 9);
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
export const d = f => 1 + Math.floor(Math.random() * f);
export const cheb = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));

export function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function hashSeed(s){ let h = 1779033703 ^ String(s).length; for (const c of String(s)) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; }
export function pickWeighted(w, rng = Math.random){ const tot = Object.values(w).reduce((a, b) => a + b, 0); let r = rng() * tot; for (const [k, v] of Object.entries(w)) { r -= v; if (r <= 0) return k; } return Object.keys(w)[0]; }
export function pick(arr, rng = Math.random){ return arr[Math.floor(rng() * arr.length)]; }
export function shuffle(arr, rng = Math.random){ const a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Dice: "2d6+3", "1d6+3+2d6", "4d10-1", "d100". crit doubles the dice.
export function rollDice(expr, crit = false){
  const terms = String(expr).replace(/\s+/g, '').match(/[+-]?[^+-]+/g) || [];
  let total = 0; const rolls = [];
  for (const term of terms){
    const sign = term[0] === '-' ? -1 : 1, body = term.replace(/^[+-]/, '');
    const m = body.match(/^(\d*)d(\d+)$/i);
    if (m){ let n = +(m[1] || 1); const f = +m[2]; if (crit) n *= 2; for (let i = 0; i < n; i++){ const r = d(f); rolls.push(r); total += sign * r; } }
    else total += sign * (+body || 0);
  }
  return { total: Math.max(0, total), rolls };
}
export function avgDice(expr){
  const terms = String(expr).replace(/\s+/g, '').match(/[+-]?[^+-]+/g) || []; let t = 0;
  for (const term of terms){ const sign = term[0] === '-' ? -1 : 1, body = term.replace(/^[+-]/, ''); const m = body.match(/^(\d*)d(\d+)$/i);
    t += sign * (m ? (+(m[1] || 1)) * (+m[2] + 1) / 2 : (+body || 0)); }
  return Math.max(1, Math.floor(t));
}
export function parseAttacks(text){
  return String(text || '').split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p[0])
    .map(p => ({ n:p[0], b:parseInt(p[1]) || 0, d:p[2] || '1d6', t:p[3] || 'bludgeoning', f:p[4] || '{A} strikes at {T}.' }));
}
export function attacksToText(list){ return (list || []).map(a => `${a.n} | ${a.b >= 0 ? '+' : ''}${a.b} | ${a.d} | ${a.t}${a.f && a.f !== '{A} strikes at {T}.' ? ` | ${a.f}` : ''}`).join('\n'); }
export const signed = n => `${n >= 0 ? '+' : '−'}${Math.abs(n)}`;

// A tiny event bus so the pure engine can say "something changed" without importing the UI.
const listeners = {};
export const bus = {
  on(ev, fn){ (listeners[ev] ||= []).push(fn); },
  emit(ev, ...a){ for (const fn of listeners[ev] || []) fn(...a); },
};
