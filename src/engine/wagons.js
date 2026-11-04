/* Pure road proposals: the caller applies event damage, losses and delays once.
   hp is maximum HP; damage is HP already lost. All dice use the supplied rng. */
import { FITTINGS, ROAD_FACTOR, WEATHER_FACTOR, NIGHT_FACTOR } from '../data/wagons.js';
const has = (wagon,id) => (wagon.fittings || []).includes(id);
const die = (sides,rng) => 1 + Math.floor(rng()*sides);

export function legSpeed(wagon,leg,{cargo=0}={}){
  if(cargo>wagon.capacity*2) return {milesPerDay:0,why:['Too heavy to move.']};
  let milesPerDay=wagon.speed;
  const why=[];
  const road=ROAD_FACTOR[leg.road ?? 'road'], weather=WEATHER_FACTOR[leg.weather ?? 'clear'];
  if(road===undefined || weather===undefined) throw new RangeError('Unknown road or weather.');
  milesPerDay*=road*weather;
  if(road!==1) why.push(leg.road==='track'?'The track slows the wagon to three quarters speed.':'Wild ground halves the wagon’s speed.');
  if(weather!==1) why.push({rain:'Rain slows the wagon to four fifths speed.',snow:'Snow halves the wagon’s speed.',fog:'Fog slows the wagon to three quarters speed.'}[leg.weather]);
  if(leg.night){
    if(has(wagon,'lantern-hooks')) why.push('Lanterns remove the night penalty.');
    else {milesPerDay*=NIGHT_FACTOR;why.push('Night travel halves the wagon’s speed.');}
  }
  if(cargo>wagon.capacity){milesPerDay*=.5;why.push('The overloaded wagon travels at half speed.');}
  if(wagon.hp-(wagon.damage ?? 0)<wagon.hp/2){milesPerDay*=.75;why.push('Less than half its HP remains: speed is reduced by a quarter.');}
  // A zero-speed frame cannot cover a positive leg; zero miles always takes no time.
  const hours=leg.miles===0?0:milesPerDay>0?leg.miles/milesPerDay*8:Infinity;
  return {milesPerDay,hours,why};
}

export function meetEvent(wagon,event,{gaze=1}={},rng){
  const effects={},lines=[],ward=has(wagon,'ward-runes');
  // Searchers are the Count's men too; apply their modifier before testing the DC.
  if(ward && ['mists','ambush','search'].includes(event.kind)) effects.checkMod=-2;
  switch(event.kind){
    case 'bloom':
      if(has(wagon,'salt-barrels')){effects.avoided=true;lines.push('The Bloom recoils from the salt barrels.');}
      else lines.push('The Bloom creeps towards the wagon.');
      break;
    case 'breakdown':
      effects.delayHours=has(wagon,'spare-wheel')?1:12;
      effects.damage=die(6,rng);
      lines.push(has(wagon,'spare-wheel')?'The spare wheel gets the wagon moving in an hour.':'The broken running gear costs twelve hours.');
      lines.push(`The wagon takes ${effects.damage} damage.`);
      break;
    case 'theft':
      if(has(wagon,'lockbox')) lines.push('The lockbox holds: nothing inside is taken.');
      else {effects.lost='A bundle of provisions';lines.push('A bundle of provisions is missing from the wagon.');}
      break;
    case 'search': {
      const dc=has(wagon,'hidden-compartment')?18:10;
      effects.found=die(20,rng)+5+(effects.checkMod || 0)>=dc;
      lines.push(effects.found?'The Count’s men find the concealed cargo.':'The Count’s men find nothing hidden.');
      if(ward) lines.push('The ward-runes hamper their search (−2).');
      break;
    }
    case 'mists': {
      const chance=Math.max(10,50-10*Math.max(0,5-gaze))/100*(ward?.5:1);
      // No turnBack key is permitted by the contract: avoided marks passage;
      // a turn back costs one eight-hour travel day, reported as delayHours.
      if(rng()<chance){effects.delayHours=8;lines.push('The Mists turn the wagon back; a day’s travel is lost.');}
      else {effects.avoided=true;lines.push('The wagon finds a way through the Mists.');}
      if(ward) lines.push('The ward-runes weaken the Mists (−2 on their checks).');
      break;
    }
    case 'ambush':
      lines.push(ward?'The ward-runes hinder the ambushers (−2 on their checks).':'The ambushers close on the wagon.');
      break;
    case 'storm':
      effects.damage=die(4,rng);effects.delayHours=4;
      lines.push(`The storm costs four hours and deals ${effects.damage} damage to the wagon.`);
      break;
    default: lines.push('The fittings do not change this event.');
  }
  return {effects,lines};
}

export function nightOnTheRoad(wagon,{sleepers=0}={}){
  // The numeric bunk count includes beds supplied by a frame, not just fittings.
  const beds=Math.max(0,Math.floor(wagon.bunks || 0)), count=Math.max(0,Math.floor(sleepers));
  const rested=Math.min(beds,count), poor=count-rested;
  if(!count) return {rest:'long',why:'Nobody needs a bunk tonight.'};
  if(!poor) return {rest:'long',why:`All ${count} sleepers have bunks for a long rest.`};
  return {rest:'poor',why:`${rested} of ${count} sleepers get a long rest in bunks; ${poor} get a poor rest on the road.`};
}

export function repairDay(wagon,rng){
  const out=structuredClone(wagon), damage=out.damage ?? 0;
  out.damage=Math.max(0,damage-(has(wagon,'smithy-box')?die(6,rng)+2:1));
  return out;
}

export function describeWagon(wagon){
  const numbers=`${wagon.n}: ${wagon.capacity} lb capacity, ${wagon.speed} miles/day, ${Math.max(0,wagon.hp-(wagon.damage ?? 0))}/${wagon.hp} HP, AC ${wagon.ac}, ${wagon.seats} seats, ${wagon.bunks || 0} bunks.`;
  const fittings=[...new Set(wagon.fittings || [])].map(id=>FITTINGS.find(f=>f.id===id)).filter(Boolean);
  return [numbers,...fittings.map(f=>`${f.n}: ${f.does}`)].join(' ');
}
