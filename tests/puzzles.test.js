import test from 'node:test';
import assert from 'node:assert/strict';
import { makePuzzle, act, view, hint, beamPath, KINDS } from '../src/engine/puzzles.js';
import { KINDS as DATA_KINDS, RIDDLES, SYMBOLS, CLUES, FAIL } from '../src/data/puzzles.js';
const clone=s=>JSON.parse(JSON.stringify(s));
function freeze(o){if(o && typeof o==='object'){Object.freeze(o);for(const v of Object.values(o))freeze(v);}return o;}
function solve(initial){
  let s=initial;
  for(const a of initial.secret.solution){
    const before=clone(s),result=act(freeze(s),freeze(a));assert.deepEqual(s,before);
    assert.ok(['moved','solved'].includes(result.event),`${s.kind}: ${result.event}`);s=result.state;
  }
  assert.equal(s.solved,true);assert.equal(act(s,{type:'check'}).event,'invalid');return s;
}
for(const {id} of KINDS)for(const difficulty of [1,2,3])test(`${id} difficulty ${difficulty}: 30 solvable, JSON, pure, seeded puzzles`,()=>{
  for(let seed=0;seed<30;seed++){
    const s=makePuzzle(id,{seed:`audit-${seed}`,difficulty});assert.deepEqual(clone(s),s);
    assert.deepEqual(makePuzzle(id,{seed:`audit-${seed}`,difficulty}),s);assert.equal(s.solved,false);
    assert.equal(s.moves,0);assert.equal(s.fails,0);
    const solved=solve(s);assert.deepEqual(clone(solved),solved);
    assert.equal(new Set([1,2,3].map(n=>hint(freeze(s),n))).size,3);
    const v=view(s),dm=view(s,{dm:true});assert.deepEqual(dm.secret,s.secret);
    assert.ok(!Object.hasOwn(v,'secret'));assert.ok(!Object.hasOwn(v,'seed'));
    for(const field of ['solution','order','combination','weights','subset','answer','also','riddleHint','panes'])assert.ok(!Object.hasOwn(v,field),field);
    if(id==='levers'||id==='dials'){
      assert.ok(!JSON.stringify(v).includes(JSON.stringify(s.secret.solution)));
      assert.ok(!JSON.stringify(v).includes(JSON.stringify(s.secret.order||s.secret.combination)));
    }
    if(id==='mirrors'){assert.notEqual(beamPath(s.grid,s.entry).end.reason,'target');const beam=beamPath(solved.grid,solved.entry);assert.deepEqual(beam.end,{...s.target,reason:'target'});}
    if(id==='statues')assert.ok(s.positions.some(p=>p!=='N'));
    if(id==='weights')assert.equal(s.secret.subset.reduce((sum,i)=>sum+s.secret.weights[i],0),s.target);
  }
});
test('data catalogue is complete, original clues are usable and traps use the app vocabulary',()=>{
  assert.equal(KINDS,DATA_KINDS);assert.equal(new Set(KINDS.map(k=>k.id)).size,6);
  for(const k of KINDS){assert.ok(k.name && k.blurb);assert.deepEqual(k.difficulty,[1,2,3]);}
  assert.equal(SYMBOLS.length,8);assert.equal(new Set(SYMBOLS.map(s=>s.id)).size,8);
  assert.ok(CLUES.levers.length);assert.equal(Object.keys(CLUES.dials).length,8);
  assert.ok(RIDDLES.length>=12);assert.equal(new Set(RIDDLES.map(r=>r.answer)).size,RIDDLES.length);
  assert.ok(Object.values(FAIL).flat().every(t=>['none','darts','pit','gas','blade','alarm'].includes(t)));
});
test('levers reset their progress; trap and reset events preserve recovery',()=>{
  for(const difficulty of [1,2,3]){
    const s=makePuzzle('levers',{difficulty});let p=act(s,s.secret.solution[0]).state;
    const wrong=p.secret.order.find(i=>i!==p.secret.order[1]);
    const r=act(freeze(p),{type:'pull',lever:wrong});
    assert.deepEqual(r.state.pulled,[]);assert.equal(r.state.fails,1);
    assert.equal(r.event,difficulty===1?'reset':'trap');assert.equal(r.state.moves,2);
    if(r.event==='trap')assert.ok(FAIL[difficulty].includes(r.state.lastTrap));
    solve(r.state);
  }
});
test('statues turn immediate neighbours only and wrap clockwise',()=>{
  const s=makePuzzle('statues',{difficulty:3});s.positions=['N','N','N','N','N'];
  assert.deepEqual(act(freeze(s),{type:'turn',statue:2}).state.positions,['N','E','E','E','N']);
  const t={...clone(s),positions:['W','E','S','W','S']};
  assert.deepEqual(act(freeze(t),{type:'turn',statue:0}).state.positions,['N','S','S','W','S']);
});
test('every riddle and synonym tolerates case, articles, whitespace and punctuation',()=>{
  for(const r of RIDDLES){
    const s=makePuzzle('riddle');s.question=r.text;s.secret.answer=r.answer;s.secret.also=r.also;
    for(const answer of [r.answer,...r.also]){
      assert.equal(act(freeze(s),{type:'answer',text:`  ${answer.toUpperCase()}!!!  `}).event,'solved');
      assert.equal(act(s,{type:'answer',text:answer}).event,'solved');
    }
    const bad=act(s,{type:'answer',text:'a plate of turnips'});assert.equal(bad.state.fails,1);assert.equal(bad.state.solved,false);
  }
  const s=makePuzzle('riddle');s.secret.answer='shadow';s.secret.also=[];assert.equal(act(s,{type:'answer',text:'A shadow!'}).event,'solved');
});
test('hand-built beams reflect both mirror orientations and stop at walls, targets and exits',()=>{
  const right={x:-1,y:1,dx:1,dy:0};
  assert.deepEqual(beamPath(['...','./.','...'],right),{path:[{x:0,y:1},{x:1,y:1},{x:1,y:0}],end:{x:1,y:-1,reason:'exit'}});
  assert.deepEqual(beamPath(['...','.\\.','.T.'],right),{path:[{x:0,y:1},{x:1,y:1},{x:1,y:2}],end:{x:1,y:2,reason:'target'}});
  assert.equal(beamPath(['...','.#.','...'],right).end.reason,'wall');
  assert.deepEqual(beamPath(['...','./.','...'],{x:1,y:3,dx:0,dy:-1}).end,{x:3,y:1,reason:'exit'});
  assert.deepEqual(beamPath(['...','.\\.','...'],{x:1,y:-1,dx:0,dy:1}).end,{x:3,y:1,reason:'exit'});
  assert.deepEqual(beamPath(['...','./.','...'],{x:3,y:1,dx:-1,dy:0}).end,{x:1,y:3,reason:'exit'});
  const grid=freeze(['...','.\\.','...']);beamPath(grid,freeze(right));
  for(const [g,e] of [[[],right],[['..','.'],right],[['...'],{...right,dx:2}],[['?'],right],[grid,{x:1,y:1,dx:1,dy:0}]])assert.equal(beamPath(g,e).end.reason,'invalid');
});
test('weights keep mass secret but show measured pan readings and recover from bad offerings',()=>{
  const s=makePuzzle('weights');assert.equal(view(s).reading,0);
  const a=act(freeze(s),{type:'place',item:0}).state;assert.equal(view(a).reading,s.secret.weights[0]);
  const b=act(freeze(a),{type:'remove',item:0}).state;assert.deepEqual(b.pan,[]);assert.equal(view(b).reading,0);
  const wrong=act(b,{type:'check'});assert.equal(wrong.state.fails,1);assert.ok(['wrong','trap'].includes(wrong.event));solve(wrong.state);
  assert.equal(view(s).items.some(i=>'weight' in i),false);
});
test('checking dials, trap clearing and pure copies of views',()=>{
  const s=makePuzzle('dials'),bad=act(freeze(s),{type:'check'});assert.equal(bad.state.fails,1);assert.equal(bad.event,'trap');
  const next=act(bad.state,s.secret.solution[0]);assert.ok(!Object.hasOwn(next.state,'lastTrap'));
  const v=view(s),dm=view(s,{dm:true});v.dials[0]='broken';dm.secret.solution.length=0;assert.ok(s.secret.solution.length);assert.notEqual(s.dials[0],'broken');
  const extra={...s,dmNotes:'private',secretAnswer:'hidden'};assert.ok(!('dmNotes' in view(extra)));assert.ok(!('secretAnswer' in view(extra)));
});
test('invalid actions have no effect, including malformed network indices and cross-kind actions',()=>{
  const bad=[null,undefined,[],{}, {type:'dance'}, {type:'turn',statue:-1},{type:'turn',statue:1.5},{type:'pull',lever:Infinity},{type:'pull',lever:'0'}, {type:'set',dial:0,symbol:'bogus'}, {type:'set',dial:NaN,symbol:'moon'}, {type:'rotate',x:-1,y:0},{type:'rotate',x:0,y:0}, {type:'rotate',x:1.5,y:1},{type:'place',item:-1}, {type:'remove',item:0},{type:'answer',text:7},{type:'answer',text:'!?!'}, {type:'answer',text:'x'.repeat(501)}];
  for(const {id} of KINDS){const s=freeze(makePuzzle(id));for(const a of bad){const r=act(s,a);assert.equal(r.event,'invalid',`${id}: ${JSON.stringify(a)}`);assert.equal(r.state,s);}}
  let w=act(makePuzzle('weights'),{type:'place',item:0}).state;assert.equal(act(w,{type:'place',item:0}).event,'invalid');
  for(const {id} of KINDS){const s=solve(makePuzzle(id)),r=act(s,s.secret.solution[0]);assert.equal(r.event,'invalid');assert.equal(r.state,s);}
});
test('inputs reject bad kinds, seeds, difficulty and hint levels; seeds change puzzles',()=>{
  assert.notDeepEqual(makePuzzle('dials',{seed:'🙂'}).secret,makePuzzle('dials',{seed:'🙃'}).secret);
  assert.throws(()=>makePuzzle('unknown'),RangeError);
  for(const opts of [{seed:42},{difficulty:0},{difficulty:4},{difficulty:NaN}])assert.throws(()=>makePuzzle('dials',opts),RangeError);
  assert.throws(()=>hint(makePuzzle('dials'),4),RangeError);
  for(const {id} of KINDS)assert.notDeepEqual(makePuzzle(id,{seed:'one'}),makePuzzle(id,{seed:'two'}));
});
