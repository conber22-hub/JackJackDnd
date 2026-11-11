import { test, expect } from './helpers.js';

// 🌿 The Bloom in the woods (game/bloom.js): the DM says how far the Bloom has got into a map's trees; the floor keeps
// it, the players are sent it with the map, and it can be put back.
test('the DM lets the Bloom into the woods, more of it, and clears it again', async ({ page }) => {
  test.setTimeout(120_000);
  await page.evaluate(() => { const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'The Salt Road', seed:'bloom-e2e', floors:3, size:40, template:'saltroad', party:true }, false); D.goFloor(2);   // (its third map: the road through the woods)
    if (!D.ui.panelOpen) document.querySelector('#btnPanel')?.click(); });
  await page.locator('[data-act="tab"][data-k="dungeon"]').click();
  await expect(page.locator('#tabBody')).toContainText('The Bloom in the woods');
  const bloom = () => page.evaluate(() => ({ own:window.DreadDelve.get().floors[2].bloom ?? null, sent:window.DreadDelve.redactForPlayers(window.DreadDelve.get()).floors[2].bloom ?? null }));
  expect(await bloom()).toEqual({ own:null, sent:null });
  await page.locator('#tabBody [data-act="bloomWoods"][data-k="0.3"]').click();
  expect(await bloom()).toEqual({ own:.3, sent:.3 });
  await page.locator('#tabBody [data-act="bloomWoods"][data-k="0.7"]').click();
  expect(await bloom()).toEqual({ own:.7, sent:.7 });
  await expect(page.locator('#tabBody [data-act="bloomWoods"][data-k="0.7"]')).toHaveClass(/primary/);
  expect(await page.evaluate(() => window.DreadDelve.floorViews[2].built.children.length > 5)).toBe(true);   // the woods draw without complaint
  await page.locator('#tabBody [data-act="bloomWoods"][data-k="0"]').click();
  expect(await bloom()).toEqual({ own:null, sent:null });
});
