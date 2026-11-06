import { PRESETS } from '../data/caverns.js';

function random(seed){
  let h=2166136261;
  for(const c of seed){h^=c.codePointAt(0);h=Math.imul(h,16777619);}
  return ()=>{let t=h+=0x6d2b79f5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
const count=a=>a.reduce((s,n)=>s+n,0);
const point=(i,W)=>({x:i%W,y:Math.floor(i/W)});
// All traversed cells have a two-cell rock border, so these offsets cannot wrap.
function walk(open,W,start){
  const distance=new Int32Array(open.length).fill(-1),queue=new Int32Array(open.length);
  let n=0,end=0;queue[end++]=start;distance[start]=0;
  while(n<end){const i=queue[n++];for(const j of [i-W,i+1,i+W,i-1]) if(open[j] && distance[j]<0){distance[j]=distance[i]+1;queue[end++]=j;}}
  return {distance,cells:queue.subarray(0,end),far:queue[end-1]};
}
function regions(open,W){
  const seen=new Uint8Array(open.length),out=[];
  for(let i=0;i<open.length;i++) if(open[i] && !seen[i]){
    const cells=[i];seen[i]=1;
    for(let n=0;n<cells.length;n++) for(const j of [cells[n]-W,cells[n]+1,cells[n]+W,cells[n]-1]) if(open[j] && !seen[j]){seen[j]=1;cells.push(j);}
    out.push(cells);
  }
  return out.sort((a,b)=>b.length-a.length);
}
function tunnel(open,W,a,b,rng){
  let x=a%W,y=Math.floor(a/W),tx=b%W,ty=Math.floor(b/W);
  open[a]=1;
  // Random monotone steps meander without ever leaving the endpoints' bounds.
  while(x!==tx || y!==ty){
    if(x!==tx && (y===ty || rng()<.5)) x+=Math.sign(tx-x);else y+=Math.sign(ty-y);
    open[y*W+x]=1;
  }
}
function connect(open,W,min,rng){
  const parts=regions(open,W);if(!parts.length)return;
  const joined=parts[0].slice();
  // Discard pockets before tunnelling: a later pocket removal must not erase a join.
  for(const cells of parts.slice(1))if(cells.length<min)for(const i of cells)open[i]=0;
  for(const cells of parts.slice(1)){
    if(cells.length<min)continue;
    // Compare boundary representatives, then the nearest member of the other region.
    let a=cells[0],b=joined[0],best=Infinity;
    for(const i of cells) {const d=(i%W-b%W)**2+(Math.floor(i/W)-Math.floor(b/W))**2;if(d<best){best=d;a=i;}}
    best=Infinity;
    for(const j of joined){const d=(a%W-j%W)**2+(Math.floor(a/W)-Math.floor(j/W))**2;if(d<best){best=d;b=j;}}
    tunnel(open,W,a,b,rng);joined.push(...cells);
  }
}
function grow(W,H,o,rng){
  let open=new Uint8Array(W*H);
  for(let y=2;y<H-2;y++) for(let x=2;x<W-2;x++) open[y*W+x]=rng()>=o.fill?1:0;
  for(let s=0;s<o.steps;s++){
    const next=new Uint8Array(W*H);
    for(let y=2;y<H-2;y++) for(let x=2;x<W-2;x++){
      const i=y*W+x;let rock=0;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(dx || dy)rock+=1-open[i+dy*W+dx];
      next[i]=rock>=5?0:rock<=3?1:open[i];
    }
    open=next;
  }
  connect(open,W,o.minChamber,rng);return open;
}
function clearance(open,W,H){
  const d=new Int16Array(open.length),queue=new Int32Array(open.length);let end=0;
  for(let i=0;i<open.length;i++) if(!open[i])queue[end++]=i;else d[i]=32767;
  for(let n=0;n<end;n++){
    const i=queue[n],x=i%W,y=Math.floor(i/W);
    for(const j of [y>0?i-W:-1,x<W-1?i+1:-1,y<H-1?i+W:-1,x>0?i-1:-1]) if(j>=0 && d[j]>d[i]+1){d[j]=d[i]+1;queue[end++]=j;}
  }
  return d;
}
function cut(open,W,H,rng){
  const x=Math.floor(W/2),drop=[];
  for(let y=2;y<H-2;y++){const i=y*W+x;open[i]=0;drop.push(i);}
  // Reconnect each bank independently: no repair tunnel can cross the band.
  for(const left of [true,false]){
    const side=open.map((v,i)=>v && (left?i%W<x:i%W>x)?1:0);
    connect(side,W,0,rng);
    for(let i=0;i<open.length;i++)if(side[i])open[i]=1;
  }
  const d=clearance(open,W,H);let y=Math.floor(H/2),best=-1;
  for(let row=3;row<H-3;row++){
    const i=row*W+x,score=d[i-1]+d[i+1]-(Math.abs(row-H/2)/H);
    if(open[i-1] && open[i+1] && score>best){best=score;y=row;}
  }
  const middle=y*W+x;
  for(const left of [true,false]){
    const target=middle+(left?-1:1);let nearest=-1,best=Infinity;
    for(let i=0;i<open.length;i++) if(open[i] && (left?i%W<x:i%W>x)){
      const dist=Math.abs(i%W-target%W)+Math.abs(Math.floor(i/W)-y);
      if(dist<best){best=dist;nearest=i;}
    }
    if(nearest<0)nearest=y*W+(left?2:W-3);
    tunnel(open,W,target,nearest,rng);
  }
  open[middle]=1;return {chasm:drop.filter(i=>i!==middle),bridge:[middle]};
}
function water(open,W,H,amount,protectedCells){
  if(!amount)return {deep:[],shallow:[]};
  const dist=clearance(open,W,H),total=count(open),budget=Math.max(5,Math.floor(total*amount*.3));
  const first=open.findIndex(Boolean),away=walk(open,W,first).distance;
  let centre=-1,best=-1;
  for(let i=0;i<open.length;i++) if(dist[i]>=2 && !protectedCells.has(i)){
    const score=dist[i]*open.length+away[i];if(score>best){centre=i;best=score;}
  }
  if(centre<0)return {deep:[],shallow:[]};
  const wet=new Set(Array.from(walk(open,W,centre).cells).slice(0,budget));
  const candidates=[...wet].filter(i=>!protectedCells.has(i) && [i-W,i+1,i+W,i-1].every(j=>wet.has(j)));
  // Remove the basin in one pass. Join any stranded land by the shortest
  // shallow causeway through the original floor, never by digging new rock.
  const original=open.slice();
  for(const i of candidates)open[i]=0;
  const parts=regions(open,W),parent=new Int32Array(open.length).fill(-1);
  const owner=new Int32Array(open.length).fill(-1),leaders=parts.map((_,id)=>id),queue=[];
  const leader=id=>{while(leaders[id]!==id){leaders[id]=leaders[leaders[id]];id=leaders[id];}return id;};
  parts.forEach((cells,id)=>{for(const i of cells){owner[i]=id;parent[i]=i;queue.push(i);}});
  let remaining=parts.length;
  // Simultaneous fronts from all banks form a minimum-length spanning forest.
  // Their meeting paths restore only the shallow crossings actually needed.
  for(let n=0;n<queue.length && remaining>1;n++){
    const i=queue[n];
    for(const j of [i-W,i+1,i+W,i-1])if(original[j]){
      if(owner[j]<0){owner[j]=owner[i];parent[j]=i;queue.push(j);}
      else{
        const a=leader(owner[i]),b=leader(owner[j]);
        if(a!==b){
          leaders[b]=a;remaining--;
          for(const start of [i,j])for(let k=start;!open[k];k=parent[k])open[k]=1;
        }
      }
    }
  }
  const deep=candidates.filter(i=>!open[i]);
  const shallow=new Set();
  for(const i of deep)for(const j of [i-W,i+1,i+W,i-1])if(open[j] && !protectedCells.has(j))shallow.add(j);
  return {deep,shallow:[...shallow].sort((a,b)=>a-b)};
}
function divide(open,W,H,wet,preset){
  const dist=clearance(open,W,H),dry=[];
  for(let i=0;i<open.length;i++)if(open[i] && !wet.has(i))dry.push(i);
  dry.sort((a,b)=>dist[b]-dist[a] || a-b);
  const seeds=[],spacing=preset==='warren'?6:preset==='hall'?12:9;
  const cap=Math.max(preset==='warren'?6:3,Math.round((W-4)*(H-4)/3136*(preset==='warren'?18:preset==='hall'?6:10)));
  for(const i of dry) if(seeds.length<cap && dist[i]>=2 && seeds.every(j=>Math.abs(i%W-j%W)+Math.abs(Math.floor(i/W)-Math.floor(j/W))>=spacing))seeds.push(i);
  const minimum=preset==='warren'?6:preset==='hall'?3:1;
  // Thin maps may have no broad maxima: farthest-point sampling keeps centres dry.
  while(seeds.length<minimum && seeds.length<dry.length){
    let pick=dry[0],best=-1;
    for(const i of dry){const gap=seeds.length?Math.min(...seeds.map(j=>Math.abs(i%W-j%W)+Math.abs(Math.floor(i/W)-Math.floor(j/W)))):dist[i];if(gap>best){best=gap;pick=i;}}
    if(seeds.includes(pick))break;seeds.push(pick);
  }
  const chamberIds=new Int32Array(open.length).fill(-1),buckets=[seeds.slice()];
  seeds.forEach((i,id)=>{chamberIds[i]=id;});
  // Multi-source weighted growth: necks cost more to cross than broad floor.
  // Equal starting costs prevent a high peak from swallowing a smaller chamber.
  for(let cost=0;cost<buckets.length;cost++){
    const bucket=buckets[cost];if(!bucket)continue;
    for(let n=0;n<bucket.length;n++){
      const i=bucket[n];
      for(const j of [i-W,i+1,i+W,i-1])if(open[j] && chamberIds[j]<0){
        chamberIds[j]=chamberIds[i];
        const next=cost+1+Math.floor(12/(dist[j]*dist[j]));
        (buckets[next] ||= []).push(j);
      }
    }
  }
  const groups=seeds.map(()=>[]);
  for(let i=0;i<open.length;i++)if(open[i])groups[chamberIds[i]].push(i);
  const chambers=groups.map((cells,id)=>{
    let x=W,y=H,right=0,bottom=0;
    for(const i of cells){x=Math.min(x,i%W);right=Math.max(right,i%W);y=Math.min(y,Math.floor(i/W));bottom=Math.max(bottom,Math.floor(i/W));}
    let middle=seeds[id],best=Infinity;
    for(const i of cells)if(!wet.has(i)){const score=(i%W-(x+right)/2)**2+(Math.floor(i/W)-(y+bottom)/2)**2;if(score<best){best=score;middle=i;}}
    return {id,x,y,w:right-x+1,h:bottom-y+1,cx:middle%W,cy:Math.floor(middle/W),size:cells.length};
  });
  const boundaries=new Map();
  for(let i=0;i<open.length;i++)if(open[i])for(const j of [i+1,i+W])if(open[j] && chamberIds[i]!==chamberIds[j]){
    const a=chamberIds[i],b=chamberIds[j],key=a<b?`${a}:${b}`:`${b}:${a}`,old=boundaries.get(key),candidate=dist[i]<=dist[j]?i:j;
    if(old===undefined || dist[candidate]<dist[old])boundaries.set(key,candidate);
  }
  return {chambers,chamberIds,necks:[...new Set(boundaries.values())].sort((a,b)=>a-b)};
}

/** Organic 5-foot grid. Dimensions are whole numbers >=16 (at most 256 each).
 * chamberIds is the membership raster: -1 off the walkable map, otherwise an id.
 * Keep it with the result when serialising; chamber bounding boxes may overlap.
 */
export function cavern(W,H,opts={}){
  if(!Number.isInteger(W)||!Number.isInteger(H)||W<16||H<16||W>256||H>256)throw new RangeError('Cavern dimensions must be 16–256');
  if(!opts || typeof opts!=='object' || Array.isArray(opts))throw new TypeError('Expected cavern options');
  if(opts.preset!==undefined && !Object.hasOwn(PRESETS,opts.preset))throw new RangeError('Unknown cavern preset');
  const o={seed:'barovia',fill:.46,steps:5,minChamber:12,lake:.2,chasm:false,...PRESETS[opts.preset],...opts};
  if(typeof o.seed!=='string' || !Number.isFinite(o.fill)||o.fill<.42||o.fill>.5 || !Number.isInteger(o.steps)||o.steps<4||o.steps>6 || !Number.isInteger(o.minChamber)||o.minChamber<1 || !Number.isFinite(o.lake)||o.lake<0||o.lake>1 || typeof o.chasm!=='boolean')throw new RangeError('Invalid cavern options');
  const rng=random(o.seed);let open;
  // Reroll unusually sparse/dense automata; adjust the fill only on fallback passes.
  for(let attempt=0;attempt<24;attempt++){
    open=grow(W,H,{...o,fill:attempt<8?o.fill:.46},rng);
    const fraction=count(open)/((W-4)*(H-4));
    if(fraction>=.4 && fraction<=.68)break;
  }
  const crossing=o.chasm?cut(open,W,H,rng):{chasm:[],bridge:[]};
  const protectedCells=new Set(crossing.bridge.flatMap(i=>[i,i-1,i+1,i-W,i+W]));
  const wet=water(open,W,H,o.lake,protectedCells),waterCells=new Set([...wet.deep,...wet.shallow,...crossing.bridge]);
  const dry=i=>open[i] && !waterCells.has(i);
  const farDry=(start,accept=()=>true)=>{
    const {distance,cells}=walk(open,W,start);let best=start;
    for(const i of cells)if(dry(i) && accept(i) && (!dry(best)||!accept(best)||distance[i]>distance[best]))best=i;
    return best;
  };
  let a=farDry(open.findIndex(Boolean)),b=farDry(a);
  if(crossing.bridge.length){
    const x=crossing.bridge[0]%W;
    a=farDry(crossing.bridge[0],i=>i%W<x);b=farDry(a,i=>i%W>x);
  }
  return {W,H,open,...wet,...crossing,...divide(open,W,H,waterCells,o.preset),up:point(a,W),down:point(b,W)};
}
export function chamberAt(c,x,y){
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=c.W||y>=c.H||!c.open[y*c.W+x])return null;
  return c.chambers[c.chamberIds[y*c.W+x]] ?? null;
}
export function toAscii(c){
  const chars=Array.from(c.open,v=>v?'.':'#');
  for(const [key,char] of [['deep','~'],['shallow',','],['chasm','_'],['bridge','=']])for(const i of c[key])chars[i]=char;
  chars[c.up.y*c.W+c.up.x]='<';chars[c.down.y*c.W+c.down.x]='>';
  return Array.from({length:c.H},(_,y)=>chars.slice(y*c.W,(y+1)*c.W).join('')).join('\n');
}
