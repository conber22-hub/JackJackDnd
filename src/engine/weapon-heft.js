import { HEFT, NATURAL, BY_TYPE } from '../data/weapon-heft.js';

const weapons = new Map(Object.entries(HEFT).map(([n, heft]) => [n.toLowerCase(), heft]));
const natural = new Map();
for (const [noun, heft] of Object.entries(NATURAL)) {
  natural.set(noun, heft);
  natural.set(noun + 's', heft);
}
natural.set('hooves', NATURAL.hoof);
const neutral = {
  stop:1, knock:1, shake:1, kick:1, lunge:1, swing:'slash',
  arc:{ col:'#dce7ee', width:1, life:1 }, ring:null, words:'A clean blow lands.'
};
const rangedName = /\b(?:(?:short|long|cross|great)?bow|sling|dart|blowgun|musket|pistol)s?\b/i;
export function hefted() { return Object.keys(HEFT); }

export function heftFor(attack, { size = 1 } = {}) {
  const name = String(attack?.n ?? '').trim().toLowerCase();
  const weapon = weapons.get(name);
  const beast = !weapon && name.match(/[a-z]+/g)?.map(word => natural.get(word)).find(Boolean);
  const type = String(attack?.t ?? '').trim().toLowerCase();
  const base = weapon || beast || (Object.hasOwn(BY_TYPE,type) && BY_TYPE[type]) || neutral;
  const result = { ...base, arc:{ ...base.arc } };
  if (beast) {
    const scale = 1 + .2 * (Math.min(4, Math.max(1, Number(size) || 1)) - 1);
    result.stop = Math.min(1.8, base.stop * scale);
    result.knock = Math.min(2, base.knock * scale);
    result.shake = Math.min(2, base.shake * scale);
    result.arc.width = Math.min(2.2, base.arc.width * scale);
  }
  const range = attack?.rng;
  if (result.swing === 'none' || rangedName.test(name) || (Array.isArray(range) ? range.some(n => n > 0) : range > 0)) {
    result.swing = 'none';
    result.arc.width = .4;
  }
  return result;
}

export function applyHeft(impact, heft = neutral) {
  const result = { ...impact };
  if (impact.stop === 0) return result;
  for (const [key, cap] of Object.entries({ stop:260, knock:.7, shake:1, kick:14 })) {
    result[key] = Math.max(0, Math.min(cap, impact[key] * heft[key]));
  }
  return result;
}
