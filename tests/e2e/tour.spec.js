import { test, expect, preparePage, arena } from './helpers.js';

test('the DM\'s "Show me around" opens a tour, and taps work once it is dismissed', async ({ page }) => {
  await arena(page);
  await page.locator('#btnHelp').click();
  await expect(page.locator('#helpModal')).not.toHaveClass(/hidden/);
  await expect(page.locator('#btnTour')).toBeVisible();
  await page.locator('#btnTour').click();
  const pop = page.locator('.driver-popover');
  await expect(pop).toBeVisible();
  await expect(pop.locator('.driver-popover-title')).toHaveText('Night');
  await pop.locator('.driver-popover-close-btn').click();
  await expect(pop).toHaveCount(0);
  // The overlay is gone and taps land again: switching tabs works.
  await page.locator('[data-act="tab"][data-k="table"]').click();
  await expect(page.locator('[data-act="tab"][data-k="table"]')).toHaveClass(/on/);
});

test('the player tour shows once, not again after a reload, and taps work after it is dismissed', async ({ page:dm, browser, baseURL }) => {
  await arena(dm);
  await dm.locator('[data-act="tab"][data-k="table"]').click();
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  // A separate context models a separate device, including cookies and localStorage.
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 } });
  try {
    const player = await context.newPage();
    const errors = await preparePage(player);
    await player.locator('[data-act="thRole"][data-k="player"]').click();
    await player.locator('#pName').fill('Ada');
    await player.locator('#pWord').fill('e2e-secret');
    await player.locator('#joinCode').fill(code);
    await player.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect(player.locator('#startModal')).toBeHidden();
    // Seating starts the walkthrough on its own, on the phone-sized screen.
    const pop = player.locator('.driver-popover');
    await expect(pop).toBeVisible({ timeout:20000 });
    await expect(pop.locator('.driver-popover-title')).toHaveText('Your hero');
    // Dismiss it, and a tap still lands: Card only toggles on.
    await pop.locator('.driver-popover-close-btn').click();
    await expect(pop).toHaveCount(0);
    await player.locator('[data-act="cardOnly"]').click();
    await expect.poll(() => player.evaluate(() => document.body.classList.contains('cardonly'))).toBe(true);
    // Reload and rejoin: the player comes back seated, and the tour stays away.
    await player.reload();
    await player.waitForFunction(() => !!window.DreadDelve);
    await player.locator('[data-act="thRole"][data-k="player"]').click();
    await player.locator('#pName').fill('Ada');
    await player.locator('#pWord').fill('e2e-secret');
    await player.locator('#joinCode').fill(code);
    await player.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect(player.locator('#startModal')).toBeHidden();
    await expect.poll(() => player.evaluate(() => {
      const D = window.DreadDelve;
      return D.net.status === 'open' && !!D.ui.myToken;
    }), { timeout:20000 }).toBe(true);
    await player.waitForTimeout(1500);
    await expect(player.locator('.driver-popover')).toHaveCount(0);
    expect(errors, 'Uncaught player browser errors').toEqual([]);
  } finally {
    await context.close();
  }
});
