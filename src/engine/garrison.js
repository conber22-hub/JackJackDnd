/* Pure DM-side proposals. stock retains graph/factions for raise and calm.
   Supply current door states on graph.doors or links[].state and faction.keys
   (door IDs or site key IDs). hpFraction is the group's current fraction alive. */
import { buildEncounter,xpOf } from './encounter.js';
import { POSTURES,ROLE_POSTURES,NOISE_COST,ATTITUDES,LINES } from '../data/garrison.js';
const copy=v=>structuredClone(v);
const alive=g=>(g.hpFraction ?? 1)>0 && g.members.some(m=>m.n>0);
const faction=(s,id)=>(s.factions || []).find(f=>f.id===id);
function relation(s,a,b){
 if(a && a===b) return 'ally';
 const x=faction(s,a)?.relations?.[b],y=faction(s,b)?.relations?.[a];
 if(x==='hates' || y==='hates') return 'hates';
 return [x,y].some(v=>['ally','allied','trades','serves'].includes(v))?'ally':'neutral';
}
function blocked(link,graph,f){
 const doors=(link.doors || []).map(id=>(graph.doors || []).find(d=>d.id===id)).filter(Boolean);
 return link.locked===true || ['locked','sealed'].includes(link.state) || doors.some(d=>d.state==='locked' || d.state==='sealed') ?
  !(link.key && f?.keys?.includes(link.key) || (link.doors || []).length && link.doors.every(id=>f?.keys?.includes(id) || doors.find(d=>d.id===id)?.state==='open')) : false;
}
function paths(graph,start,f,noise=false){
 const dist=new Map([[start,0]]),prev=new Map(),done=new Set();
 while(true){let room,best=Infinity;for(const [id,d] of dist) if(!done.has(id) && d<best){best=d;room=id;}if(best===Infinity) break;done.add(room);
  for(const l of graph.links || []){const to=l.a===room?l.b:l.b===room?l.a:undefined;if(to===undefined) continue;
   if(!noise && blocked(l,graph,f)) continue;
   const state=l.state || ((l.doors || []).every(id=>(graph.doors || []).some(d=>d.id===id && d.state==='open')) && l.doors?.length?'open':null);
   const cost=noise?NOISE_COST[state==='open'?'open':l.kind==='secret'?'secret':l.kind] ?? 1:1;
   if(best+cost<(dist.get(to) ?? Infinity)){dist.set(to,best+cost);prev.set(to,room);}
  }
 }
 return {dist,path(to){if(!dist.has(to)) return null;const a=[to];while(a[0]!==start)a.unshift(prev.get(a[0]));return a;}};
}
export function stock(site,graph,{list,levels,gaze=1,rng}={}){
 if(typeof rng!=='function') throw new TypeError('Supply rng.');
 const groups=[];
 for(const r of graph.rooms){const p=site.rooms?.[String(r.id)];if(!p?.encounter) continue;
  const e=buildEncounter(list,{levels,gaze,...p.encounter,rng}),options=ROLE_POSTURES[p.role] || (site.route?.includes(r.id)?['guard','patrol']:['guard']);
  if(p.role==='boss'){const bosses=list.filter(b=>b.fam===p.encounter.fam && b.tags?.includes('boss') && xpOf(b)>0 && xpOf(b)<=e.budget);if(bosses.length){const b=bosses[Math.floor(rng()*bosses.length)];e.group=[{bid:b.id,n:1}];e.xp=xpOf(b);}}
  const posture=options[Math.floor(rng()*options.length)],attitude=ATTITUDES[(site.factions || []).find(f=>f.id===p.faction)?.attitude] || ATTITUDES.wary;
  groups.push({id:`garrison-${r.id}`,room:r.id,post:r.id,faction:p.faction,members:e.group.map(m=>({b:m.bid ?? m.b,n:m.n})),posture,homePosture:posture,alert:0,hpFraction:1,budget:e.budget,xp:e.xp,keys:copy((site.factions || []).find(f=>f.id===p.faction)?.keys || []),orders:{hold:r.id,flee:attitude.flee,call:[]}});
 }
 const out={groups,graph:copy(graph),factions:copy(site.factions || []),alert:{},round:0,moves:[]};
 for(const g of groups) g.orders.call=groups.filter(h=>h.id!==g.id && relation(out,g.faction,h.faction)==='ally').map(h=>h.room);
 return out;
}
export function patrol(groups,graph,{hour=0,rng}={}){
 return groups.filter(g=>g.posture==='patrol' && alive(g)).map(g=>{
  const route=[g.room],neighbours=(graph.links || []).filter(l=>(l.a===g.room || l.b===g.room) && !blocked(l,graph,{keys:g.keys || []}));
  if(neighbours.length){const l=neighbours[Math.floor(rng()*neighbours.length)],to=l.a===g.room?l.b:l.a;route.push(to,g.room);}
  return {group:g.id,hour,rooms:route,quarters:Array.from({length:4},(_,i)=>({minute:i*15,room:route[i%(route.length>1?route.length-1:1)]}))};
 });
}
function settle(s,round){
 for(const m of s.messages || []) if(!m.delivered && m.arrives<=round){for(const g of s.groups.filter(g=>g.room===m.to)){g.alert=Math.max(g.alert,2);if(g.posture==='sleep')g.posture='guard';}m.delivered=true;}
 for(const g of s.groups){if(g.pending && g.pending.arrives<=round){g.room=g.pending.to;delete g.pending;}if(g.wakeAt!=null && g.wakeAt<=round){g.alert=Math.max(g.alert,g.heardAlert);g.posture='guard';delete g.wakeAt;delete g.heardAlert;}}
 s.round=round;
}
export function raise(state,{room,loud=0,round=state.round || 0}){
 if(!state.graph) throw new TypeError('Retain stock.graph on the garrison state.');
 if(!Number.isFinite(loud) || loud<0 || round<(state.round || 0)) throw new RangeError('Invalid noise or round.');
 const s=copy(state);s.moves=[];settle(s,round);if(loud>0)s.quietMinutes=0;
 const heard=paths(s.graph,room,null,true),source=s.groups.find(g=>g.room===room && alive(g));
 for(const [id,d] of heard.dist){const n=Math.min(3,Math.max(0,Math.floor(loud-d)));s.alert[id]=Math.max(s.alert[id] || 0,n);}
 const move=(g,to,why,kind='group')=>{
  const p=paths(s.graph,g.room,faction(s,g.faction)).path(to);if(!p || p.length<2) return;
  const m={group:g.id,from:g.room,to,arrives:round+p.length-1,why,kind,path:p};s.moves.push(m);if(kind==='group')g.pending=m;else (s.messages ||= []).push({...m,delivered:false});
 };
 for(const g of s.groups){
  if(!alive(g)) continue;
  const strength=members=>members.reduce((n,m)=>n+m.n,0);
  if(g.hpFraction<=g.orders.flee){
   const friendly=s.groups.filter(h=>h.faction===g.faction && alive(h)).sort((a,b)=>(b.xp || strength(b.members))*(b.hpFraction ?? 1)-(a.xp || strength(a.members))*(a.hpFraction ?? 1));
   const home=friendly.find(h=>paths(s.graph,g.room,faction(s,g.faction)).dist.has(h.post));if(home && !g.pending) move(g,home.post,LINES.flee);continue;
  }
  const noise=loud-(heard.dist.get(g.room) ?? Infinity)+(POSTURES[g.posture]?.hearing || 0),level=loud>0?Math.min(3,Math.max(0,Math.floor(noise))):0;
  if(g.posture==='sleep' && level>0){g.wakeAt ??=round+POSTURES.sleep.delay;g.heardAlert=Math.max(g.heardAlert || 0,level);continue;}
  g.alert=Math.max(g.alert,level);if(g.alert<2 || g.pending) continue;
  if(source && relation(s,g.faction,source.faction)==='hates'){g.reaction='ambush-winner';s.moves.push({group:g.id,from:g.room,to:g.room,arrives:round,why:LINES.rival,kind:'wait'});continue;}
  if(g.posture==='guard' && level>=2 && g.runnerSent!==true){
   const p=paths(s.graph,g.room,faction(s,g.faction)),friend=s.groups.filter(h=>h.id!==g.id && alive(h) && relation(s,g.faction,h.faction)==='ally' && p.dist.has(h.room)).sort((a,b)=>p.dist.get(a.room)-p.dist.get(b.room))[0];
   if(friend){move(g,friend.room,LINES.runner,'runner');g.runnerSent=true;}
  }
  const attitude=ATTITUDES[faction(s,g.faction)?.attitude] || ATTITUDES.wary;
  if(source && g.id!==source.id && relation(s,g.faction,source.faction)==='ally' && attitude.help) move(g,room,LINES.help);
 }
 return s;
}
export function calm(state,minutes){
 if(!Number.isFinite(minutes) || minutes<0) throw new RangeError('Minutes must be non-negative.');
 const s=copy(state);s.moves=[];settle(s,(s.round || 0)+minutes*10);
 const before=s.quietMinutes || 0;s.quietMinutes=before+minutes;const drops=Math.floor(s.quietMinutes/10)-Math.floor(before/10);
 for(const id of Object.keys(s.alert)) s.alert[id]=Math.max(0,s.alert[id]-drops);
 for(const g of s.groups){
  const was=g.room!==g.post || g.alert>0 || g.pending || g.reaction || g.wakeAt!=null;g.alert=Math.max(0,g.alert-drops);
  if(was){g.waryFor=60;delete g.wakeAt;delete g.heardAlert;g.posture='guard';}
  else g.waryFor=Math.max(0,(g.waryFor || 0)-minutes);
  if(!g.alert && was){
   const p=paths(s.graph,g.room,faction(s,g.faction)).path(g.post);
   if(p && g.room!==g.post){s.moves.push({group:g.id,from:g.room,to:g.post,arrives:s.round,why:LINES.home,path:p});g.room=g.post;delete g.pending;}
   else delete g.pending;
   delete g.reaction;delete g.runnerSent;
  }
  if(!g.waryFor && !g.alert) g.posture=g.homePosture || 'guard';
 }
 return s;
}
