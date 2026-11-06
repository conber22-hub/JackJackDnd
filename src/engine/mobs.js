/* Mob rules are an abstraction over individual creatures, not swarm statblocks.
   Return updated mobs; caller applies moves/conditions/defences in the game layer. */
import { HIT_BANDS,SURROUND,LEADERS,DEMANDS,MORALE } from '../data/mobs.js';
import { SRD_MONSTERS } from '../data/srd-monsters.js';
const copy=v=>structuredClone(v),pick=(a,rng)=>a[Math.floor(rng()*a.length)];
function average(expr){
 if(Number.isFinite(expr))return expr;
 const terms=String(expr).replace(/\s/g,'').match(/[+-]?[^+-]+/g) || [];let total=0;
 for(const term of terms){const sign=term.startsWith('-')?-1:1,t=term.replace(/^[+-]/,''),d=/^(\d*)d(\d+)$/.exec(t);if(!d && !Number.isFinite(+t))throw new RangeError('Use a number or dice expression.');total+=sign*(d?+(d[1] || 1)*(+d[2]+1)/2:+t);}
 return total;
}
const living=m=>m.hp.map((hp,i)=>({hp,id:m.memberIds[i],index:i})).filter(m=>m.hp>0);
const active=m=>living(m).filter(p=>!m.fleeing.includes(p.id) && !m.turned.some(t=>t.member===p.id));
export function makeMob(creature,n,{rng}={}){
 if(!Number.isInteger(n)||n<1||n>1000 || !creature?.id || !Number.isFinite(creature.ac))throw new RangeError('Use a creature and 1–1000 members.');
 const hp=Math.max(1,Math.floor(creature.hpAverage ?? average(creature.hp))),attack=creature.attacks?.find(a=>Number.isFinite(a.b) && a.d);
 if(!attack)throw new RangeError('A mob needs an attack roll and damage.');
 const id=`mob-${creature.id}-${Math.floor(rng()*0x100000000).toString(36)}`,undead=creature.tags?.includes('undead') || /undead/i.test(creature.sizeText || ''),role=/commoner|villager/i.test(creature.name)?'villagers':/guard/i.test(creature.name)?'guard':'other';
 return {id,b:creature.id,n,initial:n,hp:Array(n).fill(hp),memberIds:Array.from({length:n},(_,i)=>`${id}-${i}`),ac:creature.ac,attack:copy(attack),undead:!!undead,morale:{bonus:MORALE[role],checked:[],leaderChecked:false},formation:[],fleeing:[],turned:[]};
}
export function mobAttack(mob,target,{rng}={}){
 const available=active(mob),size=typeof target.size==='string'?target.size.toLowerCase():target.size===2?'large':target.size>=3?'huge':'medium';
 let reachable=available.length;
 if(mob.formation.length && Number.isFinite(target.x) && Number.isFinite(target.y)){
  const reach=mob.attack.reach ?? 1,span=typeof target.size==='number'?target.size:1;
  reachable=available.filter(p=>mob.formation.some(s=>s.member===p.id && Math.max(Math.max(target.x-s.x,0,s.x-(target.x+span-1)),Math.max(target.y-s.y,0,s.y-(target.y+span-1)))<=reach)).length;
 }else if(Number.isFinite(target.distance) && target.distance>(mob.attack.rng?.[0] ?? (mob.attack.reach ?? 1)*5)) reachable=0;
 reachable=Math.max(0,Math.floor(Math.min(reachable,target.reachable ?? reachable,mob.attack.m===1 || !mob.attack.rng?SURROUND[size] || 8:available.length)));
 const need=target.ac-(mob.attack.b || 0),band=HIT_BANDS.find(b=>need<=b.need) || HIT_BANDS.at(-1),expected=reachable*band.probability;
 const hits=Math.floor(expected)+(rng()<expected%1?1:0),damage=Math.max(0,Math.floor(hits*average(mob.attack.d)));
 return {hits,damage,attackers:reachable,text:`${reachable} attackers land ${hits} hits for ${damage} damage.`};
}
export function formation(mob,squares){
 const seen=new Set(),open=squares.filter(s=>s.open!==false && s.blocked!==true && Number.isInteger(s.x) && Number.isInteger(s.y) && !seen.has(`${s.x},${s.y}`) && (seen.add(`${s.x},${s.y}`),true));
 const origin=mob.origin || mob.formation[0] || open[0] || {x:0,y:0};
 open.sort((a,b)=>Math.abs(a.x-origin.x)+Math.abs(a.y-origin.y)-Math.abs(b.x-origin.x)-Math.abs(b.y-origin.y) || a.y-b.y || a.x-b.x);
 return living(mob).slice(0,open.length).map((m,i)=>({x:open[i].x,y:open[i].y,member:m.id}));
}
export function hitMob(mob,damage,{area=false,squares=null,count=null}={}){
 if(!Number.isFinite(damage)||damage<0)throw new RangeError('Damage must be non-negative.');
 if(area && !squares && count==null)throw new RangeError('Supply area squares or a member count.');
 const out=copy(mob),before=out.n;let affected=0;const damaged=new Set();
 if(area){
  const ids=squares?new Set(out.formation.filter(p=>squares.some(s=>s.x===p.x && s.y===p.y)).map(p=>p.member)):null;
  const limit=count ?? (ids?ids.size:0);if(!ids && (!Number.isInteger(limit)||limit<0))throw new RangeError('Area count must be non-negative.');
  for(let i=0;i<out.hp.length;i++) if(ids?ids.has(out.memberIds[i]):affected<limit){if(damage>0)damaged.add(out.memberIds[i]);out.hp[i]=Math.max(0,out.hp[i]-damage);affected++;}
 }else {let left=damage;for(let i=0;i<out.hp.length && left>0;i++){const used=Math.min(left,out.hp[i]);out.hp[i]-=used;left-=used;if(used){affected++;damaged.add(out.memberIds[i]);}}}
 const survivors=out.hp.map((hp,i)=>({hp,id:out.memberIds[i]})).filter(p=>p.hp>0);out.hp=survivors.map(p=>p.hp);out.memberIds=survivors.map(p=>p.id);out.n=out.hp.length;
 out.formation=out.formation.filter(p=>out.memberIds.includes(p.member));out.fleeing=out.fleeing.filter(id=>out.memberIds.includes(id));out.turned=out.turned.filter(t=>out.memberIds.includes(t.member) && !damaged.has(t.member));
 return {mob:out,killed:before-out.n,affected};
}
export function moraleCheck(mob,{leaderDead=false,lost=mob.initial-mob.n,gaze=1,rng,turned=0}={}){
 const out=copy(mob);
 if(out.undead){
  const count=turned===true?active(out).length:turned;if(!Number.isInteger(count)||count<0)throw new RangeError('Turned is the number who failed Turn Undead.');
  const members=active(out).slice(0,count);for(const p of members)out.turned.push({member:p.id,conditions:['frightened','incapacitated'],rounds:10,endsOnDamage:true});
  return {holds:members.length===0,flees:members.length,text:members.length?'The turned dead recoil from the holy sign.':'The dead do not break.',mob:out,triggered:members.length>0};
 }
 const levels=[.25,.5].filter(t=>Math.max(lost,mob.initial-mob.n)>=Math.ceil(mob.initial*t) && !out.morale.checked.includes(t));
 const leader=leaderDead && !out.morale.leaderChecked;if(!levels.length && !leader)return {holds:true,flees:0,text:'The line holds without a new check.',mob:out,triggered:false};
 out.morale.checked.push(...levels);if(leader)out.morale.leaderChecked=true;
 const dc=10+(levels.includes(.5)?3:0)+(leader?3:0)+Math.max(0,gaze-5),raw=1+Math.floor(rng()*20),holds=raw+out.morale.bonus>=dc;
 const flees=holds?0:Math.ceil(active(out).length/2);if(flees)out.fleeing.push(...active(out).slice(0,flees).map(p=>p.id));
 return {holds,flees,text:holds?'The mob closes ranks.':'The mob breaks; half its remaining line runs.',mob:out,triggered:true,roll:raw,dc};
}
export function rising({place='village',gaze=1,cause='',rng}={}){
 const creature=SRD_MONSTERS.find(b=>b.id===(gaze>=7?'srd-guard':'srd-commoner')),out=makeMob(creature,10+Math.floor(rng()*21),{rng});
 out.place=typeof place==='string'?place:place.id;out.torches=Math.ceil(out.n/3);out.demand=cause || pick(DEMANDS,rng);
 out.leader={id:`${out.id}-leader`,name:pick(LEADERS,rng),role:gaze>=7?'watch':'farmer',mood:'afraid',grievance:out.demand};return out;
}

export function advanceMob(mob,rounds=1){
 if(!Number.isInteger(rounds)||rounds<0)throw new RangeError('Rounds must be non-negative.');const out=copy(mob);out.turned=out.turned.map(t=>({...t,rounds:t.rounds-rounds})).filter(t=>t.rounds>0);return out;
}
