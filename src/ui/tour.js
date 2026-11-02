/* FIRST-NIGHT WALKTHROUGH — a player's first seating, and the DM's help button.
   driver.js does the highlighting; this file only picks the steps, keeps the
   player tour to once per device, and dresses the popover in regal glass. */
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { ui, tokById } from '../engine/state.js';
import { select } from '../game/actions.js';
import { $ } from '../util/core.js';

const TOUR_KEY = 'dreaddelve.tour.v1';

// The popover's look lives here, not in index.html (that file is Claude's).
if (!$('#tourStyle')){
  const st = document.createElement('style');
  st.id = 'tourStyle';
  st.textContent = `
    .driver-popover{background:var(--glass-strong);-webkit-backdrop-filter:var(--blur);backdrop-filter:var(--blur);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--spec),var(--lift);color:var(--ink);font-family:var(--ui);max-width:min(320px,calc(100vw - 32px))}
    .driver-popover-arrow{border-color:var(--glass-strong)}
    .driver-popover-title{font-family:var(--serif);font-size:23px;font-weight:600;color:var(--gold-hi);padding-right:28px}
    .driver-popover-description{font-size:14px;line-height:1.5;color:var(--ink)}
    .driver-popover-close-btn{color:var(--dim)}
    .driver-popover-close-btn:hover,.driver-popover-close-btn:focus-visible{color:var(--ink)}
    .driver-popover-progress-text{color:var(--dim)}
    .driver-popover-footer-btn{background:transparent;border:1px solid var(--line-2);border-radius:10px;color:var(--ink);padding:6px 12px;font-size:13px}
    .driver-popover-footer-btn:hover,.driver-popover-footer-btn:focus{background:var(--glass-3)}
    .driver-popover-footer-btn:last-child{border-color:var(--gold-line);color:var(--gold-hi)}`;
  document.head.appendChild(st);
}

// An element only counts if it is on screen: the panel's tabs and buttons are
// still in the DOM while the panel is shut, just slid out of sight.
const vis = sel => {
  const el = $(sel);
  if (!el || !el.getClientRects().length) return null;
  const r = el.getBoundingClientRect();
  return r.width && r.height ? el : null;
};
const openPanel = () => { if ($('#panel')?.classList.contains('closed')) $('#btnPanel')?.click(); };

function drive(steps){
  const kept = steps.filter(s => !s.element || vis(s.element));
  if (!kept.length) return false;
  driver({ showProgress:true, nextBtnText:'Next', prevBtnText:'Back', doneBtnText:'Done', allowClose:true, steps:kept }).drive();
  return true;
}

// The player tour: your hero, an attack, a target, moving, and the two things
// on the Hero tab worth knowing on night one. Plain voice, a little gothic.
export function startPlayerTour(){
  const me = tokById(ui.myToken);
  if (!me) return false;
  if (ui.selected !== me.id) select(me.id);   // the card only exists once the hero is picked
  openPanel();   // the Hero tab's buttons are in the panel; the card rides above it
  const card = vis('#selCard.show') ? '#selCard.show' : '#panel .card.sel';
  const atk = vis('#selCard.show [data-act="atk"]') ? '#selCard.show [data-act="atk"]' : '.cact[data-act="cardAct"]';
  const move = ui.cardOnly ? '.dpad' : '#stage canvas';
  return drive([
    { element:card, popover:{ title:'Your hero', description:'This is you at the table. Your armour, your health, and everything you can do are on this card.' } },
    { element:atk, popover:{ title:'Strike', description:'Pick an attack or a spell here. The map shades how far it reaches.' } },
    { element:'#stage canvas', popover:{ title:'Then tap a target', description:'Tap the creature you mean to hit. The app adds the bonuses, checks the armour, and rolls the damage.' } },
    { element:move, popover:{ title:ui.cardOnly ? 'Step by step' : 'To move', description:ui.cardOnly ? 'These keys step you one square at a time. North is up, as on the TV.' : 'Tap a glowing tile and your mini walks there. The bright glow is the move you have left.' } },
    { element:'[data-act="cardOnly"]', popover:{ title:'Card only', description:'At the table, with the map on the TV, turn this on: no map on your phone, just your hero, big buttons, and a list of targets.' } },
    { element:'#libQ', popover:{ title:'Look it up', description:'A spell, a magic item, a feat, a feature — look it up here without bothering the DM.' } },
  ]);
}

// Runs once per device, the first time a player is seated on a hero.
export function maybePlayerTour(){
  if (localStorage.getItem(TOUR_KEY)) return;
  if (ui.role !== 'player' || !tokById(ui.myToken)) return;
  localStorage.setItem(TOUR_KEY, '1');
  startPlayerTour();
}

// The DM's tour: the four tabs a first night turns on.
export function startDMTour(){
  openPanel();
  return drive([
    { element:'[data-act="tab"][data-k="night"]', popover:{ title:'Night', description:'The table screen: what the party sees on the TV, the turn timer, and real dice.' } },
    { element:'[data-act="tab"][data-k="table"]', popover:{ title:'Table', description:'Open the table and send the invite. Players join with the code, or by scanning the QR.' } },
    { element:'[data-act="tab"][data-k="bestiary"]', popover:{ title:'Beasts', description:'Every creature in the book, and the ones you roll up yourself. Tap one to place it.' } },
    { element:'[data-act="tab"][data-k="story"]', popover:{ title:'Story', description:'The session at hand: where the road goes, the hook, and the read-aloud.' } },
  ]);
}

// The help modal's button. Idempotent: the modal opens more than once.
export function ensureTourButton(){
  const box = $('#helpModal .box');
  if (!box || $('#btnTour')) return;
  const btn = document.createElement('button');
  btn.id = 'btnTour';
  btn.className = 'btn small primary';
  btn.textContent = '🧭 Show me around';
  btn.onclick = () => {
    // A player with no hero yet has nothing to walk through; leave the help open.
    if (ui.role === 'player' && !tokById(ui.myToken)) return;
    $('#helpModal').classList.add('hidden');
    if (ui.role === 'player') startPlayerTour(); else startDMTour();
  };
  const h1 = box.querySelector('h1');
  if (h1) h1.after(btn); else box.appendChild(btn);
}
