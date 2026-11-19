/* GRAPHICS & SOUND SETTINGS — per device (kept in this browser, never sent to the table).
   quality: low (fast, phones) · medium (bloom + film grain) · high (adds torch shadows) · ultra (every hero's
   torch casts sharper shadows, at the screen's full resolution: a strong laptop or the TV).
   style: classic · painted (an illustrated-poster look: render/post.js; needs medium or high).
   omens: the moving signs of Strahd's Gaze on outdoor maps (ravens, eyes in the trees: render/omens.js). */
const KEY = 'dreaddelve.gfx.v1';
const phone = typeof matchMedia !== 'undefined' && (matchMedia('(pointer:coarse)').matches || innerWidth < 760);
// calm: no hit-stop or slow motion, no screen flashes, no camera kick or shake (render/punch.js), a steady near-death
// edge (ui/followcam.js); on by default where the device asks for less motion
const lessMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
// pace: how fast a fight's turns follow one another in the Wanderer: 'normal' · 'quick' · 'brisk' (engine/pace.js)
export const gfx = { quality:phone ? 'low' : 'medium', style:'classic', omens:true, volume:.7, music:true, sfx:true, calm:lessMotion, pace:'normal' };
try { Object.assign(gfx, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
const listeners = [];
export function onGfx(fn){ listeners.push(fn); }
export function setGfx(patch){
  Object.assign(gfx, patch);
  try { localStorage.setItem(KEY, JSON.stringify(gfx)); } catch {}
  for (const fn of listeners) fn(gfx);
}
export const postOn = () => gfx.quality !== 'low';
export const ultra = () => gfx.quality === 'ultra';
export const shadowsOn = () => gfx.quality === 'high' || gfx.quality === 'ultra';
// the renderer's pixel ratio: capped for speed, the device's own on ultra
export const pixelRatio = () => ultra() ? devicePixelRatio : Math.min(devicePixelRatio, 2);
export const painted = () => gfx.style === 'painted' && gfx.quality !== 'low';
