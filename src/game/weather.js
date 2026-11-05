/* THE VALLEY'S WEATHER — ChatGPT's engine (engine/weather.js) at the table. The day's sky comes from the valley's
   seed, the day, the hour and the Count's Gaze, so the DM, the players and the TV all see the same weather. It changes
   as time passes (game/overworld.js passTime): morning fog lifts, spells of rain last days, snow lies and melts.
   The DM's own words on the desk win until the next day comes round.

   state.campaign.weather is the line (as before); state.campaign.wx is what the rest of the app reads from it:
   { kind, label, ground ('heavy snow' | 'snow' | 'frost' | 'heavy rain' | 'rain' | ''), travel, sight, obscured, desc }.
   Players are sent { kind, ground } as state.wx (net/table.js). */
import { state } from '../engine/state.js';
import { weatherFor, groundLine, describe, forecast } from '../engine/weather.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const opts = V => ({ seed:String(V.seed || 'barovia'), gaze:clamp(Math.round(state.dread || 1), 1, 10), hour:clamp(V.hour | 0, 0, 23) });

// The sky now, in the valley (null before the valley's clock has started).
export function skyNow(){
  const V = state?.campaign?.valley; if (!V) return null;
  return weatherFor(Math.max(1, V.day | 0), opts(V));
}
// The next few days at noon, for the DM's desk.
export function outlook(n = 3){
  const V = state?.campaign?.valley; if (!V) return [];
  return forecast(Math.max(1, V.day | 0) + 1, n, opts(V));
}
const pack = w => ({ kind:w.kind, label:w.label, ground:groundLine(w), travel:w.travel, sight:w.sight, obscured:w.obscured, desc:describe(w) });

/* Put the sky on the table: the weather line and its reading. newDay: a new day has come, so the DM's own words give way
   to the valley's again. force: the DM asked for the valley's weather back. → the weather, or null (the DM's words stand). */
export function applyWeather({ newDay = false, force = false } = {}){
  const C = state?.campaign; if (!C) return null;
  if (newDay || force) C.weatherHand = false;
  if (C.weatherHand) return null;
  const w = skyNow(); if (!w) return null;
  C.weather = w.line; C.wx = pack(w);
  if (C.valley) C.valley.weather = w.line;
  return w;
}
// The DM wrote their own weather on the desk: it stands (and the app reads it as words) until the next day.
export function handWeather(text){ const C = state.campaign; C.weather = text; C.weatherHand = true; C.wx = null; if (C.valley) C.valley.weather = text; }

// The weather's reading, wherever this device got it (the DM's campaign, or what the players were sent).
export const wxNow = () => state?.campaign?.wx || state?.wx || null;
// What's falling (render/ambience.js): 'snow' | 'sleet' | 'drizzle' | 'rain' | null.
export const FALLING = { drizzle:'drizzle', rain:'rain', downpour:'rain', storm:'rain', sleet:'sleet', snow:'snow', blizzard:'snow' };
// The four kinds the wagon and rest engines know: 'rain' | 'snow' | 'fog' | 'clear'.
export function fourKind(kind){
  if (['snow', 'blizzard', 'sleet', 'frost'].includes(kind)) return 'snow';
  if (['drizzle', 'rain', 'downpour', 'storm'].includes(kind)) return 'rain';
  if (['low-fog', 'mist', 'thick-fog'].includes(kind)) return 'fog';
  return 'clear';
}
