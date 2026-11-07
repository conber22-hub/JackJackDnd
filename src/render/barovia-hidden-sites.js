/* BAROVIA V: THE PLACES BENEATH THE ROAD
 * Pure optional scenery planner. The existing valley route, dungeon, token, collision,
 * secret, door, stairs, fog-of-war, and movement systems are AUTHORITATIVE.
 * No Three.js, DOM, Math.random, persistent state, or automatic discovery.
 */
import { HIDDEN_SITES, HIDDEN_SITE_BY_ID } from './barovia-hidden-data.js';

function random(seed){
 let h=2166136261;
 for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
 return ()=>{let t=(h+=0x6D2B79F5);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const xy=p=>Array.isArray(p)?[p[0],p[1]]:[p?.x,p?.y];
function rectangle(mask,W,H,x,y,w,h,margin=0){
 for(let yy=y-margin;yy<y+h+margin;yy++)for(let xx=x-margin;xx<x+w+margin;xx++)
  if(xx>=0&&yy>=0&&xx<W&&yy<H)mask[yy*W+xx]=1;
}
export function hiddenProtectedMask(layout,{W=layout.W??40,H=layout.H??40,clearance=1,extra=[]}={}){
 if(!integer(W,8,256)||!integer(H,8,256))throw new RangeError('Map dimensions must be 8..256');
 if(!integer(clearance,0,4))throw new RangeError('Clearance must be 0..4');
 const mask=new Uint8Array(W*H),mark=(x,y,r=0)=>rectangle(mask,W,H,x,y,1,1,r);
 rectangle(mask,W,H,0,0,W,2,0);rectangle(mask,W,H,0,H-2,W,2,0);
 rectangle(mask,W,H,0,0,2,H,0);rectangle(mask,W,H,W-2,0,2,H,0);
 for(const room of layout.rooms||[]){
  const [x,y,w,h]=Array.isArray(room)?room:[room.x,room.y,room.w,room.h];
  if([x,y,w,h].every(Number.isInteger)&&w>0&&h>0)rectangle(mask,W,H,x,y,w,h,clearance);
 }
 for(const path of layout.paths||[]){
  const points=path.pts||[],r=Math.ceil(((path.w||1)-1)/2)+clearance;
  for(let i=0;i+3<points.length;i+=2){
   let [x,y,tx,ty]=points.slice(i,i+4);
   if(![x,y,tx,ty].every(Number.isInteger))continue;
   let n=0;
   while(n++<=W+H+2){mark(x,y,r);if(x===tx&&y===ty)break;
    if(x!==tx)x+=Math.sign(tx-x);else y+=Math.sign(ty-y);
   }
  }
 }
 for(const item of [...(layout.water||[]),...(layout.shallow||[]),...(layout.fill||[]),...(layout.mistWall||[]),...(layout.clear||[]),...(layout.rough||[]),...extra]){
  const [x,y]=xy(item);if(integer(x,0,W-1)&&integer(y,0,H-1))mark(x,y,clearance);
 }
 for(const item of [...(layout.doors||[]),...(layout.traps||[])]){
  const [x,y]=xy(item);if(integer(x,0,W-1)&&integer(y,0,H-1))mark(x,y,clearance+1);
 }
 for(const key of ['up','down','out','entry'])if(layout[key]!=null){
  const [x,y]=xy(layout[key]);if(integer(x,0,W-1)&&integer(y,0,H-1))mark(x,y,clearance+2);
 }
 for(const b of layout.buildings||[]){
  if([b.x,b.y,b.w,b.h].every(Number.isInteger))rectangle(mask,W,H,b.x,b.y,b.w,b.h,clearance);
  if(b.door&&typeof b.door==='object'){const [x,y]=xy(b.door);if(integer(x,0,W-1)&&integer(y,0,H-1))mark(x,y,clearance+2);}
 }
 for(const p of layout.props||[]){const [x,y]=Array.isArray(p)?[p[1],p[2]]:[p.x,p.y];if(integer(x,0,W-1)&&integer(y,0,H-1))mark(x,y,clearance);}
 return mask;
}
export const ROAD_IDS = Object.freeze([...new Set(HIDDEN_SITES.flatMap(s=>s.roads))]);

export function planHiddenSites({layout,seed='barovia',roadId='r-east',maxSites=2,density=.7,gaze=1,bloom=false,protectedCells=[]}={}){
 if(!layout||typeof layout!=='object')throw new TypeError('layout required');
 if(!ROAD_IDS.includes(roadId))throw new RangeError('Unknown Barovian road id');
 if(!integer(maxSites,0,6))throw new RangeError('maxSites must be 0..6');
 if(!Number.isFinite(density)||density<0||density>1)throw new RangeError('density must be 0..1');
 if(!integer(gaze,1,10)||typeof bloom!=='boolean')throw new RangeError('Invalid gaze/bloom');
 const W=layout.W??40,H=layout.H??40;
 const used=hiddenProtectedMask(layout,{W,H,clearance:1,extra:protectedCells});
 const rng=random(`${seed}|hidden|${roadId}`),eligible=HIDDEN_SITES.filter(s=>s.roads.includes(roadId));
 const shuffled=eligible.slice();for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 const sites=[];
 for(const site of shuffled){
  if(sites.length>=maxSites)break;
  // Most roads stay ordinary. High gaze adds unease but does not grant new map mechanics.
  if(rng()>Math.min(1,density+Math.max(0,gaze-6)*.035))continue;
  const [w,h]=site.footprint;
  if(w+6>W||h+6>H)continue;
  for(let attempt=0;attempt<140;attempt++){
   const x=3+Math.floor(rng()*(W-w-5)),y=3+Math.floor(rng()*(H-h-5));
   let free=true;
   for(let yy=y;yy<y+h&&free;yy++)for(let xx=x;xx<x+w;xx++)if(used[yy*W+xx]){free=false;break;}
   if(!free)continue;
   // Locations are adjacent to existing map geography but never occupy its transit tiles.
   rectangle(used,W,H,x,y,w,h,2);
   sites.push({id:site.id,x,y,w,h,revealed:false});break;
  }
 }
 return {seed:String(seed),roadId,W,H,visualOnly:true,sites};
}

export function validateHiddenPlan(layout,plan){
 const faults=[];
 if(!plan||!Array.isArray(plan.sites))return ['Missing sites array'];
 let mask;
 try{mask=hiddenProtectedMask(layout,{W:plan.W,H:plan.H});}
 catch(e){return [e.message];}
 const reserved=new Set();
 for(const entry of plan.sites){
  const s=HIDDEN_SITE_BY_ID[entry.id];if(!s){faults.push('unknown site '+entry.id);continue;}
  if(!s.roads.includes(plan.roadId))faults.push('wrong road for '+entry.id);
  if(entry.w!==s.footprint[0]||entry.h!==s.footprint[1])faults.push('footprint mismatch '+entry.id);
  if(!integer(entry.x,0,plan.W-1)||!integer(entry.y,0,plan.H-1)||entry.x+entry.w>plan.W||entry.y+entry.h>plan.H){faults.push('bounds '+entry.id);continue;}
  for(let y=entry.y;y<entry.y+entry.h;y++)for(let x=entry.x;x<entry.x+entry.w;x++){
   const i=y*plan.W+x;if(mask[i])faults.push('protected square '+entry.id);if(reserved.has(i))faults.push('overlap '+entry.id);reserved.add(i);
  }
 }
 return [...new Set(faults)];
}

export function revealHiddenSite(plan,id){
 if(!plan?.sites?.some(s=>s.id===id))throw new RangeError('Unknown placement id');
 return {...plan,sites:plan.sites.map(s=>s.id===id?{...s,revealed:true}:{...s})};
}

// Keep DM-only read-aloud, return notes and hidden-state metadata OFF the player channel.
// Only transport this minimal visual view when an area is actually visible by existing FoW rules.
export function visibleHiddenModels(plan){
 return (plan?.sites||[]).map(s=>({x:s.x,y:s.y,w:s.w,h:s.h,model:`${s.id}_${s.revealed?'revealed':'sealed'}`}));
}
export function dmHiddenSites(plan){
 return (plan?.sites||[]).map(s=>{ const d=HIDDEN_SITE_BY_ID[s.id]||{}; return {...d,...s,sealedAsset:d.sealed,revealedAsset:d.revealed}; });
}
