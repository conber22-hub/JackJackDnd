import test from 'node:test';
import assert from 'node:assert/strict';
import { newHero, heroStats, heroAttacks, heroToken, castables, heroWarnings, spellLimits, maxSpellLevel, heroResources, asiLevels, spellPool, heroSpells, arcanumLevels, cantripDice } from '../src/engine/hero.js';

test('level 1 fighter: chain mail + shield + Defense, Soldier background', () => {
  const h = newHero('Fighter'); h.name = 'Ilse';
  const st = heroStats(h);
  assert.equal(st.sc.Str, 17); assert.equal(st.sc.Con, 14);          // Soldier +2 Str, +1 Con
  assert.equal(st.ac, 16 + 2 + 1);
  assert.equal(st.hp, 10 + 2);
  assert.equal(st.pb, 2);
  const atk = heroAttacks(h, st);
  assert.equal(atk[0].n, 'Longsword'); assert.equal(atk[0].b, 2 + 3); assert.equal(atk[0].d, '1d8+3');
  assert.deepEqual(heroWarnings(h), []);
});

test('level 5 wizard (Sage): slots, spell DC, cantrip scaling, area spells', () => {
  const h = newHero('Wizard'); h.name = 'Ambrose'; h.lvl = 5; h.bg = 'Sage'; h.bg2 = 'Int'; h.bg1 = 'Con'; h.asi = { 4:'Int' };
  h.spells = ['Fire Bolt', 'Fireball', 'Shield'];
  const st = heroStats(h);
  assert.equal(st.sc.Int, 15 + 2 + 2);
  assert.equal(st.dc, 8 + 3 + 4);
  assert.deepEqual(st.slots, [4, 3, 2]);
  assert.equal(maxSpellLevel(h), 3);
  const fb = heroAttacks(h, st).find(a => a.n === 'Fire Bolt');
  assert.equal(fb.d, '2d10'); assert.equal(fb.b, 3 + 4);
  const fireball = castables(h, st).find(c => c.n === 'Fireball');
  assert.equal(fireball.dc, 15); assert.equal(fireball.rad, 4); assert.equal(fireball.half, true);
  assert.equal(spellLimits(h).prepared, 9 + 1);                     // Sage's Magic Initiate adds one
  assert.equal(st.hp, 6 + 2 + 4 * (4 + 2));                          // d6, Con 14
});

test('rogue expertise doubles proficiency; passive Perception follows it', () => {
  const h = newHero('Rogue'); h.name = 'Mira'; h.bg = 'Criminal'; h.bg2 = 'Dex'; h.bg1 = 'Con';
  h.skills = ['Perception', 'Investigation', 'Acrobatics', 'Deception']; h.expert = ['Perception', 'Stealth'];
  const st = heroStats(h);
  assert.equal(st.skills.Perception, 0 + 2 + 2);
  assert.equal(st.passive, 14);
  assert.equal(st.check, 3 + 2);                                     // thieves' tools
  assert.ok(heroAttacks(h, st)[0].f.includes('Sneak Attack +1d6'));
});

test('a hero becomes a token with per-ability saves', () => {
  const h = newHero('Cleric'); h.name = 'Sister Anca'; h.lvl = 3; h.spells = ['Sacred Flame', 'Healing Word'];
  const t = heroToken(h);
  assert.equal(t.kind, 'pc'); assert.equal(t.charId, h.id);
  assert.equal(t.saves.wis, heroStats(h).saves.Wis);
  assert.ok(t.casts.some(c => c.n === 'Sacred Flame' && c.sv === 'dex'));
  assert.ok(t.casts.some(c => c.n === 'Cure Wounds' && c.k === 'heal'), 'Life Domain spells are added at 3');
  assert.match(t.cls, /Cleric 3 · Life Domain/);
});

