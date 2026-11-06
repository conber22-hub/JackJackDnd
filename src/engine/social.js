/* Immutable DM-side results. Persist result.person once; apply costs in the game
   layer. person.day is the campaign day; optional context.party filters memories. */
import { ATTITUDES,APPROACHES,DC,MOTIVES,RUMOURS } from '../data/social.js';
import { heroStats } from './hero.js';
const copy=v=>structuredClone(v),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const motives=p=>({...(MOTIVES[p.role] || MOTIVES.other),...p.motives});
export function recall(person,{day=person.day ?? 0,party=null}={}){
 return (person.memories || []).filter(m=>!party || !m.party || m.party===(typeof party==='string'?party:party.id)).map(m=>({...copy(m),weight:m.debt?m.weight:m.weight*2**(-Math.max(0,day-m.day)/(m.kind==='rescue'?30:14))}));
}
export function remember(person,event){
 const out=copy(person),weight=event.weight ?? ({rescue:12,lie:-4,paid:2,intimidated:-2,promise:1}[event.kind] || 0);
 if(!Number.isFinite(weight)) throw new RangeError('Memory weight must be finite.');
 const record={kind:event.kind || 'deed',text:event.text || 'They came to the village.',weight,day:event.day ?? out.day ?? 0,debt:event.debt===true,...(event.party?{party:typeof event.party==='string'?event.party:event.party.id}:{}),public:event.public===true};
 out.memories=[...(out.memories || []),record];
 // Debts are never evicted by the ordinary memory limit.
 const ordinary=out.memories.filter(m=>!m.debt).slice(-20);out.memories=out.memories.filter(m=>m.debt || ordinary.includes(m));return out;
}
export function attitudeOf(person,{gaze=person.gaze ?? 1,party=null,place=null,day=person.day ?? 0}={}){
 if(person.fearActive===true && !person.fearResolved) return 'terrified';
 if(person.mood==='afraid' && gaze>=7 && !person.fearResolved) return 'terrified';
 let score=person.attitude && ATTITUDES.includes(person.attitude)?ATTITUDES.indexOf(person.attitude):({easy:2,wary:1,afraid:0}[person.mood] ?? (person.role==='watch'?0:1));
 score-=gaze>=8?2:gaze>=5?1:0;
 score+=recall(person,{day,party}).reduce((n,m)=>n+m.weight,0)/2;
 if(place && person.bannedFrom=== (typeof place==='string'?place:place.id)) score--;
 return ATTITUDES[clamp(Math.round(score),0,2)];
}
export function influence(person,{approach,hero,offer=0,rng,gaze=person.gaze ?? 1,party=null,place=null,request='small',want=false,fear=false,promise=null,exposed=false,roll:given}={}){
 if(!APPROACHES[approach]) throw new RangeError('Unknown approach.');
 if(!Number.isFinite(offer) || offer<0) throw new RangeError('Offer must be non-negative gp.');
 const attitude=attitudeOf(person,{gaze,party,place}),cost={gp:0,promise:null,witness:null};let out=copy(person);
 if(exposed && approach==='deceive') out=remember(out,{kind:'lie',text:'They lied and were found out.',party,public:true});
 if(approach!=='insight' && (attitude==='terrified' || attitude==='hostile' && request==='dangerous')) return {ok:false,roll:null,dc:null,shift:0,text:attitude==='terrified'?'Their fear must be dealt with before they can help.':'They will not accept that danger for you.',cost,person:out};
 let dc=approach==='insight'?15:DC[attitude] ?? 20;
 if(request==='big') dc+=5;
 if(want) dc-=5;
 if(approach==='intimidate' && fear) dc-=5;
 if(approach==='bribe'){if(offer<=0) return {ok:false,roll:null,dc,shift:0,text:'There is no bribe on offer.',cost,person:out};dc-=Math.min(5,Math.floor(offer/5));cost.gp=offer;}
 dc=clamp(dc,5,30);
 const skill=APPROACHES[approach],stats=hero?.ab?heroStats(hero):hero || {},bonus=stats.skills?.[skill] ?? stats.mods?.[approach==='insight'?'wis':'cha'] ?? 0;
 const raw=given ?? 1+Math.floor(rng()*20);if(!Number.isInteger(raw) || raw<1 || raw>20) throw new RangeError('Roll must be a raw d20.');
 const total=raw+bonus,ok=total>=dc;let shift=approach==='insight'?0:ok?1:total<=dc-5?-1:0;
 if(approach==='insight') return {ok,roll:{raw,bonus,total},dc,shift:0,text:ok?`They want ${motives(person).want}; they fear ${motives(person).fear}.`:'They keep their thoughts to themselves.',cost,person:out,...(ok?{learned:motives(person)}:{})};
 if(shift) out=remember(out,{kind:shift>0?'influence':'rebuff',text:shift>0?'They spoke to me with some success.':'Their words made matters worse.',weight:shift*2,party,public:true});
 if(approach==='intimidate'){
  cost.witness={kind:'intimidation',person:person.id,hero:hero?.id || null};
  if(fear) out=remember(out,{kind:'intimidated',text:'They used my fear against me.',party,public:true});
 }
 if(ok && promise){cost.promise=String(promise);out=remember(out,{kind:'promise',text:String(promise),debt:true,party,public:true});}
 if(approach==='bribe') out=remember(out,{kind:'paid',text:'They paid well.',party,public:true});
 return {ok,roll:{raw,bonus,total},dc,shift,text:ok?'They will hear you out.':'They turn your request aside.',cost,person:out};
}
export function rumour(person,{gaze=person.gaze ?? 1,party=null,truth,half,lie}={},rng){
 const attitude=attitudeOf(person,{gaze,party}),veracity=attitude==='friendly'?'true':attitude==='indifferent'?'half':'lie';
 const pool=RUMOURS[veracity],text=({true:truth,half,lie}[veracity]) || pool[Math.floor(rng()*pool.length)];
 return {text,veracity,true:veracity==='true',attitude};
}
export function forPlayers(person){
 const out={id:person.id,name:person.name,role:person.role};
 if(typeof person.saying==='string') out.saying=person.saying;
 if(typeof person.rumour?.text==='string') out.rumour={text:person.rumour.text};
 return out;
}
