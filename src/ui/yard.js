/* 🏮 THE LANTERN YARD — the party lobby and the Lantern Gate drill at the table (game/yard.js holds the yard, on
   the DM's side). The DM opens it from the Table tab; each player's phone shows the yard from above: the fire,
   the low walls, three practice dummies, every hero who has walked in. A player taps the ground to walk, picks one
   of their hero's attacks or spells and taps a dummy to try it (the DM's app rolls), and says when they're ready.
   With the drill on, one hero stands on the plate to open the shutter while another puts out the lit lanterns in
   order. The TV shows the yard while it's open. When the DM sets out, the yard closes everywhere and the heroes
   are seated at the table as usual (net/table.js decides who sits where). */
import { state, ui, tokById } from '../engine/state.js';
import { esc, $ } from '../util/core.js';
import { net, sendHost, seatHero, seatIdOf, pushState } from '../net/table.js';
import { ownsCharacter } from '../game/heroes.js';
import { toast, banner } from './hud.js';
import { renderPanel } from './panels.js';
import { LOBBY_WALLS, LOBBY_SCENE } from '../data/party-lobby.js';
import { yard, yardOpen, openYard, closeYard, admitToYard, leaveYard, releaseFromYard, playYard, startDrill, stopDrill,
  yardView, inYard, yardCount, setOut } from '../game/yard.js';

/* ---------- the board (players, TV and the DM all draw the same one) ---------- */
const ICON = { campfire:'🔥', lantern:'🏮', lamppost:'🕯️', hay:'🌾' };
const STAGE = { building:'making a hero', practising:'in the yard', ready:'✔ ready', reconnecting:'reconnecting…' };
// (drawn ten units to the square: browsers set text badly at tiny sizes)
const grid = (() => { let d = ''; for (let x = 2; x < 19; x++) d += `M${x * 10} 10V130`; for (let y = 2; y < 13; y++) d += `M10 ${y * 10}H190`; return d; })();
const c10 = n => +(n * 10).toFixed(1);
// at: where to draw each hero now (slot → {x, y}), for a walk still to come
function boardSVG(v, drill, { live = false, mySlot = null, at = {} } = {}){
  const dum = v.dummies.map(d => {
    const st = drill?.targets.find(t => t.id === d.id)?.stage || '';
    return `<g class="yd-dummy ${st}" data-yd-dummy="${esc(d.id)}" transform="translate(${c10(d.x + .5)} ${c10(d.y + .5)})"><title>${esc(d.name)} · AC ${d.ac}</title>
      <circle class="halo" r="6.2"/><rect x="-.8" y="-1" width="1.6" height="5.5" rx=".4"/><circle r="3.4"/><text y="1.1">${st === 'cleared' ? '✓' : d.ac}</text>
      <text class="yd-lbl" y="7.8">${esc(d.name)}</text></g>`;
  }).join('');
  const plate = drill ? `<g class="yd-plate ${drill.plate.holderSlot ? 'held' : ''}" transform="translate(${c10(drill.plate.x + .5)} ${c10(drill.plate.y + .5)})"><title>The plate</title><rect x="-4.2" y="-4.2" width="8.4" height="8.4" rx="1.4"/><circle r="1.6"/></g>` : '';
  const heroes = v.members.filter(m => m.position && m.hero).map(m => {
    const p = at[m.slot] || m.position;
    return `<g class="yd-hero ${m.slot === mySlot ? 'me' : ''} ${m.stage}" data-slot="${m.slot}" style="transform:translate(${c10(p.x + .5)}px,${c10(p.y + .5)}px)"><title>${esc(m.hero.name)} (${esc(m.name)}) · ${STAGE[m.stage] || ''}</title>
      <circle class="ring" r="4.6"/><circle r="3.6" fill="${esc(m.hero.color || '#c9a24a')}"/><text y="1.2">${esc((m.hero.name || '?')[0])}</text>${m.stage === 'ready' ? '<text class="yd-ok" x="3.4" y="-2.4">✔</text>' : ''}
      <text class="yd-lbl" y="7.4">${esc(m.hero.name)}</text></g>`;
  }).join('');
  return `<svg class="yd-board${live ? ' live' : ''}" viewBox="10 10 180 120" role="img" aria-label="The Lantern Yard">
    <rect class="yd-ground" x="10" y="10" width="180" height="120" rx="3"/><path class="yd-grid" d="${grid}"/>
    <circle class="yd-fireglow" cx="25" cy="25" r="22"/>
    ${LOBBY_WALLS.map(([x, y]) => `<rect class="yd-wall" x="${c10(x + .04)}" y="${c10(y + .18)}" width="9.2" height="6.4" rx="1.2"/>`).join('')}
    ${LOBBY_SCENE.layout.props.map(([k, x, y]) => `<text class="yd-prop" x="${c10(x + .5)}" y="${c10(y + .74)}">${ICON[k] || '·'}</text>`).join('')}
    ${plate}${dum}${heroes}</svg>`;
}
const roster = v => `<div class="yd-roster">${v.members.map(m => `<span class="yd-who ${m.stage}"><i style="background:${esc(m.hero?.color || '#555')}"></i><b>${esc(m.hero?.name || m.name)}</b>${m.hero && m.hero.name.toLowerCase() !== m.name.toLowerCase() ? ` <span class="muted">${esc(m.name)}</span>` : ''} · ${STAGE[m.stage] || m.stage}</span>`).join('') || '<span class="muted">Nobody here yet.</span>'}</div>`;
function drillHTML(d, v){
  if (!d) return '';
  const name = id => v.dummies.find(x => x.id === id)?.name || id, holder = v.members.find(m => m.slot === d.plate.holderSlot);
  return `<div class="yd-drill"><b>🏮 ${esc(d.title)}</b> <span class="muted">${esc(d.instructions)}</span>
    <div class="yd-lanterns">${d.targets.map(t => `<span class="yd-lantern ${t.stage}">${t.stage === 'cleared' ? '✓' : '🏮'} ${esc(name(t.id))}</span>`).join('')}</div>
    <div class="muted">${d.complete ? '🏮 The Lantern Gate is open!' : holder ? `${esc(holder.hero?.name || holder.name)} holds the plate: the shutter is <b>open</b>. Hit the ${esc(name(d.targetId))}!` : 'The shutter is shut: someone has to stand on the plate (the square by the wall).'}</div></div>`;
}
const feedHTML = f => f?.length ? `<div class="yd-feed">${f.slice(-4).map(l => `<div>${esc(l)}</div>`).join('')}</div>` : '';

