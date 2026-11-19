import { test, expect, preparePage } from './helpers.js';

// 🕯 Dread Delve is made in memory of Chance, "Dutcher", the Dutch Oven (data/memorial.js, ui/dedication.js): the game
// opens on a quiet dedication, once each time it's opened, that goes on its own or on a key; the start page carries
// his line at its foot, always.
test('the game opens on the dedication to Chance, once, and the start page remembers him', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const page = await context.newPage();
  const errors = await preparePage(page, { dedication:true });
  try {
    const d = page.locator('#dedication');
    await expect(d).toBeVisible();
    await expect(d).toContainText('In memory of Chance');
    await expect(d).toContainText('Dutcher');
    await expect(d).toContainText('Halo and history');
    // the start page's foot, always
    await expect(page.locator('#startModal .th-memorial')).toContainText('Chance');
    // a key lets it go (after a moment's grace)
    await page.waitForTimeout(900);
    await page.keyboard.press('Space');
    await expect(page.locator('#dedication')).toHaveCount(0, { timeout:5000 });
    // once each time the game is opened: not again on a reload in the same session
    await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
    await page.waitForTimeout(500);
    await expect(page.locator('#dedication')).toHaveCount(0);
    await expect(page.locator('#startModal .th-memorial')).toContainText('Chance');
    // and on its own, after a few seconds (shown again on purpose)
    await page.evaluate(() => window.DreadDelve.dedication.showDedication({ force:true }));
    await expect(page.locator('#dedication')).toBeVisible();
    await expect(page.locator('#dedication')).toHaveCount(0, { timeout:15_000 });
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a phone the dedication fits the screen', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  const page = await context.newPage();
  const errors = await preparePage(page, { dedication:true });
  try {
    await expect(page.locator('#dedication')).toBeVisible();
    const r = await page.evaluate(() => { const b = document.querySelector('#dedication .dd-in').getBoundingClientRect(); return { l:b.left, r:b.right, t:b.top, b:b.bottom, w:innerWidth, h:innerHeight, sw:document.documentElement.scrollWidth }; });
    expect(r.l).toBeGreaterThanOrEqual(0); expect(r.r).toBeLessThanOrEqual(r.w); expect(r.t).toBeGreaterThanOrEqual(0); expect(r.b).toBeLessThanOrEqual(r.h);
    expect(r.sw).toBeLessThanOrEqual(r.w);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});
