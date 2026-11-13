import { test, expect } from './helpers.js';

// 🗡 The Wanderer (game/wander.js, ui/wander.js, engine/wander.js, engine/pad.js): playing with the game as the DM.
// A hero from this browser wakes in the Village of Barovia, walks with the keys, wins Ilse Varga over, takes the road,
// is ambushed by the director and fights it out turn by turn (Ilse and the creatures acting on their own), then
// leaves to the start page and carries on, while the DM's own save slot is never touched.
const idbGet = (page, key) => page.evaluate(k => new Promise(res => {
  const rq = indexedDB.open('keyval-store');
  rq.onsuccess = () => { try { const g = rq.result.transaction('keyval').objectStore('keyval').get(k); g.onsuccess = () => res(g.result ?? null); g.onerror = () => res(null); } catch { res(null); } };
  rq.onerror = () => res(null);
}), key);
const st = page => page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero();
  return { map:D.get().meta.name, hero:h && { x:h.x, y:h.y, hp:h.hp, floor:h.floor }, party:w.members().map(m => m.name), fight:D.get().combat.active, xp:w.W()?.xp ?? null, ambushes:w.W()?.ambushes ?? null }; });

test('a hero walks the valley alone: a companion won over, an ambush on the road, a fight, and carrying on later', async ({ page }) => {
  test.setTimeout(420_000);
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-wd'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-wd"]').click();
  await expect(page.locator('#startModal')).toBeHidden();
  await expect(page.locator('#wanderHud')).toBeVisible();
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
  await expect(page.locator('#topbar')).toBeHidden();
  await expect(page.locator('#wdParty')).toContainText('Vasha');
  // the keys walk
  const x0 = (await st(page)).hero.x;
  await page.keyboard.press('Escape');   // (the waking card)
  await expect.poll(async () => { await page.keyboard.press('a'); return (await st(page)).hero.x; }, { timeout:15_000 }).toBeLessThan(x0);

  // Ilse waits in the square: walk up, Ⓐ to talk, and win her over (the d20 comes up 20)
  await expect.poll(async () => page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), il = D.get().tokens.find(t => t.flags?.companion === 'ilse');
    if (Math.max(Math.abs(h.x - il.x), Math.abs(h.y - il.y)) <= 1) return true;
    w.walkTo(il.x, il.y); return false; }), { timeout:60_000, intervals:[2500] }).toBe(true);
  await expect(page.locator('#wdPrompt')).toContainText('Talk to Ilse Varga');
  await page.keyboard.press('Space');
  await expect(page.locator('#wdTalk')).toContainText('Ilse Varga');
  await page.evaluate(() => { window.__rand = Math.random; Math.random = () => .999; });
  await page.locator('#wdTalk [data-act="wdSay"][data-k="pitch"]').click();
  await page.evaluate(() => { Math.random = window.__rand; });
  await expect(page.locator('#wdTalk')).toBeHidden();
  await expect(page.locator('#wdParty')).toContainText('Ilse Varga');
  expect((await st(page)).party).toEqual(['Vasha', 'Ilse Varga']);

  // the menu: travel to the Gallows Crossroads (one stretch of road)
  await page.keyboard.press('m');
  await expect(page.locator('#wdMenuBox')).toBeVisible();
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Travel' }).click();
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^The Gallows Crossroads\d/ }).click();
  await expect(page.locator('#wdMenuBox')).toBeHidden();
  await expect.poll(async () => (await st(page)).map).toBe('The road to The Gallows Crossroads');
  expect((await st(page)).party).toEqual(['Vasha', 'Ilse Varga']);
  await expect(page.locator('#wdClock')).toContainText('stretch 1 of');

  // the director: long enough on the road, and something comes (tough heroes, so the fight is won)
  await page.evaluate(() => { const w = window.DreadDelve.wander; w.W().quiet = 45; for (const m of w.members()){ m.maxHp = m.hp = 300; } });
  await expect.poll(async () => { const s = await st(page); if (s.fight) return true;
    await page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), f = D.get().floors[h.floor], r = f.rooms.at(-1);
      w.walkTo(f.down ? f.down.x : r.cx, f.down ? f.down.y : r.cy); });
    return false; }, { timeout:60_000, intervals:[2500] }).toBe(true);
  expect((await st(page)).ambushes).toBe(1);
  await expect(page.locator('#wdFight')).toBeVisible();
  // the fight: on the hero's turn, Ⓐ strikes and Ⓑ ends it; Ilse and the creatures take theirs on their own
  let turns = 0;
  await expect.poll(async () => {
    const s = await st(page); if (!s.fight) return 'over';
    if (await page.evaluate(() => window.DreadDelve.wander.myTurn() && !window.DreadDelve.busy())){
      turns++;
      await page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), tg = w.target(); if (tg && w.attackFor(h, tg) < 0) w.walkTo(tg.x, tg.y); });
      await page.waitForTimeout(1200);
      await page.keyboard.press('Space'); await page.waitForTimeout(600); await page.keyboard.press('Escape');
    }
    return 'on';
  }, { timeout:180_000, intervals:[700] }).toBe('over');
  expect(turns).toBeGreaterThan(0);
  const after = await st(page);
  expect(after.xp).toBeGreaterThan(0);
  expect(after.hero.hp).toBeGreaterThan(0);
  await expect(page.locator('#wdFight')).toBeHidden();

  // leave to the start page: saved in its own slot, the DM's untouched; then carry on
  await page.keyboard.press('m');
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Leave to the threshold' }).click();
  await expect(page.locator('#startModal')).toBeVisible();
  await expect(page.locator('#wanderHud')).toBeHidden();
  await expect.poll(() => idbGet(page, 'dreaddelve.wander.v1').then(s => s?.campaign?.wander?.party?.length ?? null)).toBe(1);
  expect(await idbGet(page, 'dreaddelve.save.v1')).toBeNull();
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await expect(page.locator('#thWander')).toBeVisible();   // (the start page opens where it was left: the Wanderer's door)
  await expect(page.locator('#wdStart')).toContainText('Vasha and Ilse Varga');
  await page.locator('[data-act="wdContinue"]').click();
  await expect(page.locator('#wanderHud')).toBeVisible();
  expect((await st(page)).party).toEqual(['Vasha', 'Ilse Varga']);
  expect((await st(page)).map).toBe('The road to The Gallows Crossroads');
});
