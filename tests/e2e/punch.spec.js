import { test, expect, preparePage } from './helpers.js';

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
// at the foe; V looks through their eyes (their own figure hidden), V again goes up above the fight, and V again
// comes back down behind them.
test('a fight is seen over the hero\'s shoulder, close; V looks through their eyes, from above and back', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const figOn = () => page.evaluate(() => { const D = window.DreadDelve; return D.tokenViews.get(D.wander.hero().id).group.userData.fig.visible; });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.shoulderNow())).toBe(true);
  expect(await figOn()).toBe(true);
  await page.keyboard.press('v');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.eyesNow())).toBe(true);
  await expect.poll(figOn).toBe(false);
  await page.screenshot({ path:'test-results/punch-eyes.png' });
  await page.keyboard.press('v');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.shoulderNow())).toBe(false);
  await expect.poll(figOn).toBe(true);
  await page.keyboard.press('v');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.shoulderNow())).toBe(true);
  expect(await page.evaluate(() => window.DreadDelve.eyesNow())).toBe(false);
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
  expect(await page.evaluate(() => window.DreadDelve.muffledNow())).toBe(2);   // (the music far away)
  await page.evaluate(() => { const h = window.DreadDelve.wander.hero(); h.hp = h.maxHp; });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.nearDeathNow())).toBe(0);
  expect(await page.evaluate(() => window.DreadDelve.muffledNow())).toBe(0);
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
    return { id:w.id, n:D.chipCount(), hud:document.querySelectorAll('#wdParty .wd-chip').length, jolt:!!document.querySelector('#wdParty .wd-m.hit') }; });
  expect(w.n).toBe(1);
  expect(w.hud).toBe(1);   // (and the party's bar on the screen drains the same way: ui/hpbar.js)
  expect(w.jolt).toBe(true);   // (its card jolts)
  const lost = await px(w.id, .8);   // (the part it took: pale, not the bar's red or its dark ground)
  expect(Math.min(...lost)).toBeGreaterThan(110);   // (white, or pale gold)
  await expect.poll(() => page.evaluate(() => window.DreadDelve.chipCount()), { timeout:20_000 }).toBe(0);
  const after = await px(w.id, .8);
  expect(Math.max(...after)).toBeLessThan(60);   // (drained: only the bar's dark ground)
  // a heal: the bar climbs towards a pale ghost of where it's going
  const h = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero();
    h.hp = 1; D.syncTokens(); D.renderHud(); h.hp = h.maxHp; D.syncTokens(); D.renderHud();
    return { id:h.id, n:D.chipCount(), glow:!!document.querySelector('#wdParty .wd-m.heal') }; });
  expect(h.n).toBe(1);
  expect(h.glow).toBe(true);   // (its card glows)
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

// 🧭 Your hero struck: a red arc at the edge of the view points at whoever struck them (the foe ahead: the top)
test('a blow on your hero shows where it came from', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const ids = await page.evaluate(() => { const D = window.DreadDelve; return { h:D.wander.hero().id, w:D.get().tokens.find(t => t.kind === 'monster').id }; });
  await page.waitForTimeout(1500);   // (the camera settled over the shoulder, facing the wolf)
  const d = await page.evaluate(({ h, w }) => { const D = window.DreadDelve, n = D.hitDirNow().shown; D.actOn(h, 'hit', w, { r:.2 }); return { n, now:D.hitDirNow() }; }, ids);
  expect(d.now.shown).toBe(d.n + 1);
  expect(d.now.deg <= 60 || d.now.deg >= 300).toBe(true);
  await expect(page.locator('#hitDir')).toHaveCount(1);
});

// ✨ A foe falls: what it was worth rises from it in gold
test('a fallen foe shows the XP it was worth', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const n0 = await page.evaluate(() => window.DreadDelve.xpFloatsShown());
  await page.evaluate(() => { const D = window.DreadDelve, w = D.get().tokens.find(t => t.kind === 'monster'); D.applyDamage(w, 9999, 'slashing', D.wander.hero().id); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.xpFloatsShown()), { timeout:20_000 }).toBe(n0 + 1);
  expect(await page.evaluate(() => window.DreadDelve.fightFxCount().texts.join(' '))).toMatch(/\+\d+ XP/);
});

