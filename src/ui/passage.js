/* 🌫 A CROSSING ON THE SCREEN — between one map and the next, the fog rolls in from the edges, the new place is built
   behind it, and it clears; the name of where they are slides in at the top, the way the old pocket-console adventures
   named each town and route as you walked into it. Used by the Wanderer (game/ways.js) and by the players' handheld
   at the table when the DM moves the party (ui/tablehh.js).
     · veil(run): fog over (.38 s), run() (the map is built), two frames, fog off (.6 s)
     · uncover(): only the clearing (a player's handheld: the DM has already moved them)
     · banner({ title, sub, line }): the name, the hour and the weather, a line under it; gone after a few seconds */
import { esc } from '../util/core.js';

const COVER = 380, CLEAR = 620;
let wipe = null, ban = null, banTimer = 0, anim = 0;
function els(){
  if (!wipe){ wipe = document.createElement('div'); wipe.id = 'wdWipe'; wipe.className = 'hidden'; document.body.appendChild(wipe); }
  if (!ban){ ban = document.createElement('div'); ban.id = 'wdBanner'; ban.className = 'hidden'; document.body.appendChild(ban); }
}
// the fog's opening: 1 = clear, 0 = closed (a radial mask drawn by CSS from --open)
function tween(from, to, ms, done){
  els(); cancelAnimationFrame(anim);
  const t0 = performance.now();
  wipe.classList.remove('hidden');
  const tick = now => {
    const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    wipe.style.setProperty('--open', String(from + (to - from) * e));
    if (k < 1) anim = requestAnimationFrame(tick);
    else { if (to >= 1) wipe.classList.add('hidden'); done?.(); }
  };
  anim = requestAnimationFrame(tick);
}
export function veil(run){
  if (matchMedia?.('(prefers-reduced-motion: reduce)').matches){ run(); return; }
  tween(1, 0, COVER, () => {
    try { run(); } finally { requestAnimationFrame(() => requestAnimationFrame(() => tween(0, 1, CLEAR))); }
  });
}
export function uncover(){ if (matchMedia?.('(prefers-reduced-motion: reduce)').matches) return; els(); wipe.style.setProperty('--open', '0'); tween(0, 1, CLEAR); }
export function banner({ title = '', sub = '', line = '' } = {}){
  if (!title) return;
  els(); clearTimeout(banTimer);
  ban.innerHTML = `<b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}${line ? `<i>${esc(line)}</i>` : ''}`;
  ban.classList.remove('hidden', 'out'); void ban.offsetWidth; ban.classList.add('in');
  banTimer = setTimeout(() => { ban.classList.remove('in'); ban.classList.add('out'); banTimer = setTimeout(() => ban.classList.add('hidden'), 500); }, line ? 4200 : 2800);
}
export const bannerText = () => ban && !ban.classList.contains('hidden') ? ban.textContent : '';
