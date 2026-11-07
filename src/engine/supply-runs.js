import { SUPPLY_WEIGHTS, SUPPLY_PACES, RESCUE_SCENES } from '../data/supply-runs.js';
import { WAY_HOURS } from '../data/barovia-map.js';
import { placeById, roadBetween, route } from './overland.js';
import { legSpeed, meetEvent } from './wagons.js';
import { hashSeed, mulberry32 } from '../util/core.js';

const ROAD_KIND = { road: 'road', path: 'track', trail: 'wild' };
const WEATHER_RISK = { clear: 0, rain: 0.05, fog: 0.07, snow: 0.12 };
const isId = value => typeof value === 'string' && value.trim().length > 0;
const active = run => run.status === 'en-route' || run.status === 'missing';
const halfHour = hours => Math.ceil(hours * 2) / 2;

export function newSupplyBook() {
  return { runs: [] };
}

function manifest(cargo, { allowEmpty = false } = {}) {
  if (!cargo || typeof cargo !== 'object' || Array.isArray(cargo)) throw new TypeError('Cargo needs a supply manifest');
  const entries = Object.entries(cargo);
  if ((!entries.length && !allowEmpty) || entries.some(([key, amount]) =>
    !Object.hasOwn(SUPPLY_WEIGHTS, key) || !Number.isSafeInteger(amount) || amount <= 0)) {
    throw new RangeError('Use positive whole units of timber, stone or salt');
  }
  return Object.fromEntries(entries);
}

/** Quote the actual Valley roads. The DM may pass a path of connected place IDs. */
export function quoteSupplyRun({ from, to, path, cargo, wagon, pace = 'steady', weather = 'clear', gaze = 1 }) {
  if (typeof from !== 'string' || typeof to !== 'string' || !placeById(from) || !placeById(to) || from === to) {
    throw new RangeError('Choose two distinct Valley locations');
  }
  const waypoints = path ?? route(from, to);
  if (!Array.isArray(waypoints) || waypoints[0] !== from || waypoints.at(-1) !== to ||
    new Set(waypoints).size !== waypoints.length) throw new RangeError('The route must connect the holdings without loops');
  if (typeof pace !== 'string' || !Object.hasOwn(SUPPLY_PACES, pace) ||
    typeof weather !== 'string' || !Object.hasOwn(WEATHER_RISK, weather) || !Number.isFinite(gaze)) {
    throw new RangeError('Unknown pace, weather or Gaze');
  }

  const load = manifest(cargo);
  const pounds = Object.entries(load).reduce((sum, [kind, amount]) => sum + amount * SUPPLY_WEIGHTS[kind], 0);
  const damage = wagon?.damage ?? 0;
  if (![wagon?.capacity, wagon?.speed, wagon?.hp].every(n => Number.isFinite(n) && n > 0) ||
    !Number.isFinite(damage) || damage < 0 || damage >= wagon.hp) throw new RangeError('The wagon cannot travel');
  if (!Number.isSafeInteger(pounds) || pounds > 2 * wagon.capacity) throw new RangeError('The wagon cannot move this load');

  const legs = [];
  const reasons = new Set();
  let hours = 0;
  let exposure = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1], b = waypoints[i];
    const road = roadBetween(a, b);
    if (!road) throw new RangeError('The route includes places with no road between them');
    const miles = road.len * WAY_HOURS[road.way] * 3;
    const speed = legSpeed(wagon, { miles, road: ROAD_KIND[road.way], weather }, { cargo: pounds });
    hours += speed.hours;
    speed.why.forEach(reason => reasons.add(reason));
    exposure += 0.02 + (road.way === 'road' ? 0 : 0.025) + (road.river ? 0.015 : 0);
    legs.push({ from: a, to: b, road: road.id, name: road.name });
  }
  const paceRule = SUPPLY_PACES[pace];
  const risk = 0.06 + Math.max(0, Math.min(10, gaze)) * 0.025 + exposure + WEATHER_RISK[weather] + paceRule.risk
    + (pounds > wagon.capacity ? 0.06 : 0);
  const duration = halfHour(hours * paceRule.time);
  if (!Number.isSafeInteger(duration * 2) || duration <= 0) throw new RangeError('The wagon cannot finish this route');
  return {
    path: [...waypoints], legs, cargo: load, pounds, pace, weather, hours: duration,
    risk: Math.round(Math.max(0.03, Math.min(0.8, risk)) * 100) / 100, reasons: [...reasons],
  };
}

function troubleFor(quote, wagon, seed, id, gaze) {
  const rng = mulberry32(hashSeed(JSON.stringify([seed, id, 'supply-run'])));
  if (rng() >= quote.risk) return null;
  const leg = quote.legs[Math.floor(rng() * quote.legs.length)];
  const roll = rng();
  let kind = roll < 0.55 ? 'ambush' : 'breakdown';
  if ((quote.weather === 'snow' || quote.weather === 'rain') && roll >= 0.75) kind = 'storm';
  const { effects, lines } = meetEvent(wagon, { kind }, { gaze }, rng);
  return { kind, leg: { ...leg }, ...RESCUE_SCENES[kind], wagonEffects: effects, wagonLines: lines };
}

function checkHour(hour) {
  if (!Number.isFinite(hour) || hour < 0 || hour > Number.MAX_SAFE_INTEGER / 2) {
    throw new RangeError('Use a non-negative campaign hour');
  }
}