// 🛡 A close miss on a shield or heavy armour is a block: they brace, sparks fly, BLOCKED
test('a close miss on a shield is blocked, not dodged', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const ids = await page.evaluate(() => { const D = window.DreadDelve; return { h:D.wander.hero().id, w:D.get().tokens.find(t => t.kind === 'monster').id }; });
  const b = await page.evaluate(({ h, w }) => { const D = window.DreadDelve, p0 = D.punchCount();
    D.actOn(h, 'miss', w, { block:true }); const p1 = D.punchCount(); D.actOn(w, 'miss', h, {}); const p2 = D.punchCount();
    return { blocks:p1.blocks - p0.blocks, dodges:p1.dodges - p0.dodges, then:p2.dodges - p1.dodges }; }, ids);
  expect(b).toEqual({ blocks:1, dodges:0, then:1 });
  // through the game: the wolf rolls a 10 and comes 3 short of a Fighter with a shield, so it's blocked
  const k0 = await page.evaluate(() => window.DreadDelve.punchCount().blocks);
  await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    h.shield = true; h.ac = 10 + w.attacks[0].b + 3; D.doAttack(w.id, h.id, 0, 'normal', { d20:10 }); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.punchCount().blocks), { timeout:20_000 }).toBe(k0 + 1);
  expect(await page.evaluate(() => window.DreadDelve.fightFxCount().texts.join(' '))).toContain('BLOCKED');
});

// ✨ Each spell its own look (ChatGPT's engine/spell-looks.js): Burning Hands in its own orange, Hold Person's chains on
// the one held, Web lingering on the ground; a spell on one creature keeps to a pillar or a touch whatever its look says
test('a spell is drawn in its own look, with its mark and its linger', async ({ page }) => {
  test.setTimeout(180_000);
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await fight(page, 'Wizard', ['Fire Bolt', 'Burning Hands']);
  const r = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster'), L = h.floor, W = D.get().floors[L].W;
    const out = {};
    D.spellFx({ L, by:h.id, at:w.id, n:'Burning Hands', ty:'fire', shape:'cone', squares:[w.y * W + w.x] }); out.bh = D.spellFxCount().last;
    const m0 = D.spellFxCount().marks;
    D.spellFx({ L, by:h.id, at:w.id, n:'Hold Person', cond:'paralyzed' }); out.hp = D.spellFxCount().last; out.marks = D.spellFxCount().marks - m0;
    D.spellFx({ L, by:h.id, at:w.id, n:'Acid Arrow', ty:'acid' }); out.aa = D.spellFxCount().last;   // (its look says line: one target keeps a touch)
    out.web = D.lookOf({ n:'Web' });
    out.heal = D.lookOf({ n:'Some Unknown Heal', k:'heal' });
    return out; });
  expect(r.bh).toMatchObject({ n:'Burning Hands', path:'cone', col:'#ffa13b' });
  expect(r.hp.mark).toBe('chains');
  expect(r.marks).toBe(1);
  expect(r.aa.path).toBe('touch');
  expect(r.web.linger).toBeGreaterThan(1);
  expect(r.heal.kind).toBe('heal');   // (no look of its own: the game's own heal colours)
  await expect.poll(() => page.evaluate(() => window.DreadDelve.spellFxCount().live), { timeout:30_000 }).toBe(0);
  expect(errs).toEqual([]);
});

// ⏩ The fight's pace (🎨 Look → Fights → Fight pace, per device: engine/pace.js): Brisk shortens a foe's wind-up and the
// waits between turns, and is remembered
test('a brisk fight pace shortens the foes\' turns', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await page.evaluate(() => window.DreadDelve.setGfx({ pace:'brisk' }));
  const ms = await page.evaluate(() => new Promise(res => { const D = window.DreadDelve; D.bus.on('aims', e => res(e.ms)); D.wander.endHeroTurn(); setTimeout(() => res(null), 30000); }));
  expect(ms).toBe(240);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('dreaddelve.gfx.v1')).pace)).toBe('brisk');
  await page.evaluate(() => window.DreadDelve.setGfx({ pace:'normal' }));
});

// 📳 In the Wanderer on a phone, a blow on the hero buzzes it (with the handheld's shell or without)
test('a blow on the hero buzzes the phone', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await page.evaluate(() => { window.__vib = []; navigator.vibrate = v => { window.__vib.push(v); return true; }; });
  await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster'); D.applyDamage(h, 40, 'piercing', w.id); });
  await expect.poll(() => page.evaluate(() => window.__vib.length), { timeout:20_000 }).toBeGreaterThan(0);
});

