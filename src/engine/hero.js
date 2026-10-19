/* HEROES — a character sheet (what the creator saves) and everything derived from it: ability scores, AC, HP,
   saves, skills, passive Perception, attacks, spells and the token that goes on the map. Pure: no DOM. */
import { ABILITIES, CLASSES, SPECIES, BACKGROUNDS, WEAPONS, ARMOR, SPELLS, SUBSPELLS, SKILLS, SLOTS_FULL, SLOTS_HALF, PACT, mod, profBonus, MAX_LEVEL } from '../data/srd.js';
import { clamp, uid } from '../util/core.js';

export const W = n => WEAPONS.find(w => w.n === n);
export const SP = n => SPELLS.find(s => s.n === n);
const lower = a => a.toLowerCase();

export function newHero(cls = 'Fighter'){
  const C = CLASSES[cls];
  return { id:uid(), v:1, name:'', player:'', lvl:1, cls, sp:'Human', spOpt:null, bg:'Soldier', bg2:'Str', bg1:'Con',
    ab:{ ...C.arr }, method:'standard', asi:{}, skills:C.skills[1].slice(0, C.skills[0]), expert:[], extraSkill:'Perception',
    armor:C.armor?.startsWith('heavy') ? 'Chain Mail' : C.armor?.startsWith('medium') ? 'Scale Mail' : C.armor === 'light' || C.armor?.startsWith('light') ? 'Leather' : 'None',
    shield:/shield/.test(C.armor || ''), weapons:cls === 'Fighter' ? ['Longsword', 'Javelin'] : [], style:'Defense', invoc:'Agonizing Blast', spells:[],
    color:C.color, look:'', backstory:'', goBackFor:'', ashamed:'', why:'', homeSmell:'', notes:'' };
}
export const asiLevels = h => [4, 8, ...(CLASSES[h.cls].asiExtra || [])].filter(l => l <= h.lvl).sort((a, b) => a - b);
export function expertiseSlots(h){ const ex = CLASSES[h.cls].expertise || {}; return Object.entries(ex).filter(([l]) => +l <= h.lvl).reduce((a, [, n]) => a + n, 0); }
export function maxSpellLevel(h){
  const C = CLASSES[h.cls], L = clamp(+h.lvl || 1, 1, MAX_LEVEL);
  if (C.full) return SLOTS_FULL[L - 1].length; if (C.half) return SLOTS_HALF[L - 1].length; if (C.pact) return PACT[L - 1][1];
  return 0;
}
export function spellPool(h){
  const C = CLASSES[h.cls], bg = BACKGROUNDS[h.bg], maxL = maxSpellLevel(h);
  const pool = C.letter ? SPELLS.filter(s => s.c.includes(C.letter) && s.l <= maxL && s.n !== 'Divine Smite') : [];
  const bgPool = bg?.mi ? SPELLS.filter(s => s.c.includes(bg.mi) && s.l <= 1) : [];
  return [...new Map([...pool, ...bgPool].map(s => [s.n, s])).values()].sort((a, b) => a.l - b.l || a.n.localeCompare(b.n));
}
export function spellLimits(h){
  const C = CLASSES[h.cls], L = clamp(+h.lvl || 1, 1, MAX_LEVEL), bg = BACKGROUNDS[h.bg];
  return { cantrips:(C.cantrips?.[L - 1] || 0) + (bg?.mi ? 2 : 0), prepared:(C.prep?.[L - 1] || 0) + (bg?.mi ? 1 : 0) };
}

