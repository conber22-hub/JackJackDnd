/* 🚪 THE WAYS BETWEEN PLACES (the Wanderer): walking from map to map, the way the old pocket-console adventures did.
     · a place's ways out: every road that leaves it has its way out at the side of the map the road goes (a rune and a
       column of light, render/floors.js, and a signpost beside it to read). Step onto it and the road begins.
     · the road: walk off the end of a stretch and the next begins at the far edge, level with it; walk back off its
       start and the last stretch is there again; back off the first and the party is home where they left.
     · arriving: in at the way that road comes by, a step or two in, the companions behind.
     · buildings: walk into a front door from its doorstep and the party is inside (engine/interiors.js); walk out of
       the doorway inside and they are back on the doorstep.
     · each crossing: the screen fogs over and clears (ui/passage.js), the name of where they are slides in, a sound.
   Pure decisions in engine/ways.js; this does them with the app's own actions. */
import { state } from '../engine/state.js';
import { placeWays, inFrom, frontDoor, doorWalkedInto, outOfDoorway, offTheEdge, signLines } from '../engine/ways.js';
import { arrivalSpots, isTraveller } from '../engine/maps.js';
import { walk } from '../engine/tiles.js';
import { VALLEY_ROADS } from '../data/barovia-map.js';
import { PROP_BLOCK } from '../data/props.js';
import { placeById, planJourney } from '../engine/overland.js';
import { interiorPlan, interiorGround } from '../engine/generator.js';
import { buildFloor } from '../render/floors.js';
import { syncTokens } from '../render/minis.js';
import { goToMap } from './maps.js';
import { goInside } from './interiors.js';
import { valley, arrive, enterPlace, clockText } from './overworld.js';
import { takeStairs, onStairs, goFloor } from './actions.js';
import { changed } from './session.js';
import { showCard } from '../ui/hud.js';
import { W, hero, members, rt, follow, saveNow, enterView, placeCompanions, setOut, freshRun, questEvent } from './wander.js';

// What the screen does at a crossing (ui/passage.js sets these): veil(run) fogs over, runs, clears; banner({ title,
// sub, line }) slides the name in; sting(id) plays a sound.
export const passage = { veil:null, banner:null, sting:null };
let crossing = false;
export const crossingNow = () => crossing;
function cross(run, sound = 'stairs'){
  if (crossing) return true;
  crossing = true; passage.sting?.(sound);
  const go = () => { let b = null; try { b = run(); } catch (e){ console.warn(e); } crossing = false; rt.tapTo = null; rt.walkN++; if (b) passage.banner?.(b); };
  if (passage.veil) passage.veil(go); else go();
  return true;
}

const NOT_WALKED = ['mists', 'castle'];   // (the Mists turn travellers back; the castle is not walked up to)
export const onRoad = () => state.meta.template === 'journey';
export const indoors = () => state.meta.template === 'interior';
const placeHere = () => !onRoad() && !indoors() && /^place:/.test(state.meta.key || '') ? state.meta.key.split(':')[1] : null;
const placeName = id => placeById(id)?.name || id;
const night = () => { const h = valley().hour; return h >= 20 || h < 6; };
// The name slid in at a crossing
export function bannerHere(line = ''){
  const t = hero(), f = t && state.floors[t.floor], V = valley();
  const title = onRoad() ? f?.name : indoors() ? state.meta.name : placeName(V.at);
  const sub = [clockText(), state.campaign.weather?.n || state.campaign.weather?.name || ''].filter(x => typeof x === 'string' && x).join(' · ');
  return { title, sub, line };
}

/* ---------- a place's ways out ---------- */
// The roads out of the place the party is in (each to the next place along it): [{ to, dx, dy }]
function roadsOut(id){
  const here = placeById(id); if (!here) return [];
  return VALLEY_ROADS.filter(r => r.a === id || r.b === id).map(r => r.a === id ? r.b : r.a)
    .filter((n, k, a) => !NOT_WALKED.includes(n) && a.indexOf(n) === k)
    .map(n => { const p = placeById(n); return p && { to:n, dx:p.x - here.x, dy:p.y - here.y }; }).filter(Boolean);
}
// Mark the place's ways out on its ground floor, with signposts, once (they stay with the map on the shelf).
export function ensureWays(){
  const id = placeHere(); if (!id || id !== valley().at) return;
  const f = state.floors[0]; if (!f || f.ways) return;
  const blocks = new Set((f.props || []).filter(p => PROP_BLOCK.has(p.k) && !p.fallen && !p.broken).map(p => p.y * f.W + p.x));
  const ways = placeWays(f, roadsOut(id), (x, y) => blocks.has(y * f.W + x));
  f.ways = ways.map(w => ({ to:w.to, x:w.x, y:w.y, dir:w.dir }));
  const taken = (x, y) => f.props.some(p => p.x === x && p.y === y) || ways.some(o => o.x === x && o.y === y) || f.doors?.some(d => d.i === y * f.W + x);
  for (const w of ways){ const at = (w.signs || []).find(p => !taken(p.x, p.y)); if (at) f.props.push({ id:f.nextObj++, k:'signpost', x:at.x, y:at.y, rot:0, way:w.to }); }
  try { buildFloor(0); } catch (e){ console.warn(e); }
}
// The way out the hero stands on (or null)
const wayAt = (t, f = state.floors[t.floor]) => t.floor === 0 && (f?.ways || []).find(w => w.x === t.x && w.y === t.y) || null;

