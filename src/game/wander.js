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
import { state, ui, tokById, tokenAt, makeMonster, makeNPC, log, newState } from '../engine/state.js';
import { newWander, planAmbush, recruitRoll, followSpot, pushTrail, roadEnd, cycleTarget, partyDown, ambushChance } from '../engine/wander.js';
import { COMPANIONS, companionById, WAKE, AMBUSH, WON, LOST } from '../data/wander.js';
import { TEMPLATES } from '../data/themes.js';
import { BEST } from '../data/bestiary.js';
import { newHero, heroStats } from '../engine/hero.js';
import { greet, rumourFor } from '../engine/folk.js';
import { rangeCheck, coverOf } from '../engine/targeting.js';
import { xpOf } from '../engine/encounter.js';
import { freeTilesNear, reach, updateVision, seenNow } from '../engine/grid.js';
import { walk } from '../engine/tiles.js';
import { placeById, planJourney } from '../engine/overland.js';
import { VALLEY_PLACES } from '../data/barovia-map.js';
import { pick, uid } from '../util/core.js';
import { applyCharacter } from './heroes.js';
import { doMove, resolvePath, takeStairs, onStairs, goFloor, nearestOpen } from './actions.js';
import { rollInitiative, nextTurn, autoTurn, endCombat, doAttack, currentTurn, partySees, riseFrom, removeToken } from './combat.js';
import { turnAction, pausedMover, autoAnswer } from './moves.js';
import { moveAllowance } from './rules.js';
import { travel, arrive, enterPlace, valley, passTime, clockText, springEvent } from './overworld.js';
import { court } from './court.js';
import { longRest, shortRest } from './resources.js';
import { loadState, changed, flushSave, loadWanderSave, wanderCheckpoint, deserialize } from './session.js';
import { showCard, toast } from '../ui/hud.js';
import { syncTokens, tokenViews } from '../render/minis.js';
import { camTo, wx, wz, floorY } from '../render/scene.js';
import * as THREE from 'three';

export const W = () => state?.campaign?.wander || null;
export const wandering = () => !!(ui.wander && W());
export const hero = () => { const w = W(); return w && tokById(w.heroTok); };
export const members = () => { const w = W(); return w ? [hero(), ...w.party.map(p => tokById(p.tok))].filter(Boolean) : []; };
const foes = () => { const h = hero(); return h ? state.tokens.filter(o => o.kind === 'monster' && o.floor === h.floor && !o.dead && o.hp > 0 && !o.flags?.gone) : []; };
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const night = () => { const h = valley().hour; return h >= 20 || h < 6; };
const onRoad = () => state.meta.template === 'journey';

// What only this device keeps while playing (never saved): the hero's trail, the aim, whose turn was whose.
export const rt = { trail:[], target:null, atk:null, heroKey:'', attacks:0, acting:'', actAt:0, lastBusy:0, endAt:0, talk:null, seen:new Set(), round:0, unseen:0, hpWas:null };
const fresh = () => Object.assign(rt, { trail:[], target:null, atk:null, heroKey:'', attacks:0, acting:'', actAt:0, lastBusy:0, endAt:0, talk:null, round:0, unseen:0, hpWas:null });

