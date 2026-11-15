import { test, expect } from './helpers.js';

// 🕹 The handheld (ui/handheld.js) and the Wanderer's follow camera (ui/wander.js, engine/wander-cam.js). On a phone
// with no controller the Wanderer is held like a pocket console: the world in the shell's screen, the D-pad walks, A
// acts, L turns the camera, Start opens the menu, whose Handheld page sets the pixel screen and turns the shell off.
// It boots with its name on a black screen (a press skips it), its Lantern light shows the hero's health, a hit
// flashes the bezel, and walls between the camera and the hero thin away (render/seethrough.js: no shader errors).
// Select + Start opens the save states: a slot saved, a walk, and the slot loaded puts the hero back. In portrait a
// fight's bar moves onto a second panel under the screen, and a strike frames the hero and the target.
// On a desktop it stays away until asked for, and the keys turn and crane the camera.
const yaw = page => page.evaluate(() => { const D = window.DreadDelve, o = D.camera.position.clone().sub(D.controls.target); return Math.atan2(o.x, o.z); });
const hero = page => page.evaluate(() => { const h = window.DreadDelve.wander.hero(); return { x:h.x, y:h.y }; });
async function begin(page, id, prefs = null){
  await page.evaluate(([id, prefs]) => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = id; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role');
    if (prefs) localStorage.setItem('dreaddelve.handheld.v1', JSON.stringify(prefs)); }, [id, prefs]);
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
    const shaderErrors = []; page.on('console', m => { if (/Shader Error|WebGLProgram|ERROR: 0:/.test(m.text())) shaderErrors.push(m.text().slice(0, 300)); });
    await begin(page, 'vasha-hh', { full:false });   // (the whole screen isn't asked for: the test keeps its window)
    await expect(page.locator('#handheld')).toBeVisible();
    await expect(page.locator('#hhBoot')).toBeVisible();
    await expect(page.locator('#hhBoot')).toContainText('DREAD DELVE');
    await expect(page.locator('body')).toHaveClass(/\bhh\b/);
    await expect(page.locator('#cardLayer')).toContainText('Walk with the D-pad');
    // the world is drawn into the shell's screen, and the HUD sits on it
    const fit = await page.evaluate(() => { const s = document.querySelector('#hhScreen').getBoundingClientRect(), v = window.DreadDelve.viewSize(), c = document.querySelector('#stage canvas').getBoundingClientRect(), h = document.querySelector('#wanderHud').getBoundingClientRect();
      return { s:[s.left, s.top, s.width, s.height].map(Math.round), v:[v.x, v.y, v.w, v.h], c:[c.left, c.top, c.width, c.height].map(Math.round), h:[h.left, h.top, h.width, h.height].map(Math.round) }; });
    expect(fit.v).toEqual(fit.s); expect(fit.c).toEqual(fit.s); expect(fit.h).toEqual(fit.s);
    expect(fit.s[2]).toBeLessThan(844);
    // a press skips the boot (if it's still on: the desktop test checks it does nothing else); A clears the cards;
    // holding the D-pad down walks
    await hold(page, 'a');
    await expect(page.locator('#hhBoot')).toBeHidden();
    await expect.poll(async () => { await hold(page, 'a'); return page.locator('#cardLayer .pop').count(); }, { timeout:15_000 }).toBe(0);
    const h0 = await hero(page);
    await hold(page, 'dpad', 1300, 0, 1);
    await expect.poll(async () => (await hero(page)).y).toBeGreaterThan(h0.y);
    // L turns the camera an eighth
    const y0 = await yaw(page);
    await hold(page, 'l');
    await expect.poll(async () => Math.abs(Math.abs(((await yaw(page)) - y0 + 3 * Math.PI) % (2 * Math.PI) - Math.PI) - Math.PI / 4), { timeout:5000 }).toBeLessThan(.05);
    // the legends say what X and Y do now
    await expect(page.locator('.hh-lg.y')).toHaveText('Journal');
    // the Lantern light is the hero's health; a hit flashes the bezel
    await expect(page.locator('#handheld')).toHaveAttribute('data-hp', 'ok');
    await page.evaluate(() => { const h = window.DreadDelve.wander.hero(); h.hp = Math.max(1, Math.floor(h.maxHp * .4)); });
    await expect(page.locator('#handheld')).toHaveAttribute('data-hp', 'low');
    await expect(page.locator('#handheld')).toHaveClass(/\bhit\b/);
    await page.evaluate(() => { window.DreadDelve.wander.hero().hp = 1; });
    await expect(page.locator('#handheld')).toHaveAttribute('data-hp', 'dire');
    await page.evaluate(() => { const h = window.DreadDelve.wander.hero(); h.hp = h.maxHp; });
    await page.waitForTimeout(1500);   // (walls, trees and props near the hero have taken the see-through by now)
    expect(shaderErrors).toEqual([]);
    // Select + Start: the save states; save slot 1, walk on, load it back
    const at0 = await hero(page);
    const sel = page.locator('[data-hh="select"]'), st = page.locator('[data-hh="start"]');
    await sel.dispatchEvent('pointerdown', { pointerId:21, bubbles:true }); await st.dispatchEvent('pointerdown', { pointerId:22, bubbles:true });
    await st.dispatchEvent('pointerup', { pointerId:22, bubbles:true }); await sel.dispatchEvent('pointerup', { pointerId:21, bubbles:true });
    await expect(page.locator('#wdMenuBox')).toContainText('Save states');
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Save to slot 1' }).click();
    await expect(page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Load slot 1' })).toContainText('Vasha, level 1');
    await hold(page, 'b'); await hold(page, 'b');
    await expect(page.locator('#wdMenuBox')).toBeHidden();
    await hold(page, 'dpad', 1300, 0, 1);
    await expect.poll(async () => JSON.stringify(await hero(page))).not.toBe(JSON.stringify(at0));
    await page.keyboard.press('k');
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Load slot 1' }).click();
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Yes, load slot 1' }).click();
    await expect.poll(async () => JSON.stringify(await hero(page))).toBe(JSON.stringify(at0));
    // Start: the menu; its Handheld page: the pixel screen, then the shell off
    await hold(page, 'start');
    await expect(page.locator('#wdMenuBox')).toBeVisible();
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^Handheld & camera/ }).click();
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Screen: Smooth' }).click();
    await expect(page.locator('#stage canvas')).toHaveClass(/chunky/);
    await expect(page.locator('body')).toHaveClass(/hh-lcd/);
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^Shell:/ }).click();
    await expect(page.locator('#handheld')).toHaveAttribute('data-shell', 'bone');
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'See through walls: On' }).click();
    await expect(page.locator('#wdMenuBox')).toContainText('See through walls: Off');
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'See through walls: Off' }).click();
    await expect(page.locator('#wdMenuBox')).toContainText('Full screen: Off');
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Handheld: Auto' }).click();   // → On
    await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Handheld: On' }).click();     // → Off
    await expect(page.locator('#handheld')).toBeHidden();
    expect(await page.evaluate(() => { const v = window.DreadDelve.viewSize(); return [v.w, v.h]; })).toEqual([844, 390]);
    await expect(page.locator('#stage canvas')).not.toHaveClass(/chunky/);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('dreaddelve.handheld.v1')))).toEqual({ mode:'off', shell:'bone', lcd:true, full:false, seeThru:true, table:false });
  });
});

