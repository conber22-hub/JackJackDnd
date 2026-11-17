/* 🏆 THE WANDERER'S RECORD — what a run remembers of its fights and its road, for the screens between the fights
   (Muse's ui/victory.js, ui/bestiary.js, ui/trophies.js, ui/levelup.js) over ChatGPT's engines:
     · each fight, blow by blow, as it happens (the game's bus: acted, hurt, healed, turnAct, feature), turned into
       its scorecard when it's won (engine/fight-summary.js summarize: the headline, the MVP, the awards)
     · the achievements (engine/achievements.js track): every fight, kill, heal, arrival, quest and level counted in
       the run's save (w.trophies); each one earned slides a banner in
     · the bestiary (engine/bestiary-lore.js note): every creature the party has seen, fought and killed (w.beasts);
       enough kills and the book tells its story
   Only the Wanderer's own run is recorded: never the DM's table. */
import { state, tokById } from '../engine/state.js';
import { bus } from '../util/core.js';
import { BEST } from '../data/bestiary.js';
import { summarize } from '../engine/fight-summary.js';
import { fresh as freshTrophies, track as trackA, shelf, score } from '../engine/achievements.js';
import { note, book } from '../engine/bestiary-lore.js';
import { LORE } from '../data/bestiary-lore.js';
import { trophyBanner } from '../ui/trophies.js';

const W = () => state?.campaign?.wander || null;
const mine = t => !!t && t.kind !== 'monster';
let fight = null;   // { events:[], foes:Set } while one is on

// Count something toward the achievements; each one earned slides its banner in
export function achieve(ev){
  const w = W(); if (!w || !ev) return [];
  const r = trackA(w.trophies || freshTrophies(), ev); w.trophies = r.progress;
  for (const u of r.unlocked) trophyBanner(u);
  return r.unlocked;
}
// Something learned of a creature: 'seen' | 'fought' | 'killed'
export function learn(t, bid){
  const w = W(); if (!w || !bid || !BEST[bid]) return;
  w.beasts = note(w.beasts || {}, { t, bid, day:state.campaign?.valley?.day ?? null });
}
const seenIds = new Set();
// The party sees a creature for the first time (each creature counts once)
export function sighted(m){ if (!m || m.kind !== 'monster' || seenIds.has(m.id)) return; seenIds.add(m.id); learn('seen', m.bid); }

/* ---------- a fight ---------- */
export function fightBegins(foes){
  if (!W()) return;
  fight = { events:[], foes:new Set(foes.map(f => f.id)) };
  for (const f of foes){ sighted(f); learn('fought', f.bid); }
  achieve({ t:'fightStart', foes:foes.map(f => f.bid) });
}
const rec = e => { if (fight && state.combat.active) fight.events.push({ round:state.combat.round || 1, ...e }); };
let lastBlow = null;
function onActed(e){
  if (!fight || !e?.actor) return;
  const a = e.actor;
  if (['hit', 'miss', 'critical'].includes(e.trigger) && e.target){
    const ev = { t:'attack', by:a.id, at:e.target.id, hit:e.trigger !== 'miss', crit:e.trigger === 'critical', nat:e.die?.n ?? 10, dmg:e.dmg || 0,
      weapon:e.action || '', kind:e.spell ? 'spell' : e.ranged ? 'ranged' : 'melee', byParty:mine(a) };
    rec(ev); achieve(ev); lastBlow = { at:e.target.id, t:performance.now() };
  } else if (e.trigger === 'spell' || e.trigger === 'heal'){
    const ev = { t:'cast', by:a.id, spell:e.action || '', level:e.level ?? 1 }; rec(ev); if (mine(a)) achieve(ev);
  }
}
function onHurt(e){
  if (!fight || !e?.t) return;
  const t = e.t, fromBlow = lastBlow && lastBlow.at === t.id && performance.now() - lastBlow.t < 60;
  if (!fromBlow) rec({ t:'damage', from:e.by || null, to:t.id, n:e.n, type:e.type || '' });
  if (!t.dead) return;
  if (t.kind === 'monster'){
    const by = tokById(e.by); const ev = { t:'kill', by:e.by || '', who:t.id, bid:t.bid, byParty:mine(by) };
    rec(ev); achieve(ev); learn('killed', t.bid);
  } else { const ev = { t:'down', who:t.id, hero:t.id === W()?.heroTok }; rec(ev); achieve(ev); }
}
function onHealed(e){ if (fight && e?.t){ const ev = { t:'heal', by:e.by || e.t.id, to:e.t.id, n:e.n }; rec(ev); achieve(ev); } }
function onTurnAct(e){ if (fight && e?.t){ const ev = { t:'act', k:e.k, who:e.t.id }; rec(ev); if (mine(e.t)) achieve(ev); } }
function onFeature(e){ if (fight && e?.t) rec({ t:'feature', who:e.t.id, id:e.id }); }

