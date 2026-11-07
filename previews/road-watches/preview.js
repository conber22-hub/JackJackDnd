/* Runnable ownership-safe renderer adapter. Imports native scene/floor/fog/
   weather/quality systems; never replaces the map or reveals a route itself. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {setState,state,ui} from '/src/engine/state.js';
import {layoutFloor} from '/src/engine/generator.js';
import {passMove} from '/src/engine/grid.js';
import {daylight} from '/src/engine/daylight.js';
import {discoverTrailhead,trailsForPlayers} from '/src/engine/road-exploration.js';
import {planRoadWatches,roadWatchesForPlayers} from '/src/engine/road-watches.js';
import {showcase,shortcutProof,SEED} from './showcases.js';
const params=new URLSearchParams(location.search),manifest=await fetch('/assets/road-watches/manifest.json').then(r=>r.json());
setState({meta:{size:40},floors:[],tokens:[],explored:{0:new Set()},campaign:{weather:'Low mist',valley:{seed:SEED,day:1,hour:15}},hour:15,dread:3,content:{},log:[],characters:{},combat:{active:false}});
const {renderer,scene,camera,controls,ambient,hemi,moon,wx,wz}=await import('/src/render/scene.js');
const {buildFloor,ensureFloorViews,floorViews}=await import('/src/render/floors.js');
const {gfx,setGfx,shadowsOn,onGfx}=await import('/src/render/gfx.js');
onGfx(()=>{renderer.shadowMap.enabled=shadowsOn();renderer.shadowMap.type=THREE.PCFSoftShadowMap;});
const {updateAmbience}=await import('/src/render/ambience.js');
const {updateOmens}=await import('/src/render/omens.js');
const {renderFrame}=await import('/src/render/post.js');
const models=new Map(),palette=new Map(),loader=new GLTFLoader(),assetGroup=new THREE.Group();scene.add(assetGroup);
window.validation={loaded:[],errors:[],renders:[]};
for(const a of manifest.assets){
 const gltf=await loader.loadAsync(a.file);let triangles=0,bad=false,meshes=0;
 gltf.scene.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count ?? o.geometry.attributes.position.count)/3;for(const v of o.geometry.attributes.position.array)if(!Number.isFinite(v))bad=true;
  if(!palette.has(o.material.name))palette.set(o.material.name,o.material);o.material=palette.get(o.material.name);o.castShadow=o.receiveShadow=true;});
 const box=new THREE.Box3().setFromObject(gltf.scene);if(bad || !meshes || triangles!==a.triangles || Math.abs(box.min.y)>.0001)throw Error(`Invalid GLB: ${a.id}`);
 models.set(a.id,gltf.scene);window.validation.loaded.push({id:a.id,triangles,meshes,bounds:box.min.toArray().concat(box.max.toArray())});
}
let current,plan,view='forward',discovered=false,frameTime=0,mode='fork',stage='early',quality='medium',treatment='dry';
ui.roomLabels=false;ui.role='player';
function style(model){model.traverse(o=>{if(!o.isMesh)return;const key=o.material.name+':'+treatment;if(!palette.has(key)){const m=o.material.clone();if(treatment==='wet'){m.color.multiplyScalar(.78);m.roughness*=.65;}if(treatment==='cold')m.color.lerp(new THREE.Color('#b6c4c6'),.28);if(treatment==='infected')m.color.lerp(new THREE.Color('#596b48'),.25);palette.set(key,m);}o.material=palette.get(key);});}
function installAssets(visible){assetGroup.clear();for(const p of visible){const model=models.get(p.asset).clone(true);style(model);model.position.set(wx(p.x),.01,wz(p.y));model.rotation.y=-p.rot;model.userData.placement=p;assetGroup.add(model);}}
function focus(){
 const f=state.floors[0],event=f.events.find(e=>e.trailhead),cross=f.props.find(p=>p.k==='bridge'),shallow=f.shallow?.[Math.floor((f.shallow?.length || 0)/2)],path=current.spec.layout.paths[0].pts;
 const at=mode==='berez'?(cross || (shallow!=null?{x:shallow%40,y:shallow/40|0}:null)):event;
 let x=at?.x ?? path[Math.floor(path.length/4)*2],y=at?.y ?? path[Math.floor(path.length/4)*2+1];
 if(mode==='fork' && event){const spur=current.spec.layout.paths.find(p=>p.pts.at(-2)===event.x&&p.pts.at(-1)===event.y);if(spur){x=(spur.pts[0]+event.x)/2;y=(spur.pts[1]+event.y)/2;}}
 if(mode==='woods'){x=path[Math.min(path.length-2,4)];y=path[Math.min(path.length-1,5)];}
 const sign=view==='forward'?1:-1,ratio=innerWidth<600?1.15:1;controls.target.set(wx(x),.15,wz(y));camera.position.set(wx(x)+sign*7*ratio,10.5*ratio,wz(y)+sign*9*ratio);controls.update();
}
function build(){
 current=showcase(mode,params.get('seed') || SEED);const f=layoutFloor(0,40,40,current.spec,null,true);state.floors=[f];
 const trailhead=f.events.find(e=>e.trailhead);if(discovered && trailhead)current.book=discoverTrailhead(current.book,trailhead.trailhead);
 // This isolated preview exposes the surveyed stretch, never the hidden far-end
 // topology: player assets also pass explicit discovery gating below.
 state.explored[0]=new Set(Array.from({length:1600},(_,i)=>i));
 state.campaign.wx={kind:mode==='berez'?'rain':'fog',ground:mode==='berez'?'rain':''};
 plan=planRoadWatches(f,current.spec,manifest,{seed:current.seed,discovered,stage});
 f.clear=[...(f.clear || []),...plan.clear.map(([x,y])=>y*f.W+x)];
 ensureFloorViews();buildFloor(0);
 const explored=state.explored[0];const visible=roadWatchesForPlayers(plan,{explored:[...explored].map(i=>`${i%40},${i/40|0}`),discovered});
 installAssets(visible);focus();
 document.querySelector('#show').value=mode;document.querySelector('#growth').value=stage;document.querySelector('#quality').value=gfx.quality;document.querySelector('#treatment').value=treatment;
 document.querySelector('#status').textContent=`${mode==='fork'?'Vallaki–Krezk fork':mode==='woods'?'Svalich Woods side trail':'Wet crossing near Berez'} · ${current.seed} · ${view} · ${visible.length} assets · ${discovered?'fork reached':'unreached fork; no openings shown'}`;
 window.validation.renders.push({mode,view,discovered,placements:visible.length});window.current={plan,floor:f,book:current.book,visible};
}
// Native passMove checks a real path to the actual trailhead before preview
// discovery. This is not the live game's host authorisation or map switching.
function walkToFork(){const f=state.floors[0],e=f.events.find(e=>e.trailhead);if(!e)return false;const pts=current.spec.layout.paths[0].pts,from={x:pts[0],y:pts[1]},q=[from],seen=new Set([from.y*40+from.x]);
 for(let i=0;i<q.length;i++){const p=q[i];if(p.x===e.x&&p.y===e.y){current.book=discoverTrailhead(current.book,e.trailhead);discovered=true;build();return true;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=y*40+x;if(x>=0&&y>=0&&x<40&&y<40&&!seen.has(k)&&passMove(f,k)){seen.add(k);q.push({x,y});}}}return false;}
function gallery(id){assetGroup.clear();for(const f of floorViews)f.group.visible=false;const obj=models.get(id).clone(true);style(obj);assetGroup.add(obj);scene.fog.density=.01;controls.target.set(0,.7,0);camera.position.set(3.8,2.8,4.5);controls.update();state.campaign.wx={kind:'clear',ground:''};}
document.querySelector('#controls').innerHTML=`<select id="show"><option value="fork">Vallaki–Krezk</option><option value="woods">Svalich side trail</option><option value="berez">Berez crossing</option></select><button id="direction">Reverse approach</button><button id="discover">Walk to fork</button><select id="growth"><option>early</option><option>established</option><option>advanced</option></select><select id="quality"><option>medium</option><option>low</option><option>high</option><option>ultra</option></select><select id="treatment"><option>dry</option><option>wet</option><option>cold</option><option>infected</option></select>`;
document.querySelector('#show').onchange=e=>{mode=e.target.value;discovered=false;build();};document.querySelector('#direction').onclick=()=>{view=view==='forward'?'reverse':'forward';focus();document.querySelector('#status').textContent+=` · ${view}`;};document.querySelector('#discover').onclick=walkToFork;
document.querySelector('#growth').onchange=e=>{stage=e.target.value;build();};document.querySelector('#quality').onchange=e=>{quality=e.target.value;setGfx({quality});build();};document.querySelector('#treatment').onchange=e=>{treatment=e.target.value;build();};
setGfx({quality:params.get('quality') || quality});build();
window.RoadWatches={manifest,models,build,walkToFork,gallery,set(options){if(options.mode)mode=options.mode;if(options.view)view=options.view;if(options.discovered!=null)discovered=options.discovered;if(options.stage)stage=options.stage;if(options.treatment)treatment=options.treatment;if(options.quality)setGfx({quality:options.quality});for(const f of floorViews)f.group.visible=true;build();},shortcutProof,playerBook:()=>trailsForPlayers(current.book,['vallaki']),assetGroup};
const DL=daylight(12);scene.fog.color.set(DL.fog);scene.fog.density=.025;ambient.color.set(DL.amb);ambient.intensity=1.05;hemi.intensity=.7;moon.color.set('#d6d2cc');moon.intensity=2.1;moon.position.set(-12,24,10);
function frame(now){requestAnimationFrame(frame);const t=now/1000,dt=Math.min(.05,t-frameTime);frameTime=t;controls.update();updateAmbience(t,dt);updateOmens(t,dt);renderFrame(t,.15);}requestAnimationFrame(frame);
window.ready=true;
