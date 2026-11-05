/* PROP MODELS — the ready-made 3D models some props use (src/data/prop-models.js: KayKit, CC0), loaded on demand
   from assets/props/ beside the app. A prop asks for its model each time it's built: if it's here, the prop is the
   model; if not, the prop is drawn in code as before, and the model is fetched; when it arrives, the floors are
   redrawn (onPropModels). Nothing breaks when a model can't load (the offline file, no network): that kind just keeps
   its code-drawn look. Models can be turned off per device (gfx.models === false). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
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
    const shade = spec.shade && new THREE.Color(spec.shade), done = new Set();
    scene.traverse(o => { if (o.isMesh){ o.castShadow = o.receiveShadow = true;
      if (o.material && !done.has(o.material)){ done.add(o.material); o.material.side = THREE.FrontSide; if (shade) o.material.color.multiply(shade); if (spec.recolor) patch(o.material, { recolor:spec.recolor }); } } });
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
  let hinge = null, slider = null;
  if (spec.lid && spec.slide){ slider = m.getObjectByName(spec.lid); }   // (a lid that slides off, a coffin's)
  else if (spec.lid){
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
  // (stretch: drawn out along its length to fill its squares, never shorter than it was)
  holder.scale.set(s, s, spec.stretch ? Math.max(s, d.h * fit / Math.max(size.z, 1e-3)) : s);
  g.add(holder);
  if (slider){
    const closed = slider.position.x, open = closed + spec.slide;
    slider.position.x = p?.open ? open : closed;
    (g.userData.openers ||= []).push({ o:slider, kind:'position', axis:'x', a:closed, b:open });
  }
  if (hinge){
    const closed = 0, open = -1.9;
    hinge.rotation.x = p?.open ? open : closed;
    (g.userData.openers ||= []).push({ o:hinge, kind:'rotation', axis:'x', a:closed, b:open });
  }
  g.userData.model = true;
  return g;
}

/* For the woods (render/floors.js): a prop kind's model as one geometry and one material, for an InstancedMesh of
   hundreds of trees, standing on y = 0, centred, `height` tall (each tree then scaled about that). With snow (0–1,
   from the day's weather) the material whitens whatever faces up, as the drawn pines get their white caps.
   → { geometry, material } | null (not here yet: it's fetched, and the floors redraw when it comes) */
const merged = new Map();
export function instancedModel(k, height, snow = 0){
  const tpl = propModel(k); if (!tpl) return null;
  const key = k + ':' + height;
  let e = merged.get(key);
  if (!e){
    tpl.updateMatrixWorld(true);
    const geos = []; let mat = null;
    tpl.traverse(o => { if (!o.isMesh) return; const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
      geos.push(g.index ? g.toNonIndexed() : g); mat ||= Array.isArray(o.material) ? o.material[0] : o.material; });
    const geometry = geos.length && mergeGeometries(geos, false); if (!geometry) return null;
    geometry.computeBoundingBox();
    const b = geometry.boundingBox, c = b.getCenter(new THREE.Vector3()), h = Math.max(b.max.y - b.min.y, 1e-3);
    geometry.translate(-c.x, -b.min.y, -c.z); geometry.scale(height / h, height / h, height / h);
    const material = mat.clone(); material.userData.shared = true;
    if (PROP_MODELS[k].recolor) patch(material, { recolor:PROP_MODELS[k].recolor });   // (a clone leaves the shader patch behind)
    e = { geometry, material, snowy:null }; merged.set(key, e);
  }
  if (snow < .4) return e;
  // (one snowy material per kind; its whiteness is a uniform, so a heavier fall needs no new shader)
  if (!e.snowy){
    const m = e.material.clone(), u = { value:snow }; m.userData = { shared:true, snow:u };
    patch(m, { recolor:PROP_MODELS[k].recolor, snow:u });
    e.snowy = { geometry:e.geometry, material:m };
  }
  e.snowy.material.userData.snow.value = Math.min(1, .45 + snow * .5);
  return e.snowy;
}

/* The shader touches a model's material can take (one patch, as three.js keeps only one onBeforeCompile):
   - recolor 'fir': the saturated orange and yellow of the texture (autumn needles) turned dark fir green; the trunk,
     greyer, stays as it is
   - snow (a uniform { value: 0–1 }): whatever faces up whitened */
function patch(m, { recolor = null, snow = null }){
  m.onBeforeCompile = sh => {
    if (recolor === 'fir') sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      { vec3 c = diffuseColor.rgb; float mx = max( c.r, max( c.g, c.b ) ), mn = min( c.r, min( c.g, c.b ) );
        if ( mx > 0.0 && ( mx - mn ) / mx > 0.55 && c.r > c.b ) diffuseColor.rgb = vec3( c.g * 0.15 + 0.01, c.r * 0.16 + c.g * 0.1, c.r * 0.06 + c.b * 0.45 ); }`);
    if (snow){
      sh.uniforms.snowAmt = snow;
      sh.vertexShader = 'varying float vSnowUp;\n' + sh.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        #ifdef USE_INSTANCING
          vSnowUp = normalize( mat3( modelMatrix ) * mat3( instanceMatrix ) * objectNormal ).y;
        #else
          vSnowUp = normalize( mat3( modelMatrix ) * objectNormal ).y;
        #endif`);
      sh.fragmentShader = 'uniform float snowAmt;\nvarying float vSnowUp;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.86, 0.89, 0.93 ), snowAmt * smoothstep( 0.3, 0.8, vSnowUp ) );`);
    }
  };
  m.customProgramCacheKey = () => 'pm:' + (recolor || '') + (snow ? ':snow' : '');
  m.needsUpdate = true;
}
