import { LOBBY_SIZE, LOBBY_SCENE, LOBBY_SPAWNS, LOBBY_WALLS, PRACTICE_DUMMIES } from '../data/party-lobby.js';
import { heroToken } from './hero.js';
import { attackProfile, spellReach } from './targeting.js';
import { lineClear, ORTHO } from './grid.js';
import { cheb, rollDice } from '../util/core.js';

const { width: W, height: H } = LOBBY_SIZE;
const board = { W, H };
const key = (x, y) => y * W + x;
const walls = new Set(LOBBY_WALLS.map(([x, y]) => key(x, y)));
const scenery = new Set(LOBBY_SCENE.layout.props.map(([, x, y]) => key(x, y)));
const dummyTiles = new Set(PRACTICE_DUMMIES.map(({ x, y }) => key(x, y)));
const isId = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 128;
const inside = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x > 0 && y > 0 && x < W - 1 && y < H - 1;
const floorOpen = (x, y) => inside(x, y) && !walls.has(key(x, y));
const standable = (x, y) => floorOpen(x, y) && !scenery.has(key(x, y)) && !dummyTiles.has(key(x, y));

export function lobbyScene() {
  return { ...LOBBY_SIZE, ...structuredClone(LOBBY_SCENE) };
}

export function openPartyLobby(id) {
  if (!isId(id)) throw new TypeError('A lobby needs a fresh ID');
  return { id, status: 'open', members: [] };
}

function replace(lobby, old, member) {
  return { ...lobby, members: old ? lobby.members.map(item => item === old ? member : item) : [...lobby.members, member] };
}

const current = (lobby, connectionId) => lobby.status === 'open' && isId(connectionId)
  ? lobby.members.find(member => member.connectionId === connectionId)
  : null;

function occupied(lobby, except) {
  return new Set(lobby.members.filter(member => member !== except && member.position)
    .map(member => key(member.position.x, member.position.y)));
}

function spawn(lobby, member) {
  const taken = occupied(lobby, member);
  const preferred = LOBBY_SPAWNS[member.slot - 1];
  const candidates = [preferred, ...LOBBY_SPAWNS];
  // A player can stand on the usual spawn pads. Find a fallback without moving anyone.
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) candidates.push([x, y]);
  const [x, y] = candidates.find(([x, y]) => standable(x, y) && !taken.has(key(x, y)));
  return { x, y };
}

/** Host only. Use the admitted player's stable seat and a fresh connection-instance ID. */
export function admitLobbyPlayer(lobby, { seatId, connectionId, name }) {
  if (lobby.status !== 'open') return lobby;
  if (!isId(seatId) || !isId(connectionId) || typeof name !== 'string' || !name.trim()) {
    throw new TypeError('A lobby player needs a seat, connection and display name');
  }
  const previous = lobby.members.find(member => member.seatId === seatId);
  const binding = current(lobby, connectionId);
  if (binding) return lobby;  // one live binding per connection, including repeated admission
  const used = new Set(lobby.members.map(member => member.slot));
  const slot = previous?.slot ?? LOBBY_SPAWNS.findIndex((_, i) => !used.has(i + 1)) + 1;
  if (!slot) return lobby;
  const member = { seatId, slot, connectionId, name: name.trim().slice(0, 30), ready: false,
    avatar: previous?.avatar ?? null, build: previous?.build ?? 0, position: previous?.position ?? null };
  if (member.avatar && !member.position) member.position = spawn(lobby, member);
  return replace(lobby, previous, member);
}

export function disconnectLobbyPlayer(lobby, connectionId) {
  const member = current(lobby, connectionId);
  return member ? replace(lobby, member, { ...member, connectionId: null, position: null, ready: false }) : lobby;
}

/** Host-only release of a slot, such as a friend who has left for the night. */
export function releaseLobbySeat(lobby, seatId) {
  if (lobby.status !== 'open' || !lobby.members.some(member => member.seatId === seatId)) return lobby;
  return { ...lobby, members: lobby.members.filter(member => member.seatId !== seatId) };
}

