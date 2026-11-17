import { ACHIEVEMENTS } from '../data/achievements.js';
const copy=v=>JSON.parse(JSON.stringify(v));
const str=v=>typeof v==='string'&&v.length>0;
const num=v=>Number.isFinite(v)&&v>=0;
export function fresh(){return {n:{},got:[],places:[],pages:[],quests:[],fight:{active:false,kills:0,twenties:0,potions:0,last:null}};}
export function track(progress,event){
  const p={...fresh(),...copy(progress||fresh())},e=event||{},n=p.n;
  // Kill attribution requires an adjacent matching attack; never infer a cause across other events.
  if(e.t && !['attack','kill'].includes(e.t))p.fight.last=null;
  const inc=(k,v=1)=>{n[k]=(n[k]||0)+v;},max=(k,v)=>{n[k]=Math.max(n[k]||0,v);};
  if(e.t==='fightStart'&&Array.isArray(e.foes))p.fight={active:true,kills:0,twenties:0,potions:0,last:null};
  else if(e.t==='attack'&&str(e.by)&&str(e.at)&&typeof e.hit==='boolean'&&num(e.dmg)&&Number.isInteger(e.nat)&&e.nat>=1&&e.nat<=20){
    p.fight.last=e.hit?{by:e.by,at:e.at,party:e.byParty===true,crit:e.crit===true,kind:e.kind,weapon:e.weapon||''}:null;
    if(e.byParty===true){if(e.hit)inc('damage',e.dmg);if(e.nat===1)inc('ones');if(e.nat===20){inc('twenties');if(p.fight.active)max('fightTwenties',++p.fight.twenties);}}
  }else if(e.t==='kill'&&str(e.who)&&str(e.by)&&str(e.bid)&&e.byParty===true){
    inc('kills');if(e.bid.includes('wolf'))inc('wolves');if(p.fight.active)max('fightKills',++p.fight.kills);
    const a=p.fight.last;if(a&&a.party&&a.by===e.by&&a.at===e.who){if(a.kind==='spell')inc('spellKills');if(/javelin|dart|throw/i.test(a.weapon))inc('thrownKills');if(a.crit)inc('critKills');}p.fight.last=null;
  }else if(e.t==='fightEnd'&&typeof e.won==='boolean'&&num(e.heroHp)&&num(e.heroTaken)&&Number.isInteger(e.rounds)&&e.rounds>=1){
    if(e.won){inc('wins');if(e.heroTaken===0)inc('untouched');if(e.rounds===1)inc('routs');if(e.rounds>=10)inc('slogs');if(e.heroHp===1)inc('oneHp');}else if(e.heroHp>0)inc('retreats');p.fight.active=false;p.fight.last=null;
  }else if(e.t==='potion'&&str(e.by)&&str(e.to)&&num(e.hpBefore)&&num(e.maxHp)&&e.maxHp>0){if(p.fight.active)max('fightPotions',++p.fight.potions);if(e.hpBefore/e.maxHp<.25)inc('lowPotions');}
  else if(e.t==='arrive'&&str(e.place)&&num(e.day)){
    if(!p.places.includes(e.place))p.places.push(e.place);n.towns=['village','vallaki','krezk'].filter(x=>p.places.includes(x)).length;
    if(['village','vallaki','krezk'].includes(e.place))max(e.place,1);if(['tser','tser-pool'].includes(e.place))max('tser',1);if(['castle','castle-gates'].includes(e.place))max('castle',1);
  }else if(e.t==='travel'&&str(e.from)&&str(e.to)&&num(e.hours)){inc('hours',e.hours);inc('journeys');}
  else if(e.t==='rest'&&e.kind==='long'&&e.where==='road')inc('roadRests');
  else if(e.t==='join'&&str(e.who))inc('joins');else if(e.t==='leave'&&str(e.who))inc('leaves');
  else if(e.t==='talk'&&str(e.who)){inc('talks');if(['madam-eva','eva'].includes(e.who.toLowerCase()))inc('eva');if(e.ok===true&&['Persuasion','Deception','Insight'].includes(e.check))inc(e.check.toLowerCase());}
  else if(e.t==='quest'&&str(e.id)&&e.done===true&&!p.quests.includes(e.id)){p.quests.push(e.id);inc('quests');}
  else if(e.t==='find'&&e.kind==='page'&&str(typeof e.page==='string'?e.page:e.page?.id)){const id=typeof e.page==='string'?e.page:e.page.id;if(!p.pages.includes(id)){p.pages.push(id);inc('pages');}}
  else if(e.t==='gold'&&num(e.gp))max('gold',e.gp);else if(e.t==='level'&&Number.isInteger(e.n)&&e.n>=1)max('level',e.n);
  else if(e.t==='heal'&&str(e.by)&&str(e.to)&&num(e.n))inc('healing',e.n);
  else if(e.t==='cast'&&str(e.by)&&str(e.spell)&&e.level===0)inc('cantrips');
  else if(e.t==='act'&&str(e.who)&&e.k==='dodge')inc('dodges');
  else if(e.t==='down'&&str(e.who)&&e.hero===true)inc('downs');else if(e.t==='death')inc('deaths');
  const unlocked=[];for(const a of ACHIEVEMENTS)if(!p.got.includes(a.id)&&(n[a.metric]||0)>=a.goal){p.got.push(a.id);const {id,name,text,icon,tier}=a;unlocked.push({id,name,text,icon,tier});}
  return {progress:p,unlocked};
}
export function shelf(progress=fresh()){return ACHIEVEMENTS.map(a=>{const got=(progress.got||[]).includes(a.id),n=Math.min(a.goal,progress.n?.[a.metric]||0);return {id:a.id,name:a.hidden&&!got?'???':a.name,text:a.hidden&&!got?a.hint:a.text,icon:a.icon,tier:a.tier,group:a.group,got,n,goal:a.goal,pct:Math.min(100,n/a.goal*100),hidden:a.hidden};});}
export function score(progress=fresh()){const all=shelf(progress),got=all.filter(a=>a.got);return {got:got.length,of:all.length,bronze:got.filter(a=>a.tier==='bronze').length,silver:got.filter(a=>a.tier==='silver').length,gold:got.filter(a=>a.tier==='gold').length};}
