/* THE VALLEY — travelling Barovia. Where the party is on the valley map, journeys along its roads (each one
   built as a chain of road maps by engine/overland.js), the road's happenings, arriving, and entering a
   place's own map. Kept in state.campaign.valley, so it travels with the campaign from delve to delve. */
import { state, ui, makeMonster, log } from '../engine/state.js';
import { freeTilesNear } from '../engine/grid.js';
import { walk } from '../engine/tiles.js';
import { planJourney, placeById, rollEvents } from '../engine/overland.js';
import { VALLEY_ROADS, WAY_HOURS, WEATHER, timeOfDay } from '../data/barovia-map.js';
import { wagonHours, wagonOut, wagonNight } from './wagons.js';
import { sleep, sleepers } from './rest.js';
import { NIGHT } from '../data/campaign.js';
import { TEMPLATES } from '../data/themes.js';
import { BEST } from '../data/bestiary.js';
import { plantAmbushes, courtDay, springNemesis, markHaunts } from './court.js';
import { rollDice, pick, uid } from '../util/core.js';
import { syncTokens } from '../render/minis.js';
import { buildFloor } from '../render/floors.js';
import { focusTile } from '../render/scene.js';
import { toast, showCard } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { addToInit, riseFrom } from './combat.js';
import { newDelve } from './build.js';
import { goFloor } from './actions.js';
import { changed } from './session.js';
import { longRest } from './resources.js';
import { applyWeather } from './weather.js';

export function valley(){
  const C = state.campaign;
  const V = C.valley ||= { at:'mists', visited:['mists'], journey:null, journeys:0, seed:uid() };
  V.day ??= 1; V.hour ??= 19;   // Session 0 ends at dusk, at the Mist Wall
  return V;
}
export const bloomLoose = () => (state.campaign.session || 0) >= 3 || (state.campaign.clocks?.bloom || 0) > 1;

// Set out: builds the road from here to there (keeps the party, the campaign and their characters).
export function travel(to){
  const V = valley(), dest = placeById(to), plan = planJourney(V.at, to);
  if (!dest || !plan){ toast('No road goes there from here.'); return; }
  V.journeys++;
  // the valley's weather (game/weather.js), or the DM's own words on the desk; the old roll only if neither
  if (!applyWeather() && !state.campaign.weatherHand){ V.weather = pick(WEATHER); state.campaign.weather = V.weather; }
  V.weather = state.campaign.weather;
  // on foot, or at the wagon's pace (game/wagons.js): the road, the weather, the load
  const legs = plan.stretches.map(st => { const way = VALLEY_ROADS.find(r => r.id === st.road).way; return { way, walk:WAY_HOURS[way] || 2 }; });
  const byWagon = wagonHours(legs, V.weather);
  if (byWagon && !Number.isFinite(byWagon.hours)){ toast(`${wagonOut().n} can't move: ${byWagon.why.join(' ')}`); return; }
  const pace = state.campaign.wx?.travel || 1;   // on foot, the day's mud, snow or fog slows them (the wagon has its own reckoning)
  const hours = byWagon ? byWagon.hours : Math.round(legs.reduce((h, l) => h + l.walk, 0) / pace);
  V.journey = { from:V.at, to, path:plan.path, hours, left:{ day:V.day, hour:V.hour } };
  const journey = { from:V.at, to, seed:V.seed, n:V.journeys, gaze:state.dread, bloom:bloomLoose(), trailSeed:V.seed };   // trailSeed: the road may fork (game/trails.js)
  V.trail = null;
  newDelve({ name:`The road to ${dest.name}`, seed:`${V.seed}|road|${V.journeys}`, floors:plan.stretches.length, size:40, template:'journey', journey }, true, { kind:'road', key:`road:${V.journeys}` });
  if (plantAmbushes(plan.path).length) state.floors.forEach((_, L) => buildFloor(L));   // the Count's court waits on the road
  ui.tab = 'valley';
  log(`🧭 The party sets out for ${dest.name} (${plan.path.map(id => placeById(id).name).join(' → ')}).`);
  toast(`${plan.stretches.length} stretch${plan.stretches.length === 1 ? '' : 'es'} of road to ${dest.name}.`);
  changed();
}

// They are there: the map marks it, and the DM gets the place's read-aloud.
export function arrive(){
  const V = valley(); if (!V.journey) return;
  const p = placeById(V.journey.to);
  passTime(V.journey.hours || 0);
  V.at = p.id; if (!V.visited.includes(p.id)) V.visited.push(p.id); V.journey = null;
  ui.valleySel = p.id;
  showCard({ kind:'', title:p.name, sub:clockText(), flair:p.blurb, lines:V.hour >= 21 || V.hour < 5 ? ['<span class="muted">They arrive after dark. Doors stay shut; something is always awake.</span>'] : [] });
  log(`🧭 The party reaches ${p.name} (${clockText()}).`);
  changed(); renderPanel();
}

