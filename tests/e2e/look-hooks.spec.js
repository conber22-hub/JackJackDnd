import { test, expect, arena } from './helpers.js';

// The renderer's side of Muse's 🎨 Look panel: ultra is real (the device's full resolution, torch shadows on), a photo
// is the renderer's own frame, and a handout reaches a player's phone. The TV has its own 🎨.
test('ultra quality, the renderer capture, a handout on a phone, and the TV’s 🎨', async ({ page }) => {
  await arena(page);
  const ultra = await page.evaluate(() => { const D = window.DreadDelve; D.setGfx({ quality:'ultra' }); return { pr:D.renderer.getPixelRatio(), dpr:devicePixelRatio, shadows:D.renderer.shadowMap.enabled }; });
  expect(ultra.pr).toBe(ultra.dpr);
  expect(ultra.shadows).toBe(true);
  const png = await page.evaluate(() => { const D = window.DreadDelve; D.setGfx({ quality:'low' }); return D.capture({ scale:1 }); });
  expect(png.startsWith('data:image/png')).toBe(true);
  expect(png.length).toBeGreaterThan(4000);                     // a real frame, not a cleared buffer
  await page.evaluate(img => window.DreadDelve.showHandoutHere({ t:'handout', title:'The chapel at dusk', img }), png);
  await expect(page.locator('#handoutView')).toBeVisible();
  await expect(page.locator('#handoutView')).toContainText('The chapel at dusk');
  await page.locator('#handoutView').click();
  await expect(page.locator('#handoutView')).toBeHidden();
  // the TV: 🎨 in its corner opens the Look panel
  await page.goto('/dread-delve.html?screen');
  await page.waitForFunction(() => !!window.DreadDelve && document.body.classList.contains('screen'));
  await page.locator('.sc-btns [data-act="scLook"]').click();
  await expect(page.locator('#lookPanel')).toBeVisible();
});
