import { test, expect } from '@playwright/test';
import { preparePage } from './helpers.js';

// 🌫 The defeat screen (ui/defeat.js): the party is down, and the Mists close over them — the victory
// screen's dark twin. This spec does NOT use the helpers' fixture: each test opens its own context (a fresh
// device) and prepares it, then asserts its own errors. The screen is driven through
// window.DreadDelve.defeat with a hand-made summary shaped like ChatGPT's summarize() for a lost fight;
// taps are plain DOM clicks.
const SP = process.env.SC_SHOTS;   // a folder to keep screenshots in
async function begin(page, id, prefs = null){
  await page.evaluate(([id, prefs]) => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = id; localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role');
    if (prefs) localStorage.setItem('dreaddelve.handheld.v1', JSON.stringify(prefs)); }, [id, prefs]);
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator(`[data-act="wdBegin"][data-id="${id}"]`).click();
  await expect(page.locator('#wanderHud')).toBeVisible();
  await expect(page.locator('#hhBoot')).toBeHidden({ timeout:30_000 });
  await page.evaluate(() => document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove()));
}
const clearCards = page => page.evaluate(() => document.querySelectorAll('#cardLayer .pop').forEach(el => el.remove()));
// Escape closes a screen. A real Escape key never reaches a screen while the Wanderer runs: its capture-phase
// key handler turns Escape into press('b') and stops the event (Claude's hook routes that press to the open
// screen). So the spec proves the screen's own Escape handler by dispatching the key on the window — the
// handler is the same one a real key reaches outside the Wanderer — and proves Ⓑ through the press function,
// which is the path a real Escape takes in the Wanderer.
const pressEscape = page => page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true, cancelable:true })));
const overflow = page => page.evaluate(() => ({ doc:document.documentElement.scrollWidth - innerWidth,
  def:document.querySelector('#defeat') ? document.querySelector('#defeat').scrollWidth - document.querySelector('#defeat').clientWidth : 0 }));

// One opener, defined once on the page so every test opens the same lost fight: Vasha felled by a wolf's
// bite for 9, Ilse down too, four rounds. onClose counts itself on the window.
const defineOpener = page => page.evaluate(() => { window.__defeatClosed = 0;
  window.__openDefeat = () => window.DreadDelve.defeat.openDefeat(
    { rounds:4, won:false,
      per:{ vasha:{ dealt:21, taken:24, healed:0, healedOthers:0, hits:4, misses:2, crits:0, kills:1, biggest:9, downs:1 },
            ilse:{ dealt:9, taken:17, healed:6, healedOthers:4, hits:2, misses:1, crits:0, kills:0, biggest:5, downs:1 } },
      biggest:{ by:'wolf', at:'vasha', n:9, weapon:'Bite', crit:false },
      luckiest:null, unluckiest:null, closest:null, mvp:null, awards:[],
      headline:'The valley keeps its ground.', verdict:'The account remains unsettled.', xp:0, loot:null },
    { party:['vasha', 'ilse'], names:{ vasha:'Vasha', ilse:'Ilse Varga' }, faces:{}, from:'the last place you rested',
      onClose:() => { window.__defeatClosed = (window.__defeatClosed || 0) + 1; } }); });

