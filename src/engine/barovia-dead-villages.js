/* Barovia VI — pure, seeded village skin planner. No Three.js, DOM or globals.
 * Adapter input: layout from engine/settlement.js (layout.buildings objects).
 * The returned skins are REPLACEMENT RENDERS of existing building solids. They must not
 * create/remove collision cells, doors, room links, or reveal hidden DM information.
 */
import { VILLAGE_STAGES, VILLAGE_ARCHETYPE_BY_ID } from '../data/barovia-dead-villages-data.js';

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,80}$/;
const DOORS = ['s','n','e','w'];
const finiteInt=n=>Number.isSafeInteger(n);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function hash(seed){let h=2166136261;for(const c of seed){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(seed){let v=seed>>>0;return()=>{v=(v+0x6D2B79F5)|0;let t=Math.imul(v^(v>>>15),v|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const rotation=d=>({s:0,e:1,n:2,w:3})[d];
export function chooseVillageArchetype(building,seed='barovia'){
 const name=String(building.name||'').toLowerCase();
 const keys=[
 [/tavern|inn|guest|public house/,'last_candle_inn'],
 [/chapel|church|saint/,'morning_chapel'],
 [/school|academy/,'bell_schoolhouse'],
 [/watch|guard|tower/,'gallows_watch'],
 [/granary|warehouse|mill|barn|storehouse/,'river_granary'],
 [/manor|burgomaster|mansion|estate/,'burgomaster_manor'],
 [/crypt|ossuary|mausoleum/,'mourners_ossuary'],
 [/forge|workshop|tanner|smith/,'charcoal_workshop'],
 [/market|shop|mercantile/,'market_stallhouse'],
 [/longhouse|communal/,'timber_longhouse'],
 [/hut|hovel|peat/,'peat_hut'],
 ];
 for(const [re,id] of keys)if(re.test(name))return id;
 const w=building.w||4,h=building.h||4;
 const rng=mulberry32(hash(`${seed}|${name}|${w}|${h}`));
 if(Math.min(w,h)<=3)return rng()<.5?'peat_hut':'svalich_cottage';
 if(w*h>=30)return rng()<.5?'timber_longhouse':'last_candle_inn';
 return ['svalich_cottage','peat_hut','timber_longhouse','charcoal_workshop'][Math.floor(rng()*4)];
}
function options(o){
 if(!o||typeof o!=='object'||Array.isArray(o))throw new TypeError('Expected options');
 const {layout,seed='barovia',settlementId='unknown',stage='inhabited',intensity=1}=o;
 if(!layout||!finiteInt(layout.W)||!finiteInt(layout.H)||layout.W<5||layout.H<5||layout.W>512||layout.H>512||!Array.isArray(layout.buildings))throw new TypeError('Expected a building layout with W, H and buildings');
 if(typeof seed!=='string'||seed.length>256||!ID_RE.test(settlementId))throw new RangeError('Invalid seed or settlementId');
 if(!VILLAGE_STAGES.includes(stage)||typeof intensity!=='number'||!Number.isFinite(intensity)||intensity<0||intensity>1)throw new RangeError('Invalid stage/intensity');
 return {layout,seed,settlementId,stage,intensity};
}
const stageFor=(wanted,intensity,roll)=>wanted==='inhabited'?'inhabited':wanted==='abandoned'?(roll<intensity?'abandoned':'inhabited'):(roll<intensity?'infested':'abandoned');
function assertBuilding(b,W,H,i){
 if(!b||![b.x,b.y,b.w,b.h].every(finiteInt)||b.w<2||b.h<2||b.x<0||b.y<0||b.x+b.w>W||b.y+b.h>H)throw new RangeError(`Building ${i} has an invalid footprint`);
 if(b.door!==undefined && !DOORS.includes(b.door))throw new RangeError(`Building ${i} has an unknown door side`);
}
export function planDeadVillage({layout,seed='barovia',settlementId='unknown',stage='inhabited',intensity=1}={}){
 const o=options({layout,seed,settlementId,stage,intensity});
 const skins=o.layout.buildings.map((b,i)=>{
  assertBuilding(b,layout.W,layout.H,i);
  const kind=chooseVillageArchetype(b,`${seed}|${settlementId}|${i}`);
  const roll=mulberry32(hash(`${seed}|${settlementId}|village|${i}`))();
  const s=stageFor(stage,intensity,roll);
  return {id:`${settlementId}:${i}`,buildingIndex:i,kind,x:b.x,y:b.y,w:b.w,h:b.h,door:b.door||'s',rot:rotation(b.door||'s'),stage:s,model:VILLAGE_ARCHETYPE_BY_ID[kind].states[s],roll,
   dm:{name:String(b.name||'House'),read:VILLAGE_ARCHETYPE_BY_ID[kind].read[VILLAGE_STAGES.indexOf(s)]}};
 });
 return {version:6,visualOnly:true,settlementId,seed,stage,intensity,W:layout.W,H:layout.H,skins};
}
export function advanceDeadVillage(plan,{stage,intensity=1,allowRestoration=false}={}){
 if(!plan||plan.version!==6||!Array.isArray(plan.skins))throw new TypeError('Invalid prior plan');
 if(!VILLAGE_STAGES.includes(stage)||typeof intensity!=='number'||!Number.isFinite(intensity)||intensity<0||intensity>1)throw new RangeError('Invalid stage/intensity');
 const old=VILLAGE_STAGES.indexOf(plan.stage),next=VILLAGE_STAGES.indexOf(stage);
 if(!allowRestoration&&(next<old||next===old&&intensity<plan.intensity))throw new RangeError('Restoration requires allowRestoration:true');
 return {...plan,stage,intensity,skins:plan.skins.map(b=>{
  const s=stageFor(stage,intensity,b.roll),kind=VILLAGE_ARCHETYPE_BY_ID[b.kind];
  if(!kind)throw new RangeError('Unknown archetype');
  return {...b,stage:s,model:kind.states[s],dm:{name:b.dm.name,read:kind.read[VILLAGE_STAGES.indexOf(s)]}};
 })};
}
// This projection intentionally omits read-aloud text, rolls, state progress and source names.
export function playerVillageSkins(plan){
 if(!plan||!Array.isArray(plan.skins))throw new TypeError('Invalid plan');
 return plan.skins.map(({id,x,y,w,h,door,model})=>({id,x,y,w,h,door,model}));
}
export function validateDeadVillage(layout,plan){
 const problems=[];
 if(!plan||plan.version!==6||!Array.isArray(plan.skins)||!layout?.buildings)return ['invalid plan/layout'];
 if(plan.skins.length!==layout.buildings.length)problems.push('building count mismatch');
 const ids=new Set();
 for(const s of plan.skins){
  if(ids.has(s.id))problems.push('duplicate building id');ids.add(s.id);
  const b=layout.buildings[s.buildingIndex];
  if(!b||b.x!==s.x||b.y!==s.y||b.w!==s.w||b.h!==s.h||s.door!==(b.door||'s'))problems.push('building shell or door moved');
  const kind=VILLAGE_ARCHETYPE_BY_ID[s.kind];
  if(!kind||!VILLAGE_STAGES.includes(s.stage)||kind.states[s.stage]!==s.model)problems.push('invalid model reference');
  if(!(typeof s.roll==='number'&&s.roll>=0&&s.roll<1))problems.push('invalid deterministic roll');
 }
 return problems;
}
