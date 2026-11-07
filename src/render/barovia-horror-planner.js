/* BAROVIA IV — THE ROAD WATCHES
 * A pure, deterministic scenic set-piece planner. Never writes to engine grids or session state.
 * Input is an existing overland layout from src/engine/overland.js, not a parallel map generator.
 * x/y in grid squares, 1 square = one Three.js world unit / five feet.
 */
import { ASSET_BY_ID } from './horror-assets-index.js';

const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function rngFor(seed){
  let h=2166136261;
  for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  return ()=>{let t=(h+=0x6D2B79F5);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
const sample=(a,r)=>a[Math.floor(r()*a.length)];
const sortedShuffled=(a,r)=>{
 const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]];}
 return b;
};

export const HORROR_SCENES=[
 {id:'last-light',name:'The Last Light Inn',biomes:['roadside','village'],gaze:1,kind:'false-shelter',
  primary:'last_light_inn',satellites:['abandoned_funeral_cart','last_lantern_sign','handprint_shutter'],
  approach:'The inn has one warm window. Its curtains are drawn.',reveal:'There is no fireplace behind the window. The warmth comes from beneath the floorboards.',
  aftermath:'On returning, the sign bears the name of a missing traveller.'},
 {id:'toll-of-the-dead',name:'The Toll Without a Keeper',biomes:['roadside','village'],gaze:2,kind:'dilemma',
  primary:'plague_tollhouse',satellites:['wrong_way_signpost','rusted_prison_cage','sealed_coffin_stack'],
  approach:'A toll bar is raised. Coins have been arranged by the threshold.',reveal:'The ledger records the party arriving here tomorrow.',
  aftermath:'Every coin left behind is minted with an unfamiliar face.'},
 {id:'the-crows-tithe',name:'The Crows’ Tithe',biomes:['forest','graveyard','roadside'],gaze:3,kind:'omen',
  primary:'gallows_three_nooses',satellites:['noose_oak','bone_chime_tree','unmarked_grave_row'],
  approach:'Three empty ropes creak in perfect rhythm.',reveal:'A name is carved into the platform for each member of the party.',
  aftermath:'After the party leaves, one of the ropes stops moving.'},
 {id:'drowned-vespers',name:'The Drowned Vespers',biomes:['marsh','graveyard'],gaze:2,kind:'investigation',
  primary:'drowned_waychapel',satellites:['bog_sunken_hands','blackwater_sinkhole','candled_memorial'],
  approach:'A chapel bell rings softly beneath the water.',reveal:'The chapel pews face the back wall, where a second altar is submerged.',
  aftermath:'Small wet footprints lead out toward the road.'},
 {id:'burial-ledger',name:'The Grave That Knows',biomes:['graveyard','village'],gaze:1,kind:'discovery',
  primary:'forgotten_crypt_entry',satellites:['broken_stone_angel','unmarked_grave_row','sealed_coffin_stack'],
  approach:'A row of stones has been arranged with impossible care.',reveal:'The newest headstone has tomorrow’s date.',
  aftermath:'The stone is older than the rest.'},
 {id:'the-watchers-field',name:'The Field of Witnesses',biomes:['farmland','roadside'],gaze:3,kind:'uncanny',
  primary:'shuttered_farmhouse',satellites:['false_scarecrow','mourning_effigy','hollow_granary'],
  approach:'The scarecrows stand with their backs to the road.',reveal:'Every one has turned toward the party while no one looked.',
  aftermath:'One empty post has appeared at the far end of the field.'},
 {id:'the-hunters-stand',name:'The Hunters’ Stand',biomes:['forest','mountain'],gaze:2,kind:'predator',
  primary:'wolves_watchtower',satellites:['hunter_hideout','wolf_bone_cairn','eyeless_stump'],
  approach:'From the old tower, a horn sounds once.',reveal:'The hunting blind faces the camp rather than the game trail.',
  aftermath:'Fresh wolf tracks circle the tower, all pointing inward.'},
 {id:'hunger-below',name:'The Root Has a Heart',biomes:['corruption','forest','marsh'],gaze:4,bloom:true,kind:'infection',
  primary:'root_swallowed_cottage',satellites:['hunger_heart_tree','hunger_spore_vent','hunger_taken_wagon'],
  approach:'The cottage walls lift and settle by the width of a breath.',reveal:'The floor has been taken over by a root system that carries a pulse.',
  aftermath:'New roots have reached the wheel ruts of the road.'},
 {id:'the-unrung-bell',name:'The Bell That Was Not Rung',biomes:['village','roadside'],gaze:2,kind:'sound',
  primary:'bellkeeper_hut',satellites:['candled_memorial','blood_well','bone_chime_tree'],
  approach:'The bellkeeper’s hut is shut. A faint bell tone hangs in the air.',reveal:'The clapper has been removed, but the bell continues to sound.',
  aftermath:'The tone follows the party for a single mile.'},
 {id:'under-the-road',name:'The Road Beneath the Road',biomes:['marsh','forest','roadside'],gaze:1,kind:'secret-entrance',
  primary:'bridge_beneath_culvert',satellites:['hidden_cellar_hatch','shadow_tunnel_roots','blood_well'],
  approach:'A brook vanishes beneath the road, but its sound continues far below.',reveal:'A second route has been carved beneath the old causeway.',
  aftermath:'The original roadside marker has turned to face the tunnel.'},
 {id:'mountain-mouth',name:'The Warm Cave',biomes:['mountain','forest'],gaze:2,kind:'secret-entrance',
  primary:'dripping_cave_door',satellites:['red_mist_stones','wolf_bone_cairn','thorns_arcade'],
  approach:'Warm breath rises from the rocks through cold mountain air.',reveal:'The cave opens behind a slab marked with a handprint.',
  aftermath:'The warm current now smells of extinguished candles.'},
 {id:'the-last-watch',name:'The Last Watch',biomes:['roadside','mountain'],gaze:3,kind:'betrayal',
  primary:'abandoned_guard_post',satellites:['burned_coach_stable','last_lantern_sign','rusted_prison_cage'],
  approach:'The guard post is deserted. A lantern still burns above the gate.',reveal:'The locked cage contains the sentries’ weapons, but none of their clothing.',
  aftermath:'Fresh bootprints follow the party from the post.'},
 {id:'thorn-gate',name:'The Thorn Gate',biomes:['forest','corruption'],gaze:3,kind:'forbidden-path',
  primary:'thorns_arcade',satellites:['hunger_root_arch','hunger_stalking_stalks','wicker_doll_shrine'],
  approach:'A dark arcade of thorns leads away from the road.',reveal:'The vines withdraw from one particular name when spoken aloud.',
  aftermath:'On the return journey, the opening is gone.'},
];
const tags={
 'r-mist':['roadside','forest'], 'r-gates':['roadside','village','forest'],
 'r-east':['roadside','forest','graveyard'],'r-castle':['mountain','graveyard','roadside'],
 'r-cut':['corruption','forest','mountain'],'r-tser':['marsh','forest','roadside'],
 'r-west':['forest','roadside'],'r-vallaki':['roadside','farmland','forest'],
 'r-lake':['marsh','forest'],'r-argyn':['mountain','graveyard'],
 'r-berez':['marsh','corruption'],'r-winery':['farmland','roadside'],
 'r-krezk':['mountain','farmland','roadside'],'r-yester':['mountain','corruption','forest'],
 'r-tower':['marsh','mountain']
};

