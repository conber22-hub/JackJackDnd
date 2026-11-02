import { test, expect, arena } from './helpers.js';

// Codex round 4 at the table: what conditions do (engine/conditions.js), how they end (data/spell-effects.js),
// and the Barovian creatures' defences (bestiary links to the SRD).
test('helpless foes are crit up close, saves fail outright, holds are shaken off, exhaustion kills', async ({ page }) => {
  test.setTimeout(150_000);
  await arena(page, [{ name:'Ada', x:6, y:10 }, { name:'Bram', x:5, y:10 }]);
  const r = await page.evaluate(() => {
    const D = window.DreadDelve, out = {}, tok = n => D.get().tokens.find(t => t.name === n);
    const ada = tok('Ada'), sk = D.placeMonster('skeleton', { floor:0, x:7, y:10 });   // the Barovian skeleton: linked to the SRD's
    out.skDefs = D.defencesOf(sk);
    // paralysed and right beside Ada: a hit is a critical; a miss is still a miss
    D.addCond(sk, 'paralyzed', -1);
    const i = 0; out.atk = ada.attacks[0]?.n;
    D.doAttack(ada.id, sk.id, i, 'normal', { d20:15 });
    out.hitCard = D.get().log.at(-1)?.m || '';
    D.doAttack(ada.id, sk.id, i, 'normal', { d20:1 });
    out.missCard = D.get().log.at(-1)?.m || '';
    // a paralysed creature fails a Dexterity save outright; restrained has disadvantage on it
    out.auto = D.saveRoll(sk, 'dex');
    D.get().tokens.filter(t => t.id === sk.id).forEach(t => t.hp = t.maxHp);
    // Hold Person's timing: a Wisdom save again at the end of each of its turns (DC set so it surely works)
    const hp = D.timingFor({ cond:'paralyzed', save:'wis', repeat:'end', endsOn:[], dur:{ n:1, unit:'minute' } }, { src:ada.id, save:'wis', dc:-50 });
    D.addCond(sk, 'paralyzed', -1, null, true, hp.extra);
    out.repeat = D.get().tokens.find(t => t.id === sk.id).conds.find(c => c.n === 'paralyzed')?.rep;
    D.rollInitiative();
    for (let k = 0; k < 6 && D.currentTurn()?.id !== sk.id; k++) D.nextTurn();
    out.skTurn = D.currentTurn()?.id === sk.id;
    D.nextTurn();   // the end of the skeleton's turn: it shakes Hold Person off
    out.after = D.get().tokens.find(t => t.id === sk.id).conds.map(c => c.n);
    out.endCard = [...document.querySelectorAll('#cardLayer .pop')].map(e => e.textContent).find(x => /End of .*turn/.test(x)) || '';
    // exhaustion: −2 on d20 tests a level, and the sixth kills
    D.exhaust(ada, 2);
    out.pen = D.saveRoll(ada, 'con').note;
    D.exhaust(ada, 4);
    out.adaDead = tok('Ada').dead;
    return out;
  });
  expect(r.skDefs.immune).toContain('poison');
  expect(r.hitCard).toContain('(crit)');
  expect(r.missCard).toContain('miss');
  expect(r.auto.auto).toBe(true);
  expect(r.repeat).toEqual({ phase:'end', save:'wis', dc:-50 });
  expect(r.skTurn).toBe(true);
  expect(r.after).not.toContain('paralyzed');
  expect(r.endCard).toContain('shakes off paralyzed');
  expect(r.pen).toContain('exhaustion −4');
  expect(r.adaDead).toBe(true);
});
