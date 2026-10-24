import { test, expect, arena } from './helpers.js';

// Issue #8 (found by Cursor): Set on the Gaze tab redraws the tab itself, not only the top bar.
test('Set on the Gaze tab moves its heading and highlight straight away', async ({ page }) => {
  await arena(page);
  if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
  await page.locator('[data-act="tab"][data-k="gaze"]').click();
  await page.locator('[data-act="setDread"][data-k="6"]').click();
  await expect(page.locator('#dreadNum')).toHaveText('6');
  await expect(page.locator('#tabBody .card.sel')).toContainText('6');
  await expect(page.locator('#tabBody .card.sel [data-act="setDread"]')).toHaveAttribute('data-k', '6');
});
