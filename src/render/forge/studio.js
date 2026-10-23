/* THE STUDIO — a little stage of its own for forged figures: candle-warm key light, a cold rim from behind, a dark
   backdrop. It renders the creator's live preview (a turntable) and the portrait a hero gets from their mini, and
   a lineup of figures for a quick look at many at once. Separate from the map's renderer and scene. */
import * as THREE from 'three';
import { buildForge, disposeForge } from './build.js';
import { poseRig, playAction } from './anim.js';

let R = null;
function stage(){
  if (R) return R;
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#8a84a8', '#1a1210', .55));
  const key = new THREE.DirectionalLight('#ffd2a0', 2.4); key.position.set(1.4, 2.4, 2.2); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left:-2, right:2, top:2, bottom:-2, near:.5, far:8 }); key.shadow.bias = -.002; scene.add(key);
  const rim = new THREE.DirectionalLight('#7f9cff', 2.2); rim.position.set(-1.6, 1.6, -2.2); scene.add(rim);
  const fill = new THREE.PointLight('#ff9a50', 1.2, 6); fill.position.set(-1.2, .6, 1.4); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshStandardMaterial({ color:'#1d1719', roughness:.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 50);
  R = { renderer, scene, camera, figs:[] };
  return R;
}
const base = () => { const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.43, .46, .07, 40), new THREE.MeshStandardMaterial({ color:'#151116', roughness:.5 })));
  g.children[0].position.y = .035; g.children[0].receiveShadow = true; return g; };
function clear(){ const r = stage(); for (const f of r.figs){ r.scene.remove(f); f.traverse(o => { if (o.userData.forge) return; }); disposeForge(f); } r.figs = []; }
// Put looks on the stage, side by side. → the figures
export function setStage(looks, gap = 1.05){
  const r = stage(); clear(); r.key = JSON.stringify(looks);
  looks.forEach((l, i) => {
    const g = new THREE.Group(), fig = buildForge(l); g.add(base()); g.add(fig); g.userData.fig = fig;
    g.position.x = (i - (looks.length - 1) / 2) * gap;
    g.traverse(o => { if (o.isMesh){ o.castShadow = true; } });
    r.scene.add(g); r.figs.push(g);
  });
  return r.figs;
}
// Render the stage to an image. view: { w, h, yaw (turn), dist, y (look-at height), t (time), action, actionAt }
// phase: freeze a figure's action at that point (0..1) instead of time t
export function shoot(o = {}){ frame(o); return stage().renderer.domElement.toDataURL('image/png'); }
// Render the stage into its own canvas (the creator's live preview calls this every frame). moving: walk in place.
export function frame({ w = 512, h = 640, yaw = .35, dist = null, y = .62, t = 1.2, fov = 30, bg = null, phase = null, moving = false, dt = 1 / 30 } = {}){
  const r = stage(); if (r.w !== w || r.h !== h){ r.renderer.setSize(w, h, false); r.w = w; r.h = h; } r.renderer.setPixelRatio(1);
  const n = Math.max(1, r.figs.length), span = (n - 1) * 1.05 + 1.1;
  const d = dist ?? Math.max(2.3, span / (2 * Math.tan(fov * Math.PI / 360) * (w / h)) + .6);
  r.camera.fov = fov; r.camera.aspect = w / h; r.camera.updateProjectionMatrix();
  r.camera.position.set(Math.sin(yaw) * d, y + .45, Math.cos(yaw) * d); r.camera.lookAt(0, y, 0);
  r.scene.background = bg ? new THREE.Color(bg) : null;
  for (const g of r.figs){ const a = g.userData.fig.userData.rig?.action; poseRig(g.userData.fig, phase != null && a ? a.t0 + phase * a.dur : t, dt, moving); }
  r.renderer.render(r.scene, r.camera);
}
/* A portrait from the first figure on the stage: head and shoulders, three-quarter view, candlelit. → a JPEG */
export function portrait({ size = 384, yaw = .45, t = 1.2 } = {}){
  const r = stage(), g = r.figs[0]; if (!g) return null;
  const fig = g.userData.fig, rig = fig.userData.rig;
  poseRig(fig, t, 1 / 30); fig.updateMatrixWorld(true);
  const head = rig.head.getWorldPosition(new THREE.Vector3());
  r.renderer.setSize(size, size, false); r.w = r.h = size;
  r.camera.fov = 26; r.camera.aspect = 1; r.camera.updateProjectionMatrix();
  const H = rig.H || 1, d = .78 * H + .22, cy = head.y + .03 * H;              // the head joint is the top of the neck
  r.camera.position.set(head.x + Math.sin(yaw) * d, cy + .05 * H, head.z + Math.cos(yaw) * d); r.camera.lookAt(head.x, cy - .04 * H, head.z);
  r.scene.background = new THREE.Color('#17121a');
  r.renderer.render(r.scene, r.camera);
  r.scene.background = null;
  return r.renderer.domElement.toDataURL('image/jpeg', .88);
}
/* A portrait of any figure (a creature's procedural mini, a model): framed on its upper half by its bounds,
   three-quarter view, candlelit. The object is lent: it's taken off the stage again afterwards. → a JPEG */
export function portraitOfObject(obj, { size = 512, yaw = .55 } = {}){
  const r = stage(); clear(); r.key = '';
  const holder = new THREE.Group(); holder.add(obj); r.scene.add(holder);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj), H = Math.max(.3, box.max.y - box.min.y), cy = box.max.y - H * .32;
  const d = H * 1.25 + .5;
  r.renderer.setSize(size, size, false); r.w = r.h = size;
  r.camera.fov = 30; r.camera.aspect = 1; r.camera.updateProjectionMatrix();
  r.camera.position.set(Math.sin(yaw) * d, cy + H * .08, Math.cos(yaw) * d); r.camera.lookAt(0, cy, 0);
  r.scene.background = new THREE.Color('#17121a');
  r.renderer.render(r.scene, r.camera);
  r.scene.background = null; r.scene.remove(holder); holder.remove(obj);
  return r.renderer.domElement.toDataURL('image/jpeg', .88);
}
export function act(i, kind){ const g = stage().figs[i]; if (g) playAction(g.userData.fig.userData.rig, kind); }
export const studioCanvas = () => stage().renderer.domElement;
export const studio = () => stage();
// What's on the stage now (so a caller can tell whether it must set it again).
export const stageKey = () => stage().key || '';
