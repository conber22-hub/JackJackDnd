import { test, expect } from '@playwright/test';
import { preparePage } from './helpers.js';

// 💬 Fight captions (ui/captions.js): a short, readable line for each thing that happens in a fight, the way a
// good game subtitles its combat. This spec does NOT use the helpers' fixture: each test opens its own context
// (a fresh device) and prepares it, then asserts its own errors. The captions are driven through
// window.DreadDelve.captions, and the fight through window.DreadDelve.wander.
const SP = process.env.SC_SHOTS;   // a folder to keep screenshots in

// The fight setup from tests/e2e/punch.spec.js: Vasha the Fighter wakes in the Village of Barovia, a wolf is
// put beside her, the fight begins on her turn. Both are given 200 hit points, so one blow never ends it.
async function fight(page, prefs = null){
  await page.evaluate(([prefs]) => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-cap';
    localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role');
    if (prefs) localStorage.setItem('dreaddelve.handheld.v1', JSON.stringify(prefs)); }, [prefs]);
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-cap"]').click();
  if (prefs) await expect(page.locator('#hhBoot')).toBeHidden({ timeout:30_000 });
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
const lines = page => page.evaluate(() => window.DreadDelve.captions.captionLines());
const shown = page => page.evaluate(() => [...document.querySelectorAll('#captions .cap-line')].map(n => n.textContent));
const wait = (page, ms) => page.evaluate(ms => new Promise(r => setTimeout(r, ms)), ms);
// A MutationObserver records each caption line as it appears and the most lines ever on screen at once — the
// frame rate here is seconds per frame, so polling for a short-lived line from outside the page keeps missing
// it; the observer fires on the change itself, and the recorded history keeps the line even after it fades out.
const watch = page => page.evaluate(() => { window.__capSeen = []; window.__capMax = 0;
  new MutationObserver(() => { const els = [...document.querySelectorAll('#captions .cap-line')];
    window.__capMax = Math.max(window.__capMax, els.length);
    for (const n of els) if (!window.__capSeen.includes(n.textContent)) window.__capSeen.push(n.textContent); })
  .observe(document.body, { childList:true, subtree:true }); });
const seen = page => page.evaluate(() => window.__capSeen);
const maxShown = page => page.evaluate(() => window.__capMax);
// Where the stack sits, read directly: the container keeps the position the module gave it when the last line
// showed, so there is nothing to wait for — and waiting for a live line is a race the line's three-second hold
// loses to this box's round trips (the first version of this helper waited in the page, and the line had
// already faded by the time the evaluate arrived).
const place = page => page.evaluate(() => { const c = document.querySelector('#captions');
  const f = document.querySelector('#wdFight').getBoundingClientRect();
  const r = c.getBoundingClientRect();
  return { c:{ l:r.left, r:r.right, b:r.bottom }, f:{ t:f.top }, vw:innerWidth, doc:document.documentElement.scrollWidth }; });

