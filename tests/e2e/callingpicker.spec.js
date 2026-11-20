import { test, expect } from '@playwright/test';
import { preparePage } from './helpers.js';

// ⛨ Choose your Calling (ui/callingpicker.js, ui/emblems.js): the twelve Callings, each with its emblem,
// and the picker in the hero creator. This spec does NOT use the helpers' fixture: each test opens its own
// context (a fresh device) and prepares it, then asserts its own errors. The picker is driven through
// window.DreadDelve.callingPicker with a stand-in list of twelve shaped like ChatGPT's callingList()
// (with Paths and signatures, as the brief's stand-in shape has them); taps are plain DOM clicks.
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
  pk:document.querySelector('#callingPicker') ? document.querySelector('#callingPicker').scrollWidth - document.querySelector('#callingPicker').clientWidth : 0 }));

// The twelve, shaped like ChatGPT's callingList() (docs/chatgpt/callings.md) with Paths and signatures:
// names, chassis, eras, colours and Paths from docs/homebrew/callings.md; the blurbs are the stand-in's own.
const CALLINGS = [
  { id:'vanguard', name:'Vanguard', chassis:'Fighter', emblem:'⛨', color:'#9aa8b8', era:'far-future',
    blurb:'An armoured soldier from a war not yet fought, woken in the fog with a failing suit and the habits that kept them alive.',
    signature:{ n:'Ward', text:'A shimmer of force soaks blows before your hit points, and comes back if you go a round unhurt.' },
    paths:[
      { id:'hoplite', name:'Hoplite', seep:false, blurb:'Spear, great shield, the phalanx: hold the line together.' },
      { id:'breacher', name:'Breacher', seep:false, blurb:'Shock trooper: charge, shove, doors.' },
      { id:'hollowed', name:'Hollowed', seep:true, blurb:'The rot packs your wounds; you fight on past where you should fall.', cost:'Your hit point maximum shrinks until a long rest.' } ] },
  { id:'huscarl', name:'Huscarl', chassis:'Barbarian', emblem:'🪓', color:'#b05038', era:'ancient',
    blurb:'A Norse household warrior, sworn to a hall that is an age away, axe in hand and oath on their lips.',
    signature:{ n:'Fury', text:'Rage, by another name: you hit harder, and what hits you matters less.' },
    paths:[
      { id:'shieldbiter', name:'Shieldbiter', seep:false, blurb:'The berserk: bite the shield-rim and go in.' },
      { id:'hearth-sworn', name:'Hearth-Sworn', seep:false, blurb:'Guards one chosen ally, and does not leave their side.' },
      { id:'rotblood', name:'Rotblood', seep:true, blurb:'The fury feeds a creeping mass that bursts from you.', cost:'A creeping mark the faithful can see, and a voice that asks for things.' } ] },
  { id:'outrider', name:'Outrider', chassis:'Rogue', emblem:'🗡', color:'#8a7a5a', era:'any',
    blurb:'A scout and raider of the steppe, gone from sight a moment after hiding, back with the news or the prize.',
    signature:{ n:'Ambush', text:'Strike from where they were not looking, and it hurts all the more.' },
    paths:[
      { id:'horse-archer', name:'Horse-Archer', seep:false, blurb:'The steppe rider: shoot and move, never stand still.' },
      { id:'saboteur', name:'Saboteur', seep:false, blurb:'Traps, blasting powder, charges: the quiet way in, the loud way out.' },
      { id:'carrier', name:'Carrier', seep:true, blurb:'You carry spores; drop you and they burst.', cost:'The spores ride in your blood, and the Chorus counts them.' } ] },
  { id:'marksman', name:'Marksman', chassis:'Ranger', emblem:'🏹', color:'#5f8a4f', era:'medieval',
    blurb:'Longbowman, long-rifle, the far shot — one arrow, one answer, from further than the fog should allow.',
    signature:{ n:'Steady Aim', text:'Hold still, breathe out, and the shot lands where you meant it.' },
    paths:[
      { id:'yeoman', name:'Yeoman', seep:false, blurb:'The massed longbow volley: arrows like rain.' },
      { id:'long-watch', name:'Long Watch', seep:false, blurb:'One shot, very far, taken once and taken well.' },
      { id:'seepsight', name:'Seepsight', seep:true, blurb:'You see the rot in anything it has touched.', cost:'What you see, you cannot unsee — and it sees you back.' } ] },
  { id:'warden', name:'Warden', chassis:'Paladin', emblem:'⚜', color:'#d8d0c0', era:'medieval',
    blurb:'A knight under an oath older than Barovia, who swore to stand between the valley and whatever comes.',
    signature:{ n:'Oath-Strike', text:'Your oath lands with the blow, and the light answers.' },
    paths:[
      { id:'templar', name:'Templar', seep:false, blurb:'The crusading order: the oath, kept in formation.' },
      { id:'last-bastion', name:'Last Bastion', seep:false, blurb:'No one is left behind: guard the fallen, carry them out.' },
      { id:'penitent', name:'Penitent', seep:true, blurb:'You keep the rot chained in yourself, and burn it out of others.', cost:'The chain holds only while you hold it; let go, and it walks.' } ] },
  { id:'chaplain', name:'Chaplain', chassis:'Cleric', emblem:'✚', color:'#d8b45a', era:'medieval',
    blurb:'Field priest and corpsman, carrying the rites and the bandages to wherever the dying are.',
    signature:{ n:'Field Rites', text:'Healing given where it is needed, in the mud and under fire.' },
    paths:[
      { id:'corpsman', name:'Corpsman', seep:false, blurb:'Battle medicine: stabilise, revive, drag clear.' },
      { id:'bell-keeper', name:'Bell-Keeper', seep:false, blurb:"Barovia's bells: turn the dead, and let the living hear them." },
      { id:'mender-of-the-choir', name:'Mender of the Choir', seep:true, blurb:'Heal with the rot: strong, and it costs.', cost:'Every wound you close with rot leaves a little of it in you.' } ] },
  { id:'archivist', name:'Archivist', chassis:'Wizard', emblem:'📜', color:'#7a9ac8', era:'any',
    blurb:'A scholar bonded to a Ghostlight, an old intelligence in a lantern from a sealed vault, that talks back.',
    signature:{ n:'The Ghostlight', text:'It counsels, remembers and warns — and it keeps what it learns.' },
    paths:[
      { id:'librarian-of-ashes', name:'Librarian of Ashes', seep:false, blurb:'Lost libraries: lore and wards, read from the ash.' },
      { id:'strategist', name:'Strategist', seep:false, blurb:'Plans, foresight, the battle read before it is fought.' },
      { id:'whispered-archive', name:'Whispered Archive', seep:true, blurb:'The Chorus is talking to your Ghostlight, and some days it listens.', cost:'Some days the counsel is not yours.' } ] },
  { id:'relicborn', name:'Relicborn', chassis:'Sorcerer', emblem:'✦', color:'#b08ad8', era:'ancient',
    blurb:'A shard of the First Builders, makers who vanished before history, lodged in your blood and waking up.',
    signature:{ n:'Shardfire', text:'Light from before history, thrown like a spear.' },
    paths:[
      { id:'lattice', name:'Lattice', seep:false, blurb:'Solid light: walls, bridges, blades.' },
      { id:'keyed', name:'Keyed', seep:false, blurb:"The Builders' doors and engines answer you." },
      { id:'fused', name:'Fused', seep:true, blurb:'Shard and rot at war in your veins.', cost:'The war in your veins does not end; some days the rot wins a battle.' } ] },
  { id:'seepbound', name:'Seepbound', chassis:'Warlock', emblem:'☣', color:'#6fae5a', era:'barovian',
    blurb:'You let the Seep in and made terms with the Chorus, the mind of the rot. The Calling that goes all the way.',
    signature:{ n:'The Pact', text:'The Chorus gives; the Chorus keeps count.' },
    paths:[
      { id:'voice-of-the-chorus', name:'Voice of the Chorus', seep:false, blurb:'The infected listen to you.' },
      { id:'the-swarm', name:'The Swarm', seep:false, blurb:'Small spore-forms fight for you.' },
      { id:'the-bloom', name:'The Bloom', seep:true, blurb:"Barovia's own Bloom: green-black and beautiful.", cost:'The Bloom grows where you walk, and the valley notices.' } ] },
  { id:'herald', name:'Herald', chassis:'Bard', emblem:'🥁', color:'#c85a5a', era:'medieval',
    blurb:'Drummer, signaller, standard-bearer — the tempo of a fight, and the banner the line holds to.',
    signature:{ n:'Cadence', text:'Your rhythm steadies the line and unsettles the foe.' },
    paths:[
      { id:'drummer', name:'Drummer', seep:false, blurb:'The tempo of a fight, beaten out where all can hear it.' },
      { id:'standard-bearer', name:'Standard-Bearer', seep:false, blurb:'The banner: hold here, and hold together.' },
      { id:'hollow-voice', name:'Hollow Voice', seep:true, blurb:"You sing the Chorus's song, and the infected falter.", cost:'The song stays in your throat after, and hums when you are alone.' } ] },
  { id:'mistwalker', name:'Mistwalker', chassis:'Druid', emblem:'🌫', color:'#8a9aa8', era:'barovian',
    blurb:'Born of Barovia’s woods and its fog, at home in the mist the way others are at home in a house.',
    signature:{ n:'Mistshape', text:'Wear the fog, wear the wolf, wear the roots.' },
    paths:[
      { id:'wolfkin', name:'Wolfkin', seep:false, blurb:'The pack: run with it, hunt with it, howl with it.' },
      { id:'grove-keeper', name:'Grove-Keeper', seep:false, blurb:'Old roots, old trees, and the bargains they remember.' },
      { id:'mycelial', name:'Mycelial', seep:true, blurb:'The wild rot: fungus, spore and bloom.', cost:'The fog takes a little of you each time you wear it.' } ] },
  { id:'pankratiast', name:'Pankratiast', chassis:'Monk', emblem:'👊', color:'#c08a4a', era:'ancient',
    blurb:'The ancient all-strikes fighter of the Games — fists, feet, and the breath that carries them.',
    signature:{ n:'Breath', text:'The breath that steadies the strike and outlasts the fight.' },
    paths:[
      { id:'olympian', name:'Olympian', seep:false, blurb:'The athlete: speed, the throw, the perfect fall.' },
      { id:'pit-fighter', name:'Pit-Fighter', seep:false, blurb:'The brutal, the dirty: whatever wins the pit.' },
      { id:'twisted', name:'Twisted', seep:true, blurb:"Rot in the limbs: reach and grip that are not human.", cost:'Your limbs forget their shape a little more each time.' } ] },
];

