import { test, expect, preparePage, arena } from './helpers.js';

// 🏮 The Lantern Yard (ui/yard.js, game/yard.js over ChatGPT's engine/party-lobby.js and engine/lantern-drill.js) and
// 🧭 the remembered table (net/passport.js, engine/table-entry.js): two players' heroes walk into the yard, one holds
// the plate while the other puts out a lantern, both say they're ready and the DM sets out; then one player comes
// back from the start page in one tap and sits at the same hero.
async function join(browser, baseURL, code, name){
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const page = await context.newPage(), errors = await preparePage(page);
  await page.locator('[data-act="thRole"][data-k="player"]').click();
  await page.locator('#pName').fill(name);
  await page.locator('#pWord').fill(`${name}-secret`);
  await page.locator('#joinCode').fill(code);
  await page.getByRole('button', { name:'Join the table', exact:true }).click();
  await expect(page.locator('#startModal')).toBeHidden({ timeout:30_000 });
  return { context, page, errors };
}
// Tap a square of the yard (the board is 18 × 12 squares from (1, 1)).
const tap = (page, x, y) => page.locator('#yardModal svg.yd-board').evaluate((svg, [x, y]) => {
  const r = svg.getBoundingClientRect();
  svg.dispatchEvent(new MouseEvent('click', { bubbles:true, clientX:r.left + (x - .5) * r.width / 18, clientY:r.top + (y - .5) * r.height / 12 }));
}, [x, y]);
const yardOf = dm => dm.evaluate(() => {
  const y = window.DreadDelve.yard;
  return { members:y.lobby?.members.map(m => ({ name:m.name, hero:m.avatar?.name, at:m.position, ready:m.ready })) || null, cleared:y.drill?.cleared ?? null };
});

