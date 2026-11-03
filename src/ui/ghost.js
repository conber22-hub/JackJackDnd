/* WICK — the ghost who shows the DM what's next. A small ghost, a child with a candle, drawn in SVG
   below. He floats beside the thing the DM most likely wants to press next, with a one-line bubble.
   He drifts there gently, bobs while he waits, and dims if ignored for a while. He never covers his target:
   on a phone, or for the map itself (whose minis are 3D and have no DOM box), he sits in a corner instead.
   The first step whose `when` holds, that isn't done or dismissed, and whose target is on screen is the
   one he shows. If the target lives in a panel tab that isn't open, he points at that tab first.
   Re-checked on the app's redraws (a MutationObserver on the DOM they produce), never on a timer.
   Dismissals ("Got it") are remembered in localStorage, per step, until the DM turns him back on. */
import { state, ui } from '../engine/state.js';
import { $ } from '../util/core.js';
import { currentTurn } from '../game/rules.js';
import { partySees } from '../game/combat.js';
import { net } from '../net/table.js';
import { outbox } from '../game/outbox.js';
import { queue } from '../game/requests.js';
import { valley } from '../game/overworld.js';
import { route } from '../engine/overland.js';
import { registerCommands } from './palette.js';
import { toast } from './hud.js';

const ON_KEY = 'dreaddelve.wick.v1', OFF_KEY = 'dreaddelve.wick.dismissed.v1';
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v === null ? fb : v; } catch { return fb; } };
let wickOn = load(ON_KEY, 'on') !== 'off';   // on for a new device, off once the DM turns him off
let dismissed = new Set(); try { dismissed = new Set(JSON.parse(load(OFF_KEY, '[]'))); } catch {}
const saveDismissed = () => { try { localStorage.setItem(OFF_KEY, JSON.stringify([...dismissed])); } catch {} };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- the steps. `target` is a selector, or a function returning one (the seat step needs the unseated player).
const startOpen = () => !$('#startModal')?.classList.contains('hidden');
const dmPanelsHidden = () => $('#thDM')?.classList.contains('hidden') && $('#thPlayer')?.classList.contains('hidden');
const hasHero = () => !!state?.tokens?.some(t => t.kind === 'pc' && !t.flags?.gone);
const joined = () => [...net.conns.values()].some(s => !s.screen);
const unseated = () => [...net.conns.entries()].find(([pid, s]) => !s.screen && !state?.seats?.[pid]);
const monsterSeen = () => !!state?.tokens?.some(t => t.kind === 'monster' && !t.dead && !t.flags?.gone && t.floor === ui.floor && partySees(t));
const onRoad = () => { const V = valley(); return state && !!V?.journey; };
export const STEPS = [
  // The start screen (Wick may show over it, and it alone, of the modals).
  { id:'start-door', role:'both', when:() => startOpen() && dmPanelsHidden(), target:'[data-act="thRole"][data-k="dm"]', say:"Take the Count's seat to begin." },
  { id:'start-continue', role:'both', when:() => startOpen() && !$('#thDM')?.classList.contains('hidden') && !!$('#continueBox .th-continue'), target:'#continueBox [data-act="continue"]', say:'Continue where you left off.' },
  { id:'start-s0', role:'both', when:() => startOpen() && !$('#thDM')?.classList.contains('hidden') && !$('#continueBox .th-continue'), target:'#thDM [data-act="beginS0"]', say:'Begin with Session Zero.' },
  // Prep, before the night: tonight's session, read the Hook. (Reading leaves no trace, so only "Got it" moves past it.)
  { id:'prep', role:'dm', when:() => !!state && !state.combat?.active && !net.code && hasHero(), tab:'story', target:'#tabBody .sessbar .chip.on', say:"Tonight's session — read the Hook." },
  // The table: open it, show the code, seat whoever joined. (After prep is dismissed, this is what's next.)
  { id:'host', role:'dm', when:() => !!state && !state.combat?.active && !net.code, tab:'table', target:'[data-act="host"]', say:'Open the table so players can join.' },
  { id:'code', role:'dm', when:() => !!state && !!net.code && !joined(), tab:'table', target:'#tabBody .code', say:'Show the players the code — or the QR below it.' },
  { id:'seat', role:'dm', when:() => !!state && !!net.code && !!unseated(), tab:'table', target:() => { const u = unseated(); return u ? `select[data-edit="seat"][data-k="${u[0]}"]` : null; }, say:'Seat them on a hero.' },
  // Things waiting: the outbox, then a player's request.
  { id:'outbox', role:'dm', when:() => !!state && outbox.length > 0, target:'#outPanel [data-act="outSendAll"]', say:'Something for the table — send it, or edit it first.' },
  { id:'request', role:'dm', when:() => !!state && queue.length > 0, target:'#reqPanel [data-act="reqAns"][data-show="1"]', say:'A request waits — approve it and show the table.' },
  // Fights: start one, run a monster's turn, rest when it's won.
  { id:'fight', role:'dm', when:() => !!state && !state.combat?.active && monsterSeen(), target:'#initBtns [data-act="rollInit"]', say:'Creatures in sight — start a fight.' },
  { id:'monster-turn', role:'dm', when:() => !!state && !!state.combat?.active && !state.combat.won && currentTurn()?.kind === 'monster' && !currentTurn()?.dead, target:'#initBtns [data-act="autoTurn"]', say:'Its turn — run its actions, or Next turn.' },
  { id:'won', role:'dm', when:() => !!state && !!state.combat?.active && !!state.combat.won, tab:'tokens', target:'[data-act="shortRest"]', say:"The fight's won — rest, or check the Gaze tab." },
  // The Valley: on a road, travel on; a road planned, set out.
  { id:'road', role:'dm', when:() => onRoad(), tab:'valley', target:'[data-act="valleyArrive"]', say:'On the road — travel on to the end of it.' },
  { id:'set-out', role:'dm', when:() => { const V = valley(); return !!state && !!V && !V.journey && !!ui.valleySel && ui.valleySel !== V.at && !!route(V.at, ui.valleySel); }, tab:'valley', target:'[data-act="valleyTravel"]', say:'A road is planned — set out.' },
  // Long quiet: nothing else needs doing.
  { id:'quiet', role:'dm', when:() => !!state && !startOpen(), target:'#btnNotebook', say:'Quiet for now — jot it down, or Ctrl+K for anything.' },
  // Players: a smaller set, off in Card only.
  { id:'p-request', role:'player', when:() => ui.role === 'player' && !ui.cardOnly && !!$('#waitPill')?.classList.contains('show') && /With the DM/.test($('#waitPill')?.textContent || ''), target:'#waitPill', say:'Your request is with the DM.' },
  { id:'p-turn', role:'player', when:() => ui.role === 'player' && !ui.cardOnly && !!state?.combat?.active && currentTurn()?.id === ui.myToken, target:'#selCard', say:'Your turn — pick an action on your card.' },
  { id:'p-move', role:'player', when:() => ui.role === 'player' && !ui.cardOnly && ui.selected === ui.myToken && (!state?.combat?.active || currentTurn()?.id === ui.myToken), target:'#stage', say:'The glowing tiles are where you can go.' },
  { id:'p-tap-hero', role:'player', when:() => ui.role === 'player' && !ui.cardOnly && !!ui.myToken && ui.selected !== ui.myToken, target:'#stage', say:'Tap your hero, then a glowing tile.' },
];
const TAB_NAMES = { story:'Story', valley:'Valley', tokens:'Tokens', table:'Table' };

