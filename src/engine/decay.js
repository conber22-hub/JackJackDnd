/* 🏚 DEAD VILLAGES — which houses of a place have been left, and which the Moss has taken. ChatGPT's planner
   (engine/barovia-dead-villages.js) rolls once for each building from the map's seed; how far the place has fallen
   (the stage, and how much of it) decides which side of its roll a house lands. So a place that goes from a third
   abandoned to two thirds keeps the same empty houses and adds more, and every device agrees. This adapter picks the
   buildings the planner can take (a house, not a castle keep or a turret), and hands back the stage for each, with
   the planner's line for the DM. Pure: no DOM, no Three.js. */
import { planDeadVillage } from './barovia-dead-villages.js';

export const DECAY_STAGES = ['inhabited', 'abandoned', 'infested'];
export const DECAY_NAMES = { inhabited:'Lived-in', abandoned:'Abandoned', infested:'Taken by the Moss' };
const ok = (b, W, H) => b && !b.keep && !b.turret && Number.isSafeInteger(b.x) && Number.isSafeInteger(b.y) && b.w >= 2 && b.h >= 2 && b.x >= 0 && b.y >= 0 && b.x + b.w <= W && b.y + b.h <= H;

// → [{ index (in f.buildings), stage, name, kind, read }] for the houses of this floor; [] if there are none to plan.
export function planDecay(f, { seed = 'barovia', stage = 'inhabited', intensity = 1 } = {}){
  if (!f || !DECAY_STAGES.includes(stage)) return [];
  const picks = (f.buildings || []).map((b, index) => ({ b, index })).filter(({ b }) => ok(b, f.W, f.H));
  if (!picks.length) return [];
  try {
    const layout = { W:f.W, H:f.H, buildings:picks.map(({ b }) => ({ x:b.x, y:b.y, w:b.w, h:b.h, name:b.name, door:['n', 's', 'e', 'w'].includes(b.door) ? b.door : undefined })) };
    const plan = planDeadVillage({ layout, seed:String(seed).slice(0, 200), settlementId:'place', stage, intensity:Math.max(0, Math.min(1, intensity)) });
    return plan.skins.map(s => ({ index:picks[s.buildingIndex].index, stage:s.stage, name:s.dm.name, kind:s.kind, read:s.dm.read }));
  } catch { return []; }
}
