import test from 'node:test';
import assert from 'node:assert/strict';
import { LOOKS, SCHOOL } from '../src/data/spell-looks.js';
import { lookFor, hasLook, looked } from '../src/engine/spell-looks.js';
import { SPELLS } from '../src/data/srd.js';

const schools = ['abjuration','conjuration','divination','enchantment','evocation','illusion','necromancy','transmutation'];
const elements = ['fire','cold','radiant','necrotic','lightning','force','acid','poison','thunder','psychic'];
const fields = ['col','col2','motes','light','shock','mark','linger','sound','words'];
const marks = [null,'chains','halo','web','cloud','shield','stars','runes','roots','flames','frost','eyes','hands','bubble'];
function valid(look, label){
  for (const field of fields) assert.ok(Object.hasOwn(look, field), `${label}: missing ${field}`);
  for (const field of ['col','col2']) assert.match(look[field], /^#[0-9a-f]{6}$/, label);
  assert.ok(['rise','fall','burst','swirl'].includes(look.motes), label);
  assert.ok(marks.includes(look.mark), label);
  if (Object.hasOwn(look,'path')) assert.ok(['burst','cone','line','aura','pillar','darts','touch'].includes(look.path), label);
  for (const [field,max] of [['light',4],['shock',1],['linger',60]]) {
    assert.ok(Number.isFinite(look[field]) && look[field]>=0 && look[field]<=max, `${label}: ${field}`);
  }
  assert.ok(look.sound === null || [...elements,...schools].includes(look.sound), label);
  assert.equal(typeof look.words,'string');
  assert.ok(look.words.trim().length>0 && look.words.length<60, label);
  assert.deepEqual(JSON.parse(JSON.stringify(look)),look, label);
}

test('catalogue covers every level 0–3 spell and only exact current spell names', () => {
  const names = new Set(SPELLS.map(s => s.n));
  assert.ok(looked().length>=120);
  assert.deepEqual(looked(),Object.keys(LOOKS));
  for (const name of looked()) assert.ok(names.has(name),name);
  for (const s of SPELLS.filter(s => s.l<=3)) assert.ok(hasLook(s.n),s.n);
  for (const name of ['Cone of Cold','Wall of Fire','Banishment','Polymorph','Dimension Door','Greater Invisibility','Hold Monster','Cloudkill','Disintegrate','Chain Lightning','Finger of Death','Sunbeam','Meteor Swarm']) assert.ok(hasLook(name),name);
});

test('all signatures and all eight schools are complete JSON recipes', () => {
  assert.deepEqual(Object.keys(SCHOOL).sort(),schools.toSorted());
  for (const [name,look] of Object.entries({...LOOKS,...SCHOOL})) valid(look,name);
  for (const s of SPELLS) valid(lookFor(s),s.n);
  assert.equal(new Set(Object.values(LOOKS).map(l=>l.words)).size,looked().length,'captions are individually authored');
});

test('fire, cold and necrotic families have distinct combined colours and motion', () => {
  // Sound also identifies damaging spells whose SRD ty field is absent.
  for (const family of ['fire','cold','necrotic']) {
    const names = looked().filter(n => LOOKS[n].sound===family || SPELLS.some(s=>s.n===n && String(s.ty).includes(family)));
    const seen = new Map();
    for (const name of names) {
      const {col,col2,motes} = LOOKS[name], key = [col,col2,motes].join('/');
      assert.ok(!seen.has(key), `${family}: ${name} repeats ${seen.get(key)}`);
      seen.set(key,name);
    }
  }
});

test('iconic spells retain their readable silhouettes and contrast', () => {
  assert.equal(LOOKS['Burning Hands'].path,'cone');
  assert.equal(LOOKS.Fireball.path,'burst');
  assert.equal(LOOKS.Fireball.mark,'cloud');
  assert.ok(LOOKS['Wall of Fire'].linger>LOOKS.Fireball.linger);
  for (const [name,mark] of [['Hold Person','chains'],['Bless','halo'],['Shield','shield'],['Web','web'],['Entangle','roots'],['Misty Step','cloud']]) assert.equal(LOOKS[name].mark,mark);
  assert.equal(LOOKS.Sleep.motes,'fall');
  assert.equal(LOOKS.Darkness.light,0);
  assert.equal(LOOKS.Darkness.mark,'bubble');
  assert.match(LOOKS['Misty Step'].words,/departure and arrival/);
});

test('own spell overrides conflicting type, school and shape', () => {
  assert.deepEqual(lookFor({n:'Fireball',ty:'cold',school:'Illusion',shape:'cone',k:'heal'}),LOOKS.Fireball);
  assert.deepEqual(lookFor({n:'Hold Person',ty:'fire',school:'Evocation'}),LOOKS['Hold Person']);
});

test('damage precedes school and action hints; school precedes generic', () => {
  const fire = lookFor({n:'Unknown',ty:' FIRE / radiant',school:'Illusion',k:'heal',cond:'held'});
  assert.equal(fire.col,'#ffb04a');
  assert.equal(fire.motes,'rise');
  assert.equal(fire.sound,'fire');
  assert.equal(fire.light,3.2);
  assert.equal(fire.mark,null);
  assert.deepEqual(lookFor({school:' ILLUSION ',k:'heal',cond:'held'}),SCHOOL.illusion);
  for (const school of schools) assert.deepEqual(lookFor({school}),SCHOOL[school]);
  assert.deepEqual(lookFor({ty:'',school:'Necromancy'}),SCHOOL.necromancy);
  assert.deepEqual(lookFor({ty:'unrecognised',school:'Illusion'}),lookFor({}));
});

test('shape fallback follows existing targeting without inventing a path', () => {
  for (const input of [{},{k:'auto'},{ty:'radiant'},{school:'Evocation'},{n:'Wall of Fire'},{shape:''}]) assert.ok(!Object.hasOwn(lookFor(input),'path'));
  for (const [shape,path] of [['cone','cone'],['line','line'],['aura','aura'],['sphere','burst'],['cube','burst']]) assert.equal(lookFor({shape}).path,path);
  assert.equal(lookFor({shape:'sphere',self:true}).path,'aura');
  assert.equal(lookFor({n:'Wall of Fire',shape:'line'}).path,'line');
});

test('unknown names, prototype keys and missing inputs are safe', () => {
  for (const input of [undefined,null,{},42,'Fireball',{n:'Unknown'},{n:'constructor',school:'toString'},{n:'__proto__'},{ty:null,school:12,shape:false}]) valid(lookFor(input),'fallback');
  for (const name of ['constructor','toString','__proto__','fireball',' Fireball ',null,{},undefined]) assert.equal(hasLook(name),false);
  assert.equal(hasLook('Fireball'),true);
});

test('look selection is deterministic and cannot mutate inputs or the catalogue', () => {
  const input = Object.freeze({n:'Fireball',shape:'sphere'});
  const first = lookFor(input), original = structuredClone(LOOKS.Fireball);
  first.col='#000000'; first.words='Changed';
  assert.deepEqual(lookFor(input),original);
  const list=looked(); list.length=0;
  assert.ok(looked().length>=120);
  const school=lookFor({school:'Illusion'}); school.mark=null;
  assert.equal(SCHOOL.illusion.mark,'bubble');
});

test('partial authored entries inherit all missing fields from the fallback', () => {
  const name='Test-only unfinished signature';
  try {
    LOOKS[name]={col:'#123456',words:'One new spark.'};
    const damage=lookFor({n:name,ty:'cold'});
    assert.equal(damage.col,'#123456');
    assert.equal(damage.col2,'#5fb6ff');
    assert.equal(damage.motes,'fall');
    assert.equal(damage.sound,'cold');
    valid(damage,name);
    const school=lookFor({n:name,school:'Abjuration',shape:'cone'});
    assert.equal(school.mark,'shield');
    assert.equal(school.path,'cone');
    valid(school,name);
  } finally { delete LOOKS[name]; }
});

test('named spells remain distinguishable with captions and audio off', () => {
  const seen = new Map();
  for (const [name, look] of Object.entries(LOOKS)) {
    const { col, col2, motes, mark, path } = look;
    const signature = JSON.stringify([col, col2, motes, mark, path]);
    assert.ok(!seen.has(signature), `${name} visually duplicates ${seen.get(signature)}`);
    seen.set(signature, name);
  }
});
