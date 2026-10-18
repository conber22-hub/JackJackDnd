/* MULTIPLAYER — peer-to-peer over PeerJS. The DM hosts; players join with a 4-letter code.
   Players only send requests (move, stairs, door, search, disarm, ping, end turn); the DM's app decides. */
import { Peer } from 'peerjs';
import { state, setState, ui, tokById } from '../engine/state.js';
import { updateVision } from '../engine/grid.js';
import { $ } from '../util/core.js';
import { focusTile } from '../render/scene.js';
import { ensureFloorViews, buildAllFloors, buildFloor, animateGridChange } from '../render/floors.js';
import { syncTokens } from '../render/minis.js';
import { showReach, spawnPing } from '../render/effects.js';
import { toast, banner, showCard, showWhisper, renderAll, renderTop } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { serialize, deserialize, resetScene } from '../game/session.js';
import { doMove, takeStairs, doPing, goFloor, select, animatePath, doorAction, search, disarmTrap } from '../game/actions.js';
import { currentTurn, canAct } from '../game/rules.js';
import { nextTurn } from '../game/combat.js';
import { cheb } from '../util/core.js';

export const net = { peer:null, conns:new Map(), host:null, code:null };
let pendingArt = null, lastTurnSeen = '';

export function hostTable(){
  const code = Array.from({ length:4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
  net.peer = new Peer('dreaddelve-' + code.toLowerCase());
  net.peer.on('open', () => { net.code = code; renderTop(); renderPanel(); toast(`Table open — code ${code}`); });
  net.peer.on('connection', c => {
    c.on('open', () => { net.conns.set(c.peer, { conn:c, name:'(joining)' }); renderPanel(); });
    c.on('data', m => onHostMsg(c, m));
    c.on('close', () => { const s = net.conns.get(c.peer); net.conns.delete(c.peer); delete state.seats[c.peer]; toast(`${s?.name || 'A player'} left`); renderPanel(); pushState(); });
  });
  net.peer.on('error', e => { if (e.type === 'unavailable-id'){ net.peer.destroy(); hostTable(); } else toast('Table: ' + e.type); });
}
export function closeTable(){ net.peer?.destroy(); net.peer = null; net.conns.clear(); net.code = null; state.seats = {}; renderTop(); renderPanel(); }
export function broadcast(m, except){ for (const [pid, s] of net.conns) if (pid !== except && s.conn.open) try { s.conn.send(m); } catch {} }
let pushTimer = null;
export function pushState(){ if (ui.role !== 'dm' || !net.conns.size) return; clearTimeout(pushTimer); pushTimer = setTimeout(() => broadcast({ t:'state', s:serialize(false) }), 60); }

function onHostMsg(c, m){
  const seat = net.conns.get(c.peer); if (!seat || !m) return;
  const me = tokById(state.seats[c.peer]), mine = id => state.seats[c.peer] === id;
  const near = (L, i) => me && me.floor === L && cheb(me.x, me.y, i % state.floors[L].W, (i / state.floors[L].W) | 0) <= 1;
  if (m.t === 'hello'){
    seat.name = String(m.name || 'Player').slice(0, 30);
    const match = state.tokens.find(t => t.kind === 'pc' && t.name.toLowerCase() === seat.name.toLowerCase() && !Object.values(state.seats).includes(t.id));
    if (match) state.seats[c.peer] = match.id;
    toast(`${seat.name} joined${match ? ` as ${match.name}` : ' — seat them in the Table tab'}`);
    c.send({ t:'art', art:state.art }); c.send({ t:'state', s:serialize(false) });
    renderPanel(); pushState();
  }
  else if (m.t === 'move'){ const t = tokById(m.id); if (t && mine(t.id) && canAct(t)) doMove(t, m.x, m.y); }
  else if (m.t === 'stairs'){ const t = tokById(m.id); if (t && mine(t.id)) takeStairs(t); }
  else if (m.t === 'ping') doPing(m, seat.name, m.color, c.peer);
  else if (m.t === 'endturn'){ const cur = currentTurn(); if (cur && mine(cur.id)) nextTurn(); }
  else if (m.t === 'door'){
    const dr = state.floors[m.floor]?.doors.find(d => d.id === m.id);
    if (dr && dr.state !== 'secret' && near(m.floor, dr.i) && ['toggle', 'pick', 'force'].includes(m.act) && canAct(me)) doorAction(me, m.floor, m.id, m.act);
  }
  else if (m.t === 'search'){ if (me && canAct(me)) search(me); }
  else if (m.t === 'disarm'){
    const tr = state.floors[m.floor]?.traps.find(t => t.id === m.id);
    if (tr && tr.found && near(m.floor, tr.i) && canAct(me)) disarmTrap(me, m.floor, m.id);
  }
}

export function joinTable(code, name){
  ui.role = 'player'; ui.myName = name; ui.tab = 'hero';
  $('#startModal').classList.add('hidden'); renderAll();
  net.peer = new Peer();
  net.peer.on('open', () => {
    const c = net.peer.connect('dreaddelve-' + code.toLowerCase(), { reliable:true }); net.host = c;
    c.on('open', () => { c.send({ t:'hello', name }); toast('Connected — waiting for the DM…'); });
    c.on('data', onClientMsg);
    c.on('close', () => toast('Disconnected from the table.'));
    setTimeout(() => { if (!c.open) toast('Could not reach that table — check the code.'); }, 9000);
  });
  net.peer.on('error', e => toast('Connection: ' + e.type));
}
export function sendHost(m){ if (net.host?.open) net.host.send(m); }
function onClientMsg(m){
  if (!m) return;
  if (m.t === 'state') applyRemoteState(m.s);
  else if (m.t === 'anim' && state){ animatePath(m.id, m.path, s => { const t = tokById(m.id); if (t){ t.x = s.x; t.y = s.y; } updateVision(); syncTokens(); }, null, m.id === ui.myToken); }
  else if (m.t === 'card') showCard(m.c, false);
  else if (m.t === 'ping'){ spawnPing(m.floor, m.x, m.y, m.color); toast(`${m.who} pings the map`); }
  else if (m.t === 'whisper') showWhisper(m.text);
  else if (m.t === 'banner') banner(m.text);
  else if (m.t === 'art'){ if (state){ state.art = m.art || {}; syncTokens(); } else pendingArt = m.art; }
}
function applyRemoteState(s){
  const prev = state, ns = deserialize(s);
  ns.art = prev?.art || pendingArt || {};
  const sameDelve = prev && prev.meta.seed === ns.meta.seed && prev.floors.length === ns.floors.length && prev.meta.size === ns.meta.size;
  const moved = [];
  if (sameDelve) ns.floors.forEach((f, L) => { if (prev.floors[L].grid.join('') !== f.grid.join('')) moved.push([L, prev.floors[L].grid]); });
  setState(ns);
  const myPrev = ui.myToken; ui.myToken = ns.seats[net.peer?.id] || null;
  if (!sameDelve){ resetScene(); ensureFloorViews(); updateVision(); buildAllFloors(); }
  else { ensureFloorViews(); updateVision(); state.floors.forEach((_, L) => { const mv = moved.find(x => x[0] === L); if (mv) animateGridChange(L, mv[1], state.floors[L].grid); else buildFloor(L); }); }
  syncTokens();
  const me = tokById(ui.myToken);
  if (me && (me.floor !== ui.floor || myPrev !== ui.myToken || !sameDelve)){ goFloor(me.floor, false); focusTile(me.floor, me.x, me.y); if (!ui.selected) select(me.id); }
  if (ui.selected && !tokById(ui.selected)) ui.selected = null;
  const cur = currentTurn(), key = `${state.combat.round}:${state.combat.idx}`;
  if (cur && cur.id === ui.myToken && key !== lastTurnSeen){ banner('Your turn'); if (ui.selected === me?.id) showReach(me); }
  lastTurnSeen = key;
  renderAll();
}