export function heroStats(h){
  const C = CLASSES[h.cls] || CLASSES.Fighter, L = clamp(+h.lvl || 1, 1, MAX_LEVEL), pb = profBonus(L), bg = BACKGROUNDS[h.bg], spc = SPECIES[h.sp] || SPECIES.Human;
  const sc = {}; for (const a of ABILITIES) sc[a] = +h.ab?.[a] || 10;
  if (bg){ if (h.bg2 && bg.ab.includes(h.bg2)) sc[h.bg2] += 2; if (h.bg1 && bg.ab.includes(h.bg1) && h.bg1 !== h.bg2) sc[h.bg1] += 1; }
  for (const l of asiLevels(h)){ const a = h.asi?.[l]; if (a && sc[a] !== undefined) sc[a] = Math.min(20, sc[a] + 2); }
  const M = a => mod(sc[a]);
  const sub = L >= 3 ? C.sub : null;
  // armour class
  const armorName = ARMOR[h.armor] ? h.armor : 'None', arm = ARMOR[armorName];
  let ac = arm.ac + Math.min(M('Dex'), arm.dex);
  if (armorName === 'None'){
    if (h.cls === 'Barbarian') ac = 10 + M('Dex') + M('Con');
    if (h.cls === 'Monk' && !h.shield) ac = 10 + M('Dex') + M('Wis');
    if (sub === 'Draconic Sorcery') ac = Math.max(ac, 10 + M('Dex') + M('Cha'));
    if (h.cls === 'Warlock' && h.invoc === 'Armor of Shadows') ac = Math.max(ac, 13 + M('Dex'));
  }
  if (h.shield && h.cls !== 'Monk') ac += 2;
  const style = C.style && L >= C.style ? h.style : null;
  if (style === 'Defense' && armorName !== 'None') ac += 1;
  // hit points: max at level 1, then the fixed average
  let hp = C.hd + M('Con') + (L - 1) * (C.hd / 2 + 1 + M('Con'));
  if (h.sp === 'Dwarf') hp += L;
  if (sub === 'Draconic Sorcery') hp += L;
  hp = Math.max(1, Math.floor(hp));
  // speed
  let spd = spc.spd;
  if (h.cls === 'Barbarian' && L >= 5 && arm.t !== 'heavy') spd += 10;
  if (h.cls === 'Monk' && L >= 2 && armorName === 'None' && !h.shield) spd += L >= 6 ? 15 : 10;
  if (h.cls === 'Ranger' && L >= 6) spd += 10;
  // spellcasting
  const castAb = C.cast || (bg?.mi ? (bg.mi === 'C' ? 'Wis' : 'Int') : null);
  const dc = castAb ? 8 + pb + M(castAb) : null, spAtk = castAb ? pb + M(castAb) : null;
  // saves & skills
  const saves = {}; for (const a of ABILITIES) saves[a] = M(a) + (C.sv.includes(a) ? pb : 0);
  const prof = new Set([...(h.skills || []), ...(bg?.skills || [])]);
  if (h.sp === 'Elf') prof.add('Perception');
  if (h.sp === 'Human' && h.extraSkill) prof.add(h.extraSkill);
  const expert = new Set((h.expert || []).filter(s => prof.has(s)).slice(0, expertiseSlots(h)));
  const jack = h.cls === 'Bard' && L >= 2;
  const skills = {}; for (const [s, a] of Object.entries(SKILLS)) skills[s] = M(a) + (prof.has(s) ? pb : jack ? Math.floor(pb / 2) : 0) + (expert.has(s) ? pb : 0);
  const passive = 10 + skills.Perception;
  const tools = C.tools || bg?.tools;
  const check = M('Dex') + (tools ? pb : 0);
  let init = M('Dex') + (bg?.alert ? pb : 0);
  const slots = C.full ? SLOTS_FULL[L - 1] : C.half ? SLOTS_HALF[L - 1] : null;
  const pact = C.pact ? { n:PACT[L - 1][0], l:PACT[L - 1][1] } : null;
  const features = [];
  for (let l = 1; l <= L; l++) for (const f of C.features[l] || []) features.push(`${f} (${l})`);
  return { sc, M, pb, ac, hp, spd, dc, spAtk, castAb, init, saves, skills, prof, expert, passive, check, slots, pact, features, sub, L, C, style };
}

const dieMul = (d, n) => d.replace(/^(\d*)d(\d+)/, (_, c, f) => `${(+c || 1) * n}d${f}`);
export const cantripDice = (d, L) => dieMul(d, L >= 11 ? 3 : L >= 5 ? 2 : 1);
const sgn = n => n >= 0 ? `+${n}` : `${n}`;

