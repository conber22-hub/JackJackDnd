import { test, expect, arena } from './helpers.js';

// ⚡ Hero starters (ChatGPT's engine/hero-starters.js) in the creator: a ready-made hero, still editable, the name kept.
test('a new hero can start from a ready-made starter and is still the player\'s to change', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page);
  if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  await page.locator('[data-act="dmNewChar"]').first().click();
  const box = page.locator('#charBox');
  await expect(box.locator('[data-cr="starter"]')).toHaveCount(6);
  await box.locator('input[data-cf="name"]').fill('Vesna');
  await box.locator('input[data-cf="name"]').dispatchEvent('change');
  await box.locator('[data-cr="starter"]', { hasText:'The Road Warden' }).click();
  await expect(box.locator('select[data-cf="cls"]')).toHaveValue('Fighter');
  await expect(box.locator('input[data-cf="name"]')).toHaveValue('Vesna');
  await expect(box.locator('[data-cr="starter"].on')).toHaveCount(1);
  await box.locator('select[data-cf="lvl"]').selectOption('3');           // still theirs to change
  await box.locator('[data-cr="save"]').click();
  await expect.poll(() => page.evaluate(() => Object.values(window.DreadDelve.get().characters).find(c => c.name === 'Vesna')?.cls)).toBe('Fighter');
  expect(await page.evaluate(() => Object.values(window.DreadDelve.get().characters).find(c => c.name === 'Vesna').lvl)).toBe(3);
  // an existing hero's sheet doesn't offer the starters
  expect(await page.evaluate(() => { const D = window.DreadDelve; return !!document.querySelector('#charBox [data-cr="starter"]'); })).toBe(false);
});
