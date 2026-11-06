import test from 'node:test';
import assert from 'node:assert/strict';
import { planSite, validateSite, forPlayers, describeSite } from '../src/engine/sites.js';
import { SITE_KINDS, FACTIONS, ROLES, KEYS, BEATS, DETAILS } from '../src/data/sites.js';

const clone=s=>JSON.parse(JSON.stringify(s));
function freeze(o){if(o && typeof o==='object'){Object.freeze(o);for(const v of Object.values(o))freeze(v);}return o;}
const edgeKey=(a,b)=>[String(a),String(b)].sort().join('|');
function distances(f,start=f.up,blocked=new Set()){
  const result=new Map([[start,0]]),q=[start];
  for(let n=0;n<q.length;n++)for(const link of f.links){
    if(blocked.has(edgeKey(link.a,link.b)))continue;
    const next=link.a===q[n]?link.b:link.b===q[n]?link.a:undefined;
    if(next!==undefined && !result.has(next)){result.set(next,result.get(q[n])+1);q.push(next);}
  }
  return result;
}
function floorOf(n,pairs,seed=0){
  const shapes=[[3,4],[4,4],[5,4],[6,5],[7,6],[10,6]];
  const f={rooms:Array.from({length:n},(_,id)=>{const [w,h]=shapes[(id+seed)%shapes.length];return {id,x:id%5*12,y:Math.floor(id/5)*10,w,h,size:w*h,type:'chamber'};}),links:pairs.map(([a,b,kind='door'])=>({a,b,kind})),up:0,down:n-1};
  const d=distances(f),far=[...d].sort((a,b)=>b[1]-a[1])[0][0];Object.assign(f.rooms[far],{w:10,h:6,size:60});return f;
}
function randomFloor(seed){
  let state=seed>>>0;const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const pairs=[],used=new Set();
  const add=(a,b)=>{const key=edgeKey(a,b);if(a!==b&&!used.has(key)){used.add(key);pairs.push([a,b,rng()<.15?'open':'door']);}};
  for(let i=1;i<30;i++)add(i,Math.floor(rng()*i));
  for(let n=0;n<15;n++)add(Math.floor(rng()*30),Math.floor(rng()*30));
  return floorOf(30,pairs,seed%6);
}
function fixtures(){
  return [
    floorOf(5,[[0,1],[1,2],[2,3],[3,4]]),
    floorOf(8,[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]]),
    floorOf(12,[[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[5,7],[3,8],[8,9],[9,10],[4,11]]),
    floorOf(20,Array.from({length:20},(_,i)=>[...(i%5<4?[[i,i+1]]:[]),...(i<15?[[i,i+5]]:[])]).flat()),
    randomFloor(917),
  ];
}
function verify(f,p,last){
  assert.deepEqual(validateSite(f,p),[]);
  assert.deepEqual(clone(p),p);
  const allIds=new Set(f.rooms.map(r=>r.id)),degrees=new Map(f.rooms.map(r=>[r.id,f.links.filter(l=>l.a===r.id||l.b===r.id).length])),routeSet=new Set(p.route),d=distances(f);
  assert.equal(p.route[0],f.up);assert.equal(p.route.at(-1),last||f.down===null?p.climax:f.down);
  assert.equal(new Set(p.route).size,p.route.length);
  assert.equal(p.route.length-1,distances(f,f.up,new Set(f.links.filter(l=>l.kind==='secret').map(l=>edgeKey(l.a,l.b)))).get(p.route.at(-1)));
  for(let n=1;n<p.route.length;n++)assert.ok(f.links.some(l=>edgeKey(l.a,l.b)===edgeKey(p.route[n-1],p.route[n])));
  assert.equal(Object.keys(p.rooms).length,f.rooms.length);
  for(const room of f.rooms){
    const r=p.rooms[room.id],needs=ROLES.find(role=>role.id===r.role).needs;
    assert.ok(room.size>=(needs.minSize||1));
    if(needs.deadEnd)assert.equal(degrees.get(room.id),1);
    if(needs.minDoors)assert.ok(degrees.get(room.id)>=needs.minDoors);
    if(needs.offRoute)assert.ok(!routeSet.has(room.id));
    if(r.clue){assert.ok(allIds.has(r.clue.points));assert.notEqual(r.clue.points,room.id);assert.ok(r.clue.text.includes(`room ${r.clue.points}`));}
  }
  assert.equal(p.rooms[p.climax].role,last?'boss':'lair');assert.equal(p.rooms[p.climax].encounter.difficulty,'high');
  if(last){assert.ok(f.rooms.find(r=>r.id===p.climax).size>=30);assert.ok(d.get(p.climax)>=Math.max(...d.values())/2);}
  const reads=Object.values(p.rooms).map(r=>r.read);assert.equal(new Set(reads).size,reads.length);
  assert.ok(Object.values(p.rooms).filter(r=>r.encounter===null).length>=Math.ceil(f.rooms.length/4));
  let difficulty=0;for(const id of p.route){if(p.rooms[id].encounter){const n={low:1,moderate:2,high:3}[p.rooms[id].encounter.difficulty];assert.ok(n>=difficulty);difficulty=n;}if(id===p.climax)break;}
  const blocked=new Set(p.locks.map(l=>edgeKey(l.a,l.b)));
  assert.ok(f.links.some(l=>(l.a===f.up||l.b===f.up)&&l.kind!=='secret'&&!blocked.has(edgeKey(l.a,l.b))),'entry retains an ordinary unlocked way');
  for(const l of p.locks){
    const edge=f.links.find(e=>edgeKey(e.a,e.b)===edgeKey(l.a,l.b));assert.ok(edge);assert.notEqual(edge.kind,'open');
    assert.ok(distances(f,f.up,new Set([edgeKey(l.a,l.b)])).has(l.key.in),'key reachable with its own gate removed');
    const a=p.route.indexOf(l.a),b=p.route.indexOf(l.b);if(a>=0&&b>=0&&Math.abs(a-b)===1)assert.ok(!routeSet.has(l.key.in));
  }
  // Independent play-through: acquire only keys available before opening each gate.
  let changed=true;
  while(changed){changed=false;const reached=distances(f,f.up,blocked);for(const l of p.locks)if(blocked.has(edgeKey(l.a,l.b))&&reached.has(l.key.in)){blocked.delete(edgeKey(l.a,l.b));changed=true;}}
  assert.equal(blocked.size,0,'no mutually locked keys');assert.equal(distances(f,f.up,blocked).size,f.rooms.length);
  const hidden=new Set([...f.links.filter(l=>l.kind==='secret'),...p.locks.filter(l=>l.kind==='secret')].map(l=>edgeKey(l.a,l.b)));
  assert.ok(distances(f,f.up,hidden).has(last||f.down===null?p.climax:f.down),'secrets are optional');
  const claims=p.factions.map(faction=>Object.values(p.rooms).filter(r=>r.faction===faction.id).length);assert.ok(claims.slice(1).every(n=>claims[0]>n));
  for(const field of ['summary','twist','hook']){assert.ok(p[field]);assert.ok(p.factions.some(f=>p[field].includes(f.name)));assert.ok(/room [^)]+\)/.test(p[field]));assert.ok(!/\{\w+\}/.test(p[field]));}
  for(const r of Object.values(p.rooms)){assert.ok(!/\{\w+\}/.test(r.read+r.dm));}
  for(const loop of p.loops){assert.ok(routeSet.has(loop[0])&&routeSet.has(loop.at(-1)));assert.ok(loop.slice(1,-1).every(id=>!routeSet.has(id)));for(let i=1;i<loop.length;i++)assert.ok(f.links.some(l=>edgeKey(l.a,l.b)===edgeKey(loop[i-1],loop[i])));}
}
for(const kind of SITE_KINDS)test(`${kind.id}: five graph shapes, eight seeds, ordinary and final floors`,()=>{
  for(const f of fixtures())for(let seed=0;seed<8;seed++)for(const last of [false,true]){
    const opts={seed:`site-${seed}`,kind:kind.id,last,gaze:seed%2?9:1,level:1+seed,depth:seed},before=clone(f),optionsBefore=clone(opts);
    const p=planSite(freeze(f),freeze(opts));assert.deepEqual(f,before);assert.deepEqual(opts,optionsBefore);
    assert.deepEqual(planSite(f,opts),p);verify(f,p,last);
  }
});
test('catalogue references, minimum content, family vocabulary and supported themes',()=>{
  assert.ok(SITE_KINDS.length>=10 && FACTIONS.length>=10);assert.equal(new Set(SITE_KINDS.map(s=>s.id)).size,SITE_KINDS.length);
  assert.equal(new Set(FACTIONS.map(s=>s.id)).size,FACTIONS.length);assert.equal(new Set(ROLES.map(s=>s.id)).size,ROLES.length);assert.equal(new Set(KEYS.map(s=>s.id)).size,KEYS.length);
  const fids=new Set(FACTIONS.map(f=>f.id)),rids=new Set(ROLES.map(r=>r.id)),kids=new Set(KEYS.map(k=>k.id));
  for(const s of SITE_KINDS){assert.ok(s.name&&s.blurb&&s.themes.length&&s.keys.length&&s.factions.length);assert.ok(s.hooks.length>=3&&s.twists.length>=3);assert.ok(s.factions.every(id=>fids.has(id)));assert.ok(s.keys.every(id=>kids.has(id)));assert.ok(Object.entries(s.roles).every(([id,n])=>rids.has(id)&&n>0));}
  for(const f of FACTIONS){assert.ok(['barovia','dread','seep','bloom','andral','folk','srd'].includes(f.fam));assert.ok(['hostile','wary','bargain','desperate'].includes(f.attitude));assert.ok(f.name&&f.goal&&f.sign&&f.leader);for(const [id,relation]of Object.entries(f.relations)){assert.ok(fids.has(id));assert.ok(['hates','fears','serves','trades'].includes(relation));}}
  for(const r of ROLES){assert.ok(r.read.length>=2&&r.dm.length>=2);assert.ok(r.needs);assert.ok(['none','low','moderate','high'].includes(r.encounter));assert.ok(r.treasure>=0&&r.treasure<=3);}
  for(const id of ['entry','guardpost','barracks','lair','boss','shrine','treasury','trap','puzzle','prison','library','workshop','larder','rest','clue','vista','empty'])assert.ok(rids.has(id));
  for(const k of KEYS){assert.ok(['door','secret','gate'].includes(k.opens));assert.ok(['carried','hidden','puzzle'].includes(k.where));assert.ok(k.name&&k.text);}
  assert.deepEqual(Object.keys(BEATS),['hook','rising','climax','aftermath']);assert.ok(DETAILS.length>=30);
  for(const theme of ['undercroft','silver','hands','undertow','chapel','ossuary','womb','manor','wreck','mill','castle','burned','cellar','dungeon']){
    const p=planSite(fixtures()[2],{theme,seed:theme});assert.ok(SITE_KINDS.find(s=>s.id===p.kind).themes.includes(theme));
  }
});
test('low Gaze stays varied, high Gaze brings the Count, treasuries prefer dead ends',()=>{
  let low=0,high=0,total=0,treasuries=0,deadTreasuries=0;
  for(const kind of SITE_KINDS)for(let seed=0;seed<20;seed++){
    const f=fixtures()[2],opts={kind:kind.id,seed:`gaze-${seed}`},a=planSite(f,{...opts,gaze:1}),b=planSite(f,{...opts,gaze:9});total++;
    low+=Number(a.factions.some(f=>['barovia','dread'].includes(f.fam)));high+=Number(b.factions.some(f=>['barovia','dread'].includes(f.fam)));
    assert.ok(b.factions.some(f=>f.id==='tithe-court'));assert.ok(b.twist.includes('The Count'));
    for(const room of f.rooms)if(a.rooms[room.id].role==='treasury'){treasuries++;deadTreasuries+=Number(f.links.filter(l=>l.a===room.id||l.b===room.id).length===1);}
  }
  assert.ok(low/total<.5,`low ${low}/${total}`);assert.ok(high/total>=.8);assert.ok(treasuries>0);assert.ok(deadTreasuries/treasuries>.5);
});
test('ordinary route, bottleneck guard, safe side refuge, early clue and aftermath have distinct jobs',()=>{
  const f=fixtures()[2],p=planSite(f,{seed:'pacing',kind:'smuggler-cellar'}),at=p.route.indexOf(p.climax),rest=Object.entries(p.rooms).find(([,r])=>r.role==='rest');
  assert.ok(rest);assert.ok(!p.route.includes(Number(rest[0])));assert.equal(rest[1].encounter,null);
  assert.equal(p.rooms[p.route[at-1]].role,'guardpost');assert.ok(p.route.slice(0,at).some(id=>p.rooms[id].clue));
  assert.ok(Object.values(p.rooms).some(r=>r.beat==='aftermath'));
  assert.ok(p.locks.length>=1&&p.locks.length<=3);
});
test('loops are real alternate routes; existing secrets stay secret; open passages cannot be locked',()=>{
  const f=fixtures()[1];f.down=4;
  const p=planSite(f,{seed:'ring'});assert.ok(p.loops.length);verify(f,p,false);
  const s=fixtures()[2];s.links.push({a:6,b:9,kind:'secret'});s.links[1].kind='open';
  const before=clone(s),q=planSite(freeze(s),{seed:'secret',last:false});assert.deepEqual(s,before);verify(s,q,false);
  const old=q.locks.find(l=>edgeKey(l.a,l.b)===edgeKey(6,9));assert.equal(old.kind,'secret');
  assert.ok(!q.locks.some(l=>edgeKey(l.a,l.b)===edgeKey(s.links[1].a,s.links[1].b)));
  // A secret spur is optional, but still gets a reachable discovery mechanism.
  const spur=fixtures()[2];spur.links.find(l=>l.b===7).kind='secret';verify(spur,planSite(spur,{seed:'secret-spur'}),false);
});
test('the validator rejects individually safe but mutually dependent key chains',()=>{
  const f=floorOf(7,[[0,1],[1,2],[2,3],[1,4],[4,5],[1,6]]),p=planSite(f,{seed:'cycle'});
  p.locks=[
    {a:1,b:2,kind:'locked',key:{id:'a',name:'Key A',in:5,how:'hidden'}},
    {a:1,b:4,kind:'locked',key:{id:'b',name:'Key B',in:3,how:'hidden'}},
  ];
  for(const l of p.locks)assert.ok(distances(f,f.up,new Set([edgeKey(l.a,l.b)])).has(l.key.in));
  assert.ok(validateSite(f,p).some(s=>s.includes('cycle')));
  const ownLock=clone(p);ownLock.locks[0].key.in=3;assert.ok(validateSite(f,ownLock).some(s=>s.includes('own lock')));
});
test('validator finds corrupted roles, routes, access, pacing, text and plan structure',()=>{
  const f=fixtures()[2],original=planSite(f,{seed:'validate',last:true});
  const mutations=[
    p=>{delete p.rooms[1];},p=>{p.rooms[0].role='boss';},p=>{p.rooms[2].role='unknown';},
    p=>{p.climax=999;},p=>{p.route=[p.route[1],p.route[0]];},p=>{p.route.push(p.route[0]);},
    p=>{p.rooms[0].read=p.rooms[1].read;},p=>{p.rooms[1].clue={id:'bad',text:'Nowhere',points:999};},
    p=>{p.rooms[0].encounter={fam:'unknown',difficulty:'impossible'};},p=>{p.rooms[0].treasure=4;},
    p=>{p.factions=[];},p=>{p.factions=[null];},p=>{p.rooms[1].faction='unknown';},p=>{p.summary='';},
    p=>{p.forPlayers.twist=p.twist;},p=>{p.loops=[[0,999]];},p=>{p.locks.push({a:0,b:1,kind:'locked',key:{id:'x',name:'X',in:0,how:'hidden'}});},
    p=>{p.locks.push({a:0,b:999,kind:'locked'});},p=>{p.rooms[0].beat='unknown';},
    p=>{p.rooms[1].role='treasury';},p=>{for(const r of Object.values(p.rooms))r.clue=null;},
    p=>{p.rooms[0].encounter={fam:'folk',difficulty:'high'};p.rooms[p.route[1]].encounter={fam:'folk',difficulty:'low'};},
  ];
  for(const mutate of mutations){const p=clone(original);mutate(p);assert.ok(validateSite(f,freeze(p)).length,mutate.toString());}
  assert.ok(validateSite(f,null).length);assert.ok(validateSite(null,original).length);
  const s=fixtures()[2];s.links[0].kind='open';const q=planSite(s);q.locks.push({a:0,b:1,kind:'locked',key:{id:'bad',name:'Bad',in:0,how:'hidden'}});assert.ok(validateSite(s,q).some(e=>e.includes('door')));
});
test('public views are explicit allowlists and independent copies, even with hostile room ids',()=>{
  const f=fixtures()[2],p=planSite(f,{seed:'private'}),before=clone(p);
  p.internalSecret='do not send';p.rooms[0].unannouncedTrap='private';
  const initial=forPlayers(freeze(p));assert.deepEqual(initial,{name:p.name,hook:p.hook});
  const v=forPlayers(p,[0,2,2,999]);assert.deepEqual(Object.keys(v).sort(),['hook','name','rooms']);assert.deepEqual(Object.keys(v.rooms),['0','2']);
  for(const id of [0,2])assert.deepEqual(v.rooms[id],{read:p.rooms[id].read});
  const encoded=JSON.stringify(v);for(const key of ['dm','twist','locks','key','encounter','seed','clue','internalSecret','unannouncedTrap'])assert.ok(!encoded.includes(`"${key}":`));
  v.rooms[0].read='changed';assert.equal(p.rooms[0].read,before.rooms[0].read);
  assert.throws(()=>forPlayers(p,'all'),TypeError);
  const ids=['__proto__','constructor','toString','door','end'],line=fixtures()[0];
  line.rooms.forEach((r,i)=>r.id=ids[i]);line.links.forEach(l=>{l.a=ids[l.a];l.b=ids[l.b];});line.up=ids[0];line.down=ids[4];
  const plan=planSite(line,{seed:'strange-ids'});assert.deepEqual(validateSite(line,plan),[]);assert.deepEqual(clone(plan),plan);
  const visible=forPlayers(plan,['__proto__']);assert.ok(Object.hasOwn(visible.rooms,'__proto__'));assert.equal(Object.getPrototypeOf(visible.rooms),Object.prototype);
});
test('DM page contains all rooms once in route order, all keys, clues and factions',()=>{
  const f=fixtures()[2],p=freeze(planSite(f,{seed:'print'})),page=describeSite(p);assert.equal(typeof page,'string');
  assert.ok(page.includes(p.name)&&page.includes(p.kind)&&page.includes(p.twist));
  for(const r of f.rooms)assert.equal(page.split(`Room ${r.id} — `).length-1,1);
  let at=-1;for(const id of p.route){const next=page.indexOf(`Room ${id} — `);assert.ok(next>at);at=next;}
  for(const f of p.factions)assert.ok(page.includes(f.name)&&page.includes(f.goal)&&page.includes(f.leader));
  for(const l of p.locks)assert.ok(page.includes(l.key.id)&&page.includes(`in room ${l.key.in}`));
  for(const r of Object.values(p.rooms))if(r.clue)assert.ok(page.includes(r.clue.text));
});
test('null stairs and terminal floors work; impossible layouts and malformed inputs fail clearly',()=>{
  const f=fixtures()[2];f.up=null;f.rooms[0].type='entrance';f.down=null;
  const p=planSite(f,{last:true});assert.equal(p.route[0],0);assert.equal(p.route.at(-1),p.climax);assert.deepEqual(validateSite(f,p),[]);
  const tight=fixtures()[0];for(const r of tight.rooms)Object.assign(r,{w:3,h:4,size:12});assert.throws(()=>planSite(tight,{last:true}),/boss/);
  const near=fixtures()[0];for(const r of near.rooms)Object.assign(r,{w:3,h:4,size:12});Object.assign(near.rooms[1],{w:10,h:6,size:60});assert.throws(()=>planSite(near,{last:true}),/boss/);
  const secret=fixtures()[0];secret.links[2].kind='secret';assert.throws(()=>planSite(secret),/secret/);
  const bad=[null,{rooms:[],links:[]}, {...fixtures()[0],up:999}, {...fixtures()[0],down:0}, {...fixtures()[0],links:[]}];
  for(const input of bad)assert.throws(()=>planSite(input));
  const duplicate=fixtures()[0];duplicate.rooms[1].id='0';assert.throws(()=>planSite(duplicate),/ids/);
  const parallel=fixtures()[0];parallel.links.push({...parallel.links[0],kind:'open'});assert.throws(()=>planSite(parallel),/Parallel/);
  const geometry=fixtures()[0];geometry.rooms[0].size=60;assert.throws(()=>planSite(geometry),/geometry/);
  for(const opts of [{seed:7},{gaze:0},{gaze:11},{level:0},{level:21},{depth:-1},{last:1},{kind:'missing'},{theme:''}])assert.throws(()=>planSite(fixtures()[0],opts),RangeError);
});
test('determinism, isolation, no ambient randomness, Unicode seeds and option effects',()=>{
  const f=fixtures()[2],rng=Math.random;Math.random=()=>{throw new Error('ambient random');};let a,b;
  try{a=planSite(f,{seed:'🙂',kind:'seep-mine',depth:4,level:12});b=planSite(f,{seed:'🙃',kind:'seep-mine'});assert.deepEqual(a,planSite(f,{seed:'🙂',kind:'seep-mine',depth:4,level:12}));}finally{Math.random=rng;}
  assert.notDeepEqual(a.rooms,b.rooms);assert.ok(Object.values(a.rooms).filter(r=>r.encounter).every(r=>r.encounter.note.includes('level 12')&&r.encounter.note.includes('floor 5')));
  const c=planSite(f,{seed:'same'});c.factions[0].relations.changed='hates';c.rooms[0].read='changed';c.locks.length=0;
  const d=planSite(f,{seed:'same'});assert.notEqual(d.rooms[0].read,'changed');assert.ok(!('changed' in d.factions[0].relations));assert.ok(!FACTIONS.some(f=>'changed' in f.relations));
});
test('sixty additional random graphs exercise locks, loops and final-room selection',()=>{
  for(let seed=0;seed<60;seed++){
    const f=randomFloor(seed),p=planSite(f,{seed:`graph-${seed}`,last:seed%2===0,gaze:1+seed%10,kind:SITE_KINDS[seed%SITE_KINDS.length].id});verify(f,p,seed%2===0);
  }
});
test('30-room planning stays under the slow-machine allowance',()=>{
  const f=randomFloor(2026);planSite(f,{seed:'warm'});const start=performance.now();const p=planSite(f,{seed:'timed',last:true,gaze:9});
  assert.ok(performance.now()-start<200);assert.deepEqual(validateSite(f,p),[]);
});