// 🪓 What struck matters (ChatGPT's engine/weapon-heft.js): a maul stops the world longer than a dagger for the same blow
test('a maul lands heavier than a dagger', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const r = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    D.actOn(w.id, 'hit', h.id, { r:.3, w:'Dagger', wt:'piercing' }); let now = performance.now(); const dagger = { heft:D.punchCount().heft, at100:D.worldSpeed(now + 100) };
    D.actOn(h.id, 'hit', w.id, { r:.3, w:'Maul', wt:'bludgeoning' }); now = performance.now(); const maul = { heft:D.punchCount().heft, at100:D.worldSpeed(now + 100) };
    return { dagger, maul }; });
  expect(r.maul.heft.stop).toBeGreaterThan(r.dagger.heft.stop);
  expect(r.dagger.at100).toBe(1);   // (the dagger's pause is over)
  expect(r.maul.at100).toBe(0);     // (the maul still holds the world)
});

// 🎯 The target card (Muse's ui/targetcard.js) in the fight bar: the foe's name, its health in words, never a number
test('the fight bar shows the target card, its health in words', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await expect(page.locator('#wdTarget .tc-card')).toBeVisible();
  await expect(page.locator('#wdTarget .tc-hw')).toHaveText('Unhurt');
  await page.evaluate(() => { const D = window.DreadDelve, w = D.get().tokens.find(t => t.kind === 'monster'); w.hp = Math.ceil(w.maxHp * .4); D.renderHud(); });
  await expect(page.locator('#wdTarget .tc-hw')).toHaveText('Bloodied');
  const text = await page.locator('#wdTarget').textContent();
  expect(text).toContain('Wolf');
  expect(text).not.toMatch(/\b\d+\s*\/\s*\d+\b|\b200\b|\b80\b/);   // (no hit points)
});

// ⚠ The squares the hero can walk to: those that would let the wolf swing at them as they leave its reach are red;
// after a Disengage, none are
test('moving out of a foe\'s reach is marked as risky, unless you disengage', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.fightFxCount().moves), { timeout:20_000 }).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.fightFxCount().risky)).toBeGreaterThan(0);
  const c = await page.evaluate(() => window.DreadDelve.fightFxCount());
  expect(c.risky).toBeLessThan(c.moves);   // (squares still beside the wolf are safe)
  await page.evaluate(() => { window.DreadDelve.wander.heroTurnAct('disengage'); window.DreadDelve.renderHud(); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.fightFxCount().risky), { timeout:20_000 }).toBe(0);
});

// 🩸 The blow that takes a foe to half its hit points: BLOODIED rises over it, and the captions say so
test('a foe taken to half its hit points is seen to be bloodied', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await page.evaluate(() => { const D = window.DreadDelve, w = D.get().tokens.find(t => t.kind === 'monster'); D.captions.setCaptions(true); D.applyDamage(w, 120, 'slashing', D.wander.hero().id); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.fightFxCount().texts.join(' ')), { timeout:20_000 }).toContain('BLOODIED');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.captions.captionLines().join(' | '))).toContain('The wolf is bloodied.');
  // (once: a second blow doesn't say it again)
  await page.evaluate(() => { const D = window.DreadDelve, w = D.get().tokens.find(t => t.kind === 'monster'); D.applyDamage(w, 5, 'slashing', D.wander.hero().id); });
  await page.waitForTimeout(1500);
  expect((await page.evaluate(() => window.DreadDelve.captions.captionLines())).filter(l => /bloodied/.test(l)).length).toBe(1);
});

// 🖼 The party list shows each hero's face (drawn a moment after the list itself)
test('the party list shows the heroes\' faces', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  await expect(page.locator('#wdParty .wd-face').first()).toBeVisible({ timeout:20_000 });
  expect(await page.locator('#wdParty .wd-face').first().getAttribute('src')).toMatch(/^data:image\//);
});

