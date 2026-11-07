import { CAMP_CHOICES, CAMP_OUTLOOKS, CAMP_SCENES } from '../data/camp-bonds.js';

export function newCampBonds() {
  return { decisions: [], bonds: [], played: [] };
}

function requireId(id, label) {
  if (typeof id !== 'string' || !id.trim()) throw new TypeError(label + ' must be a non-empty string');
}

function indexRoster(companions) {
  const roster = new Map();
  for (const companion of companions) {
    requireId(companion.id, 'Companion ID');
    requireId(companion.name, 'Companion name');
    if (!Object.hasOwn(CAMP_OUTLOOKS, companion.outlook)) throw new RangeError('Unknown camp outlook');
    if (roster.has(companion.id)) throw new RangeError('Duplicate companion ID');
    roster.set(companion.id, companion);
  }
  return roster;
}

/** Record a DM-confirmed choice once. Witnesses are the companions actually present. */
export function recordCampChoice(state = newCampBonds(), { eventId, choice, witnesses = [] }) {
  requireId(eventId, 'Decision ID');
  if (!Object.hasOwn(CAMP_CHOICES, choice)) throw new RangeError('Unknown camp choice');
  if (state.decisions.includes(eventId)) return state;

  const bonds = new Map(state.bonds.map(bond => [bond.id, bond]));
  for (const { id, outlook } of indexRoster(witnesses).values()) {
    const previous = bonds.get(id);
    if (previous && previous.outlook !== outlook) throw new RangeError('A companion’s outlook cannot change');
    const delta = CAMP_CHOICES[choice].reactions[outlook];
    const score = Math.max(-5, Math.min(5, (previous?.score ?? 0) + delta));
    bonds.set(id, { id, outlook, score });
  }
  return { ...state, decisions: [...state.decisions, eventId], bonds: [...bonds.values()] };
}

function nextScene(state, companion, bond) {
  if (!bond || companion.outlook !== bond.outlook) return null;
  const played = new Set(state.played.filter(scene => scene.companionId === companion.id).map(scene => scene.id));
  for (const scene of CAMP_SCENES[bond.outlook]) {
    if (played.has(scene.id)) continue;
    if (scene.at === 'friction' && bond.score <= -2) return scene;
    if (scene.at === 'trust' && bond.score >= 2) return scene;
    if (scene.at === 'bond' && bond.score >= 4) return scene;
  }
  return null;
}

/** DM-only offers for a completed long rest. Pass only companions still at camp. */
export function campOffers(state = newCampBonds(), { restId, present = [] }) {
  requireId(restId, 'Rest ID');
  if (state.played.some(scene => scene.restId === restId)) return [];
  const bonds = new Map(state.bonds.map(bond => [bond.id, bond]));
  const offers = [];
  for (const companion of indexRoster(present).values()) {
    const scene = nextScene(state, companion, bonds.get(companion.id));
    if (scene) offers.push({ ...scene, companionId: companion.id, name: companion.name });
  }
  return offers;
}

/** Resolve a current offer at most once per long rest, with optional player disclosure. */
export function playCampScene(state = newCampBonds(), { restId, present, companionId, sceneId, share = false }) {
  const offer = campOffers(state, { restId, present })
    .find(scene => scene.companionId === companionId && scene.id === sceneId);
  if (!offer) return { state, scene: null };

  const record = { restId, companionId, id: sceneId, name: offer.name, title: offer.title, opening: offer.opening, shared: share === true };
  return { state: { ...state, played: [...state.played, record] }, scene: offer };
}

/** Only read-aloud from scenes the DM chose to share goes to the player chronicle. */
export function campForPlayers(state = newCampBonds()) {
  return state.played.filter(scene => scene.shared)
    .map(({ name, title, opening }) => ({ name, title, opening }));
}
