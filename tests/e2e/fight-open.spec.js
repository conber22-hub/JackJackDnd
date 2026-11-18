import { test, expect } from './helpers.js';

// ⚔ How a fight starts and how a blow is struck (game/wander.js beginFight / opening, ui/wander.js, render/fightzone.js):
// a fight breaks out with a moment of its own (what started it, who's there, who goes first) and the ground it's
// fought over drawn round it; presses made in that moment strike nothing. On the hero's turn Ⓐ opens the choice of
// what to strike with (each attack's bonus, damage and reach), Ⓑ puts it away with nothing spent, and a choice
// strikes with that one: the damage (or MISS) rises over the target and the card waits at the top, clear of them.
test('a fight breaks out with a moment of its own, and the hero chooses the blow', async ({ page }) => {
  test.setTimeout(240_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-fight'; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-fight"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
  const ev = fn => page.evaluate(fn);
  // a wolf a few squares off (the villagers sent indoors), everyone tough enough that one blow ends nothing
  await ev(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), f = D.get().floors[h.floor];
    for (const fl of D.get().floors) for (const p of fl.folk || []) p.gone = true; w.rt.talk = null;
    for (let r = 2; r < 6; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]){ const x = h.x + dx, y = h.y + dy;
      if (!D.get().tokens.some(t => t.kind === 'monster') && f.grid[y * f.W + x] && !D.get().tokens.some(t => t.floor === h.floor && t.x === x && t.y === y)) D.placeMonster('wolf', { floor:h.floor, x, y }); }
    for (const m of w.members()) m.hp = m.maxHp = 200;
    for (const t of D.get().tokens.filter(t => t.kind === 'monster')) t.hp = t.maxHp = 200;
    w.beginFight('none', D.get().tokens.filter(t => t.kind === 'monster').map(t => t.id), { title:'Seen!', flair:'The wolf has seen you.' });
    w.rt.opening.until += 60_000; });   // (held open while it's looked at: a slow machine mustn't let it pass first)

  // the moment it breaks out: what started it, who's there, the order; the ground drawn round it
  await expect(page.locator('#wdOpen')).toBeVisible();
  await expect(page.locator('#wdOpen')).toContainText('Seen!');
  await expect(page.locator('#wdOpen')).toContainText('Wolf');
  await expect(page.locator('#wdOpen')).toContainText(/goes first|You go first/);
  expect((await ev(() => window.DreadDelve.fightFxCount())).zone).toBe(true);
  // in it, the fight's buttons wait: no choice opened, nothing struck
  await page.keyboard.press('Space'); await page.keyboard.press('f');
  expect(await ev(() => window.DreadDelve.wander.rt.attacks)).toBe(0);
  await expect(page.locator('#wdMenuBox')).toBeHidden();
  await ev(() => { window.DreadDelve.wander.rt.opening.until = performance.now(); });   // (and let it pass)

  // the hero's turn: the moment gone, the weapon to hand on the fight bar, the squares they can walk to drawn
  await expect.poll(() => ev(() => window.DreadDelve.wander.myTurn() && !window.DreadDelve.wander.opening() && !window.DreadDelve.busy()), { timeout:60_000 }).toBe(true);
  await expect(page.locator('#wdOpen')).toBeHidden();
  await expect(page.locator('#wdFight .wd-weap')).toContainText('to hit');
  await expect.poll(() => ev(() => window.DreadDelve.fightFxCount().moves)).toBeGreaterThan(0);
  await expect(page.locator('#wdPrompt')).toContainText('Attack Wolf');

  // Ⓐ: the choice, each attack with its bonus, damage and reach; Ⓑ puts it away and nothing is spent
  await page.keyboard.press('Space');
  const box = page.locator('#wdMenuBox');
  await expect(box).toBeVisible(); await expect(box).toContainText('Strike');
  const names = await ev(() => window.DreadDelve.wander.hero().attacks.map(a => a.n));
  for (const n of names) await expect(box).toContainText(n);
  await expect(box).toContainText('to hit'); await expect(box).toContainText(/in reach|in range|out of/);
  await page.keyboard.press('Escape');
  await expect(box).toBeHidden();
  expect(await ev(() => window.DreadDelve.wander.rt.attacks)).toBe(0);

  // Ⓐ again, and a choice: the blow is struck with that one (the log names it), the number rises over the wolf
  const before = await ev(() => window.DreadDelve.fightFxCount().floats);
  await page.keyboard.press('Space');
  const pick = box.locator('.wd-opt:not(.off)', { hasText:'to hit' }).first();
  const weapon = (await pick.evaluate(el => el.firstChild.textContent)).replace(' ✦', '').trim();
  await pick.click();
  await expect.poll(() => ev(() => window.DreadDelve.wander.rt.attacks)).toBe(1);
  await expect.poll(() => ev(() => window.DreadDelve.get().log.slice(-6).map(l => l.m).join(' | '))).toContain(`Vasha ${weapon} → Wolf`);
  await expect.poll(() => ev(() => window.DreadDelve.fightFxCount().floats), { timeout:10_000 }).toBeGreaterThan(before);
  // the card comes once the blow has landed, at the top of the screen, not over the two of them
  const card = page.locator('#cardLayer .pop', { hasText:'Vasha → Wolf' });
  await expect(card).toBeVisible({ timeout:10_000 });
  // (read where it sits as it's found: on a slow machine the next turn's card can take its place a moment later)
  const [cb, vh] = [await card.first().evaluate(el => { const r = el.getBoundingClientRect(); return { y:r.y, height:r.height }; }), page.viewportSize().height];
  expect(cb.y + cb.height / 2).toBeLessThan(vh * .45);
  expect(errs).toEqual([]);
});
