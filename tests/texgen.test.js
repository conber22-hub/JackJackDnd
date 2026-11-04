import test from 'node:test';
import assert from 'node:assert/strict';
import { MATERIALS } from '../src/data/materials.js';
import { KINDS,valueNoise,fbm,worley,bricks,stones,planks,normalFromHeight,makeMaterial } from '../src/engine/texgen.js';
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
function seamless(a,size,channels=1){
  for(const axis of [0,1]){
    let seam=0,inside=0;
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) for(let c=0;c<channels;c++){
      const i=(y*size+x)*channels+c;
      if((axis===0?x:y)===size-1){const j=(axis===0?y*size:x)*channels+c;seam+=Math.abs(a[i]-a[j]);}
      else {const j=i+(axis===0?channels:size*channels);inside+=Math.abs(a[i]-a[j]);}
    }
    const boundary=seam/(size*channels),neighbours=inside/(size*(size-1)*channels);
    assert.ok(boundary<=neighbours*1.5+1e-7,`axis ${axis}: seam ${boundary}, interior ${neighbours}`);
  }
}
test('all eleven recipes build typed maps with valid ranges and near-neutral albedo',()=>{
  assert.deepEqual(KINDS,Object.keys(MATERIALS));assert.equal(KINDS.length,11);
  for(const kind of KINDS){
    const m=makeMaterial(kind,{size:64});assert.equal(m.size,64);assert.ok(m.height instanceof Float32Array);assert.equal(m.height.length,4096);
    for(const v of m.height) assert.ok(Number.isFinite(v) && v>=0 && v<=1,kind);
    for(const key of ['albedo','normal','roughness','ao']){
      const a=m[key];assert.ok(a instanceof Uint8ClampedArray);assert.equal(a.length,4096*4);
      for(const v of a) assert.ok(v>=0 && v<=255);
      for(let i=0;i<a.length;i+=4){assert.equal(a[i+3],255);if(['roughness','ao'].includes(key)){assert.equal(a[i],a[i+1]);assert.equal(a[i],a[i+2]);}}
    }
    for(let i=0;i<m.albedo.length;i+=4){assert.ok(m.albedo[i]>=m.albedo[i+2]);assert.ok(m.albedo[i]-m.albedo[i+2]<=12);}
  }
  assert.throws(()=>makeMaterial('unknown'),RangeError);assert.throws(()=>makeMaterial('toString'),RangeError);
});
test('building blocks are bounded, deterministic and owned by each call',()=>{
  for(const generate of [valueNoise,fbm,worley]){
    const a=generate(32,{seed:13}),before=a.slice();assert.ok(a instanceof Float32Array);assert.equal(a.length,1024);
    assert.deepEqual(a,generate(32,{seed:13}));assert.notDeepEqual(a,generate(32,{seed:14}));
    for(const v of a) assert.ok(v>=0 && v<=1);
    generate(32,{seed:99});assert.deepEqual(a,before);
  }
  for(const generate of [bricks,stones,planks]){
    const a=generate(64,{seed:42});assert.ok(a.height instanceof Float32Array);assert.ok(a.id instanceof Int32Array);assert.equal(a.id.length,4096);
    for(const v of a.height) assert.ok(v>=0 && v<=1);
    for(const v of a.id) assert.ok(v>=0);
    assert.deepEqual(a,generate(64,{seed:42}));assert.notDeepEqual(a,generate(64,{seed:43}));
  }
});
test('normals are unit vectors with opaque alpha, and a flat map faces out',()=>{
  const flat=normalFromHeight(new Float32Array(64).fill(.4),8,{strength:4});
  for(let i=0;i<flat.length;i+=4) assert.deepEqual([...flat.slice(i,i+4)],[128,128,255,255]);
  for(const kind of KINDS){const a=makeMaterial(kind,{size:64}).normal;for(let i=0;i<a.length;i+=4){const length=Math.hypot(a[i]/255*2-1,a[i+1]/255*2-1,a[i+2]/255*2-1);assert.ok(Math.abs(length-1)<.05);}}
  const h=new Float32Array([0,.2,.4,.6, 0,.2,.4,.6, 0,.2,.4,.6, 0,.2,.4,.6]),before=h.slice();
  const a=normalFromHeight(h,4,{strength:1});assert.ok(a[4]<128);assert.ok(a[0]>128);assert.deepEqual(h,before);
});
test('periodic patterns and every flag map continue across both boundaries',()=>{
  for(const seed of [1,42,91]){
    seamless(fbm(64,{freq:4,seed}),64);
    seamless(worley(64,{cells:5,seed}),64);
    seamless(worley(64,{cells:5,metric:'f2-f1',seed}),64);
    seamless(bricks(64,{rows:8,cols:4,seed}).height,64);
    const m=makeMaterial('flag',{size:64,seed});
    seamless(m.height,64);for(const k of ['albedo','normal','roughness','ao']) seamless(m[k],64,4);
  }
});
test('each material repeats its seed, changes with the seed and retains no shared arrays',()=>{
  for(const kind of KINDS){
    const options={size:32,seed:42},before={...options},a=makeMaterial(kind,options),b=makeMaterial(kind,options),c=makeMaterial(kind,{...options,seed:43});
    assert.deepEqual(a,b);assert.notDeepEqual(a.albedo,c.albedo);assert.deepEqual(options,before);
    a.albedo[0]^=255;assert.notEqual(a.albedo[0],b.albedo[0]);
  }
});
test('mud is smoother than cave rock and low gaps have stronger occlusion',()=>{
  assert.ok(mean(makeMaterial('mud',{size:64}).roughness)<mean(makeMaterial('rock',{size:64}).roughness));
  for(const kind of ['flag','cobble','brick','plank']){
    const m=makeMaterial(kind,{size:64}),sorted=[...m.height].sort((a,b)=>a-b),lo=sorted[409],hi=sorted[3686];let low=0,high=0,nl=0,nh=0;
    for(let i=0;i<m.height.length;i++){if(m.height[i]<=lo){low+=m.ao[i*4];nl++;}if(m.height[i]>=hi){high+=m.ao[i*4];nh++;}}
    assert.ok(low/nl<high/nh,kind);
  }
});
test('256-square cobble generation stays under 500 ms',()=>{
  makeMaterial('cobble',{size:32});const start=performance.now();const m=makeMaterial('cobble',{size:256,seed:42});const ms=performance.now()-start;
  assert.equal(m.height.length,65536);assert.ok(ms<500,`Cobble took ${ms.toFixed(1)} ms`);
});
