import { test, expect, preparePage, arena, expectPositions } from './helpers.js';

// 🕹 The handheld at the table (ui/tablehh.js): a player's phone, seated at the DM's table, is the pocket console by
// default. The map in the shell's screen with the classic screen's furniture away; the D-pad steps the hero (the DM's
// app moves it, both screens agree); Select opens the hero's sheet over everything; Start the menu. One button, one
// job: in a fight on their turn, A does what the line on the screen says: it opens the choice of blow, then strikes the target through the usual
// request (once: the handheld counts the turn's action), then ends the turn (not on a double tap); X is the Actions
// menu, its Spells… casting at the target from the buttons, its Action Surge giving the action back; a foe getting away
// asks for her reaction on the screen (A strikes); the menu's "The classic screen" puts the old phone back, and the
// Hero tab's 🕹 Handheld brings the handheld back. The legends never change.
const SP = process.env.HH_SHOTS;   // a folder to keep screenshots in
test('a seated player plays from the handheld: steps, the sheet, the menu, a strike in a fight, and the classic screen', async ({ page:dm, browser, baseURL }) => {
  test.setTimeout(420_000);   // (two pages drawing at once: slow on a busy machine)
  await arena(dm, []);
  await dm.evaluate(() => { const D = window.DreadDelve; D.get().campaign.freeRolls = true;   // (the player's rolls go straight through)
    const h = D.newHero('Cleric'); h.name = 'Ada'; h.id = 'ada-hh'; h.spells = ['Sacred Flame', 'Cure Wounds'];   // (a cleric: a strike and spells)
    const t = D.applyCharacter(h, { owner:'Ada' }); t.floor = 0; t.x = 6; t.y = 10; });
  await dm.locator('[data-act="tab"][data-k="table"]').click();
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  try {
    const p = await context.newPage();
    const errors = await preparePage(p, { handheld:true });
    await p.evaluate(() => localStorage.setItem('dreaddelve.handheld.v1', JSON.stringify({ full:false })));   // (the test keeps its window)
    await p.locator('[data-act="thRole"][data-k="player"]').click();
    await p.locator('#pName').fill('Ada');
    await p.locator('#pWord').fill('e2e-secret');
    await p.locator('#joinCode').fill(code);
    await p.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect.poll(() => p.evaluate(() => { const D = window.DreadDelve; return D.get()?.tokens.find(t => t.id === D.ui.myToken)?.name || null; }), { timeout:30_000 }).toBe('Ada');
    // the handheld, not the classic screen
    await expect(p.locator('#handheld')).toBeVisible();
    await expect(p.locator('body')).toHaveClass(/\bhh-table\b/);
    await expect(p.locator('#tableHud')).toBeVisible();
    await expect(p.locator('#topbar')).toBeHidden();
    await expect(p.locator('#panel')).toBeHidden();
    await expect(p.locator('#tbParty')).toContainText('Ada');
    const hold = async (k, ms = 80, dx = 0, dy = 0) => {
      const el = p.locator(`[data-hh="${k}"]`), r = await el.boundingBox(), x = r.x + r.width * (.5 + dx * .38), y = r.y + r.height * (.5 + dy * .38);
      await el.dispatchEvent('pointerdown', { pointerId:31, clientX:x, clientY:y, bubbles:true, isPrimary:true });
      await p.waitForTimeout(ms);
      await el.dispatchEvent('pointerup', { pointerId:31, clientX:x, clientY:y, bubbles:true });
    };
    await expect.poll(async () => { await hold('a'); return p.locator('#hhBoot').isHidden(); }).toBe(true);
    // the D-pad: the camera starts north-up, so right is east; the DM's app moves her, and both screens agree
    await p.evaluate(() => { const D = window.DreadDelve, h = D.get().tokens.find(t => t.id === D.ui.myToken), o = D.camera.position.clone().sub(D.controls.target), d = Math.hypot(o.x, o.z);
      D.camera.position.set(D.controls.target.x, D.camera.position.y, D.controls.target.z + d); });
    await expect.poll(async () => { await hold('dpad', 260, 1, 0); return dm.evaluate(() => window.DreadDelve.get().tokens.find(t => t.name === 'Ada').x); }, { timeout:20_000 }).toBeGreaterThan(6);
    // (a held D-pad may have sent a second step: wait for the DM's app and the phone to agree)
    const adaX = page => page.evaluate(() => { const t = window.DreadDelve.get().tokens.find(t => t.name === 'Ada'); return `${t.x},${t.y}`; });
    await expect.poll(async () => (await adaX(dm)) === (await adaX(p)) && !(await dm.evaluate(() => window.DreadDelve.busy())), { timeout:15_000 }).toBe(true);
    const x1 = await dm.evaluate(() => window.DreadDelve.get().tokens.find(t => t.name === 'Ada').x);
    await expectPositions(p, { Ada:{ x:x1, y:10 } });
    if (SP) await p.screenshot({ path:`${SP}/table-walk.png` });
    // touch: a tap on the ground two squares south walks her there (the DM's app moves her)
    const spot = await p.evaluate(() => { const D = window.DreadDelve, t = D.get().tokens.find(o => o.id === D.ui.myToken), g = D.tokenViews.get(t.id).group, c = document.querySelector('#stage canvas').getBoundingClientRect();
      const v = g.position.clone(); v.z += 2; v.project(D.camera); return { x:c.left + (v.x + 1) / 2 * c.width, y:c.top + (1 - v.y) / 2 * c.height }; });
    await p.touchscreen.tap(spot.x, spot.y);
    await expect.poll(() => dm.evaluate(() => window.DreadDelve.get().tokens.find(t => t.name === 'Ada').y), { timeout:20_000 }).toBe(12);
    await expect.poll(async () => (await adaX(dm)) === (await adaX(p)) && !(await dm.evaluate(() => window.DreadDelve.busy())), { timeout:15_000 }).toBe(true);
    // Select: Muse's pocket sheet on the screen (its pages turned with R); B: back to the handheld
    await hold('select');
    await expect(p.locator('#pocketSheet')).toBeVisible();
    // (touch: its ✕ closes it; Select again for the buttons)
    await p.locator('#pocketSheet [data-pk="close"]').tap();
    await expect(p.locator('#pocketSheet')).toBeHidden();
    await hold('select');
    await expect(p.locator('#pocketSheet')).toBeVisible();
    await expect(p.locator('#pocketSheet')).toContainText('Ada');
    await hold('r');
    await expect(p.locator('#pocketSheet')).toContainText('Fighting');
    await hold('b');
    await expect(p.locator('#pocketSheet')).toBeHidden();
    await expect(p.locator('#panel')).toBeHidden();
    // Start: the menu (Actions: Search is there out of a fight)
    await hold('start');
    await expect(p.locator('#tbMenu')).toContainText('At the table');
    await p.locator('#tbMenu [data-tb="pick"]', { hasText:/^Actions/ }).click();
    await expect(p.locator('#tbMenu')).toContainText('Search');
    await hold('b'); await hold('b');
    await expect(p.locator('#tbMenu')).toBeHidden();
    // a fight: a zombie beside her, her turn; the fight bar sits under the screen; A strikes it
    await dm.evaluate(x => { const D = window.DreadDelve; D.placeMonster('zombie', { floor:0, x:x + 1, y:12 }); }, x1);
    await expect.poll(() => p.evaluate(() => window.DreadDelve.get().tokens.some(t => t.kind === 'monster'))).toBe(true);
    await dm.evaluate(() => { const D = window.DreadDelve; D.rollInitiative(); const c = D.get().combat; for (let k = 0; k < 6 && D.tokById(c.order[c.idx])?.name !== 'Ada'; k++) D.nextTurn(); });
    await expect(p.locator('#tbFight')).toContainText('Your turn', { timeout:20_000 });
    await expect(p.locator('body')).toHaveClass(/hh-subon/);
    const [scr, bar] = await Promise.all([p.locator('#hhScreen').boundingBox(), p.locator('#tbFight').boundingBox()]);
    expect(bar.y).toBeGreaterThanOrEqual(scr.y + scr.height);
    await expect(p.locator('#tbFight')).toContainText('Zombie');
    if (SP) await p.screenshot({ path:`${SP}/table-fight.png` });
    const logLen = await dm.evaluate(() => window.DreadDelve.get().log.length);
    await expect(p.locator('#tbFight')).toContainText('1 strike left');
    await expect(p.locator('#tbFight .wd-weap')).toContainText('to hit');   // (what she'd strike with, on the bar)
    await expect(p.locator('#tbPrompt')).toContainText('Attack Zombie');
    await hold('a');   // (A: the choice of blow, each attack with its bonus, damage and reach; A again strikes)
    await expect(p.locator('#tbMenu')).toContainText('to hit');
    await hold('a');
    await expect.poll(() => dm.evaluate(n => window.DreadDelve.get().log.slice(n).some(l => /Ada/.test(typeof l === 'string' ? l : JSON.stringify(l))), logLen), { timeout:20_000 }).toBe(true);
    // the turn's action is spent: A, straight away, doesn't throw the turn away; a moment later it ends it
    await expect(p.locator('#tbFight')).toContainText('struck');
    await expect(p.locator('#tbPrompt')).toContainText('End your turn');
    await expect(p.locator('.hh-lg.a')).toHaveText('OK');
    await p.waitForTimeout(1300);
    await hold('a');
    await expect.poll(() => dm.evaluate(() => { const D = window.DreadDelve, c = D.get().combat; return D.tokById(c.order[c.idx])?.name; }), { timeout:20_000 }).not.toBe('Ada');
    // her next turn, with Action Surge (as a fighter would have it): X, Spells…, Sacred Flame at the target, from the
    // buttons alone; then X, Action Surge, and the action is back
    await dm.evaluate(() => { const D = window.DreadDelve, c = D.get().combat, t = D.get().tokens.find(o => o.name === 'Ada');
      t.resources = [...(t.resources || []), { id:'surge', n:'Action Surge', max:1, rest:'short', use:'note', text:'One more action this turn.' }]; t.res = { ...(t.res || {}), surge:1 };
      for (let k = 0; k < 6 && D.tokById(c.order[c.idx])?.name !== 'Ada'; k++) D.nextTurn(); });
    await expect(p.locator('#tbFight')).toContainText('1 strike left', { timeout:20_000 });
    await hold('x');
    await expect(p.locator('#tbMenu')).toContainText('Spells…');
    await expect(p.locator('#tbMenu')).toContainText('Action Surge');
    // (down the list to Spells…, with the D-pad)
    await expect.poll(async () => {
      const d = await p.evaluate(() => { const o = [...document.querySelectorAll('#tbMenu .wd-opt')], on = o.findIndex(e => e.classList.contains('on')), sp = o.findIndex(e => /Spells…/.test(e.textContent)); return sp - on; });
      if (!d) return true;
      // (a quick tap, down and up at once: it steps exactly once however slow the frames are)
      await p.evaluate(dy => { const el = document.querySelector('[data-hh="dpad"]'), r = el.getBoundingClientRect(), o = { pointerId:32, clientX:r.x + r.width / 2, clientY:r.y + r.height * (.5 + dy * .38), bubbles:true, isPrimary:true };
        el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o));
        return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); }, Math.sign(d));
      return false; }, { timeout:15_000 }).toBe(true);
    await hold('a');
    await expect(p.locator('#tbMenu')).toContainText('Sacred Flame');
    await expect(p.locator('#tbMenu .wd-opt.on')).toContainText('at Zombie');
    const n2 = await dm.evaluate(() => window.DreadDelve.get().log.length);
    await hold('a');
    await expect.poll(() => dm.evaluate(n => window.DreadDelve.get().log.slice(n).some(l => /Sacred Flame/.test(JSON.stringify(l))), n2), { timeout:20_000 }).toBe(true);
    await expect(p.locator('#tbFight')).toContainText('cast');
    await p.locator('#tbFight [data-tb="x"]').tap();   // (touch: the fight bar's X, then the menu's line)
    await p.locator('#tbMenu [data-tb="pick"]', { hasText:/^Action Surge/ }).tap();
    await expect.poll(() => dm.evaluate(() => window.DreadDelve.get().tokens.find(o => o.name === 'Ada').res.surge), { timeout:20_000 }).toBe(0);
    await expect(p.locator('#tbFight')).toContainText('1 strike left', { timeout:20_000 });
    await expect(p.locator('#toasts')).toContainText('Action Surge');
    // a foe getting away: her reaction, asked on the screen; A takes it
    await p.evaluate(() => { window.DreadDelve.ui.oaAsk = [{ id:'oa-e2e', mover:'Zombie', atk:'Unarmed Strike' }]; });
    await expect(p.locator('#tbPrompt')).toContainText('getting away');
    await expect(p.locator('#tbPrompt')).toContainText('Strike with');
    await hold('a');
    await expect.poll(() => p.evaluate(() => window.DreadDelve.ui.oaAsk?.length || 0)).toBe(0);
    // the menu's "The classic screen", and the Hero tab's way back
    await hold('start');
    await p.locator('#tbMenu [data-tb="pick"]', { hasText:/^Handheld & camera/ }).click();
    await p.locator('#tbMenu [data-tb="pick"]', { hasText:'The classic screen' }).click();
    await expect(p.locator('#handheld')).toBeHidden();
    await expect(p.locator('body')).not.toHaveClass(/\bhh-table\b/);
    if (!(await p.evaluate(() => window.DreadDelve.ui.panelOpen))) await p.locator('#btnPanel').click();
    await p.locator('[data-act="tab"][data-k="hero"]').click();
    await p.locator('[data-act="hhTable"]').click();
    await expect(p.locator('#handheld')).toBeVisible();
    expect(errors, 'Uncaught player browser errors').toEqual([]);
  } finally {
    await context.close();
  }
});
