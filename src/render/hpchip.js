/* 💔 THE BAR THAT DRAINS — a name plate's health bar (render/scene.js makeLabel) doesn't just jump to its new length: the
   part a blow took stays, flashes white, holds a moment and then drains away to the new fill, the way a fighting game's
   bar does, so how much a blow took reads at a glance; a heal climbs up to its new length towards a pale ghost of where
   it's going. render/minis.js starts one when a plate is rebuilt with fewer (or more) hit points; every frame from
   main.js. */
import { drawHpBar } from './scene.js';

const chips = new Map();   // the plate (a sprite) -> { from, to, t0 }
const HOLD = 380, DRAIN = 520, CLIMB = 450;
const ease = k => k * k * (3 - 2 * k);

export function chipBar(sprite, from, to){
  const bar = sprite?.userData?.bar; if (!bar || Math.abs(from - to) < .001) return;
  for (const sp of chips.keys()) if (!sp.parent) chips.delete(sp);   // (a plate since rebuilt: its chip goes with it)
  chips.set(sprite, { from, to, t0:performance.now() });
  draw(bar, chips.get(sprite), 0);
}
function draw(bar, c, ms){
  if (c.to < c.from){   // a blow: the lost part white for an instant, then pale gold, then draining
    const chip = ms < HOLD ? c.from : c.from + (c.to - c.from) * ease(Math.min(1, (ms - HOLD) / DRAIN));
    drawHpBar(bar, c.to, { chip, chipCol:ms < 110 ? '#ffffff' : '#f2cf7e' });
  } else drawHpBar(bar, c.from + (c.to - c.from) * ease(Math.min(1, ms / CLIMB)), { ghost:c.to });
}
export function tickChips(now = performance.now()){
  for (const [sp, c] of chips){
    const ms = now - c.t0;
    if (!sp.parent || ms > (c.to < c.from ? HOLD + DRAIN : CLIMB) + 40){ if (sp.parent) drawHpBar(sp.userData.bar, c.to); chips.delete(sp); continue; }
    draw(sp.userData.bar, c, ms);
  }
}
// (for the tests: the bars draining or climbing now)
export const chipCount = () => chips.size;