// --- the ghost himself (SVG) and his bubble, injected once
const GHOST = `<svg viewBox="0 0 64 76" aria-hidden="true"><path d="M32 3C20 3 12 13 12 27v35q5-6 10 0t10 0 10 0 10 0V27C52 13 44 3 32 3Z" fill="#e9e9f2" opacity=".92"/><ellipse cx="24" cy="29" rx="3.6" ry="4.6" fill="#20202e"/><ellipse cx="40" cy="29" rx="3.6" ry="4.6" fill="#20202e"/><path d="M28 38q4 3 8 0" stroke="#20202e" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="45" y="46" width="6" height="15" rx="2" fill="#f4ead2"/><path d="M48 36c-3 4-3 7 0 10 3-3 3-6 0-10Z" fill="var(--candle)"/></svg>`;
if (!$('#wickStyle')){
  const st = document.createElement('style'); st.id = 'wickStyle';
  st.textContent = `#wickWrap{position:fixed;z-index:60;display:none;align-items:flex-start;gap:8px;pointer-events:none;transition:left .5s var(--ease),top .5s var(--ease),opacity .8s var(--ease)}#wickWrap svg{width:56px;height:auto;flex:none;filter:drop-shadow(0 2px 8px rgba(0,0,0,.45));animation:wickbob 3.2s ease-in-out infinite;pointer-events:auto;cursor:pointer}#wickWrap.faded{opacity:.35}.wick-bubble{position:relative;background:var(--glass-strong);-webkit-backdrop-filter:var(--blur);backdrop-filter:var(--blur);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--spec),var(--lift);color:var(--ink);font-family:var(--ui);font-size:14px;line-height:1.45;padding:10px 12px;max-width:260px;pointer-events:auto}.wick-bubble .row{display:flex;gap:6px;margin-top:8px}#wickWrap.corner{left:auto !important;top:auto !important;right:12px;bottom:88px;flex-direction:column-reverse;align-items:flex-end}#wickWrap.corner .wick-bubble{max-width:220px}#wickWrap.corner .wick-bubble::after{content:'';position:absolute;right:22px;bottom:-8px;border:8px solid transparent;border-top-color:var(--glass-strong);border-bottom:0}@keyframes wickbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}.wick-flash{animation:wickflash 1s ease 2}@keyframes wickflash{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 0 4px var(--candle)}}@media (prefers-reduced-motion: reduce){#wickWrap{transition:none}#wickWrap svg{animation:none}.wick-flash{animation:none;box-shadow:0 0 0 3px var(--candle)}}`;
  document.head.appendChild(st);
}
let wrap = null, sayEl = null, cur = null, curDisp = null, summonedId = null, fadeTimer = null, started = false, queued = false;
const clearFade = () => { if (fadeTimer) clearTimeout(fadeTimer); fadeTimer = null; wrap?.classList.remove('faded'); };
const scheduleFade = () => { clearFade(); if (reduced()) return; fadeTimer = setTimeout(() => wrap?.classList.add('faded'), 20000); };

