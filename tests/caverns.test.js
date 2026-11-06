import test from 'node:test';
import assert from 'node:assert/strict';
import { cavern, chamberAt, toAscii } from '../src/engine/caverns.js';
import { PRESETS } from '../src/data/caverns.js';

function reach(c,blocked=[]){
  const ban=new Set(blocked),start=c.up.y*c.W+c.up.x,dist=new Map([[start,0]]),q=[start];
  for(let n=0;n<q.length;n++){
    const i=q[n];for(const j of [i-c.W,i+1,i+c.W,i-1])if(j>=0 && j<c.open.length && Math.abs(i%c.W-j%c.W)<=1 && c.open[j] && !ban.has(j) && !dist.has(j)){dist.set(j,dist.get(i)+1);q.push(j);}
  }
  return dist;
}
function verify(c){
  const {W,H}=c,seen=reach(c),n=c.open.reduce((a,b)=>a+b,0),wet=new Set([...c.deep,...c.shallow,...c.chasm,...c.bridge]);
  assert.equal(seen.size,n,'connected by orthogonal steps');
  assert.ok(n/((W-4)*(H-4))>=.3 && n/((W-4)*(H-4))<=.7,`density ${n/((W-4)*(H-4))}`);
  const entries=[...c.deep,...c.shallow,...c.chasm,...c.bridge];assert.equal(wet.size,entries.length,'no overlap or duplicates');
  for(const i of entries)assert.ok(Number.isInteger(i) && i>=0 && i<W*H);
  for(const i of [...c.deep,...c.chasm])assert.equal(c.open[i],0);
  for(const i of [...c.shallow,...c.bridge])assert.equal(c.open[i],1);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x<2||y<2||x>=W-2||y>=H-2){assert.equal(c.open[y*W+x],0);assert.ok(!wet.has(y*W+x));}
  for(const p of [c.up,c.down]){const i=p.y*W+p.x;assert.equal(c.open[i],1);assert.ok(!wet.has(i));}
  assert.ok(seen.get(c.down.y*W+c.down.x)>=W/2,'stairs far apart by walking distance');
  const sizes=new Map();
  for(let i=0;i<W*H;i++){
    const ch=chamberAt(c,i%W,Math.floor(i/W));
    if(!c.open[i]){assert.equal(ch,null);continue;}
    assert.ok(ch);assert.ok(i%W>=ch.x && i%W<ch.x+ch.w && Math.floor(i/W)>=ch.y && Math.floor(i/W)<ch.y+ch.h);
    sizes.set(ch.id,(sizes.get(ch.id)||0)+1);
  }
  for(const ch of c.chambers){
    const i=ch.cy*W+ch.cx;assert.equal(c.open[i],1);assert.ok(!wet.has(i));assert.equal(chamberAt(c,ch.cx,ch.cy).id,ch.id);assert.equal(sizes.get(ch.id),ch.size);
  }
  for(const i of c.necks){assert.equal(c.open[i],1);assert.ok([i-W,i+1,i+W,i-1].some(j=>c.open[j] && c.chamberIds[j]!==c.chamberIds[i]));}
  for(const i of c.shallow)assert.ok([i-W,i+1,i+W,i-1].some(j=>c.deep.includes(j)),'shallow touches deep');
  if(c.bridge.length){
    assert.ok(c.chasm.length);assert.ok(c.bridge.length<=2);
    for(const i of c.bridge)assert.ok(!reach(c,[i]).has(c.down.y*W+c.down.x),'bridge is mandatory');
  }
}
for(const preset of Object.keys(PRESETS))test(`${preset}: 20 seeds, topology, density, chambers and terrain`,()=>{
  for(let seed=0;seed<20;seed++){
    const c=cavern(60,60,{preset,seed:`audit-${seed}`});
    try{verify(c);if(preset==='hall')assert.ok(c.chambers.length>=3);if(preset==='warren')assert.ok(c.chambers.length>=6);}
    catch(e){e.message=`${preset} seed ${seed}: ${e.message}`;throw e;}
  }
});
test('lake and chasm together preserve their independent guarantees',()=>{
  for(let seed=0;seed<20;seed++){
    const c=cavern(60,60,{seed:`both-${seed}`,lake:.5,chasm:true});verify(c);assert.ok(c.deep.length);assert.ok(c.shallow.length);
  }
});
test('deterministic, options override presets, no shared arrays, useful ASCII',()=>{
  const a=cavern(60,60,{seed:'same',preset:'hall'}),b=cavern(60,60,{seed:'same',preset:'hall'});
  assert.notDeepEqual(cavern(60,60,{seed:'🙂'}).open,cavern(60,60,{seed:'🙃'}).open);
  assert.deepEqual(a,b);assert.notDeepEqual(a.open,cavern(60,60,{seed:'other',preset:'hall'}).open);
  assert.deepEqual(cavern(60,60,{...PRESETS.hall,seed:'same'}).open,a.open);
  assert.equal(cavern(60,60,{preset:'lake',lake:0}).deep.length,0);
  a.open.fill(0);assert.ok(b.open.some(Boolean));
  const c=cavern(60,60,{lake:.5,chasm:true}),ascii=toAscii(c),rows=ascii.split('\n');
  assert.equal(rows.length,60);assert.ok(rows.every(r=>r.length===60));
  for(const char of ['#','.','~',',','_','=','<','>'])assert.ok(ascii.includes(char));
  for(const [x,y] of [[-1,0],[60,0],[0,60],[.5,2]])assert.equal(chamberAt(c,x,y),null);
});
test('rectangular and small maps stay connected; input errors are explicit',()=>{
  for(const [W,H] of [[16,16],[24,70],[80,32]])for(const preset of Object.keys(PRESETS)){
    const c=cavern(W,H,{preset,seed:'rectangle'});assert.equal(reach(c).size,c.open.reduce((a,b)=>a+b));
  }
  for(const [W,H] of [[1,60],[60,15],[NaN,60],[16.5,60],[300,60]])assert.throws(()=>cavern(W,H),RangeError);
  for(const opts of [{preset:'missing'},{fill:NaN},{steps:7},{lake:-1},{minChamber:0},{seed:7},{chasm:'yes'}])assert.throws(()=>cavern(60,60,opts),RangeError);
});
test('80×80 generation stays under the slow-machine allowance',()=>{
  cavern(80,80,{seed:'warmup',preset:'lake'});
  const t=performance.now();cavern(80,80,{seed:'timed',preset:'lake'});
  assert.ok(performance.now()-t<300);
});
