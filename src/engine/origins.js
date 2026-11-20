import { ORIGINS, BACKS, FEATS } from '../data/origins.js';
import { SPECIES, BACKGROUNDS, SKILLS } from '../data/srd.js';
import { SRD_FEATS } from '../data/srd-feats.js';

const get = (table,id) => typeof id==='string' && Object.hasOwn(table,id) ? table[id] : null;
export const originView = id => get(ORIGINS,id);
export const backView = id => get(BACKS,id);
export const featView = id => get(FEATS,id);
export const originList = () => Object.values(ORIGINS);
export const backList = () => Object.values(BACKS);
export const featList = filter => Object.values(FEATS).filter(f=>!filter?.cat || f.cat===filter.cat);

export function asClassic(hero){
  const o=originView(hero?.origin), b=backView(hero?.back ?? hero?.background ?? hero?.bg);
  const sp=o?.like ?? (get(SPECIES,hero?.sp) ? hero.sp : null);
  const bg=b?.like ?? (get(BACKGROUNDS,hero?.bg) ? hero.bg : null);
  const opt=hero?.originOpt ?? hero?.spOpt;
  const options=Object.values(SPECIES[sp]?.opts ?? {}).flat();
  const spOpt=get(o?.classicOptions ?? {},opt) ?? (options.includes(opt)?opt:options[0]??null);
  const picked=Array.isArray(hero?.feats)?hero.feats:[];
  const feats=new Set();
  for(const id of [b?.feat,...picked]){
    const like=featView(id)?.like ?? (get(SRD_FEATS,id)?id:null);
    if(like) feats.add(like);
  }
  return {sp,spOpt,bg,feats:[...feats]};
}
export function validateOrigins(){
  const issues=[];
  for(const o of originList()){
    if(!get(SPECIES,o.like)) issues.push(o.id+' species');
    const opts=Object.values(SPECIES[o.like]?.opts??{}).flat();
    for(const pick of Object.values(o.opts??{}).flat()) if(!opts.includes(o.classicOptions?.[pick])) issues.push(o.id+' option');
  }
  for(const b of backList()){
    const ref=get(BACKGROUNDS,b.like);
    if(!ref || JSON.stringify(b.ab)!==JSON.stringify(ref.ab) || JSON.stringify(b.skills)!==JSON.stringify(ref.skills) || b.skills.some(s=>!get(SKILLS,s))) issues.push(b.id+' training');
    if(featView(b.feat)?.cat!=='origin') issues.push(b.id+' feat');
  }
  for(const f of featList()) if(f.like!==null && !get(SRD_FEATS,f.like)) issues.push(f.id+' feat key');
  return issues;
}
