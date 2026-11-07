/* Opt-in Three.js replacement renderer for existing solid building shells.
 * No collision/navigation/occlusion mutations. Never automatically hides the source
 * structures. Integration must provide hideOriginal() to avoid z-fighting.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VILLAGE_ARCHETYPE_BY_ID, VILLAGE_MODEL_ROOT } from '../data/barovia-dead-villages-data.js';
const loader=new GLTFLoader(), cache=new Map();
const allowed=new Set(Object.values(VILLAGE_ARCHETYPE_BY_ID).flatMap(a=>Object.values(a.states)));
export function loadDeadVillageModel(file){
 if(!allowed.has(file))throw new RangeError('Unknown village GLB');
 if(!cache.has(file))cache.set(file,loader.loadAsync(VILLAGE_MODEL_ROOT+file).then(g=>g.scene).catch(e=>{cache.delete(file);throw e;}));
 return cache.get(file).then(obj=>obj.clone(true));
}
export async function mountDeadVillage(parent,plan,{hideOriginal=null,floorY=0}={}){
 if(!parent?.isObject3D)throw new TypeError('Expected a THREE.Object3D parent');
 if(!plan?.visualOnly||!Array.isArray(plan.skins))throw new TypeError('Expected village skin plan');
 if(typeof hideOriginal!=='function')throw new TypeError('Provide hideOriginal(buildingIndex, visible=false), to avoid a double-drawn building');
 const holder=new THREE.Group();holder.name=`dead-village:${plan.settlementId}`;
 const records=new Map();let disposed=false;const changed=[];
 try{
  for(const b of plan.skins){
   const source=await loadDeadVillageModel(b.model);
   if(disposed)break;
   const obj=new THREE.Group();obj.name=`skin:${b.id}`;source.rotation.y=(b.rot||0)*Math.PI/2;
   source.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(source),size=new THREE.Vector3();box.getSize(size);
   const sx=(b.w-.10)/Math.max(size.x,.001),sz=(b.h-.10)/Math.max(size.z,.001);
   // The geometry is designed in world units. Scale only to match the existing
   // footprint: never spill onto adjacent road squares or alter door geometry.
   source.scale.set(sx,Math.min(sx,sz),sz);
   source.updateMatrixWorld(true);
   const after=new THREE.Box3().setFromObject(source),center=after.getCenter(new THREE.Vector3());
   source.position.x-=center.x;source.position.z-=center.z;source.position.y-=after.min.y;
   obj.add(source);
   obj.position.set(b.x+b.w/2-plan.W/2,floorY,b.y+b.h/2-plan.H/2);
   holder.add(obj);records.set(b.id,obj);
  }
  parent.add(holder);
  // This adapter must toggle renderer objects only, never modify layout.buildings.
  for(const b of plan.skins){hideOriginal(b.buildingIndex,false);changed.push(b.buildingIndex);}
 }catch(e){for(const i of changed)hideOriginal(i,true);parent.remove(holder);throw e;}
 return {group:holder,dispose(){if(disposed)return;disposed=true;parent.remove(holder);for(const i of changed)hideOriginal(i,true);holder.clear();},
   async replace(next){if(disposed)throw new Error('disposed');if(next.settlementId!==plan.settlementId||next.skins.length!==plan.skins.length)throw new RangeError('Different settlement');
     const loads=await Promise.all(next.skins.map(s=>loadDeadVillageModel(s.model)));
     // Caller should dispose+remount for major layout transforms. State swaps keep the same wrapper.
     next.skins.forEach((s,i)=>{const obj=records.get(s.id),prev=obj.children[0],replacement=loads[i];replacement.rotation.y=(s.rot||0)*Math.PI/2;
       replacement.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(replacement),sz=bb.getSize(new THREE.Vector3());
       replacement.scale.set((s.w-.10)/Math.max(.001,sz.x),prev.scale.y,(s.h-.10)/Math.max(.001,sz.z));replacement.updateMatrixWorld(true);
       const box=new THREE.Box3().setFromObject(replacement),c=box.getCenter(new THREE.Vector3());replacement.position.set(-c.x,-box.min.y,-c.z);
       obj.clear();obj.add(replacement);
     });
   }};
}
