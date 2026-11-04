/* Pure long-rest rules: return outcomes for the DM to apply, never change inputs. */
import { PLACES, DISTURBANCES, DREAMS } from '../data/rest.js';

const clamp = n => Math.max(0,Math.min(1,n));
const roll = rng => {
  if (typeof rng !== 'function') throw new TypeError('An rng function is required.');
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value > 1)
    throw new RangeError('rng must return a number from 0 to 1.');
  return Math.min(value,1-Number.EPSILON);
};
const pick = (items,rng) => items[Math.floor(roll(rng)*items.length)];

export function restQuality({place,holding,wagon,party=[],gaze=1,weather='clear'}={}){
  const kind = place?.kind;
  const location = PLACES[kind];
  if (!location) throw new RangeError('Choose a known resting place.');
  const notes = [];
  const defence = Math.max(0,holding?.defence || 0);
  const ward = Math.max(0,holding?.ward || 0);
  let chance = kind === 'holding' ? Math.max(.02,.20-.02*defence-.03*ward) : location.chance;
  if (kind === 'holding') notes.push('Walls and wards protect the holding.');
  if (gaze > 3){chance += .03*(gaze-3);notes.push('The Count’s gaze makes the night less safe.');}
  const roughWeather = ['rain','snow'].includes(weather);
  if (roughWeather && ['camp','road'].includes(kind)){
    chance += .05;notes.push('Cold, wet weather leaves the sleepers exposed.');
  }
  if (holding?.salt && kind === 'holding'){
    chance -= .05;notes.push('A salt line guards the sleeping place.');
  }
  const watched = party.some(hero=>hero.watch);
  if (watched){chance -= .05;notes.push('Someone keeps watch.');}
  else notes.push('Nobody keeps watch; a disturbance will catch the party unawares.');

  const bunks = Math.max(0,wagon?.bunks || 0);
  const beds = Math.max(0,holding?.beds || 0);
  const allBedded = beds + bunks >= party.length;
  let comfort = location.comfort;
  if (kind === 'road') comfort = bunks >= party.length && party.length > 0 ? 'fair' : 'poor';
  if (kind === 'camp') comfort = roughWeather ? 'poor' : 'fair';
  if (kind === 'holding') comfort = allBedded
    ? (holding?.comfort >= 4 ? 'fine' : 'good') : 'fair';
  notes.push(comfort === 'poor' ? 'The sleeping place offers little proper rest.'
    : comfort === 'fine' ? 'Warm beds and quiet rooms make for excellent rest.'
    : comfort === 'good' ? 'There is a sound place to sleep.' : 'The shelter is adequate.');
  return {chance:clamp(Math.round(chance*10000)/10000),comfort,notes};
}

export function rollNight(quality,{party=[],gaze=1}={},rng){
  if (!quality || !Number.isFinite(quality.chance)) throw new TypeError('Supply a rest quality.');
  const disturbed = roll(rng) < quality.chance;
  const night = {disturbed,surprise:disturbed && !party.some(hero=>hero.watch)};
  if (disturbed){
    // A high gaze weights combat without making every disturbance a fight.
    const fightChance = clamp(.12+.065*Math.max(0,gaze-1));
    const fight = roll(rng) < fightChance;
    const pool = DISTURBANCES.filter(e=>fight ? e.severity === 'fight' : e.severity !== 'fight');
    night.event = structuredClone(pick(pool,rng));
  }
  if (gaze >= 6 && party.length && roll(rng) < .25){
    const hero = pick(party,rng);
    night.dream = {id:hero.id,text:pick(DREAMS,rng)};
  }
  return night;
}

export function restOutcome(quality,night,{party=[]}={}){
  if (!quality || !night) throw new TypeError('Supply rest quality and the night result.');
  const broken = night.disturbed && night.event?.severity === 'fight';
  const poor = quality.comfort === 'poor';
  const lines = [];
  if (broken) lines.push('Fighting interrupts the eight-hour rest. Nobody recovers.');
  else if (night.disturbed && night.event?.severity === 'scare')
    lines.push('A fright costs an hour, but the rest still counts.');
  else if (night.disturbed) lines.push('The night is disturbed, but the rest continues.');
  else lines.push('Eight hours pass without an interruption.');
  if (!broken && poor) lines.push('Rough sleep restores health, but only half the spent Hit Point Dice and no exhaustion.');
  if (night.dream) lines.push('An uneasy dream visits one of the sleepers.');
  const dreamer = night.dream?.id;
  const best = !broken && quality.comfort === 'fine'
    ? (party.find(hero=>hero.id !== dreamer) || party[0])?.id : null;
  if (best) lines.push('A restful night grants one hero Heroic Inspiration.');
  const heroes = party.map(hero=>({
    id:hero.id,hpFull:!broken,hitDice:broken ? 'none' : poor ? 'half' : 'all',
    exhaustion:broken || poor ? 0 : -1,inspiration:hero.id === best,
  }));
  return {heroes,lines};
}
