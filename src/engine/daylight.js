/* DAYLIGHT — the valley's light by the hour, for outdoor maps. Barovia's sun is a pale thing behind the clouds:
   it rises about six, sets about seven, and never gets far up the sky; dawn and dusk come in amber and rose;
   the night is moonlit blue. Pure: render/ and main.js apply it.
   → { sun:0..1 (how high, 0 below the horizon), warm:0..1 (dawn or dusk), night:0..1, day:0..1, lightK (the light's
       strength: .86 on a moonlit night, 1.7 at noon), sunK (the sun against the fill light), fill (the sky's share:
       soft moon shadows), dir:{x,y,z} (where the light comes from),
       amb, sky, fog (colours, '#rrggbb'), windows:0..1 (how brightly windows glow) } */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (c1, c2, k) => {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), a = p(c1), b = p(c2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join('');
};
export const RISE = 6, SET = 19;

export function daylight(hour){
  const h = ((Number(hour) % 24) + 24) % 24;
  const sun = h > RISE && h < SET ? Math.sin((h - RISE) / (SET - RISE) * Math.PI) : 0;
  const warm = clamp(Math.exp(-((h - (RISE + .6)) ** 2) / 1.1) + Math.exp(-((h - (SET - .4)) ** 2) / 1.1));
  const night = 1 - smooth(0, .22, sun);
  // across the sky, east to west, low; by night the moon, high in the west
  const a = (h - RISE) / (SET - RISE) * Math.PI;
  const dir = sun > 0 ? { x:-Math.cos(a) * 30, y:12 + sun * 30, z:10 } : { x:-20, y:40, z:14 };
  // (an overcast day is still a day: pale grey light, a pale sky, and a distance that fades into pale mist)
  const day = smooth(0, .55, sun);
  let amb = mix('#5d6eae', '#c6c7d2', smooth(0, .5, sun));   // (a moonlit blue by night)
  amb = mix(amb, '#c98b6c', warm * .55);
  let sky = mix('#0b0d18', '#8e93a1', smooth(0, .6, sun));
  sky = mix(sky, '#a8644e', warm * .6);
  const fog = mix(mix('#0d0b12', '#7c818d', smooth(0, .6, sun) * .9), '#5a3a36', warm * .35);
  // sunK: how much stronger the sun is than the fill light (form and shadow by day; a soft moon by night)
  // fill: how much of the light comes from the whole sky (moonlight is soft: its shadows are never black)
  return { sun, warm, night, day, lightK:.86 + .86 * day + .22 * warm, sunK:1 + .9 * day + .5 * warm, fill:1 + .7 * night, dir, amb, sky, fog, windows:smooth(.25, .95, night) };
}
export const isNight = hour => daylight(hour).night > .7;
export const hourName = h => { h = ((h % 24) + 24) % 24; return h < 5 ? 'the dead of night' : h < 7 ? 'dawn' : h < 11 ? 'morning' : h < 14 ? 'midday' : h < 17 ? 'afternoon' : h < 20 ? 'dusk' : 'night'; };
