import { test, expect, preparePage, arena } from './helpers.js';

// ⛨ Dread Delve's own rules (docs/homebrew/callings.md): the creator offers the Callings, their Paths, the Origins and
// our backgrounds (ChatGPT's data); a hero made from them plays with the Calling's features (game/calling.js,
// game/mechfx.js) and is named by them; the Classic switch gives the D&D classes back.
test('a Vanguard of the Hoplite Path, from the far-future Drawn, is made in the creator and plays as one', async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:900 } });
  const page = await context.newPage();
  const errors = await preparePage(page, { rules:'dread' });
  try {
    await arena(page);
    if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
    await page.locator('[data-act="tab"][data-k="tokens"]').click();
    await page.locator('[data-act="dmNewChar"]').first().click();
    const box = page.locator('#charBox');
    await expect(box.locator('select[data-cf="cls"]')).toHaveCount(0);
    // Muse's picker (ui/callingpicker.js): the twelve with their emblems; a card turns over to its Paths; Choose
    await box.locator('select[data-cf="lvl"]').selectOption('3');
    await box.locator('[data-cr="pickCalling"]').click();
    const picker = page.locator('#callingPicker');
    await expect(picker.locator('[data-cp-card]')).toHaveCount(12);
    await expect(picker.locator('[data-cp-card] svg')).toHaveCount(12);
    await picker.locator('[data-cp-card="vanguard"]').click();
    await expect(picker.locator('.cp-path.seep')).toHaveCount(1);
    await picker.locator('[data-cp-path="hoplite"]').click();
    await picker.locator('[data-cp="choose"]').click();
    await expect(picker).toHaveCount(0);
    await expect(box.locator('[data-cr="pickCalling"]')).toContainText('Vanguard');
    await expect(box.locator('[data-cr="pickCalling"] svg')).toHaveCount(1);
    await expect(box.locator('select[data-cf="path"]')).toHaveValue('hoplite');
    await expect(box.locator('.cr-calling')).toContainText('Ward');
    await box.locator('select[data-cf="origin"]').selectOption('drawn-future');
    await expect(box).toContainText('Failing Night-Sight');
    await box.locator('select[data-cf="back"]').selectOption('levy-veteran');
    await expect(box).toContainText('Hold the Line');
    // the sheet beside it, in our words: the Calling and Path, the Origin, no D&D class or subclass
    const sheet = box.locator('.sheet');
    await expect(sheet).toContainText('Vanguard · Hoplite 3');
    await expect(sheet.locator('.sheet-h svg')).toHaveCount(1);   // its emblem by the name
    await expect(sheet).toContainText('Last Signal');
    await expect(sheet).toContainText('Shield Rim');
    await expect(sheet).not.toContainText('Champion');
    await expect(sheet).not.toContainText('Fighter');
    // the Seep-touched Path says its price
    await expect(box.locator('select[data-cf="path"] option', { hasText:'☣' })).toHaveCount(1);
    await box.locator('input[data-cf="name"]').fill('Brannoc');
    await box.locator('input[data-cf="name"]').dispatchEvent('change');
    await box.locator('[data-cr="save"]').first().click();
    const t = await page.evaluate(() => { const D = window.DreadDelve, t = D.get().tokens.find(x => x.name === 'Brannoc'), sh = D.get().characters[t.charId];
      return { calling:t.calling, path:t.path, callName:t.callName, ward:t.ward, mechs:t.mechs.map(m => m.src), sw:(t.resources || []).find(r => r.dd === 'Second Wind')?.n, cls:t.cls,
        origin:sh.origin, back:sh.back, sp:sh.sp, bg:sh.bg }; });
    expect(t).toMatchObject({ calling:'vanguard', path:'hoplite', callName:'Vanguard · Hoplite', ward:{ max:10, now:10 }, origin:'drawn-future', back:'levy-veteran', sp:'Orc', bg:'Soldier' });
    expect(t.cls).toMatch(/^Fighter 3/);                  // the chassis underneath
    expect(t.mechs).toEqual(expect.arrayContaining(['Ward', 'Shield Rim']));
    expect(t.sw).toBeTruthy(); expect(t.sw).not.toBe('Second Wind');   // the chassis's feature in our words
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('the Classic switch gives the D&D classes back, and a classic hero has no Calling', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:900 } });
  const page = await context.newPage();
  const errors = await preparePage(page, { rules:'dread' });
  try {
    await arena(page);
    if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click();
    await page.locator('[data-act="tab"][data-k="tokens"]').click();
    await page.locator('[data-act="dmNewChar"]').first().click();
    const box = page.locator('#charBox');
    await box.locator('[data-cr="rules"][data-k="classic"]').click();
    await expect(box.locator('select[data-cf="cls"]')).toBeVisible();
    await expect(box.locator('[data-cr="pickCalling"]')).toHaveCount(0);
    await box.locator('select[data-cf="cls"]').selectOption('Rogue');
    await box.locator('input[data-cf="name"]').fill('Mirela');
    await box.locator('input[data-cf="name"]').dispatchEvent('change');
    await box.locator('[data-cr="save"]').first().click();
    const t = await page.evaluate(() => { const t = window.DreadDelve.get().tokens.find(x => x.name === 'Mirela'); return { calling:t.calling, mechs:(t.mechs || []).length, cls:t.cls }; });
    expect(t).toMatchObject({ calling:null, mechs:0 }); expect(t.cls).toMatch(/^Rogue/);
    expect(await page.evaluate(() => localStorage.getItem('dreaddelve.rules.v1'))).toBe('classic');
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

// ✦ ChatGPT's rites (data/rites.js): an Archivist's spells are Protocols, by our names, and cast as the spells they are
test('an Archivist casts by our names: the Protocol is renamed on the hero, spends its slot, and strikes', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page);
  const got = await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Wizard');
    Object.assign(h, { name:'Ilse', lvl:3, calling:'archivist', path:null });
    h.spells = [...new Set([...(h.spells || []), 'Magic Missile', 'Fire Bolt'])];
    const t = D.applyCharacter(h); t.floor = 0;
    const i = t.casts.findIndex(c => c.sn === 'Magic Missile'), mm = t.casts[i], fb = t.attacks.find(a => a.sn === 'Fire Bolt');
    const slots = () => (t.resources || []).filter(r => r.slot === 1).reduce((n, r) => n + (t.res[r.id] || 0), 0), before = slots();
    const z = D.placeMonster('zombie', { floor:0, x:t.x + 2, y:t.y }), hp = z.hp;
    const ok = D.castSpell(t.id, z.id, i);
    return { i, n:mm?.n, line:mm?.line, fb:fb?.n, ok, spent:before - slots(), hurt:z.hp < hp || z.dead, log:D.get().log.slice(-6).map(l => l.m).join(' | ') };
  });
  expect(got.i).toBeGreaterThanOrEqual(0);
  expect(got.n).toBeTruthy(); expect(got.n).not.toContain('Magic Missile'); expect(got.line).toBeTruthy();
  expect(got.fb).toBeTruthy(); expect(got.fb).not.toContain('Fire Bolt');
  expect(got.ok).toBe(true); expect(got.spent).toBe(1); expect(got.hurt).toBe(true);
  expect(got.log).toContain(got.n); expect(got.log).not.toContain('Magic Missile');
  await expect(page.locator('#cardLayer .pop', { hasText:got.n }).first()).toBeVisible();
});

