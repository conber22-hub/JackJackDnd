import { test, expect } from '@playwright/test';
import { preparePage } from './helpers.js';

// 📖 The pocket sheet (ui/pocketsheet.js): Select opens the hero's sheet as a few small pages on the handheld's own
// screen, instead of the long classic Hero tab covering the whole phone. L and R turn the pages (Hero, Fighting,
// Saves & skills, Pack, Notes and letters), the D-pad moves through them, and A opens a spell's text, a feature's
// text or a letter. It only reads; nothing goes to the DM. This spec does NOT use the helpers' fixture: the fixture
// keeps a seated phone on the classic screen, and here the handheld is the thing under test. Each test opens its
// own context (a fresh device) and prepares it with { handheld:true }, then asserts its own errors.
// (A finger on a shell button costs 10–30 s on this sandbox — the page is that busy — so the sheet is driven
// through DreadDelve.pocket, and taps are plain DOM clicks on the row: the same click handler a touch would reach.)
const SP = process.env.PK_SHOTS;   // a folder to keep screenshots in
async function begin(page, id, prefs = null){
  await page.evaluate(([id, prefs]) => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = id; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role');
    if (prefs) localStorage.setItem('dreaddelve.handheld.v1', JSON.stringify(prefs)); }, [id, prefs]);
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator(`[data-act="wdBegin"][data-id="${id}"]`).click();
  await expect(page.locator('#wanderHud')).toBeVisible();
  // the boot ends on its own (a press skips it, but a press costs seconds here); the waking cards are cleared
  // outright, as the arena helper does — the sheet is what's under test, not the cards
  await expect(page.locator('#hhBoot')).toBeHidden({ timeout:30_000 });
  await page.evaluate(() => document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove()));
}
const openSheet = page => page.evaluate(() => { const D = window.DreadDelve;
  return !!D.pocket.openPocketSheet({ token:D.wander.hero(), sheet:D.wander.sheetOf(), extras:{ notes:[{ text:'Trust no one.' }] } }); });
const sheetRect = page => page.evaluate(() => { const s = document.querySelector('#pocketSheet').getBoundingClientRect(), h = document.querySelector('#hhScreen').getBoundingClientRect();
  return { s:[s.left, s.top, s.width, s.height].map(Math.round), h:[h.left, h.top, h.width, h.height].map(Math.round) }; });
const overflow = page => page.evaluate(() => { const b = document.querySelector('#pocketSheet .pk-body');
  return { sheet:document.querySelector('#pocketSheet').scrollWidth - document.querySelector('#pocketSheet').clientWidth,
    body:b.scrollWidth - b.clientWidth, doc:document.documentElement.scrollWidth - innerWidth }; });
const title = page => page.locator('#pocketSheet .pk-title').textContent();
const clearCards = page => page.evaluate(() => document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove()));

