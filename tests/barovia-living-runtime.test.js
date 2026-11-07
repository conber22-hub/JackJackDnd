import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as THREE from './barovia-living-mock-three.mjs';

const sourceURL = new URL('../src/render/barovia-living-three.js',import.meta.url);
const stateURL=new URL('../src/render/barovia-living-state.js',import.meta.url);
const mockURL = new URL('./barovia-living-mock-three.mjs',import.meta.url);
const code=readFileSync(sourceURL,'utf8')
  .replace("from 'three'",`from '${mockURL.href}'`)
  .replace("from './barovia-living-state.js'",`from '${stateURL.href}'`);
const {createLivingValley}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

test('runtime creates one fog mesh, one snow draw, and multiple independent water surfaces',()=>{
  const parent=new THREE.Group(),layer=createLivingValley({parent,width:28,height:28,seed:'mist',quality:'low',biome:'tserBog'});
  const f=layer.addGroundFog(),s=layer.addSnowfall(),w=layer.addBlackwater({x:2,z:3,w:5,h:4,opacity:.33});
  assert.equal(f.geometry.attributes.aPhase.array.length,14*4);
  assert.equal(s.geometry.attributes.position.array.length,180*3);
  assert.equal(w.material.uniforms.uOpacity.value,.33);
  assert.equal(parent.children.length,3);
  assert.equal(layer.addGroundFog(),f);
  assert.equal(layer.addSnowfall(),s);
  layer.setWind(.9);layer.setDread(9);layer.setFogStrength(.2);
  layer.setFogEnabled(false);layer.setSnowEnabled(true);layer.update(8.5);
  assert.equal(f.visible,false);assert.equal(s.visible,true);
  assert.equal(f.material.uniforms.uTime.value,8.5);
  assert.equal(w.material.uniforms.uWind.value,.9);
  assert.equal(w.material.uniforms.uDread.value,9);
  assert.equal(layer.info.water,1);
  layer.dispose();assert.equal(parent.children.length,0);
  assert.equal(f.geometry.disposeCount,1);assert.equal(f.material.disposeCount,1);
  assert.equal(w.geometry.disposeCount,1);assert.equal(w.material.disposeCount,1);
  assert.equal(layer.info.disposed,true);
  assert.throws(()=>layer.addBlackwater(),/disposed/);
});

test('existing GLB tree ownership and materials are restored on detach/dispose',()=>{
  const parent=new THREE.Group(),l=createLivingValley({parent,width:20,height:20,quality:'high'});
  const tree=new THREE.Group(),original=new THREE.MeshStandardMaterial({roughness:.95});
  const branch=new THREE.Mesh(new THREE.BufferGeometry(),original);tree.add(branch);
  assert.equal(l.attachTree(tree,{id:'svalich_black_fir',seedKey:'22,14'}),true);
  assert.notEqual(branch.material,original);
  assert.equal(l.attachTree(tree,{id:'svalich_black_fir'}),true);
  assert.equal(l.info.trees,1);
  assert.equal(l.attachTree(new THREE.Group(),{id:'tser_blackwater_pool'}),false);
  l.setWind(.7);l.update(6.2);assert.notEqual(tree.rotation.z,0);
  assert.equal(l.detachTree(tree),true);assert.equal(branch.material,original);assert.equal(tree.rotation.z,0);
  l.attachTree(tree,{id:'windworn_fir'});l.dispose();
  assert.equal(branch.material,original);assert.equal(original.disposeCount,0);
  assert.equal(branch.geometry.disposeCount,0);
});

test('moss instancing follows seeded stages without recreating or mutating game tiles',()=>{
  const parent=new THREE.Group(),layer=createLivingValley({parent,width:20,height:20,seed:'forest',quality:'medium'});
  const reachable=(x,y)=>x<10;
  const m=layer.addHungerMoss({origins:[{x:3,y:4}],allowed:reachable,step:0});
  assert.ok(m.cells.length>20);assert.ok(m.cells.every(c=>c.x<10));
  assert.equal(m.pads.count,1);assert.equal(m.buds.count,3);
  const prior=layer.setMossStep(5);
  assert.ok(prior>1);assert.equal(m.buds.count,prior*3);
  layer.update(50);assert.ok(m.budMat.emissiveIntensity>0);
  assert.equal(layer.setMossStep(12),m.cells.length);
  layer.dispose();assert.equal(m.pads.geometry.disposeCount,1);
  assert.equal(m.buds.geometry.disposeCount,1);
});

test('independent layers do not mutate each other or share effect-owned GPU resources',()=>{
  const a=createLivingValley({parent:new THREE.Group(),width:10,height:10,biome:'svalichWoods'});
  const b=createLivingValley({parent:new THREE.Group(),width:10,height:10,biome:'winterForest'});
  const af=a.addGroundFog(),bf=b.addGroundFog();
  a.update(2);b.update(7);
  assert.equal(af.material.uniforms.uTime.value,2);
  assert.equal(bf.material.uniforms.uTime.value,7);
  a.dispose();assert.equal(b.info.disposed,false);b.dispose();
});
