import { test, expect, preparePage } from './helpers.js';

// 🎨 Shells and stickers (brief-11): eight more Barovian shells for the handheld, and vinyl stickers a player
// can stick on their own console. The pack's CSS is injected once; every pack shell applies its variables to the
// body; the sticker book places a sticker, which is kept after a reload; a sticker never sits over the screen;
// stickers are kept apart for portrait and landscape; and with stickers on, a tap on A still reaches the button.
// The sandbox runs at about a frame a second, so each round trip to the page costs seconds: the drags and the
// A-tap are driven in single page.evaluate calls instead of one Playwright action each.
const SHOTS = process.env.SHELL_SHOTS;

async function begin(page, id, seed = null){
  await page.evaluate(([id, seed]) => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = id;
    localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role');
    localStorage.setItem('dreaddelve.handheld.v1', JSON.stringify({ mode:'on', full:false }));
    if (seed) localStorage.setItem('dreaddelve.stickers.v1', JSON.stringify(seed)); }, [id, seed]);
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator(`[data-act="wdBegin"][data-id="${id}"]`).click();
  await expect(page.locator('#wanderHud')).toBeVisible({ timeout:60_000 });
  await expect(page.locator('#handheld')).toBeVisible();
}
const mount = page => page.evaluate(() => { const D = window.DreadDelve; D.shells.injectShells(); D.shells.mountStickers(document.querySelector('#handheld')); });
// drag a sticker out of the tray and drop it: 'corner' is open body at the top, 'dpad' the D-pad's side of the
// shell, 'screen' the screen's centre
async function dragSticker(page, id, target){
  await page.evaluate(([id, target]) => {
    const btn = document.querySelector(`#stickerBook [data-sticker="${id}"]`);
    const r = btn.getBoundingClientRect();
    const sx = r.left + r.width / 2, sy = r.top + r.height / 2;
    const body = document.querySelector('.hh-body').getBoundingClientRect();
    const tray = document.querySelector('.sb-tray').getBoundingClientRect();
    let x, y;
    if (target === 'corner'){ x = body.left + body.width * .12; y = body.top + body.height * .15; }
    else { const el = target === 'screen' ? document.querySelector('#hhScreen') : document.querySelector('.hh-left');
      const b = el.getBoundingClientRect();
      x = b.left + b.width / 2; y = Math.min(b.top + b.height / 2, tray.top - 20); }
    const init = (cx, cy) => ({ bubbles:true, isPrimary:true, pointerId:21, clientX:cx, clientY:cy });
    btn.dispatchEvent(new PointerEvent('pointerdown', init(sx, sy)));
    document.dispatchEvent(new PointerEvent('pointermove', init((sx + x) / 2, (sy + y) / 2)));
    document.dispatchEvent(new PointerEvent('pointermove', init(x, y)));
    document.dispatchEvent(new PointerEvent('pointerup', init(x, y)));
  }, [id, target]);
}
// a tap on A, in one call: did it reach the button, and if the boot was up, did the press skip it?
async function tapA(page){
  return page.evaluate(async () => {
    const boot = document.querySelector('#hhBoot');
    const wasUp = boot && !boot.classList.contains('hidden');
    const a = document.querySelector('[data-hh="a"]');
    const r = a.getBoundingClientRect();
    const init = { bubbles:true, isPrimary:true, pointerId:11, clientX:r.left + r.width / 2, clientY:r.top + r.height / 2 };
    a.dispatchEvent(new PointerEvent('pointerdown', init));
    const down = a.classList.contains('down');
    a.dispatchEvent(new PointerEvent('pointerup', init));
    await new Promise(res => setTimeout(res, 500));   // the boot takes 350ms to hide itself
    return { wasUp, down, bootHidden: boot.classList.contains('hidden') };
  });
}

test('every pack shell applies its variables to the body', async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:844, height:390 }, isMobile:true, hasTouch:true });
  try {
    const page = await context.newPage();
    const errors = await preparePage(page, { handheld:true });
    await begin(page, 'vasha-shells');
    const got = await page.evaluate(() => {
      const D = window.DreadDelve, body = document.querySelector('.hh-body'), hh = document.querySelector('#handheld');
      D.shells.injectShells();
      const bgs = { dusk:getComputedStyle(body).backgroundImage };
      for (const sh of D.shells.SHELL_PACK){ hh.dataset.shell = sh.k; bgs[sh.k] = getComputedStyle(body).backgroundImage; }
      hh.dataset.shell = 'dusk';
      return { pack:D.shells.SHELL_PACK.map(s => s.k), bgs };
    });
    expect(got.pack.length).toBeGreaterThanOrEqual(8);
    const seen = new Set();
    for (const k of got.pack){ expect(got.bgs[k]).not.toBe(got.bgs.dusk); seen.add(got.bgs[k]); }
    expect(seen.size).toBe(got.pack.length);   // each shell looks different from the others, not just from Dusk
    expect(errors, 'Uncaught browser errors').toEqual([]);
  } finally { await context.close(); }
});

