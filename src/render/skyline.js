/* THE CASTLE ON THE HORIZON — on every outdoor map in the valley, Castle Ravenloft stands in a band along the top
   of the view, in its true direction from where the party is (a road stretch, a place, a landmark). It slides like a
   compass as the camera turns, grows as you face it, glows redder as his Gaze rises, and at Gaze 6+ lightning
   breaks behind it. At the castle itself the keep is on the map, so the band steps aside. */
import { state, ui } from '../engine/state.js';
import { VALLEY_PLACES } from '../data/barovia-map.js';
import { THEMES } from '../data/themes.js';
import { camera, controls } from './scene.js';

const place = id => VALLEY_PLACES.find(p => p.id === id);
const CASTLE = () => place('castle');
// Where in the valley this map is (valley-map coordinates), or null when it isn't in Barovia.
export function whereInValley(){
  const m = state?.meta; if (!m) return null;
  if (m.template === 'journey' && m.journey){
    const path = state.campaign?.valley?.journey?.path || state.valley?.journey?.path || [m.journey.from, m.journey.to];
    const L = Math.min(ui.floor, path.length - 2), a = place(path[Math.max(0, L)]), b = place(path[Math.max(0, L) + 1]) || a;
    if (!a) return null;
    const k = path.length > 2 ? .5 : (ui.floor + .5) / Math.max(1, state.floors.length);
    return { x:a.x + (b.x - a.x) * k, y:a.y + (b.y - a.y) * k };
  }
  if (m.template === 'landmark' && m.place){ const p = place(m.place); return p ? { x:p.x, y:p.y } : null; }
  const p = VALLEY_PLACES.find(p => p.map === m.template || p.maps?.includes(m.template));
  return p ? { x:p.x, y:p.y, id:p.id } : null;
}
let el = null, inner = null, flashAt = 0, nextFlash = 0;
export function updateSkyline(t){
  el ||= document.getElementById('skyline'); inner ||= el?.querySelector('.sky-castle');
  if (!el || !inner) return;
  const f = state?.floors[ui.floor], th = THEMES[f?.theme] || {}, outdoor = (th.walls === 'trees' || th.walls === 'mixed') && th.id !== 'tavern';
  const here = outdoor ? whereInValley() : null, C = CASTLE();
  const atCastle = here && (here.id === 'castle' || Math.hypot(C.x - here.x, C.y - here.y) < 3);
  const show = !!here && !atCastle && ui.view !== 'stack';
  el.classList.toggle('hidden', !show);
  if (!show) return;
  // bearings measured clockwise from north (map up = -z in the world)
  const vx = controls.target.x - camera.position.x, vz = controls.target.z - camera.position.z;
  const view = Math.atan2(vx, -vz), toCastle = Math.atan2(C.x - here.x, -(C.y - here.y));
  let diff = toCastle - view; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
  const facing = Math.max(0, Math.cos(diff)), dist = Math.hypot(C.x - here.x, C.y - here.y);
  const scale = Math.min(1.15, (.5 + facing * .55) * Math.max(.75, Math.min(1.3, 1.45 - dist / 80)));
  inner.style.transform = `translateX(${(diff / Math.PI * 50).toFixed(2)}vw) scale(${scale.toFixed(3)})`;
  inner.style.opacity = (.62 + facing * .38).toFixed(2);
  const g = state.dread || 1;
  el.style.setProperty('--glow', (.45 + g / 18).toFixed(2));
  // lightning at a high Gaze
  if (g >= 6 && t > nextFlash){ flashAt = t; nextFlash = t + 5 + Math.random() * (16 - g); el.classList.add('flash'); }
  if (flashAt && t - flashAt > .18){ el.classList.remove('flash'); flashAt = 0; }
}
