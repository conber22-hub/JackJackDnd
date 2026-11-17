import { test, expect } from '@playwright/test';
import { preparePage } from './helpers.js';

// 🏆 The screens between the fights (ui/victory.js, ui/bestiary.js, ui/trophies.js, ui/levelup.js): the victory
// screen in beats a player can skip, the bestiary book, the achievement banners and shelf, and the level-up
// fanfare. This spec does NOT use the helpers' fixture: each test opens its own context (a fresh device) and
// prepares it, then asserts its own errors. The screens are driven through window.DreadDelve.screens with
// hand-made data in the shapes the brief gives (ChatGPT's logic is not imported); taps are plain DOM clicks.
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
// handler is the same one a real key reaches outside the Wanderer — and proves Ⓑ through the press functions,
// which is the path a real Escape takes in the Wanderer.
const pressEscape = page => page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true, cancelable:true })));
const overflow = page => page.evaluate(() => ({ doc:document.documentElement.scrollWidth - innerWidth,
  vic:document.querySelector('#victory') ? document.querySelector('#victory').scrollWidth - document.querySelector('#victory').clientWidth : 0,
  best:document.querySelector('#bestiary') ? document.querySelector('#bestiary').scrollWidth - document.querySelector('#bestiary').clientWidth : 0,
  tr:document.querySelector('#trophies') ? document.querySelector('#trophies').scrollWidth - document.querySelector('#trophies').clientWidth : 0,
  lu:document.querySelector('#levelUp') ? document.querySelector('#levelUp').scrollWidth - document.querySelector('#levelUp').clientWidth : 0 }));

// (Hand-made data in the brief's shapes is inlined in each test below.)

const openVictory = page => page.evaluate(() => { const S = window.DreadDelve.screens;
  return !!S.openVictory({ rounds:3, won:true, per:{ vasha:{ dealt:34, taken:12, healed:5, healedOthers:0, hits:5, misses:1, crits:1, kills:2, biggest:14 }, ilse:{ dealt:18, taken:6, healed:9, healedOthers:5, hits:3, misses:2, crits:0, kills:1, biggest:9 } },
    biggest:{ by:'vasha', at:'wolf', n:14, weapon:'longsword', crit:true }, mvp:{ id:'vasha', why:'Thirty-four damage, two kills, and never once went down.' },
    awards:[{ id:'vasha', key:'untouched', title:'Untouched', line:'Vasha took not a scratch.' }, { id:'ilse', key:'mender', title:'The Mender', line:'Ilse kept the party standing.' }],
    headline:'The wolves break and run', verdict:'Over before the mist knew it had started.', xp:120,
    loot:{ gp:42, sp:7, items:['Potion of Healing', 'Wolf pelt', 'A silvered dagger'] } },
    { party:['vasha', 'ilse'], names:{ vasha:'Vasha', ilse:'Ilse Varga' }, faces:{}, xp:{ before:250, after:320, next:300, level:3 } }); });