// One opener, defined once on the page: onPick and onClose count themselves on the window.
const defineOpener = page => page.evaluate(callings => { window.__picked = []; window.__closed = 0;
  window.__openPicker = (current = null) => window.DreadDelve.callingPicker.openCallingPicker({ callings,
    current, onPick:p => window.__picked.push(p), onClose:() => { window.__closed = (window.__closed || 0) + 1; } }); }, CALLINGS);
const cardNames = page => page.evaluate(() => [...document.querySelectorAll('#callingPicker .cp-card .cp-nm')].map(e => e.textContent));
const highlighted = page => page.evaluate(() => document.querySelector('#callingPicker .cp-card.on .cp-nm')?.textContent || null);

test('on a desktop: all twelve show with emblems, the filters work, the arrows and Ⓐ pick, Escape goes back then closes, a tap works', async ({ browser, baseURL }) => {
  test.setTimeout(600_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-cp');
    await clearCards(p);
    await defineOpener(p);
    // the grid: all twelve, each with a name and an emblem (an <svg>)
    expect(await p.evaluate(() => !!window.__openPicker())).toBe(true);
    await expect(p.locator('#callingPicker')).toBeVisible();
    await expect(p.locator('#callingPicker .cp-card')).toHaveCount(12);
    expect(await cardNames(p)).toEqual(['Vanguard', 'Huscarl', 'Outrider', 'Marksman', 'Warden', 'Chaplain', 'Archivist', 'Relicborn', 'Seepbound', 'Herald', 'Mistwalker', 'Pankratiast']);
    expect(await p.evaluate(() => [...document.querySelectorAll('#callingPicker .cp-card svg')].length)).toBe(12);
    await expect(p.locator('#callingPicker')).toContainText('Far-future');
    await expect(p.locator('#callingPicker')).toContainText('Barovian');
    if (SP) await p.screenshot({ path:`${SP}/callingpicker-desktop.png` });
    // the filters: Born in Barovia shows two, The Drawn ten, All twelve again
    await p.locator('[data-cp-filter="barovia"]').click();
    expect(await cardNames(p)).toEqual(['Seepbound', 'Mistwalker']);
    await p.locator('[data-cp-filter="drawn"]').click();
    expect(await cardNames(p)).toHaveLength(10);
    await p.locator('[data-cp-filter="all"]').click();
    expect(await cardNames(p)).toHaveLength(12);
    // the arrows move the choice (right, right: Vanguard → Outrider), and Ⓐ opens its detail
    expect(await highlighted(p)).toBe('Vanguard');
    await p.evaluate(() => { const D = window.DreadDelve.callingPicker; D.callingPickerPress('right'); D.callingPickerPress('right'); });
    expect(await highlighted(p)).toBe('Outrider');
    await p.evaluate(() => window.DreadDelve.callingPicker.callingPickerPress('a'));
    await expect(p.locator('#callingPicker .cp-det')).toBeVisible();
    await expect(p.locator('#callingPicker')).toContainText('The Drawn · stands on Rogue');
    await expect(p.locator('#callingPicker')).toContainText('A scout and raider of the steppe');
    await expect(p.locator('#callingPicker')).toContainText('Ambush');
    await expect(p.locator('#callingPicker')).toContainText('Horse-Archer');
    await expect(p.locator('#callingPicker')).toContainText('Saboteur');
    await expect(p.locator('#callingPicker')).toContainText('Carrier');
    // the Seep-touched Path is marked, with its price
    const seep = await p.evaluate(() => { const row = document.querySelector('#callingPicker .cp-path.seep');
      return row ? { text:row.textContent, mark:!!row.querySelector('.cp-seep svg'), price:row.textContent.includes('The spores ride in your blood') } : null; });
    expect(seep?.mark).toBe(true);
    expect(seep?.price).toBe(true);
    expect(seep?.text).toContain('Seep-touched');
    if (SP) await p.screenshot({ path:`${SP}/callingpicker-detail.png` });
    // down, down: the second Path; Ⓐ picks it, once, with the right ids — and onClose does not run
    await p.evaluate(() => { const D = window.DreadDelve.callingPicker; D.callingPickerPress('down'); D.callingPickerPress('down'); });
    expect(await p.evaluate(() => document.querySelector('#callingPicker .cp-path.on .cp-pn')?.textContent)).toContain('Saboteur');
    await p.evaluate(() => window.DreadDelve.callingPicker.callingPickerPress('a'));
    await expect(p.locator('#callingPicker')).toHaveCount(0);
    expect(await p.evaluate(() => window.__picked)).toEqual([{ calling:'outrider', path:'saboteur' }]);
    expect(await p.evaluate(() => window.__closed)).toBe(0);
    expect(await p.evaluate(() => window.DreadDelve.callingPicker.callingPickerOpen())).toBe(false);
    // Escape in the grid closes it, and onClose runs once
    expect(await p.evaluate(() => !!window.__openPicker())).toBe(true);
    await pressEscape(p);
    await expect(p.locator('#callingPicker')).toHaveCount(0);
    expect(await p.evaluate(() => window.__closed)).toBe(1);
    // Escape in the detail goes back to the grid first, then closes
    expect(await p.evaluate(() => !!window.__openPicker())).toBe(true);
    await p.evaluate(() => window.DreadDelve.callingPicker.callingPickerPress('a'));
    await expect(p.locator('#callingPicker .cp-det')).toBeVisible();
    await pressEscape(p);
    await expect(p.locator('#callingPicker .cp-grid')).toBeVisible();
    expect(await p.evaluate(() => window.DreadDelve.callingPicker.callingPickerOpen())).toBe(true);
    await pressEscape(p);
    await expect(p.locator('#callingPicker')).toHaveCount(0);
    expect(await p.evaluate(() => window.__closed)).toBe(2);
    // a tap works: tap the Seepbound card, tap its Bloom Path, tap Choose
    expect(await p.evaluate(() => !!window.__openPicker())).toBe(true);
    await p.locator('[data-cp-card="seepbound"]').click();
    await expect(p.locator('#callingPicker .cp-det')).toBeVisible();
    await expect(p.locator('#callingPicker')).toContainText('The Pact');
    await p.locator('[data-cp-path="the-bloom"]').click();
    await expect(p.locator('#callingPicker .cp-path.on .cp-pn')).toContainText('The Bloom');
    await p.locator('[data-cp="choose"]').click();
    await expect(p.locator('#callingPicker')).toHaveCount(0);
    expect(await p.evaluate(() => window.__picked)).toEqual([{ calling:'outrider', path:'saboteur' }, { calling:'seepbound', path:'the-bloom' }]);
    const o = await overflow(p);
    for (const v of Object.values(o)) expect(v).toBeLessThanOrEqual(1);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('emblemSvg: an <svg> for each of the twelve, and a plain shield for an unknown id', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:1280, height:800 } });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    const res = await p.evaluate(() => { const E = window.DreadDelve.emblems;
      const ids = ['vanguard', 'huscarl', 'outrider', 'marksman', 'warden', 'chaplain', 'archivist', 'relicborn', 'seepbound', 'herald', 'mistwalker', 'pankratiast'];
      const out = {};
      for (const id of ids){ const s = E.emblemSvg(id, { size:48, color:'#c8a050' });
        out[id] = { svg:s.startsWith('<svg'), mark:s.includes(`data-emblem="${id}"`), w:s.includes('width="48"'), col:s.includes('#c8a050'), len:s.length }; }
      const u = E.emblemSvg('not-a-calling');
      out.unknown = { svg:u.startsWith('<svg'), shield:u.includes('data-emblem="shield"') };
      const s24 = E.emblemSvg('vanguard', { size:24 });
      out.small = { w:s24.includes('width="24"') };
      return out; });
    for (const [id, r] of Object.entries(res)){
      if (id === 'unknown'){ expect(r.svg).toBe(true); expect(r.shield).toBe(true); continue; }
      if (id === 'small'){ expect(r.w).toBe(true); continue; }
      expect(r.svg, `${id} is an svg`).toBe(true);
      expect(r.mark, `${id} is marked`).toBe(true);
      expect(r.w, `${id} is 48 wide`).toBe(true);
      expect(r.col, `${id} takes the colour`).toBe(true);
      expect(r.len, `${id} has something drawn`).toBeGreaterThan(120);
    }
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a phone with the handheld on: the picker fits the screen, scrolls, and nothing is cut off', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  const p = await context.newPage();
  const errors = await preparePage(p, { handheld:true });
  try {
    await begin(p, 'vasha-cp-ph', { mode:'on', full:false });
    await expect(p.locator('#handheld')).toBeVisible();
    await expect(p.locator('body')).toHaveClass(/\bhh\b/);
    await clearCards(p);
    await defineOpener(p);
    expect(await p.evaluate(() => !!window.__openPicker())).toBe(true);
    await expect(p.locator('#callingPicker .cp-card')).toHaveCount(12);
    const rects = await p.evaluate(() => { const scr = document.querySelector('#hhScreen').getBoundingClientRect();
      const r = document.querySelector('#callingPicker').getBoundingClientRect();
      return { screen:[scr.left, scr.top, scr.width, scr.height].map(Math.round),
        pk:[r.left, r.top, r.width, r.height].map(Math.round) }; });
    for (let i = 0; i < 4; i++) expect(Math.abs(rects.pk[i] - rects.screen[i])).toBeLessThanOrEqual(2);
    // two-wide, and it scrolls: the twelve do not fit one screen, and the body scrolls when asked
    expect(await p.evaluate(() => getComputedStyle(document.querySelector('#callingPicker .cp-grid')).gridTemplateColumns.split(' ').length)).toBe(2);
    const sc = await p.evaluate(() => { const b = document.querySelector('#callingPicker .cp-body');
      const can = b.scrollHeight > b.clientHeight; b.scrollTop = 40; return { can, top:b.scrollTop }; });
    expect(sc.can).toBe(true);
    expect(sc.top).toBeGreaterThan(0);
    if (SP) await p.screenshot({ path:`${SP}/callingpicker-phone.png` });
    // the detail fits the screen too
    await p.locator('[data-cp-card="mistwalker"]').click();
    await expect(p.locator('#callingPicker .cp-det')).toBeVisible();
    await expect(p.locator('#callingPicker')).toContainText('Mistshape');
    const rects2 = await p.evaluate(() => { const scr = document.querySelector('#hhScreen').getBoundingClientRect();
      const r = document.querySelector('#callingPicker').getBoundingClientRect();
      return { screen:[scr.left, scr.top, scr.width, scr.height].map(Math.round),
        pk:[r.left, r.top, r.width, r.height].map(Math.round) }; });
    for (let i = 0; i < 4; i++) expect(Math.abs(rects2.pk[i] - rects2.screen[i])).toBeLessThanOrEqual(2);
    const o = await overflow(p);
    for (const v of Object.values(o)) expect(v).toBeLessThanOrEqual(1);
    if (SP) await p.screenshot({ path:`${SP}/callingpicker-phone-detail.png` });
    await pressEscape(p);
    await expect(p.locator('#callingPicker .cp-grid')).toBeVisible();
    await pressEscape(p);
    await expect(p.locator('#callingPicker')).toHaveCount(0);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});

