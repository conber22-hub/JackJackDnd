import { test, expect } from './helpers.js';

// 🎲 ⏳ The drama of a fight (ui/dicemoment.js, ui/orderstrip.js): every attack's d20 tumbles and lands at the top
// of the screen with its sum and HIT or MISS; the turn order runs along the top as faces, whoever's acting first in
// gold, the next one marked, with health bars and what they're under; pointing at a face lights its figure, and a
// tap on a foe aims at it.
async function fight(page){
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-drama';
    localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-drama"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
  await page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), f = D.get().floors[h.floor];
    for (const fl of D.get().floors) for (const p of fl.folk || []) p.gone = true; w.rt.talk = null;
    let n = 0;
    for (let r = 1; r < 6 && n < 2; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]){ const x = h.x + dx, y = h.y + dy;
      if (n < 2 && f.grid[y * f.W + x] && !D.get().tokens.some(t => t.floor === h.floor && t.x === x && t.y === y)){ D.placeMonster('wolf', { floor:h.floor, x, y }); n++; } }
    for (const m of w.members()){ m.maxHp = 200; m.hp = 120; }
    for (const t of D.get().tokens.filter(t => t.kind === 'monster')) t.hp = t.maxHp = 200;
    w.beginFight('none', D.get().tokens.filter(t => t.kind === 'monster').map(t => t.id)); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.wander.myTurn() && !window.DreadDelve.wander.opening() && !window.DreadDelve.busy()), { timeout:60_000 }).toBe(true);
}

test('the turn order runs along the top as faces, and a face lights and aims at its figure', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const strip = page.locator('#wdOrder');
  await expect(strip).toBeVisible();
  await expect(strip.locator('.os-p.now')).toContainText('Vasha');
  await expect(strip.locator('.os-p.next')).toHaveCount(1);
  await expect(strip.locator('.os-p.foe')).toHaveCount(2);
  const pc = await page.evaluate(() => { const h = window.DreadDelve.wander.hero(); return Math.round(Math.max(0, h.hp) / h.maxHp * 100); });
  await expect(strip.locator('.os-p.now .os-hp i')).toHaveAttribute('style', `width:${pc}%`);   // (her health, as it stands)
  // their portraits come, one at a time
  await expect.poll(() => page.evaluate(() => window.DreadDelve.facesMade()), { timeout:60_000 }).toBeGreaterThan(0);
  // pointing at a foe's face lights its figure; a tap aims at it
  const foe = strip.locator('.os-p.foe').last(), id = await foe.getAttribute('data-id');
  await foe.hover();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.fightFxCount().hover)).toBe(id);
  await foe.click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.wander.rt.target)).toBe(id);
  // what they're under shows on their face
  await page.evaluate(i => { const t = window.DreadDelve.get().tokens.find(o => o.id === i); t.conds = [...(t.conds || []), { n:'prone', r:1 }]; }, id);
  await expect(strip.locator(`.os-p[data-id="${id}"] .os-cond`)).toContainText('⤓');
});

test('an attack\'s d20 tumbles and lands, with the sum and HIT or MISS', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const n = await page.evaluate(() => window.DreadDelve.diceSeen().length);
  await page.evaluate(() => window.DreadDelve.wander.heroAttack(0));
  await expect(page.locator('#diceMo')).toBeVisible();
  await expect(page.locator('#diceMo .dm-who')).toContainText('Vasha →');
  await expect.poll(() => page.evaluate(k => window.DreadDelve.diceSeen().slice(k).join(' | '), n)).toMatch(/\d+ [+−]\d+ = \d+ vs AC \d+ (HIT|MISS|CRITICAL|FUMBLE)/);
  await expect(page.locator('#diceMo .dm-verdict')).toHaveText(/HIT|MISS|CRITICAL|FUMBLE/);
});
