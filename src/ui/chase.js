/* 🏃 THE CHASE — Codex's engine/chase.js at the DM's hand. Pick who's running and who's after them (from the creatures
   on this floor), the ground (from the map's look) and go round by round: each runner moves, dashes, hides, knocks
   something down or helps a slower friend; the ground throws up its own trouble. It ends when they get away, are
   caught (a fight: one tap rolls initiative), or someone gives up. */
import { state, ui, tokById, log } from '../engine/state.js';
import { $, esc } from '../util/core.js';
import { startChase, chaseRound, result } from '../engine/chase.js';
import { THEMES } from '../data/themes.js';
import { rollInitiative } from '../game/combat.js';
import { changed } from '../game/session.js';
import { toast } from './hud.js';
import { registerCommands } from './palette.js';

const TERRAIN = { woods:'woods', village:'village street', tavern:'village street', grounds:'village street', castle:'castle halls', manor:'castle halls', undercroft:'castle halls', chapel:'castle halls' };
const ACTS = { move:'Run', dash:'Dash', hide:'Hide', obstacle:'Knock something down', help:'Help a friend', giveup:'Give up' };
let chase = null, side = {}, terrain = 'road', names = {};

const groundFor = f => { const th = THEMES[f?.theme] || {}; return TERRAIN[th.id] || (th.walls === 'trees' ? 'woods' : th.cave ? 'castle halls' : 'road'); };
const lightNow = () => { const h = state.campaign?.valley?.hour ?? 12; return h >= 20 || h < 6 ? 'night' : 'day'; };
const weatherNow = () => { const k = state.campaign?.wx?.kind || ''; return /snow|blizzard|sleet/.test(k) ? 'snow' : /rain|drizzle|storm|downpour/.test(k) ? 'rain' : /fog|mist/.test(k) ? 'fog' : 'clear'; };
const who = t => ({ id:t.id, speed:t.speed || 30, con:t.con ?? 10, dex:t.dex ?? 10, wis:t.wis ?? 10, exhaustion:t.exhaustion || 0, passive:t.passive, ac:t.ac, hp:t.hp, monster:t.kind === 'monster', morale:t.kind === 'monster' ? 8 : null });

export function openChase(){
  if (ui.role !== 'dm' || !state) return;
  const f = state.floors[ui.floor]; terrain = groundFor(f); chase = null; side = {};
  for (const t of state.tokens.filter(t => t.floor === ui.floor && !t.dead)) side[t.id] = t.kind === 'pc' ? 'quarry' : t.kind === 'monster' ? 'pursuer' : 'out';
  render();
}
function close(){ $('#chaseSheet')?.classList.add('hidden'); }

