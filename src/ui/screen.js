/* THE TABLE SCREEN — the view for the TV at an in-person game. It's a player's view (fog, no secrets) with the
   app's controls taken away and the table's things put on instead: whose turn it is across the top with the
   heroes' portraits, the party along the bottom, a camera that follows the action (or goes where the DM sends
   it), and full-screen moments the DM sends from the Night tab: read-aloud text, a face and a name, a handout,
   lights out. Opened with ?screen (a window on the DM's computer) or ?screen=CODE (another device). */
import * as THREE from 'three';
import { state, ui, tokById, dreadLevel } from '../engine/state.js';
import { seenNow } from '../engine/grid.js';
import { CONDITIONS } from '../data/dread.js';
import { $, esc, clamp } from '../util/core.js';
import { controls, camTo, viewOffset, wx, wz, floorY } from '../render/scene.js';
import { goFloor } from '../game/actions.js';
import { currentTurn } from '../game/rules.js';

const S = { follow:true, holdUntil:0, lastKey:'', timer:0, turnKey:'', turnAt:0, dark:false };

export function bootScreenUI(){
  ui.screen = true; ui.role = 'player'; ui.panelOpen = false; ui.view = 'tilt';
  document.body.classList.add('screen');
  $('#screenHud').classList.remove('hidden');
  setInterval(tick, 250);
}
const visible = t => { const W = state.floors[t.floor]?.W, s = t.size || 1; if (!W) return false; for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) if (seenNow[t.floor]?.has((t.y + dy) * W + t.x + dx)) return true; return false; };
const face = (t, big) => {
  const img = state.art?.[t.id] || state.art?.[t.bid];
  const col = t.kind === 'monster' ? '#c0303a' : t.color || '#e9a54a';
  return img ? `<img class="sc-face${big ? ' big' : ''}" src="${img}" alt="">` : `<span class="sc-face${big ? ' big' : ''}" style="background:${col}">${esc((t.name || '?')[0])}</span>`;
};
const hp = t => `<i class="sc-hp"><b style="width:${Math.round(100 * clamp(t.hp / (t.maxHp || 1), 0, 1))}%"></b></i>`;

// Who goes after the one acting now (skipping the dead and the gone). → an index into the order, or -1
export function upNext(){
  const c = state.combat, n = c.order.length;
  for (let k = 1; k < n; k++){ const i = (c.idx + k) % n, t = tokById(c.order[i]); if (t && !t.flags?.gone && (!t.dead || t.flags?.rising)) return i; }
  return -1;
}
// The top (whose turn, in order) and the bottom (the party): redrawn with every state.
export function renderScreen(){
  if (!ui.screen || !state) return;
  const c = state.combat, f = state.floors[ui.floor], D = dreadLevel();
  $('#scTitle').innerHTML = `${esc(f?.name || '')}${state.weather ? ` <span>· ${esc(state.weather)}</span>` : ''}<span class="sc-gaze" title="Strahd's Gaze">👁 ${state.dread} <i>${esc(D.n)}</i></span>`;
  if (c.active){
    const nextIdx = upNext();
    $('#scRibbon').innerHTML = `<span class="sc-round">Round ${c.round}</span>` + c.order.map((id, i) => {
      const t = tokById(id); if (!t || t.flags?.gone) return '';
      const hidden = t.kind === 'monster' && !visible(t);
      return `<span class="sc-ini ${i === c.idx ? 'cur' : ''} ${i === nextIdx ? 'next' : ''} ${t.dead ? 'dead' : ''}">${hidden ? '<span class="sc-face" style="background:#333">?</span>' : face(t)}<span class="nm">${hidden ? 'Something' : esc(t.name)}</span></span>`;
    }).join('');
  } else $('#scRibbon').innerHTML = '';
  const party = state.tokens.filter(t => t.kind !== 'monster' && !t.flags?.gone);
  $('#scParty').innerHTML = party.map(t => `<span class="sc-hero ${t.dead ? 'dead' : ''} ${c.active && currentTurn()?.id === t.id ? 'cur' : ''}">${face(t, true)}<span class="nm">${esc(t.name)}${t.dead ? ' ✝' : ''}</span>${hp(t)}<span class="cd">${(t.conds || []).map(x => CONDITIONS[x.n]?.icon || '•').join('')}</span></span>`).join('');
}

