/* THE ATLAS — the Valley of Barovia in 3D, beside the Valley tab's SVG map.
   The relief GLB is the board, the 16 landmark GLBs are the places, the native
   roads are ribbons draped over the board. A view only: it changes no game state
   (journey selection, time, encounters and entering a place stay on the Valley
   code). The SVG stays the lightweight default; this is a toggle. If the models
   can't load — the offline file, models off, a failed fetch — the view is
   unavailable and the SVG stays. Nothing breaks. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VALLEY_PLACES, VALLEY_ROADS } from '../data/barovia-map.js';
import { looseModel, onPropModels } from './propmodels.js';
import { gfx, shadowsOn } from './gfx.js';
import { ui } from '../engine/state.js';

const RELIEF = 'assets/overworld/barovia-relief.glb';
const LANDMARK = id => `assets/overworld/landmarks/${id}.glb`;
const LIFT = 0.06; // how far a ribbon floats above the board (the relief builder's own lift)
const WIDTHS = { road: 0.9, path: 0.7, trail: 0.6 };
const COLOURS = { road: 0xa08a5e, path: 0x7a6a4a, trail: 0x7a6a4a };
const ON_COLOUR = 0xe9a54a;
const RIVER_COLOUR = 0x2e4a5a;
const loader = new GLTFLoader();
const raycaster = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);

// Injected scenes (the spec's hook): parsed GLBs, used before the fetch path.
const injected = new Map();
let built = null; // the last options the scene was built for
let atlasRaf = 0, atlasLast = 0;

function stage(){
  if (stage.R) return stage.R;
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1);
  if (shadowsOn()){ renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0d0a');
  scene.fog = new THREE.FogExp2('#0b0d0a', 0.0035);
  scene.add(new THREE.HemisphereLight('#9aa4b8', '#1a1210', 0.7));
  const key = new THREE.DirectionalLight('#ffd2a0', 2.5); key.position.set(60, 80, 40);
  if (shadowsOn()){ key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left:-60, right:60, top:60, bottom:-60, near:10, far:220 }); key.shadow.bias = -.002; }
  scene.add(key);
  const rim = new THREE.DirectionalLight('#7f9cff', 1.2); rim.position.set(-40, 30, -60); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(40, 100 / 64, 1, 400);
  camera.position.set(50, 55, 105);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(50, 0, 32); controls.enableDamping = true; controls.dampingFactor = .08;
  controls.minDistance = 25; controls.maxDistance = 160; controls.maxPolarAngle = 1.35;
  const groups = { relief:new THREE.Group(), landmarks:new THREE.Group(), roads:new THREE.Group(), hits:new THREE.Group(), marks:new THREE.Group() };
  for (const g of Object.values(groups)) scene.add(g);
  stage.R = { renderer, scene, camera, controls, ...groups, reliefMesh:null, placed:{}, draped:{} };
  return stage.R;
}
export const atlasCanvas = () => stage().renderer.domElement;
export const atlasReady = () => !!stage().reliefMesh;

// The height of the board at (x, z): a downward ray onto the relief mesh. Null until the relief is in.
function groundY(x, z){
  const r = stage(); if (!r.reliefMesh) return null;
  raycaster.set(new THREE.Vector3(x, 20, z), DOWN);
  const hit = raycaster.intersectObject(r.reliefMesh, false)[0];
  return hit ? hit.point.y : null;
}
// A model, by path: the injected scene first (the spec), then the on-demand fetch (looseModel).
function model(path){
  if (injected.has(path)) return injected.get(path);
  return looseModel(path);
}
function ensureRelief(){
  const r = stage(); if (r.reliefMesh) return true;
  const m = model(RELIEF); if (!m) return false;
  r.relief.add(m); r.reliefMesh = m.children.find(o => o.isMesh) || m;
  return true;
}
function ensureLandmarks(places){
  const r = stage();
  for (const p of places){
    if (r.placed[p.id]) continue;
    const m = model(LANDMARK(p.id)); if (!m) continue;
    m.position.set(p.x, groundY(p.x, p.y) ?? 0, p.y);
    r.landmarks.add(m); r.placed[p.id] = m;
  }
}
// Re-place a landmark once the relief has landed (it was held at y = 0 until then).
function rePlace(){
  const r = stage(); if (!r.reliefMesh) return;
  for (const [id, m] of Object.entries(r.placed)){
    const p = VALLEY_PLACES.find(q => q.id === id); if (!p) continue;
    m.position.y = groundY(p.x, p.y) ?? 0;
  }
}
// A flat ribbon along a draped polyline: two vertices per sample, offset perpendicular to travel in XZ.
function ribbon(pts, width, colour){
  const pos = [], idx = [];
  for (let i = 0; i < pts.length; i++){
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
    const px = -dz / len * width / 2, pz = dx / len * width / 2;
    pos.push(pts[i].x + px, pts[i].y, pts[i].z + pz, pts[i].x - px, pts[i].y, pts[i].z - pz);
    if (i){ const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color:colour, roughness:1, metalness:0 }));
}

// Build (or rebuild) the scene for these options. Idempotent: only what is missing is added,
// and the ribbons are rebuilt only once the relief has landed (they are draped on it).
// opts: { places: [ids to show], roads: [ids to show], mids: { roadId: {x,y} }, onRoute: Set, sel, lantern: {x,y}, dread }
// The midpoints come from the caller (valley.js exports roadMid) so the ribbon sits on the
// same bend the SVG draws — the atlas never re-derives the seed math.
export function buildAtlas(opts){
  const r = stage();
  const key = JSON.stringify([opts.places, opts.roads, [...(opts.onRoute || [])].sort(), opts.sel, opts.lantern, opts.dread]);
  const reliefNow = ensureRelief();
  const places = VALLEY_PLACES.filter(p => opts.places.includes(p.id));
  ensureLandmarks(places);
  if (reliefNow) rePlace();
  if (built === key && r.roads.children.length) return;
  built = key;
  // Roads: the SVG's quadratic curve (same seeded midpoint), draped over the board.
  if (r.reliefMesh){
    for (const c of [...r.roads.children]){ r.roads.remove(c); c.geometry?.dispose?.(); }
    for (const road of VALLEY_ROADS.filter(q => opts.roads.includes(q.id))){
      const a = VALLEY_PLACES.find(p => p.id === road.a), b = VALLEY_PLACES.find(p => p.id === road.b);
      if (!a || !b) continue;
      const mid = opts.mids?.[road.id] || { x:(a.x + b.x) / 2, y:(a.y + b.y) / 2 };
      const curve = new THREE.QuadraticBezierCurve3(v3(a), v3(mid), v3(b));
      const pts = curve.getPoints(24).map(p => ({ x:p.x, y:(groundY(p.x, p.z) ?? 0) + LIFT, z:p.z }));
      const on = opts.onRoute?.has(road.id);
      const mesh = ribbon(pts, WIDTHS[road.way] || 0.6, on ? ON_COLOUR : COLOURS[road.way] || 0x8a7a5a);
      mesh.userData.roadId = road.id; r.roads.add(mesh);
      r.draped[road.id] = pts;
      if (road.river){ // the atlas doc's blue diamond for a water crossing, at the curve's midpoint
        const m = pts[12], d = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color:RIVER_COLOUR, roughness:.6 }));
        d.position.set(m.x, m.y + 0.15, m.z); d.scale.y = 0.45; r.roads.add(d);
      }
    }
  }
  // Hit targets: one invisible cylinder per place, at the map coordinate (the atlas doc's
  // "independent hit target"). Transparent, not invisible — three skips invisible objects.
  for (const c of [...r.hits.children]) r.hits.remove(c);
  for (const p of places){
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3, 8),
      new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false }));
    hit.position.set(p.x, (groundY(p.x, p.y) ?? 0) + 1.5, p.y);
    hit.userData.placeId = p.id; r.hits.add(hit);
  }
  // Markers: the selected place's ring, the party's lantern, the castle's red glow.
  for (const c of [...r.marks.children]){ r.marks.remove(c); c.geometry?.dispose?.(); }
  if (opts.sel){
    const p = VALLEY_PLACES.find(q => q.id === opts.sel);
    if (p){ const ring = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.1, 32),
      new THREE.MeshBasicMaterial({ color:ON_COLOUR, side:THREE.DoubleSide, transparent:true, opacity:.9 }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, (groundY(p.x, p.y) ?? 0) + 0.08, p.y); r.marks.add(ring); }
  }
  if (opts.lantern){
    const y = groundY(opts.lantern.x, opts.lantern.y) ?? 0;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8),
      new THREE.MeshBasicMaterial({ color:'#ffcf7a' }));
    lamp.position.set(opts.lantern.x, y + 0.5, opts.lantern.y); r.marks.add(lamp);
    const light = new THREE.PointLight('#ffb060', 12, 9); light.position.copy(lamp.position); r.marks.add(light);
  }
  const castle = VALLEY_PLACES.find(p => p.id === 'castle');
  if (castle && opts.dread != null){
    const glow = new THREE.PointLight('#b8202a', 2 + (opts.dread || 1) * 1.5, 14);
    glow.position.set(castle.x, (groundY(castle.x, castle.y) ?? 0) + 2, castle.y); r.marks.add(glow);
  }
}
const v3 = p => new THREE.Vector3(p.x, 0, p.y);

// A plain summary of the scene graph, for the spec (graph state, not pixels).
export function atlasState(){
  const r = stage();
  const bb = r.reliefMesh ? new THREE.Box3().setFromObject(r.reliefMesh) : null;
  return {
    ready: atlasReady(),
    relief: !!r.reliefMesh,
    bounds: bb ? { min:bb.min.toArray(), max:bb.max.toArray() } : null,
    camera: { pos:r.camera.position.toArray(), target:r.controls.target.toArray() },
    places: VALLEY_PLACES.map(p => {
      const m = r.placed[p.id];
      return { id:p.id, x:p.x, y:m ? m.position.y : null, z:p.y, visible:!!m };
    }),
    roads: Object.entries(r.draped).map(([id, pts]) => ({ id, way:VALLEY_ROADS.find(q => q.id === id)?.way, points:pts.length, pts })),
  };
}
// The board's height at (x, z), for the spec (a ribbon point's y minus this is its lift).
export const atlasGroundY = (x, z) => groundY(x, z);
// Where a world point lands on the canvas, in CSS pixels (for the spec's click).
export function atlasScreen(x, y, z){
  const r = stage(), rect = r.renderer.domElement.getBoundingClientRect();
  const p = new THREE.Vector3(x, y, z).project(r.camera);
  return { x:(p.x + 1) / 2 * rect.width + rect.left, y:(1 - p.y) / 2 * rect.height + rect.top };
}
// The spec's hook: parse GLB data and build the scene without fetching (the harness 404s assets/).
// Accepts ArrayBuffers, or base64 strings (the spec passes base64 — binary does not survive
// the harness's argument serialisation intact, text does).
const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
const toBuf = v => typeof v === 'string' ? b64(v) : v;
export async function injectAtlas({ relief, landmarks }){
  const parse = buf => new Promise((res, rej) => loader.parse(buf, '', g => res(g.scene), rej));
  if (relief) injected.set(RELIEF, await parse(toBuf(relief)));
  for (const [id, buf] of Object.entries(landmarks || {})) injected.set(LANDMARK(id), await parse(toBuf(buf)));
  buildAtlas(injectAtlas.opts || { places:VALLEY_PLACES.map(p => p.id), roads:VALLEY_ROADS.map(q => q.id), onRoute:new Set(), sel:null, lantern:null, dread:1 });
  return atlasState();
}
injectAtlas.opts = null;

// Put the canvas in the host and start the loop. Re-mounts on every render (the panel
// re-renders destroy the canvas) — the camera and the scene survive in the module.
let atlasFailTimer = 0;
export function mountAtlas(host, opts){
  if (!host) return false;
  let cv;
  try { cv = atlasCanvas(); } catch { host.innerHTML = '<div class="muted" style="padding:12px">3D view unavailable on this device.</div>'; return false; }
  cv.className = 'atlas-cv'; host.prepend(cv);
  injectAtlas.opts = opts;
  buildAtlas(opts);
  clearTimeout(atlasFailTimer);
  // The models live beside the app; if the board still hasn't arrived after a few
  // seconds, say so (and offer the way back) instead of leaving an empty board.
  atlasFailTimer = setTimeout(() => {
    if (ui.atlas3d && host.isConnected && !atlasReady()){
      host.innerHTML = '<div class="muted" style="padding:12px">The 3D valley didn\'t load — its models live beside the app and didn\'t arrive. The map is the same valley.</div><div class="row"><button class="btn small" data-act="valleyAtlas">Back to the map</button></div>';
    }
  }, 20000);   // (a slow phone or connection can take a while over seventeen models: give them time before saying so)
  if (!cv.dataset.wired){
    cv.dataset.wired = 1;
    let down = null;
    cv.addEventListener('pointerdown', e => { down = { x:e.clientX, y:e.clientY }; });
    cv.addEventListener('pointerup', e => {
      // A tap is a press that did not move — no duration limit: on a slow device the
      // main thread can be busy for a while between the down and the up, and a tap
      // that took a second to land is still a tap.
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) { down = null; return; }
      down = null;
      const rect = cv.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, stage().camera);
      const hit = raycaster.intersectObjects(stage().hits.children, false)[0];
      if (hit?.object.userData.placeId){
        ui.valleySel = hit.object.userData.placeId;
        import('../ui/panels.js').then(m => m.renderPanel()); // the same path as the SVG's valleySel
      }
    });
  }
  if (!atlasRaf) atlasRaf = requestAnimationFrame(atlasLoop);
  return true;
}
function atlasLoop(now){
  const cv = document.querySelector('#atlasBox .atlas-cv');
  if (!ui.atlas3d || !cv || !cv.isConnected){ atlasRaf = 0; return; }
  atlasRaf = requestAnimationFrame(atlasLoop);
  const dt = Math.min(.05, (now - (atlasLast || now)) / 1000); atlasLast = now;
  const r = stage();
  const w = Math.max(200, Math.min(cv.parentElement.clientWidth || 640, 900)), h = Math.round(w * 64 / 100);
  if (r.w !== w || r.h !== h){ r.renderer.setSize(w, h, false); r.w = w; r.h = h; }
  r.camera.aspect = w / h; r.camera.updateProjectionMatrix();
  // Landmarks are markers, not true-scale models: at the whole-valley zoom they are
  // scaled up so they read (like the SVG's place dots), and up close they shrink to
  // their true size. ~30 px on screen across the zoom range.
  const dist = r.camera.position.distanceTo(r.controls.target);
  const s = Math.min(3.2, Math.max(1, dist / 35));
  for (const m of Object.values(r.placed)) m.scale.setScalar(s);
  r.controls.target.x = Math.min(100, Math.max(0, r.controls.target.x));
  r.controls.target.z = Math.min(64, Math.max(0, r.controls.target.z));
  r.controls.update(dt);
  r.renderer.render(r.scene, r.camera);
}
// A model arriving late (the fetch path) rebuilds the scene in place.
onPropModels(() => { if (injectAtlas.opts && document.querySelector('#atlasBox')) buildAtlas(injectAtlas.opts); });
