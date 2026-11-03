import { test, expect, arena, expectPositions } from './helpers.js';

// Codex round 7 at the table: the workshop (engine/crafting.js) and a place of the party's own (engine/holdings.js).
test('a hero builds a blade from parts at a forge, works it to the end, and wields it; the smith takes a commission', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page);
  await page.evaluate(() => {
    const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Ilse'; h.id = 'ilse'; h.coins = { gp:300 };
    h.inv = [{ id:'tools', n:"Smith's Tools", qty:1, equipped:false, attuned:false }]; D.applyCharacter(h);
    D.openWorkshop('weapon');
  });
  const m = page.locator('#workshopModal');
  await expect(m).toBeVisible();
  await m.locator('[data-wsf="part"][data-slot="frame"]').selectOption('weapon-battleaxe');
  await m.locator('[data-wsf="part"][data-slot="rune"]').selectOption('embers');
  await m.locator('[data-wsf="name"]').fill('Grimsel’s Answer');
  await m.locator('[data-wsf="name"]').press('Tab');
  await expect(m.locator('.wsName')).toHaveText('Grimsel’s Answer');
  await expect(m.locator('.wsShow')).toContainText('1d8 slashing');
  await expect(m.locator('.wsPic img')).toBeVisible();          // the picture of it, in a hand
  // not yet: no proficiency, no forge here; the window says what's missing
  await expect(m.locator('.wsWhy')).toContainText('proficient with Smith\'s Tools');
  await m.locator('[data-wsf="prof"]').check();
  await expect(m.locator('.wsWhy')).toContainText('no forge here');
  await page.evaluate(() => { const D = window.DreadDelve, f = D.get().floors[0]; f.props.push({ id:f.nextObj++, k:'forge', x:12, y:9, rot:0 }); D.openWorkshop(); });
  await expect(m.locator('.wsPlan')).toContainText('70 gp');
  await m.locator('[data-ws="start"]').click();
  await expect(m.locator('.packRow', { hasText:'Grimsel’s Answer' })).toBeVisible();
  // eight-hour stretches until it's done (a stretch that misses its check costs the hours; a 1 ruins the stock, replaced from the party's)
  for (let i = 0; i < 20 && await m.locator('[data-ws="work"][data-h="8"]').count(); i++){
    await page.evaluate(() => { const M = window.DreadDelve.materials(); M.stock = Math.max(M.stock, 3); });
    await m.locator('[data-ws="work"][data-h="8"]').first().click();
  }
  await expect(m.locator('[data-ws="work"]')).toHaveCount(0);
  const made = await page.evaluate(() => { const c = window.DreadDelve.get().characters.ilse; return { item:c.inv.find(i => i.n === 'Grimsel’s Answer'), gp:c.coins.gp + c.coins.sp / 10 + c.coins.cp / 100, pp:c.coins.pp }; });
  expect(made.item.custom.ty).toBe('slashing');
  expect(made.item.custom.light).toEqual({ bright:20, dim:20 });
  expect(made.gp).toBe(230);                                       // paid in gold, the change in gold too
  expect(made.pp || 0).toBe(0);
  await m.locator('[data-ws="close"]').click();
  // wielded, it fights as itself
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  const pack = page.locator('details.pack[data-pack="ilse"]');
  await pack.locator('summary').click();
  await pack.locator('.packRow', { hasText:'Grimsel’s Answer' }).locator('[data-k="equip"]').click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().tokens.find(t => t.charId === 'ilse').attacks.find(a => a.n === 'Grimsel’s Answer')?.d || '')).toMatch(/^1d(8|10)\+\d+$/);
  // the smith: a commission, worked eight hours as each day passes
  const job = await page.evaluate(() => {
    const D = window.DreadDelve, f = D.get().floors[0];
    f.folk = [{ id:'smith-1', role:'smith', name:'Tavrek Strezhov', x:10, y:12, home:{ x:10, y:12 }, haunts:[], mood:'easy', seen:[] }];   // (a whole person: the folk step walks them home)
    const ref = D.crafters().find(c => c.smith).ref, t = D.get().tokens.find(t => t.charId === 'ilse');
    const rec = D.startJob({ kind:'weapon', parts:{ frame:'weapon-dagger', material:'steel' } }, ref, t.id);
    D.courtDay('A day'); D.courtDay('A day'); D.courtDay('A day');
    return { started:!!rec, left:D.jobs().length, hours:rec?.job.hours };
  });
  expect(job.started).toBe(true);
  expect(job.hours).toBeGreaterThan(0);
});

