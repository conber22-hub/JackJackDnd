/* 🌫 GROUND MIST — on fog days, and at dawn when the air is still, banks of mist lie over an outdoor map and roll
   slowly with the wind; heroes and trees stand up out of them. The banks are ChatGPT's Living Valley II
   (render/barovia-living-three.js: a few dozen flat patches drawn by one shader, planned from the map's seed so every
   device sees the same ones). This file mounts a layer on a floor when it's built (render/floors.js) and, each frame,
   eases its thickness towards the weather's and gives it the hour's colour. Only the look: sight and movement in fog
   are the weather engine's and the Mists' business. */
import * as THREE from 'three';
import { state } from '../engine/state.js';
import { createLivingValley } from './barovia-living-three.js';
import { wxNow } from '../game/weather.js';
import { gfx } from './gfx.js';
import { scene } from './scene.js';
import { wind } from './wind.js';

const BY_KIND = { 'thick-fog':1, 'low-fog':.75, mist:.5 };
// How thick the mist lies now, 0–1.
export function mistWanted(){
  const wx = wxNow(), hour = state?.campaign?.valley?.hour ?? state?.hour;
  let k = 0;
  if (wx) k = BY_KIND[wx.kind] || 0;
  else { const w = String(state?.campaign?.weather || state?.weather || '').toLowerCase();
    k = /thick fog|dense fog|heavy fog/.test(w) ? 1 : /fog/.test(w) ? .75 : /mist|haze/.test(w) ? .5 : 0; }
  // a still dawn: mist in the low places, gone by mid-morning
  if (!k && hour != null && hour >= 4 && hour < 8 && wind.force.value < .4 && !/rain|snow|storm|sleet|pour|blizzard/.test(wx?.kind || '')) k = hour < 7 ? .4 : .2;
  return k;
}

/* Mount the mist on a floor's view (fv.built, where the ground is y = 0). allowed(x, y): may a bank lie centred on
   this square (a square the viewer can see, not under a roof). The last layer is let go first. */
export function mountGroundMist(fv, f, L, allowed){
  dropGroundMist(fv);
  const size = state.meta.size, quality = gfx.quality === 'ultra' ? 'high' : gfx.quality;
  try {
    const layer = createLivingValley({ parent:fv.built, width:size, height:size, seed:`${state.meta.mapId || state.meta.seed}|${L}`, quality, groundY:0, wind:wind.force.value, showFog:false, enableCanopyBend:false });
    // (the pack's count is for a 40-square map: a bigger one gets its share, a few more besides so the banks overlap)
    const count = Math.min(220, Math.round({ low:16, medium:40, high:70 }[quality] * Math.max(1, (size / 40) ** 2)));
    const mesh = layer.addGroundFog({ count, allowed:(x, y) => x < f.W && y < f.H && allowed(x, y) });
    mesh.renderOrder = 3; mesh.userData.groundMist = 1;
    fv.mist = { layer, mesh, k:mistWanted() };
    layer.setFogStrength(fv.mist.k); mesh.visible = fv.mist.k > .02;
  } catch { fv.mist = null; }   // (a map too big for the planner goes without)
}
export function dropGroundMist(fv){ if (fv?.mist){ try { fv.mist.layer.dispose(); } catch {} fv.mist = null; } }

// Each frame, for the floor on view.
const tint = new THREE.Color(), pale = new THREE.Color('#c9ccd6');
export function updateGroundMist(fv, t){
  const m = fv?.mist; if (!m) return;
  const dt = Math.max(0, Math.min(1, t - (m.t ?? t))); m.t = t;
  m.k += (mistWanted() - m.k) * Math.min(1, dt * .5);
  m.mesh.visible = m.k > .02; if (!m.mesh.visible) return;
  m.layer.setFogStrength(Math.min(1, m.k)); m.layer.setWind(Math.max(.15, wind.force.value));
  m.mesh.material.uniforms.uColor.value.copy(tint.copy(scene.fog.color).lerp(pale, .55));   // (the hour's fog colour, lifted: grey by day, blue-dark by night)
  m.layer.update(t);
}
