/* Character Foundry VII: pure authoring and validation for optional original Barovia homebrew.
   This deliberately does not mutate srd.js, the saved hero schema, or the live game.
   Source text in .prism is private and is never ingested by this module. */
import { BAROVIA_CODEX } from '../data/barovia-character-codex-vii.js';

const SKILLS = new Set(['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival']);
const ABILITIES = ['Str','Dex','Con','Int','Wis','Cha'];
const CORE_CLASSES = new Set(['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard']);
const FEAT_LEVELS = [4,8,12,16,19];
export { BAROVIA_CODEX, CORE_CLASSES, FEAT_LEVELS };
export const classNames = () => [...CORE_CLASSES, ...Object.keys(BAROVIA_CODEX.classes)];
export const subclassNames = className => Object.values(BAROVIA_CODEX.subclasses).filter(s=>s.className===className).map(s=>s.name).sort();
export const abilityModifier = score => Math.floor((Number(score)-10)/2);
export const proficiencyBonus = level => 2 + Math.floor((Math.max(1,Math.min(20,Number(level)||1))-1)/4);
const unique = x => [...new Set(x)];
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const slot = (casting,level) => casting==='full' ? Math.min(9,Math.ceil(level/2)) : casting==='half' ? Math.min(5,1+Math.floor((level-1)/4)) : 0;
const initial = {Str:12,Dex:13,Con:14,Int:10,Wis:15,Cha:8};

