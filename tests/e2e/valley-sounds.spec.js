import { test, expect } from './helpers.js';

// 🐈🎼 The valley's animals and its music, wired in (ui/wander.js, ui/regionmusic.js): a Wanderer comes to the Village of
// Barovia and its animals are there without anyone asking (Muse's render/critters.js); the loop wanted is the village's
// by day and its night tune after dark (ChatGPT's engine/region-music.js); on the road it's the road's, with the road's
// animals; and putting the Wanderer away takes the animals with it.
test('the village has its animals and its tune, the road its own, and they go when the Wanderer is put away', async ({ page }) => {
  test.setTimeout(240_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-sounds'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-sounds"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');

  // the animals: put down on their own, and the same ones each time the map is drawn
  await expect.poll(() => page.evaluate(() => window.DreadDelve.critters.list().length)).toBeGreaterThanOrEqual(5);
  const kinds = await page.evaluate(() => [...new Set(window.DreadDelve.critters.list().map(a => a.kind))]);
  expect(kinds).toContain('crow');

  // the tune: the village's by day, its night one after dark
  const loop = () => page.evaluate(() => window.DreadDelve.loopFor(window.DreadDelve.wander.hero()));
  expect(await loop()).toBe('village');
  await page.evaluate(() => { window.DreadDelve.get().campaign.valley.hour = 22; });
  expect(await loop()).toBe('villageNight');
  await page.evaluate(() => { window.DreadDelve.get().campaign.valley.hour = 10; });

  // on the road: the road's tune, and the road's animals
  await page.evaluate(() => window.DreadDelve.wander.travelTo('crossroads'));
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().meta.template), { timeout:30_000 }).toBe('journey');
  await page.keyboard.press('Escape');
  await expect.poll(loop).toMatch(/^(road|roadNight|mists)$/);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.critters.list().every(a => a.kind !== 'cat'))).toBe(true);

  // put away: no animals left
  await page.evaluate(() => window.DreadDelve.wander.leaveWander());
  await expect.poll(() => page.evaluate(() => window.DreadDelve.critters.list().length)).toBe(0);
  expect(errs).toEqual([]);
});
