import { test, expect, arena } from './helpers.js';

// 🎒 Codex's inventory engine at the table: an old sheet gets a pack; magic gear counts on the hero's token.
test('the DM gives a fighter a +2 longsword and a Cloak of Protection, and the numbers follow', async ({ page }) => {
  test.setTimeout(150_000);   // a dozen taps on a 3D page with a software renderer: ~3 s each here (the panel itself draws in ~7 ms)
  await arena(page);
  const before = await page.evaluate(() => {
    const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Ilse'; h.id = 'ilse';
    const t = D.applyCharacter(h);
    return { ac:t.ac, hit:t.attacks.find(a => a.n === 'Longsword').b, dmg:t.attacks.find(a => a.n === 'Longsword').d };
  });
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  const pack = page.locator('details.pack[data-pack="ilse"]');
  await pack.locator('summary').click();
  // the pack was made from the sheet's own armour, shield and weapons
  await expect(pack.locator('.packRow.on')).toHaveCount(4);
  await expect(pack).toContainText('Chain Mail');

  const add = async name => { await pack.locator('#packAdd-ilse').fill(name); await pack.locator('[data-act="pack"][data-k="add"]').click(); };
  const row = name => page.locator('details.pack[data-pack="ilse"] .packRow', { hasText:name });
  // swap the plain longsword for a +2 one
  await row('Longsword').filter({ hasNotText:'+2' }).locator('[data-k="equip"]').click();
  await add('Longsword, +2');
  await row('Longsword, +2').locator('[data-k="equip"]').click();
  await expect(row('Longsword, +2')).toContainText('In hand');
  // a Cloak of Protection: worn does nothing until attuned
  await add('Cloak of Protection');
  await row('Cloak of Protection').locator('[data-k="equip"]').click();
  let t = await page.evaluate(() => window.DreadDelve.get().tokens.find(t => t.charId === 'ilse').ac);
  expect(t).toBe(before.ac);
  await row('Cloak of Protection').locator('[data-k="attune"]').click();
  await expect(row('Cloak of Protection')).toContainText('attuned');
  await expect(pack).toContainText('Counting: AC +1');

  const after = await page.evaluate(() => {
    const t = window.DreadDelve.get().tokens.find(t => t.charId === 'ilse'), a = t.attacks.find(a => a.n === 'Longsword, +2');
    return { ac:t.ac, hit:a?.b, dmg:a?.d, plain:t.attacks.some(a => a.n === 'Longsword'), saved:window.DreadDelve.get().characters.ilse.weapons };
  });
  expect(after.ac).toBe(before.ac + 1);
  expect(after.hit).toBe(before.hit + 2);
  expect(after.dmg).toBe('1d8+5');
  expect(after.plain).toBe(false);
  expect(after.saved).toContain('Longsword');   // the creator's fields mirror what's in hand

  // coins: weight and worth
  await pack.locator('[data-edit="packCoin"][data-k="gp"]').fill('150');
  await pack.locator('[data-edit="packCoin"][data-k="gp"]').press('Tab');
  await expect(page.locator('details.pack[data-pack="ilse"] summary')).toContainText('150 gp');
});
