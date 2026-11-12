/* 🏮 THE LANTERN YARD, DM SIDE — ChatGPT's party lobby (engine/party-lobby.js) and Lantern Gate drill
   (engine/lantern-drill.js) at the table. At the start of the night the DM opens the yard: as each player finishes
   or picks their hero, the hero walks in, and they can try its attacks and spells on three practice dummies while
   the others are still building, then say they're ready. The drill is a two-hero game: one stands on the plate to
   open the shutter, another puts out the lit lanterns in order. When everyone is ready (or the DM takes the ready
   ones), the party sets out and the yard is gone.
   The yard is only for the night: nothing in it is saved, and practice spends no hit points, slots or items. Who a
   player is comes from their connection here (net/table.js), never from what their phone says. */
import { openPartyLobby, admitLobbyPlayer, disconnectLobbyPlayer, releaseLobbySeat, finishLobbyHero, playLobby,
  lobbyForPlayers, lobbyForPlayer, startLobbySession } from '../engine/party-lobby.js';
import { openLanternDrill, lanternDrillForPlayers, playLanternDrill } from '../engine/lantern-drill.js';
import { PRACTICE_DUMMIES } from '../data/party-lobby.js';
import { uid } from '../util/core.js';

export const yard = { lobby:null, drill:null, feed:[], built:new Map() };   // built: seat → the sheet its hero was made from
export const yardOpen = () => yard.lobby?.status === 'open';
const say = line => { yard.feed = [...yard.feed, line].slice(-6); };
const dummyName = id => PRACTICE_DUMMIES.find(d => d.id === id)?.name || 'dummy';

export function openYard(){
  yard.lobby = openPartyLobby(`yard-${uid()}${uid()}`); yard.drill = null; yard.feed = []; yard.built.clear();
  say('🔥 The fire is lit in the Lantern Yard.');
}
export function closeYard(){ yard.lobby = null; yard.drill = null; yard.feed = []; yard.built.clear(); }

/* A player at the table comes into the yard (or back to it), with the hero they sit at if it's theirs.
   seatId: who they are (name + secret word); cid: this connection, and no other. */
export function admitToYard({ seatId, cid, name, sheet }){
  if (!yardOpen() || !seatId || !cid || !String(name || '').trim()) return false;
  try { yard.lobby = admitLobbyPlayer(yard.lobby, { seatId, connectionId:cid, name }); } catch { return false; }
  if (sheet) heroToYard(seatId, cid, sheet);
  return true;
}
// Their hero walks in (again, if the sheet changed since: a rebuilt hero has to say it's ready again).
export function heroToYard(seatId, cid, sheet){
  if (!yardOpen() || !sheet?.id) return false;
  const m = yard.lobby.members.find(x => x.connectionId === cid), stamp = `${sheet.id}@${sheet.updated || 0}`;
  if (!m || (m.avatar?.heroId === sheet.id && yard.built.get(seatId) === stamp)) return false;
  const before = yard.lobby; yard.lobby = finishLobbyHero(yard.lobby, cid, sheet);
  if (yard.lobby === before) return false;
  yard.built.set(seatId, stamp);
  if (m.avatar?.heroId !== sheet.id) say(`${sheet.name} walks into the yard.`);
  return true;
}
export function leaveYard(cid){ if (yardOpen()) yard.lobby = disconnectLobbyPlayer(yard.lobby, cid); }
export function releaseFromYard(slot){
  const m = yard.lobby?.members.find(x => x.slot === slot); if (!m || m.connectionId) return false;
  yard.lobby = releaseLobbySeat(yard.lobby, m.seatId); yard.built.delete(m.seatId); return true;
}

