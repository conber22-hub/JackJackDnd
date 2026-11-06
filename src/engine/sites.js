import { SITE_KINDS, FACTIONS, ROLES, KEYS, BEATS, DETAILS } from '../data/sites.js';

const byId=items=>new Map(items.map(v=>[v.id,v]));
const kinds=byId(SITE_KINDS),factions=byId(FACTIONS),roles=byId(ROLES),keys=byId(KEYS);
const clone=value=>JSON.parse(JSON.stringify(value));
const pair=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
const rank={low:1,moderate:2,high:3};
const own=(o,k)=>o!==null && typeof o==='object' && Object.hasOwn(o,k);
const nonempty=s=>typeof s==='string' && s.trim().length>0;
const sentence=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fill=(s,values)=>s.replace(/\{(\w+)\}/g,(_,key)=>values[key] ?? `{${key}}`);
const pick=(a,rng)=>a[Math.floor(rng()*a.length)];
function random(seed){
  let h=2166136261;for(const c of seed){h^=c.codePointAt(0);h=Math.imul(h,16777619);}
  return ()=>{let t=h+=0x6d2b79f5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
function shuffled(values,rng){const a=values.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function weighted(values,weight,rng){let roll=rng()*values.reduce((sum,v)=>sum+weight(v),0);for(const v of values){roll-=weight(v);if(roll<0)return v;}return values.at(-1);}

function graph(floor){
  if(!floor || !Array.isArray(floor.rooms) || floor.rooms.length<2 || floor.rooms.length>512 || !Array.isArray(floor.links))throw new TypeError('A site needs 2–512 rooms and a links array');
  const rooms=floor.rooms,index=new Map(),recordKeys=new Set();
  rooms.forEach((r,i)=>{
    if(!r || !(typeof r.id==='string' && r.id.length>0 || Number.isSafeInteger(r.id)) || index.has(r.id) || recordKeys.has(String(r.id)))throw new TypeError('Room ids must be unique JSON strings or safe integers, including as object keys');
    if(!['x','y','w','h','size'].every(k=>Number.isSafeInteger(r[k])) || r.w<1 || r.h<1 || r.size!==r.w*r.h)throw new TypeError('Room geometry must have positive dimensions and size equal to w*h');
    index.set(r.id,i);recordKeys.add(String(r.id));
  });
  const adj=rooms.map(()=>[]),edges=[],edgeMap=new Map(),secrets=new Set();
  for(const link of floor.links){
    if(!link || !index.has(link.a) || !index.has(link.b) || link.a===link.b || !['door','open','secret'].includes(link.kind))throw new TypeError('Every link must join two existing rooms with a known kind');
    const a=index.get(link.a),b=index.get(link.b),key=pair(a,b);
    if(edgeMap.has(key))throw new TypeError('Parallel links cannot be addressed by a/b alone');
    const e=edges.length;edgeMap.set(key,e);edges.push({a,b,kind:link.kind});adj[a].push({to:b,e});adj[b].push({to:a,e});if(link.kind==='secret')secrets.add(e);
  }
  const entry=floor.up==null?Math.max(0,rooms.findIndex(r=>r.type==='entrance')):index.get(floor.up);
  const down=floor.down==null?null:index.get(floor.down);
  if(entry===undefined || down===undefined)throw new TypeError('Stairs must refer to existing rooms');
  const g={rooms,index,adj,edges,edgeMap,secrets,entry,down};
  if(search(g,entry).distance.some(d=>d<0))throw new RangeError('The room graph must be connected');
  if(!adj[entry].some(v=>!secrets.has(v.e)))throw new RangeError('The entrance needs a non-secret way into the site');
  return g;
}
function search(g,start,blocked=new Set()){
  const distance=Array(g.rooms.length).fill(-1),parent=Array(g.rooms.length).fill(-1),queue=[start];distance[start]=0;
  for(let n=0;n<queue.length;n++)for(const {to,e} of g.adj[queue[n]])if(!blocked.has(e) && distance[to]<0){distance[to]=distance[queue[n]]+1;parent[to]=queue[n];queue.push(to);}
  return {distance,parent,queue};
}
function pathTo(search,end){const path=[];for(let i=end;i>=0;i=search.parent[i])path.push(i);return path.reverse();}
function articulations(g){
  const time=Array(g.rooms.length).fill(-1),low=time.slice(),out=new Set();let clock=0;
  function visit(v,parent){
    time[v]=low[v]=clock++;let children=0;
    for(const {to} of g.adj[v]){
      if(to===parent)continue;
      if(time[to]<0){children++;visit(to,v);low[v]=Math.min(low[v],low[to]);if(parent>=0 && low[to]>=time[v])out.add(v);}
      else low[v]=Math.min(low[v],time[to]);
    }
    if(parent<0 && children>1)out.add(v);
  }
  visit(g.entry,-1);return out;
}
function fits(role,g,i,onRoute){
  const needs=roles.get(role)?.needs;if(!needs)return false;
  return g.rooms[i].size>=(needs.minSize||1) && (!needs.deadEnd||g.adj[i].length===1) && g.adj[i].length>=(needs.minDoors||0) && (needs.maxDoors===undefined||g.adj[i].length<=needs.maxDoors) && (!needs.offRoute||!onRoute.has(i));
}
function options(opts){
  if(!opts || typeof opts!=='object' || Array.isArray(opts))throw new TypeError('Expected site options');
  const o={seed:'barovia',kind:null,theme:'undercroft',depth:0,last:false,gaze:1,level:3,...opts};
  if(typeof o.seed!=='string' || !nonempty(o.theme) || typeof o.last!=='boolean' || !Number.isInteger(o.depth)||o.depth<0||o.depth>1000 || !Number.isInteger(o.gaze)||o.gaze<1||o.gaze>10 || !Number.isInteger(o.level)||o.level<1||o.level>20 || o.kind!==null && !kinds.has(o.kind))throw new RangeError('Invalid site options');
  return o;
}
function outline(g,o){
  const full=search(g,g.entry),publicPaths=search(g,g.entry,g.secrets),farthest=Math.max(...full.distance);
  if(!o.last && g.down!==null && (publicPaths.distance[g.down]<0 || g.down===g.entry))throw new RangeError('The way down must differ from the entry and remain reachable without secret passages');
  const far=publicPaths.queue.reduce((best,i)=>publicPaths.distance[i]>publicPaths.distance[best]?i:best,g.entry);
  let route=pathTo(publicPaths,!o.last && g.down!==null?g.down:far);
  const late=route.slice(Math.max(1,Math.ceil((route.length-1)/2)));
  const eligible=i=>i!==g.entry && g.rooms[i].size>=(o.last?30:12) && (!o.last||full.distance[i]>=farthest/2);
  let choices=late.filter(eligible);
  if(!choices.length)choices=(o.last?publicPaths.queue:route).filter(eligible);
  if(!choices.length)throw new RangeError(o.last?'No reachable boss room of at least 30 squares lies in the farther half of the site':'No room on the main route can hold the lair');
  choices.sort((a,b)=>g.rooms[b].size-g.rooms[a].size || full.distance[b]-full.distance[a] || a-b);
  const climax=choices[0];if(o.last || g.down===null)route=pathTo(publicPaths,climax);
  return {route,climax,distance:full.distance,publicPaths,articulation:articulations(g)};
}
function alternateRoutes(g,route){
  const position=new Map(route.map((v,i)=>[v,i])),mainEdges=new Set(route.slice(1).map((v,i)=>g.edgeMap.get(pair(v,route[i])))),out=[];
  for(let start=0;start<route.length;start++){
    const first=route[start],parent=Array(g.rooms.length).fill(-1),queue=[first];parent[first]=first;
    for(let n=0;n<queue.length;n++)for(const {to,e} of g.adj[queue[n]]){
      if(mainEdges.has(e)||parent[to]>=0)continue;
      parent[to]=queue[n];
      if(position.has(to)){
        if(position.get(to)>start){const path=[to];for(let v=queue[n];v!==first;v=parent[v])path.push(v);path.push(first);out.push(path.reverse());}
      }else queue.push(to);
    }
  }
  return out;
}
function cast(g,o,site,shape,rng){
  const {route,climax,distance,articulation}=shape,onRoute=new Set(route),cast=Array(g.rooms.length).fill(null);
  cast[g.entry]='entry';cast[climax]=o.last?'boss':'lair';
  const before=route.slice(1,route.indexOf(climax)).reverse();
  const guard=before.find(i=>fits('guardpost',g,i,onRoute));if(guard!==undefined)cast[guard]='guardpost';
  const early=route.slice(1).find(i=>!cast[i]);if(early!==undefined)cast[early]='clue';
  const side=shuffled(g.rooms.map((_,i)=>i).filter(i=>!cast[i]&&!onRoute.has(i)),rng);
  const rest=side.filter(i=>fits('rest',g,i,onRoute)).sort((a,b)=>Number(articulation.has(a))-Number(articulation.has(b)) || Math.abs(distance[a]-distance[climax]/2)-Math.abs(distance[b]-distance[climax]/2))[0];
  if(rest!==undefined)cast[rest]='rest';
  for(const role of ['treasury','prison']){
    const candidate=side.find(i=>!cast[i] && fits(role,g,i,onRoute));
    if(candidate!==undefined && (site.roles[role]||0)>0)cast[candidate]=role;
  }
  const reserved=new Set(['entry','boss','lair','guardpost']);
  for(let i=0;i<cast.length;i++)if(!cast[i]){
    const choices=ROLES.filter(r=>!reserved.has(r.id) && (site.roles[r.id]||0)>0 && fits(r.id,g,i,onRoute));
    cast[i]=choices.length?weighted(choices,r=>(site.roles[r.id]||0)*(g.rooms[i].type===r.id?1.4:1)*(o.gaze>=7 && ['trap','barracks'].includes(r.id)?1.5:1),rng).id:'empty';
  }
  return cast;
}
function inhabitants(site,o,n,rng){
  const selected=[factions.get(site.factions[0])];
  // Low Gaze does not add the Count's families to an otherwise independent site.
  let choices=site.factions.slice(1).map(id=>factions.get(id)).filter(f=>o.gaze>=7 || !['barovia','dread'].includes(f.fam));
  if(n>=8 && choices.length && rng()<.7){const f=pick(choices,rng);selected.push(f);choices=choices.filter(v=>v.id!==f.id);}
  if(o.gaze>=7 && !selected.some(f=>f.id==='tithe-court'))selected.push(factions.get('tithe-court'));
  else if(n>=20 && choices.length && rng()<.3)selected.push(pick(choices,rng));
  return clone(selected.slice(0,3));
}
const label=(g,cast,i)=>`the ${roles.get(cast[i]).label.toLowerCase()} (room ${String(g.rooms[i].id)})`;
function chooseLocks(g,o,site,shape,cast,rng){
  const {route,climax,distance}=shape,onRoute=new Set(route),mainEdges=new Set(route.slice(1).map((v,i)=>g.edgeMap.get(pair(v,route[i]))));
  const chosen=[...g.secrets].map(e=>({e,kind:'secret',existing:true}));
  const doors=shuffled(g.edges.map((edge,e)=>({...edge,e})).filter(v=>v.kind==='door' && v.a!==g.entry && v.b!==g.entry),rng);
  const desirability=e=>Number(cast[e.a]==='treasury'||cast[e.b]==='treasury')*10+Number(!mainEdges.has(e.e))*3+Math.min(distance[e.a],distance[e.b])/100;
  doors.sort((a,b)=>desirability(b)-desirability(a));
  const limit=Math.min(3,1+Math.floor(g.rooms.length/12)),secretEdges=new Set(g.secrets);
  for(const edge of doors.slice(0,limit)){
    let kind=rng()<.35?'sealed':'locked';
    if(!mainEdges.has(edge.e) && rng()<.35){
      const blocked=new Set([...secretEdges,edge.e]),goal=o.last||g.down===null?climax:g.down;
      if(search(g,g.entry,blocked).distance[goal]>=0){kind='secret';secretEdges.add(edge.e);}
    }
    chosen.push({e:edge.e,kind,existing:false});
  }
  const blocked=new Set(chosen.map(v=>v.e)),pending=chosen.slice(),locks=[],used=new Set();
  // Construct an acquisition order with *all future gates closed*. Each new key
  // is on the reachable side before its own gate is opened, so dependencies form
  // a directed acyclic order rather than a collection of individually safe locks.
  while(pending.length){
    const reachable=search(g,g.entry,blocked).distance;
    const candidates=pending.map(gate=>{
      const edge=g.edges[gate.e];
      if(reachable[edge.a]<0 && reachable[edge.b]<0)return {gate,rooms:[]};
      let rooms=g.rooms.map((_,i)=>i).filter(i=>reachable[i]>=0 && i!==climax);
      if(mainEdges.has(gate.e))rooms=rooms.filter(i=>!onRoute.has(i));
      return {gate,rooms};
    });
    const ready=candidates.find(c=>c.rooms.length);
    if(!ready){
      const omit=pending.find(gate=>!gate.existing && (reachable[g.edges[gate.e].a]>=0||reachable[g.edges[gate.e].b]>=0));
      if(!omit)throw new RangeError('Existing secret passages cannot be supplied with reachable access mechanisms');
      blocked.delete(omit.e);pending.splice(pending.indexOf(omit),1);continue;
    }
    const {gate}=ready,edge=g.edges[gate.e],near=search(g,reachable[edge.a]>=0?edge.a:edge.b).distance;
    const room=shuffled(ready.rooms,rng).sort((a,b)=>Number(a===g.entry)-Number(b===g.entry) || Number(onRoute.has(a))-Number(onRoute.has(b)) || near[a]-near[b])[0];
    const opens={locked:'door',sealed:'gate',secret:'secret'}[gate.kind];
    let choices=site.keys.map(id=>keys.get(id)).filter(k=>k.opens===opens);
    if(!choices.length)choices=KEYS.filter(k=>k.opens===opens);
    const unused=choices.filter(k=>!used.has(k.id)),key=pick(unused.length?unused:choices,rng);used.add(key.id);
    locks.push({a:g.rooms[edge.a].id,b:g.rooms[edge.b].id,kind:gate.kind,key:{id:`${key.id}-${locks.length+1}`,name:key.name,in:g.rooms[room].id,how:key.where},text:key.text});
    blocked.delete(gate.e);pending.splice(pending.indexOf(gate),1);
  }
  return locks;
}

/** Pure DM-side plan. null up uses the first entrance-typed room, then the first
 * room. Existing secrets remain secret; required routes use ordinary links.
 * Impossible inputs fail explicitly (notably no suitably distant 30-square boss
 * room). Topology-dependent extras are omitted when they cannot fit safely.
 */
export function planSite(floor,opts={}){
  const o=options(opts),g=graph(floor),rng=random(o.seed),matching=SITE_KINDS.filter(k=>k.themes.includes(o.theme));
  const site=o.kind?kinds.get(o.kind):weighted(matching.length?matching:SITE_KINDS,k=>o.last?1+(k.roles.boss||0):1,rng);
  const shape=outline(g,o),castRoles=cast(g,o,site,shape,rng),onRoute=new Set(shape.route),castFactions=inhabitants(site,o,g.rooms.length,rng),owner=castFactions[0];
  const assigned=castRoles.map(r=>r==='rest'?null:owner.id);
  const territory=shuffled(g.rooms.map((_,i)=>i).filter(i=>i!==g.entry && i!==shape.climax && castRoles[i]!=='rest'),rng);
  for(const faction of castFactions.slice(1))for(let n=0;n<Math.max(1,Math.floor(g.rooms.length*.17)) && territory.length>1;n++)assigned[territory.shift()]=faction.id;
  // On tiny floors preserve the owner's strict plurality as well as the entry.
  const ownerCount=()=>assigned.filter(f=>f===owner.id).length;
  for(let i=0;i<assigned.length && castFactions.slice(1).some(f=>assigned.filter(id=>id===f.id).length>=ownerCount());i++)if(assigned[i] && assigned[i]!==owner.id)assigned[i]=owner.id;
  const roomName=i=>label(g,castRoles,i),climaxAt=shape.route.indexOf(shape.climax),usedRead=new Set(),rooms=[];
  for(let i=0;i<g.rooms.length;i++){
    const role=roles.get(castRoles[i]),faction=castFactions.find(f=>f.id===assigned[i])||owner;
    const values={faction:faction.name,sign:faction.sign,leader:faction.leader.charAt(0).toLowerCase()+faction.leader.slice(1).replace(/\.$/,''),goal:faction.goal};
    let read;
    for(let attempt=0;attempt<role.read.length*DETAILS.length+1;attempt++){
      read=fill(role.read[(i+attempt)%role.read.length],values)+' '+DETAILS[(i+attempt+Math.floor(rng()*DETAILS.length))%DETAILS.length];
      if(!usedRead.has(read))break;
    }
    if(usedRead.has(read))read=fill(role.read[0],values)+` A careful tally of ${i+1} cuts runs beside the threshold.`;
    usedRead.add(read);
    const at=shape.route.indexOf(i);let difficulty=role.encounter;
    if(difficulty!=='none' && at>=0 && at<=climaxAt) difficulty=at===climaxAt?'high':at/climaxAt<.4?'low':at/climaxAt<.8?'moderate':'high';
    const encounter=difficulty==='none'?null:{fam:faction.fam,difficulty,note:`${faction.name} hold ${roomName(i)}; use ${difficulty} opposition for a level ${o.level} party on floor ${o.depth+1}. ${faction.goal}`};
    rooms.push({role:role.id,faction:assigned[i],encounter,treasure:role.treasure,read,dm:sentence(fill(pick(role.dm,rng),values)),clue:null,beat:i===g.entry?'hook':i===shape.climax?'climax':at>0&&at<climaxAt?'rising':null});
  }
  let quiet=rooms.filter(r=>!r.encounter).length;
  for(const i of shuffled(g.rooms.map((_,i)=>i).filter(i=>i!==shape.climax && i!==g.entry),rng).sort((a,b)=>Number(onRoute.has(a))-Number(onRoute.has(b)))){
    if(quiet>=Math.ceil(rooms.length/4))break;
    if(rooms[i].encounter){rooms[i].encounter=null;rooms[i].dm+=' Resolve this room through evidence or negotiation, without a fight.';quiet++;}
  }
  const side=g.rooms.map((_,i)=>i).find(i=>!onRoute.has(i)) ?? g.entry;
  const values={owner:owner.name,rival:castFactions[1]?.name||owner.name,entry:roomName(g.entry),climax:roomName(shape.climax),side:roomName(side)};
  const hook=fill(pick(site.hooks,rng),values)+` The approach begins at ${roomName(g.entry)}.`;
  let twist=fill(pick(site.twists,rng),values);
  if(o.gaze>=7)twist+=` The Count has charged ${factions.get('tithe-court').name} with taking an account in ${roomName(shape.climax)} before anyone leaves.`;
  const aftermath=shape.route[climaxAt+1] ?? rooms.findIndex((r,i)=>r.role==='treasury' && i!==shape.climax);
  if(aftermath!==undefined && aftermath>=0 && aftermath!==g.entry)rooms[aftermath].beat='aftermath';
  else if(side!==g.entry)rooms[side].beat='aftermath';
  for(const room of rooms)if(room.beat)room.dm+=' '+fill(pick(BEATS[room.beat],rng),{...values,hook});
  const locks=chooseLocks(g,o,site,shape,castRoles,rng);
  for(const lock of locks){
    const i=g.index.get(lock.key.in);rooms[i].dm+=` ${lock.key.name}: ${lock.text} It opens the passage between ${roomName(g.index.get(lock.a))} and ${roomName(g.index.get(lock.b))}.`;delete lock.text;
  }
  const sources=[...new Set([...rooms.map((r,i)=>r.role==='clue'?i:-1).filter(i=>i>=0),...shape.route,...shape.publicPaths.queue,...g.rooms.map((_,i)=>i)])];
  const targets=[...locks.map(l=>({room:g.index.get(l.key.in),key:l.key.name})),{room:shape.climax},{room:side}];
  for(let n=0;n<Math.min(g.rooms.length,g.rooms.length>=8?3:2);n++){
    const source=sources[n],preferred=targets[n%targets.length],target=preferred.room!==source?preferred:targets.find(t=>t.room!==source)||{room:g.rooms.findIndex((_,i)=>i!==source)};
    rooms[source].clue={id:`site-clue-${n+1}`,text:target.key?`A rubbed copy of an inventory names ${roomName(target.room)} as the place where ${target.key} was kept.`:`A charcoal sketch names ${roomName(target.room)} and records the mark of ${owner.name} beside it.`,points:g.rooms[target.room].id};
  }
  const summary=`${site.name} is held by ${owner.name}. Their purpose: ${owner.goal} Enter through ${roomName(g.entry)}, follow the evidence towards ${roomName(shape.climax)}, and allow ${rooms.filter(r=>!r.encounter).length} quiet rooms to give the danger room to breathe. ${locks.length?`${locks.length} secured passages have access mechanisms placed before their gates.`:'The routes remain unsecured; the room graph offers no safe lock-and-key detour.'}`;
  return {seed:o.seed,kind:site.id,name:site.name,theme:o.theme,last:o.last,blurb:site.blurb,factions:castFactions,rooms:Object.fromEntries(g.rooms.map((r,i)=>[String(r.id),rooms[i]])),locks,route:shape.route.map(i=>g.rooms[i].id),loops:alternateRoutes(g,shape.route).map(path=>path.map(i=>g.rooms[i].id)),climax:g.rooms[shape.climax].id,twist,hook,summary,forPlayers:{name:site.name,hook}};
}

/** Validation is read-only and checks both single-lock reachability and a full
 * collect-keys/open-gates fixed point. A mutually dependent key cycle is invalid
 * even if each key is reachable when the other gates are assumed open.
 */
export function validateSite(floor,plan){
  let g;try{g=graph(floor);}catch(e){return [`Invalid floor: ${e.message}`];}
  const problems=[];if(!plan || typeof plan!=='object')return ['Missing site plan'];
  const issue=s=>problems.push(s),route=Array.isArray(plan.route)?plan.route:[],routeIndices=route.map(id=>g.index.get(id)),onRoute=new Set(routeIndices);
  const get=i=>Number.isInteger(i) && i>=0 && i<g.rooms.length && own(plan.rooms,String(g.rooms[i].id))?plan.rooms[String(g.rooms[i].id)]:null;
  if(!kinds.has(plan.kind))issue('Unknown site kind');
  if(typeof plan.last!=='boolean')issue('Missing last-floor flag');
  if(!route.length || route[0]!==g.rooms[g.entry].id || routeIndices.some(i=>i===undefined))issue('The route must start at the entry and contain existing rooms');
  if(new Set(route).size!==route.length)issue('The main route repeats a room');
  const climax=g.index.get(plan.climax);
  if(climax===undefined || climax===g.entry || !route.includes(plan.climax))issue('The climax must be a non-entry room on the route');
  const endpoint=plan.last||g.down===null?plan.climax:g.rooms[g.down].id;
  if(route.at(-1)!==endpoint)issue('The route has the wrong destination');
  const proposedSecrets=new Set(g.secrets),lockEdges=new Set(),lockInfo=[],keyIds=new Set();
  if(!Array.isArray(plan.locks))issue('Locks must be an array');
  for(const lock of Array.isArray(plan.locks)?plan.locks:[]){
    if(!lock || !g.index.has(lock.a)||!g.index.has(lock.b)){issue('A lock has missing endpoints');continue;}
    const a=g.index.get(lock.a),b=g.index.get(lock.b),e=g.edgeMap.get(pair(a,b));
    if(e===undefined || g.edges[e].kind==='open'){issue('A lock must be on a door or an existing secret');continue;}
    if(lockEdges.has(e))issue('More than one lock occupies the same passage');lockEdges.add(e);
    if(!['locked','sealed','secret'].includes(lock.kind))issue('Unknown lock kind');
    if(g.edges[e].kind==='secret' && lock.kind!=='secret')issue('An existing secret passage was changed');
    if(lock.kind==='secret')proposedSecrets.add(e);
    if((a===g.entry || b===g.entry) && g.adj[g.entry].length===1)issue('A lock closes the only way into the entry');
    const key=lock.key;
    if(!key || !nonempty(key.id)||!nonempty(key.name)||!g.index.has(key.in)||!['carried','hidden','puzzle'].includes(key.how)){issue('A lock needs a valid key or access mechanism');continue;}
    if(keyIds.has(key.id))issue('Access mechanism ids must be unique');keyIds.add(key.id);
    const room=g.index.get(key.in);
    if(search(g,g.entry,new Set([e])).distance[room]<0)issue(`Key ${key.id} is behind its own lock`);
    if(lock.kind==='sealed' && key.how!=='puzzle')issue('A sealed gate needs a puzzle mechanism');
    const aPos=route.indexOf(lock.a),bPos=route.indexOf(lock.b);
    if(aPos>=0 && bPos>=0 && Math.abs(aPos-bPos)===1 && onRoute.has(room))issue('A main-route key must provide an off-route detour');
    lockInfo.push({e,room,key:key.id});
  }
  for(const e of g.secrets)if(!lockEdges.has(e))issue('An existing secret passage has no access mechanism');
  if(!g.adj[g.entry].some(v=>!g.secrets.has(v.e)&&!lockEdges.has(v.e)))issue('All ordinary ways into the entry are secured');
  if(g.index.has(endpoint) && search(g,g.entry,proposedSecrets).distance[g.index.get(endpoint)]<0)issue('Secret passages are the only way to the destination');
  for(let i=1;i<routeIndices.length;i++){
    const e=g.edgeMap.get(pair(routeIndices[i-1],routeIndices[i]));
    if(e===undefined)issue('Consecutive route rooms are not linked');else if(proposedSecrets.has(e))issue('The main route uses a secret passage');
  }
  if(g.index.has(endpoint) && search(g,g.entry,g.secrets).distance[g.index.get(endpoint)]!==route.length-1)issue('The main route is not a shortest ordinary path');
  const blocked=new Set([...g.secrets,...lockEdges]);let progress=true;
  while(progress){progress=false;const seen=search(g,g.entry,blocked).distance;for(const l of lockInfo)if(blocked.has(l.e)&&seen[l.room]>=0){blocked.delete(l.e);progress=true;}}
  const reached=search(g,g.entry,blocked).distance;
  for(const l of lockInfo)if(blocked.has(l.e))issue(`Key dependency cycle or inaccessible mechanism: ${l.key}`);
  if(reached.some(d=>d<0))issue('Collecting reachable keys still leaves rooms inaccessible');
  const present=Array.isArray(plan.factions)?plan.factions:[],factionIds=new Set(present.map(f=>f?.id));
  if(present.length<1||present.length>3||factionIds.size!==present.length||present.some(f=>!f||!factions.has(f.id)))issue('The site needs one to three known, distinct factions');
  let quiet=0;const read=new Set(),clueIds=new Set(),counts=new Map();
  for(let i=0;i<g.rooms.length;i++){
    const room=get(i),id=g.rooms[i].id;
    if(!room || !roles.has(room.role)){issue(`Room ${id} has no known role`);continue;}
    if(!fits(room.role,g,i,onRoute))issue(`Room ${id} does not meet the needs of ${room.role}`);
    if(room.faction!==null && !factionIds.has(room.faction))issue(`Room ${id} has an unknown faction`);
    if(room.faction!==null)counts.set(room.faction,(counts.get(room.faction)||0)+1);
    if(room.encounter===null)quiet++;else if(!room.encounter || !Object.hasOwn(rank,room.encounter.difficulty)||!['barovia','dread','seep','bloom','andral','folk','srd'].includes(room.encounter.fam))issue(`Room ${id} has an invalid encounter`);
    if(!Number.isInteger(room.treasure)||room.treasure<0||room.treasure>3)issue(`Room ${id} has invalid treasure`);
    if(!nonempty(room.read)||!nonempty(room.dm))issue(`Room ${id} is missing text`);
    if(read.has(room.read))issue('A read-aloud repeats');read.add(room.read);
    if(room.beat!==null && !Object.hasOwn(BEATS,room.beat))issue(`Room ${id} has an unknown beat`);
    if(room.clue!==null){
      const c=room.clue;
      if(!c||!nonempty(c.id)||clueIds.has(c.id)||!nonempty(c.text)||!g.index.has(c.points)||c.points===id)issue(`Room ${id} has an invalid clue`);
      else {clueIds.add(c.id);const target=get(g.index.get(c.points));if(target && !c.text.includes(`(room ${String(c.points)})`))issue(`Room ${id}'s clue does not name its destination`);}
    }
  }
  if(plan.rooms && Object.keys(plan.rooms).some(id=>!g.rooms.some(r=>String(r.id)===id)))issue('The plan contains an unknown room');
  if(get(g.entry)?.role!=='entry' || get(g.entry)?.beat!=='hook')issue('The entry needs its entry role and hook beat');
  if(climax!==undefined){
    const c=get(climax);if(c?.role!==(plan.last?'boss':'lair')||c?.beat!=='climax'||c?.encounter?.difficulty!=='high')issue('The climax needs its role, beat and high encounter');
    const distances=search(g,g.entry).distance;
    if(plan.last && (g.rooms[climax].size<30||distances[climax]<Math.max(...distances)/2))issue('The boss room must be large enough and in the farther half of the site');
  }
  if(clueIds.size<2 || clueIds.size>3)issue('A site needs two or three actionable clues');
  if([...lockEdges].filter(e=>!g.secrets.has(e)).length>3)issue('A site adds at most three secured doors');
  if(quiet<Math.ceil(g.rooms.length/4))issue('Fewer than a quarter of the rooms are quiet');
  let previous=0;for(const i of routeIndices){if(i===undefined)continue;const difficulty=get(i)?.encounter?.difficulty;if(difficulty){if(rank[difficulty]<previous)issue('Route difficulty falls before the climax');previous=rank[difficulty];}if(i===climax)break;}
  if(present[0] && present.slice(1).some(f=>(counts.get(f?.id)||0)>=(counts.get(present[0].id)||0)))issue('The owner must hold more rooms than any other faction');
  for(const key of ['hook','twist','summary'])if(!nonempty(plan[key])||!present.some(f=>nonempty(f?.name)&&plan[key].includes(f.name)))issue(`${key} must name a faction`);
  if(!nonempty(plan.name) || !plan.forPlayers || plan.forPlayers.name!==plan.name || plan.forPlayers.hook!==plan.hook || Object.keys(plan.forPlayers).some(k=>!['name','hook'].includes(k)))issue('The pre-exploration summary must contain only the public name and hook');
  if(!Array.isArray(plan.loops))issue('Loops must be an array');
  else for(const loop of plan.loops){
    if(!Array.isArray(loop)||loop.length<2||new Set(loop).size!==loop.length||!route.includes(loop[0])||!route.includes(loop.at(-1))){issue('An alternate route must join two main-route rooms');continue;}
    if(loop.slice(1,-1).some(id=>route.includes(id)))issue('An alternate route rejoins the main route too early');
    for(let i=1;i<loop.length;i++)if(!g.index.has(loop[i-1])||!g.index.has(loop[i])||!g.edgeMap.has(pair(g.index.get(loop[i-1]),g.index.get(loop[i]))))issue('An alternate route has an invalid link');
  }
  return problems;
}

// The caller supplies only rooms actually revealed to this player. Do not send
// the authoritative plan, its seed, clue payloads or encounter recommendations.
export function forPlayers(plan,exploredRoomIds=[]){
  if(!Array.isArray(exploredRoomIds))throw new TypeError('Explored room ids must be an array');
  const out={name:plan.name,hook:plan.hook},seen=new Set(),rooms=[];
  for(const id of exploredRoomIds){if(typeof id!=='string' && !Number.isSafeInteger(id))continue;const key=String(id);if(!seen.has(key) && own(plan.rooms,key)){seen.add(key);rooms.push([key,{read:plan.rooms[key].read}]);}}
  if(rooms.length)out.rooms=Object.fromEntries(rooms);return out;
}
export function describeSite(plan){
  const lines=[`# ${plan.name}`,`Kind: ${plan.kind} · Theme: ${plan.theme}`,plan.blurb,'',`Hook: ${plan.hook}`,plan.summary,'','## Factions'];
  for(const [i,f] of plan.factions.entries())lines.push(`${i===0?'Owner':'Visitor'}: ${f.name} (${f.fam}; ${f.attitude})`,f.goal,`Sign: ${f.sign}`,`Leader: ${f.leader}`,`Relations: ${Object.entries(f.relations).map(([id,relation])=>`${relation} ${factions.get(id)?.name||id}`).join('; ')}`,'');
  lines.push('## Rooms');const order=[...new Set([...plan.route.map(String),...Object.keys(plan.rooms)])];
  for(const id of order){const r=plan.rooms[id];lines.push(`Room ${id} — ${roles.get(r.role)?.label||r.role}${r.beat?` [${r.beat}]`:''}`,`Read: ${r.read}`,`DM: ${r.dm}`,`Occupants: ${plan.factions.find(f=>f.id===r.faction)?.name||'Unclaimed'}; ${r.encounter?`${r.encounter.difficulty} ${r.encounter.fam} encounter`:'no fight'}; treasure ${r.treasure}.`);if(r.encounter)lines.push(r.encounter.note);if(r.clue)lines.push(`Clue ${r.clue.id}: ${r.clue.text} [points to room ${r.clue.points}]`);lines.push('');}
  lines.push('## Locks and access');if(!plan.locks.length)lines.push('No added locks fit this site.');
  for(const l of plan.locks)lines.push(`${l.a} ↔ ${l.b}: ${l.kind}; ${l.key.name} (${l.key.id}), ${l.key.how} in room ${l.key.in}.`);
  lines.push('',`Main route: ${plan.route.join(' → ')}`);for(const loop of plan.loops)lines.push(`Alternate route: ${loop.join(' → ')}`);
  lines.push('','## Twist',plan.twist);return lines.join('\n');
}
