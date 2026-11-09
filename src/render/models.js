/* 3D MODELS (GLB) — drop a .glb onto a creature, a hero, or a dungeon-kit slot and it replaces the procedural
   piece everywhere. Free CC0 kits (Kenney, Quaternius, …) work well. Files live in this browser's IndexedDB
   (they are too big for the autosave) and the DM's app sends them to players when they join.
   Keys:  bid:<creature id> · tok:<token id> · kit:wall · kit:floor */
import * as THREE from 'three';
import { gfx } from './gfx.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { bus } from '../util/core.js';

const DB = 'dreaddelve-models', STORE = 'models';
const entries = new Map();           // key -> { buf, scene, anims, kit, name, size }
export const modelState = { version:0 };
const loader = new GLTFLoader();

function idb(){
  return new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined') return rej(new Error('no IndexedDB'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function tx(mode, fn){ const db = await idb(); return new Promise((res, rej) => { const t = db.transaction(STORE, mode), st = t.objectStore(STORE), out = fn(st); t.oncomplete = () => res(out?.result ?? out); t.onerror = () => rej(t.error); }); }

function parse(buf){ return new Promise((res, rej) => loader.parse(buf, '', res, rej)); }

const WALL_H = 1.4;
// Merge a kit piece into one geometry + material, scaled to fill one grid square (walls are WALL_H tall).
function toKit(scene, slot){
  scene.updateMatrixWorld(true);
  const geos = []; let mat = null;
  scene.traverse(o => { if (o.isMesh){ const g = o.geometry.clone().applyMatrix4(o.matrixWorld); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) return; geos.push(g.index ? g.toNonIndexed() : g); mat ||= o.material; } });
  if (!geos.length) return null;
  const geo = mergeGeometries(geos, false); if (!geo) return null;
  geo.computeBoundingBox();
  const b = geo.boundingBox, size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
  const h = slot === 'floor' ? .2 : WALL_H;
  geo.translate(-c.x, -c.y, -c.z); geo.scale(1 / (size.x || 1), h / (size.y || 1), 1 / (size.z || 1));
  geo.computeVertexNormals();
  const material = (Array.isArray(mat) ? mat[0] : mat).clone();
  return { geometry:geo, material };
}

async function ingest(key, buf, name){
  const gltf = await parse(buf.slice(0));
  const e = { buf, scene:gltf.scene, anims:gltf.animations || [], name:name || key, size:buf.byteLength };
  if (key.startsWith('kit:')) e.kit = toKit(gltf.scene, key.slice(4));
  entries.set(key, e);
  modelState.version++;
  bus.emit('models', key);
  return e;
}
export async function loadStoredModels(){
  try {
    const keys = await tx('readonly', st => st.getAllKeys());
    for (const k of keys){ const rec = await tx('readonly', st => st.get(k)); if (rec?.buf) await ingest(k, rec.buf, rec.name).catch(() => {}); }
  } catch {}
}
// Called by the DM (store = true) and by players receiving a model from the table (store = false).
export async function putModel(key, buf, name, store = true){
  const e = await ingest(key, buf, name);
  if (store) try { await tx('readwrite', st => st.put({ buf, name }, key)); } catch {}
  return e;
}
export async function deleteModel(key){
  entries.delete(key); modelState.version++; bus.emit('models', key);
  try { await tx('readwrite', st => st.delete(key)); } catch {}
}
export const hasModel = key => entries.has(key);
export const modelInfo = key => { const e = entries.get(key); return e ? { name:e.name, size:e.size } : null; };
export const allModels = () => [...entries.entries()].filter(([key]) => !key.startsWith('pack:')).map(([key, e]) => ({ key, buf:e.buf, name:e.name }));   // (the built-in packs every device fetches for itself)
export const kitFor = slot => entries.get('kit:' + slot)?.kit || null;
export const modelKeyFor = t => entries.has('tok:' + t.id) ? 'tok:' + t.id : t.bid && entries.has('bid:' + t.bid) ? 'bid:' + t.bid : packKey(t);

/* Built-in models for some of the bestiary (ChatGPT's original, animated packs in public/assets/creatures/): the
   Bloom's creatures and the valley's beasts, healthy or (seeded, rising, or marked bloomed) taken by the Bloom. A model
   the DM drops on a creature or a token still wins. Fetched from beside the app the first time one is needed; the
   mini redraws when it arrives; the offline file and devices with models off keep the forge mini. */
const PACK_CREATURES = {
  sporeling:'barovian-bloom/sporeling.glb', 'bloom-vessel':'barovian-bloom/bloom-vessel.glb', 'carrier-hulk':'barovian-bloom/carrier-hulk.glb',
  'cyst-node':'barovian-bloom/cyst-node.glb', 'bloom-stalker':'barovian-bloom/bloom-stalker.glb', 'bloomed-wolf':'barovian-bloom/bloomed-wolf.glb',
  'srd-deer':['barovian-wilds/svalich-stag-healthy.glb', 'barovian-wilds/svalich-stag-bloomed.glb'],
  'srd-boar':['barovian-wilds/rootwood-boar-healthy.glb', 'barovian-wilds/rootwood-boar-bloomed.glb'],
  'srd-raven':['barovian-wilds/marsh-raven-healthy.glb', 'barovian-wilds/marsh-raven-bloomed.glb'],
};
const packTried = new Set();
function packKey(t){
  const f = t.bid && PACK_CREATURES[t.bid]; if (!f) return null;
  const file = Array.isArray(f) ? f[t.flags?.seeded || t.flags?.rising || t.flags?.bloomed ? 1 : 0] : f, key = 'pack:' + file;
  if (entries.has(key)) return key;
  if (!packTried.has(key) && gfx.models !== false && typeof location !== 'undefined' && location.protocol !== 'file:'){
    packTried.add(key);
    fetch('assets/creatures/' + file).then(r => r.ok ? r.arrayBuffer() : null).then(buf => buf && ingest(key, buf, file.split('/').pop())).catch(() => {});
  }
  return null;
}

// A model's bounds from its meshes' own geometry: a freshly cloned skinned model (an animated creature) measured
// through its bones collapses to a point and would be scaled up a thousandfold.
function meshBox(obj){
  obj.updateMatrixWorld(true); const box = new THREE.Box3();
  obj.traverse(o => { if (o.isMesh && o.geometry){ o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  return box.isEmpty() ? new THREE.Box3(new THREE.Vector3(-.5, 0, -.5), new THREE.Vector3(.5, 1, .5)) : box;
}
// A fresh copy of a model, standing on the mini's base and about one square tall. Plays its first animation.
export function instanceModel(key){
  const e = entries.get(key); if (!e) return null;
  const obj = SkeletonUtils.clone(e.scene);
  const box = meshBox(obj), size = box.getSize(new THREE.Vector3());
  const s = 1.05 / Math.max(size.y, size.x * .8, size.z * .8, .001);
  obj.scale.multiplyScalar(s);
  const b2 = meshBox(obj), c = b2.getCenter(new THREE.Vector3());
  obj.position.set(-c.x, .07 - b2.min.y, -c.z);
  const g = new THREE.Group(); g.add(obj);
  if (e.anims.length){
    const mixer = new THREE.AnimationMixer(obj);
    const idle = e.anims.find(a => /idle/i.test(a.name)) || e.anims[0];
    mixer.clipAction(idle).play(); g.userData.mixer = mixer;
  }
  obj.traverse(o => { if (o.isMesh){ o.castShadow = true; o.material = o.material.clone(); if (o.isSkinnedMesh) o.frustumCulled = false; } });   // (a moving skinned mesh's bounds go stale)
  return g;
}
