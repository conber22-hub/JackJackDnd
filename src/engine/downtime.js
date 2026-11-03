/* Downtime is pure: the caller applies effects to the hero, folk and holding. */
import { spendCoins, addCoins } from './coins.js';
import { ACTIVITIES } from '../data/downtime.js';

const no = why => ({ok:false,why});
const mod = score => Math.floor(((Number.isFinite(score) ? score : 10) - 10) / 2);
const roundGp = n => Math.round(n * 100) / 100;
const gpText = n => `${roundGp(n)} gp`;
const dayText = n => `${n} day${n === 1 ? '' : 's'}`;
const abilityFor = {
  Acrobatics:'Dex', AnimalHandling:'Wis', Arcana:'Int', Athletics:'Str', Deception:'Cha',
  History:'Int', Insight:'Wis', Intimidation:'Cha', Investigation:'Int', Medicine:'Wis',
  Nature:'Int', Perception:'Wis', Performance:'Cha', Persuasion:'Cha', Religion:'Int',
  SleightOfHand:'Dex', Stealth:'Dex', Survival:'Wis',
  'Animal Handling':'Wis', 'Sleight of Hand':'Dex',   // (the app's own spelling of the two-word skills)
};
const teachers = {
  "Smith's Tools":['smith'], "Carpenter's Tools":['farmer'], 'Herbalism Kit':['hermit'],
};
const isTool = learn => /\b(?:Tools|Kit)\b/.test(learn);
const comforts = (place, holding) => place?.kind === 'holding' ? Math.floor(Math.max(0, holding?.comfort || 0) / 3) : 0;
const lodging = (place, holding) => place?.kind === 'village' ? .5
  : place?.kind === 'town' ? 1
  : place?.kind === 'holding' && !(holding?.beds > 0) ? .5 : 0;
const checkFor = (hero, ability, skill, tool, dc = 0) => {
  const score = mod(hero?.sc?.[ability]);
  const bonus = tool ? score + (hero?.tools?.includes(tool) ? Number(hero?.pb || 0) : 0)
    : skill && Number.isFinite(hero?.skills?.[skill]) ? hero.skills[skill] : score;
  return {ability,...(skill ? {skill} : {}),...(tool ? {tool} : {}),dc,bonus};
};

export function daysCost(p, {holding = p?.holding} = {}){
  if (!p?.activity || !Number.isInteger(p.days) || p.days < 1) return 0;
  return roundGp((p.activity.cost + lodging(p.place, holding)) * p.days);
}

export function plan(activityId, {hero, days, place, holding, gaze = 1, learn, skill, tool} = {}){
  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity) return no('That activity is not available.');
  if (!hero) return no('Choose a hero first.');
  const here = place || (holding ? {kind:'holding'} : null);
  if (!Number.isInteger(days) || days < 1) return no('Choose a whole number of days.');
  const minimum = activityId === 'recuperate' ? Math.max(1, 3 - comforts(here, holding)) : activity.days;
  if (days < minimum) return no(`${activity.n} needs at least ${dayText(minimum)}.`);
  const settled = ['village','town'].includes(here?.kind);
  let check = null;
  if (activityId === 'recuperate' && here?.kind === 'road')
    return no('Recuperating needs somewhere safe, not the open road.');
  if (activityId === 'work'){
    if (!settled) return no('Paid work needs a village or town.');
    if (tool && !hero.tools?.includes(tool)) return no(`You are not proficient with ${tool}.`);
    if (skill && !abilityFor[skill]) return no(`That skill cannot be used for work.`);
    const chosen = tool ? null : (skill || Object.keys(hero.skills || {}).find(s => abilityFor[s]) || 'Athletics');
    check = tool ? checkFor(hero, 'Int', null, tool) : checkFor(hero, abilityFor[chosen], chosen);
  }
  if (activityId === 'train'){
    if (here?.kind === 'road') return no('Training needs somewhere settled, not the open road.');
    if (!learn || typeof learn !== 'string') return no('Choose a tool or language to learn.');
    if (hero.tools?.includes(learn) || hero.languages?.includes(learn)) return no(`You already know ${learn}.`);
    const roles = isTool(learn) ? teachers[learn] || [] : ['priest','elder','pilgrim'];
    if (!here?.folk?.some(f => roles.includes(f.role))) return no(`Nobody here can teach ${learn}.`);
  }
  if (activityId === 'research'){
    if (here?.kind !== 'town' && !(here?.kind === 'holding' && holding?.workshops?.includes('library')))
      return no('Research needs a library, or a town.');
    check = checkFor(hero, 'Int', Number.isFinite(hero.skills?.History) ? 'History' : null, null, 15);
  }
  if (activityId === 'carouse'){
    if (!settled) return no('Carousing needs a village or town tavern.');
    check = checkFor(hero, 'Cha', 'Persuasion', null, 12);
  }
  if (activityId === 'watch' && (here?.kind !== 'holding' || !holding))
    return no('Keeping watch needs your holding.');
  const draft = {ok:true,activity,days,check,hero,place:here,holding,gaze,learn};
  const cost = daysCost(draft, {holding});
  if (spendCoins(hero.coins, cost) === null) return no(`You cannot afford ${gpText(cost)} for those days.`);
  return {...draft,cost};
}

