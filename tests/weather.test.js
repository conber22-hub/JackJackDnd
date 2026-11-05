import test from 'node:test';
import assert from 'node:assert/strict';
import { KINDS, SEASONS, LINES, GAZE_SIGNS, NEIGHBOURS, FRONT_PATHS } from '../src/data/weather.js';
import { weatherFor, forecast, groundLine, describe } from '../src/engine/weather.js';

const ids=new Set(KINDS.map(k=>k.id)),fog=w=>['low-fog','mist','thick-fog'].includes(w.kind);
const snowy=w=>['snow','blizzard'].includes(w.kind),mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
function valid(w){
  assert.ok(ids.has(w.kind));assert.ok(Object.hasOwn(SEASONS,w.season));
  assert.ok(w.sight>0);assert.ok(w.travel>0 && w.travel<=1);assert.ok(w.light>0 && w.light<=1);
  assert.ok(['bitter','cold','cool','mild'].includes(w.temp));assert.ok(Number.isInteger(w.wind) && w.wind>=0 && w.wind<=3);
  for(const k of ['snow','wet']) assert.ok(Number.isFinite(w.ground[k]) && w.ground[k]>=0 && w.ground[k]<=1);
  assert.equal(w.obscured,w.sight<30?'heavy':w.sight<300?'light':'none');
  assert.ok(w.line.endsWith('.'));assert.ok(w.label.length>0);
}

