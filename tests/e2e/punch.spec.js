import { test, expect } from './helpers.js';

// 💥 A blow felt (render/punch.js): the attacker lunges, the world holds still for an instant at the impact, the one
// struck is knocked back and left a splash on the ground; a miss sways aside; a killing blow runs slow and the body
// stays where it was thrown; when the fight's over the ground is wiped.
async function fight(page){
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-punch';
    localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-punch"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
  await page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), f = D.get().floors[h.floor];
    for (const fl of D.get().floors) for (const p of fl.folk || []) p.gone = true; w.rt.talk = null;
    let done = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]){ const x = h.x + dx, y = h.y + dy;
      if (!done && f.grid[y * f.W + x] && !D.get().tokens.some(t => t.floor === h.floor && t.x === x && t.y === y)){ D.placeMonster('wolf', { floor:h.floor, x, y }); done = true; } }
    for (const m of w.members()){ m.maxHp = 200; m.hp = 200; }
    for (const t of D.get().tokens.filter(t => t.kind === 'monster')) t.hp = t.maxHp = 200;
    w.beginFight('none', D.get().tokens.filter(t => t.kind === 'monster').map(t => t.id)); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.wander.myTurn() && !window.DreadDelve.wander.opening() && !window.DreadDelve.busy()), { timeout:60_000 }).toBe(true);
}

test('a blow lands with a lunge, a hold, a knock and a splash; a miss sways aside; a kill lies where it fell', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const before = await page.evaluate(() => window.DreadDelve.punchCount());
  await page.evaluate(() => window.DreadDelve.wander.heroAttack(0));
  // the hero lunges; the wolf is struck (knocked back, a splash) or sways aside
  await expect.poll(() => page.evaluate(() => window.DreadDelve.punchCount().lunges)).toBeGreaterThan(before.lunges);
  await expect.poll(() => page.evaluate(b => { const p = window.DreadDelve.punchCount(); return p.impacts + p.dodges > b; }, before.impacts + before.dodges)).toBe(true);
  // a crit holds the world still at the moment it lands, and leaves a splash
  const ids = await page.evaluate(() => { const D = window.DreadDelve; return { h:D.wander.hero().id, w:D.get().tokens.find(t => t.kind === 'monster').id }; });
  const held = await page.evaluate(({ h, w }) => { const D = window.DreadDelve; D.actOn(w, 'hit', h, { r:.5, crit:true }); return D.worldSpeed(); }, ids);
  expect(held).toBe(0);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.worldSpeed())).toBe(1);
  expect(await page.evaluate(() => window.DreadDelve.punchCount().onGround)).toBeGreaterThan(0);
  // a miss: a sway aside, and back
  const d0 = await page.evaluate(() => window.DreadDelve.punchCount().dodges);
  await page.evaluate(({ h, w }) => window.DreadDelve.actOn(w, 'miss', h), ids);
  expect(await page.evaluate(() => window.DreadDelve.punchCount().dodges)).toBe(d0 + 1);
  // a killing blow: the wolf stands until it lands, then falls, slow
  await page.evaluate(({ w }) => { const D = window.DreadDelve, t = D.get().tokens.find(o => o.id === w); t.hp = 1; }, ids);
  const k0 = await page.evaluate(() => window.DreadDelve.punchCount().kills);
  await page.evaluate(({ h, w }) => { const D = window.DreadDelve, t = D.get().tokens.find(o => o.id === w);
    if (!t.dead){ t.hp = 0; t.dead = true; D.actOn(w, 'hit', h, { r:1, kill:true }); } }, ids);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.punchCount().kills)).toBeGreaterThan(k0);
  await page.screenshot({ path:'test-results/punch-kill.png' });
});
