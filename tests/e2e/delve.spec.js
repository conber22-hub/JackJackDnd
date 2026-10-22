import { test, expect, startDM, arena, idle, expectPositions, selectHero, frameMap, clickTile, tilePoint } from './helpers.js';

test('starts a seeded delve as DM', async ({ page }) => {
  await startDM(page, 'andral', '3');
  await expect(page.locator('#roleBadge')).toHaveText('DM');
  await expect(page.locator('#stage canvas')).toBeVisible();
  expect(await page.evaluate(() => {
    const D = window.DreadDelve, s = D.get();
    return { role:D.ui.role, seed:s.meta.seed, floors:s.floors.length, heroes:s.tokens.filter(t => t.kind === 'pc').length };
  })).toEqual({ role:'dm', seed:'e2e-dread-delve', floors:3, heroes:0 });
  await expect(page.locator('#floorLabel')).not.toBeEmpty();
});

test('adds heroes through the Tokens tab', async ({ page }) => {
  await startDM(page);
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  for (const name of ['Ada', 'Bram']){
    await page.locator('#newName').fill(name);
    await page.locator('[data-act="addPc"]').click();
    await expect(page.locator('#tabBody .nm').filter({ hasText:name })).toBeVisible();
  }
  await idle(page);
  expect(await page.evaluate(() => {
    const s = window.DreadDelve.get();
    return s.tokens.map(t => ({ name:t.name, kind:t.kind, alive:!t.dead,
      onFloor:t.floor === 0 && s.floors[0].grid[t.y * s.floors[0].W + t.x] > 0 }));
  })).toEqual([
    { name:'Ada', kind:'pc', alive:true, onFloor:true },
    { name:'Bram', kind:'pc', alive:true, onFloor:true },
  ]);
});

test('a hero walks to a clicked tile and the party follows in marching order', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }, { name:'Cora', x:4, y:10 }]);
  await frameMap(page);
  await selectHero(page);
  await clickTile(page, 10, 10);
  await expectPositions(page, { Ada:{ x:10, y:10 }, Bram:{ x:9, y:10 }, Cora:{ x:8, y:10 } });
});

test('drags a mini along a bent route and shows its movement cost', async ({ page }) => {
  await arena(page);
  await frameMap(page);
  const start = await tilePoint(page, 6, 10);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (const [x, y] of [[7, 10], [7, 11], [8, 11], [9, 11]]){
    const p = await tilePoint(page, x, y);
    await page.mouse.move(p.x, p.y, { steps:6 });
  }
  await expect(page.locator('#moveTip')).toContainText('20 ft');
  await page.mouse.up();
  await expectPositions(page, { Ada:{ x:9, y:11 } });
  await expect(page.locator('#moveTip')).not.toHaveClass(/show/);
  expect(await page.evaluate(() => window.DreadDelve.tokById(window.DreadDelve.ui.selected).name)).toBe('Ada');
});

test('Strike spends the opportunity reaction and the paused walk continues', async ({ page }) => {
  await arena(page);
  await page.evaluate(() => {
    const D = window.DreadDelve;
    const enemy = D.placeMonster('husk', { floor:0, x:7, y:10 });
    // A harmless melee hit/miss must never kill or restrain the mover.
    enemy.attacks = [{ n:'Practice sword', b:2, d:'1', t:'slashing' }];
    D.get().tokens.find(t => t.name === 'Ada').init = 100;
  });
  await idle(page);
  await frameMap(page);
  await page.getByRole('button', { name:/Roll initiative/ }).click();
  await selectHero(page);
  await clickTile(page, 3, 10);
  await expect(page.locator('#oaPanel')).toContainText("Ada leaves");
  await expectPositions(page, { Ada:{ x:6, y:10 } });
  expect(await page.evaluate(() => {
    const D = window.DreadDelve, t = D.get().tokens.find(t => t.name === 'Ada');
    return { active:D.get().combat.active, paused:D.moves.pausedMover(t.id) };
  })).toEqual({ active:true, paused:true });
  await page.locator('#oaPanel').getByRole('button', { name:'Strike', exact:true }).click();
  await expect(page.locator('#oaPanel')).toBeEmpty();
  await expectPositions(page, { Ada:{ x:3, y:10 } });
  expect(await page.evaluate(() => {
    const D = window.DreadDelve, s = D.get(), hero = s.tokens.find(t => t.name === 'Ada');
    return { reacted:s.tokens.find(t => t.kind === 'monster').reacted,
      paused:D.moves.pausedMover(hero.id), alive:!hero.dead, moved:hero.moved,
      struck:s.log.some(l => l.m.includes('takes the opportunity')) };
  })).toEqual({ reacted:true, paused:false, alive:true, moved:3, struck:true });
});

