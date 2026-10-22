import { test, expect, arena, idle, frameMap, tilePoint } from './helpers.js';

const openPanelTab = async (page, tab) => {
  if (!(await page.evaluate(() => window.DreadDelve.ui.panelOpen))) await page.locator('#btnPanel').click();
  await page.locator(`[data-act="tab"][data-k="${tab}"]`).click();
};

test('the creator\'s Look studio shows the hero as a live 3D mini and takes a portrait from it', async ({ page }) => {
  await page.locator('[data-act="thRole"][data-k="player"]').click();
  await page.locator('[data-act="newHero"]').click();
  await page.locator('#charBox [data-cf="name"]').fill('Ilse');
  await page.locator('#charBox select[data-cf="sp"]').selectOption('Tiefling');
  await expect(page.locator('#crMini canvas')).toBeVisible();
  // the sheet's species shows (horns), and a chosen look sticks
  await page.locator('#charBox select[data-mini="hair"]').selectOption('braid');
  expect(await page.evaluate(() => window.DreadDelve.forgeStudio.studio().figs[0].userData.fig.userData.rig.look.hair)).toBe('braid');
  expect(await page.evaluate(() => window.DreadDelve.forgeStudio.studio().figs[0].userData.fig.userData.rig.look.horns)).not.toBe('none');
  await page.locator('#charBox [data-cr="portraitFromMini"]').click();
  await expect(page.locator('#charBox .artslot img')).toHaveAttribute('src', /^data:image\/jpeg/);
  await page.locator('#charBox [data-cr="mini:attack"]').click();
  expect(await page.evaluate(() => !!window.DreadDelve.forgeStudio.studio().figs[0].userData.fig.userData.rig.action)).toBe(true);
});

test('forged minis on the map: heroes and humanoid foes are jointed figures that swing and flinch', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  await page.evaluate(() => { const D = window.DreadDelve; D.placeMonster('zombie', { floor:0, x:7, y:10 }); D.placeMonster('wolf', { floor:0, x:9, y:12 }); });
  await idle(page);
  const kinds = await page.evaluate(() => Object.fromEntries(window.DreadDelve.get().tokens.map(t => [t.bid || t.name, !!window.DreadDelve.tokenViews.get(t.id).group.userData.fig.userData.rig])));
  expect(kinds).toEqual({ Ada:true, zombie:true, wolf:false });
  await page.evaluate(() => { const D = window.DreadDelve, s = D.get(); const a = s.tokens.find(t => t.name === 'Ada'), z = s.tokens.find(t => t.bid === 'zombie'); z.hp = z.maxHp = 500; D.doAttack(a.id, z.id, 0); });
  expect(await page.evaluate(() => { const a = window.DreadDelve.get().tokens.find(t => t.name === 'Ada'); return window.DreadDelve.tokenViews.get(a.id).group.userData.fig.userData.rig.action?.k; })).toMatch(/slash|smash|thrust|claw|shoot/);
});

test('🎲 Roll an NPC: a named NPC with a look, placed as an ally or a foe', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  await openPanelTab(page, 'tokens');
  await page.locator('#npcKind').selectOption('priest');
  await page.locator('[data-act="npcRoll"]').first().click();
  await expect(page.locator('.card.npc .look')).toContainText(/vestments/);
  await expect(page.locator('.card.npc img')).toHaveAttribute('src', /^data:image/);
  await page.locator('[data-act="npcPlace"]').first().click();
  await frameMap(page, 9, 10);
  let p = await tilePoint(page, 9, 10); await page.mouse.click(p.x, p.y);
  await openPanelTab(page, 'tokens');
  await page.locator('#npcKind').selectOption('bandit');
  await page.locator('[data-act="npcRoll"]').first().click();
  await page.locator('[data-act="npcPlace"][data-k="foe"]').click();
  await frameMap(page, 9, 10);
  p = await tilePoint(page, 11, 11); await page.mouse.click(p.x, p.y);
  await idle(page);
  const placed = await page.evaluate(() => window.DreadDelve.get().tokens.filter(t => t.name !== 'Ada').map(t => ({ kind:t.kind, bid:t.bid || null, x:t.x, y:t.y, gone:!!t.flags.gone, look:!!t.look, notes:!!t.notes })));
  expect(placed).toEqual([{ kind:'npc', bid:null, x:9, y:10, gone:false, look:true, notes:true }, { kind:'monster', bid:'bandit', x:11, y:11, gone:false, look:true, notes:true }]);
});
