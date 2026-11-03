/* THE COUNT'S COURT at the table (the nemesis system; the rules of it are in engine/nemesis.js).
   - the court lives in the campaign; a new day in the valley moves it (overworld.passTime → courtDay)
   - put one on the map with its followers, tougher by its rank and strengths, wearing its scars
   - fights feed it: its weakness doubles that damage, Relentless keeps it up once, His favour heals it, and when it
     falls it is either finished (killed by what it fears, or the third time) or taken by the mist to come back
   - journeys: the ones hunting the party wait on the road, as an ambush the DM springs (a violet rune)
   - places: a place one haunts has its mark on the map */
import { state, ui, tokById, makeMonster, log } from '../engine/state.js';
import { freeTilesNear, seenNow } from '../engine/grid.js';
import { walk, T } from '../engine/tiles.js';
import { BEST } from '../data/bestiary.js';
import { KINDS, RANKS, STRENGTHS, WEAKNESSES } from '../data/court.js';
import { newCourt, title, tauntFor, statsFor, recordFight, advanceCourt, pickAmbushers, alive } from '../engine/nemesis.js';
import { mulberry32, hashSeed, pick } from '../util/core.js';
import { syncTokens } from '../render/minis.js';
import { buildFloor } from '../render/floors.js';
import { showCard, toast } from '../ui/hud.js';
import { changed } from './session.js';
import { introduceAs } from './night.js';
import { refreshFolk } from './folk.js';

export function court(){
  const C = state.campaign; if (!C) return null;
  if (!C.court){ const seed = hashSeed(String(C.valley?.seed || state.meta.seed || 'court') + '|court'); C.court = newCourt(mulberry32(seed)); }
  return C.court;
}
export const member = id => court()?.members.find(m => m.id === id) || null;
const today = () => state.campaign?.valley?.day ?? null;
const placeName = () => state.meta?.name || 'the road';

/* Put one on the map near (x, y) with its followers. hidden: players don't see them until they come into view (any monster). */
export function placeNemesis(id, L = ui.floor, at = null){
  const m = member(id), K = m && KINDS[m.kind], base = K && BEST[K.base]; if (!base) return [];
  const f = state.floors[L]; if (!f) return [];
  // (brought by the DM: it steps out five to eight squares from the party, an encounter, not a surprise in their laps)
  at ||= (() => {
    const pcs = state.tokens.filter(t => t.floor === L && t.kind === 'pc' && !t.dead); if (!pcs.length) return { x:f.rooms[0].cx, y:f.rooms[0].cy };
    const sees = seenNow[L], far = [], hid = [];
    for (let i = 0; i < f.grid.length; i++){ if (!walk(f.grid[i])) continue; const x = i % f.W, y = (i / f.W) | 0, d = Math.min(...pcs.map(p => Math.max(Math.abs(p.x - x), Math.abs(p.y - y))));
      if (d >= 5 && d <= 8) (sees?.has(i) ? far : hid).push({ x, y }); }
    // where the party can see it step out, if anywhere
    const pool = far.length ? far : hid; return pool.length ? pool[Math.floor(Math.random() * pool.length)] : { x:pcs[0].x, y:pcs[0].y };
  })();
  const S = statsFor(m, base), spots = freeTilesNear(L, at.x, at.y, 1 + S.retinue, true); if (!spots.length) return [];
  const boss = makeMonster(K.base, L, spots[0].x, spots[0].y);
  Object.assign(boss, { name:title(m), hp:S.hp, maxHp:S.hp, ac:S.ac, attacks:S.attacks, nem:m.id });
  if (m.rank >= 3) boss.size = Math.max(boss.size || 1, 1);
  const placed = [boss];
  for (const s of spots.slice(1)){ const r = makeMonster(pick(K.retinue, Math.random), L, s.x, s.y); r.name = `${r.name} (${m.name}'s)`; placed.push(r); }
  state.tokens.push(...placed); syncTokens();
  m.met = true;
  log(`👑 ${title(m)} is on the map${placed.length > 1 ? ` with ${placed.length - 1} of its own` : ''}.`, true);
  changed();
  return placed;
}

/* ---------- in a fight (combat.js calls these) ---------- */
// Damage it takes: twice over from its weakness, half from what scarred it.
export function nemesisDamage(t, n, type){
  const m = t.nem && member(t.nem); if (!m) return n;
  const S = statsFor(m, BEST[KINDS[m.kind].base] || {}), ty = String(type || '');
  if (S.vuln.some(v => ty.includes(v))){ toast(`${m.name} burns: ${WEAKNESSES[m.weaknesses[0]].n.toLowerCase()} — double damage`); return n * 2; }
  if (S.resist.some(v => v && ty.includes(v))) return Math.floor(n / 2);
  return n;
}
// Relentless: the first time it would drop in a fight, it stays up at 1 HP. → true when it held on.
export function nemesisHolds(t){
  const m = t.nem && member(t.nem); if (!m || !m.strengths.includes('relentless') || t.flags.relentUsed) return false;
  t.flags.relentUsed = true; t.hp = 1;
  showCard({ kind:'seep', title:`${m.name} will not fall`, flair:'It should be dead. It looks at whoever did it, and it smiles.', lines:['Relentless: it stays up at 1 HP (once a fight).'] });
  return true;
}
export const nemesisRegen = t => { const m = t.nem && member(t.nem); return m ? statsFor(m, BEST[KINDS[m.kind].base] || {}).regen : 0; };
// It went down. The mist takes it, or it's finished.
export function nemesisFalls(t, type, by){
  const m = t.nem && member(t.nem); if (!m) return;
  const r = recordFight(court(), m.id, { outcome:'died', by:by?.kind === 'pc' ? by.name : null, type, place:placeName(), day:today() });
  showCard({ kind:r.stays ? 'crit' : 'seep', title:r.stays ? `${m.name} is finished` : `${m.name} falls…`, flair:r.text,
    lines:[r.stays ? 'It will not be back.' : `The mist takes the body. Unless it was killed by ${WEAKNESSES[m.weaknesses[0]].n.toLowerCase()}, Barovia gives it back.`] });
  log(`👑 ${r.text}`, !r.stays); changed();
}
// The fight is over and it is still standing: it beat them, or it got away.
export function nemesisSurvives(t){
  const m = t.nem && member(t.nem); if (!m || t.dead) return;
  const fallen = state.tokens.filter(o => o.kind === 'pc' && o.floor === t.floor && (o.dead || o.hp <= 0));
  const foe = fallen[0] || state.tokens.find(o => o.kind === 'pc' && o.floor === t.floor && !o.dead);
  const r = recordFight(court(), m.id, { outcome:fallen.length ? 'won' : 'fled', by:foe?.name || null, place:placeName(), day:today() });
  log(`👑 ${r.text}`, true);
}