test.describe('on a phone held upright', () => {
  test.use({ viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  test('a fight\'s bar moves onto a second panel under the screen, and a strike frames the target', async ({ page }) => {
    test.setTimeout(120_000);
    await begin(page, 'vasha-up', { full:false });
    await hold(page, 'a');
    await expect(page.locator('body')).not.toHaveClass(/hh-subon/);
    await page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), f = D.get().floors[h.floor];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]){ const x = h.x + dx, y = h.y + dy;
        if (!D.get().tokens.some(t => t.kind === 'monster') && f.grid[y * f.W + x] && !D.get().tokens.some(t => t.floor === h.floor && t.x === x && t.y === y)) D.placeMonster('wolf', { floor:h.floor, x, y }); }
      for (const m of w.members()) m.hp = m.maxHp = 200;
      for (const t of D.get().tokens.filter(t => t.kind === 'monster')) t.hp = t.maxHp = 200;
      w.beginFight('none', D.get().tokens.filter(t => t.kind === 'monster').map(t => t.id)); });
    await expect(page.locator('body')).toHaveClass(/hh-subon/);
    const [scr, bar] = await Promise.all([page.locator('#hhScreen').boundingBox(), page.locator('#wdFight').boundingBox()]);
    expect(bar.y).toBeGreaterThanOrEqual(scr.y + scr.height);   // under the screen, not over it
    await expect.poll(() => page.evaluate(() => window.DreadDelve.wander.myTurn() && !window.DreadDelve.busy()), { timeout:60_000 }).toBe(true);
    await hold(page, 'a');
    await expect.poll(() => page.evaluate(() => { const w = window.DreadDelve.wander; return !!w.rt.look && w.rt.look.id === w.target()?.id; })).toBe(true);
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
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^Handheld & camera/ }).click();
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Handheld: Auto' }).click();
  await expect(page.locator('#handheld')).toBeVisible();
  await expect(page.locator('#hhBoot')).toBeVisible();
  const sel0 = await page.locator('#wdMenuBox .wd-opt.on').textContent();
  await page.keyboard.press('ArrowDown');   // (a key skips the boot too, and does nothing else)
  await expect(page.locator('#hhBoot')).toBeHidden();
  expect(await page.locator('#wdMenuBox .wd-opt.on').textContent()).toBe(sel0);
  await expect(page.locator('.hh-lg.a')).toHaveText('Choose');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await expect(page.locator('#wdMenuBox')).toBeHidden();
  const h0 = await hero(page);
  await expect.poll(async () => { await page.keyboard.press('s'); return (await hero(page)).y !== h0.y || (await hero(page)).x !== h0.x; }, { timeout:10_000 }).toBe(true);
  // the safe moment stays where it was taken: walk on after it, and waking from it puts the hero back there
  // (game/session.js keeps a copy, not the live state's objects)
  await page.waitForTimeout(600);
  const safe = await page.evaluate(() => { window.DreadDelve.wander.saveNow(); const h = window.DreadDelve.wander.hero(); return { x:h.x, y:h.y }; });
  await expect.poll(async () => { await page.keyboard.press('w'); const h = await hero(page); return h.x !== safe.x || h.y !== safe.y; }, { timeout:10_000 }).toBe(true);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.DreadDelve.wander.continueWander({ safe:true }))).toBe(true);
  expect(await hero(page)).toEqual(safe);
});
