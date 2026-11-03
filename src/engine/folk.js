/* Folk rules: populate/step/dialogue return values; witnesses and tellTheCourt deliberately
   update seen/court. Positions change only when the caller applies stepFolk's moves.
   Distances are squares. Every random choice uses a supplied RNG or the population seed. */
import { DIRS, passMove, canStep, canSee } from './grid.js';
import { hashSeed, mulberry32 } from '../util/core.js';
import { WEAKNESSES } from '../data/court.js';
import { DAMAGE_TYPES } from './defenses.js';
import { FOLK_ROLES, FOLK_NAMES, FOLK_SURNAMES, DOG_NAMES, ROLE_LINES, MOOD_LINES, RUMOUR_LINES } from '../data/folk.js';
const pick = (a, rng) => a[Math.floor(rng() * a.length)];
const point = p => ({x:p.x,y:p.y});
const key = p => `${p.x},${p.y}`;
const dist = (a,b) => Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
const inside = (p,r) => p.x>=r.x && p.y>=r.y && p.x<r.x+r.w && p.y<r.y+r.h;
const valid = (f,p) => Number.isInteger(p.x) && Number.isInteger(p.y) && p.x>=0 && p.y>=0 && p.x<f.W && p.y<f.H;
const living = court => (court?.members || []).filter(m=>m.alive);
const title = m => [m.name,m.epithet].filter(Boolean).join(' ');
const fill = (s, values) => s.replace(/\{(\w+)\}/g, (_,k)=>String(values[k] ?? ''));
const placeId = place => typeof place === 'string' ? place : place?.id || place?.name || place?.kind || 'the road';
function kindOf(f,place){
  const kind = (typeof place === 'object' ? place?.kind : null) || f.place?.kind || place;
  if (['village','walled','vineyard','vallaki','krezk'].includes(kind)) return kind==='vallaki' ? 'town' : 'village';
  if (['town','camp','road','dungeon'].includes(kind)) return kind;
  if (kind==='tser') return 'camp';
  if (['crossroads','gates','mists'].includes(kind)) return 'road';
  return 'dungeon';
}
// Breadth-first routing uses the grid's door, furniture and diagonal rules at every edge.
function route(f,start,isGoal,blocked = new Set(),allow = () => true){
  const queue=[start], parents=new Map([[key(start),null]]);
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(isGoal(p)){
      let q=p, prev=parents.get(key(q));
      while(prev && key(prev)!==key(start)){q=prev;prev=parents.get(key(q));}
      return prev ? point(q) : point(start);
    }
    for(const [dx,dy] of DIRS){
      const q={x:p.x+dx,y:p.y+dy};
      if(parents.has(key(q)) || blocked.has(key(q)) || !canStep(f,p.x,p.y,dx,dy) || !allow(p,q)) continue;
      parents.set(key(q),p);queue.push(q);
    }
  }
  return null;
}
export function populate(floor, {place = floor.place, seed = 0, gaze = 0, night = false, court} = {}){
  const kind=kindOf(floor,place), rooms=floor.rooms || [], indoor=rooms.filter(r=>!r.outdoor);
  const homes=[], open=[];
  const gatherings=rooms.filter(r=>r.outdoor && /well|market|church|square|shrine/i.test(`${r.name || ''} ${r.type || ''}`));
  const landmarks=(floor.props || []).filter(p=>/well|market|shrine/i.test(p.k));
  const gathering=p=>gatherings.some(r=>inside(p,r)) || landmarks.some(q=>dist(p,q)<=2);
  for(let y=0;y<floor.H;y++)for(let x=0;x<floor.W;x++){
    const p={x,y};if(!passMove(floor,y*floor.W+x))continue;
    const home=indoor.some(r=>inside(p,r)) || (floor.buildings || []).some(r=>x>r.x&&y>r.y&&x<r.x+r.w-1&&y<r.y+r.h-1);
    if(home || (['camp','road'].includes(kind) && rooms.some(r=>inside(p,r)))) homes.push(p);
    if(!home)open.push(p);
  }
  const density=kind==='dungeon'?1000:kind==='road'?450:kind==='camp'?160:100;
  const maximum=kind==='dungeon'?2:kind==='road'?3:32;
  const g=Math.max(0,Math.min(9,gaze));
  const count=Math.min(homes.length,Math.floor(Math.min(maximum,Math.max(1,Math.floor(floor.W*floor.H/density)))*(1-g*.08)*(night?.45:1)));
  const rng=mulberry32(hashSeed(`${seed}|${placeId(place)}`));
  // Shuffle once so high-Gaze populations are prefixes of low-Gaze populations.
  for(let i=homes.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[homes[i],homes[j]]=[homes[j],homes[i]];}
  const masters=living(court), hunters=masters.filter(m=>m.hunting), spyRate=g<1?0:Math.min(.2,.05+(g-1)*.0375);
  return homes.slice(0,count).map((home,i)=>{
    const r=mulberry32(hashSeed(`${seed}|${placeId(place)}|${i}`)), roles=FOLK_ROLES[kind], role=roles[(i+hashSeed(seed))%roles.length];
    const roll=r(), master=masters.length ? pick(hunters.length?hunters:masters,r) : null;
    const haunts=[];
    // Nearby open gathering spaces are preferred; disconnected squares are never selected.
    for(const p of [...open].sort((a,b)=>Number(gathering(b))-Number(gathering(a)) || dist(a,home)-dist(b,home))){
      if(haunts.some(h=>dist(h,p)<3))continue;
      if(route(floor,home,q=>key(q)===key(p)))haunts.push(point(p));
      if(haunts.length===3)break;
    }
    return {id:`folk-${hashSeed(`${seed}|${placeId(place)}|${i}`)}`,role,
      name:role==='dog'?pick(DOG_NAMES,r):`${pick(FOLK_NAMES,r)} ${pick(FOLK_SURNAMES,r)}`,
      ...point(home),home:point(home),haunts,mood:g>=5?'afraid':g>=2?'wary':'easy',
      spy:role!=='dog' && master && roll<spyRate ? {for:master.id} : null,seen:[]};
  });
}
export function stepFolk(folk, floor, {party = [], fight = false, night = false, rng}){
  const partySquares=[];
  for(const t of party)for(let dy=0;dy<(t.size||1);dy++)for(let dx=0;dx<(t.size||1);dx++)partySquares.push({x:t.x+dx,y:t.y+dy});
  const partyKeys=new Set(partySquares.map(key)), occupied=new Set([...partyKeys,...folk.map(key)]), moves=[];
  const distance=p=>partySquares.length?Math.min(...partySquares.map(t=>dist(p,t))):Infinity;
  for(const p of folk){
    if(!valid(floor,p))continue;
    occupied.delete(key(p));
    if(partyKeys.has(key(p)))occupied.add(key(p));
    let next=null;
    if(night || fight){
      if(key(p)!==key(p.home))next=route(floor,p,q=>key(q)===key(p.home),occupied,fight?(a,b)=>distance(b)>=distance(a):undefined);
      if(fight && !next && key(p)!==key(p.home)){
        const options=DIRS.map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).filter(q=>!occupied.has(key(q))&&canStep(floor,p.x,p.y,q.x-p.x,q.y-p.y)&&distance(q)>distance(p));
        if(options.length)next=pick(options.filter(q=>distance(q)===Math.max(...options.map(distance))),rng);
      }
    } else if(p.spy && partySquares.length){
      next=route(floor,p,q=>distance(q)>=3&&distance(q)<=6,occupied,(a,b)=>distance(a)>=3?distance(b)>=3:distance(b)>distance(a));
    } else {
      const goal=pick([p.home,...p.haunts],rng);
      next=route(floor,p,q=>key(q)===key(goal),occupied);
    }
    if(next && key(next)!==key(p))moves.push({id:p.id,...next});
    occupied.add(key(next || p));
  }
  return moves;
}
export function witnesses(folk, floor, event, {range = 8} = {}){
  if(!valid(floor,event))return [];
  const ids=[];
  for(const p of folk)if(valid(floor,p)&&dist(p,event)<=range&&canSee(floor,p.x,p.y,event.x,event.y)){
    p.seen=[...(p.seen || []),{kind:event.kind,x:event.x,y:event.y,day:event.day ?? null}].slice(-5);ids.push(p.id);
  }
  return ids;
}
export function tellTheCourt(court, folk, ids, event, {place,day}, rng){
  const news=[], witnesses=folk.filter(p=>ids.includes(p.id)), informed=new Set();
  for(const p of witnesses){
    const m=p.spy && living(court).find(m=>m.id===p.spy.for);
    if(!m || informed.has(m.id))continue;
    informed.add(m.id);
    m.knows={...m.knows,party:placeId(place),day,heroes:[...new Set([...(m.knows?.heroes || []),...(event.by?[event.by]:[])])]};
    if(['kill','spell'].includes(event.kind)&&event.by&&DAMAGE_TYPES.includes(event.type))m.knows.tactic=event.type;
    m.hunting=true;
    news.push({who:m.id,text:fill(pick(RUMOUR_LINES.report,rng),{place:placeId(place),hero:event.by || 'unknown travellers',kind:event.kind}),rumour:false});
  }
  if(event.kind==='kill'&&witnesses.some(p=>!p.spy && p.role!=='dog'))news.push({who:null,text:fill(pick(RUMOUR_LINES.kill,rng),{place:placeId(place)}),rumour:true});
  court.news=[...(court.news || []),...news].slice(-30);
  return news;
}
export function greet(person, {gaze = 0,night = false} = {}, rng){
  if(person.role==='dog')return pick(ROLE_LINES.dog,rng);
  if(person.mood==='afraid'||gaze>=5)return pick(MOOD_LINES.afraid,rng);
  if(night)return pick(MOOD_LINES.night,rng);
  if(person.mood==='wary'&&rng()<.5)return pick(MOOD_LINES.wary,rng);
  return pick(ROLE_LINES[person.role] || ROLE_LINES.traveller,rng);
}
export function rumourFor(person, court, {gaze = 0} = {}, rng){
  const members=living(court), master=person.spy&&members.find(m=>m.id===person.spy.for);
  if(master)return {text:fill(pick(RUMOUR_LINES.lure,rng),{name:title(master),place:master.haunt}),about:master.id,true:false};
  const localNews=(court.news || []).filter(n=>n.rumour===true && n.who==null).slice(-5);
  if(person.role!=='dog' && localNews.length && rng()<.25)return {text:pick(localNews,rng).text,about:null,true:true};
  if(person.role!=='dog' && members.length && rng()<.7){
    const m=pick(members,rng), choice=rng(), values={name:title(m),place:m.haunt};
    if(choice<.35){
      const actual=(m.weaknesses || []).filter(k=>WEAKNESSES[k]), wrong=Object.keys(WEAKNESSES).filter(k=>!actual.includes(k));
      const lie=rng()<Math.min(.8,.1+Math.max(0,gaze)*.075);
      if((lie?wrong:actual).length){const weakness=pick(lie?wrong:actual,rng);return {text:fill(pick(RUMOUR_LINES.weakness,rng),{...values,weakness:WEAKNESSES[weakness].n.toLowerCase()}),about:m.id,true:!lie};}
    }
    const news=(court.news || []).filter(n=>n.rumour===true&&n.who===m.id);
    if(choice<.7&&news.length)return {text:pick(news.slice(-5),rng).text,about:m.id,true:true};
    return {text:fill(pick(RUMOUR_LINES.haunt,rng),values),about:m.id,true:true};
  }
  return {text:greet(person,{gaze,night:false},rng),about:null,true:true};
}
