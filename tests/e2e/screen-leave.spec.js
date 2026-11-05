import { test, expect } from './helpers.js';

// The table screen (?screen) is for the TV, so it has no controls, but it never traps anyone: its buttons show on
// a tap, and ✕ Leave goes back to the app (or closes the window the DM's page opened).
test('the table screen shows its buttons on a tap, and ✕ Leave goes back to the app', async ({ page }) => {
  await page.goto('/dread-delve.html?screen');
  await page.waitForFunction(() => !!window.DreadDelve && document.body.classList.contains('screen'));
  const btns = page.locator('.sc-btns');
  await expect(btns).toHaveClass(/show/);                       // shown at first…
  await expect(btns.locator('.sc-hint')).toContainText('table screen');
  await page.mouse.click(400, 300);                            // …and again on a tap
  await expect(btns).toHaveClass(/show/);
  await btns.locator('[data-act="scLeave"]').click();
  await page.waitForURL(u => !u.search.includes('screen'));
  await expect(page.locator('#startModal')).toBeVisible();     // the start screen, with Continue
});
