import { TOWN_LAWS, TOWN_OFFENCES } from '../data/town-bounties.js';

export function newBountyLedger() {
  return { cases: [] };
}

function requireId(value) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('A non-empty string ID is required');
}

function lookup(table, key) {
  return typeof key === 'string' && Object.hasOwn(table, key) ? table[key] : null;
}

function updateCase(ledger, id, update) {
  const entry = ledger.cases.find(item => item.id === id);
  if (!entry) return ledger;
  const next = update(entry);
  if (next === entry) return ledger;
  return { cases: ledger.cases.map(item => item === entry ? next : item) };
}

/** The DM adjudicates an offence and supplies the eligible eyewitnesses. */
export function recordOffence(ledger = newBountyLedger(), { id, townId, suspectId, offence, witnesses = [] }) {
  requireId(id);
  if (ledger.cases.some(entry => entry.id === id)) return ledger;
  requireId(suspectId);
  if (!lookup(TOWN_LAWS, townId)) throw new RangeError('Unknown town jurisdiction');
  const rule = lookup(TOWN_OFFENCES, offence);
  if (!rule) throw new RangeError('Unknown offence');
  if (!Array.isArray(witnesses)) throw new TypeError('Witnesses must be an array of IDs');
  for (const witness of witnesses) requireId(witness);
  const entry = {
    id, townId, suspectId, offence, fine: rule.fine,
    witnesses: [...new Set(witnesses)].filter(witness => witness !== suspectId),
    reportedBy: null, publicName: null, resolution: null,
  };
  return { cases: [...ledger.cases, entry] };
}

/** A witness must actually make it to the authorities before the fine counts. */
export function reportOffence(ledger, { id, witnessId }) {
  return updateCase(ledger, id, entry => {
    if (entry.reportedBy || !entry.witnesses.includes(witnessId)) return entry;
    return { ...entry, reportedBy: witnessId };
  });
}

function outstanding(entry) {
  return entry.reportedBy !== null && entry.resolution === null;
}

/** DM view. Each town tracks each suspect's outstanding charges independently. */
export function bountyStatus(ledger, { townId, suspectId }) {
  const law = lookup(TOWN_LAWS, townId);
  if (!law) return null;
  const charges = ledger.cases.filter(entry => entry.townId === townId && entry.suspectId === suspectId && outstanding(entry));
  const fine = charges.reduce((sum, entry) => sum + entry.fine, 0);
  let response = null;
  if (fine >= law.huntAt) response = 'hunt';
  else if (fine >= law.detainAt) response = 'detain';
  else if (fine > 0) response = 'question';
  return { fine, caseIds: charges.map(entry => entry.id), response, prompt: law.responses[response] ?? null };
}

/** The name or description is the DM's approved public wording. */
export function postBounty(ledger, { id, publicName }) {
  requireId(publicName);
  return updateCase(ledger, id, entry => {
    if (!outstanding(entry) || entry.publicName === publicName.trim()) return entry;
    return { ...entry, publicName: publicName.trim() };
  });
}

/** Plan settlement. Commit the returned ledger only when the DM also applies the cost. */
export function settleBounty(ledger, { id, method }) {
  if (method !== 'paid' && method !== 'pardoned') throw new RangeError('Unknown settlement');
  let costGp = 0;
  const next = updateCase(ledger, id, entry => {
    if (!outstanding(entry)) return entry;
    costGp = method === 'paid' ? entry.fine : 0;
    return { ...entry, resolution: method };
  });
  return { ledger: next, costGp, settled: next !== ledger };
}

/** Public notices never expose witness IDs, hidden charges or the DM's guard prompt. */
export function bountyNotices(ledger, townId) {
  return ledger.cases.filter(entry => entry.townId === townId && outstanding(entry) && entry.publicName !== null)
    .map(entry => ({ name: entry.publicName, offence: TOWN_OFFENCES[entry.offence].label, fine: entry.fine }));
}
