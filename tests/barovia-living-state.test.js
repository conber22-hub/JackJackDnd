import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {ATMOSPHERES,QUALITY,hashSeed,seeded,planGroundFog,planSnow,planHungerMoss,mossAtStep}
  from '../src/render/barovia-living-state.js';

const options={width:40,height:40,seed:'barovia|test',origins:[{x:4,y:5}],maxSteps:15,maxCells:250};
const positions=points=>points.map(p=>`${p.x},${p.y}`);

test('all seven Barovia biome presets and three device budgets are defined',()=>{
  assert.equal(Object.keys(ATMOSPHERES).length,7);
  assert.deepEqual(Object.keys(QUALITY),['low','medium','high']);
  for(const p of Object.values(ATMOSPHERES)){
    assert.ok(p.wind>=0&&p.wind<=1&&p.fog>=0&&p.fog<=1);
    assert.match(p.tint,/^#[a-f\d]{6}$/i);
  }
  assert.ok(QUALITY.low.snowflakes<QUALITY.medium.snowflakes);
  assert.ok(QUALITY.medium.snowflakes<QUALITY.high.snowflakes);
});

test('seeded hashing and generator are deterministic, change with seed, and stay in range',()=>{
  assert.equal(hashSeed('svalich'),hashSeed('svalich'));
  assert.notEqual(hashSeed('svalich'),hashSeed('tser'));
  assert.deepEqual(Array.from({length:80},seeded('x')),Array.from({length:80},seeded('x')));
  assert.ok(Array.from({length:200},seeded('z')).every(v=>v>=0&&v<1));
});

test('fog fields are deterministic, properly bounded and based on allowed cells',()=>{
  const cfg={width:30,height:25,seed:'mist|road',count:100,allowed:(x,y)=>x<11&&y<14};
  const a=planGroundFog(cfg),b=planGroundFog(cfg);
  assert.deepEqual(a,b);assert.ok(a.length>0&&a.length<=cfg.count);
  for(const p of a){assert.ok(Number.isFinite(p.radius)&&p.radius>1);
    assert.ok(p.x<11-14.5+.5);assert.ok(p.z<14-12+.5);
    assert.ok(p.opacity>=0&&p.opacity<=1);
  }
});

test('snowfields stay within their specified footprint and height',()=>{
  const cfg={width:31,height:27,skyHeight:8,seed:'Balinoks',count:550};
  const a=planSnow(cfg);assert.deepEqual(a,planSnow(cfg));assert.equal(a.length,550);
  assert.ok(a.every(p=>Math.abs(p.x)<=15.5&&Math.abs(p.z)<=13.5&&p.y>=0&&p.y<8&&p.speed>0));
});

test('Hunger Moss grows in reproducible 4-neighbour steps',()=>{
  const a=planHungerMoss(options),b=planHungerMoss(options);
  assert.deepEqual(a,b);assert.ok(a.length>45);
  assert.equal(a[0].x,4);assert.equal(a[0].y,5);assert.equal(a[0].step,0);
  assert.equal(new Set(positions(a)).size,a.length);
  assert.ok(a.every((p,i)=>p.step<=options.maxSteps&&(i===0||p.step>=a[i-1].step)));
  const grid=new Map(a.map(p=>[`${p.x},${p.y}`,p.step]));
  for(const p of a.slice(1)){
    const neighbour=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{
      const previous=grid.get(`${p.x+dx},${p.y+dy}`);
      return previous!==undefined&&previous<p.step;
    });
    assert.ok(neighbour,`unconnected growth at ${p.x},${p.y}`);
  }
});

test('Hunger Moss never traverses protected corridors or passes a solid partition',()=>{
  const allowed=(x,y)=>x!==13&&!(x>=8&&x<=10&&y>=14&&y<=19);
  const a=planHungerMoss({...options,origins:[{x:5,y:5}],allowed});
  assert.ok(a.length>15);
  assert.ok(a.every(p=>p.x<13&&allowed(p.x,p.y)));
});

test('moss growth is monotonic: stages never replace or erase earlier growth',()=>{
  const p=planHungerMoss(options);
  let prior=new Set();
  for(let step=0;step<=16;step++){
    const now=new Set(positions(mossAtStep(p,step)));
    for(const id of prior)assert.ok(now.has(id));
    prior=now;
  }
  assert.equal(mossAtStep(p,0).length,1);
  assert.equal(mossAtStep(p,16).length,p.length);
});

test('Hunger Moss respects maxCells, maxSteps and disallowed origins',()=>{
  assert.equal(planHungerMoss({...options,maxCells:12}).length,12);
  assert.ok(planHungerMoss({...options,maxSteps:2}).every(p=>p.step<=2));
  assert.deepEqual(planHungerMoss({...options,allowed:()=>false}),[]);
  assert.deepEqual(planHungerMoss({...options,origins:[]}),[]);
});

test('all effects can be generated without Math.random or DOM',()=>{
  const original=Math.random;
  try{Math.random=()=>{throw new Error('Math.random is forbidden');};
    assert.ok(planGroundFog({width:20,height:20,count:20}).length);
    assert.ok(planSnow({width:20,height:20,count:20}).length);
    assert.ok(planHungerMoss({width:20,height:20,origins:[{x:9,y:10}]}).length);
  }finally{Math.random=original;}
});

test('bad weather plans and invalid seeds fail closed, not with unbounded allocations',()=>{
  assert.throws(()=>planGroundFog({width:-1,height:20}),RangeError);
  assert.throws(()=>planGroundFog({width:20,height:20,count:1e10}),RangeError);
  assert.throws(()=>planSnow({width:30,height:30,count:6000}),RangeError);
  assert.throws(()=>planHungerMoss({...options,maxCells:100000}),TypeError);
  assert.throws(()=>planHungerMoss({...options,origins:[{x:2.5,y:3}]}),TypeError);
  assert.throws(()=>mossAtStep([], -1),RangeError);
});

test('Three.js renderer has no document, window, Math.random, global scene mutation or imported side effects',()=>{
  const src=readFileSync(new URL('../src/render/barovia-living-three.js',import.meta.url),'utf8');
  assert.match(src,/export function createLivingValley/);
  for(const forbidden of ['document.','window.','Math.random(','requestAnimationFrame(','new THREE.WebGLRenderer('])
    assert.ok(!src.includes(forbidden),`Unexpected ownership: ${forbidden}`);
  for(const essential of ['addGroundFog','addBlackwater','addSnowfall','attachTree','addHungerMoss','setMossStep','setWind','dispose'])
    assert.ok(src.includes(essential));
});

test('100 complete 40x40 animated environment plans generate quickly',()=>{
  const start=performance.now();
  for(let i=0;i<100;i++){
    const seed=`speed|${i}`;
    planGroundFog({width:40,height:40,seed,count:40});
    planSnow({width:40,height:40,seed,count:300});
    planHungerMoss({width:40,height:40,seed,origins:[{x:20,y:20}],maxCells:100});
  }
  const elapsed=performance.now()-start;
  assert.ok(elapsed<2000,`100 environments took ${elapsed.toFixed(1)}ms`);
});