test('resources: slots, pact slots and class features by level', () => {
  const w = newHero('Wizard'); w.lvl = 5;
  const rw = heroResources(w);
  assert.deepEqual(rw.filter(r => r.slot).map(r => [r.id, r.max]), [['slot1', 4], ['slot2', 3], ['slot3', 2]]);
  assert.equal(rw.find(r => r.id === 'arcane').lv, 3);
  assert.equal(rw.find(r => r.id === 'hd').max, 5);
  const k = newHero('Warlock'); k.lvl = 3;
  const pact = heroResources(k).find(r => r.id === 'pact');
  assert.equal(pact.max, 2); assert.equal(pact.slot, 2); assert.equal(pact.rest, 'short');
  const b = newHero('Barbarian'); b.lvl = 3;
  assert.equal(heroResources(b).find(r => r.id === 'rage').max, 3);
  assert.equal(heroToken(b).rageDmg, 2);
  assert.equal(heroAttacks(b)[0].m, 1);
  const f = newHero('Fighter'); f.lvl = 2;
  assert.deepEqual(heroResources(f).filter(r => !r.slot && r.id !== 'hd' && r.id !== 'heroic').map(r => r.id), ['wind', 'surge']);
});

test('castables: buffs and utility spells are castable; Divine Smite is damage', () => {
  const p = newHero('Paladin'); p.lvl = 2; p.spells = ['Bless'];
  const c = castables(p);
  assert.equal(c.find(s => s.n === 'Bless').k, 'buff');
  const smite = c.find(s => s.n === 'Divine Smite');
  assert.equal(smite.k, 'auto'); assert.equal(smite.smite, 1); assert.equal(smite.l, 1);
});

test('review fixes: Magic Initiate charge, Paladin\'s Smite from level 2, rays, sustained spells, mass heals', () => {
  const f = newHero('Fighter'); f.bg = 'Acolyte'; f.spells = ['Cure Wounds'];
  const mi = heroResources(f).find(r => r.id === 'mi');
  assert.ok(mi && mi.free === 'Cure Wounds' && mi.max === 1);
  const p1 = newHero('Paladin'); p1.lvl = 1;
  assert.ok(!castables(p1).some(s => s.n === 'Divine Smite'));
  assert.ok(!heroResources(p1).some(r => r.id === 'smite'));
  const p2 = newHero('Paladin'); p2.lvl = 2;
  assert.ok(castables(p2).some(s => s.n === 'Divine Smite'));
  assert.equal(heroResources(p2).find(r => r.id === 'smite').free, 'Divine Smite');
  const k = newHero('Warlock'); k.lvl = 5; k.spells = ['Eldritch Blast'];
  const eb = heroAttacks(k).find(a => a.n.startsWith('Eldritch Blast'));
  assert.equal(eb.rays, 2); assert.equal(eb.d.startsWith('1d10'), true);
  const w = newHero('Wizard'); w.lvl = 3; w.spells = ['Scorching Ray'];
  const sr = heroAttacks(w).find(a => a.n.startsWith('Scorching Ray'));
  assert.equal(sr.rays, 3); assert.ok(sr.d.startsWith('2d6')); assert.equal(sr.l, 2); assert.equal(sr.sn, 'Scorching Ray');
  const c = newHero('Cleric'); c.lvl = 5; c.spells = ['Spirit Guardians', 'Mass Healing Word'];
  const cs = castables(c);
  assert.equal(cs.find(s => s.n === 'Spirit Guardians').again, 1);
  assert.equal(cs.find(s => s.n === 'Mass Healing Word').multi, 6);
  const s5 = newHero('Sorcerer'); s5.lvl = 5;
  assert.equal(heroResources(s5).find(r => r.id === 'sorcrest').points, 2);
});

