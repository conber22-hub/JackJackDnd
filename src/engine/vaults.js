/* Pure proposals for the generator: apply only after a successful stamp, before ordinary dressing.
   The caller owns ids, carve(), shallow-as-rough, and keeping later features/furniture off vault rooms. */
import { VAULTS } from '../data/vaults.js';

export const FOOTPRINTS = {
  longtable:[1,2], bench:[1,2], shelf:[1,2], bookshelf:[1,2], bed:[1,2], rug:[2,3],
  altar:[1,2], pew:[1,2], organ:[2,1], coffin:[1,2], sarcophagus:[1,2], rack:[1,2], well:[2,2], vines:[1,3],
};
const ALLOWED = new Set(('table longtable chair bench stool shelf bookshelf desk wardrobe bed rug chest barrel crate sacks '
  + 'altar pew candelabra statue throne banner armor organ brazier saltline shrine coffin sarcophagus bones gravestone '
  + 'cage rack minecart rails ore beam pillar rubble cobweb fungus puddle well cauldron alchemy bloomgrowth vines').split(' '));
export const KINDS = [...new Set(VAULTS.flatMap(v => Object.values(v.legend).map(p => p.k)))];
const mod4 = n => ((n % 4) + 4) % 4;
const size = p => { const [w,h] = FOOTPRINTS[p.k] || [1,1]; return p.rot % 2 ? [h,w] : [w,h]; };
const inside = (r,x,y) => x >= r.x && x < r.x+r.w && y >= r.y && y < r.y+r.h;
const walk = code => code >= 1 && code <= 4;
const STEPS = [[1,0],[-1,0],[0,1],[0,-1]];
function footprint(p, visit){
  const [w,h] = size(p);
  for(let y=p.y;y<p.y+h;y++) for(let x=p.x;x<p.x+w;x++) if(visit(x,y) === false) return false;
  return true;
}

export function parseVault(v){
  if(!Array.isArray(v?.map) || !v.map.length || typeof v.map[0] !== 'string' || !v.map[0].length) throw new TypeError('A vault needs a non-empty map');
  const w=v.map[0].length, h=v.map.length, cells=[], props=[];
  for(let y=0;y<h;y++){
    const row=v.map[y];
    if(typeof row !== 'string' || row.length !== w) throw new TypeError('Ragged vault rows');
    for(let x=0;x<w;x++){
      const c=row[x];
      if('.#~:_!'.includes(c)){ cells.push(c); continue; }
      const p=v.legend?.[c];
      if(!/^[a-z]$/i.test(c) || !Object.hasOwn(v.legend || {},c) || !ALLOWED.has(p?.k)
        || (p.rot !== undefined && (!Number.isInteger(p.rot) || p.rot < 0 || p.rot > 3))) throw new TypeError(`Unknown vault symbol or prop: ${c}`);
      props.push({ k:p.k, x, y, rot:p.rot ?? 0 }); cells.push('.');
    }
  }
  const occupied=new Set();
  for(const p of props) footprint(p,(x,y)=>{
    const i=y*w+x;
    if(x>=w || y>=h || occupied.has(i) || cells[i] !== '.') throw new TypeError('Prop footprint outside floor, overlapping, or blocking a reserved path');
    occupied.add(i);
  });
  return { id:v.id, w, h, cells, props };
}

export function transformVault(p,{ turn=0, flip=false }={}){
  if(!Number.isInteger(turn)) throw new TypeError('Turn must be a whole quarter turn');
  const t=mod4(turn), w=t%2?p.h:p.w, h=t%2?p.w:p.h;
  const point=(x,y)=>{
    const [a,b]=t===0?[x,y]:t===1?[p.h-1-y,x]:t===2?[p.w-1-x,p.h-1-y]:[y,p.w-1-x];
    return [flip?w-1-a:a,b];
  };
  const cells=new Array(w*h);
  p.cells.forEach((c,i)=>{ const [x,y]=point(i%p.w,Math.floor(i/p.w)); cells[y*w+x]=c; });
  const props=p.props.map(prop=>{
    const [pw,ph]=size(prop), corners=[[prop.x,prop.y],[prop.x+pw-1,prop.y+ph-1]].map(([x,y])=>point(x,y));
    const rot=mod4(prop.rot+t);
    // rot 0 faces west in the VTT: a horizontal reflection exchanges west and east.
    return { k:prop.k, x:Math.min(...corners.map(c=>c[0])), y:Math.min(...corners.map(c=>c[1])), rot:flip?mod4(2-rot):rot };
  });
  return { id:p.id, w, h, cells, props };
}

