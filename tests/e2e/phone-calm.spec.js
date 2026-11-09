import { test, expect, preparePage, startDM } from './helpers.js';

// A player's phone (ui/hud.js): one card at a time, the next waiting behind it; nothing fades before it's read;
// the last ones are kept under 🗂. (Cards arrive the way the table sends them: net/table.js's message handler.)
test("a player's phone shows one card at a time, keeps the rest waiting, and keeps them all under 🗂", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL:'http://127.0.0.1:4173', viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  const page = await context.newPage(); const errors = await preparePage(page); await startDM(page);
  await page.evaluate(() => { const D = window.DreadDelve; D.ui.role = 'player'; document.body.classList.add('player'); document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove()); });
  await page.evaluate(() => ['The wolf bites', 'A door creaks', 'Strahd watches'].forEach(t => window.DreadDelve.onClientMsg({ t:'card', c:{ title:t, lines:['…'] } })));
  const cards = page.locator('#cardLayer .pop');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('The wolf bites');
  await expect(cards.first()).toContainText('+2 more');
  await page.waitForTimeout(9000);                                  // longer than a card used to last: still there
  await expect(cards).toHaveCount(1);
  await cards.first().click();
  await expect(cards.first()).toContainText('A door creaks');
  await cards.first().click();
  await expect(cards.first()).toContainText('Strahd watches');
  await cards.first().click();
  await expect(cards).toHaveCount(0);
  await page.locator('#recentBtn').click();                        // and every one of them is kept
  await expect(page.locator('#recentModal .recent-card')).toHaveCount(3);
  expect(errors).toEqual([]);
  await context.close();
});
