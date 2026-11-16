import { test, expect } from './helpers.js';

// 👣 How walking feels (engine/underfoot.js, render/stepfx.js, ui/wander.js): on a snowy day the hero leaves footprints
// that stay a while, and walking into a wall gives a bump (heard, and a small shake), facing the way they tried.
test('footprints in the snow, and a bump against a wall', async ({ page }) => {
  test.setTimeout(200_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-steps'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-steps"]').click();
  // (the villagers sent indoors: one walking up would start a talk instead of a step)
  const clear = () => page.evaluate(() => { document.querySelectorAll('#cardLayer .pop').forEach(c => c.remove()); for (const f of window.DreadDelve.get().floors) for (const p of f.folk || []) p.gone = true; window.DreadDelve.wander.rt.talk = null; });
  await clear(); await page.evaluate(() => { const s = window.DreadDelve.get(); s.campaign.wx = { ...(s.campaign.wx || {}), ground:'deep snow' }; });
  const x0 = await page.evaluate(() => window.DreadDelve.wander.hero().x);
  // (west, or east if the village happens to wall the west off: the layout is new each game)
  let n = 0;
  await expect.poll(async () => { await clear(); await page.keyboard.press(++n > 30 ? 'd' : 'a'); return Math.abs(await page.evaluate(() => window.DreadDelve.wander.hero().x) - x0); }, { timeout:40_000, intervals:[260] }).toBeGreaterThan(2);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.stepFxCount().prints)).toBeGreaterThanOrEqual(2);
  // into a wall: push north until the hero stops, then once more
  let last = '';
  for (let k = 0; k < 30; k++){ const p = await page.evaluate(() => { const h = window.DreadDelve.wander.hero(); return `${h.x},${h.y}`; }); if (p === last) break; last = p; await page.keyboard.press('w'); await page.waitForTimeout(260); }
  const t0 = await page.evaluate(() => performance.now());
  await page.keyboard.press('w'); await page.waitForTimeout(150);
  const b = await page.evaluate(() => window.DreadDelve.wander.rt.bump);
  expect(b && b.at).toBeGreaterThan(t0 - 400);
  expect([b.dx, b.dy]).toEqual([0, -1]);
  expect(errs).toEqual([]);
});
