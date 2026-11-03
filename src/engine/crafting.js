/* Pure proposals: callers debit quoted resources once, persist returned jobs and
   apply replacementMaterials after a fumble. Never mutate a sheet or catalogue. */
import { PART_BY_ID, SLOTS } from '../data/crafting.js';
import { hashSeed, mulberry32 } from '../util/core.js';
import { BACKGROUNDS, CLASSES, mod, profBonus } from '../data/srd.js';
const no=why=>({ok:false,why});
export function build(design){
 if(!design || !SLOTS[design.kind] || !design.parts || typeof design.parts!=='object') return no('Choose a kind and parts.');
 const {kind,parts}=design, selected=[];
 for(const [slot,value] of Object.entries(parts)){
  if(!SLOTS[kind].includes(slot) || (Array.isArray(value) && slot!=='fittings')) return no(`Invalid slot: ${slot}.`);
  const ids=Array.isArray(value)?value:[value];
  if(new Set(ids).size!==ids.length) return no('Choose each fitting only once.');
  for(const id of ids){const p=PART_BY_ID[id];if(!p || p.slot!==slot || !p.kinds.includes(kind)) return no(`Incompatible part: ${id}.`);selected.push(p);}
 }
 const frame=PART_BY_ID[parts[kind==='trinket'?'vessel':'frame']];
 if(!frame) return no('Choose a frame or vessel.');
 const base=frame.mods.base || {}, material=parts.material, head=PART_BY_ID[parts.head];
 if(parts.grip==='versatile-grip' && (!['1d6','1d8'].includes(base.d) || /[2AF]/.test(base.p || '') || base.rng?.length)) return no('A versatile grip needs a one-handed melee frame without finesse.');
 if(parts.grip==='shield-grip' && /2/.test(base.p || '')) return no('A two-handed frame cannot take a shield grip.');
 if(head && (base.rng?.length || /A/.test(base.p || '') || (head.mods.property==='R' && !/2/.test(base.p || '')))) return no('That head needs a suitable two-handed melee haft, or a melee blade.');
 if(material==='silvered' && kind!=='weapon') return no('Silvering is for weapons.');
 if(material==='adamantine' && (kind==='trinket' || kind==='shield' || (kind==='armor' && (!['medium','heavy'].includes(base.t) || base.n==='Hide Armor')))) return no('Adamantine needs a weapon or medium/heavy armour frame.');
 if(kind==='wagon' && ((parts.frame==='handcart' && parts.team && parts.team!=='no-team') || (parts.team==='pony' && !['cart','handcart'].includes(parts.frame)))) return no('That team does not suit the frame.');
 if((parts.fittings || []).length>(frame.mods.slots || 0)) return no('Too many fittings for the frame.');
 const item={...structuredClone(base),kind,baseName:frame.n,custom:true,design:structuredClone(design),rarity:'common',cost:0,weight:0};
 if(kind==='wagon') Object.assign(item,{capacity:0,speed:0,hp:0,ac:0,seats:0,bunks:0,fittings:[...(parts.fittings || [])]});
 for(const p of selected){
  item.cost+=p.cost;item.weight+=p.weight;
  const m=p.mods;
  if(kind==='wagon') for(const k of ['capacity','speed','hp','ac','seats','bunks']) item[k]+=m[k] || 0;
  if(m.ty) item.ty=m.ty;
  if(m.property && !item.p.includes(m.property)){item.p+=m.property;item.properties+=m.property==='R'?', Reach':', Versatile';if(m.property==='V') item.versatile=base.d==='1d6'?'1d8':'1d10';}
  if(m.bonus){if(kind==='weapon'){item.atk=m.bonus;item.dmgBonus=m.bonus;}else item.acBonus=m.bonus;item.magic=true;}
  for(const k of ['light','rustless','rarity']) if(m[k]) item[k]=structuredClone(m[k]);
 }
 if(material==='adamantine') Object.assign(item,kind==='weapon'?{objectDamageMultiplier:2}:{criticalImmune:true});
 if(material==='silvered') item.silvered=true;
 item.cost=Math.round(item.cost*100)/100;
 item.n=design.name?.trim() || [PART_BY_ID[material]?.n,frame.n,PART_BY_ID[parts.rune]?.n].filter(Boolean).join(' ');
 if(item.light || item.rustless || item.criticalImmune || item.objectDamageMultiplier) item.text='Special material or minor rune: see crafted item properties.';
 return {ok:true,item,why:''};
}
export function plan(design,{crafter,tools=[],materials={},place}={}){
 const result=build(design);if(!result.ok) return result;
 const ps=Object.values(design.parts).flat().map(id=>PART_BY_ID[id]), needs=ps.map(p=>p.needs);
 const required=[...new Set(needs.map(n=>n.tool))], workshops=place?.workshops || [];
 const list=v=>Array.isArray(v)?v:typeof v==='string'?[v]:[];
 const known=[...list(crafter?.tools),...list(BACKGROUNDS[crafter?.bg]?.tools),...list(CLASSES[crafter?.cls]?.tools)];
 if(crafter?.role==='smith') known.push("Smith's Tools");
 if(required.some(t=>!tools.includes(t) || !known.includes(t))) return no('The crafter needs proficiency and the required tools.');
 const workshop=design.kind==='wagon'?'carpenter':(['weapon','armor','shield'].includes(design.kind) && !['bone','blackwood'].includes(design.parts.material))?'forge':null;
 if(workshop && !workshops.includes(workshop)) return no(`Work needs a ${workshop}.`);
 const needed={};for(const n of needs) for(const m of n.materials) needed[m.id]=(needed[m.id] || 0)+m.qty;
 if(Object.entries(needed).some(([id,n])=>(materials[id] || 0)<n)) return no('Not enough materials.');
 const check=needs.reduce((a,b)=>b.dc>a.dc?b:a), bonus=Number.isFinite(crafter?.bonus)?crafter.bonus:crafter?.role==='smith'?4:mod(crafter?.ab?.[check.skill] || 10)+profBonus(crafter?.lvl || 1);
 return {ok:true,item:result.item,cost:result.item.cost,materials:needed,tools:required,workshop,check:{ability:check.skill,bonus,dc:check.dc},hours:ps.reduce((s,p)=>s+p.hours,0),progress:0,spent:0,ruined:[],replacementMaterials:{}};
}
export function work(job,hours,{roll,materials={}}={},rng){
 if(!job?.ok || !Number.isFinite(hours) || hours<=0) return no('Supply a valid job and positive hours.');
 const out=structuredClone(job);if(out.progress>=out.hours) return out;
 if(Object.entries(out.replacementMaterials).some(([id,n])=>(materials[id] || 0)<n)) return no('Replace the ruined materials before resuming work.');
 out.replacementMaterials={};
 const raw=typeof roll==='object'?roll.raw:roll ?? 1+Math.floor(rng()*20), total=typeof roll==='object'?roll.total:raw+out.check.bonus;
 if(!Number.isFinite(raw) || raw<1 || raw>20 || !Number.isFinite(total)) return no('Invalid tool check.');
 const time=Math.min(hours,out.hours-out.progress);out.spent+=time;
 if(raw===1){const id=Object.keys(out.materials)[Math.floor(rng()*Object.keys(out.materials).length)];out.ruined.push(id);out.replacementMaterials[id]=(out.replacementMaterials[id] || 0)+1;}
 else if(total>=out.check.dc) out.progress+=time;
 return out;
}
export function finish(job){return job?.ok && job.progress>=job.hours?structuredClone(job.item):null;}
export function wares(person,{place='village',gaze=0,day=0,seed=0}={}){
 if(person?.role!=='smith' || person.dead || person.alive===false || person.flags?.gone) return [];
 const rng=mulberry32(hashSeed(JSON.stringify([seed,person.id,typeof place==='string'?place:place.id,Math.floor(day/7)])));
 return ['weapon-dagger','weapon-longsword','armor-shield'].map(frame=>{
  const design={kind:frame==='armor-shield'?'shield':'weapon',parts:{frame,material:rng()<.5?'iron':'steel',finish:'polished'}};
  const {item}=build(design);return {design,item,n:item.n,custom:item,qty:1,gp:Math.round(item.cost*(1+Math.max(0,gaze-2)*.1)*100)/100};
 });
}