const d = (sides, rng) => {
  if (typeof rng !== 'function') throw new TypeError('Supply an rng function for a dice roll.');
  return 1 + Math.floor(Math.min(1 - Number.EPSILON, Math.max(0, rng())) * sides);
};
const checkRoll = (p, roll, rng) => {
  if (!p.check) return null;
  const raw = roll?.raw ?? d(20, rng);
  const total = roll?.total ?? raw + p.check.bonus;
  if (!Number.isInteger(raw) || raw < 1 || raw > 20 || !Number.isFinite(total))
    throw new RangeError('The check needs a valid d20 and total.');
  return {raw,total};
};

export function resolve(p, {roll} = {}, rng){
  if (!p?.ok) throw new TypeError('Resolve a valid downtime plan.');
  const {activity,hero,days,place,holding,learn} = p;
  const {id} = activity, name = hero.name || 'The hero';
  const effects = {coins:spendCoins(hero.coins,p.cost)};
  if (!effects.coins) throw new RangeError('The hero can no longer afford this plan.');
  const lines = [];
  const result = checkRoll(p,roll,rng);
  if (id === 'recuperate'){
    const quicker = comforts(place, holding);
    if (days >= Math.max(1,3-quicker) && hero.exhaustion > 0) effects.exhaustion = -1;
    if (days >= Math.max(1,5-quicker)) effects.saveAdvantage = 'disease or poison';
    lines.push(`${name} rests somewhere safe for ${dayText(days)}.`);
    if (effects.exhaustion || effects.saveAdvantage)
      lines.push([effects.exhaustion ? 'One level of exhaustion ends' : '',effects.saveAdvantage ? 'The next lingering disease or poison save has advantage' : ''].filter(Boolean).join('; ') + '.');
  } else if (id === 'work'){
    const {pay,tier} = result.total <= 9 ? {pay:.1,tier:'poor'} : result.total <= 14
      ? {pay:1,tier:'modest'} : result.total <= 20 ? {pay:2,tier:'comfortable'} : {pay:4,tier:'wealthy'};
    effects.gp = roundGp(pay * days);
    effects.coins = addCoins(effects.coins,effects.gp);
    lines.push(`${name} works for ${dayText(days)}: ${tier} pay, ${gpText(effects.gp)}.`);
  } else if (id === 'train'){
    if (isTool(learn)) effects.addTool = learn;
    else effects.addLanguage = learn;
    lines.push(`${name} trains for ${dayText(days)} and learns ${learn}.`);
  } else if (id === 'research'){
    const margin = result.total - 15;
    effects.research = margin <= -5 ? 'nothing' : margin < 0 ? 'a rumour'
      : margin < 5 ? 'a true thing' : 'a true thing and a lead';
    lines.push(`${name} researches for ${dayText(days)} and finds ${effects.research}.`);
  } else if (id === 'carouse'){
    const succeed = result.raw !== 1 && result.total >= 12;
    const folk = place?.folk?.filter(f => f.mood !== 'easy' && f.id) || [];
    if (succeed && folk.length){
      effects.mood = {id:folk[d(folk.length,rng) - 1].id,to:'easy'};
      lines.push(`${name} makes a friendly contact after ${dayText(days)} in the tavern.`);
    } else if (succeed) lines.push(`${name} has a pleasant ${dayText(days)} at the tavern.`);
    const messRisk = Math.max(0,Math.min(1,(p.gaze - 2) * .05));
    if (succeed && messRisk && typeof rng !== 'function') throw new TypeError('Supply an rng function for a possible tavern mess.');
    if (!succeed || (messRisk > 0 && rng() < messRisk)){
      const kinds = ['a fine','a fight','a debt'];
      effects.mess = kinds[d(kinds.length,rng) - 1];
      if (effects.mess !== 'a fight'){
        const amount = d(effects.mess === 'a fine' ? 6 : 10,rng);
        effects.gp = -amount;
        effects.coins = spendCoins(effects.coins,amount) || effects.coins;
      }
      lines.push(`${name} causes trouble: ${effects.mess}${effects.gp ? ` of ${gpText(-effects.gp)}` : ''}.`);
    }
  } else if (id === 'watch'){
    effects.defence = 1;
    effects.watchBonus = Math.min(10,2 * days);
    lines.push(`${name} keeps watch for ${dayText(days)}: defence +1 and watch bonus +${effects.watchBonus}.`);
  } else if (id === 'craft'){
    effects.hours = 8 * days;
    lines.push(`${name} has ${effects.hours} hours for crafting.`);
  }
  return {effects,lines};
}

export function describe(activityId){
  const activity = ACTIVITIES.find(a => a.id === activityId);
  if (!activity) return null;
  const {n,flavour,days,cost} = activity;
  return {n,flavour,days,cost};
}
