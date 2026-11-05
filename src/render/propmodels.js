/* PROP MODELS — the ready-made 3D models some props use (src/data/prop-models.js: KayKit, CC0), loaded on demand
   from assets/props/ beside the app. A prop asks for its model each time it's built: if it's here, the prop is the
   model; if not, the prop is drawn in code as before, and the model is fetched; when it arrives, the floors are
   redrawn (onPropModels). Nothing breaks when a model can't load (the offline file, no network): that kind just keeps
   its code-drawn look. Models can be turned off per device (gfx.models === false). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PROP_MODELS } from '../data/prop-models.js';
import { PROPS, PROP_TOP } from '../data/props.js';
import { gfx } from './gfx.js';

const loader = new GLTFLoader();
const ready = new Map(), failed = new Set(), loading = new Set();
const listeners = [];
let timer = null;
export const onPropModels = fn => listeners.push(fn);
// (several models arriving together redraw once)
const arrived = () => { clearTimeout(timer); timer = setTimeout(() => listeners.forEach(fn => fn()), 250); };
const base = () => (typeof location !== 'undefined' && location.protocol !== 'file:') ? 'assets/props/' : null;

function load(k){
  const spec = PROP_MODELS[k], root = base();
  if (!spec || !root){ failed.add(k); return; }
  loading.add(k);
  loader.load(root + spec.file, gltf => {
    loading.delete(k);
    const scene = gltf.scene;
    scene.traverse(o => { if (o.isMesh){ o.castShadow = o.receiveShadow = true; if (o.material) o.material.side = THREE.FrontSide; } });
    ready.set(k, scene); arrived();
  }, undefined, () => { loading.delete(k); failed.add(k); });
}
// The model for a prop kind, if it's here (and starts fetching it if not). → an Object3D template | null
export function propModel(k){
  if (gfx.models === false || !PROP_MODELS[k] || failed.has(k)) return null;
  if (ready.has(k)) return ready.get(k);
  if (!loading.has(k)) load(k);
  return null;
}
export const hasPropModel = k => ready.has(k);

/* Dress a prop's group with its model: scaled to the app's height for it (or its footprint), centred on its squares
   and standing on the floor; a chest's lid hinged so it opens like the code-drawn one (userData.openers). */
const tmpBox = new THREE.Box3(), size = new THREE.Vector3(), centre = new THREE.Vector3();
export function dressWithModel(g, p, tpl){
  const spec = PROP_MODELS[p.k], d = PROPS[p.k] || { w:1, h:1 };
  const m = tpl.clone(true);
  // the lid first, in the model's own space: re-hung on a hinge at its back bottom edge, opening as the code-drawn
  // chest's does (closed now; turned open below once the model is measured)
  let hinge = null;
  if (spec.lid){
    const lid = m.getObjectByName(spec.lid);
    if (lid){
      m.updateMatrixWorld(true);
      const lb = new THREE.Box3().setFromObject(lid);
      hinge = new THREE.Group(); hinge.position.set((lb.min.x + lb.max.x) / 2, lb.min.y, lb.min.z);
      m.add(hinge); hinge.updateMatrixWorld(true);
      hinge.attach(lid);   // (keeps the lid where it is, now relative to the hinge)
    }
  }
  if (spec.turn) m.rotation.y = spec.turn;
  m.updateMatrixWorld(true);
  tmpBox.setFromObject(m); tmpBox.getSize(size); tmpBox.getCenter(centre);
  const fit = spec.fit ?? .94;
  const byFoot = Math.min(d.w * fit / Math.max(size.x, 1e-3), d.h * fit / Math.max(size.z, 1e-3));
  const byHeight = spec.top && PROP_TOP[p.k] ? PROP_TOP[p.k] / spec.top : spec.height ? spec.height / Math.max(size.y, 1e-3) : byFoot;
  const s = Math.min(byFoot, byHeight);
  const holder = new THREE.Group(); holder.add(m);
  m.position.set(-centre.x, -tmpBox.min.y, -centre.z);
  holder.scale.setScalar(s);
  g.add(holder);
  if (hinge){
    const closed = 0, open = -1.9;
    hinge.rotation.x = p?.open ? open : closed;
    (g.userData.openers ||= []).push({ o:hinge, kind:'rotation', axis:'x', a:closed, b:open });
  }
  g.userData.model = true;
  return g;
}
