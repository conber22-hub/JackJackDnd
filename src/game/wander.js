/* 🗡 THE WANDERER — playing instead of directing: one hero (yours, from the creator), walked with a controller or the
   keys through Barovia, with whoever they talk into coming along, and the game itself keeping the DM's side
   (engine/wander.js decides; this does it with the app's own actions):
     · start: a fresh valley, waking in the Village of Barovia at the road in; the companions wait in their places
     · a step: the hero walks a square (the camera with them), the companions each to where the one ahead stood;
       then the director looks: a creature in sight starts a fight, a happening on the road is read out (or springs),
       on the road something may come out of the trees, and at the end of a stretch the road goes on (or arrives)
     · a fight: initiative as usual; the companions and the creatures take their own turns (combat.js autoTurn,
       opportunity attacks always taken); on the hero's turn the player walks, aims, strikes, dodges or ends it
     · after: the fallen of the party get up (bruised, at 1), the XP is counted, the game saves; if the whole party
       falls, the Mists take them back to the last save
     · talk: a companion's own words and the pitch (a skill check the game rolls), or what one of the valley's folk says
     · travel and rest from the menu; it saves in its own slot (game/session.js), never over the DM's campaign
   The run lives in state.campaign.wander, so it saves and loads with everything else. */
import { paceOf } from '../engine/pace.js';
import { gfx } from '../render/gfx.js';
import { state, ui, tokById, tokenAt, makeMonster, makeNPC, log, newState } from '../engine/state.js';
import { newWander, planAmbush, recruitRoll, followSpot, pushTrail, roadEnd, cycleTarget, partyDown, ambushChance } from '../engine/wander.js';
import { COMPANIONS, companionById, WAKE, WAKE_HANDHELD, AMBUSH, WON, LOST, LIKES, MOOD, QUESTS, questById, MOMENTS, momentById } from '../data/wander.js';
import { levelFor, xpForNext, shareXp, autoLevel, fightLoot, advanceQuests, questText, questOpen, clampApproval, loyalty, reactions, resolveChoice, momentChance, nextMoment, upgradeWander } from '../engine/wander-life.js';
import { migrateSheet, itemInfo, canEquip } from '../engine/inventory.js';
import { mirrorGear } from '../engine/gear.js';
import { TEMPLATES } from '../data/themes.js';
import { BEST } from '../data/bestiary.js';
import { newHero, heroStats, SP } from '../engine/hero.js';
import { hitOdds, expectedDamage, pct, edgeWords } from '../engine/odds.js';
import { greet, rumourFor } from '../engine/folk.js';
import { rangeCheck, coverOf } from '../engine/targeting.js';
import { xpOf } from '../engine/encounter.js';
import { freeTilesNear, reach, updateVision, seenNow } from '../engine/grid.js';
import { walk } from '../engine/tiles.js';
import { placeById, planJourney } from '../engine/overland.js';
import { VALLEY_PLACES } from '../data/barovia-map.js';
import { pick, uid, rollDice, esc, bus } from '../util/core.js';
import { applyCharacter } from './heroes.js';
import { doMove, resolvePath, takeStairs, onStairs, goFloor, nearestOpen, setDread } from './actions.js';
import { rollInitiative, nextTurn, autoTurn, planFor, endCombat, doAttack, attackEdge, currentTurn, partySees, riseFrom, removeToken, castSpell, heal, shove } from './combat.js';
import { turnAction, pausedMover, autoAnswer } from './moves.js';
import { moveAllowance } from './rules.js';
import { travel, arrive, enterPlace, valley, passTime, clockText, springEvent, hourHooks } from './overworld.js';
import { sfx } from '../audio/sound.js';
import { court } from './court.js';
import { findNear, findLabel, useFind } from './finds.js';
import { bubble } from '../render/glints.js';
import { ensureWays, wayAfterStep, wayOnBump, arriveThere, crossingNow, readSignpost, signpostNear, roadsOutOf, passage, bannerHere, doorwayHere, goOutside } from './ways.js';
import { longRest, shortRest, canCast, useFeature, left, BONUS_FEATS } from './resources.js';
import { loadState, changed, flushSave, loadWanderSave, wanderCheckpoint, deserialize, wanderSlot, saveWanderSlot, WANDER_SLOTS } from './session.js';
import { showCard, toast } from '../ui/hud.js';
import { fightBegins, fightEnds, achieve, sighted } from './record.js';
import { openVictory, setVictoryFace } from '../ui/victory.js';
import { openDefeat, setDefeatFace } from '../ui/defeat.js';
import { MEMORIAL } from '../data/memorial.js';
import { openLevelUp } from '../ui/levelup.js';
import { faceOf } from './night.js';
import { syncTokens, tokenViews, faceStep } from '../render/minis.js';
import { camTo, wx, wz, floorY } from '../render/scene.js';
import * as THREE from 'three';

export const W = () => state?.campaign?.wander || null;
export const wandering = () => !!(ui.wander && W());
export const hero = () => { const w = W(); return w && tokById(w.heroTok); };
export const members = () => { const w = W(); return w ? [hero(), ...w.party.map(p => tokById(p.tok))].filter(Boolean) : []; };
const foes = () => { const h = hero(); return h ? state.tokens.filter(o => o.kind === 'monster' && o.floor === h.floor && !o.dead && o.hp > 0 && !o.flags?.gone) : []; };
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
/* How much cover there is round a square for something to come out of (×0.35 out on the open road, up to ×2 among
   trees, brush and fog): the trees and rock within two squares, brush and dead trees, and banks of mist. */
function coverAround(f, t){
  let n = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++){ const x = t.x + dx, y = t.y + dy; if (x < 0 || y < 0 || x >= f.W || y >= f.H || !walk(f.grid[y * f.W + x])) n++; }
  n += (f.props || []).filter(p => ['bush', 'deadtree', 'pine', 'mist', 'hay'].includes(p.k) && cheb(p, t) <= 2).length * 2;
  n += (f.mists || []).filter(([x, y]) => Math.max(Math.abs(x - t.x), Math.abs(y - t.y)) <= 2).length;
  return .35 + Math.min(1.65, n / 8);
}
const night = () => { const h = valley().hour; return h >= 20 || h < 6; };
const onRoad = () => state.meta.template === 'journey';

// What only this device keeps while playing (never saved): the hero's trail, the aim, whose turn was whose.
// how long a foe shows what it means to do before it does it, and the waits between turns: by the player's pace
const pace = () => paceOf(gfx.pace);
export const rt = { walkN:0, tapTo:null, step:null, spotted:0, heard:new Set(), trail:[], target:null, atk:null, heroKey:'', attacks:0, cast:false, bonus:false, acting:'', actAt:0, lastBusy:0, endAt:0, talk:null, seen:new Set(), round:0, unseen:0, hpWas:null, focus:null, look:null, opening:null };
export const freshRun = () => fresh();
const fresh = () => Object.assign(rt, { opening:null, spotted:0, heard:new Set(), trail:[], target:null, atk:null, heroKey:'', attacks:0, cast:false, bonus:false, acting:'', actAt:0, lastBusy:0, endAt:0, talk:null, round:0, unseen:0, hpWas:null });