function render(){
  let m = $('#chaseSheet');
  if (!m){ m = document.createElement('div'); m.id = 'chaseSheet'; m.className = 'modal'; document.body.appendChild(m); m.addEventListener('click', onClick); m.addEventListener('change', onChange); }
  const toks = state.tokens.filter(t => t.floor === ui.floor && !t.dead);
  let h = `<div class="box ch-sheet"><div class="row" style="align-items:center"><h2 style="flex:1;margin:0">🏃 The chase</h2><button class="btn small" data-chx="close">✕</button></div>`;
  if (!chase){
    h += `<div class="muted">Who runs, who follows? The party starts 60 ft ahead.</div>
      ${toks.map(t => `<div class="row"><span class="grow">${esc(t.name)}</span><select class="txt" style="width:auto" data-chside="${esc(t.id)}">${['quarry', 'pursuer', 'out'].map(s => `<option value="${s}" ${side[t.id] === s ? 'selected' : ''}>${s === 'quarry' ? 'Running' : s === 'pursuer' ? 'Chasing' : 'Not in it'}</option>`).join('')}</select></div>`).join('')}
      <div class="row"><label>Ground</label><select class="txt" style="width:auto" id="chTerrain">${['village street', 'woods', 'road', 'marsh', 'castle halls', 'rooftops'].map(x => `<option ${x === terrain ? 'selected' : ''}>${x}</option>`).join('')}</select>
        <span class="muted">${lightNow()} · ${weatherNow()}</span></div>
      <div class="row"><button class="btn primary" data-chx="start">Start the chase</button></div>`;
  } else {
    const r = result(chase), far = Math.max(60, ...chase.participants.map(p => p.position)) + 20;
    h += `<div class="muted">Round ${chase.round} · ${esc(chase.terrain)}${chase.cover ? ' · mist: cover' : ''}</div>
      <div class="ch-track">${chase.participants.map(p => `<div class="ch-lane"><span class="ch-name">${p.side === 'quarry' ? '🏃' : '🐺'} ${esc(names[p.id] || p.id)}${p.status ? ` <i>(${esc(p.status)})</i>` : ''}</span>
        <span class="ch-bar"><span class="ch-dot ${p.side}" style="left:${Math.max(0, Math.min(100, p.position / far * 100))}%"></span></span><span class="ch-ft">${Math.round(p.position)} ft</span></div>`).join('')}</div>`;
    if (!r.over) h += chase.participants.filter(p => !p.status).map(p => `<div class="row"><span class="grow">${esc(names[p.id] || p.id)}</span><select class="txt" style="width:auto" data-chact="${esc(p.id)}">${Object.entries(ACTS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>`).join('')
      + `<div class="row"><button class="btn primary" data-chx="round">Next round</button></div>`;
    const ev = chase.events || [];
    if (ev.length) h += `<div class="ch-events">${ev.map(e => `<div>${esc(eventText(e))}</div>`).join('')}</div>`;
    if (r.over){
      const caught = r.who.filter(w => w.how === 'captured');
      h += `<p class="ch-end">${caught.length ? `${caught.map(w => esc(names[w.id])).join(', ')} ${caught.length > 1 ? 'are' : 'is'} caught.` : 'They get away.'}</p>
        <div class="row">${caught.length ? `<button class="btn primary" data-chx="fight">⚔ Fight</button>` : ''}<button class="btn small" data-chx="close">Done</button></div>`;
    }
  }
  m.innerHTML = h + '</div>'; m.classList.remove('hidden');
}
function eventText(e){
  const n = names[e.who] || '';
  if (e.kind === 'complication') return `${n}: ${e.text} ${e.ok ? '(kept their footing)' : '(lost ground)'}`;
  if (e.kind === 'dash-check') return `${n} pushes on: ${e.ok ? 'still going' : 'one level of exhaustion'}`;
  if (e.kind === 'hide') return `${n} tries to hide: ${e.ok ? 'gone from sight' : 'seen'}`;
  if (e.kind === 'cannot-hide') return `${n} has nowhere to hide here`;
  if (e.kind === 'obstacle') return `${n} knocks something down${e.ok ? '' : ' (clumsily)'}`;
  if (e.kind === 'help') return `${n} hauls ${names[e.target] || 'a friend'} along`;
  if (e.kind === 'giveup' || e.kind === 'morale') return `${n} gives up the chase`;
  if (e.kind === 'attack') return `${n} strikes at ${names[e.target]}: ${e.hit ? `${e.damage} damage` : 'misses'}`;
  return `${n}: ${e.kind}`;
}
function onChange(e){
  const t = e.target;
  if (t.dataset.chside) side[t.dataset.chside] = t.value;
  if (t.id === 'chTerrain') terrain = t.value;
}
function onClick(e){
  const b = e.target.closest('[data-chx]'); if (!b) return;
  const k = b.dataset.chx;
  if (k === 'close') return close();
  if (k === 'start'){
    const toks = state.tokens.filter(t => t.floor === ui.floor && !t.dead);
    const q = toks.filter(t => side[t.id] === 'quarry'), p = toks.filter(t => side[t.id] === 'pursuer');
    if (!q.length || !p.length){ toast('A chase needs someone running and someone chasing.'); return; }
    names = Object.fromEntries(toks.map(t => [t.id, t.name]));
    chase = startChase({ quarry:q.map(who), pursuers:p.map(who), terrain, light:lightNow(), weather:weatherNow(), rng:Math.random });
    log(`🏃 A chase through the ${terrain}: ${q.map(t => t.name).join(', ')} with ${p.map(t => t.name).join(', ')} behind.`);
    return render();
  }
  if (k === 'round'){
    const acts = {}; document.querySelectorAll('#chaseSheet [data-chact]').forEach(s => acts[s.dataset.chact] = s.value);
    chase = chaseRound(chase, acts, Math.random).state;
    const r = result(chase); if (r.over) log(`🏃 The chase ends: ${r.how}.`);
    changed(); return render();
  }
  if (k === 'fight'){
    const ids = chase.participants.filter(p => p.side === 'pursuer' && !p.status).map(p => p.id).concat(result(chase).who.filter(w => w.how === 'captured').map(w => w.id));
    close(); rollInitiative({ ids:ids.filter(id => tokById(id)) });
  }
}

let started = false;
export function ensureChase(){
  if (started) return; started = true;
  const st = document.createElement('style');
  st.textContent = `.ch-sheet{max-width:620px}.ch-track{margin:10px 0;display:flex;flex-direction:column;gap:6px}.ch-lane{display:grid;grid-template-columns:150px 1fr 54px;gap:8px;align-items:center;font-size:13px}
  .ch-bar{position:relative;height:8px;border-radius:4px;background:rgba(255,255,255,.08)}.ch-dot{position:absolute;top:-4px;width:16px;height:16px;border-radius:50%;transform:translateX(-50%)}
  .ch-dot.quarry{background:var(--gold)}.ch-dot.pursuer{background:var(--blood,#8a1c1c)}.ch-ft{text-align:right;color:var(--muted,#999)}
  .ch-events{margin:8px 0;padding:8px 10px;border-left:2px solid var(--gold);font-size:13px}.ch-end{font-size:17px;color:var(--gold-hi)}
  @media (max-width:480px){.ch-lane{grid-template-columns:110px 1fr 46px}}`;
  document.head.appendChild(st);
  registerCommands([{ id:'chase', n:'A chase', hint:"Someone runs, something follows: round by round, with the ground's own trouble", icon:'🏃', role:'dm', run:openChase }]);
}
