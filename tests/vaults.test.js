import test from 'node:test';
import assert from 'node:assert/strict';
import { VAULTS } from '../src/data/vaults.js';
import { FOOTPRINTS, KINDS, parseVault, transformVault, fits, pickVault, stampVault } from '../src/engine/vaults.js';

function rng(seed){ return ()=>{ seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }; }
function floor(w=9,h=7,sides=['top']){
  const W=w+3,H=h+3,room={id:0,x:1,y:1,w,h,cx:1+Math.floor(w/2),cy:1+Math.floor(h/2),type:'chamber'};
  const f={W,H,grid:Array(W*H).fill(0),rooms:[room],up:null,down:null};
  for(let y=1;y<=h;y++) for(let x=1;x<=w;x++) f.grid[y*W+x]=1;
  for(const side of sides){
    const [x,y]=({top:[room.cx,0],bottom:[room.cx,h+1],left:[0,room.cy],right:[w+1,room.cy]})[side];
    f.grid[y*W+x]=2;
  }
  return f;
}
function squares(p,W){
  let [w,h]=FOOTPRINTS[p.k] || [1,1]; if(p.rot%2) [w,h]=[h,w];
  return Array.from({length:w*h},(_,i)=>(p.y+Math.floor(i/w))*W+p.x+i%w);
}
function verify(f,r,s){
  const within=i=>i%f.W>=r.x && i%f.W<r.x+r.w && Math.floor(i/f.W)>=r.y && Math.floor(i/f.W)<r.y+r.h;
  const occupied=new Set((f.props || []).flatMap(p=>squares(p,f.W)));
  const terrain=[...s.filled,...s.shallow,...s.rough,...s.chasm];
  assert.equal(new Set(terrain).size,terrain.length);
  for(const i of terrain){ assert.ok(within(i)); assert.equal(f.grid[i],1); assert.ok(!occupied.has(i)); }
  for(const p of s.props) for(const i of squares(p,f.W)){
    assert.ok(within(i)); assert.equal(f.grid[i],1); assert.ok(!occupied.has(i)); assert.ok(!terrain.includes(i)); occupied.add(i);
  }
  const block=new Set([...occupied,...s.filled,...s.chasm,...(f.filled || []),...(f.chasm || [])]);
  const open=i=>within(i) && f.grid[i]>=1 && f.grid[i]<=4 && !block.has(i);
  const centre=r.cy*f.W+r.cx, needed=new Set([centre]);
  for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++){
    const i=y*f.W+x;
    if(f.grid[i]===3 || f.grid[i]===4) needed.add(i);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,j=ny*f.W+nx;
      if(nx>=0 && ny>=0 && nx<f.W && ny<f.H && !within(j) && f.grid[j]>=1 && f.grid[j]<=4) needed.add(i);
    }
  }
  for(const st of [f.up,f.down]) if(st && within(st.y*f.W+st.x)) needed.add(st.y*f.W+st.x);
  for(const i of needed) assert.ok(open(i),`blocked required square ${i} in ${s.id}`);
  const seen=new Set([centre]),queue=[centre];
  for(let n=0;n<queue.length;n++){
    const i=queue[n];
    for(const j of [i-1,i+1,i-f.W,i+f.W]) if(Math.abs(j%f.W-i%f.W)<=1 && open(j) && !seen.has(j)){seen.add(j);queue.push(j);}
  }
  for(const i of needed) assert.ok(seen.has(i),`disconnected square ${i} in ${s.id}`);
}

