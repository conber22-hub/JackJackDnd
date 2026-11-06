/* All state changes are returned in hero; the game layer persists once and applies
   transient conditions. Restoration cures here are house rules for these marks,
   not a claim that SRD restoration spells cure every kind of mental affliction. */
import { SOURCES,MARKS,MARK_BY_ID,RELIEF,WHISPERS } from '../data/horror.js';
import { heroStats } from './hero.js';
const copy=v=>structuredClone(v),pick=(a,rng)=>a[Math.floor(rng()*a.length)];
function state(hero){const out=copy(hero);out.horror={enabled:false,fails:0,passed:[],marks:[],...(out.horror || {})};return out;}
export const stress=hero=>hero.horror?.fails || 0;
export function horrorCheck(hero,{source,dc,gaze=1,rng,roll}={}){
 const s=SOURCES[source];if(!s) throw new RangeError('Unknown horror source.');
 const out=state(hero),target=(dc ?? s.dc)+Math.max(0,gaze-5);
 if(!Number.isFinite(target)) throw new RangeError('DC must be finite.');
 const raw=()=>{const v=roll?.shift() ?? 1+Math.floor(rng()*20);if(!Number.isInteger(v)||v<1||v>20)throw new RangeError('Supply raw d20 rolls.');return v;};
 // Copy supplied dice so callers can retain the roll log.
 roll=roll?copy(roll):null;
 const dice=[raw()];if(out.horror.passed.includes(source))dice.push(raw());
 const bonus=hero.ab?heroStats(hero).saves.Wis:hero.saves?.wis ?? hero.saves?.Wis ?? hero.mods?.wis ?? 0;
 const total=Math.max(...dice)+(bonus || 0)-2*(hero.exhaustion || 0),ok=total>=target;
 let effect=null,text=s.text;
 if(ok){if(!out.horror.passed.includes(source))out.horror.passed.push(source);text+=' You keep your footing.';}
 else {
  const previous=stress(out);out.horror.fails++;
  const margin=target-total,kind=out.horror.enabled && previous>=3 || margin>=10?'lasting':margin>=5?'short':'frightened';
  if(kind==='frightened'){effect={kind,condition:'frightened',rounds:10,source};text+=' Fear takes hold for a minute.';}
  else {
   const choices=s[kind].filter(id=>!out.horror.marks.some(m=>m.id===id));
   const pool=choices.length?choices:MARKS.filter(m=>m.kind===kind && !out.horror.marks.some(x=>x.id===m.id)).map(m=>m.id);
   const mark=MARK_BY_ID[pick(pool.length?pool:s[kind],rng)],already=out.horror.marks.some(m=>m.id===mark.id);
   effect={kind,mark:copy(mark),source,whisperEligible:gaze>=7 && mark.whisper===true,renewed:already};
   if(!already)out.horror.marks.push({id:mark.id,source});text=mark.text;
  }
 }
 return {ok,roll:{dice,bonus:bonus || 0,total,advantage:dice.length===2},dc:target,effect,text,hero:out};
}
export function longRest(hero,{safe=false}={}){
 const out=state(hero);out.horror.marks=out.horror.marks.filter(m=>MARK_BY_ID[m.id]?.kind!=='short');
 // Safe rest clears one stress point. Unsafe rest does not clear the counter.
 if(safe)out.horror.fails=Math.max(0,out.horror.fails-1);return out;
}
export function relief(hero,kind){if(!Object.hasOwn(RELIEF,kind))throw new RangeError('Unknown relief.');const out=state(hero);out.horror.fails=Math.max(0,out.horror.fails-RELIEF[kind]);return out;}
export function cure(hero,id,kind){
 const out=state(hero),mark=MARK_BY_ID[id],has=out.horror.marks.some(m=>m.id===id);
 if(!has || !mark?.cure.includes(kind))return {ok:false,hero:out,text:'That cure does not answer this mark.'};
 out.horror.marks=out.horror.marks.filter(m=>m.id!==id);return {ok:true,hero:out,text:`${mark.n} loosens its hold.`};
}
export function whisper(hero,id,{gaze,session,rng}={}){
 const out=state(hero),mark=MARK_BY_ID[id];
 if(!session || !Number.isFinite(gaze) || gaze<7 || !mark?.whisper || !out.horror.marks.some(m=>m.id===id) || out.horror.whisperSession===session) return {ok:false,hero:out,text:null};
 out.horror.whisperSession=session;return {ok:true,hero:out,text:pick(WHISPERS,rng)};
}
