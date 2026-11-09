/* 🌬 THE WIND — the woods, the grass and the crops move with the day's weather. One pair of uniforms for every
   swaying material (the time, and how hard it blows: 0 still … 1 a gale), and a few lines added to the vertex shader,
   so hundreds of instanced trees sway on the graphics card for nothing. The bend follows ChatGPT's Living Valley II
   (render/barovia-living-three.js: the tip moves, the foot stays), with a lean downwind and gusts that travel over
   the map. How hard it blows comes from the valley's weather (engine/weather.js: wind 0–3), or the DM's own words. */
import { state } from '../engine/state.js';
import { wxNow } from '../game/weather.js';

export const wind = { time:{ value:0 }, force:{ value:.3 } };

/* Add the sway to a shader (call from a material's onBeforeCompile; add swayKey(opts) to its customProgramCacheKey).
   from / top: the heights (in the geometry's own units) below which it is still and at which it moves fully.
   amp: how far the tip goes, in the same units, in a gale. */
export function addSway(shader, { from = .3, top = 2.3, amp = .16 } = {}){
  if (!shader.vertexShader.includes('#include <begin_vertex>')) return;
  shader.uniforms.uWindTime = wind.time; shader.uniforms.uWindForce = wind.force;
  const f = n => Number(n).toFixed(4);
  shader.vertexShader = 'uniform float uWindTime;\nuniform float uWindForce;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    {
      #ifdef USE_INSTANCING
        mat3 swM = mat3( instanceMatrix ); vec2 swP = instanceMatrix[3].xz;
      #else
        mat3 swM = mat3( 1.0 ); vec2 swP = modelMatrix[3].xz;
      #endif
      // (downwind and across it, in the tree's own turned and scaled space, so the whole wood leans one way)
      float swS = max( dot( swM[0], swM[0] ), 1e-4 );
      vec3 swDown = ( vec3( 0.94, 0.0, 0.34 ) * swM ) / swS, swAcross = ( vec3( -0.34, 0.0, 0.94 ) * swM ) / swS;
      float swTip = pow( smoothstep( ${f(from)}, ${f(top)}, transformed.y ), 1.5 );
      float swPh = swP.x * 1.31 + swP.y * 1.73;
      float swGust = 0.55 + 0.45 * sin( uWindTime * 0.37 - swP.x * 0.19 - swP.y * 0.07 );
      float swLean = uWindForce * uWindForce * 0.55 + sin( uWindTime * 0.84 + swPh + transformed.y * 1.6 ) * 0.5 * uWindForce * swGust + cos( uWindTime * 2.1 + swPh * 0.7 ) * 0.12 * uWindForce;
      float swSide = cos( uWindTime * 0.63 + swPh * 1.2 + transformed.y * 1.5 ) * 0.32 * uWindForce * swGust;
      transformed += ( swDown * swLean + swAcross * swSide ) * swTip * ${f(amp)};
    }`);
}
export const swayKey = ({ from = .3, top = 2.3, amp = .16 } = {}) => `sway:${from}:${top}:${amp}`;

// A copy of a material that sways (one per material and setting; shared, so the floors don't dispose it).
const made = new Map();
export function swaying(base, opts = {}){
  const key = base.uuid + swayKey(opts);
  let m = made.get(key);
  if (!m){ m = base.clone(); m.userData = { ...base.userData, shared:true };
    m.onBeforeCompile = sh => addSway(sh, opts); m.customProgramCacheKey = () => swayKey(opts); made.set(key, m); }
  return m;
}

// How hard it blows now, 0–1: the valley's weather, or what the DM's own line says.
const BY_WIND = [.1, .32, .62, 1];
export function windForce(){
  const wx = wxNow();
  if (wx && Number.isFinite(wx.wind)) return BY_WIND[Math.max(0, Math.min(3, wx.wind | 0))];
  const k = wx?.kind || '';
  if (k === 'storm' || k === 'blizzard') return 1;
  if (k === 'downpour') return .62;
  if (/fog|mist/.test(k)) return .1;
  const w = String(state?.campaign?.weather || state?.weather || '').toLowerCase();
  if (/gale|storm|blizzard|howl|tempest/.test(w)) return 1;
  if (/wind|gust|bluster|squall/.test(w)) return .62;
  if (/still|calm|fog|mist|hush/.test(w)) return .1;
  return .32;
}
// Each frame (main.js): the clock, and the force easing towards the weather's.
export function updateWind(t, dt){
  wind.time.value = t;
  wind.force.value += (windForce() - wind.force.value) * Math.min(1, dt * .6);
}
