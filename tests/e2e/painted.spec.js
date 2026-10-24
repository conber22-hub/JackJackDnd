import { test, expect, arena, frameMap, selectHero, clickTile, expectPositions } from './helpers.js';

// The painted style runs the oil-paint pass and lays the name plates over it on their own layer: the table still plays.
// The paint pass costs per pixel and CI renders in software, so this one runs in a small window with more time.
test.use({ viewport:{ width:800, height:520 } });
test('the painted style can be switched on, and minis can still be picked by their name plate and moved', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page);
  if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
  await page.locator('[data-act="tab"][data-k="table"]').click();
  const painted = page.locator('[data-act="gfxStyle"][data-k="painted"]');
  await painted.click();
  await expect(page.locator('#tabBody')).toContainText('Needs Medium or High quality.');
  await page.locator('[data-act="gfxQ"][data-k="medium"]').click();
  await expect(painted).toHaveClass(/\bon\b/);
  await expect(page.locator('#tabBody')).not.toContainText('Needs Medium or High quality.');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('dreaddelve.gfx.v1')))).toMatchObject({ quality:'medium', style:'painted' });

  await frameMap(page);
  // tap Ada's name plate, which floats above her mini
  const plate = await page.evaluate(() => {
    const D = window.DreadDelve, ada = D.get().tokens.find(t => t.name === 'Ada');
    const tv = D.tokenViews.get(ada.id), p = tv.label.getWorldPosition(tv.label.position.clone()).project(D.camera);
    return { x:(p.x + 1) * innerWidth / 2, y:(1 - p.y) * innerHeight / 2 };
  });
  await page.mouse.click(plate.x, plate.y);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.tokById(window.DreadDelve.ui.selected)?.name)).toBe('Ada');

  await selectHero(page);
  await clickTile(page, 10, 10);
  await expectPositions(page, { Ada:{ x:10, y:10 } });
});
