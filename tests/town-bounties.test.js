import test from 'node:test';
import assert from 'node:assert/strict';
import { PLACES } from '../src/data/campaign.js';
import { TOWN_LAWS } from '../src/data/town-bounties.js';
import { newBountyLedger, recordOffence, reportOffence, bountyStatus, postBounty, settleBounty, bountyNotices } from '../src/engine/town-bounties.js';

const scope = { townId: 'vallaki', suspectId: 'pc-1' };
const theft = { ...scope, id: 'coin-purse', offence: 'theft', witnesses: ['shopkeeper'] };
const report = (ledger, id, witnessId = 'shopkeeper') => reportOffence(ledger, { id, witnessId });

test('an eyewitness must report before any fine, and duplicate evidence cannot count twice', () => {
  const blank = Object.freeze({ cases: Object.freeze([]) });
  const ledger = recordOffence(blank, { ...theft, witnesses: ['shopkeeper', 'shopkeeper', 'pc-1'] });
  assert.deepEqual(blank, newBountyLedger());
  assert.equal(bountyStatus(ledger, scope).fine, 0);
  assert.equal(report(ledger, theft.id, 'pc-1'), ledger);
  assert.equal(report(ledger, theft.id, 'stranger'), ledger);
  assert.equal(postBounty(ledger, { id: theft.id, publicName: 'Red Coat' }), ledger);
  const reported = report(ledger, theft.id);
  assert.equal(bountyStatus(reported, scope).fine, 15);
  assert.equal(report(reported, theft.id), reported);
  assert.equal(recordOffence(reported, { ...theft, offence: 'killing' }), reported);
  const unseen = recordOffence(reported, { ...theft, id: 'unseen', witnesses: [] });
  assert.equal(report(unseen, 'unseen'), unseen);
  assert.equal(bountyStatus(unseen, scope).fine, 15);
});

test('the same offence gets different responses across towns and ignores other suspects', () => {
  for (const id of Object.keys(TOWN_LAWS)) assert.ok(PLACES.some(place => place.id === id));
  let ledger = recordOffence(undefined, theft);
  ledger = recordOffence(ledger, { ...theft, id: 'other-town', townId: 'krezk' });
  ledger = recordOffence(ledger, { ...theft, id: 'other-hero', suspectId: 'pc-2' });
  for (const id of [theft.id, 'other-town', 'other-hero']) ledger = report(ledger, id);
  assert.deepEqual(bountyStatus(ledger, scope).caseIds, [theft.id]);
  assert.equal(bountyStatus(ledger, scope).response, 'detain');
  assert.equal(bountyStatus(ledger, { ...scope, townId: 'krezk' }).response, 'question');
  ledger = report(recordOffence(ledger, { ...theft, id: 'attack', offence: 'killing' }), 'attack');
  assert.equal(bountyStatus(ledger, scope).response, 'hunt');
});

test('only posted notices go public and settling one case leaves private charges in place', () => {
  let ledger = report(recordOffence(undefined, theft), theft.id);
  ledger = report(recordOffence(ledger, { ...theft, id: 'hidden', offence: 'assault' }), 'hidden');
  assert.deepEqual(bountyNotices(ledger, 'vallaki'), []);
  ledger = postBounty(ledger, { id: theft.id, publicName: 'Red Coat' });
  assert.deepEqual(bountyNotices(ledger, 'vallaki'), [{ name: 'Red Coat', offence: 'Theft', fine: 15 }]);
  assert.deepEqual(bountyNotices(ledger, 'krezk'), []);
  const result = settleBounty(JSON.parse(JSON.stringify(ledger)), { id: theft.id, method: 'paid' });
  assert.equal(result.costGp, 15);
  assert.equal(result.settled, true);
  assert.equal(bountyStatus(ledger, scope).fine, 40);
  assert.equal(bountyStatus(result.ledger, scope).fine, 25);
  assert.deepEqual(bountyNotices(result.ledger, 'vallaki'), []);
  assert.deepEqual(settleBounty(result.ledger, { id: theft.id, method: 'paid' }),
    { ledger: result.ledger, costGp: 0, settled: false });
  assert.equal(report(result.ledger, theft.id), result.ledger);
  const pardon = settleBounty(result.ledger, { id: 'hidden', method: 'pardoned' });
  assert.equal(pardon.costGp, 0);
  assert.equal(bountyStatus(pardon.ledger, scope).response, null);
});

test('invalid jurisdictions and offences cannot become charges', () => {
  assert.throws(() => recordOffence(undefined, { ...theft, townId: '__proto__' }), RangeError);
  assert.throws(() => recordOffence(undefined, { ...theft, offence: 'constructor' }), RangeError);
  assert.throws(() => recordOffence(undefined, { ...theft, witnesses: [null] }), TypeError);
});
