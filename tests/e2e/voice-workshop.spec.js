import { test, expect, preparePage, arena } from './helpers.js';

// 🗣 The voice workshop (ui/voiceworkshop.js, game/voiceworkshop.js over ChatGPT's engine/voice-workshop.js): a player
// writes their own hero's lines on their phone, hears one, and sends them; the DM approves them in the Table tab, and the
// hero says the line at the table. A later change the DM sends back leaves the approved lines in use.
test('a player writes their hero\'s lines, the DM approves them, and the hero says them', async ({ page:dm, browser, baseURL }) => {
  test.setTimeout(180_000);
  await arena(dm);
  await dm.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Ada'; h.id = 'ada-voice'; D.applyCharacter(h, { owner:'Ada' }); });
  await dm.locator('[data-act="tab"][data-k="table"]').click();
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  await expect(dm.locator('#panel')).toContainText('🗣 Voices');
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  try {
    const player = await context.newPage();
    const errors = await preparePage(player);
    await player.locator('[data-act="thRole"][data-k="player"]').click();
    await player.locator('#pName').fill('Ada');
    await player.locator('#pWord').fill('e2e-secret');
    await player.locator('#joinCode').fill(code);
    await player.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect(player.locator('#startModal')).toBeHidden();
    await expect.poll(() => player.evaluate(() => window.DreadDelve.ui.myHeroId)).toBe('ada-voice');
    // The player's editor: a hit line can name one of Ada's own weapons; a line for when she's hurt; hear it here first.
    await player.locator('[data-act="tab"][data-k="hero"]').click();
    await player.locator('[data-act="vwOpen"]').click();
    const ed = player.locator('#voiceWorkshop');
    await expect(ed).toContainText('No lines yet');
    await ed.locator('[data-act="vwAdd"]').click();
    expect(await ed.locator('.vw-line').first().locator('[data-vw="action"] option').count()).toBeGreaterThan(1);
    await ed.locator('.vw-line').first().locator('[data-vw="text"]').fill('Through the guard, {target}!');
    await ed.locator('[data-act="vwAdd"]').click();
    const hurt = ed.locator('.vw-line').nth(1);
    await hurt.locator('[data-vw="trigger"]').selectOption('hurt');
    await hurt.locator('[data-vw="text"]').fill('Is that all, Count?');
    await hurt.locator('[data-act="vwHear"]').click();
    await expect(player.locator('#voiceCap.on')).toContainText('Is that all, Count?');
    await ed.locator('[data-act="vwSend"]').click();
    await expect(ed.locator('#vwStatus')).toContainText('With the DM');
    // The DM reads them in the Table tab and approves them; the player hears so.
    const card = dm.locator('.vw-review', { hasText:'Is that all, Count?' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Ada');
    await card.locator('[data-act="vwApprove"]').click();
    await expect(ed.locator('#vwStatus')).toContainText('approved 2 lines');
    // At the table: Ada is hurt and says her own line.
    await dm.evaluate(() => { const D = window.DreadDelve; D.applyDamage(D.get().tokens.find(t => t.name === 'Ada'), 1); });
    await expect(dm.locator('#voiceCap.on')).toContainText('Ada: Is that all, Count?');
    // A change the DM sends back: the player sees it back with them, and the approved lines stay.
    await hurt.locator('[data-vw="text"]').fill('Not yet, not here.');
    await ed.locator('[data-act="vwSend"]').click();
    await expect(ed.locator('#vwStatus')).toContainText('With the DM');
    await dm.locator('.vw-review', { hasText:'Not yet, not here.' }).locator('[data-act="vwReturn"]').click();
    await expect(ed.locator('#vwStatus')).toContainText('sent these back');
    await expect(ed.locator('.vw-line').nth(1).locator('[data-vw="text"]')).toHaveValue('Not yet, not here.');   // their draft, to rework
    const published = await dm.evaluate(() => window.DreadDelve.get().campaign.voiceWorkshop.entries[0].published.lines.map(l => l.text));
    expect(published).toEqual(['Through the guard, {target}!', 'Is that all, Count?']);
    await expect(dm.locator('.vw-review')).toHaveCount(0);
    // The campaign (and the lines in it) never goes to the players.
    expect(await player.evaluate(() => window.DreadDelve.get().campaign?.voiceWorkshop)).toBeFalsy();
    expect(errors, 'Uncaught player browser errors').toEqual([]);
  } finally {
    await context.close();
  }
});
