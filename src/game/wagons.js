/* 🛞 THE WAGON ON THE ROAD — a wagon the party built (🔨 Workshop) taken on a journey (engine/wagons.js, ChatGPT's):
   the road's time at its speed (the road, the weather, the load, the damage), what its fittings do when trouble comes
   (salt against the Bloom, a spare wheel, a lockbox, a hidden compartment, ward-runes against the Mists), who gets a
   bunk at camp, and the smithy box's repairs. The DM picks the wagon when the party sets out (Valley tab). */
import { state, log } from '../engine/state.js';
import { legSpeed, meetEvent, nightOnTheRoad, repairDay, describeWagon } from '../engine/wagons.js';
import { migrateSheet, load } from '../engine/inventory.js';
import { heroStats } from '../engine/hero.js';
import { mulberry32, hashSeed } from '../util/core.js';
import { showCard } from '../ui/hud.js';
import { changed } from './session.js';
import { transport } from './workshop.js';

export { describeWagon };
export const EVENT_KINDS = { bloom:'🥀 The Bloom', mists:'🌫 The Mists', ambush:'⚔ An ambush', theft:'🌙 A theft in the night', breakdown:'🔧 A breakdown', search:'🔎 A search by his men', storm:'⛈ A storm' };
let tick = 1;
const rng = () => mulberry32(hashSeed(`${state.meta.seed}|wagon|${Date.now()}|${tick++}`));
const V = () => state.campaign?.valley;

export const wagonOut = () => { const id = V()?.wagon; return id ? transport().find(w => w.id === id) || null : null; };
export function setWagon(id){ const v = V(); if (v){ v.wagon = id || null; changed(); } }

// The valley's weather is words: read it as the engine's four kinds.
export function weatherKind(text){
  const t = String(text || '').toLowerCase();
  return /snow|sleet|frost/.test(t) ? 'snow' : /rain|drizzle|thunder/.test(t) ? 'rain' : /fog|mist/.test(t) ? 'fog' : 'clear';
}
const ROAD_OF = { road:'road', path:'track', trail:'wild' };
// What the party carries: every hero's pack (lb).
export function cargo(){
  let lb = 0;
  for (const t of state.tokens.filter(x => x.kind === 'pc' && x.charId && state.characters?.[x.charId] && !x.dead)){
    const h = migrateSheet(state.characters[t.charId]); lb += load(h, heroStats(h).sc.Str).weight || 0;
  }
  return Math.round(lb);
}
/* The road's hours with the wagon: each stretch's walking hours (3 miles an hour) become miles, at the wagon's speed.
   stretches: [{ way:'road'|'path'|'trail', walk:hours }] → { hours, why:[…] } (null: no wagon) */
export function wagonHours(stretches, weather){
  const w = wagonOut(); if (!w) return null;
  let hours = 0; const why = new Set();
  for (const st of stretches){
    const r = legSpeed(w, { miles:st.walk * 3, road:ROAD_OF[st.way] || 'road', weather:weatherKind(weather), night:false }, { cargo:cargo() });
    if (!r.milesPerDay) return { hours:Infinity, why:r.why };
    hours += r.hours; r.why.forEach(x => why.add(x));
  }
  return { hours:Math.round(hours * 2) / 2, why:[...why] };
}

// Trouble on the road, met with the wagon's fittings: damage, a delay to the journey, something lost or found.
export function wagonMeets(kind){
  const w = wagonOut(), v = V(); if (!w || !v) return null;
  const { effects:fx, lines } = meetEvent(w, { kind }, { gaze:state.dread || 1 }, rng());
  if (fx.damage){ w.damage = Math.min(w.hp, (w.damage || 0) + fx.damage); if (w.damage >= w.hp) lines.push(`${w.n} is wrecked: it goes no further until it's mended.`); }
  if (fx.delayHours && v.journey) v.journey.hours = (v.journey.hours || 0) + fx.delayHours;
  if (fx.checkMod) lines.push(`(Their rolls against the wagon: ${fx.checkMod}.)`);
  log(`🛞 ${EVENT_KINDS[kind] || kind}: ${lines[0]}`, true);
  showCard({ kind:'', cat:'world', title:`🛞 ${w.n}: ${(EVENT_KINDS[kind] || kind).replace(/^\S+ /, '')}`, lines });
  changed();
  return fx;
}
// A night at camp with the wagon: who sleeps in a bunk, and the smithy box at work. → lines for the camp card
export function wagonNight(){
  const w = wagonOut(); if (!w) return [];
  const sleepers = state.tokens.filter(t => t.kind === 'pc' && !t.dead && !t.flags?.gone).length;
  const night = nightOnTheRoad(w, { sleepers }), out = [`🛞 ${night.why}`];
  if (w.damage){ const r = repairDay(w, rng()); const mended = (w.damage || 0) - r.damage; w.damage = r.damage; if (mended) out.push(`🛞 ${mended} HP of the wagon mended by morning.`); }
  return out;
}
