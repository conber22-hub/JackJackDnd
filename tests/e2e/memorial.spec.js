import { test, expect } from './helpers.js';

// 🔥 The Dutch Oven and Dutcher's cairn, in memory of Chance (data/memorial.js, engine/settlement.js, game/wander.js):
// the village has them; stepping in tells the story once; a night there says so; and a fallen party wakes by its fire.
async function wander(page){
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-oven';
    localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-oven"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
}
const roomNamed = (page, name) => page.evaluate(n => { const r = window.DreadDelve.get().floors[0].rooms.find(x => x.name === n); return r ? { x:r.x, y:r.y, w:r.w, h:r.h, cx:r.cx, cy:r.cy } : null; }, name);
const inRoom = (page, name) => page.evaluate(n => { const D = window.DreadDelve, h = D.wander.hero(), r = D.get().floors[h.floor].rooms.find(x => x.name === n);
  return !!r && h.x >= r.x && h.x < r.x + r.w && h.y >= r.y && h.y < r.y + r.h; }, name);
const put = (page, name) => page.evaluate(n => { const D = window.DreadDelve, h = D.wander.hero(), r = D.get().floors[0].rooms.find(x => x.name === n), at = D.nearestOpen(0, r.cx, r.cy);
  h.floor = 0; h.x = at.x; h.y = at.y; D.syncTokens(); }, name);

test('the village has the Dutch Oven and Dutcher\'s cairn; each tells its story once, and a night at the Oven is warm', async ({ page }) => {
  test.setTimeout(240_000);
  await wander(page);
  expect(await roomNamed(page, 'The Dutch Oven')).not.toBeNull();
  expect(await roomNamed(page, 'Dutcher\'s cairn')).not.toBeNull();
  // step into the Oven: its card, once
  await put(page, 'The Dutch Oven');
  await expect(page.locator('#cardLayer .pop').filter({ hasText:'The Dutch Oven' })).toBeVisible({ timeout:15_000 });
  await expect(page.locator('#cardLayer')).toContainText('Dutcher');
  // rest the night there
  await page.evaluate(() => window.DreadDelve.wander.rest());
  await expect(page.locator('#cardLayer')).toContainText('A night at The Dutch Oven');
  // the cairn
  await put(page, 'Dutcher\'s cairn');
  await expect(page.locator('#cardLayer')).toContainText('Dutcher\'s cairn', { timeout:15_000 });
  await expect(page.locator('#cardLayer')).toContainText('held it');
  // back into the Oven: no second card
  await page.evaluate(() => document.querySelectorAll('#cardLayer .pop').forEach(n => n.remove()));
  await put(page, 'The Dutch Oven');
  await page.waitForTimeout(2500);
  await expect(page.locator('#cardLayer .pop').filter({ hasText:'Over the oven' })).toHaveCount(0);
});

test('a fallen party is told it will wake at the Dutch Oven, and wakes by its fire', async ({ page }) => {
  test.setTimeout(240_000);
  await wander(page);
  // a fight on the square, lost
  await page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), f = D.get().floors[h.floor];
    for (const fl of D.get().floors) for (const p of fl.folk || []) p.gone = true; w.rt.talk = null;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]){ const x = h.x + dx, y = h.y + dy;
      if (f.grid[y * f.W + x] && !D.get().tokens.some(t => t.floor === h.floor && t.x === x && t.y === y)){ D.placeMonster('wolf', { floor:h.floor, x, y }); break; } }
    w.beginFight('none', D.get().tokens.filter(t => t.kind === 'monster').map(t => t.id)); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.wander.myTurn() && !window.DreadDelve.wander.opening() && !window.DreadDelve.busy()), { timeout:60_000 }).toBe(true);
  await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster'); D.applyDamage(h, 999, 'piercing', w.id); });
  await expect(page.locator('#defeat')).toBeVisible({ timeout:90_000 });
  await expect(page.locator('#defeat')).toContainText('the Dutch Oven');
  await page.keyboard.press('Escape');
  await expect(page.locator('#defeat')).toHaveCount(0);
  await expect.poll(() => inRoom(page, 'The Dutch Oven'), { timeout:30_000 }).toBe(true);
  expect(await page.evaluate(() => { const h = window.DreadDelve.wander.hero(); return !h.dead && h.hp > 0; })).toBe(true);
});