test('data covers all weather, seasons, symmetric neighbours and original description choices',()=>{
  const required=['overcast','low-fog','mist','thick-fog','drizzle','rain','downpour','storm','sleet','snow','blizzard','frost','clear-cold','dry-thunder'];
  assert.ok(required.every(id=>ids.has(id)));assert.equal(ids.size,KINDS.length);assert.ok(GAZE_SIGNS.length>=12);
  for(const k of KINDS){
    for(const field of ['wet','snow','travel','light']) assert.ok(k[field]>=0 && k[field]<=1);
    assert.ok(k.light>=.4);assert.ok(LINES[k.id].length>=3);
    for(const other of NEIGHBOURS[k.id]){assert.ok(ids.has(other));assert.ok(NEIGHBOURS[other].includes(k.id));}
    const path=['overcast',...FRONT_PATHS[k.id],'overcast'];
    for(let i=1;i<path.length;i++) assert.ok(NEIGHBOURS[path[i-1]].includes(path[i]));
  }
  assert.ok(!NEIGHBOURS['clear-cold'].includes('blizzard'));
  for(const s of Object.values(SEASONS)){
    assert.ok(s.temperature[0]<s.temperature[1]);
    for(const k of ids) assert.ok(Number.isFinite(s.weights[k]) && s.weights[k]>=0);
  }
});
test('two full years are valid, including calendar edges, all seasons and high Gaze',()=>{
  for(const seed of [1,42,'ravens']) for(const w of forecast(1,730,{seed})) valid(w);
  for(const season of Object.keys(SEASONS)) for(const w of forecast(1,365,{seed:42,season,gaze:10})) valid(w);
  for(const [day,season] of [[1,'autumn'],[91,'autumn'],[92,'winter'],[182,'winter'],[183,'spring'],[273,'spring'],[274,'summer'],[364,'summer'],[365,'autumn']]) assert.equal(weatherFor(day).season,season);
  assert.equal(weatherFor(100,{season:'summer'}).season,'summer');
});
test('seeded days are independent of call order, do not use Math.random, and own their data',()=>{
  const opts={seed:'the old road',gaze:7,hour:6,season:'autumn'},before={...opts};
  const a=Array.from({length:730},(_,i)=>weatherFor(i+1,opts)),b=forecast(1,730,{seed:'a new road',gaze:7});
  for(let i=a.length-1;i>=0;i--) assert.deepEqual(weatherFor(i+1,opts),a[i]);
  const noon=forecast(1,730,{seed:'the old road',gaze:7});
  assert.ok(noon.filter((w,i)=>w.kind!==b[i].kind).length/730>.3);
  const far=weatherFor(1000001,opts);weatherFor(1,{seed:'unrelated'});assert.deepEqual(weatherFor(1000001,opts),far);
  const random=Math.random;
  try{Math.random=()=>{throw new Error('Unseeded randomness');};assert.deepEqual(weatherFor(1000001,opts),far);}finally{Math.random=random;}
  const w=weatherFor(1,opts);w.ground.snow=99;assert.notEqual(weatherFor(1,opts).ground.snow,99);assert.deepEqual(opts,before);
});
test('fronts stay for 2–5 days and every transition follows a neighbour, including seasons',()=>{
  for(const seed of [1,42,91,'barovia']) for(const gaze of [1,9]){
    const days=forecast(1,730,{seed,gaze});let same=0,length=1;const runs=[];
    for(let i=1;i<days.length;i++){
      const a=days[i-1].kind,b=days[i].kind;
      if(a===b){same++;length++;}else{
        assert.ok(NEIGHBOURS[a].includes(b),`${seed}: ${i}: ${a} -> ${b}`);
        runs.push(length);length=1;
      }
    }
    const ratio=same/(days.length-1);assert.ok(ratio>=.45 && ratio<=.8,ratio);
    assert.ok(mean(runs)>=2 && mean(runs)<=5);assert.ok(runs.every(n=>n>=2 && n<=5));
  }
});
test('winter has more snow than summer, and summer has no blizzards or snowfall',()=>{
  for(const seed of [1,42,91,'ravens']){
    const winter=forecast(1,730,{seed,season:'winter'}),summer=forecast(1,730,{seed,season:'summer'});
    assert.ok(winter.filter(snowy).length>summer.filter(snowy).length);
    assert.ok(summer.every(w=>!snowy(w) && w.ground.snow===0));
    const calendar=forecast(1,730,{seed});assert.ok(calendar.filter(w=>w.season==='summer').every(w=>w.kind!=='blizzard'));
  }
});
test('fresh snow accumulates, survives after snowfall, slows travel and thaws in mild weather',()=>{
  let accumulating=0,lying=0,slowed=0;
  for(const seed of [1,42,91,'barovia']){
    const days=forecast(1,730,{seed});
    for(let i=2;i<days.length;i++){
      const three=days.slice(i-2,i+1),w=days[i];
      if(three.every(snowy) && three[0].ground.snow<.8){assert.ok(w.ground.snow>three[0].ground.snow);accumulating++;}
      if(!snowy(w) && snowy(days[i-1]) && w.ground.snow>.1) lying++;
      if(w.ground.snow>=.65){assert.ok(w.travel<=.5);slowed++;}
      if(i>=5 && days.slice(i-4,i+1).every(d=>d.temp==='mild' && !snowy(d))){
        assert.ok(w.ground.snow<.05);
      }
    }
  }
  assert.ok(accumulating>0);assert.ok(lying>0);assert.ok(slowed>0);
  // A known snowy spring gives a non-vacuous thaw: lying snow, then five mild days.
  const thaw=forecast(78,6,{seed:7,season:'spring'});
  assert.ok(thaw[0].ground.snow>0);assert.ok(thaw.slice(1).every(w=>w.temp==='mild' && !snowy(w)));
  assert.ok(thaw[5].ground.snow<.05);
});
test('rain leaves wet ground on the following dry day, then drains',()=>{
  const kinds=Object.fromEntries(KINDS.map(k=>[k.id,k])),days=forecast(1,730,{seed:42,season:'summer'});let after=0,drained=0;
  for(let i=1;i<days.length;i++){
    const previous=days[i-1],w=days[i];
    if(kinds[previous.kind].wet>=.35 && kinds[w.kind].wet===0){assert.ok(w.ground.wet>=.18);assert.ok(w.ground.wet<previous.ground.wet);after++;}
    if(i>=5 && days.slice(i-4,i+1).every(d=>kinds[d.kind].wet===0)){assert.ok(w.ground.wet<.1);drained++;}
  }
  assert.ok(after>0 && drained>0);
});
test('morning fog is more frequent than afternoon fog and has lifted by noon',()=>{
  let mornings=0,afternoons=0,lifted=0;
  for(let day=1;day<=730;day++){
    const a=weatherFor(day,{seed:42,hour:6}),b=weatherFor(day,{seed:42,hour:14}),noon=weatherFor(day,{seed:42,hour:12});
    mornings+=fog(a);afternoons+=fog(b);assert.equal(noon.kind,b.kind);assert.deepEqual(a.ground,b.ground);
    if(fog(a) && !fog(noon))lifted++;
  }
  assert.ok(mornings>afternoons);assert.ok(lifted>0);
});
test('high Gaze removes clear breaks, brings fog, dims daylight and increases its signs',()=>{
  let lowClear=0,highClear=0,lowFog=0,highFog=0,lowSigns=0,highSigns=0;
  for(const seed of [1,42,91,'ravens']){
    const low=forecast(1,365,{seed}),high=forecast(1,365,{seed,gaze:9}),faint=forecast(1,365,{seed,gaze:4});
    assert.ok(mean(high.map(w=>w.light))<mean(low.map(w=>w.light)));
    lowClear+=low.filter(w=>w.kind==='clear-cold').length;highClear+=high.filter(w=>w.kind==='clear-cold').length;
    lowFog+=low.filter(fog).length;highFog+=high.filter(fog).length;
    assert.ok(low.every(w=>!w.line.includes(';')));
    lowSigns+=faint.filter(w=>w.line.includes(';')).length;highSigns+=high.filter(w=>w.line.includes(';')).length;
  }
  assert.ok(lowClear>0 && highClear<lowClear);assert.ok(highFog>lowFog);assert.ok(highSigns>lowSigns && lowSigns>0);
  const low=forecast(1,365,{seed:1}),high=forecast(1,365,{seed:1,gaze:9});
  assert.ok(high.filter(w=>w.kind==='clear-cold').length<low.filter(w=>w.kind==='clear-cold').length);
});
test('forecast is noon, does not change options, and handles empty and invalid ranges',()=>{
  const opts={seed:1,hour:6,gaze:6},before={...opts},days=forecast(89,10,opts);
  assert.equal(days.length,10);days.forEach((w,i)=>assert.deepEqual(w,weatherFor(89+i,{...opts,hour:12})));assert.deepEqual(opts,before);
  assert.deepEqual(forecast(1,0),[]);
  for(const day of [0,-1,1.5,NaN,Infinity]) assert.throws(()=>weatherFor(day),RangeError);
  for(const opts of [{hour:24},{hour:-1},{hour:2.5},{season:'toString'},{season:'monsoon'},{gaze:0},{gaze:11},{gaze:NaN}]) assert.throws(()=>weatherFor(1,opts),RangeError);
  for(const n of [-1,1.5,Infinity]) assert.throws(()=>forecast(1,n),RangeError);
});
test('renderer words represent lying ground and DM descriptions include the mechanical effects',()=>{
  const allowed=new Set(['heavy snow','snow','frost','heavy rain','rain','']);
  for(const w of forecast(1,730,{seed:1})){
    assert.ok(allowed.has(groundLine(w)));
    if(w.ground.snow>=.4)assert.ok(groundLine(w).includes('snow'));
    const line=describe(w);assert.ok(line.includes(w.label));assert.ok(line.includes(w.temp));assert.ok(line.includes(String(w.sight)));
    if(w.travel===.5)assert.ok(line.includes('half speed'));
    if(w.obscured==='heavy')assert.ok(line.includes('heavily obscured'));
  }
  const clear={...weatherFor(1),kind:'overcast',temp:'mild'};
  assert.equal(groundLine({...clear,ground:{snow:.8,wet:1}}),'heavy snow');
  assert.equal(groundLine({...clear,ground:{snow:.4,wet:0}}),'snow');
  assert.equal(groundLine({...clear,ground:{snow:0,wet:.8}}),'heavy rain');
  assert.equal(groundLine({...clear,ground:{snow:0,wet:.3}}),'rain');
  assert.equal(groundLine({...clear,ground:{snow:0,wet:0}}),'');
  assert.equal(groundLine({...clear,kind:'frost',ground:{snow:0,wet:0}}),'frost');
});
test('1000 direct-day queries are fast even a million days into the campaign',()=>{
  for(let i=1;i<=100;i++)weatherFor(i,{seed:1});
  const start=performance.now();
  for(let i=1;i<=1000;i++)weatherFor(1000000+i,{seed:1});
  const elapsed=performance.now()-start;
  assert.ok(elapsed<500,`1000 direct queries took ${elapsed.toFixed(1)} ms (target <100 ms)`);
});
