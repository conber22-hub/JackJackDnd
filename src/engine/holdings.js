/* Immutable proposals. Persist returned holding/court and debit spentGold once.
   at.floor is a validation input, never saved. bounds is {x,y,w,h}; floor is
   the existing {W,H,grid,filled} map shape. Rotation uses degrees (0/90/180/270). */
import { MODULE_BY_ID as M, KINDS } from '../data/holdings.js';
import { walk } from './tiles.js';
import { recordFight } from './nemesis.js';
const no=why=>({ok:false,why});
const live=h=>(h.modules || []).filter(m=>m.built && m.hp>0 && M[m.module]);
const rect=(m,at)=>({x:at.x,y:at.y,w:at.rot%180?m.footprint.h:m.footprint.w,h:at.rot%180?m.footprint.w:m.footprint.h});
const contains=(a,b)=>b.x>=a.x && b.y>=a.y && b.x+b.w<=a.x+a.w && b.y+b.h<=a.y+a.h;
const overlaps=(a,b)=>a.x<b.x+b.w && b.x<a.x+a.w && a.y<b.y+b.h && b.y<a.y+a.h;
export function canPlace(holding,module,at={},floor){
 const m=typeof module==='string'?M[module]:M[module?.id], k=KINDS[holding?.kind];
 if(!m || !k || !m.kinds.includes(holding.kind)) return no('Unknown or incompatible module.');
 if(!Number.isInteger(at.x) || !Number.isInteger(at.y) || ![0,90,180,270].includes(at.rot ?? 0)) return no('Use whole grid squares and quarter turns.');
 const r=rect(m,at), b=holding.bounds || {x:0,y:0,w:k.w,h:k.h};
 if(b.w>k.w || b.h>k.h || !contains(b,r)) return no('Outside the holding bounds.');
 if(!floor?.grid) return no('Supply the holding floor for placement validation.');
 for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) if(x<0 || y<0 || x>=floor.W || y>=floor.H || !walk(floor.grid[y*floor.W+x]) || floor.filled?.includes(y*floor.W+x)) return no('Needs walkable ground.');
 if(m.on==='wall' && !(r.x===b.x || r.y===b.y || r.x+r.w===b.x+b.w || r.y+r.h===b.y+b.h)) return no('Walls and ways belong on an edge.');
 const parent=live(holding).find(p=>M[p.module].gives.building && contains(rect(M[p.module],p),r));
 if(m.on==='inside' && !parent) return no('This needs a completed building around it.');
 for(const p of holding.modules || []){
  if(p===parent && m.on==='inside') continue;
  if(M[p.module] && overlaps(r,rect(M[p.module],p))) return no('Another module occupies those squares.');
 }
 if(m.needs.some(id=>!live(holding).some(p=>p.module===id))) return no('Build the required modules first.');
 return {ok:true,why:''};
}
export function startWork(holding,moduleId,at={}){
 const m=M[moduleId];if(!m) return no('Unknown module.');
 const out=structuredClone(holding);out.modules ||= [];out.projects ||= [];out.stores ||= {};
 const repair=at.repairId && out.modules.find(p=>p.id===at.repairId && p.module===moduleId);
 if(at.repairId && (!repair || repair.hp>=m.hp || !repair.built)) return no('No damaged completed module to repair.');
 if(repair && out.projects.some(p=>p.target===repair.id)) return no('Repairs already under way.');
 if(!repair){const check=canPlace(out,m,at,at.floor);if(!check.ok) return check;}
 const fraction=repair?(m.hp-repair.hp)/m.hp:1, materials=Object.fromEntries(Object.entries(m.materials).map(([id,n])=>[id,Math.ceil(n*fraction)]));
 if(Object.entries(materials).some(([id,n])=>(out.stores[id] || 0)<n)) return no('Not enough stored materials.');
 for(const [id,n] of Object.entries(materials)) out.stores[id]-=n;
 let serial=1;while(out.modules.some(p=>p.id===`module-${serial}`)) serial++;
 const target=repair || {id:`module-${serial}`,module:moduleId,x:at.x,y:at.y,rot:at.rot || 0,built:false,hp:0};
 if(!repair) out.modules.push(target);
 out.projects.push({target:target.id,module:moduleId,repair:!!repair,remaining:m.days*m.labour*fraction,cost:Math.ceil(m.cost*fraction),paid:false});
 return {ok:true,holding:out,why:''};
}
export function advance(holding,{days=1,workers=holding.workers || [],gold=0}={},rng){
 if(!Number.isFinite(days) || days<0 || !Number.isFinite(gold) || gold<0) return no('Days and gold must be non-negative.');
 const out=structuredClone(holding), finished=[],events=[];let spentGold=0;
 const crew=typeof workers==='number'?Math.max(0,Math.floor(workers)):new Set(workers.filter(w=>w && !w.dead && w.alive!==false && !['dog','lostChild','child'].includes(w.role)).map(w=>w.id)).size;
 // One shared labour budget; parallel projects cannot reuse the same workers.
 let budget=crew*days;
 for(const p of out.projects || []){
  if(budget<=0) break;
  if(!p.paid){if(gold-spentGold<p.cost) continue;spentGold+=p.cost;p.paid=true;}
  const m=M[p.module], cap=m.labour*2*days;
  const labour=Math.min(budget,cap,p.remaining);budget-=labour;
  const r=rng();
  if(r<.05){events.push({kind:'delay',target:p.target,text:'A supply cart is late.'});continue;}
  if(r<.1){const spy=Array.isArray(workers)?workers.find(w=>w.spy && !w.dead):null;events.push({kind:'eyes',target:p.target,secret:true,worker:spy?.id || null,member:spy?.spy?.for || null,text:'A worker saw a figure in the trees. Check whose eyes are among the crew.'});}
  p.remaining=Math.max(0,p.remaining-labour);
  if(!p.remaining){const target=out.modules.find(m=>m.id===p.target);target.built=true;target.hp=m.hp;finished.push(target.id);}
 }
 out.projects=(out.projects || []).filter(p=>p.remaining>0);
 return {ok:true,holding:out,finished,events,spentGold};
}
export function stats(holding){
 const out={defence:0,ward:0,beds:0,storage:0,workshops:[],upkeep:0,income:0,comfort:0};
 for(const p of live(holding)){
  const m=M[p.module];
  if(m.on==='inside' && !live(holding).some(b=>M[b.module].gives.building && contains(rect(M[b.module],b),rect(m,p)))) continue;
  for(const k of Object.keys(out)) if(k==='workshops') out.workshops.push(...(m.gives.workshops || []));else out[k]+=m.gives[k] || 0;
 }
 out.workshops=[...new Set(out.workshops)];return out;
}
export function grow(holding,kind){
 if(!KINDS[holding.kind]?.next.includes(kind)) return no('That is not the next kind of holding.');
 if(KINDS[kind].needs.some(id=>!live(holding).some(m=>m.module===id))) return no('Complete the new holding’s required modules first.');
 const out=structuredClone(holding);out.kind=kind;
 if(out.bounds){out.bounds.w=KINDS[kind].w;out.bounds.h=KINDS[kind].h;}
 return {ok:true,holding:out};
}
export function raidCheck(holding,court,{gaze=0,day=0}={},rng){
 const members=(court?.members || []).filter(m=>m.alive);if(!members.length) return null;
 const s=stats(holding), salt=live(holding).some(m=>M[m.module].gives.salt), wealth=(holding.stores?.gp || 0)+live(holding).reduce((n,m)=>n+M[m.module].cost,0);
 const chance=Math.max(0,Math.min(.9,.04+Math.max(0,gaze)*.04+(members.some(m=>m.grudge || m.hunting)?.12:0)+Math.min(.2,wealth/10000)-s.defence*.005-s.ward*.025-(salt?.08:0)));
 if(rng()>=chance) return null;
 const member=members[Math.floor(rng()*members.length)];
 return {id:`raid-${holding.id}-${day}`,member:member.id,day,power:member.rank*5+member.power,chance,court:structuredClone(court)};
}
export function resolveRaid(holding,raid,{defenders=0}={},rng){
 if(!raid?.court?.members.some(m=>m.id===raid.member)) return no('Raid needs its court snapshot.');
 if((holding.resolvedRaids || []).includes(raid.id)) return no('That raid has already been resolved.');
 const out=structuredClone(holding),court=structuredClone(raid.court),s=stats(out);
 const strength=typeof defenders==='number'?Math.max(0,defenders):defenders.filter(d=>!d.dead && (d.hp ?? 1)>0).length*3;
 const won=s.defence+strength+Math.floor(rng()*20)>=raid.power+10;
 const damage=[];
 if(!won) for(const m of live(out).slice(0,2)){const amount=Math.min(m.hp,Math.max(1,raid.power));m.hp-=amount;damage.push({id:m.id,amount});}
 out.stores ||= {};const loot=won?0:Math.min(out.stores.gp || 0,raid.power*5);out.stores.gp=(out.stores.gp || 0)-loot;
 const fate=won?'fled':'won', fight=recordFight(court,raid.member,{outcome:fate,place:out.place,day:raid.day,by:'the holding’s defenders'},rng);
 out.resolvedRaids=[...(out.resolvedRaids || []),raid.id];
 return {ok:true,holding:out,court,damage,loot,fate,fight};
}
