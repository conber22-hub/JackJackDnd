import { test, expect, arena } from './helpers.js';

// Round 10 at the table: going inside a building (ChatGPT's interiors), the village's people's lives (ChatGPT's people),
// fear and its marks (Codex's horror) and the mob (Codex's mobs).
async function openTab(page, k){
  await page.evaluate(() => { if (!window.DreadDelve.ui.panelOpen) document.querySelector('#btnPanel')?.click(); });
  await page.locator(`[data-act="tab"][data-k="${k}"]`).click();
}
async function village(page, seed){
  await page.evaluate(seed => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Market', seed, floors:1, size:40, template:'barovia', party:true }, false);
  }, seed);
}

test('the party goes inside a building: its storeys become a map, the party at the front door', async ({ page }) => {
  test.setTimeout(150_000);
  await village(page, 'e2e-inside');
  await openTab(page, 'dungeon');
  const door = page.locator('#tabBody [data-act="goInside"]').first();
  await expect(door).toBeVisible();
  await door.click();
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().meta.template)).toBe('interior');
  const s = await page.evaluate(() => { const D = window.DreadDelve, st = D.get(), pcs = st.tokens.filter(t => t.kind === 'pc');
    return { floors:st.floors.length, n:pcs.length, open:pcs.every(t => st.floors[t.floor].grid[t.y * st.floors[t.floor].W + t.x] !== 0), rooms:st.floors.every(f => f.rooms.length > 0), named:st.floors.every(f => /—/.test(f.name || '')), inside:!!st.meta.interior }; });
  expect(s.floors).toBeGreaterThan(0);
  expect(s.n).toBeGreaterThan(0);
  expect(s.open).toBe(true);
  expect(s.rooms).toBe(true);
  expect(s.inside).toBe(true);
  expect(s.named).toBe(true);                             // "Cottage — ground floor": the building's own storeys
});

test("the village's people have lives: a voice, a secret, ties to their neighbours, and the players never see them", async ({ page }) => {
  test.setTimeout(150_000);
  await village(page, 'e2e-lives');
  await expect.poll(() => page.evaluate(() => Object.keys(window.DreadDelve.get().floors[0].lives || {}).length), { timeout:20_000 }).toBeGreaterThan(3);
  const r = await page.evaluate(() => { const D = window.DreadDelve, f = D.get().floors[0], p = f.folk.find(x => x.role !== 'dog' && f.lives[x.id]);
    D.talkTo(p); return { ties:(f.folkTies || []).length, name:p.name }; });
  expect(r.ties).toBeGreaterThan(0);
  const eyes = page.locator('#cardLayer .pop', { hasText:'For your eyes' });
  await expect(eyes).toContainText('🤫');
  await expect(eyes).toContainText('🎭');
  const leak = await page.evaluate(() => { const st = window.DreadDelve.redactForPlayers(window.DreadDelve.get()); return st ? JSON.stringify(st.floors?.[0] || {}).includes('"lives":{') : false; });
  expect(leak).toBe(false);
});

test('a horror check: the heroes see the dead rise, fail, and carry the marks until they rest', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }]);
  await openTab(page, 'night');
  await page.locator('#tabBody [data-act="horror"]').click();
  const sheet = page.locator('#horrorSheet');
  await expect(sheet).toBeVisible();
  await sheet.locator('#hrDc').fill('40');
  await sheet.locator('#hrDc').dispatchEvent('change');
  await sheet.locator('[data-hrx="roll"]').click();
  await expect(sheet.locator('.hr-res .bad')).toHaveCount(2);
  const marks = await page.evaluate(() => window.DreadDelve.get().tokens.filter(t => t.kind === 'pc').map(t => t.horror?.marks?.length || 0));
  expect(marks.every(n => n > 0)).toBe(true);                 // a fail by 10 or more: a lasting mark
  await expect(sheet.locator('.hr-mark').first()).toBeVisible();
  // a lasting mark has a cure that works
  await sheet.locator('[data-hrx="cure"]').first().click();
  expect(await page.evaluate(() => window.DreadDelve.get().tokens.filter(t => t.kind === 'pc').reduce((a, t) => a + (t.horror?.marks?.length || 0), 0))).toBe(1);
});

test('a mob of zombies: raised, set on the map as a crowd, it attacks, takes a blow, and thins', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  await openTab(page, 'night');
  await page.locator('#tabBody [data-act="mobs"]').click();
  const sheet = page.locator('#mobSheet');
  await expect(sheet).toBeVisible();
  await sheet.locator('#mbKind').selectOption('srd-zombie');
  await sheet.locator('#mbN').fill('12');
  await sheet.locator('#mbN').dispatchEvent('change');
  await sheet.locator('[data-mbx="make"]').click();
  const mob = () => page.evaluate(() => { const m = window.DreadDelve.get().floors[0].mobs?.[0]; const f = window.DreadDelve.get().floors[0]; return m && { n:m.n, placed:m.formation.length, distinct:new Set(m.formation.map(s => `${s.x},${s.y}`)).size, look:m.look, open:m.formation.every(s => f.grid[s.y * f.W + s.x] !== 0) }; });
  await expect.poll(async () => (await mob())?.n).toBe(12);
  const m0 = await mob();
  expect(m0.placed).toBe(12);
  expect(m0.distinct).toBe(12);
  expect(m0.look).toBe('dead');
  expect(m0.open).toBe(true);                               // standing on the floor, not in the rock
  await sheet.locator('[data-mbx="attack"]').first().click();
  await expect(sheet.locator('.ch-events')).toContainText('attackers land');
  await sheet.locator('#mbDmg').fill('45');                    // a zombie has 15 HP: three fall
  await sheet.locator('[data-mbx="hit"]').click();
  await expect.poll(async () => (await mob()).n).toBe(9);
  await expect(sheet.locator('.ch-events')).toContainText('3 fall');
  // the players see the crowd, not its hit points
  const seen = await page.evaluate(() => { const st = window.DreadDelve.redactForPlayers(window.DreadDelve.get()); return st ? st.floors[0].mobs?.[0] : null; });
  if (seen) { expect(seen.formation.length).toBe(9); expect(seen.hp).toBeUndefined(); }
});
