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

// 🗣 A Calling's hero in its own voice (ChatGPT's data/calling-voices.js): a Huscarl's attack is one of a Huscarl's lines
test('a Huscarl attacks and says a Huscarl\'s line', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  const ids = await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); Object.assign(h, { name:'Brannoc', lvl:3, calling:'huscarl' });
    const t = D.applyCharacter(h); Object.assign(t, { floor:0, x:6, y:11 }); D.placeMonster('wolf', { floor:0, x:7, y:11 });
    return { me:t.id, wolf:D.get().tokens.find(o => o.bid === 'wolf').id, lines:['attack', 'hit', 'miss', 'critical'].flatMap(k => D.callingLines('huscarl', k)) }; });
  expect(ids.lines.length).toBeGreaterThan(1);
  await page.evaluate(({ me, wolf }) => window.DreadDelve.doAttack(me, wolf, 0), ids);
  const cap = page.locator('#voiceCap.on');
  await expect(cap).toBeVisible();
  const said = (await cap.textContent()).replace(/^Brannoc:\s*/, '').trim();
  expect(ids.lines).toContain(said);
});
