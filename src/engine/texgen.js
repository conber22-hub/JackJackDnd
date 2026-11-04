/* Periodic lattices use x/size, never x/(size-1): opposite texels are neighbours,
   not duplicates. No global RNG or cache; calls own their arrays and seed. */
import { MATERIALS, KINDS } from '../data/materials.js';
export { KINDS };
const clamp = v => Math.max(0,Math.min(1,v));
const wrap = (v,n) => ((v%n)+n)%n;
const smooth = v => {v=clamp(v);return v*v*(3-2*v);};
const mix = (a,b,t) => a+(b-a)*t;
function rngFor(seed){
  let a=seed|0;
  return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
}
function sizeOf(size){if(!Number.isInteger(size) || size<1) throw new RangeError('Size must be a positive integer.');return size;}
function count(v){if(!Number.isFinite(v) || v<1) throw new RangeError('Pattern counts must be positive.');return Math.max(1,Math.round(v));}
// Rectangular periodic value lattice also supplies grain stretched along boards.
function noise(size,nx,ny,seed){
  const rng=rngFor(seed),grid=Float32Array.from({length:nx*ny},rng),out=new Float32Array(size*size);
  for(let y=0;y<size;y++){
    const v=y*ny/size,iy=Math.floor(v),ty=smooth(v-iy),r0=iy*nx,r1=((iy+1)%ny)*nx;
    for(let x=0;x<size;x++){
      const u=x*nx/size,ix=Math.floor(u),tx=smooth(u-ix),jx=(ix+1)%nx;
      out[y*size+x]=mix(mix(grid[r0+ix],grid[r0+jx],tx),mix(grid[r1+ix],grid[r1+jx],tx),ty);
    }
  }
  return out;
}
export function valueNoise(size,{freq=4,seed=1}={}){
  sizeOf(size);const n=count(freq);return noise(size,n,n,seed);
}
export function fbm(size,{freq=4,octaves=4,gain=.5,lacunarity=2,seed=1}={}){
  sizeOf(size);count(freq);count(octaves);
  if(!Number.isFinite(gain) || gain<0 || !Number.isFinite(lacunarity) || lacunarity<1) throw new RangeError('Invalid octave parameters.');
  const out=new Float32Array(size*size);let amplitude=1,total=0;
  for(let o=0;o<Math.round(octaves);o++){
    const layer=valueNoise(size,{freq:Math.max(1,Math.round(freq*lacunarity**o)),seed:seed+o*1013});
    for(let i=0;i<out.length;i++) out[i]+=layer[i]*amplitude;
    total+=amplitude;amplitude*=gain;
  }
  for(let i=0;i<out.length;i++) out[i]=clamp(out[i]/total);
  return out;
}
// A jittered feature point in each toroidal cell. Squared distances avoid nine
// square roots per texel; only the nearest two are needed for the edge distance.
function cellsField(size,cells,seed){
  sizeOf(size);const n=count(cells),rng=rngFor(seed),px=new Float32Array(n*n),py=new Float32Array(n*n);
  for(let i=0;i<px.length;i++){px[i]=.2+rng()*.6;py[i]=.2+rng()*.6;}
  const f1=new Float32Array(size*size),edge=new Float32Array(size*size),id=new Int32Array(size*size);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const u=x*n/size+.5,v=y*n/size+.5,cx=Math.floor(u),cy=Math.floor(v);let a=Infinity,b=Infinity,nearest=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      const xx=cx+dx,yy=cy+dy,j=wrap(yy,n)*n+wrap(xx,n),sx=xx+px[j]-u,sy=yy+py[j]-v,d=sx*sx+sy*sy;
      if(d<a){b=a;a=d;nearest=j;}else if(d<b) b=d;
    }
    const i=y*size+x;f1[i]=clamp(Math.sqrt(a)/Math.SQRT2);edge[i]=clamp((Math.sqrt(b)-Math.sqrt(a))/Math.SQRT2);id[i]=nearest;
  }
  return {f1,edge,id};
}
export function worley(size,{cells=5,seed=1,metric='f1'}={}){
  if(!['f1','f2-f1'].includes(metric)) throw new RangeError('Unknown cellular metric.');
  const f=cellsField(size,cells,seed);return metric==='f1'?f.f1:f.edge;
}
export function bricks(size,{rows=8,cols=4,mortar=.08,jitter=.12,seed=1}={}){
  sizeOf(size);rows=count(rows);cols=count(cols);
  const rng=rngFor(seed),levels=Float32Array.from({length:rows*cols},()=>1-clamp(jitter)*rng()),height=new Float32Array(size*size),id=new Int32Array(size*size);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const v=(y+.5)*rows/size,row=Math.floor(v),fy=v-row,u=(x+.5)*cols/size+(row%2)*.5,col=Math.floor(u),fx=u-col,i=y*size+x;
    const j=row*cols+wrap(col,cols),distance=Math.min(fx,1-fx,fy,1-fy);
    id[i]=j;height[i]=levels[j]*smooth((distance-clamp(mortar)*.5)/.09);
  }
  return {height,id};
}
export function stones(size,{cells=5,gap=.12,seed=1}={}){
  const f=cellsField(size,cells,seed),height=new Float32Array(size*size);
  for(let i=0;i<height.length;i++) height[i]=smooth(f.edge[i]/Math.max(.001,gap))*(.88+.12*(1-f.f1[i]));
  return {height,id:f.id};
}
export function planks(size,{boards=6,seed=1}={}){
  sizeOf(size);boards=count(boards);
  const rng=rngFor(seed),offset=Float32Array.from({length:boards},rng),knot=Float32Array.from({length:boards},rng);
  const grain=new Float32Array(size*size),height=new Float32Array(size*size),id=new Int32Array(size*size);
  // Three stretched octaves: fine cross-grain changes, slow along-board fibres.
  for(let o=0;o<3;o++){const layer=noise(size,boards*8*2**o,2*2**o,seed+41+o),weight=2**(-o)/1.75;for(let i=0;i<grain.length;i++) grain[i]+=layer[i]*weight;}
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const u=x*boards/size,board=Math.floor(u),fx=u-board,v=y*2/size+offset[board],end=Math.floor(v),fy=v-end,i=y*size+x;
    const seam=smooth((Math.min(fx,1-fx)-.025)/.06)*smooth((Math.min(fy,1-fy)-.018)/.04);
    const dy=wrap(y/size-knot[board]+.5,1)-.5,r=Math.hypot((fx-.5)*2,dy*24);
    const knotRing=r<1?Math.cos(r*22)*(1-r)*.07:0;
    id[i]=board*2+wrap(end,2);height[i]=clamp(seam*(.8+.16*grain[i]+knotRing));
  }
  return {height,id};
}
export function normalFromHeight(height,size,{strength=2}={}){
  sizeOf(size);if(height.length!==size*size || !Number.isFinite(strength)) throw new RangeError('Invalid height map or strength.');
  const out=new Uint8ClampedArray(size*size*4);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const dx=(height[y*size+(x+1)%size]-height[y*size+wrap(x-1,size)])*strength;
    const dy=(height[((y+1)%size)*size+x]-height[wrap(y-1,size)*size+x])*strength;
    // Array rows run down the image; OpenGL tangent +Y points up it.
    const inv=1/Math.hypot(dx,dy,1),i=(y*size+x)*4;
    out[i]=(-dx*inv*.5+.5)*255;out[i+1]=(dy*inv*.5+.5)*255;out[i+2]=(inv*.5+.5)*255;out[i+3]=255;
  }
  return out;
}
export function makeMaterial(kind,{size=256,seed=1}={}){
  if(!Object.hasOwn(MATERIALS,kind)) throw new RangeError(`Unknown material: ${kind}`);
  sizeOf(size);const r=MATERIALS[kind],n=size*size;
  const detail=fbm(size,{freq:Math.min(16,size),octaves:3,seed:seed+211});
  let shape,id;
  if(r.pattern==='stones') ({height:shape,id}=stones(size,{cells:r.scale,gap:r.gap,seed}));
  else if(r.pattern==='bricks') ({height:shape,id}=bricks(size,{rows:r.rows,cols:r.cols,mortar:r.gap,jitter:.12,seed}));
  else if(r.pattern==='planks') ({height:shape,id}=planks(size,{boards:r.scale,seed}));
  else {
    shape=fbm(size,{freq:r.scale,octaves:4,seed});
    const f=cellsField(size,r.scale,seed+71);
    for(let i=0;i<n;i++){
      if(r.pattern==='rock') shape[i]=clamp(shape[i]*.75+smooth(f.edge[i]/r.gap)*.25);
      if(r.pattern==='dirt') shape[i]=clamp(shape[i]*.8+Math.max(0,1-f.f1[i]*7)*.2);
      if(r.pattern==='mud') shape[i]=smooth(shape[i])*.8+.1;
      if(r.pattern==='plaster') shape[i]=clamp((.6+shape[i]*.4)*smooth(f.edge[i]/r.gap)-Math.max(0,.35-shape[i]));
      if(r.pattern==='snow') shape[i]=.5+(shape[i]-.5)*.25;
      if(r.pattern==='bone') shape[i]=smooth(f.edge[i]/r.gap)*(.45+.55*Math.sqrt(Math.max(0,1-f.f1[i]*2)));
    }
  }
  const rng=rngFor(seed+719),tones=Float32Array.from({length:id?Math.max(r.scale*r.scale || 0,r.rows*r.cols || 0,r.scale*2 || 0)+1:1},()=>rng()-.5);
  const height=new Float32Array(n),albedo=new Uint8ClampedArray(n*4),roughness=new Uint8ClampedArray(n*4),ao=new Uint8ClampedArray(n*4);
  for(let i=0;i<n;i++){
    const face=shape[i],grain=(detail[i]-.5)*r.grain;
    height[i]=clamp((1-r.depth)*.5+r.depth*face+grain);
    const tone=id?tones[id[i]]*.08:0,puddle=r.pattern==='mud'?Math.max(0,.5-face)*.3:0;
    const value=clamp(r.tone+(face-.65)*r.contrast+grain+tone-(1-face)*(r.moss || 0)-puddle);
    const rough=clamp(r.roughness+grain*.5+(1-face)*.06-(r.pattern==='mud'?puddle:0)),occlusion=clamp(.35+.65*face);
    const j=i*4;albedo[j]=clamp(value*1.015)*255;albedo[j+1]=value*255;albedo[j+2]=value*.975*255;albedo[j+3]=255;
    for(let c=0;c<3;c++){roughness[j+c]=rough*255;ao[j+c]=occlusion*255;}
    roughness[j+3]=ao[j+3]=255;
  }
  return {size,albedo,height,normal:normalFromHeight(height,size,{strength:r.normal}),roughness,ao};
}