// Keep the action in frame: the creature whose turn it is (if the party can see it), else the party.
export function frameAction(force = false){
  if (!ui.screen || !state || !S.follow || performance.now() < S.holdUntil) return;
  const c = state.combat, cur = c.active ? currentTurn() : null;
  const party = state.tokens.filter(t => t.kind !== 'monster' && !t.dead && !t.flags?.gone);
  let L, x, y;
  if (cur && !cur.dead && (cur.kind !== 'monster' || visible(cur))) ({ floor:L, x, y } = cur);
  else if (party.length){
    const floors = {}; for (const t of party) floors[t.floor] = (floors[t.floor] || 0) + 1;
    L = +Object.entries(floors).sort((a, b) => b[1] - a[1])[0][0];
    const here = party.filter(t => t.floor === L); x = here.reduce((s, t) => s + t.x, 0) / here.length; y = here.reduce((s, t) => s + t.y, 0) / here.length;
  } else return;
  const key = `${L}:${Math.round(x / 3)}:${Math.round(y / 3)}:${cur?.id || ''}`;
  if (key === S.lastKey && !force) return;
  S.lastKey = key;
  if (L !== ui.floor) goFloor(L, false);
  camTo(new THREE.Vector3(wx(Math.round(x)), floorY(L), wz(Math.round(y))), viewOffset().multiplyScalar(.68), 1.1);   // north-up and closer than the DM's view (it's across the room)
}
export function afterScreenState(){
  renderScreen(); frameAction();
  const c = state.combat, key = c.active ? `${c.round}:${c.idx}` : '';
  if (key !== S.turnKey){ S.turnKey = key; S.turnAt = performance.now(); }
  controls.autoRotate = false;   // north stays up, as the phones' move pad says
}

// The turn timer: a ring that empties over a hero's turn (cosmetic: nobody is stopped when it runs out).
function tick(){
  const el = $('#scTimer'), cur = state?.combat.active && currentTurn();
  if (!S.timer || !cur || cur.kind === 'monster'){ el.classList.add('hidden'); return; }
  const left = Math.max(0, S.timer - (performance.now() - S.turnAt) / 1000);
  el.classList.remove('hidden'); el.classList.toggle('out', left <= 0);
  el.style.setProperty('--k', String(left / S.timer));
  el.querySelector('b').textContent = left > 0 ? Math.ceil(left) : '⌛';
}

/* The dice moment: an attack's d20 tumbles across the TV and lands — gold on a 20, blood on a 1 — then the card.
   c: the card ({ die:{ n, crit, hit } }); show: shows the card. */
export function screenDie(c, show){
  const el = $('#scDie'), n = c.die.n; if (!el || !n){ show(); return; }
  el.className = 'sc-die spin'; el.querySelector('b').textContent = '';
  const flick = setInterval(() => { el.querySelector('b').textContent = 1 + Math.floor(Math.random() * 20); }, 70);
  setTimeout(() => {
    clearInterval(flick); el.querySelector('b').textContent = n;
    el.className = `sc-die land ${n === 20 || c.die.crit ? 'n20' : n === 1 ? 'n1' : c.die.hit ? 'hit' : 'miss'}`;
    setTimeout(() => { el.classList.add('aside'); show(); }, 650); setTimeout(() => { el.className = 'sc-die hidden'; }, 4200);   // it steps aside for the card
  }, 950);
}