test('the party founds a camp, builds a palisade and a tent over days, and the place answers a raid', async ({ page }) => {
  test.setTimeout(150_000);
  await page.evaluate(() => {
    const D = window.DreadDelve;
    D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'E2E field', seed:'e2e-field', floors:1, size:32, template:'blank', party:false }, false);
    const grid = Array.from({ length:32 }, (_, y) => Array.from({ length:32 }, (_, x) => x >= 2 && x <= 29 && y >= 2 && y <= 29 ? 1 : 0));
    D.importMap(JSON.stringify({ name:'Open field', grid, tokens:[{ kind:'pc', name:'Ada', x:16, y:16 }, { kind:'pc', name:'Bram', x:17, y:16 }] }));
    document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove());
  });
  await expectPositions(page, { Ada:{ x:16, y:16 } });
  await page.locator('[data-act="tab"][data-k="build"]').click();
  await page.locator('details[data-holdopen] summary').click();   // 🏰 A place of their own (folded until wanted)
  await page.locator('#holdName').fill('The Lantern House');
  await page.locator('[data-hd="found"][data-k="camp"]').click();
  const sec = page.locator('details.hold');
  await expect(sec).toContainText('The Lantern House');
  const h0 = await page.evaluate(() => { const h = window.DreadDelve.holdingHere(); h.stores.gp = 200; return h.bounds; });
  // a palisade: only on the edge (the middle refuses, with a reason), then a tent inside
  await sec.locator('[data-hd="pick"][data-k="palisade"]').click();
  const mid = await page.evaluate(b => window.DreadDelve.check(window.DreadDelve.holdingHere().id, 'palisade', b.x + 4, b.y + 4, 0), h0);
  expect(mid.ok).toBe(false);
  expect(mid.why).toMatch(/edge/);
  const placed = await page.evaluate(b => { const D = window.DreadDelve, id = D.holdingHere().id; return [D.place(id, 'palisade', b.x, b.y, 0), D.place(id, 'tent', b.x + 4, b.y + 4, 0)]; }, h0);
  expect(placed).toEqual([true, true]);
  await expect(sec).toContainText('Palisade');
  // days of work: the party builds while here
  // (a late supply cart can cost a project its week: keep at it)
  for (let i = 0; i < 4 && await page.evaluate(() => window.DreadDelve.holdingHere().projects.length); i++) await sec.locator('[data-hd="work"][data-k="7"]').click();
  const after = await page.evaluate(() => { const D = window.DreadDelve, h = D.holdingHere(), f = D.get().floors[0]; return { built:h.modules.map(m => m.built), props:f.props.filter(p => p.hold === h.id).map(p => p.k) }; });
  expect(after.built).toEqual([true, true]);
  expect(after.props.filter(k => k === 'palisade')).toHaveLength(4);
  expect(after.props).toContain('tent');
  await expect(sec).toContainText(/Defence [1-9]/);
  // the Count sends someone: met by the party
  await page.evaluate(() => {
    const D = window.DreadDelve, h = D.holdingHere(), c = D.get().campaign.court || (D.courtDay('A day'), D.get().campaign.court);
    const m = c.members.find(x => x.alive); h.raid = { id:`raid-${h.id}-x`, member:m.id, day:0, power:1, chance:1, court:structuredClone(c) };
    D.renderAll?.();
  });
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  await page.locator('[data-act="tab"][data-k="build"]').click();
  await sec.locator('[data-hd="raid"][data-k="meet"]').click();
  const raided = await page.evaluate(() => { const h = window.DreadDelve.holdingHere(); return { raid:h.raid, resolved:h.resolvedRaids?.length || 0 }; });
  expect(raided.raid).toBeNull();
  expect(raided.resolved).toBe(1);
});
