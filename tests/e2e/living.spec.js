import { test, expect } from './helpers.js';

// 🌨 The Living Valley (render/living.js): Hunger Moss creeps out of the treeline where the Bloom is loose, and grows
// out when the DM turns it up; snow blows on the wind in a blizzard and stops when it clears; the lake's water is the
// living blackwater, and it compiles.
test('the Hunger Moss creeps with the Bloom, the snow falls and stops, the blackwater ripples', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = []; page.on('console', m => { if (m.type() === 'error' && /shader|webglprogram|glsl/i.test(m.text())) errors.push(m.text().slice(0, 200)); });
  await page.evaluate(() => { const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'The Old Salt Road', seed:'living-e2e', floors:3, size:40, template:'saltroad', party:true }, false);
    D.handWeather('Grey and still.'); D.goFloor(2); });
  const info = () => page.evaluate(() => window.DreadDelve.livingInfo(window.DreadDelve.floorViews[2]));
  expect((await info()).moss).toBeNull();   // no Bloom, no moss
  await page.evaluate(() => window.DreadDelve.setBloom(.3));
  const some = (await info()).moss;
  expect(some.cells).toBeGreaterThan(0);
  await page.evaluate(() => window.DreadDelve.setBloom(.9));
  const more = (await info()).moss;
  expect(more.cells).toBeGreaterThan(some.cells);
  expect(more.shown).toBeLessThan(more.cells);   // it grows out from where it had got to…
  await expect.poll(async () => (await info()).moss.shown, { timeout:20_000 }).toBe(more.cells);   // …over a few seconds
  await page.evaluate(() => window.DreadDelve.setBloom(0));
  expect((await info()).moss).toBeNull();
  // a blizzard: snow on the wind, and none once it clears
  await page.evaluate(() => window.DreadDelve.handWeather('A blizzard: heavy snow on a howling wind.'));
  await expect.poll(async () => (await info()).snow, { timeout:10_000 }).toBeGreaterThan(0);
  await page.evaluate(() => window.DreadDelve.handWeather('Grey and still.'));
  await expect.poll(async () => (await info()).snow, { timeout:10_000 }).toBe(0);
  // the lake: its water is the living blackwater, out in the wind
  const lake = await page.evaluate(async () => { const D = window.DreadDelve;
    D.newDelve({ name:'Lake Zarovich', seed:'living-e2e', floors:1, size:40, template:'lakeshore', party:true }, false);
    await new Promise(r => setTimeout(r, 1500));
    const m = D.floorViews[0].built.children.find(o => o.userData.blackwater);
    return m && { count:m.count, still:m.material.userData.bwStill?.value }; });
  expect(lake.count).toBeGreaterThan(20);
  expect(lake.still).toBe(0);
  expect(errors).toEqual([]);
});
