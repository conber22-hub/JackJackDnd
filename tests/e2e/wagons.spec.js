import { test, expect } from './helpers.js';

// 🛞 A wagon on the road (engine/wagons.js, ChatGPT's): taken when the party sets out, it changes the road's hours;
// its fittings answer trouble; at camp the bunks and the smithy box matter.
test('the party takes a wagon with salt barrels and a spare wheel; the Bloom passes, a breakdown costs an hour, camp mends it', async ({ page }) => {
  test.setTimeout(150_000);
  const r = await page.evaluate(() => {
    const D = window.DreadDelve;
    D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'The Mist Wall', seed:'e2e-wagon', floors:1, size:32, template:'blank', party:true }, false);
    D.valley();
    D.transport().push({ id:'wagon-t', kind:'wagon', n:'The Lantern Cart', capacity:2000, speed:24, hp:40, ac:12, seats:4, bunks:2,
      fittings:['salt-barrels', 'spare-wheel', 'smithy-box'], damage:6 });
    D.setWagon('wagon-t');
    D.travel('gates');
    const V = D.valley();
    return { hours:V.journey?.hours, wagon:V.wagon };
  });
  expect(r.wagon).toBe('wagon-t');
  expect(r.hours).toBeGreaterThan(0);
  await page.locator('[data-act="tab"][data-k="valley"]').click();
  const card = page.locator('.card', { hasText:'The Lantern Cart' }).first();
  await expect(card).toBeVisible();
  // the Bloom: salt barrels keep it away
  await card.locator('[data-act="wagonMeets"][data-k="bloom"]').click();
  expect(await page.evaluate(() => window.DreadDelve.get().log.slice(-3).map(l => l.m).join(' '))).toContain('salt');
  // a breakdown: the spare wheel makes it an hour (and the wagon takes damage)
  const before = await page.evaluate(() => ({ h:window.DreadDelve.valley().journey.hours, d:window.DreadDelve.transport()[0].damage }));
  await page.locator('[data-act="wagonMeets"][data-k="breakdown"]').first().click();
  const after = await page.evaluate(() => ({ h:window.DreadDelve.valley().journey.hours, d:window.DreadDelve.transport()[0].damage }));
  expect(after.h).toBe(before.h + 1);
  expect(after.d).toBeGreaterThan(before.d);
  // camp: the smithy box mends some of it overnight
  await page.evaluate(() => window.DreadDelve.makeCamp(0));
  const mended = await page.evaluate(() => window.DreadDelve.transport()[0].damage);
  expect(mended).toBeLessThan(after.d);
});