test('on a desktop: the victory screen steps through its beats to Carry on, and each screen closes with Escape', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-sc');
    await clearCards(p);
    // the victory screen: headline, MVP, party numbers, awards, XP crossing the line, loot, Carry on
    expect(await openVictory(p)).toBe(true);
    await expect(p.locator('#victory')).toBeVisible();
    await expect(p.locator('#victory')).toContainText('The wolves break and run');
    await expect(p.locator('#victory')).toContainText('Round 3');
    const beats = await p.evaluate(() => { const V = window.DreadDelve.screens, out = [];
      const snap = () => { const s = document.querySelector('#victory'); return s ? { title:s.querySelector('.vc-title').textContent, text:s.textContent } : null; };
      // Ⓐ on an animated beat finishes it first, then goes on — so each animated beat takes two presses
      out.push(snap());                       // headline
      V.victoryPress('a'); out.push(snap());  // MVP
      V.victoryPress('a'); out.push(snap());  // party (counting)
      V.victoryPress('a'); out.push(snap());  // party (finished)
      V.victoryPress('a'); out.push(snap());  // awards (just entered)
      V.victoryPress('a'); out.push(snap());  // awards (finished)
      V.victoryPress('a'); out.push(snap());  // XP (filling)
      V.victoryPress('a'); out.push(snap());  // XP (finished)
      V.victoryPress('a'); out.push(snap());  // loot (just entered)
      V.victoryPress('a'); out.push(snap());  // loot (finished)
      V.victoryPress('a'); out.push(snap());  // Carry on
      return out; });
    expect(beats.map(b => b.title)).toEqual(['Victory', 'Most valuable hero', 'The party', 'The party', 'Awards', 'Awards', 'Experience', 'Experience', 'Loot', 'Loot', 'Victory']);
    expect(beats[1].text).toContain('Vasha'); expect(beats[1].text).toContain('Thirty-four damage');
    expect(beats[3].text).toContain('34'); expect(beats[3].text).toContain('12'); expect(beats[3].text).toContain('Ilse Varga');
    expect(beats[5].text).toContain('Untouched'); expect(beats[5].text).toContain('The Mender');
    expect(beats[7].text).toContain('Level up'); expect(beats[7].text).toContain('320 / 300');
    expect(beats[9].text).toContain('Potion of Healing'); expect(beats[9].text).toContain('Wolf pelt'); expect(beats[9].text).toContain('42 gp');
    expect(beats[10].text).toContain('Carry on');
    if (SP) await p.screenshot({ path:`${SP}/victory-carry.png` });
    // Ⓐ on Carry on closes it
    await p.evaluate(() => window.DreadDelve.screens.victoryPress('a'));
    await expect(p.locator('#victory')).toHaveCount(0);
    // each screen closes with Escape: bestiary, shelf, level-up
    await p.evaluate(() => window.DreadDelve.screens.openBestiary({ seen:3, fought:2, mastered:1, of:4, entries:[
      { bid:'wolf', tier:3, name:'Wolf', family:'Beasts', seen:'Grey, low, and hungry.', fought:['It comes in low and fast.'], lore:'The wolves of Barovia remember the roads.', voice:'Madam Eva', tip:'Keep your back to a wall.', revealed:{ ac:13, hp:'about 11', speed:'40 ft.' }, counts:{ seen:6, fought:4, killed:3 }, next:null },
      { bid:'bat', tier:0, name:'???', family:'Beasts', seen:'', fought:[], lore:'', voice:'', tip:'', revealed:{}, counts:{ seen:0, fought:0, killed:0 }, next:'Not yet seen.' } ] }, { faces:{} }));
    await expect(p.locator('#bestiary')).toBeVisible();
    await pressEscape(p);
    await expect(p.locator('#bestiary')).toHaveCount(0);
    await p.evaluate(() => window.DreadDelve.screens.openTrophies([
      { id:'first-blood', name:'First Blood', text:'Your first kill.', icon:'🩸', tier:'bronze', got:true, n:1, goal:1, pct:100, hidden:false, group:'fighting' } ], { got:1, of:1, bronze:1, silver:0, gold:0 }, {}));
    await expect(p.locator('#trophies')).toBeVisible();
    await pressEscape(p);
    await expect(p.locator('#trophies')).toHaveCount(0);
    await p.evaluate(() => window.DreadDelve.screens.openLevelUp({ name:'Vasha', face:null, from:3, to:4, hp:{ before:24, after:31 },
      gains:[{ kind:'feature', name:'Second Wind', text:'Regain 1d10 + 4 hit points.' }] }, {}));
    await expect(p.locator('#levelUp')).toBeVisible();
    await pressEscape(p);
    await expect(p.locator('#levelUp')).toHaveCount(0);
    const o = await overflow(p);
    for (const v of Object.values(o)) expect(v).toBeLessThanOrEqual(1);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a desktop: the bestiary shows ??? for a tier-0 entry and the lore for a tier-3 one, and Ⓑ goes back', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-sc-best');
    await clearCards(p);
    await p.evaluate(() => window.DreadDelve.screens.openBestiary({ seen:3, fought:2, mastered:1, of:4, entries:[
      { bid:'wolf', tier:3, name:'Wolf', family:'Beasts', seen:'Grey, low, and hungry — it circles before it commits.',
        fought:['It comes in low and fast, then backs off to circle again.', 'Two of them together will try to flank.'],
        lore:'The wolves of Barovia are not like other wolves. They remember the roads the way people remember names.',
        voice:'Madam Eva', tip:'Keep your back to a wall and your steel between you.',
        revealed:{ ac:13, hp:'about 11', speed:'40 ft.', resist:['—'], immune:['—'], vuln:['—'] },
        counts:{ seen:6, fought:4, killed:3 }, next:null },
      { bid:'bat', tier:0, name:'???', family:'Beasts', seen:'', fought:[], lore:'', voice:'', tip:'', revealed:{},
        counts:{ seen:0, fought:0, killed:0 }, next:'Not yet seen.' },
      { bid:'zombie', tier:2, name:'Zombie', family:'The dead', seen:'It walks like a man remembering how.',
        fought:['Slow, but it does not stop. Put it down twice.'], lore:'', voice:'', tip:'',
        revealed:{ ac:8, hp:'about 22', speed:'20 ft.', resist:['—'], immune:['poison'], vuln:['radiant'] },
        counts:{ seen:3, fought:2, killed:1 }, next:'Kill 2 more to learn its story.' },
      { bid:'ghost', tier:1, name:'Ghost', family:'The dead', seen:'A cold patch in the air, and a face that almost is.',
        fought:[], lore:'', voice:'', tip:'', revealed:{}, counts:{ seen:1, fought:0, killed:0 }, next:'Fight it to learn how it fights.' } ] }, { faces:{} }));
    await expect(p.locator('#bestiary')).toBeVisible();
    await expect(p.locator('#bestiary')).toContainText('3 / 4 seen');
    await expect(p.locator('#bestiary')).toContainText('Beasts');
    await expect(p.locator('#bestiary')).toContainText('???');
    await expect(p.locator('#bestiary .be-cell.t3')).toHaveCount(1);   // the wolf, tier 3, gold edge
    if (SP) await p.screenshot({ path:`${SP}/bestiary-grid.png` });
    // Ⓐ opens the first entry (the wolf, tier 3): the lore paragraph, the voice, the tip, the revealed numbers
    await p.evaluate(() => window.DreadDelve.screens.bestiaryPress('a'));
    await expect(p.locator('#bestiary')).toContainText('The wolves of Barovia are not like other wolves');
    await expect(p.locator('#bestiary')).toContainText('Madam Eva');
    await expect(p.locator('#bestiary')).toContainText('Keep your back to a wall');
    await expect(p.locator('#bestiary')).toContainText('Armour');
    await expect(p.locator('#bestiary')).toContainText('Seen 6');
    if (SP) await p.screenshot({ path:`${SP}/bestiary-entry.png` });
    // Ⓑ goes back from the entry to the grid; the D-pad moves the highlight; Ⓐ opens the tier-0 bat, which stays locked
    await p.evaluate(() => window.DreadDelve.screens.bestiaryPress('b'));
    await expect(p.locator('#bestiary .be-grid').first()).toBeVisible();
    const moved = await p.evaluate(() => { const B = window.DreadDelve.screens, hi = () => [...document.querySelectorAll('#bestiary .be-cell')].findIndex(n => n.classList.contains('on'));
      const h0 = hi(); B.bestiaryPress('right'); const h1 = hi(); B.bestiaryPress('left'); const h2 = hi();
      return { h0, h1, h2, n:document.querySelectorAll('#bestiary .be-cell').length }; });
    expect(moved.n).toBe(4); expect(moved.h1).toBe(1); expect(moved.h2).toBe(0);
    await p.evaluate(() => { const B = window.DreadDelve.screens; B.bestiaryPress('right'); B.bestiaryPress('a'); });
    await expect(p.locator('#bestiary')).toContainText('Not yet seen.');
    await expect(p.locator('#bestiary .be-en')).toHaveText('???');
    await p.evaluate(() => window.DreadDelve.screens.bestiaryPress('b'));
    await expect(p.locator('#bestiary .be-grid').first()).toBeVisible();
    await p.evaluate(() => window.DreadDelve.screens.closeBestiary());
    await expect(p.locator('#bestiary')).toHaveCount(0);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a desktop: a trophy banner appears and is gone after a few seconds, two in a row both show, and the shelf shows a hidden one as ???', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-sc-tr');
    await clearCards(p);
    // One banner: it appears, then is gone after a few seconds. A MutationObserver records the banner's
    // classes as they change — the frame rate here is seconds per frame, so polling for the short 'in'
    // window from outside the page keeps missing it; the observer fires on the change itself, and the
    // recorded history keeps the 'in' entry even after the banner slides away.
    await p.evaluate(() => { window.__bannerSeen = [];
      const obs = new MutationObserver(() => { const b = document.querySelector('#trophyBanner'); if (b) window.__bannerSeen.push({ cls:b.className, text:b.textContent }); });
      obs.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] }); });
    await p.evaluate(() => window.DreadDelve.screens.trophyBanner({ name:'First Blood', text:'Your first kill in the valley.', icon:'🩸', tier:'bronze' }));
    await expect(p.locator('#trophyBanner')).toContainText('First Blood');
    await p.waitForFunction(() => (window.__bannerSeen || []).some(b => /\bin\b/.test(b.cls)), null, { timeout:20_000, polling:200 });
    if (SP) await p.screenshot({ path:`${SP}/trophy-banner.png` });
    await p.waitForFunction(() => !document.querySelector('#trophyBanner'), null, { timeout:30_000, polling:200 });
    const first = await p.evaluate(() => window.__bannerSeen);
    expect(first.some(b => /\bin\b/.test(b.cls) && b.text.includes('First Blood'))).toBe(true);
    // two in a row: both show, one after the other
    await p.evaluate(() => { window.__bannerSeen = [];
      const S = window.DreadDelve.screens;
      S.trophyBanner({ name:'First Blood', text:'Your first kill.', icon:'🩸', tier:'bronze' });
      S.trophyBanner({ name:'Wolfbane', text:'Five wolves put down.', icon:'🐺', tier:'silver' }); });
    await p.waitForFunction(() => { const seen = window.__bannerSeen || [];
      const a = seen.some(b => /\bin\b/.test(b.cls) && b.text.includes('First Blood'));
      const c = seen.some(b => /\bin\b/.test(b.cls) && b.text.includes('Wolfbane'));
      return a && c && !document.querySelector('#trophyBanner'); }, null, { timeout:40_000, polling:200 });
    // the shelf: a hidden one as ???, an earned one bright, an unearned one with its progress
    await p.evaluate(() => window.DreadDelve.screens.openTrophies([
      { id:'first-blood', name:'First Blood', text:'Your first kill in the valley.', icon:'🩸', tier:'bronze', got:true, n:1, goal:1, pct:100, hidden:false, group:'fighting' },
      { id:'wolves-five', name:'Wolfbane', text:'Five wolves put down.', icon:'🐺', tier:'silver', got:false, n:2, goal:5, pct:40, hidden:false, group:'fighting' },
      { id:'secret-door', name:'???', text:'Something in the valley, waiting.', icon:'?', tier:'gold', got:false, n:0, goal:1, pct:0, hidden:true, hint:'Find the door that is not a door.', group:'odd' } ],
      { got:1, of:3, bronze:1, silver:0, gold:0 }, {}));
    await expect(p.locator('#trophies')).toBeVisible();
    await expect(p.locator('#trophies')).toContainText('1 / 3');
    await expect(p.locator('#trophies')).toContainText('First Blood');
    await expect(p.locator('#trophies')).toContainText('Wolfbane');
    await expect(p.locator('#trophies')).toContainText('2 / 5');
    await expect(p.locator('#trophies')).toContainText('???');
    await expect(p.locator('#trophies')).toContainText('Find the door that is not a door.');
    await expect(p.locator('#trophies .tr-row.got-bronze')).toHaveCount(1);
    if (SP) await p.screenshot({ path:`${SP}/trophy-shelf.png` });
    await p.evaluate(() => window.DreadDelve.screens.trophiesPress('b'));
    await expect(p.locator('#trophies')).toHaveCount(0);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a desktop: the level-up screen shows the new level and every gain', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-sc-lu');
    await clearCards(p);
    await p.evaluate(() => window.DreadDelve.screens.openLevelUp({ name:'Vasha', face:null, from:3, to:4, hp:{ before:24, after:31 },
      gains:[{ kind:'feature', name:'Second Wind', text:'Once per rest, regain 1d10 + 4 hit points as a bonus action.' },
        { kind:'spell', name:'Cure Wounds', text:'Touch a creature and restore 1d8 + 3 hit points.' },
        { kind:'slot', name:'A new spell slot', text:'One more 1st-level slot to spend.' }] }, {}));
    await expect(p.locator('#levelUp')).toBeVisible();
    await expect(p.locator('#levelUp')).toContainText('Level 4');
    await expect(p.locator('#levelUp')).toContainText('Vasha');
    // the hit points climb to the new total
    await p.waitForFunction(() => document.querySelector('#levelUp .lu-hp b')?.textContent === '31', null, { timeout:15_000, polling:200 });
    // Ⓐ shows every gain at once — but only if any are still hidden: if the gains have already flipped in,
    // Ⓐ closes the screen instead. The check and the press are one atomic step, so the chain cannot finish
    // between them and steal the press.
    await p.evaluate(() => { const L = window.DreadDelve.screens; if (document.querySelectorAll('#levelUp .lu-gain').length < 3) L.levelUpPress('a'); });
    await expect(p.locator('#levelUp')).toContainText('Second Wind');
    await expect(p.locator('#levelUp')).toContainText('Cure Wounds');
    await expect(p.locator('#levelUp')).toContainText('A new spell slot');
    if (SP) await p.screenshot({ path:`${SP}/levelup.png` });
    // Ⓐ once more closes it
    await p.evaluate(() => window.DreadDelve.screens.levelUpPress('a'));
    await expect(p.locator('#levelUp')).toHaveCount(0);
    expect(await p.evaluate(() => window.DreadDelve.screens.levelUpPress('a'))).toBe(false);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a phone with the handheld on: all four screens open over the screen and close, with no sideways scroll', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  const p = await context.newPage();
  const errors = await preparePage(p, { handheld:true });
  try {
    await begin(p, 'vasha-sc-ph', { mode:'on', full:false });
    await expect(p.locator('#handheld')).toBeVisible();
    await expect(p.locator('body')).toHaveClass(/\bhh\b/);
    await clearCards(p);
    // each screen opens over the screen's rect and closes with Escape
    const rects = await p.evaluate(() => { const S = window.DreadDelve.screens, out = {};
      const scr = document.querySelector('#hhScreen').getBoundingClientRect();
      const rect = id => { const r = document.querySelector(id)?.getBoundingClientRect(); return r ? [r.left, r.top, r.width, r.height].map(Math.round) : null; };
      S.openVictory({ rounds:3, won:true, per:{ vasha:{ dealt:34, taken:12, healed:5, healedOthers:0, hits:5, misses:1, crits:1, kills:2, biggest:14 } },
        mvp:{ id:'vasha', why:'Thirty-four damage.' }, awards:[], headline:'The wolves break and run', verdict:'Over.', xp:120, loot:null },
        { party:['vasha'], names:{ vasha:'Vasha' }, faces:{}, xp:{ before:250, after:320, next:300, level:3 } });
      out.victory = rect('#victory'); out.screen = [scr.left, scr.top, scr.width, scr.height].map(Math.round);
      S.closeVictory();
      S.openBestiary({ seen:1, fought:0, mastered:0, of:1, entries:[{ bid:'wolf', tier:1, name:'Wolf', family:'Beasts', seen:'Grey and hungry.', fought:[], lore:'', voice:'', tip:'', revealed:{}, counts:{ seen:1, fought:0, killed:0 }, next:null }] }, { faces:{} });
      out.bestiary = rect('#bestiary'); S.closeBestiary();
      S.openTrophies([{ id:'first-blood', name:'First Blood', text:'Your first kill.', icon:'🩸', tier:'bronze', got:true, n:1, goal:1, pct:100, hidden:false, group:'fighting' }], { got:1, of:1, bronze:1, silver:0, gold:0 }, {});
      out.trophies = rect('#trophies'); S.closeTrophies();
      S.openLevelUp({ name:'Vasha', face:null, from:3, to:4, hp:{ before:24, after:31 }, gains:[{ kind:'feature', name:'Second Wind', text:'Regain hit points.' }] }, {});
      out.levelup = rect('#levelUp'); S.closeLevelUp();
      return out; });
    for (const k of ['victory', 'bestiary', 'trophies', 'levelup']){
      for (let i = 0; i < 4; i++) expect(Math.abs(rects[k][i] - rects.screen[i])).toBeLessThanOrEqual(2);
    }
    // the victory screen again, through its beats on the phone, and a screenshot
    expect(await openVictory(p)).toBe(true);
    await expect(p.locator('#victory')).toContainText('The wolves break and run');
    const o1 = await overflow(p);
    for (const v of Object.values(o1)) expect(v).toBeLessThanOrEqual(1);
    if (SP) await p.screenshot({ path:`${SP}/victory-phone.png` });
    await pressEscape(p);
    await expect(p.locator('#victory')).toHaveCount(0);
    // the banner slides in over the handheld screen and goes away
    await p.evaluate(() => window.DreadDelve.screens.trophyBanner({ name:'First Blood', text:'Your first kill in the valley.', icon:'🩸', tier:'bronze' }));
    await expect(p.locator('#trophyBanner')).toContainText('First Blood');
    if (SP) await p.screenshot({ path:`${SP}/banner-phone.png` });
    await p.waitForFunction(() => !document.querySelector('#trophyBanner.in'), null, { timeout:15_000, polling:200 });
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});
