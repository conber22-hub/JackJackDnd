/* HEROES — a character sheet (what the creator saves) and everything derived from it: ability scores, AC, HP,
   saves, skills, passive Perception, attacks, spells and the token that goes on the map. Pure: no DOM. */
import { ABILITIES, CLASSES, SPECIES, BACKGROUNDS, WEAPONS, ARMOR, SPELLS, SUBSPELLS, SKILLS, SLOTS_FULL, SLOTS_HALF, PACT, FEATS, mod, profBonus, MAX_LEVEL } from '../data/srd.js';
import { clamp, uid } from '../util/core.js';
import { heroLook } from './look.js';

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
// Level 19 grants an Epic Boon or another qualifying feat, using the existing feat-pick shape.
export const asiLevels = h => [4, 8, 12, 16, 19, ...(CLASSES[h.cls].asiExtra || [])].filter(l => l <= clamp(+h.lvl || 1, 1, MAX_LEVEL)).sort((a, b) => a - b);
/* What the hero took at each Ability Score Improvement level: { l, feat, ab, ab2, list, skills, name, note, hp }.
   Old sheets stored just an ability ('Str'): that's the Ability Score Improvement, +2. */
export function asiPicks(h){
  return asiLevels(h).map(l => { const v = h.asi?.[l]; if (!v) return null; return typeof v === 'string' ? { l, feat:'Ability Score Improvement', ab:v } : { l, ...v }; }).filter(p => p?.feat);
}
// Magic Initiate lists a hero has: from their background and from feats.
const miLists = h => [BACKGROUNDS[h.bg]?.mi, ...asiPicks(h).filter(p => p.feat === 'Magic Initiate' && p.list).map(p => p.list)].filter(Boolean);
export function expertiseSlots(h){ const ex = CLASSES[h.cls].expertise || {}; return Object.entries(ex).filter(([l]) => +l <= h.lvl).reduce((a, [, n]) => a + n, 0); }
export function maxSpellLevel(h){
  const C = CLASSES[h.cls], L = clamp(+h.lvl || 1, 1, MAX_LEVEL);
  if (C.full) return SLOTS_FULL[L - 1].length; if (C.half) return SLOTS_HALF[L - 1].length; if (C.pact) return PACT[L - 1][1];
  return 0;
}
// Arcanum spells are separate once-per-long-rest choices, never level 6–9 pact slots.
export const arcanumLevels = h => h.cls === 'Warlock' ? [6, 7, 8, 9].filter(l => h.lvl >= l * 2 - 1) : [];
export function spellPool(h){
  const C = CLASSES[h.cls], bg = BACKGROUNDS[h.bg], maxL = Math.max(maxSpellLevel(h), ...arcanumLevels(h));
  const pool = C.letter ? SPELLS.filter(s => s.c.includes(C.letter) && s.l <= maxL && s.n !== 'Divine Smite') : [];
  const bgPool = miLists(h).flatMap(L => SPELLS.filter(s => s.c.includes(L) && s.l <= 1)); void bg;
  return [...new Map([...pool, ...bgPool].map(s => [s.n, s])).values()].sort((a, b) => a.l - b.l || a.n.localeCompare(b.n));
}
export function spellLimits(h){
  const C = CLASSES[h.cls], L = clamp(+h.lvl || 1, 1, MAX_LEVEL), bg = BACKGROUNDS[h.bg];
  const mi = miLists(h).length; void bg;
  return { cantrips:(C.cantrips?.[L - 1] || 0) + mi * 2, prepared:(C.prep?.[L - 1] || 0) + mi };
}

