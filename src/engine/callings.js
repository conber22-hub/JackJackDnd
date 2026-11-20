import { CALLINGS, MECHS } from '../data/callings.js';
import { CLASSES } from '../data/srd.js';

const lookup = (obj,key) => typeof key === 'string' && Object.hasOwn(obj,key) ? obj[key] : null;
const subFeature = n => n.includes(':') || ['Open Hand Technique','Draconic Spells'].includes(n);
const common = {
  'Ability Score Improvement': {n:'Hard-Won Lesson',text:'Raise ability scores or choose another feat you qualify for.'},
  'Epic Boon': {n:'Valley Legend',text:'Choose a legendary boon or another feat you qualify for.'}
};
export function callingList(){
  return Object.values(CALLINGS).map(({id,name,chassis,emblem,color,era,blurb})=>({id,name,chassis,emblem,color,era,blurb}));
}
export function callingOf(hero){ return lookup(CALLINGS,hero?.calling); }
export function callingForChassis(chassis){ return Object.values(CALLINGS).find(c=>c.chassis===chassis) ?? null; }
export function featureView(id,n){ return lookup(lookup(CALLINGS,id)?.rename ?? {},n) ?? {n,text:''}; }
export function pathOf(id,path){ return lookup(CALLINGS,id)?.paths.find(p=>p.id===path) ?? null; }
export function pathFeatures(id,path,lvl){
  return Object.entries(pathOf(id,path)?.features ?? {}).flatMap(([level,fs])=>
    +level<=lvl ? fs.map(f=>({...f,lvl:+level})) : []);
}
export function featuresAt(hero){
  const c=callingOf(hero);
  if (!c) return [];
  const lvl=Math.min(20,Math.max(0,Math.floor(hero.lvl ?? 1)));
  const out=[];
  for (const [level,features] of Object.entries(CLASSES[c.chassis].features)){
    if (+level>lvl) continue;
    for (const key of features.filter(n=>!subFeature(n))){
      out.push({lvl:+level,...(common[key] ?? featureView(c.id,key)),mech:{k:'text'},from:'calling'});
    }
  }
  if (lvl>=1 && !Object.values(c.rename).some(f=>f.n===c.signature.n)){
    out.unshift({lvl:1,...c.signature,mech:c.id==='vanguard'?{k:'ward',max:'lvl*2+4',recharge:'turnUnhurt'}:{k:'text'},from:'calling'});
  }
  return out.concat(pathFeatures(c.id,hero.path,lvl).map(f=>({...f,from:'path'}))).sort((a,b)=>a.lvl-b.lvl);
}
export function validateCallings(){
  const errors=[], ids=new Set(), chassis=new Set();
  for (const c of Object.values(CALLINGS)){
    const rules=lookup(CLASSES,c.chassis);
    if (!rules || chassis.has(c.chassis)){ errors.push(c.id+' chassis'); continue; }
    chassis.add(c.chassis);
    const levels=[];
    for (const [l,fs] of Object.entries(rules.features)){
      if (fs.some(subFeature)) levels.push(l);
      for (const n of fs) if (!subFeature(n) && !common[n] && !c.rename[n]?.text) errors.push(c.id+' missing '+n);
    }
    if(c.paths.length!==3) errors.push(c.id+' paths');
    for(const [i,p] of c.paths.entries()){
      if(ids.has(p.id) || p.seep!==(i===2) || (p.seep&&!p.cost)) errors.push(p.id);
      ids.add(p.id);
      if(Object.keys(p.features).join()!==levels.join()) errors.push(p.id+' levels');
      for(const f of Object.values(p.features).flat()) if(!MECHS.some(m=>m.k===f.mech.k)) errors.push(f.n);
    }
  }
  if(chassis.size!==12) errors.push('Expected twelve chassis');
  return errors;
}