// ⚙ A summoning feature (the Mistwalker's Wolfkin: Answering Howl): a wolf on the party's side, right after its caller in
// the turn order, drawn as a wolf; one at a time; gone when its minute is up, or when the fight ends
test('a Wolfkin Mistwalker calls a mist wolf that fights beside them for a minute', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page);
  const got = await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Druid');
    Object.assign(h, { name:'Vesna', lvl:3, calling:'mistwalker', path:'wolfkin' });
    const t = D.applyCharacter(h); t.floor = 0;
    const z = D.placeMonster('zombie', { floor:0, x:t.x + 4, y:t.y });
    D.rollInitiative({ ids:[t.id, z.id] });
    const r = t.resources.find(r => r.use === 'mech' && /Howl/.test(r.n));
    const ok = D.useFeature(t, r.id);
    const w = D.get().tokens.find(o => o.flags?.summon?.by === t.id), order = D.get().combat.order;
    // a second call sends the first back
    t.res[r.id] = 1; D.useFeature(t, r.id);
    const count = D.get().tokens.filter(o => o.flags?.summon?.by === t.id).length, w2 = D.get().tokens.find(o => o.flags?.summon?.by === t.id);
    return { ok, name:w?.name, kind:w?.kind, bid:w?.bid, hp:w?.hp, near:w && Math.max(Math.abs(w.x - t.x), Math.abs(w.y - t.y)) <= 2, after:order.indexOf(w2?.id) === order.indexOf(t.id) + 1, count, id:w2?.id, left:t.res[r.id] };
  });
  expect(got.ok).not.toBe(false);
  expect(got).toMatchObject({ kind:'npc', bid:'wolf', hp:15, near:true, after:true, count:1, left:0 });
  expect(got.name).toContain('Mist wolf');
  await expect(page.locator('#cardLayer .pop', { hasText:'Mist wolf' }).first()).toBeVisible();
  // its minute: ten rounds on, it goes at the next turn; and a fight's end sends any summon back
  const gone = await page.evaluate(id => { const D = window.DreadDelve; D.get().combat.round += 10; D.nextTurn(); return !D.get().tokens.some(o => o.id === id); }, got.id);
  expect(gone).toBe(true);
});

// ⛨ Levelling up a Calling's hero (game/wander.js levelGains, Muse's level-up screen): what it brings is the Calling's and
// the Path's own features and spells by our names, never the chassis's D&D features
test('a Calling\'s hero levelling up gains its own features, not the D&D class\'s', async ({ page }) => {
  const g = await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter');
    Object.assign(h, { name:'Brannoc', lvl:2, calling:'vanguard', path:'hoplite' });
    const a = D.wander.levelGains(h, { ...h, lvl:3 }), c = D.wander.levelGains({ ...h, calling:null, path:null }, { ...h, calling:null, path:null, lvl:3 });
    const w = D.newHero('Wizard'); Object.assign(w, { name:'Ilse', lvl:2, calling:'archivist' });
    const s = D.wander.levelGains({ ...w, spells:[] }, { ...w, spells:['Magic Missile'] });
    return { a:a.filter(x => x.kind === 'feature').map(x => x.name), c:c.filter(x => x.kind === 'feature').map(x => x.name), s:s.filter(x => x.kind === 'spell').map(x => x.name) }; });
  expect(g.a).toContain('Shield Rim');
  expect(g.a.join(' ')).not.toMatch(/Champion|Martial Archetype|Improved Critical/);
  expect(g.c.length).toBeGreaterThan(0);                       // a classic hero still gets the class's
  expect(g.s.length).toBe(1); expect(g.s[0]).not.toBe('Magic Missile');
});