/* ---------- starting and leaving ---------- */
// The look that goes with playing: the players' fog, the DM's desk away, the camera low behind the hero.
export function enterView(){
  ui.wander = true; ui.tableView = true; ui.panelOpen = false; ui.view = 'tilt'; ui.roomPrompts = false; ui.selected = null;
  autoAnswer.on = true;
  document.body.classList.add('wander');
  const h = hero(); if (!h) return;
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
  s.campaign.wander = newWander({ heroId:sheet.id, seed });
  ui.wander = true; fresh();
  loadState(s);
  const t = applyCharacter(sheet, { owner:'You' });
  W().heroTok = t.id;
  const f = state.floors[0], r = f.rooms.find(x => /road in/i.test(x.name || '')) || f.rooms[0], at = nearestOpen(0, r.cx, r.cy) || { x:r.cx, y:r.cy };
  t.floor = 0; t.x = at.x; t.y = at.y;
  placeCompanions();
  enterView(); syncTokens();
  showCard({ kind:'seep', ...WAKE }, false);
  log(`🗡 ${t.name} wakes in the Village of Barovia.`);
  changed(); saveNow();
  return t;
}
export function continueWander({ safe = false } = {}){
  const s = loadWanderSave({ safe }); if (!s) return false;
  if (!ui.wander) flushSave();   // the DM's campaign, if it had anything waiting, to its own slot first
  ui.wander = true; fresh();
  loadState(deserialize(s));
  if (!W()){ ui.wander = false; return false; }
  enterView(); changed();
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
const sheetOf = () => state.characters[W().heroId];
function companionSheet(c){
  const h = newHero(c.cls);
  return Object.assign(h, { id:`cmp-${c.id}-${W().seed.slice(0, 6)}`, name:c.name, sp:c.sp, weapons:c.weapons, spells:c.spells, color:c.color, backstory:c.blurb, player:'Companion' });
}
// Bring one over: a hero token where they stood, on the party's side.
function join(c){
  const npc = state.tokens.find(t => t.flags?.companion === c.id && t.kind === 'npc'), h = hero();
  const t = applyCharacter(companionSheet(c), { owner:'Companion' });
  t.flags.companion = c.id;
  const at = npc || h; t.floor = at.floor; t.x = at.x; t.y = at.y;
  if (npc) removeToken(npc.id);
  W().party.push({ id:c.id, tok:t.id });
  showCard({ kind:'', title:`${c.name} joins you`, flair:c.join }, false);
  log(`🗡 ${c.join}`); syncTokens(); changed(); saveNow();
}

/* ---------- talk ---------- */
/* What a conversation shows: { title, sub, text, options:[{ k, label, off }] }. A companion: their words, the pitch
   (once refused, not again until the party has fought since), a question, goodbye. One of the folk: what they say. */
export function talkView(){
  const tk = rt.talk; if (!tk) return null;
  if (tk.folk) return { title:tk.title, sub:tk.sub, text:tk.text, options:[{ k:'bye', label:'Leave' }] };
  const c = companionById(tk.id), met = (W().met[c.id] ||= {});
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
  rt.talk = { id, text:'' };
  const met = (W().met[c.id] ||= {}); if (!met.seen){ rt.talk.text = c.hello; met.seen = true; }
}
export function folkTalk(p){
  const r = Math.random, said = greet(p, { gaze:state.dread || 1, night:night() }, r), heard = p.role === 'dog' ? null : rumourFor(p, court(), { gaze:state.dread || 1 }, r);
  rt.talk = { folk:true, title:p.name || 'Someone of the valley', sub:'', text:`${said}${heard && heard.text !== said ? `\n\n${heard.text}` : ''}` };
}
// → what happened: 'closed' | 'joined' | 'refused' | 'said'
export function chooseTalk(k){
  const tk = rt.talk; if (!tk) return 'closed';
  if (k === 'bye' || tk.folk){ rt.talk = null; return 'closed'; }
  const c = companionById(tk.id), met = W().met[c.id] ||= {}, v = talkView();
  if (k === 'ask'){ tk.text = c.ask; return 'said'; }
  if (k === 'pitch'){
    if (v.options[0].off){ tk.text = v.options[0].off; return 'said'; }
    const d20 = 1 + Math.floor(Math.random() * 20), r = recruitRoll(c, heroStats(sheetOf()).skills, d20);
    const roll = r.skill ? ` [${r.skill}: ${d20} + ${r.bonus} = ${r.total} against ${r.dc}]` : '';
    if (r.ok){ rt.talk = null; join(c); log(`🗡 ${hero().name} wins ${c.name} over${roll}.`); return 'joined'; }
    met.refused = W().fights; tk.text = `${c.no}${roll}`; changed(); return 'refused';
  }
  return 'said';
}

/* ---------- walking ---------- */
const heroBusy = () => { const h = hero(); return !h || !!tokenViews.get(h.id)?.anim || pausedMover(h.id); };
const anyBusy = () => [...tokenViews.values()].some(tv => tv.anim) || state.tokens.some(t => pausedMover(t.id));
export const myTurn = () => state.combat.active && currentTurn()?.id === W()?.heroTok;
// The camera glides after the hero, keeping however the player has turned it.
export function follow(t = hero(), sec = .35){ if (t) camTo(new THREE.Vector3(wx(t.x), floorY(t.floor), wz(t.y)), null, sec); }

/* One square (dx, dy). A diagonal that's blocked slides along whichever side is open. In a fight it must fit in
   what's left of the hero's speed (no Dash by accident). → true if they stepped */
export function stepHero(dx, dy){
  const t = hero(); if (!t || t.dead || t.hp <= 0 || rt.talk || heroBusy()) return false;
  if (state.combat.active && !myTurn()) return false;
  const tries = dx && dy ? [[dx, dy], [dx, 0], [0, dy]] : [[dx, dy]];
  for (const [ax, ay] of tries){
    const x = t.x + ax, y = t.y + ay, way = resolvePath(t, x, y);
    if (!way || way.path.length !== 1) continue;
    if (state.combat.active && (way.dash || way.cost > moveAllowance(t))){ toast('No movement left this turn.'); return false; }
    const from = { x:t.x, y:t.y };
    if (!doMove(t, x, y, { path:way.path })) continue;
    rt.trail = pushTrail(rt.trail, from, 6);
    follow(t);
    if (!state.combat.active) afterStep(t);
    return true;
  }
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
  rt.trail = pushTrail(rt.trail, way.path.length > 1 ? way.path[way.path.length - 2] : from, 6);
  follow(t, .6);
  if (!state.combat.active) setTimeout(() => afterStep(t), 120 * way.path.length);
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
function direct(t){
  const w = W(), L = t.floor, f = state.floors[L];
  // a creature that has seen them (or they it), near enough: a fight
  const seen = foes().filter(m => cheb(m, t) <= 10 && partySees(m));
  if (seen.length){ beginFight('none'); return; }
  // what's on the road here: read out once; one with creatures springs
  for (const e of f.events || []){
    if (e.done || e.sprung || cheb(e, t) > 3) continue;
    const key = `${state.meta.mapId}:${L}:${e.id}`;
    if (e.enc){ springEvent(L, e.id); showCard({ kind:'seep', title:e.label, flair:e.text }, false); beginFight('none'); return; }
    if (!rt.seen.has(key) && !w.seen.includes(key)){ rt.seen.add(key); w.seen.push(key); showCard({ kind:'', title:e.label, flair:e.text }, false); }
  }
  if (onRoad()){
    // the end of the stretch: on along the road, or there
    const end = roadEnd(f), last = !f.down;
    if (!last && onStairs(t) === 'down'){ downTheRoad(t); return; }
    if (last && end && cheb(end, t) <= 1){ arriveThere(); return; }
    if (Math.random() < ambushChance({ quiet:w.quiet, gaze:state.dread || 1, night:night(), ambushes:w.ambushes })){ ambush(t); return; }
  }
}
function downTheRoad(t){
  takeStairs(t); W().quiet = 0; rt.trail = [];
  goFloor(t.floor, false); follow(t, .8);
  toast(state.floors[t.floor].name);
  saveNow();
}
function arriveThere(){
  const V = valley(), to = V.journey?.to; if (!to) return;
  arrive(); enterPlace(to); W().quiet = 0; rt.trail = []; fresh();
  placeCompanions(); enterView(); changed(); saveNow();
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
  showCard({ kind:'seep', title:'Ambush!', flair:pick(AMBUSH), lines:[`${placed.length} ${placed.length === 1 ? 'creature' : 'creatures'}: ${[...new Set(placed.map(m => BEST[m.bid].name))].join(', ')}`] }, false);
  log(`🗡 Ambush on ${f.name}: ${placed.map(m => m.name).join(', ')}.`);
  // do they see it coming? the party's best Perception against the pack's stealth
  const watch = Math.max(...members().map(m => m.passive || 10)), sneak = 1 + Math.floor(Math.random() * 20) + 2;
  beginFight(sneak > watch ? 'party' : 'none', placed.map(m => m.id));
}

/* ---------- fighting ---------- */
export function beginFight(surprise = 'none', extra = []){
  const t = hero(); if (!t || state.combat.active) return;
  ui.floor = t.floor;
  const near = foes().filter(m => cheb(m, t) <= 14 && (partySees(m) || extra.includes(m.id)));
  if (!near.length) return;
  rollInitiative({ ids:[...members().filter(m => !m.dead && m.floor === t.floor).map(m => m.id), ...near.map(m => m.id)], surprise });
  Object.assign(rt, { heroKey:'', attacks:0, acting:'', endAt:0, round:0, unseen:0, hpWas:null, target:null }); aim(1);
  W().fights++;
}
const maxAttacks = t => /Extra Attack/.test(String(heroStats(state.characters[t.charId] || {}).features || '')) ? 2 : 1;
export const attacksLeft = () => { const t = hero(); return t ? Math.max(0, maxAttacks(t) - rt.attacks) : 0; };
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
export function heroAttack(){
  const t = hero(), tg = target();
  if (!myTurn()) return toast('Not your turn yet.');
  if (!tg) return toast('Nobody to strike.');
  if (!attacksLeft()) return toast('You have struck this turn. Ⓑ ends your turn.');
  const i = attackFor(t, tg); if (i < 0) return toast(`${tg.name} is out of reach: walk closer.`);
  if (doAttack(t.id, tg.id, i) !== false) rt.attacks++;
  changed();
}
export function heroDodge(){ const t = hero(); if (!myTurn()) return; turnAction(t, 'dodge'); rt.attacks = maxAttacks(t); toast(`${t.name} takes the Dodge.`); endHeroTurn(); }
export function endHeroTurn(){ if (myTurn()){ rt.heroKey = ''; nextTurn(); } }

/* A tick of the fight (from the frame loop): wait while anyone is walking, then the next one's turn; the hero waits
   for the player. When it's won, or lost, wind it up. */
export function fightTick(now = performance.now()){
  const c = state?.combat; if (!c?.active || !W()) return;
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
  if (won || lost){ if (!rt.endAt) rt.endAt = now + 1500; else if (now >= rt.endAt) finishFight(!lost); return; }
  const t = currentTurn(); if (!t) return;
  const key = `${c.round}:${c.idx}:${t.id}`;
  if (t.id === W().heroTok){
    if (t.dead || t.hp <= 0){ if (rt.acting !== key){ rt.acting = key; rt.actAt = now; } else if (now - rt.actAt > 900) nextTurn(); return; }
    if (rt.heroKey !== key){ rt.heroKey = key; rt.attacks = 0; rt.atk = null; if (!target()) aim(1); follow(t); }
    if (!attacksLeft() && moveAllowance(t) <= 0 && now - rt.lastBusy > 900) endHeroTurn();
    return;
  }
  if (rt.acting !== key){ rt.acting = key; rt.actAt = now; if (t.dead || t.hp <= 0 || t.flags?.gone){ nextTurn(); return; } try { autoTurn(t); } catch (e){ console.warn(e); } return; }
  if (now - rt.actAt > 1100 && now - rt.lastBusy > 700) nextTurn();
}
function finishFight(won){
  const c = state.combat, w = W();
  if (!won){ endCombat(); fallen(); return; }
  const xp = c.order.map(tokById).filter(o => o?.kind === 'monster' && (o.dead || o.hp <= 0)).reduce((s, o) => s + xpOf(BEST[o.bid]), 0);
  w.xp += xp; w.quiet = 0;
  endCombat();
  for (const m of members()) if (m.dead || m.hp <= 0){ m.dead = false; m.hp = 1; m.flags.bloodied = true; }
  syncTokens();
  showCard({ kind:'', title:'The fight is over', flair:pick(WON), lines:[xp ? `<b>${xp} XP</b> · ${w.xp} in all` : 'Nothing worth counting.'] }, false);
  Object.assign(rt, { endAt:0, acting:'', heroKey:'', target:null });
  follow(); changed(); saveNow();
}
// The whole party is down: the Mists take them back to the last save (or, with none, to waking in the village).
function fallen(){
  rt.endAt = 0;
  showCard({ kind:'seep', ...LOST }, false);
  setTimeout(() => {
    if (!continueWander({ safe:true })){ for (const m of members()){ m.dead = false; m.hp = m.maxHp; } syncTokens(); changed(); }
  }, 2600);
}

/* ---------- Ⓐ: what's here ---------- */
// What Ⓐ would do where the hero stands: { label, run } | null
export function hereAction(){
  const t = hero(); if (!t || state.combat.active || rt.talk) return null;
  const L = t.floor, f = state.floors[L];
  const npc = state.tokens.find(o => o.kind === 'npc' && o.flags?.companion && o.floor === L && cheb(o, t) <= 1);
  if (npc) return { label:`Talk to ${npc.name}`, run:() => talkTo(npc.flags.companion) };
  const folk = (f.folk || []).find(p => !p.gone && !p.away && cheb(p, t) <= 1);
  if (folk) return { label:`Talk to ${folk.name || 'them'}`, run:() => folkTalk(folk) };
  const st = onStairs(t);
  if (st && !onRoad()) return { label:st === 'down' ? `Go down to ${state.floors[L + 1].name}` : `Go up to ${state.floors[L - 1].name}`, run:() => { takeStairs(t); rt.trail = []; goFloor(t.floor, false); follow(t, .8); saveNow(); } };
  const ev = (f.events || []).find(e => !e.done && cheb(e, t) <= 1);
  if (ev) return { label:`Look: ${ev.label}`, run:() => showCard({ kind:'', title:ev.label, flair:ev.text }, false) };
  return null;
}

/* ---------- the road and the menu ---------- */
// Where the party can set out for from here (the valley's roads): [{ id, name, stretches, hours }]
// Every place the valley's roads reach from here, nearest first; the Mists and the castle are not for walking up to.
export function destinations(){
  const at = valley().at;
  return VALLEY_PLACES.filter(p => p.id !== at && !['mists', 'castle'].includes(p.id))
    .map(p => { const plan = planJourney(at, p.id); return plan ? { id:p.id, name:p.name, stretches:plan.stretches.length, via:plan.path.slice(1, -1).map(id => placeById(id)?.name).filter(Boolean) } : null; })
    .filter(Boolean).sort((a, b) => a.stretches - b.stretches);
}
export function setOut(to){
  if (state.combat.active || onRoad()) return false;
  travel(to);
  if (!onRoad()) return false;
  W().quiet = 0; fresh(); enterView();
  const p = placeById(to); showCard({ kind:'', title:`The road to ${p.name}`, sub:clockText(), flair:'The last house falls behind. The fog closes in, and the trees come right down to the road.' }, false);
  changed(); saveNow(); return true;
}
// Rest: in a place, the night (everyone whole again, the clock on eight hours); on the road, an hour (and a risk).
export function rest(){
  if (state.combat.active) return false;
  const list = members().filter(m => !m.flags?.gone);
  if (onRoad()){ shortRest(list); passTime(1); W().quiet = Math.max(W().quiet, 30); }
  else { for (const m of list){ m.dead = false; if (m.hp <= 0) m.hp = 1; } longRest(list); passTime(8); }
  syncTokens(); changed(); saveNow(); return true;
}
