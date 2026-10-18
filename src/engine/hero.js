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
    out.push({ n:name, b:hit, d:`${die}${dmgBonus ? sgn(dmgBonus) : ''}`, t:w.ty, f:`{A} attacks {T} with a ${name.toLowerCase()}.` });
  }
  if (h.cls === 'Monk'){
    const m = Math.max(st.M('Dex'), st.M('Str')), die = L >= 5 ? '1d8' : '1d6';
    out.push({ n:'Unarmed Strike', b:st.pb + m, d:`${die}${sgn(m)}`, t:'bludgeoning', f:'{A} strikes {T} with open hand and heel.' });
  }
  if (!out.length) out.push({ n:'Unarmed Strike', b:st.pb + st.M('Str'), d:`${Math.max(1, 1 + st.M('Str'))}`, t:'bludgeoning', f:'{A} punches {T}.' });
  if (h.cls === 'Rogue') out[0].f += ` (Sneak Attack +${Math.ceil(L / 2)}d6 once a turn — add it with "+ HP" or the DM's call.)`;
  // spell attacks become attack buttons too
  for (const sp of heroSpells(h, st)) if (sp.k === 'atk' && sp.d){
    const d = sp.l === 0 && sp.cs ? cantripDice(sp.d, L) : sp.n === 'Eldritch Blast' ? sp.d : sp.d;
    const beams = sp.n === 'Eldritch Blast' ? (L >= 11 ? 3 : L >= 5 ? 2 : 1) : 1;
    const agon = sp.n === 'Eldritch Blast' && h.invoc === 'Agonizing Blast' ? st.M('Cha') : 0;
    out.push({ n:sp.n + (beams > 1 ? ` (×${beams} beams)` : ''), b:st.spAtk, d:`${d}${agon ? sgn(agon) : ''}${sp.addmod ? sgn(st.M(st.castAb)) : ''}`, t:sp.ty, f:`{A} casts ${sp.n} at {T}.` });
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
// Spells that need the DM's app to resolve something (saves, heals) — the token's "cast" buttons.
export function castables(h, st = heroStats(h)){
  return heroSpells(h, st).filter(sp => sp.k === 'save' || sp.k === 'heal' || sp.k === 'auto').map(sp => ({
    n:sp.n, k:sp.k, l:sp.l, sv:sp.sv, dc:st.dc, d:sp.d ? (sp.l === 0 && sp.cs ? cantripDice(sp.d, st.L) : sp.d) : null, ty:sp.ty, half:!!sp.half,
    rad:sp.area ? Math.max(1, Math.round(sp.area[1] / (sp.area[0] === 'cone' || sp.area[0] === 'line' ? 10 : 5))) : 0, cond:sp.cond || null,
    healMod:sp.k === 'heal' ? st.M(st.castAb || 'Wis') : 0 }));
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
    cls:`${h.cls} ${st.L}${st.sub ? ` · ${st.sub}` : ''}`, spellDc:st.dc };
}