export function heroStats(h){
  const C = CLASSES[h.cls] || CLASSES.Fighter, L = clamp(+h.lvl || 1, 1, MAX_LEVEL), pb = profBonus(L), bg = BACKGROUNDS[h.bg], spc = SPECIES[h.sp] || SPECIES.Human;
  const sc = {}; for (const a of ABILITIES) sc[a] = +h.ab?.[a] || 10;
  if (bg){ if (h.bg2 && bg.ab.includes(h.bg2)) sc[h.bg2] += 2; if (h.bg1 && bg.ab.includes(h.bg1) && h.bg1 !== h.bg2) sc[h.bg1] += 1; }
  const picks = asiPicks(h), took = n => picks.some(p => p.feat === n);
  const up = (a, n) => { if (sc[a] !== undefined) sc[a] = Math.min(20, sc[a] + n); };
  for (const p of picks){
    if (p.feat === 'Ability Score Improvement'){ if (p.ab2 && p.ab2 !== p.ab){ up(p.ab, 1); up(p.ab2, 1); } else up(p.ab, 2); }
    else if ((FEATS[p.feat]?.plus || p.feat === 'Other') && p.ab && (!FEATS[p.feat]?.plus || FEATS[p.feat].plus.includes(p.ab))) up(p.ab, 1);
  }
  if (L === 20) for (const a of h.cls === 'Barbarian' ? ['Str', 'Con'] : h.cls === 'Monk' ? ['Dex', 'Wis'] : []) sc[a] = Math.min(25, sc[a] + 4);
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
  const styles = new Set([style, ...picks.filter(p => FEATS[p.feat]?.style).map(p => p.feat)].filter(Boolean));
  if (styles.has('Defense') && armorName !== 'None') ac += 1;
  // hit points: max at level 1, then the fixed average
  let hp = C.hd + M('Con') + (L - 1) * (C.hd / 2 + 1 + M('Con'));
  if (h.sp === 'Dwarf') hp += L;
  if (sub === 'Draconic Sorcery') hp += L;
  for (const p of picks) if (p.feat === 'Other' && +p.hp > 0) hp += Math.min(3, +p.hp) * L;   // a written-in feat with hit points (like one that makes you tough)
  hp = Math.max(1, Math.floor(hp));
  // speed
  let spd = spc.spd;
  if (h.cls === 'Barbarian' && L >= 5 && arm.t !== 'heavy') spd += 10;
  if (h.cls === 'Monk' && L >= 2 && armorName === 'None' && !h.shield) spd += L >= 18 ? 30 : L >= 14 ? 25 : L >= 10 ? 20 : L >= 6 ? 15 : 10;
  if (h.cls === 'Ranger' && L >= 6) spd += 10;
  // spellcasting
  const mi0 = miLists(h)[0], castAb = C.cast || (mi0 ? (mi0 === 'W' ? 'Int' : 'Wis') : null);
  const dc = castAb ? 8 + pb + M(castAb) : null, spAtk = castAb ? pb + M(castAb) : null;
  // saves & skills
  const saves = {}; for (const a of ABILITIES) saves[a] = M(a) + (C.sv.includes(a) || (h.cls === 'Monk' && L >= 14) || (h.cls === 'Rogue' && L >= 15 && ['Wis', 'Cha'].includes(a)) ? pb : 0);
  const prof = new Set([...(h.skills || []), ...(bg?.skills || [])]);
  if (h.sp === 'Elf') prof.add('Perception');
  if (h.sp === 'Human' && h.extraSkill) prof.add(h.extraSkill);
  for (const p of picks) if (p.feat === 'Skilled') for (const sk of (p.skills || []).slice(0, 3)) if (SKILLS[sk]) prof.add(sk);
  const expert = new Set((h.expert || []).filter(s => prof.has(s)).slice(0, expertiseSlots(h)));
  const jack = h.cls === 'Bard' && L >= 2;
  const skills = {}; for (const [s, a] of Object.entries(SKILLS)) skills[s] = M(a) + (prof.has(s) ? pb : jack ? Math.floor(pb / 2) : 0) + (expert.has(s) ? pb : 0);
  const passive = 10 + skills.Perception;
  const tools = C.tools || bg?.tools;
  const check = M('Dex') + (tools ? pb : 0);
  let init = M('Dex') + (bg?.alert || took('Alert') ? pb : 0);
  const slots = C.full ? SLOTS_FULL[L - 1] : C.half ? SLOTS_HALF[L - 1] : null;
  const pact = C.pact ? { n:PACT[L - 1][0], l:PACT[L - 1][1] } : null;
  const features = [];
  for (let l = 1; l <= L; l++) for (const f of C.features[l] || []) features.push(`${f} (${l})`);
  for (const p of picks) if (p.feat !== 'Ability Score Improvement') features.push(`${p.feat === 'Other' ? (p.name || 'A feat') : p.feat}${p.feat === 'Magic Initiate' && p.list ? ` (${FEATS['Magic Initiate'].lists[p.list]})` : ''} — feat (${p.l})`);
  return { sc, M, pb, ac, hp, spd, dc, spAtk, castAb, init, saves, skills, prof, expert, passive, check, slots, pact, features, sub, L, C, style, styles, picks };
}