// Construct a generous protected mask from actual path centerlines, encounter clearings,
// buildings and water. A model is scenery only and cannot carve out floor squares.
export function makeProtectedMask(layout,{width=40,height=40,margin=1,extra=[]}={}){
 const W=layout.W??width,H=layout.H??height,mask=new Uint8Array(W*H),roadTiles=[];
 const mark=(x,y,r=0)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  const xx=x+dx, yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H) mask[yy*W+xx]=1;
 }};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x<2||y<2||x>=W-2||y>=H-2)mark(x,y);
 for(const path of layout.paths||[]){
  const pts=path.pts||[],r=Math.ceil((path.w||1)/2)+margin;
  for(let i=0;i+3<pts.length;i+=2){
   let x=pts[i],y=pts[i+1],xx=pts[i+2],yy=pts[i+3];
   if(![x,y,xx,yy].every(Number.isInteger))continue;
   let steps=0;
   while(steps++<=W+H+10){mark(x,y,r);roadTiles.push([x,y]);if(x===xx&&y===yy)break;
    if(x!==xx)x+=Math.sign(xx-x);else y+=Math.sign(yy-y);
   }
  }
 }
 for(const r of layout.rooms||[]){const [x,y,w,h]=Array.isArray(r)?r:[r.x,r.y,r.w,r.h];
  if(![x,y,w,h].every(Number.isInteger))continue;
  for(let yy=y-margin;yy<y+h+margin;yy++)for(let xx=x-margin;xx<x+w+margin;xx++)mark(xx,yy);
 }
 for(const r of layout.buildings||[]){for(let yy=r.y-2;yy<r.y+r.h+2;yy++)for(let xx=r.x-2;xx<r.x+r.w+2;xx++)mark(xx,yy);}
 for(const point of [...(layout.water||[]),...(layout.shallow||[]),...(layout.fill||[]),...(layout.mistWall||[]),
  ...(layout.doors||[]),...(layout.traps||[]),...extra]){
  const [x,y]=Array.isArray(point)?point:[point.x,point.y];if(Number.isInteger(x)&&Number.isInteger(y))mark(x,y,1);
 }
 for(const p of [...(layout.up?[layout.up]:[]),...(layout.down?[layout.down]:[]),...(layout.out?[layout.out]:[])]){
  const [x,y]=Array.isArray(p)?p:[p.x,p.y];if(Number.isInteger(x)&&Number.isInteger(y))mark(x,y,2);
 }
 return {W,H,mask,roadTiles};
}
const exists=(a,x,y)=>x>=0&&y>=0&&x<a.W&&y<a.H;
const nearestRoad=(a,x,y)=>{let near=null,dist=Infinity;for(const [rx,ry] of a.roadTiles){const d=Math.hypot(rx-x,ry-y);if(d<dist){dist=d;near=[rx,ry];}}return {dist,near};};
const regionFree=(a,ox,oy,w,h,pad=0)=>{
 for(let y=oy-pad;y<oy+h+pad;y++)for(let x=ox-pad;x<ox+w+pad;x++){
  if(!exists(a,x,y)||a.mask[y*a.W+x])return false;
 }return true;
};
const occupy=(a,ox,oy,w,h,pad=1)=>{for(let y=oy-pad;y<oy+h+pad;y++)for(let x=ox-pad;x<ox+w+pad;x++)if(exists(a,x,y))a.mask[y*a.W+x]=1;};
function placement(a,asset,rng,focus,attempts=400){
 const [w,h]=asset.footprint,candidates=[];
 for(let i=0;i<attempts;i++){
  const ox=2+Math.floor(rng()*Math.max(1,a.W-w-4)),oy=2+Math.floor(rng()*Math.max(1,a.H-h-4));
  if(!regionFree(a,ox,oy,w,h,1))continue;
  const x=ox+(w-1)/2,y=oy+(h-1)/2,{dist,near}=nearestRoad(a,x,y);
  if(!near)continue;
  // Primary piece should be discoverable from the existing road; companion objects stay in its clearing.
  const df=focus?Math.hypot(focus.x-x,focus.y-y):0;
  if((!focus&&(dist<4||dist>15)) || (focus&&(df<Math.max(2,w*.40)||df>9||dist>17)))continue;
  const score=(focus?df:dist)+rng()*1.2;
  candidates.push({ox,oy,x,y,w,h,near,dist,score});
 }
 if(!candidates.length)return null;
 candidates.sort((p,q)=>p.score-q.score);
 const c=candidates[0];occupy(a,c.ox,c.oy,w,h,1);
 const dx=c.near[0]-c.x,dy=c.near[1]-c.y;
 const rot=Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?0:2;
 return {id:asset.id,x:c.x,y:c.y,rot,footprint:asset.footprint.slice(),distanceToRoad:+c.dist.toFixed(2),near:c.near};
}