/* ---------- starting and leaving ---------- */
// The look that goes with playing: the players' fog, the DM's desk away, the camera low behind the hero.
export function enterView(){
  ui.wander = true; ui.tableView = true; ui.panelOpen = false; ui.view = 'tilt'; ui.roomPrompts = false; ui.selected = null;
  autoAnswer.on = true;
  document.body.classList.add('wander');
  const h = hero(); if (!h) return;
  ensureWays();   // (a place's ways out, with their signposts: game/ways.js)
  goFloor(h.floor, false);
  // low and close behind the hero (after the load's own camera move has finished)
  const close = () => camTo(new THREE.Vector3(wx(h.x), floorY(h.floor), wz(h.y)), new THREE.Vector3(0, 10.5, 8.5), .8);
  close(); setTimeout(close, 1300);
}
export function startWander(sheet){
  if (!sheet) return null;
  flushSave();   // anything the DM's campaign had waiting goes to its own slot first
  const seed = uid() + uid(), tpl = TEMPLATES.find(t => t.id === 'barovia');
  const s = newState({ name:'Village of Barovia', seed:`${seed}|village|barovia`, floors:tpl.floors.length, size:40, template:'barovia', party:false });
  s.meta.mapId = uid(); s.meta.kind = 'place'; s.meta.key = 'place:village:barovia';
  s.campaign.valley = { at:'village', visited:['mists', 'village'], journey:null, journeys:0, seed, day:1, hour:9 };
  s.campaign.wander = upgradeWander(newWander({ heroId:sheet.id, seed }));
  ui.wander = true; fresh();
  loadState(s);
  const t = applyCharacter(sheet, { owner:'You' });
  W().heroTok = t.id;
  const f = state.floors[0], r = f.rooms.find(x => /road in/i.test(x.name || '')) || f.rooms[0], at = nearestOpen(0, r.cx, r.cy) || { x:r.cx, y:r.cy };
  t.floor = 0; t.x = at.x; t.y = at.y;
  placeCompanions();
  enterView(); syncTokens();
  showCard({ kind:'seep', ...WAKE, ...(ui.handheld ? { lines:WAKE_HANDHELD } : {}), stay:true }, false);   // (it waits to be read: it says how to play)
  log(`🗡 ${t.name} wakes in the Village of Barovia.`);
  addQuest('west', true);
  changed(); saveNow();
  return t;
}
export function continueWander({ safe = false, from = null } = {}){
  const s = from || loadWanderSave({ safe }); if (!s) return false;
  if (!ui.wander) flushSave();   // the DM's campaign, if it had anything waiting, to its own slot first
  ui.wander = true; fresh();
  loadState(deserialize(s));
  if (!W()){ ui.wander = false; return false; }
  upgradeWander(W());
  enterView(); changed();
  return true;
}
/* ---------- 🕹 save states ----------
   Three slots of the player's own (the menu's Save states page; Select + Start on the handheld, Back + Start on a
   controller, K on the keys). A slot is filled by hand, never by the game, and loading one puts the run back exactly
   there (and saves it as the run). Not in a fight or a conversation: those have no moment to stop in. */
export const SLOTS = WANDER_SLOTS;
export const slotMeta = n => wanderSlot(n)?.meta || null;
export const canSaveSlot = () => !state.combat.active && !rt.talk;
export function saveToSlot(n){
  if (!W() || !canSaveSlot()) return false;
  const h = hero(), sh = sheetOf(), V = valley();
  const place = V.journey ? `On the road to ${placeById(V.journey.to)?.name || '…'}` : (state.floors[h?.floor ?? 0]?.name || state.meta.name);
  return saveWanderSlot(n, { name:h?.name || sh?.name || '', place, day:V.day || 1, lvl:+sh?.lvl || 1, hp:Math.max(0, h?.hp || 0), max:h?.maxHp || 0, party:members().length });
}
export function loadFromSlot(n){
  const v = wanderSlot(n); if (!v?.data) return false;
  Object.assign(rt, { endAt:0, acting:'', heroKey:'', target:null, cast:false, bonus:false, talk:null, trail:[], attacks:0, look:null, round:0, unseen:0, hpWas:null });
  if (!continueWander({ from:structuredClone(v.data) })) return false;
  follow(hero(), 1); saveNow();
  return true;
}
export function leaveWander(){
  if (W()) flushSave();
  ui.wander = false; ui.tableView = false; autoAnswer.on = false; rt.talk = null;
  document.body.classList.remove('wander');
}
export function saveNow(){ if (W()) wanderCheckpoint(); }

/* ---------- the companions ---------- */
// Those who wait in this place and haven't come along: one figure each, in the room they wait in.
export function placeCompanions(){
  const w = W(), at = valley().at, f = state.floors[0];
  if (!w || onRoad() || state.meta.key?.split(':')[1] !== at) return;
  for (const c of COMPANIONS){
    if (c.place !== at || w.party.some(p => p.id === c.id) || state.tokens.some(t => t.flags?.companion === c.id)) continue;
    const r = f.rooms.find(x => new RegExp(c.near, 'i').test(x.name || '')) || f.rooms[1] || f.rooms[0];
    const spot = nearestOpen(0, r.cx, r.cy); if (!spot) continue;
    const n = makeNPC(c.name); Object.assign(n, { floor:0, x:spot.x, y:spot.y, color:c.color }); n.flags.companion = c.id; n.flags.stay = true;   // (they wait here: not one of the party yet)
    state.tokens.push(n);
  }
  syncTokens();
}
export const sheetOf = () => state.characters[W().heroId];
function companionSheet(c){
  const h = newHero(c.cls);
  Object.assign(h, { id:`cmp-${c.id}-${W().seed.slice(0, 6)}`, name:c.name, sp:c.sp, weapons:c.weapons, spells:c.spells, color:c.color, backstory:c.blurb, player:'Companion' });
  return autoLevel(h, levelFor(W().xp));   // they come at the party's level
}
// Bring one over: a hero token where they stood, on the party's side.
function join(c){
  const npc = state.tokens.find(t => t.flags?.companion === c.id && t.kind === 'npc'), h = hero();
  const t = applyCharacter(companionSheet(c), { owner:'Companion' });
  t.flags.companion = c.id;
  const at = npc || h; t.floor = at.floor; t.x = at.x; t.y = at.y;
  if (npc) removeToken(npc.id);
  W().party.push({ id:c.id, tok:t.id });
  W().approval[c.id] ??= 10;   // (they came: they think something of you already)
  showCard({ kind:'', title:`${c.name} joins you`, flair:c.join }, false);
  log(`🗡 ${c.join}`); syncTokens(); changed(); saveNow();
}

/* ---------- approval ---------- */
export const approvalOf = id => W()?.approval?.[id] || 0;
/* A deed the party saw: each companion's approval moves by what they make of it (data/wander.js LIKES). → the lines to
   show (who was moved, and how). One who has had enough walks away. */
export function react(tags = []){
  const w = W(), out = [];
  for (const r of reactions(w.party, tags, LIKES)){
    w.approval[r.id] = clampApproval((w.approval[r.id] || 0) + r.n);
    out.push(`${r.n > 0 ? '▲' : '▼'} ${MOOD[r.id]?.[r.n > 0 ? 'up' : 'down'] || ''}`);
  }
  for (const p of [...w.party]) if (loyalty(w.approval[p.id]).k === 'leaving') leaves(p.id);
  return out;
}
export function approve(id, n){ const w = W(); if (!w.party.some(p => p.id === id)) return; w.approval[id] = clampApproval((w.approval[id] || 0) + n); }
// A companion has had enough: they go (back to where they waited, to be won over again, if ever).
function leaves(id){
  const w = W(), p = w.party.find(x => x.id === id), c = companionById(id); if (!p) return;
  w.party = w.party.filter(x => x !== p);
  const t = tokById(p.tok); if (t) removeToken(t.id);
  w.met[id] = { seen:true, refused:w.fights };
  w.approval[id] = 0;
  showCard({ kind:'seep', title:`${c.name} leaves you`, flair:MOOD[id]?.leaving || '' }, false);
  log(`🗡 ${c.name} leaves the party.`); syncTokens(); changed();
}

/* ---------- quests ---------- */
export function addQuest(id, quiet = false){
  const w = W(), d = questById(id); if (!d || w.quests.some(q => q.id === id)) return false;
  w.quests.push({ id, step:0, n:0, done:false });
  if (!quiet) showCard({ kind:'', title:`New quest: ${d.title}`, flair:d.text, lines:[`<b>${esc(d.steps[0].say)}</b>`] }, false);
  log(`🗡 Quest: ${d.title}.`); changed(); return true;
}
// Something happened (engine/wander-life.js advanceQuests): the quests it moves on, and the rewards of those it ends.
export function questEvent(ev){
  const w = W(); if (!w) return;
  const r = advanceQuests(w.quests, QUESTS, ev); w.quests = r.quests;
  for (const id of r.stepped) if (!r.done.includes(id)){ const q = w.quests.find(x => x.id === id), d = questById(id); toast(`📜 ${d.title}: ${questText(q, d)}`); }
  for (const id of r.done){
    const d = questById(id), rw = d.reward || {}, lines = [];
    if (rw.xp){ w.xp += rw.xp; lines.push(`<b>${rw.xp} XP</b>`); }
    if (rw.gp || rw.item){ gainLoot({ gp:rw.gp || 0, items:rw.item ? [rw.item] : [] }); if (rw.gp) lines.push(`${rw.gp} gp`); if (rw.item) lines.push(esc(rw.item)); }
    for (const [cid, n] of Object.entries(rw.approve || {})){ approve(cid, n); lines.push(`▲ ${esc(companionById(cid)?.name || cid)} thinks more of you`); }
    showCard({ kind:'', title:`Quest done: ${d.title}`, flair:rw.text || '', lines }, false);
    achieve({ t:'quest', id, done:true });
    log(`🗡 Quest done: ${d.title}.`);
  }
  if (r.done.length) checkLevels();
  changed();
}
// What the journal shows: [{ id, title, text, step, done }]
export const journal = () => (W()?.quests || []).map(q => { const d = questById(q.id); return d && { id:q.id, title:d.title, text:d.text, step:questText(q, d), done:q.done }; }).filter(Boolean);

