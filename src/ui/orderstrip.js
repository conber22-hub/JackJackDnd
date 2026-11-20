/* ⏳ THE TURN ORDER, AS FACES — a strip of portraits in the order they'll act, starting from whoever's acting now
   (larger, in a gold ring), the next one marked, and where the round comes round again. Under each face a bar of
   health (only where this screen may know it: a player at the table doesn't see a monster's), and over it what
   they're under (⤓ prone, ☠ poisoned, 🛡 dodging…). Pointing at a face lights its figure on the map; a tap on a foe
   aims at it. For the Wanderer (ui/wander.js: across the top) and the table handheld (ui/tablehh.js: in its panel).
   The faces are each figure's portrait (game/night.js faceOf: art, a forged face, or its mini), made one at a time
   in the quiet after the strip first draws (so a fight breaking out doesn't stutter), a letter until then. */
import { esc } from '../util/core.js';
import { tokById } from '../engine/state.js';
import { faceOf } from '../game/night.js';
import { emblemSvg } from './emblems.js';

const COND_IC = { prone:'⤓', poisoned:'☠', frightened:'😱', blessed:'✦', restrained:'⛓', stunned:'💫', paralyzed:'⚡', invisible:'👁', concentrating:'🌀',
  raging:'🔥', grappled:'✋', charmed:'♥', blinded:'🕶', unconscious:'💤', incapacitated:'✖', deafened:'🔇', petrified:'🗿', hasted:'»', exhaustion:'😩', seeded:'☣', dodging:'🛡' };
const condIcons = t => { const out = (t.conds || []).map(c => [COND_IC[c.n] || '•', c.n]); if (t.dodge && !out.some(c => c[1] === 'dodging')) out.push(['🛡', 'dodging']); return out.slice(0, 4); };

/* ---------- the faces ---------- */
const faces = new Map(), want = []; let making = false;
function makeFaces(){
  if (making || !want.length) return; making = true;
  setTimeout(() => {
    const id = want.shift(), t = tokById(id);
    if (t && !faces.has(id)){ let img = null; try { img = faceOf(t); } catch {} faces.set(id, img || ''); changedFace?.(); }
    making = false; makeFaces();
  }, 140);
}
let changedFace = null;
const faceFor = t => { if (!faces.has(t.id) && !want.includes(t.id)){ want.push(t.id); makeFaces(); } return faces.get(t.id) || ''; };
export const facesMade = () => [...faces.values()].filter(Boolean).length;

/* The strip. order: the fight's order (token ids); cur: whose turn it is; me: this screen's hero; round: the round;
   seeHp(o): may this screen show o's health; onFace: called when a portrait has been made (to draw again). → html */
export function orderStrip({ order, cur, me, round = 1, seeHp = () => true, onFace = null, act = 'os' }){
  changedFace = onFace;
  const all = order.map(tokById).filter(o => o && !o.flags?.gone);
  if (!all.length) return '';
  const k = Math.max(0, all.findIndex(o => o.id === cur));
  const rot = [...all.slice(k), ...all.slice(0, k)];
  let next = null;
  const out = rot.map((o, n) => {
    const down = o.dead || o.hp <= 0, now = n === 0;
    if (!now && !down && !next) next = o.id;
    const img = faceFor(o), hp = seeHp(o) && o.maxHp > 1 ? Math.max(0, Math.min(1, o.hp / o.maxHp)) : null;
    const wrap = n > 0 && all.indexOf(o) === 0 ? `<span class="os-round" title="Round ${round + 1}">↻ ${round + 1}</span>` : '';
    return `${wrap}<button class="os-p ${o.kind === 'monster' ? 'foe' : 'pal'}${now ? ' now' : ''}${o.id === next ? ' next' : ''}${down ? ' down' : ''}${o.id === me ? ' me' : ''}" data-act="${act}" data-id="${esc(o.id)}" title="${esc(o.name)}${hp !== null ? ` · ${Math.max(0, o.hp)} / ${o.maxHp} HP` : ''}">`
      + `<span class="os-face"${img ? ` style="background-image:url(${img})"` : ''}>${img ? '' : esc((o.name || '?')[0])}</span>`
      + `${o.calling && o.kind !== 'monster' ? `<span class="os-emb" style="color:${esc(o.callColor || '#e8d6a8')}">${emblemSvg(o.calling, { size:14 })}</span>` : ''}`
      + `${hp !== null ? `<span class="os-hp"><i style="width:${Math.round(hp * 100)}%" class="${hp <= .25 ? 'low' : hp <= .5 ? 'mid' : ''}"></i></span>` : ''}`
      + `${condIcons(o).length ? `<span class="os-cond">${condIcons(o).map(([ic, nm]) => `<i title="${esc(nm)}">${ic}</i>`).join('')}</span>` : ''}`
      + `<span class="os-nm">${now ? '▸ ' : ''}${esc(o.name)}</span>${o.id === next ? '<span class="os-next">next</span>' : ''}</button>`;
  });
  return `<div class="os-strip">${out.join('')}</div>`;
}

/* Pointing and tapping, for each screen that draws a strip (act: its data-act): { pick(id), hover(id | null) } */
const handlers = {};
let wired = false;
export function wireStrip(act, h){
  handlers[act] = h;
  if (wired) return; wired = true;
  document.addEventListener('click', e => { const b = e.target.closest?.('.os-p'); if (!b) return; handlers[b.dataset.act]?.pick?.(b.dataset.id); e.stopPropagation(); }, true);
  document.addEventListener('pointerover', e => { const b = e.target.closest?.('.os-p'); if (b) handlers[b.dataset.act]?.hover?.(b.dataset.id); });
  document.addEventListener('pointerout', e => { const b = e.target.closest?.('.os-p'); if (b && !b.contains(e.relatedTarget)) handlers[b.dataset.act]?.hover?.(null); });
}
