import { AWARDS, HEADLINES, VERDICTS, MVP_WHY } from '../data/fight-summary.js';
const number=n=>Number.isFinite(n)?Math.max(0,n):0;
const clone=v=>JSON.parse(JSON.stringify(v));
export function summarize(roster=[],events=[],{won=false,xp=0,loot=null,seed=''}={}){
  const people=roster.filter(p=>p&&typeof p.id==='string'),per=Object.fromEntries(people.map(p=>[p.id,Object.fromEntries('dealt taken healed healedOthers hits misses crits fumbles kills downs biggest spells potions'.split(' ').map(k=>[k,0]))]));
  const extra=Object.fromEntries(people.map(p=>[p.id,{twenties:0,saves:0,dodge:0,features:0,returned:0,down:false}]));
  const row=id=>Object.hasOwn(per,id)?per[id]:null,ex=id=>Object.hasOwn(extra,id)?extra[id]:null;
  let rounds=1,biggest=null,lastKill=null,lastAttack=null,fled=0;
  for(const e of events){if(!e)continue;rounds=Math.max(rounds,Math.floor(number(e.round)));
    if(e.t==='attack'){
      lastKill=null;
      const p=row(e.by);if(p){if(e.hit===true){p.hits++;if(e.crit)p.crits++;}else if(e.hit===false)p.misses++;if(e.nat===1)p.fumbles++;if(e.nat===20)ex(e.by).twenties++;}
      if(e.hit===true){const n=number(e.dmg);if(p){p.dealt+=n;p.biggest=Math.max(p.biggest,n);}if(row(e.at))row(e.at).taken+=n;if(n>0&&(!biggest||n>biggest.n))biggest={by:e.by??null,at:e.at??null,n,weapon:e.weapon||'attack',crit:!!e.crit};}
      lastAttack=e;
    }else if(e.t==='damage'){lastKill=null;const n=number(e.n);if(row(e.to))row(e.to).taken+=n;if(row(e.from)){row(e.from).dealt+=n;row(e.from).biggest=Math.max(row(e.from).biggest,n);}if(n>0&&(!biggest||n>biggest.n))biggest={by:e.from??null,at:e.to??null,n,weapon:e.type||'damage',crit:false};lastAttack=null;
    }else if(e.t==='heal'){const n=number(e.n);if(row(e.to))row(e.to).healed+=n;if(e.by!==e.to&&row(e.by))row(e.by).healedOthers+=n;
    }else if(e.t==='kill'){if(row(e.by))row(e.by).kills++;lastKill=lastAttack&&lastAttack.hit===true&&lastAttack.by===e.by&&lastAttack.at===e.who?e.by:null;
    }else if(e.t==='down'&&row(e.who)){row(e.who).downs++;ex(e.who).down=true;
    }else if(e.t==='up'&&ex(e.who)){if(ex(e.who).down)ex(e.who).returned++;ex(e.who).down=false;
    }else if(e.t==='save'&&e.ok===true&&ex(e.who))ex(e.who).saves++;
    else if(e.t==='cast'&&row(e.by))row(e.by).spells++;
    else if(e.t==='potion'&&row(e.by))row(e.by).potions++;
    else if(e.t==='feature'&&ex(e.who))ex(e.who).features++;
    else if(e.t==='act'&&e.k==='dodge'&&ex(e.who))ex(e.who).dodge++;
    else if(e.t==='flee')fled++;
  }
  const party=people.filter(p=>p.side==='party'),standing=p=>!p.dead&&number(p.hp)>0;
  const best=(list,metric)=>list.reduce((b,p)=>metric(p)>0&&(!b||metric(p)>metric(b))?p:b,null); // Roster order breaks ties.
  const lucky=best(people,p=>extra[p.id].twenties),unlucky=best(people,p=>per[p.id].fumbles);
  const close=party.filter(p=>standing(p)&&number(p.maxHp)>0&&p.hp/p.maxHp<1/3).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  let state=2166136261;for(const c of String(seed))state=Math.imul(state^c.charCodeAt(0),16777619);
  const pick=list=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return list[state%list.length];};
  // Only measurable contributions: damage + 1.5*healing others + 8*kills. The record has no reliable protection attribution.
  const score=p=>per[p.id].dealt+1.5*per[p.id].healedOthers+8*per[p.id].kills;
  const hero=won?best(party,score):null;
  const reason=hero?Object.entries({damage:per[hero.id].dealt,healing:1.5*per[hero.id].healedOthers,kills:8*per[hero.id].kills}).sort((a,b)=>b[1]-a[1])[0][0]:null;
  const metrics={damage:p=>per[p.id].dealt,tank:p=>standing(p)?per[p.id].taken:0,healing:p=>per[p.id].healedOthers,crits:p=>per[p.id].crits,kills:p=>per[p.id].kills,last:p=>p.id===lastKill?1:0,returned:p=>standing(p)?extra[p.id].returned:0,untouched:p=>standing(p)&&per[p.id].taken===0?per[p.id].hits+per[p.id].spells+per[p.id].healedOthers:0,spells:p=>per[p.id].spells,misses:p=>per[p.id].misses,saves:p=>extra[p.id].saves,dodge:p=>extra[p.id].dodge,features:p=>extra[p.id].features,potions:p=>per[p.id].potions};
  const fill=(s,values)=>s.replace(/\{(\w+)\}/g,(_,k)=>String(values[k]??''));
  const awards=[];for(const a of [...AWARDS].sort((a,b)=>b.prefer-a.prefer)){const metric=metrics[a.key],p=metric&&best(party,metric);if(p)awards.push({id:p.id,key:a.key,title:a.title,line:fill(a.line,{name:p.name||p.id,n:metric(p)})});if(awards.length===4)break;}
  // Evidence wins over the requested minimum: empty/uneventful records may have fewer than two awards.
  const hurt=party.reduce((n,p)=>n+per[p.id].taken,0),max=party.reduce((n,p)=>n+number(p.maxHp),0);
  const shape=!won?'lost':party.some(p=>per[p.id].downs||standing(p)&&p.maxHp>0&&p.hp/p.maxHp<.2)?'near':fled?'fled':rounds>=6?'slog':rounds<=2&&hurt<=max*.1?'rout':'clean';
  const names={mvp:hero?.name||'The party',foe:people.find(p=>p.side==='foe')?.name||'the foe'};
  return {rounds,won:!!won,per,biggest,luckiest:lucky?{who:lucky.id,nat:20,count:extra[lucky.id].twenties}:null,unluckiest:unlucky?{who:unlucky.id,nat:1,count:per[unlucky.id].fumbles}:null,closest:close?{who:close.id,hp:close.hp,maxHp:close.maxHp}:null,mvp:hero?{id:hero.id,why:pick(MVP_WHY[reason])}:null,awards,headline:fill(pick(HEADLINES[shape]),names),verdict:pick(VERDICTS[shape]),xp:number(xp),loot:clone(loot)};
}
export function lines(summary,names={}){
  const name=id=>Object.hasOwn(names,id)?names[id]:id||'Unknown';
  const out=[summary.headline];for(const [id,p]of Object.entries(summary.per||{}))if(p.dealt||p.kills)out.push(`${name(id)} · ${p.dealt} damage · ${p.kills} kills`);
  if(summary.biggest){const b=summary.biggest;out.push(`Biggest blow: ${name(b.by)} · ${b.n}${b.crit?' (a critical)':''}`);}
  if(summary.mvp)out.push(`MVP: ${name(summary.mvp.id)} · ${summary.mvp.why}`);
  return out.slice(0,6).map(s=>String(s).length<70?String(s):String(s).slice(0,68)+'…');
}