export function planHorrorRoad({layout,roadId='r-east',seed='barovia',gaze=3,bloom=false,density='standard',extraProtected=[]}={}){
 if(!layout||!Array.isArray(layout.paths))throw new TypeError('Existing layout.paths required');
 if(!Number.isInteger(gaze)||gaze<1||gaze>10)throw new RangeError('gaze must be 1–10');
 if(!['sparse','standard','dense'].includes(density))throw new RangeError('unknown density');
 const rng=rngFor(`${roadId}|${seed}|${gaze}|${bloom}|${density}`),protectedMask=makeProtectedMask(layout,{extra:extraProtected});
 const biomes=tags[roadId]||['roadside','forest'];
 const options=HORROR_SCENES.filter(s=>s.gaze<=gaze&&(!s.bloom||bloom)&&s.biomes.some(b=>biomes.includes(b)));
 const total={sparse:1,standard:2,dense:3}[density];
 const scenes=[],placements=[],seen=new Set();
 const prepared=sortedShuffled(options,rng);
 for(const scene of prepared){
  if(scenes.length>=total)break;
  if(seen.has(scene.id))continue;
  const main=ASSET_BY_ID.get(scene.primary),head=placement(protectedMask,main,rng,null,700);
  if(!head)continue;
  const children=[];
  for(const id of scene.satellites){const a=ASSET_BY_ID.get(id),p=placement(protectedMask,a,rng,head,180);
   if(p){children.push(p);placements.push(p);}}
  placements.push(head);scenes.push({id:scene.id,name:scene.name,kind:scene.kind,biomes:scene.biomes,primary:head,
   satellites:children,beats:{approach:scene.approach,reveal:scene.reveal,aftermath:scene.aftermath},
   suggestedReveal:{trigger:'GM chooses',requiresEngineApproval:true},
   access:{nearestExistingRoadSquare:head.near,featureSquare:[head.x,head.y],requiresGameplayPathCheck:true}});
  seen.add(scene.id);
 }
 return {roadId,seed,gaze,bloom,density,format:'barovia-horror-v4',version:4,
  width:protectedMask.W,height:protectedMask.H,scenes,placements,
  notes:'Visual-only decorations. No collision, passage, spawns, secrets, events, sounds, fear effects or encounters are authored in game state.'};
}

export function validateHorrorPlan(layout,plan,{extraProtected=[]}={}){
 const errors=[],a=makeProtectedMask(layout,{extra:extraProtected});
 if(!plan||!Array.isArray(plan.placements))return ['Missing placements'];
 for(const p of plan.placements){
  const asset=ASSET_BY_ID.get(p.id);if(!asset){errors.push(`Unknown asset ${p.id}`);continue;}
  const [w,h]=asset.footprint,ox=p.x-(w-1)/2,oy=p.y-(h-1)/2;
  if(!regionFree(a,ox,oy,w,h,1))errors.push(`Overlapping protected squares: ${p.id} (${p.x},${p.y})`);
  else occupy(a,ox,oy,w,h,1);
  if(![0,1,2,3].includes(p.rot))errors.push(`Bad rotation for ${p.id}`);
 }
 return errors;
}