function updateStores(holdings, id, cargo, sign) {
  const index = holdings.findIndex(holding => holding.id === id);
  if (index < 0) throw new RangeError('The holding is no longer available');
  const holding = holdings[index];
  const stores = { ...holding.stores };
  for (const [kind, amount] of Object.entries(cargo)) {
    const previous = Object.hasOwn(stores, kind) ? stores[kind] : 0;
    const next = previous + sign * amount;
    if (!Number.isSafeInteger(previous) || previous < 0 || !Number.isSafeInteger(next) || next < 0) {
      throw new RangeError('The holding cannot transfer ' + kind);
    }
    stores[kind] = next;
  }
  return holdings.map((item, i) => i === index ? { ...holding, stores } : item);
}

/** The host commits both returned values together. Dispatch debits the origin once. */
export function dispatchSupplyRun(book = newSupplyBook(), holdings, input) {
  const { id, originId, destinationId, wagon, crewIds, seed, now, deadline = null } = input;
  if (!isId(id)) throw new TypeError('A supply run needs a stable ID');
  if (book.runs.some(run => run.id === id)) return { book, holdings };
  if (!isId(seed) || !isId(wagon?.id) || !Array.isArray(crewIds) || !crewIds.length ||
    ![...crewIds].every(isId) || new Set(crewIds).size !== crewIds.length) {
    throw new TypeError('A supply run needs a seed, a wagon and distinct crew IDs');
  }
  if (book.runs.some(run => active(run) &&
    (run.wagonId === wagon.id || run.crewIds.some(crew => crewIds.includes(crew))))) {
    throw new RangeError('The wagon or crew is already on a supply run');
  }
  const origin = holdings.find(holding => holding.id === originId);
  const destination = holdings.find(holding => holding.id === destinationId);
  if (!origin || !destination || originId === destinationId) throw new RangeError('Choose two existing holdings');
  checkHour(now);
  if (deadline !== null) checkHour(deadline);
  const { from, to, path, cargo, pace, weather, gaze } = input;
  const quote = quoteSupplyRun({ from, to, path, cargo, wagon, pace, weather, gaze });
  const due = now + quote.hours;
  checkHour(due);
  const run = {
    id, originId, destinationId, wagonId: wagon.id, crewIds: [...crewIds],
    origin: origin.name || placeById(from).name, destination: destination.name || placeById(to).name,
    quote, started: now, due, deadline, status: 'en-route', trouble: troubleFor(quote, wagon, seed, id, gaze),
  };
  return { book: { runs: [...book.runs, run] }, holdings: updateStores(holdings, originId, quote.cargo, -1) };
}

function replaceRun(book, run) {
  return { runs: book.runs.map(item => item.id === run.id ? run : item) };
}

/** At the ETA, either deliver once or put the run on the rescue board. */
export function checkSupplyRun(book, holdings, { id, now }) {
  checkHour(now);
  const run = book.runs.find(item => item.id === id);
  if (!run || run.status !== 'en-route' || now < run.due) return { book, holdings };
  if (run.trouble) {
    return { book: replaceRun(book, { ...run, status: 'missing' }), holdings };
  }
  const next = { ...run, status: 'delivered', finished: run.due, delivered: { ...run.quote.cargo }, crew: 'safe' };
  return { book: replaceRun(book, next), holdings: updateStores(holdings, run.destinationId, next.delivered, 1) };
}

/** DM-only encounter card. The host uses the real road IDs to stage the rescue. */
export function supplyRescue(book, id) {
  const run = book.runs.find(item => item.id === id);
  if (run?.status !== 'missing') return null;
  return { ...structuredClone(run.trouble), cargo: { ...run.quote.cargo }, crewIds: [...run.crewIds] };
}

/** Resolve after the DM adjudicates the rescue and returns any recovered cargo to the destination. */
export function resolveSupplyRun(book, holdings, { id, now, recovered = {}, crew = 'unaccounted' }) {
  const run = book.runs.find(item => item.id === id);
  if (!run || !active(run)) return { book, holdings };
  checkHour(now);
  if (run.status !== 'missing' || now < run.due) throw new RangeError('The run has not gone missing');
  if (!['safe', 'lost', 'unaccounted'].includes(crew)) throw new RangeError('Unknown crew outcome');
  const delivered = manifest(recovered, { allowEmpty: true });
  for (const [kind, amount] of Object.entries(delivered)) {
    if (amount > (run.quote.cargo[kind] ?? 0)) throw new RangeError('Recovery cannot exceed the original cargo');
  }
  const hasCargo = Object.keys(delivered).length > 0;
  const next = { ...run, status: hasCargo || crew === 'safe' ? 'recovered' : 'lost', finished: now, delivered, crew };
  return { book: replaceRun(book, next), holdings: hasCargo ? updateStores(holdings, run.destinationId, delivered, 1) : holdings };
}

/** Close a shipment the DM has abandoned, including one whose destination no longer exists. */
export function writeOffSupplyRun(book, { id, now }) {
  const run = book.runs.find(item => item.id === id);
  if (!run || !active(run)) return book;
  checkHour(now);
  if (now < run.started) throw new RangeError('The run has not departed');
  return replaceRun(book, { ...run, status: 'lost', finished: now, delivered: {}, crew: 'unaccounted' });
}

/** Send only after the DM chooses which runs the party knows about. */
export function supplyRunsForPlayers(book, revealedIds = []) {
  const visible = new Set(revealedIds);
  return book.runs.filter(run => visible.has(run.id)).map(run => ({
    id: run.id, origin: run.origin, destination: run.destination, status: run.status,
    cargo: { ...run.quote.cargo }, due: run.due, deadline: run.deadline,
    ...(run.finished === undefined ? {} : {
      finished: run.finished, delivered: { ...run.delivered }, crew: run.crew,
      ...(run.deadline !== null && Object.keys(run.delivered).length > 0 ? { late: run.finished > run.deadline } : {}),
    }),
  }));
}
