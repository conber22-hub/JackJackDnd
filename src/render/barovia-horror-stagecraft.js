/* BAROVIA IV: optional visual stagecraft (no sound, no timers, no gameplay mutations).
 * Mount after createHorrorRenderer().attach(...). Caller supplies elapsed seconds from its own render loop.
 * Only local scenographic overlays; does NOT duplicate native weather, ambient mist, or Strahd omens.
 */
import * as THREE from 'three';

const smooth=(a,b,t)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};
export function createHorrorStagecraft(group,{quality='medium'}={}){
 if(!group?.traverse)throw new TypeError('Stagecraft expects a Three.js Group');
 const allowed=new Set(['low','medium','high']);if(!allowed.has(quality))throw new RangeError('quality');
 const owned=[],effects=[];
 const glowing=(color,size,at,host,opacity=.8)=>{
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide});
  const geo=new THREE.SphereGeometry(size,quality==='high'?12:6,quality==='high'?8:4);
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(...at);mesh.frustumCulled=false;host.add(mesh);owned.push({mesh,geo,mat});return mesh;
 };
 const disc=(color,w,h,at,host,opacity=.8)=>{
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide});
  const geo=new THREE.PlaneGeometry(w,h);
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(...at);host.add(mesh);owned.push({mesh,geo,mat});return mesh;
 };
 group.children.forEach((host,i)=>{
  const id=host.userData.horrorId;if(!id)return;
  const phase=i*1.377;
  if(id==='last_light_inn'){
   const lamp=disc('#d59f53',.36,.47,[-1.368,1.11,1.57],host,.30);
   const silhouette=disc('#080808',.14,.39,[-1.48,1.12,1.608],host,0);
   effects.push({kind:'window',phase,host,lamp,silhouette});
  }else if(id==='last_lantern_sign'||id==='blood_well'||id==='candled_memorial'){
   const orb=glowing(id==='blood_well'?'#8b2323':'#d8b26c',.07,id==='blood_well'?[0,.48,0]:[.03,1.20,.14],host,.48);
   effects.push({kind:'pulse',phase,host,orb});
  }else if(id==='hunger_heart_tree'){
   const orbs=[];for(let k=0;k<(quality==='low'?2:6);k++){
    const a=k*Math.PI*2/(quality==='low'?2:6);
    orbs.push(glowing('#bad96e',.055,[Math.cos(a)*.27,1.2+Math.sin(a)*.25,.57],host,.5));
   }
   effects.push({kind:'heartbeat',phase,host,orbs});
  }else if(id==='hunger_spore_vent'||id==='hunger_stalking_stalks'||id==='hunger_root_arch'){
   const orbs=[];for(let k=0;k<(quality==='low'?0:4);k++){
    const a=k*2.4;orbs.push(glowing('#bbdf79',.035,[Math.cos(a)*.36,.27+(k%3)*.25,Math.sin(a)*.27],host,.3));
   }
   effects.push({kind:'spore',phase,host,orbs});
  }else if(id==='root_swallowed_cottage'){
   effects.push({kind:'breath',phase,host,scale:host.scale.clone()});
  }else if(id==='wrong_way_signpost'||id==='noose_oak'||id==='bone_chime_tree'){
   effects.push({kind:'sway',phase,host,rotation:host.rotation.z});
  }else if(id==='bog_sunken_hands'){
   const orbs=[];if(quality!=='low')for(let k=0;k<4;k++){
    orbs.push(glowing('#d8d1bc',.045,[(k%2)*.5-.25,.18+(k%2)*.15,Math.floor(k/2)*.5-.25],host,.25));
   }
   effects.push({kind:'hands',phase,host,orbs});
  }
 });
 let alive=true;
 function update(t,{gaze=1,wind=.3,dmReveal=false}={}){
  if(!alive)return;
  const dangerous=gaze>=5?1:.35;
  for(const fx of effects){
   const p=t+fx.phase;
   if(fx.kind==='window'){
    fx.lamp.material.opacity=.22+.14*Math.sin(t*6.37+fx.phase)**2;
    // A slow shape crossing the warm window. Visible only if DM opts into the reveal.
    fx.silhouette.material.opacity=dmReveal?smooth(0,1,Math.sin(t*.64+fx.phase))*.85:0;
    fx.silhouette.position.x=-1.48+Math.sin(t*.17+fx.phase)*.09;
   }else if(fx.kind==='pulse'){
    fx.orb.material.opacity=.28+.28*Math.sin(p*5.7)**2;
    const s=1+.23*Math.sin(p*3);fx.orb.scale.setScalar(s);
   }else if(fx.kind==='heartbeat'){
    const beat=Math.pow(Math.max(0,Math.sin(p*2.1)),12);
    fx.orbs.forEach((m,k)=>{m.material.opacity=.19+dangerous*(.18+.58*beat);m.scale.setScalar(.95+beat*.38);});
   }else if(fx.kind==='spore'){
    fx.orbs.forEach((m,k)=>{
     m.position.y=.2+(t*.14+k*.17)%1.35;
     m.position.x+=Math.sin(p*.9+k)*.0008;
     m.material.opacity=dmReveal ? .15+.38*Math.sin(p+k)**2 : .11;
    });
   }else if(fx.kind==='breath'){
    const s=1+.01*dangerous*Math.sin(p*1.7);
    fx.host.scale.copy(fx.scale).multiplyScalar(s);
   }else if(fx.kind==='sway'){
    fx.host.rotation.z=fx.rotation+wind*.018*Math.sin(p*1.12);
   }else if(fx.kind==='hands'){
    fx.orbs.forEach((m,k)=>m.material.opacity=dmReveal ? .24+.23*Math.sin(p*1.4+k)**2 : .1);
   }
  }
 }
 function dispose(){
  if(!alive)return;alive=false;
  for(const fx of effects){if(fx.scale)fx.host.scale.copy(fx.scale);if(fx.rotation!==undefined)fx.host.rotation.z=fx.rotation;}
  for(const {mesh,geo,mat} of owned){mesh.removeFromParent();geo.dispose();mat.dispose();}
  owned.length=0;effects.length=0;
 }
 return {update,dispose,effectCount:effects.length};
}
