/* 🗡 THE WANDERER, the long road: what the game keeps between fights when there is no DM. Pure, no DOM; game/wander.js
   asks it and does what it says.
     · XP and levels: the party shares what it earns, and each grows on the 5e table
     · levelling a sheet up by itself: an ability increase into the class's main ability, spells chosen to fill what the
       new level allows (healing and harm first), the subclass the class comes with (the player can instead choose in
       the creator)
     · loot: coins off a fight, now and then a Potion of Healing or something worth carrying
     · quests: steps (arrive somewhere, win fights on a road, rest in a place), counted from what happens
     · approval: each companion likes some deeds and hates others; enough of it opens their own quest, too little
       and they walk away
     · roadside choices: a scene, two or three things to do (some a skill check the game rolls), and what comes of it */
import { CLASSES, SPELLS, MAX_LEVEL } from '../data/srd.js';
import { asiLevels, spellPool, spellLimits, maxSpellLevel, arcanumLevels } from './hero.js';
import { hoard } from './hoard.js';

/* ---------- XP and levels ---------- */
export const XP_LEVELS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
export const levelFor = xp => { let l = 1; while (l < MAX_LEVEL && xp >= XP_LEVELS[l]) l++; return l; };
export const xpForNext = lvl => lvl >= MAX_LEVEL ? null : XP_LEVELS[lvl];
// Each of the party's share of a fight's XP (the dead count: they were there).
export const shareXp = (xp, n) => Math.floor(Math.max(0, xp) / Math.max(1, n));

/* ---------- levelling a sheet by itself ---------- */
// The ability a class lives by: the one it casts with, else the highest of its standard array.
export function mainAbility(cls){
  const C = CLASSES[cls] || CLASSES.Fighter;
  return C.cast || Object.entries(C.arr).sort((a, b) => b[1] - a[1])[0][0];
}
// What a spell is worth to someone who has to pick it in the dark: healing and harm first, then anything with dice.
const worth = s => (s.k === 'heal' ? 40 : 0) + (['save', 'auto', 'atk'].includes(s.k) && s.d ? 30 : 0) + (s.k === 'buff' ? 12 : 0) + (s.d ? 5 : 0) + s.l;
/* sheet → a new sheet at level `to` (no further than MAX_LEVEL), every choice the new level asks made: each Ability
   Score Improvement level with nothing chosen takes +2 in the main ability (or the next best, once it is 20), and
   cantrips and prepared spells are filled up to what the level allows from the best of the class's list. Nothing the
   sheet already chose is changed. */
export function autoLevel(sheet, to = (+sheet.lvl || 1) + 1){
  const h = structuredClone(sheet);
  h.lvl = Math.max(+h.lvl || 1, Math.min(MAX_LEVEL, to));
  h.asi = { ...(h.asi || {}) };
  const main = mainAbility(h.cls);
  for (const l of asiLevels(h)){
    if (h.asi[l]) continue;
    // the score so far (array + every +2 already taken into it): past 18, put it into Constitution instead
    const took = Object.values(h.asi).filter(v => (typeof v === 'string' ? v : v?.ab) === main && (typeof v === 'string' || v?.feat === 'Ability Score Improvement')).length;
    h.asi[l] = { feat:'Ability Score Improvement', ab:(+h.ab?.[main] || 10) + 2 + took * 2 > 20 ? (main === 'Con' ? 'Dex' : 'Con') : main };
  }
  const lim = spellLimits(h);
  if (lim.cantrips || lim.prepared){
    const have = new Set(h.spells || []), pool = spellPool(h), arc = arcanumLevels(h), maxL = maxSpellLevel(h);
    const can = [...have].filter(n => SPELLS.find(s => s.n === n)?.l === 0).length;
    const prep = [...have].filter(n => { const s = SPELLS.find(x => x.n === n); return s?.l > 0 && !(h.cls === 'Warlock' && s.l >= 6); }).length;
    const best = l => pool.filter(s => (l === 0 ? s.l === 0 : s.l > 0 && s.l <= maxL) && !have.has(s.n)).sort((a, b) => worth(b) - worth(a) || a.n.localeCompare(b.n));
    for (const s of best(0).slice(0, Math.max(0, lim.cantrips - can))) have.add(s.n);
    for (const s of best(1).slice(0, Math.max(0, lim.prepared - prep))) have.add(s.n);
    // a warlock's Mystic Arcanum: one of each level it has, if not chosen
    for (const l of arc) if (![...have].some(n => SPELLS.find(s => s.n === n)?.l === l)){ const s = pool.filter(x => x.l === l && x.c.includes('K')).sort((a, b) => worth(b) - worth(a))[0]; if (s) have.add(s.n); }
    h.spells = [...have];
  }
  return h;
}

/* ---------- loot ---------- */
/* What the party finds after a fight worth xp at this level. → { gp, sp, items:[name] }. Beasts carry nothing, but the
   road has its dead: something always turns up, more for a harder fight. */