// Only the fields the yard reads, as the types it expects (the engine checks the rest: routes, range, sight).
function cleanMsg(m){
  const s = v => typeof v === 'string' ? v.slice(0, 128) : undefined;
  return { lobbyId:s(m?.lobbyId), kind:s(m?.kind), drillId:s(m?.drillId), actionId:s(m?.actionId), targetId:s(m?.targetId),
    x:Number.isInteger(m?.x) ? m.x : undefined, y:Number.isInteger(m?.y) ? m.y : undefined, ...(typeof m?.ready === 'boolean' ? { ready:m.ready } : {}) };
}
export function practiceLine(hero, p){
  const dummy = `the ${dummyName(p.targetId)}`;
  if (p.kind === 'attack'){
    const hits = p.rolls.filter(r => r.hit).length, crit = p.rolls.some(r => r.crit);
    return `${hero}'s ${p.action} ${crit ? 'lands a critical on' : hits ? 'hits' : 'misses'} ${dummy}${p.damage ? ` for ${p.damage}` : ''}.`;
  }
  if (p.kind === 'save') return `${dummy[0].toUpperCase()}${dummy.slice(1)} ${p.save.saved ? 'shrugs off' : 'is caught by'} ${hero}'s ${p.action}${p.damage ? ` (${p.damage})` : ''}.`;
  return `${hero}'s ${p.action} strikes ${dummy}${p.damage ? ` for ${p.damage}` : ''}.`;
}
/* A player's move in the yard: walk, practise, ready or not, rebuild. → the engine's answer (ok, reason, path,
   practice, drillFeedback) and their slot (for the walk on everyone's board). */
export function playYard(cid, raw){
  if (!yardOpen()) return { ok:false, reason:'not-in-lobby' };
  const m = cleanMsg(raw), member = yard.lobby.members.find(x => x.connectionId === cid);
  const r = yard.drill ? playLanternDrill(yard.drill, yard.lobby, cid, m) : playLobby(yard.lobby, cid, m);
  if (!r.ok || !member) return r;
  const was = yard.drill;
  yard.lobby = r.lobby; if (r.drill) yard.drill = r.drill;
  if (r.practice && r.practice.kind !== 'preview') say(practiceLine(member.avatar?.name || member.name, r.practice));
  if (yard.drill !== was && r.drillFeedback === 'target-cleared'){
    const v = lanternDrillForPlayers(yard.drill, yard.lobby);
    say(`🏮 The ${dummyName(r.practice.targetId)}'s lantern goes dark. Next: the ${dummyName(v?.targetId)}.`);
  }
  if (yard.drill !== was && r.drillFeedback === 'complete') say('🏮 The last lantern goes dark, and the Lantern Gate swings open!');
  if (m.kind === 'ready' && member.ready !== m.ready) say(`${member.avatar?.name || member.name} is ${m.ready ? 'ready' : 'not ready yet'}.`);
  if (m.kind === 'build') yard.built.delete(member.seatId);
  return { ...r, slot:member.slot };
}

// The DM starts the Lantern Gate drill (or starts it again from the first lantern), or puts it away.
export function startDrill(){
  if (!yardOpen()) return false;
  yard.drill = openLanternDrill(yard.lobby, `drill-${uid()}${uid()}`);
  say('🏮 The Lantern Gate: one hero holds the plate, another puts out the lanterns in order.'); return true;
}
export function stopDrill(){ yard.drill = null; }

// What a phone, or the TV (cid null), is shown: the yard, the drill, the last few things that happened.
export function yardView(cid = null){
  if (!yardOpen()) return null;
  return { view:cid ? lobbyForPlayer(yard.lobby, cid) : lobbyForPlayers(yard.lobby),
    drill:yard.drill ? lanternDrillForPlayers(yard.drill, yard.lobby) : null, feed:[...yard.feed] };
}
export const inYard = cid => !!yard.lobby?.members.some(x => x.connectionId === cid);
// For the DM's Set out buttons: how many are here, and how many of them are ready.
export function yardCount(){
  const ms = yard.lobby?.members || [];
  return { all:ms.length, ready:ms.filter(m => m.connectionId && m.ready && m.avatar).length };
}
/* The DM sets out: everyone ready (or, with partial, the ready ones). → [{ seatId, heroId }] to seat through the
   table's own checks, or null; the yard closes either way only when there is a party. */
export function setOut(partial = false){
  if (!yardOpen()) return null;
  const r = startLobbySession(yard.lobby, { allowPartial:partial });
  if (!r.party) return null;
  closeYard(); return r.party;
}
