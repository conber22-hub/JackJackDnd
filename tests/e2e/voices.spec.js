import { test, expect, arena } from './helpers.js';

// 🗣 Action voices (ui/voices.js over ChatGPT's engine/action-voices.js): a hero's attack brings up a line as a caption;
// a wolf's, a sound's caption; and the planner's cooldown keeps a second line from following at once.
test('a hero attacks and says something; a wolf answers with a sound; the table is not drowned', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  const ids = await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('wolf', { floor:0, x:7, y:10 });
    const st = D.get(); return { ada:st.tokens.find(t => t.name === 'Ada').id, wolf:st.tokens.find(t => t.bid === 'wolf').id }; });
  await page.evaluate(({ ada, wolf }) => window.DreadDelve.doAttack(ada, wolf, 0), ids);
  const cap = page.locator('#voiceCap.on');
  await expect(cap).toBeVisible();
  const first = await cap.textContent();
  expect(first.length).toBeGreaterThan(3);
  await page.waitForTimeout(2200);                                   // past the table-wide gap, so the wolf may answer
  await page.evaluate(({ ada, wolf }) => window.DreadDelve.doAttack(wolf, ada, 0), ids);
  await expect.poll(() => page.locator('#voiceCap').textContent()).not.toBe(first);
});