// 🙃 A natural 1: the attacker stumbles back, FUMBLE rises over them, and the captions say so
test('a natural 1 is a fumble: the attacker stumbles', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const f0 = await page.evaluate(() => window.DreadDelve.punchCount().fumbles || 0);
  await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster'); D.captions.setCaptions(true); D.doAttack(h.id, w.id, 0, 'normal', { d20:1 }); });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.punchCount().fumbles || 0), { timeout:20_000 }).toBe(f0 + 1);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.fightFxCount().texts.join(' '))).toContain('FUMBLE');
  await expect.poll(() => page.evaluate(() => window.DreadDelve.captions.captionLines().join(' | '))).toContain('Vasha fumbles, and misses the wolf.');
});

// 🤚 Shove (engine/shove.js), in place of a strike: the wolf (who can't save) is pushed a square away, or knocked prone;
// a huge creature can't be shoved
test('a shove pushes a foe back or knocks it prone, in place of a strike', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const r = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    w.saves = { str:-30, dex:-30 }; const was = { x:w.x, y:w.y }, gap = Math.max(Math.abs(w.x - h.x), Math.abs(w.y - h.y));
    D.wander.heroShove('push'); return { gap, was, now:{ x:w.x, y:w.y }, gapNow:Math.max(Math.abs(w.x - h.x), Math.abs(w.y - h.y)), left:D.wander.attacksLeft() }; });
  expect(r.gap).toBe(1);
  expect(r.gapNow).toBe(2);                    // (one square further away)
  expect(r.left).toBeFalsy();                  // (it took the strike)
  await expect.poll(() => page.evaluate(() => window.DreadDelve.fightFxCount().texts.join(' '))).toContain('SHOVED');
  // prone, through the game itself (the next turn's strike, beside it again)
  const p = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    w.x = h.x + (w.x > h.x ? 1 : w.x < h.x ? -1 : 0); w.y = h.y + (w.y > h.y ? 1 : w.y < h.y ? -1 : 0); D.syncTokens();
    return D.shove(h.id, w.id, 'prone'); });
  expect(p).toBe('prone');
  expect(await page.evaluate(() => window.DreadDelve.get().tokens.find(t => t.kind === 'monster').conds.some(c => c.n === 'prone'))).toBe(true);
  expect(await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster'); w.size = 3; return D.shove(h.id, w.id, 'push'); })).toBe(false);
});

// 🥁 The fight's music (ChatGPT's engine/battle-music.js): a wolf is a skirmish; the hero alone near death, a last stand
test('the fight\'s music follows the danger', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  expect(await page.evaluate(() => window.DreadDelve.fightMusicNow().wanted)).toBe('skirmish');
  await page.evaluate(() => { const h = window.DreadDelve.wander.hero(); h.hp = 10; });
  expect(await page.evaluate(() => window.DreadDelve.fightMusicNow().wanted)).toBe('lastStand');
});

test('a party that falls sees the Mists close over them, and rises where they last rested', async ({ page }) => {
  test.setTimeout(240_000);
  await fight(page);
  // the wolf's blow puts Vasha down: the whole party is down
  await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    D.applyDamage(h, 999, 'piercing', w.id); });
  // the defeat screen, over the fight's own scorecard: the words, the hero, where they'll wake (the village they set out from)
  await expect(page.locator('#defeat')).toBeVisible({ timeout:90_000 });
  await expect(page.locator('#defeat')).toContainText('The Mists close over you');
  await expect(page.locator('#defeat')).toContainText('Vasha');
  await expect(page.locator('#defeat')).toContainText('Village of Barovia');
  if (process.env.SHOT) await page.screenshot({ path:process.env.SHOT });
  expect(await page.evaluate(() => window.DreadDelve.get().combat.active)).toBe(false);
  // it waits for the player (the old card went on its own after 2.6 s): Escape rises
  await page.waitForTimeout(3000);
  await expect(page.locator('#defeat')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#defeat')).toHaveCount(0);
  await expect(page.locator('#defeatMist')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => { const h = window.DreadDelve.wander.hero(); return !!h && !h.dead && h.hp > 0; }), { timeout:30_000 }).toBe(true);
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
});

