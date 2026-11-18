import { test, expect } from './helpers.js';

// 💥 A blow felt (render/punch.js): the attacker lunges, the world holds still for an instant at the impact, the one
// struck is knocked back and left a splash on the ground; a miss sways aside; a killing blow runs slow and the body
// stays where it was thrown; when the fight's over the ground is wiped.
async function fight(page, cls = 'Fighter', spells = null){
  await page.evaluate(([c, sp]) => { const D = window.DreadDelve, h = D.newHero(c); h.name = 'Vasha'; h.id = 'vasha-punch'; if (sp) h.spells = sp;
    localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role'); }, [cls, spells]);
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
  await expect.poll(() => page.evaluate(() => window.DreadDelve.deathFxCount().dusts)).toBeGreaterThan(0);   // (🌫 the dust as it lands)
  await page.screenshot({ path:'test-results/punch-kill.png' });
});

// ⚔ Over the shoulder (ui/followcam.js): in a fight the camera stands low and close behind the hero, looking past them
// at the foe; V goes up above the fight and V again comes back down.
test('a fight is seen over the hero\'s shoulder, close; V looks from above and back', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.shoulderNow())).toBe(true);
  await page.keyboard.press('v');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.shoulderNow())).toBe(false);
  await page.keyboard.press('v');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.shoulderNow())).toBe(true);
});

// ✨ Spells seen (render/spellfx.js): a spell cast through the game is drawn (Burning Hands pours out of the caster),
// and every shape of spell draws without an error
test('a spell cast is seen: a cone, a burst, a bolt, darts, a pillar, a heal', async ({ page }) => {
  test.setTimeout(180_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await fight(page, 'Wizard', ['Fire Bolt', 'Burning Hands', 'Magic Missile']);
  const n0 = await page.evaluate(() => window.DreadDelve.spellFxCount().made);
  const r = await page.evaluate(() => { const D = window.DreadDelve, bh = D.wander.spellList().find(s => /Burning/.test(s.n)); if (!bh) return 'none'; D.wander.heroCast(bh); return 'cast'; });
  expect(r).toBe('cast');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.spellFxCount().made)).toBeGreaterThan(n0);
  // every path, by hand
  await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster'), f = D.get().floors[h.floor], L = h.floor;
    const near = [(w.y) * f.W + w.x, (w.y) * f.W + w.x + 1];
    D.spellFx({ L, by:h.id, at:w.id, ty:'fire', shape:'sphere', origin:{ x:w.x + .5, y:w.y + .5 }, squares:near });
    D.spellFx({ L, by:h.id, at:w.id, ty:'thunder', shape:'cube', self:true, origin:{ x:h.x + .5, y:h.y + .5 }, squares:near });
    D.spellFx({ L, by:h.id, ty:'lightning', shape:'line', squares:near });
    D.spellFx({ L, by:h.id, at:w.id, ty:'force', k:'auto', darts:3 });
    D.spellFx({ L, by:h.id, at:w.id, ty:'radiant' });
    D.spellFx({ L, by:h.id, at:h.id, k:'heal' }); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.spellFxCount().live)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.spellFxCount().live), { timeout:20_000 }).toBe(0);
  expect(errs).toEqual([]);
});

// 🌀 What they're under, on them (render/condfx.js): conditions show on the figures for as long as they last, and go
test('conditions show on the figures, and go when they end', async ({ page }) => {
  test.setTimeout(180_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await fight(page);
  const ids = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    h.dodge = true; h.conc = { n:'Bless' }; w.conds = [{ n:'prone', r:1 }, { n:'poisoned', r:3 }]; return { h:h.id, w:w.id }; });
  await expect.poll(() => page.evaluate(i => window.DreadDelve.condFxOn()[i.w], ids)).toBe('down,poisoned');
  await expect.poll(() => page.evaluate(i => window.DreadDelve.condFxOn()[i.h], ids)).toMatch(/conc.*dodging/);   // (a wolf's bite may have knocked them down too)
  await page.evaluate(i => { const D = window.DreadDelve, w = D.get().tokens.find(t => t.id === i.w); w.conds = []; }, ids);
  await expect.poll(() => page.evaluate(i => window.DreadDelve.condFxOn()[i.w], ids)).toBe('');
  expect(errs).toEqual([]);
});