/* The fight is over (game/wander.js finishFight): its scorecard, and what it counts for.
   → the summary (ChatGPT's shape, for ui/victory.js), or null if no fight was being recorded */
export function fightEnds(won, { xp = 0, loot = null, order = [] } = {}){
  const f = fight; fight = null; if (!f || !W()) return null;
  const w = W(), heroT = tokById(w.heroTok);
  const roster = order.map(tokById).filter(Boolean).map(t => ({ id:t.id, name:t.name, side:t.kind === 'monster' ? 'foe' : 'party', hp:Math.max(0, t.hp), maxHp:t.maxHp, dead:!!t.dead }));
  const rounds = f.events.reduce((n, e) => Math.max(n, e.round || 1), 1);
  const heroTaken = f.events.reduce((n, e) => n + ((e.t === 'attack' && e.hit && e.at === w.heroTok) ? e.dmg : (e.t === 'damage' && e.to === w.heroTok) ? e.n : 0), 0);
  achieve({ t:'fightEnd', won, heroHp:Math.max(0, heroT?.hp || 0), heroTaken, rounds });
  if (loot?.gp) achieve({ t:'gold', gp:loot.gp });
  const sum = summarize(roster, f.events, { won, xp, loot, seed:`${w.fights || 0}:${rounds}` });
  for (const a of sum.awards || []) a.line = one(a.line);
  return sum;
}

// a count of one reads as one: "ended 1 foes" → "ended 1 foe", "1 misses" → "1 miss", "Dodge 1 times" → "Dodge once"
export const one = line => String(line).replace(/\b1 times\b/g, 'once').replace(/\b1 ((?:[a-z]+ )?)(\w+?)(es|s)\b/g, (m, adj, w, end) => `1 ${adj}${end === 'es' && /(ss|sh|ch|x)$/.test(w) ? w : end === 'es' ? w + 'e' : w}`);
/* ---------- the shelves the menu opens ---------- */
export const trophyShelf = () => { const p = W()?.trophies || freshTrophies(); return { shelf:shelf(p), score:score(p) }; };
export function beastBook(){
  // the creatures the valley's lore tells of, and any other the party has met
  const ids = [...new Set([...Object.keys(LORE), ...Object.keys(W()?.beasts || {})])].filter(id => BEST[id]);
  return book(W()?.beasts || {}, ids.map(bid => { const b = BEST[bid]; return { bid, stats:{ name:b.name, ac:b.ac, speed:b.spd || b.speed, hp:typeof b.hp === 'number' ? b.hp : undefined,
    resist:b.def?.resist, immune:b.def?.immune, vuln:b.def?.vuln } }; }));
}

let wired = false;
export function wireRecord(){
  if (wired) return; wired = true;
  bus.on('acted', onActed); bus.on('hurt', onHurt); bus.on('healed', onHealed); bus.on('turnAct', onTurnAct); bus.on('feature', onFeature);
}
export const recording = () => !!fight;