/* ---------- a phone, or the TV ---------- */
let yv = null, mine = { action:null, last:null }, drawn = {};
function modal(){
  let m = $('#yardModal');
  if (!m){ m = document.createElement('div'); m.id = 'yardModal'; m.className = 'modal hidden'; m.innerHTML = '<div class="box wide yd-box"></div>'; document.body.appendChild(m); }
  return m;
}
const otherModalOpen = () => [...document.querySelectorAll('.modal:not(.hidden)')].some(m => m.id !== 'yardModal');
function renderYard(at = {}){
  const m = modal(), box = m.querySelector('.yd-box'); if (!yv) return;
  const v = yv.view, me = v.members.find(x => x.slot === v.yourSlot), acts = v.actions || [];
  if (!acts.some(a => a.id === mine.action)) mine.action = (acts.find(a => ['attack', 'save', 'auto'].includes(a.kind)) || acts[0])?.id || null;
  let controls = '';
  if (!ui.screen){
    if (!me?.hero) controls = `<div class="muted">${me ? 'Finish your hero (or pick one in your Hero tab) and they walk into the yard.' : 'Joining the yard…'}</div>
      <div class="row">${(ui.tableChars || []).map(c => `<button class="btn small" data-act="pickChar" data-id="${esc(c.id)}">${esc(c.name)}</button>`).join('')}<button class="btn small" data-act="newHeroAtTable">✚ Make a character</button></div>`;
    else controls = `<div class="muted">Tap the ground to walk. Pick one of ${esc(me.hero.name)}'s attacks or spells, then tap a dummy to try it.</div>
      <div class="yd-acts">${acts.map(a => `<button class="btn small ${a.id === mine.action ? 'on' : ''}" data-act="ydAct" data-id="${esc(a.id)}" title="${a.kind === 'attack' ? 'attack roll' : a.kind === 'save' ? 'the dummy saves' : a.kind === 'auto' ? 'always hits' : 'no dummy needed'}">${esc(a.name)}</button>`).join('')}</div>
      <div class="row"><button class="btn small ${me.stage === 'ready' ? 'on' : 'primary'}" data-act="ydReady">${me.stage === 'ready' ? '✔ Ready (tap to wait)' : 'I\'m ready'}</button><button class="btn small" data-act="ydBuild" title="Back to the character creator">↺ Rebuild my hero</button></div>`;
  }
  box.innerHTML = `<div class="hd"><h2>🏮 The Lantern Yard</h2>${ui.screen ? '' : '<button class="btn small" data-act="ydClose">Close</button>'}</div>
    <div class="muted">A fire by the gate, three practice targets beyond the low walls. Nothing here costs a hit point or a spell slot.</div>
    ${roster(v)}${drillHTML(yv.drill, v)}${boardSVG(v, yv.drill, { live:!ui.screen && !!me?.hero, mySlot:v.yourSlot, at })}
    <div class="yd-say" id="ydSay" role="status">${esc(mine.say || '')}</div>${controls}${feedHTML(yv.feed)}`;
  drawn = Object.fromEntries(v.members.filter(x => x.position).map(x => [x.slot, { ...x.position }]));
}
// Walk a hero square by square to where the DM's app put them.
function walk(slot, path){
  const step = (i) => {
    const g = document.querySelector(`#yardModal .yd-hero[data-slot="${slot}"]`); if (!g || i >= path.length) return;
    g.style.transform = `translate(${c10(path[i].x + .5)}px,${c10(path[i].y + .5)}px)`;
    setTimeout(() => step(i + 1), 130);
  };
  requestAnimationFrame(() => step(0));
}
const REASON = { 'out-of-range':'Too far for that: walk closer.', blocked:'Something is in the way.', 'choose-a-dummy':'Tap one of the dummies.',
  'unknown-action':'That isn\'t one of your hero\'s actions any more.', 'finish-your-hero':'Finish your hero first.', 'not-in-lobby':'You aren\'t in the yard.',
  'invalid-dice':'That weapon\'s dice are too strange to roll here.', 'unknown-action-kind':'That can\'t be done here.' };
