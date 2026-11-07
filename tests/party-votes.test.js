import test from 'node:test';
import assert from 'node:assert/strict';
import { openPartyVote, castPartyVote, closePartyVote, partyVoteForPlayers } from '../src/engine/party-votes.js';

const input = {
  id: 'the-road', question: 'Which road do we take?',
  options: [{ id: 'ridge', label: 'Take the ridge', private: 'The DM’s ambush' }, { id: 'river', label: 'Follow the river' }],
  eligibleSeatIds: ['seat-a', 'seat-b', 'seat-c', 'seat-c'],
};
const cast = (vote, seat, optionId, voteId = input.id) => castPartyVote(vote, seat, { voteId, optionId });

test('only an eligible seat may cast one valid ballot on the current vote', () => {
  const vote = openPartyVote(input);
  Object.freeze(vote.ballots);
  Object.freeze(vote);
  assert.equal(cast(vote, 'outsider', 'ridge'), vote);
  assert.equal(cast(vote, 'seat-a', 'missing'), vote);
  assert.equal(cast(vote, 'seat-a', 'ridge', 'old-vote'), vote);
  assert.equal(castPartyVote(vote, 'seat-a', null), vote);
  const first = cast(vote, 'seat-a', 'ridge');
  assert.equal(vote.ballots.length, 0);
  assert.equal(cast(first, 'seat-a', 'ridge'), first);
  assert.equal(cast(first, 'seat-a', 'river'), first);
  const closed = closePartyVote(first);
  assert.equal(cast(closed, 'seat-b', 'river'), closed);
});

test('private receipts reveal only the receiving seat’s choice before close', () => {
  const vote = cast(openPartyVote(input), 'seat-a', 'ridge');
  const player = partyVoteForPlayers(vote, 'seat-a');
  assert.equal(player.hasVoted, true);
  assert.equal(player.choice, 'ridge');
  assert.equal(player.canVote, false);
  assert.equal(partyVoteForPlayers(vote, 'seat-b').canVote, true);
  assert.equal(partyVoteForPlayers(vote, 'seat-b').choice, null);
  const table = partyVoteForPlayers(vote);
  assert.equal(table.canVote, false);
  assert.equal(table.choice, null);
  assert.equal(table.result, null);
  const json = JSON.stringify(table);
  for (const hidden of ['seat-a', 'seat-b', 'seat-c', 'ballots', 'ambush']) assert.ok(!json.includes(hidden));
  table.options[0].label = 'changed';
  assert.equal(vote.options[0].label, 'Take the ridge');
});

test('closing reports ties, winners, abstentions and outstanding seats after reload', () => {
  const a = cast(openPartyVote(input), 'seat-a', 'ridge');
  const tie = cast(a, 'seat-b', 'river');
  const result = partyVoteForPlayers(closePartyVote(JSON.parse(JSON.stringify(tie)))).result;
  assert.deepEqual(result, {
    outcome: 'tie', leaders: ['ridge', 'river'],
    totals: [{ id: 'ridge', votes: 1 }, { id: 'river', votes: 1 }], abstentions: 0, outstanding: 1,
  });
  const win = partyVoteForPlayers(closePartyVote(cast(a, 'seat-b', null))).result;
  assert.equal(win.outcome, 'winner');
  assert.deepEqual(win.leaders, ['ridge']);
  assert.equal(win.abstentions, 1);
  assert.equal(win.outstanding, 1);
  const noDecision = partyVoteForPlayers(closePartyVote(cast(openPartyVote(input), 'seat-a', null))).result;
  assert.equal(noDecision.outcome, 'no-decision');
  assert.deepEqual(noDecision.leaders, []);
});

test('cancelled votes stay closed and publish no tally', () => {
  const a = cast(openPartyVote(input), 'seat-a', 'river');
  const cancelled = closePartyVote(a, { cancel: true });
  assert.equal(cast(cancelled, 'seat-b', 'ridge'), cancelled);
  assert.equal(closePartyVote(cancelled), cancelled);
  assert.equal(partyVoteForPlayers(cancelled).status, 'cancelled');
  assert.equal(partyVoteForPlayers(cancelled).result, null);
  assert.throws(() => openPartyVote({ ...input, options: [input.options[0], input.options[0]] }), /unique/);
  assert.throws(() => openPartyVote({ ...input, eligibleSeatIds: [] }), /eligible/);
});