/* ---------- talk ---------- */
/* What a conversation shows: { title, sub, text, options:[{ k, label, off }] }. A companion waiting: their words, the
   pitch (once refused, not again until the party has fought since), a question, goodbye. One along with you: how they
   feel about you, and their own quest when they like you enough. A roadside scene: its choices, then what came of it.
   One of the folk: what they say. */
export function talkView(){
  const tk = rt.talk; if (!tk) return null;
  if (tk.folk) return { title:tk.title, sub:tk.sub, text:tk.text, options:[{ k:'bye', label:'Leave' }] };
  if (tk.moment){
    const m = momentById(tk.moment); if (tk.done) return { title:m.title, sub:'', text:tk.text, options:[{ k:'bye', label:'Go on' }] };
    const gp = coinsGp();
    return { title:m.title, sub:'On the road', text:m.text, options:m.options.map(o => ({ k:o.k, label:`${o.label}${o.check ? ` (${o.check.skill}, ${o.check.dc})` : ''}`, off:o.need?.gp > gp ? `You have ${gp} gp.` : '' })) };
  }
  const c = companionById(tk.id);
  if (tk.party){
    const n = approvalOf(c.id), lo = loyalty(n), qd = QUESTS.find(q => q.from === c.id), can = questOpen(qd, W());
    return { title:c.name, sub:`${c.title} · ${lo.label} (${n})`, text:tk.text || MOOD[c.id]?.[lo.k] || c.ask,
      options:[...(can ? [{ k:'quest', label:'"Is there something you need?"' }] : []), { k:'ask', label:'"What keeps you going?"' }, { k:'bye', label:'Leave' }] };
  }
  const met = (W().met[c.id] ||= {});
  const waiting = met.refused !== undefined && W().fights <= met.refused;
  const ch = c.check;
  return { title:c.name, sub:c.title, text:tk.text || (met.seen ? c.ask : c.hello),
    options:[
      { k:'pitch', label:`${c.pitch}${ch ? ` (${ch.skill} or ${ch.alt}, ${ch.dc})` : ''}`, off:waiting ? 'Not until you have done something.' : '' },
      { k:'ask', label:'"What keeps you here?"' },
      { k:'bye', label:'Leave' },
    ] };
}
export function talkTo(id){
  const c = companionById(id); if (!c) return;
  if (W().party.some(p => p.id === id)){ rt.talk = { id, party:true, text:'' }; return; }
  rt.talk = { id, text:'' };
  const met = (W().met[c.id] ||= {}); if (!met.seen){ rt.talk.text = c.hello; met.seen = true; }
}
export function folkTalk(p){
  const r = Math.random, said = greet(p, { gaze:state.dread || 1, night:night() }, r), heard = p.role === 'dog' ? null : rumourFor(p, court(), { gaze:state.dread || 1 }, r);
  rt.talk = { folk:true, title:p.name || 'Someone of the valley', sub:'', text:`${said}${heard && heard.text !== said ? `\n\n${heard.text}` : ''}` };
  // the first of the village's folk to talk has a job for anyone who'll take it
  if (valley().at === 'village' && !onRoad() && addQuest('wolves', true)) rt.talk.text += `\n\n${questById('wolves').text}\n\n📜 New quest: ${questById('wolves').title}.`;
}
export function startMoment(m){ const w = W(); w.moments.push(m.id); w.momentAt = `${state.meta.mapId}:${hero().floor}`; rt.talk = { moment:m.id }; changed(); }
// → what happened: 'closed' | 'joined' | 'refused' | 'said' | 'chose'
export function chooseTalk(k){
  const tk = rt.talk; if (!tk) return 'closed';
  if (tk.moment && !tk.done && k === 'bye') return 'said';   // (a scene asks for a choice: walking on by is one of them)
  if (k === 'bye' || tk.folk || tk.done){ rt.talk = null; return 'closed'; }
  if (tk.moment) return choose(k);
  const c = companionById(tk.id), v = talkView();
  if (k === 'ask'){ tk.text = c.ask; return 'said'; }
  if (tk.party){
    if (k === 'quest'){ const qd = QUESTS.find(q => q.from === c.id); if (questOpen(qd, W())){ addQuest(qd.id, true); tk.text = `${qd.text}\n\n📜 New quest: ${qd.title}.`; changed(); } }
    return 'said';
  }
  const met = W().met[c.id] ||= {};
  if (k === 'pitch'){
    if (v.options[0].off){ tk.text = v.options[0].off; return 'said'; }
    const d20 = 1 + Math.floor(Math.random() * 20), r = recruitRoll(c, heroStats(sheetOf()).skills, d20);
    const roll = r.skill ? ` [${r.skill}: ${d20} + ${r.bonus} = ${r.total} against ${r.dc}]` : '';
    if (r.ok){ rt.talk = null; join(c); log(`🗡 ${hero().name} wins ${c.name} over${roll}.`); return 'joined'; }
    met.refused = W().fights; tk.text = `${c.no}${roll}`; changed(); return 'refused';
  }
  return 'said';
}
// A choice in a roadside scene: the roll (if it asks for one), what comes of it, and what the companions make of it.
function choose(k){
  const tk = rt.talk, m = momentById(tk.moment), o = m.options.find(x => x.k === k); if (!o) return 'said';
  if (o.need?.gp > coinsGp()){ tk.text = `You have ${coinsGp()} gp.`; return 'said'; }
  const d20 = 1 + Math.floor(Math.random() * 20), r = resolveChoice(o, heroStats(sheetOf()).skills, d20), out = r.out, w = W(), lines = [];
  if (r.skill) lines.push(`[${r.skill}: ${r.d20} + ${r.bonus} = ${r.total} against ${r.dc}: ${r.ok ? 'success' : 'failure'}]`);
  if (out.xp){ w.xp += out.xp; lines.push(`+${out.xp} XP`); }
  if (out.gp){ gainLoot({ gp:out.gp }); lines.push(`${out.gp > 0 ? '+' : ''}${out.gp} gp`); }
  if (out.item){ gainLoot({ items:[out.item] }); lines.push(`+ ${out.item}`); }
  if (out.heal) for (const t of members()) if (!t.dead) heal(t, out.heal);
  if (out.hurt){ const h = hero(); h.hp = Math.max(1, h.hp - out.hurt); lines.push(`${h.name} −${out.hurt} HP`); }
  if (out.gaze) setDread((state.dread || 1) + out.gaze);
  lines.push(...react(o.tags || []));
  tk.done = true; tk.text = `${out.text || ''}${lines.length ? `\n\n${lines.join('\n')}` : ''}`;
  log(`🗡 ${m.title}: ${o.label}.`);
  syncTokens(); checkLevels(); changed(); saveNow();
  return 'chose';
}

