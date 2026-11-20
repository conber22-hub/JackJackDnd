import { test, expect, preparePage, arena } from './helpers.js';

// ⛨ Dread Delve's own rules (docs/homebrew/callings.md): the creator offers the Callings, their Paths, the Origins and
// our backgrounds (ChatGPT's data); a hero made from them plays with the Calling's features (game/calling.js,
// game/mechfx.js) and is named by them; the Classic switch gives the D&D classes back.
test('a Vanguard of the Hoplite Path, from the far-future Drawn, is made in the creator and plays as one', async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:900 } });
  const page = await context.newPage();
  const errors = await preparePage(page, { rules:'dread' });
  try {
    await arena(page);
    if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
    await page.locator('[data-act="tab"][data-k="tokens"]').click();
    await page.locator('[data-act="dmNewChar"]').first().click();
    const box = page.locator('#charBox');
    await expect(box.locator('select[data-cf="calling"] option')).toHaveCount(12);
    await expect(box.locator('select[data-cf="cls"]')).toHaveCount(0);
    await box.locator('select[data-cf="calling"]').selectOption('vanguard');
    await box.locator('select[data-cf="lvl"]').selectOption('3');
    await box.locator('select[data-cf="path"]').selectOption('hoplite');
    await expect(box.locator('.cr-calling')).toContainText('Ward');
    await box.locator('select[data-cf="origin"]').selectOption('drawn-future');
    await expect(box).toContainText('Failing Night-Sight');
    await box.locator('select[data-cf="back"]').selectOption('levy-veteran');
    await expect(box).toContainText('Hold the Line');
    // the sheet beside it, in our words: the Calling and Path, the Origin, no D&D class or subclass
    const sheet = box.locator('.sheet');
    await expect(sheet).toContainText('Vanguard · Hoplite 3');
    await expect(sheet).toContainText('Last Signal');
    await expect(sheet).toContainText('Shield Rim');
    await expect(sheet).not.toContainText('Champion');
    await expect(sheet).not.toContainText('Fighter');
    // the Seep-touched Path says its price
    await expect(box.locator('select[data-cf="path"] option', { hasText:'☣' })).toHaveCount(1);
    await box.locator('input[data-cf="name"]').fill('Brannoc');
    await box.locator('input[data-cf="name"]').dispatchEvent('change');
    await box.locator('[data-cr="save"]').first().click();
    const t = await page.evaluate(() => { const D = window.DreadDelve, t = D.get().tokens.find(x => x.name === 'Brannoc'), sh = D.get().characters[t.charId];
      return { calling:t.calling, path:t.path, callName:t.callName, ward:t.ward, mechs:t.mechs.map(m => m.src), sw:(t.resources || []).find(r => r.dd === 'Second Wind')?.n, cls:t.cls,
        origin:sh.origin, back:sh.back, sp:sh.sp, bg:sh.bg }; });
    expect(t).toMatchObject({ calling:'vanguard', path:'hoplite', callName:'Vanguard · Hoplite', ward:{ max:10, now:10 }, origin:'drawn-future', back:'levy-veteran', sp:'Orc', bg:'Soldier' });
    expect(t.cls).toMatch(/^Fighter 3/);                  // the chassis underneath
    expect(t.mechs).toEqual(expect.arrayContaining(['Ward', 'Shield Rim']));
    expect(t.sw).toBeTruthy(); expect(t.sw).not.toBe('Second Wind');   // the chassis's feature in our words
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('the Classic switch gives the D&D classes back, and a classic hero has no Calling', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:900 } });
  const page = await context.newPage();
  const errors = await preparePage(page, { rules:'dread' });
  try {
    await arena(page);
    if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
    await page.locator('[data-act="tab"][data-k="tokens"]').click();
    await page.locator('[data-act="dmNewChar"]').first().click();
    const box = page.locator('#charBox');
    await box.locator('[data-cr="rules"][data-k="classic"]').click();
    await expect(box.locator('select[data-cf="cls"]')).toBeVisible();
    await expect(box.locator('select[data-cf="calling"]')).toHaveCount(0);
    await box.locator('select[data-cf="cls"]').selectOption('Rogue');
    await box.locator('input[data-cf="name"]').fill('Mirela');
    await box.locator('input[data-cf="name"]').dispatchEvent('change');
    await box.locator('[data-cr="save"]').first().click();
    const t = await page.evaluate(() => { const t = window.DreadDelve.get().tokens.find(x => x.name === 'Mirela'); return { calling:t.calling, mechs:(t.mechs || []).length, cls:t.cls }; });
    expect(t).toMatchObject({ calling:null, mechs:0 }); expect(t.cls).toMatch(/^Rogue/);
    expect(await page.evaluate(() => localStorage.getItem('dreaddelve.rules.v1'))).toBe('classic');
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});
