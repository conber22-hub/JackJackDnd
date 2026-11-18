import { test, expect, preparePage, arena } from './helpers.js';

// 🏆 A fight won at the DM's table (game/combat.js checkVictory → game/record.js → net/table.js): every seated player's
// phone gets the victory screen (Muse's ui/victory.js) with the fight's headline and their own numbers, recorded from
// the blows as they fell; Ⓑ / Escape puts it away.
test('a fight won at the table puts the victory screen on the players\' phones', async ({ page:dm, browser, baseURL }) => {
  test.setTimeout(300_000);
  await arena(dm, []);
  await dm.evaluate(() => { const D = window.DreadDelve; D.get().campaign.freeRolls = true;
    const h = D.newHero('Fighter'); h.name = 'Ada'; h.id = 'ada-win'; const t = D.applyCharacter(h, { owner:'Ada' }); t.floor = 0; t.x = 6; t.y = 10; });
  await dm.locator('[data-act="tab"][data-k="table"]').click();
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  try {
    const p = await context.newPage();
    const errors = await preparePage(p);
    await p.locator('[data-act="thRole"][data-k="player"]').click();
    await p.locator('#pName').fill('Ada');
    await p.locator('#pWord').fill('e2e-secret');
    await p.locator('#joinCode').fill(code);
    await p.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect.poll(() => p.evaluate(() => { const D = window.DreadDelve; return D.get()?.tokens.find(t => t.id === D.ui.myToken)?.name || null; }), { timeout:30_000 }).toBe('Ada');
    // a wolf, a fight, Ada's blow, and it falls
    await dm.evaluate(() => { const D = window.DreadDelve; const z = D.placeMonster('wolf', { floor:0, x:7, y:10 }); z.hp = 1; z.ac = 1; D.rollInitiative({ ids:[z.id, D.get().tokens.find(t => t.name === 'Ada').id] }); });
    await dm.evaluate(() => { const D = window.DreadDelve, a = D.get().tokens.find(t => t.name === 'Ada'), z = D.get().tokens.find(t => t.bid === 'wolf');
      for (let k = 0; k < 6 && !z.dead; k++) D.doAttack(a.id, z.id, 0); if (!z.dead) D.applyDamage(z, 99, 'slashing', a); });
    await expect(p.locator('#victory')).toBeVisible({ timeout:30_000 });
    await expect(p.locator('#victory')).not.toBeEmpty();
    await p.keyboard.press('Escape');
    await expect(p.locator('#victory')).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});

// 📱 A seated player's phone draws the blow's number over whoever took it (ui/fightfx.js remoteBlow)
test('a player\'s phone shows the numbers of the blows the DM\'s table rolls', async ({ page:dm, browser, baseURL }) => {
  test.setTimeout(300_000);
  await arena(dm, []);
  await dm.evaluate(() => { const D = window.DreadDelve; D.get().campaign.freeRolls = true;
    const h = D.newHero('Fighter'); h.name = 'Ada'; h.id = 'ada-num'; const t = D.applyCharacter(h, { owner:'Ada' }); t.floor = 0; t.x = 6; t.y = 10; });
  await dm.locator('[data-act="tab"][data-k="table"]').click();
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  try {
    const p = await context.newPage();
    const errors = await preparePage(p);
    await p.locator('[data-act="thRole"][data-k="player"]').click();
    await p.locator('#pName').fill('Ada'); await p.locator('#pWord').fill('e2e-secret'); await p.locator('#joinCode').fill(code);
    await p.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect.poll(() => p.evaluate(() => { const D = window.DreadDelve; return D.get()?.tokens.find(t => t.id === D.ui.myToken)?.name || null; }), { timeout:30_000 }).toBe('Ada');
    const before = await p.evaluate(() => window.DreadDelve.fightFxCount().floats);
    await dm.evaluate(() => { const D = window.DreadDelve; const w = D.placeMonster('wolf', { floor:0, x:7, y:10 }); w.hp = w.maxHp = 300; w.ac = 1;
      const a = D.get().tokens.find(t => t.name === 'Ada'); D.rollInitiative({ ids:[w.id, a.id] }); D.doAttack(a.id, w.id, 0); });
    await expect.poll(() => p.evaluate(() => window.DreadDelve.fightFxCount().floats), { timeout:30_000 }).toBeGreaterThan(before);
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});
