/* 🍂 SIDE TRAILS — ChatGPT's engine/road-exploration.js at the table. A road the party travels may fork: halfway
   along it a narrow track leaves the road (a road event, DM only until found). When they reach it, the DM takes the
   trail: the fork's choices come up (unknown tracks show only their sign), the chosen one becomes its own map (the
   main road waits on the shelf), and when the party reaches the far end the leg is walked: the clock moves, the place
   is known, and the next choice comes up. Some trails come out on another road's place: once walked, that is a
   shortcut the party knows. The book (which forks are found, which legs walked) lives on the valley, DM-side. */
import { state, ui, log } from '../engine/state.js';
import { newRoadExploration, discoverTrailhead, trailOptions, completeTrailLeg, trailLegSpecs, trailsForPlayers } from '../engine/road-exploration.js';
import { placeById } from '../engine/overland.js';
import { TRAIL_SITES } from '../data/road-exploration.js';
import { goToMap, mapStatus } from './maps.js';
import { passTime, clockText, valley, bloomLoose } from './overworld.js';
import { changed } from './session.js';
import { showCard, toast } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';

export const trailBook = () => { const V = valley(); return (V.roadExploration ||= newRoadExploration(String(V.seed))); };
export const trailPlaceName = id => nodeName(id);
const nodeName = id => placeById(id)?.name || trailsForPlayers(trailBook()).places.find(p => p.id === id)?.name || 'the fork';
const siteBlurb = name => TRAIL_SITES.find(s => s.name === name)?.blurb || '';

// The party has reached the fork on this road: it's found, and the choices come up.
export function followTrailhead(L, eventId){
  const e = state.floors[L]?.events?.find(x => x.id === eventId); if (!e?.trailhead) return;
  const V = valley(); V.roadExploration = discoverTrailhead(trailBook(), e.trailhead);
  e.done = true;
  V.trail = { at:`trail:${e.trailhead}:junction`, road:state.meta.key || null, roadMap:state.meta.mapId || null, back:{ floor:L, x:e.x, y:e.y } };
  log(`🍂 A side trail off the road: ${nodeName(V.trail.at)}.`);
  changed(); renderPanel();
}
// What they can take from where they stand on the trails: [{ id, sign } | { id, to, name, hours }]
export function trailChoices(){ const V = valley(); return V.trail?.at ? trailOptions(trailBook(), V.trail.at, V.visited || []) : []; }

// Take one: the leg becomes its own map (a stretch or two of side road), the party at its start.
export function takeTrail(edgeId){
  const V = valley(), from = V.trail?.at; if (!from) return;
  const n = (V.trailWalks = (V.trailWalks || 0) + 1), book = trailBook();
  const leg = trailLegSpecs(book, { from, edgeId, n, gaze:state.dread || 1, bloom:bloomLoose() });
  if (!leg){ toast('That way is not open from here.'); return; }
  V.trail = { ...V.trail, leg:{ from, edgeId, to:leg.to, hours:leg.hours, end:leg.end } };
  goToMap({ meta:{ name:'The side road', seed:`${V.seed}|trail|${edgeId}|${n}`, floors:leg.specs.length, size:40, template:'trail', trail:{ book:JSON.parse(JSON.stringify(book)), from, edgeId, n, gaze:state.dread || 1, bloom:bloomLoose() } },
    key:`trail:${edgeId}:${n}`, kind:'road', at:{ floor:0, x:leg.start.x, y:leg.start.y } });
  ui.floor = 0;
  log(`🍂 The party takes the side road.`);
  changed(); renderPanel();
}

// They are at the far end: the leg is walked, the hours pass, and the place is theirs to know.
export function endTrailLeg(){
  const V = valley(), leg = V.trail?.leg; if (!leg) return;
  const r = completeTrailLeg(trailBook(), { from:leg.from, edgeId:leg.edgeId });
  V.roadExploration = r.book; passTime(leg.hours || 0);
  const base = placeById(r.at);
  if (base){   // out on one of the valley's own places: the trail is done, the journey with it
    V.at = base.id; if (!V.visited.includes(base.id)) V.visited.push(base.id); V.journey = null; V.trail = null; ui.valleySel = base.id;
    showCard({ kind:'', title:base.name, sub:clockText(), flair:base.blurb, lines:['They come out of the side road. The way is known now.'] });
    log(`🍂 The side road comes out at ${base.name} (${clockText()}).`);
  } else {
    V.trail = { ...V.trail, at:r.at, leg:null };
    const name = nodeName(r.at);
    showCard({ kind:'', title:name, sub:clockText(), flair:siteBlurb(name), lines:['The trail goes on from here, or back.'] });
    log(`🍂 The party reaches ${name} (${clockText()}).`);
  }
  changed(); renderPanel();
}

// Back to the main road where they left it (the shelved map), the trail behind them.
export function backToRoad(){
  const V = valley(), t = V.trail; if (!t) return;
  V.trail = null;
  if (t.road && mapStatus(t.road)) goToMap({ key:t.road, kind:'road', at:t.back });
  log('🍂 Back to the road.'); changed(); renderPanel();
}
