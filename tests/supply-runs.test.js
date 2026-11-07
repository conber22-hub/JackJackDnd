import test from 'node:test';
import assert from 'node:assert/strict';
import { newSupplyBook, quoteSupplyRun, dispatchSupplyRun, checkSupplyRun, supplyRescue,
  resolveSupplyRun, writeOffSupplyRun, supplyRunsForPlayers } from '../src/engine/supply-runs.js';

const wagon = Object.freeze({ id: 'w-1', capacity: 300, speed: 24, hp: 30 });
const holdings = Object.freeze([
  Object.freeze({ id: 'a', name: 'Market Storehouse', stores: Object.freeze({ salt: 20, timber: 10, gp: 2.5 }) }),
  Object.freeze({ id: 'b', name: 'Hilltop Refuge', stores: Object.freeze({ salt: 0, timber: 5 }) }),
]);
const plan = Object.freeze({
  id: 'run-1', originId: 'a', destinationId: 'b', from: 'vallaki', to: 'krezk', now: 24, deadline: 32,
  wagon, cargo: Object.freeze({ salt: 4, timber: 2 }), crewIds: Object.freeze(['c-1']), seed: 'weather-0',
});
const dispatch = overrides => dispatchSupplyRun(undefined, holdings, { ...plan, ...overrides });

test('Valley route uses existing wagon speed rules and makes haste a time-risk trade', () => {
  const steady = quoteSupplyRun(plan);
  assert.deepEqual(steady.path, ['vallaki', 'winery', 'krezk']);
  assert.deepEqual(steady.legs.map(leg => leg.road), ['r-winery', 'r-krezk']);
  assert.equal(steady.pounds, 40);
  assert.equal(steady.hours, 8);
  const cautious = quoteSupplyRun({ ...plan, pace: 'cautious' });
  const hurry = quoteSupplyRun({ ...plan, pace: 'hurry' });
  assert.ok(cautious.hours > steady.hours && hurry.hours < steady.hours);
  assert.ok(cautious.risk < steady.risk && hurry.risk > steady.risk);
  assert.equal(quoteSupplyRun({ ...plan, weather: 'snow' }).hours, steady.hours * 2);
  assert.equal(quoteSupplyRun({ ...plan, wagon: { ...wagon, capacity: 25 } }).hours, steady.hours * 2);
  assert.ok(quoteSupplyRun({ ...plan, wagon: { ...wagon, damage: 20 } }).hours > steady.hours);
});

test('dispatch reserves the cargo once and blocks overloading, short stores and double-booking', () => {
  const departure = dispatch();
  assert.equal(departure.holdings[0].stores.salt, 16);
  assert.equal(departure.holdings[0].stores.timber, 8);
  assert.equal(departure.holdings[0].stores.gp, 2.5);
  assert.equal(holdings[0].stores.salt, 20);
  assert.equal(dispatchSupplyRun(departure.book, departure.holdings, plan).book, departure.book);
  assert.throws(() => dispatchSupplyRun(departure.book, departure.holdings, { ...plan, id: 'second' }), /already/);
  assert.throws(() => dispatchSupplyRun(departure.book, departure.holdings,
    { ...plan, id: 'second', wagon: { ...wagon, id: 'w-2' } }), /already/);
  assert.throws(() => dispatch({ cargo: { salt: 21 } }), /cannot transfer/);
  assert.throws(() => dispatch({ cargo: { stone: 31 } }), /cannot move/);
  assert.throws(() => dispatch({ wagon: { ...wagon, damage: 30 } }), /cannot travel/);
  assert.throws(() => dispatch({ path: ['vallaki', 'krezk'] }), /no road/);
  assert.throws(() => dispatch({ destinationId: 'missing' }), /existing holdings/);
  assert.throws(() => dispatch({ cargo: { gp: 1 } }), /whole units/);
});

