import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { interior, validateLayout, KINDS } from '../src/engine/interiors.js';
import { ROOMS, FOOTPRINTS, WALL_PIECES } from '../src/data/interiors.js';

const copy=x=>JSON.parse(JSON.stringify(x));
const roomHas=(room,x,y)=>x>=room[0]&&y>=room[1]&&x<room[0]+room[2]&&y<room[1]+room[3];
const occupied=(layout,x,y)=>layout.rooms.some(r=>roomHas(r,x,y))||layout.paths.some(p=>{
  for(let i=0;i+3<p.pts.length;i+=2){const [x0,y0,x1,y1]=p.pts.slice(i,i+4);if(x0===x1&&x===x0&&y>=Math.min(y0,y1)&&y<=Math.max(y0,y1))return true;
    if(y0===y1&&y===y0&&x>=Math.min(x0,x1)&&x<=Math.max(x0,x1))return true;
  }return false;
});
const propCells=([kind,x,y,rot])=>{const [w,h]=FOOTPRINTS[kind],fw=rot%2?h:w,fh=rot%2?w:h;return Array.from({length:fw*fh},(_,i)=>[x+i%fw,y+Math.floor(i/fw)]);};
const wallSide=(p)=>{
  const [kind,x,y,rot]=p,coords=propCells(p),w=Math.max(...coords.map(c=>c[0]))-x+1,h=Math.max(...coords.map(c=>c[1]))-y+1;
  const long=FOOTPRINTS[kind][0]<FOOTPRINTS[kind][1],side=long?['west','north','east','south'][rot]:['north','east','south','west'][rot];
  if(side==='north')return Array.from({length:w},(_,i)=>[x+i,y-1]);
  if(side==='south')return Array.from({length:w},(_,i)=>[x+i,y+h]);
  if(side==='west')return Array.from({length:h},(_,i)=>[x-1,y+i]);
  return Array.from({length:h},(_,i)=>[x+w,y+i]);
};

for(const kind of Object.keys(KINDS))test(`${kind}: 15 seeded buildings are valid, deterministic and JSON-safe`,()=>{
  for(let i=0;i<15;i++){
    const args={seed:`interiors-${i}`},plan=interior(kind,args);
    assert.deepEqual(plan,interior(kind,args),'same seed must mean same plan');
    assert.deepEqual(copy(plan),plan,'layouts must be plain JSON');
    assert.deepEqual(plan.order,plan.order.slice().sort((a,b)=>['cellar','ground','upper','upper2'].indexOf(a)-['cellar','ground','upper','upper2'].indexOf(b)));
    for(const layout of plan.floors){
      assert.deepEqual(validateLayout(layout),[],`${kind} seed ${i}, floor ${layout.name}`);
      assert.equal(layout.W%3,1);assert.equal(layout.H%3,1);
      assert.ok(layout.rooms.every(r=>r[2]>=2&&r[3]>=2));
    }
    const g=plan.floors[plan.order.indexOf('ground')];
    assert.ok(g.rooms.some(r=>r[4]==='entrance'&&r[1]+r[3]===g.H-2));
    assert.ok(g.doors.some(([x,y])=>y===g.H-2&&x===g.front[0]),'exterior door at south wall');
    for(let n=1;n<plan.floors.length;n++){
      const a=plan.floors[n-1],b=plan.floors[n],first=plan.order[n-1],second=plan.order[n];
      if(first==='cellar'&&second==='ground')assert.deepEqual(a.up,b.down);
      else assert.deepEqual(a.up,b.down);
    }
    if(!plan.order.includes('cellar'))assert.equal(g.exits.down,'Out to the street');
    else assert.deepEqual(g.out,g.front);
  }
});

test('data catalogue has twelve programmes, useful prose and valid prop kits',()=>{
  const names=['cottage','house','longhouse','hall','barn','hut','tower','windmill','tavern','shop','church','mansion'];
  assert.deepEqual(Object.keys(KINDS),names);
  for(const [kind,cfg] of Object.entries(KINDS)){
    assert.ok(cfg.size.w[0]>=1&&cfg.size.h[0]>=1,kind);
    for(const floor of ['cellar','ground','upper'])assert.ok(cfg.programme[floor]?.length,`${kind}/${floor}`);
    for(const programme of Object.values(cfg.programme))for(const row of programme)assert.ok(ROOMS[row.use],`${kind}/${row.use}`);
  }
  for(const [id,room] of Object.entries(ROOMS)){
    assert.ok(room.names.length>=3,`${id} has names`);
    assert.ok(room.read.length>=2&&room.read.every(s=>s.length>=25),`${id} has read aloud`);
    assert.ok(room.kit.every(p=>FOOTPRINTS[p.kind]&&p.min<=p.max),`${id} valid kit`);
  }
});

