import { playLobby } from './party-lobby.js';

// The plate is an overlay on a walkable tile in the Lantern Yard.
const PLATE = { x: 6, y: 7 };
const TARGETS = ['straw', 'shield', 'lantern'];

function belongsToLobby(drill, lobby) {
  return drill?.lobbyId === lobby.id && lobby.status === 'open';
}

function plateHolder(lobby) {
  return lobby.members.find(member => member.connectionId && member.avatar &&
    member.position?.x === PLATE.x && member.position.y === PLATE.y);
}

/** The host opens or resets a drill with a fresh ID, separate from the lobby ID. */
export function openLanternDrill(lobby, id) {
  if (lobby.status !== 'open' || typeof id !== 'string' || !id.trim() || id.length > 128) {
    throw new TypeError('An open lobby and a fresh drill ID are required');
  }
  return { id, lobbyId: lobby.id, cleared: 0 };
}

/** Send the same public overlay to all players and the table screen. */
export function lanternDrillForPlayers(drill, lobby) {
  if (!belongsToLobby(drill, lobby)) return null;
  const holder = plateHolder(lobby);
  const targetId = TARGETS[drill.cleared] ?? null;
  return {
    id: drill.id, title: 'The Lantern Gate',
    instructions: 'One hero stands on the plate. A different hero hits the lit targets in order.',
    plate: { ...PLATE, holderSlot: holder?.slot ?? null },
    shutterOpen: Boolean(holder && targetId),
    targetId,
    targets: TARGETS.map((id, index) => ({
      id, stage: index < drill.cleared ? 'cleared' : index === drill.cleared ? 'lit' : 'waiting',
    })),
    complete: targetId === null,
  };
}

/**
 * Drop-in host wrapper for the yard. The real lobby roller verifies the action and range
 * before the drill can score it. A phone supplies an action, never a hit result.
 */
export function playLanternDrill(drill, lobby, connectionId, message, roll) {
  const played = playLobby(lobby, connectionId, message, roll);
  const result = { ...played, drill };
  if (!played.ok || !played.practice || !belongsToLobby(drill, played.lobby) || message.drillId !== drill.id) return result;

  const targetId = TARGETS[drill.cleared];
  if (!targetId) return { ...result, drillFeedback: 'complete' };
  const holder = plateHolder(played.lobby);
  if (!holder) return { ...result, drillFeedback: 'stand-on-plate' };
  const shooter = played.lobby.members.find(member => member.connectionId === connectionId);
  if (holder.seatId === shooter.seatId) return { ...result, drillFeedback: 'need-a-partner' };
  if (played.practice.targetId !== targetId) return { ...result, drillFeedback: 'hit-the-lit-target' };
  if (!(played.practice.damage > 0)) return { ...result, drillFeedback: 'try-again' };

  const cleared = drill.cleared + 1;
  return { ...result, drill: { ...drill, cleared }, drillFeedback: cleared === TARGETS.length ? 'complete' : 'target-cleared' };
}
