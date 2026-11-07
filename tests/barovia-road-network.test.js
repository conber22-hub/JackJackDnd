import test from 'node:test';
import assert from 'node:assert/strict';
import {ROAD_ASSETS} from '../src/render/road-assets-index.js';
import {LINKS,PLACES} from '../src/render/barovia-road-links.js';
import {planRoadLink,planValleyTrip,portsFor,rotatedSide,validateRoadPlan,shortestValleyRoute} from '../src/render/barovia-road-network.js';

const clone=v=>JSON.parse(JSON.stringify(v));
const pos=p=>`${p.x},${p.y}`;
const uniq=a=>new Set(a).size===a.length;

test('65 original models; every connector uses approved width, style and placement contract',()=>{
 const ids=Object.keys(ROAD_ASSETS);assert.equal(ids.length,65);
 assert.equal(uniq(ids),true);
 for(const item of Object.values(ROAD_ASSETS)){
  assert.deepEqual(item.size,[8,8]);
  assert.equal(item.file,`assets/${item.id}.glb`);
  for(const [dir,style] of Object.entries(item.sockets)){
   assert.ok('NESW'.includes(dir));assert.ok(['road','path','trail','cobble'].includes(style));
   assert.equal(item.edgeWidth[dir],['road','cobble'].includes(style)?3:2);
  }
 }
});

test('rotation ports rotate visually clockwise and preserve shoulder widths',()=>{
 assert.equal(rotatedSide('N',1),'E');assert.equal(rotatedSide('W',1),'N');assert.equal(rotatedSide('S',3),'E');
 assert.equal(portsFor('transition_road_cobble_ns',3).W.style,'road');
 assert.equal(portsFor('transition_road_cobble_ns',3).E.style,'cobble');
 assert.equal(portsFor('transition_road_path_ns',0).S.width,2);
});

test('all 15 link ids and 16 places match the intended valley network',()=>{
 assert.equal(LINKS.length,15);assert.equal(Object.keys(PLACES).length,16);
 assert.ok(uniq(LINKS.map(x=>x.id)));
 for(const r of LINKS){assert.ok(PLACES[r.a]&&PLACES[r.b]);assert.ok([1,2].includes(r.len));}
 for(const place of Object.keys(PLACES))assert.ok(shortestValleyRoute('village',place).places.length>=1);
});

for(const link of LINKS)test(`${link.id}: 40x24-square chunks, 25 seeds and both travel directions`,()=>{
 for(let n=0;n<25;n++)for(const reverse of [false,true]){
  const params={seed:`valley-${n}`,reverse};const p=planRoadLink(link.id,params);
  assert.deepEqual(validateRoadPlan(p),[],`${link.id} ${n} ${reverse}`);
  assert.deepEqual(p,planRoadLink(link.id,clone(params)));
  assert.deepEqual(JSON.parse(JSON.stringify(p)),p);
  assert.equal(p.tilesPerStretch,5);assert.equal(p.segments.length,link.len);
  assert.equal(p.fullWidthSquares,link.len*40);
  assert.ok(p.segments.every(s=>s.widthSquares===40&&s.heightSquares===24));
  assert.ok(p.segments.every(s=>s.tiles.every(t=>t.x>=0&&t.x<5)));
  assert.ok(p.tiles.every(t=>t.y>=0&&t.y<=2));
  assert.ok(uniq(p.tiles.map(pos)));
  assert.equal(p.from,reverse?link.b:link.a);assert.equal(p.to,reverse?link.a:link.b);
  if(link.river)assert.ok(p.tiles.some(t=>t.id.startsWith('bridge_')));
  // At least the five-straight-tile arterial always reaches both ends.
  assert.ok(p.tiles.some(t=>t.x===0&&t.y===1));
  assert.ok(p.tiles.some(t=>t.x===link.len*5-1&&t.y===1));
 }
});

test('castle -> Krezk itinerary traverses connected route graph and reverses links correctly',()=>{
 const p=planValleyTrip('castle','krezk',{seed:'sleet'});
 assert.equal(p.places[0],'castle');assert.equal(p.places.at(-1),'krezk');
 assert.equal(p.links.length,p.segments.length);
 for(let i=0;i<p.segments.length;i++){
  assert.equal(p.segments[i].from,p.places[i]);assert.equal(p.segments[i].to,p.places[i+1]);
  assert.deepEqual(validateRoadPlan(p.segments[i]),[]);
 }
});

test('weighted paths remain consistent with declared travel hours',()=>{
 const a=shortestValleyRoute('village','tower',{by:'hours'});
 assert.ok(a.hours>=a.stretches*2);
 const b=shortestValleyRoute('village','tower',{by:'stretches'});
 assert.deepEqual(a.places,b.places); // canonical graph is a tree: only one geographic path
});

test('seed does not mutate inputs, and bad link ids and tile sizes fail clearly',()=>{
 const r=clone(LINKS[0]);Object.freeze(r);
 assert.deepEqual(planRoadLink(r,{seed:'one'}),planRoadLink(r,{seed:'one'}));
 assert.deepEqual(r,LINKS[0]);
 assert.throws(()=>planRoadLink('unknown'),/known road/);
 assert.throws(()=>planRoadLink('r-west',{tilesPerStretch:3}),/4–20/);
 assert.throws(()=>shortestValleyRoute('wat','castle'),/Unknown Barovian/);
});

test('1000 full links stay cheap and deterministic',()=>{
 const start=performance.now();
 for(let i=0;i<1000;i++)assert.deepEqual(validateRoadPlan(planRoadLink(LINKS[i%LINKS.length].id,{seed:String(i),reverse:!!(i%2)})),[]);
 assert.ok(performance.now()-start<3000,'1000 route plans should finish under three seconds');
});
