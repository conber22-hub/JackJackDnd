/* GEAR — what a hero wears and wields, read from their pack (engine/inventory.js, Codex's) when the sheet has one.
   Old sheets have only the creator's three fields (armor, shield, weapons); a sheet gets a pack (h.inv) the first time
   someone opens it, through migrateSheet, and from then on the pack is the truth. The three fields stay as a mirror of
   what's equipped, because the creator's menus and the mini's look read them; a change made in the creator is put back
   into the pack (creatorGear). Pure: no DOM. */
import { itemInfo } from './inventory.js';
import { ARMOR } from '../data/srd.js';

const qty = i => Number.isFinite(i?.qty) ? i.qty : 1;
// 'Leather Armor' (the catalogue's name) → 'Leather' (the rules table's key)
export function armorKey(n){
  const s = String(n || '');
  if (ARMOR[s]) return s;
  const short = s.replace(/ Armor$/, '');
  return ARMOR[short] ? short : 'None';
}
// a magic weapon's plain one: 'Longsword, +1' → 'Longsword'
export const baseOf = n => itemInfo(n)?.baseName || n;
const kindOf = i => itemInfo(i)?.kind;   // (the whole entry: a crafted thing carries its own numbers)

/* → { armor:'Chain Mail'|'None', shield:bool, weapons:[names as carried, 'Longsword, +1' included] } */
export function gearOf(h){
  if (!Array.isArray(h?.inv)) return { armor:ARMOR[h?.armor] ? h.armor : 'None', shield:!!h?.shield, weapons:(h?.weapons || []).filter(Boolean) };
  const on = h.inv.filter(i => i.equipped && qty(i) > 0).map(i => ({ i, x:itemInfo(i) }));
  const arm = on.find(o => o.x?.kind === 'armor'), wpn = on.filter(o => o.x?.kind === 'weapon');
  // crafted weapons (engine/crafting.js) fight with their own dice, type and properties: info by the name they're carried under
  const info = Object.fromEntries(wpn.filter(o => o.x.custom).map(o => [o.i.n, o.x]));
  return { armor:arm ? armorKey(arm.x.baseName) : 'None', shield:on.some(o => o.x?.kind === 'shield'), weapons:wpn.map(o => o.i.n), ...(Object.keys(info).length ? { info } : {}) };
}

// The creator's three fields, set from the pack. → a new sheet
export function mirrorGear(h){
  if (!Array.isArray(h?.inv)) return h;
  const g = gearOf(h);
  return { ...h, armor:g.armor, shield:g.shield, weapons:g.weapons.map(baseOf) };
}

// The creator changed armour, shield or weapons: make the pack agree, keeping magic versions of the same thing. → a new sheet
export function creatorGear(h){
  if (!Array.isArray(h?.inv)) return h;
  const out = structuredClone(h), inv = out.inv;
  let n = 0; const add = name => inv.push({ id:`c${Date.now().toString(36)}${n++}`, n:itemInfo(name)?.n || name, qty:1, equipped:true, attuned:false });
  const armor = ARMOR[h.armor] && h.armor !== 'None' ? h.armor : null;
  for (const i of inv) if (i.equipped && kindOf(i) === 'armor' && armorKey(baseOf(i.n)) !== armor) i.equipped = false;
  if (armor && !inv.some(i => i.equipped && kindOf(i) === 'armor')){
    const have = inv.find(i => kindOf(i) === 'armor' && armorKey(baseOf(i.n)) === armor && qty(i) > 0);
    if (have) have.equipped = true; else add(armor);
  }
  for (const i of inv) if (!h.shield && i.equipped && kindOf(i) === 'shield') i.equipped = false;
  if (h.shield && !inv.some(i => i.equipped && kindOf(i) === 'shield')){
    const have = inv.find(i => kindOf(i) === 'shield' && qty(i) > 0);
    if (have) have.equipped = true; else add('Shield');
  }
  // weapons by their plain name, so a +1 longsword counts as the creator's "Longsword"
  const need = (h.weapons || []).filter(Boolean);
  for (const i of inv) if (i.equipped && kindOf(i) === 'weapon'){ const k = need.indexOf(baseOf(i.n)); if (k >= 0) need.splice(k, 1); else i.equipped = false; }
  for (const w of need){
    const have = inv.find(i => !i.equipped && kindOf(i) === 'weapon' && baseOf(i.n) === w && qty(i) > 0);
    if (have) have.equipped = true; else add(w);
  }
  return out;
}
