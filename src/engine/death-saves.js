import { DEATH_WORDS } from '../data/death-saves.js';

const fresh = () => ({ s:0, f:0, stable:false, dead:false });
const count = n => Math.min(3,Math.max(0,Math.trunc(Number(n)||0)));
function copy(d){
  if (!d || typeof d!=='object') return null;
  return {s:count(d.s),f:count(d.f),stable:!!d.stable,dead:!!d.dead};
}
export function wordsFor(outcome,seed){
  const lines=Object.hasOwn(DEATH_WORDS,outcome)?DEATH_WORDS[outcome]:[];
  const n=Number.isFinite(seed)?Math.trunc(seed):0;
  return lines[(n%lines.length+lines.length)%lines.length] ?? '';
}
function result(dying,outcome,caption=outcome,seed=0){
  return {dying,outcome,words:wordsFor(caption,seed)};
}
export const isDying = d => !!d && typeof d==='object' && !d.stable && !d.dead;
export function startDying(hit){
  const {hpBefore,damage,maxHp}=hit??{};
  if (!(damage>0 && hpBefore>0 && damage>=hpBefore)) return result(null,'none');
  if (maxHp>0 && damage-hpBefore>=maxHp) return result({...fresh(),dead:true},'dead');
  return result(fresh(),'down');
}
function fail(d,n,caption,seed){
  const f=count(d.f+n);
  const state={...d,f,dead:f===3};
  return f===3?result(state,'dead','dead',seed):result(state,'failure',caption,seed);
}
export function deathSave(dying,d20,opts){
  const d=copy(dying), advantage=opts?.advantage;
  let rolled=Array.isArray(d20)?d20[0]:d20;
  if(Array.isArray(d20) && d20.length>=2 && typeof advantage==='boolean')
    rolled=(advantage?Math.max:Math.min)(d20[0],d20[1]);
  if(!isDying(d) || !Number.isInteger(rolled) || rolled<1 || rolled>20) return {...result(d,'none'),rolled:null};
  let r;
  if(rolled===20) r=result(null,'rise','rise',rolled);
  else if(rolled===1) r=fail(d,2,'two',rolled);
  else if(rolled+(Number(opts?.bonus)||0)<10) r=fail(d,1,'failure',rolled);
  else if(d.s>=2) r=result({...fresh(),stable:true},'stable','stable',rolled);
  else r=result({...d,s:d.s+1},'success','success',rolled);
  return {...r,rolled};
}
export function hurtWhileDown(dying,hit){
  let d=copy(dying);
  if(!d || d.dead || !(hit?.damage>0)) return result(d,'none');
  if(d.stable) d=fresh();
  if(hit.maxHp>0 && hit.damage>=hit.maxHp) return result({...d,dead:true},'dead');
  return fail(d,hit.crit?2:1,hit.crit?'two':'hurt',hit.damage);
}
export function healWhileDown(dying,amount){
  const d=copy(dying);
  return d && !d.dead && amount>0 ? result(null,'rise','rise',amount) : result(d,'none');
}
export function stabilize(dying,check){
  const d=copy(dying);
  if(!isDying(d)) return result(d,'none');
  return check?.auto || check?.total>=10 ? result({...fresh(),stable:true},'stable') : result(d,'failed');
}
export function dyingMarks(dying){
  const d=copy(dying) ?? fresh();
  return {...d,s:[1,2,3].map(i=>i<=d.s),f:[1,2,3].map(i=>i<=d.f)};
}
