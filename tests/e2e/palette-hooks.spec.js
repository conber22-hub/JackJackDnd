import { test, expect, arena } from './helpers.js';

// What Claude registered in Muse's palette: the notebook (Muse's other PR) and exhaustion (Codex's conditions).
test('the palette opens the notebook and adds exhaustion to the selected creature', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page);
  await page.keyboard.press('Control+k');
  await page.locator('#palQ').fill('notebk');
  await page.locator('#palQ').press('Enter');
  await expect(page.locator('#nbDrawer.open')).toBeVisible();
  await page.evaluate(() => { const D = window.DreadDelve; D.select(D.get().tokens.find(t => t.name === 'Ada').id); });
  await page.keyboard.press('Control+k');
  await page.locator('#palQ').fill('exhaustion');
  await page.locator('#palQ').press('Enter');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().tokens.find(t => t.name === 'Ada').exhaustion)).toBe(1);
});