/* ---------- the pack ---------- */
// The hero's own sheet in this run, changed by fn (its pack made from its gear the first time), then put back on the token.
export function editSheet(fn){
  const cur = sheetOf(); if (!cur) return false;
  let h = migrateSheet(cur);
  if (fn(h) === false) return false;
  h = mirrorGear(h); applyCharacter(h, { place:false }); changed(); return true;
}
export const coinsGp = () => Math.floor(+sheetOf()?.coins?.gp || 0);
// Coins and things into the hero's pack (gp may be negative: spent).
export function gainLoot({ gp = 0, sp = 0, items = [] } = {}){
  return editSheet(h => {
    h.coins = { ...h.coins, gp:Math.max(0, (h.coins.gp || 0) + gp), sp:(h.coins.sp || 0) + sp };
    for (const n of items){ const info = itemInfo(n), have = h.inv.find(i => i.n.toLowerCase() === (info?.n || n).toLowerCase() && !i.equipped);
      if (have) have.qty = (have.qty ?? 1) + 1; else h.inv.push({ id:uid(), n:info?.n || n, qty:1, equipped:false, attuned:false }); }
  });
}
// What the hero carries: [{ id, n, qty, equipped, kind, potion }]
export const pack = () => (migrateSheet(sheetOf() || {}).inv || []).map(i => { const info = itemInfo(i); return { id:i.id, n:i.n, qty:i.qty ?? 1, equipped:!!i.equipped, kind:info?.kind || '', potion:/^Potion of Healing/.test(i.n) }; });
// Wear it or take it off (armour, a shield, a weapon): the sheet's gear and the token follow.
export function toggleEquip(id){
  let why = '';
  const ok = editSheet(h => { const it = h.inv.find(i => i.id === id); if (!it) return false; it.equipped = !it.equipped; if (it.equipped){ const c = canEquip(h, id); if (!c.ok){ why = c.why; return false; } } });
  if (why) toast(why);
  return ok;
}
const POTION = { 'Potion of Healing':'2d4+2', 'Potion of Healing (greater)':'4d4+4', 'Potion of Healing (superior)':'8d4+8', 'Potion of Healing (supreme)':'10d4+20' };
/* Drink one (or pour it into someone within reach). In a fight it's the hero's bonus action, once a turn. → HP healed, or 0 */
export function usePotion(itemId = null, onId = null){
  const t = hero(), on = (onId && tokById(onId)) || t, it = itemId ? pack().find(i => i.id === itemId) : pack().find(i => i.potion);
  if (!it || !it.potion){ toast('No potion in the pack.'); return 0; }
  if (state.combat.active){ if (!myTurn()){ toast('Not your turn yet.'); return 0; } if (rt.bonus){ toast('You have used your bonus action this turn.'); return 0; } }
  if (on.id !== t.id && cheb(on, t) > 1){ toast(`${on.name} is too far away: walk over.`); return 0; }
  const n = rollDice(POTION[it.n] || '2d4+2').total;
  editSheet(h => { const x = h.inv.find(i => i.id === it.id); x.qty = (x.qty ?? 1) - 1; if (x.qty <= 0) h.inv = h.inv.filter(i => i !== x); });
  const tok = tokById(on.id); heal(tok, n); if (state.combat.active) rt.bonus = true;
  showCard({ kind:'', title:`${t.name}: ${it.n}`, sub:tok.id === t.id ? 'drunk' : `poured into ${tok.name}`, big:`+${n} HP` }, false);
  log(`🗡 ${tok.name} drinks a ${it.n}: +${n} HP.`); syncTokens(); changed(); return n;
}
// Where potions are sold: the valley's towns, at the book's price.
export const shopHere = () => !onRoad() && ['village', 'vallaki', 'krezk'].includes(valley().at);
export function buyPotion(){
  if (!shopHere()) return false;
  if (coinsGp() < 50){ toast(`A Potion of Healing is 50 gp. You have ${coinsGp()}.`); return false; }
  gainLoot({ gp:-50, items:['Potion of Healing'] }); toast('Bought a Potion of Healing.'); saveNow(); return true;
}

/* ---------- levels ---------- */
// The party's level by its XP; companions grow by themselves, the hero waits for the player (the menu's Level up).
export const partyLevel = () => levelFor(W()?.xp || 0);
export const levelReady = () => { const s = sheetOf(); return !!s && partyLevel() > (+s.lvl || 1); };
export function checkLevels(){
  const w = W(), L = levelFor(w.xp);
  for (const m of members().slice(1)){ const sh = state.characters[m.charId]; if (sh && (+sh.lvl || 1) < L){ applyCharacter(autoLevel(sh, L), { place:false }); m.hp = m.maxHp; toast(`${m.name} is level ${L} now.`); } }
  if (levelReady() && w.lvlSeen < L){ w.lvlSeen = L; showCard({ kind:'', title:`Level ${L}!`, flair:'You feel the road in your bones, and something more than the road. Open the menu (☰) to level up.' }, false); }
  syncTokens();
}
// Level the hero up: the game's choices (auto), or a sheet the player made in the creator.
export function levelUpHero(sheet = null){
  const s = sheetOf(), L = partyLevel(); if (!s || (+s.lvl || 1) >= L && !sheet) return false;
  const next = sheet ? { ...sheet, lvl:Math.min(+sheet.lvl || L, L) } : autoLevel(s, L);
  const hpWas = hero()?.maxHp ?? 0, from = +s.lvl || 1;
  const t = applyCharacter(next, { place:false }); if (t) t.hp = t.maxHp;
  // ✦ the fanfare (Muse's ui/levelup.js): the new level, the hit points climbing, and what it brings
  const gains = levelGains(s, next);
  if (typeof document !== 'undefined') openLevelUp({ name:t.name, face:(() => { try { return faceOf(t); } catch { return null; } })(), from, to:next.lvl, hp:{ before:hpWas, after:t.maxHp }, gains });
  else showCard({ kind:'', title:`${t.name} is level ${next.lvl}`, sub:t.cls, lines:[`${t.maxHp} HP`] }, false);
  achieve({ t:'level', n:+next.lvl });
  log(`🗡 ${t.name} reaches level ${next.lvl}.`); syncTokens(); changed(); saveNow(); return true;
}
export const nextLevelXp = () => xpForNext(partyLevel());
/* What a new level brings, for the fanfare: features, spells learned, spell slots, a feat or a raise in an ability.
   → [{ kind:'feature'|'spell'|'slot'|'feat'|'stat', name, text }] */
export function levelGains(was, now){
  const a = heroStats(was), b = heroStats(now), out = [];
  const strip = f => String(f).replace(/\s*\(\d+\)$/, '');
  for (const f of b.features || []) if (!(a.features || []).includes(f)) out.push({ kind:'feature', name:strip(f), text:`From level ${String(f).match(/\((\d+)\)$/)?.[1] || now.lvl}.` });
  const sa = new Set((was.spells || []).map(x => x.n || x)); for (const sp of now.spells || []){ const n = sp.n || sp; if (!sa.has(n)) out.push({ kind:'spell', name:n, text:'A new spell to cast.' }); }
  (b.slots || []).forEach((n, i) => { const o = (a.slots || [])[i] || 0; if (n > o) out.push({ kind:'slot', name:`Level ${i + 1} slot${n - o > 1 ? 's' : ''}`, text:`${n} in all (${n - o > 1 ? `${n - o} more` : 'one more'}).` }); });
  for (const k of Object.keys(b.sc || {})) if ((b.sc[k] || 0) > (a.sc?.[k] || 0)) out.push({ kind:'stat', name:`${k} ${b.sc[k]}`, text:`Up from ${a.sc[k]}.` });
  return out;
}

/* ---------- spells ---------- */
/* What the hero can cast: [{ i, n, l, k, kind:'cast'|'atk', ok, why }] (the spells that are attacks, Fire Bolt and
   its like, strike like a weapon). Out of a fight only healing and help can be cast. */
export function spellList(){
  const t = hero(); if (!t) return [];
  const fight = state.combat.active;
  const casts = (t.casts || []).map((c, i) => { const can = canCast(t, c.l, c.n, !!c.again), peace = ['heal', 'buff', 'util'].includes(c.k);
    const quick = bonusSpell(c), spent = fight && myTurn() && (quick ? rt.bonus : rt.cast || rt.attacks > 0);
    return { i, n:c.n, l:c.l, k:c.k, kind:'cast', ok:can && (fight || peace) && !spent, why:!can ? 'no slot left' : !fight && !peace ? 'in a fight' : spent ? (quick ? 'with a bonus action left' : 'with your action left') : '' }; });
  const atks = (t.attacks || []).map((a, i) => ({ i, n:a.n, l:null, k:'atk', kind:'atk', spell:/ casts /.test(a.f || '') })).filter(a => a.spell).map(a => ({ ...a, ok:fight, why:fight ? '' : 'in a fight' }));
  return [...casts, ...atks];
}
// The ally a healing spell goes to: the most hurt of the party within its reach.
function healTarget(t, reachSq){ return members().filter(m => !m.flags?.gone && m.hp < m.maxHp && m.floor === t.floor && cheb(m, t) <= reachSq).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || null; }
export function heroCast(entry){
  const t = hero(); if (!t || !entry) return false;
  const quick = entry.kind === 'cast' && bonusSpell(t.casts?.[entry.i]);
  if (state.combat.active){ if (!myTurn()){ toast('Not your turn yet.'); return false; }
    if (quick ? rt.bonus : rt.cast || rt.attacks){ toast(quick ? 'You have used your bonus action this turn.' : 'You have used your action this turn.'); return false; } }
  if (!entry.ok){ toast(`${entry.n}: ${entry.why}.`); return false; }
  if (entry.kind === 'atk'){ rt.atk = entry.i; heroAttack(); return true; }
  const sp = t.casts[entry.i], reachSq = Math.max(1, Math.ceil((sp.r ?? 60) / 5));
  let tg = null, aimAt = null;
  if (sp.k === 'heal'){ tg = healTarget(t, reachSq); if (!tg){ toast('Nobody near enough needs healing.'); return false; } }
  else if (sp.k === 'buff' || sp.k === 'util') tg = t;
  else { tg = target(); if (!tg){ toast('Nobody to aim at.'); return false; }
    if (sp.area) aimAt = { x:tg.x, y:tg.y };
    else if (cheb(t, tg) > reachSq){ toast(`${tg.name} is out of range of ${sp.n}: walk closer.`); return false; } }
  if (tg !== t) rt.look = { id:tg.id, until:performance.now() + 1700 };
  if (castSpell(t.id, tg.id, entry.i, aimAt) === false) return false;
  if (state.combat.active){ if (quick) rt.bonus = true; else { rt.cast = true; rt.did = 'cast'; } }
  changed(); return true;
}
// A spell cast as a bonus action (Healing Word, Misty Step…): it spends the bonus action, not the action
export const bonusSpell = c => !!c && /bonus/i.test(SP(c.sn || c.n)?.time || '');

