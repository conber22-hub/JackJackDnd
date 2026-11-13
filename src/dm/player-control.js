import { state, isDM, tokById } from '../engine/state.js';
import { declineHeroActions, pendingHeroActions, playerControlDenial } from '../engine/dm-control.js';
import { currentTurn } from '../game/rules.js';
import { queue, renderRequests } from '../game/requests.js';
import { net, pushState } from '../net/table.js';
import { renderPanel } from '../ui/panels.js';
import { $, esc } from '../util/core.js';

// These permissions belong to the open table and survive map changes and reconnects.
const control = { movementPaused:false, dmHeroes:[] };
export function resetPlayerControls(){
  control.movementPaused = false;
  control.dmHeroes.length = 0;
}

export function playerControlSnapshot(){
  const { movementPaused, dmHeroes } = control;
  const here = dmHeroes.filter(id => state.tokens.some(t => t.id === id && !t.flags?.gone));
  return movementPaused || here.length ? { movementPaused, dmHeroes:here } : null;
}

export function hostControlDenial(heroId, messageType){
  return playerControlDenial(control, heroId, messageType);
}

export function currentPendingCount(){
  return pendingHeroActions(queue, currentTurn()?.id).length;
}

export function declineQueuedHeroActions(heroId, reason){
  const count = declineHeroActions(queue, heroId, reason);
  if (count) renderRequests();
  return count;
}

export function renderPendingTurn(){
  $('#initPending')?.remove();
  const pending = isDM() && state?.combat.active ? currentPendingCount() : 0;
  if (pending) $('#initBtns').insertAdjacentHTML('afterend',
    `<div class="row" id="initPending" style="padding:0 10px 10px">
      <span class="muted" role="status">${pending} pending</span>
      <button class="btn small danger" data-act="declineNext">Decline &amp; advance</button>
    </div>`);
}

export function renderPlayerControls(){
  return `<div class="row"><button class="btn small ${control.movementPaused ? 'on' : ''}"
    data-dm-control="pause" aria-pressed="${control.movementPaused}">${control.movementPaused ? 'Resume Player Movement' : 'Pause Player Movement'}</button></div>`;
}

export function renderHeroControl(id){
  if (!id) return '';
  const held = control.dmHeroes.includes(id);
  return `<button class="btn small ${held ? 'on' : ''}" data-dm-control="hero" data-id="${esc(id)}">
    ${held ? 'Hand Back' : 'Take Control'}</button>`;
}

export function playerControlStatus(control, heroId){
  if (!control || !heroId) return '';
  const text = playerControlDenial(control, heroId, 'move');
  return text ? `<div class="trait" role="status">${esc(text)}</div>` : '';
}

export function installPlayerControls(){
  document.addEventListener('click', e => {
    const button = e.target.closest('[data-dm-control]');
    if (!button || !isDM() || !state?.campaign) return;
    if (button.dataset.dmControl === 'pause') control.movementPaused = !control.movementPaused;
    else if (button.dataset.dmControl === 'hero'){
      const id = button.dataset.id, t = tokById(id);
      const i = control.dmHeroes.indexOf(id);
      if (i >= 0) control.dmHeroes.splice(i, 1);
      else {
        if (!t || t.kind === 'monster' || t.flags?.gone) return;
        if (!Object.entries(state.seats).some(([peer, tid]) => tid === id && net.conns.has(peer))) return;
        control.dmHeroes.push(id);
        declineQueuedHeroActions(id, 'The DM took control of your hero. Your pending action was declined.');
      }
    } else return;
    renderPanel(); pushState();
  });
}