const DRILL = { 'stand-on-plate':'The shutter is shut: someone has to stand on the plate.', 'need-a-partner':'You can\'t hold the plate and shoot: another hero has to stand on it.',
  'hit-the-lit-target':'Only the lit lantern counts.', 'try-again':'The lantern is still lit: try again.', 'target-cleared':'🏮 Out it goes!', complete:'🏮 The Lantern Gate is open!' };
const sign = n => n >= 0 ? `+${n}` : `${n}`;
export function practiceSay(p, dummies = []){
  const dn = dummies.find(d => d.id === p.targetId)?.name || 'the dummy';
  if (p.kind === 'preview') return `✨ ${p.action}: no dummy needed for that one; it works at the table.`;
  if (p.kind === 'attack') return `🎯 ${p.action} at the ${dn}: ` + p.rolls.map(r => `${r.natural} ${sign(r.total - r.natural)} = ${r.total} vs AC ${p.ac}, ${r.crit ? `critical! ${r.damage} damage` : r.hit ? `hit, ${r.damage} damage` : 'miss'}`).join(' · ');
  if (p.kind === 'save') return `🎯 ${p.action}: the ${dn} rolls ${p.save.total} against DC ${p.save.dc}, ${p.save.saved ? 'saves' : 'fails'}${p.damage ? `: ${p.damage} damage` : ''}`;
  return `🎯 ${p.action}: ${p.damage} damage to the ${dn}`;
}
function onClientYard(m){
  if (m.t === 'yardSay'){
    const text = m.ok ? [m.practice && practiceSay(m.practice, yv?.view.dummies), DRILL[m.drillFeedback]].filter(Boolean).join(' · ')
      : (mine.last === 'move' && m.reason === 'blocked' ? 'You can\'t walk there.' : REASON[m.reason] || 'That can\'t be done here.');
    mine.say = text; const el = $('#ydSay'); if (el) el.textContent = text; if (!m.ok && !$('#yardModal:not(.hidden)')) toast(text);
    return;
  }
  if (m.closed){
    yv = null; modal().classList.add('hidden');
    if (m.launched){ banner('The party sets out'); toast('🏮 The yard is behind you. The night begins.'); }
    renderPanel(); return;
  }
  const first = !yv, at = {};
  if (m.moved && drawn[m.moved.slot]) at[m.moved.slot] = drawn[m.moved.slot];
  yv = m; renderYard(at);
  if (m.moved?.path?.length) walk(m.moved.slot, m.moved.path);
  if (first && (ui.screen || !otherModalOpen())) modal().classList.remove('hidden');
  if (first) renderPanel();
}
const yardMsg = (kind, extra = {}) => { mine.last = kind; return sendHost({ t:'yard', lobbyId:yv?.view.id, kind, ...(yv?.drill ? { drillId:yv.drill.id } : {}), ...extra }); };
function onBoardTap(e){
  const svg = e.target.closest('svg.yd-board.live'); if (!svg || !yv) return;
  const dummy = e.target.closest('[data-yd-dummy]');
  if (dummy){ if (!mine.action) return toast('Pick an attack or spell first.'); yardMsg('practice', { actionId:mine.action, targetId:dummy.dataset.ydDummy }); return; }
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse()), x = Math.floor(p.x / 10), y = Math.floor(p.y / 10);
  const d = yv.view.dummies.find(q => q.x === x && q.y === y);
  if (d){ if (mine.action) yardMsg('practice', { actionId:mine.action, targetId:d.id }); return; }
  yardMsg('move', { x, y });
}
// For the player's Hero tab: the way back into the yard while it's open.
export const yardPillHTML = () => yv && !ui.screen ? `<div class="card"><div class="hd"><span class="nm">🏮 The Lantern Yard is open</span></div><div class="muted">Try your hero on the practice dummies while everyone gets ready.</div><div class="row"><button class="btn small primary" data-act="ydOpen">Go to the yard</button></div></div>` : '';