test('a valid dependency chain unlocks in order, while arbitrary cycles cannot',()=>{
  const f=floorOf(7,[[0,1],[1,2],[2,3],[3,4],[1,5],[3,6]]);f.down=4;
  const p=planSite(f,{seed:'ordered-keys'});
  p.locks=[
    {a:1,b:2,kind:'locked',key:{id:'outer',name:'Outer key',in:5,how:'hidden'}},
    {a:3,b:4,kind:'locked',key:{id:'inner',name:'Inner key',in:6,how:'hidden'}},
  ];
  assert.ok(!distances(f,0,new Set([edgeKey(1,2),edgeKey(3,4)])).has(6));
  assert.deepEqual(validateSite(f,p),[]);verify(f,p,false);
  const bad=clone(p);bad.locks[0].key.in=6;assert.ok(validateSite(f,bad).some(s=>s.includes('cycle')||s.includes('own lock')));
});
test('secret chords and side branches retain safe access across many graph shapes',()=>{
  for(let seed=0;seed<80;seed++){
    const f=randomFloor(1000+seed);
    // Tree edges are left ordinary; the later chords may all be secret.
    for(let i=29;i<f.links.length;i++)if(i%2===0)f.links[i].kind='secret';
    const p=planSite(f,{seed:`hidden-${seed}`,last:seed%2===0,gaze:9});verify(f,p,seed%2===0);
    for(const link of f.links.filter(l=>l.kind==='secret'))assert.equal(p.locks.find(l=>edgeKey(l.a,l.b)===edgeKey(link.a,link.b)).kind,'secret');
  }
});
test('tiny floors and all-open floors omit impossible extras without compromising their main plan',()=>{
  const two=floorOf(2,[[0,1]]),p=planSite(two,{last:true});assert.deepEqual(validateSite(two,p),[]);assert.equal(p.locks.length,0);assert.equal(p.rooms[0].role,'entry');
  const open=fixtures()[3];for(const link of open.links)link.kind='open';const q=planSite(open,{seed:'arches'});verify(open,q,false);assert.equal(q.locks.length,0);
  const line=fixtures()[0],r=planSite(line,{seed:'no-detour'});assert.equal(r.locks.length,0);assert.ok(!Object.values(r.rooms).some(r=>r.role==='rest'));
});
test('planner handles a large repeated-role floor without duplicate read-alouds or catalogue mutation',()=>{
  const before=clone({SITE_KINDS,FACTIONS,ROLES,KEYS,BEATS,DETAILS});
  const pairs=Array.from({length:99},(_,i)=>[Math.floor(i/2),i+1]);const f=floorOf(100,pairs),p=planSite(f,{seed:'large',kind:'wolf-ruins',last:true});
  assert.deepEqual(validateSite(f,p),[]);assert.equal(new Set(Object.values(p.rooms).map(r=>r.read)).size,100);
  assert.deepEqual({SITE_KINDS,FACTIONS,ROLES,KEYS,BEATS,DETAILS},before);
});

test('a mostly secret side wing still receives three valid clues and reachable mechanisms',()=>{
  const f=floorOf(8,[[0,1],[1,2,'secret'],[2,3],[3,4],[4,5],[5,6],[6,7]]);f.down=1;
  Object.assign(f.rooms[1],{w:6,h:5,size:30});
  for(const kind of SITE_KINDS){const p=planSite(f,{kind:kind.id,seed:'hidden-wing'});verify(f,p,false);assert.equal(Object.values(p.rooms).filter(r=>r.clue).length,3);}
});
