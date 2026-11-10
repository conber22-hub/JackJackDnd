import { test, expect } from './helpers.js';

// 🌬 The wind and the ground mist (render/wind.js, render/groundfog.js): the woods sway as hard as the day's weather
// blows, and a fog day lays banks of mist over an outdoor map, which lift when the weather clears.
test('a gale bends the woods, fog lies on the village, and both pass with the weather', async ({ page }) => {
  test.setTimeout(120_000);
  await page.evaluate(() => { const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Barovia', seed:'wind-e2e', floors:1, size:40, template:'barovia', party:true }, false); D.valley(); D.setHour('12'); });
  const look = () => page.evaluate(() => { const D = window.DreadDelve, fv = D.floorViews[0];
    const woods = fv.built.children.find(o => o.userData.trees);
    return { force:D.wind.force.value, sway:!!woods && /sway/.test(woods.material.customProgramCacheKey()), mist:fv.mist ? { on:fv.mist.mesh.visible, k:fv.mist.k, banks:fv.mist.mesh.geometry.index.count / 6 } : null }; });
  expect((await look()).sway).toBe(true);                                // the woods' trees take the wind
  expect((await look()).mist.banks).toBeGreaterThan(5);                  // the banks are there, waiting for a fog day
  await page.evaluate(() => window.DreadDelve.handWeather('A howling gale off the mountains.'));
  await expect.poll(async () => (await look()).force, { timeout:30_000 }).toBeGreaterThan(.8);
  await expect.poll(async () => (await look()).mist.on, { timeout:40_000 }).toBe(false);   // (whatever the valley's own sky was, a gale clears it)
  await page.evaluate(() => window.DreadDelve.handWeather('Thick fog: the world ends at arm\'s length.'));
  await expect.poll(async () => (await look()).mist.on, { timeout:30_000 }).toBe(true);
  await expect.poll(async () => (await look()).mist.k, { timeout:30_000 }).toBeGreaterThan(.6);
  await expect.poll(async () => (await look()).force, { timeout:30_000 }).toBeLessThan(.3);   // fog: the air is still
  await page.evaluate(() => window.DreadDelve.handWeather('Clear and cold.'));
  await expect.poll(async () => (await look()).mist.on, { timeout:40_000 }).toBe(false);
});
