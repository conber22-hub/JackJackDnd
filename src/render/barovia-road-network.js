/* Standalone seeded 8x8 modular road planning; no DOM, no Three.js, no gameplay mutation.
   Our render assets are visually continuous; the host still owns walkability.
   Sockets store style & width. Rotation 1 is clockwise (Three.js -PI/2 about Y).
*/
import { ROAD_ASSETS } from './road-assets-index.js';
import { LINKS, PLACES } from './barovia-road-links.js';
const DIRS=['N','E','S','W'], DELTA={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]};
const OPP={N:'S',E:'W',S:'N',W:'E'};
const HOURS={road:2,path:3,trail:4};
const hash=str=>{let h=2166136261;for(const ch of String(str)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export function seeded(seed){let a=hash(seed);return ()=>{let t=a+=0x6D2B79F5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function rotatedSide(side,rot=0){const i=DIRS.indexOf(side);if(i<0)throw new RangeError('Unknown side '+side);return DIRS[(i+((rot%4)+4)%4)%4];}
export function portsFor(id,rot=0){
 const a=ROAD_ASSETS[id];if(!a)throw new RangeError('Unknown asset '+id);
 return Object.fromEntries(Object.entries(a.sockets).map(([side,style])=>[rotatedSide(side,rot),{style,width:a.edgeWidth[side]}]));
}
const findLink=id=>LINKS.find(r=>r.id===id);
export function shortestValleyRoute(from,to,{by='stretches'}={}){
 if(!(from in PLACES)||!(to in PLACES))throw new RangeError('Unknown Barovian place');
 if(!['stretches','hours'].includes(by))throw new RangeError('Route weight must be stretches or hours');
 if(from===to)return {places:[from],links:[],stretches:0,hours:0};
 const dist=new Map([[from,0]]),prev=new Map(),q=new Set([from]);
 while(q.size){let u=[...q].sort((a,b)=>dist.get(a)-dist.get(b)||a.localeCompare(b))[0];q.delete(u);if(u===to)break;
  for(const r of LINKS){const v=r.a===u?r.b:r.b===u?r.a:null;if(v===null)continue;
   const cost=r.len*(by==='hours'?HOURS[r.way]:1),d=dist.get(u)+cost;
   if(!dist.has(v)||d<dist.get(v)){dist.set(v,d);prev.set(v,{from:u,link:r.id});q.add(v);}
  }
 }
 if(!prev.has(to))throw new Error('Valley links are disconnected');
 const places=[to],links=[];
 for(let u=to;u!==from;){const p=prev.get(u);links.unshift(p.link);places.unshift(p.from);u=p.from;}
 return {places,links,stretches:links.reduce((s,id)=>s+findLink(id).len,0),
         hours:links.reduce((s,id)=>{const r=findLink(id);return s+r.len*HOURS[r.way];},0)};
}
const ITEM=(id,x,y,rot=0)=>({id,x,y,rot});
function chooseBridge(r){
 if(r.way==='trail')return 'bridge_rope_ew';
 if(r.id==='r-berez')return 'bridge_marsh_ew';
 if(r.way==='path')return 'bridge_foot_ew';
 return r.id==='r-east'?'bridge_stone_ew':'bridge_timber_ew';
}
const FINAL={
 'r-gates':'gate_barovia_ew', 'r-castle':'gate_barovia_ew',
 'r-cut':'burned_cut_trail_ew','r-tser':'approach_tser_ew',
 'r-west':'approach_bonegrinder_ew', 'r-vallaki':'gate_vallaki_ew',
 'r-argyn':'mountain_switchback_ew','r-winery':'approach_vineyard_ew',
 'r-krezk':'gate_krezk_ew','r-yester':'hunger_trail_ew',
};
/** Generate each repo-defined road into len contiguous, 40x24-square sample stretches.
 * Each stretch is 5x3 tiles of 8x8 squares; add a surrounding margin if the game needs one.
 * @returns plain serialisable data. Never mutates a map or a scene.
 */
export function planRoadLink(id,{seed='barovia',tilesPerStretch=5,offshoots=true,reverse=false}={}){
 const road=typeof id==='string'?findLink(id):id;
 if(!road||!['road','path','trail'].includes(road.way)||!Number.isInteger(road.len)||road.len<1)
   throw new RangeError('Expected a known road id or a valid VALLEY_ROADS record');
 if(!Number.isInteger(tilesPerStretch)||tilesPerStretch<4||tilesPerStretch>20)throw new RangeError('Expected 4–20 tiles per stretch');
 const n=road.len*tilesPerStretch,rng=seeded(`${seed}|${road.id}|links`),pieces=Array.from({length:n},(_,x)=>ITEM(`${road.way}_straight_ew`,x,1));
 const taken=new Set();
 if(road.river){const mid=Math.floor((n-1)/2);pieces[mid].id=chooseBridge(road);taken.add(mid);}
 if(road.id==='r-vallaki'){
  pieces[n-2]=ITEM('transition_road_cobble_ns',n-2,1,3);taken.add(n-2);
  pieces[n-1]=ITEM('gate_vallaki_ew',n-1,1);taken.add(n-1);
 }else if(road.id==='r-winery'){
  pieces[0]=ITEM('cobble_straight_ew',0,1);taken.add(0);
  pieces[1]=ITEM('transition_cobble_road_ns',1,1,3);taken.add(1);
  pieces[n-1]=ITEM(FINAL[road.id],n-1,1);taken.add(n-1);
 }else if(FINAL[road.id]){
  pieces[n-1]=ITEM(FINAL[road.id],n-1,1);taken.add(n-1);
 }
 if(offshoots && n>=5 && rng()<.83){
  const choices=pieces.slice(1,n-1).filter(p=>!taken.has(p.x));
  if(choices.length){
   const chosen=choices[Math.floor(rng()*choices.length)],upper=rng()<.5;
   chosen.id=`${road.way}_${upper?'tee_new':'tee_esw'}`;
   pieces.push(ITEM(`${road.way}_${upper?'cap_s':'cap_n'}`,chosen.x,upper?0:2));
  }
 }
 let tiles=pieces;
 if(reverse)tiles=tiles.map(p=>ITEM(p.id,n-1-p.x,2-p.y,(p.rot+2)%4));
 tiles.sort((a,b)=>a.y-b.y||a.x-b.x||a.id.localeCompare(b.id));
 const plan={roadId:road.id,from:reverse?road.b:road.a,to:reverse?road.a:road.b,name:road.name,
  way:road.way,river:!!road.river,tilesPerStretch,stretches:road.len,fullWidthSquares:n*8,heightSquares:24,
  tileSize:8,entry:{x:0,y:1,side:'W',style:reverse?(road.id==='r-vallaki'?'cobble':road.id==='r-winery'?'road':road.way):road.id==='r-winery'?'cobble':road.way},
  exit:{x:n-1,y:1,side:'E',style:reverse?(road.id==='r-winery'?'cobble':road.id==='r-vallaki'?'road':road.way):road.id==='r-vallaki'?'cobble':road.way},
  tiles};
 plan.segments=Array.from({length:road.len},(_,i)=>({index:i,roadId:road.id,
  widthSquares:tilesPerStretch*8,heightSquares:24,
  entry:{x:0,y:1,side:'W'},exit:{x:tilesPerStretch-1,y:1,side:'E'},
  tiles:tiles.filter(p=>Math.floor(p.x/tilesPerStretch)===i).map(p=>({...p,x:p.x-i*tilesPerStretch}))}));
 return plan;
}
/** Reverse-aware itinerary between any pair of Barovian locations. */
export function planValleyTrip(from,to,{seed='barovia',by='stretches',tilesPerStretch=5}={}){
 const journey=shortestValleyRoute(from,to,{by});
 return {...journey,segments:journey.links.map((id,k)=>planRoadLink(id,{
   seed:`${seed}|${k}`,tilesPerStretch,reverse:findLink(id).a!==journey.places[k]}))};
}
/** No unpaired side openings except explicit west entry and east exit. */
export function validateRoadPlan(plan){
 const errors=[],cells=new Map(),key=(x,y)=>`${x},${y}`;
 if(!plan||!Array.isArray(plan.tiles))return ['Missing tiles array'];
 for(const tile of plan.tiles){
  if(!Number.isInteger(tile.x)||!Number.isInteger(tile.y)||tile.y<0||tile.y>2||tile.x<0||tile.x>=plan.stretches*plan.tilesPerStretch)
    errors.push(`Out of bounds: ${tile.id} (${tile.x},${tile.y})`);
  if(!ROAD_ASSETS[tile.id])errors.push(`Unknown asset: ${tile.id}`);
  if(cells.has(key(tile.x,tile.y)))errors.push(`Overlapping tiles at ${tile.x},${tile.y}`);
  cells.set(key(tile.x,tile.y),tile);
 }
 for(const tile of plan.tiles){
  if(!ROAD_ASSETS[tile.id])continue;
  const own=portsFor(tile.id,tile.rot);
  for(const [d,p] of Object.entries(own)){
   const [dx,dy]=DELTA[d],nx=tile.x+dx,ny=tile.y+dy,other=cells.get(key(nx,ny));
   if(!other){
    if(d==='W'&&tile.x===0&&tile.y===1||d==='E'&&tile.x===plan.stretches*plan.tilesPerStretch-1&&tile.y===1)continue;
    errors.push(`Unpaired ${d} at ${tile.x},${tile.y}`);continue;
   }
   if(!ROAD_ASSETS[other.id])continue;
   const peer=portsFor(other.id,other.rot)[OPP[d]];
   if(!peer||peer.style!==p.style||peer.width!==p.width)errors.push(`Socket mismatch ${tile.id}:${d} vs ${other.id}:${OPP[d]}`);
  }
 }
 return errors;
}
