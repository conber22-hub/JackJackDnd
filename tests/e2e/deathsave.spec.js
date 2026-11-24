import { test, expect } from '@playwright/test';
import { preparePage } from './helpers.js';

// 💀 The death save's moment (ui/deathsave.js): a hero at 0 hit points rolls a d20, and the table holds its
// breath — the die tumbles in the middle of the screen, lands, and the new heart or skull fills. This spec
// does NOT use the helpers' fixture: each test opens its own context (a fresh device) and prepares it, then
// asserts its own errors. The moment is driven through window.DreadDelve.deathSave with hand-made saves;
// taps are plain DOM clicks.
//
// Timing note: on this box a timer step takes ~2.4 s (the page's main thread is that slow), so the moment's
// 2.5 s hold can expire before a follow-up evaluate runs — and the landed window is one timer tick, shorter
// than a poll round-trip, so polling for the landed state from the runner can miss it entirely (run 2's
// desktop test timed out that way). Two harnesses deal with that, both test-only, both in this file:
// a MutationObserver installed on the page (see defineOpener) stashes the landed snapshot on the window
// the instant the moment lands, so the spec reads that snapshot, never a second read after landing; and
// patchHold stretches long timers (>= 1 s) to 60 s while it is on, so the landed moment stays up for the
// runner to screenshot and press — the 90 ms tumble steps run as normal, and the saves that must close on
// their own run with the patch off. Restore with unpatchHold before the next such save.
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
  ds:document.querySelector('#deathSave') ? document.querySelector('#deathSave').scrollWidth - document.querySelector('#deathSave').clientWidth : 0 }));

// One opener, defined once on the page: showDeathSave with hand-made saves, and onDone counts itself on the
// window (in order, by name). The face is a 1×1 data URL, to prove the img path renders.
const FACE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const defineOpener = page => page.evaluate(face => { window.__dsDone = []; window.__dsOrder = [];
  window.__openSave = args => window.DreadDelve.deathSave.showDeathSave({ face, ...args }, { onDone:() => { window.__dsDone.push(args.name); window.__dsOrder.push(args.name); } });
  window.__resetDs = () => { window.__dsDone = []; window.__dsOrder = []; };
  // A MutationObserver watches for the moment landing and stashes the snapshot at once: the landed window
  // is one timer tick (~2.4 s on this box), shorter than a poll round-trip, so polling for it from the
  // runner can miss it entirely. The observer fires as a microtask right after the module's synchronous
  // land render, so the snapshot is the moment as it landed — rect and screen included.
  window.__landedSnaps = [];
  const snap = () => { const el = document.querySelector('#deathSave');
    if (!el || !el.classList.contains('ds-landed') || el.__snapTaken) return;
    el.__snapTaken = true;
    const r = el.getBoundingClientRect();
    const scr = document.querySelector('#hhScreen');
    let screen = null;
    if (scr){ const s = scr.getBoundingClientRect(); screen = [s.left, s.top, s.right, s.bottom]; }
    else { const cs = getComputedStyle(document.body);
      const x = parseFloat(cs.getPropertyValue('--hh-scr-x')), y = parseFloat(cs.getPropertyValue('--hh-scr-y')),
        w = parseFloat(cs.getPropertyValue('--hh-scr-w')), h = parseFloat(cs.getPropertyValue('--hh-scr-h'));
      if (Number.isFinite(x) && Number.isFinite(w)) screen = [x, y, x + w, y + h]; }
    window.__landedSnaps.push({ landed:true, die:el.querySelector('.ds-die-num')?.textContent,
      hearts:el.querySelectorAll('.ds-h.on').length, skulls:el.querySelectorAll('.ds-k.on').length,
      name:el.querySelector('.ds-name')?.textContent, words:el.querySelector('.ds-words')?.textContent,
      cls:el.className, faceImg:!!el.querySelector('img.ds-face'),
      rect:[r.left, r.top, r.right, r.bottom].map(Math.round), screen:screen?.map(Math.round) ?? null }); };
  new MutationObserver(() => snap()).observe(document.documentElement, { attributes:true, childList:true, subtree:true, characterData:true }); }, FACE);
