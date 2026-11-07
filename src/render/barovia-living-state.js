/* The Living Valley II — deterministic environment plans, with zero dependencies or DOM.
   These plans describe VISUAL effects only, never edits to collision or movement rules. */
export const QUALITY = Object.freeze({
  low:    Object.freeze({ fogPatches:14, snowflakes:180,  mossPlantsPerCell:2 }),
  medium: Object.freeze({ fogPatches:32, snowflakes:480,  mossPlantsPerCell:3 }),
  high:   Object.freeze({ fogPatches:58, snowflakes:900,  mossPlantsPerCell:4 }),
});
export const ATMOSPHERES = Object.freeze({
  svalichWoods: Object.freeze({ wind:.35, fog:.55, snow:false, blackwater:false, moss:false, tint:'#aab8c3' }),
  winterForest:Object.freeze({ wind:.60, fog:.28, snow:true,  blackwater:false, moss:false, tint:'#c3ced5' }),
  tserBog:     Object.freeze({ wind:.18, fog:.90, snow:false, blackwater:true,  moss:false, tint:'#a6b8b2' }),
  balinokFoothills:Object.freeze({ wind:.86, fog:.30, snow:true,blackwater:false, moss:false, tint:'#c7d4db' }),
  vallakiOutskirts:Object.freeze({ wind:.28, fog:.50, snow:false,blackwater:false,moss:false,tint:'#b3aea9' }),
  ancientGraves:Object.freeze({ wind:.22, fog:.72, snow:false,blackwater:false,moss:false,tint:'#b2abb7' }),
  hungerMoss: Object.freeze({ wind:.12, fog:.85, snow:false,blackwater:false, moss:true,  tint:'#b1c7b9' }),
});
export function hashSeed(seed) {
  let h=2166136261;
  for(const c of String(seed)){ h^=c.codePointAt(0);h=Math.imul(h,16777619); }
  return h>>>0;
}
export function seeded(seed) {
  let h=hashSeed(seed);
  return ()=>{let t=h=(h+0x6d2b79f5)>>>0;t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
const finite=(n)=>Number.isFinite(n);
function dimensions(width,height){
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>512||height>512)
    throw new RangeError('width and height must be 1–512 whole grid squares');
}
/** Ground mist banks: world-centred positions in grid unit offsets, one plane per bank. */
export function planGroundFog({width,height,seed='barovia',count=32,groundY=0,allowed=()=>true}={}){
  dimensions(width,height);
  if(!Number.isSafeInteger(count)||count<0||count>1000)throw new RangeError('Bad fog count');
  if(!finite(groundY)||typeof allowed!=='function')throw new TypeError('Bad fog configuration');
  const rng=seeded('fog|'+seed+'|'+width+'x'+height),out=[];
  for(let i=0,tries=0;i<count&&tries<count*8+8;tries++){
    const cx=Math.floor(rng()*width),cy=Math.floor(rng()*height);
    if(!allowed(cx,cy))continue;
    const radius=1.4+rng()*3.8;
    out.push({x:cx-(width-1)/2+(rng()-.5)*.5,z:cy-(height-1)/2+(rng()-.5)*.5,
      y:groundY+.08+rng()*.16, radius,stretch:.65+rng()*.8,phase:rng()*6.2831853,opacity:.30+rng()*.42});i++;
  }
  return out;
}
/** Seeded GPU snow points, centred on a given rectangular volume, no movement calculations on CPU. */
export function planSnow({width,height,seed='barovia',count=480,skyHeight=12}={}){
  dimensions(width,height);
  if(!Number.isSafeInteger(count)||count<0||count>5000||!finite(skyHeight)||skyHeight<=0||skyHeight>100)
    throw new RangeError('Bad snow volume');
  const rng=seeded('snow|'+seed+'|'+width+'x'+height),out=[];
  for(let i=0;i<count;i++)out.push({
    x:(rng()-.5)*width,y:rng()*skyHeight,z:(rng()-.5)*height,
    speed:.48+rng()*1.05,size:.7+rng()*.85,phase:rng()*6.2831853,
  });
  return out;
}
/**
 * Hunger Moss expands in deterministic steps through 4-neighbour grid cells.
 * allowed(x,y) MUST deny player routes, stairs, doors and other protected locations.
 * Returns an ordered plan of {x,y,step,variation}. `step` is the first visible growth stage.
 * No gameplay state, damage, terrain flags or passability are changed here.
 */
export function planHungerMoss({width,height,seed='barovia',origins=[],maxSteps=12,maxCells=140,
    allowed=()=>true}={}){
  dimensions(width,height);
  if(!Array.isArray(origins)||!Number.isSafeInteger(maxSteps)||maxSteps<0||maxSteps>100 ||
      !Number.isSafeInteger(maxCells)||maxCells<0||maxCells>5000 || typeof allowed!=='function')
    throw new TypeError('Bad Hunger Moss configuration');
  const key=(x,y)=>y*width+x,dist=new Map(),queue=[],out=[];
  const push=(x,y,step)=>{
    if(x<0||y<0||x>=width||y>=height||step>maxSteps||!allowed(x,y))return;
    const k=key(x,y),old=dist.get(k);
    if(old!==undefined&&old<=step)return;
    dist.set(k,step);
    // Deliberately not random per draw call: hash controls ties regardless of traversal order.
    queue.push({x,y,step,variation:hashSeed(`${seed}|${x}|${y}`)%997});
  };
  for(const p of origins){
    if(!p||!Number.isSafeInteger(p.x)||!Number.isSafeInteger(p.y))throw new TypeError('Invalid moss origin');
    push(p.x,p.y,0);
  }
  const dir=[[0,1],[1,0],[0,-1],[-1,0]];
  while(queue.length&&out.length<maxCells){
    queue.sort((a,b)=>b.step-a.step||b.variation-a.variation||b.y-a.y||b.x-a.x);
    const cell=queue.pop();
    if(dist.get(key(cell.x,cell.y))!==cell.step)continue;
    out.push(cell);
    // Stagger arrival to prevent a perfect growing diamond.
    for(const [dx,dy] of dir){const x=cell.x+dx,y=cell.y+dy;
      const delay=1+Number(hashSeed(`${seed}|delay|${x}|${y}`)%4===0);
      push(x,y,cell.step+delay);
    }
  }
  return out;
}
export function mossAtStep(plan,step){
  if(!finite(step)||step<0)throw new RangeError('Bad Hunger Moss step');
  return plan.filter(c=>c.step<=step);
}