// ☠ How it dies (render/deathfx.js): a Seepling melts away and leaves no body; a wolf falls and stays
test('a creature dies in its own way: the Seep melts away, a wolf falls', async ({ page }) => {
  test.setTimeout(180_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await fight(page);
  const ids = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    const s = D.placeMonster('seepling', { floor:w.floor, x:w.x, y:w.y }); w.flags.gone = true;
    s.hp = 0; s.dead = true; D.holdFall(s.id, 500); D.actOn(s.id, 'hit', h.id, { r:1, kill:true }); D.syncTokens(); return { s:s.id, w:w.id, h:h.id }; });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.deathFxCount().made)).toBeGreaterThan(0);
  // gone: nothing of it is drawn
  await expect.poll(() => page.evaluate(i => window.DreadDelve.tokenViews.get(i.s).group.children.every(c => !c.visible), ids), { timeout:15_000 }).toBe(true);
  const fell = await page.evaluate(i => { const D = window.DreadDelve, w = D.get().tokens.find(t => t.id === i.w); w.flags.gone = false; w.hp = 0; w.dead = true;
    D.holdFall(w.id, 500); D.actOn(w.id, 'hit', i.h, { r:1, kill:true }); D.syncTokens(); return true; }, ids);
  expect(fell).toBe(true);
  await page.waitForTimeout(2500);
  expect(await page.evaluate(i => window.DreadDelve.tokenViews.get(i.w).group.userData.fig.visible, ids)).toBe(true);
  expect(errs).toEqual([]);
});

// 🗡 The swing's arc (render/trails.js): a forged hero's sword leaves a bright smear as it swings, gone once it's done
test('a sword swing leaves an arc through the air', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    D.actOn(h.id, 'attack', w.id, {}); const rig = D.tokenViews.get(h.id).group.userData.fig.userData.rig;
    for (const a of [rig.action, rig.clip]) if (a) a.dur = 10; });   // (a slow swing: this browser draws a frame or two a second)
  await expect.poll(() => page.evaluate(() => window.DreadDelve.trailCount()), { timeout:20_000 }).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.trailCount()), { timeout:30_000 }).toBe(0);
});

// 🩸 A foe at half its hit points or less drips; 💓 a hero near death has the screen's edges pulse with the heart
test('a bloodied foe drips, and a hero near death feels it', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const w = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster'); w.flags.bloodied = true; w.hp = 3; h.hp = Math.max(1, Math.round(h.maxHp * .1)); return w.id; });
  await expect.poll(() => page.evaluate(i => window.DreadDelve.condFxOn()[i], w)).toBe('bloodied');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.nearDeathNow())).toBe(2);
  await page.evaluate(() => { const h = window.DreadDelve.wander.hero(); h.hp = h.maxHp; });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.nearDeathNow())).toBe(0);
});

// ⚠ A foe shows what it means to do (game/wander.js): its turn begins with a wind-up at the one it's going for
test('a foe winds up before it acts', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const a0 = await page.evaluate(() => window.DreadDelve.punchCount().aims);
  await page.keyboard.press('n');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.punchCount().aims), { timeout:30_000 }).toBeGreaterThan(a0);
});

