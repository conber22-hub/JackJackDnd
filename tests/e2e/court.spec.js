import { test, expect, arena, idle, frameMap, clickTile } from './helpers.js';

// The Count's Court: his named servants come to the table, fight, fall, and are remembered.
test('one of the Count\'s court is brought to the table, falls, and the court remembers', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
  await page.locator('[data-act="tab"][data-k="gaze"]').click();
  await expect(page.locator('#tabBody')).toContainText("The Count's Court");
  const first = page.locator('[data-act="nemPlace"]').first(), id = await first.getAttribute('data-id');
  await first.click();
  const boss = await page.evaluate(id => window.DreadDelve.get().tokens.find(t => t.nem === id), id);
  expect(boss, 'it is on the map').toBeTruthy();
  expect(await page.evaluate(id => window.DreadDelve.get().tokens.filter(t => t.kind === 'monster').length, id)).toBeGreaterThan(1);   // with its followers
  // it goes down to a blow from Ada: the mist takes it, or it is finished; either way it remembers her
  await page.evaluate(id => { const D = window.DreadDelve, s = D.get(), t = s.tokens.find(t => t.nem === id), ada = s.tokens.find(t => t.name === 'Ada');
    t.flags.relentUsed = true; D.applyDamage(t, 9999, 'slashing', ada); }, id);
  await expect(page.locator('#cardLayer')).toContainText(/falls|finished/);
  const m = await page.evaluate(id => window.DreadDelve.get().campaign.court.members.find(m => m.id === id), id);
  expect(m.alive).toBe(false); expect(m.grudge.hero).toBe('Ada');
  // the court moves on its own
  await page.locator('[data-act="courtDay"]').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().campaign.court.turns)).toBeGreaterThan(0);
  // and he can be seen, on cue
  await page.locator('[data-act="watcher"]').click();
  expect(await page.evaluate(() => !!window.DreadDelve.get().watcher)).toBe(true);
});

test('the DM lays deep mist with the Build tab', async ({ page }) => {
  await arena(page);
  await frameMap(page);
  if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
  await page.locator('[data-act="tab"][data-k="build"]').click();
  if (await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
  await page.locator('#dock [data-act="mode:mist"]').click();
  await clickTile(page, 10, 10);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().floors[0].mists?.includes(10 * 32 + 10))).toBe(true);
  await clickTile(page, 10, 10);   // a stroke that starts on mist clears it
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().floors[0].mists?.includes(10 * 32 + 10))).toBe(false);
});

test('the Mist Wall turns a hero around', async ({ page }) => {
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'The Mist Wall', seed:'e2e-mists', floors:1, size:40, template:'landmark', place:'mists', party:true }, false);
    document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove());
  });
  await idle(page);
  const go = await page.evaluate(() => { const D = window.DreadDelve, s = D.get(), f = s.floors[0], t = s.tokens.find(t => t.kind === 'pc');
    const i = f.mistWall[Math.floor(f.mistWall.length / 2)]; D.ui.freeMove = true; return { from:{ x:t.x, y:t.y }, to:{ x:i % f.W, y:(i / f.W) | 0 }, id:t.id }; });
  await page.evaluate(go => { const D = window.DreadDelve, t = D.get().tokens.find(t => t.id === go.id); D.doMove(t, go.to.x, go.to.y); }, go);
  await expect(page.locator('#cardLayer')).toContainText('The Mists turn', { timeout:30_000 });
  await expect.poll(() => page.evaluate(id => { const t = window.DreadDelve.get().tokens.find(t => t.id === id); return { x:t.x, y:t.y }; }, go.id)).toEqual(go.from);
});
