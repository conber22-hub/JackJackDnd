import test from 'node:test';
import assert from 'node:assert/strict';
import { FEATS } from '../src/data/srd.js';
import { SRD_FEATS } from '../src/data/srd-feats.js';
import { newHero, heroStats, heroWarnings, spellLimits, heroResources } from '../src/engine/hero.js';

// Official SRD 5.2.1, pp. 87–88 (the SRD's selection is smaller than the Player's Handbook).
const inventory = {
  Origin:['Alert', 'Magic Initiate', 'Savage Attacker', 'Skilled'],
  General:['Ability Score Improvement', 'Grappler'],
  'Fighting Style':['Archery', 'Defense', 'Great Weapon Fighting', 'Two-Weapon Fighting'],
  'Epic Boon':['Boon of Combat Prowess', 'Boon of Dimensional Travel', 'Boon of Fate', 'Boon of Irresistible Offense', 'Boon of Spell Recall', 'Boon of the Night Spirit', 'Boon of Truesight'],
};
test('the complete SRD feat inventory has category, prerequisites, text and source', () => {
  assert.deepEqual(Object.keys(SRD_FEATS).sort(), Object.values(inventory).flat().sort());
  assert.equal(Object.keys(FEATS).length, 18, '17 SRD feats plus the existing Other control');
  for (const [cat, names] of Object.entries(inventory)) for (const n of names){
    const f = FEATS[n];
    assert.equal(f.cat, cat); assert.equal(f.src, 'SRD 5.2.1');
    assert.ok(f.req.length && f.text.length > 50, n);
    if (cat === 'Origin'){ assert.equal(f.origin, true); assert.equal(f.req, 'None'); }
    if (cat === 'Fighting Style'){ assert.equal(f.style, true); assert.match(f.req, /Fighting Style/); }
    if (cat === 'Epic Boon'){ assert.match(f.req, /Level 19/); assert.equal(f.max, 30); assert.ok(f.plus.length); }
  }
  assert.match(FEATS.Grappler.req, /Level 4\+, Strength or Dexterity 13\+/);
  assert.match(FEATS['Boon of Spell Recall'].req, /Spellcasting Feature/);
  assert.deepEqual(JSON.parse(JSON.stringify(SRD_FEATS)), SRD_FEATS);
});

test('existing mechanical flags and repeatable choices retain their effects', () => {
  assert.deepEqual(FEATS['Magic Initiate'].lists, { C:'Cleric', D:'Druid', W:'Wizard' });
  assert.deepEqual(FEATS.Grappler.plus, ['Str','Dex']); assert.equal(FEATS.Skilled.skills, 3);
  const h = { ...newHero('Fighter'), lvl:8, bg:'Soldier', asi:{ 4:{ feat:'Magic Initiate', list:'W' }, 8:{ feat:'Alert' } }, spells:['Magic Missile'] };
  assert.deepEqual(spellLimits(h), { cantrips:2, prepared:1 });
  assert.equal(heroResources(h).find(r => r.id === 'mi').free, 'Magic Missile');
  assert.equal(heroStats(h).init, heroStats({ ...h, asi:{} }).init + 3);
  const skilled = { ...h, asi:{ 4:{ feat:'Skilled', skills:['Arcana','History','Religion'] }, 8:{ feat:'Skilled', skills:['Deception','Insight','Medicine'] } } };
  assert.ok(!heroWarnings(skilled).some(w => /only be taken once/.test(w)));
  assert.ok(heroStats(skilled).prof.has('Medicine'));
  assert.ok(heroWarnings({ ...h, asi:{ 4:{ feat:'Alert' }, 8:{ feat:'Alert' } } }).some(w => /only be taken once/.test(w)));
});

test('Epic Boon ability increases respect their choices and maximum 30', () => {
  const h = { ...newHero('Wizard'), lvl:19, ab:{ Str:10, Dex:14, Con:14, Int:20, Wis:12, Cha:10 }, asi:{ 19:{ feat:'Boon of Spell Recall', ab:'Int' } } };
  assert.equal(heroStats(h).sc.Int, 21);
  assert.equal(heroStats({ ...h, ab:{ ...h.ab, Int:30 } }).sc.Int, 30);
  assert.equal(heroStats({ ...h, asi:{ 19:{ feat:'Boon of Spell Recall', ab:'Dex' } } }).sc.Dex, 14);
  assert.equal(heroStats({ ...h, asi:{ 19:{ feat:'Ability Score Improvement', ab:'Int' } } }).sc.Int, 20);
  assert.equal(heroStats({ ...h, ab:{ ...h.ab, Int:22 }, asi:{ 19:{ feat:'Ability Score Improvement', ab:'Int' } } }).sc.Int, 22, 'an ordinary feat cannot reduce an already higher score');
});
