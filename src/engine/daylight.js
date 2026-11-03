/* DAYLIGHT — the valley's light by the hour, for outdoor maps. Barovia's sun is a pale thing behind the clouds:
   it rises about six, sets about seven, and never gets far up the sky; dawn and dusk come in amber and rose;
   the night is moonlit blue. Pure: render/ and main.js apply it.
   → { sun:0..1 (how high, 0 below the horizon), warm:0..1 (dawn or dusk), night:0..1, lightK (the light's strength,
       as the old day/dusk/night steps were: .72 at night, 1.25 by day), dir:{x,y,z} (where the light comes from),
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
  let amb = mix('#4e5a86', '#a8a5b4', smooth(0, .5, sun));
  amb = mix(amb, '#c98b6c', warm * .55);
  let sky = mix('#0b0d18', '#5d5f6e', smooth(0, .6, sun));
  sky = mix(sky, '#9a5a48', warm * .6);
  const fog = mix(mix('#0d0b12', '#3c3b45', smooth(0, .6, sun) * .8), '#4a3030', warm * .35);
  return { sun, warm, night, lightK:.72 + .53 * smooth(0, .55, sun) + .1 * warm, dir, amb, sky, fog, windows:smooth(.25, .95, night) };
}
export const isNight = hour => daylight(hour).night > .7;
export const hourName = h => { h = ((h % 24) + 24) % 24; return h < 5 ? 'the dead of night' : h < 7 ? 'dawn' : h < 11 ? 'morning' : h < 14 ? 'midday' : h < 17 ? 'afternoon' : h < 20 ? 'dusk' : 'night'; };
