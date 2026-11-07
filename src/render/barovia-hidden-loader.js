/* Opt-in, visual-only 3D loader for Barovia V. Do NOT instantiate on unvisited maps.
 * Imported by an integration hook after Claude merges. Not auto-bootstrapped.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HIDDEN_SITE_BY_ID } from './barovia-hidden-data.js';

const loader=new GLTFLoader(),cache=new Map();
export function hiddenAssetURL(id){
 if(!/^[a-z0-9_]+_(sealed|revealed)$/.test(id)||!HIDDEN_SITE_BY_ID[id.replace(/_(sealed|revealed)$/,'')])throw new RangeError('Unknown asset id');
 return `/assets/hidden-sites/${id}.glb`;
}
export function loadHiddenAsset(id){
 if(!cache.has(id))cache.set(id,loader.loadAsync(hiddenAssetURL(id)).then(g=>g.scene).catch(e=>{cache.delete(id);throw e;}));
 return cache.get(id).then(s=>s.clone(true));
}
export async function mountHiddenVisual(parent,item,{xWorld=x=>x,zWorld=z=>z,yWorld=()=>0}={}){
 const s=HIDDEN_SITE_BY_ID[item.id];if(!s)throw new RangeError('Unknown site id');
 if(!parent?.isObject3D)throw new TypeError('parent must be a THREE.Object3D');
 const anchor=new THREE.Group();anchor.name=`barovia-site:${item.id}`;
 anchor.position.set(xWorld(item.x+(item.w-1)/2),yWorld(item),zWorld(item.y+(item.h-1)/2));parent.add(anchor);
 let generation=0,removed=false,shown=null;
 async function change(revealed){
  if(removed)return;
  const n=++generation;const mesh=await loadHiddenAsset(`${item.id}_${revealed?'revealed':'sealed'}`);
  if(removed||n!==generation)return;
  anchor.clear();anchor.add(mesh);shown=Boolean(revealed);
 }
 try{await change(Boolean(item.revealed));}catch(e){parent.remove(anchor);throw e;}
 return { group:anchor, get revealed(){return shown;},setRevealed:change,dispose(){removed=true;generation++;parent.remove(anchor);anchor.clear();} };
}
// No mesh/material.dispose here: downloaded geometry and materials are cache-shared.