// 🏹 A thrown javelin stays where it went: in the wolf, or in the ground past it
test('a javelin thrown stays where it went', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), f = D.get().floors[h.floor], w = D.get().tokens.find(t => t.kind === 'monster');
    for (const [dx, dy] of [[0, -3], [3, 0], [0, 3], [-3, 0], [2, -2], [-2, 2], [2, 2], [-2, -2]]){ const x = h.x + dx, y = h.y + dy;
      if (f.grid[y * f.W + x] === 1 && !D.get().tokens.some(t => t.x === x && t.y === y)){ w.x = x; w.y = y; break; } }
    D.syncTokens(); D.wander.rt.target = w.id; });
  const r = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), i = h.attacks.findIndex(a => /javelin/i.test(a.n)); if (i >= 0) D.wander.heroAttack(i); return i; });
  expect(r).toBeGreaterThanOrEqual(0);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.stuckCount()), { timeout:15_000 }).toBeGreaterThan(0);
});

// 🕊 Calm effects (the Look panel): a crit lands without the world stopping, and without a flash over the screen
test('with calm effects on, a blow never stops the world or flashes the screen', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await page.evaluate(() => window.DreadDelve.setGfx({ calm:true }));
  const r = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    D.actOn(w.id, 'hit', h.id, { r:.5, crit:true }); return D.worldSpeed(); });
  expect(r).toBe(1);
  expect(await page.evaluate(() => { const el = document.getElementById('punchScreen'); return el ? el.getAnimations().length : 0; })).toBe(0);
  await page.evaluate(() => window.DreadDelve.setGfx({ calm:false }));
});

// 💨 A Dash leaves a sheet behind the runner (render/trails.js)
test('a hero running on a Dash leaves a trail', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await page.evaluate(() => { const D = window.DreadDelve, w = D.wander, h = w.hero(), f = D.get().floors[h.floor];
    w.heroTurnAct('dash');
    for (const [dx, dy] of [[0, 5], [5, 0], [0, -5], [-5, 0], [4, 4], [-4, -4], [4, -4], [-4, 4]]){ const x = h.x + dx, y = h.y + dy;
      if (f.grid[y * f.W + x] === 1 && !D.get().tokens.some(t => t.x === x && t.y === y) && w.walkTo(x, y)) break; } });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.trailCount()), { timeout:20_000 }).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.DreadDelve.deathFxCount().dusts)).toBeGreaterThan(0);   // (🌫 its first stride kicks up dust)
});

// 💔 A blow doesn't just shorten a health bar: what it took flashes, holds and drains away; a heal climbs
test('a health bar drains after a blow and climbs after a heal', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  // (a pixel of a plate's bar, at `at` along it)
  const px = (id, at) => page.evaluate(([id, at]) => { const b = window.DreadDelve.tokenViews.get(id).label.userData.bar;
    return [...b.ctx.getImageData(Math.round(b.x + b.w * at), b.y + 4, 1, 1).data].slice(0, 3); }, [id, at]);
  // (the hero's: a foe's hit points aren't on its plate in the Wanderer, as on a player's screen)
  const w = await page.evaluate(() => { const D = window.DreadDelve, w = D.wander.hero();
    w.hp = w.maxHp; D.syncTokens(); D.renderHud(); w.hp = Math.max(1, Math.floor(w.maxHp / 4)); D.syncTokens(); D.renderHud();
    return { id:w.id, n:D.chipCount(), hud:document.querySelectorAll('#wdParty .wd-chip').length }; });
  expect(w.n).toBe(1);
  expect(w.hud).toBe(1);   // (and the party's bar on the screen drains the same way: ui/hpbar.js)
  const lost = await px(w.id, .8);   // (the part it took: pale, not the bar's red or its dark ground)
  expect(Math.min(...lost)).toBeGreaterThan(110);   // (white, or pale gold)
  await expect.poll(() => page.evaluate(() => window.DreadDelve.chipCount()), { timeout:20_000 }).toBe(0);
  const after = await px(w.id, .8);
  expect(Math.max(...after)).toBeLessThan(60);   // (drained: only the bar's dark ground)
  // a heal: the bar climbs towards a pale ghost of where it's going
  const h = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero();
    h.hp = 1; D.syncTokens(); h.hp = h.maxHp; D.syncTokens(); return { id:h.id, n:D.chipCount() }; });
  expect(h.n).toBe(1);
  const ghost = await px(h.id, .8);
  expect(ghost[1]).toBeGreaterThan(ghost[0]);   // (the green ghost, not the fill yet)
  await expect.poll(() => page.evaluate(() => window.DreadDelve.chipCount()), { timeout:20_000 }).toBe(0);
});

