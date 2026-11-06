import { KINDS, RIDDLES, SYMBOLS, CLUES, FAIL } from '../data/puzzles.js';
export { KINDS } from '../data/puzzles.js';

const copy=value=>JSON.parse(JSON.stringify(value));
const ordinal=['first','second','third','fourth','fifth','sixth'];
const directions=['N','E','S','W'];
function random(seed){
  let h=2166136261;for(const c of seed){h^=c.codePointAt(0);h=Math.imul(h,16777619);}
  return ()=>{let t=h+=0x6d2b79f5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
function shuffle(values,rng){const a=values.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const normal=value=>value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').trim().replace(/\s+/g,' ').replace(/^(a|an|the) /,'');
const template=(text,values)=>text.replace(/\{(\w+)\}/g,(_,key)=>values[key]);
const indexed=(i,a)=>Number.isInteger(i) && i>=0 && i<a.length;
function turn(positions,i){for(const j of [i-1,i,i+1])if(j>=0 && j<positions.length)positions[j]=directions[(directions.indexOf(positions[j])+1)%4];}
function flip(grid,x,y){grid[y]=grid[y].slice(0,x)+(grid[y][x]==='/'?'\\':'/')+grid[y].slice(x+1);}
function cell(grid,x,y,value){grid[y]=grid[y].slice(0,x)+value+grid[y].slice(x+1);}

/** grid: equal-length strings using . # / \\ T; entry is immediately outside the
 * grid with cardinal dx/dy pointing inwards. path includes the stopping cell;
 * end.reason is target, wall, exit, loop or invalid. No mutation, even on loops.
 */
export function beamPath(grid,entry){
  const invalid={path:[],end:{reason:'invalid'}};
  if(!Array.isArray(grid)||!grid.length||typeof grid[0]!=='string'||!grid[0].length||!grid.every(row=>typeof row==='string' && row.length===grid[0].length && /^[.#/\\T]+$/.test(row)))return invalid;
  if(!entry || !['x','y','dx','dy'].every(k=>Number.isInteger(entry[k])) || Math.abs(entry.dx)+Math.abs(entry.dy)!==1)return invalid;
  const H=grid.length,W=grid[0].length;let {x,y,dx,dy}=entry;
  if(!((x===-1 && dx===1 && y>=0 && y<H)||(x===W && dx===-1 && y>=0 && y<H)||(y===-1 && dy===1 && x>=0 && x<W)||(y===H && dy===-1 && x>=0 && x<W)))return invalid;
  const path=[],seen=new Set();
  for(;;){
    x+=dx;y+=dy;
    if(x<0||y<0||x>=W||y>=H)return {path,end:{x,y,reason:'exit'}};
    const key=`${x},${y},${dx},${dy}`;
    if(seen.has(key))return {path,end:{x,y,reason:'loop'}};
    seen.add(key);path.push({x,y});const tile=grid[y][x];
    if(tile==='#'||tile==='T')return {path,end:{x,y,reason:tile==='T'?'target':'wall'}};
    if(tile==='/')[dx,dy]=[-dy,-dx];else if(tile==='\\')[dx,dy]=[dy,dx];
  }
}
function mirrors(s,rng){
  const n=s.difficulty+4,edge=n-2,mid=Math.floor(n/2);
  s.grid=Array.from({length:n},()=>'.'.repeat(n));s.entry={x:-1,y:1,dx:1,dy:0};
  const panes=[{x:edge,y:1,face:'\\'},{x:edge,y:edge,face:'/'}];
  s.target=s.difficulty===1?{x:0,y:edge}:s.difficulty===2?{x:1,y:0}:{x:n-1,y:mid};
  if(s.difficulty>=2)panes.push({x:1,y:edge,face:'\\'});
  if(s.difficulty===3)panes.push({x:1,y:mid,face:'/'});
  for(const p of panes)cell(s.grid,p.x,p.y,p.face);
  cell(s.grid,s.target.x,s.target.y,'T');
  const route=new Set(beamPath(s.grid,s.entry).path.map(p=>`${p.x},${p.y}`));
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(!route.has(`${x},${y}`) && rng()<.3)cell(s.grid,x,y,'#');
  // First pane is always wrong, so the initial beam cannot reach the target.
  s.secret.panes=panes;s.secret.solution=[];
  panes.forEach((p,i)=>{if(i===0||rng()<.5){flip(s.grid,p.x,p.y);s.secret.solution.push({type:'rotate',x:p.x,y:p.y});}});
  s.clues=['Give the borrowed light to the eye. Silver panes turn; stone does not.'];
}

/** All indices are zero-based. Dial actions use symbol ids (e.g. "moon").
 * secret.solution is an action list that solves the freshly generated puzzle.
 * Keep authoritative states on the DM; transmit only view(state). In particular,
 * never transmit seed: it would let a client regenerate the secret.
 */
export function makePuzzle(kind,{seed='barovia',difficulty=2}={}){
  if(!KINDS.some(k=>k.id===kind))throw new RangeError('Unknown puzzle kind');
  if(typeof seed!=='string'||![1,2,3].includes(difficulty))throw new RangeError('Invalid puzzle options');
  const rng=random(`${seed}:${kind}:${difficulty}`),s={kind,seed,difficulty,solved:false,moves:0,fails:0,secret:{solution:[]}};
  const n=difficulty+2;
  if(kind==='levers'){
    s.levers=Array.from({length:difficulty===3?6:n},(_,i)=>`Bell ${i+1}`);s.pulled=[];
    const order=shuffle(s.levers.map((_,i)=>i),rng);s.secret.order=order;
    s.secret.solution=order.map(lever=>({type:'pull',lever}));
    s.clues=order.map((lever,i)=>template(CLUES.levers[i%CLUES.levers.length],{step:ordinal[i],lever:ordinal[lever]}));
  }else if(kind==='statues'){
    s.positions=Array(n).fill('N');s.altar='N';const moves=[];
    for(let k=0;k<n*2;k++){const i=Math.floor(rng()*n);turn(s.positions,i);moves.push(i);}
    if(s.positions.every(p=>p==='N')){turn(s.positions,0);moves.push(0);}
    const undo=moves.reverse().flatMap(statue=>Array.from({length:3},()=>({type:'turn',statue}))),probe=s.positions.slice();
    for(const action of undo){s.secret.solution.push(action);turn(probe,action.statue);if(probe.every(p=>p==='N'))break;}
    s.clues=['Let every mourner face the northern altar. Turning one turns its immediate neighbours a quarter-turn clockwise.'];
  }else if(kind==='dials'){
    s.symbols=copy(shuffle(SYMBOLS,rng).slice(0,6));
    const combination=Array.from({length:difficulty===1?3:4},()=>s.symbols[Math.floor(rng()*6)].id);
    s.secret.combination=combination;s.dials=combination.map(()=>s.symbols[Math.floor(rng()*6)].id);
    if(s.dials.every((v,i)=>v===combination[i]))s.dials[0]=s.symbols.find(v=>v.id!==combination[0]).id;
    s.clues=combination.map((id,i)=>template(CLUES.dial,{position:ordinal[i],omen:CLUES.dials[id]}));
    s.secret.solution=[...combination.map((symbol,dial)=>({type:'set',dial,symbol})),{type:'check'}];
  }else if(kind==='riddle'){
    const r=RIDDLES[Math.floor(rng()*RIDDLES.length)];s.question=r.text;s.clues=[r.text];
    s.secret.answer=r.answer;s.secret.also=r.also.slice();s.secret.riddleHint=r.hint;
    s.secret.solution=[{type:'answer',text:r.answer}];
  }else if(kind==='mirrors')mirrors(s,rng);
  else{
    const names=['Iron raven','Stone tear','Wax saint','Brass thorn','Bone crown','Silver moth','Lead rose'];
    s.items=names.slice(0,n+2).map((name,id)=>({id,name}));s.pan=[];
    const weights=s.items.map(()=>1+Math.floor(rng()*9)),subset=shuffle(s.items.map(i=>i.id),rng).slice(0,difficulty+1);
    s.secret.weights=weights;s.secret.subset=subset;s.target=subset.reduce((sum,i)=>sum+weights[i],0);
    s.secret.solution=[...subset.map(item=>({type:'place',item})),{type:'check'}];
    s.clues=[`The tribute must weigh exactly ${s.target} marks. The needle shows the weight on the pan; each gift may be weighed alone.`];
  }
  return s;
}
function failure(s,reset=false){
  s.fails++;const choices=FAIL[s.difficulty],trap=choices[(s.fails-1)%choices.length];
  if(trap!=='none'){s.lastTrap=trap;return {state:s,event:'trap',text:`The mechanism protests; ${trap==='alarm'?'an alarm sounds':`the ${trap} trap springs`}.`};}
  return {state:s,event:reset?'reset':'wrong',text:reset?'The bells grind to silence. Every lever rises again.':'The seal refuses the offering. Try again.'};
}
export function act(state,action){
  const invalid=()=>({state,event:'invalid',text:'The mechanism does not accept that move.'});
  if(!state || state.solved || !action || typeof action!=='object' || Array.isArray(action))return invalid();
  const a=action,k=state.kind;
  const valid=k==='levers'?a.type==='pull' && indexed(a.lever,state.levers):
    k==='statues'?a.type==='turn' && indexed(a.statue,state.positions):
    k==='dials'?(a.type==='check'||a.type==='set' && indexed(a.dial,state.dials) && state.symbols.some(v=>v.id===a.symbol)):
    k==='riddle'?a.type==='answer' && typeof a.text==='string' && a.text.length<=500 && normal(a.text).length>0:
    k==='mirrors'?a.type==='rotate' && Number.isInteger(a.x) && Number.isInteger(a.y) && a.y>=0 && a.y<state.grid.length && a.x>=0 && a.x<state.grid[0].length && '/\\'.includes(state.grid[a.y][a.x]):
    k==='weights'?(a.type==='check'||['place','remove'].includes(a.type) && indexed(a.item,state.items) && (a.type==='place'?!state.pan.includes(a.item):state.pan.includes(a.item))):false;
  if(!valid)return invalid();
  const s=copy(state);s.moves++;delete s.lastTrap;
  let solved=false,text='The mechanism shifts beneath your hand.';
  if(k==='levers'){
    if(a.lever!==s.secret.order[s.pulled.length]){s.pulled=[];return failure(s,true);}
    s.pulled.push(a.lever);solved=s.pulled.length===s.levers.length;text=`The ${ordinal[a.lever]} bell sounds below the floor.`;
  }else if(k==='statues'){
    turn(s.positions,a.statue);solved=s.positions.every(v=>v===s.altar);text='The mourner and its neighbours turn with a scrape of stone.';
  }else if(k==='dials'){
    if(a.type==='set'){s.dials[a.dial]=a.symbol;text='The dial clicks into place.';}
    else {solved=s.dials.every((v,i)=>v===s.secret.combination[i]);if(!solved)return failure(s);}
  }else if(k==='riddle'){
    solved=[s.secret.answer,...s.secret.also].some(v=>normal(v)===normal(a.text));if(!solved)return failure(s);
  }else if(k==='mirrors'){
    flip(s.grid,a.x,a.y);solved=beamPath(s.grid,s.entry).end.reason==='target';text='The silver pane turns; the light takes another path.';
  }else{
    if(a.type==='place')s.pan.push(a.item);else if(a.type==='remove')s.pan=s.pan.filter(i=>i!==a.item);
    else {solved=s.pan.reduce((sum,i)=>sum+s.secret.weights[i],0)===s.target;if(!solved)return failure(s);}
    text='The pan sways and the needle settles.';
  }
  s.solved=solved;
  return {state:s,event:solved?'solved':'moved',text:solved?'The seal yields. Beyond it, the passage opens.':text};
}
export function view(state,{dm=false}={}){
  if(dm){const s=copy(state);if(s.kind==='mirrors')s.beam=beamPath(s.grid,s.entry);return s;}
  // Allowlist only presentation fields, including when future DM state gains fields.
  const v={kind:state.kind,difficulty:state.difficulty,solved:state.solved,moves:state.moves,fails:state.fails,clues:copy(state.clues)};
  const fields={levers:['levers','pulled'],statues:['positions','altar'],dials:['symbols','dials'],riddle:['question'],mirrors:['grid','entry','target'],weights:['items','pan','target']}[state.kind];
  for(const key of fields)v[key]=copy(state[key]);
  if(state.lastTrap)v.lastTrap=state.lastTrap;
  if(state.kind==='mirrors')v.beam=beamPath(state.grid,state.entry);
  if(state.kind==='weights')v.reading=state.pan.reduce((sum,i)=>sum+state.secret.weights[i],0);
  return v;
}
// Call only after the DM accepts a check; never add these strings to player snapshots.
export function hint(s,level){
  if(![1,2,3].includes(level))throw new RangeError('Hint level must be 1, 2 or 3');
  const choices={
    levers:()=>['The bells remember a procession, not a chord.','Each carving names both a bell and its place in the lament.',`Ring the bells in this order: ${s.secret.order.map(i=>ordinal[i]).join(', ')}.`],
    statues:()=>['The mourners move as a choir.','A turn moves that statue and its immediate neighbours; four turns undo themselves.','Work from the left: try the first statue zero to three times; then turn each next statue until its left neighbour faces north. One first choice will leave the last facing north too.'],
    dials:()=>['The carvings describe things, rather than numbers.','Match each carving to a symbol on its numbered dial.',`From the first dial: ${s.secret.combination.join(', ')}.`],
    riddle:()=>['Look for an ordinary thing wearing the words of the grave.',s.secret.riddleHint,`The word begins with “${s.secret.answer[0]}” and has ${s.secret.answer.replace(/ /g,'').length} letters.`],
    mirrors:()=>['Follow the light before moving the silver.','A slash turns east to north; a backslash turns east to south. Find the first place the beam leaves its intended route.',`Set these panes (column, row, counting from one): ${s.secret.panes.map(p=>`(${p.x+1}, ${p.y+1}) ${p.face}`).join('; ')}.`],
    weights:()=>['Do not trust how heavy a gift looks.','Weigh each gift alone, then add the readings; an empty pan is not the tribute.',`Place ${s.secret.subset.map(i=>s.items[i].name).join(', ')} on the empty pan.`],
  };
  return choices[s.kind]()[level-1];
}
