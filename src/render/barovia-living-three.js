/* THE LIVING VALLEY II — scenic Three.js atmosphere for Dread Delve / JackJackDnd.
   Designed for Three.js 0.169.0: 1 unit = 5 feet; +Y up.
   No DOM, no clocks, no gameplay mutations. The host drives update(absoluteSeconds).
   Owns ONLY the scenery effects it creates. Existing GLB models are never disposed.
*/
import * as THREE from 'three';
import { ATMOSPHERES, QUALITY, seeded, planGroundFog, planSnow, planHungerMoss } from './barovia-living-state.js';

const TAU=Math.PI*2, clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const TREES=new Set(['svalich_black_fir','windworn_fir','snow_crowned_fir','hunger_taken_fir',
  'crooked_oak','pale_birch_thicket','hollow_witch_tree']);
const FOG_VERTEX=`
  attribute float aPhase; attribute float aStrength;
  uniform float uTime; uniform float uWind;
  varying vec2 vUv; varying float vPhase; varying float vStrength;
  void main(){
    vUv=uv;vPhase=aPhase;vStrength=aStrength;
    vec3 p=position;
    p.x+=sin(uTime*.14+aPhase)*.13*uWind;
    p.z+=cos(uTime*.09+aPhase*1.7)*.08*uWind;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  }`;
const FOG_FRAGMENT=`
  uniform float uTime;uniform float uOpacity;uniform vec3 uColor;
  varying vec2 vUv; varying float vPhase;varying float vStrength;
  void main(){
    vec2 p=(vUv-.5)*vec2(1.0,1.13);
    float radius=length(p);
    float edge=1.-smoothstep(.18,.52,radius);
    float layer=.80+.20*sin(p.x*9.5+uTime*.20+vPhase)*cos(p.y*7.4-uTime*.10+vPhase);
    float wisps=.80+.20*sin(p.x*16.0+p.y*11.0+vPhase+uTime*.11);
    float opacity=edge*layer*wisps*vStrength*uOpacity;
    gl_FragColor=vec4(uColor,opacity);
  }`;
