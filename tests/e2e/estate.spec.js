// "Our place" (brief-5). The DM shows the party their holding, wagons and Workshop
// jobs, and a player sees 🏰 Our place on their hero tab. Three steps are simulated,
// honestly: the table's message handler (m.t === 'estate') is Claude's hook, not yet
// in the app, so where the handler will call net.onEstate, the spec calls it directly
// with the very estate the DM sent; live PeerJS joins stall in a cold sandbox run
// (the tour spec's join stalls standalone too, on the untouched base), so the player's
// phone is modelled by flipping the DM's page to a player (the ghost spec's flip),
// with seats and character ids set in state, which is how the receiver and the
// section are exercised. The reload test proves the kept estate itself survives a
// reload, via the autosave's Continue and a second flip. The first test reads the
// summaries out of the outbox — the objects estateSummary built — rather than their
// rendering, so a hidden field cannot hide behind a card that simply doesn't show it.
import { test, expect, arena } from './helpers.js';

async function flipToPlayer(page, name){
  await page.evaluate(n => {
    const D = window.DreadDelve, hero = D.get().tokens.find(t => t.name === n);
    D.ui.myToken = hero.id; D.ui.role = 'player'; document.body.classList.add('player');
  }, name);
  await page.locator('[data-act="tab"]').first().click();   // re-render as a player: the tabs correct to hero first
  await expect(page.locator('[data-act="tab"][data-k="hero"]')).toBeVisible();
}

// A holding full of secrets: a spy, an exposed and a turned hand, a raid, a watch,
// a log, and stores beyond gp — plus a job for each of two heroes and a wagon.
async function craftEstate(page){
  return page.evaluate(() => {
    const D = window.DreadDelve, S = D.get();
    const ada = S.tokens.find(t => t.name === 'Ada'), bram = S.tokens.find(t => t.name === 'Bram');
    ada.charId = 'hero-ada'; if (bram) bram.charId = 'hero-bram';
    S.seats = { peerA: ada.id, ...(bram ? { peerB: bram.id } : {}) };
    S.campaign.holdings = [{ id:'h1', name:'The Lantern House', kind:'house', place:'Vallaki', map:S.meta.mapId, floor:0,
      modules:[{ id:'m1', module:'palisade', built:true, hp:50 }, { id:'m2', module:'tent', built:false, hp:10 }],
      projects:[{ target:'m2', module:'tent', remaining:1 }],
      stores:{ timber:5, stone:3, salt:2, gp:40 },
      hired:[{ id:'w1', name:'Tomas', role:'guard', skill:'arms', wage:1, loyalty:19, devoted:true, spy:true, exposed:{ tell:'He reports at dusk.' }, turned:true },
        { id:'w2', name:'Mira', role:'cook', skill:'cookery', wage:1, loyalty:9, devoted:false }],
      raid:{ member:'strahd', power:5 }, watch:{ until:999 }, log:['The Count noticed.'] }];
    S.campaign.jobs = [
      { id:'j1', n:'Longsword', kind:'weapon', crafter:{ name:'Smith', smith:true }, for:'hero-ada', forName:'Ada', job:{ progress:3, hours:6, check:{ dc:13 } } },
      { id:'j2', n:'Shield', kind:'armor', crafter:{ name:'Smith', smith:true }, for:'hero-bram', forName:'Bram', job:{ progress:6, hours:6, check:{ dc:13 } } }];
    S.campaign.transport = [{ id:'w1', n:'Old Cart', capacity:2000, speed:20, hp:30, ac:12, seats:2, bunks:2, fittings:['spare-wheel','lantern-hooks'], owner:'hero-ada' }];
    return { adaId:ada.id, bramId:bram?.id };
  });
}

async function sendViaPalette(page){
  await page.keyboard.press('Control+k');
  await expect(page.locator('#palModal:not(.hidden)')).toBeVisible();
  await page.locator('#palQ').fill('our place');
  await page.locator('.pal-row', { hasText: 'Show the players our place' }).click();
}

const estateMessages = page => page.evaluate(() => window.DreadDelve.outbox.filter(o => o.msg.t === 'estate').map(o => o.msg.estate));
const deliverAll = (page, estates) => page.evaluate(es => es.forEach(e => window.DreadDelve.net.onEstate(e)), estates);

