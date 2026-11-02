import { test, expect, startDM, idle, preparePage } from './helpers.js';

// Read the app's save out of the idb-keyval store (database 'keyval-store', store 'keyval').
async function idbSave(page){
  return page.evaluate(() => new Promise(resolve => {
    const req = indexedDB.open('keyval-store');
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('keyval')) return resolve(null);
      const tx = db.transaction('keyval', 'readonly').objectStore('keyval').get('dreaddelve.save.v1');
      tx.onsuccess = () => resolve(tx.result ?? null);
      tx.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  }));
}

// A fresh page whose localStorage already holds an old save before the app boots
// (so IndexedDB is empty and the migration path runs), optionally phone-sized.
async function seededPage(browser, seedSave, viewport){
  const context = await browser.newContext({ baseURL:'http://127.0.0.1:4173', ...(viewport ? { viewport } : {}) });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
  await page.addInitScript(seed => {
    localStorage.setItem('dreaddelve.gfx.v1', JSON.stringify({ quality:'low', music:false, sfx:false }));
    localStorage.setItem('dreaddelve.peerserver.v1', JSON.stringify({
      host:'127.0.0.1', port:9000, path:'/', key:'dreaddelve', secure:false,
    }));
    if (seed) localStorage.setItem('dreaddelve.save.v1', seed);
  }, seedSave);
  await page.goto('/dread-delve.html');
  await page.waitForFunction(() => !!window.DreadDelve);
  return { context, page, errors };
}

test('a delve with a several-MB handout survives a reload', async ({ page }) => {
  await startDM(page);
  const artLen = await page.evaluate(() => {
    const D = window.DreadDelve;
    D.get().art['e2e-handout'] = 'data:image/png;base64,' + 'iVBORw0KGgo='.repeat(300_000);
    return D.get().art['e2e-handout'].length;
  });
  expect(artLen).toBeGreaterThan(3_000_000);
  // Any change runs the debounced autosave; wait for it to land in IndexedDB, art included.
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  await page.locator('#newName').fill('Ada');
  await page.locator('[data-act="addPc"]').click();
  await idle(page);
  await expect.poll(async () => {
    const s = await idbSave(page);
    return s?.art?.['e2e-handout']?.length ?? 0;
  }, { timeout:15_000 }).toBe(artLen);
  await page.reload();
  await page.waitForFunction(() => !!window.DreadDelve);
  await expect(page.locator('#continueBox .th-continue')).toBeVisible();
  await page.getByRole('button', { name:'Return to the table' }).click();
  await expect(page.locator('#startModal')).toBeHidden();
  await idle(page);
  expect(await page.evaluate(() => window.DreadDelve.get().art['e2e-handout']?.length)).toBe(artLen);
});

test('an old localStorage save is migrated and then loads', async ({ browser }) => {
  // Capture a valid save from a throwaway page, as the old format stored it.
  const ctx1 = await browser.newContext({ baseURL:'http://127.0.0.1:4173' });
  const p1 = await ctx1.newPage();
  await preparePage(p1);
  await startDM(p1);
  const oldSave = await p1.evaluate(() => {
    const D = window.DreadDelve;
    D.get().art['old-handout'] = 'data:image/png;base64,AAAA';
    return JSON.stringify(D.serialize(true));
  });
  await ctx1.close();
  // Phone-sized: the start screen is a bottom sheet there, and Continue must still work.
  const { context, page, errors } = await seededPage(browser, oldSave, { width:390, height:844 });
  await expect(page.locator('#continueBox .th-continue')).toBeVisible();
  // Migrated: the old key is gone and IndexedDB holds the save, art included.
  expect(await page.evaluate(() => localStorage.getItem('dreaddelve.save.v1'))).toBeNull();
  const migrated = await idbSave(page);
  expect(migrated?.art?.['old-handout']).toBe('data:image/png;base64,AAAA');
  await page.getByRole('button', { name:'Return to the table' }).click();
  await expect(page.locator('#startModal')).toBeHidden();
  await idle(page);
  expect(await page.evaluate(() => window.DreadDelve.get().art['old-handout'])).toBe('data:image/png;base64,AAAA');
  expect(errors).toEqual([]);
  await context.close();
});

test("the start screen's Continue still works after a reload", async ({ page }) => {
  await startDM(page);
  await page.locator('[data-act="tab"][data-k="tokens"]').click();
  await page.locator('#newName').fill('Ada');
  await page.locator('[data-act="addPc"]').click();
  await idle(page);
  await expect.poll(async () => await idbSave(page), { timeout:15_000 }).not.toBeNull();
  await page.reload();
  await page.waitForFunction(() => !!window.DreadDelve);
  await expect(page.locator('#continueBox .th-continue')).toBeVisible();
  await page.getByRole('button', { name:'Return to the table' }).click();
  await expect(page.locator('#startModal')).toBeHidden();
  await idle(page);
  expect(await page.evaluate(() => window.DreadDelve.get().tokens.some(t => t.name === 'Ada'))).toBe(true);
});