/* ---------- the DM's side ---------- */
// The hero a connection sits at, if it's theirs (the yard only lets in heroes the table already gave them).
function seatSheet(peer){
  const s = net.conns.get(peer), tid = state.seats?.[peer]; if (!s || !tid) return null;
  const t = tokById(tid) || state.campaign?.away?.tokens?.find(x => x.id === tid), sheet = t?.charId && state.characters?.[t.charId];
  return sheet && ownsCharacter(sheet, s.name, s.key) ? sheet : null;
}
function sendTo(s, m){ try { if (s.conn.open) s.conn.send(m); } catch {} }
// Everyone in the yard sees it as it is now (each phone with its own buttons; the TV without any).
function syncYard(moved = null){
  for (const [, s] of net.conns){
    if (s.screen) sendTo(s, { t:'yard', ...yardView(null), moved });
    else if (s.cid && inYard(s.cid)) sendTo(s, { t:'yard', ...yardView(s.cid), moved });
  }
  if (ui.role === 'dm') renderPanel();
}
function admitConn(peer, s){
  if (!s || s.screen || !s.cid || s.name === '(joining)') return;
  admitToYard({ seatId:seatIdOf(s), cid:s.cid, name:s.name, sheet:seatSheet(peer) });
}
function onSeatChange(seat, c){
  if (!yardOpen()) return;
  if (seat.screen){ sendTo(seat, { t:'yard', ...yardView(null) }); return; }
  admitConn(c.peer, seat); syncYard();
}
function onSeatLeave(seat){ if (!yardOpen() || !seat?.cid) return; leaveYard(seat.cid); syncYard(); }
function onHostYard(seat, c, m){
  if (!yardOpen()){ sendTo(seat, { t:'yard', closed:true }); return; }
  const r = playYard(seat.cid, m);
  sendTo(seat, { t:'yardSay', ok:!!r.ok, reason:r.reason || null, practice:r.practice || null, drillFeedback:r.drillFeedback || null });
  if (r.ok) syncYard(r.path?.length ? { slot:r.slot, path:r.path } : null);
}
export function dmOpenYard(){
  if (!net.host && !net.code) return toast('Open the table first.');
  openYard();
  for (const [pid, s] of net.conns) admitConn(pid, s);
  syncYard(); toast('🏮 The Lantern Yard is open on every phone and the TV.');
}
function closeEverywhere(launched){ for (const [, s] of net.conns) if (s.screen || s.cid) sendTo(s, { t:'yard', closed:true, launched }); }
// Set out: the ready heroes sit down at the table (through its own checks), and the yard closes everywhere.
function dmSetOut(partial){
  const party = setOut(partial); if (!party) return toast(partial ? 'Nobody is ready yet.' : 'Not everyone is ready yet.');
  let sat = 0;
  for (const p of party){
    const conn = [...net.conns.entries()].find(([, s]) => !s.screen && seatIdOf(s) === p.seatId);
    if (conn && seatHero(conn[0], p.heroId)) sat++;
  }
  closeEverywhere(true); pushState(); renderPanel();
  toast(`🏮 The party sets out: ${sat} of ${party.length} hero${party.length === 1 ? '' : 'es'} at the table.`);
}
export function yardTableHTML(){
  if (!net.code) return '';
  if (!yardOpen()) return `<div class="card"><div class="hd"><span class="nm">🏮 The Lantern Yard</span></div>
    <div class="muted">A place to gather at the start of the night: each hero walks in as their player finishes them, tries their attacks and spells on three dummies, and says when they're ready. Practice costs nothing. With the <b>Lantern Gate</b> drill, two heroes work together to put out three lanterns.</div>
    <div class="row"><button class="btn small primary" data-act="ydDmOpen">🏮 Open the yard</button></div></div>`;
  const v = yardView(null), n = yardCount();
  const away = yard.lobby.members.filter(m => !m.connectionId);
  return `<div class="card yd-dm"><div class="hd"><span class="nm">🏮 The Lantern Yard</span><span class="muted">${n.ready} of ${n.all} ready</span></div>
    ${roster(v.view)}${away.length ? `<div class="row">${away.map(m => `<button class="btn small" data-act="ydRelease" data-k="${m.slot}" title="They've gone for the night">Let ${esc(m.avatar?.name || m.name)}'s place go</button>`).join('')}</div>` : ''}
    ${drillHTML(v.drill, v.view)}${boardSVG(v.view, v.drill)}${feedHTML(v.feed)}
    <div class="row">${v.drill ? `<button class="btn small" data-act="ydDrill" data-k="reset">↺ Light the lanterns again</button><button class="btn small" data-act="ydDrill" data-k="off">Put the drill away</button>` : `<button class="btn small" data-act="ydDrill" data-k="on">🏮 The Lantern Gate drill</button>`}</div>
    <div class="row"><button class="btn small primary" data-act="ydSetOut" ${n.all && n.ready === n.all ? '' : 'disabled'}>▶ Set out</button>${n.ready && n.ready < n.all ? `<button class="btn small" data-act="ydSetOut" data-k="partial">▶ Set out with the ${n.ready} ready</button>` : ''}<button class="btn small" data-act="ydDmClose">Close the yard</button></div></div>`;
}

