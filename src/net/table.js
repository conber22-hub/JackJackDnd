/* MULTIPLAYER — peer-to-peer over PeerJS. The DM hosts; players join with a 4-letter code.
   Players only send requests (move, stairs, door, search, disarm, ping, end turn); the DM's app decides. */
import { Peer } from 'peerjs';
import { state, setState, ui, tokById } from '../engine/state.js';
import { updateVision, seenNow } from '../engine/grid.js';
import { redactForPlayers } from '../engine/redact.js';
import { $ } from '../util/core.js';
import { focusTile } from '../render/scene.js';
import { ensureFloorViews, buildAllFloors, buildFloor, animateGridChange } from '../render/floors.js';
import { syncTokens, tokenViews, actOn } from '../render/minis.js';
import { turnAction, undoMove, answerOpportunity, askOpportunity, dropAsk } from '../game/moves.js';
import { showReach, spawnPing, flashArea } from '../render/effects.js';
import { toast, banner, showCard, showWhisper, renderAll, renderTop } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { serialize, deserialize, resetScene } from '../game/session.js';
import { doMove, takeStairs, doPing, goFloor, select, animatePath, doorAction, search, disarmTrap } from '../game/actions.js';
import { currentTurn, canAct } from '../game/rules.js';
import { nextTurn } from '../game/combat.js';
import { applyCharacter, charactersOf, ownsCharacter, sheetForPlayer, saveMyHero, myHero } from '../game/heroes.js';
import { cheb } from '../util/core.js';
import { sfx, onSfx } from '../audio/sound.js';
import { putModel, allModels, deleteModel } from '../render/models.js';
import { setSender, validAct, receiveAct, dropRequestsFrom } from '../game/requests.js';

export const net = { peer:null, conns:new Map(), host:null, code:null, online:false, hostTries:0, hostTimer:null,
  join:null, status:'idle', tries:0, gen:0, myId:null, everOpen:false, lastSeen:0, retryTimer:null };
onSfx(name => { if (ui.role === 'dm' && net.conns.size) broadcast({ t:'sfx', name }); });
let pendingArt = null, lastTurnSeen = '';

