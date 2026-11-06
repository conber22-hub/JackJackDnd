// The 🎻 Soundscape (brief-9). The board opens for the DM; a scene turns
// the right layers on; a saved scene survives a reload; a cue sends a
// soundcue message; with "Let the map choose" on, the board doesn't
// override the map; and a player set to "cues only" ignores a soundscape
// message and plays a soundcue. Audio can't be heard in tests: the checks
// read the graph's state (layers running, gains) through the module's own
// debug handle, not sound.
import { test, expect, arena } from './helpers.js';

async function openBoard(page){
  await expect.poll(() => page.evaluate(() => !!window.DreadDelveSoundscape)).toBe(true);
  await page.locator('#btnSoundscape').click();
  await expect(page.locator('#soundscapeSheet:not(.hidden)')).toBeVisible();
}

async function reloadAndContinue(page){
  await page.reload();
  await page.waitForFunction(() => !!window.DreadDelve);
  const door = page.locator('[data-act="thRole"][data-k="dm"]');
  if (await door.isVisible()) await door.click();
  await page.locator('#continueBox [data-act="continue"]').click();
  await expect(page.locator('#startModal')).toBeHidden();
}

// Flip this DM page into a player's: the receivers answer only while the
// role is player (the ghost spec's pattern).
async function flipToPlayer(page, name = 'Ada'){
  await page.evaluate(name => {
    const D = window.DreadDelve, hero = D.get().tokens.find(t => t.name === name);
    if (!hero) throw new Error(`Missing hero: ${name}`);
    D.ui.myToken = hero.id; D.ui.role = 'player';
    document.body.classList.add('player');
    document.querySelector('[data-act="tab"]')?.click();
  }, name);
}

const boardState = page => page.evaluate(() => window.DreadDelveSoundscape.state());

test('the board opens for the DM, with twelve layers, seven scenes and eight cues', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await openBoard(page);
  await expect(page.locator('[data-fader]')).toHaveCount(12);
  await expect(page.locator('[data-scene]')).toHaveCount(7);
  await expect(page.locator('[data-cue]')).toHaveCount(8);
  await expect(page.locator('#ssMapChooses')).toBeChecked();   // "Let the map choose" is on by default
});

test('a scene turns the right layers on', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await openBoard(page);
  await page.locator('#ssMapChooses').uncheck();   // the board takes the sound
  await page.locator('[data-scene="Tavern night"]').click();
  await expect.poll(() => boardState(page)).toMatchObject({
    scene:'Tavern night',
    layers:{
      hearth:{ running:true }, tavern:{ running:true }, 'rain-stone':{ running:true },
      'wind-pines':{ running:false }, gale:{ running:false }, choir:{ running:false },
    },
  });
});

test('a saved scene survives a reload', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await openBoard(page);
  await page.locator('#ssMapChooses').uncheck();
  await page.locator('[data-fader="hearth"]').fill('60');
  await page.locator('#ssSceneName').fill('Test scene');
  await page.locator('[data-act="ssSaveScene"]').click();
  await expect(page.locator('[data-scene="Test scene"]')).toBeVisible();
  await reloadAndContinue(page);
  await openBoard(page);
  await expect(page.locator('[data-scene="Test scene"]')).toBeVisible();
  await page.locator('[data-scene="Test scene"]').click();
  await expect.poll(() => boardState(page)).toMatchObject({
    layers:{ hearth:{ running:true, volume:.6 } },
  });
});

test('a cue sends a soundcue message', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await openBoard(page);
  await page.locator('[data-cue="thunder"]').click();
  await expect.poll(() => boardState(page)).toMatchObject({ lastCue:'thunder' });
  const sent = await page.evaluate(() => window.DreadDelveSoundscape.sent);
  expect(sent).toContainEqual(expect.objectContaining({ t:'soundcue', id:'thunder' }));
});

test('with “Let the map choose” on, the board doesn’t override the map', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await openBoard(page);
  await expect(page.locator('#ssMapChooses')).toBeChecked();
  await page.locator('[data-scene="Tavern night"]').click();
  const st = await boardState(page);
  expect(Object.values(st.layers).every(l => !l.running)).toBe(true);   // nothing starts
  expect(st.sentCount).toBe(0);   // and nothing is sent to the table
  await expect(page.locator('[data-fader="hearth"]')).toHaveValue('70');   // the mix is only prepared
});

test('a player set to “cues only” ignores a soundscape message and plays a soundcue', async ({ page }) => {
  test.setTimeout(240_000);
  await arena(page);
  await flipToPlayer(page);
  await openBoard(page);
  await page.locator('input[name="ssTable"][value="cues"]').check();
  await page.evaluate(() => window.DreadDelve.net.onSoundscape({ t:'soundscape', layers:{ hearth:.8 }, scene:'Tavern night', fade:0 }));
  await expect.poll(() => boardState(page)).toMatchObject({
    layers:{ hearth:{ running:false } },
  });
  await page.evaluate(() => window.DreadDelve.net.onSoundcue({ t:'soundcue', id:'thunder' }));
  await expect.poll(() => boardState(page)).toMatchObject({ lastCue:'thunder' });
});