// 🏁 The blow that ends the fight: the last foe falls in a long slow motion, a ring of force running out from it
test('the last foe\'s fall runs slow, with a ring of force; one with others still up doesn\'t', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  // (a second wolf, in the fight too)
  const ids = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), f = D.get().floors[h.floor], s = D.get();
    for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2]]){ const x = h.x + dx, y = h.y + dy;
      if (f.grid[y * f.W + x] && !s.tokens.some(t => t.x === x && t.y === y)){ D.placeMonster('wolf', { floor:h.floor, x, y }); break; } }
    const ws = s.tokens.filter(t => t.kind === 'monster'), b = ws.at(-1); b.hp = b.maxHp = 200;
    if (!s.combat.order.includes(b.id)) s.combat.order.push(b.id); D.syncTokens();
    return { h:h.id, a:ws[0].id, b:b.id }; });
  const kill = (w) => page.evaluate(({ h, w }) => { const D = window.DreadDelve, t = D.get().tokens.find(o => o.id === w);
    t.hp = 0; t.dead = true; D.actOn(w, 'hit', h, { r:1, kill:true }); return D.punchCount().lasts; }, { h:ids.h, w });
  const l0 = await page.evaluate(() => window.DreadDelve.punchCount().lasts);
  expect(await kill(ids.a)).toBe(l0);   // (another wolf still stands)
  await expect.poll(() => page.evaluate(() => window.DreadDelve.worldSpeed())).toBe(1);
  // held, then slow for over a second (this browser draws a frame or two a second: the world's speed is read at a time
  // on from the blow, not waited for)
  const sp = await page.evaluate(({ h, w }) => { const D = window.DreadDelve, t = D.get().tokens.find(o => o.id === w);
    t.hp = 0; t.dead = true; D.actOn(w, 'hit', h, { r:1, kill:true }); const now = performance.now();
    return { lasts:D.punchCount().lasts, at0:D.worldSpeed(now + 50), at600:D.worldSpeed(now + 600), at1100:D.worldSpeed(now + 1100), at2500:D.worldSpeed(now + 2500) }; }, { h:ids.h, w:ids.b });
  expect(sp.lasts).toBe(l0 + 1);
  expect(sp.at0).toBe(0); expect(sp.at600).toBeLessThan(.5); expect(sp.at1100).toBeLessThan(.5); expect(sp.at2500).toBe(1);
  // and once it has fallen, the fight won: the victory screen, over the fight's own scorecard (not a fight lost)
  await expect(page.locator('#victory')).toBeVisible({ timeout:30_000 });
  expect(await page.evaluate(() => window.DreadDelve.wander.W().trophies?.got || [])).not.toContain('flee');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.worldSpeed())).toBe(1);
});

// ⚔ Your turn: a gold band sweeps across with the words, and the round's number when a new one has begun
test('the turn coming round is announced, with the round', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.turnBannerNow().shown)).toBeGreaterThan(0);
  const b0 = await page.evaluate(() => window.DreadDelve.turnBannerNow());
  expect(b0.last).toContain('Your turn');
  await expect(page.locator('#yourTurn')).toHaveAttribute('role', 'status');
  // round two: end the turn, the wolf goes, and it's ours again
  await page.evaluate(() => { const D = window.DreadDelve; D.get().tokens.filter(t => t.kind === 'monster').forEach(t => { t.hp = t.maxHp = 500; }); D.wander.endHeroTurn(); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.turnBannerNow().shown), { timeout:60_000 }).toBeGreaterThan(b0.shown);
  expect((await page.evaluate(() => window.DreadDelve.turnBannerNow())).last).toMatch(/Your turn · Round [2-9]/);
});
