/* Deterministic, dependency-free building interiors for Dread Delve. */
import { KINDS, ROOMS, FOOTPRINTS, WALL_PIECES } from '../data/interiors.js';
export { KINDS } from '../data/interiors.js';

const WALL = new Set(WALL_PIECES);
const inRect = (r,x,y) => x>=r.x && y>=r.y && x<r.x+r.w && y<r.y+r.h;
const key = (x,y) => `${x},${y}`;
const choose = (a,rng) => a[Math.floor(rng()*a.length)];
const roll = (rng,low,high) => low+Math.floor(rng()*(high-low+1));
function random(seed){
  let h=2166136261;
  for(const c of seed){h^=c.codePointAt(0);h=Math.imul(h,16777619);}
  return ()=>{let t=h+=0x6D2B79F5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
function shuffle(a,rng){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function footprint(kind,rot){const [w,h]=FOOTPRINTS[kind];return rot%2?[h,w]:[w,h];}
function walkGrid(lay){
  const grid=new Uint8Array(lay.W*lay.H), at=(x,y)=>x>=0&&y>=0&&x<lay.W&&y<lay.H;
  for(const [x,y,w,h] of lay.rooms)for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(at(i,j))grid[j*lay.W+i]=1;
  for(const p of lay.paths){const pts=p.pts;for(let i=0;i+3<pts.length;i+=2){let [x,y,x1,y1]=pts.slice(i,i+4);if(!at(x,y)||!at(x1,y1))continue;
    while(true){if(at(x,y))grid[y*lay.W+x]=1;if(x===x1&&y===y1)break;if(x!==x1)x+=Math.sign(x1-x);else y+=Math.sign(y1-y);}
  }}
  for(const [x,y] of lay.fill||[])if(at(x,y))grid[y*lay.W+x]=0;
  return grid;
}
function backFacesWall(lay,grid,kind,x,y,w,h,rot){
  const isWall=(i,j)=>i<0||j<0||i>=lay.W||j>=lay.H||!grid[j*lay.W+i];
  // Elongated pieces follow the wall along their long edge, not their end.
  const original=FOOTPRINTS[kind],side=original[0]<original[1]
    ? ['west','north','east','south'][rot]
    : ['north','east','south','west'][rot];
  if(side==='north')return Array.from({length:w},(_,i)=>isWall(x+i,y-1)).every(Boolean);
  if(side==='south')return Array.from({length:w},(_,i)=>isWall(x+i,y+h)).every(Boolean);
  if(side==='west')return Array.from({length:h},(_,i)=>isWall(x-1,y+i)).every(Boolean);
  return Array.from({length:h},(_,i)=>isWall(x+w,y+i)).every(Boolean);
}
function splitPlan(insideW,insideH,want,rng,ground){
  const root={x:2,y:2,w:insideW,h:insideH}, leaves=[root];
  for(let n=1;n<want;n++){
    const options=leaves.filter(r=>r.w>=5||r.h>=5);
    if(!options.length)break;
    // Keep carving the largest partition, with a little seeded asymmetry.
    options.sort((a,b)=>b.w*b.h-a.w*a.h);
    const node=options[0],vertical=node.w>=5&&(ground&&n===1||node.h<5||node.w>=node.h*(.85+rng()*.3));
    const axis=vertical?'w':'h',dim=node[axis],cut=roll(rng,Math.max(2,Math.floor(dim*.35)),Math.min(dim-3,Math.floor(dim*.60)));
    if(cut<2||dim-cut-1<2)throw new Error('Invalid binary partition');
    const a={x:node.x,y:node.y,w:node.w,h:node.h},b={x:node.x,y:node.y,w:node.w,h:node.h};
    if(vertical){a.w=cut;b.x=node.x+cut+1;b.w=dim-cut-1;}
    else{a.h=cut;b.y=node.y+cut+1;b.h=dim-cut-1;}
    node.axis=vertical?'v':'h';node.div=vertical?a.x+a.w:a.y+a.h;node.a=a;node.b=b;
    leaves.splice(leaves.indexOf(node),1,a,b);
  }
  return {root,leaves};
}
function descendants(node){return node.a?[...descendants(node.a),...descendants(node.b)]:[node];}
function connectTree(node,paths,doors,rng){
  if(!node.a)return;
  connectTree(node.a,paths,doors,rng);connectTree(node.b,paths,doors,rng);
  const left=descendants(node.a),right=descendants(node.b),options=[];
  for(const a of left)for(const b of right){
    if(node.axis==='v' && a.x+a.w===node.div && b.x===node.div+1){
      const lo=Math.max(a.y,b.y),hi=Math.min(a.y+a.h,b.y+b.h)-1;
      for(let v=lo;v<=hi;v++)options.push({x:node.div,y:v,pts:[node.div-1,v,node.div+1,v]});
    }
    if(node.axis==='h' && a.y+a.h===node.div && b.y===node.div+1){
      const lo=Math.max(a.x,b.x),hi=Math.min(a.x+a.w,b.x+b.w)-1;
      for(let v=lo;v<=hi;v++)options.push({x:v,y:node.div,pts:[v,node.div-1,v,node.div+1]});
    }
  }
  if(!options.length)throw new Error('Partition pieces cannot be joined');
  const p=choose(options,rng);paths.push({w:1,pts:p.pts});doors.push([p.x,p.y,rng()<.10?'open':'closed']);
}
function floorProgramme(cfg,level,area){
  const requested=cfg.programme[level]||cfg.programme.upper||cfg.programme.ground;
  const expanded=requested.flatMap(p=>Array.from({length:p.count||1},()=>({use:p.use,size:p.size||1})));
  const core=expanded.filter(p=>p.use!=='entry'),entry=expanded.find(p=>p.use==='entry');
  // A small cottage does not sprout a dozen unusable closets.
  const cap=Math.max(1,Math.floor(area/11));
  const n=Math.min(expanded.length,cap);
  return [...core.slice(0,n-Number(!!entry)),...(entry?[entry]:[])].slice(0,n);
}
function nameRooms(leaves,programme,level,rng){
  const bySize=leaves.slice().sort((a,b)=>b.w*b.h-a.w*a.h||a.y-b.y||a.x-b.x),uses=programme.slice(),assigned=new Map();
  const entry=level==='ground'?uses.find(p=>p.use==='entry'):null;
  if(entry){uses.splice(uses.indexOf(entry),1);const southern=leaves.filter(r=>r.y+r.h===Math.max(...leaves.map(t=>t.y+t.h)));
    const candidate=southern.filter(r=>r!==bySize[0]).sort((a,b)=>a.w*a.h-b.w*b.h)[0]||southern[0];
    assigned.set(candidate,entry);
  }
  // The principal public room is always the largest non-entrance room.
  uses.sort((a,b)=>b.size-a.size);
  for(const r of bySize)if(!assigned.has(r))assigned.set(r,uses.shift()||{use:'storage'});
  return leaves.map(r=>{const use=assigned.get(r).use,info=ROOMS[use];return {r,use,info,display:choose(info.names,rng),read:choose(info.read,rng)};});
}
function baseFloor(cfg,level,w,h,rng,name){
  const innerW=w*3,innerH=h*3,W=innerW+4,H=innerH+4;
  const programme=floorProgramme(cfg,level,innerW*innerH);
  const {root,leaves}=splitPlan(innerW,innerH,programme.length,rng,level==='ground');
  const described=nameRooms(leaves,programme,level,rng),rooms=described.map(({r,info,display,read})=>[r.x,r.y,r.w,r.h,info.type,display,'',{read}]);
  const layout={name:`${name} — ${level==='upper2'?'high loft':level==='upper'?'upper floor':level==='cellar'?'cellar':'ground floor'}`,W,H,rooms,paths:[],doors:[],props:[],up:null,down:null,exits:{},fill:[]};
  connectTree(root,layout.paths,layout.doors,rng);
  if(level==='ground'){
    const entry=described.find(d=>d.use==='entry')||described.at(-1),r=entry.r;
    if(r.y+r.h!==H-2)throw new Error('Front room must meet south wall');
    const x=r.x+Math.floor((r.w-1)/2),y=H-2;
    layout.paths.push({w:1,pts:[x,y-1,x,y]});layout.doors.push([x,y,'closed']);layout.front=[x,y];
  }
  return {level,layout,described};
}
function reserveDoorways(layout){
  const s=new Set();
  for(const [x,y] of layout.doors){for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])s.add(key(x+dx,y+dy));}
  for(const p of [layout.up,layout.down,layout.out])if(p)s.add(key(...p));
  return s;
}
function place(layout,room,kind,rng,blocked,occupied,grid,opts={}){
  if(!FOOTPRINTS[kind])throw new TypeError(`Unknown furniture: ${kind}`);
  const [rx,ry,rw,rh]=room,locations=[];
  for(let rot=0;rot<4;rot++){
    if(opts.rot!==undefined && rot!==opts.rot)continue;
    const [w,h]=footprint(kind,rot);
    for(let y=ry;y<=ry+rh-h;y++)for(let x=rx;x<=rx+rw-w;x++){
      if(opts.minY!==undefined && y<opts.minY)continue;
      if(opts.maxY!==undefined && y>opts.maxY)continue;
      if(WALL.has(kind)&&!backFacesWall(layout,grid,kind,x,y,w,h,rot))continue;
      let good=true;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(blocked.has(key(xx,yy))||occupied.has(key(xx,yy)))good=false;
      if(good)locations.push({x,y,w,h,rot});
    }
  }
  if(!locations.length)return null;
  // Prefer walls for substantial furniture and the northern dais for an altar.
  const scored=locations.map(p=>({p,score:(opts.north?(-p.y*100):0)+(opts.south?p.y*100:0)+rng()}));
  scored.sort((a,b)=>b.score-a.score);
  const p=scored[0].p;
  layout.props.push([kind,p.x,p.y,p.rot]);
  for(let yy=p.y;yy<p.y+p.h;yy++)for(let xx=p.x;xx<p.x+p.w;xx++)occupied.add(key(xx,yy));
  return p;
}
function furnish(floor,rng){
  const {layout,described}=floor,blocked=reserveDoorways(layout),occupied=new Set(),grid=walkGrid(layout);
  for(let i=0;i<described.length;i++){
    const {use,info}=described[i],room=layout.rooms[i];
    if(use==='nave'){
      const altar=place(layout,room,'altar',rng,blocked,occupied,grid,{north:true,rot:1})||place(layout,room,'altar',rng,blocked,occupied,grid,{north:true});
      if(altar){const minY=altar.y+altar.h+1;for(let k=0;k<3;k++)place(layout,room,'pew',rng,blocked,occupied,grid,{minY,rot:1});}
    }
    for(const item of info.kit){
      if(use==='nave'&&['altar','pew'].includes(item.kind))continue;
      const count=roll(rng,item.min,item.max);
      for(let k=0;k<count;k++)place(layout,room,item.kind,rng,blocked,occupied,grid,{});
    }
  }
}
function commonStair(a,b,rng,forbidden=[]){
  const roomAt=(f,x,y)=>f.layout.rooms.some(r=>inRect({x:r[0],y:r[1],w:r[2],h:r[3]},x,y));
  const bad=new Set([...reserveDoorways(a.layout),...reserveDoorways(b.layout)]);
  for(const p of forbidden)if(p)for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])bad.add(key(p[0]+dx,p[1]+dy));
  const candidates=[];
  for(let y=2;y<a.layout.H-2;y++)for(let x=2;x<a.layout.W-2;x++){
    if(!bad.has(key(x,y))&&roomAt(a,x,y)&&roomAt(b,x,y))candidates.push([x,y]);
  }
  if(!candidates.length){
    // Doorway-adjacent landings are a last resort, but always keep stairs in rooms.
    for(let y=2;y<a.layout.H-2;y++)for(let x=2;x<a.layout.W-2;x++){
      if(roomAt(a,x,y)&&roomAt(b,x,y)&&!forbidden.some(p=>p&&p[0]===x&&p[1]===y))candidates.push([x,y]);
    }
  }
  if(!candidates.length)throw new Error('No shared stair landing');
  // Stairs against the perimeter are easy to read and less likely to interrupt play.
  candidates.sort((p,q)=>{
    const edge=a.layout.W,score=r=>Math.min(r[0]-2,edge-3-r[0])+Math.min(r[1]-2,a.layout.H-3-r[1]);
    return score(p)-score(q);
  });
  const best=candidates.slice(0,Math.min(candidates.length,12));return choose(best,rng);
}

