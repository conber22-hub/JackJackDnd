/* 🎲 THE DICE MOMENT — every attack's d20, seen: it tumbles for a breath at the top of the screen and lands, the
   die it beat (or lost to) beside it with advantage or disadvantage, then the sum — 14 +5 = 19 vs AC 13 — and the
   word: HIT, MISS, a gold CRITICAL on a 20 (rays bursting from it), a cracked FUMBLE on a 1. A blow struck at the
   party reads in red when it lands, so a hit on you never looks like good news.
   It comes from the roll itself (game/combat.js doAttack: the card's die, also on the 'acted' event): on this
   screen from the event, on a player's phone from the card the DM's app sends (net/table.js). The TV has its own,
   bigger one (ui/screen.js). Several blows close together queue, quicker, rather than land on top of each other. */
import { bus, esc, signed } from '../util/core.js';
import { ui } from '../engine/state.js';
import { sfx } from '../audio/sound.js';

const D20 = '<svg viewBox="0 0 100 100"><polygon points="50,4 93,28 93,72 50,96 7,72 7,28" /><polygon class="in" points="50,22 76,66 24,66" /><path class="ln" d="M50,4 L50,22 M93,28 L76,66 M7,28 L24,66 M93,72 L76,66 M7,72 L24,66 M50,96 L50,66 M50,22 L24,66 M50,22 L76,66" /></svg>';
const TUMBLE = 320, HOLD = 1150, QUICK = 650, FADE = 260;
const queue = []; let busy = false, el = null;
const seen = [];   // (for the tests: what the last few said)

function box(){
  if (el?.isConnected) return el;
  el = document.createElement('div'); el.id = 'diceMo'; el.className = 'dm hidden'; el.setAttribute('aria-live', 'polite');
  document.body.appendChild(el); return el;
}
// The words for a roll: { who, verdict, tone, sum }
export function diceWords(d, names = {}){
  const n = d.n, twenty = n === 20, one = n === 1;
  const verdict = d.crit ? 'CRITICAL' : one ? 'FUMBLE' : d.hit ? 'HIT' : 'MISS';
  // the party's blows read gold and green; a blow at the party reads red when it lands
  const atUs = d.by === 'monster' && d.at !== 'monster';
  const tone = d.crit ? (atUs ? 'crit-bad' : 'crit') : one ? 'fumble' : d.hit ? (atUs ? 'hurt' : 'hit') : 'miss';
  const sum = `${n} ${signed(d.bonus ?? 0)} = ${d.tot ?? n}${d.ac != null ? ` vs AC ${d.ac}` : ''}`;
  return { verdict, tone, sum, twenty, one, who:names.a && names.t ? `${names.a} → ${names.t}` : '' };
}
function play({ d, names }){
  busy = true;
  const b = box(), w = diceWords(d, names), quick = queue.length > 0;
  const other = d.other != null ? `<div class="dm-d other ${d.mode}" title="${d.mode === 'adv' ? 'advantage: the lower set aside' : 'disadvantage: the higher set aside'}">${D20}<b>${d.other}</b></div>` : '';
  b.innerHTML = `${w.who ? `<div class="dm-who">${esc(w.who)}${d.real ? ' <i>🎲 at the table</i>' : ''}</div>` : ''}
    <div class="dm-row"><div class="dm-d main">${D20}<b>·</b>${d.crit && w.twenty ? '<span class="rays"></span>' : ''}</div>${other}</div>
    <div class="dm-sum">${esc(w.sum)}${d.mode ? ` <i>${d.mode === 'adv' ? '⇈ advantage' : '⇊ disadvantage'}</i>` : ''}</div>
    <div class="dm-verdict">${w.verdict}${d.rays > 1 ? ` <small>· ${d.hits} of ${d.rays} ${d.hits === 1 ? 'hits' : 'hit'}</small>` : ''}</div>`;
  b.className = `dm ${w.tone} roll${w.twenty ? ' n20' : w.one ? ' n1' : ''}`;
  const face = b.querySelector('.main b'), flick = setInterval(() => { face.textContent = 1 + Math.floor(Math.random() * 20); }, 55);
  sfx('roll', false);
  seen.push(`${w.sum} ${w.verdict}`); if (seen.length > 8) seen.shift();
  setTimeout(() => {
    clearInterval(flick); face.textContent = d.n; b.classList.remove('roll'); b.classList.add('land');
    setTimeout(() => { b.classList.add('out');
      setTimeout(() => { b.className = 'dm hidden'; busy = false; if (queue.length) play(queue.shift()); }, FADE); }, quick || queue.length ? QUICK : HOLD);
  }, TUMBLE);
}
// Show a roll: d (the card's die), names: { a, t } (who struck whom)
export function diceMoment(d, names = {}){
  if (!d?.n || ui.screen) return;   // (the TV has its own)
  queue.push({ d, names }); while (queue.length > 3) queue.shift();   // (a crowd of blows: the latest few)
  if (!busy) play(queue.shift());
}
export const diceSeen = () => seen.slice();
// a roll on screen, or waiting its turn (ui/turnbanner.js holds the turn's banner until it's gone)
export const diceBusy = () => busy || queue.length > 0;

let wired = false;
export function wireDice(){
  if (wired) return; wired = true;
  bus.on('acted', e => { if (e?.die && e.actor && e.target) diceMoment(e.die, { a:e.actor.name, t:e.target.name }); });
}