export function fightLoot(xp, { level = 1, rng = Math.random } = {}){
  const out = { gp:0, sp:0, items:[] };
  if (xp <= 0) return out;
  const coin = Math.round(xp * (.12 + rng() * .18) * 10);   // in silver
  out.gp = Math.floor(coin / 10); out.sp = coin % 10;
  if (rng() < Math.min(.6, .25 + xp / 1000)) out.items.push('Potion of Healing');
  if (rng() < Math.min(.4, .08 + xp / 2500)){ const h = hoard(1, { level:Math.max(1, Math.min(20, level)), fam:'road', rng }); for (const i of h.items) out.items.push(i.n); }
  return out;
}

/* ---------- quests ---------- */
/* A quest (data/wander.js QUESTS): { id, title, from, need, text, steps:[{ k, place?, near?, n?, say }], reward:{ xp,
   gp, item, approve:{ id:n } } }. Its progress: { id, step, n, done }. What happens: { k:'arrive', place } ·
   { k:'win', road:true|false, from, to, place } · { k:'rest', place } */
const fits = (st, ev) => st.k === ev.k && (!st.place || st.place === ev.place) && (!st.near || ev.from === st.near || ev.to === st.near || ev.place === st.near) && (st.road === undefined || !!ev.road === st.road);
// → { quests, stepped:[id], done:[id] } (the list is new; the old one is left alone)
export function advanceQuests(quests = [], defs = [], ev){
  const out = { quests:quests.map(q => ({ ...q })), stepped:[], done:[] };
  for (const q of out.quests){
    if (q.done) continue;
    const d = defs.find(x => x.id === q.id), st = d?.steps[q.step]; if (!st || !fits(st, ev)) continue;
    q.n = (q.n || 0) + 1;
    if (q.n < (st.n || 1)) { out.stepped.push(q.id); continue; }
    q.step++; q.n = 0; out.stepped.push(q.id);
    if (q.step >= d.steps.length){ q.done = true; out.done.push(q.id); }
  }
  return out;
}
export const questText = (q, def) => { if (!def) return ''; if (q.done) return 'Done.'; const st = def.steps[q.step]; return st ? `${st.say}${st.n > 1 ? ` (${q.n || 0} of ${st.n})` : ''}` : ''; };
// Can this companion's own quest be asked for? (they're along, they like the hero enough, it isn't taken)
export const questOpen = (def, { party = [], approval = {}, quests = [] } = {}) => !!def && !quests.some(q => q.id === def.id) && (!def.from || def.from === 'start' || def.from === 'folk' || (party.some(p => p.id === def.from) && (approval[def.from] || 0) >= (def.need || 0)));

/* ---------- approval ---------- */
export const clampApproval = n => Math.max(-100, Math.min(100, Math.round(n)));
// What a companion thinks of the hero, in words.
export function loyalty(n = 0){
  if (n >= 60) return { k:'devoted', label:'Devoted' };
  if (n >= 25) return { k:'warm', label:'Warm' };
  if (n > -25) return { k:'wary', label:'Wary' };
  if (n > -60) return { k:'cold', label:'Cold' };
  return { k:'leaving', label:'Leaving' };
}
/* What the party thinks of a deed. party: [{ id }]; tags: what kind of deed ('mercy', 'cruel', 'greed', 'faith', 'law',
   'clever', 'brave', 'cold'); likes: id → { tag:n }. → [{ id, n }] for every companion who cares either way. */
export function reactions(party = [], tags = [], likes = {}){
  return party.map(p => ({ id:p.id, n:tags.reduce((s, t) => s + (likes[p.id]?.[t] || 0), 0) })).filter(r => r.n);
}

/* ---------- roadside choices ---------- */
/* A scene (data/wander.js MOMENTS): { id, title, text, options:[{ k, label, check?:{ skill, dc }, tags, ok:{…}, fail:{…} }] }.
   An outcome: { text, xp, gp, item, heal, hurt, gaze }. → { ok, d20, bonus, total, dc, skill, out } */
export function resolveChoice(opt, skills = {}, d20 = 10){
  const ch = opt?.check;
  if (!ch) return { ok:true, d20:null, bonus:0, total:null, dc:null, skill:null, out:opt?.ok || {} };
  const bonus = +skills[ch.skill] || 0, total = d20 + bonus, ok = d20 === 20 || (d20 !== 1 && total >= ch.dc);
  return { ok, d20, bonus, total, dc:ch.dc, skill:ch.skill, out:(ok ? opt.ok : opt.fail || opt.ok) || {} };
}
// Should a scene meet the party on this step of the road? Not before the road has been quiet a while, once a stretch.
export const momentChance = ({ quiet = 0, had = false } = {}) => had || quiet < 15 ? 0 : Math.min(.12, .03 + (quiet - 15) * .004);
// Which: one not met before (the oldest unmet first, so a run sees them all), or null.
export const nextMoment = (moments = [], seen = [], rng = Math.random) => { const left = moments.filter(m => !seen.includes(m.id)); return left.length ? left[Math.floor(rng() * left.length)] : null; };

/* ---------- an old run's state, brought up to date ---------- */
export function upgradeWander(w){
  if (!w) return w;
  w.quests ||= []; w.approval ||= {}; w.moments ||= []; w.momentAt ||= ''; w.lvlSeen ||= 1;
  return w;
}