export function interior(kind,{w,h,seed='barovia',floors='all',name=null}={}){
  if(!Object.hasOwn(KINDS,kind))throw new RangeError(`Unknown building kind: ${kind}`);
  if(typeof seed!=='string')throw new TypeError('seed must be a string');
  const cfg=KINDS[kind],rng=random(`${kind}|${seed}|${w??''}|${h??''}|${floors}`);
  const width=w===undefined?roll(rng,...cfg.size.w):w,height=h===undefined?roll(rng,...cfg.size.h):h;
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>40||height>40)throw new RangeError('Outside footprint must be 1–40 squares on each side');
  if(!['all','ground','cellar','upper','upper2'].includes(floors)&&!Number.isInteger(floors))throw new RangeError('Unknown floor selection');
  const title=name??`${choose(['Old','Grey','Weeping','Last','Crooked','Silent'],rng)} ${cfg.label}`;
  const levels=[];
  if(floors==='all'){
    if(rng()<cfg.floors.cellar)levels.push('cellar');
    levels.push('ground');
    const high=rng()<cfg.floors.upper2,up=high||rng()<cfg.floors.upper;
    if(up)levels.push('upper');if(high)levels.push('upper2');
  }else if(typeof floors==='number'){
    if(floors<1||floors>3)throw new RangeError('floors must be 1–3');
    levels.push('ground',...(floors>=2?['upper']:[]),...(floors===3?['upper2']:[]));
  }else if(floors==='upper2')levels.push('ground','upper','upper2');
  else if(floors==='upper')levels.push('ground','upper');
  else if(floors==='cellar')levels.push('cellar','ground');
  else levels.push('ground');
  const generated=levels.map(level=>baseFloor(cfg,level,width,height,rng,title));
  const index=new Map(generated.map(f=>[f.level,f]));
  const ground=index.get('ground');
  if(index.has('cellar')){
    const cellar=index.get('cellar'),stair=commonStair(ground,cellar,rng);
    ground.layout.down=stair.slice();cellar.layout.up=stair.slice();
    ground.layout.out=ground.layout.front.slice();
    ground.layout.exits.down='Down to the cellar';cellar.layout.exits.up='Up to the ground floor';
  }else{
    const entry=ground.described.find(d=>d.use==='entry')||ground.described.at(-1),r=entry.r;
    ground.layout.down=[ground.layout.front[0],r.y+r.h-1];
    ground.layout.exits.down='Out to the street';
  }
  if(index.has('upper')){
    const upper=index.get('upper'),stair=commonStair(ground,upper,rng,[ground.layout.down]);
    ground.layout.up=stair.slice();upper.layout.down=stair.slice();
    ground.layout.exits.up='Up to the upper floor';upper.layout.exits.down='Down to the ground floor';
    if(index.has('upper2')){
      const high=index.get('upper2'),highStair=commonStair(upper,high,rng,[upper.layout.down]);
      upper.layout.up=highStair.slice();high.layout.down=highStair.slice();
      upper.layout.exits.up='Up to the high loft';high.layout.exits.down='Down to the upper floor';
    }
  }
  for(const f of generated)furnish(f,rng);
  // Front-door metadata identifies the outside square without adding unsupported floor structures.
  return {kind,name:title,floors:generated.map(f=>f.layout),order:levels};
}