// --- where he shows: the quiet rules, then the first matching step
const quiet = () => !!document.querySelector('.driver-popover')   // never during the first-night tour
  || [...document.querySelectorAll('.modal:not(.hidden)')].some(m => m.id !== 'startModal')   // never over an open modal (except the start screen)
  || ui.screen || document.body.classList.contains('screen') || ui.tableView;   // never on the TV screen, or the view cast to it
const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
function resolve(step){
  if (step.tab){
    if (!ui.panelOpen) return { el:$('#btnPanel'), say:'Open the panel.' };
    if (ui.tab !== step.tab){ const b = document.querySelector(`[data-act="tab"][data-k="${step.tab}"]`); return b ? { el:b, say:`Open the ${TAB_NAMES[step.tab]} tab.` } : null; }
  }
  const sel = typeof step.target === 'function' ? step.target(state, ui) : step.target;
  const el = sel ? document.querySelector(sel) : null;
  return el && visible(el) ? { el, say:step.say } : null;
}
const safeWhen = s => { try { return s.when(state, ui); } catch { return false; } };
function pick(){
  for (const s of STEPS){
    if (s.role !== 'both' && s.role !== ui.role) continue;
    if (dismissed.has(s.id) || (s.done && s.done(state, ui))) continue;
    if (!safeWhen(s)) continue;
    const disp = resolve(s);
    if (disp) return { step:s, disp };
  }
  return null;
}
/* Where he floats: beside his target, but never over the DM's other buttons. Try the spots around it (and, for a
   target inside the side panel, just outside the panel at its height) and take the one that covers the least of
   anything tappable, staying on screen. (Claude: he used to sit over the panel's other tabs, and the player's door.) */
