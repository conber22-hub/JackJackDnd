/* Decorative proposals only. Native grids/paths/events remain untouched. A box
   touching an event/exit/bridge, wet cell or occupied footprint is rejected.
   Store seed + layout identity, not new random numbers from the render loop. */
import {hashSeed,mulberry32} from '../util/core.js';
export function assetCells(asset,x,y,rot=0,{collision=false}={}){
 const b=asset.bounds,corners=[[b.min[0],b.min[2]],[b.min[0],b.max[2]],[b.max[0],b.min[2]],[b.max[0],b.max[2]]].map(([u,v])=>[u*Math.cos(rot)-v*Math.sin(rot),u*Math.sin(rot)+v*Math.cos(rot)]);
 const minX=Math.min(...corners.map(p=>p[0])),maxX=Math.max(...corners.map(p=>p[0])),minY=Math.min(...corners.map(p=>p[1])),maxY=Math.max(...corners.map(p=>p[1])),cells=[];
 for(let yy=Math.floor(y+minY+.50001);yy<=Math.ceil(y+maxY+.49999)-1;yy++)for(let xx=Math.floor(x+minX+.50001);xx<=Math.ceil(x+maxX+.49999)-1;xx++){
  // The root frame has two solid feet and >2 squares headroom. Its centre is void.
  const lx=(xx-x)*Math.cos(rot)+(yy-y)*Math.sin(rot);
  if(collision && asset.id==='root-opening' && Math.abs(lx)<.7)continue;
  cells.push([xx,yy]);
 }return cells;
}
const key=(x,y)=>`${x},${y}`;
export function roadReservations(f,spec){
 const blocked=new Set(),wet=new Set([...(f.water || []),...(f.shallow || []),...(f.mists || []),...(f.filled || [])].map(i=>key(i%f.W,Math.floor(i/f.W))));
 const reserve=(x,y,r)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)blocked.add(key(x+dx,y+dy));};
 for(const e of f.events || [])reserve(e.x,e.y,1);
 for(const p of [f.up,f.down,...[spec.layout.paths[0]?.pts.slice(0,2),spec.layout.paths[0]?.pts.slice(-2)].filter(Boolean).map(([x,y])=>({x,y}))].filter(Boolean))reserve(p.x,p.y,2);
 for(const p of f.props || [])reserve(p.x,p.y,p.k==='bridge'?1:1);
 for(const b of f.buildings || [])for(let y=b.y-1;y<b.y+b.h+1;y++)for(let x=b.x-1;x<b.x+b.w+1;x++)blocked.add(key(x,y));
 return {blocked,wet};
}
export function planRoadWatches(f,spec,manifest,{seed,discovered=false,dmReveal=false,stage='early'}={}){
 const rng=mulberry32(hashSeed(JSON.stringify([seed,spec.layout.paths,spec.layout.events]))),{blocked,wet}=roadReservations(f,spec),occupied=new Set(),placements=[];
 const assets=manifest.assets,walk=(x,y)=>x>=0&&y>=0&&x<f.W&&y<f.H&&f.grid[y*f.W+x]>0;
 const safe=(asset,x,y,rot,opening=false)=>{
  const cells=assetCells(asset,x,y,rot),solids=assetCells(asset,x,y,rot,{collision:true});
  if(cells.some(([xx,yy])=>xx<2 || yy<2 || xx>=f.W-2 || yy>=f.H-2 || blocked.has(key(xx,yy)) || wet.has(key(xx,yy)) || occupied.has(key(xx,yy))))return false;
  return !solids.some(([xx,yy])=>walk(xx,yy));
 };
 const put=(a,x,y,rot=0,visibility='public')=>{const cells=assetCells(a,x,y,rot);cells.forEach(([xx,yy])=>occupied.add(key(xx,yy)));placements.push({id:`${a.id}:${x}:${y}`,asset:a.id,x,y,rot,visibility,cells,collision:assetCells(a,x,y,rot,{collision:true}),route:spec.layout.events?.find(e=>e.trailhead)?.trailhead || null});};
 // Only an actual native spur may carry an opening. No invented hole in a forest.
 const spur=spec.layout.paths.find((p,i)=>i>0 && p.w===1 && spec.layout.events?.some(e=>e.trailhead && p.pts.at(-2)===e.x && p.pts.at(-1)===e.y));
 if(discovered && spur){const [x,y,x2,y2]=spur.pts,a=assets.find(a=>a.id==='root-opening'),rot=x===x2?0:Math.PI/2;
  for(let step=2;step<Math.max(Math.abs(x2-x),Math.abs(y2-y))-1;step++){const xx=x+Math.sign(x2-x)*step,yy=y+Math.sign(y2-y)*step;if(safe(a,xx,yy,rot,true)){put(a,xx,yy,rot,'discovered');break;}}
 }
 const candidates=[];
 for(let y=2;y<f.H-2;y++)for(let x=2;x<f.W-2;x++)if(!walk(x,y) && !wet.has(key(x,y))){let d=99;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(walk(x+dx,y+dy))d=Math.min(d,Math.abs(dx)+Math.abs(dy));if(d>=1&&d<=3)candidates.push({x,y,d,r:rng()});}
 candidates.sort((a,b)=>a.r-b.r);
 const crossingWater=new Set([...(f.water || []),...(f.shallow || [])].map(i=>key(i%f.W,Math.floor(i/f.W))));
 const nearWet=(x,y)=>[...crossingWater].some(k=>{const [xx,yy]=k.split(',').map(Number);return Math.abs(x-xx)+Math.abs(y-yy)<=4;});
 const fork=spec.layout.events?.find(e=>e.trailhead);
 const choices=assets.filter(a=>a.id!=='root-opening' && (!a.stage || a.stage===stage) && (!a.opening || dmReveal) && (a.family!=='hidden' || discovered || dmReveal) && (!['split-path','road-footpath'].includes(a.id) || fork && discovered));
 // One of each fitting silhouette before repeats. Rendering quality can thin this list.
 for(const a of choices){
  for(const {x,y} of candidates){if(a.family==='crossings' && !nearWet(x,y))continue;
   if(a.id==='bridge-wing' && !(f.props || []).some(p=>p.k==='bridge' && Math.abs(x-p.x)+Math.abs(y-p.y)<=4))continue;
   if(a.id==='ford-stones' && !(f.shallow || []).some(i=>Math.abs(x-i%f.W)+Math.abs(y-Math.floor(i/f.W))<=4))continue;
   if(a.family==='hidden' || ['split-path','road-footpath'].includes(a.id)){if(!fork || Math.hypot(x-fork.x,y-fork.y)>6)continue;}
   const rot=a.family==='crossings'?(['bridge-wing','ford-stones','raised-planks'].includes(a.id)?Math.PI/2:0):(Math.floor(rng()*4))*Math.PI/2;if(!safe(a,x,y,rot))continue;put(a,x,y,rot,a.opening?'dm-reveal':a.family==='hidden'?'discovered':'public');break;
  }
 }
 return {seed,placements,clear:[...occupied].map(k=>k.split(',').map(Number)),protected:[...blocked],stage};
}
export function roadWatchesForPlayers(plan,{explored,discovered=false}={}){
 const visible=new Set(explored || []);
 return plan.placements.filter(p=>p.visibility!=='dm-reveal' && (p.visibility!=='discovered' || discovered) && p.cells.every(([x,y])=>visible.has(key(x,y)))).map(p=>({...p,cells:p.cells.map(c=>[...c]),collision:p.collision.map(c=>[...c])}));
}
