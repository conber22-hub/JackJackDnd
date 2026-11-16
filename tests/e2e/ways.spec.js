import { test, expect } from './helpers.js';

// 🚪 The ways between places (game/ways.js, engine/ways.js, ui/passage.js): the Wanderer walks out of the Village of
// Barovia by its west way, the fog closes and clears on the road with its name, walks back off the road's start and is
// home again beside that way; then into a house by its front door, and out again onto the doorstep.
const st = page => page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), f = D.get().floors[h.floor];
  return { tpl:D.get().meta.template, name:D.get().meta.name, floor:h.floor, x:h.x, y:h.y, ways:f.ways || [], up:f.up, W:f.W }; });

test('walking out of a place onto the road, back again, and in and out of a house', async ({ page }) => {
  test.setTimeout(300_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-ways'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-ways"]').click();
  await page.keyboard.press('Escape');

  // the village's ways out: one for each road (the gates and the crossroads), each with a signpost to read
  let s = await st(page);
  expect(s.ways.map(w => w.to).sort()).toEqual(['crossroads', 'gates']);
  const west = s.ways.find(w => w.to === 'crossroads');
  expect(west.x).toBeLessThan(10);
  expect(await page.evaluate(() => window.DreadDelve.get().floors[0].props.filter(p => p.k === 'signpost' && p.way).length)).toBe(2);

  // walk (tap the way out) until the road takes over: its name slides in
  // (the villagers sent indoors: one walking up would start a talk instead of a step)
  const shoo = () => page.evaluate(() => { document.querySelectorAll('#cardLayer .pop').forEach(c => c.remove()); for (const p of window.DreadDelve.get().floors[0].folk || []) p.gone = true; window.DreadDelve.wander.rt.talk = null; });
  await expect.poll(async () => { const q = await st(page); if (q.tpl === 'journey') return true; await shoo();
    // (checked and tapped in one go: a tap meant for the village mustn't land on the road)
    await page.evaluate(w => { const D = window.DreadDelve; if (D.get().meta.template !== 'journey' && !D.busy()) D.wander.walkTo(w.x, w.y); }, west); return false; }, { timeout:60_000, intervals:[2500] }).toBe(true);
  await expect(page.locator('#wdBanner')).toContainText('Old Svalich Road');
  s = await st(page);
  expect(s.name).toBe('The road to The Gallows Crossroads');
  expect(s.up.x).toBeGreaterThan(s.W / 2);   // (the road comes in from the east: they left the village westward)
  expect([s.x, s.y]).toEqual([s.up.x, s.up.y]);

  // the keys back off the road's start: home again, beside the way they left by
  await expect.poll(async () => { const q = await st(page); if (q.tpl !== 'journey') return true; await page.keyboard.press('d'); return false; }, { timeout:30_000, intervals:[300] }).toBe(true);
  await expect(page.locator('#wdBanner')).toContainText('Village of Barovia');
  s = await st(page);
  expect(Math.max(Math.abs(s.x - west.x), Math.abs(s.y - west.y))).toBeLessThanOrEqual(4);
  expect(await page.evaluate(() => window.DreadDelve.get().campaign.valley.journey)).toBeNull();

  // a house: to its doorstep, then walk into the door
  const door = await page.evaluate(() => { const D = window.DreadDelve, f = D.get().floors[0], h = D.wander.hero();
    const out = { n:[0, -1], s:[0, 1], e:[1, 0], w:[-1, 0] };
    return f.buildings.map((b, i) => { const o = out[b.door || 's'], along = o[0] ? b.h : b.w, k = Math.floor(along / 2) - (along % 2 ? 0 : 1);
      const cell = o[0] ? { x:o[0] > 0 ? b.x + b.w - 1 : b.x, y:b.y + k } : { x:b.x + k, y:o[1] > 0 ? b.y + b.h - 1 : b.y };
      return { i, decay:b.decay, step:{ x:cell.x + o[0], y:cell.y + o[1] }, out:o }; })
      .filter(o => (!o.decay || o.decay === 'lived') && f.grid[o.step.y * f.W + o.step.x] > 0)
      .sort((a, b) => Math.hypot(a.step.x - h.x, a.step.y - h.y) - Math.hypot(b.step.x - h.x, b.step.y - h.y))[0]; });
  await expect.poll(async () => { const q = await st(page); if (q.x === door.step.x && q.y === door.step.y) return true;
    if (await page.evaluate(() => !window.DreadDelve.busy())) await page.evaluate(d => window.DreadDelve.wander.walkTo(d.step.x, d.step.y), door); return false; }, { timeout:60_000, intervals:[2500] }).toBe(true);
  const into = { '0,-1':'s', '0,1':'w', '1,0':'a', '-1,0':'d' }[`${door.out[0]},${door.out[1]}`];
  await expect.poll(async () => { if ((await st(page)).tpl === 'interior') return true; await page.keyboard.press(into); return false; }, { timeout:15_000, intervals:[600] }).toBe(true);
  await expect(page.locator('#wdPrompt')).toContainText('Go outside');
  // and out: a step out of the doorway, back on the doorstep
  await expect.poll(async () => { if ((await st(page)).tpl !== 'interior') return true; await page.keyboard.press('s'); return false; }, { timeout:15_000, intervals:[600] }).toBe(true);
  s = await st(page);
  expect([s.x, s.y]).toEqual([door.step.x, door.step.y]);
  expect(errs).toEqual([]);
});
