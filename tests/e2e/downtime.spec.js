import { test, expect, arena } from './helpers.js';

// 🌙 Days off (engine/downtime.js, ChatGPT's): the DM picks a hero, a place, an activity and the days; the result lands on the sheet.
test('a tired hero recuperates in a village, works with a real die, and is told why training needs a teacher', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page);
  await page.evaluate(() => {
    const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Ilse'; h.id = 'ilse'; h.coins = { gp:20 };
    const t = D.applyCharacter(h); t.exhaustion = 1;
  });
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  await page.locator('[data-act="downtime"]').first().click();
  const m = page.locator('#downtimeModal');
  await expect(m).toBeVisible();
  // the arena is the wild: recuperating there is refused, with the reason
  await m.locator('[data-dtf="kind"]').selectOption('road');
  await expect(m.locator('.wsWhy')).toContainText('not the open road');
  await m.locator('[data-dtf="kind"]').selectOption('village');
  await expect(m.locator('.card')).toContainText('1.5 gp');          // three nights' lodging in a village
  await m.locator('[data-dt="go"]').click();
  await expect(m).toBeHidden();
  const after = await page.evaluate(() => { const D = window.DreadDelve, t = D.get().tokens.find(t => t.charId === 'ilse'), c = D.get().characters.ilse.coins; return { ex:t.exhaustion, gp:c.gp + c.sp / 10 + c.cp / 100 }; });
  expect(after.ex).toBe(0);
  expect(after.gp).toBeCloseTo(18.5, 2);
  // a week's work, with a real d20 (a 15 and Athletics: comfortable pay)
  await page.locator('[data-act="downtime"]').first().click();
  await m.locator('[data-dtf="kind"]').selectOption('village');
  await m.locator('[data-dt="act"][data-k="work"]').click();
  await m.locator('[data-dtf="days"]').fill('5'); await m.locator('[data-dtf="days"]').press('Tab');
  await m.locator('[data-dtf="skill"]').selectOption('Athletics');
  await m.locator('[data-dtf="real"]').check();
  await m.locator('[data-dtf="raw"]').fill('15'); await m.locator('[data-dtf="raw"]').press('Tab');
  await m.locator('[data-dt="go"]').click();
  await expect(m).toBeHidden();
  const paid = await page.evaluate(() => { const c = window.DreadDelve.get().characters.ilse.coins; return c.gp + c.sp / 10 + c.cp / 100; });
  expect(paid).toBeGreaterThan(18.5);
  // training needs someone to teach it
  await page.locator('[data-act="downtime"]').first().click();
  await m.locator('[data-dtf="kind"]').selectOption('village');
  await m.locator('[data-dt="act"][data-k="train"]').click();
  await m.locator('[data-dtf="learn"]').fill("Smith's Tools"); await m.locator('[data-dtf="learn"]').press('Tab');
  await expect(m.locator('.wsWhy')).toContainText('Nobody here can teach');
});
