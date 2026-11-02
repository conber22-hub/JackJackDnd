import { test, expect, preparePage, arena } from './helpers.js';

// Codex's rules engines in play: a creature's defences (engine/defenses.js), its breath weapon (data/monster-play.js).
test('a skeleton shrugs off poison and fears a hammer; a dragon breathes, then must recharge', async ({ page }) => {
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }]);
  const r = await page.evaluate(() => {
    const D = window.DreadDelve, out = {};
    const sk = D.placeMonster('srd-skeleton', { floor:0, x:10, y:13 }), hp = sk.hp;
    out.defs = D.defencesOf(sk);
    D.applyDamage(sk, 6, 'poison'); out.afterPoison = hp - sk.hp;
    D.applyDamage(sk, 3, 'bludgeoning'); out.afterHammer = hp - sk.hp;
    out.poisoned = D.addCond(sk, 'poisoned', 2); out.prone = D.addCond(sk, 'prone', 1);
    out.conds = sk.conds.map(c => c.n);
    const dr = D.placeMonster('srd-young-black-dragon', { floor:0, x:11, y:10 });
    out.acts = dr.casts.map(c => `${c.n}:${c.sv}:${c.dc}:${c.d}:${c.recharge}`);
    const party = D.get().tokens.filter(t => t.kind === 'pc'), before = party.map(t => t.hp);
    const i = dr.casts.findIndex(c => c.n === 'Acid Breath');
    out.first = D.castSpell(dr.id, null, i, { x:6, y:10 });
    out.hurt = party.map((t, k) => before[k] - t.hp);
    out.spent = !!dr.spent?.['Acid Breath'];
    out.second = D.castSpell(dr.id, null, i, { x:6, y:10 });
    out.card = [...document.querySelectorAll('#cardLayer .pop')].map(el => el.textContent).join(' | ');
    const old = D.placeMonster('srd-ancient-red-dragon', { floor:0, x:16, y:13 });
    out.ancient = { resist:D.resistLeft(old), legendary:D.legendOf(old)?.legendary?.n };
    return out;
  });
  expect(r.defs.immune).toContain('poison');
  expect(r.defs.vuln).toContain('bludgeoning');
  expect(r.afterPoison).toBe(0);                 // immune
  expect(r.afterHammer).toBe(6);                 // 3 bludgeoning, doubled
  expect(r.poisoned).toBe(false);
  expect(r.prone).toBe(true);
  expect(r.conds).toEqual(['prone']);
  expect(r.acts).toContain('Acid Breath:dex:14:14d6:5');
  expect(r.first).toBe(true);
  expect(r.hurt[0]).toBeGreaterThan(0);          // Ada and Bram stand in the 30-ft. line
  expect(r.hurt[1]).toBeGreaterThan(0);
  expect(r.spent).toBe(true);
  expect(r.second).toBe(false);
  expect(r.card).toContain('Recharge 5–6');
  expect(r.ancient).toEqual({ resist:4, legendary:3 });

  // The DM's action bar shows the breath weapon as spent until it comes back.
  await page.evaluate(() => { const D = window.DreadDelve; D.select(D.get().tokens.find(t => t.bid === 'srd-young-black-dragon').id); });
  await expect(page.locator('[data-act="cast"]', { hasText:'Acid Breath' })).toContainText('spent');
  // A new fight: breath weapons ready again.
  await page.evaluate(() => window.DreadDelve.rollInitiative());
  await page.evaluate(() => { const D = window.DreadDelve; D.select(D.get().tokens.find(t => t.bid === 'srd-young-black-dragon').id); });
  await expect(page.locator('[data-act="cast"]', { hasText:'Acid Breath' })).toContainText('⟳5–6');
});