const dieMul = (d, n) => d.replace(/^(\d*)d(\d+)/, (_, c, f) => `${(+c || 1) * n}d${f}`);
export const cantripDice = (d, L) => dieMul(d, L >= 17 ? 4 : L >= 11 ? 3 : L >= 5 ? 2 : 1);
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
    const hit = st.pb + m + (ranged && st.styles.has('Archery') ? 2 : 0);
    const dmgBonus = m + (!ranged && st.styles.has('Dueling') && !/2/.test(w.p) && !two ? 2 : 0);
    // range [normal, long] in feet for bows and thrown weapons (a thrown dagger is melee too); reach weapons hit 10 ft. away
    out.push({ n:name, b:hit, d:`${die}${dmgBonus ? sgn(dmgBonus) : ''}`, t:w.ty, f:`{A} attacks {T} with a ${name.toLowerCase()}.`, ...(ranged ? {} : { m:1 }),
      ...(Array.isArray(w.rng) ? { rng:[...w.rng] } : {}), ...(/R/.test(w.p) ? { reach:2 } : {}) });
  }
  if (h.cls === 'Monk'){
    const m = Math.max(st.M('Dex'), st.M('Str')), die = L >= 17 ? '1d12' : L >= 11 ? '1d10' : L >= 5 ? '1d8' : '1d6';
    out.push({ n:'Unarmed Strike', b:st.pb + m, d:`${die}${sgn(m)}`, t:'bludgeoning', f:'{A} strikes {T} with open hand and heel.', m:1 });
  }
  if (!out.length) out.push({ n:'Unarmed Strike', b:st.pb + st.M('Str'), d:`${Math.max(1, 1 + st.M('Str'))}`, t:'bludgeoning', f:'{A} punches {T}.', m:1 });
  if (h.cls === 'Rogue') out[0].f += ` (Sneak Attack +${Math.ceil(L / 2)}d6 once a turn — add it with "+ HP" or the DM's call.)`;
  // spell attacks become attack buttons too
  for (const sp of heroSpells(h, st)) if (sp.k === 'atk' && sp.d){
    const d = sp.l === 0 && sp.cs ? cantripDice(sp.d, L) : sp.n === 'Eldritch Blast' ? sp.d : sp.d;
    // several attack rolls from one casting: Eldritch Blast's beams, Scorching Ray's three rays (2d6 each)
    const rays = sp.n === 'Eldritch Blast' ? (L >= 17 ? 4 : L >= 11 ? 3 : L >= 5 ? 2 : 1) : sp.n === 'Scorching Ray' ? 3 : 1;
    const agon = sp.n === 'Eldritch Blast' && h.invoc === 'Agonizing Blast' ? st.M('Cha') : 0;
    const die = sp.n === 'Scorching Ray' ? '2d6' : d;
    out.push({ n:sp.n + (rays > 1 ? ` (×${rays} ${sp.n === 'Scorching Ray' ? 'rays' : 'beams'})` : ''), b:st.spAtk, d:`${die}${agon ? sgn(agon) : ''}${sp.addmod ? sgn(st.M(st.castAb)) : ''}`, t:sp.ty, f:`{A} casts ${sp.n} at {T}.`,
      ...(sp.l ? { l:sp.l, sn:sp.n } : {}), ...(rays > 1 ? { rays } : {}), ...(SUSTAINED.has(sp.n) ? { again:1 } : {}), rng:[Math.max(5, sp.r ?? 60)] });
  }
  return out;
}
// Saves from before ranges: give a hero's weapons and spells their range, reach and area, matched by name
// (attacks the DM has renamed or written by hand keep whatever they have).
export function addRanges(t){
  for (const a of t.attacks || []){
    if (a.rng || a.reach) continue;
    const base = String(a.n || '').replace(/ \(×.*\)$/, ''), w = W(base), sp = SP(a.sn || base);
    if (w){ if (Array.isArray(w.rng)) a.rng = [...w.rng]; if (/R/.test(w.p)) a.reach = 2; }
    else if (sp && sp.k === 'atk') a.rng = [Math.max(5, sp.r ?? 60)];
  }
  for (const c of t.casts || []){ const sp = SP(c.n); if (!sp) continue; c.r ??= sp.r ?? 60; if (sp.area && !c.area) c.area = [...sp.area]; }
  return t;
}
export function heroSpells(h, st = heroStats(h)){
  const out = new Set(h.spells || []);
  const ss = st.sub && SUBSPELLS[st.sub];
  if (ss) for (const [lv, list] of Object.entries(ss)) if (st.L >= +lv) list.forEach(n => out.add(n));
  if (h.cls === 'Paladin' && st.L >= 2) out.add('Divine Smite');
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
    ...(sp.area ? { area:[...sp.area] } : {}), r:sp.r ?? 60,
    healMod:sp.k === 'heal' ? st.M(st.castAb || 'Wis') : 0, ...(sp.k === 'util' && sp.d ? { k:'auto', smite:1 } : {}), ...(sp.note ? { note:sp.note } : {}),
    ...(SUSTAINED.has(sp.n) ? { again:1 } : {}), ...(/^Mass /.test(sp.n) && sp.k === 'heal' ? { multi:6, rad:6 } : {}) }));
}
// Spells whose effect stays and is used again on later turns without a new slot (until a long rest, the caster
// drops, or they cast another of these — close enough to concentration for the table).
export const SUSTAINED = new Set(['Spiritual Weapon', 'Vampiric Touch', 'Moonbeam', 'Spirit Guardians']);