/* ---------- walking ---------- */
export const heroBusy = () => { const h = hero(); return !h || crossingNow() || rt.spotted || !!tokenViews.get(h.id)?.anim || pausedMover(h.id); };
const anyBusy = () => [...tokenViews.values()].some(tv => tv.anim) || state.tokens.some(t => pausedMover(t.id));
export const myTurn = () => state.combat.active && currentTurn()?.id === W()?.heroTok;
// The camera glides after the hero, keeping however the player has turned it: this only says where to look, and the
// follow camera (ui/wander.js, every frame) eases there. sec: how quickly (a floor change is a longer glide).
export function follow(t = hero(), sec = .35){ if (t) rt.focus = { x:wx(t.x), y:floorY(t.floor), z:wz(t.y), rate:sec > .5 ? 4 : 7 }; }

/* One square (dx, dy). A diagonal that's blocked slides along whichever side is open. In a fight it must fit in
   what's left of the hero's speed (no Dash by accident). → true if they stepped */
export function stepHero(dx, dy){
  const t = hero(); if (!t || t.dead || t.hp <= 0 || rt.talk || heroBusy()) return false;
  if (state.combat.active && !myTurn()) return false;
  const tries = dx && dy ? [[dx, dy], [dx, 0], [0, dy]] : [[dx, dy]];
  rt.step = [dx, dy]; rt.walkN++;   // (a step drops any tap's walk still finishing)
  for (const [ax, ay] of tries){
    const x = t.x + ax, y = t.y + ay, way = resolvePath(t, x, y);
    if (!way || way.path.length !== 1) continue;
    if (state.combat.active && (way.dash || way.cost > moveAllowance(t))){ toast('No movement left this turn.'); return false; }
    const from = { x:t.x, y:t.y }, map = state.meta.mapId;
    // (what happens next waits for the step to land: who they see from the new square, the way out they stepped onto)
    if (!doMove(t, x, y, { path:way.path, then:() => { if (!state.combat.active && map === state.meta.mapId) afterStep(t); } })) continue;
    rt.trail = pushTrail(rt.trail, from, 6);
    follow(t);
    return true;
  }
  // (a step that didn't go: into a front door, out of a doorway, on off the end of the road: game/ways.js)
  if (!state.combat.active && wayOnBump(t, dx, dy)) return true;
  // a step into a wall: a bump (ui/wander.js plays it), facing the way they tried
  if (performance.now() - (rt.bump?.at || 0) > 280){ rt.bump = { at:performance.now(), dx, dy }; faceStep(t.id, dx, dy); }
  return false;
}
// Walk to a tapped square (the touch way): the shortest path, then the same checks as a step.
export function walkTo(x, y){
  const t = hero(); if (!t || rt.talk || heroBusy() || (state.combat.active && !myTurn())) return false;
  let way = resolvePath(t, x, y);
  if (!way){   // someone stands there, or it's out of reach: the open square nearest it that they can get to
    const f = state.floors[t.floor], R = reach(t.floor, t.x, t.y, moveAllowance(t), t.id);
    const best = [...R.par.keys()].map(i => ({ x:i % f.W, y:(i / f.W) | 0 })).filter(p => (p.x !== t.x || p.y !== t.y) && !tokenAt(t.floor, p.x, p.y))
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (best && Math.hypot(best.x - x, best.y - y) < Math.hypot(t.x - x, t.y - y)) way = resolvePath(t, best.x, best.y);
  }
  if (!way || (state.combat.active && (way.dash || way.cost > moveAllowance(t)))) return false;
  x = way.path.at(-1).x; y = way.path.at(-1).y;
  const from = { x:t.x, y:t.y };
  if (!doMove(t, x, y, { path:way.path })) return false;
  rt.step = null; rt.tapTo = { x, y, map:state.meta.mapId };   // (a tap's walk: the square tapped counts, not the way it was walked)
  rt.trail = pushTrail(rt.trail, way.path.length > 1 ? way.path[way.path.length - 2] : from, 6);
  follow(t, .6);
  // (once the walk is done: where they end up is what counts)
  // (only the latest walk counts, and only on the map it began on)
  if (!state.combat.active){ const t0 = performance.now(), n = ++rt.walkN, map = state.meta.mapId;
    const done = () => { if (n !== rt.walkN || map !== state.meta.mapId) return; if (tokenViews.get(t.id)?.anim && performance.now() - t0 < 15000) setTimeout(done, 90); else afterStep(t); };
    setTimeout(done, 120); }
  return true;
}
function afterStep(t){
  const w = W(); w.quiet++;
  // the companions, each to where the one ahead stood
  members().slice(1).forEach((m, k) => {
    if (m.dead || m.hp <= 0) return;
    if (m.floor !== t.floor){ const p = nearestOpen(t.floor, t.x, t.y); if (p){ m.floor = t.floor; m.x = p.x; m.y = p.y; syncTokens(); } return; }
    const p = followSpot(rt.trail, k); if (!p || (p.x === m.x && p.y === m.y) || cheb(m, t) <= 1 && cheb(p, t) > 1) return;
    doMove(m, p.x, p.y, { delay:90 * (k + 1) });
  });
  direct(t);
}

/* ---------- the director: what happens after a step ---------- */
// They've been seen: a "!" over each creature that saw them, a sting, a held breath, then the fight
function spotted(seen){
  rt.spotted = performance.now();
  for (const m of seen) bubble(m.id, '!');
  passage.sting?.('spotted');
  setTimeout(() => { rt.spotted = 0; if (!state.combat.active) beginFight('none', [], { title:'Seen!', flair:seen.length === 1 ? `${seen[0].name} has seen you.` : 'They have seen you.' }); }, 750);
}
function direct(t){
  const w = W(), L = t.floor, f = state.floors[L];
  // a creature that has seen them (or they it), near enough: a fight
  const seen = foes().filter(m => cheb(m, t) <= 10 && partySees(m));
  if (seen.length){ spotted(seen); return; }
  // something close that can't be seen: a "?" over the hero, once for each
  const heard = foes().filter(m => cheb(m, t) <= 6 && !rt.heard.has(m.id));
  if (heard.length){ heard.forEach(m => rt.heard.add(m.id)); bubble(t.id, '?'); toast('Something moves, close by. You can\'t see what.'); }
  // what's on the road here: read out once; one with creatures springs
  for (const e of f.events || []){
    if (e.done || e.sprung || cheb(e, t) > 3) continue;
    const key = `${state.meta.mapId}:${L}:${e.id}`;
    if (e.enc){ springEvent(L, e.id); beginFight('none', [], { title:e.label, flair:e.text }); return; }
    if (!rt.seen.has(key) && !w.seen.includes(key)){ rt.seen.add(key); w.seen.push(key); showCard({ kind:'', title:e.label, flair:e.text }, false); }
  }
  // off the end of the road, back off its start, or out of a place by one of its ways (game/ways.js)
  if (wayAfterStep(t, rt.step)) return;
  if (onRoad()){
    // the last stretch's end: there
    const end = roadEnd(f), last = !f.down;
    if (last && end && cheb(end, t) <= 1){ arriveThere(); return; }
    const chance = ambushChance({ quiet:w.quiet, gaze:state.dread || 1, night:night(), ambushes:w.ambushes });
    if (Math.random() < (chance >= 1 ? 1 : chance * coverAround(f, t))){ ambush(t); return; }
    const m = Math.random() < momentChance({ quiet:w.quiet, had:w.momentAt === `${state.meta.mapId}:${L}` }) && nextMoment(MOMENTS, w.moments);
    if (m){ startMoment(m); return; }
  }
}
// Something comes out of the trees: a pack the party can take (or not quite), ahead and to the sides.
function ambush(t){
  const w = W(), L = t.floor, f = state.floors[L];
  const levels = members().filter(m => !m.dead).map(m => +(String(m.cls || '').match(/(\d+)/)?.[1]) || 1);
  const plan = planAmbush(BEST, { levels, gaze:state.dread || 1, ambushes:w.ambushes, night:night(), bloom:!!state.meta.journey?.bloom });
  if (!plan.group.length) return;
  // where they come from: open ground four to eight steps' walk away (by the road, not through the trees), in sight
  // where there's enough of it in sight
  updateVision();
  const n = plan.group.reduce((s, g) => s + g.n, 0), R = reach(L, t.x, t.y, 9, t.id);
  const ring = [...R.dist.entries()].filter(([, c]) => c >= 4 && c <= 8).map(([i]) => ({ x:i % f.W, y:(i / f.W) | 0 })).filter(p => !tokenAt(L, p.x, p.y));
  const inView = ring.filter(p => seenNow[L]?.has(p.y * f.W + p.x));
  const spots = (inView.length >= n ? inView : ring).sort(() => Math.random() - .5);
  const placed = [];
  for (const g of plan.group) for (let k = 0; k < g.n && spots.length; k++){ const s = spots.shift(); const m = makeMonster(g.bid, L, s.x, s.y); state.tokens.push(m); placed.push(m); }
  if (!placed.length) return;
  w.ambushes++; syncTokens(); placed.forEach(riseFrom); updateVision();
  log(`🗡 Ambush on ${f.name}: ${placed.map(m => m.name).join(', ')}.`);
  // do they see it coming? the party's best Perception against the pack's stealth
  const watch = Math.max(...members().map(m => m.passive || 10)), sneak = 1 + Math.floor(Math.random() * 20) + 2;
  beginFight(sneak > watch ? 'party' : 'none', placed.map(m => m.id), { title:'Ambush!', flair:pick(AMBUSH) });
}

