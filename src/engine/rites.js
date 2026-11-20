import { RITES, TRADITIONS } from '../data/rites.js';
import { SRD_SPELLS } from '../data/srd-spells.js';

const caster = {W:'archivist', S:'relicborn', K:'seepbound', C:'chaplain', B:'herald', D:'mistwalker', P:'warden', R:'marksman'};
const own = (table,key) => typeof key === 'string' && Object.hasOwn(table,key) ? table[key] : null;
const reading = (name,id) => own(own(RITES,name)?.by ?? {},id);

export const tradition = id => own(TRADITIONS,id);
export const riteName = (name,id) => reading(name,id)?.n ?? (typeof name === 'string' ? name : '');
export const riteLine = (name,id) => reading(name,id)?.line ?? '';
export function ritesFor(id){
  if (!tradition(id)) return [];
  return SRD_SPELLS.flatMap(({n:spell,l})=>{
    const view=reading(spell,id);
    return view ? [{spell,...view,l}] : [];
  }).sort((a,b)=>a.l-b.l || a.n.localeCompare(b.n,'en'));
}

export function validateRites(){
  const errors=[], seen=new Set(), library=new Set(SRD_SPELLS.map(s=>s.n));
  for(const key of Object.keys(RITES)) if(!library.has(key)) errors.push('Unknown spell '+key);
  for(const {n,c} of SRD_SPELLS){
    const by=own(RITES,n)?.by ?? {};
    const expected=[...c].map(letter=>caster[letter]).sort();
    if(Object.keys(by).sort().join()!==expected.join()) errors.push(n+' casting list');
    for(const [id,view] of Object.entries(by)){
      const name=view?.n?.trim(), line=view?.line?.trim();
      if(!name || name.length>=40 || name.toLowerCase().includes(n.toLowerCase())) errors.push(n+' name: '+id);
      if(!line || line.length>=90) errors.push(n+' line: '+id);
      const key=id+'/'+name?.toLowerCase();
      if(seen.has(key)) errors.push('Duplicate '+key);
      seen.add(key);
    }
  }
  return errors;
}
