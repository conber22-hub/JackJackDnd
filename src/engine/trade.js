/* Pure trade and trouble proposals. The DM applies returned sheets/effects once and
   persists stock quantities and trouble status. Money is rounded to copper pieces. */
import { itemInfo, migrateSheet, coinValueGp } from './inventory.js';
import { hashSeed, mulberry32 } from '../util/core.js';
import { PLACE_NAMES } from './nemesis.js';
import { SELLER_STOCK, ODD_STOCK, BARGAIN_LINES, TROUBLE_LINES, FAVOURS, RETURN_LINE } from '../data/trade.js';
const cp = gp => Math.round(gp*100);
const money = gp => cp(gp)/100;
const placeId = p => typeof p==='string' ? p : p?.id || p?.name || p?.kind || 'village';
const town = p => ['town','vallaki'].includes(p?.kind || placeId(p));
const alive = p => p && !p.dead && p.alive!==false && !p.flags?.gone;
const pick = (a,rng) => a[Math.floor(rng()*a.length)];
const fill = (s,v) => s.replace(/\{(\w+)\}/g,(_,k)=>v[k] ?? '');
export function stockFor(person, {place='village',gaze=0,day=0,seed=0} = {}){
  if (!alive(person) || !SELLER_STOCK[person.role]) return [];
  const rng=mulberry32(hashSeed(JSON.stringify([seed,person.id,placeId(place),day])));
  const names=[...SELLER_STOCK[person.role]];
  if (person.role==='peddler' && rng()<.25) names.push(pick(ODD_STOCK,rng));
  // A shuffle with a private daily seed: Gaze changes prices, never the day's selection.
  for(let i=names.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1));[names[i],names[j]]=[names[j],names[i]]; }
  const multiplier=1+Math.max(0,gaze-2)*.1;
  const selected=person.role==='smith' && !town(place) ? ['Dagger','Shield',"Smith's Tools",names.find(n=>!['Dagger','Shield',"Smith's Tools"].includes(n))] : names.slice(0,town(place)?8:4);
  return selected.map(n=>itemInfo(n)).filter(i=>i && Number.isFinite(i.cost))
    .map(i=>({n:i.n,qty:(town(place)?2:1)+Math.floor(rng()*3),gp:money(i.cost*multiplier)}));
}
export function haggle(price, {roll,dc}, rng){
  if (!Number.isFinite(price) || price<0) throw new RangeError('Price must be non-negative.');
  // roll is the check total; pass {total,raw} to distinguish a natural 1 with modifiers.
  const raw=typeof roll==='object'?roll.raw:roll, total=typeof roll==='object'?roll.total:roll;
  if(raw===1) return {gp:money(price*1.1),line:BARGAIN_LINES.fumble};
  if(total>=dc) return {gp:money(price*(.9-Math.floor(rng()*11)/100)),line:BARGAIN_LINES.success};
  return {gp:money(price),line:BARGAIN_LINES.failure};
}
function change(value){
  const c={pp:0,gp:0,ep:0,sp:0,cp:0};
  for(const [k,v] of [['pp',1000],['gp',100],['sp',10],['cp',1]]){c[k]=Math.floor(value/v);value%=v;}
  return c;
}
const no = why => ({ok:false,why});
// One unit per transaction; no change to the input sheet, even when rejected.
export function buy(sheet,item,gp){
  const info=itemInfo(typeof item==='string'?item:item?.n);
  if(!info) return no('That item is not in the catalogue.');
  if(!Number.isFinite(gp) || gp<0) return no('The price is invalid.');
  if(typeof item==='object' && item.qty!==undefined && item.qty<1) return no('That item is sold out.');
  const out=migrateSheet(sheet), balance=cp(coinValueGp(out.coins)), price=cp(gp);
  if(balance<price) return no('There is not enough coin.');
  let i=1;while(out.inv.some(it=>it.id===`trade-${i}`)) i++;
  out.inv.push({id:`trade-${i}`,n:info.n,qty:1,equipped:false,attuned:false});
  out.coins=change(balance-price);
  return {ok:true,sheet:out,gp:price/100,itemId:`trade-${i}`};
}
export function sell(sheet,itemId,{person} = {}){
  const out=migrateSheet(sheet), item=out.inv.find(i=>i.id===itemId), info=item && itemInfo(item.n);
  if(!item || (item.qty ?? 1)<1 || !info) return no('There is no such item to sell.');
  if(!alive(person) || !SELLER_STOCK[person.role]) return no('There is no buyer here.');
  if(person.role==='smith' && !town(person.place) && (info.magic || info.rarity || info.variants)) return no('The smith cannot buy magic.');
  if(!Number.isFinite(info.cost)) return no('There is no catalogue price for that item.');
  if(item.equipped || item.attuned) return no('Put it away and end attunement before selling it.');
  const value=Math.floor(cp(info.cost)/2);
  if((item.qty ?? 1)>1) item.qty--; else out.inv=out.inv.filter(i=>i.id!==itemId);
  out.coins=change(cp(coinValueGp(out.coins))+value);
  return {ok:true,sheet:out,gp:value/100};
}
// Pass actual loaded folk across maps, with optional `place` metadata. Rescue goals
// always refer to an existing role, never a fabricated child or captive. The caller
// supplies only folk it wants available at this place as requesters (or tags place).
export function troublesFor(folk,court,{place='village',gaze=0,day=0} = {},rng){
  const people=folk.filter(alive), members=(court?.members || []).filter(m=>m.alive);
  const locals=people.filter(p=>(!p.place || placeId(p.place)===placeId(place)) && !['dog','lostChild','captive'].includes(p.role));
  const limit=Math.floor(locals.length/3), out=[], used=new Set();
  if(!limit) return out;
  const candidates=[];
  for(const p of people){
    if(['lostChild','captive'].includes(p.role)) candidates.push({kind:p.role,subject:p});
    if(p.spy && members.some(m=>m.id===p.spy.for)) candidates.push({kind:'missing',subject:p,member:members.find(m=>m.id===p.spy.for)});
  }
  // Current advanceCourt emits raids as public news with `who` + `place`, without
  // a kind or day. Restrict legacy matching to its distinctive raid sentence and
  // the newest ten news items; accept structured raids with a three-day lifetime.
  for(const news of (court?.news || []).slice(-10).reverse()){
    const member=members.find(m=>m.id===news.who);
    if(!member || placeId(news.place)!==placeId(place) || !news.place || news.rumour!==true) continue;
    if(!(news.kind==='raid' || /came down on .+ in the night\./.test(news.text || ''))) continue;
    if(news.day!=null && (news.day>day || day-news.day>3)) continue;
    candidates.push({kind:'raid',member,news});
  }
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  for(const c of candidates){
    if(out.length>=limit) break;
    const by=locals.find(p=>!used.has(p.id) && p.id!==c.subject?.id);
    if(!by) continue;
    const identity=c.subject?.id || `${c.member.id}:${c.news.text}`;
    const id=`trouble-${hashSeed(JSON.stringify([placeId(place),c.kind,identity]))}`;
    if(out.some(t=>t.id===id)) continue;
    used.add(by.id);
    const r=rng();let reward;
    if(r<.34) reward={kind:'coins',gp:Math.max(1,Math.floor(6-Math.max(0,gaze)/2))};
    else if(r<.67 || !members.length) reward={kind:'favour',text:FAVOURS[by.role] || FAVOURS.other};
    else {const m=pick(members,rng);reward={kind:'rumour',true:true,member:m.id,text:`${m.name} haunts ${PLACE_NAMES[m.haunt] || m.haunt}.`};}
    out.push({id,by:by.id,kind:c.kind,day,status:'open',mood:by.mood || 'wary',
      text:fill(TROUBLE_LINES[c.kind],{name:c.subject?.name,news:c.news?.text}),
      goal:c.kind==='raid'?{action:'stopRaid',member:c.member.id,place:c.member.haunt,news:{...c.news}}:
        {action:c.kind==='lostChild'?'bringHome':c.kind==='captive'?'free':'return',person:c.subject.id,...(c.subject.place?{place:placeId(c.subject.place)}:{})},
      reward,...(c.member?{links:{member:c.member.id}}:{}),...(c.kind==='missing'?{secret:{spy:c.subject.id,member:c.member.id,returnLine:RETURN_LINE}}:{})});
  }
  return out;
}
// Resolve once; effects are proposals, not mutations. Apply mood.delta to the
// requester's CURRENT mood (afraid < wary < easy), not the saved display value.
export function resolve(trouble,outcome){
  if(!['done','failed','ignored'].includes(outcome)) throw new RangeError('Unknown trouble outcome.');
  if(trouble.status && trouble.status!=='open') return {trouble:structuredClone(trouble),effects:null};
  const moods=['afraid','wary','easy'], delta=outcome==='done'?1:-1;
  const mood=moods[Math.max(0,Math.min(2,Math.max(0,moods.indexOf(trouble.mood))+delta))];
  const effects={mood:{id:trouble.by,delta,mood}};
  if(outcome==='done') effects.reward=structuredClone(trouble.reward);
  if(trouble.kind==='raid' && outcome==='failed' && trouble.links?.member) effects.court={member:trouble.links.member,power:1,hunting:true};
  if(trouble.kind==='missing' && outcome==='done' && trouble.secret) effects.returning={person:trouble.secret.spy,line:trouble.secret.returnLine,member:trouble.secret.member};
  return {trouble:{...structuredClone(trouble),status:outcome},effects};
}