const WATER_VERTEX=`
  varying vec2 vUv;
  void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const WATER_FRAGMENT=`
  uniform float uTime;uniform float uWind;uniform float uDread;uniform float uOpacity;
  varying vec2 vUv;
  void main(){
    vec2 uv=vUv;
    float a=sin(uv.x*36.+uv.y*20.+uTime*(.4+uWind*.25));
    float b=cos(uv.y*46.-uv.x*11.-uTime*(.3+uWind*.3));
    float c=sin(length(uv-.35)*67.-uTime*1.17);
    float ripples=(a*.34+b*.33+c*.33)*.5+.5;
    float moon=pow(max(0.,a*.6+b*.4),7.)*.16;
    vec3 dark=vec3(.014,.032,.037);
    vec3 light=vec3(.06,.105,.105);
    vec3 water=mix(dark,light,ripples)+vec3(.10,.13,.14)*moon;
    water=mix(water,vec3(.115,.026,.042),clamp((uDread-7.)/3.,0.,1.)*.18);
    float edge=1.-smoothstep(.43,.5,max(abs(uv.x-.5),abs(uv.y-.5)));
    gl_FragColor=vec4(water, (.62+.26*edge)*uOpacity);
  }`;
const SNOW_VERTEX=`
  attribute float aSpeed;attribute float aSize;attribute float aPhase;
  uniform float uTime;uniform float uWind;uniform float uWidth;uniform float uDepth;
  uniform float uHeight;uniform float uPointScale;
  varying float vOpacity;
  void main(){
    vec3 p=position;
    p.y=mod(p.y-uTime*aSpeed+uHeight*2048.,uHeight);
    p.x=mod(p.x+uWidth*.5+uTime*uWind*.14*aSpeed+uWidth*2048.,uWidth)-uWidth*.5;
    p.z+=sin(uTime*.37+aPhase)*.16*uWind;
    vec4 mv=modelViewMatrix*vec4(p,1.);
    gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp(uPointScale*aSize/max(1.,-mv.z),1.0,6.0);
    vOpacity=.46+.32*sin(aPhase+uTime*.34);
  }`;
const SNOW_FRAGMENT=`
  uniform vec3 uColor;varying float vOpacity;
  void main(){float d=length(gl_PointCoord-.5);
    float alpha=(1.-smoothstep(.20,.49,d))*vOpacity;
    gl_FragColor=vec4(uColor,alpha);
  }`;

function fogGeometry(patches){
  const p=[],uv=[],ph=[],str=[],idx=[];
  for(const f of patches){
    const index=p.length/3,rx=f.radius,rz=f.radius*f.stretch;
    p.push(f.x-rx,f.y,f.z-rz,f.x+rx,f.y,f.z-rz,f.x+rx,f.y,f.z+rz,f.x-rx,f.y,f.z+rz);
    uv.push(0,0,1,0,1,1,0,1);
    for(let k=0;k<4;k++){ph.push(f.phase);str.push(f.opacity);}
    idx.push(index,index+1,index+2,index,index+2,index+3);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setAttribute('aPhase',new THREE.Float32BufferAttribute(ph,1));
  g.setAttribute('aStrength',new THREE.Float32BufferAttribute(str,1));
  g.setIndex(idx);g.computeBoundingSphere();return g;
}
function snowyGeometry(points){
  const xyz=[],speeds=[],sizes=[],phases=[];
  for(const p of points){xyz.push(p.x,p.y,p.z);speeds.push(p.speed);sizes.push(p.size);phases.push(p.phase);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
  g.setAttribute('aSpeed',new THREE.Float32BufferAttribute(speeds,1));
  g.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  g.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));return g;
}
const centerGrid=(x,w)=>x-(w-1)/2;

/**
 * Create one independent scenery layer per visible outdoor map.
 * @param {object} cfg
 * @param {THREE.Object3D} cfg.parent — normally floorViews[L].group or a disposable sub-group.
 * @param {string} cfg.seed — stable seed, ideally map ID + floor ID, shared by all peers.
 * @param {number} cfg.width grid cells
 * @param {number} cfg.height grid cells
 * @param {'low'|'medium'|'high'} cfg.quality
 * @param {string} cfg.biome from ATMOSPHERES
 * @param {number} cfg.groundY y of terrain inside the passed parent (usually 0 for floorViews)
 */
export function createLivingValley({parent,width,height,seed='svalich',biome='svalichWoods',
  quality='medium',groundY=0,wind=null,showFog=true,showSnow=null,enableCanopyBend=true}={}){
  if(!parent || typeof parent.add!=='function'||typeof parent.remove!=='function')
    throw new TypeError('Pass a THREE.Group or Scene as parent');
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>512||height>512)
    throw new RangeError('Invalid map dimensions');
  const budget=QUALITY[quality],preset=ATMOSPHERES[biome];
  if(!budget||!preset)throw new RangeError('Unknown quality or biome');
  if(!Number.isFinite(groundY))throw new TypeError('Invalid groundY');
  const owned=[],trees=new Map(),patchCache=new WeakMap(),patchedMaterials=new Set(),water=[];
  const time={value:0},windUniform={value:clamp(wind??preset.wind,0,1)},dreadUniform={value:1};
  const rng=seeded('trees|'+seed),fogUniform={value:preset.fog},fogColor={value:new THREE.Color(preset.tint)};
  let disposed=false,fog=null,snow=null,moss=null;
  const assertAlive=()=>{if(disposed)throw new Error('Living Valley layer has been disposed');};
  const add=obj=>{parent.add(obj);owned.push(obj);return obj;};

  function addGroundFog({count=budget.fogPatches,allowed=()=>true}={}){
    assertAlive();if(fog)return fog;
    const cells=planGroundFog({width,height,seed,count,groundY,allowed});
    const material=new THREE.ShaderMaterial({uniforms:{uTime:time,uWind:windUniform,
      uOpacity:fogUniform,uColor:fogColor},vertexShader:FOG_VERTEX,fragmentShader:FOG_FRAGMENT,
      transparent:true,depthWrite:false,side:THREE.DoubleSide});
    fog=add(new THREE.Mesh(fogGeometry(cells),material));
    fog.name='Barovia · rolling ground fog';fog.visible=showFog;
    return fog;
  }
  function addBlackwater({x=0,z=0,w=5,h=5,y=groundY+.025,opacity=1}={}){
    assertAlive();if(![x,z,w,h,y,opacity].every(Number.isFinite)||w<=0||h<=0||opacity<0||opacity>1)
      throw new RangeError('Invalid blackwater bounds');
    // The dark water replaces no tiles: place it only over known water squares.
    const material=new THREE.ShaderMaterial({uniforms:{uTime:time,uWind:windUniform,uDread:dreadUniform,uOpacity:{value:opacity}},
      vertexShader:WATER_VERTEX,fragmentShader:WATER_FRAGMENT,transparent:true,depthWrite:false,
      side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.name='Barovia · living blackwater';
    water.push(mesh);return add(mesh);
  }
  function addSnowfall({count=budget.snowflakes,skyHeight=12,enabled=showSnow??preset.snow}={}){
    assertAlive();if(snow)return snow;
    const points=planSnow({width,height,seed,count,skyHeight});
    const material=new THREE.ShaderMaterial({uniforms:{uTime:time,uWind:windUniform,
      uWidth:{value:width},uDepth:{value:height},uHeight:{value:skyHeight},
      uPointScale:{value:quality==='low'?37:52},uColor:{value:new THREE.Color('#e4eaf0')}},
      vertexShader:SNOW_VERTEX,fragmentShader:SNOW_FRAGMENT,
      transparent:true,depthWrite:false,blending:THREE.NormalBlending});
    snow=add(new THREE.Points(snowyGeometry(points),material));
    snow.position.y=groundY+.08;snow.frustumCulled=false;snow.visible=!!enabled;
    snow.name='Barovia · drifting GPU snow';return snow;
  }
  function setSnowEnabled(enabled){assertAlive();if(snow)snow.visible=!!enabled;}
  function setFogEnabled(enabled){assertAlive();if(fog)fog.visible=!!enabled;}
  function setFogStrength(value){assertAlive();if(!Number.isFinite(value))throw new TypeError('Bad fog strength');fogUniform.value=clamp(value,0,1);}
  function setWind(value){assertAlive();if(!Number.isFinite(value))throw new TypeError('Bad wind strength');windUniform.value=clamp(value,0,1);}
  function setDread(value){
    assertAlive();if(!Number.isFinite(value))throw new TypeError('Bad dread');dreadUniform.value=clamp(value,1,10);
    fogColor.value.set(preset.tint).lerp(new THREE.Color('#a66d73'),clamp((value-6)/4,0,1)*.35);
  }

  // Tree branches bend in the vertex shader. The loaded GLB geometry is shared and untouched.
  // All shader variants are cached by original material to avoid a unique GPU program per tree.
  function materialFor(original){
    let variant=patchCache.get(original);if(variant)return variant;
    variant=original.clone();
    const before=original.onBeforeCompile;
    variant.onBeforeCompile=(shader,renderer)=>{
      if(typeof before==='function')before(shader,renderer);
      shader.uniforms.uLivingTime=time;shader.uniforms.uLivingWind=windUniform;
      if(!shader.vertexShader.includes('#include <common>')||!shader.vertexShader.includes('#include <begin_vertex>'))return;
      shader.vertexShader=shader.vertexShader.replace('#include <common>',
        '#include <common>\nuniform float uLivingTime;\nuniform float uLivingWind;');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float baroviaTip=pow(smoothstep(.25,2.4,transformed.y),1.6);
        transformed.x+=(sin(uLivingTime*.84+transformed.y*1.6+transformed.x*2.0)*.041+
                         cos(uLivingTime*.48+transformed.z*1.6)*.022)*baroviaTip*uLivingWind;
        transformed.z+=cos(uLivingTime*.63+transformed.y*1.5+transformed.z*1.9)*.026*baroviaTip*uLivingWind;
      `);
    };
    variant.customProgramCacheKey=()=> 'barovia-sway-vertex-v1';
    patchCache.set(original,variant);patchedMaterials.add(variant);return variant;
  }
  /** Register an existing Pack I GLB tree. Caller owns the tree model and its cache. */
  function attachTree(object,{id='svalich_black_fir',seedKey=null,amplitude=1}={}){
    assertAlive();if(!TREES.has(id))return false;
    if(!object||typeof object.traverse!=='function'||!object.rotation)throw new TypeError('Expected Object3D');
    if(trees.has(object))return true;
    const meshes=[];
    if(enableCanopyBend&&quality!=='low')object.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.material)return;
      const original=mesh.material;
      mesh.material=Array.isArray(original)?original.map(materialFor):materialFor(original);
      meshes.push({mesh,original});
    });
    trees.set(object,{x:object.rotation.x,z:object.rotation.z,phase:seedKey==null?rng()*TAU:seeded(seed+'|tree|'+seedKey)()*TAU,
      amplitude:clamp(Number.isFinite(amplitude)?amplitude:1,0,3),meshes});
    return true;
  }
  function detachTree(object){const record=trees.get(object);if(!record)return false;
    object.rotation.x=record.x;object.rotation.z=record.z;
    for(const {mesh,original} of record.meshes)mesh.material=original;
    trees.delete(object);return true;
  }

  function addHungerMoss({origins=[{x:Math.floor(width/2),y:Math.floor(height/2)}],
    maxSteps=12,maxCells=140,allowed=()=>true,step=0,wx=null,wz=null}={}){
    assertAlive();if(moss)return moss;
    const cells=planHungerMoss({width,height,seed,origins,maxSteps,maxCells,allowed});
    const plants=budget.mossPlantsPerCell;
    const padGeo=new THREE.IcosahedronGeometry(.21,1);
    const budGeo=new THREE.IcosahedronGeometry(.10,1);
    const padMat=new THREE.MeshStandardMaterial({color:'#40594a',roughness:.94,
      emissive:new THREE.Color('#244b38'),emissiveIntensity:.18});
    const budMat=new THREE.MeshStandardMaterial({color:'#8fd9ad',roughness:.65,
      emissive:new THREE.Color('#39d98b'),emissiveIntensity:.95});
    const pads=new THREE.InstancedMesh(padGeo,padMat,cells.length);
    const buds=new THREE.InstancedMesh(budGeo,budMat,cells.length*plants);
    const group=add(new THREE.Group());group.name='Barovia · Hunger Moss growth';
    group.add(pads,buds);pads.frustumCulled=false;buds.frustumCulled=false;
    const dummy=new THREE.Object3D();
    const localRng=seeded('growth|' + seed);
    for(let i=0;i<cells.length;i++){
      const c=cells[i],x=wx?wx(c.x):centerGrid(c.x,width),z=wz?wz(c.y):centerGrid(c.y,height);
      dummy.position.set(x+(localRng()-.5)*.2,groundY+.025,z+(localRng()-.5)*.2);
      dummy.rotation.set(0,localRng()*TAU,0);dummy.scale.set(.74+localRng()*.8,.19+localRng()*.25,.75+localRng()*.8);
      dummy.updateMatrix();pads.setMatrixAt(i,dummy.matrix);
      for(let n=0;n<plants;n++){
        const k=i*plants+n,a=localRng()*TAU,r=.1+localRng()*.36;
        dummy.position.set(x+Math.cos(a)*r,groundY+.08+localRng()*.19,z+Math.sin(a)*r);
        dummy.scale.setScalar(.55+localRng()*.85);dummy.rotation.set(0,localRng()*TAU,0);
        dummy.updateMatrix();buds.setMatrixAt(k,dummy.matrix);
        buds.setColorAt(k,new THREE.Color().setHSL(.35+localRng()*.09,.45+.18*localRng(),.5+localRng()*.21));
      }
    }
    pads.instanceMatrix.needsUpdate=true;buds.instanceMatrix.needsUpdate=true;
    if(buds.instanceColor)buds.instanceColor.needsUpdate=true;
    moss={group,cells,pads,buds,padMat,budMat,plants,setStep(value){
      if(!Number.isFinite(value)||value<0)throw new RangeError('Bad moss stage');
      // Cells are sorted by arrival stage; reveal only the leading contiguous prefix.
      let n=0;while(n<cells.length&&cells[n].step<=value)n++;
      pads.count=n;buds.count=n*plants;return n;
    }};
    moss.setStep(step);return moss;
  }
  function setMossStep(step){assertAlive();return moss?.setStep(step)??0;}

  /** Absolute time in seconds, so host pause/resume does not accumulate drift. */
  function update(seconds){
    if(disposed)return;
    if(!Number.isFinite(seconds))throw new TypeError('Pass absolute seconds to update');
    time.value=seconds;
    for(const [object,r] of trees){
      const force=windUniform.value*r.amplitude;
      object.rotation.x=r.x+Math.sin(seconds*.61+r.phase)*.013*force;
      object.rotation.z=r.z+Math.cos(seconds*.83+r.phase*1.2)*.021*force;
    }
    if(moss){moss.budMat.emissiveIntensity=.8+.27*(1+Math.sin(seconds*1.72));
      moss.padMat.emissiveIntensity=.14+.08*(1+Math.sin(seconds*.62));}
  }
  /** Dispose only the effect-created geometries/materials, never the GLB model cache. */
  function dispose(){
    if(disposed)return;
    for(const object of trees.keys())detachTree(object);
    for(const object of owned){object.parent?.remove(object);
      object.traverse(child=>{child.geometry?.dispose?.();
        const mats=Array.isArray(child.material)?child.material:[child.material];
        for(const m of mats)if(m)m.dispose?.();});}
    for(const material of patchedMaterials)material.dispose();
    owned.length=0;water.length=0;disposed=true;
  }
  return {addGroundFog,addBlackwater,addSnowfall,addHungerMoss,attachTree,detachTree,
    setWind,setDread,setFogEnabled,setFogStrength,setSnowEnabled,setMossStep,update,dispose,
    get info(){return {biome,quality,trees:trees.size,water:water.length,fog:!!fog,snow:!!snow,
      mossCells:moss?.cells.length||0,wind:windUniform.value,disposed};}};
}
