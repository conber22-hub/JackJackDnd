import { test, expect } from './helpers.js';

// 🗡 The Wanderer's long road (engine/wander-life.js, game/wander.js, ui/wander.js): a cleric wakes with a quest,
// wins Ilse over, meets a roadside scene whose choice Ilse has an opinion about, asks for Ilse's own quest once she
// likes her enough, levels up from the menu (the game choosing), drinks a potion from the pack, and casts a spell from
// the spell list in a fight.
const ev = (page, f, a) => page.evaluate(f, a);

test('a wanderer\'s quests, a roadside choice, a companion\'s approval and quest, a level up, the pack, and a spell in a fight', async ({ page }) => {
  test.setTimeout(240_000);
  await ev(page, () => { const D = window.DreadDelve, h = D.newHero('Cleric'); h.name = 'Mira'; h.id = 'mira-wd'; h.spells = ['Sacred Flame', 'Cure Wounds', 'Guiding Bolt']; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="mira-wd"]').click();
  await expect(page.locator('#wanderHud')).toBeVisible();
  await page.keyboard.press('Escape');

  // the journal: the road west from the start
  await page.keyboard.press('j');
  await expect(page.locator('#wdMenuBox')).toContainText('The road west');
  await expect(page.locator('#wdMenuBox')).toContainText('Reach Vallaki');
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdMenuBox')).toBeHidden();

  // Ilse: stand beside her, and win her over (a 20)
  await ev(page, () => { const D = window.DreadDelve, w = D.wander, h = w.hero(), il = D.get().tokens.find(t => t.flags?.companion === 'ilse'), f = D.get().floors[h.floor];
    const spot = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([dx, dy]) => ({ x:il.x + dx, y:il.y + dy })).find(p => f.grid[p.y * f.W + p.x] && !D.get().tokens.some(t => t.floor === h.floor && t.x === p.x && t.y === p.y));
    h.x = spot.x; h.y = spot.y; });
  await expect(page.locator('#wdPrompt')).toContainText('Talk to Ilse Varga');
  await page.keyboard.press('Space');
  await ev(page, () => { window.__r = Math.random; Math.random = () => .999; });
  await page.locator('#wdTalk [data-act="wdSay"][data-k="pitch"]').click();
  await ev(page, () => { Math.random = window.__r; });
  await expect(page.locator('#wdParty')).toContainText('Ilse Varga');
  const a0 = await ev(page, () => window.DreadDelve.wander.approvalOf('ilse'));

  // a roadside scene: cut the hanged man down (mercy and courage, which Ilse likes); Escape doesn't skip the choice
  await ev(page, () => window.DreadDelve.wander.startMoment({ id:'hanged' }));
  await expect(page.locator('#wdTalk')).toContainText('A man on a rope');
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdTalk')).toContainText('A man on a rope');
  await page.locator('#wdTalk [data-act="wdSay"][data-k="cut"]').click();
  await expect(page.locator('#wdTalk')).toContainText('Ilse nods');
  await expect(page.locator('#wdTalk')).toContainText('+8 gp');
  await page.keyboard.press('Space');
  await expect(page.locator('#wdTalk')).toBeHidden();
  expect(await ev(page, () => window.DreadDelve.wander.approvalOf('ilse'))).toBeGreaterThan(a0);

  // she likes you enough: her own quest
  await ev(page, () => { const w = window.DreadDelve.wander; w.W().approval.ilse = 30; w.talkTo('ilse'); });
  await expect(page.locator('#wdTalk')).toContainText('Warm (30)');
  await page.locator('#wdTalk [data-act="wdSay"][data-k="quest"]').click();
  await expect(page.locator('#wdTalk')).toContainText('New quest: The last post');
  await page.keyboard.press('Escape');
  await page.keyboard.press('j');
  await expect(page.locator('#wdMenuBox')).toContainText('The last post');
  await expect(page.locator('#wdMenuBox')).toContainText('Ilse Varga');
  await page.keyboard.press('Escape');

  // enough XP for level 3: the badge, then the menu's Level up with the game choosing
  await ev(page, () => { const w = window.DreadDelve.wander; w.W().xp = 950; w.checkLevels(); });
  await expect(page.locator('#wdLvl')).toContainText('Level 3');
  expect(await ev(page, () => window.DreadDelve.wander.members()[1].lvl ?? window.DreadDelve.get().characters[window.DreadDelve.wander.members()[1].charId].lvl)).toBe(3);   // (Ilse grew by herself)
  await page.keyboard.press('Escape');
  await page.locator('[data-act="wdLevel"]').click();
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:'Let the game choose' }).click();
  await expect(page.locator('#wdLvl')).toBeEmpty();
  const lv = await ev(page, () => { const w = window.DreadDelve.wander; return { lvl:w.sheetOf().lvl, spells:w.sheetOf().spells.length, hp:w.hero().maxHp }; });
  expect(lv.lvl).toBe(3); expect(lv.spells).toBeGreaterThan(3); expect(lv.hp).toBeGreaterThan(15);

  // the pack: a potion, drunk by the hero
  await ev(page, () => { const w = window.DreadDelve.wander; w.gainLoot({ items:['Potion of Healing'] }); w.hero().hp = 2; });
  await page.keyboard.press('i');
  await expect(page.locator('#wdMenuBox')).toContainText('Potion of Healing');
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^Potion of Healing/ }).click();
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^Mira/ }).click();
  await expect(page.locator('#wdMenuBox')).toBeHidden();
  expect(await ev(page, () => window.DreadDelve.wander.hero().hp)).toBeGreaterThan(2);
  expect(await ev(page, () => window.DreadDelve.wander.pack().some(i => i.potion))).toBe(false);

  // a fight: a wolf close by; on her turn, the spell list (G) and Sacred Flame
  await ev(page, () => { const D = window.DreadDelve, w = D.wander, h = w.hero(), f = D.get().floors[h.floor];
    for (let r = 2; r < 6; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]){ const x = h.x + dx, y = h.y + dy;
      if (!D.get().tokens.some(t => t.kind === 'monster') && f.grid[y * f.W + x] && !D.get().tokens.some(t => t.floor === h.floor && t.x === x && t.y === y)) D.placeMonster('wolf', { floor:h.floor, x, y }); }
    for (const m of w.members()) m.hp = m.maxHp = 200;
    w.beginFight('none', D.get().tokens.filter(t => t.kind === 'monster').map(t => t.id)); });
  await expect(page.locator('#wdFight')).toBeVisible();
  await expect.poll(() => ev(page, () => window.DreadDelve.wander.myTurn() && !window.DreadDelve.busy()), { timeout:60_000 }).toBe(true);
  await page.keyboard.press('g');
  await expect(page.locator('#wdMenuBox')).toContainText('Spells');
  await page.locator('#wdMenuBox [data-act="wdPick"]', { hasText:/^Sacred Flame/ }).click();
  await expect.poll(() => ev(page, () => window.DreadDelve.wander.rt.cast)).toBe(true);
  await expect(page.locator('#wdFight')).toContainText('cast');
  // one action a turn: no striking after casting
  await page.keyboard.press('Space');
  expect(await ev(page, () => window.DreadDelve.wander.attacksLeft())).toBe(0);
});