test('on a plain phone, with reduced motion: nothing is cut off, it scrolls, and everything is simply there', async ({ browser, baseURL }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ baseURL, viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true });
  const p = await context.newPage();
  const errors = await preparePage(p);
  try {
    await begin(p, 'vasha-cp-pl');
    await clearCards(p);
    await defineOpener(p);
    await p.emulateMedia({ reducedMotion:'reduce' });
    // one atomic step: open, then read at once — nothing may arrive on a timer
    const atOnce = await p.evaluate(() => { window.__openPicker();
      const t = document.querySelector('#callingPicker')?.textContent || '';
      const cards = document.querySelectorAll('#callingPicker .cp-card').length;
      const svgs = document.querySelectorAll('#callingPicker .cp-card svg').length;
      const b = document.querySelector('#callingPicker .cp-body');
      return { title:t.includes('Choose your Calling'), cards, svgs, names:['Vanguard', 'Huscarl', 'Outrider', 'Marksman', 'Warden', 'Chaplain', 'Archivist', 'Relicborn', 'Seepbound', 'Herald', 'Mistwalker', 'Pankratiast'].every(n => t.includes(n)),
        scrolls:b.scrollHeight > b.clientHeight }; });
    expect(atOnce.title).toBe(true);
    expect(atOnce.cards).toBe(12);
    expect(atOnce.svgs).toBe(12);
    expect(atOnce.names).toBe(true);
    expect(atOnce.scrolls).toBe(true);
    // the detail, too, is all there at once
    const det = await p.evaluate(() => { window.DreadDelve.callingPicker.callingPickerPress('a');
      const t = document.querySelector('#callingPicker')?.textContent || '';
      return { name:t.includes('Vanguard'), sig:t.includes('Ward'), paths:['Hoplite', 'Breacher', 'Hollowed'].every(n => t.includes(n)), seep:t.includes('Seep-touched') }; });
    expect(det.name).toBe(true);
    expect(det.sig).toBe(true);
    expect(det.paths).toBe(true);
    expect(det.seep).toBe(true);
    const o = await overflow(p);
    for (const v of Object.values(o)) expect(v).toBeLessThanOrEqual(1);
    // Escape in the detail goes back to the grid first, then closes
    await pressEscape(p);
    await expect(p.locator('#callingPicker .cp-grid')).toBeVisible();
    await pressEscape(p);
    await expect(p.locator('#callingPicker')).toHaveCount(0);
  } finally { await context.close(); }
  expect(errors, 'Uncaught browser errors').toEqual([]);
});
