function validText(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

/** The question and option labels must be ready to show to players. */
export function openPartyVote({ id, question, options, eligibleSeatIds }) {
  if (!validText(id, 128) || !validText(question, 500)) throw new TypeError('Vote needs an ID and a question');
  if (!Array.isArray(options) || options.length < 2 || options.length > 8) {
    throw new RangeError('A vote needs 2–8 options');
  }
  const publicOptions = Array.from(options, option => {
    if (!validText(option?.id, 128) || !validText(option?.label, 160)) {
      throw new TypeError('Each option needs an ID and a label');
    }
    return { id: option.id, label: option.label.trim() };
  });
  if (new Set(publicOptions.map(option => option.id)).size !== publicOptions.length) {
    throw new RangeError('Option IDs must be unique');
  }
  if (!Array.isArray(eligibleSeatIds) || !eligibleSeatIds.length || !Array.from(eligibleSeatIds).every(id => validText(id, 128))) {
    throw new TypeError('A vote needs at least one eligible seat');
  }
  return {
    id, question: question.trim(), options: publicOptions, eligibleSeatIds: [...new Set(eligibleSeatIds)],
    ballots: [], status: 'open',
  };
}

/** seatId comes from the host's authenticated connection, never the message payload. */
export function castPartyVote(vote, seatId, request) {
  const { voteId, optionId } = request ?? {};
  if (!vote || vote.status !== 'open' || vote.id !== voteId || !vote.eligibleSeatIds.includes(seatId)) return vote;
  if (optionId !== null && !vote.options.some(option => option.id === optionId)) return vote;
  if (vote.ballots.some(ballot => ballot.seatId === seatId)) return vote;
  // First valid ballot stands. Null is an explicit abstention, not a missing ballot.
  return { ...vote, ballots: [...vote.ballots, { seatId, optionId }] };
}

/** The host can close a vote with seats still outstanding, or cancel it without a result. */
export function closePartyVote(vote, { cancel = false } = {}) {
  if (!vote || vote.status !== 'open') return vote;
  return { ...vote, status: cancel ? 'cancelled' : 'closed' };
}

function tally(vote) {
  const counts = new Map(vote.options.map(option => [option.id, 0]));
  let abstentions = 0;
  for (const ballot of vote.ballots) {
    if (ballot.optionId === null) abstentions++;
    else counts.set(ballot.optionId, counts.get(ballot.optionId) + 1);
  }
  const totals = vote.options.map(({ id }) => ({ id, votes: counts.get(id) }));
  const high = Math.max(...counts.values());
  const leaders = high > 0 ? totals.filter(option => option.votes === high).map(option => option.id) : [];
  let outcome = 'no-decision';
  if (leaders.length === 1) outcome = 'winner';
  else if (leaders.length > 1) outcome = 'tie';
  return { outcome, leaders, totals, abstentions, outstanding: vote.eligibleSeatIds.length - vote.ballots.length };
}

/** Use per-seat delivery for receipts. For the table screen, omit seatId. */
export function partyVoteForPlayers(vote, seatId) {
  if (!vote) return null;
  const eligible = vote.eligibleSeatIds.includes(seatId);
  const ballot = eligible ? vote.ballots.find(entry => entry.seatId === seatId) : null;
  return {
    id: vote.id, question: vote.question, status: vote.status,
    options: vote.options.map(({ id, label }) => ({ id, label })),
    canVote: vote.status === 'open' && eligible && !ballot,
    hasVoted: Boolean(ballot),
    choice: ballot?.optionId ?? null,
    result: vote.status === 'closed' ? tally(vote) : null,
  };
}