test('feats at Ability Score Improvement levels', async () => {
  const { newHero, heroStats, heroWarnings, heroToken, spellLimits, spellPool, heroResources } = await import('../src/engine/hero.js');
  const h = newHero('Fighter'); h.lvl = 8; h.ab = { Str:15, Dex:14, Con:14, Int:10, Wis:12, Cha:8 }; h.bg = 'Soldier'; h.bg2 = 'Str'; h.bg1 = 'Con';
  const base = heroStats({ ...h, asi:{} });
  // an old sheet: just an ability is +2
  assert.equal(heroStats({ ...h, asi:{ 4:'Dex', 8:'Dex' } }).sc.Dex, base.sc.Dex + 4);
  // +1 and +1
  const split = heroStats({ ...h, asi:{ 4:{ feat:'Ability Score Improvement', ab:'Str', ab2:'Con' } } });
  assert.equal(split.sc.Str, base.sc.Str + 1); assert.equal(split.sc.Con, base.sc.Con + 1);
  // Alert adds the Proficiency Bonus to initiative; Grappler +1 Str or Dex
  const alert = heroStats({ ...h, asi:{ 4:{ feat:'Alert' }, 8:{ feat:'Grappler', ab:'Dex' } } });
  assert.equal(alert.init, base.init + base.pb + (Math.floor((base.sc.Dex + 1 - 10) / 2) - Math.floor((base.sc.Dex - 10) / 2)));
  assert.ok(alert.features.some(f => /Alert — feat \(4\)/.test(f)));
  // Skilled: three skills
  const sk = heroStats({ ...h, asi:{ 4:{ feat:'Skilled', skills:['Arcana', 'Stealth', 'Medicine'] } } });
  for (const s of ['Arcana', 'Stealth', 'Medicine']) assert.ok(sk.prof.has(s));
  // a fighting style feat stacks with the class's own style; Defense +1 AC in armour
  const def = heroStats({ ...h, style:'Archery', armor:'Chain Mail', asi:{ 4:{ feat:'Defense' } } });
  assert.equal(def.ac, heroStats({ ...h, style:'Archery', armor:'Chain Mail', asi:{} }).ac + 1); assert.ok(def.styles.has('Archery') && def.styles.has('Defense'));
  // a written-in feat: +1 ability and hit points per level
  const tough = heroStats({ ...h, asi:{ 4:{ feat:'Other', name:'Hardy', ab:'Con', hp:'2' } } });
  assert.ok(tough.hp >= base.hp + 2 * 8); assert.ok(tough.features.some(f => /Hardy/.test(f)));
  // Magic Initiate: a spell list for a fighter, two cantrips and a level-1 spell, one free cast
  const mi = { ...h, asi:{ 4:{ feat:'Magic Initiate', list:'W' } }, spells:['Fire Bolt', 'Ray of Frost', 'Magic Missile'] };
  assert.deepEqual(spellLimits(mi), { cantrips:2, prepared:1 });
  assert.ok(spellPool(mi).some(s => s.n === 'Magic Missile'));
  assert.ok(heroResources(mi).some(r => /Magic Initiate \(Magic Missile\)/.test(r.n)));
  assert.equal(heroStats(mi).castAb, 'Int');
  // warnings ask for what's missing
  assert.ok(heroWarnings({ ...h, asi:{ 4:{ feat:'Skilled', skills:['Arcana'] } } }).some(w => /Skilled/.test(w)));
  assert.ok(heroWarnings({ ...h, asi:{} }).some(w => /ability increase or feat/.test(w)));
  assert.ok(heroToken({ ...h, name:'X', asi:{ 4:{ feat:'Alert' }, 8:'Str' } }).maxHp > 0);
});

