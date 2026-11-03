import test from 'node:test';
import assert from 'node:assert/strict';
import { stockFor,haggle,buy,sell,troublesFor,resolve } from '../src/engine/trade.js';
import { coinValueGp,itemInfo } from '../src/engine/inventory.js';
import { mulberry32 } from '../src/util/core.js';
const smith={id:'smith',name:'Tavrek',role:'smith',mood:'wary'};
const ctx={place:'village',day:3,seed:17,gaze:2};
test('stock is daily, catalogue-priced, smaller in villages, and sensitive to Gaze',()=>{
  for(const role of ['smith','peddler','priest']){
    const person={...smith,role}, stock=stockFor(person,ctx);
    assert.deepEqual(stockFor(person,ctx),stock);
    assert.ok(stock.every(i=>i.gp===itemInfo(i.n).cost));
    const expensive=stockFor(person,{...ctx,gaze:4});
    assert.deepEqual(expensive.map(i=>[i.n,i.qty]),stock.map(i=>[i.n,i.qty]));
    assert.ok(expensive.every((i,k)=>i.gp===Math.round(stock[k].gp*1.2*100)/100));
    assert.ok(stockFor(person,{...ctx,place:{id:'village',kind:'town'}}).reduce((n,i)=>n+i.qty,0)>stock.reduce((n,i)=>n+i.qty,0));
  }
  assert.ok(stockFor(smith,ctx).some(i=>itemInfo(i.n).kind==='weapon'));
  assert.ok(stockFor(smith,ctx).some(i=>i.n==="Smith's Tools"));
  assert.deepEqual(stockFor({...smith,dead:true},ctx),[]);
  assert.ok(new Set(Array.from({length:10},(_,day)=>JSON.stringify(stockFor(smith,{...ctx,day})))).size>1);
  assert.ok(Array.from({length:30},(_,day)=>stockFor({...smith,role:'peddler'},{...ctx,place:'town',day})).flat().some(i=>['Bell','Mirror','Magnifying Glass'].includes(i.n)));
});
test('buy and sell one unit make exact change and preserve the source sheet',()=>{
  const h={inv:[],coins:{pp:1,ep:1,sp:2,cp:3}}, original=structuredClone(h);
  let r=buy(h,{n:'Rope',qty:2},1.11);assert.ok(r.ok);
  assert.equal(coinValueGp(r.sheet.coins),9.62);assert.equal(r.sheet.inv[0].n,'Rope');assert.deepEqual(h,original);
  const first=r.sheet;r=sell(first,r.itemId,{person:smith});assert.ok(r.ok);
  assert.equal(coinValueGp(r.sheet.coins),10.12);assert.equal(r.sheet.inv.length,0);assert.equal(first.inv.length,1);
  assert.equal(buy(h,'Rope',100).ok,false);assert.equal(buy(h,'Rope',-1).ok,false);
  assert.equal(buy(h,{n:'Rope',qty:0},1).ok,false);
  assert.equal(sell({inv:[{id:'x',n:'Longsword, +1'}]},'x',{person:smith}).ok,false);
  const stack={inv:[{id:'x',n:'Rope',qty:2}],coins:{}};
  assert.equal(sell(stack,'x',{person:smith}).sheet.inv[0].qty,1);
  assert.equal(sell({inv:[{id:'x',n:'Rope',equipped:true}]},'x',{person:smith}).ok,false);
});
test('haggling discounts, failure, and natural-one insult',()=>{
  assert.equal(haggle(10,{roll:15,dc:15},()=>0).gp,9);
  assert.equal(haggle(10,{roll:15,dc:15},()=>.999).gp,8);
  assert.equal(haggle(10,{roll:14,dc:15},()=>0).gp,10);
  assert.equal(haggle(10,{roll:{total:21,raw:1},dc:15},()=>0).gp,11);
});
function fixture(){
  const folk=Array.from({length:12},(_,i)=>({...smith,id:`p${i}`,name:`Person ${i}`}));
  folk.push({id:'child',name:'Merrin',role:'lostChild',place:'road'}, {id:'captive',name:'Osvik',role:'captive',place:'dungeon'});
  folk[1].spy={for:'m'};
  const court={members:[{id:'m',alive:true,name:'The Lantern Keeper',haunt:'tower'}],news:[{who:'m',place:'village',text:'The Lantern Keeper came down on the village in the night. A barn burned.',rumour:true}]};
  return {folk,court};
}
test('troubles reference real living folk, spies and recent raids only, with bounded density',()=>{
  const {folk,court}=fixture(), before=JSON.stringify({folk,court});
  const ts=troublesFor(folk,court,ctx,mulberry32(7));
  assert.equal(ts.length,4);assert.deepEqual(new Set(ts.map(t=>t.kind)),new Set(['lostChild','captive','raid','missing']));
  for(const t of ts){assert.ok(folk.some(p=>p.id===t.by));if(t.goal.person)assert.ok(folk.some(p=>p.id===t.goal.person));if(t.links)assert.equal(t.links.member,'m');}
  assert.deepEqual(ts.find(t=>t.kind==='raid').goal.news,court.news[0]);
  assert.equal(JSON.stringify({folk,court}),before);
  folk.find(p=>p.id==='child').dead=true;court.members[0].alive=false;
  const filtered=troublesFor(folk,court,ctx,mulberry32(7));assert.ok(filtered.every(t=>t.kind==='captive'));
  assert.deepEqual(troublesFor([smith],court,ctx,()=>0),[]);
});
test('ordinary news and expired structured raids cannot become raid troubles',()=>{
  const {folk,court}=fixture();
  court.news=[{who:'m',place:'village',rumour:true,text:'It is hunting.'},{who:'m',place:'village',rumour:true,kind:'raid',day:0,text:'A raid.'}];
  assert.ok(troublesFor(folk,court,{...ctx,day:5},mulberry32(2)).every(t=>t.kind!=='raid'));
});
test('resolution is idempotent, adjusts mood, rewards success and reports raid failure',()=>{
  const {folk,court}=fixture(), ts=troublesFor(folk,court,ctx,mulberry32(7)), raid=ts.find(t=>t.kind==='raid');
  const done=resolve(raid,'done');assert.equal(done.effects.mood.mood,'easy');assert.ok(done.effects.reward);assert.equal(raid.status,'open');
  assert.equal(resolve(done.trouble,'done').effects,null);
  const failed=resolve(raid,'failed');assert.equal(failed.effects.mood.mood,'afraid');assert.equal(failed.effects.court.power,1);assert.equal(failed.effects.reward,undefined);
  assert.equal(resolve(raid,'ignored').effects.mood.delta,-1);
  assert.equal(resolve(ts.find(t=>t.kind==='missing'),'done').effects.returning.person,'p1');
});
