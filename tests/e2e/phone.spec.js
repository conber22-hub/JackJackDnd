import { test, expect, preparePage, arena } from './helpers.js';

// Touch swipes on a foldable's two screens: everything that scrolls must scroll, even where a 3D view is.
for (const [label, vp] of [['folded', { width:344, height:882 }], ['unfolded', { width:690, height:829 }]]){
  test(`swiping scrolls on a Z Fold (${label})`, async ({ browser, baseURL }) => {
    test.setTimeout(180000);
    const ctx = await browser.newContext({ baseURL, viewport:vp, isMobile:true, hasTouch:true, deviceScaleFactor:2.6 });
    try {
      const page = await ctx.newPage(); const errors = await preparePage(page), cdp = await ctx.newCDPSession(page);
      const swipe = async (x, y, dist = 300) => {
        const tp = (type, yy) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints:type === 'touchEnd' ? [] : [{ x, y:yy }] });
        await tp('touchStart', y); for (let k = 10; k <= dist; k += 20){ await tp('touchMove', y - k); await page.waitForTimeout(12); } await tp('touchEnd'); await page.waitForTimeout(400);
      };
      const top = sel => page.evaluate(s => document.querySelector(s).scrollTop, sel);
      const scrolls = async (sel, x, y) => { const a = await top(sel); await swipe(x, y); expect(await top(sel), `${sel} scrolls`).toBeGreaterThan(a); };
      await page.locator('[data-act="thRole"][data-k="player"]').click();
      await page.locator('[data-act="newHero"]').click();
      await expect(page.locator('#crMini canvas')).toBeVisible();
      await scrolls('#charBox', vp.width / 2, vp.height * .6);
      await page.evaluate(() => document.querySelector('#crMini').scrollIntoView({ block:'center' }));
      const cv = await page.locator('#crMini canvas').boundingBox();
      expect(cv.height).toBeLessThanOrEqual(vp.height * .55);
      await scrolls('#charBox', cv.x + cv.width / 2, cv.y + cv.height / 2);          // a swipe on the hero still scrolls
      await page.goto('/dread-delve.html'); await page.waitForFunction(() => !!window.DreadDelve);
      await arena(page);
      if (!(await page.evaluate(() => window.DreadDelve.ui.panelOpen))) await page.locator('#btnPanel').click();
      await page.locator('[data-act="tab"][data-k="tokens"]').click();
      for (const n of ['Bo', 'Cy', 'Di', 'Ed']){ await page.locator('#newName').fill(n); await page.locator('[data-act="addPc"]').click(); }
      const pb = await page.locator('#tabBody').boundingBox();
      await scrolls('#tabBody', pb.x + pb.width / 2, pb.y + pb.height * .7);
      expect(errors).toEqual([]);
    } finally { await ctx.close(); }
  });
}