/* ---------- fighting ---------- */
/* A fight breaks out: a moment for it (ui/wander.js draws it: what started it, who's there, the order they'll go in,
   and the ring of ground it's fought over), and nobody acts, the hero included, until it's past. Presses made in it
   (Ⓐ still down from walking or talking) do nothing, so no blow is struck before the player has seen the fight. */
export const OPENING_MS = 2200;
export const opening = () => rt.opening && performance.now() < rt.opening.until ? rt.opening : null;
export function beginFight(surprise = 'none', extra = [], why = {}){
  const t = hero(); if (!t || state.combat.active) return;
  ui.floor = t.floor;
  const near = foes().filter(m => cheb(m, t) <= 14 && (partySees(m) || extra.includes(m.id)));
  if (!near.length) return;
  rollInitiative({ ids:[...members().filter(m => !m.dead && m.floor === t.floor).map(m => m.id), ...near.map(m => m.id)], surprise });
  Object.assign(rt, { heroKey:'', attacks:0, acting:'', endAt:0, round:0, unseen:0, hpWas:null, target:null }); aim(1);
  const kinds = [...new Set(near.map(m => BEST[m.bid]?.name || m.name))], now = performance.now();
  rt.opening = { at:now, until:now + OPENING_MS, title:why.title || 'A fight!', flair:why.flair || '',
    foes:`${near.length} ${near.length === 1 ? 'foe' : 'foes'}: ${kinds.join(', ')}`, surprise };
  passage.sting?.('fight');
  log(`⚔ A fight on ${state.floors[t.floor]?.name || 'the road'}: ${near.map(m => m.name).join(', ')}.`);
  W().fights++;
  fightBegins(near);   // 🏆 the fight's record, the bestiary, the achievements (game/record.js)
}
const maxAttacks = t => /Extra Attack/.test(String(heroStats(state.characters[t.charId] || {}).features || '')) ? 2 : 1;
export const attacksLeft = () => { const t = hero(); return t && !rt.cast ? Math.max(0, maxAttacks(t) - rt.attacks) : 0; };
// The foes the hero can aim at, nearest first.
export const targets = () => { const t = hero(); return t ? foes().filter(m => partySees(m)).sort((a, b) => cheb(a, t) - cheb(b, t)) : []; };
export function aim(dir = 1){ const n = cycleTarget(targets(), rt.target, dir); rt.target = n?.id || null; return n; }
export const target = () => { const m = rt.target && tokById(rt.target); return m && !m.dead && m.hp > 0 ? m : (aim(1), rt.target && tokById(rt.target)); };
// Which of the hero's attacks would reach: the one they picked (Y), else a weapon in reach, else one that shoots that far.
export function attackFor(t, tg){
  if (!t || !tg) return -1;
  if (rt.atk !== null && t.attacks[rt.atk] && rangeCheck(t, tg, t.attacks[rt.atk]).ok) return rt.atk;
  if (coverOf(t, tg).cover === 'total') return -1;   // (no seeing them, no striking them)
  const ok = t.attacks.map((a, i) => [i, a, rangeCheck(t, tg, a)]).filter(([, , r]) => r.ok);
  const melee = ok.find(([, , r]) => r.kind === 'melee' || r.kind === 'reach'), ranged = ok.find(([, , r]) => !r.long);
  return (melee || ranged || ok[0] || [-1])[0];
}
export function nextWeapon(){ const t = hero(); if (!t?.attacks?.length) return null; rt.atk = rt.atk === null ? 0 : (rt.atk + 1) % t.attacks.length; return t.attacks[rt.atk]; }
export function heroAttack(pick = null){
  const t = hero(), tg = target();
  if (opening()) return;
  if (!myTurn()) return toast('Not your turn yet.');
  if (pick !== null && t?.attacks?.[pick]) rt.atk = pick;
  if (!tg) return toast('Nobody to strike.');
  if (!attacksLeft()) return toast(rt.cast ? 'You have cast this turn: Ⓐ again ends your turn.' : 'You have struck this turn: Ⓐ again ends your turn.');
  const i = attackFor(t, tg); if (i < 0) return toast(`${tg.name} is out of reach: walk closer.`);
  rt.look = { id:tg.id, until:performance.now() + 1500 };   // (the camera frames the two of them a moment: ui/wander.js)
  if (doAttack(t.id, tg.id, i) !== false){ rt.attacks++; rt.did = 'strike'; }
  changed();
}
// 🤚 a Shove at the one aimed at, in place of a strike (game/combat.js shove): 'push' them back, or knock them 'prone'
export function heroShove(choice = 'push'){
  const t = hero(), tg = target();
  if (opening()) return;
  if (!myTurn()) return toast('Not your turn yet.');
  if (!tg) return toast('Nobody to shove.');
  if (!attacksLeft()) return toast('You have struck this turn.');
  rt.look = { id:tg.id, until:performance.now() + 1500 };
  if (shove(t.id, tg.id, choice)){ rt.attacks++; rt.did = 'strike'; }
  changed();
}
export function heroDodge(){ heroTurnAct('dodge'); }
// Dash, Disengage, Dodge (or Stand up, which costs movement): the action spent, the turn not over (there may be moving to do)
export function heroTurnAct(k){
  const t = hero(); if (!myTurn()) return toast('Not your turn yet.');
  if (k !== 'stand' && (rt.cast || rt.attacks)) return toast('You have used your action this turn.');
  if (!turnAction(t, k)) return;
  if (k !== 'stand'){ rt.attacks = maxAttacks(t); rt.did = k; }
  toast(k === 'dodge' ? `${t.name} takes the Dodge.` : k === 'dash' ? `${t.name} dashes: twice the move this turn.` : k === 'disengage' ? `${t.name} disengages: no free strikes as they go.` : `${t.name} gets up.`);
  changed();
}
// The hero's features (Second Wind, Action Surge, Rage, Lay on Hands on themselves…): engine-side, game/resources.js.
// Action Surge gives the turn's action back, strikes and all (once a turn).
export const heroFeatures = () => { const t = hero(); return t ? (t.resources || []).filter(r => !r.slot && r.id !== 'hd').map(r => ({ id:r.id, n:r.n, left:left(t, r.id), max:r.max, text:r.text || '',
  why:!left(t, r.id) ? 'none left: a rest brings it back' : r.id === 'surge' && !state.combat.active ? 'in a fight' : r.id === 'surge' && rt.surged ? 'once a turn' : state.combat.active && !myTurn() ? 'on your turn'
    : state.combat.active && BONUS_FEATS.has(r.id) && rt.bonus ? 'your bonus action is spent' : '' })) : []; };
export function heroFeature(id){
  const t = hero(), f = heroFeatures().find(x => x.id === id); if (!t || !f) return false;
  if (f.why) return toast(`${f.n}: ${f.why}.`), false;
  if (!useFeature(t, id, t)) return false;
  if (state.combat.active && BONUS_FEATS.has(id)) rt.bonus = true;
  if (id === 'surge'){ rt.surged = true; rt.attacks = 0; rt.cast = false; toast('⚡ Action Surge: one more action this turn.'); }
  changed(); return true;
}
export function endHeroTurn(){ if (myTurn()){ rt.heroKey = ''; nextTurn(); } }