/* ---------- where the table lives: the free PeerJS server, or your own relay ---------- */
const TKEY = 'dreaddelve.table.v1', JKEY = 'dreaddelve.join.v1', SKEY = 'dreaddelve.peerserver.v1';
const load = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const save = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const peerServer = () => load(SKEY);
export function setPeerServer(s){ save(SKEY, s?.host ? s : null); }
// Options for new Peer(): a custom signalling server (host / port / path / key) and an optional TURN server
// for phones on mobile data that can't reach the DM directly.
export function peerOpts(){
  const s = peerServer(), o = {};
  if (s?.host) Object.assign(o, { host:s.host, port:+s.port || 443, path:s.path || '/', key:s.key || 'peerjs', secure:s.secure ?? (typeof location === 'undefined' || location.protocol !== 'http:') });
  if (s?.turn?.urls) o.config = { iceServers:[{ urls:'stun:stun.l.google.com:19302' }, { urls:s.turn.urls, username:s.turn.username || undefined, credential:s.turn.credential || undefined }] };
  return o;
}
const serverName = () => peerServer()?.host || 'the PeerJS server';
// The table code survives a reload of the DM's page (players' phones keep retrying the same code).
export const savedTable = () => { const t = load(TKEY); return t && Date.now() - t.at < 12 * 3600e3 ? t : null; };
export const savedJoin = () => { const t = load(JKEY); return t && Date.now() - t.at < 12 * 3600e3 ? t : null; };
const newCode = () => Array.from({ length:4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
// A link that opens the player's door with the code (and the relay server, if there is one) filled in.
export function inviteLink(code = net.code){
  if (!code || typeof location === 'undefined') return '';
  const s = peerServer(), u = new URL(location.href.split('#')[0].split('?')[0]);
  u.searchParams.set('join', code);
  if (s?.host) u.searchParams.set('ps', btoa(JSON.stringify(s)).replace(/=+$/, ''));
  return u.toString();
}
// Read ?join=CODE&ps=… once at start-up: remember the server and pre-fill the code.
export function readInvite(){
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search), code = q.get('join'), ps = q.get('ps');
  if (ps) try { setPeerServer(JSON.parse(atob(ps))); } catch {}
  return code ? code.trim().toUpperCase().slice(0, 6) : null;
}

/* ---------- the DM's side ---------- */
const idKey = (name, key) => `${String(name || '').trim().toLowerCase()}|${key || ''}`;
export function hostTable({ code = savedTable()?.code || newCode(), tries = 0 } = {}){
  if (net.peer && !net.peer.destroyed && ui.role === 'dm') return;     // already open (or opening)
  const peer = net.peer = new Peer('dreaddelve-' + code.toLowerCase(), peerOpts());
  net.opening = code;
  peer.on('open', () => {
    if (net.peer !== peer) return;
    const first = net.code !== code;
    net.code = code; net.online = true; net.hostTries = 0; net.opening = null; save(TKEY, { code, at:Date.now() });
    for (const pid of Object.keys(state?.seats || {})) if (!net.conns.has(pid)) delete state.seats[pid];   // seats of players from before a reload
    renderTop(); renderPanel(); if (first) toast(`Table open — code ${code}`); else toast('Table back online.');
  });
  peer.on('connection', c => {
    c.on('open', () => {
      if (net.peer !== peer) return c.close();
      const old = net.conns.get(c.peer); if (old && old.conn !== c) try { old.conn.close(); } catch {}
      net.conns.set(c.peer, { conn:c, name:'(joining)', seen:Date.now() }); renderPanel();
    });
    c.on('data', m => {
      const s = net.conns.get(c.peer); if (!s || s.conn !== c) return;
      s.seen = Date.now();
      if (m?.t === 'hb'){ s.hb = true; try { c.send({ t:'hb' }); } catch {} return; }
      onHostMsg(c, m);
    });
    c.on('close', () => {
      const s = net.conns.get(c.peer); if (!s || s.conn !== c) return;      // an older connection of a player who already came back
      net.conns.delete(c.peer); dropRequestsFrom(c.peer); delete state.seats[c.peer];
      toast(`${s.name || 'A player'} left`); renderPanel(); pushState();
    });
    c.on('error', () => {});
  });
  peer.on('disconnected', () => { if (net.peer !== peer || peer.destroyed) return; net.online = false; renderTop(); renderPanel(); retryHost(peer, code); });
  peer.on('error', e => {
    if (net.peer !== peer) return;
    if (e.type === 'unavailable-id'){
      if (net.code === code){ retryHost(peer, code); return; }              // reconnecting raced the server's memory of us
      peer.destroy(); net.peer = null;
      // after a reload the server remembers the old page for up to a minute: keep trying the same code first
      if (tries < 6 && savedTable()?.code === code){ toast(`Reopening table ${code}…`); net.hostTimer = setTimeout(() => hostTable({ code, tries:tries + 1 }), [2, 4, 8, 16, 30, 30][tries] * 1000); renderPanel(); return; }
      if (savedTable()?.code === code) toast(`Table ${code} is still taken — opening a new code.`);
      hostTable({ code:newCode() });
    }
    else if (['network', 'server-error', 'socket-error', 'socket-closed', 'disconnected'].includes(e.type)){
      net.online = false; if (!net.code) toast(`Can't reach ${serverName()} — retrying…`);
      retryHost(peer, code); renderTop(); renderPanel();
    }
    else if (e.type !== 'peer-unavailable') toast('Table: ' + e.type);
  });
}
// The DM's connection to the signalling server dropped: players already at the table keep playing, but nobody
// new could join. Re-register with the same id (or start again with the same code if the peer was lost).
function retryHost(peer, code){
  clearTimeout(net.hostTimer);
  const n = net.hostTries++, wait = Math.min(30000, 1000 * 2 ** n);
  net.hostTimer = setTimeout(() => {
    if (net.peer !== peer) return;
    if (peer.destroyed){ net.peer = null; hostTable({ code }); return; }
    if (peer.disconnected) try { peer.reconnect(); } catch { peer.destroy(); net.peer = null; hostTable({ code }); }
  }, wait);
}
export function closeTable(){
  broadcast({ t:'bye' });
  clearTimeout(net.hostTimer); save(TKEY, null);
  const p = net.peer; net.peer = null; setTimeout(() => p?.destroy(), 200);
  net.conns.clear(); net.code = null; net.online = false; net.opening = null; if (state) state.seats = {};
  renderTop(); renderPanel();
}
// Drop players whose phone stopped answering heartbeats (a sleeping phone's connection can stay "open" for minutes).
setInterval(() => {
  if (ui.role !== 'dm') return;
  for (const [, s] of net.conns) if (s.hb && Date.now() - s.seen > 40000) try { s.conn.close(); } catch {}
}, 10000);
// Seat a player on a token, and remember it by who they are (name + secret word), so they get it back after a reload.
export function seatPlayer(peer, tokId){
  const s = net.conns.get(peer);
  if (!tokId){ delete state.seats[peer]; if (s && state.campaign?.seatsBy) delete state.campaign.seatsBy[idKey(s.name, s.key)]; return; }
  seatAt(peer, tokId);
}
export function sendSheetToOwner(id){
  const c = state.characters[id]; if (!c) return;
  for (const [, s] of net.conns) if (s.conn.open && ownsCharacter(c, s.name, s.key)) try { s.conn.send({ t:'yours', chars:charactersOf(s.name, s.key).map(sheetForPlayer), quiet:true }); } catch {}
}
// Send to whoever sits at this token (a hero's player), if they are at the table.
export function sendToSeat(tokId, m){ for (const [pid, tid] of Object.entries(state.seats || {})) if (tid === tokId){ const s = net.conns.get(pid); if (s?.conn.open) try { s.conn.send(m); } catch {} } }
export function broadcast(m, except){ for (const [pid, s] of net.conns) if (pid !== except && s.conn.open) try { s.conn.send(m); } catch {} }
let pushTimer = null;
// What players receive: the delve without the DM's campaign desk (notes, fortune, clocks), anyone's character sheets,
function forPlayers(){
  const V = state.campaign?.valley, free = !!state.campaign?.freeRolls;
  const s = redactForPlayers(serialize(false), { seen:seenNow, explored:state.explored });   // secrets stay with the DM (engine/redact.js)
  s.freeRolls = free; s.weather = state.campaign?.weather || ''; s.hour = V?.hour;
  if (V?.shared) s.valley = { at:V.at, visited:[...V.visited], journey:V.journey ? { to:V.journey.to, path:[...V.journey.path] } : null, day:V.day, hour:V.hour, weather:V.weather || '' };   // the map, if the DM shares it
  return s;
}   // (and not what waits on the road)
export function pushState(){ if (ui.role !== 'dm' || !net.conns.size) return; clearTimeout(pushTimer); pushTimer = setTimeout(() => broadcast({ t:'state', s:forPlayers() }), 60); }

function onHostMsg(c, m){
  const seat = net.conns.get(c.peer); if (!seat || seat.conn !== c || !m) return;
  const me = tokById(state.seats[c.peer]), mine = id => state.seats[c.peer] === id;
  const near = (L, i) => me && me.floor === L && cheb(me.x, me.y, i % state.floors[L].W, (i / state.floors[L].W) | 0) <= 1;
  if (m.t === 'hello'){
    seat.name = String(m.name || 'Player').trim().slice(0, 30); seat.key = String(m.key || '').slice(0, 20);
    let match = null;
    const lockedAway = t => t.charId && state.characters[t.charId]?.key && !ownsCharacter(state.characters[t.charId], seat.name, seat.key);
    if (m.char?.id && m.char.cls) match = claimSheet(c, seat, m.char);
    const last = tokById(state.campaign?.seatsBy?.[idKey(seat.name, seat.key)]);
    if (!match && last && !last.flags?.gone && !lockedAway(last) && !seatTaken(c.peer, last.id)) match = last;
    const mineAll = charactersOf(seat.name, seat.key);
    if (!match && mineAll.length === 1){ const tok = state.tokens.find(t => t.charId === mineAll[0].id); if (!tok || !seatTaken(c.peer, tok.id)) match = tok || applyCharacter(mineAll[0], { owner:seat.name, key:seat.key }); }
    match ||= state.tokens.find(t => t.kind === 'pc' && t.name.toLowerCase() === seat.name.toLowerCase() && !lockedAway(t) && !seatTaken(c.peer, t.id));
    if (match) seatAt(c.peer, match.id);
    if (!m.re) toast(`${seat.name} joined${match ? ` as ${match.name}` : mineAll.length ? ' — choosing a character' : ' — seat them in the Table tab'}`);
    else toast(`${seat.name} is back${match ? ` (${match.name})` : ''}.`);
    c.send({ t:'you', peer:c.peer });
    c.send({ t:'yours', chars:mineAll.length ? charactersOf(seat.name, seat.key).map(sheetForPlayer) : [], quiet:!!m.re });
    c.send({ t:'art', art:state.art });
    const have = new Set(Array.isArray(m.have) ? m.have : []);
    for (const md of allModels()) if (!have.has(md.key)) c.send({ t:'model', key:md.key, name:md.name, buf:md.buf });
    c.send({ t:'state', s:forPlayers() });
    renderPanel(); pushState();
  }
  else if (m.t === 'pick'){
    const sheet = state.characters[m.id];
    if (!ownsCharacter(sheet, seat.name, seat.key)){ c.send({ t:'denied', text:'That character belongs to someone else.' }); return; }
    const t = applyCharacter(sheet, { owner:seat.name, key:seat.key });
    if (t){ seatAt(c.peer, t.id); toast(`${seat.name} plays ${t.name}.`); }
    renderPanel(); pushState();
  }
  else if (m.t === 'move'){ const t = tokById(m.id); if (t && mine(t.id) && canAct(t) && Number.isInteger(m.x) && Number.isInteger(m.y)) { if (!doMove(t, m.x, m.y, { path:Array.isArray(m.path) ? m.path : null }) && c.open) c.send({ t:'denied', text:'You can\'t move there.' }); } }
  else if (m.t === 'turnAct'){ const t = tokById(m.id); if (t && mine(t.id) && canAct(t) && ['dash', 'disengage', 'dodge', 'stand'].includes(m.k)) turnAction(t, m.k); }
  else if (m.t === 'undoMove'){ const t = tokById(m.id); if (t && mine(t.id)) undoMove(t, false); }
  else if (m.t === 'oaAns') answerOpportunity(String(m.id), !!m.take, c.peer);
  else if (m.t === 'stairs'){ const t = tokById(m.id); if (t && mine(t.id)) takeStairs(t); }
  else if (m.t === 'ping') doPing(m, seat.name, m.color, c.peer);
  else if (m.t === 'endturn'){ const cur = currentTurn(); if (cur && mine(cur.id)) nextTurn(); }
  else if (m.t === 'door'){
    const dr = state.floors[m.floor]?.doors.find(d => d.id === m.id);
    if (dr && dr.state !== 'secret' && near(m.floor, dr.i) && ['toggle', 'pick', 'force'].includes(m.act) && canAct(me)) doorAction(me, m.floor, m.id, m.act);
  }
  else if (m.t === 'char' && m.char?.id && m.char.cls){
    const t = claimSheet(c, seat, m.char); if (!t) return;
    seatAt(c.peer, t.id);
    c.send({ t:'yours', chars:charactersOf(seat.name, seat.key).map(sheetForPlayer), quiet:true });   // the sheet as the DM now has it
    toast(`${seat.name} updated ${m.char.name}.`); renderPanel(); pushState();
  }
  else if (m.t === 'act'){
    const deny = text => { if (c.open) c.send({ t:'denied', text }); };
    const ok = validAct(m, mine);
    if (!ok){ deny(state.combat.active && me && !canAct(me) ? 'Wait for your turn.' : 'That can\'t be done from here.'); return; }
    receiveAct(ok, c.peer, seat.name, deny);
  }
  else if (m.t === 'search'){ if (me && canAct(me)) search(me); }
  else if (m.t === 'disarm'){
    const tr = state.floors[m.floor]?.traps.find(t => t.id === m.id);
    if (tr && tr.found && near(m.floor, tr.i) && canAct(me)) disarmTrap(me, m.floor, m.id);
  }
}

// A token is taken only by another player who is still connected (seats saved with the delve, or left behind
// by a dropped phone, don't count) — and a player signing in again on a new device takes their own seat back.
function seatTaken(peer, tokId){
  const me = net.conns.get(peer);
  return Object.entries(state.seats).some(([pid, tid]) => {
    if (tid !== tokId || pid === peer) return false;
    const o = net.conns.get(pid); if (!o) return false;
    return !(o.key && o.key === me?.key && o.name.toLowerCase() === me?.name.toLowerCase());
  });
}
function seatAt(peer, tokId){
  for (const [pid, tid] of Object.entries(state.seats)) if (tid === tokId && pid !== peer) delete state.seats[pid];
  state.seats[peer] = tokId;
  const s = net.conns.get(peer); if (s?.name && state.campaign) (state.campaign.seatsBy ||= {})[idKey(s.name, s.key)] = tokId;
}
// A player brings or updates a sheet. A sheet already locked to someone else's secret word is refused;
// an unlocked one is claimed by whoever brings it (having the sheet is proof enough).
function claimSheet(c, seat, sheet){
  const prev = state.characters[sheet.id];
  if (prev?.key && !ownsCharacter(prev, seat.name, seat.key)){
    c.send({ t:'denied', text:`${prev.name} belongs to ${prev.owner || 'another player'} at this table.` }); toast(`${seat.name} tried to bring ${prev.name}, who belongs to ${prev.owner || 'someone else'}.`); return null;
  }
  // The DM changed this sheet since the player last saw it (levelled, edited at the table): the DM's copy wins,
  // and the player gets it back in 'yours'.
  if (prev && (sheet.updated || 0) < (prev.updated || 0)) return state.tokens.find(t => t.charId === prev.id) || applyCharacter(prev, { owner:seat.name, key:seat.key });
  return applyCharacter(sheet, { owner:seat.name, key:seat.key });
}

/* ---------- the player's side: join, and keep coming back ---------- */
// Join a table. The start page stays up (with a status line) until the DM's table answers; after that,
// a dropped connection (a phone going to sleep, a Wi-Fi blip, the DM reloading) is retried on its own.
export function joinTable(code, name, key, hero = null){
  leaveTable(true);
  net.join = { code:String(code).trim().toUpperCase(), name, key, hero };
  save(JKEY, { code:net.join.code, at:Date.now() });
  net.status = 'connecting'; net.tries = 0; net.everOpen = false;
  joinStatus(`Looking for table ${net.join.code}…`);
  connectHost();
}
export function leaveTable(quiet){
  net.gen++; clearTimeout(net.retryTimer);
  try { net.host?.close(); } catch {}
  net.host = null; net.status = 'closed';
  if (!quiet){ net.join = null; net.peer?.destroy(); net.peer = null; renderNetStatus(); }
}
function ensurePeer(){
  return new Promise((res, rej) => {
    let p = net.peer;
    if (p && !p.destroyed && !p.disconnected && p.open) return res(p);
    if (!p || p.destroyed){ p = net.peer = new Peer(peerOpts()); watchPeer(p); }
    else if (p.disconnected) try { p.reconnect(); } catch { p.destroy(); p = net.peer = new Peer(peerOpts()); watchPeer(p); }
    const done = (ok, e) => { clearTimeout(t); p.off('open', onOpen); p.off('error', onErr); ok ? res(p) : rej(e || { type:'timeout' }); };
    const onOpen = () => done(true), onErr = e => done(false, e);
    const t = setTimeout(() => done(false), 9000);
    p.on('open', onOpen); p.on('error', onErr);
  });
}
function watchPeer(p){
  p.on('error', e => {
    if (net.peer !== p || net.status === 'open' || net.status === 'closed') return;
    if (e.type === 'peer-unavailable'){ net.why = 'unavailable'; try { net.host?.close(); } catch {} retry('unavailable'); }
  });
}
async function connectHost(){
  if (!net.join) return;
  const gen = ++net.gen; clearTimeout(net.retryTimer);
  let peer;
  try { peer = await ensurePeer(); }
  catch (e){ if (gen === net.gen) retry(e?.type === 'timeout' ? 'server' : e?.type || 'server'); return; }
  if (gen !== net.gen) return;
  const c = peer.connect('dreaddelve-' + net.join.code.toLowerCase(), { reliable:true });
  if (!c){ retry('server'); return; }
  net.host = c;
  const timer = setTimeout(() => { if (gen === net.gen && !c.open){ try { c.close(); } catch {} retry(net.why || 'timeout'); } }, 10000);
  c.on('open', () => { if (gen !== net.gen) return c.close(); clearTimeout(timer); connected(c); });
  c.on('data', m => { if (gen !== net.gen) return; net.lastSeen = Date.now(); if (m?.t === 'hb'){ net.hbOk = true; return; } onClientMsg(m); });
  c.on('close', () => { clearTimeout(timer); if (gen !== net.gen || net.status === 'closed') return; net.status = 'retrying'; renderNetStatus(); retry('closed'); });
  c.on('error', () => {});
}
function connected(c){
  const first = !net.everOpen, J = net.join;
  net.everOpen = true; net.status = 'open'; net.tries = 0; net.why = ''; net.lastSeen = Date.now();
  if (first){
    ui.role = 'player'; ui.myName = J.name; ui.tab = 'hero'; ui.tableChars = [];
    $('#startModal').classList.add('hidden'); joinStatus('');
  }
  const hero = J.hero || (J.dirty && myHero(J.dirty)); J.hero = null; J.dirty = null;
  c.send({ t:'hello', name:J.name, key:J.key, re:!first, have:allModels().map(m => m.key), ...(hero ? { char:hero } : {}) });
  toast(first ? 'Connected — waiting for the DM…' : 'Back at the table.');
  renderAll(); renderNetStatus();
}
// Back off (1, 2, 4… 30 s, a little random so five phones don't knock at once). Before the first connection,
// "unavailable" just means the DM hasn't opened the table yet: keep knocking every few seconds.
function retry(why){
  if (!net.join || net.status === 'closed') return;
  clearTimeout(net.retryTimer);
  const n = net.tries++;
  if (net.everOpen && n >= 14){ net.status = 'lost'; renderNetStatus(); return; }
  const cap = !net.everOpen && why === 'unavailable' ? 4000 : 30000;
  const wait = Math.min(cap, 1000 * 2 ** Math.min(n, 5)) * (0.75 + Math.random() * 0.5);
  net.status = net.everOpen ? 'retrying' : 'connecting'; net.why = why;
  if (!net.everOpen) joinStatus(why === 'unavailable' ? `Waiting for the DM to open table ${net.join.code}… (is the code right?)` : why === 'server' ? `Can't reach ${serverName()} — trying again…` : `Knocking on table ${net.join.code}…`);
  renderNetStatus();
  net.retryTimer = setTimeout(connectHost, wait);
}
export function rejoin(){ if (!net.join) return; net.tries = 0; net.status = 'retrying'; renderNetStatus(); connectHost(); }
// Wake-ups: a phone coming back to the page, or back online, tries again straight away.
if (typeof document !== 'undefined'){
  const wake = () => {
    if (!net.join || document.hidden) return;
    if (net.status === 'open'){ net.lastSeen = Date.now(); try { net.host?.send({ t:'hb' }); } catch {} return; }
    if (net.status === 'retrying' || net.status === 'lost' || net.status === 'connecting') rejoin();
  };
  document.addEventListener('visibilitychange', wake);
  addEventListener('online', wake); addEventListener('pageshow', wake);
  // heartbeat: a connection that has gone quiet for 20 s (and whose host answers heartbeats) is dead
  setInterval(() => {
    if (net.status !== 'open' || !net.host?.open || document.hidden) return;
    try { net.host.send({ t:'hb' }); } catch {}
    if (net.hbOk && Date.now() - net.lastSeen > 20000) try { net.host.close(); } catch {}
  }, 5000);
}
function joinStatus(text){ const el = $('#joinStatus'); if (el){ el.textContent = text; el.classList.toggle('hidden', !text); } }
export function renderNetStatus(){ renderTop(); if (ui.role === 'player') renderPanel(); }
// Send to the DM. Returns false (and says so) when the connection is down.
export function sendHost(m){
  if (net.host?.open && net.status === 'open'){ try { net.host.send(m); return true; } catch {} }
  toast(net.join ? 'Not connected to the table — reconnecting…' : 'Not connected to a table.');
  if (net.join && net.status !== 'open') rejoin();
  return false;
}
setSender(sendHost);
function onClientMsg(m){
  if (!m) return;
  if (m.t === 'state') applyRemoteState(m.s);
  else if (m.t === 'anim' && state){ animatePath(m.id, m.path, s => { const t = tokById(m.id); if (t){ t.x = s.x; t.y = s.y; } updateVision(); syncTokens(); }, null, m.id === ui.myToken); }
  else if (m.t === 'you') net.myId = m.peer;
  else if (m.t === 'yours'){
    // The DM's copies are the real sheets (they may have been levelled or edited at the table): keep them in this browser.
    ui.tableChars = (m.chars || []).map(c => { const local = myHero(c.id); const h = { ...c, portrait:c.portrait || local?.portrait }; if (!h.portrait) delete h.portrait; saveMyHero(h); return h; });
    if (ui.tableChars.length && !m.quiet) toast(`Welcome back — ${ui.tableChars.map(c => c.name).join(', ')} ${ui.tableChars.length > 1 ? 'are' : 'is'} at this table.`);
    renderPanel();
  }
  else if (m.t === 'oa' && m.q?.id) askOpportunity(m.q);
  else if (m.t === 'area' && state && Array.isArray(m.sq)){ const ex = state.explored?.[m.floor]; flashArea(m.floor, m.sq.filter(i => ex?.has(i)), m.ty); }   // only where they've been
  else if (m.t === 'oaDone') dropAsk(m.id);
  else if (m.t === 'act' && state && ['attack', 'cast', 'hit'].includes(m.kind)) actOn(m.id, m.kind, m.target);
  else if (m.t === 'bye'){ net.status = 'closed'; clearTimeout(net.retryTimer); toast('The DM closed the table.'); renderNetStatus(); }
  else if (m.t === 'denied'){ toast(m.text); if (ui.myHeroId && !tokById(ui.myToken)) ui.myHeroId = null; const me = tokById(ui.myToken); if (me && ui.selected === me.id) showReach(me); renderPanel(); }
  else if (m.t === 'card') showCard(m.c, false);
  else if (m.t === 'ping'){ spawnPing(m.floor, m.x, m.y, m.color); toast(`${m.who} pings the map`); }
  else if (m.t === 'whisper') showWhisper(m.text);
  else if (m.t === 'banner') banner(m.text);
  else if (m.t === 'sfx') sfx(m.name, false);
  else if (m.t === 'model'){ if (m.buf) putModel(m.key, m.buf, m.name, false).catch(() => {}); else deleteModel(m.key); }
  else if (m.t === 'art'){ if (state){ state.art = m.art || {}; syncTokens(); } else pendingArt = m.art; }
}
function applyRemoteState(s){
  const prev = state, ns = deserialize(s);
  ns.art = prev?.art || pendingArt || {};
  const sameDelve = prev && prev.meta.seed === ns.meta.seed && prev.floors.length === ns.floors.length && prev.meta.size === ns.meta.size;
  const moved = [];
  if (sameDelve) ns.floors.forEach((f, L) => { if (prev.floors[L].grid.join('') !== f.grid.join('')) moved.push([L, prev.floors[L].grid]); });
  setState(ns);
  const myPrev = ui.myToken; ui.myToken = ns.seats[net.myId || net.peer?.id] || null;
  const seatedAs = ns.tokens.find(t => t.id === ui.myToken)?.charId; if (seatedAs && myHero(seatedAs)) ui.myHeroId = seatedAs;
  if (!sameDelve){ resetScene(); ensureFloorViews(); updateVision(); buildAllFloors(); }
  else { ensureFloorViews(); updateVision(); state.floors.forEach((_, L) => { const mv = moved.find(x => x[0] === L); if (mv) animateGridChange(L, mv[1], state.floors[L].grid); else buildFloor(L); }); }
  syncTokens();
  const me = tokById(ui.myToken);
  if (me && (me.floor !== ui.floor || myPrev !== ui.myToken || !sameDelve)){ goFloor(me.floor, false); focusTile(me.floor, me.x, me.y); if (!ui.selected) select(me.id); }
  if (ui.selected && !tokById(ui.selected)) ui.selected = null;
  const cur = currentTurn(), key = `${state.combat.round}:${state.combat.idx}`;
  if (cur && cur.id === ui.myToken && key !== lastTurnSeen){ banner('Your turn'); select(me.id); }
  else if (me && ui.selected === me.id && !tokenViews.get(me.id)?.anim) showReach(me);   // what's left of their move
  lastTurnSeen = key;
  renderAll();
}
