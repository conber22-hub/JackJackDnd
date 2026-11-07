/* GLB road models for Dread Delve / JackJackDnd, Three.js 0.169.0.
   Compatible with the existing 5ft world-unit grid. No gameplay or engine mutation.
   Rotation convention: rot=1 maps N->E (Three.js rotationY=-PI/2).
*/
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { ROAD_ASSETS } from './road-assets-index.js';

export function createBaroviaRoadAssets({baseURL='/assets/roads/',loader=new GLTFLoader()}={}){
  const cache=new Map();
  const base=baseURL.replace(/\/*$/,'/');
  function load(id){
    const spec=ROAD_ASSETS[id]; if(!spec)throw new RangeError(`Unknown road asset: ${id}`);
    if(!cache.has(id)) cache.set(id,loader.loadAsync(base+id+'.glb').then(g=>g.scene).catch(e=>{cache.delete(id);throw e;}));
    return cache.get(id);
  }
  async function instance(id){
    const spec=ROAD_ASSETS[id],root=(await load(id)).clone(true);
    root.userData={...root.userData,baroviaRoad:{id,style:spec.style,sockets:spec.sockets}};
    root.traverse(c=>{if(c.isMesh){c.castShadow=c.geometry?.boundingBox?.max.y>0.15;c.receiveShadow=true;}});
    return root;
  }
  /** parent: Three.Group or floorViews[L].group. Coordinate x,y here are 8-cell tile indices,
   *  not 5-ft walk tiles. For a default 40x40 VTT map, choose originX=0, originY=8 so the
   *  3-row ribbon sits centrally; a segment is 40 squares wide x 24 squares high.
   */
  async function place(parent,placement,{wx,wz,groundY=0,originX=0,originY=0}={}){
    if(typeof wx!=='function'||typeof wz!=='function')throw new TypeError('Pass scene.wx and scene.wz');
    const m=await instance(placement.id);
    m.rotation.y=-(placement.rot||0)*Math.PI/2;
    m.position.set(wx(originX+placement.x*8+3.5),groundY,wz(originY+placement.y*8+3.5));
    parent.add(m);return m;
  }
  async function placePlan(parent,tiles,options={}){
    if(!Array.isArray(tiles))throw new TypeError('Expected tiles array');
    await Promise.all([...new Set(tiles.map(p=>p.id))].map(load));
    // One scene group per segment for cheap removal on map switch.
    const group=new THREE.Group();group.name='Barovia Road Kit III';parent.add(group);
    try{await Promise.all(tiles.map(p=>place(group,p,options)));return group;}
    catch(e){parent.remove(group);throw e;}
  }
  /** Use only once every placed instance is removed; GPU resources are shared. */
  async function dispose(){
    const sources=await Promise.all(cache.values());const gs=new Set(),ms=new Set();
    for(const root of sources)root.traverse(c=>{if(c.isMesh){gs.add(c.geometry);for(const m of (Array.isArray(c.material)?c.material:[c.material]))if(m)ms.add(m);}});
    for(const g of gs)g.dispose();for(const m of ms)m.dispose();cache.clear();
  }
  return {load,instance,place,placePlan,dispose};
}
