import { test } from 'node:test';
import assert from 'node:assert/strict';
import { READ,PAGES,TRINKETS,SEARCH,GLINT,HOW_MANY } from '../src/data/finds.js';
import { placeFinds,noticed,outcome,signpost } from '../src/engine/finds.js';
const floor={W:40,H:40,kind:'village',open:Array.from({length:1600},(_,i)=>[i%40,Math.floor(i/40)]),path:Array.from({length:40},(_,i)=>[i,10]),rooms:[{x:0,y:0,w:6,h:6,name:'Arrival'}],props:[...['gravestone','statue','shrine','well','milestone','barrel','crate','house','hall','deadtree','gallows'].map((kind,i)=>({kind,x:i*3,y:12}))]};
const coord=p=>`${p.x},${p.y}`;
function freeze(v){ if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v; }
test('content counts, original distinct texts, valid lore threads and loot bounds',()=>{
  for(const [k,n] of Object.entries({gravestone:40,notice:30,shrine:15,carving:25,statue:8,well:8,milestone:8})){
    assert.ok(READ[k].length>=n);assert.equal(new Set(READ[k].map(r=>r.text)).size,READ[k].length);
  }
  for(const n of READ.notice) assert.ok(['village','vallaki','krezk','any'].includes(n.where));
  assert.ok(PAGES.length>=30);assert.equal(new Set(PAGES.map(p=>p.id)).size,PAGES.length);assert.equal(new Set(PAGES.map(p=>p.text)).size,PAGES.length);
  for(const p of PAGES){assert.ok(p.where.length);const sentences=p.text.match(/[.!?](?:\s|$)/g)||[];assert.ok(sentences.length>=2&&sentences.length<=4,p.id);}
  for(const thread of new Set(PAGES.map(p=>p.thread))){const ns=PAGES.filter(p=>p.thread===thread).map(p=>p.n).sort((a,b)=>a-b);assert.deepEqual(ns,ns.map((_,i)=>i+1));}
  assert.ok(TRINKETS.length>=30);assert.equal(new Set(TRINKETS.map(t=>t.n)).size,TRINKETS.length);for(const t of TRINKETS)assert.ok(t.gp>=0&&t.gp<=5);
  for(const kind of 'village town road woods church graveyard interior crypt castle camp'.split(' ')){
    assert.ok(GLINT[kind]);const h=HOW_MANY[kind];assert.ok(h.min>=0&&h.max>=h.min&&h.hidden<=h.max);
  }
  for(const table of [...Object.values(SEARCH),...Object.values(GLINT)])for(const o of table){assert.ok(o.w>0&&o.say);if(o.gp)assert.ok(Number.isInteger(o.gp)&&o.gp<=25);}
  for(const table of Object.values(SEARCH)){const total=table.reduce((s,o)=>s+o.w,0),nothing=table.filter(o=>!o.gp&&!o.page&&!o.trinket&&!o.potion).reduce((s,o)=>s+o.w,0);assert.ok(nothing>total/2);}
});
test('seeded placement is stable, seed changes glints, and taking finds never rerolls',()=>{
  const options={seed:'lantern'},a=placeFinds(floor,options);assert.deepEqual(a,placeFinds(floor,options));
  assert.notDeepEqual(a.filter(f=>f.kind==='glint'),placeFinds(floor,{seed:'raven'}).filter(f=>f.kind==='glint'));
  const taken=a.filter((_,i)=>i%2===0).map(f=>f.id);assert.deepEqual(placeFinds(floor,{...options,taken}),a.filter(f=>!taken.includes(f.id)));
  assert.deepEqual(placeFinds(floor,{...options,taken:a.map(f=>f.id)}),[]);assert.equal(new Set(a.map(f=>f.id)).size,a.length);
  const high=placeFinds(floor,{...options,gaze:10});assert.deepEqual(high.map(({dc,...f})=>f),a.map(({dc,...f})=>f));
});
test('one hundred seeds respect open cells, spacing, entry rooms, props and read anchors',()=>{
  const open=new Set(floor.open.map(p=>p.join(','))),path=new Set(floor.path.map(p=>p.join(','))),props=new Set(floor.props.map(coord));
  for(let seed=0;seed<100;seed++){
    const all=placeFinds(floor,{seed}),glints=all.filter(f=>f.kind==='glint'),reads=all.filter(f=>f.kind==='read');
    assert.ok(glints.length>=HOW_MANY.village.min&&glints.length<=HOW_MANY.village.max);
    assert.equal(new Set(reads.map(f=>f.text)).size,reads.length);
    for(const f of reads) assert.ok(floor.props.some(p=>p.kind===f.on&&Math.abs(f.x-p.x)+Math.abs(f.y-p.y)<=1));
    for(const kind of ['gravestone','statue','shrine','well','milestone'])assert.equal(reads.filter(f=>f.on===kind).length,1);
    for(const f of glints){assert.ok(open.has(coord(f))&&!path.has(coord(f))&&!props.has(coord(f)));assert.ok(!(f.x<6&&f.y<6));for(const g of glints)if(g!==f)assert.ok(Math.hypot(f.x-g.x,f.y-g.y)>=4);}
    for(const f of all){const out=outcome(f);assert.deepEqual(out,outcome(f));assert.ok(out.say&&Number.isInteger(out.gp)&&out.gp>=0&&out.gp<=25);if(out.page)assert.ok(out.page.where.includes(floor.kind));}
  }
});
test('visibility uses inclusive range and passive boundaries and gaze raises only hidden DC',()=>{
  const f={kind:'glint',hidden:true,dc:14};assert.equal(noticed(f,{dist:3,passive:30}),false);assert.equal(noticed(f,{dist:1,passive:13}),false);assert.ok(noticed(f,{dist:1,passive:14}));assert.ok(noticed(f,{dist:2,passive:14}));
  assert.ok(noticed({...f,hidden:false},{dist:6}));assert.equal(noticed({...f,hidden:false},{dist:6.1}),false);assert.equal(noticed(f,{dist:-1,passive:20}),false);
  for(const kind of ['read','search'])assert.ok(noticed({kind}));
  for(const gaze of [-1,1,5,10,99])for(const f of placeFinds(floor,{seed:4,gaze}))if(f.kind==='glint')assert.ok(f.hidden?f.dc>=12&&f.dc<=16:f.dc===0);
});
test('tiny, blocked, duplicate and exhausted maps terminate without illegal placement',()=>{
  assert.deepEqual(placeFinds(null),[]);assert.deepEqual(placeFinds({...floor,open:[],props:[]}),[]);
  const tiny={W:1,H:1,kind:'road',open:[[0,0],[0,0],[-1,0]],props:[]};assert.equal(placeFinds(tiny).length,1);
  assert.deepEqual(placeFinds({...tiny,path:[[0,0]]}),[]);
  const graves={...floor,props:Array.from({length:50},(_,i)=>({kind:'gravestone',x:i%40,y:Math.floor(i/40)}))};
  const reads=placeFinds(graves).filter(f=>f.kind==='read');assert.equal(reads.length,40);assert.equal(new Set(reads.map(f=>f.text)).size,40);
});
test('notices use location tags and stand on free adjacent squares',()=>{
  for(const place of ['vallaki','krezk']){
    const f={...floor,kind:'town',place,props:Array.from({length:20},(_,i)=>({kind:'house',x:i*2,y:20}))};
    const allowed=new Set(READ.notice.filter(t=>[place,'any'].includes(t.where)).map(t=>t.text));
    const reads=placeFinds(f,{seed:3}).filter(f=>f.kind==='read');assert.ok(reads.length);for(const r of reads){assert.ok(allowed.has(r.text));assert.ok(f.open.some(p=>p[0]===r.x&&p[1]===r.y));assert.ok(!f.props.some(p=>p.x===r.x&&p.y===r.y));}
  }
});
test('signposts preserve each compass direction and one line per route',()=>{
  const dirs=['n','ne','e','se','s','sw','w','nw'],arrows=['↑','↗','→','↘','↓','↙','←','↖'];
  const ways=dirs.map((dir,i)=>({to:'Place '+i,dir,hours:i})),lines=signpost('Vallaki',ways).split('\n');assert.equal(lines.length,8);
  lines.forEach((line,i)=>{assert.ok(line.startsWith(arrows[i]));assert.ok(line.includes(ways[i].to));});assert.equal(signpost('Vallaki',[]),'');
});
test('frozen inputs and independent rewards keep callers and catalogues untouched',()=>{
  const saved=JSON.stringify([READ,PAGES,TRINKETS,SEARCH,GLINT,HOW_MANY]);freeze(floor);
  const opts=freeze({seed:'fixed',taken:[]}),a=placeFinds(floor,opts);assert.deepEqual(a,JSON.parse(JSON.stringify(placeFinds(floor,opts))));
  const f={out:{say:'Found',trinket:{n:'pin',gp:1},page:{id:'p'}}};const o=outcome(f);o.trinket.n='changed';o.page.id='changed';assert.equal(f.out.trinket.n,'pin');assert.equal(f.out.page.id,'p');assert.equal(JSON.stringify([READ,PAGES,TRINKETS,SEARCH,GLINT,HOW_MANY]),saved);
});
