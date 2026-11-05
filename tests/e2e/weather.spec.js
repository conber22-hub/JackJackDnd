import { test, expect } from './helpers.js';

// ChatGPT's valley weather (engine/weather.js, game/weather.js): it runs with the valley's clock, shows on the
// Dark Lord desk with the next three days, gives way to the DM's own words, and comes back on the next day.
test('the valley\'s weather runs with its clock, and the DM\'s own words stand until the next day', async ({ page }) => {
  const wx = () => page.evaluate(() => { const C = window.DreadDelve.get().campaign; return { line:C.weather, wx:C.wx, hand:!!C.weatherHand, day:C.valley?.day }; });
  await page.evaluate(() => {
    const D = window.DreadDelve; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Weather', seed:'weather-e2e', floors:1, size:24, template:'blank', party:false }, false);
    D.valley(); D.setHour('+1');                         // the valley's clock moves: its weather goes on the desk
    if (!D.ui.panelOpen) document.querySelector('#btnPanel')?.click();
  });
  const first = await wx();
  expect(first.wx?.kind).toBeTruthy();
  expect(first.line.length).toBeGreaterThan(10);
  await page.locator('[data-act="tab"][data-k="story"]').click();
  await expect(page.locator('#tabBody')).toContainText('Next three days:');
  await expect(page.locator('#tabBody')).toContainText(first.wx.desc.slice(0, 12));
  // the DM writes their own
  const box = page.locator('#tabBody input[data-f="weather"]');
  await box.fill('Red rain, warm as blood.'); await box.dispatchEvent('change');
  await expect.poll(async () => (await wx()).hand).toBe(true);
  expect((await wx()).wx).toBeNull();
  await expect(page.locator('#tabBody [data-act="valleyWeather"]')).toBeVisible();
  // an hour on: still theirs; the next day: the valley's again
  await page.evaluate(() => window.DreadDelve.setHour('+1'));
  expect((await wx()).line).toBe('Red rain, warm as blood.');
  await page.evaluate(() => { const V = window.DreadDelve.get().campaign.valley; window.DreadDelve.setHour(String((V.hour + 23) % 24)); });   // 23 hours on: past midnight
  await expect.poll(async () => (await wx()).hand).toBe(false);
  const next = await wx();
  expect(next.day).toBe(first.day + 1);
  expect(next.line).not.toBe('Red rain, warm as blood.');
  expect(next.wx?.kind).toBeTruthy();
});
