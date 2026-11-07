import { test, expect, arena } from './helpers.js';

// 📒 The ledger (ui/ledger.js): ChatGPT's field surveys, camp bonds, town bounties, supply runs and party votes at the DM's hand.
async function openLedger(page, tab){
  await page.evaluate(() => { if (!window.DreadDelve.ui.panelOpen) document.querySelector('#btnPanel')?.click(); });
  await page.locator('[data-act="tab"][data-k="night"]').click();
  await page.locator('#tabBody [data-act="ledger"]').first().click();
  const sheet = page.locator('#ledgerSheet');
  await expect(sheet).toBeVisible();
  await sheet.locator(`[data-lgx="tab"][data-k="${tab}"]`).click();
  return sheet;
}
const camp = (page, k) => page.evaluate(k => window.DreadDelve.get().campaign[k], k);

test('a field survey: three details noticed at the village unlock its lead', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page);
  const sheet = await openLedger(page, 'survey');
  await sheet.locator('#lgPlace').selectOption('village');
  for (let i = 0; i < 3; i++) await sheet.locator('[data-lgx="found"]').first().click();
  await expect(sheet.locator('[data-lgx="found"]')).toHaveCount(0);
  await sheet.locator('[data-lgx="claim"]').click();
  await expect(sheet.locator('.ch-events')).toContainText('💡');
  expect((await camp(page, 'fieldSurveys')).places[0]).toMatchObject({ id:'village', claimed:true });
});

test('by the fire: a companion who saw the party shelter a stranger offers a scene after the long rest', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page);
  // an ally travelling with them (an NPC token: a copy of Ada's, renamed)
  const mirela = await page.evaluate(() => { const st = window.DreadDelve.get(), a = st.tokens.find(t => t.name === 'Ada');
    st.tokens.push({ ...structuredClone(a), id:'npc-mirela', name:'Mirela', kind:'npc', charId:null, x:a.x + 1 }); return 'npc-mirela'; });
  const sheet = await openLedger(page, 'camp');
  await sheet.locator(`[data-outlook="${mirela}"]`).selectOption('keeper');
  await sheet.locator('#lgChoice').selectOption('shelter-stranger');
  await sheet.locator('[data-lgx="choice"]').click();
  expect((await camp(page, 'campBonds')).bonds[0]).toMatchObject({ outlook:'keeper', score:2 });
  await page.evaluate(() => window.DreadDelve.longRest());
  await sheet.locator('[data-lgx="tab"][data-k="camp"]').click();
  await expect(sheet.locator('[data-lgx="scene"]').first()).toBeVisible();
  await sheet.locator('[data-lgx="scene"]').first().click();
  expect((await camp(page, 'campBonds')).played).toHaveLength(1);
});

test('a bounty: a theft in Vallaki counts once the witness reports it, then a pardon clears it', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page);
  const sheet = await openLedger(page, 'bounty');
  await sheet.locator('#lgTown').selectOption('vallaki');
  await sheet.locator('#lgOffence').selectOption('theft');
  await sheet.locator('#lgWitness').fill('the baker');
  await sheet.locator('[data-lgx="offence"]').click();
  await sheet.locator('[data-lgx="report"]').click();
  await expect(sheet).toContainText('owes 15 gp');
  await sheet.locator('[data-lgx="post"]').click();
  await expect(sheet.locator('[data-lgx="wanted"]')).toBeVisible();
  await sheet.locator('[data-lgx="settle"][data-k="pardoned"]').click();
  expect((await camp(page, 'townBounties')).cases[0].resolution).toBe('pardoned');
});

test('a supply run: timber leaves one holding and reaches the other when the valley clock passes its hour', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page);
  await page.evaluate(() => { const c = window.DreadDelve.get().campaign;
    c.holdings = [{ id:'h1', name:'Vallaki yard', place:'Vallaki', stores:{ timber:40, stone:0, salt:0, gp:0 }, hired:[] }, { id:'h2', name:'Krezk barn', place:'Krezk', stores:{ timber:0, stone:0, salt:0, gp:0 }, hired:[] }];
    c.transport = [{ id:'w1', kind:'wagon', n:'The grey cart', capacity:600, speed:24, hp:30, ac:11, seats:2 }];
    c.valley = { ...(c.valley || {}), day:1, hour:8 }; });
  const sheet = await openLedger(page, 'supply');
  await sheet.locator('#lgCargo-timber').fill('10');
  await sheet.locator('[data-lgx="quote"]').click();
  await expect(sheet.locator('.ch-events')).toContainText('chance of trouble');
  await sheet.locator('[data-lgx="dispatch"]').click();
  const run = (await camp(page, 'supplyRuns')).runs[0];
  expect(run.status).toBe('en-route');
  expect(await page.evaluate(() => window.DreadDelve.get().campaign.holdings[0].stores.timber)).toBe(30);
  await page.evaluate(h => { window.DreadDelve.get().campaign.valley.hour = 8 + h + 1; }, run.quote.hours);
  await sheet.locator('[data-lgx="close"]').click();
  await page.locator('#tabBody [data-act="ledger"]').first().click();
  const after = (await camp(page, 'supplyRuns')).runs[0];
  expect(['delivered', 'missing']).toContain(after.status);
  if (after.status === 'delivered') expect(await page.evaluate(() => window.DreadDelve.get().campaign.holdings[1].stores.timber)).toBe(10);
});

test('a vote: the DM asks, each hero answers, and the result is shown', async ({ page }) => {
  test.setTimeout(120_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }]);
  const sheet = await openLedger(page, 'vote');
  await sheet.locator('#lgQ').fill('Do we take the ferry?');
  await sheet.locator('#lgOpts').fill('Yes, No');
  await sheet.locator('[data-lgx="openVote"]').click();
  // what a phone shows when the ballot arrives (the receiver ui/ledger.js sets on net)
  await page.evaluate(() => window.DreadDelve.net.onVote({ vote:{ id:'v', question:'Do we take the ferry?', status:'open', options:[{ id:'o0', label:'Yes' }, { id:'o1', label:'No' }], canVote:true, hasVoted:false, choice:null, result:null } }));
  await expect(page.locator('#votePop [data-vote]')).toHaveCount(4);   // Yes, No, Abstain, Close
  await page.locator('#votePop [data-vote="x"]').click();
  await sheet.locator('[data-lgx="castFor"][data-k="o0"]').first().click();
  await sheet.locator('[data-lgx="castFor"][data-k="o0"]').first().click();
  expect((await camp(page, 'partyVote')).ballots).toHaveLength(2);
  await sheet.locator('[data-lgx="closeVote"]').click();
  await expect(sheet.locator('.ch-events')).toContainText('Yes (Yes 2, No 0)');
});