export function heroAttacks(h, st = heroStats(h)){
  const out = [], L = st.L;
  for (const name of (h.weapons || []).filter(Boolean)){
    const w = W(name); if (!w) continue;
    const ranged = /r/.test(w.cat) || /A/.test(w.p), finesse = /F/.test(w.p);
    const ab = ranged ? 'Dex' : finesse ? (st.M('Dex') > st.M('Str') ? 'Dex' : 'Str') : 'Str';
    const m = st.M(ab);
    const two = !h.shield && /V:/.test(w.p) && (h.weapons || []).filter(Boolean).length === 1;
    const die = two ? w.p.match(/V:(\d*d\d+)/)[1] : w.d;
    const hit = st.pb + m + (ranged && st.style === 'Archery' ? 2 : 0);
    const dmgBonus = m + (!ranged && st.style === 'Dueling' && !/2/.test(w.p) && !two ? 2 : 0);
    out.push({ n:name, b:hit, d:`${die}${dmgBonus ? sgn(dmgBonus) : ''}`, t:w.ty, f:`{A} attacks {T} with a ${name.toLowerCase()}.`, ...(ranged ? {} : { m:1 }) });
  }
  if (h.cls === 'Monk'){
    const m = Math.max(st.M('Dex'), st.M('Str')), die = L >= 5 ? '1d8' : '1d6';
    out.push({ n:'Unarmed Strike', b:st.pb + m, d:`${die}${sgn(m)}`, t:'bludgeoning', f:'{A} strikes {T} with open hand and heel.', m:1 });
  }
  if (!out.length) out.push({ n:'Unarmed Strike', b:st.pb + st.M('Str'), d:`${Math.max(1, 1 + st.M('Str'))}`, t:'bludgeoning', f:'{A} punches {T}.', m:1 });
  if (h.cls === 'Rogue') out[0].f += ` (Sneak Attack +${Math.ceil(L / 2)}d6 once a turn — add it with "+ HP" or the DM's call.)`;
  // spell attacks become attack buttons too
  for (const sp of heroSpells(h, st)) if (sp.k === 'atk' && sp.d){
    const d = sp.l === 0 && sp.cs ? cantripDice(sp.d, L) : sp.n === 'Eldritch Blast' ? sp.d : sp.d;
    const beams = sp.n === 'Eldritch Blast' ? (L >= 11 ? 3 : L >= 5 ? 2 : 1) : 1;
    const agon = sp.n === 'Eldritch Blast' && h.invoc === 'Agonizing Blast' ? st.M('Cha') : 0;
    out.push({ n:sp.n + (beams > 1 ? ` (×${beams} beams)` : ''), b:st.spAtk, d:`${d}${agon ? sgn(agon) : ''}${sp.addmod ? sgn(st.M(st.castAb)) : ''}`, t:sp.ty, f:`{A} casts ${sp.n} at {T}.`, ...(sp.l ? { l:sp.l } : {}) });
  }
  return out;
}
export function heroSpells(h, st = heroStats(h)){
  const out = new Set(h.spells || []);
  const ss = st.sub && SUBSPELLS[st.sub];
  if (ss) for (const [lv, list] of Object.entries(ss)) if (st.L >= +lv) list.forEach(n => out.add(n));
  if (h.cls === 'Paladin') out.add('Divine Smite');
  if (h.cls === 'Ranger') out.add('Hunter\'s Mark');
  if (h.sp === 'Tiefling'){ const lg = h.spOpt || 'Infernal'; out.add(lg === 'Infernal' ? 'Fire Bolt' : lg === 'Abyssal' ? 'Poison Spray' : 'Chill Touch'); }
  return [...out].map(SP).filter(Boolean);
}
// Every spell that isn't a spell attack — the token's "cast" buttons. Saves, heals and sure hits are resolved by
// the DM's app; buffs and utility spells show a card (and spend the slot). Divine Smite lands as radiant damage.
export function castables(h, st = heroStats(h)){
  return heroSpells(h, st).filter(sp => sp.k !== 'atk').map(sp => ({
    n:sp.n, k:sp.k, l:sp.l, sv:sp.sv, dc:st.dc, d:sp.d ? (sp.l === 0 && sp.cs ? cantripDice(sp.d, st.L) : sp.d) : null, ty:sp.ty, half:!!sp.half,
    rad:sp.area ? Math.max(1, Math.round(sp.area[1] / (sp.area[0] === 'cone' || sp.area[0] === 'line' ? 10 : 5))) : 0, cond:sp.cond || null,
    healMod:sp.k === 'heal' ? st.M(st.castAb || 'Wis') : 0, ...(sp.k === 'util' && sp.d ? { k:'auto', smite:1 } : {}), ...(sp.note ? { note:sp.note } : {}) }));
}