test('level 20 Wizard: ninth-level slots, preparation, DC and spell attacks reach the token', () => {
  const h = { ...newHero('Wizard'), lvl:20, ab:{ Str:8, Dex:14, Con:14, Int:20, Wis:12, Cha:10 }, spells:['Fire Bolt', 'Meteor Swarm'] };
  const st = heroStats(h), token = heroToken(h);
  assert.equal(st.L, 20); assert.equal(st.pb, 6); assert.equal(st.dc, 19); assert.equal(st.spAtk, 11);
  assert.deepEqual(st.slots, [4,3,3,3,3,2,2,1,1]);
  assert.deepEqual(spellLimits(h), { cantrips:5, prepared:25 });
  assert.equal(maxSpellLevel(h), 9);
  assert.ok(spellPool(h).some(s => s.n === 'Wish' && s.l === 9));
  assert.equal(token.attacks.find(a => a.n === 'Fire Bolt').d, '4d10');
  assert.equal(token.casts.find(c => c.n === 'Meteor Swarm').l, 9);
  assert.equal(token.resources.find(r => r.id === 'slot9').max, 1);
  assert.equal(token.resources.find(r => r.id === 'arcane').lv, 10);
  assert.equal(token.resources.find(r => r.id === 'arcane').use, 'recover', 'keep the existing recovery automation');
  assert.match(token.cls, /Wizard 20/);
  for (const f of ['Evoker: Overchannel (14)', 'Spell Mastery (18)', 'Epic Boon (19)', 'Signature Spells (20)']) assert.ok(st.features.includes(f));
});

test('level 20 Paladin: half-caster progression, Devotion spells and existing smite automation', () => {
  const h = { ...newHero('Paladin'), lvl:20, weapons:['Longsword'] }, st = heroStats(h), token = heroToken(h);
  assert.deepEqual(st.slots, [4,3,3,3,2]);
  assert.equal(st.pb, 6); assert.equal(maxSpellLevel(h), 5);
  assert.deepEqual(spellLimits(h), { cantrips:0, prepared:15 });
  assert.equal(token.resources.find(r => r.id === 'lay').max, 100);
  assert.equal(token.resources.find(r => r.id === 'lay').use, 'lay');
  assert.equal(token.resources.find(r => r.id === 'channel').max, 3);
  assert.equal(token.resources.find(r => r.id === 'smite').free, 'Divine Smite');
  const smite = token.casts.find(c => c.n === 'Divine Smite');
  assert.equal(smite.k, 'auto'); assert.equal(smite.d, '2d8'); assert.equal(smite.smite, 1);
  for (const [level, names] of [[13, ['Freedom of Movement', 'Guardian of Faith']], [17, ['Commune', 'Flame Strike']]]){
    for (const name of names){
      assert.ok(heroSpells({ ...h, lvl:level }).some(s => s.n === name));
      assert.ok(!heroSpells({ ...h, lvl:level - 1 }).some(s => s.n === name));
    }
  }
  assert.ok(st.features.includes('Radiant Strikes (11)'));
  assert.ok(st.features.includes('Devotion: Holy Nimbus (20)'));
});

test('level 20 Warlock: four fifth-level pact slots, four beams and separate arcanum uses', () => {
  const arcana = ['Circle of Death', 'Finger of Death', 'Power Word Stun', 'Power Word Kill'];
  const h = { ...newHero('Warlock'), lvl:20, spells:['Eldritch Blast', ...arcana] }, st = heroStats(h), token = heroToken(h);
  assert.equal(st.slots, null); assert.deepEqual(st.pact, { n:4, l:5 });
  assert.equal(maxSpellLevel(h), 5, 'Arcanum never upgrades pact slots');
  assert.deepEqual(arcanumLevels(h), [6,7,8,9]);
  assert.deepEqual(spellLimits(h), { cantrips:4, prepared:15 });
  assert.ok(spellPool(h).some(s => s.n === 'Power Word Kill'));
  const beam = token.attacks.find(a => a.n.startsWith('Eldritch Blast'));
  assert.equal(beam.rays, 4); assert.equal(beam.d, '1d10+2'); assert.equal(beam.b, 8);
  assert.deepEqual(token.resources.filter(r => r.slot).map(r => [r.id, r.max, r.slot]), [['pact', 4, 5]]);
  for (const [i, name] of arcana.entries()){
    const r = token.resources.find(r => r.id === `arcanum${i + 6}`);
    assert.equal(r.free, name); assert.equal(r.max, 1); assert.equal(r.rest, 'long'); assert.equal(r.slot, undefined);
  }
  assert.ok(!heroWarnings(h).some(w => /Arcanum/.test(w)));
  const ordinary = spellPool(h).filter(s => s.l > 0 && s.l <= 5).slice(0, 15).map(s => s.n);
  assert.ok(!heroWarnings({ ...h, spells:[...ordinary, ...arcana] }).some(w => /Too many prepared/.test(w)));
  assert.ok(heroWarnings({ ...h, spells:[...arcana, 'Eyebite'] }).some(w => /one level 6/.test(w)));
  assert.ok(heroWarnings({ ...h, lvl:10 }).some(w => /not an available Mystic Arcanum/.test(w)));
  assert.ok(heroWarnings({ ...h, spells:['Heal'] }).some(w => /Heal is not an available/.test(w)));
  for (const [level, count] of [[10,0],[11,1],[12,1],[13,2],[14,2],[15,3],[16,3],[17,4],[20,4]]){
    assert.equal(heroResources({ ...h, lvl:level }).filter(r => r.id.startsWith('arcanum')).length, count);
    assert.equal(Math.max(...spellPool({ ...h, lvl:level }).map(s => s.l)), count ? 5 + count : 5);
  }
});

