import { test, expect, arena } from './helpers.js';

// Codex round 9 at the table: talking to the folk (engine/social.js) and the chase (engine/chase.js).
test('a hero bribes one of the folk; the card shows how they feel, and they remember being paid', async ({ page }) => {
  test.setTimeout(150_000);
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Market', seed:'e2e-talk', floors:1, size:40, template:'barovia', party:true }, false);
    const h = D.newHero('Fighter'); h.name = 'Ilse'; h.id = 'ilse'; h.coins = { gp:30 }; D.applyCharacter(h);
  });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().floors[0].folk?.length || 0), { timeout:20_000 }).toBeGreaterThan(3);
  const pid = await page.evaluate(() => { const D = window.DreadDelve, f = D.get().floors[0], p = f.folk.find(x => x.role !== 'dog');
    D.ui.selected = D.get().tokens.find(t => t.charId === 'ilse').id; D.talkTo(p); return p.id; });
  const eyes = page.locator('#cardLayer .pop', { hasText:'For your eyes' });
  await expect(eyes).toContainText(/friendly|indifferent|hostile|terrified/);
  await eyes.locator('[data-act="influence"][data-k="bribe"]').click();
  await expect.poll(() => page.evaluate(pid => { const p = window.DreadDelve.get().floors[0].folk.find(x => x.id === pid); return (p.memories || []).some(m => m.kind === 'paid'); }, pid)).toBe(true);
  const gp = await page.evaluate(() => window.DreadDelve.get().characters.ilse.coins.gp);
  expect(gp).toBe(25);                                   // five gold for the bribe
});

test('a chase: the party runs, the wolf follows, round by round until it ends', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }]);
  await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('wolf', { floor:0, x:14, y:10 }); if (!D.ui.panelOpen) document.querySelector('#btnPanel')?.click(); });
  await page.locator('[data-act="tab"][data-k="night"]').click();
  await page.locator('#tabBody [data-act="chase"]').click();
  const sheet = page.locator('#chaseSheet');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-chx="start"]').click();
  await expect(sheet.locator('.ch-lane')).toHaveCount(3);
  for (let i = 0; i < 25 && !(await sheet.locator('.ch-end').count()); i++) await sheet.locator('[data-chx="round"]').click();
  await expect(sheet.locator('.ch-end')).toBeVisible();   // they got away, or were caught
  expect(await page.evaluate(() => window.DreadDelve.get().log.some(l => /🏃 The chase ends/.test(l.m)))).toBe(true);
});
