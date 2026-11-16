import { test, expect } from './helpers.js';

// 🔔 The valley's hours (game/wander.js): resting in the Village of Barovia through the evening, the church bell tolls
// for dusk; resting through the morning, it doesn't.
test('the church bell tolls when the evening comes round in a village', async ({ page }) => {
  test.setTimeout(150_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-bell'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-bell"]').click();
  await page.evaluate(() => document.querySelectorAll('#cardLayer .pop').forEach(c => c.remove()));
  // morning (9) to the afternoon (17): no bell
  await page.evaluate(() => { const w = window.DreadDelve.wander; w.rest(); });
  await page.waitForTimeout(500);
  expect(await page.locator('#toasts').textContent()).not.toContain('church bell');
  // the afternoon to the small hours: the bell
  await page.evaluate(() => window.DreadDelve.wander.rest());
  await expect(page.locator('#toasts')).toContainText('church bell tolls for dusk');
  expect(errs).toEqual([]);
});
