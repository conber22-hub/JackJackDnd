/* RESOURCES & RESTS — spell slots, class features and Hit Dice on a hero's token (t.resources are the
   maxima from the sheet, t.res what is left), spending them, and the party's short and long rests. */
import { state, log } from '../engine/state.js';
import { rollDice, esc } from '../util/core.js';
import { showCard, toast } from '../ui/hud.js';
import { addCond } from './rules.js';
import { heal } from './combat.js';
import { changed } from './session.js';

const resOf = (t, id) => t.resources?.find(r => r.id === id);
export const left = (t, id) => t.res?.[id] ?? 0;

// Keep what is left when a sheet is updated, clamped to the new maxima; new resources start full.
export function fillResources(t){
  if (!t.resources){ delete t.res; return; }
  const prev = t.res || {}; t.res = {};
  for (const r of t.resources) t.res[r.id] = Math.max(0, Math.min(r.max, prev[r.id] ?? r.max));
}
export function adjustRes(t, id, delta){
  const r = resOf(t, id); if (!r) return;
  t.res[r.id] = Math.max(0, Math.min(r.max, left(t, id) + delta)); changed();
}

/* ---------- spell slots ---------- */
// The lowest slot that can cast a spell of this level (slots and pact slots both count).
export function slotFor(t, lvl){
  return (t.resources || []).filter(r => r.slot >= lvl && left(t, r.id) > 0).sort((a, b) => a.slot - b.slot || (a.id === 'pact') - (b.id === 'pact'))[0] || null;
}
// Spend what a spell costs. Tokens without a sheet (the default party, monsters) cast freely.
// Returns null when nothing is left to cast it with, else a note for the card.
export function spendSpell(t, lvl, name = ''){
  if (!lvl || !t.resources) return '';
  if (/Hunter's Mark/.test(name) && left(t, 'favored') > 0){ t.res.favored--; return `Favored Enemy (${t.res.favored} left)`; }
  const r = slotFor(t, lvl); if (!r) return null;
  t.res[r.id]--;
  return `${r.id === 'pact' ? 'pact' : `level ${r.slot}`} slot · ${t.res[r.id]} left`;
}
export const canCast = (t, lvl, name = '') => !lvl || !t.resources || (/Hunter's Mark/.test(name) && left(t, 'favored') > 0) || !!slotFor(t, lvl);

/* ---------- class features ---------- */
// Use one charge of a feature. Lay on Hands goes to `target` (or the hero), everything else to the hero.
export function useFeature(t, id, target = t){
  const r = resOf(t, id); if (!r || r.slot) return false;
  if (left(t, id) <= 0){ toast(`${t.name} has no ${r.n} left — a rest brings it back.`); return false; }
  const lines = []; let cost = 1;
  if (r.use === 'rage'){ addCond(t, 'raging', 10); lines.push(`Raging for up to a minute: half damage from bludgeoning, piercing and slashing; +${t.rageDmg || 2} damage on melee hits.`); }
  else if (r.use === 'secondwind' || r.use === 'hitdie'){
    if (t.dead){ toast(`${t.name} is down.`); return false; }
    const n = Math.max(1, rollDice(r.use === 'hitdie' ? `1d${r.die}${r.mod >= 0 ? '+' : ''}${r.mod}` : r.dice).total);
    heal(t, n); lines.push(`<b>+${n} HP</b> (${t.hp}/${t.maxHp})`);
  }
  else if (r.use === 'lay'){
    cost = Math.min(5, left(t, id)); heal(target, cost);
    lines.push(`${esc(target.name)} <b>+${cost} HP</b>`);
  }
  else if (r.use === 'recover'){
    const got = recoverSlots(t, r); if (!got.length){ toast(`${t.name} has no spent slots to recover.`); return false; }
    lines.push(`Back: ${got.join(', ')}`);
  }
  else if (r.text) lines.push(esc(r.text));
  t.res[id] -= cost;
  showCard({ kind:'', title:`${t.name}: ${r.n}`, sub:`${t.res[id]} of ${r.max} left`, lines });
  log(`${t.name} uses ${r.n}.`);
  changed(); return true;
}
function recoverSlots(t, r){
  const got = [];
  if (r.pact){ const p = resOf(t, 'pact'); if (!p) return got; const n = Math.min(Math.ceil(p.max / 2), p.max - left(t, 'pact')); if (n > 0){ t.res.pact += n; got.push(`${n} pact slot${n > 1 ? 's' : ''}`); } return got; }
  let budget = r.lv || 1;
  for (const s of (t.resources || []).filter(s => s.slot && s.id !== 'pact').sort((a, b) => b.slot - a.slot)){
    while (s.slot <= budget && left(t, s.id) < s.max){ t.res[s.id]++; budget -= s.slot; got.push(`a level ${s.slot} slot`); }
  }
  return got;
}

/* ---------- rests ---------- */
const party = () => state.tokens.filter(t => t.kind === 'pc' && !t.flags?.gone);
export function shortRest(list = party()){
  for (const t of list) for (const r of t.resources || []){
    if (r.rest === 'short') t.res[r.id] = r.max;
    else if (r.rest === 'short1') t.res[r.id] = Math.min(r.max, left(t, r.id) + 1);
  }
  showCard({ kind:'', title:'A short rest', sub:'An hour', flair:'Bandages, a pipe, a whetstone. Nobody quite sleeps.', lines:['Short-rest features are back (one charge of the one-a-rest ones). Spend Hit Dice from each hero\'s card to heal.'] });
  log('The party takes a short rest.'); changed();
}
export function longRest(list = party(), quiet = false){
  for (const t of list){
    if (!t.dead){ t.hp = t.maxHp; t.flags.bloodied = false; }
    t.conds = (t.conds || []).filter(c => c.n === 'seeded');
    for (const r of t.resources || []) t.res[r.id] = r.max;
  }
  if (!quiet) showCard({ kind:'', title:'A long rest', sub:'Eight hours', flair:'They sleep, after a fashion. In Barovia the dreams are not entirely their own.', lines:['Full HP, every slot and feature back, Hit Dice restored, conditions gone.'] });
  log('The party takes a long rest.'); changed();
}
