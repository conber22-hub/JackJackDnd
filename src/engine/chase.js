/* One simultaneous movement phase, then actions/complication, then resolution.
   con/dex are scores; mods and skills may override them. Positions are feet.
   Dash/exhaustion belong to the moving creature (mount/team when mounted). */
import { COMPLICATIONS,MOUNT_SPEED,ROUND_CAP,ESCAPE_LEAD } from '../data/chase.js';
const copy=v=>structuredClone(v),mod=n=>Math.floor(((n ?? 10)-10)/2),die=rng=>1+Math.floor(rng()*20);
const active=p=>!p.status;
function mover(p){return p.cart?.team && typeof p.cart.team==='object'?p.cart.team:p.mount && typeof p.mount==='object'?p.mount:p;}
function speed(p){
 const m=mover(p),name=typeof p.mount==='string'?p.mount:p.mount?.kind || p.mount?.name;
 // Workshop wagon.speed is miles/day, so never use it as combat feet.
 const team=typeof p.cart?.team==='string'?MOUNT_SPEED[p.cart.team]:p.cart?.team?.speed ?? MOUNT_SPEED[p.cart?.team?.kind];
 let s=p.cart?.speedFt ?? team ?? (m!==p?m.speed ?? MOUNT_SPEED[m.kind || m.name]:null) ?? MOUNT_SPEED[name] ?? p.speed;
 if(p.cart && (p.cart.damage || 0)>=p.cart.hp) return 0;
 s=Math.max(0,s-5*(m.exhaustion || 0));if(p.cart && (p.cart.damage || 0)>p.cart.hp/2) s*=.75;
 return (m.exhaustion || 0)>=6?0:s;
}
function bonus(p,ability){return p.mods?.[ability] ?? mod(p[ability]);}
function check(p,ability,dc,rng,skill){const raw=die(rng),total=raw+(p.skills?.[skill] ?? bonus(p,ability))-2*(p.exhaustion || 0);return {raw,total,dc,ok:total>=dc};}
export function startChase({quarry,pursuers,terrain='road',light='day',weather='clear',rng}){
 if(!COMPLICATIONS[terrain] || !quarry?.length || !pursuers?.length || typeof rng!=='function') throw new RangeError('Choose participants, terrain and rng.');
 const all=[...quarry,...pursuers];if(new Set(all.map(p=>p.id)).size!==all.length || all.some(p=>p.id==null || !Number.isFinite(p.speed) || p.speed<0)) throw new RangeError('Participants need unique IDs and non-negative speeds.');
 return {terrain,light,weather:copy(weather),round:0,participants:[...quarry.map(p=>({...copy(p),side:'quarry',position:p.position ?? 60,dashes:0})),...pursuers.map(p=>({...copy(p),side:'pursuer',position:p.position ?? 0,dashes:0}))],cover:false,events:[]};
}
function finish(s){
 const hunters=s.participants.filter(p=>p.side==='pursuer' && active(p));
 for(const p of s.participants.filter(p=>p.side==='quarry' && active(p))){
  const nearest=hunters.length?Math.max(...hunters.map(h=>h.position)):-Infinity,lead=p.position-nearest;
  if(hunters.some(h=>Math.abs(h.position-p.position)<=5 || h.position>p.position)){p.status='captured';continue;}
  if(p.hidden || !hunters.length || lead>=ESCAPE_LEAD && (s.cover || s.light!=='day' || ['woods','marsh','castle halls','village street','rooftops'].includes(s.terrain))) p.status='escaped';
  if(!p.status && s.round>=ROUND_CAP) p.status='escaped';
 }
}
export function chaseRound(state,actions={},rng){
 if(result(state).over) return {state:copy(state),events:[]};
 const s=copy(state),events=[];s.round++;s.cover=false;
 const action=p=>typeof actions[p.id]==='string'?{type:actions[p.id]}:actions[p.id] || {type:'move'};
 for(const p of s.participants.filter(active)){
  const a=action(p),m=mover(p);delete p.hidden;
  if(a.type==='giveup' || (m.exhaustion || 0)>=6 || p.hp!=null && p.hp<=0 || p.cart && (p.cart.damage || 0)>=p.cart.hp){p.status='gave up';events.push({who:p.id,kind:'giveup'});continue;}
  let movement=speed(p);
  if(a.type==='dash'){
   p.dashes++;const limit=Math.max(0,3+mod(m.con ?? p.con));
   if(p.dashes>limit){const c=check(m,'con',10,rng);events.push({who:p.id,kind:'dash-check',...c});if(!c.ok)m.exhaustion=Math.min(6,(m.exhaustion || 0)+1);}
   movement=speed(p)*2;
  }
  if(a.type==='hide') movement*=.5;
  const ground=['marsh','rooftops'].includes(s.terrain)?.75:1,wet=['rain','snow'].includes(typeof s.weather==='string'?s.weather:s.weather?.kind)?.8:1;
  p.position+=movement*ground*wet;
 }
 // Help and obstacles cannot stack once per source/target this round.
 const slowed=new Set(),helped=new Set();
 for(const p of s.participants.filter(active)){
  const a=action(p),target=s.participants.find(t=>t.id===a.target && active(t));
  if(a.type==='help' && target && target.side===p.side && speed(target)<speed(p) && Math.abs(target.position-p.position)<=30 && !helped.has(target.id)){target.position+=10;helped.add(target.id);events.push({who:p.id,kind:'help',target:target.id});}
  if(a.type==='obstacle'){
   const made=check(p,'dex',12,rng);events.push({who:p.id,kind:'obstacle',...made});
   if(made.ok)for(const h of s.participants.filter(h=>active(h) && h.side!==p.side && h.position<=p.position && p.position-h.position<=60 && !slowed.has(h.id))){const c=check(mover(h),'dex',12,rng,'Acrobatics');if(!c.ok){h.position-=15;slowed.add(h.id);}events.push({who:h.id,kind:'obstacle-check',...c});}
  }
  if(a.type==='attack' && target){
   const range=a.range ?? p.range ?? 5,distance=Math.abs(p.position-target.position);
   if(distance<=range){const raw=die(rng),hit=raw===20 || raw!==1 && raw+(p.attackBonus || 0)-2*(p.exhaustion || 0)>=(target.ac || 10);const damage=hit?1+Math.floor(rng()*6):0;
    if(target.cart)target.cart.damage=Math.min(target.cart.hp,(target.cart.damage || 0)+damage);else if(target.hp!=null)target.hp=Math.max(0,target.hp-damage);
    events.push({who:p.id,kind:'attack',target:target.id,raw,hit,damage});
   }else events.push({who:p.id,kind:'out-of-range',target:target.id});
  }
 }
 const pool=COMPLICATIONS[s.terrain],comp=pool[Math.floor(rng()*pool.length)],people=s.participants.filter(active);
 if(people.length){const p=people[Math.floor(rng()*people.length)],c=check(mover(p),comp.check.ability,comp.check.dc,rng);if(comp.effect.mist)s.cover=true;
  if(!c.ok){p.position-=comp.effect.slow || 0;if(comp.effect.damage){if(p.cart)p.cart.damage=Math.min(p.cart.hp,(p.cart.damage || 0)+comp.effect.damage);else if(p.hp!=null)p.hp=Math.max(0,p.hp-comp.effect.damage);}}
  events.push({kind:'complication',who:p.id,id:comp.id,text:comp.text,...c});
 }
 for(const p of s.participants.filter(active)){
  const m=mover(p);if((m.exhaustion || 0)>=6 || p.hp!=null && p.hp<=0 || p.cart && (p.cart.damage || 0)>=p.cart.hp){p.status='gave up';continue;}
  if(action(p).type==='hide' && p.side==='quarry'){
   const hunters=s.participants.filter(h=>h.side==='pursuer' && active(h)),lead=p.position-(hunters.length?Math.max(...hunters.map(h=>h.position)):-Infinity),cover=s.cover || s.light!=='day' || ['woods','marsh','castle halls','rooftops'].includes(s.terrain);
   if(cover && lead*(s.cover?2:1)>=30){const dc=hunters.length?Math.max(...hunters.map(h=>h.passive ?? 10+bonus(h,'wis'))):10,c=check(p,'dex',dc,rng,'Stealth');p.hidden=c.ok;events.push({who:p.id,kind:'hide',...c});}
   else events.push({who:p.id,kind:'cannot-hide'});
  }
  if(p.monster && s.round>=5 && p.morale!=null && die(rng)+mod(p.wis)<p.morale){p.status='gave up';events.push({who:p.id,kind:'morale'});}
 }
 finish(s);s.events=events;return {state:s,events};
}
export function result(state){
 const q=state.participants.filter(p=>p.side==='quarry'),over=q.every(p=>p.status) || state.round>=ROUND_CAP;
 const statuses=[...new Set(q.map(p=>p.status).filter(Boolean))];
 return {over,who:over?q.map(p=>({id:p.id,how:p.status || 'escaped'})):[],how:over?(statuses.length===1?statuses[0]:'mixed'):null,positions:state.participants.map(p=>({id:p.id,side:p.side,feet:p.position,status:p.status || null}))};
}
