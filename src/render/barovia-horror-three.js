/* Optional Three.js visualization adapter. Install separately from the pure engine planner.
 * This has no application global imports and never edits Dread Delve's world/collision grid.
 * Three.js 0.169.0.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ASSET_BY_ID } from './horror-assets-index.js';

export function createHorrorRenderer({baseURL='/assets/horror/',loader=new GLTFLoader()}={}){
 const templates=new Map(),pending=new Map(),owned=new Set();
 async function model(id){
  if(!ASSET_BY_ID.has(id))throw new RangeError(`Unknown Barovia horror asset: ${id}`);
  if(templates.has(id))return templates.get(id);
  if(pending.has(id))return pending.get(id);
  const url=`${baseURL.replace(/\/$/,'')}/${id}.glb`;
  const task=loader.loadAsync(url).then(g=>{templates.set(id,g.scene);pending.delete(id);return g.scene;}).catch(e=>{pending.delete(id);throw e;});
  pending.set(id,task);return task;
 }
 // World coordinate helpers passed from existing scene.js: wx(x), wz(y), floorY(level).
 async function attach(floorGroup,plan,{wx=x=>x,wz=y=>y,groundY=0,limit=48}={}){
  if(!floorGroup||!Array.isArray(plan?.placements))throw new TypeError('Need group and a horror plan');
  const g=new THREE.Group();g.name=`Barovia horror: ${plan.roadId}`;floorGroup.add(g);owned.add(g);
  try{
   for(const p of plan.placements.slice(0,Math.max(0,limit))){
    const template=await model(p.id),instance=template.clone(true);
    instance.position.set(wx(p.x),groundY,wz(p.y));instance.rotation.y=-p.rot*Math.PI/2;
    instance.userData.horrorId=p.id;instance.userData.gameplayCollision=false;
    instance.traverse(x=>{if(x.isMesh){x.castShadow=false;x.receiveShadow=true;}});
    g.add(instance);
   }
  }catch(e){g.removeFromParent();owned.delete(g);throw e;}
  return g;
 }
 function detach(group){if(group){group.removeFromParent();owned.delete(group);}}
 function dispose(){
  for(const group of owned)group.removeFromParent();owned.clear();
  for(const obj of templates.values())obj.traverse(x=>{if(x.isMesh){x.geometry.dispose();
    for(const m of (Array.isArray(x.material)?x.material:[x.material]))m?.dispose();}});
  templates.clear();pending.clear();
 }
 return {model,attach,detach,dispose};
}
