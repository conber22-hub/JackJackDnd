/* Privacy-first .prism class compatibility proposal.
   Data is processed in the DM's browser. Nothing is transmitted or committed.
   These candidates are intentionally NOT injected into the live CLASSES table because
   battle resources, slots, action economy and edition-specific features need review. */
const SCORE={strength:'Str',dexterity:'Dex',constitution:'Con',intelligence:'Int',wisdom:'Wis',charisma:'Cha'};
const ORD=['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const KINDS=['canon','unearthedArcana','homebrew'];
const BASE=['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
const unique=xs=>[...new Set(xs)];
const key=x=>String(x||'').replace(/\s+2024$/,'').trim();
const safeArray=x=>Array.isArray(x)?x:[];
const truthyAbilities=o=>Object.entries(o||{}).filter(([,v])=>v===true).map(([k])=>SCORE[k]).filter(Boolean);
const sourceType=x=>KINDS.includes(x?.source?.sourceType)?x.source.sourceType:'homebrew';
export function inspectPrism(raw){
 const data=typeof raw==='string'?JSON.parse(raw):raw;
 if(!data||typeof data!=='object'||!Array.isArray(data.classes)||!Array.isArray(data.feats))throw Error('Not a supported .prism compendium');
 const fields=['classes','subclasses','races','subraces','backgrounds','spells','feats','invocations','items','magicItems','monsters'];
 const counts=Object.fromEntries(fields.map(k=>[k,safeArray(data[k]).length]));
 const byType={};for(const f of data.feats)byType[f.type||'unknown']=(byType[f.type||'unknown']||0)+1;
 const bySource={};for(const c of data.classes)bySource[sourceType(c)]=(bySource[sourceType(c)]||0)+1;
 const classes=data.classes.map(c=>({name:c.name,baseName:key(c.name),kind:sourceType(c),
   edition:/2024/.test(c.name||'')?'2024':'legacy/other',archetypes:safeArray(c.subclasses).length,
   spellTable:!!c.spellTable,hitDie:Number(c.hitDice)||8}));
 return {format:'Prism-compatible compendium',counts,featTypes:byType,
   selectableFeats:(byType.feat||0)+(byType.fightingStyle||0),classSources:bySource,
   classes,additionalClasses:classes.filter(c=>!BASE.includes(c.baseName)),
   privacy:'Read locally only. This audit returns names and counts; never exports source rule text.'};
}
export function proposePrismClass(c){
 if(!c||typeof c.name!=='string'||!c.name.trim())throw Error('Class needs a name');
 const saved=safeArray(c.newFeatures).filter(x=>x?.customFeat?.name||x?.name), features={};
 for(const f of saved){
  const o=f.customFeat||f,lv=Math.min(20,Math.max(1,Number(o.level)||1)),n=String(o.name||f.name).trim();
  (features[lv]||=[]).push(n);
 }
 const sv=truthyAbilities(c.savingThrows),primary=truthyAbilities(c.primaryStats);
 const skills=Object.keys(c.selectionSkills||{}).filter(x=>c.selectionSkills[x]).map(x=>x==='sleightOfHand'?'Sleight of Hand':x.replace(/([A-Z])/g,' $1').replace(/\b\w/g,s=>s.toUpperCase()));
 const armor=c.armorProficiencies||{};
 const spells=c.spellTable?ORD.map((name,i)=>{const row=c.spellTable[name]||{};
   const sl=Object.entries(row.slots||{}).map(([k,n])=>[ORD.indexOf(k)+1,Number(n)]).filter(([lev,n])=>lev>0&&n>0).sort((a,b)=>a[0]-b[0]);
   return {level:i+1,cantrips:Number(row.cantrips)||0,known:Number(row.known)||0,slots:sl};}):null;
 const subs=safeArray(c.subclasses).map(x=>x?.customSubclass?.name||x?.name).filter(Boolean);
 return {name:c.name,kind:sourceType(c),hitDie:Number(c.hitDice)||8,saves:sv,primary,
   selectedSkills:Math.max(0,Number(c.numSelectionSkills)||0),skillOptions:unique(skills),
   armor:armor.heavy?'heavy+shield':armor.medium?'medium+shield':armor.light?'light':'none',
   subclassUnlockLevel:Math.max(1,Number(c.subclassUnlockLevel)||3),subclasses:unique(subs),features,
   spellTable:spells,readyForCombat:false,automation:'manual',
   warning:'Legacy or third-party class features, caster lists and combat resources must be reviewed by the DM before enabling in the live hero engine.'};
}
export const classIsSRD = name=>BASE.includes(key(name));
