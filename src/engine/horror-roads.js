/* 🕯 ROADSIDE HORRORS — ChatGPT's set pieces (render/barovia-horror-planner.js, pure: no Three.js) staged beside a
   journey's road. A stretch may get one scene (two when his Gaze is high): an inn with one warm window, a toll with
   no keeper, three empty nooses, a chapel ringing under the water. Each scene is its main piece and two or three
   companions in a clearing off the road, out of the woods, never on the road or in a clearing the party walks. It is
   the DM's to show: it stands on the DM's map from the start and reaches the players when the DM shows it
   (game/horror.js). Only the look, and the DM's three beats to read: what they see coming, what they find, what is
   different when they come back. Pure: no DOM, no Three.js. */
import { planHorrorRoad } from '../render/barovia-horror-planner.js';
import { ASSET_BY_ID } from '../render/horror-assets-index.js';
import { hashSeed, mulberry32 } from '../util/core.js';

// spec: the stretch's spec (engine/overland.js journeySpecs: { layout, road, gaze, bloom }); f: the floor it built.
// → { scenes:[{ id, name, kind, beats:{ approach, reveal, aftermath }, whisper, pieces:[{ a, x, y, rot, w, h }], shown:false }],
//     clear:[square index…] } (the squares under the pieces, cleared of trees)
export function planRoadsideHorror(f, spec, { seed = 'barovia', avoid = [] } = {}){
  const none = { scenes:[], clear:[] };
  if (!f || !spec?.layout?.paths?.length || !spec.road) return none;
  const gaze = Math.max(1, Math.min(10, Math.round(spec.gaze || 1)));
  // not every stretch: about a third at first, most of them once his Gaze is heavy on the valley
  if (mulberry32(hashSeed(`${seed}|horror?`))() >= .3 + gaze * .06) return none;
  let plan;
  try { plan = planHorrorRoad({ layout:{ ...spec.layout, W:f.W, H:f.H }, roadId:spec.road, seed:String(seed), gaze, bloom:!!spec.bloom,
    density:gaze >= 6 ? 'standard' : 'sparse', extraProtected:avoid }); } catch { return none; }
  const clear = new Set();
  // (the trees go from the square round a piece: the planner reserves its footprint unturned, the model stands turned)
  const piece = p => { const [w, h] = p.footprint, s = Math.max(w, h), ox = Math.round(p.x - (s - 1) / 2), oy = Math.round(p.y - (s - 1) / 2);
    for (let y = oy; y < oy + s; y++) for (let x = ox; x < ox + s; x++) if (x >= 0 && y >= 0 && x < f.W && y < f.H) clear.add(y * f.W + x);
    return { a:p.id, x:p.x, y:p.y, rot:p.rot, w, h }; };
  const scenes = plan.scenes.map(s => ({ id:s.id, name:s.name, kind:s.kind, beats:{ ...s.beats }, whisper:ASSET_BY_ID.get(s.primary.id)?.dmWhisper || '',
    pieces:[piece(s.primary), ...s.satellites.map(piece)], shown:false }));
  return { scenes, clear:[...clear] };
}
// What the players are sent: the scenes the DM has shown, as pieces only (no names, no beats).
export const horrorForPlayers = f => (f?.horror || []).filter(s => s.shown).map(s => ({ id:s.id, shown:true, pieces:s.pieces.map(p => ({ ...p })) }));
