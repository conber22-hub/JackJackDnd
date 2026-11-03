/* Read-only planning, using the same live state as targeting/movement. `floor` must be
   state.floors[me.floor]; allies/foes must be tokens on that floor. No dice are rolled:
   stable input order breaks ties, so rng and round are reserved for future tactics.
   target is a token ID; to is a destination, never a teleport or an extra action. */
import { state } from './state.js';
import { BEST } from '../data/bestiary.js';
import { rangeCheck, coverOf, areaOf, areaSquares, caughtIn } from './targeting.js';
import { planToward, tokGap, isMelee, provokers, checkPath } from './movement.js';
import { canAct, speedOf, implied } from './conditions.js';
import { avgDice } from '../util/core.js';
const live = t => !t.dead && !t.flags?.gone;
const standing = t => live(t) && t.hp > 0;
const name = t => t.name || 'the foe';
const plan = (kind, why, rest = {}) => ({kind,...rest,why});
const matches = (t, hero) => hero && (t.id === hero || t.name === hero);
export function planTurn(me, { allies = [], foes = [], floor, round, court } = {}, rng){
  if (!state || floor !== state.floors[me.floor]) return plan('hold','The battlefield needs refreshing.');
  const active = canAct(me);
  if (!standing(me) || !active.actions) return plan('hold','It cannot take an action.');
  foes = foes.filter(t => !t.flags?.gone && (!t.dead || (t.kind!=='monster' && t.hp<=0)) && t.floor === me.floor);
  allies = allies.filter(t => live(t) && t.floor === me.floor && t.id !== me.id);
  const m = court?.members?.find(m => m.id === me.nem && m.alive), b = BEST[me.bid] || {};
  const hunter = me.flags?.undeadHunter || /revenant|wight/i.test(me.bid || '');
  const eligible = foes.filter(t => t.hp > 0 || hunter || matches(t,m?.grudge?.hero));
  // Even a finishing breath must not accidentally hit fallen heroes it would spare.
  let best = null;
  for (const [i, sp] of (me.casts || []).entries()){
    const area = areaOf(sp);
    if (sp.k !== 'save' || !area || me.spent?.[sp.n]) continue;
    for (let y=0;y<floor.H;y++) for (let x=0;x<floor.W;x++){
      const aim={x,y}, hit=areaSquares(me,area,aim);
      if (!hit.ok) continue;
      const caught=caughtIn(me,area,hit.squares,[...foes,...allies,me]);
      if (caught.some(t => t.id===me.id || allies.includes(t) || !eligible.includes(t))) continue;
      const targets=caught.filter(t => eligible.includes(t));
      if (targets.length<2 && !(targets.length===1 && targets[0].hp<=targets[0].maxHp/2)) continue;
      if (!best || targets.length>best.count) best={count:targets.length,i,aim};
    }
  }
  if (best) return plan('cast',`Its save action catches ${best.count} foe${best.count===1?'':'s'} and no ally.`,{i:best.i,aim:best.aim});
  let allowance=Math.floor(speedOf(me,me.speed ?? 30)/5)*(me.dashed?2:1);
  if (implied(me.conds).has('prone')) allowance=Math.floor(allowance/2);
  allowance=Math.max(0,allowance-(me.moved || 0));
  const threats=foes.filter(standing);
  // Search destinations with the shared pathfinder, retaining only exact reachable ends.
  const away = (from, limit=allowance, safe=false) => {
    if (!from.length || limit<=0) return null;
    const distance=p => Math.min(...from.map(t => tokGap({...me,...p},t)));
    let out=null, score=distance(me);
    for (let y=0;y<floor.H;y++) for (let x=0;x<floor.W;x++){
      if (distance({x,y})<=score) continue;
      const path=planToward(me,x,y,limit), end=path?.at(-1);
      if (!end || end.x!==x || end.y!==y || (safe && provokers(me,path,{tokens:foes}).length)) continue;
      out=end;score=distance(end);
    }
    return out;
  };
  const body=foes.find(t => t.hp<=0 && tokGap(me,t)<=1);
  if (me.bid==='count-s-wolf' && body){
    const to=away(threats,Math.min(4,allowance));
    if (to) return plan('drag',`It carries ${name(body)} away in its jaws.`,{target:body.id,to});
  }
  const brave=!!me.nem || me.flags?.boss || me.flags?.servant || court?.members?.some(c => c.alive && me.name?.endsWith(`(${c.name}'s)`));
  const coward=me.flags?.minion || /beast/i.test(b.type || b.shape || '') || /goblin|wolf|rat|bat/.test(me.bid || '');
  if (!brave && coward && me.hp<me.maxHp/4){
    const to=away(threats);
    return to ? plan('flee','It is badly hurt and runs for safety.',{to}) : plan('dodge','It is cornered and protects itself.');
  }
  if (!eligible.length) return plan('dodge','It has no foe it means to strike.');
  const feared = t => m?.knows?.tactic && [...(t.attacks || []),...(t.casts || [])].some(a => (a.t || a.ty)===m.knows.tactic);
  const options=eligible.filter(t => !feared(t));
  const targets=options.length ? options : eligible;
  const focus=t => (1-t.hp/(t.maxHp || 1))*8+(t.conc?4:0)-(t.ac || 10)/10+(t.hp<=0?10:0);
  const ranged=(me.attacks || []).some(a => !isMelee(a));
  if ((ranged && threats.some(t => tokGap(me,t)<=1)) || threats.some(t => feared(t) && tokGap(me,t)<=1)){
    const to=away(threats.filter(t => tokGap(me,t)<=1));
    if (to) return plan('move','It steps back to keep its distance.',{to});
  }
  let strike=null;
  for (const t of targets) for (const [i,a] of (me.attacks || []).entries()){
    const r=rangeCheck(me,t,a), cover=coverOf(me,t,{tokens:[me,...allies,...foes]});
    if (!r.ok || cover.cover==='total') continue;
    const score=focus(t)+avgDice(a.d || '0')*Math.max(.05,Math.min(.95,(21+(a.b || 0)-(t.ac || 10)-cover.ac)/20))-(r.long?4:0)-(r.close?4:0);
    if (!strike || score>strike.score) strike={score,i,target:t.id};
  }
  if (strike) return plan('attack','It strikes the foe it can hurt most.',{i:strike.i,target:strike.target});
  const target=[...targets].sort((a,b) => focus(b)-focus(a) || tokGap(me,a)-tokGap(me,b))[0];
  let path=allowance>0 && planToward(me,target.x,target.y,allowance);
  // Stop as soon as a ranged shot becomes possible, keeping the shared path legal.
  if (ranged && path) for (let k=0;k<path.length;k++){
    const at={...me,...path[k]}, prefix=path.slice(0,k+1);
    if (checkPath(me,prefix,allowance)<0) continue;
    if ((me.attacks || []).some(a => !isMelee(a) && rangeCheck(at,target,a).ok) && coverOf(at,target,{tokens:[me,...allies,...foes]}).cover!=='total'){path=prefix;break;}
  }
  if (path?.length && !provokers(me,path,{tokens:foes}).length) return plan('move',`It closes on ${name(target)}.`,{target:target.id,to:path.at(-1)});
  return plan('dodge','It guards itself rather than offer a free strike.');
}
// save is the app's success boolean (or {ok:boolean}); callers pass post-defence damage.
export function resistWorthIt(me, save, {cond,dmg=0} = {}){
  if (save===true || save?.ok===true) return false;
  return ['paralyzed','paralysed','stunned','charmed','banished','petrified'].includes(cond?.n || cond) || (dmg>0 && dmg>=me.hp*.25);
}
