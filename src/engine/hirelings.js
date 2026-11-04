/* Pure rules for the folk employed at a holding. Spies remain DM-only data. */
import { RATES, SKILL_OF, TELLS, MORALE_LINES } from '../data/hirelings.js';

const clamp = n => Math.max(0,Math.min(20,n));
const draw = rng => {
  if (typeof rng !== 'function') throw new TypeError('An rng function is required.');
  const n = rng();
  if (!Number.isFinite(n) || n < 0 || n > 1) throw new RangeError('rng must return a number from 0 to 1.');
  return Math.min(n,1 - Number.EPSILON);
};
const die = (sides,rng) => 1 + Math.floor(draw(rng)*sides);

export function canHire(person){
  if (!person || typeof person !== 'object') return {ok:false,why:'Choose someone to hire.'};
  if (['child','lostChild','dog'].includes(person.role) || /lost/i.test(person.role || ''))
    return {ok:false,why:'Children, the lost and dogs cannot be hired.'};
  if (!Object.hasOwn(RATES,person.role)) return {ok:false,why:'That person cannot be hired.'};
  if (!person.id || !person.name) return {ok:false,why:'The person needs a name and an id.'};
  return {ok:true,why:''};
}

export function hire(person,{wage}={},rng){
  const allowed = canHire(person);
  if (!allowed.ok) return allowed;
  const rate = RATES[person.role], daily = wage === undefined ? rate : wage;
  if (!Number.isFinite(daily) || daily < 0) return {ok:false,why:'The wage must be a non-negative number.'};
  const base = {afraid:6,wary:9,easy:12}[person.mood] ?? 9;
  const loyalty = clamp(base + (Math.round(daily*100) >= Math.round(rate*150) ? 2 : daily < rate ? -3 : 0) + die(3,rng)-2);
  return {id:person.id,name:person.name,role:person.role,skill:SKILL_OF[person.role],wage:daily,
    loyalty,devoted:false,...(person.spy ? {spy:structuredClone(person.spy)} : {})};
}

export function payDay(hirelings,{gold}={}){
  if (!Number.isFinite(gold) || gold < 0) throw new RangeError('Supply non-negative gold.');
  const result = [], paid = [], unpaid = [];
  // Integer copper accounting avoids floating-point shortfalls at the purse's edge.
  let left = Math.round(gold*100), spent = 0;
  for (const person of hirelings){
    const hand = structuredClone(person), cost = Math.round(hand.wage*100);
    if (!Number.isFinite(cost) || cost < 0) throw new RangeError('A hireling has an invalid wage.');
    if (cost <= left){left -= cost;spent += cost;paid.push(hand.id);}
    else {hand.loyalty = clamp(hand.loyalty-2);unpaid.push(hand.id);}
    result.push(hand);
  }
  return {hirelings:result,paid,unpaid,spent:spent/100};
}

export function moraleCheck(hireling,{cause,ward=0,gaze=1}={},rng){
  if (!Object.hasOwn(MORALE_LINES,cause)) throw new RangeError('Unknown morale cause.');
  const hand = structuredClone(hireling);
  const raw = hand.devoted ? null : die(20,rng);
  const dc = 10 + Math.max(0,gaze-3) - ward;
  const total = raw === null ? null : raw + Math.floor((hand.loyalty-10)/2);
  const stays = hand.devoted || raw === 20 || (raw !== 1 && total >= dc);
  const options = MORALE_LINES[cause][stays ? 'stay' : 'leave'];
  return {stays,hireling:hand,line:`${hand.name}: ${options[0]}`};
}

export function watchForEyes(hirelings,{watchBonus=0,days=1}={},rng){
  if (!Number.isInteger(days) || days < 0) throw new RangeError('Days must be a non-negative whole number.');
  const chance = Math.max(0,Math.min(1,.03 + .01*watchBonus));
  const found = [], seen = new Set();
  for (let day=0;day<days;day++) for (const hand of hirelings){
    if (!hand.spy || seen.has(hand.id)) continue;
    if (draw(rng) < chance){
      found.push({id:hand.id,member:hand.spy.for,tell:TELLS[die(TELLS.length,rng)-1]});
      seen.add(hand.id);
    }
  }
  return found;
}

export function week(hirelings,{comfort=0,paidInFull=false,raidsWon=0}={}){
  if (!Number.isInteger(raidsWon) || raidsWon < 0) throw new RangeError('Raids won must be a non-negative whole number.');
  return hirelings.map(person => {
    const hand = structuredClone(person);
    hand.loyalty = clamp(hand.loyalty + (paidInFull ? 1 : 0) + (comfort >= 4 ? 1 : 0) + 2*raidsWon);
    if (hand.loyalty >= 18) hand.devoted = true;
    if (hand.devoted && hand.spy){delete hand.spy;hand.turned = true;}
    return hand;
  });
}

export function defenders(hirelings){
  return hirelings.reduce((sum,hand) => sum + (hand.skill === 'guard' ? 1 : .5)*(hand.devoted ? 2 : 1),0);
}