test('level 20 Fighter: extra feat levels, scaled resources and martial features', () => {
  const h = { ...newHero('Fighter'), lvl:20, asi:{ 4:'Str', 6:'Con', 8:'Dex', 12:'Str', 14:'Con', 16:'Dex', 19:{ feat:'Other', name:'A chosen boon' } } };
  const st = heroStats(h), token = heroToken(h);
  assert.deepEqual(asiLevels(h), [4,6,8,12,14,16,19]);
  assert.equal(st.sc.Str, 20); assert.equal(st.sc.Con, 18); assert.equal(st.sc.Dex, 18);
  assert.equal(token.attacks[0].b, 11);
  assert.equal(token.resources.find(r => r.id === 'wind').dice, '1d10+20');
  assert.equal(token.resources.find(r => r.id === 'wind').use, 'secondwind');
  assert.equal(token.resources.find(r => r.id === 'surge').max, 2);
  assert.equal(token.resources.find(r => r.id === 'indomitable').max, 3);
  assert.equal(token.resources.find(r => r.id === 'hd').max, 20);
  assert.ok(st.features.includes('Two Extra Attacks (11)'));
  assert.ok(st.features.includes('Three Extra Attacks (20)'));
  assert.ok(st.features.includes('A chosen boon — feat (19)'));
  assert.ok(!heroWarnings(h).some(w => /ability increase or feat/.test(w)));
  assert.deepEqual(asiLevels({ ...newHero('Rogue'), lvl:20 }), [4,8,10,12,16,19]);
  assert.deepEqual(asiLevels({ ...newHero('Wizard'), lvl:20 }), [4,8,12,16,19]);
  for (const [level, surge, indomitable] of [[12,1,1],[13,1,2],[16,1,2],[17,2,3]]){
    const res = heroResources({ ...h, lvl:level });
    assert.equal(res.find(r => r.id === 'surge').max, surge);
    assert.equal(res.find(r => r.id === 'indomitable').max, indomitable);
  }
});