test('all designs parse with distinct ids, permitted kinds and non-overlapping footprints',()=>{
  assert.ok(VAULTS.length>=14); assert.equal(new Set(VAULTS.map(v=>v.id)).size,VAULTS.length);
  const allowed=new Set(('table longtable chair bench stool shelf bookshelf desk wardrobe bed rug chest barrel crate sacks altar pew candelabra statue throne banner armor organ brazier saltline shrine coffin sarcophagus bones gravestone cage rack minecart rails ore beam pillar rubble cobweb fungus puddle well cauldron alchemy bloomgrowth vines').split(' '));
  assert.ok(KINDS.every(k=>allowed.has(k)));
  for(const v of VAULTS){
    const p=parseVault(v); assert.ok(p.w>=5 && p.w<=11 && p.h>=5 && p.h<=9,v.id);
    assert.equal(p.cells.length,p.w*p.h); assert.ok(v.read && v.themes.length && v.types.length);
    const taken=new Set();
    for(const q of p.props) for(const i of squares(q,p.w)){ assert.ok(i>=0 && i<p.cells.length); assert.equal(p.cells[i],'.'); assert.ok(!taken.has(i)); taken.add(i); }
    for(let turn=0;turn<4;turn++) for(const flip of [false,true]){
      const t=transformVault(p,{turn,flip});
      for(const q of t.props){let [w,h]=FOOTPRINTS[q.k] || [1,1];if(q.rot%2)[w,h]=[h,w];assert.ok(q.x>=0 && q.y>=0 && q.x+w<=t.w && q.y+h<=t.h);}
    }
  }
});
test('bad maps, missing legends, bad props and illegal footprints throw TypeError',()=>{
  for(const v of [ {map:[]}, {map:['..','.']}, {map:['?']}, {map:['Q']}, {map:['Q'],legend:{Q:{k:'dragon'}}},
    {map:['C'],legend:{C:{k:'coffin'}}}, {map:['C!','..'],legend:{C:{k:'coffin',rot:1}}},
    {map:['CC','..'],legend:{C:{k:'coffin',rot:1}}}, {map:['C.'],legend:{C:{k:'coffin',rot:1.5}}} ]) assert.throws(()=>parseVault(v),TypeError);
});
test('quarter turns and mirrors preserve every occupied cell and own their arrays',()=>{
  for(const v of VAULTS){
    const p=parseVault(v), before=structuredClone(p); let t=p;
    for(let i=0;i<4;i++) t=transformVault(t,{turn:1});
    assert.deepEqual(t,p); assert.deepEqual(transformVault(transformVault(p,{flip:true}),{flip:true}),p);
    assert.equal(transformVault(p,{turn:1}).w,p.h); assert.equal(transformVault(p,{turn:1}).h,p.w);
    assert.deepEqual(transformVault(p,{turn:-1}),transformVault(p,{turn:3}));
    for(const turn of [0,1,2,3]) for(const flip of [false,true]){
      const q=transformVault(p,{turn,flip});
      p.props.forEach((prop,n)=>{
        const want=squares(prop,p.w).map(i=>{
          let x=i%p.w,y=Math.floor(i/p.w),w=p.w,h=p.h;
          for(let k=0;k<turn;k++){[x,y]=[h-1-y,x];[w,h]=[h,w];} if(flip)x=w-1-x;
          return y*w+x;
        }).sort((a,b)=>a-b);
        assert.deepEqual(squares(q.props[n],q.w).sort((a,b)=>a-b),want);
      });
    }
    t.cells[0]='?'; assert.deepEqual(p,before);
  }
  const p=parseVault({map:['C..','...'],legend:{C:{k:'coffin',rot:0}}});
  assert.deepEqual(transformVault(p,{turn:1}).props,[{k:'coffin',x:0,y:0,rot:1}]);
  assert.equal(transformVault(p,{flip:true}).props[0].rot,2);
});
test('every design actually stamps, preserves entrances and stairs, and leaves inputs unchanged',()=>{
  for(const v of VAULTS){
    let successes=0;
    for(const sides of [['top'],['top','bottom','left','right']]) for(let seed=1;seed<=5;seed++){
      const f=floor(13,11,sides),r=f.rooms[0];
      f.up={x:r.cx,y:r.cy}; f.grid[r.cy*f.W+r.cx]=4;
      f.down={x:r.x+r.w-1,y:r.y+r.h-1};f.grid[f.down.y*f.W+f.down.x]=3;
      const before=structuredClone(f), vb=structuredClone(v),s=stampVault(f,r,v,rng(seed));
      assert.deepEqual(f,before);assert.deepEqual(v,vb);
      assert.deepEqual(s,stampVault(f,r,v,rng(seed)));
      if(s){verify(f,r,s);successes++;}
    }
    assert.ok(successes>0,`${v.id} never placed`);
  }
});
test('tight rooms with entrances on all sides never accept an unsafe arrangement',()=>{
  for(const v of VAULTS){
    const p=parseVault(v),f=floor(p.w,p.h,['top','bottom','left','right']),r=f.rooms[0];
    for(let seed=0;seed<12;seed++){const s=stampVault(f,r,v,rng(seed));if(s)verify(f,r,s);}
  }
  const f=floor(5,5,['top','bottom','left','right']),r=f.rooms[0];
  assert.equal(stampVault(f,r,{id:'sealed',map:['#####','#...#','#...#','#...#','#####'],legend:{}},rng(1)),null);
  assert.equal(stampVault(f,r,{id:'cut',map:['..#..','..#..','..!..','..#..','..#..'],legend:{}},rng(1)),null);
});
test('offset placement is tried; existing obstacles and non-room squares are respected',()=>{
  const v={id:'small',read:'A lone chair.',map:['P'],legend:{P:{k:'chair'}}};
  const f=floor(5,5),r=f.rooms[0];f.grid[f.W+1]=2;
  f.props=[{k:'rug',x:1,y:4,rot:1}];f.filled=[3*f.W+1];
  const s=stampVault(f,r,v,rng(3));assert.ok(s);verify(f,r,s);
  const full=floor(5,5);full.grid.fill(2);
  for(const map of [['P'],['~'],[':'],['_'],['#']]) assert.equal(stampVault(full,full.rooms[0],{...v,map},rng(2)),null);
  const reserved=floor(5,5);reserved.props=[{k:'chair',x:3,y:3,rot:0}];
  assert.equal(stampVault(reserved,reserved.rooms[0],{id:'all-aisle',map:Array(5).fill('!!!!!'),legend:{}},rng(2)),null);
});
test('selection matches themes, types, dimensions, used ids and approximately half plain rooms',()=>{
  const r=floor(11,9).rooms[0],random=rng(29);let picked=0;
  for(let i=0;i<1000;i++){
    const v=pickVault(r,'castle',random,{used:['coffin-niches']}); if(!v)continue;picked++;
    assert.ok(v.types.includes(r.type));assert.ok(v.themes.includes('castle') || v.themes.includes('*'));assert.notEqual(v.id,'coffin-niches');
  }
  assert.ok(picked>430 && picked<570,picked);
  assert.equal(pickVault(r,'castle',rng(1),{used:VAULTS.map(v=>v.id)}),null);
  assert.equal(pickVault({...r,type:'unknown'},'castle',rng(1)),null);
  assert.equal(pickVault({...r,w:2,h:2},'castle',rng(1)),null);
  const shaped={...r,shape:'round'},f=floor();
  assert.equal(fits(shaped,parseVault(VAULTS[0])),false);
  assert.equal(pickVault(shaped,'castle',rng(1)),null);
  assert.equal(stampVault(f,shaped,VAULTS[0],rng(1)),null);
  const rotated={...r,w:7,h:9};assert.ok(fits(rotated,transformVault(parseVault(VAULTS[0]),{turn:1})));
});
