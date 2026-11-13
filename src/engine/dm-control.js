const MOVE = new Set(['move', 'stairs', 'undoMove']);
const HERO_ACTION = new Set([...MOVE, 'turnAct', 'oaAns', 'endturn', 'door', 'act', 'search', 'talk', 'dropConc', 'prop', 'puzzle', 'disarm']);

export function playerControlDenial(control, heroId, messageType){
  if (!heroId || !control || !HERO_ACTION.has(messageType)) return '';
  if (control.dmHeroes.includes(heroId)) return 'The DM is controlling your hero.';
  if (control.movementPaused && MOVE.has(messageType)) return 'The DM has paused player movement.';
  return '';
}

export function pendingHeroActions(queue, heroId){
  return heroId ? queue.filter(request => request.id === heroId) : [];
}

// Remove first, then notify. A request that has been declined cannot be approved later.
export function declineHeroActions(queue, heroId, reason){
  const declined = pendingHeroActions(queue, heroId);
  for (const request of declined) queue.splice(queue.indexOf(request), 1);
  for (const request of declined) request.deny?.(reason);
  return declined.length;
}