test('on a desktop: a blow names the hero and the foe, then the foe\'s turn and its blow; at most three lines on screen; off means none', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await fight(p);
    await watch(p);
    // off by default: the Wanderer, and this device does not ask for reduced motion
    expect(await p.evaluate(() => window.DreadDelve.captions.captionsOn())).toBe(false);
    expect(await lines(p)).toEqual([]);
    await p.evaluate(() => { const C = window.DreadDelve.captions; C.startCaptions(); C.setCaptions(true); });
    expect(await p.evaluate(() => window.DreadDelve.captions.captionsOn())).toBe(true);
    // the hero strikes: a line naming the hero and the foe (a hit or a miss — both name them), low on the
    // screen just above the fight bar and inside the viewport
    await p.evaluate(() => window.DreadDelve.wander.heroAttack(0));
    await expect.poll(() => lines(p), { timeout:30_000 }).toEqual(expect.arrayContaining([expect.stringMatching(/Vasha/i)]));
    const heroLine = (await lines(p)).find(l => /Vasha/i.test(l));
    expect(heroLine).toMatch(/wolf/i);
    const pl = await place(p);
    expect(pl.c.b).toBeLessThanOrEqual(pl.f.t + 2);
    expect(pl.c.l).toBeGreaterThanOrEqual(0); expect(pl.c.r).toBeLessThanOrEqual(pl.vw);
    expect(pl.doc).toBeLessThanOrEqual(pl.vw);
    // the turn ends: the foe's turn, then its blow on the hero
    await p.evaluate(() => window.DreadDelve.wander.endHeroTurn());
    await expect.poll(() => lines(p), { timeout:60_000 }).toEqual(expect.arrayContaining([expect.stringMatching(/wolf's turn/i)]));
    await expect.poll(() => lines(p), { timeout:60_000 }).toEqual(expect.arrayContaining([expect.stringMatching(/wolf (bites|misses) you/i)]));
    const all = await lines(p);
    expect(all.length).toBeGreaterThanOrEqual(3);
    // at most three lines are ever on screen at once (the observer saw every line as it appeared, even the
    // ones that have faded since)
    const seenLines = await seen(p);
    expect(seenLines.find(l => /Vasha/i.test(l))).toMatch(/wolf/i);
    expect(seenLines).toEqual(expect.arrayContaining([expect.stringMatching(/wolf's turn/i)]));
    expect(seenLines).toEqual(expect.arrayContaining([expect.stringMatching(/wolf (bites|misses) you/i)]));
    expect(await maxShown(p)).toBeLessThanOrEqual(3);
    if (SP) await p.screenshot({ path:`${SP}/captions-desktop.png` });
    // off again: nothing new appears, and the stack is gone at once
    const n0 = (await lines(p)).length;
    await p.evaluate(() => window.DreadDelve.captions.setCaptions(false));
    expect(await shown(p)).toEqual([]);
    await expect.poll(() => p.evaluate(() => window.DreadDelve.wander.myTurn() && !window.DreadDelve.busy()), { timeout:60_000 }).toBe(true);
    await p.evaluate(() => window.DreadDelve.wander.heroAttack(0));
    await wait(p, 2000);
    expect((await lines(p)).length).toBe(n0);
    expect(await shown(p)).toEqual([]);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a phone with the handheld on: the captions sit above the fight bar, and nothing is cut off at the side', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  const p = await context.newPage();
  const errors = await preparePage(p, { handheld:true });
  try {
    await fight(p, { mode:'on', full:false });
    await expect(p.locator('#handheld')).toBeVisible();
    await expect(p.locator('body')).toHaveClass(/\bhh\b/);
    await watch(p);
    await p.evaluate(() => { const C = window.DreadDelve.captions; C.startCaptions(); C.setCaptions(true); });
    await p.evaluate(() => window.DreadDelve.wander.heroAttack(0));
    await expect.poll(() => lines(p), { timeout:30_000 }).toEqual(expect.arrayContaining([expect.stringMatching(/Vasha/i)]));
    // above the fight bar, and nothing cut off at the side — the container keeps its position after the line fades
    const pl = await place(p);
    expect(pl.c.b).toBeLessThanOrEqual(pl.f.t + 2);
    expect(pl.c.l).toBeGreaterThanOrEqual(0); expect(pl.c.r).toBeLessThanOrEqual(pl.vw);
    expect(pl.doc).toBeLessThanOrEqual(pl.vw);
    await p.evaluate(() => window.DreadDelve.wander.endHeroTurn());
    await expect.poll(() => lines(p), { timeout:60_000 }).toEqual(expect.arrayContaining([expect.stringMatching(/wolf's turn/i)]));
    await expect.poll(() => lines(p), { timeout:60_000 }).toEqual(expect.arrayContaining([expect.stringMatching(/wolf (bites|misses) you/i)]));
    expect(await maxShown(p)).toBeLessThanOrEqual(3);
    if (SP) await p.screenshot({ path:`${SP}/captions-phone.png` });
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});