export function validateLayout(layout){
  const issues=[];
  if(!layout||!Number.isInteger(layout.W)||!Number.isInteger(layout.H)||layout.W<7||layout.H<7)return ['Invalid layout dimensions'];
  const {W,H}=layout,isRoom=new Int32Array(W*H).fill(-1),at=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
  for(let n=0;n<(layout.rooms||[]).length;n++){
    const [x,y,w,h,type]=layout.rooms[n];
    if(![x,y,w,h].every(Number.isInteger)||w<2||h<2){issues.push(`Invalid room ${n}`);continue;}
    if(x<2||y<2||x+w>W-2||y+h>H-2)issues.push(`Room ${n} outside margin`);
    if(!['chamber','entrance','safe','treasure','shrine','crypt'].includes(type))issues.push(`Unknown room type ${n}`);
    for(let yy=Math.max(0,y);yy<Math.min(H,y+h);yy++)for(let xx=Math.max(0,x);xx<Math.min(W,x+w);xx++){
      const k=yy*W+xx;if(isRoom[k]>=0)issues.push(`Rooms overlap at ${xx},${yy}`);isRoom[k]=n;
    }
  }
  for(let i=0;i<layout.rooms.length;i++)for(let j=i+1;j<layout.rooms.length;j++){
    const [ax,ay,aw,ah]=layout.rooms[i],[bx,by,bw,bh]=layout.rooms[j];
    if((ax+aw===bx||bx+bw===ax)&&ay<by+bh&&by<ay+ah ||
       (ay+ah===by||by+bh===ay)&&ax<bx+bw&&bx<ax+aw)issues.push(`Rooms ${i}/${j} touch without a wall`);
  }
  for(const p of layout.paths||[])if(p.w!==1||!Array.isArray(p.pts)||p.pts.length<4||p.pts.length%2)issues.push('Malformed path');
  else for(let k=0;k+3<p.pts.length;k+=2){const [x,y,x1,y1]=p.pts.slice(k,k+4);if(x!==x1&&y!==y1||!at(x,y)||!at(x1,y1))issues.push('Invalid corridor');}
  const walk=walkGrid(layout),doorSet=new Set(),stairs=new Set();
  for(const [x,y,state] of layout.doors||[]){
    if(!at(x,y)||!walk[y*W+x])issues.push(`Door off passage at ${x},${y}`);
    if(!['closed','open','locked'].includes(state))issues.push('Invalid door state');
    if(doorSet.has(key(x,y)))issues.push('Duplicate door');doorSet.add(key(x,y));
  }
  for(const field of ['up','down'])if(layout[field]){
    const [x,y]=layout[field];if(!at(x,y)||isRoom[y*W+x]<0)issues.push(`${field} stairs not on room squares`);
    if(stairs.has(key(x,y)))issues.push('Stairs overlap');stairs.add(key(x,y));
  }
  if(layout.out){const [x,y]=layout.out;if(!at(x,y)||!walk[y*W+x]||!doorSet.has(key(x,y)))issues.push('Outside exit must be on front door');}
  const reserved=new Set();for(const [x,y] of layout.doors||[])for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])reserved.add(key(x+dx,y+dy));
  const occupied=new Set();
  for(const [kind,x,y,rot] of layout.props||[]){
    if(!FOOTPRINTS[kind]||!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(rot)||rot<0||rot>3){issues.push('Invalid furniture');continue;}
    const [fw,fh]=footprint(kind,rot);
    for(let yy=y;yy<y+fh;yy++)for(let xx=x;xx<x+fw;xx++){
      const id=key(xx,yy);
      if(!at(xx,yy)||isRoom[yy*W+xx]<0)issues.push(`${kind} off a room`);
      if(occupied.has(id))issues.push(`Overlapping props at ${id}`);occupied.add(id);
      if(doorSet.has(id)||reserved.has(id)||stairs.has(id))issues.push(`${kind} blocks door or stairs at ${id}`);
    }
    if(WALL.has(kind)&&!backFacesWall(layout,walk,kind,x,y,fw,fh,rot))issues.push(`${kind} is not against a wall`);
  }
  // Closed and locked doors are passable for topology: the adventurers can open them.
  const start=(layout.front||layout.up||layout.down||[layout.rooms[0]?.[0],layout.rooms[0]?.[1]]);
  if(start&&at(...start)&&walk[start[1]*W+start[0]]){
    const seen=new Uint8Array(W*H),q=[start[1]*W+start[0]];seen[q[0]]=1;
    for(let n=0;n<q.length;n++){
      const i=q[n],x=i%W,y=Math.floor(i/W);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;
        if(at(xx,yy)&&walk[yy*W+xx]&&!seen[yy*W+xx]){seen[yy*W+xx]=1;q.push(yy*W+xx);}
      }
    }
    if(q.length!==walk.reduce((s,v)=>s+v,0))issues.push('Unreachable squares');
  }else issues.push('No accessible starting square');
  return [...new Set(issues)];
}