// The panel's state, read in one evaluate — including its rect and the screen's rect (the handheld's screen
// element when it exists, else the --hh-scr-* vars the moment itself places by).
const stateOf = page => page.evaluate(() => { const el = document.querySelector('#deathSave'); if (!el) return null;
  const r = el.getBoundingClientRect();
  const scr = document.querySelector('#hhScreen');
  let screen = null;
  if (scr){ const s = scr.getBoundingClientRect(); screen = [s.left, s.top, s.right, s.bottom]; }
  else { const cs = getComputedStyle(document.body);
    const x = parseFloat(cs.getPropertyValue('--hh-scr-x')), y = parseFloat(cs.getPropertyValue('--hh-scr-y')),
      w = parseFloat(cs.getPropertyValue('--hh-scr-w')), h = parseFloat(cs.getPropertyValue('--hh-scr-h'));
    if (Number.isFinite(x) && Number.isFinite(w)) screen = [x, y, x + w, y + h]; }
  return { landed:el.classList.contains('ds-landed'), die:el.querySelector('.ds-die-num')?.textContent,
    hearts:el.querySelectorAll('.ds-h.on').length, skulls:el.querySelectorAll('.ds-k.on').length,
    name:el.querySelector('.ds-name')?.textContent, words:el.querySelector('.ds-words')?.textContent,
    cls:el.className, faceImg:!!el.querySelector('img.ds-face'),
    rect:[r.left, r.top, r.right, r.bottom].map(Math.round), screen:screen?.map(Math.round) ?? null }; });
// Wait for the die to land, and return the landed snapshot — stashed on the window by the MutationObserver
// installed in defineOpener (window.__landedSnaps), so the assertions read the moment as it was when it
// landed, not a second read after the hold has expired. `from` skips snapshots from earlier saves.
const waitLanded = async (page, die, from = 0, timeout = 60_000) => {
  const find = ([d, f]) => { const snaps = window.__landedSnaps || [];
    for (let i = f; i < snaps.length; i++) if (snaps[i].die === String(d)) return snaps[i];
    return null; };
  await expect.poll(() => page.evaluate(find, [die, from]), { timeout }).not.toBeNull();
  return page.evaluate(find, [die, from]);
};
const waitGone = async (page, timeout = 15_000) =>
  await expect(page.locator('#deathSave')).toHaveCount(0, { timeout });
// A press closes it at once: measure inside the page (the runner's round-trip alone is ~1–2 s on this box).
const pressNow = (page, name) => page.evaluate(n => { const t0 = performance.now();
  const took = window.DreadDelve.deathSave.deathSavePress(n);
  return { took, gone:!document.querySelector('#deathSave'), ms:Math.round(performance.now() - t0) }; }, name);
// Stretch the moment's hold while the patch is on (see the timing note): long timers run 60 s instead, so
// a landed moment stays up for the runner to screenshot and press. Short tumble steps are untouched.
const patchHold = page => page.evaluate(() => { window.__realSetTimeout = window.__realSetTimeout || window.setTimeout;
  window.setTimeout = (fn, ms, ...rest) => window.__realSetTimeout(fn, (ms ?? 0) >= 1000 ? 60000 : ms, ...rest); });
const unpatchHold = page => page.evaluate(() => { if (window.__realSetTimeout) window.setTimeout = window.__realSetTimeout; });