export const fits = (room,p) => !room.shape && p.w<=room.w && p.h<=room.h;
export function pickVault(room,themeId,rng,{ used=[] }={}){
  if(room.shape) return null;
  const taken=new Set(used), choices=VAULTS.filter(v=>{
    if(taken.has(v.id) || !v.types.includes(room.type) || !(v.themes.includes('*') || v.themes.includes(themeId))) return false;
    const p=parseVault(v); return fits(room,p) || fits(room,{ w:p.h,h:p.w });
  });
  return !choices.length || rng()<.5 ? null : choices[Math.floor(rng()*choices.length)];
}

export function stampVault(f,room,v,rng){
  if(room.shape || room.x<0 || room.y<0 || room.x+room.w>f.W || room.y+room.h>f.H) return null;
  const parsed=parseVault(v), turns=Array.from({length:8},(_,i)=>({turn:i%4,flip:i>=4}));
  for(let i=turns.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [turns[i],turns[j]]=[turns[j],turns[i]]; }
  const required=new Set([room.cy*f.W+room.cx]), existing=new Set([...(f.filled || []),...(f.chasm || [])]);
  for(const p of f.props || []) footprint(p,(x,y)=>{ existing.add(y*f.W+x); });
  for(let y=room.y;y<room.y+room.h;y++) for(let x=room.x;x<room.x+room.w;x++){
    const i=y*f.W+x;
    if(f.grid[i]===3 || f.grid[i]===4) required.add(i);
    if(STEPS.some(([dx,dy])=>{
      const nx=x+dx,ny=y+dy;
      return !inside(room,nx,ny) && nx>=0 && ny>=0 && nx<f.W && ny<f.H && walk(f.grid[ny*f.W+nx]);
    })) required.add(i);
  }
  for(const s of [f.up,f.down]) if(s && inside(room,s.x,s.y)) required.add(s.y*f.W+s.x);
  for(const orient of turns){
    const p=transformVault(parsed,orient); if(!fits(room,p)) continue;
    for(let oy=room.y;oy<=room.y+room.h-p.h;oy++) for(let ox=room.x;ox<=room.x+room.w-p.w;ox++){
      const out={ id:v.id, filled:[], shallow:[], rough:[], chasm:[], props:p.props.map(q=>({...q,x:q.x+ox,y:q.y+oy})), read:v.read };
      const blocked=new Set(existing), reserved=new Set(), changed=new Set(); let valid=true;
      for(let y=0;y<p.h && valid;y++) for(let x=0;x<p.w;x++){
        const c=p.cells[y*p.w+x], i=(y+oy)*f.W+x+ox;
        if(c==='!') reserved.add(i);
        const key=({'#':'filled','~':'shallow',':':'rough','_':'chasm'})[c];
        if(!key) continue;
        // Filling also requires real floor: it must never erase a tunnel or a stair tile.
        if(f.grid[i]!==1 || existing.has(i)){ valid=false; break; }
        out[key].push(i); changed.add(i);
        if(c==='#' || c==='_') blocked.add(i);
      }
      if(!valid) continue;
      for(const q of out.props){
        if(!footprint(q,(x,y)=>{
          const i=y*f.W+x;
          if(!inside(room,x,y) || f.grid[i]!==1 || blocked.has(i) || changed.has(i) || reserved.has(i)) return false;
          blocked.add(i); return true;
        })){ valid=false; break; }
      }
      if(!valid) continue;
      const open=i=>inside(room,i%f.W,Math.floor(i/f.W)) && walk(f.grid[i]) && !blocked.has(i);
      if([...required,...reserved].some(i=>!open(i))) continue;
      const start=room.cy*f.W+room.cx, seen=new Set([start]), queue=[start];
      for(let n=0;n<queue.length;n++){
        const i=queue[n], x=i%f.W, y=Math.floor(i/f.W);
        for(const [dx,dy] of STEPS){
          const nx=x+dx, ny=y+dy, j=ny*f.W+nx;
          if(!inside(room,nx,ny) || seen.has(j) || !open(j)) continue;
          seen.add(j); queue.push(j);
        }
      }
      if([...required].every(i=>seen.has(i))) return out;
    }
  }
  return null;
}