test('on a phone the fight fits the handheld: the fight bar in its lower screen, one small card, the voice on the screen', async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  const page = await context.newPage();
  const errors = await preparePage(page);
  try {
    await fight(page);
    expect(await page.evaluate(() => document.body.classList.contains('hh'))).toBe(true);
    // the fight bar and the target card inside the lower screen (a later rule once made the bar wider than the phone)
    const r = await page.evaluate(() => { const b = s => document.querySelector(s)?.getBoundingClientRect();
      const sub = b('#hhSub'), f = b('#wdFight'), t = b('#wdTarget'); return { sub:[sub.left, sub.right], f:[f.left, f.right], t:t ? [t.left, t.right] : null, vw:innerWidth }; });
    expect(r.f[0]).toBeGreaterThanOrEqual(r.sub[0] - 1); expect(r.f[1]).toBeLessThanOrEqual(r.sub[1] + 1);
    if (r.t){ expect(r.t[0]).toBeGreaterThanOrEqual(r.sub[0] - 1); expect(r.t[1]).toBeLessThanOrEqual(r.sub[1] + 1); }
    // three cards in a row: only the newest stays on the handheld's screen, small, low on it
    await page.evaluate(() => { const D = window.DreadDelve; for (const n of [1, 2, 3]) D.showCard({ title:`Card ${n}`, lines:['d20 12 +4 = 16 vs AC 12 — HIT'] }, false); });
    await expect(page.locator('#cardLayer .pop')).toHaveCount(1);
    await expect(page.locator('#cardLayer .pop')).toContainText('Card 3');
    const c = await page.evaluate(() => { const p = document.querySelector('#cardLayer .pop').getBoundingClientRect(), cs = getComputedStyle(document.body);
      const y = parseFloat(cs.getPropertyValue('--hh-scr-y')), h = parseFloat(cs.getPropertyValue('--hh-scr-h')); return { top:p.top, bottom:p.bottom, height:p.height, y, h }; });
    expect(c.top).toBeGreaterThan(c.y + c.h / 2); expect(c.bottom).toBeLessThanOrEqual(c.y + c.h); expect(c.height).toBeLessThan(110);
    // the hero's voice: on the screen, not over the buttons on the body below it
    await page.evaluate(() => window.DreadDelve.wander.heroAttack(0));
    await expect(page.locator('#voiceCap.on')).toBeVisible({ timeout:30_000 });
    const v = await page.evaluate(() => { const r = document.querySelector('#voiceCap').getBoundingClientRect(), cs = getComputedStyle(document.body);
      return { bottom:r.bottom, end:parseFloat(cs.getPropertyValue('--hh-scr-y')) + parseFloat(cs.getPropertyValue('--hh-scr-h')) }; });
    expect(v.bottom).toBeLessThanOrEqual(v.end);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('a Ward takes a blow before the hit points, breaks, and is seen to', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const r = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    h.ward = { max:10, now:10, hit:false }; const hp0 = h.hp, f0 = D.wardFloats();
    D.applyDamage(h, 4, 'piercing', w.id); const a = { hp:h.hp, ward:h.ward.now };
    D.applyDamage(h, 9, 'piercing', w.id); const b = { hp:h.hp, ward:h.ward.now };
    return { hp0, a, b, f0 }; });
  expect(r.a).toEqual({ hp:r.hp0, ward:6 });          // all of it soaked
  expect(r.b).toEqual({ hp:r.hp0 - 3, ward:0 });      // it breaks, and the rest gets through
  await expect.poll(() => page.evaluate(() => window.DreadDelve.wardFloats())).toBeGreaterThan(r.f0);
  // a long rest makes it whole
  await page.evaluate(() => { const D = window.DreadDelve; D.wander.hero().ward.now = 0; });
  expect(await page.evaluate(() => { const D = window.DreadDelve; D.endCombat?.(); D.longRest([D.wander.hero()], true); return D.wander.hero().ward.now; })).toBe(10);
});

