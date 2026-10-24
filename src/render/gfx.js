/* GRAPHICS & SOUND SETTINGS — per device (kept in this browser, never sent to the table).
   quality: low (fast, phones) · medium (bloom + film grain) · high (adds torch shadows).
   style: classic · painted (an illustrated-poster look: render/post.js; needs medium or high). */
const KEY = 'dreaddelve.gfx.v1';
const phone = typeof matchMedia !== 'undefined' && (matchMedia('(pointer:coarse)').matches || innerWidth < 760);
export const gfx = { quality:phone ? 'low' : 'medium', style:'classic', volume:.7, music:true, sfx:true };
try { Object.assign(gfx, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
const listeners = [];
export function onGfx(fn){ listeners.push(fn); }
export function setGfx(patch){
  Object.assign(gfx, patch);
  try { localStorage.setItem(KEY, JSON.stringify(gfx)); } catch {}
  for (const fn of listeners) fn(gfx);
}
export const postOn = () => gfx.quality !== 'low';
export const shadowsOn = () => gfx.quality === 'high';
export const painted = () => gfx.style === 'painted' && gfx.quality !== 'low';