export function newCharacterDraft(starter = 0){
  const st = typeof starter==='number' ? BAROVIA_CODEX.starters[starter] : BAROVIA_CODEX.starters.find(x=>x.name===starter);
  if (!st) throw Error('Unknown character starter');
  const C=BAROVIA_CODEX.classes[st.className];
  const abilities={...initial};
  if(C.primary.includes('Dex')){abilities.Dex=15;abilities.Wis=14;abilities.Con=13;}
  if(C.primary.includes('Str')){abilities.Str=15;abilities.Wis=14;abilities.Con=13;}
  if(C.primary.includes('Int')){abilities.Int=15;abilities.Wis=13;abilities.Con=14;}
  return {schema:'barovia-character-draft-v1',name:'',level:1,className:st.className,subclass:st.subclass,
    species:st.species,background:st.background,abilities,skills:C.skills.slice(0,C.skillChoices),
    feats:[],spells:[],backstory:st.hook,originName:st.name};
}
export function maxSpellLevel(d){const C=BAROVIA_CODEX.classes[d.className];return C?slot(C.casting,d.level):0;}
export function spellLimits(d){
 const C=BAROVIA_CODEX.classes[d.className],L=Math.max(1,Math.min(20,Number(d.level)||1));
 if(!C?.casting)return {cantrips:0,prepared:0};
 return C.casting==='full' ? {cantrips:L>=17?5:L>=10?4:3,prepared:Math.min(22,4+L-1)} : {cantrips:L>=17?4:L>=10?3:2,prepared:Math.min(15,2+Math.floor((L-1)*.7))};
}
export function selectableSpells(d){
  const L=Math.max(1,Math.min(20,Number(d.level)||1)), max=maxSpellLevel(d);
  if(!max)return [];
  return BAROVIA_CODEX.spells.filter(s=>s.classes.includes(d.className) && s.level<=max && !(s.level===0 && L<1));
}
export function eligibleFeats(d,{category=null,atLevel=null}={}){
  const L=Math.max(1,Math.min(20,Number(atLevel||d.level)||1));
  const picked=(d.feats||[]).map(x=>typeof x==='string'?x:x.feat);
  return Object.values(BAROVIA_CODEX.feats).filter(f=>(!category||f.category===category)
    && L>=f.minimumLevel && (f.repeatable||!picked.includes(f.name))
    && !(f.category==='Epic Boon' && L<19));
}
export function allowedFeatForSlot(name,level){
  const f=BAROVIA_CODEX.feats[name];
  if(!f||!FEAT_LEVELS.includes(level))return false;
  return f.minimumLevel<=level && (f.category==='General'||f.category==='Fighting Style'||(level===19&&f.category==='Epic Boon'));
}
export function featureProgression(d){
  const C=BAROVIA_CODEX.classes[d.className],S=BAROVIA_CODEX.subclasses[d.subclass];
  if(!C)return [];
  const out=[];
  for(let L=1;L<=Math.min(20,Math.max(1,Number(d.level)||1));L++){
    for(const f of C.features[L]||[])out.push({level:L,name:f.name,text:f.text,source:'class'});
    if(S?.className===d.className&&L>=C.subclassLevel)for(const f of S.features[L]||[])out.push({level:L,name:f.name,text:f.text,source:'subclass'});
  }
  return out;
}
export function validateDraft(d){
  const errors=[];const add=(field,reason)=>errors.push({field,reason});
  if(!d||typeof d!=='object')return[{field:'draft',reason:'Expected a character draft'}];
  const C=BAROVIA_CODEX.classes[d.className],S=BAROVIA_CODEX.subclasses[d.subclass],species=BAROVIA_CODEX.species[d.species],bg=BAROVIA_CODEX.backgrounds[d.background];
  const L=Number(d.level);
  if(!C)add('className','Class is not in this homebrew pack; SRD classes require the host creator');
  if(!Number.isInteger(L)||L<1||L>20)add('level','Level must be 1 through 20');
  if(!species)add('species','Choose an available Barovian species');
  if(!bg)add('background','Choose an available background');
  if(C&&L>=3&&(!S||S.className!==d.className))add('subclass','Subclass must match class at level 3 or higher');
  if(!d.abilities||ABILITIES.some(a=>!Number.isInteger(Number(d.abilities[a]))||Number(d.abilities[a])<3||Number(d.abilities[a])>30))add('abilities','All six ability scores must be integers between 3 and 30');
  const skills=d.skills||[];
  if(!Array.isArray(skills)||skills.some(s=>!SKILLS.has(s))||unique(skills).length!==skills.length||C&& (skills.length>C.skillChoices||skills.some(s=>!C.skills.includes(s))))add('skills','Only unique class skills within the selection allowance are permitted');
  const picks=d.feats||[];
  if(!Array.isArray(picks))add('feats','Feat choices must be a list');
  else {
    const seen=new Set(),levels=new Set();
    for(const p of picks){const n=p?.feat,at=Number(p?.level);if(!allowedFeatForSlot(n,at)||at>L)add('feats',`Invalid feat slot: ${n||'?'} at level ${at}`);if(seen.has(n))add('feats',`Duplicate feat: ${n}`);if(levels.has(at))add('feats',`Duplicate choice at level ${at}`);seen.add(n);levels.add(at);}
  }
  const allowed=new Set(selectableSpells(d).map(x=>x.name));const spellList=d.spells||[];
  if(!Array.isArray(spellList)||spellList.some(n=>!allowed.has(n))||unique(spellList).length!==spellList.length)add('spells','Spell selection includes unknown, duplicate, or unavailable spells');
  else {const chosen=BAROVIA_CODEX.spells.filter(x=>spellList.includes(x.name));const lim=spellLimits(d);
    if(chosen.filter(x=>x.level===0).length>lim.cantrips || chosen.filter(x=>x.level>0).length>lim.prepared)add('spells','Cantrip or prepared spell allowance exceeded');}
  return errors;
}
export function draftPreview(d){
  const C=BAROVIA_CODEX.classes[d.className],bg=BAROVIA_CODEX.backgrounds[d.background],spec=BAROVIA_CODEX.species[d.species];
  const L=Math.max(1,Math.min(20,Number(d.level)||1));
  return {
    name:String(d.name||d.originName||'Unnamed Traveler'),level:L,profession:d.className,subclass:L>=3?d.subclass:null,
    species:d.species,background:d.background,speed:spec?.speed||30,proficiency:proficiencyBonus(L),
    hitDice:C?`d${C.hd}`:null,estimatedHP:C?Math.max(1,C.hd+abilityModifier(d.abilities?.Con||10)+(L-1)*(Math.floor(C.hd/2)+1+abilityModifier(d.abilities?.Con||10))):null,
    originFeat:bg?.feat||null,classFeatures:featureProgression(d),selectedFeats:(d.feats||[]).map(p=>p.feat),
    selectedSpells:(d.spells||[]).slice(),maxSpellLevel:maxSpellLevel(d),spellLimits:spellLimits(d),warnings:validateDraft(d),
    integration:'Preview and manual playtest only; do not treat estimated HP or spell tiers as authoritative game automation'
  };
}
export function exportDraft(d){
  const warnings=validateDraft(d);if(warnings.length)throw Error('Cannot export invalid draft: '+warnings.map(x=>x.reason).join('; '));
  const out=JSON.parse(JSON.stringify(d));
  delete out.portrait;delete out.owner;delete out.key;
  return {format:'barovia-codex-vii-draft',revision:1,homebrew:true,requiresDMApproval:true,
    character:out,preview:draftPreview(out)};
}
export function validateCodex(c=BAROVIA_CODEX){
  const errs=[];const fail=s=>errs.push(s);
  for(const [n,C] of Object.entries(c.classes)){
    if(C.name!==n||!([6,8,10,12].includes(C.hd)))fail(`Bad class: ${n}`);
    if(Object.keys(C.features).length!==20||Array.from({length:20},(_,i)=>i+1).some(l=>!C.features[l]?.length))fail(`Class progression incomplete: ${n}`);
    if(C.subclasses.some(s=>c.subclasses[s]?.className!==n))fail(`Broken class subclass link: ${n}`);
    if(C.skills.some(s=>!SKILLS.has(s)))fail(`Unknown class skill: ${n}`);
  }
  for(const [n,s] of Object.entries(c.subclasses))if(s.name!==n||!(own(c.classes,s.className)||CORE_CLASSES.has(s.className))||!Object.entries(s.features).every(([l,fs])=>Number(l)>=3&&Number(l)<=20&&fs.length))fail(`Bad subclass: ${n}`);
  for(const [n,s] of Object.entries(c.species))if(s.name!==n||s.traits.length<2||!s.traits.every(x=>x.text))fail(`Bad species: ${n}`);
  for(const [n,b] of Object.entries(c.backgrounds))if(b.name!==n||!own(c.feats,b.feat)||c.feats[b.feat].category!=='Origin'||b.abilities.length!==3||b.skills.length!==2||b.skills.some(x=>!SKILLS.has(x)))fail(`Bad background: ${n}`);
  for(const [n,f] of Object.entries(c.feats))if(f.name!==n||!f.text||!['Origin','General','Fighting Style','Epic Boon'].includes(f.category))fail(`Bad feat: ${n}`);
  const sn=new Set();const counts=new Array(10).fill(0);
  for(const s of c.spells){if(sn.has(s.name)||s.level<0||s.level>9||!s.text||!s.classes?.length||s.mode!=='manual')fail(`Bad spell: ${s.name}`);sn.add(s.name);counts[s.level]++;}
  if(counts.some(x=>x!==6))fail('Expected six spells at every tier');
  for(const st of c.starters)if(!c.classes[st.className]||c.subclasses[st.subclass]?.className!==st.className||!c.species[st.species]||!c.backgrounds[st.background])fail(`Bad starter: ${st.name}`);
  return errs;
}