test('a Calling\'s features work in a fight: advantage, extra damage, a resistance, a Ward, temporary hit points for a kill', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const ids = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    w.hp = w.maxHp = 200;
    D.applyMechs(h, [{ k:'advantage', on:'attack', when:'always', src:'Steady Eye' }, { k:'extraDamage', dice:'3', type:'fire', when:'firstHitEachTurn', src:'Shardfire' },
      { k:'resist', types:['piercing'], src:'Thick Hide' }, { k:'ward', max:'10', src:'Ward' }, { k:'tempHp', amount:'7', when:'kill', src:'Blood Price' }]);
    return { h:h.id, w:w.id }; });
  // advantage shows in the odds before the swing
  expect(await page.evaluate(() => JSON.stringify(window.DreadDelve.wander.strikeOdds(0)?.edge) || '')).toMatch(/Steady Eye/);
  // a hit (the d20 at 15): the extra fire, named on the card, once a turn
  await page.evaluate(({ h, w }) => window.DreadDelve.doAttack(h, w, 0, 'normal', { d20:15 }), ids);
  await expect(page.locator('#cardLayer')).toContainText('Shardfire', { timeout:15_000 });
  // a piercing blow of 10: halved by the resistance, then all of it into the Ward (10 → 5)
  const r = await page.evaluate(({ h, w }) => { const D = window.DreadDelve, t = D.tokById(h), hp = t.hp; D.applyDamage(t, 10, 'piercing', w); return { hp0:hp, hp:t.hp, ward:t.ward.now }; }, ids);
  expect(r).toEqual({ hp0:r.hp0, hp:r.hp0, ward:5 });
  // the kill: temporary hit points
  const thp = await page.evaluate(({ h, w }) => { const D = window.DreadDelve; D.applyDamage(D.tokById(w), 999, 'fire', h); return D.tokById(h).thp; }, ids);
  expect(thp).toBe(7);
});

test('an aura gives those on its side within reach what it gives, and the bearer too', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const r = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero();
    D.applyMechs(h, [{ k:'aura', radius:10, gives:{ k:'resist', types:['piercing'] }, src:'Oath of the Hearth' }]);
    const hp = h.hp; D.applyDamage(h, 10, 'piercing', null); const took = hp - h.hp;
    const srcs = D.mechsFor(h).map(m => m.src);
    const w = D.get().tokens.find(t => t.kind === 'monster'), wm = D.mechsFor(w).length;   // (a foe gets none of it)
    return { took, srcs, wm }; });
  expect(r.took).toBe(5);
  expect(r.srcs).toEqual(['Oath of the Hearth']);
  expect(r.wm).toBe(0);
});

test('a feature you use: a heal from the Actions list, and a Seep-touched one takes its price until a long rest', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const r = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero();
    D.applyMechs(h, [{ k:'heal', amount:'5', uses:'2/longRest', src:'Field Rites' }, { k:'heal', amount:'4', src:'Mender of the Choir', also:[{ k:'seepCost', what:'maxHp', amount:'3' }] }]);
    const list = D.wander.heroFeatures().map(f => [f.id, f.left]);
    h.hp = 100; const max0 = h.maxHp;
    D.wander.heroFeature('m-field-rites'); const a = h.hp;
    return { list, a, max0 }; });
  expect(r.list).toEqual(expect.arrayContaining([['m-field-rites', 2], ['m-mender-of-the-choir', 1]]));
  expect(r.a).toBe(105);
  await expect(page.locator('#cardLayer')).toContainText('Field Rites');
  // the Seep-touched one: its heal, and the hit point maximum it takes
  const s = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(); D.useFeature(h, 'm-mender-of-the-choir', h); return { max:h.maxHp, drain:h.seepDrain }; });
  expect(s).toEqual({ max:r.max0 - 3, drain:3 });
  // a long rest gives it back, and the uses
  const z = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(); D.longRest([h], true); return { max:h.maxHp, hp:h.hp, left:h.res['m-field-rites'] }; });
  expect(z).toEqual({ max:r.max0, hp:r.max0, left:2 });
});

test('reactions fire on their own, once a round: a blow taken less, an ally who drops steadied', async ({ page }) => {
  test.setTimeout(180_000);
  await fight(page);
  const r = await page.evaluate(() => { const D = window.DreadDelve, h = D.wander.hero(), w = D.get().tokens.find(t => t.kind === 'monster');
    D.applyMechs(h, [{ k:'reaction', trigger:'hit', does:{ k:'reduce', amount:'4' }, src:'Brace' }]);
    const hp = h.hp; D.applyDamage(h, 10, '', w.id); const first = hp - h.hp;
    const hp2 = h.hp; D.applyDamage(h, 10, '', w.id); const second = hp2 - h.hp;   // (once a round: the second is whole)
    return { first, second }; });
  expect(r).toEqual({ first:6, second:10 });
  await expect.poll(() => page.evaluate(() => window.DreadDelve.fightFxCount().texts.join(' ')), { timeout:10_000 }).toMatch(/BRACE/);
});
