/* PRISM EXTENDED CATALOG — the classes and character options the legacy importer skipped.
   Pure data conversion; unimplemented class features are sheet text, NOT automated combat.
   No DOM, local storage or imported source data lives in this module. */
const SCORE_NAMES = { strength:'Str', dexterity:'Dex', constitution:'Con', intelligence:'Int', wisdom:'Wis', charisma:'Cha' };
const RANK = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
const LEVELS = ['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const SKILLS = {
  animalhandling:'Animal Handling', sleightofhand:'Sleight of Hand',
  acrobatics:'Acrobatics', arcana:'Arcana', athletics:'Athletics', deception:'Deception', history:'History', insight:'Insight',
  intimidation:'Intimidation', investigation:'Investigation', medicine:'Medicine', nature:'Nature', perception:'Perception',
  performance:'Performance', persuasion:'Persuasion', religion:'Religion', stealth:'Stealth', survival:'Survival',
};
const COLOURS = {
  Artificer:'#b08b4b', 'Blood Hunter':'#9b3448', Mystic:'#8a61b4',
  'Ranger, Revised':'#517e46', Savant:'#4b8793',
};
const CLASSES = { Artificer:{ letter:'A', cast:'Int' }, 'Ranger, Revised':{ letter:'R', cast:'Wis' } };
export const prismClassName = name => String(name || '').replace(/\s+2024$/, '').trim();
const source = obj => {const s=obj?.source || {}; const kind=s.sourceType==='canon'?'canon':s.sourceType==='unearthedArcana'?'ua':'homebrew';
  return {kind,src:s.book || (kind==='ua'?'Unearthed Arcana':kind==='canon'?'Prism':'Homebrew')};};
const scores = o => Object.entries(o || {}).filter(([,on])=>on).map(([k])=>SCORE_NAMES[k.toLowerCase()]).filter(Boolean);
const skillNames = o => Object.entries(o || {}).filter(([,on])=>on).map(([k])=>SKILLS[k.replace(/[^a-z]/gi,'').toLowerCase()]).filter(Boolean);
const text = s => String(s||'').replace(/\r/g,'').trim();
const feature = f => {const d=f?.customFeat || f || {}; return {name:d.name || f?.name || '',level:+d.level || +f?.level || 1,text:text(d.featureDescription || '')};};
const defaultArray = (major,minor) => {
  const order=[...new Set([...major,...minor,'Con','Dex','Wis','Int','Str','Cha'])];
  const vals=[15,14,13,12,10,8];return Object.fromEntries(RANK.map(k=>[k,vals[order.indexOf(k)]]));
};
const defaultSub = cls => (cls?.subclasses || []).map(s=>s?.customSubclass?.name || s?.name).find(Boolean) || 'Archetype';
const isSpellcaster = t => !!t && LEVELS.some(k=>t[k]?.slots && Object.keys(t[k].slots).length > 0);
const valueAt = (t,i,field) => {
  const found=t?.[LEVELS[i]]?.[field]; if(Number.isFinite(+found))return +found;
  for(let j=i-1;j>=0;j--){const v=t?.[LEVELS[j]]?.[field];if(Number.isFinite(+v))return +v;}return 0;
};

export function convertPrismClass(cls){
  const name=prismClassName(cls.name), meta=CLASSES[name] || {}, t=cls.spellTable || {}, major=scores(cls.primaryStats),minor=scores(cls.secondaryStats);
  const sv=scores(cls.savingThrows).slice(0,2);
  const type=cls.armorProficiencies || {};
  const armor=type.heavy?'heavy'+(type.shield?'+shield':''):type.medium?'medium'+(type.shield?'+shield':''):type.light?'light'+(type.shield?'+shield':''):'none';
  const sc=!!meta.cast || isSpellcaster(t), half=!!t.isHalfCaster || name==='Artificer' || name==='Ranger, Revised';
  const casterStat=scores(t.castingAbility)[0] || meta.cast || null;
  const fs={};for(let lv=1;lv<=20;lv++)fs[lv]=[];
  const texts={};
  for(const raw of cls.newFeatures || []){
    const f=feature(raw), lvl=Math.min(20,Math.max(1,f.level));
    if(!f.name || fs[lvl].includes(f.name))continue;
    fs[lvl].push(f.name); if(f.text)texts[f.name]=f.text;
  }
  const result={ hd:Math.max(4,+cls.hitDice || 8), sv:sv.length===2?sv:['Int','Wis'],
    cast:sc?casterStat:null, ...(sc && !half ? {full:true} : sc?{half:true}:{}),
    ...(meta.letter?{letter:meta.letter}:{}),
    armor, mastery:0,
    arr:defaultArray(major,minor),
    skills:[Math.max(1,+cls.numSelectionSkills || 2),skillNames(cls.selectionSkills)],
    sub:defaultSub(cls), color:COLOURS[name] || '#6f7484', features:fs,
    ...(sc?{cantrips:LEVELS.map((_,i)=>valueAt(t,i,'cantrips')),prep:LEVELS.map((_,i)=>valueAt(t,i,'known'))}:{}),
    note:'Supplemental class rules are shown as reference text; unimplemented abilities require DM adjudication.',
    text:text(cls.classDescription), texts, subAt:Math.max(1,+cls.subclassUnlockLevel||3),
    ...source(cls),lib:true, manual:true,
  };
  // A malformed exported skill list must not leave the creator without choices.
  if(result.skills[1].length<result.skills[0])result.skills[1]=Object.values(SKILLS).slice(0,result.skills[0]);
  return result;
}
export function prismExtraCatalog(d, existingClassNames=[]){
  const existing=new Set([...existingClassNames].map(prismClassName));
  const classes={};
  for(const cls of d?.classes || []){
    const n=prismClassName(cls.name);if(!n || existing.has(n) || classes[n])continue;
    classes[n]=convertPrismClass(cls);
  }
  const invocations=[...new Map((d?.invocations||[]).filter(x=>x?.name).map(x=>[x.name.toLowerCase(),{
    n:x.name,text:text(x.content),level:Math.max(0,+x.level||0),...source(x),lib:true,
  }])).values()];
  const selectionGroups=(d?.selectionGroup || []).filter(x=>x?.name).map(x=>({
    n:x.name,type:x.type || '',text:text(x.additionalInformation),items:(x.items || []).map(y=>typeof y==='string'?y:y?.name||'').filter(Boolean),
    ...source(x),lib:true,
  }));
  const features=(d?.feats || []).filter(x=>x?.name && x.type && x.type!=='feat' && x.type!=='fightingStyle').map(x=>({
    n:x.name,type:x.type,level:Math.max(0,+x.level||0),text:text(x.featureDescription),...source(x),lib:true,
  }));
  return {classes,invocations,selectionGroups,features};
}
