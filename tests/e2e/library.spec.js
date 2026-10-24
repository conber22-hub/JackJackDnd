import { test, expect, preparePage, arena } from './helpers.js';
import { fileURLToPath } from 'node:url';

// An invented compendium in the export's shape (no book text in this repository).
const SAMPLE = fileURLToPath(new URL('../fixtures/library-sample.prism.json', import.meta.url));
const tableTab = async page => { if (!await page.evaluate(() => window.DreadDelve.ui.panelOpen)) await page.locator('#btnPanel').click(); await page.locator('[data-act="tab"][data-k="table"]').click(); };

test('the DM imports their books: the creator, the Beasts tab and the reader use them, and they stay in this browser', async ({ page }) => {
  await arena(page);
  await tableTab(page);
  await page.locator('input[data-edit="libImport"]').setInputFiles(SAMPLE);
  await expect(page.locator('#tabBody')).toContainText('In use: 3 spells · 2 species · 1 backgrounds · 3 feats · 1 subclasses · 2 creatures · 1 magic items');
  // Unearthed Arcana off: the playtest spell and creature go
  await page.locator('[data-act="libKind"][data-k="ua"]').click();
  await expect(page.locator('#tabBody')).toContainText('In use: 2 spells · 2 species · 1 backgrounds · 3 feats · 1 subclasses · 1 creatures · 1 magic items');
  // the reader
  await page.locator('#libQ').fill('lantern');
  await page.locator('[data-act="libRead"]', { hasText:'Lantern of Long Nights' }).click();
  await expect(page.locator('#pickBox .readtext')).toContainText('burns for a week');
  await page.locator('#pickBox [data-read="close"]').click();
  // the app's own Fireball and Dwarf stay; the library's new ones join them
  expect(await page.evaluate(() => { const { SPELLS, SPECIES, SUBCLASSES, FEATS } = window.DreadDelve.srd;
    return { fireballs:SPELLS.filter(s => s.n === 'Fireball').length, fbLib:!!SPELLS.find(s => s.n === 'Fireball').lib, gloam:SPELLS.find(s => s.n === 'Gloamlance')?.d,
      dwarfLib:!!SPECIES.Dwarf.lib, mist:SPECIES.Mistborn?.spd, knight:Object.keys(SUBCLASSES.Fighter || {}), feat:FEATS['Lantern Bearer']?.plus }; }))
    .toEqual({ fireballs:1, fbLib:false, gloam:'4d8', dwarfLib:false, mist:35, knight:['Lantern Knight'], feat:['Wis', 'Cha'] });
  // a creature from the books, placed: copied into the delve so the save and the players have it
  const hound = await page.evaluate(() => { const D = window.DreadDelve, t = D.placeMonster('lib-bog-hound', { floor:0, x:9, y:10 }); return { name:t.name, hp:t.maxHp, saved:!!D.get().content.bestiary['lib-bog-hound'], atk:t.attacks[0].d }; });
  expect(hound).toEqual({ name:'Bog Hound', hp:33, saved:true, atk:'2d6+3' });
  // after a reload the books are still here (IndexedDB), with the same choice of kinds
  await page.reload(); await page.waitForFunction(() => window.DreadDelve?.library.libraryState().ready);
  expect(await page.evaluate(() => { const L = window.DreadDelve.library.libraryState(); return { name:L.mine?.name, kinds:L.mine?.kinds, mist:!!window.DreadDelve.srd.SPECIES.Mistborn }; }))
    .toEqual({ name:'library-sample.prism.json', kinds:['canon'], mist:true });
});

test('a player who joins gets the DM\'s books for their character creator, packed, once', async ({ page:dm, browser, baseURL }) => {
  test.setTimeout(150_000);
  await arena(dm);
  await tableTab(dm);
  await dm.locator('input[data-edit="libImport"]').setInputFiles(SAMPLE);
  await expect(dm.locator('#tabBody')).toContainText('In use: 3 spells');
  await dm.locator('[data-act="host"]').click();
  await expect.poll(() => dm.evaluate(() => window.DreadDelve.net.online)).toBe(true);
  const code = await dm.evaluate(() => window.DreadDelve.net.code);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  try {
    const player = await context.newPage();
    const errors = await preparePage(player);
    expect(await player.evaluate(() => 'Mistborn' in window.DreadDelve.srd.SPECIES)).toBe(false);
    await player.locator('[data-act="thRole"][data-k="player"]').click();
    await player.locator('#pName').fill('Ada');
    await player.locator('#pWord').fill('e2e-secret');
    await player.locator('#joinCode').fill(code);
    await player.getByRole('button', { name:'Join the table', exact:true }).click();
    await expect(player.locator('#toasts')).toContainText("The DM's books are here", { timeout:20000 });
    expect(await player.evaluate(() => { const { SPECIES, SUBCLASSES, SPELLS } = window.DreadDelve.srd;
      return { mist:SPECIES.Mistborn?.note, sub:Object.keys(SUBCLASSES.Fighter || {}), spell:!!SPELLS.find(s => s.n === 'Mire Burst'), monsters:window.DreadDelve.library.libraryState().applied.monsters.length }; }))
      .toEqual({ mist:'Darkvision 60 ft · Fogstep', sub:['Lantern Knight'], spell:true, monsters:0 });   // the creator's part only
    // a character from the books, in the phone's creator: a Mistborn Fighter of the Lantern Knights
    if (!await player.evaluate(() => window.DreadDelve.ui.panelOpen)) await player.locator('#btnPanel').click();
    await player.locator('[data-act="tab"][data-k="hero"]').click();
    await player.locator('[data-act="newHeroAtTable"]').click();
    const box = player.locator('#charBox');
    await box.locator('select[data-cf="cls"]').selectOption('Fighter');
    await box.locator('select[data-cf="lvl"]').selectOption('3');
    await box.locator('select[data-cf="sp"]').selectOption('Mistborn');
    await box.locator('select[data-cf="sub"]').selectOption('Lantern Knight');
    await expect(box.locator('.sheet')).toContainText('Fighter 3 · Lantern Knight');
    await expect(box.locator('.sheet')).toContainText('Kindle (3)');
    await expect(box.locator('.sheet')).not.toContainText('Champion:');
    await expect(box.locator('.sheet')).toContainText('Speed35');
    await box.locator('.sheet details summary').click();
    await expect(box.locator('.sheet details')).toContainText('Your weapon sheds light');
    expect(errors, 'Uncaught player browser errors').toEqual([]);
  } finally {
    await context.close();
  }
});

test('📖 Look it up reads the SRD with no books imported: spells, magic items, creatures, class features', async ({ page }) => {
  await arena(page);
  await tableTab(page);
  await page.locator('#libQ').fill('fireball');
  await page.locator('[data-act="libRead"]', { hasText:'Fireball' }).first().click();
  await expect(page.locator('#pickBox .readtext')).toContainText('Dexterity saving throw');
  await page.locator('#pickBox [data-read="close"]').click();
  await page.locator('#libQ').fill('bag of holding');
  await expect(page.locator('#libHits')).toContainText('Magic item');
  await page.locator('#libQ').fill('aboleth');
  await expect(page.locator('#libHits')).toContainText('Creature');
  await page.locator('#libQ').fill('action surge');
  await expect(page.locator('#libHits')).toContainText('Class feature');
  // a placed SRD creature brings its own saving throws and passive Perception
  expect(await page.evaluate(() => { const t = window.DreadDelve.placeMonster('srd-aboleth', { floor:0, x:8, y:10 }); return { con:t.saves?.con, passive:t.passive }; })).toEqual({ con:6, passive:20 });
});
