/* AMBIENCE — the light of candles and fires, and the weather on outdoor maps.
   Prop lights: a small fixed pool of point lights (two on Low quality, six on Medium, ten on High) that follows the lit props nearest the
   camera on the floor in view — candelabras, braziers, hearths, lanterns, campfires — and flickers. A fixed
   count keeps the shaders from recompiling as you move about.
   Weather: rain or snow (from the day's weather on the Dark Lord desk) falling around the camera on outdoor maps
   (the snow blows on the wind: render/living.js). */
import * as THREE from 'three';
import { state, ui, viewAsPlayer } from '../engine/state.js';
import { LIT, propSize } from '../data/props.js';
import { THEMES } from '../data/themes.js';
import { controls, scene, wx, wz } from './scene.js';
import { floorViews } from './floors.js';
import { gfx } from './gfx.js';
import { wxNow, FALLING } from '../game/weather.js';
import { updateSnowfall } from './living.js';

/* ---------- prop lights ---------- */
const pool = [];
const POOL = { low:2, medium:6, high:10 };   // (phones get the two nearest fires: a hearth-lit taproom, not a flat one)
let lastPick = 0;
function ensurePool(){
  const n = POOL[gfx.quality] ?? 4;
  while (pool.length < n){ const l = new THREE.PointLight('#ffb060', 0, 8.5, 1.4); l.userData = { base:0, ph:Math.random() * 10 }; pool.push(l); scene.add(l); }
  while (pool.length > n){ const l = pool.pop(); l.parent?.remove(l); l.dispose?.(); }
}
const FIRE_COL = { brazier:'#ff8a3a', hearth:'#ff7a2a', campfire:'#ff7a2a', anvil:'#ff6a2a', cauldron:'#ff8a3a' };
function pickLights(){
  const L = ui.floor, f = state.floors[L], fv = floorViews[L]; if (!f || !fv) return;
  const pv = viewAsPlayer(), exp = state.explored[L], tgt = controls.target;
  const lit = (f.props || []).filter(p => LIT[p.k] && (!pv || exp?.has(p.y * f.W + p.x)))
    .map(p => { const s = propSize(p), x = wx(p.x + (s.w - 1) / 2), z = wz(p.y + (s.h - 1) / 2); return { p, x, z, d:(x - tgt.x) ** 2 + (z - tgt.z) ** 2 }; })
    .sort((a, b) => a.d - b.d);
  pool.forEach((l, i) => {
    const c = lit[i];
    if (!c){ l.userData.base = 0; l.intensity = 0; return; }
    if (l.parent !== fv.group) fv.group.add(l);
    l.position.set(c.x, c.p.k === 'hearth' || c.p.k === 'campfire' ? .6 : 1.2, c.z);
    l.color.set(FIRE_COL[c.p.k] || '#ffb060'); l.userData.base = 2.4 * LIT[c.p.k];
  });
}

/* ---------- weather ---------- */
let rain = null;
const N = { low:350, medium:900, high:1600 };
function makeRain(n){
  const pos = new Float32Array(n * 6);
  for (let i = 0; i < n; i++){ const x = (Math.random() - .5) * 34, y = Math.random() * 14, z = (Math.random() - .5) * 34; pos.set([x, y, z, x + .05, y - .45, z], i * 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color:'#9fb0c4', transparent:true, opacity:.35, depthWrite:false }));
  m.frustumCulled = false; m.userData.n = n; return m;
}
// What's falling: from the weather line (the DM's desk, or what the players were sent).
export function weatherKind(){
  const wx = wxNow(); if (wx) return FALLING[wx.kind] || null;   // (the valley's weather: game/weather.js)
  const w = String(state?.campaign?.weather || state?.weather || '').toLowerCase();
  if (/snow|sleet|blizzard/.test(w)) return /sleet/.test(w) ? 'sleet' : 'snow';
  if (/rain|drizzle|downpour|storm|shower/.test(w) && !/no rain/.test(w)) return /drizzle/.test(w) ? 'drizzle' : 'rain';
  return null;
}
const outdoors = () => { const th = THEMES[state.floors[ui.floor]?.theme] || {}; return th.walls === 'trees' || th.walls === 'mixed'; };

export function updateAmbience(t, dt){
  if (!state) return;
  ensurePool();
  if (t - lastPick > .4){ lastPick = t; pickLights(); }
  for (const l of pool){ const b = l.userData.base; l.intensity = b ? b * (.8 + .12 * Math.sin(t * 11 + l.userData.ph) + .08 * Math.sin(t * 23.7 + l.userData.ph * 2)) : 0; }
  // weather
  const kind = outdoors() && ui.view !== 'stack' ? weatherKind() : null, n = N[gfx.quality] ?? 900;
  const want = kind === 'rain' || kind === 'drizzle' || kind === 'sleet' ? 'rain' : kind === 'snow' ? 'snow' : null;
  if (rain && (want !== 'rain' || rain.userData.n !== n)){ scene.remove(rain); rain.geometry.dispose(); rain = null; }
  const tgt = controls.target;
  if (want === 'rain'){
    if (!rain){ rain = makeRain(kind === 'drizzle' ? Math.floor(n / 2) : n); scene.add(rain); }
    rain.material.opacity = kind === 'drizzle' ? .2 : .35;
    const a = rain.geometry.attributes.position, p = a.array, fall = (kind === 'sleet' ? 9 : 16) * dt;
    for (let i = 0; i < p.length; i += 6){ p[i + 1] -= fall; p[i + 4] -= fall; p[i] += fall * .08; p[i + 3] += fall * .08;
      if (p[i + 4] < -1){ const x = (Math.random() - .5) * 34, z = (Math.random() - .5) * 34; p[i] = x; p[i + 1] = 14; p[i + 2] = z; p[i + 3] = x + .05; p[i + 4] = 13.55; p[i + 5] = z; } }
    a.needsUpdate = true; rain.position.set(tgt.x, tgt.y, tgt.z);
  }
  updateSnowfall(want === 'snow', wxNow()?.kind === 'blizzard' || /blizzard/i.test(String(state?.campaign?.weather || state?.weather || '')), tgt);
}