test('taverns have a bar in the largest taproom and at least three rooms',()=>{
  for(let i=0;i<30;i++){
    const p=interior('tavern',{w:4,h:4,seed:`ale-${i}`,floors:'ground'}),l=p.floors[0],t=l.rooms.find(r=>ROOMS.taproom.names.includes(r[5]));
    assert.ok(t,`seed ${i}: taproom`);assert.ok(l.rooms.length>=3);
    assert.equal(t[2]*t[3],Math.max(...l.rooms.map(r=>r[2]*r[3])));
    assert.ok(l.props.some(prop=>prop[0]==='bar'&&roomHas(t,prop[1],prop[2])),`seed ${i}: bar in taproom`);
  }
});

test('church nave has an altar, and pews facing the altar',()=>{
  for(let i=0;i<30;i++){
    const l=interior('church',{w:5,h:5,seed:`prayers-${i}`,floors:'ground'}).floors[0];
    const nave=l.rooms.find(r=>ROOMS.nave.names.includes(r[5]));assert.ok(nave);
    const altar=l.props.find(p=>p[0]==='altar'&&roomHas(nave,p[1],p[2]));assert.ok(altar);
    const pews=l.props.filter(p=>p[0]==='pew'&&roomHas(nave,p[1],p[2]));assert.ok(pews.length>=2);
    const altarBottom=Math.max(...propCells(altar).map(c=>c[1]));
    assert.ok(pews.every(p=>p[3]===1&&p[2]>altarBottom),`seed ${i}: pews face altar from the nave`);
    assert.equal(nave[2]*nave[3],Math.max(...l.rooms.map(r=>r[2]*r[3])));
  }
});

test('all furniture is on unique room squares; wall pieces face solid wall; doors remain clear',()=>{
  for(const kind of Object.keys(KINDS))for(let i=0;i<15;i++){
    const p=interior(kind,{seed:`furniture-${i}`});for(const layout of p.floors){
      const seen=new Set(),protectedTiles=new Set(layout.doors.flatMap(([x,y])=>[[x,y],[x-1,y],[x+1,y],[x,y-1],[x,y+1]].map(([a,b])=>`${a},${b}`)));
      for(const pt of [layout.up,layout.down])if(pt)protectedTiles.add(pt.join(','));
      for(const prop of layout.props){
        const points=propCells(prop);
        assert.ok(points.every(([x,y])=>layout.rooms.some(r=>roomHas(r,x,y))),`room only: ${kind}/${prop[0]}`);
        for(const [x,y] of points){const k=`${x},${y}`;assert.ok(!seen.has(k),`no prop overlap at ${k}`);assert.ok(!protectedTiles.has(k),`door and stair clearance at ${k}`);seen.add(k);}
        if(WALL_PIECES.includes(prop[0]))assert.ok(wallSide(prop).every(([x,y])=>!occupied(layout,x,y)),`back to solid wall: ${prop[0]}`);
      }
    }
  }
});

test('interior size is footprint ×3 plus two-square margin; cottage smaller than mansion',()=>{
  const c=interior('cottage',{w:3,h:3,seed:'scale',floors:'ground'}).floors[0];
  const m=interior('mansion',{w:10,h:8,seed:'scale',floors:'ground'}).floors[0];
  assert.deepEqual([c.W,c.H],[13,13]);assert.deepEqual([m.W,m.H],[34,28]);assert.ok(c.W*c.H<m.W*m.H);
  assert.ok(c.rooms.every(r=>r[2]>=2&&r[3]>=2));assert.ok(m.rooms.every(r=>r[2]>=2&&r[3]>=2));
});

test('validation rejects touching rooms, displaced stairs, wall-less furniture, overlaps and isolated rooms',()=>{
  const l=interior('house',{w:4,h:4,seed:'validator',floors:'ground'}).floors[0];
  const broken=copy(l);broken.props.push(['table',0,0,0]);
  assert.ok(validateLayout(broken).some(e=>e.includes('off a room')));
  const stair=copy(l);stair.up=[1,1];assert.ok(validateLayout(stair).some(e=>e.includes('stairs not on room')));
  const crowded=copy(l),p=crowded.props[0];if(p){crowded.props.push(copy(p));assert.ok(validateLayout(crowded).some(e=>e.includes('Overlapping props')));}
  const touching=copy(l),a=touching.rooms[0];touching.rooms.push([a[0]+a[2],a[1],2,2,'chamber','Forbidden Annex','',{}]);
  assert.ok(validateLayout(touching).some(e=>e.includes('touch without a wall')));
  const isolate=copy(l);isolate.paths=[];isolate.doors=[];isolate.front=l.rooms[0].slice(0,2);assert.ok(validateLayout(isolate).some(e=>e.includes('Unreachable squares')));
});

test('100 large varied interiors generate in under one second',()=>{
  const all=Object.keys(KINDS),start=performance.now();
  for(let i=0;i<100;i++)interior(all[i%all.length],{seed:`speed-${i}`,floors:'all'});
  assert.ok(performance.now()-start<1000,`Generation took ${performance.now()-start}ms`);
});
