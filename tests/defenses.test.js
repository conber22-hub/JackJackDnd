import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SRD_MONSTERS } from '../src/data/srd-monsters.js';
import { parseDefenses, applyDefenses, conditionImmune, DAMAGE_TYPES, CONDITIONS } from '../src/engine/defenses.js';
test('all 330 creatures: every unqualified defence is recognised', () => {
  assert.equal(SRD_MONSTERS.length, 330);
  for (const m of SRD_MONSTERS){
    const d = parseDefenses(m.traits);
    for (const [key, values] of Object.entries(d)) for (const v of values) assert.ok((key === 'condImmune' ? CONDITIONS : DAMAGE_TYPES).includes(v), `${m.id}: ${v}`);
    for (const t of m.traits){
      const match = /^<b>(Resistances|Immunities|Vulnerabilities)\.<\/b> (.*)$/.exec(t);
      if (!match) continue;
      for (const word of match[2].toLowerCase().split(/[,;]/).map(s => s.trim())){
        if (/draconic origin|with _mind blank_|except from|under the effect/.test(word)) continue;
        assert.ok([...DAMAGE_TYPES, ...CONDITIONS].includes(word), `${m.id}: ${word}`);
        assert.ok(Object.values(d).some(a => a.includes(word)), `${m.id}: missing ${word}`);
      }
    }
  }
});
test('condition-only, mixed immunities, duplicates and qualified text', () => {
  const d = parseDefenses(['<b>Immunities.</b> Poison; Charmed, Poisoned', '<b>Immunities.</b> Frightened, Poisoned', '<b>Immunities.</b> Charmed (except from its vampire master)', '<b>Vulnerabilities.</b> Piercing damage from weapons wielded by creatures under the effect of a _Bless_ spell']);
  assert.deepEqual(d, { resist:[], immune:['poison'], vuln:[], condImmune:['charmed','poisoned','frightened'] });
  assert.equal(conditionImmune(d, 'Poisoned'), true);
  assert.equal(conditionImmune(d, 'stunned'), false);
  assert.deepEqual(parseDefenses(['<b>Resistances.</b> Damage type chosen for the Draconic Origin trait below']), parseDefenses());
});
test('mixed parts, rounding, immunity precedence and resistance before vulnerability', () => {
  const parts = [{t:'force',n:4}, {t:'piercing',n:17}, {t:'fire',n:5}, {t:'poison',n:9}];
  const before = structuredClone(parts);
  assert.deepEqual(applyDefenses(parts, {resist:['piercing','poison'],vuln:['fire','poison'],immune:['poison']}), {total:22,lines:[{t:'force',n:4,was:4,why:''},{t:'piercing',n:8,was:17,why:'resistant'},{t:'fire',n:10,was:5,why:'vulnerable'},{t:'poison',n:0,was:9,why:'immune'}]});
  assert.equal(applyDefenses([{t:'cold',n:5}], {resist:['cold'],vuln:['cold']}).total, 4);
  assert.equal(applyDefenses(parts, parseDefenses()).total, 35);
  assert.deepEqual(parts, before);
});