test('high-level ability boosts, saving throws and cantrip boundaries', () => {
  const b = { ...newHero('Barbarian'), lvl:20, armor:'None', shield:false, asi:{ 4:'Str', 8:'Str', 12:'Con', 16:'Con' } };
  const before = heroStats({ ...b, lvl:19 }), after = heroStats(b);
  assert.equal(after.sc.Str, 24); assert.equal(after.sc.Con, before.sc.Con + 4);
  assert.equal(after.hp, before.hp + 7 + before.M('Con') + 40, 'capstone Constitution applies to all Hit Dice');
  assert.equal(after.ac, before.ac + 2);
  assert.equal(heroStats({ ...b, ab:{ ...b.ab, Con:24 }, asi:{} }).sc.Con, 25, 'capstone maximum is 25');
  const m = { ...newHero('Monk'), lvl:20, asi:{ 4:'Dex', 8:'Wis', 12:'Dex', 16:'Wis' } }, ms = heroStats(m);
  assert.equal(ms.sc.Dex, 23); assert.equal(ms.sc.Wis, 22); assert.equal(ms.ac, 22); assert.equal(ms.spd, 60);
  assert.equal(heroAttacks(m)[0].d, '1d12+6');
  assert.equal(heroStats({ ...m, armor:'Leather' }).spd, 30);
  for (const cls of ['Monk', 'Rogue']){
    const at = cls === 'Monk' ? 14 : 15, h = newHero(cls);
    const low = heroStats({ ...h, lvl:at - 1 }), high = heroStats({ ...h, lvl:at });
    for (const a of cls === 'Monk' ? ['Con','Int','Wis','Cha'] : ['Wis','Cha']){
      assert.equal(low.saves[a], low.M(a)); assert.equal(high.saves[a], high.M(a) + 5);
    }
  }
  for (const [level, dice] of [[10,2],[11,3],[16,3],[17,4],[20,4]]){
    assert.equal(cantripDice('1d8', level), `${dice}d8`);
    assert.equal(castables({ ...newHero('Cleric'), lvl:level, spells:['Sacred Flame'] }).find(c => c.n === 'Sacred Flame').d, `${dice}d8`);
    assert.equal(heroAttacks({ ...newHero('Warlock'), lvl:level, spells:['Eldritch Blast'] }).find(a => a.rays).rays, dice);
  }
  assert.ok(!heroSpells({ ...newHero('Bard'), lvl:19 }).some(s => s.n === 'Power Word Kill'));
  assert.ok(heroSpells({ ...newHero('Bard'), lvl:20 }).some(s => s.n === 'Power Word Kill'));
});

test('level-20 derivation leaves saved sheets untouched and clamps imported out-of-range levels', () => {
  const h = { ...newHero('Wizard'), lvl:99, spells:['Fire Bolt'], asi:{ 4:'Int', 12:'Int' } }, original = structuredClone(h);
  const freeze = o => { Object.freeze(o); for (const v of Object.values(o)) if (v && typeof v === 'object') freeze(v); };
  freeze(h);
  assert.equal(heroStats(h).L, 20);
  assert.equal(heroResources(h).find(r => r.id === 'hd').max, 20);
  assert.equal(maxSpellLevel(h), 9); assert.equal(spellLimits(h).prepared, 25);
  heroToken(h); heroWarnings(h); spellPool(h);
  assert.deepEqual(h, original);
  assert.equal(heroStats({ ...h, lvl:-5 }).L, 1);
});

test('level 20 keeps imported subclass choices while granting class features', async () => {
  const { SUBCLASSES } = await import('../src/data/srd.js');
  SUBCLASSES.Paladin = { 'Lantern Oath':{ features:{ 3:['Lantern Ward'] }, texts:{} } };
  SUBCLASSES.Bard = { 'Lantern College':{ features:{ 3:['Lantern Song'] }, texts:{} } };
  try {
    const p = { ...newHero('Paladin'), lvl:20, sub:'Lantern Oath' };
    assert.equal(heroStats(p).sub, 'Lantern Oath');
    assert.ok(!heroStats(p).features.includes('Devotion: Holy Nimbus (20)'));
    const r = heroResources(p).find(r => r.id === 'channel');
    assert.equal(r.max, 3); assert.match(r.text, /Lantern Oath/); assert.doesNotMatch(r.text, /Sacred Weapon/);
    assert.ok(heroSpells({ ...newHero('Bard'), lvl:20, sub:'Lantern College' }).some(s => s.n === 'Power Word Kill'));
  } finally { delete SUBCLASSES.Paladin; delete SUBCLASSES.Bard; }
});