/* 🎯 What's left of the hero's turn, for the pips on the fight bar (ui/turnpips.js): the action (and how many strikes
   are in it), the bonus action, the move in feet, the reaction. */
export function economy(){
  const t = hero(); if (!t || !state.combat.active) return null;
  const n = maxAttacks(t), struck = rt.attacks > 0 && !rt.cast && !rt.did?.match(/dodge|dash|disengage/);
  return { mine:myTurn(), strikes:attacksLeft(), of:n, action:attacksLeft() > 0, partway:struck && attacksLeft() > 0, did:rt.did || (rt.cast ? 'cast' : rt.attacks ? 'strike' : ''),
    bonus:!rt.bonus, moveFt:Math.max(0, moveAllowance(t)) * 5, reaction:!t.reacted };
}
/* The odds of the hero's attack i at a target, before it's struck: { hit, crit, pct, need, avg, edge:{ mark, text },
   cover, ok } (game/combat.js attackEdge: the same reasons the roll will use; engine/odds.js the chances). */
export function strikeOdds(i, tg = target()){
  const t = hero(), a = t?.attacks?.[i]; if (!a || !tg) return null;
  let E; try { E = attackEdge(t, tg, a); } catch { return null; }
  const o = hitOdds(E.bonus, E.ac, { adv:E.adv, dis:E.dis, autoCrit:E.cm.autoCrit });
  const rage = a.m && (t.conds || []).some(c => c.n === 'raging') ? t.rageDmg || 2 : 0;
  return { ...o, pct:pct(o.hit), avg:Math.round(expectedDamage(a.d, o, rage) * (a.rays || 1) * 10) / 10, edge:edgeWords({ adv:E.advWhy, dis:E.disWhy }),
    cover:E.cov.cover, ok:E.rc.ok && E.cov.cover !== 'total' };
}

/* A tick of the fight (from the frame loop): wait while anyone is walking, then the next one's turn; the hero waits
   for the player. When it's won, or lost, wind it up. */
export function fightTick(now = performance.now()){
  const c = state?.combat; if (!c?.active || !W()) return;
  if (rt.opening && now < rt.opening.until){ rt.lastBusy = now; return; }   // (the fight's moment: nobody moves yet)
  if (anyBusy()){ rt.lastBusy = now; return; }
  // a standoff: three whole rounds and nobody on either side hurt (the rest run off into the trees, keep out of reach,
  // or won't come out): they withdraw, and it's over
  if (rt.round !== c.round){ rt.round = c.round;
    const all = c.order.map(tokById).filter(Boolean), hp = all.reduce((n, o) => n + Math.max(0, o.hp) + (o.dead ? 0 : 1000), 0);
    rt.unseen = rt.hpWas === hp ? (rt.unseen || 0) + 1 : 0; rt.hpWas = hp;
    const left = all.filter(o => o.kind === 'monster' && !o.dead && o.hp > 0 && !o.flags?.gone);
    if (rt.unseen >= 3 && left.length){ for (const o of left) o.flags.gone = true; rt.unseen = 0; syncTokens();
      showCard({ kind:'', title:'They slip away', flair:`${left.map(o => o.name).join(', ')} ${left.length === 1 ? 'is' : 'are'} gone into the trees. For now.` }, false); } }
  const lost = partyDown(members()), won = c.won || !c.order.some(id => { const o = tokById(id); return o?.kind === 'monster' && !o.dead && o.hp > 0 && !o.flags?.gone; });
  if (won || lost){ if (!rt.endAt) rt.endAt = now + 2300;   // (the last blow runs slow: render/punch.js)
    else if (now >= rt.endAt) finishFight(!lost); return; }
  const t = currentTurn(); if (!t) return;
  const key = `${c.round}:${c.idx}:${t.id}`;
  if (t.id === W().heroTok){
    if (t.dead || t.hp <= 0){ if (rt.acting !== key){ rt.acting = key; rt.actAt = now; } else if (now - rt.actAt > pace().down) nextTurn(); return; }
    if (rt.heroKey !== key){ rt.heroKey = key; rt.did = ''; rt.attacks = 0; rt.cast = false; rt.bonus = false; rt.surged = false; rt.atk = null; if (!target()) aim(1); follow(t); }
    if (!attacksLeft() && moveAllowance(t) <= 0 && now - rt.lastBusy > pace().down) endHeroTurn();
    return;
  }
  // a foe's turn: it shows who it's going for (a wind-up, a red arrow on the ground: ui/fightfx.js), then does it
  if (rt.acting !== key){ rt.acting = key; rt.actAt = now; if (t.dead || t.hp <= 0 || t.flags?.gone){ nextTurn(); return; }
    let p = null; try { p = planFor(t); } catch {}
    const tg = p && (p.kind === 'attack' || p.kind === 'cast') && p.target && tokById(p.target);
    if (tg && tg.id !== t.id){ const ms = pace().wind; bus.emit('aims', { by:t.id, at:tg.id, ms }); rt.wind = { key, until:now + ms, p }; return; }
    try { autoTurn(t, p); } catch (e){ console.warn(e); } return; }
  if (rt.wind?.key === key){ if (now < rt.wind.until) return; const p = rt.wind.p; rt.wind = null; rt.actAt = now; try { autoTurn(t, p); } catch (e){ console.warn(e); } return; }
  if (now - rt.actAt > pace().after && now - rt.lastBusy > pace().settle) nextTurn();
}
function finishFight(won){
  const c = state.combat, w = W();
  const order = [...c.order];
  if (!won){ const summary = fightEnds(false, { order }); endCombat(); fallen(summary, order); return; }
  const xp = c.order.map(tokById).filter(o => o?.kind === 'monster' && (o.dead || o.hp <= 0)).reduce((s, o) => s + xpOf(BEST[o.bid]), 0);
  const each = shareXp(xp, members().length);
  const xpWas = w.xp, nextWas = nextLevelXp(), lvlWas = partyLevel();
  w.xp += each; w.quiet = 0;
  // 🏆 the fight's scorecard (game/record.js), taken before the fight is ended (endCombat drops a record still open as a
  // fight called off) and before the fallen get up
  const loot = fightLoot(xp, { level:partyLevel() }), summary = fightEnds(true, { xp:each, loot, order });
  endCombat();
  for (const m of members()) if (m.dead || m.hp <= 0){ m.dead = false; m.hp = 1; m.flags.bloodied = true; }
  syncTokens();
  const lines = [xp ? `<b>${each} XP</b> each · ${w.xp} in all${nextLevelXp() ? ` (level ${partyLevel() + 1} at ${nextLevelXp()})` : ''}` : 'Nothing worth counting.'];
  if (loot.gp || loot.sp || loot.items.length){ gainLoot(loot); lines.push(`Found: ${[loot.gp && `${loot.gp} gp`, loot.sp && `${loot.sp} sp`, ...loot.items].filter(Boolean).map(esc).join(', ')}`); }
  const moods = xp ? react(['brave']) : []; lines.push(...moods);
  // 🏆 the victory screen (Muse's ui/victory.js) over the fight's scorecard; the plain card if there's no record (a fight
  // the record didn't see begin)
  const party = members().map(m => m.id), names = Object.fromEntries(order.map(tokById).filter(Boolean).map(o => [o.id, o.name]));
  if (summary && typeof document !== 'undefined'){
    openVictory(summary, { party, names, faces:{}, xp:{ before:xpWas, after:w.xp, next:nextWas || w.xp, level:lvlWas },
      onClose:() => { if (moods.length) showCard({ kind:'', title:'The party', lines:moods }, false); if (levelReady()) bus.emit('levelReady'); } });   // (how the companions took it; a level to take: straight to it)
    setTimeout(() => { for (const m of members()){ try { const f = faceOf(m); if (f) setVictoryFace(m.id, f); } catch {} } }, 60);
  } else showCard({ kind:'', title:'The fight is over', flair:pick(WON), lines }, false);
  Object.assign(rt, { endAt:0, acting:'', heroKey:'', target:null, cast:false, bonus:false });
  const V = valley();
  if (xp) questEvent({ k:'win', road:onRoad(), from:V.journey?.from, to:V.journey?.to, place:onRoad() ? null : V.at });
  checkLevels();
  follow(); changed(); saveNow();
}
// The whole party is down: the Mists take them back to the last save (or, with none, to waking in the village).
// 🌫 the whole party down: Muse's defeat screen (the fight's scorecard, the heroes greyed, where they'll wake), and
// Rise carries on from the last safe save (or, with none, at full health where they stand). Without a scorecard (a
// page with no screen to show) the old card and its 2.6 seconds.
function fallen(summary = null, order = []){
  rt.endAt = 0;
  const wake = () => { if (!continueWander({ safe:true })){ for (const m of members()){ m.dead = false; m.hp = m.maxHp; } syncTokens(); changed(); } else wakeAtOven(); };
  if (!summary || typeof document === 'undefined'){ showCard({ kind:'seep', ...LOST }, false); setTimeout(wake, 2600); return; }
  const party = members().map(m => m.id);
  const names = Object.fromEntries([...party, ...order].map(tokById).filter(Boolean).map(o => [o.id, o.name]));
  openDefeat(summary, { party, names, faces:{}, from:wakePlace(), onClose:wake });
  setTimeout(() => { for (const m of members()){ try { const f = faceOf(m); if (f) setDefeatFace(m.id, f); } catch {} } }, 60);
}
/* ---------- 🔥 the Dutch Oven and Dutcher's cairn (data/memorial.js) ----------
   In the Village of Barovia (engine/settlement.js, the village's oven and cairn): the first time on a journey the
   hero steps into either, a card tells the village's story of Dutcher; a night's rest under the Oven's roof says so;
   and a fallen party wakes there, by the fire. */
