import { test, expect, arena } from './helpers.js';

// 🌙 A night's rest (engine/rest.js, ChatGPT's): where they sleep and who keeps watch; the odds before they sleep;
// a fight breaks the rest, anything else gives it back (half the Hit Dice on the open road).
test('the long rest asks where and who keeps watch, shows the odds, and the night gives back what it should', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page);
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Ilse'; h.id = 'ilse'; const t = D.applyCharacter(h); t.hp = 3; t.exhaustion = 1; });
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  await page.locator('[data-act="longRest"]').first().click();
  const m = page.locator('#restModal');
  await expect(m).toBeVisible();
  await m.locator('[data-rsf="kind"]').selectOption('inn');
  await expect(m.locator('.card')).toContainText('% chance');
  const innOdds = await m.locator('.card b').first().innerText();
  await m.locator('[data-rsf="kind"]').selectOption('road');
  await expect(m.locator('.card')).toContainText('poor');
  const roadOdds = await m.locator('.card b').first().innerText();
  expect(parseInt(roadOdds)).toBeGreaterThan(parseInt(innOdds));   // the open road is worse than an inn
  // sleep at the inn: unless a fight came, HP is full and a level of exhaustion is gone
  await m.locator('[data-rsf="kind"]').selectOption('inn');
  await m.locator('[data-rs="sleep"]').click();
  await expect(m).toBeHidden();
  const r = await page.evaluate(() => { const D = window.DreadDelve, t = D.get().tokens.find(t => t.charId === 'ilse'); return { hp:t.hp, max:t.maxHp, ex:t.exhaustion || 0, broken:D.get().campaign.lastRest?.broken }; });
  if (r.broken) expect(r.hp).toBe(3);
  else { expect(r.hp).toBe(r.max); expect(r.ex).toBe(0); }
  // the engine's own odds, straight: a road camp with nobody on watch at Gaze 8 is worse than an inn with a watch at Gaze 1
  const odds = await page.evaluate(() => { const D = window.DreadDelve; D.get().dread = 8; const road = D.preview('road', []).chance; D.get().dread = 1; const inn = D.preview('inn', [D.get().tokens.find(t => t.charId === 'ilse').id]).chance; return { road, inn }; });
  expect(odds.road).toBeGreaterThan(odds.inn);
});