test('on a phone held upright: the pocket sheet opens over the screen, L and R turn the pages, the D-pad moves the highlight, B closes it', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  const p = await context.newPage();
  const errors = await preparePage(p, { handheld:true });
  try {
    await begin(p, 'vasha-pk', { mode:'on', full:false });
    await expect(p.locator('#handheld')).toBeVisible();
    await expect(p.locator('body')).toHaveClass(/\bhh\b/);
    // it opens over the screen's rect
    expect(await openSheet(p)).toBe(true);
    await expect(p.locator('#pocketSheet')).toBeVisible();
    const r = await sheetRect(p);
    for (let i = 0; i < 4; i++) expect(Math.abs(r.s[i] - r.h[i])).toBeLessThanOrEqual(2);
    // the Hero page shows the name and HP
    const hero = await p.evaluate(() => { const s = document.querySelector('#pocketSheet');
      return { text:s.textContent, title:s.querySelector('.pk-title').textContent }; });
    expect(hero.text).toContain('Vasha'); expect(hero.text).toContain('12 / 12'); expect(hero.title).toBe('Hero');
    // L and R turn the pages, and each page shows its own things
    const turned = await p.evaluate(() => { const P = window.DreadDelve.pocket, out = [];
      const snap = () => { const s = document.querySelector('#pocketSheet'); return { title:s.querySelector('.pk-title').textContent, text:s.textContent }; };
      P.pocketPress('rb'); out.push(snap());
      P.pocketPress('rb'); out.push(snap());
      P.pocketPress('lb'); out.push(snap());
      P.pocketPress('lb'); out.push(snap());
      return out; });
    expect(turned.map(t => t.title)).toEqual(['Fighting', 'Saves & skills', 'Fighting', 'Hero']);
    expect(turned[0].text).toContain('Longsword'); expect(turned[0].text).toContain('No spells yet');
    expect(turned[1].text).toContain('Perception');
    // the ▶ arrow turns it too, and a tap on a row opens what it has
    await p.evaluate(() => document.querySelector('#pocketSheet [data-pk="next"]').click());
    expect(await title(p)).toBe('Fighting');
    await clearCards(p);
    await p.evaluate(() => [...document.querySelectorAll('#pocketSheet .pk-row')].find(n => n.textContent.includes('Second Wind'))?.click());
    await expect(p.locator('#pocketSheet .pk-detail-t')).toContainText('Second Wind');
    await expect(p.locator('#pocketSheet')).toContainText('Regain 1d10+1 HP');
    // B goes back a step, then closes
    await p.evaluate(() => window.DreadDelve.pocket.pocketPress('b'));
    await expect(p.locator('#pocketSheet .pk-detail-t')).toHaveCount(0);
    expect(await title(p)).toBe('Fighting');
    // the D-pad moves the highlight (Fighting has five rows: two attacks, three features)
    const his = await p.evaluate(() => { const P = window.DreadDelve.pocket, hi = () => [...document.querySelectorAll('#pocketSheet .pk-row')].findIndex(n => n.classList.contains('on'));
      const h0 = hi(); P.pocketPress('down'); const h1 = hi(); P.pocketPress('up'); const h2 = hi();
      return { h0, h1, h2, n:document.querySelectorAll('#pocketSheet .pk-row').length }; });
    expect(his.n).toBe(5); expect(his.h1).toBe((his.h0 + 1) % 5); expect(his.h2).toBe(his.h0);
    // the Pack and Notes pages, and nothing overflows sideways on any page
    const pages = await p.evaluate(() => { const P = window.DreadDelve.pocket, out = [];
      const snap = () => { const s = document.querySelector('#pocketSheet'), b = s.querySelector('.pk-body');
        return { title:s.querySelector('.pk-title').textContent, text:s.textContent,
          over:{ sheet:s.scrollWidth - s.clientWidth, body:b.scrollWidth - b.clientWidth, doc:document.documentElement.scrollWidth - innerWidth } }; };
      P.pocketPress('rb'); out.push(snap());   // Saves & skills
      P.pocketPress('rb'); out.push(snap());   // Pack
      P.pocketPress('rb'); out.push(snap());   // Notes
      for (let i = 0; i < 5; i++){ out.push(snap()); P.pocketPress('rb'); }   // Notes, Hero, Fighting, Saves, Pack
      return out; });
    expect(pages.map(x => x.title)).toEqual(['Saves & skills', 'Pack', 'Notes', 'Notes', 'Hero', 'Fighting', 'Saves & skills', 'Pack']);
    expect(pages[1].text).toContain('Longsword');
    expect(pages[2].text).toContain('Trust no one.');
    for (const pg of pages.slice(3)) for (const v of Object.values(pg.over)) expect(v).toBeLessThanOrEqual(1);
    if (SP) await p.screenshot({ path:`${SP}/pocket-phone.png` });
    // B closes it; Select (back) and Start close it too
    const closes = await p.evaluate(() => { const D = window.DreadDelve, P = D.pocket, out = {};
      const open = () => !!D.pocket.openPocketSheet({ token:D.wander.hero(), sheet:D.wander.sheetOf(), extras:{ notes:[{ text:'Trust no one.' }] } });
      P.pocketPress('b'); out.afterB = !!document.querySelector('#pocketSheet'); out.openAfterB = P.pocketOpen();
      out.reopen1 = open(); P.pocketPress('back'); out.afterBack = !!document.querySelector('#pocketSheet');
      out.reopen2 = open(); P.pocketPress('start'); out.afterStart = !!document.querySelector('#pocketSheet');
      out.pressWhenShut = P.pocketPress('lb');
      return out; });
    expect(closes).toEqual({ afterB:false, openAfterB:false, reopen1:true, afterBack:false, reopen2:true, afterStart:false, pressWhenShut:false });
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a phone held sideways: the pocket sheet fits the screen sideways: every page, no sideways scroll', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:844, height:390 }, hasTouch:true, isMobile:true });
  const p = await context.newPage();
  const errors = await preparePage(p, { handheld:true });
  try {
    await begin(p, 'vasha-pk-land', { mode:'on', full:false });
    await expect(p.locator('#handheld')).toBeVisible();
    expect(await openSheet(p)).toBe(true);
    const r = await sheetRect(p);
    for (let i = 0; i < 4; i++) expect(Math.abs(r.s[i] - r.h[i])).toBeLessThanOrEqual(2);
    expect(r.s[2]).toBeGreaterThan(400);   // the sideways screen is wide, not the upright one
    const seen = [];
    for (let i = 0; i < 5; i++){
      seen.push(await title(p));
      const o = await overflow(p);
      expect(o.sheet).toBeLessThanOrEqual(1); expect(o.body).toBeLessThanOrEqual(1); expect(o.doc).toBeLessThanOrEqual(1);
      await p.evaluate(() => window.DreadDelve.pocket.pocketPress('rb'));
    }
    expect(seen).toEqual(['Hero', 'Fighting', 'Saves & skills', 'Pack', 'Notes']);
    if (SP) await p.screenshot({ path:`${SP}/pocket-landscape.png` });
    await p.evaluate(() => window.DreadDelve.pocket.pocketPress('b'));
    await expect(p.locator('#pocketSheet')).toHaveCount(0);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});