// A signpost: what it says (the ways out of here, with how far)
export function signpostNear(t){
  const f = state.floors[t.floor];
  const sp = (f.props || []).find(p => p.k === 'signpost' && Math.max(Math.abs(p.x - t.x), Math.abs(p.y - t.y)) <= 1); if (!sp) return null;
  const id = placeHere(), ways = id ? (f.ways || []) : [];
  if (!ways.length) return { title:'A signpost', lines:['The words have been scraped off. Someone has cut a crescent into the wood instead.'] };
  return { title:`${placeName(id)}: the roads out`, lines:signLines(ways.map(w => { const p = planJourney(id, w.to); return { to:placeName(w.to), dir:w.dir, far:p ? `${p.stretches.length} stretch${p.stretches.length === 1 ? '' : 'es'} of road` : '' }; })) };
}
export function readSignpost(t = hero()){ const s = t && signpostNear(t); if (s) showCard({ kind:'', title:s.title, lines:s.lines }, false); return !!s; }

/* ---------- arriving somewhere by a road ---------- */
// Put the party in at the way that road comes by (from: the place they came from), a step or two in.
function inAtWay(from){
  ensureWays();
  const f = state.floors[0], w = (f?.ways || []).find(o => o.to === from); if (!w) return false;
  const party = members().filter(m => !m.dead && !m.flags?.gone), t = party[0]; if (!t) return false;
  const at = inFrom(f, w), occ = (x, y) => state.tokens.some(o => !party.includes(o) && !o.dead && o.floor === 0 && o.x === x && o.y === y);
  const spots = arrivalSpots(f, { floor:0, ...at }, party.length, occ);
  party.forEach((m, k) => { const p = spots[k]; if (p){ m.floor = 0; m.x = p.x; m.y = p.y; } });
  syncTokens(); follow(t, .8); return true;
}

/* ---------- the road ---------- */
// The last stretch's end: there (the place's map, in at the way the road comes by).
export function arriveThere(){
  const V = valley(), j = V.journey; if (!j?.to) return false;
  const came = j.path?.length > 1 ? j.path[j.path.length - 2] : j.from, to = j.to, first = !V.visited.includes(to);
  return cross(() => {
    arrive({ quiet:true }); enterPlace(to); W().quiet = 0; freshRun();
    placeCompanions(); enterView(); inAtWay(came); questEvent({ k:'arrive', place:to }); changed(); saveNow();
    return bannerHere(first ? placeById(to)?.blurb || '' : '');
  });
}
// Off the end of a stretch: the next one, in at its far edge
function goOn(t){
  const f = state.floors[t.floor]; if (!f.down || !state.floors[t.floor + 1]) return false;
  return cross(() => {
    t.x = f.down.x; t.y = f.down.y; takeStairs(t); W().quiet = 0; rt.trail = [];
    goFloor(t.floor, false); follow(t, .8); saveNow();
    return bannerHere();
  });
}
// Back off the start of a stretch: the last one (or, from the first, home again)
function goBack(t){
  const f = state.floors[t.floor];
  if (t.floor > 0) return cross(() => {
    t.x = f.up.x; t.y = f.up.y; takeStairs(t); rt.trail = [];
    goFloor(t.floor, false); follow(t, .8); saveNow();
    return bannerHere();
  });
  const V = valley(), j = V.journey; if (!j) return false;
  const toward = j.path?.[1] || j.to;
  return cross(() => {
    V.journey = null;
    enterPlace(V.at); W().quiet = 0; freshRun();
    placeCompanions(); enterView(); inAtWay(toward); changed(); saveNow();
    return bannerHere('They turn back.');
  });
}

/* ---------- after a step, and a step that didn't go ---------- */
/* After the hero has stepped (dx, dy; or null for a tap's walk): off the end of the road, back off its start, or out
   of a place by one of its ways. → true if a crossing began */
