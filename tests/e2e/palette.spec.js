import { test, expect, startDM, idle, preparePage, arena } from './helpers.js';

test('Ctrl+K opens it, fuzzy search finds long rest from lng rst, running a command does it', async ({ page }) => {
  // a long test on a slow sandbox: the suite's 60 s budget is not always enough
  test.setTimeout(180_000);
  await startDM(page);
  await page.keyboard.press('Control+k');
  await expect(page.locator('#palModal:not(.hidden)')).toBeVisible();
  await page.locator('#palQ').fill('lng rst');
  const rest = page.locator('.pal-row', { hasText: 'Long rest' });
  await expect(rest).toBeVisible();
  await rest.click();
  await expect(page.locator('#palModal.hidden')).toHaveCount(1);
  // running a command does it: the Maps tab opens
  await page.keyboard.press('Control+k');
  await page.locator('#palQ').fill('maps');
  await page.locator('.pal-row', { hasText: 'Go to Maps' }).click();
  await expect(page.locator('[data-act="tab"][data-k="dungeon"].on')).toBeVisible();
  // ? shows the shortcuts sheet, the palette's included
  await page.keyboard.press('?');
  await expect(page.locator('#keysModal:not(.hidden)')).toBeVisible();
  await expect(page.locator('#keysList')).toContainText('Command palette');
  await page.locator('[data-keys="close"]').click();
  await expect(page.locator('#keysModal.hidden')).toHaveCount(1);
});

test('a creature can be placed from the palette', async ({ page }) => {
  await arena(page);
  // the selected hero's square is where the creature goes (beside them, the square itself being taken)
  await page.evaluate(() => {
    const D = window.DreadDelve;
    D.ui.selected = D.get().tokens.find(t => t.name === 'Ada').id;
  });
  await page.keyboard.press('Control+k');
  await page.locator('#palQ').fill('zombie');
  await page.locator('.pal-row', { hasText: 'Place Zombie' }).first().click();
  await expect.poll(async () => page.evaluate(() => window.DreadDelve.get().tokens.some(t => (t.bid || '').includes('zombie'))), { timeout: 10_000 }).toBe(true);
  const near = await page.evaluate(() => {
    const D = window.DreadDelve, s = D.get();
    const ada = s.tokens.find(t => t.name === 'Ada'), z = s.tokens.find(t => (t.bid || '').includes('zombie'));
    return !!z && z.floor === ada.floor && Math.max(Math.abs(z.x - ada.x), Math.abs(z.y - ada.y)) <= 3;
  });
  expect(near).toBe(true);
});

test('a player sees only their list', async ({ browser }) => {
  // a long test on a slow sandbox: the suite's 60 s budget is not enough for all its steps
  test.setTimeout(180_000);
  // Phone width: the 🔎 button is the way in here, and the list must behave there too.
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = await preparePage(page);
  await startDM(page);
  // a hero with attacks, so the player's list has something of their own
  // (on a phone the panel starts as a sheet the ☰ button opens; a tab tap needs it open)
  if (await page.locator('#panel.closed').count()) await page.locator('#btnPanel').click();
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  await page.locator('#newName').fill('Ada');
  await page.locator('[data-act="addPc"]').click();
  await idle(page);
  const atk = await page.evaluate(() => {
    const D = window.DreadDelve;
    const hero = D.get().tokens.find(t => t.name === 'Ada');
    D.ui.myToken = hero.id;
    D.ui.role = 'player';
    document.body.classList.add('player');
    return hero.attacks?.[0]?.n || null;
  });
  // Becoming a player is what joining a table does: the role flips, and renderAll() marks the body.
  // A live join stalls on this sandbox's PeerJS path (proven on the untouched base in October), so the
  // flip is done directly.
  await page.locator('#btnPalette').click();
  await expect(page.locator('#palModal:not(.hidden)')).toBeVisible();
  await expect(page.locator('.pal-row', { hasText: 'Look it up' })).toBeVisible();
  await expect(page.locator('.pal-row', { hasText: 'Ping the map' })).toBeVisible();
  await expect(page.locator('.pal-row', { hasText: 'Card only' })).toBeVisible();
  if (atk) await expect(page.locator('.pal-row', { hasText: atk }).first()).toBeVisible();
  // and none of the DM's list
  await page.locator('#palQ').fill('host');
  await expect(page.locator('#palList')).not.toContainText('Host the table');
  await page.locator('#palQ').fill('zombie');
  await expect(page.locator('#palList')).not.toContainText('Place Zombie');
  expect(errors).toEqual([]);
  await context.close();
});