let started = false;
export function ensureYard(){
  if (started) return; started = true;
  net.onSeatChange = onSeatChange; net.onSeatLeave = onSeatLeave;
  net.onYard = (a, b, c) => ui.role === 'dm' && b ? onHostYard(a, b, c) : onClientYard(a);
  document.addEventListener('click', e => {
    if (e.target.closest?.('svg.yd-board.live')) return onBoardTap(e);
    const el = e.target.closest?.('[data-act]'), act = el?.dataset.act;
    if (!act?.startsWith('yd')) return;
    if (act === 'ydOpen'){ if (yv){ renderYard(); modal().classList.remove('hidden'); } }
    else if (act === 'ydClose') modal().classList.add('hidden');
    else if (act === 'ydAct'){ mine.action = el.dataset.id; renderYard(); }
    else if (act === 'ydReady'){ const me = yv?.view.members.find(x => x.slot === yv.view.yourSlot); yardMsg('ready', { ready:me?.stage !== 'ready' }); }
    else if (act === 'ydBuild'){   // back to the creator: the hero walks in again when it's saved
      if (yardMsg('build')){ modal().classList.add('hidden'); const go = document.createElement('button'); go.dataset.act = 'editHero'; go.dataset.id = ui.myHeroId || ''; go.hidden = true; document.body.appendChild(go); go.click(); go.remove(); } }
    else if (ui.role !== 'dm') return;
    else if (act === 'ydDmOpen') dmOpenYard();
    else if (act === 'ydDmClose'){ closeYard(); closeEverywhere(false); renderPanel(); toast('The yard is closed.'); }
    else if (act === 'ydDrill'){ if (el.dataset.k === 'off') stopDrill(); else startDrill(); syncYard(); }
    else if (act === 'ydRelease'){ if (releaseFromYard(+el.dataset.k)) syncYard(); }
    else if (act === 'ydSetOut') dmSetOut(el.dataset.k === 'partial');
  });
}
