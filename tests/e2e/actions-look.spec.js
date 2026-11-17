import { test, expect } from './helpers.js';

// 🎴 How each choice looks, and what each action leaves on the map (ui/optrow.js, ui/actrows.js, ui/fightfx.js):
// the Actions list comes in groups (Strike, Move & defend, Your gifts…), each choice with an icon, a line of what it
// does, a tag for what it costs and a word more when it's highlighted; spells come by level with their slot and
// Concentration; and Second Wind, Dodge and the like rise over the hero as they're used.
async function fight(page, cls, id){
  await page.evaluate(([c, id]) => { const D = window.DreadDelve, h = D.newHero(c); h.name = 'Vasha'; h.id = id;
    if (c === 'Cleric') h.spells = ['Sacred Flame', 'Cure Wounds', 'Bless', 'Guiding Bolt'];
    localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); }, [cls, id]);
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator(`[data-act="wdBegin"][data-id="${id}"]`).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
  await page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), f = D.get().floors[h.floor];
    for (const fl of D.get().floors) for (const p of fl.folk || []) p.gone = true; w.rt.talk = null;
    for (let r = 2; r < 6; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]){ const x = h.x + dx, y = h.y + dy;
      if (!D.get().tokens.some(t => t.kind === 'monster') && f.grid[y * f.W + x] && !D.get().tokens.some(t => t.floor === h.floor && t.x === x && t.y === y)) D.placeMonster('wolf', { floor:h.floor, x, y }); }
    for (const m of w.members()){ m.maxHp = 200; m.hp = 120; }
    for (const t of D.get().tokens.filter(t => t.kind === 'monster')) t.hp = t.maxHp = 200;
    w.beginFight('none', D.get().tokens.filter(t => t.kind === 'monster').map(t => t.id)); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.wander.myTurn() && !window.DreadDelve.wander.opening() && !window.DreadDelve.busy()), { timeout:60_000 }).toBe(true);
}
const fx = page => page.evaluate(() => window.DreadDelve.fightFxCount().texts.join(' | '));

test('the Actions list explains each choice, and Second Wind and Dodge show over the hero', async ({ page }) => {
  test.setTimeout(180_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await fight(page, 'Fighter', 'vasha-acts');
  await page.keyboard.press('f');
  const box = page.locator('#wdMenuBox');
  await expect(box).toBeVisible();
  // in groups, docked clear of the fight
  for (const g of ['Strike', 'Move & defend', 'Your gifts']) await expect(box.locator('.wd-grp', { hasText:g })).toBeVisible();
  await expect(box).toHaveClass(/wd-dock/);
  // a weapon: an icon, what it does, what it costs, and a word more while it's highlighted
  const sword = box.locator('.wd-opt', { hasText:/^Longsword/ });
  await expect(sword).toHaveAttribute('data-ic', /.+/);
  await expect(sword).toContainText('to hit'); await expect(sword.locator('.wd-tags')).toContainText('Action');
  await expect(box.locator('.wd-info')).toContainText(/longsword/i);
  await expect(box.locator('.wd-opt', { hasText:/^Second Wind/ }).locator('.wd-tags')).toContainText('Bonus');
  await expect(box.locator('.wd-opt', { hasText:/^Dodge/ })).toContainText('disadvantage');

  // Second Wind: its name and the hit points back, rising over the hero
  await box.locator('[data-act="wdPick"]', { hasText:/^Second Wind/ }).click();
  await expect.poll(() => fx(page)).toContain('SECOND WIND');
  await expect.poll(() => fx(page)).toMatch(/\+\d+/);
  // Dodge: the word over the hero, and the fight bar says so
  await page.keyboard.press('f');
  await box.locator('[data-act="wdPick"]', { hasText:/^Dodge/ }).click();
  await expect.poll(() => fx(page)).toContain('DODGE');
  await expect(page.locator('#wdFight')).toContainText('dodging');
  expect(errs).toEqual([]);
});

test('spells come by level, each with what it does, its slot and Concentration', async ({ page }) => {
  test.setTimeout(180_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await fight(page, 'Cleric', 'vasha-spells');
  await page.keyboard.press('g');   // (the spells, straight)
  const box = page.locator('#wdMenuBox');
  await expect(box.locator('.wd-grp', { hasText:'Cantrips' })).toBeVisible();
  await expect(box.locator('.wd-grp', { hasText:/Level 1/ })).toBeVisible();
  await expect(box.locator('.wd-opt', { hasText:/^Sacred Flame/ })).toContainText('Dex save');
  const bless = box.locator('.wd-opt', { hasText:/^Bless/ });
  await expect(bless.locator('.wd-tags')).toContainText('L1'); await expect(bless.locator('.wd-tags')).toContainText('Conc.');
  await expect(box.locator('.wd-opt', { hasText:/^Cure Wounds/ })).toContainText('heals');
  await expect(box.locator('.wd-info')).toContainText(/radiance/i);   // (Sacred Flame, highlighted first: what it does)
  // cast it: its name over the caster
  await box.locator('[data-act="wdPick"]', { hasText:/^Sacred Flame/ }).click();
  await expect.poll(() => fx(page)).toContain('Sacred Flame');
  await expect(page.locator('#wdFight')).toContainText('cast');
  expect(errs).toEqual([]);
});
