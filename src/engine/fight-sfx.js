import { SFX, PICK } from '../data/fight-sfx.js';
import { parseVoice } from './chiptune.js';
const get = (map,k) => Object.hasOwn(map,k) ? map[k] : null;
function choose(e){
  if(e.t==='swing'){
    if(e.kind==='spell') return get(PICK.elements,e.dmgType)||'force';
    const w=String(e.weapon||'').toLowerCase();
    if(/bite|fang/.test(w))return 'bite-swing'; if(/claw|talon/.test(w))return 'claw-swing';
    if(/javelin|dart|throw|sling/.test(w))return 'thrown-swing';
    if(e.kind==='ranged'||/bow/.test(w))return 'bow-swing';
    return e.dmgType==='bludgeoning'?'blunt-swing':'blade-swing';
  }
  if(e.t==='land'){
    if(e.hit!==true)return e.hit===false?(e.nat===1?'whiff':'parry'):null;
    if(e.bite)return 'bite-swing';
    return get(PICK.elements,e.dmgType)||get(PICK.armour,e.armour)||'flesh-hit';
  }
  if(e.t==='cast')return get(PICK.schools,e.school)||'force';
  if(e.t==='act')return get(PICK.acts,e.k);
  if(e.t==='feature')return get(PICK.features,e.id);
  if(e.t==='cond')return e.n==='blessed'?'good-condition':typeof e.n==='string'&&e.n?'bad-condition':null;
  return ({heal:'heal',down:e.hero?'hero-down':'foe-death',kill:'foe-death',turn:e.mine?'my-turn':'other-turn',potion:'potion'})[e.t]||null;
}
export function ids(){return Object.keys(SFX);}
export function sfxFor(event,{seed=''}={}){
  if(!event||typeof event.t!=='string')return null;
  const id=choose(event);if(!id||!Object.hasOwn(SFX,id))return null;
  let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);
  const pitch=1+((h>>>0)/4294967295*2-1)*.03;
  h=Math.imul(h^0x9e3779b9,16777619);const gain=1+((h>>>0)/4294967295*2-1)*.1;
  const layers=[id];if(event.t==='land'&&event.hit===true&&event.crit===true)layers.push('critical');
  const events=[];
  for(const k of layers){const r=SFX[k];for(const [voice,wave] of Object.entries({pulse1:'square',pulse2:'square',tri:'triangle',noise:'noise'})){
    if(!r[voice])continue;
    for(const n of parseVoice(r[voice],{bpm:r.bpm})){const e={...n,wave,vol:n.vol*r.gain*gain};if('freq'in e)e.freq*=pitch;events.push(e);}
  }}
  return {id,events:events.sort((a,b)=>a.t-b.t)};
}