/* ---------- between sessions ---------- */
// A new day in the valley (or the DM's button): the court moves. Its news goes in the DM's log.
export function courtDay(why = 'A new day'){
  const c = court(); if (!c) return [];
  const V = state.campaign.valley, news = advanceCourt(c, { gaze:state.dread, day:V?.day ?? null, at:V?.at }, Math.random);
  for (const n of news) log(`👑 ${n.text}`, true);
  refreshFolk();   // a new day: who is out in the street now (game/folk.js)
  if (news.length) toast(`${why}: the court moved (${news.length}). Gaze tab → The Count's Court.`);
  changed();
  return news;
}
// A journey has been laid out: those who hunt the party wait on the road (an event the DM springs).
export function plantAmbushes(path){
  const c = court(); if (!c || !state.floors.length) return [];
  const who = pickAmbushers(c, { gaze:state.dread, path }, Math.random), out = [];
  for (const m of who){
    const L = state.floors.length > 1 ? 1 + Math.floor(Math.random() * (state.floors.length - 1)) : 0, f = state.floors[L];
    const road = []; for (let i = 0; i < f.grid.length; i++) if (f.grid[i] === T.HALL) road.push(i);
    const i = road.length ? road[Math.floor(road.length * (.35 + Math.random() * .4))] : f.rooms[0].cy * f.W + f.rooms[0].cx;
    (f.events ||= []).push({ id:f.nextObj++, label:`Ambush — ${title(m)}`, text:`${tauntFor(m)}\n\n${RANKS[m.rank].n} of the Count's court. ${STRENGTHS[m.strengths[0]]?.text || ''}`, nem:m.id, x:i % f.W, y:(i / f.W) | 0, done:false });
    m.hunting = false; out.push({ m, L });
  }
  if (out.length) log(`👑 On this road: ${out.map(o => `${title(o.m)} (stretch ${o.L + 1})`).join(', ')}.`, true);
  return out;
}
// A place one haunts: its mark on the map, where the DM can call it out.
export function markHaunts(placeId){
  const c = court(); if (!c) return;
  const f = state.floors[0]; if (!f || f.events?.some(e => e.nem)) return;   // (a map back off the shelf has its marks already)
  for (const m of alive(c).filter(m => m.haunt === placeId)){
    const spots = []; for (let i = 0; i < f.grid.length; i++) if (walk(f.grid[i]) && f.grid[i] !== T.DOWN && f.grid[i] !== T.UP) spots.push(i);
    const i = spots[Math.floor(Math.random() * spots.length)]; if (i == null) continue;
    (f.events ||= []).push({ id:f.nextObj++, label:`${title(m)}'s ground`, text:`${tauntFor(m)}\n\n${m.name} haunts this place. Spring it when the party is where it would strike.`, nem:m.id, x:i % f.W, y:(i / f.W) | 0, done:false });
  }
  buildFloor(0);
}
// The DM springs an event that is one of the court: it and its followers step out.
export function springNemesis(L, e){
  const placed = placeNemesis(e.nem, L, { x:e.x, y:e.y });
  if (placed.length) showCard({ kind:'seep', title:title(member(e.nem)), flair:tauntFor(member(e.nem)), lines:[`${RANKS[member(e.nem).rank].n} of the Count's court, with ${placed.length - 1} of its own.`] });
  return placed;
}
export { title, tauntFor, statsFor };

// On the TV: its face (the base creature's), its name, and what it says to them now.
export function introduceNemesis(id){
  const m = member(id); if (!m) return;
  const t = makeMonster(KINDS[m.kind].base, ui.floor, 0, 0); t.name = title(m); t.id = `nem-${m.id}`;
  introduceAs(t, `“${tauntFor(m)}”`);
  m.met = true; changed();
}
/* Let him be seen: a tall figure at the edge of the trees (or of the light), on every screen, for a few seconds.
   render/omens.js draws it from state.watcher; it also glimpses him on its own when the Gaze is high. */
export function letHimBeSeen(){
  state.watcher = { floor:ui.floor, at:Date.now(), until:Date.now() + 9000, n:(state.watcher?.n || 0) + 1 };
  log('👁 He lets himself be seen.', true); changed();
}