test('the sticker book places a sticker, one never sits over the screen, and A still answers', async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:844, height:390 }, isMobile:true, hasTouch:true });
  try {
    const page = await context.newPage();
    const errors = await preparePage(page, { handheld:true });
    await begin(page, 'vasha-stickers');
    await mount(page);
    // with stickers on the shell, a tap on A still reaches the button
    const tap = await tapA(page);
    expect(tap.down).toBe(true);
    if (tap.wasUp) expect(tap.bootHidden).toBe(true);
    // the book: sixteen stickers in the tray
    await page.evaluate(() => window.DreadDelve.shells.openStickerBook({}));
    await expect(page.locator('#stickerBook')).toBeVisible();
    expect(await page.locator('#stickerBook [data-sticker]').count()).toBeGreaterThanOrEqual(16);
    // drag the bat onto open body, and the ghost onto the screen: it is snapped off it
    await dragSticker(page, 'bat', 'corner');
    await dragSticker(page, 'ghost', 'screen');
    const got = await page.evaluate(() => {
      const s = document.querySelector('#hhScreen').getBoundingClientRect();
      const g = document.querySelector('.hh-sticker[data-id="ghost"]')?.getBoundingClientRect();
      const stored = JSON.parse(localStorage.getItem('dreaddelve.stickers.v1') || '{}');
      return { bat:!!document.querySelector('.hh-sticker[data-id="bat"]'), ghost:!!g,
        overlap:g ? !(g.right <= s.left || g.left >= s.right || g.bottom <= s.top || g.top >= s.bottom) : null,
        stored:stored.landscape?.map(x => x.id) || [] };
    });
    expect(got.bat).toBe(true);
    expect(got.ghost).toBe(true);
    expect(got.overlap).toBe(false);
    expect(got.stored).toContain('bat');
    await page.locator('#stickerBook [data-sb="done"]').click();
    await expect(page.locator('#stickerBook')).toBeHidden();
    if (SHOTS) await page.screenshot({ path:`${SHOTS}/shells-landscape.png` });
    expect(errors, 'Uncaught browser errors').toEqual([]);
  } finally { await context.close(); }
});

test('a sticker placed by the book is kept after a reload', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);   // two Wanderer starts at a frame a second
  const context = await browser.newContext({ baseURL, viewport:{ width:844, height:390 }, isMobile:true, hasTouch:true });
  try {
    const page = await context.newPage();
    const errors = await preparePage(page, { handheld:true });
    await begin(page, 'vasha-keep');
    await mount(page);
    await page.evaluate(() => window.DreadDelve.shells.openStickerBook({}));
    await expect(page.locator('#stickerBook')).toBeVisible();
    await dragSticker(page, 'bat', 'corner');
    await expect(page.locator('.hh-sticker[data-id="bat"]')).toBeVisible();
    await page.locator('#stickerBook [data-sb="done"]').click();
    await expect(page.locator('#stickerBook')).toBeHidden();
    await begin(page, 'vasha-keep');
    await mount(page);
    await expect(page.locator('.hh-sticker[data-id="bat"]')).toBeVisible();
    expect(errors, 'Uncaught browser errors').toEqual([]);
  } finally { await context.close(); }
});

test('stickers are kept apart for portrait and landscape, and survive the phone turning', async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  try {
    const page = await context.newPage();
    const errors = await preparePage(page, { handheld:true });
    await begin(page, 'vasha-portrait');
    await mount(page);
    await page.evaluate(() => window.DreadDelve.shells.openStickerBook({}));
    await expect(page.locator('#stickerBook')).toBeVisible();
    await dragSticker(page, 'rose', 'dpad');
    await expect(page.locator('.hh-sticker[data-id="rose"]')).toBeVisible();
    if (SHOTS) await page.screenshot({ path:`${SHOTS}/shells-portrait.png` });
    await page.locator('#stickerBook [data-sb="done"]').click();
    // turn the phone: the portrait sticker goes away (nothing is stuck on the landscape shell yet)
    await page.setViewportSize({ width:844, height:390 });
    await expect.poll(async () => page.locator('.hh-sticker').count(), { timeout:20_000 }).toBe(0);
    // turn it back: the rose is back where it was
    await page.setViewportSize({ width:390, height:844 });
    await expect.poll(async () => page.locator('.hh-sticker[data-id="rose"]').count(), { timeout:20_000 }).toBe(1);
    expect(errors, 'Uncaught browser errors').toEqual([]);
  } finally { await context.close(); }
});

test('on a desktop the shells and stickers show, and a seeded set loads', async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  try {
    const page = await context.newPage();
    const errors = await preparePage(page, { handheld:true });
    const seed = { portrait:[], landscape:[
      { id:'raven', x:12, y:70, r:-8, s:1.1 },
      { id:'d20', x:88, y:68, r:10, s:1.2 },
      { id:'candle', x:50, y:88, r:0, s:1 } ] };
    await begin(page, 'vasha-desk', seed);
    await page.evaluate(() => { const D = window.DreadDelve; D.shells.injectShells(); D.shells.mountStickers(document.querySelector('#handheld'));
      document.querySelector('#handheld').dataset.shell = 'amber'; });
    await expect(page.locator('.hh-sticker')).toHaveCount(3);
    if (SHOTS) await page.screenshot({ path:`${SHOTS}/shells-desktop.png` });
    expect(errors, 'Uncaught browser errors').toEqual([]);
  } finally { await context.close(); }
});