function place(el){
  if (matchMedia('(max-width: 760px)').matches || el.id === 'stage'){ wrap.classList.add('corner'); return; }   // a corner, with the bubble and an arrow, rather than over the button
  wrap.classList.remove('corner');
  const r = el.getBoundingClientRect(), w = wrap.offsetWidth, h = wrap.offsetHeight, vw = innerWidth, vh = innerHeight, mid = r.top + r.height / 2 - h / 2;
  const panel = el.closest('#panel, .modal .box, .th-doors');
  const P = panel?.getBoundingClientRect();
  const spots = [
    ...(P && !el.closest('.modal') ? [[P.right + 12, mid]] : []),     // outside the side panel, level with it
    [r.right + 10, mid], [r.left + r.width / 2 - w / 2, r.bottom + 10], [r.left - w - 10, mid], [r.left + r.width / 2 - w / 2, r.top - h - 10],
    ...(P ? [[P.left + P.width / 2 - w / 2, P.bottom + 10]] : []),    // below the whole group (the start screen's doors)
  ];
  const others = [...document.querySelectorAll('button, a[href], input, select, textarea, [data-act], .th-door')]
    .filter(o => o !== el && !el.contains(o) && !o.contains(el) && !wrap.contains(o) && visible(o)).map(o => o.getBoundingClientRect());
  const overlap = (x, y) => others.reduce((a, o) => a + Math.max(0, Math.min(x + w, o.right) - Math.max(x, o.left)) * Math.max(0, Math.min(y + h, o.bottom) - Math.max(y, o.top)), 0);
  let best = null;
  for (const [x0, y0] of spots){
    const x = Math.min(Math.max(x0, 8), Math.max(8, vw - w - 8)), y = Math.min(Math.max(y0, 8), Math.max(8, vh - h - 8));
    const onTarget = Math.max(0, Math.min(x + w, r.right) - Math.max(x, r.left)) * Math.max(0, Math.min(y + h, r.bottom) - Math.max(y, r.top));
    const cost = overlap(x, y) + onTarget * 4 + Math.hypot(x - x0, y - y0) * 2;   // never over his target; little nudging to fit the screen
    if (!best || cost < best.cost) best = { x, y, cost };
  }
  wrap.style.left = best.x + 'px'; wrap.style.top = best.y + 'px';
}
function show(step, disp){
  wrap.dataset.step = step.id; sayEl.textContent = disp.say;
  wrap.style.display = 'flex'; place(disp.el);
  if (cur?.id !== step.id) scheduleFade();   // a new step restarts the "ignored for a while" clock
  cur = step; curDisp = disp;
}
function hide(){ wrap.style.display = 'none'; delete wrap.dataset.step; cur = null; curDisp = null; clearFade(); }
function refresh(){
  if (quiet()){ hide(); return; }
  if (!wickOn){
    if (!summonedId){ hide(); return; }
    const s = STEPS.find(x => x.id === summonedId);
    if (!s || dismissed.has(s.id) || (s.done && s.done(state, ui)) || !safeWhen(s)){ summonedId = null; hide(); return; }
    const disp = resolve(s);
    if (!disp){ summonedId = null; hide(); return; }
    show(s, disp); return;
  }
  const found = pick();
  if (found) show(found.step, found.disp); else hide();
}
const scheduleRefresh = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; refresh(); }, 150); };
// "Show me" flashes the target: open the panel and the tab first, if that's where it lives.
async function showMe(){
  if (!cur) return;
  if (!ui.panelOpen) $('#btnPanel')?.click();
  if (cur.tab && ui.tab !== cur.tab) document.querySelector(`[data-act="tab"][data-k="${cur.tab}"]`)?.click();
  await new Promise(r => setTimeout(r, 60));   // the renders are synchronous; the sheet on a phone is not
  const sel = typeof cur.target === 'function' ? cur.target(state, ui) : cur.target;
  const el = sel ? document.querySelector(sel) : null;
  if (el){ el.scrollIntoView({ block:'nearest', behavior: reduced() ? 'auto' : 'smooth' }); el.classList.add('wick-flash'); setTimeout(() => el.classList.remove('wick-flash'), 2100); }
  scheduleFade(); refresh();
}
// Ctrl+K "what next" brings him back for one step even when he's off.
function summonWick(){
  const found = pick();
  if (!found){ toast('Nothing needs doing right now.'); return; }
  summonedId = found.step.id; scheduleRefresh();
}
registerCommands([{ id:'wickNext', n:'What next?', hint:'Wick points at the next thing', icon:'🕯', role:'both', run:summonWick }]);

// The hook: where he's started. Idempotent: the help wiring runs at boot, and the modal opens more than once.
// Also builds the wrap and watches the app's redraws (the observer fires on the DOM renderAll and the panel renders produce).
export function ensureGhost(){
  if (!wrap){
    wrap = document.createElement('div'); wrap.id = 'wickWrap'; wrap.innerHTML = `${GHOST}<div class="wick-bubble"><span></span><div class="row"><button class="btn small primary">Got it</button><button class="btn small">Show me</button></div></div>`;
    sayEl = wrap.querySelector('.wick-bubble span');
    wrap.querySelector('svg').onclick = () => { if (cur) showMe(); };
    wrap.querySelector('svg').onmouseenter = scheduleFade;   // noticed, not ignored: restart the fade clock
    const [got, show] = wrap.querySelectorAll('.wick-bubble button');
    got.onclick = () => { if (!cur) return; dismissed.add(cur.id); saveDismissed(); summonedId = null; refresh(); };
    show.onclick = showMe;
    document.body.appendChild(wrap);
  }
  const box = $('#helpModal .box');
  if (box && !$('#btnWick')){
    const b = document.createElement('button'); b.id = 'btnWick'; b.className = 'btn small' + (wickOn ? ' on' : ''); b.textContent = '🕯 Wick';
    b.onclick = () => { wickOn = !wickOn; summonedId = null; try { localStorage.setItem(ON_KEY, wickOn ? 'on' : 'off'); } catch {} b.classList.toggle('on', wickOn); refresh(); };
    const tour = $('#btnTour'); if (tour) tour.after(b); else { const h1 = box.querySelector('h1'); if (h1) h1.after(b); else box.appendChild(b); }
  }
  if (started) return; started = true;
  new MutationObserver(muts => {
    if (muts.some(m => m.target.nodeType === 1 && !m.target.closest('#wickWrap') && !m.target.closest('#toasts'))) scheduleRefresh();
  }).observe(document.body, { childList:true, attributes:true, subtree:true, attributeFilter:['class'] });
  addEventListener('resize', scheduleRefresh);
  refresh();
}
