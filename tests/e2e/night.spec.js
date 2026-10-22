import { test, expect, preparePage, arena, frameMap, selectHero, clickTile } from './helpers.js';

const SP = process.env.NIGHT_SHOTS;   // set to a folder to keep screenshots of the screen
const openNight = async page => { if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click(); await page.locator('[data-act="tab"][data-k="night"]').click(); };

test('the table screen: a window for the TV that follows the table, with read-alouds, lights out and introductions', async ({ page }) => {
  test.setTimeout(180_000);   // two 3D windows on a software renderer
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }]);
  await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('zombie', { floor:0, x:7, y:10 }); D.get().campaign.notes = { 1:'Strahd is the innkeeper' }; });
  await openNight(page);
  const [screen] = await Promise.all([page.context().waitForEvent('page'), page.locator('[data-act="ntOpen"]').click()]);
  const errors = []; screen.on('pageerror', e => errors.push(e.message));
  await screen.waitForFunction(() => window.DreadDelve?.get()?.tokens?.length > 0, null, { timeout:20000 });
  await expect(screen.locator('#scParty')).toContainText('Ada');
  await expect(screen.locator('#panel')).toBeHidden();
  // it gets what players get: none of the DM's desk (the default campaign the client makes is empty)
  expect(await screen.evaluate(() => { const c = window.DreadDelve.get().campaign; return { screen:window.DreadDelve.ui.screen, maps:c?.maps, notes:JSON.stringify(c?.notes || {}) }; })).toEqual({ screen:true, maps:undefined, notes:'{}' });
  await openNight(page);
  await expect(page.locator('#tabBody')).toContainText('1 screen connected');
  // read aloud
  await page.locator('#ntTitle').fill('The Hollow Refectory');
  await page.locator('#ntText').fill('Long tables, set for a feast nobody came to.');
  await page.locator('[data-act="ntNarrate"]').click();
  await expect(screen.locator('#scOver')).toContainText('set for a feast nobody came to');
  if (SP) await screen.screenshot({ path:SP + '/n-narrate.png' });
  await page.locator('[data-act="ntClear"]').click();
  await expect(screen.locator('#scOver')).toBeHidden();
  // lights out, and back
  await page.locator('[data-act="ntMode"][data-k="dark"]').click();
  await expect(screen.locator('#scDark')).toBeVisible();
  await page.locator('[data-act="ntMode"][data-k="map"]').click();
  await expect(screen.locator('#scDark')).toBeHidden();
  // introduce the zombie (its forged face, if it has one)
  await page.locator('#ntLine').fill('It shuffles out of the dark, still wearing its apron.');
  await page.locator('[data-act="ntIntro"]').first().click();
  await expect(screen.locator('#scOver')).toContainText('still wearing its apron');
  if (SP) await screen.screenshot({ path:SP + '/n-intro.png' });
  await page.locator('[data-act="ntClear"]').click();
  // a fight: the screen's ribbon shows the order
  await frameMap(page);
  await page.getByRole('button', { name:/Start a fight/ }).click();
  await page.locator('#fightBox [data-act="fightGo"]').click();
  await expect(screen.locator('#scRibbon')).toContainText('Round 1');
  await expect(screen.locator('#scRibbon .sc-ini')).toHaveCount(3);
  if (SP) await screen.screenshot({ path:SP + '/n-fight.png' });
  // real dice: the DM taps what the player rolled
  await openNight(page);
  await page.locator('[data-act="ntDice"]').click();
  await frameMap(page);
  await selectHero(page);
  await page.locator('#selCard [data-act="atk"]').first().click();
  await clickTile(page, 7, 10);   // the zombie, beside her
  await expect(page.locator('#dieModal')).toBeVisible();
  await page.locator('#dieBox [data-die="17"]').click();
  await expect(page.locator('#cardLayer')).toContainText('at the table');
  await expect(screen.locator('#cardLayer')).toContainText('at the table');
  expect(errors).toEqual([]);
});

test('a player\'s phone as a hero card: no map, big buttons, a target list, a real d20', async ({ page:dm, browser, baseURL }) => {
  test.setTimeout(150_000);
  await arena(dm);
  await dm.evaluate(() => { const D = window.DreadDelve; D.placeMonster('zombie', { floor:0, x:14, y:13 }); D.get().campaign.realDice = true; D.get().campaign.freeRolls = true; });
  await dm.locator('[data-act="tab"][data-k="table"]').click();
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  try {
    const player = await context.newPage();
    const errors = await preparePage(player);
    await player.locator('[data-act="thRole"][data-k="player"]').click();
    await player.locator('#pName').fill('Ada');
    await player.locator('#pWord').fill('e2e-secret');
    await player.locator('#joinCode').fill(code);
    await player.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect.poll(() => player.evaluate(() => window.DreadDelve.get()?.tokens.find(t => t.id === window.DreadDelve.ui.myToken)?.name)).toBe('Ada');
    if (!await player.evaluate(() => window.DreadDelve.ui.panelOpen)) await player.locator('#btnPanel').click();
    await player.locator('[data-act="cardOnly"]').click();
    await expect(player.locator('#stage')).toBeHidden();
    await expect(player.locator('.cbig')).toBeVisible();
    if (SP) await player.screenshot({ path:SP + '/n-card.png', fullPage:false });
    // a step west and back east on the pad
    await player.locator('[data-act="cardStep"][data-k="-1,0"]').click();
    await expect.poll(() => dm.evaluate(() => window.DreadDelve.get().tokens.find(t => t.name === 'Ada').x)).toBe(5);
    await player.locator('[data-act="cardStep"][data-k="1,0"]').click();
    await expect.poll(() => dm.evaluate(() => window.DreadDelve.get().tokens.find(t => t.name === 'Ada').x)).toBe(6);
    // the zombie lurches up beside her; attack it: pick it from the list, then type the real d20
    await dm.evaluate(() => { const D = window.DreadDelve, z = D.get().tokens.find(t => t.kind === 'monster'); z.x = 7; z.y = 10; });
    await dm.evaluate(() => window.DreadDelve.setDread(window.DreadDelve.get().dread));   // nudge a state push
    await expect.poll(() => player.evaluate(() => window.DreadDelve.get().tokens.find(t => t.kind === 'monster')?.x)).toBe(7);
    await player.locator('[data-act="cardAct"][data-k="atk"]').first().click();
    await expect(player.locator('#pickBox')).toContainText('Zombie');
    await player.locator('#pickBox [data-pick="0"]').click();
    await player.locator('#dieBox [data-die="12"]').click();
    await expect(dm.locator('#cardLayer')).toContainText('at the table');
    await expect(player.locator('#cardLayer')).toContainText('at the table');
    expect(errors, 'Uncaught player browser errors').toEqual([]);
  } finally {
    await context.close();
  }
});