function avatarOf(sheet, revision) {
  const token = heroToken(sheet);
  const attacks = token.attacks.map((attack, index) => ({ ...attack, id: revision + ':a' + index, kind: 'attack' }));
  const spells = token.casts.map((spell, index) => ({ ...spell, id: revision + ':s' + index, kind: spell.k }));
  return { heroId: sheet.id, name: token.name.trim().slice(0, 80), cls: token.cls, color: token.color,
    look: structuredClone(token.look), actions: structuredClone([...attacks, ...spells]) };
}

/** Host only. Pass the approved owned sheet, never an unvalidated client payload. */
export function finishLobbyHero(lobby, connectionId, sheet) {
  const member = current(lobby, connectionId);
  if (!member || !isId(sheet?.id) || typeof sheet.name !== 'string' || !sheet.name.trim() ||
    lobby.members.some(other => other !== member && other.avatar?.heroId === sheet.id)) return lobby;
  const build = member.build + 1;
  return replace(lobby, member, { ...member, avatar: avatarOf(sheet, build), build, ready: false,
    position: member.position ?? spawn(lobby, member) });
}

function routeTo(lobby, member, x, y) {
  const taken = occupied(lobby, member);
  const end = key(x, y);
  if (!standable(x, y) || taken.has(end)) return null;
  const start = key(member.position.x, member.position.y);
  const parents = new Map([[start, null]]), queue = [start];
  for (let i = 0; i < queue.length && !parents.has(end); i++) {
    const here = queue[i], ax = here % W, ay = Math.floor(here / W);
    for (const [dx, dy] of ORTHO) {
      const nx = ax + dx, ny = ay + dy, next = key(nx, ny);
      if (!standable(nx, ny) || taken.has(next) || parents.has(next)) continue;
      parents.set(next, here);
      queue.push(next);
    }
  }
  if (!parents.has(end)) return null;
  const path = [];
  for (let here = end; here !== start; here = parents.get(here)) path.push({ x: here % W, y: Math.floor(here / W) });
  return path.reverse();
}

// Imported crafted weapons can carry custom dice. Bound their work before using the shared roller.
function diceSafe(expression) {
  if (typeof expression !== 'string' || expression.length > 128) return false;
  const text = expression.replace(/\s+/g, '');
  if (!/^[+-]?(?:\d*d\d+|\d+)(?:[+-](?:\d*d\d+|\d+))*$/i.test(text)) return false;
  let count = 0;
  for (const match of text.matchAll(/(\d*)d(\d+)/gi)) {
    count += Number(match[1] || 1);
    if (+match[2] < 1 || +match[2] > 1000 || count > 100) return false;
  }
  return true;
}

function practice(member, { actionId, targetId }, roll) {
  const action = member.avatar.actions.find(option => option.id === actionId);
  if (!action) return { reason: 'unknown-action' };
  if (!['attack', 'save', 'auto'].includes(action.kind)) return { action: action.n, kind: 'preview' };
  const target = PRACTICE_DUMMIES.find(dummy => dummy.id === targetId);
  if (!target) return { reason: 'choose-a-dummy' };
  const { x, y } = member.position;
  const distance = cheb(x, y, target.x, target.y);
  const profile = action.kind === 'attack' ? attackProfile(action) : null;
  const ranged = profile && distance > profile.melee;
  const reach = profile ? Math.max(profile.melee, profile.far) : spellReach(action) || (action.area ? Math.round(action.area[1] / 5) : 0);
  if (distance > reach) return { reason: 'out-of-range' };
  if (!lineClear(board, x + 0.5, y + 0.5, target.x + 0.5, target.y + 0.5,
    (_, index) => floorOpen(index % W, Math.floor(index / W)))) return { reason: 'blocked' };
  if (action.d && !diceSafe(action.d)) return { reason: 'invalid-dice' };

  const result = { action: action.n, targetId, kind: action.kind, damage: 0 };
  if (action.kind === 'attack') {
    result.rolls = [];
    for (let i = 0; i < (action.rays || 1); i++) {
      const first = roll('1d20').total;
      const natural = ranged && distance > profile.near ? Math.min(first, roll('1d20').total) : first;
      const total = natural + action.b;
      const crit = natural === 20, hit = crit || (natural !== 1 && total >= target.ac);
      const damage = hit ? roll(action.d, crit).total : 0;
      result.damage += damage;
      result.rolls.push({ natural, total, hit, crit, damage });
    }
    result.ac = target.ac;
  } else if (action.kind === 'save') {
    const natural = roll('1d20').total, total = natural + target.save, saved = total >= action.dc;
    const raw = action.d && (!saved || action.half) ? roll(action.d).total : 0;
    result.damage = saved ? Math.floor(raw / 2) : raw;
    result.save = { natural, total, dc: action.dc, saved };
  } else if (action.d) result.damage = roll(action.d).total;
  return result;
}

