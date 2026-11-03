import { test, expect, arena } from './helpers.js';

// Codex round 6 at the table: monsters that think (engine/tactics.js), and the folk's trade and troubles (engine/trade.js).
test('a dragon on its own breathes on the party, not on its friend', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }, { name:'Cora', x:4, y:10 }]);
  const r = await page.evaluate(() => {
    const D = window.DreadDelve, s = D.get();
    const dr = D.placeMonster('srd-young-black-dragon', { floor:0, x:9, y:10 });
    D.rollInitiative();
    const before = s.tokens.filter(t => t.kind === 'pc').map(t => t.hp);
    D.autoTurn(dr);
    return { spent:!!dr.spent?.['Acid Breath'], hurt:s.tokens.filter(t => t.kind === 'pc').map((t, i) => before[i] - t.hp), why:[...document.querySelectorAll('.toast, #toast, .toasts *')].map(e => e.textContent).join(' | ') };
  });
  expect(r.spent).toBe(true);
  expect(r.hurt.filter(n => n > 0).length).toBeGreaterThanOrEqual(2);   // the line caught two or three of them
});

test('the smith sells a hero a dagger (haggled), and a trouble put right moves the asker’s mood', async ({ page }) => {
  test.setTimeout(150_000);
  await page.evaluate(() => {
    const D = window.DreadDelve; D.ui.roomPrompts = false; document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    D.newDelve({ name:'Market', seed:'e2e-trade', floors:1, size:40, template:'barovia', party:true }, false);
    const h = D.newHero('Fighter'); h.name = 'Ilse'; h.id = 'ilse'; h.coins = { gp:30 }; D.applyCharacter(h);
  });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.get().floors[0].folk?.length || 0), { timeout:20_000 }).toBeGreaterThan(3);
  // the smith: a person of the village, given the role if the village has none today
  const pid = await page.evaluate(() => { const f = window.DreadDelve.get().floors[0]; const s = f.folk.find(p => p.role === 'smith') || Object.assign(f.folk[0], { role:'smith' }); return s.id; });
  await page.evaluate(pid => { const D = window.DreadDelve; D.openTrade(0, pid, D.get().tokens.find(t => t.charId === 'ilse').id); }, pid);
  const modal = page.locator('#tradeModal');
  await expect(modal).toBeVisible();
  const dagger = modal.locator('.packRow', { hasText:'Dagger' }).first();
  await dagger.locator('[data-act="tradeHaggle"]').click();
  await expect(dagger).toContainText('Persuasion');
  await dagger.locator('[data-act="tradeBuy"]').click();
  const after = await page.evaluate(() => { const c = window.DreadDelve.get().characters.ilse; return { daggers:c.inv.filter(i => i.n === 'Dagger').length, gp:c.coins.gp + c.coins.sp / 10 + c.coins.cp / 100 }; });
  expect(after.daggers).toBe(1);   // the one bought (the fighter carries none of their own)
  expect(after.gp).toBeLessThan(30);
  await modal.locator('[data-act="tradeClose"]').click();
  // a trouble: someone wary asks for help; put right, they're easier, and the reward is named
  const t = await page.evaluate(() => {
    const D = window.DreadDelve, f = D.get().floors[0], p = f.folk.find(x => x.role !== 'smith' && x.role !== 'dog'); p.mood = 'wary';
    const tr = { id:'trouble-e2e', by:p.id, kind:'missing', day:1, status:'open', mood:'wary', text:'My brother went out before the lamps were lit.', goal:{ action:'return', person:p.id }, reward:{ kind:'coins', gp:3 } };
    D.troubles().push(tr); D.talkTo(p);
    return { id:tr.id, pid:p.id };
  });
  await expect(page.locator('#cardLayer .pop', { hasText:'For your eyes' })).toContainText('reward: 3 gp');
  await page.locator('#cardLayer [data-act="trouble"][data-k="done"]').first().click();
  const settled = await page.evaluate(t => { const D = window.DreadDelve; return { status:D.troubles().find(x => x.id === t.id).status, mood:D.get().floors[0].folk.find(p => p.id === t.pid).mood }; }, t);
  expect(settled).toEqual({ status:'done', mood:'easy' });
  await expect(page.locator('#cardLayer .pop', { hasText:'put right' })).toContainText('3 gp');
});