test('a quiet run arrives once at the ETA even if the host checks it late', () => {
  const departure = dispatch();
  const saved = JSON.parse(JSON.stringify(departure.book));
  assert.equal(checkSupplyRun(saved, departure.holdings, { id: plan.id, now: 31.5 }).book, saved);
  const arrival = checkSupplyRun(saved, departure.holdings, { id: plan.id, now: 38 });
  assert.equal(arrival.holdings[0].stores.salt, 16);
  assert.deepEqual(arrival.holdings[1].stores, { salt: 4, timber: 7 });
  assert.equal(checkSupplyRun(arrival.book, arrival.holdings, { id: plan.id, now: 50 }).holdings, arrival.holdings);
  const [receipt] = supplyRunsForPlayers(arrival.book, [plan.id]);
  assert.equal(receipt.status, 'delivered');
  assert.equal(receipt.finished, 32);
  assert.equal(receipt.late, false);
});

test('ambushes are repeatable across reloads and stay off player views', () => {
  const departure = dispatch({ seed: 'weather-13', wagon: { ...wagon, fittings: ['ward-runes'] } });
  assert.deepEqual(departure, dispatch({ seed: 'weather-13', wagon: { ...wagon, fittings: ['ward-runes'] } }));
  assert.deepEqual(supplyRunsForPlayers(departure.book), []);
  assert.equal(supplyRescue(departure.book, plan.id), null);
  const saved = JSON.parse(JSON.stringify(departure.book));
  const checked = checkSupplyRun(saved, departure.holdings, { id: plan.id, now: 32 });
  assert.equal(checked.holdings, departure.holdings);
  assert.equal(checkSupplyRun(checked.book, checked.holdings, { id: plan.id, now: 100 }).book, checked.book);
  const rescue = supplyRescue(checked.book, plan.id);
  assert.equal(rescue.kind, 'ambush');
  assert.equal(rescue.wagonEffects.checkMod, -2);
  assert.ok(saved.runs[0].quote.legs.some(leg => leg.road === rescue.leg.road));
  const [card] = supplyRunsForPlayers(checked.book, [plan.id]);
  assert.equal(card.status, 'missing');
  for (const secret of ['c-1', 'w-1', rescue.prompt, rescue.leg.road, 'risk']) assert.ok(!JSON.stringify(card).includes(secret));
  rescue.wagonEffects.checkMod = 99;
  assert.equal(supplyRescue(checked.book, plan.id).wagonEffects.checkMod, -2);
});

test('rescuing crew and partial cargo are independent, with no extra cargo on retry', () => {
  const departure = dispatch({ seed: 'weather-3', wagon: { ...wagon, fittings: ['spare-wheel'] } });
  const missing = checkSupplyRun(departure.book, departure.holdings, { id: plan.id, now: 32 });
  assert.equal(supplyRescue(missing.book, plan.id).wagonEffects.delayHours, 1);
  const result = { id: plan.id, now: 36, recovered: { salt: 2 }, crew: 'lost' };
  assert.throws(() => resolveSupplyRun(missing.book, missing.holdings, { ...result, recovered: { salt: 5 } }), /exceed/);
  const recovered = resolveSupplyRun(missing.book, missing.holdings, result);
  assert.deepEqual(recovered.holdings[1].stores, { salt: 2, timber: 5 });
  const [card] = supplyRunsForPlayers(recovered.book, [plan.id]);
  assert.equal(card.status, 'recovered');
  assert.equal(card.crew, 'lost');
  assert.equal(card.late, true);
  assert.equal(resolveSupplyRun(recovered.book, recovered.holdings, result).holdings, recovered.holdings);
  const savedCrew = resolveSupplyRun(missing.book, missing.holdings, { ...result, recovered: {}, crew: 'safe' });
  assert.equal(savedCrew.holdings, missing.holdings);
  assert.equal(savedCrew.book.runs[0].crew, 'safe');
});

test('a write-off closes a lost shipment and releases the wagon and crew', () => {
  assert.deepEqual(newSupplyBook(), { runs: [] });
  const departure = dispatch();
  const lost = writeOffSupplyRun(departure.book, { id: plan.id, now: 26 });
  assert.equal(lost.runs[0].status, 'lost');
  assert.equal(lost.runs[0].crew, 'unaccounted');
  assert.equal(writeOffSupplyRun(lost, { id: plan.id, now: 27 }), lost);
  assert.equal(checkSupplyRun(lost, departure.holdings, { id: plan.id, now: 34 }).holdings, departure.holdings);
  const next = dispatchSupplyRun(lost, departure.holdings, { ...plan, id: 'replacement', now: 34, deadline: 44 });
  assert.equal(next.holdings[0].stores.salt, 12);
});
