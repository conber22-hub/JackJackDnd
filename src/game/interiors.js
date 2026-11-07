/* GOING INSIDE — the buildings on a village or town map open onto their insides (engine/interiors.js, ChatGPT's):
   the Maps tab lists the floor's buildings, and "Go inside" builds the building as its own map, storey by storey
   (cellar, ground floor, upper floors and loft), and brings the party in at the front door. The village stays on the
   shelf as the party left it; going back is the Maps tab's "Go". Each building's inside is the same every time. */
import { state, ui } from '../engine/state.js';
import { KINDS } from '../engine/interiors.js';
import { interiorPlan, interiorGround } from '../engine/generator.js';
import { goToMap } from './maps.js';
import { toast } from '../ui/hud.js';

// What a building is, from its name and shape: a tavern, a church, a mansion, a mill, a tower, a barn, a hut…
export function buildingKind(b){
  const n = String(b.name || '').toLowerCase(), has = k => KINDS[k] || (Array.isArray(KINDS) && KINDS.some(x => x.id === k));
  const guess = /tavern|inn\b|alehouse|ladle|lantern/.test(n) ? 'tavern' : /church|chapel|temple|shrine|abbey/.test(n) ? 'church'
    : /manor|mansion|burgomaster|hall of|estate/.test(n) ? 'mansion' : /shop|mercantile|store|smith|apothecary|market/.test(n) ? 'shop'
    : b.mill || /mill/.test(n) ? 'windmill' : b.tower || /tower/.test(n) ? 'tower' : /barn|stable/.test(n) ? 'barn' : /\bhut\b|shack|\bshed\b/.test(n) ? 'hut'
    : /longhouse/.test(n) ? 'longhouse' : /\bhall\b/.test(n) ? 'hall' : /cottage/.test(n) ? 'cottage' : /\bhouse\b/.test(n) && b.w * b.h > 9 ? 'house' : b.w * b.h <= 9 ? 'cottage' : 'house';
  return has(guess) ? guess : 'house';
}
const interiorOf = (L, i) => {
  const b = state.floors[L].buildings[i];
  return { kind:buildingKind(b), w:Math.max(3, b.w), h:Math.max(3, b.h), seed:`${state.meta.seed}|${state.meta.mapId || ''}|${L}|${i}`, name:b.name || null };
};
export function goInside(L, i){
  const b = state.floors[L]?.buildings?.[i]; if (!b){ toast('No such building.'); return; }
  const it = interiorOf(L, i), plan = interiorPlan(it), ground = interiorGround(it);
  const size = Math.max(...plan.floors.map(f => Math.max(f.W, f.H)));
  const out = plan.floors[ground].out || plan.floors[ground].down || [plan.floors[ground].rooms[0][0] + 1, plan.floors[ground].rooms[0][1] + 1];
  goToMap({ meta:{ name:b.name || plan.name, seed:it.seed, floors:plan.floors.length, size, template:'interior', interior:it },
    key:`inside:${state.meta.mapId || state.meta.seed}:${L}:${i}`, kind:'place', at:{ floor:ground, x:out[0], y:out[1] } });
  ui.floor = ground;
}
