import { test, expect } from '@playwright/test';
import { preparePage } from './helpers.js';

// 🎯 The target card (ui/targetcard.js): a small card for the foe you're aiming at — health in words, its
// conditions, what you've learned about it, and your odds. This spec does NOT use the helpers' fixture: each
// test opens its own context and prepares it, then asserts its own errors. The card is driven directly through
// window.DreadDelve.targetCard — no fight needed.
const SP = process.env.SC_SHOTS;   // a folder to keep screenshots in

const wolf = (hp, extra = {}) => ({ id:'wolf-1', name:'Wolf', kind:'monster', bid:'wolf', hp, maxHp:11, dead:false, conds:[], ...extra });
const knownResist = { bid:'wolf', tier:2, name:'Wolf', revealed:{ resist:['slashing'], ac:13 } };

// a host div, sized the way the fight bar would size it, fixed where it can be seen and measured
const host = (page, w, h) => page.evaluate(([w, h]) => { const d = document.createElement('div');
  d.id = 'tcTest'; d.style.cssText = `position:fixed;top:12px;left:12px;width:${w}px;height:${h}px;z-index:9999`;
  document.body.appendChild(d); }, [w, h]);
const render = (page, token, known = null, odds = null, face = null) => page.evaluate(([t, k, o, f]) =>
  window.DreadDelve.targetCard.renderTargetCard(document.getElementById('tcTest'), { token:t, known:k, odds:o, face:f }), [token, known, odds, face]);
const text = page => page.evaluate(() => document.querySelector('#tcTest .tc-card')?.textContent || '');
const cardClass = page => page.evaluate(() => document.querySelector('#tcTest .tc-card')?.className || '');
const chips = page => page.evaluate(() => [...document.querySelectorAll('#tcTest .tc-cond')].map(n => n.textContent));
const ring = page => page.evaluate(() => getComputedStyle(document.querySelector('#tcTest .tc-face')).borderColor);
const oddsTitle = page => page.evaluate(() => document.querySelector('#tcTest .tc-odds')?.title || '');
// nothing spills out of the card: its own scroll size fits, its box fits the viewport, the page doesn't scroll sideways
const spill = page => page.evaluate(() => { const c = document.querySelector('#tcTest .tc-card');
  if (!c) return null; const r = c.getBoundingClientRect();
  return { sw:c.scrollWidth, cw:c.clientWidth, sh:c.scrollHeight, ch:c.clientHeight, h:c.offsetHeight,
    l:r.left, r:r.right, t:r.top, b:r.bottom, vw:innerWidth, vh:innerHeight, doc:document.documentElement.scrollWidth }; });
const noSpill = s => { expect(s.sw).toBeLessThanOrEqual(s.cw + 1); expect(s.sh).toBeLessThanOrEqual(s.ch + 1);
  expect(s.l).toBeGreaterThanOrEqual(0); expect(s.r).toBeLessThanOrEqual(s.vw + 1);
  expect(s.t).toBeGreaterThanOrEqual(0); expect(s.b).toBeLessThanOrEqual(s.vh + 1); expect(s.doc).toBeLessThanOrEqual(s.vw); };

// the Wanderer, with the handheld on — so body.hh is genuinely there, the way the card will see it on a phone
async function wanderPhone(page){
  await page.evaluate(() => { const D = window.DreadDelve, h = D.newHero('Fighter'); h.name = 'Vasha'; h.id = 'vasha-tc';
    localStorage.setItem('dreaddelve.heroes.v1', JSON.stringify([h])); localStorage.removeItem('dreaddelve.role');
    localStorage.setItem('dreaddelve.handheld.v1', JSON.stringify({ mode:'on', full:false })); });
  await page.reload(); await page.waitForFunction(() => !!window.DreadDelve);
  await page.locator('[data-act="thRole"][data-k="wander"]').click();
  await page.locator('[data-act="wdBegin"][data-id="vasha-tc"]').click();
  await expect(page.locator('#hhBoot')).toBeHidden({ timeout:30_000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#wdPlace')).toHaveText('Village of Barovia');
  await expect(page.locator('#handheld')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/\bhh\b/);
}

test('on a desktop: health in words, never numbers; conditions; what is known; null empties it', async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await host(p, 440, 64);
    // health in words, and never a hit point anywhere in the card's text
    await render(p, wolf(11)); expect(await text(p)).toContain('Unhurt'); expect(await text(p)).not.toMatch(/\d/);
    expect(await cardClass(p)).toContain('hw-unhurt');
    const ringFull = await ring(p);
    await render(p, wolf(9)); expect(await text(p)).toContain('Scratched'); expect(await text(p)).not.toMatch(/\d/);
    await render(p, wolf(4)); expect(await text(p)).toContain('Bloodied'); expect(await text(p)).not.toMatch(/\d/);
    expect(await cardClass(p)).toContain('hw-bloodied');
    await render(p, wolf(2)); expect(await text(p)).toContain('Near death'); expect(await text(p)).not.toMatch(/\d/);
    expect(await ring(p)).not.toBe(ringFull);   // the ring's colour eases with the health word
    await render(p, wolf(0, { dead:true })); expect(await text(p)).toContain('Down'); expect(await text(p)).not.toMatch(/\d/);
    // conditions: three show three icons, six show four and "+2"
    await render(p, wolf(11, { conds:[{ n:'prone' }, { n:'frightened' }, { n:'poisoned' }] }));
    expect(await chips(p)).toEqual(['🛌 PR', '😱 FR', '☠ PO']);
    await render(p, wolf(11, { conds:[{ n:'prone' }, { n:'frightened' }, { n:'poisoned' }, { n:'blinded' }, { n:'stunned' }, { n:'charmed' }] }));
    expect(await chips(p)).toEqual(['🛌 PR', '😱 FR', '☠ PO', '👁 BL', '+2']);
    // what's known: a resistance shows, and AC once fought — and still never the hit points
    await render(p, wolf(11), knownResist);
    expect(await text(p)).toContain('Resists Slashing'); expect(await text(p)).toContain('AC 13');
    expect(await text(p)).not.toContain('11');
    // the odds, in big figures, the edge's mark before them and the why in the tooltip
    await render(p, wolf(11), knownResist, { pct:'65%', edge:{ mark:'▲', text:'advantage: flanking' } });
    expect(await text(p)).toContain('▲65%'); expect(await oddsTitle(p)).toBe('advantage: flanking');
    // nothing spills out of the card, at its fullest
    noSpill(await spill(p));
    if (SP) await p.screenshot({ path:`${SP}/targetcard-desktop.png` });
    // null empties it
    await render(p, null); expect(await text(p)).toBe('');
    expect(await p.evaluate(() => document.querySelector('#tcTest .tc-card'))).toBeNull();
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a phone with the handheld on: the card fits the handheld, and nothing spills out', async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  const p = await context.newPage();
  const errors = await preparePage(p, { handheld:true });
  try {
    await wanderPhone(p);
    await host(p, 340, 44);
    await render(p, wolf(4, { conds:[{ n:'prone' }, { n:'frightened' }] }), knownResist, { pct:'65%', edge:{ mark:'▲', text:'advantage: flanking' } });
    expect(await text(p)).toContain('Bloodied');
    expect(await text(p)).toContain('Resists Slashing'); expect(await text(p)).toContain('▲65%');
    const s = await spill(p);
    expect(s.h).toBeLessThanOrEqual(46);   // about 44px on the handheld
    noSpill(s);
    if (SP) await p.screenshot({ path:`${SP}/targetcard-phone.png` });
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});