test('on a desktop: the words show, the heroes stand greyed, the consolation is steady, Rise and Escape close it once each', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-df');
    await clearCards(p);
    await defineOpener(p);
    // open #1: the words, the heroes, the wake line, the Rise button
    expect(await p.evaluate(() => !!window.__openDefeat())).toBe(true);
    await expect(p.locator('#defeat')).toBeVisible();
    await expect(p.locator('#defeat .df-rise')).toBeVisible();
    await expect(p.locator('#defeat')).toContainText('The Mists close over you');
    await expect(p.locator('#defeat')).toContainText('The valley keeps its ground.');
    await expect(p.locator('#defeat')).toContainText('The account remains unsettled.');
    await expect(p.locator('#defeat')).toContainText('Vasha');
    await expect(p.locator('#defeat')).toContainText('Ilse Varga');
    await expect(p.locator('#defeat')).toContainText('Dealt 21');
    await expect(p.locator('#defeat')).toContainText('Took 24');
    await expect(p.locator('#defeat')).toContainText('Felled by Bite for 9 damage');
    await expect(p.locator('#defeat')).toContainText('You will wake at the last place you rested.');
    await expect(p.locator('#defeat')).toContainText('Rise');
    const cons1 = await p.evaluate(() => document.querySelector('#defeat .df-cons')?.textContent);
    expect(cons1 && cons1.length > 10).toBe(true);
    if (SP) await p.screenshot({ path:`${SP}/defeat-desktop.png` });
    // Rise closes it, and onClose runs once
    await p.locator('#defeat .df-rise').click();
    await expect(p.locator('#defeat')).toHaveCount(0);
    await expect(p.locator('#defeatMist')).toHaveCount(0);
    expect(await p.evaluate(() => window.__defeatClosed)).toBe(1);
    expect(await p.evaluate(() => window.DreadDelve.defeat.defeatOpen())).toBe(false);
    // open #2, same summary: Ⓐ finishes the slow reveal at once (one atomic step, so no timer can
    // interleave), the consolation is the same, Ⓐ again rises
    const aTest = await p.evaluate(() => { const D = window.DreadDelve.defeat;
      window.__openDefeat();
      const before = document.querySelector('#defeat .df-rise')?.style.display;
      D.defeatPress('a');
      const after = document.querySelector('#defeat .df-rise')?.style.display;
      const cons = document.querySelector('#defeat .df-cons')?.textContent;
      const stillOpen = !!document.querySelector('#defeat');
      D.defeatPress('a');
      const closed = !document.querySelector('#defeat');
      return { before, after, cons, stillOpen, closed }; });
    expect(aTest.before).toBe('none');
    expect(aTest.after).toBe('');
    expect(aTest.cons).toBe(cons1);
    expect(aTest.stillOpen).toBe(true);
    expect(aTest.closed).toBe(true);
    expect(await p.evaluate(() => window.__defeatClosed)).toBe(2);
    expect(await p.evaluate(() => window.DreadDelve.defeat.defeatPress('a'))).toBe(false);
    // open #3: Escape closes it, onClose once more
    expect(await p.evaluate(() => !!window.__openDefeat())).toBe(true);
    await expect(p.locator('#defeat .df-rise')).toBeVisible();
    await pressEscape(p);
    await expect(p.locator('#defeat')).toHaveCount(0);
    expect(await p.evaluate(() => window.__defeatClosed)).toBe(3);
    const o = await overflow(p);
    for (const v of Object.values(o)) expect(v).toBeLessThanOrEqual(1);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a phone with the handheld on: the defeat screen fits the screen, and nothing is cut off', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  const p = await context.newPage();
  const errors = await preparePage(p, { handheld:true });
  try {
    await begin(p, 'vasha-df-ph', { mode:'on', full:false });
    await expect(p.locator('#handheld')).toBeVisible();
    await expect(p.locator('body')).toHaveClass(/\bhh\b/);
    await clearCards(p);
    await defineOpener(p);
    expect(await p.evaluate(() => !!window.__openDefeat())).toBe(true);
    await expect(p.locator('#defeat .df-rise')).toBeVisible();
    const rects = await p.evaluate(() => { const scr = document.querySelector('#hhScreen').getBoundingClientRect();
      const r = document.querySelector('#defeat').getBoundingClientRect();
      return { screen:[scr.left, scr.top, scr.width, scr.height].map(Math.round),
        def:[r.left, r.top, r.width, r.height].map(Math.round) }; });
    for (let i = 0; i < 4; i++) expect(Math.abs(rects.def[i] - rects.screen[i])).toBeLessThanOrEqual(2);
    await expect(p.locator('#defeat')).toContainText('The Mists close over you');
    await expect(p.locator('#defeat')).toContainText('Vasha');
    await expect(p.locator('#defeat')).toContainText('Rise');
    const o = await overflow(p);
    for (const v of Object.values(o)) expect(v).toBeLessThanOrEqual(1);
    if (SP) await p.screenshot({ path:`${SP}/defeat-phone.png` });
    await pressEscape(p);
    await expect(p.locator('#defeat')).toHaveCount(0);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('with reduced motion: everything is there at once, no slow dim, no rise', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-df-rm');
    await clearCards(p);
    await defineOpener(p);
    await p.emulateMedia({ reducedMotion:'reduce' });
    // one atomic step: open, then read at once — nothing may arrive on a timer
    const atOnce = await p.evaluate(() => { window.__openDefeat();
      const t = document.querySelector('#defeat')?.textContent || '';
      const mist = document.querySelector('#defeatMist');
      return { title:t.includes('The Mists close over you'), head:t.includes('The valley keeps its ground.'),
        cons:!!document.querySelector('#defeat .df-cons')?.textContent,
        vasha:t.includes('Vasha'), ilse:t.includes('Ilse Varga'),
        wake:t.includes('You will wake at the last place you rested.'),
        rise:document.querySelector('#defeat .df-rise')?.style.display === '',
        mist:mist ? getComputedStyle(mist).opacity : null }; });
    expect(atOnce.title).toBe(true);
    expect(atOnce.head).toBe(true);
    expect(atOnce.cons).toBe(true);
    expect(atOnce.vasha).toBe(true);
    expect(atOnce.ilse).toBe(true);
    expect(atOnce.wake).toBe(true);
    expect(atOnce.rise).toBe(true);
    expect(atOnce.mist).toBe('1');
    await pressEscape(p);
    await expect(p.locator('#defeat')).toHaveCount(0);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});
