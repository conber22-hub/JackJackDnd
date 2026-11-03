import { SRD_WEAPONS, ARMOR_ITEMS, TOOLS, GEAR, MAGIC_ITEMS } from '../data/srd-items.js';
const catalogues = [SRD_WEAPONS, ARMOR_ITEMS, TOOLS, GEAR, MAGIC_ITEMS];
const normal = n => String(n ?? '').trim().toLowerCase();
const same = (a, b) => normal(a) === normal(b);
const armour = n => ARMOR_ITEMS.find(i => same(i.n, n) || same(i.n.replace(/ Armor$/, ''), n));
const quantity = i => Number.isFinite(i.qty) ? Math.max(0, i.qty) : 1;
const coinsOf = c => Object.fromEntries(['cp','sp','ep','gp','pp'].map(k => [k, Number.isFinite(c?.[k]) ? Math.max(0, c[k]) : 0]));
// ac is the catalogue value; acBonus is only the increment to heroStats' existing armour/shield AC.
export function itemInfo(name){
  if (name && typeof name === 'object'){
    if (name.custom && typeof name.custom === 'object') return { ...structuredClone(name.custom), n:name.n || name.custom.n };
    name = name.n;
  }
  const weapon = SRD_WEAPONS.find(i => same(i.n, name)), arm = armour(name);
  if (weapon) return { ...structuredClone(weapon), kind:'weapon', baseName:weapon.n };
  if (arm) return { ...structuredClone(arm), kind:arm.t === 'shield' ? 'shield' : 'armor', baseName:arm.n, acBonus:0 };
  const match = /^(.*), \+([123])$/.exec(String(name));
  if (match){
    const base = itemInfo(match[1]);
    const familyName = base?.kind === 'weapon' ? 'Weapon' : base?.kind === 'armor' ? 'Armor' : base?.kind === 'shield' ? 'Shield' : match[1];
    const family = MAGIC_ITEMS.find(i => i.n === `${familyName}, +1, +2, or +3`);
    const variant = family?.variants.find(v => v.n === `${familyName}, +${match[2]}`);
    if (variant){
      return { ...structuredClone(base || {}), ...structuredClone(family), ...structuredClone(variant), n:String(name), ...(base ? {kind:base.kind,baseName:base.baseName,weight:base.weight} : {}), acBonus:variant.ac || 0 };
    }
  }
  for (const catalogue of catalogues){
    const item = catalogue.find(i => same(i.n, name));
    if (item) return { ...structuredClone(item), ...(catalogue === MAGIC_ITEMS ? {magic:true,acBonus:item.ac || 0} : {}) };
  }
  return null;
}
export function migrateSheet(h){
  const out = structuredClone(h);
  if (!Array.isArray(out.inv)){
    const names = [h.armor && h.armor !== 'None' ? h.armor : null, h.shield ? 'Shield' : null, ...(h.weapons || [])].filter(Boolean);
    out.inv = names.map((n, i) => ({id:`legacy-${i}`,n:itemInfo(n)?.n || n,qty:1,equipped:true,attuned:false}));
  }
  out.coins = coinsOf(h.coins);
  return out;
}
// Check the proposed sheet: set candidate.attuned before calling when also requesting attunement.
export function canEquip(h, id){
  const inv = h.inv || [], candidate = inv.find(i => i.id === id);
  const no = why => ({ok:false,why});
  if (!candidate) return no('Item not found.');
  if (!quantity(candidate)) return no('No items remaining.');
  if (inv.filter(i => i.attuned && quantity(i)).length > 3) return no('At most three items can be attuned.');
  const info = itemInfo(candidate), others = inv.filter(i => i.id !== id && i.equipped && quantity(i)).map(i => itemInfo(i));
  if (['armor','shield'].includes(info?.kind) && others.some(i => i?.kind === info.kind)) return no(info.kind === 'armor' ? 'Remove the other body armour first.' : 'Remove the other shield first.');
  const twoHanded = i => i?.kind === 'weapon' && /2/.test(i.p || '');
  if ((info?.kind === 'shield' && others.some(twoHanded)) || (twoHanded(info) && others.some(i => i?.kind === 'shield'))) return no('A two-handed weapon needs both hands free of a shield.');
  return {ok:true,why:''};
}
export function itemEffects(h){
  const out = { ac:0, attack:{}, damage:{}, saves:0, spellAttack:0, spellDc:0, notes:[] };
  const active = (h.inv || []).filter(i => i.equipped && quantity(i));
  const weapons = [...new Map(active.map(i => [normal(i.n), [i, itemInfo(i)]])).values()].filter(([,info]) => info?.kind === 'weapon');
  const seen = new Set();
  for (const item of active){
    const info = itemInfo(item);
    if (!info){ out.notes.push(item.n); continue; }
    if (info.attune && !item.attuned) continue;
    // Multiple copies of the same magic item do not stack; quantity is only for load.
    if (seen.has(normal(info.n))) continue;
    seen.add(normal(info.n));
    let numeric = false;
    // Generic families/variants have no selected base item, so cannot grant armour or weapon effects.
    for (const [key, value] of Object.entries({ ac:info.kind || info.magic ? info.acBonus : 0, saves:info.saves, spellAttack:info.spellAttack, spellDc:info.spellDc })){
      if (Number.isFinite(value) && value !== 0){ out[key] += value; numeric = true; }
    }
    for (const [w, wi] of weapons){
      if (info.kind === 'weapon' ? same(item.n, w.n) : info.appliesTo?.some(n => same(n, wi.baseName))){
        for (const [field, bonus] of [['attack',info.atk], ['damage',info.dmgBonus]]) if (Number.isFinite(bonus) && bonus !== 0){
          out[field][w.n] = (out[field][w.n] || 0) + bonus; numeric = true;
        }
      }
    }
    if (info.text || (!numeric && (info.magic || info.variants))) out.notes.push(item.n);
  }
  out.notes = [...new Set(out.notes)];
  return out;
}
export function coinValueGp(coins){
  const c = coinsOf(coins);
  return (c.cp + c.sp * 10 + c.ep * 50 + c.gp * 100 + c.pp * 1000) / 100;
}
export function load(h, strength){
  // Fifty coins weigh one pound; unknown catalogue weights contribute zero.
  const weight = (h.inv || []).reduce((sum, i) => sum + (itemInfo(i)?.weight || 0) * quantity(i), 0) + Object.values(coinsOf(h.coins)).reduce((a,b) => a+b, 0) / 50;
  const capacity = strength * 15;
  return {weight,capacity,over:weight > capacity};
}
