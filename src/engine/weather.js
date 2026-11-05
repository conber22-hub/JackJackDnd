/* Stateless calendar weather. The caller supplies the campaign seed, day, hour and Gaze.
   groundLine() adapts the lying ground to the existing renderer; line describes the sky.
   Keep those separate when wiring the desk, travel, precipitation and player snapshots. */
import { KINDS, SEASONS, FRONT_PATHS, LINES, GAZE_SIGNS } from '../data/weather.js';

const BY_ID=Object.fromEntries(KINDS.map(k=>[k.id,k])), ORDER=['autumn','winter','spring','summer'];
const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const smooth=t=>t*t*(3-2*t);
function hash(value){
  let h=2166136261;
  for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
  return h>>>0;
}
function mulberry32(seed){
  return ()=>{
    let t=seed+=0x6d2b79f5;
    t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
// Separate streams keep descriptions and fog from changing the sequence of fronts.
const random=(seed,index,salt)=>mulberry32((seed^Math.imul(index,0x9e3779b1)^salt)>>>0);
const seasonAt=(day,override)=>override || ORDER[Math.floor((day-1)/91)%4];
function options({seed='barovia',season=null,gaze=1,hour=12}={}){
  if(season!==null && !Object.hasOwn(SEASONS,season)) throw new RangeError('Unknown weather season');
  if(!Number.isFinite(gaze) || gaze<1 || gaze>10) throw new RangeError('Gaze must be between 1 and 10');
  if(!Number.isInteger(hour) || hour<0 || hour>23) throw new RangeError('Hour must be 0–23');
  return {seed:hash(seed),season,gaze,hour,windows:new Map()};
}
function checkDay(day){ if(!Number.isSafeInteger(day) || day<1) throw new RangeError('Day must be a positive whole number'); }

function front(day,ctx){
  const index=Math.floor((day-1)/13), offset=(day-1)%13;
  let plan=ctx.windows.get(index);
  if(!plan){
    const season=seasonAt(index*13+1,ctx.season), rng=random(ctx.seed,index,0x51f15e), weights=SEASONS[season].weights;
    let roll=rng()*Object.values(weights).reduce((a,b)=>a+b,0), peak='overcast';
    for(const [kind,weight] of Object.entries(weights)){roll-=weight;if(roll<0){peak=kind;break;}}
    // The Count replaces fair breaks with fog; changes occur for a whole spell, never mid-front.
    if(ctx.gaze>=6 && ['clear-cold','frost','dry-thunder'].includes(peak) && rng()<(ctx.gaze-5)/5) peak='thick-fog';
    const lengths=[2,2,2,2];
    for(let n=0;n<5;n++){
      const slots=[0,1,2,3].filter(i=>lengths[i]<5);lengths[slots[Math.floor(rng()*slots.length)]]++;
    }
    plan={kinds:['overcast',...FRONT_PATHS[peak]],lengths};ctx.windows.set(index,plan);
  }
  let left=offset;
  for(let i=0;i<4;i++){if(left<plan.lengths[i])return plan.kinds[i];left-=plan.lengths[i];}
}
function temperature(day,kind,ctx){
  const [lo,hi]=SEASONS[seasonAt(day,ctx.season)].temperature;
  const at=(day-1)/9, n=Math.floor(at), t=smooth(at-n);
  const a=random(ctx.seed,n,0x7e39)(),b=random(ctx.seed,n+1,0x7e39)();
  let c=lo+(hi-lo)*(a+(b-a)*t);
  if(kind==='snow' || kind==='blizzard') c=Math.min(c,-2);
  if(kind==='sleet') c=clamp(c,-1,2);
  if(kind==='frost') c=Math.min(c,0);
  if(kind==='clear-cold') c=Math.min(c,5);
  // Liquid rain cannot fall at the unmodified bitter winter temperature.
  if(BY_ID[kind].wet>=.35 && kind!=='sleet') c=Math.max(c,2);
  return c;
}
function groundFor(day,ctx){
  let snow=0,wet=0;
  // Fixed 24-day memory, independent of the campaign's age. Cold cover decays slowly;
  // a mild spell melts it in at most five days. No mutable cross-call weather cache.
  for(let d=Math.max(1,day-23);d<=day;d++){
    const kind=front(d,ctx),k=BY_ID[kind],c=temperature(d,kind,ctx),before=snow;
    snow=clamp(snow*(c<=0?.86:.72)+k.snow*.32-(c>=8?.22:c>0?.1:.005));
    wet=clamp(Math.max(k.wet,wet*.55,Math.max(0,before-snow)*.75));
  }
  return {snow,wet};
}

export function weatherFor(day,opts={}){
  checkDay(day);const ctx=options(opts),{seed,hour,gaze}=ctx;
  let kind=front(day,ctx);
  const morning=random(seed,day,0xf069),fogChance=hour<9?.8:Math.max(0,(12-hour)*.2);
  if(['overcast','clear-cold','frost','low-fog','mist','drizzle','dry-thunder'].includes(kind) && morning()<fogChance) kind=morning()<.55?'low-fog':'mist';
  const k=BY_ID[kind],c=temperature(day,kind,ctx),temp=c<-4?'bitter':c<4?'cold':c<10?'cool':'mild';
  const ground=groundFor(day,ctx),roll=random(seed,day,0x1e77e2);
  const lines=LINES[kind];let line=lines[Math.floor(roll()*lines.length)];
  if(gaze>=4 && roll()<(gaze-3)*.1){
    const signs=GAZE_SIGNS.filter(s=>s.min<=gaze && s.min>=Math.max(4,Math.floor(gaze)-2));
    line=line.replace(/[.!?]$/,'')+'; '+signs[Math.floor(roll()*signs.length)].line+'.';
  }
  const wind=kind==='storm' || kind==='blizzard'?3:kind==='downpour'?2:kind.includes('fog')?0:Math.floor(random(seed,Math.floor((day-1)/3),0x71ad)()*3);
  return {
    day,hour,season:seasonAt(day,ctx.season),kind,label:k.label,temp,wind,line,sight:k.sight,
    obscured:k.sight<30?'heavy':k.sight<300?'light':'none',
    travel:Math.min(k.travel,ground.snow>=.65?.5:ground.snow>=.25?.75:1,ground.wet>=.75?.75:1),
    light:k.light*(gaze>=6?1-(gaze-5)*.045:1),ground,
  };
}

export function forecast(day,n,opts={}){
  checkDay(day);
  if(!Number.isSafeInteger(n) || n<0 || !Number.isSafeInteger(day+n)) throw new RangeError('Forecast length must be a non-negative whole number');
  return Array.from({length:n},(_,i)=>weatherFor(day+i,{...opts,hour:12}));
}
export function groundLine(w){
  const {snow,wet}=w.ground;
  if(snow>=.7)return 'heavy snow';
  if(snow>=.08)return 'snow';
  if(w.kind==='frost' || (['bitter','cold'].includes(w.temp) && wet>=.12 && !BY_ID[w.kind]?.wet))return 'frost';
  if(wet>=.75)return 'heavy rain';
  return wet>=.18?'rain':'';
}
export function describe(w){
  const wind=['still','a light breeze','a brisk wind','a gale'][w.wind];
  const sight=w.obscured==='heavy'?`heavily obscured beyond ${w.sight} ft`:w.obscured==='light'?`lightly obscured beyond ${w.sight} ft`:`sight ${w.sight} ft`;
  const pace=w.travel===1?'normal travel pace':w.travel===.5?'travel at half speed':`travel at ${Math.round(w.travel*100)}% speed`;
  const ground=groundLine(w),underfoot=ground.includes('snow')?`; ${ground} underfoot`:w.ground.wet>=.18?'; wet ground':ground==='frost'?'; frost underfoot':'';
  return `${w.label}, ${w.temp}, ${wind}: ${sight}; ${pace}${underfoot}.`;
}
