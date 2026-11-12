import * as THREE from 'three';
import { state, ui, isDM, tokById } from '../engine/state.js';
import { followsDmTurn, partyByFloor, partyFrame, topViewDistance } from '../engine/dm-view.js';
import { goFloor, select, setView } from '../game/actions.js';
import { marchOrder } from '../game/moves.js';
import { openScreenWindow } from '../game/night.js';
import { currentTurn } from '../game/rules.js';
import { net } from '../net/table.js';
import { camera, controls, camTo, floorY, focusTile, wx, wz } from '../render/scene.js';
import { $, esc, clamp } from '../util/core.js';
import { condChips, hpBar, renderDock, renderTabs, resChips, toast } from '../ui/hud.js';
import { renderPanel } from '../ui/panels.js';
import { setMode } from '../ui/input.js';

function frameParty(){
  const frame = partyFrame(marchOrder(), ui.floor);
  if (!frame){ toast('There is no party on this map.'); return; }
  setView('top', false);
  goFloor(frame.floor, false);
  if (ui.panelOpen && innerWidth <= 760){
    ui.panelOpen = false; renderPanel(); renderDock();
  }
  const width = ui.panelOpen ? clamp(1 - 784 / innerWidth, .22, .72) : .72;
  const distance = clamp(topViewDistance(frame, camera.fov, camera.aspect, { width }),
    controls.minDistance, controls.maxDistance);
  camTo(new THREE.Vector3(wx(frame.x), floorY(frame.floor), wz(frame.y)), new THREE.Vector3(0, distance, .01));
}

function focusToken(t){
  if (!t || t.flags?.gone) return;
  if (ui.view === 'stack') setView('top', false);
  select(t.id);
  focusTile(t.floor, t.x, t.y);
}

function openParty(){
  if (ui.tab === 'build') setMode('select');
  ui.tab = 'party'; ui.panelOpen = true;
  renderTabs(); renderPanel(); renderDock();
}

export function renderPartyLauncher(){
  let el = $('#dmPartyLauncher');
  if (!el){
    el = document.createElement('button');
    el.id = 'dmPartyLauncher'; el.type = 'button'; el.className = 'btn small';
    $('#btnPanel').after(el);
  }
  el.hidden = ui.role !== 'dm' || ui.screen;
  el.textContent = ui.tableView ? 'Exit Table View' : 'Party';
  el.title = ui.tableView ? 'Return to your DM controls' : 'Party roster and DM camera';
  if (ui.tableView){
    delete el.dataset.dmParty; el.dataset.act = 'tableView';
  } else {
    delete el.dataset.act; el.dataset.dmParty = 'open';
  }
}

export function renderPartyDesk(){
  if (!isDM()) return '';
  const following = followsDmTurn(ui);
  const groups = partyByFloor(marchOrder());
  const seats = new Map(Object.entries(state.seats || {}).map(([peer, id]) => [id, net.conns.get(peer)?.name]));
  let html = `<h3>Party</h3><div class="row">
    <button class="btn small ${following ? 'on' : ''}" data-dm-party="follow" aria-pressed="${following}">Follow Turn</button>
    <button class="btn small ${following ? '' : 'on'}" data-dm-party="free" aria-pressed="${!following}">Free Camera</button>
    <button class="btn small" data-dm-party="frame">Frame Party</button>
    <button class="btn small" data-dm-party="preview">Preview Player View</button>
  </div>`;
  if (!groups.size){
    const away = state.campaign?.away;
    return html + `<div class="muted">${away ? `The party is waiting in ${esc(away.name)}.` : 'There is no party on this map.'}</div>`;
  }
  for (const [floor, group] of groups){
    html += `<h4>${esc(state.floors[floor]?.name || 'Map')} · Floor ${floor + 1}</h4>`;
    for (const t of group){
      const portrait = state.art?.[t.id] || state.characters?.[t.charId]?.portrait;
      const seat = seats.get(t.id);
      const status = [t.dead ? 'Fallen' : t.hp <= 0 ? 'Down' : t.kind === 'npc' ? 'Ally' : '', seat].filter(Boolean).join(' · ');
      html += `<div class="card${ui.selected === t.id ? ' sel' : ''}"><div class="row">
        <button class="btn small" data-dm-party="focus" data-id="${esc(t.id)}" title="Focus ${esc(t.name)}">${portrait ? `<img class="sc-face" src="${esc(portrait)}" alt=""> ` : ''}${esc(t.name)}</button>
        <span class="muted">${esc(status)}</span></div>
        <div class="stat">HP ${t.hp}/${t.maxHp} · AC ${t.ac}</div>${hpBar(t, true)}
        ${condChips(t, false)}${resChips(t, false)}</div>`;
    }
  }
  return html;
}

export function installPartyDesk(){
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-dm-party]');
    if (!el || !state || !isDM()) return;
    switch (el.dataset.dmParty){
      case 'open': openParty(); break;
      case 'follow': ui.dmFollowTurn = true; focusToken(currentTurn()); renderPanel(); break;
      case 'free': ui.dmFollowTurn = false; renderPanel(); break;
      case 'frame': frameParty(); break;
      case 'focus': { const t = tokById(el.dataset.id); if (t?.kind !== 'monster') focusToken(t); renderPanel(); } break;
      case 'preview': openScreenWindow(); break;
    }
  });
}