// Build the place's own map (the Narrow House and the village, Old Bonegrinder, the Iron Coffin, Vallaki…).
export function enterPlace(id, mapId, fresh = false){
  const p = placeById(id); if (!p) return;
  const which = mapId || p.map, seed = `${valley().seed}|${p.id}|${which}`;
  // a place the party has been to before comes back off the shelf as they left it (Maps tab), unless fresh
  const opts = { kind:'place', key:`place:${p.id}:${which}`, fresh };
  if (which === 'landmark'){ newDelve({ name:p.name, seed, floors:1, size:40, template:'landmark', place:p.id }, true, opts); }
  else { const tpl = TEMPLATES.find(t => t.id === which); if (!tpl) return; newDelve({ name:p.name, seed, floors:tpl.floors.length, size:40, template:tpl.id }, true, opts); }
  markHaunts(p.id);   // whoever of the Count's court haunts the place has its mark on the map
  ui.tab = 'valley'; log(`🧭 ${p.name} is on the table.`); changed();
}
// The maps a place offers: [{ id, name }]
export const placeMaps = p => (p.maps || (p.map ? [p.map] : [])).map(id => ({ id, name:id === 'landmark' ? p.name : TEMPLATES.find(t => t.id === id)?.name || id }));

/* ---------- the clock ---------- */
export const hourHooks = [];   // run after the valley clock moves (ui/ledger.js: supply runs arrive)
export function passTime(h){ const V = valley(), d0 = V.day; V.hour += h; while (V.hour >= 24){ V.hour -= 24; V.day++; } state.campaign.day = `Day ${V.day}, ${timeOfDay(V.hour)}`;
  if (V.day > d0) courtDay(`Day ${V.day}`);   // a new day: the Count's court moves
  applyWeather({ newDay:V.day > d0 }); for (const f of hourHooks) try { f(); } catch (e){ console.warn(e); } }      // and the sky with the hours (game/weather.js)
// The DM sets the hour (dawn, midday, dusk, midnight, or an hour on): always forward, so a new day comes round
// properly (and the Count's court moves with it). The sky, the light, the windows and the folk follow (engine/daylight.js).
export function setHour(to){
  const V = valley(); if (!V) return;
  const step = to === '+1' ? 1 : ((+to - V.hour) % 24 + 24) % 24;
  if (!step) return;
  passTime(step); log(`🕯 ${clockText()}.`); changed();
}
export const clockText = () => { const V = valley(); return `Day ${V.day} · ${timeOfDay(V.hour)}`; };
// Make camp on the road: the night passes, an omen, and maybe something comes to the fire.
export function makeCamp(L = ui.floor){
  // the night itself (game/rest.js): a camp, with the party taking turns on watch; a wagon's bunks make it the road
  const night = sleep(wagonOut()?.bunks ? 'road' : 'camp', sleepers().map(t => t.id), { quiet:true });
  const omen = pick(NIGHT.omen);
  showCard({ kind:'', title:'The night on the road', sub:clockText(), flair:omen, lines:[...night.card, 'If the Gaze is 3 or more, something comes to the fire (added to this stretch).', ...wagonNight()] }, false);
  log(`🧭 They make camp. ${clockText()}.`);
  if (state.dread >= 3) newRoadEvent(L);
  changed(); renderPanel();
}

/* ---------- what happens on the road ---------- */
const eventOn = (L, id) => state.floors[L]?.events?.find(e => e.id === id);
export function readEvent(L, id){ const e = eventOn(L, id); if (e) showCard({ kind:'', title:e.label, flair:e.text }); }
export function springEvent(L, id){
  const e = eventOn(L, id);
  if (e?.nem){ springNemesis(L, e); e.sprung = true; buildFloor(L); changed(); return; }   // one of the Count's court
  if (!e?.enc) return;
  const placed = [];
  for (const [bid, cnt] of e.enc){
    if (!BEST[bid]) continue;
    const n = typeof cnt === 'number' ? cnt : rollDice(cnt).total;
    for (const s of freeTilesNear(L, e.x, e.y, n, true)){ const m = makeMonster(bid, L, s.x, s.y); state.tokens.push(m); placed.push(m); if (state.combat.active && state.combat.floor === L) addToInit(m); }
  }
  syncTokens(); placed.forEach(riseFrom);
  e.sprung = true; buildFloor(L);
  log(`${e.label}: ${placed.length} on the road.`, true); toast(`${e.label} — ${placed.length} on the map`);
  changed();
}
export function doneEvent(L, id){ const e = eventOn(L, id); if (!e) return; e.done = !e.done; buildFloor(L); changed(); }
// Something new on the road, somewhere on this stretch the party has not reached yet.
export function newRoadEvent(L = ui.floor){
  const f = state.floors[L]; if (!f) return;
  const [ev] = rollEvents(Math.random, { gaze:state.dread, bloom:bloomLoose() }, 1); if (!ev) return;
  const party = state.tokens.filter(t => t.floor === L && t.kind !== 'monster' && !t.dead);
  const spots = []; for (let i = 0; i < f.grid.length; i++) if (walk(f.grid[i])){ const x = i % f.W, y = (i / f.W) | 0; if (!party.some(t => Math.abs(t.x - x) + Math.abs(t.y - y) < 6)) spots.push({ x, y }); }
  const at = pick(spots.length ? spots : [{ x:f.rooms[0].cx, y:f.rooms[0].cy }]);
  (f.events ||= []).push({ id:f.nextObj++, label:ev.label, text:ev.text, enc:ev.enc || null, x:at.x, y:at.y, done:false });
  buildFloor(L);
  log(`🧭 Something on the road: ${ev.label}.`, true); toast(`On the road: ${ev.label}`);
  changed(); renderPanel();
}
export const onJourney = () => !!state?.campaign?.valley?.journey && state.meta.template === 'journey';
export function goToEvent(L, id){ const e = eventOn(L, id); if (e){ goFloor(L, false); focusTile(L, e.x, e.y); } }