const roomOf = t => t ? (state.floors[t.floor]?.rooms || []).find(r => t.x >= r.x && t.x < r.x + r.w && t.y >= r.y && t.y < r.y + r.h) || null : null;
const ovenOn = L => (state.floors[L]?.rooms || []).find(r => r.name === MEMORIAL.oven.name) || null;
const memorialSeen = new Set();   // (once each journey: this page's run)
export function memorialSteps(){
  if (!W() || state.combat.active || rt.talk) return null;
  const r = roomOf(hero()), M = r && [MEMORIAL.oven, MEMORIAL.cairn].find(m => m.name === r.name);
  if (!M || memorialSeen.has(M.name)) return null;
  memorialSeen.add(M.name);
  showCard({ kind:'', title:M.name, flair:M.flair, lines:M.lines }, false);
  return M.name;
}
export const inOven = () => roomOf(hero())?.name === MEMORIAL.oven.name;
function wakeAtOven(){
  const h = hero(), r = h && ovenOn(h.floor); if (!r) return false;
  for (const m of members().filter(o => !o.flags?.gone)){ m.x = -99; }   // (out of the way of each other's squares while they're placed)
  for (const m of members().filter(o => !o.flags?.gone)){ const at = nearestOpen(h.floor, r.cx, r.cy); if (at){ m.floor = h.floor; m.x = at.x; m.y = at.y; } }
  syncTokens(); enterView(); changed(); saveNow();
  return true;
}
// where the last safe save stands: its hero's place (or the road it was on), read from the save as it is
export function wakePlace(){
  try {
    const s = loadWanderSave({ safe:true }); if (!s) return null;
    const V = s.campaign?.valley, h = (s.tokens || []).find(t => t.id === s.campaign?.wander?.heroTok);
    if (V?.journey) return `the road to ${placeById(V.journey.to)?.name || 'the next village'}`;
    const fl = s.floors?.[h?.floor ?? 0], name = fl?.name;
    if ((fl?.rooms || []).some(r => r.name === MEMORIAL.oven.name)) return `the Dutch Oven${name ? `, in the ${name}` : ''}`;   // (the party wakes by its fire)
    return name ? name : null;
  } catch { return null; }
}

/* ---------- Ⓐ: what's here ---------- */
// What Ⓐ would do where the hero stands: { label, run } | null
export function hereAction(){
  const t = hero(); if (!t || state.combat.active || rt.talk) return null;
  const L = t.floor, f = state.floors[L];
  const npc = state.tokens.find(o => o.kind === 'npc' && o.flags?.companion && o.floor === L && cheb(o, t) <= 1);
  if (npc) return { label:`Talk to ${npc.name}`, run:() => talkTo(npc.flags.companion) };
  const pal = members().slice(1).find(o => o.floor === L && cheb(o, t) <= 1 && o.flags?.companion);
  const folk = (f.folk || []).find(p => !p.gone && !p.away && cheb(p, t) <= 1);
  if (folk) return { label:`Talk to ${folk.name || 'them'}`, run:() => folkTalk(folk) };
  const st = onStairs(t);
  if (st && !onRoad()) return { label:st === 'down' ? `Go down to ${state.floors[L + 1].name}` : `Go up to ${state.floors[L - 1].name}`, run:() => { takeStairs(t); rt.trail = []; goFloor(t.floor, false); follow(t, .8); saveNow(); } };
  const ev = (f.events || []).find(e => !e.done && cheb(e, t) <= 1);
  if (ev) return { label:`Look: ${ev.label}`, run:() => showCard({ kind:'', title:ev.label, flair:ev.text }, false) };
  const fd = findNear(t); if (fd && fd.kind !== 'read') return { label:findLabel(fd), run:() => useFind(fd) };
  if (signpostNear(t)) return { label:'Read the signpost', run:() => readSignpost(t) };
  if (fd) return { label:findLabel(fd), run:() => useFind(fd) };
  const out = doorwayHere(t); if (out) return { label:out, run:() => goOutside(t) };
  if (pal) return { label:`Talk to ${pal.name}`, run:() => talkTo(pal.flags.companion) };
  return null;
}

/* ---------- the road and the menu ---------- */
// Where the party can set out for from here (the valley's roads): [{ id, name, stretches, hours }]
// Every place the valley's roads reach from here, nearest first; the Mists and the castle are not for walking up to.
export function destinations(){
  const at = valley().at, near = roadsOutOf(at), been = valley().visited || [];
  return VALLEY_PLACES.filter(p => p.id !== at && !['mists', 'castle'].includes(p.id) && (near.includes(p.id) || been.includes(p.id)))
    .map(p => { const plan = planJourney(at, p.id); return plan ? { id:p.id, name:p.name, stretches:plan.stretches.length, via:plan.path.slice(1, -1).map(id => placeById(id)?.name).filter(Boolean) } : null; })
    .filter(Boolean).sort((a, b) => a.stretches - b.stretches);
}
export function setOut(to, { quiet = false } = {}){
  if (state.combat.active || onRoad()) return false;
  travel(to, { quiet });
  if (!onRoad()) return false;
  W().quiet = 0; fresh(); enterView();
  const p = placeById(to);
  if (!quiet) showCard({ kind:'', title:`The road to ${p.name}`, sub:clockText(), flair:'The last house falls behind. The fog closes in, and the trees come right down to the road.' }, false);
  changed(); saveNow(); return true;
}
// The menu's Travel, as a crossing (the screen fogs over, the road's name slides in)
export function travelTo(to){
  if (state.combat.active || onRoad() || crossingNow()) return false;
  if (!passage.veil) return setOut(to);
  passage.sting?.('stairs');
  passage.veil(() => { if (setOut(to, { quiet:true })) passage.banner?.(bannerHere(`On the road to ${placeById(to)?.name || to}.`)); });
  return true;
}
// Rest: in a place, the night (everyone whole again, the clock on eight hours); on the road, an hour (and a risk).
export function rest(){
  if (state.combat.active) return false;
  const list = members().filter(m => !m.flags?.gone);
  if (onRoad()){ shortRest(list); passTime(1); W().quiet = Math.max(W().quiet, 30); }
  else { for (const m of list){ m.dead = false; if (m.hp <= 0) m.hp = 1; } longRest(list); passTime(8); questEvent({ k:'rest', place:valley().at });
    if (inOven()) showCard({ kind:'', title:`A night at ${MEMORIAL.oven.name}`, flair:MEMORIAL.oven.rest }, false); }
  syncTokens(); changed(); saveNow(); return true;
}

/* ---------- 🔔 the valley's hours, heard ----------
   In a village or a town, when the clock passes seven in the evening, the church bell tolls three times and the
   shutters close all along the street (the windows and the lamps light with the hour: render/props.js windowGlow). */
let bellWas = null;
hourHooks.push(() => {
  const V = valley(), was = bellWas; bellWas = { day:V.day, hour:V.hour };
  if (!wandering() || !was || onRoad()) return;
  const passed = V.day > was.day ? V.hour >= 19 || was.hour < 19 : was.hour < 19 && V.hour >= 19;
  if (!passed || !['village', 'town'].includes(placeById(V.at)?.kind)) return;
  [0, 1700, 3400].forEach(ms => setTimeout(() => sfx('toll', false), ms));
  toast('🔔 The church bell tolls for dusk. All along the street, the shutters close.');
});
