/* Catalogue entries have no IDs: item.id and item.n both use the exact SRD
   catalogue name. Only single-rarity entries with a concrete item are eligible;
   generic variant families are excluded. Prices without SRD cost are estimates. */
import { SRD_WEAPONS,ARMOR_ITEMS,TOOLS,GEAR,MAGIC_ITEMS } from '../data/srd-items.js';
import { TIERS,RARITY_CAP,ART,FLAVOUR,MAGIC_VALUE } from '../data/hoard.js';
const copy=v=>structuredClone(v),pick=(a,rng)=>a[Math.floor(rng()*a.length)];
const rank={common:0,uncommon:1,rare:2};
const mundane=[...SRD_WEAPONS,...ARMOR_ITEMS,...TOOLS,...GEAR].filter(i=>Number.isFinite(i.cost) && i.cost<=50);
const magic=MAGIC_ITEMS.filter(i=>!i.variants && Object.hasOwn(rank,String(i.rarity).toLowerCase()) && !/\b(Weapon|Armor|Ammunition),/.test(i.n));
export function hoard(tier,{level=1,fam='folk',theme='',gaze=1,rng}={}){
 if(!Number.isInteger(tier) || tier<0 || tier>3 || !Number.isInteger(level) || level<1 || level>20 || typeof rng!=='function') throw new RangeError('Supply tier 0–3, level 1–20 and rng.');
 const h={coins:{cp:0,sp:0,ep:0,gp:0,pp:0},items:[],art:[],notes:[]};if(!tier) return h;
 const wealth=Math.round(TIERS[tier]*(1+level*level/8)*(.75+rng()*.5)*100);
 h.coins.cp=wealth%10;h.coins.sp=Math.floor(wealth/10)%10;h.coins.gp=Math.floor(wealth/100);
 const cap=RARITY_CAP.filter(v=>level>=v.level).at(-1).rarity;
 for(let i=0;i<tier;i++){
  const magical=rng()<(tier===3?.55:tier===2?.3:.15),limit=tier<3?'common':cap;
  const pool=magical?magic.filter(m=>rank[m.rarity.toLowerCase()]<=rank[limit]):mundane;
  const chosen=pick(pool,rng),rarity=magical?chosen.rarity.toLowerCase():'mundane';
  h.items.push({id:chosen.n,n:chosen.n,qty:1,rarity,weight:chosen.weight || 0,gp:chosen.cost ?? MAGIC_VALUE[rarity] ?? 0});
 }
 for(let i=0;i<tier-1;i++){const a=copy(pick(ART,rng));a.gp*=Math.max(1,Math.ceil(level/4));h.art.push(a);}
 if(fam==='seep') for(const it of [...h.items,...h.art]) if(rng()<.5){it.spoiled=true;it.originalGp=it.gp;it.gp/=2;it.desc=`Half-rotted with fungus: ${it.desc || it.n}.`;}
 if(fam==='barovia' && h.items.length && rng()<Math.min(.75,.25+gaze*.03)) Object.assign(pick(h.items,rng),{counts:true,gazeOnTake:1,desc:'The Count’s seal marks this as his; taking it will be noticed.'});
 h.notes.push(FLAVOUR[fam] || FLAVOUR.other);if(theme) h.notes.push(`Found among the remains of ${String(theme)}.`);
 return h;
}
export function keyItems(locks,graph={links:[]}){
 return locks.filter(l=>['locked','sealed'].includes(l.kind) && l.key).map((l,i)=>({id:l.key.id || `site-key-${i+1}`,name:l.key.name,kind:'key',opens:[...(l.doors || l.doorIds || graph.links.find(e=>e.a===l.a && e.b===l.b || e.a===l.b && e.b===l.a)?.doors || [])],weight:0,desc:l.key.how || 'An access token for a secured passage.',room:l.key.in,placement:/carr|leader|wear|belt|guard|keeper|steward/i.test(l.key.how || '')?'leader':'container',link:{a:l.a,b:l.b}}));
}
export function value(h){
 const c=h.coins || {};return Math.round(((c.cp || 0)+(c.sp || 0)*10+(c.ep || 0)*50+(c.gp || 0)*100+(c.pp || 0)*1000+[...(h.items || []),...(h.art || [])].reduce((n,i)=>n+Math.round((i.gp || 0)*100)*(i.qty ?? 1),0)))/100;
}
export function split(h,n){
 if(!Number.isSafeInteger(n) || n<1) throw new RangeError('Choose a positive number of heroes.');
 const remainder={cp:0,sp:0,ep:0,gp:0,pp:0},share={...remainder};
 for(const k of Object.keys(share)){const total=h.coins?.[k] || 0;if(!Number.isSafeInteger(total) || total<0) throw new RangeError('Coins must be non-negative integers.');share[k]=Math.floor(total/n);remainder[k]=total%n;}
 return {shares:Array.from({length:n},()=>({...share})),remainder};
}