/* RESOURCES — what a hero spends and gets back on a rest: spell slots, pact slots, class features, Hit Dice.
   rest: 'long' (back on a long rest) · 'short' (all back on a short rest) · 'short1' (one back on a short rest)
   use: what tapping it does — 'rage' · 'secondwind' · 'lay' (5 HP to a target) · 'hitdie' · 'recover' (slots back) · 'note' (a card) */
export function heroResources(h, st = heroStats(h)){
  const L = st.L, out = [], C = st.C, cls = h.cls;
  (st.slots || []).forEach((n, i) => out.push({ id:`slot${i + 1}`, n:`Level ${i + 1} slots`, max:n, rest:'long', slot:i + 1 }));
  if (st.pact) out.push({ id:'pact', n:`Pact slots (level ${st.pact.l})`, max:st.pact.n, rest:'short', slot:st.pact.l });
  const f = (id, n, max, rest, use = 'note', text = '', more = {}) => { if (max > 0) out.push({ id, n, max, rest, use, text, ...more }); };
  if (cls === 'Barbarian') f('rage', 'Rage', L >= 17 ? 6 : L >= 12 ? 5 : L >= 6 ? 4 : L >= 3 ? 3 : 2, 'short1', 'rage', 'Resistance to bludgeoning, piercing and slashing; extra damage on Strength melee hits. No spells, no concentration.');
  if (cls === 'Bard') f('inspire', 'Bardic Inspiration', Math.max(1, st.M('Cha')), L >= 5 ? 'short' : 'long', 'note', `A creature you can see gets a d${L >= 15 ? 12 : L >= 10 ? 10 : L >= 5 ? 8 : 6} to add to one d20 test in the next hour.`);
  if (cls === 'Cleric' && L >= 2) f('channel', 'Channel Divinity', L >= 18 ? 4 : L >= 6 ? 3 : 2, 'short1', 'note', `Divine Spark (heal or harm ${L >= 18 ? 4 : L >= 13 ? 3 : L >= 7 ? 2 : 1}d8+${st.M('Wis')}) or Turn Undead (DC ${st.dc} Wis, undead within 30 ft. flee)${L >= 3 ? ' — or Preserve Life' : ''}.`);
  if (cls === 'Paladin' && L >= 3) f('channel', 'Channel Divinity', L >= 11 ? 3 : 2, 'short1', 'note', `Sacred Weapon (+${Math.max(1, st.M('Cha'))} to hit, the weapon sheds light) or Divine Sense.`);
  if (cls === 'Paladin' && L >= 2) f('smite', 'Paladin\'s Smite', 1, 'long', 'note', 'Cast Divine Smite once without a slot (used first when you cast it).', { free:'Divine Smite' });
  if (cls === 'Paladin') f('lay', 'Lay on Hands', 5 * L, 'long', 'lay', 'Touch a creature: 5 HP from the pool per tap (or 5 points to cure Poisoned).');
  if (cls === 'Druid' && L >= 2) f('wild', 'Wild Shape', L >= 17 ? 4 : L >= 6 ? 3 : 2, 'short1', 'note', `Take a beast shape for up to ${Math.floor(L / 2)} hours (a bonus action).`);
  if (cls === 'Fighter') f('wind', 'Second Wind', L >= 10 ? 4 : L >= 4 ? 3 : 2, 'short1', 'secondwind', `Regain 1d10+${L} HP (a bonus action).`, { dice:`1d10+${L}` });
  if (cls === 'Fighter' && L >= 2) f('surge', 'Action Surge', L >= 17 ? 2 : 1, 'short', 'note', 'One more action this turn, except the Magic action. Only once per turn.');
  if (cls === 'Fighter' && L >= 9) f('indomitable', 'Indomitable', L >= 17 ? 3 : L >= 13 ? 2 : 1, 'long', 'note', `Reroll a failed saving throw with +${L}.`);
  if (cls === 'Monk' && L >= 2) f('focus', 'Focus Points', L, 'short', 'note', `Flurry of Blows, Patient Defense or Step of the Wind${L >= 5 ? ` — or Stunning Strike (DC ${8 + st.pb + st.M('Wis')} Con)` : ''}.`);
  if (cls === 'Sorcerer' && L >= 2) f('sorcery', 'Sorcery Points', L, 'long', 'note', 'Metamagic, or turn points into spell slots.');
  if (cls === 'Sorcerer' && L >= 5) f('sorcrest', 'Sorcerous Restoration', 1, 'long', 'recover', `After a short rest: up to ${Math.floor(L / 2)} Sorcery Points come back.`, { points:Math.floor(L / 2) });
  if (cls === 'Ranger') f('favored', 'Favored Enemy', L >= 17 ? 6 : L >= 13 ? 5 : L >= 9 ? 4 : L >= 5 ? 3 : 2, 'long', 'note', 'Cast Hunter\'s Mark without spending a slot (used first when you cast it).', { free:'Hunter\'s Mark' });
  if (cls === 'Wizard') f('arcane', 'Arcane Recovery', 1, 'long', 'recover', `After a short rest: spent slots worth up to ${Math.ceil(L / 2)} levels come back; none may be level 6 or higher.`, { lv:Math.ceil(L / 2) });
  if (cls === 'Warlock' && L >= 2) f('cunning', 'Magical Cunning', 1, 'long', 'recover', `${L >= 20 ? 'All' : 'Half (round up) of'} your pact slots come back (one minute's rite).`, { pact:1 });
  for (const level of arcanumLevels(h)){
    const sp = (h.spells || []).map(SP).find(s => s?.l === level && s.c.includes('K'));
    f(`arcanum${level}`, `Mystic Arcanum (level ${level}${sp ? `: ${sp.n}` : ''})`, 1, 'long', 'note', sp ? `Cast ${sp.n} once without a slot.` : `Choose one level ${level} Warlock spell.`, sp ? { free:sp.n } : {});
  }
  // Magic Initiate (Acolyte, Sage): one of its level-1 spells once a long rest without a slot
  const bg = BACKGROUNDS[h.bg];
  const usedMi = new Set();
  miLists(h).forEach((list, i) => {
    const mine = (h.spells || []).map(SP).filter(s => s?.l === 1 && s.c.includes(list) && !usedMi.has(s.n));
    const mi = mine.find(s => !(C.letter && s.c.includes(C.letter))) || mine[0];
    if (mi){ usedMi.add(mi.n); f(i ? `mi${i}` : 'mi', `Magic Initiate (${mi.n})`, 1, 'long', 'note', `Cast ${mi.n} once without a slot (used first when you cast it).`, { free:mi.n }); }
  }); void bg;
  if (h.sp === 'Human') f('heroic', 'Heroic Inspiration', 1, 'long', 'note', 'Reroll any die, once. Yours again after every long rest.');
  out.push({ id:'hd', n:`Hit Dice (d${C.hd})`, max:L, rest:'long', use:'hitdie', die:C.hd, mod:st.M('Con'), text:`Spend on a short rest: d${C.hd}${sgn(st.M('Con'))} HP each.` });
  return out;
}
export function heroWarnings(h){
  const st = heroStats(h), lim = spellLimits(h), sp = heroSpells(h, st), w = [];
  if (!h.name?.trim()) w.push('Give your hero a name.');
  const C = CLASSES[h.cls];
  if ((h.skills || []).length !== C.skills[0]) w.push(`Pick ${C.skills[0]} class skills (you have ${(h.skills || []).length}).`);
  const can = (h.spells || []).filter(n => SP(n)?.l === 0).length, prep = (h.spells || []).filter(n => SP(n)?.l > 0 && !(h.cls === 'Warlock' && SP(n).l >= 6)).length;
  if (lim.cantrips && can > lim.cantrips) w.push(`Too many cantrips: ${can} of ${lim.cantrips}.`);
  if (lim.prepared && prep > lim.prepared) w.push(`Too many prepared spells: ${prep} of ${lim.prepared}.`);
  if (h.cls === 'Warlock'){
    for (const level of arcanumLevels(h)){
      const chosen = (h.spells || []).map(SP).filter(s => s?.l === level && s.c.includes('K'));
      if (chosen.length !== 1) w.push(`Choose one level ${level} Warlock spell for Mystic Arcanum (you have ${chosen.length}).`);
    }
    for (const n of h.spells || []){ const s = SP(n); if (s?.l >= 6 && (!arcanumLevels(h).includes(s.l) || !s.c.includes('K'))) w.push(`${n} is not an available Mystic Arcanum.`); }
  }
  if (h.method === 'pointbuy'){ const pts = Object.values(h.ab).reduce((a, v) => a + (({ 8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9 })[v] ?? 99), 0); if (pts > 27) w.push(`Point buy over budget: ${pts} of 27.`); }
  for (const l of asiLevels(h)){
    const v = h.asi?.[l], p = typeof v === 'string' ? { feat:'Ability Score Improvement', ab:v } : v;
    if (!p?.feat){ w.push(`Choose your level ${l} ability increase or feat.`); continue; }
    if (p.feat === 'Ability Score Improvement' && !p.ab) w.push(`Level ${l}: pick the ability to increase.`);
    if (p.feat === 'Grappler' && !['Str', 'Dex'].includes(p.ab)) w.push(`Level ${l} Grappler: +1 to Str or Dex?`);
    if (p.feat === 'Magic Initiate' && !p.list) w.push(`Level ${l} Magic Initiate: choose Cleric, Druid or Wizard.`);
    if (p.feat === 'Skilled' && (p.skills || []).filter(Boolean).length < 3) w.push(`Level ${l} Skilled: choose three skills.`);
    if (p.feat === 'Other' && !p.name) w.push(`Level ${l}: name your feat.`);
    if (FEATS[p.feat]?.style && !C.style) w.push(`Level ${l}: ${p.feat} needs the Fighting Style feature.`);
    if (asiLevels(h).some(o => o !== l && (h.asi?.[o]?.feat === p.feat) && p.feat !== 'Ability Score Improvement' && p.feat !== 'Other' && p.feat !== 'Magic Initiate')) w.push(`${p.feat} can only be taken once.`);
  }
  void sp;
  return [...new Set(w)];
}
// The token fields a hero gets on the map (the DM's app keeps damage and position when a sheet is updated).
export function heroToken(h){
  const st = heroStats(h);
  return { kind:'pc', name:h.name || 'Hero', color:h.color || st.C.color, ac:st.ac, maxHp:st.hp, speed:st.spd, init:st.init,
    saveMod:Math.max(...Object.values(st.saves)), saves:Object.fromEntries(Object.entries(st.saves).map(([a, v]) => [lower(a), v])),
    check:st.check, passive:st.passive, skills:{ ...st.skills }, mods:Object.fromEntries(ABILITIES.map(a => [lower(a), st.M(a)])), attacks:heroAttacks(h, st), casts:castables(h, st), charId:h.id,
    cls:`${h.cls} ${st.L}${st.sub ? ` · ${st.sub}` : ''}`, spellDc:st.dc, resources:heroResources(h, st), ...(h.cls === 'Barbarian' ? { rageDmg:st.L >= 16 ? 4 : st.L >= 9 ? 3 : 2 } : {}),
    look:heroLook(h), standee:h.miniStyle === 'picture' };
}
