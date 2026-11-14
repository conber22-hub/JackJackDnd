import { test, expect } from './helpers.js';

// 🕹 The handheld (ui/handheld.js) and the Wanderer's follow camera (ui/wander.js, engine/wander-cam.js). On a phone
// with no controller the Wanderer is held like a pocket console: the world in the shell's screen, the D-pad walks, A
// acts, L turns the camera, Start opens the menu, whose Handheld page sets the pixel screen and turns the shell off.
// On a desktop it stays away until asked for, and the keys turn and crane the camera.
const yaw = page => page.evaluate(() => { const D = window.DreadDelve, o = D.camera.position.clone().sub(D.controls.target); return Math.atan2(o.x, o.z); });
const hero = page => page.evaluate(() => { const h = window.DreadDelve.wander.hero(); return { x:h.x, y:h.y }; });
async function begin(page, id){
  await page.evaluate(id => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = id; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); }, id);
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator(`[data-act="wdBegin"][data-id="${id}"]`).click();
  await expect(page.locator('#wanderHud')).toBeVisible();
}
// a finger on one of the shell's controls (dx, dy: where on it, −1..1 from the middle), held a while
async function hold(page, k, ms = 80, dx = 0, dy = 0){
  const el = page.locator(`[data-hh="${k}"]`), r = await el.boundingBox(), x = r.x + r.width * (.5 + dx * .38), y = r.y + r.height * (.5 + dy * .38);
  await el.dispatchEvent('pointerdown', { pointerId:11, clientX:x, clientY:y, bubbles:true, isPrimary:true });
  await page.waitForTimeout(ms);
  await el.dispatchEvent('pointerup', { pointerId:11, clientX:x, clientY:y, bubbles:true });
}

test.describe('on a phone', () => {
  test.use({ viewport:{ width:844, height:390 }, hasTouch:true, isMobile:true });
  test('the Wanderer held like a pocket console: the screen, the D-pad, A, L, Start, and the Handheld page', async ({ page }) => {
    test.setTimeout(120_000);
    await begin(page, 'vasha-hh');
    await expect(page.locator('#handheld')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/\bhh\b/);
    await expect(page.locator('#cardLayer')).toContainText('Walk with the D-pad');
    // the world is drawn into the shell's screen, and the HUD sits on it
    const fit = await page.evaluate(() => { const s = document.querySelector('#hhScreen').getBoundingClientRect(), v = window.DreadDelve.viewSize(), c = document.querySelector('#stage canvas').getBoundingClientRect(), h = document.querySelector('#wanderHud').getBoundingClientRect();
      return { s:[s.left, s.top, s.width, s.height].map(Math.round), v:[v.x, v.y, v.w, v.h], c:[c.left, c.top, c.width, c.height].map(Math.round), h:[h.left, h.top, h.width, h.height].map(Math.round) }; });
    expect(fit.v).toEqual(fit.s); expect(fit.c).toEqual(fit.s); expect(fit.h).toEqual(fit.s);
    expect(fit.s[2]).toBeLessThan(844);
    // A dismisses the card; holding the D-pad down walks
    await hold(page, 'a');
    await expect(page.locator('#cardLayer .pop')).toHaveCount(0);
    const h0 = await hero(page);
    await hold(page, 'dpad', 1300, 0, 1);
    await expect.poll(async () => (await hero(page)).y).toBeGreaterThan(h0.y);
    // L turns the camera an eighth
    const y0 = await yaw(page);
    await hold(page, 'l');
    await expect.poll(async () => Math.abs(Math.abs(((await yaw(page)) - y0 + 3 * Math.PI) % (2 * Math.PI) - Math.PI) - Math.PI / 4), { timeout:5000 }).toBeLessThan(.05);
    // the legends say what X and Y do now
    await expect(page.locator('.hh-lg.y')).toHaveText('Journal');
    // Start: the menu; its Handheld page: the pixel screen, then the shell off
    await hold(page, 'start');
    await expect(page.locator('#wdMenuBox')).toBeVisible();
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^Handheld/ }).click();
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Screen: Smooth' }).click();
    await expect(page.locator('#stage canvas')).toHaveClass(/chunky/);
    await expect(page.locator('body')).toHaveClass(/hh-lcd/);
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^Shell:/ }).click();
    await expect(page.locator('#handheld')).toHaveAttribute('data-shell', 'bone');
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Handheld: Auto' }).click();   // → On
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Handheld: On' }).click();     // → Off
    await expect(page.locator('#handheld')).toBeHidden();
    expect(await page.evaluate(() => { const v = window.DreadDelve.viewSize(); return [v.w, v.h]; })).toEqual([844, 390]);
    await expect(page.locator('#stage canvas')).not.toHaveClass(/chunky/);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('dreaddelve.handheld.v1')))).toEqual({ mode:'off', shell:'bone', lcd:true });
  });
});

test('on a desktop the handheld waits to be asked for, and the keys turn, crane and cycle the camera', async ({ page }) => {
  test.setTimeout(120_000);
  await begin(page, 'vasha-desk');
  await expect(page.locator('#handheld')).toBeHidden();
  await page.keyboard.press('Escape');   // (the waking card)
  await page.waitForTimeout(1600);   // (the start's own camera glide)
  const y0 = await yaw(page);
  await page.keyboard.press(']');
  await expect.poll(async () => Math.abs(Math.abs(((await yaw(page)) - y0 + 3 * Math.PI) % (2 * Math.PI) - Math.PI) - Math.PI / 4), { timeout:5000 }).toBeLessThan(.05);
  const dist = () => page.evaluate(() => window.DreadDelve.camera.position.distanceTo(window.DreadDelve.controls.target));
  const d0 = await dist();
  await page.keyboard.press('-');
  await expect.poll(dist).toBeGreaterThan(d0 + 1);
  await page.keyboard.press('v');
  await expect(page.locator('#toasts')).toContainText('🎥');
  // asked for: the shell comes, the keyboard still works
  await page.keyboard.press('m');
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^Handheld/ }).click();
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Handheld: Auto' }).click();
  await expect(page.locator('#handheld')).toBeVisible();
  await expect(page.locator('.hh-lg.a')).toHaveText('Choose');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await expect(page.locator('#wdMenuBox')).toBeHidden();
  const h0 = await hero(page);
  await expect.poll(async () => { await page.keyboard.press('s'); return (await hero(page)).y !== h0.y || (await hero(page)).x !== h0.x; }, { timeout:10_000 }).toBe(true);
});