test('on a desktop: the die lands, the marks match after, a two fills two skulls, a natural 20 is gold, a press closes at once, two in a row show in order, the badge marks right', async ({ browser, baseURL }) => {
  test.setTimeout(600_000);   // seven saves, each tumbling ~14 s on this box, plus screenshots
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-ds');
    await clearCards(p);
    await defineOpener(p);
    // save 1: Vasha, 14, a success — 1 heart and 1 skull before, 2 hearts and 1 skull after
    await p.evaluate(() => window.__openSave({ name:'Vasha', before:{ s:1, f:1 }, after:{ s:2, f:1 }, d20:14, outcome:'success', words:'Colour returns to Vasha’s lips.', mine:false }));
    await expect(p.locator('#deathSave')).toBeVisible();
    await expect(p.locator('#deathSave')).toContainText('Vasha');
    await expect(p.locator('#deathSave')).toContainText('death save');
    const s1 = await waitLanded(p, 14);
    expect(s1).toMatchObject({ hearts:2, skulls:1, words:'Colour returns to Vasha’s lips.', faceImg:true });
    // it closes on its own, and onDone runs once
    await waitGone(p);
    expect(await p.evaluate(() => window.__dsDone)).toEqual(['Vasha']);
    expect(await p.evaluate(() => window.DreadDelve.deathSave.deathSaveOpen())).toBe(false);
    // save 2: Ilse, a natural 1 — two failures at once: 1 skull before, 3 after. The hold is stretched, so
    // the runner's press after landing is not a race with the moment closing on its own (run 3).
    await patchHold(p);
    await p.evaluate(() => window.__openSave({ name:'Ilse', before:{ s:0, f:1 }, after:{ s:0, f:3 }, d20:1, outcome:'two', words:'Two slow beats go missing beneath Ilse’s ribs.', mine:false }));
    const s2 = await waitLanded(p, 1);
    expect(s2).toMatchObject({ hearts:0, skulls:3, name:'Ilse' });
    if (SP) await p.screenshot({ path:`${SP}/deathsave-desktop.png` });
    // a press closes it at once (not after the 2.5 s hold), and onDone runs once
    const pr = await pressNow(p, 'a');
    expect(pr).toMatchObject({ took:true, gone:true });
    expect(pr.ms).toBeLessThan(1000);
    await waitGone(p);
    await unpatchHold(p);
    expect(await p.evaluate(() => window.__dsDone)).toEqual(['Vasha', 'Ilse']);
    expect(await p.evaluate(() => window.DreadDelve.deathSave.deathSavePress('a'))).toBe(false);
    // save 3: Vasha, a natural 20 — the gold look, the face loses its grey
    await patchHold(p);
    await p.evaluate(() => window.__openSave({ name:'Vasha', before:{ s:2, f:0 }, after:{ s:0, f:0 }, d20:20, outcome:'rise', words:'Air rushes back into Vasha’s chest.', mine:true }));
    const s3 = await waitLanded(p, 20);
    expect(s3.name).toBe('You');
    expect(s3.cls).toContain('ds-rise');
    expect(s3.cls).toContain('ds-mine');
    if (SP) await p.screenshot({ path:`${SP}/deathsave-rise.png` });
    await pressEscape(p);
    await waitGone(p, 5_000);
    await unpatchHold(p);
    expect(await p.evaluate(() => window.__dsDone)).toEqual(['Vasha', 'Ilse', 'Vasha']);
    // save 4: Ilse, stable — the quiet blue-grey look, all three hearts filled
    await patchHold(p);
    await p.evaluate(() => window.__openSave({ name:'Ilse', before:{ s:2, f:1 }, after:{ s:3, f:1 }, d20:12, outcome:'stable', words:'At last, Ilse breathes in time with the watch.', mine:false }));
    const s4 = await waitLanded(p, 12);
    expect(s4.cls).toContain('ds-stable');
    const pr4 = await pressNow(p, 'b');
    expect(pr4).toMatchObject({ took:true, gone:true });
    expect(pr4.ms).toBeLessThan(1000);
    await waitGone(p, 5_000);
    await unpatchHold(p);
    expect(await p.evaluate(() => window.__dsDone)).toEqual(['Vasha', 'Ilse', 'Vasha', 'Ilse']);
    // save 5: a press mid-tumble skips to the end and closes at once — the die never lands
    const snapsBefore = await p.evaluate(() => window.__landedSnaps.length);
    await p.evaluate(() => window.__openSave({ name:'Vasha', before:{ s:1, f:0 }, after:{ s:2, f:0 }, d20:9, outcome:'success', words:'Colour returns to Vasha’s lips.', mine:false }));
    await expect(p.locator('#deathSave')).toBeVisible();
    const pr5 = await pressNow(p, 'a');
    expect(pr5).toMatchObject({ took:true, gone:true });
    expect(pr5.ms).toBeLessThan(1000);
    await waitGone(p, 5_000);
    expect(await p.evaluate(() => window.__dsDone)).toEqual(['Vasha', 'Ilse', 'Vasha', 'Ilse', 'Vasha']);
    expect(await p.evaluate(() => window.__landedSnaps.length)).toBe(snapsBefore);
    // two in a row, opened at once: both show, in order, each closing on its own
    const qFrom = await p.evaluate(() => window.__landedSnaps.length);
    await p.evaluate(() => { window.__resetDs();
      window.__openSave({ name:'Vasha', before:{ s:0, f:0 }, after:{ s:1, f:0 }, d20:11, outcome:'success', words:'A small breath stirs the dust beside Vasha.', mine:false });
      window.__openSave({ name:'Ilse', before:{ s:1, f:1 }, after:{ s:1, f:2 }, d20:7, outcome:'failure', words:'Cold beads on Ilse’s brow.', mine:false }); });
    const q1 = await waitLanded(p, 11, qFrom);
    expect(q1.name).toBe('Vasha');
    // the first closes on its own and the second takes its place at once: close() opens the queued moment
    // synchronously, so there is no empty screen to wait for — the second landing is the proof the first
    // went, and the snapshots arrive in order
    const q2 = await waitLanded(p, 7, qFrom);
    expect(q2.name).toBe('Ilse');
    await waitGone(p);
    expect(await p.evaluate(f => window.__landedSnaps.slice(f).map(s => s.name), qFrom)).toEqual(['Vasha', 'Ilse']);
    expect(await p.evaluate(() => window.__dsOrder)).toEqual(['Vasha', 'Ilse']);
    expect(await p.evaluate(() => window.__dsDone)).toEqual(['Vasha', 'Ilse']);
    // the badge: the right marks, stable's calm mark, dead, and null empties it
    const badge = await p.evaluate(() => { const D = window.DreadDelve.deathSave;
      const el = document.createElement('div'); el.id = 'dsBadgeDemo'; document.body.appendChild(el);
      // pinned in clear space for the screenshot: loose in the body it sits under the fixed HUD
      el.style.cssText = 'position:fixed;left:16px;top:16px;z-index:70;background:#26211c;padding:6px 8px;border-radius:6px;';
      const read = () => ({ h:el.querySelectorAll('.ds-h.on').length, k:el.querySelectorAll('.ds-k.on').length,
        calm:!!el.querySelector('.ds-calm'), dead:el.classList.contains('ds-dead'), empty:el.children.length === 0 });
      D.dyingBadge(el, { s:[true, false, false], f:[true, true, false], stable:false, dead:false });
      const dying = read();
      D.dyingBadge(el, { s:[true, true, true], f:[false, false, false], stable:true, dead:false });
      const stable = read();
      D.dyingBadge(el, { s:[false, false, false], f:[true, true, true], stable:false, dead:true });
      const dead = read();
      D.dyingBadge(el, null);
      const nulled = read();
      D.dyingBadge(el, { s:[true, false, false], f:[false, false, false], stable:false, dead:false });
      const again = read();
      D.dyingBadge(null, { s:[true, true, true], f:[true, true, true], stable:false, dead:false });   // never throws
      return { dying, stable, dead, nulled, again }; });
    expect(badge.dying).toMatchObject({ h:1, k:2, calm:false, dead:false, empty:false });
    expect(badge.stable).toMatchObject({ calm:true, h:0, k:0 });
    expect(badge.dead).toMatchObject({ h:0, k:3, dead:true });
    expect(badge.nulled).toMatchObject({ empty:true });
    expect(badge.again).toMatchObject({ h:1, k:0 });
    // the badge as it reads on a card: one heart and two skulls, on a dark chip
    await p.evaluate(() => window.DreadDelve.deathSave.dyingBadge(document.getElementById('dsBadgeDemo'), { s:[true, false, false], f:[true, true, false], stable:false, dead:false }));
    if (SP) await p.locator('#dsBadgeDemo').screenshot({ path:`${SP}/deathsave-badge.png` });
    const o = await overflow(p);
    for (const v of Object.values(o)) expect(v).toBeLessThanOrEqual(1);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a phone with the handheld on: the moment sits inside the screen, and nothing is cut off', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  const p = await context.newPage();
  const errors = await preparePage(p, { handheld:true });
  try {
    await begin(p, 'vasha-ds-ph', { mode:'on', full:false });
    await expect(p.locator('#handheld')).toBeVisible();
    await expect(p.locator('body')).toHaveClass(/\bhh\b/);
    await clearCards(p);
    await defineOpener(p);
    await patchHold(p);
    await p.evaluate(() => window.__openSave({ name:'Vasha', before:{ s:1, f:2 }, after:{ s:1, f:3 }, d20:4, outcome:'dead', words:'The valley keeps a silence where Vasha lay.', mine:true }));
    const st = await waitLanded(p, 4);
    expect(st.cls).toContain('ds-dead');
    expect(st.name).toBe('You');
    // the moment's rect, read in the same snapshot as the landing, sits inside the screen's rect
    expect(st.screen).not.toBeNull();
    expect(st.rect[0]).toBeGreaterThanOrEqual(st.screen[0] - 1);
    expect(st.rect[1]).toBeGreaterThanOrEqual(st.screen[1] - 1);
    expect(st.rect[2]).toBeLessThanOrEqual(st.screen[2] + 1);
    expect(st.rect[3]).toBeLessThanOrEqual(st.screen[3] + 1);
    const o = await overflow(p);
    for (const v of Object.values(o)) expect(v).toBeLessThanOrEqual(1);
    if (SP) await p.screenshot({ path:`${SP}/deathsave-phone.png` });
    await pressEscape(p);
    await waitGone(p, 5_000);
    await unpatchHold(p);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('with reduced motion: everything is there at once', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-ds-rm');
    await clearCards(p);
    await defineOpener(p);
    await p.emulateMedia({ reducedMotion:'reduce' });
    // one atomic step: open, then read at once — no tumble, nothing may arrive on a timer
    const atOnce = await p.evaluate(() => { window.__openSave({ name:'Vasha', before:{ s:1, f:1 }, after:{ s:2, f:1 }, d20:14, outcome:'success', words:'Colour returns to Vasha’s lips.', mine:false });
      const el = document.querySelector('#deathSave');
      return { name:el?.querySelector('.ds-name')?.textContent, die:el?.querySelector('.ds-die-num')?.textContent,
        hearts:el?.querySelectorAll('.ds-h.on').length, skulls:el?.querySelectorAll('.ds-k.on').length,
        words:el?.querySelector('.ds-words')?.textContent, landed:el?.classList.contains('ds-landed') }; });
    expect(atOnce).toMatchObject({ name:'Vasha', die:'14', hearts:2, skulls:1,
      words:'Colour returns to Vasha’s lips.', landed:true });
    // and it goes on its own, and onDone runs once (the hold is 1.2 s on a real device; this box's timers
    // run at ~2.4 s granularity, so the wall-clock total is not asserted here — see the PR body)
    await waitGone(p);
    expect(await p.evaluate(() => window.__dsDone)).toEqual(['Vasha']);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});