test('the summary never contains a spy, a raid, a watch, the log, or another hero’s jobs', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:8, y:10 }]);
  const ids = await craftEstate(page);
  await sendViaPalette(page);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.outbox.length)).toBe(3);
  const check = await page.evaluate(({ adaId, bramId }) => {
    const D = window.DreadDelve, es = D.outbox.filter(o => o.msg.t === 'estate').map(o => o.msg.estate);
    const party = es.find(e => !e.for), ada = es.find(e => e.for === adaId), bram = es.find(e => e.for === bramId);
    const keys = o => { const out = []; (function walk(x){ if (x && typeof x === 'object') for (const k of Object.keys(x)){ out.push(k); walk(x[k]); } })(o); return out; };
    const forbidden = ['spy', 'exposed', 'turned', 'raid', 'watch', 'log', 'timber', 'stone', 'salt'];
    const clean = e => !keys(e).some(k => forbidden.includes(k));
    return {
      count:es.length, party:!!party, ada:!!ada, bram:!!bram,
      clean:es.every(clean), partyGp:party?.gp, partyJobs:party?.jobs,
      adaJobs:ada?.jobs, bramJobs:bram?.jobs,
      crewKeys:party?.crew.map(w => Object.keys(w).sort().join(',')),
      wagonKeys:party?.wagons.map(w => Object.keys(w).sort().join(',')),
      holdingName:party?.holding.name, crewDevoted:party?.crew[0]?.devoted, crewName:party?.crew[0]?.name,
      moduleFlags:party?.modules.map(m => m.built), buildingPct:party?.building.map(p => p.pct),
    };
  }, ids);
  expect(check.count).toBe(3);
  expect(check.party && check.ada && check.bram).toBe(true);
  expect(check.clean).toBe(true);   // no hidden field anywhere in any summary, at any depth
  expect(check.partyGp).toBe(40);   // gp is the one store a player may see
  expect(check.partyJobs).toEqual([]);
  expect(check.adaJobs).toEqual([{ name:'Longsword', pct:50 }]);
  expect(check.bramJobs).toEqual([{ name:'Shield', pct:100 }]);
  expect(check.crewKeys).toEqual(['devoted,name,role', 'devoted,name,role']);   // nothing else about a hand
  expect(check.wagonKeys).toEqual(['bunks,capacity,fittings,name,seats,speed']);   // no hp, ac or owner
  expect(check.holdingName).toBe('The Lantern House');
  expect(check.crewDevoted).toBe(true);
  expect(check.moduleFlags).toEqual([true, false]);
  expect(check.buildingPct[0]).toBeGreaterThanOrEqual(0);
  expect(check.buildingPct[0]).toBeLessThanOrEqual(100);
});

test('a player sees 🏰 Our place with the holding’s name, a devoted hand’s ⭐ and their own job, but not another hero’s', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:8, y:10 }]);
  const ids = await craftEstate(page);
  await sendViaPalette(page);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.outbox.length)).toBe(3);
  const estates = await estateMessages(page);
  const party = estates.find(e => !e.for), ada = estates.find(e => e.for === ids.adaId), bram = estates.find(e => e.for === ids.bramId);
  // Bram's phone first, on an empty section: the broadcast arrives, but his is the only one kept.
  // (Bram first because the flips share this page's localStorage — a later flip would see Ada's kept estate.)
  await flipToPlayer(page, 'Bram');
  await deliverAll(page, [party, ada, bram]);
  await expect(page.locator('#panel #estateSection')).toBeVisible();
  await expect(page.locator('#estateSection')).toContainText('The Lantern House');
  await expect(page.locator('#estateSection')).toContainText('⭐');
  await expect(page.locator('#estateSection')).toContainText('Tomas');
  await expect(page.locator('#estateSection')).toContainText('Shield');
  await expect(page.locator('#estateSection')).not.toContainText('Longsword');
  // Ada's phone: the same send, her own job.
  await flipToPlayer(page, 'Ada');
  await deliverAll(page, [party, ada, bram]);
  await expect(page.locator('#estateSection')).toContainText('Longsword');
  await expect(page.locator('#estateSection')).not.toContainText('Shield');
});

test('it survives a reload', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }]);
  await craftEstate(page);
  await sendViaPalette(page);
  await expect.poll(() => page.evaluate(() => window.DreadDelve.outbox.length)).toBe(2);
  const estates = await estateMessages(page);
  await flipToPlayer(page, 'Ada');
  await deliverAll(page, estates);
  await expect(page.locator('#estateSection')).toContainText('The Lantern House');
  await expect(page.locator('#estateSection')).toContainText('Longsword');
  // A reload doesn't lose it: Continue restores the delve, a second flip restores the phone.
  await page.reload();
  await page.waitForFunction(() => !!window.DreadDelve);
  const door = page.locator('[data-act="thRole"][data-k="dm"]');
  if (await door.isVisible()) await door.click();
  await page.locator('#continueBox [data-act="continue"]').click();
  await expect(page.locator('#startModal')).toBeHidden();
  await flipToPlayer(page, 'Ada');
  await page.locator('[data-act="tab"][data-k="hero"]').click();
  await expect(page.locator('#estateSection')).toContainText('The Lantern House');
  await expect(page.locator('#estateSection')).toContainText('Longsword');
});
