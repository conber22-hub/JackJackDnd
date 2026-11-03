/* The workshop's preview: what a design looks like, on the creator's little stage (render/forge/studio.js).
   A weapon in a figure's hand, armour on them, a shield on their arm, a lantern at their belt, in the metal the design
   is made of; a wagon on its own. → a JPEG, so the window can show it like a picture. */
import * as THREE from 'three';
import { setStage, shoot, studio } from './forge/studio.js';
import { normalizeLook } from '../engine/look.js';
import { weaponModel, ARMOR_OUTFIT } from '../data/looks.js';
import { armorKey } from '../engine/gear.js';
import { buildProp } from './props.js';
import { wagonProp } from '../game/workshop.js';

const METAL = { iron:'iron', steel:'steel', silvered:'silver', 'cold-iron':'black', adamantine:'black', bone:'silver', blackwood:'black' };
const cache = new Map();
export function previewOf(design, item){
  const key = JSON.stringify(design.parts) + design.kind;
  if (cache.has(key)) return cache.get(key);
  let url = null;
  try { url = design.kind === 'wagon' ? wagonShot(design) : figureShot(design, item); } catch (e){ console.warn(e); }
  if (cache.size > 40) cache.delete(cache.keys().next().value);
  cache.set(key, url);
  return url;
}
function figureShot(design, item){
  const p = design.parts, rune = p.rune && p.rune !== 'rustless';
  const look = { body:'human', outfit:'tunic', c1:'#3a3440', c2:'#a08a6a', metal:METAL[p.material] || 'steel', pose:'ready', main:'none', off:'none', glow:false, seed:7 };
  if (design.kind === 'weapon') look.main = weaponModel(item?.baseName || '') || 'sword';
  if (design.kind === 'armor'){ look.outfit = ARMOR_OUTFIT[armorKey(item?.baseName)] || 'leather'; look.main = 'sword'; look.helm = /plate|splint/i.test(item?.baseName || '') ? 'great' : 'none'; }
  if (design.kind === 'shield'){ look.off = 'shield'; look.main = 'sword'; look.shieldCol = p.material === 'blackwood' ? '#2a2220' : '#5a2a2a'; }
  if (design.kind === 'trinket'){ look.lantern = p.vessel === 'lantern'; look.outfit = 'robe'; }
  if (rune) look.glow = true;
  setStage([normalizeLook(look)]);
  // a weapon's preview turns to show the blade; the rest face the bench
  return shoot({ w:300, h:360, yaw:design.kind === 'weapon' ? .9 : .4, bg:'#17121a' });
}
function wagonShot(design){
  setStage([]);
  const r = studio(), obj = buildProp({ id:1, k:wagonProp(design.parts), x:0, y:0, rot:0 });
  const holder = new THREE.Group(); holder.add(obj); r.scene.add(holder); holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  obj.position.x -= c.x; obj.position.z -= c.z; holder.updateMatrixWorld(true);
  const s = Math.max(size.x, size.y, size.z), d = s * 1.9 + .6;
  r.renderer.setSize(300, 360, false); r.w = 300; r.h = 360;
  r.camera.fov = 30; r.camera.aspect = 300 / 360; r.camera.updateProjectionMatrix();
  r.camera.position.set(d * .75, size.y * .9 + d * .35, d * .65); r.camera.lookAt(0, size.y * .4, 0);
  r.scene.background = new THREE.Color('#17121a');
  r.renderer.render(r.scene, r.camera);
  r.scene.background = null; r.scene.remove(holder);
  return r.renderer.domElement.toDataURL('image/jpeg', .88);
}