export function wayAfterStep(t, step){
  if (state.combat.active || crossing) return false;
  const f = state.floors[t.floor], [dx = 0] = step || [];
  // (a tap counts only on the very square tapped, on this map: never a square the party was simply put down on)
  const tapped = !step && rt.tapTo && rt.tapTo.map === state.meta.mapId && rt.tapTo.x === t.x && rt.tapTo.y === t.y;
  if (!step && !tapped) return false;
  if (onRoad()){
    const last = !state.floors[t.floor + 1];
    if (!last && (step ? offTheEdge(f, t, f.down, dx) : onStairs(t) === 'down')) return goOn(t);
    if (f.up && (step ? offTheEdge(f, t, f.up, dx) : t.x === f.up.x && t.y === f.up.y)) return goBack(t);
    return false;
  }
  const w = wayAt(t); if (w) return cross(() => { setOut(w.to, { quiet:true }); return bannerHere(night() ? 'The road is dark between the trees.' : 'The last house falls behind; the trees close in.'); });
  return false;
}
/* A step that didn't go (dx, dy): into a front door, out of a doorway, or on off the edge where the map ends.
   → true if a crossing began */
export function wayOnBump(t, dx, dy){
  if (state.combat.active || crossing) return false;
  const L = t.floor, f = state.floors[L];
  if (onRoad()){
    if (!state.floors[L + 1] && f.down) return false;
    if (f.down && state.floors[L + 1] && offTheEdge(f, t, f.down, dx)) return goOn(t);
    if (f.up && offTheEdge(f, t, f.up, dx)) return goBack(t);
    return false;
  }
  if (indoors()) return leaveBuilding(t, dx, dy);
  if (wayAt(t)) return wayAfterStep(t, [dx, dy]);   // (on a way out, at the edge: any push on goes)
  const i = doorWalkedInto(f.buildings, t.x, t.y, dx, dy);
  if (i >= 0) return enterBuilding(L, i);
  return false;
}

/* ---------- buildings ---------- */
function enterBuilding(L, i){
  const b = state.floors[L].buildings[i];
  if (b.decay === 'abandoned' || b.decay === 'infested'){ showCard({ kind:'', title:b.name || 'The house', flair:'The door is nailed shut. Through the cracks, the dark smells of old smoke.' }, false); return true; }
  return cross(() => {
    goInside(L, i); freshRun(); enterView(); follow(hero(), .6);
    changed(); saveNow();
    return { ...bannerHere(), title:b.name || state.meta.name };
  }, 'door');
}
// Where the doorway out of this inside is, and which way is out
function doorwayOut(){
  const it = state.meta.interior; if (!it) return null;
  const plan = interiorPlan(it), g = interiorGround(it), out = plan.floors[g]?.out || plan.floors[g]?.front; if (!out) return null;
  return { floor:g, x:out[0], y:out[1] };
}
// On the doorway inside (Ⓐ: go out): → the label, or null
export function doorwayHere(t){ const d = indoors() && doorwayOut(); return d && t.floor === d.floor && t.x === d.x && t.y === d.y ? `Go outside` : null; }
export function goOutside(t){ const d = doorwayOut(); const way = d && outOfDoorway(state.floors[d.floor], d); return way ? leaveBuilding(t, way[0], way[1]) : false; }
function leaveBuilding(t, dx, dy){
  const d = doorwayOut(); if (!d || t.floor !== d.floor || t.x !== d.x || t.y !== d.y) return false;
  const f = state.floors[t.floor], way = outOfDoorway(f, d); if (!way || way[0] !== dx || way[1] !== dy) return false;
  const [, mapId, L, i] = String(state.meta.key || '').split(':');   // inside:<mapId>:<floor>:<building>
  return cross(() => {
    const lib = state.campaign.maps || {}, e = lib[mapId], b = e?.floors?.[+L]?.buildings?.[+i];
    const step = b ? frontDoor(b).steps[0] : null;
    goToMap({ id:mapId, at:step ? { floor:+L, x:step.x, y:step.y } : null });
    freshRun(); enterView(); changed(); saveNow();
    return bannerHere();
  }, 'door');
}

/* ---------- the menu's Travel: the roads out of here, and anywhere already walked to ---------- */
export const roadsOutOf = id => roadsOut(id).map(r => r.to);
// A tapped square: is it a door (go to its step and in) or a way out? (the touch way) → { x, y, then } | null
export function tapTarget(x, y){
  const t = hero(); if (!t || onRoad()) return null;
  const f = state.floors[t.floor];
  const i = (f.buildings || []).findIndex(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
  if (i >= 0 && !indoors()){ const d = frontDoor(f.buildings[i]), s = d.steps.find(p => walk(f.grid[p.y * f.W + p.x])); if (s) return { x:s.x, y:s.y, then:() => enterBuilding(t.floor, i) }; }
  return null;
}
export const crossingIdle = () => !crossing;
export { isTraveller };