test('heroes practise in the Lantern Yard, clear a lantern together, set out, and come back to the table in one tap', async ({ page:dm, browser, baseURL }) => {
  test.setTimeout(420_000);
  const t0 = Date.now(), mark = what => console.log(`yard e2e: ${what} at ${Math.round((Date.now() - t0) / 1000)} s`);
  await arena(dm);
  await dm.evaluate(() => { const D = window.DreadDelve;
    for (const [name, id] of [['Ada', 'ada-yard'], ['Bea', 'bea-yard']]){ const h = D.newHero('Fighter'); h.name = name; h.id = id; D.applyCharacter(h, { owner:name }); } });
  await dm.locator('[data-act="tab"][data-k="table"]').click();
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  await dm.locator('[data-act="ydDmOpen"]').click();
  await expect(dm.locator('.yd-dm')).toContainText('0 of 0 ready');
  const A = await join(browser, baseURL, code, 'Ada'), B = await join(browser, baseURL, code, 'Bea');
  try {
    // Both heroes walk in (the yard opens on their phones), each with their own buttons.
    for (const p of [A.page, B.page]){
      await expect(p.locator('#yardModal')).toBeVisible();
      await expect(p.locator('#yardModal .yd-roster')).toContainText('Ada');
      await expect(p.locator('#yardModal .yd-roster')).toContainText('Bea');
      expect(await p.locator('#yardModal [data-act="ydAct"]').count()).toBeGreaterThan(0);
    }
    expect((await yardOf(dm)).members.map(m => m.hero).sort()).toEqual(['Ada', 'Bea']);
    mark('both in the yard');
    // The drill: Ada stands on the plate; Bea walks up to the Straw Guard and swings until its lantern goes out.
    await dm.locator('[data-act="ydDrill"][data-k="on"]').click();
    await expect(A.page.locator('#yardModal .yd-drill')).toContainText('The shutter is shut');
    await tap(A.page, 6, 7);
    await expect.poll(async () => (await yardOf(dm)).members.find(m => m.name === 'Ada').at).toEqual({ x:6, y:7 });
    await expect(B.page.locator('#yardModal .yd-drill')).toContainText('holds the plate');
    await tap(B.page, 11, 3);
    await expect.poll(async () => (await yardOf(dm)).members.find(m => m.name === 'Bea').at).toEqual({ x:11, y:3 });
    const melee = B.page.locator('#yardModal [data-act="ydAct"]').first();
    await melee.click();
    for (let i = 0; i < 25 && (await yardOf(dm)).cleared === 0; i++){
      await B.page.locator('#ydSay').evaluate(el => { el.textContent = ''; });
      await B.page.locator('#yardModal [data-yd-dummy="straw"]').dispatchEvent('click');
      await expect(B.page.locator('#ydSay')).not.toHaveText('');
    }
    expect((await yardOf(dm)).cleared).toBe(1); mark('a lantern out');
    await expect(B.page.locator('#ydSay')).toContainText('Straw Guard');
    await expect(A.page.locator('#yardModal .yd-lantern.cleared')).toContainText('Straw Guard');
    await expect(A.page.locator('#yardModal .yd-dummy.lit')).toHaveAttribute('data-yd-dummy', 'shield');
    await expect(dm.locator('.yd-dm .yd-feed')).toContainText('lantern goes dark');
    // A hero can't hold the plate and shoot: Ada tries from the plate.
    await A.page.locator('#yardModal [data-act="ydAct"]').first().click();
    await A.page.locator('#yardModal [data-yd-dummy="shield"]').dispatchEvent('click');
    await expect(A.page.locator('#ydSay')).toContainText(/Too far|another hero/);
    // Both ready, and the DM sets out: the yard closes everywhere and they're at their own heroes.
    await expect(dm.locator('[data-act="ydSetOut"]').first()).toBeDisabled();
    for (const p of [A.page, B.page]) await p.locator('#yardModal [data-act="ydReady"]').click();
    await expect(dm.locator('.yd-dm')).toContainText('2 of 2 ready');
    await dm.locator('[data-act="ydSetOut"]').first().click();
    for (const [p, name] of [[A.page, 'Ada'], [B.page, 'Bea']]){
      await expect(p.locator('#yardModal')).toBeHidden();
      await expect.poll(() => p.evaluate(() => window.DreadDelve.get().tokens.find(t => t.id === window.DreadDelve.ui.myToken)?.name)).toBe(name);
    }
    expect((await yardOf(dm)).members).toBeNull();
    mark('set out');
    // 🧭 The remembered table: Ada's browser kept this campaign (its own id), the code and her hero.
    const tableId = await dm.evaluate(() => window.DreadDelve.get().campaign.tableId);
    expect(tableId).toMatch(/^tbl-/);
    const kept = await A.page.evaluate(() => JSON.parse(localStorage.getItem('dreaddelve.tables.v1')).tables);
    expect(kept).toEqual([expect.objectContaining({ tableId, code, heroId:'ada-yard' })]);
    // She comes back from the start page in one tap, and sits at Ada again.
    await A.page.reload();   // (the start page opens on the player's side: this browser has joined as a player before)
    const back = A.page.locator(`[data-act="joinRecent"][data-id="${tableId}"]`);
    await expect(back).toContainText(code);
    await expect(back).toContainText('Ada');
    await back.click(); mark('back to the table');
    await expect(A.page.locator('#startModal')).toBeHidden();
    await expect.poll(() => A.page.evaluate(() => window.DreadDelve.get()?.tokens.find(t => t.id === window.DreadDelve.ui.myToken)?.name), { timeout:30_000 }).toBe('Ada');
    // Bea can't sit at Ada, though both are at the table.
    expect(await dm.evaluate(() => { const D = window.DreadDelve, ada = D.get().tokens.find(t => t.name === 'Ada');
      return Object.values(D.get().seats).filter(id => id === ada.id).length; })).toBe(1);
    expect(A.errors, 'Uncaught errors (Ada)').toEqual([]);
    expect(B.errors, 'Uncaught errors (Bea)').toEqual([]);
  } finally {
    await A.context.close(); await B.context.close();
  }
});
