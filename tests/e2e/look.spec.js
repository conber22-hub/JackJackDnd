// The 🎨 Look panel and 📸 photo mode (brief-6). The panel changes gfx and a
// preset survives a reload; photo mode hides the panels and shows them again;
// capture saves a PNG of the 3D view. One honesty note: until the renderer's
// capture({ scale }) hook lands, capture reads the canvas right after a
// requestAnimationFrame, which may come out blank on some devices — the size
// assertion below is what proves a real frame came out in this sandbox, not a
// cleared buffer. The TV branch is not spec'd here; the brief's list is the
// three proofs below.
import { test, expect, startDM, arena } from './helpers.js';
import fs from 'node:fs';

const gfxQuality = page => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('dreaddelve.gfx.v1') || '{}').quality; } catch { return undefined; } });

async function openPanel(page){
  await page.locator('#btnLook').click();
  await expect(page.locator('#lookPanel:not(.hidden)')).toBeVisible();
}

async function reloadAndContinue(page){
  await page.reload();
  await page.waitForFunction(() => !!window.DreadDelve);
  const door = page.locator('[data-act="thRole"][data-k="dm"]');
  if (await door.isVisible()) await door.click();
  await page.locator('#continueBox [data-act="continue"]').click();
  await expect(page.locator('#startModal')).toBeHidden();
}

test('the panel opens and a preset changes gfx, and it survives a reload', async ({ page }) => {
  test.setTimeout(240_000);
  await startDM(page);
  await openPanel(page);
  // A real change, not a no-op on the default: high first, then the Phone preset.
  await page.locator('[data-look-q="high"]').click();
  await expect.poll(() => gfxQuality(page)).toBe('high');
  await page.locator('[data-look-preset="phone"]').click();
  await expect.poll(() => gfxQuality(page)).toBe('low');
  await expect(page.locator('[data-look-q="low"]')).toHaveClass(/on/);
  await reloadAndContinue(page);
  expect(await gfxQuality(page)).toBe('low');   // gfx lives in localStorage, per device
});

test('photo mode hides the panels and shows them again', async ({ page }) => {
  test.setTimeout(240_000);
  await startDM(page);
  await openPanel(page);
  await page.locator('[data-act="lookPhoto"]').click();
  await expect(page.locator('body.photo')).toHaveCount(1);
  await expect(page.locator('#topbar')).toBeHidden();
  await expect(page.locator('#panel')).toBeHidden();
  await expect(page.locator('#photoBar')).toBeVisible();
  await page.locator('[data-act="photoExit"]').click();
  await expect(page.locator('body.photo')).toHaveCount(0);
  await expect(page.locator('#topbar')).toBeVisible();
  await expect(page.locator('#photoBar')).toBeHidden();
});

test('capture produces a PNG of a sensible size', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await openPanel(page);
  await page.locator('[data-act="lookPhoto"]').click();
  await expect(page.locator('body.photo')).toHaveCount(1);
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-act="photoShot"]').click(),
  ]);
  expect(dl.suggestedFilename()).toMatch(/\.png$/);
  const path = await dl.path();
  const buf = fs.readFileSync(path);
  expect(buf.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));   // the PNG signature
  expect(buf.length).toBeGreaterThan(4096);   // a real frame, not a cleared buffer
});