// What the DM sends from the Night tab. → true if it was one of these
export function screenMsg(m){
  const over = $('#scOver');
  const show = html => { over.innerHTML = html; over.classList.remove('hidden'); over.classList.remove('fade'); void over.offsetWidth; over.classList.add('in'); };
  switch (m.t){
    case 'narrate':
      if (m.off){ over.classList.add('hidden'); return true; }
      show(`<div class="sc-narr">${m.title ? `<h2>${esc(m.title)}</h2>` : ''}<p class="type">${esc(m.text || '').replace(/\n/g, '<br>')}</p></div>`);
      return true;
    case 'intro':
      show(`<div class="sc-intro">${m.img ? `<img src="${m.img}" alt="">` : ''}<div><h2>${esc(m.name || '')}</h2>${m.line ? `<p>${esc(m.line)}</p>` : ''}</div></div>`);
      return true;
    case 'handout':
      show(`<div class="sc-hand">${m.title ? `<h2>${esc(m.title)}</h2>` : ''}<img src="${m.img}" alt=""></div>`);
      return true;
    case 'scMode':
      S.dark = m.mode === 'dark';
      $('#scDark').classList.toggle('hidden', !S.dark);
      if (m.mode !== 'dark') over.classList.add('hidden');
      afterScreenState(); return true;
    case 'scFollow': S.follow = !!m.on; if (S.follow) frameAction(true); afterScreenState(); return true;
    case 'timer': S.timer = +m.secs || 0; S.turnAt = performance.now(); return true;
    // ask the table (game/asks.js): who's still rolling, then everyone's result at once
    case 'askState': {
      const el = $('#scAsk'); el.classList.remove('hidden');
      el.innerHTML = `<b>🎲 ${esc(m.label)}</b>${m.dc != null ? ` <span>DC ${m.dc}</span>` : ''}<div>${m.who.map(w => `<span class="${w.done ? 'done' : ''}">${esc(w.name)}${w.done ? ' ✓' : ' …'}</span>`).join('')}</div>`;
      return true;
    }
    case 'askClear': $('#scAsk').classList.add('hidden'); return true;
    case 'notePassed': {   // a note changes hands: the table sees that, not what it says
      const el = $('#scAsk'); el.classList.remove('hidden');
      el.innerHTML = m.strahd ? `<b style="color:#e46a6a">👁 Someone hears a voice</b><div><span>${esc(m.name)} looks up, very still.</span></div>` : `<b>✉ A note passes to ${esc(m.name)}</b><div><span>for their eyes only</span></div>`;
      clearTimeout(S.noteT); S.noteT = setTimeout(() => el.classList.add('hidden'), 6000);
      return true;
    }
    case 'askReveal': {
      $('#scAsk').classList.add('hidden');
      const rows = m.rows.map((r, i) => { const t = tokById(r.id) || { name:r.name };
        return `<div class="sc-roll ${r.ok === true ? 'ok' : r.ok === false ? 'no' : ''} ${r.d20 === 20 ? 'n20' : r.d20 === 1 ? 'n1' : ''}" style="animation-delay:${.35 + i * .45}s">${face(t, true)}<b>${r.total}</b><span>🎲 ${r.d20} ${r.bonus >= 0 ? '+' : '−'} ${Math.abs(r.bonus)}</span><i>${esc(r.name)}${r.ok === true ? ' ✓' : r.ok === false ? ' ✗' : ''}</i></div>`; }).join('');
      show(`<div class="sc-reveal"><h2>${esc(m.label)}${m.dc != null ? ` <span>DC ${m.dc}</span>` : ''}</h2><div class="sc-rolls">${rows}</div>${m.group == null ? '' : `<h3 style="animation-delay:${.6 + m.rows.length * .45}s">${m.group ? 'They make it — together.' : 'Not enough of them.'}</h3>`}</div>`);
      clearTimeout(S.revealT); S.revealT = setTimeout(() => over.classList.add('hidden'), 14000);
      return true;
    }
    case 'look':
      if (!state) return true;
      S.holdUntil = performance.now() + 25000;
      if (m.floor !== ui.floor) goFloor(m.floor, false);
      { const t = new THREE.Vector3(...m.target), p = new THREE.Vector3(...m.pos); camTo(t, p.sub(t), 1.4); }
      return true;
  }
  return false;
}