test('Dash extends movement and Undo move restores position and movement spent', async ({ page }) => {
  await arena(page);
  await frameMap(page);
  await page.getByRole('button', { name:/Roll initiative/ }).click();
  await selectHero(page);
  await page.locator('#selCard [data-act="turnAct"][data-k="dash"]').click();
  await clickTile(page, 14, 10); // 40 ft: beyond the hero's normal 30 ft speed.
  await expectPositions(page, { Ada:{ x:14, y:10 } });
  expect(await page.evaluate(() => {
    const t = window.DreadDelve.get().tokens[0];
    return { moved:t.moved, dashed:t.dashed };
  })).toEqual({ moved:8, dashed:true });
  await page.locator('#selCard [data-act="undoMove"]').click();
  await expectPositions(page, { Ada:{ x:6, y:10 } });
  expect(await page.evaluate(() => {
    const t = window.DreadDelve.get().tokens[0];
    return { moved:t.moved, dashed:t.dashed, lastMove:t.lastMove };
  })).toEqual({ moved:0, dashed:true, lastMove:null });
});

test('Castle Ravenloft loads and displays all five floors', async ({ page }) => {
  const names = ['The Approach', 'The Great Halls', 'The Upper Keep', 'The Dungeons', 'The Catacombs'];
  await startDM(page, 'ravenloft', null); // Keep the template's own floor count.
  expect(await page.evaluate(() => {
    const s = window.DreadDelve.get();
    return { template:s.meta.template, size:s.meta.size,
      floors:s.floors.map(f => ({ name:f.name, width:f.W, rooms:f.rooms.length > 0, walkable:f.grid.some(v => v > 0) })) };
  })).toEqual({ template:'ravenloft', size:56,
    floors:names.map(name => ({ name, width:56, rooms:true, walkable:true })) });
  for (const [i, name] of names.entries()){
    if (i) await page.locator('#floorDown').click();
    await idle(page);
    await expect(page.locator('#floorLabel')).toContainText(name);
    expect(await page.evaluate(() => window.DreadDelve.ui.floor)).toBe(i);
    await expect(page.locator('#stage canvas')).toBeVisible();
  }
  await page.locator('#floorDown').click();
  await expect(page.locator('#floorLabel')).toContainText('Floor 5 of 5');
  expect(await page.evaluate(() => window.DreadDelve.ui.floor)).toBe(4);
});

test('minis walk round a tall shelf and climb up onto a table', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  await page.evaluate(() => {
    const D = window.DreadDelve;
    D.placePropAt({ floor:0, x:8, y:9 }, 'shelf');     // covers 8,9 and 8,10: right across Ada's straight line
    D.placePropAt({ floor:0, x:11, y:10 }, 'table');
    window.__trail = [];
    window.__watch = setInterval(() => { const t = D.get().tokens.find(t => t.name === 'Ada'); window.__trail.push(`${t.x},${t.y}`); }, 20);
  });
  await frameMap(page);
  await selectHero(page);
  await clickTile(page, 9, 10);
  await expectPositions(page, { Ada:{ x:9, y:10 } });
  const trail = await page.evaluate(() => window.__trail);
  expect(trail).not.toContain('8,10');
  expect(trail).not.toContain('8,9');
  await clickTile(page, 11, 10);
  await expectPositions(page, { Ada:{ x:11, y:10 } });
  const y = await page.evaluate(() => { const D = window.DreadDelve, t = D.get().tokens.find(t => t.name === 'Ada'); return D.tokenViews.get(t.id).group.position.y; });
  expect(y).toBeGreaterThan(.45);   // standing on the tabletop
});
