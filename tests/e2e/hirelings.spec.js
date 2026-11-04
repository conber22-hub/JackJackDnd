import { test, expect, expectPositions } from './helpers.js';

// 🏰 Hired hands (engine/hirelings.js, ChatGPT's): hired from the folk, paid from the stores, loyal or not, and one of
// them the Count's eyes, found out while a hero keeps watch.
test('the party hires a watchman and a farmer who is a spy; wages, loyalty and the spy found out', async ({ page }) => {
  test.setTimeout(150_000);
  await page.evaluate(() => {
    const D = window.DreadDelve;
    D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'E2E field', seed:'e2e-hire', floors:1, size:32, template:'blank', party:false }, false);
    const grid = Array.from({ length:32 }, (_, y) => Array.from({ length:32 }, (_, x) => x >= 2 && x <= 29 && y >= 2 && y <= 29 ? 1 : 0));
    D.importMap(JSON.stringify({ name:'Open field', grid, tokens:[{ kind:'pc', name:'Ada', x:16, y:16 }] }));
    document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove());
  });
  await expectPositions(page, { Ada:{ x:16, y:16 } });
  const court = await page.evaluate(() => {
    const D = window.DreadDelve, f = D.get().floors[0];
    D.courtDay('A day');   // (the court exists from the first day)
    const c = D.get().campaign.court, m = c.members.find(x => x.alive);
    const person = (id, role, name, x, extra = {}) => ({ id, role, name, x, y:20, home:{ x, y:20 }, haunts:[], mood:'wary', seen:[], ...extra });
    f.folk = [person('w1', 'watch', 'Dorian Tvesk', 12), person('s1', 'farmer', 'Anya Petrova', 14, { spy:{ for:m.id } })];
    D.found('camp', 'The Lantern House'); D.holdingHere().stores.gp = 50;
    return m.id;
  });
  await page.locator('[data-act="tab"][data-k="build"]').click();
  const sec = page.locator('details.hold');
  for (const id of ['w1', 's1']){ await sec.locator('#holdHire').selectOption(id); await sec.locator('[data-hd="hire"]').click(); }
  await expect(sec.locator('.packRow', { hasText:'Dorian Tvesk' })).toContainText('guard');
  await expect(sec.locator('.packRow', { hasText:'Anya Petrova' })).not.toContainText('Count');   // a spy looks like anyone
  // a day's wages from the stores (a watchman 0.5 gp, a farmer 0.2)
  const paid = await page.evaluate(() => { const D = window.DreadDelve, h = D.holdingHere(); D.workDays(h.id, 1); return h.stores.gp; });
  expect(paid).toBeCloseTo(49.3, 2);
  // empty stores: the unpaid lose loyalty (or leave)
  const unpaid = await page.evaluate(() => { const D = window.DreadDelve, h = D.holdingHere(); const before = Object.fromEntries(h.hired.map(w => [w.id, w.loyalty])); h.stores.gp = 0; D.workDays(h.id, 1); return h.hired.every(w => w.loyalty === before[w.id] - 2) || h.hired.length < 2; });
  expect(unpaid).toBe(true);
  // a hero keeps watch, and the days pass: the spy slips
  const exposed = await page.evaluate(member => {
    const D = window.DreadDelve, h = D.holdingHere(); h.stores.gp = 500;
    if (!h.hired.some(w => w.id === 's1')) return 'left';
    h.watch = { by:'x', bonus:10, defence:1, until:9999 };
    for (let i = 0; i < 40 && !h.hired.find(w => w.id === 's1')?.exposed; i++){ h.raid = { id:'hold', member, day:0, power:0, court:structuredClone(D.get().campaign.court) }; D.courtDay('A day'); }
    return h.hired.find(w => w.id === 's1')?.exposed ? 'found' : 'hidden';
  }, court);
  expect(['found', 'left']).toContain(exposed);
  if (exposed === 'found'){
    await page.locator('[data-act="tab"][data-k="tokens"]').click(); await page.locator('[data-act="tab"][data-k="build"]').click();
    await expect(sec.locator('.packRow', { hasText:'Anya Petrova' })).toContainText("The Count's eyes");
  }
});