/** Only the host may supply connectionId and the roller. Client input names actions and tiles. */
export function playLobby(lobby, connectionId, message, roll = rollDice) {
  const member = current(lobby, connectionId);
  const deny = reason => ({ lobby, ok: false, reason });
  if (!member || message?.lobbyId !== lobby.id) return deny('not-in-lobby');
  if (message.kind === 'build') return { ok: true, lobby: replace(lobby, member,
    { ...member, avatar: null, position: null, ready: false }) };
  if (!member.avatar || !member.position) return deny('finish-your-hero');
  if (message.kind === 'ready' && typeof message.ready === 'boolean') {
    return { ok: true, lobby: member.ready === message.ready ? lobby : replace(lobby, member, { ...member, ready: message.ready }) };
  }
  if (message.kind === 'move') {
    const path = routeTo(lobby, member, message.x, message.y);
    if (!path) return deny('blocked');
    return { ok: true, path, lobby: path.length ? replace(lobby, member, { ...member, position: path.at(-1) }) : lobby };
  }
  if (message.kind === 'practice') {
    const result = practice(member, message, roll);
    return result.reason ? deny(result.reason) : { ok: true, lobby, practice: result };
  }
  return deny('unknown-action');
}

/** Public view for players and the TV. No connection IDs, hero IDs or private action lists. */
export function lobbyForPlayers(lobby) {
  return {
    id: lobby.id, status: lobby.status,
    members: lobby.members.map(({ slot, name, ready, connectionId, avatar, position }) => ({
      slot, name, stage: !connectionId ? 'reconnecting' : ready ? 'ready' : avatar ? 'practising' : 'building',
      hero: avatar ? { name: avatar.name, cls: avatar.cls, color: avatar.color, look: structuredClone(avatar.look) } : null,
      position: position ? { ...position } : null,
    })),
    dummies: PRACTICE_DUMMIES.map(({ id, name, x, y, ac }) => ({ id, name, x, y, ac })),
  };
}

/** Deliver the action buttons only to their own admitted connection. */
export function lobbyForPlayer(lobby, connectionId) {
  const view = lobbyForPlayers(lobby), member = current(lobby, connectionId);
  return { ...view, yourSlot: member?.slot ?? null,
    actions: (member?.avatar?.actions ?? []).map(({ id, n, kind }) => ({ id, name: n, kind })) };
}

/** Host-only. Carry approved hero IDs into the existing seating flow. */
export function startLobbySession(lobby, { allowPartial = false } = {}) {
  const party = lobby.members.filter(member => member.connectionId && member.ready && member.avatar)
    .map(member => ({ seatId: member.seatId, heroId: member.avatar.heroId }));
  if (lobby.status !== 'open' || !party.length || (!allowPartial && party.length !== lobby.members.length)) {
    return { lobby, party: null };
  }
  return { lobby: { ...lobby, status: 'started' }, party };
}