/* RESOURCES — what a hero spends and gets back on a rest: spell slots, pact slots, class features, Hit Dice.
   rest: 'long' (back on a long rest) · 'short' (all back on a short rest) · 'short1' (one back on a short rest)
   use: what tapping it does — 'rage' · 'secondwind' · 'lay' (5 HP to a target) · 'hitdie' · 'recover' (slots back) · 'note' (a card) */
const byLvl = (L, rows) => rows[Math.min(L, rows.length) - 1];
export function heroResources(h, st = heroStats(h)){
  const L = st.L, out = [], C = st.C, cls = h.cls;
  (st.slots || []).forEach((n, i) => out.push({ id:`slot${i + 1}`, n:`Level ${i + 1} slots`, max:n, rest:'long', slot:i + 1 }));
  if (st.pact) out.push({ id:'pact', n:`Pact slots (level ${st.pact.l})`, max:st.pact.n, rest:'short', slot:st.pact.l });
  const f = (id, n, max, rest, use = 'note', text = '', more = {}) => { if (max > 0) out.push({ id, n, max, rest, use, text, ...more }); };
  if (cls === 'Barbarian') f('rage', 'Rage', byLvl(L, [2, 2, 3, 3, 3, 4, 4, 4, 4, 4]), 'short1', 'rage', 'Resistance to bludgeoning, piercing and slashing; extra damage on Strength melee hits. No spells, no concentration.');
  if (cls === 'Bard') f('inspire', 'Bardic Inspiration', Math.max(1, st.M('Cha')), L >= 5 ? 'short' : 'long', 'note', `A creature you can see gets a d${L >= 10 ? 10 : L >= 5 ? 8 : 6} to add to one d20 test in the next hour.`);
  if (cls === 'Cleric' && L >= 2) f('channel', 'Channel Divinity', L >= 6 ? 3 : 2, 'short1', 'note', `Divine Spark (heal or harm 1d8+${st.M('Wis')}) or Turn Undead (DC ${st.dc} Wis, undead within 30 ft. flee)${L >= 3 ? ' — or Preserve Life' : ''}.`);
  if (cls === 'Paladin' && L >= 3) f('channel', 'Channel Divinity', 2, 'short1', 'note', `Sacred Weapon (+${Math.max(1, st.M('Cha'))} to hit, the weapon sheds light) or Divine Sense.`);
  if (cls === 'Paladin') f('lay', 'Lay on Hands', 5 * L, 'long', 'lay', 'Touch a creature: 5 HP from the pool per tap (or 5 points to cure Poisoned).');
  if (cls === 'Druid' && L >= 2) f('wild', 'Wild Shape', L >= 6 ? 3 : 2, 'short1', 'note', 'Take a beast shape for up to an hour (a bonus action).');
  if (cls === 'Fighter') f('wind', 'Second Wind', byLvl(L, [2, 2, 2, 3, 3, 3, 3, 3, 3, 4]), 'short1', 'secondwind', `Regain 1d10+${L} HP (a bonus action).`, { dice:`1d10+${L}` });
  if (cls === 'Fighter' && L >= 2) f('surge', 'Action Surge', 1, 'short', 'note', 'One more action this turn.');
  if (cls === 'Fighter' && L >= 9) f('indomitable', 'Indomitable', 1, 'long', 'note', `Reroll a failed saving throw with +${L}.`);
  if (cls === 'Monk' && L >= 2) f('focus', 'Focus Points', L, 'short', 'note', `Flurry of Blows, Patient Defense or Step of the Wind${L >= 5 ? ` — or Stunning Strike (DC ${8 + st.pb + st.M('Wis')} Con)` : ''}.`);
  if (cls === 'Sorcerer' && L >= 2) f('sorcery', 'Sorcery Points', L, 'long', 'note', 'Metamagic, or turn points into spell slots.');
  if (cls === 'Ranger') f('favored', 'Favored Enemy', byLvl(L, [2, 2, 2, 2, 3, 3, 3, 3, 4, 4]), 'long', 'note', 'Cast Hunter\'s Mark without spending a slot (used first when you cast it).');
  if (cls === 'Wizard') f('arcane', 'Arcane Recovery', 1, 'long', 'recover', `After a short rest: spent slots worth up to ${Math.ceil(L / 2)} levels come back.`, { lv:Math.ceil(L / 2) });
  if (cls === 'Warlock' && L >= 2) f('cunning', 'Magical Cunning', 1, 'long', 'recover', 'Half your pact slots come back (one minute\'s rite).', { pact:1 });
  if (h.sp === 'Human') f('heroic', 'Heroic Inspiration', 1, 'long', 'note', 'Reroll any die, once. Yours again after every long rest.');
  out.push({ id:'hd', n:`Hit Dice (d${C.hd})`, max:L, rest:'long', use:'hitdie', die:C.hd, mod:st.M('Con'), text:`Spend on a short rest: d${C.hd}${sgn(st.M('Con'))} HP each.` });
  return out;
}
export function heroWarnings(h){
  const st = heroStats(h), lim = spellLimits(h), sp = heroSpells(h, st), w = [];
  if (!h.name?.trim()) w.push('Give your hero a name.');
  const C = CLASSES[h.cls];
  if ((h.skills || []).length !== C.skills[0]) w.push(`Pick ${C.skills[0]} class skills (you have ${(h.skills || []).length}).`);
  const can = (h.spells || []).filter(n => SP(n)?.l === 0).length, prep = (h.spells || []).filter(n => SP(n)?.l > 0).length;
  if (lim.cantrips && can > lim.cantrips) w.push(`Too many cantrips: ${can} of ${lim.cantrips}.`);
  if (lim.prepared && prep > lim.prepared) w.push(`Too many prepared spells: ${prep} of ${lim.prepared}.`);
  if (h.method === 'pointbuy'){ const pts = Object.values(h.ab).reduce((a, v) => a + (({ 8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9 })[v] ?? 99), 0); if (pts > 27) w.push(`Point buy over budget: ${pts} of 27.`); }
  for (const l of asiLevels(h)) if (!h.asi?.[l]) w.push(`Choose your level ${l} ability increase.`);
  void sp;
  return w;
}
// The token fields a hero gets on the map (the DM's app keeps damage and position when a sheet is updated).
export function heroToken(h){
  const st = heroStats(h);
  return { kind:'pc', name:h.name || 'Hero', color:h.color || st.C.color, ac:st.ac, maxHp:st.hp, speed:st.spd, init:st.init,
    saveMod:Math.max(...Object.values(st.saves)), saves:Object.fromEntries(Object.entries(st.saves).map(([a, v]) => [lower(a), v])),
    check:st.check, passive:st.passive, attacks:heroAttacks(h, st), casts:castables(h, st), charId:h.id,
    cls:`${h.cls} ${st.L}${st.sub ? ` · ${st.sub}` : ''}`, spellDc:st.dc, resources:heroResources(h, st), ...(h.cls === 'Barbarian' ? { rageDmg:st.L >= 9 ? 3 : 2 } : {}) };
}
