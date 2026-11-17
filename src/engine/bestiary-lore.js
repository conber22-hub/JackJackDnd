import { LORE } from '../data/bestiary-lore.js';
const copy=v=>JSON.parse(JSON.stringify(v));
const has=(o,k)=>Object.hasOwn(o,k);
export function fresh(){return {};}
export function note(journal,event){
  const out=copy(journal||{}),e=event||{};
  if(!['seen','fought','killed'].includes(e.t)||typeof e.bid!=='string'||!e.bid)return out;
  const c=has(out,e.bid)?out[e.bid]:{seen:0,fought:0,killed:0,firstSeen:null};
  c[e.t]++; // Counts remain literal; fought/killed imply discovery for display, not fabricated sighting counts.
  if(c.firstSeen===null&&Number.isFinite(e.day)&&e.day>=0)c.firstSeen=e.day;
  Object.defineProperty(out,e.bid,{value:c,writable:true,enumerable:true,configurable:true});return out;
}
export function entry(journal,bid,stats={}){
  stats=stats||{};const c=has(journal||{},bid)?journal[bid]:{seen:0,fought:0,killed:0};
  const name=typeof stats.name==='string'&&stats.name?stats.name:String(bid||'Unknown creature').replaceAll('-',' ');
  const l=has(LORE,bid)?LORE[bid]:{family:'monstrosity',seen:`You have seen ${name}.`,fought:['Its habits must be learned through care.','Leave room for a second plan.'],lore:`The valley has a name for ${name}. Few agree on what it means. Those who returned remember it differently.`,voice:'a traveller',tip:'Trust what you have observed, not a rumour.',killsForLore:3};
  const tier=c.killed>=l.killsForLore?3:c.fought>0||c.killed>0?2:c.seen>0?1:0;
  const revealed={};if(tier>=2){for(const k of ['ac','speed'])if(has(stats,k))revealed[k]=copy(stats[k]);if(Number.isFinite(stats.hp))revealed.hp=`about ${Math.round(stats.hp)}`;for(const k of ['resist','immune','vuln'])if(Array.isArray(stats[k]))revealed[k]=copy(stats[k]);}
  return {bid,tier,name:tier?name:'???',family:tier?l.family:'???',seen:tier?l.seen:'',fought:tier>=2?[...l.fought]:[],lore:tier===3?l.lore:'',voice:tier===3?l.voice:'',tip:tier===3?l.tip:'',revealed,counts:{seen:c.seen||0,fought:c.fought||0,killed:c.killed||0},next:tier===0?'Not yet seen.':tier===1?'Fight it to learn more.':tier===2?`Kill ${l.killsForLore-(c.killed||0)} more to learn its story.`:null};
}
export function book(journal,roster=[]){const entries=roster.map(r=>entry(journal,r.bid,r.stats));const cmp=(a,b)=>a<b?-1:a>b?1:0;entries.sort((a,b)=>cmp(a.family,b.family)||cmp(a.name,b.name)||cmp(a.bid,b.bid));return {entries,seen:entries.filter(e=>e.tier>=1).length,fought:entries.filter(e=>e.tier>=2).length,mastered:entries.filter(e=>e.tier===3).length,of:entries.length};}
