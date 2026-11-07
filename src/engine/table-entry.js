const MAX_RECENT_TABLES = 8;
const validId = id => typeof id === 'string' && id.trim().length > 0 && id.length <= 128;

export function newTablePassport() {
  return { tables: [] };
}

/** Local history only. Record an admitted welcome, never an attempted room code. */
export function rememberTable(passport = newTablePassport(), { tableId, label, code, at, heroId = null }) {
  if (!validId(tableId) || typeof label !== 'string' || !label.trim() || typeof code !== 'string' ||
    !/^[A-Z0-9]{4,12}$/.test(code.trim().toUpperCase()) || !Number.isSafeInteger(at) || at < 0 ||
    (heroId !== null && !validId(heroId))) throw new TypeError('Invalid table history entry');
  const previous = passport.tables.find(table => table.tableId === tableId);
  if (previous && previous.at > at) return passport;
  const record = {
    tableId, label: label.trim().slice(0, 80), code: code.trim().toUpperCase(), at,
    heroId: heroId ?? previous?.heroId ?? null,
  };
  const others = passport.tables.filter(table => table.tableId !== tableId);
  return { tables: [record, ...others].sort((a, b) => b.at - a.at).slice(0, MAX_RECENT_TABLES) };
}

/** A reused code can reach a different campaign. Compare IDs before suggesting a remembered hero. */
export function rememberedHero(passport, { expectedTableId, actualTableId, ownedHeroIds }) {
  if (!validId(expectedTableId) || expectedTableId !== actualTableId) return null;
  const heroId = passport.tables.find(table => table.tableId === actualTableId)?.heroId;
  return heroId && ownedHeroIds.includes(heroId) ? heroId : null;
}

/**
 * Host-only seating decision. Ownership and occupied tokens come from the host's
 * admitted connection and live state. A peer's supplied sheet or token ID is never proof.
 */
export function planTableEntry({
  ownedHeroIds = [], tokens = [], occupiedTokenIds = [],
  requestedHeroId = null, lastTokenId = null, preparing = false,
} = {}) {
  const heroes = [...new Set(ownedHeroIds.filter(validId))];
  if (requestedHeroId !== null && !heroes.includes(requestedHeroId)) {
    return { kind: 'denied', reason: 'hero-unavailable' };
  }
  const occupied = new Set(occupiedTokenIds);
  const ownedTokens = tokens.filter(token => token.kind === 'pc' && validId(token.id) &&
    heroes.includes(token.charId) && !token.dead && !token.flags?.gone);
  const remembered = ownedTokens.find(token => token.id === lastTokenId && !occupied.has(token.id));
  const heroId = requestedHeroId ?? remembered?.charId ?? (heroes.length === 1 ? heroes[0] : null);
  if (!heroId) return heroes.length ? { kind: 'choose', heroIds: heroes } : { kind: 'waiting', reason: 'no-hero' };

  const candidates = ownedTokens.filter(token => token.charId === heroId);
  if (candidates.some(token => occupied.has(token.id))) return { kind: 'waiting', reason: 'seat-taken', heroId };
  const token = candidates.find(entry => entry.id === lastTokenId) ?? candidates[0];
  if (token) return { kind: 'seat', heroId, tokenId: token.id };
  // A dead or departed token is for the DM to handle, even if the sheet is still owned.
  if (tokens.some(entry => entry.kind === 'pc' && entry.charId === heroId)) {
    return { kind: 'waiting', reason: 'hero-off-map', heroId };
  }
  if (preparing) return { kind: 'waiting', reason: 'scene-preparing', heroId };
  return { kind: 'place', heroId };
}
