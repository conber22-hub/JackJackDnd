/* CHARACTER CREATOR — SRD 5.2, levels 1–20. Players use it from the start screen (their heroes are kept in their
   browser and sent to the DM when they join); the DM can open any sheet from the Tokens tab.
   openCreator(sheet | null, { onSave, title }) */
import { ABILITIES, ABILITY_NAMES, CLASSES, SPECIES, BACKGROUNDS, WEAPONS, ARMOR, STYLES, INVOCATIONS, SKILLS, STANDARD_ARRAY, POINT_COST, MAX_LEVEL, FEATS, SUBCLASSES, mod } from '../data/srd.js';
import { FEATURES } from '../data/srd-features.js';
import { textOf } from '../game/library.js';
import { newHero, heroStats, heroAttacks, heroSpells, spellPool, spellLimits, asiLevels, expertiseSlots, heroWarnings, SP, arcanumLevels } from '../engine/hero.js';
import { $, esc, clamp, d } from '../util/core.js';
import { toast } from './hud.js';
import { heroLook, sheetLook } from '../engine/look.js';
import { BODIES, SKINS, SKINS_FANTASY, HAIR_COLS, CLOTHS, HAIR, BEARDS, HORNS, OUTFITS, CLOAKS, HELMS, WEAPON_MODELS, OFFHANDS, POSES } from '../data/looks.js';
import { setStage, frame, portrait, act, studioCanvas, stageKey } from '../render/forge/studio.js';

let edit = null, opts = {};
const sgn = n => (n >= 0 ? '+' : '−') + Math.abs(n);
// A choice from one of the rules tables: the app's own entries, then the DM's books (game/library.js) in a group of their own.
const selLib = (f, table, v) => { const own = Object.keys(table).filter(k => !table[k]?.lib), lib = Object.keys(table).filter(k => table[k]?.lib).sort();
  const o = k => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(k)}</option>`;
  return `<select class="txt" data-cf="${f}">${own.map(o).join('')}${lib.length ? `<optgroup label="📚 Your books">${lib.map(o).join('')}</optgroup>` : ''}${table[v] ? '' : `<option selected value="${esc(v)}">${esc(v)} (not in this browser's books)</option>`}</select>`; };
const spcOf = h => SPECIES[h.sp] || SPECIES.Human, bgOf = h => BACKGROUNDS[h.bg] || BACKGROUNDS.Soldier;
// Rules text (SRD feats and features, the DM's books) as safe HTML: escaped first, then _italics_, **bold** and paragraphs.
export const rulesHTML = t => String(t || '').split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<i>$2</i>').replace(/^#{2,4}\s*(.+)$/gm, '<b>$1</b>').replace(/\n/g, '<br>')}</p>`).join('');
const sel = (f, list, v, attrs = '') => `<select class="txt" data-cf="${f}" ${attrs}>${list.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;

export function openCreator(sheet, o = {}){
  edit = JSON.parse(JSON.stringify(sheet || newHero()));
  opts = o;
  $('#charModal').classList.remove('hidden');
  render();
}
export function closeCreator(){ $('#charModal').classList.add('hidden'); edit = null; }

export function sheetHTML(h){
  const st = heroStats(h), atks = heroAttacks(h, st), sps = heroSpells(h, st);
  return `<div class="sheet">
    <div class="sheet-h"><span class="dot" style="color:${h.color};background:${h.color}"></span><b>${esc(h.name || 'Unnamed hero')}</b>
      <span class="muted">${esc(h.sp)}${h.spOpt ? ` (${esc(h.spOpt)})` : ''} ${esc(h.cls)} ${st.L}${st.sub ? ` · ${esc(st.sub)}` : ''} · ${esc(h.bg)}</span></div>
    <div class="sheet-k">
      <span>AC<b>${st.ac}</b></span><span>HP<b>${st.hp}</b></span><span>Speed<b>${st.spd}</b></span><span>Init<b>${sgn(st.init)}</b></span><span>Prof<b>+${st.pb}</b></span><span>Passive<b>${st.passive}</b></span>${st.dc ? `<span>Spell DC<b>${st.dc}</b></span>` : ''}
    </div>
    <div class="sheet-ab">${ABILITIES.map(a => `<div><small>${a}</small><b>${st.sc[a]}</b><i>${sgn(mod(st.sc[a]))}</i><em>save ${sgn(st.saves[a])}${st.C.sv.includes(a) ? ' •' : ''}</em></div>`).join('')}</div>
    <div class="sheet-l"><b>Skills</b> ${Object.keys(SKILLS).filter(s => st.prof.has(s)).map(s => `${esc(s)} ${sgn(st.skills[s])}${st.expert.has(s) ? '★' : ''}`).join(' · ') || '—'}</div>
    <div class="sheet-l"><b>Attacks</b> ${atks.map(a => `${esc(a.n)} ${sgn(a.b)} (${esc(a.d)} ${esc(a.t)})`).join(' · ')}</div>
    ${sps.length ? `<div class="sheet-l"><b>Spells</b> ${sps.map(s => `${esc(s.n)}${s.l ? ` <sup>${s.l}</sup>` : ''}`).join(' · ')}</div>` : ''}
    ${st.slots ? `<div class="sheet-l"><b>Slots</b> ${st.slots.map((n, i) => `L${i + 1}×${n}`).join(' ')}</div>` : ''}${st.pact ? `<div class="sheet-l"><b>Pact slots</b> ${st.pact.n} × level ${st.pact.l}</div>` : ''}
    <div class="sheet-l"><b>Features</b> ${st.features.map(esc).join(' · ')}</div>
    <div class="sheet-l muted">${esc([spcOf(h).note, spcOf(h).subs?.[h.spOpt]?.note].filter(Boolean).join(' · '))}${bgOf(h).feat ? ` Origin feat: ${esc(bgOf(h).feat)}.` : bgOf(h).note ? ` Background: ${esc(bgOf(h).note)}.` : ''}</div>
    ${readHTML(h, st)}
  </div>`;
}
// What a feature says: the SRD's text (shared names like Extra Attack keep a section per class: "### Fighter, level 5"),
// else the DM's books (game/library.js).
function featureText(name, cls){
  const t = FEATURES[name];
  if (!t) return textOf(name);
  if (!/^### /m.test(t)) return t;
  const parts = t.split(/^### /m).filter(Boolean), mine = parts.find(x => x.startsWith(cls)) || parts[0];
  return mine.replace(/^[^\n]*\n+/, '');
}
// The words behind a hero's features, species traits and feats, to read on the sheet.
function readHTML(h, st){
  const spc = spcOf(h), rows = [...(spc.feats || []), ...(spc.subs?.[h.spOpt]?.feats || [])].filter(f => f.text && !/language/i.test(f.n)).map(f => [f.n, f.text]);
  for (const f of st.features){ const n = f.replace(/ \(\d+\)$/, '').replace(/ — feat$/, ''); const t = FEATS[n]?.text || featureText(n, h.cls); if (t) rows.push([n, t]); }
  const seen = new Set(), list = rows.filter(([n]) => !seen.has(n) && seen.add(n));
  return list.length ? `<details class="sheet-l"><summary><b>📖 What your features do</b> <span class="muted">(${list.length})</span></summary>${list.map(([n, t]) => `<div class="feat-read"><b>${esc(n)}</b>${rulesHTML(t)}</div>`).join('')}</details>` : '';
}

/* An Ability Score Improvement level: the improvement itself (+2, or +1 and +1), or a feat instead. */
const asel = (l, k, list, v) => `<select class="txt" data-asi="${l}" data-k="${k}">${list.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v ?? '') ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
function asiHTML(h, l){
  const raw = h.asi?.[l], p = typeof raw === 'string' ? { feat:'Ability Score Improvement', ab:raw } : (raw || {});
  const C = CLASSES[h.cls];
  let more = '';
  if (p.feat === 'Ability Score Improvement') more = `${asel(l, 'ab', [['', '— ability —'], ...ABILITIES], p.ab)}${asel(l, 'ab2', [['', '+2 to it'], ...ABILITIES.filter(a => a !== p.ab).map(a => [a, `+1 to it, +1 to ${a}`])], p.ab2)}`;
  if (FEATS[p.feat]?.plus) more = asel(l, 'ab', [['', '+1 to…'], ...FEATS[p.feat].plus.map(a => [a, `+1 ${a}`])], p.ab);   // Grappler, and feats from the DM's books
  if (p.feat === 'Magic Initiate') more = asel(l, 'list', [['', 'Which list?'], ...Object.entries(FEATS['Magic Initiate'].lists)], p.list);
  if (p.feat === 'Skilled') more = [0, 1, 2].map(i => asel(l, `skill${i}`, [['', '— skill —'], ...Object.keys(SKILLS)], (p.skills || [])[i])).join('');
  if (p.feat === 'Other') more = `<input class="txt" data-asi="${l}" data-k="name" placeholder="Feat name" value="${esc(p.name || '')}">${asel(l, 'ab', [['', 'No ability bonus'], ...ABILITIES.map(a => [a, `+1 ${a}`])], p.ab)}${asel(l, 'hp', [['0', 'No extra HP'], ['1', '+1 HP a level'], ['2', '+2 HP a level']], p.hp || '0')}
    <input class="txt" data-asi="${l}" data-k="note" placeholder="What it does (shown on your sheet for the DM)" value="${esc(p.note || '')}">`;
  // the feats in groups: the SRD's by category (Epic Boons from level 19, fighting styles for classes that have the feature),
  // then the DM's books, then a written-in one
  const groups = [['General', n => FEATS[n].cat === 'General' && n !== 'Ability Score Improvement'], ['Origin', n => FEATS[n].cat === 'Origin'],
    ...(C.style ? [['Fighting Style', n => FEATS[n].cat === 'Fighting Style' || (FEATS[n].style && !FEATS[n].lib)]] : []), ...(l >= 19 ? [['Epic Boon', n => FEATS[n].cat === 'Epic Boon']] : []),
    ['📚 Your books', n => FEATS[n].lib && (!FEATS[n].style || C.style)]];
  const opt = (n, lab) => `<option value="${esc(n)}" ${n === p.feat ? 'selected' : ''}>${esc(lab)}</option>`;
  const names = Object.keys(FEATS).sort((a, b) => a.localeCompare(b));
  const pickFeat = `<select class="txt" data-asi="${l}" data-k="feat"><option value="">${l === 19 ? '— an Epic Boon, an ability increase or a feat —' : '— ability increase or a feat —'}</option>${opt('Ability Score Improvement', 'Ability Score Improvement (+2 / +1 +1)')}
    ${groups.map(([g, ok]) => { const list = names.filter(n => !FEATS[n].lib === !g.startsWith('📚') && ok(n)); return list.length ? `<optgroup label="${esc(g)}">${list.map(n => opt(n, n)).join('')}</optgroup>` : ''; }).join('')}${opt('Other', 'Another feat (write it in)')}</select>`;
  const f = FEATS[p.feat];
  return `<div class="cr-asi"><div class="row"><label>Level ${l}${l === 19 ? ' · Epic Boon' : ''}</label>${pickFeat}</div>
    ${more ? `<div class="row">${more}</div>` : ''}${p.feat ? `<div class="muted">${f?.req && f.req !== 'None' ? `<i>Prerequisite: ${esc(f.req)}</i> · ` : ''}${f?.cat ? `${esc(f.cat)} feat` : ''}${f?.lib ? esc(f.src) : ''}</div>${f?.text ? `<details class="muted"><summary>What it does</summary>${rulesHTML(f.text)}</details>` : ''}` : ''}</div>`;
}
function setAsi(l, k, v){
  edit.asi ||= {};
  const raw = edit.asi[l]; let p = typeof raw === 'string' ? { feat:'Ability Score Improvement', ab:raw } : { ...(raw || {}) };
  if (k === 'feat') p = v ? { feat:v } : {};
  else if (k.startsWith('skill')){ p.skills = [...(p.skills || [])]; p.skills[+k.slice(5)] = v || null; }
  else if (v === '' || v == null) delete p[k]; else p[k] = v;
  edit.asi[l] = p.feat ? p : undefined;
}

function render(){
  const h = edit, C = CLASSES[h.cls], st = heroStats(h), L = st.L, bg = bgOf(h), spc = spcOf(h), spOpts = spc.opts, subs = SUBCLASSES[h.cls];
  const spOptKey = spOpts ? Object.keys(spOpts)[0] : null;
  const lim = spellLimits(h), pool = spellPool(h);
  const arc = new Set(arcanumLevels(h));   // a Warlock's Mystic Arcanum levels: one spell each, not prepared
  const nCan = (h.spells || []).filter(n => SP(n)?.l === 0).length, nPrep = (h.spells || []).filter(n => SP(n)?.l > 0 && !arc.has(SP(n).l)).length;
  const classSkills = C.skills[1], nSkills = C.skills[0], exSlots = expertiseSlots(h);
  const usedStd = Object.values(h.ab);
  const pts = Object.values(h.ab).reduce((a, v) => a + (POINT_COST[v] ?? 99), 0);
  const warnings = heroWarnings(h);
  $('#charBox').innerHTML = `
  <div class="cr-head"><h1>${esc(opts.title || 'Create a character')}</h1><button class="btn small" data-cr="close">✕</button></div>
  <div class="cr-cols"><div class="cr-form">
    <h2>Who</h2>
    <div class="grid2"><label>Name<input class="txt" data-cf="name" value="${esc(h.name)}" placeholder="e.g. Ilse Vantorin"></label>
      <label>Player<input class="txt" data-cf="player" value="${esc(h.player)}" placeholder="your name"></label></div>
    <div class="grid3"><label>Level${sel('lvl', Array.from({ length:MAX_LEVEL }, (_, i) => i + 1), h.lvl)}</label>
      <label>Class${sel('cls', Object.keys(CLASSES), h.cls)}</label>
      <label>Colour<input type="color" class="txt" data-cf="color" value="${esc(h.color)}"></label></div>
    ${subs ? `<div class="grid2"><label>Subclass${sel('sub', [[C.sub, `${C.sub} (wired into the rules)`], ...Object.keys(subs).sort().map(n => [n, `📚 ${n}`])], h.sub && subs[h.sub] ? h.sub : C.sub)}</label><span class="muted" style="align-self:end">${h.sub && subs[h.sub] ? `${esc(subs[h.sub].src)} · its features are on your sheet to read; the DM rules what they do` : ''}</span></div>` : ''}
    <div class="muted">${L >= 3 || st.sub ? `Subclass: <b>${esc(st.sub || C.sub)}</b>` : `Subclass at level 3: ${esc(h.sub && subs?.[h.sub] ? h.sub : C.sub)}`} · d${C.hd} hit die · saves ${C.sv.join(', ')}${C.cast ? ` · casts with ${C.cast}` : ''}</div>
    <div class="grid2"><label>Species${selLib('sp', SPECIES, h.sp)}</label>${spOptKey ? `<label>${esc(spOptKey)}${sel('spOpt', spOpts[spOptKey], h.spOpt || spOpts[spOptKey][0])}</label>` : '<span></span>'}</div>
    <div class="muted">${esc([spc.note, spc.subs?.[h.spOpt]?.note].filter(Boolean).join(' · '))}${spc.lib ? ` <i>(${esc(spc.src)})</i>` : ''}</div>
    <div class="grid3"><label>Background${selLib('bg', BACKGROUNDS, h.bg)}</label><label>+2 to${sel('bg2', bg.ab, h.bg2)}</label><label>+1 to${sel('bg1', bg.ab.filter(a => a !== h.bg2), h.bg1)}</label></div>
    <div class="muted">${bg.feat ? `Origin feat: ${esc(bg.feat)} · ` : bg.note ? `${esc(bg.note)} · ` : ''}skills: ${bg.skills.join(', ') || '—'}${bg.lib ? ` <i>(${esc(bg.src)})</i>` : ''}</div>

    <h2>Ability scores</h2>
    <div class="row">${[['standard', 'Standard array'], ['pointbuy', `Point buy (${pts}/27)`], ['manual', 'Enter my own'], ['roll', 'Roll 4d6']].map(([k, l]) => `<button class="btn small ${h.method === k ? 'on' : ''}" data-cr="method" data-k="${k}">${l}</button>`).join('')}
      ${h.method === 'roll' ? `<button class="btn small primary" data-cr="roll">🎲 Roll six scores</button>` : ''}<button class="btn small" data-cr="suggest" title="The class's suggested spread">Suggested</button></div>
    <div class="cr-ab">${ABILITIES.map(a => {
      let input;
      if (h.method === 'standard' || (h.method === 'roll' && h.rolled)){
        const pool = h.method === 'roll' ? h.rolled : STANDARD_ARRAY;
        input = `<select class="txt" data-ab="${a}">${[...new Set(pool)].map(v => `<option ${+h.ab[a] === v ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
      } else input = `<input class="txt" type="number" min="${h.method === 'pointbuy' ? 8 : 3}" max="${h.method === 'pointbuy' ? 15 : 20}" data-ab="${a}" value="${h.ab[a]}">`;
      const poolArr = h.method === 'standard' ? STANDARD_ARRAY : h.method === 'roll' ? h.rolled : null;
      const dup = poolArr && usedStd.filter(v => v === h.ab[a]).length > poolArr.filter(v => v === h.ab[a]).length;
      return `<div class="${dup ? 'dup' : ''}"><small title="${ABILITY_NAMES[a]}">${a}</small>${input}<b>${st.sc[a]}</b><i>${sgn(mod(st.sc[a]))}</i></div>`;
    }).join('')}</div>
    ${h.method === 'roll' && h.rolled ? `<div class="muted">Rolled: ${h.rolled.join(', ')} — assign each once.</div>` : ''}
    ${asiLevels(h).map(l => asiHTML(h, l)).join('')}

    <h2>Skills</h2>
    <div class="muted">Choose ${nSkills} from your class (${(h.skills || []).length} chosen). From your background: ${bg.skills.join(', ')}${h.sp === 'Elf' ? '; Elf: Perception' : ''}${[...(spc.skills || []), ...(spc.subs?.[h.spOpt]?.skills || [])].length ? `; ${esc(h.sp)}: ${[...(spc.skills || []), ...(spc.subs?.[h.spOpt]?.skills || [])].join(', ')}` : ''}.</div>
    <div class="cr-chk">${classSkills.map(s => `<label class="crc"><input type="checkbox" data-skill="${esc(s)}" ${(h.skills || []).includes(s) ? 'checked' : ''} ${bg.skills.includes(s) ? 'disabled' : ''}><span>${esc(s)} <span class="muted">${SKILLS[s]}</span></span></label>`).join('')}</div>
    ${h.sp === 'Human' ? `<div class="row"><label>Human — Skillful</label>${sel('extraSkill', Object.keys(SKILLS), h.extraSkill || 'Perception')}</div>` : ''}
    ${exSlots ? `<div class="muted">Expertise: pick ${exSlots} proficient skills (double proficiency).</div><div class="cr-chk">${[...st.prof].map(s => `<label class="crc"><input type="checkbox" data-exp="${esc(s)}" ${(h.expert || []).includes(s) ? 'checked' : ''}><span>${esc(s)}</span></label>`).join('')}</div>` : ''}

    <h2>Gear</h2>
    <div class="grid3"><label>Armour${sel('armor', Object.keys(ARMOR), h.armor)}</label><label class="crc" style="align-self:end"><input type="checkbox" data-cf="shield" ${h.shield ? 'checked' : ''}><span>Shield</span></label><span class="muted" style="align-self:end">Trained: ${esc(C.armor || 'none')}</span></div>
    <div class="grid3">${[0, 1, 2].map(i => `<label>Weapon ${i + 1}${sel(`w.${i}`, ['—', ...WEAPONS.map(w => w.n)], (h.weapons || [])[i] || '—')}</label>`).join('')}</div>
    ${C.mastery ? `<div class="muted">Weapon Mastery (${C.mastery}): the first ${C.mastery} weapons listed.</div>` : ''}
    ${C.style && L >= C.style ? `<div class="row"><label>Fighting style</label>${sel('style', Object.keys(STYLES), h.style || 'Defense')}<span class="muted">${esc(STYLES[h.style] || '')}</span></div>` : ''}
    ${h.cls === 'Warlock' ? `<div class="row"><label>Invocation</label>${sel('invoc', INVOCATIONS, h.invoc || 'Agonizing Blast')}</div>` : ''}

    ${pool.length ? `<h2>Spells</h2><div class="muted">Cantrips ${nCan}${lim.cantrips ? ` / ${lim.cantrips}` : ''} · prepared ${nPrep}${lim.prepared ? ` / ${lim.prepared}` : ''}. Subclass and species spells are added for you.</div>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(l => pool.some(s => s.l === l)).map(l => `<h4>${arc.has(l) ? `Mystic Arcanum · level ${l} <span class="muted">(choose one; once a long rest, no slot)</span>` : l ? `Level ${l}` : 'Cantrips'}</h4><div class="cr-chk">${pool.filter(s => s.l === l).map(s => `<label class="crc"><input type="checkbox" data-spell="${esc(s.n)}" ${(h.spells || []).includes(s.n) ? 'checked' : ''}><span>${esc(s.n)}</span></label>`).join('')}</div>`).join('')}` : ''}

    ${lookHTML(h)}
    <h2>Portrait</h2>
    <div class="artslot">${h.portrait ? `<img src="${h.portrait}" alt="">` : '<div style="width:56px;height:56px;border-radius:8px;background:#1d1720;display:grid;place-items:center">🖼</div>'}
      <div>Shown on your sheet and the cards. <button class="btn small" data-cr="portraitFromMini">📸 Take it from my mini</button><br><label class="btn small" style="display:inline-block;margin-top:4px">Choose image<input type="file" accept="image/*" data-cr-file="portrait" hidden></label>${h.portrait ? ' <button class="btn small" data-cr="clearPortrait">Clear</button>' : ''}</div></div>
    <div class="row"><label style="margin:0">On the map</label><span class="chip ${h.miniStyle !== 'picture' ? 'on' : ''}" data-cr="miniStyle" data-k="forge">🗿 My 3D mini</span><span class="chip ${h.miniStyle === 'picture' ? 'on' : ''}" data-cr="miniStyle" data-k="picture">🖼 My picture, standing</span></div>

    <h2>Story</h2>
    <label>What they look like<textarea class="txt" data-cf="look">${esc(h.look)}</textarea></label>
    <label>One person they would go back for<input class="txt" data-cf="goBackFor" value="${esc(h.goBackFor)}"></label>
    <label>One thing they are ashamed of<input class="txt" data-cf="ashamed" value="${esc(h.ashamed)}"></label>
    <label>Why they would walk into a fog that smells of churches<input class="txt" data-cf="why" value="${esc(h.why)}"></label>
    <label>A smell that means home<input class="txt" data-cf="homeSmell" value="${esc(h.homeSmell)}"></label>
    <label>Backstory & notes<textarea class="txt" data-cf="backstory">${esc(h.backstory)}</textarea></label>
  </div>
  <div class="cr-side">${narrow() ? '' : miniHost()}${sheetHTML(h)}
    ${warnings.length ? `<div class="bad">${warnings.map(w => `• ${esc(w)}`).join('<br>')}</div>` : '<div class="muted" style="color:var(--ok)">Ready for the table.</div>'}
    <div class="row"><button class="btn primary" data-cr="save">${esc(opts.saveLabel || 'Save hero')}</button><button class="btn small" data-cr="export">⬇ Export</button><label class="btn small">⬆ Import<input type="file" accept=".json" data-cr-file="import" hidden></label><button class="btn small" data-cr="close">Cancel</button></div>
  </div></div>`;
  mountMini();
}

/* ---------- the Look studio: the hero's 3D mini, live ---------- */
const narrow = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width:760px)').matches;
const miniHost = () => `<div class="cr-mini" id="crMini"><div class="cr-mini-b"><button class="btn small" data-cr="mini:attack" title="See them swing">⚔</button><button class="btn small" data-cr="mini:cast" title="See them cast">✨</button><button class="btn small ${miniWalk ? 'on' : ''}" data-cr="mini:walk" title="Walk">🚶</button></div></div>`;
let miniYaw = .5, miniRaf = 0, miniDrag = null, miniWalk = false, miniLast = 0;
const swatches = (key, list, cur) => `<div class="sw">${list.map(c => `<i data-cr="miniSet" data-k="${key}" data-v="${c}" style="background:${c}" class="${c === cur ? 'on' : ''}"></i>`).join('')}<input type="color" data-mini="${key}" value="${cur}"></div>`;
const msel = (key, list, cur, auto = null) => `<select class="txt" data-mini="${key}">${auto ? `<option value="">${esc(auto)}</option>` : ''}${list.map(([v, l]) => `<option value="${esc(v)}" ${!auto || (edit.mini || {})[key] !== undefined ? (v === cur ? 'selected' : '') : ''}>${esc(l)}</option>`).join('')}</select>`;
const pairs = o => Array.isArray(o) ? o.map(v => [v, v[0].toUpperCase() + v.slice(1)]) : Object.entries(o);
function lookHTML(h){
  const L = heroLook(h), S = sheetLook(h), m = h.mini || {}, B = BODIES[L.body];
  const skins = SKINS_FANTASY[L.body] ? [...SKINS_FANTASY[L.body], ...SKINS.slice(0, 3)] : SKINS;
  return `<h2>Looks</h2>${narrow() ? miniHost() : ''}
    <div class="muted">Your mini is built from your sheet — your folk, armour, weapons and shield all show, and it changes when they do. Make it yours; this is what the table sees.</div>
    <div class="cr-look">
      <label>Skin${swatches('skin', skins, L.skin)}</label>
      <label>Hair ${msel('hair', pairs(HAIR), L.hair)}${swatches('hairCol', HAIR_COLS, L.hairCol)}</label>
      <div class="grid3"><label>Beard ${msel('beard', pairs(BEARDS), L.beard)}</label><label>Eyes <input type="color" data-mini="eyes" value="${L.eyes}"></label>
        <label>Horns ${msel('horns', pairs(HORNS), L.horns)}</label></div>
      <div class="grid3"><label>Height <input type="range" min=".88" max="1.12" step=".01" data-mini="height" value="${L.height}"></label><label>Build <input type="range" min="0" max="1" step=".02" data-mini="build" value="${L.build}"></label><label>Shoulders <input type="range" min="0" max="1" step=".02" data-mini="frame" value="${L.frame}"></label></div>
      <label>Clothes${swatches('c1', [h.color, ...CLOTHS.slice(0, 9)].filter(Boolean), L.c1)}</label>
      <label>Trim${swatches('c2', ['#a08a6a', '#c0a050', '#d8d0b8', '#8a2a2a', '#2a2a30', '#6a5040', '#3a4a6a'], L.c2)}</label>
      <div class="grid3"><label>Cloak ${msel('cloak', pairs(CLOAKS), L.cloak)}</label><label>Cloak colour <input type="color" data-mini="cloakCol" value="${L.cloakCol}"></label><label>On the head ${msel('helm', pairs(HELMS), L.helm)}</label></div>
      <div class="grid3"><label>Outfit ${msel('outfit', pairs(OUTFITS), L.outfit, `From my armour (${OUTFITS[S.outfit] || S.outfit})`)}</label>
        <label>In hand ${msel('main', WEAPON_MODELS.map(w => [w, w === 'none' ? 'Nothing' : w[0].toUpperCase() + w.slice(1)]), L.main, `From my weapons (${S.main})`)}</label>
        <label>Other hand ${msel('off', pairs(OFFHANDS), L.off, `From my sheet (${OFFHANDS[S.off] || S.off})`)}</label></div>
      <div class="grid3"><label>Stance ${msel('pose', pairs(POSES).filter(([k]) => !['slump', 'stiff'].includes(k)), L.pose)}</label>
        <label>Shield colour <input type="color" data-mini="shieldCol" value="${L.shieldCol}"></label>
        <label class="crc" style="margin-top:22px"><input type="checkbox" data-mini="lantern" ${L.lantern ? 'checked' : ''}><span>Lantern at the belt</span></label></div>
      <div class="row"><button class="btn small" data-cr="miniRandom">🎲 Surprise me</button><button class="btn small" data-cr="miniReset">↺ Back to my sheet</button>${B?.tail ? '' : ''}</div>
    </div>`;
}
function mountMini(){
  const host = $('#crMini'); if (!host || !edit) return;
  let cv;
  try { cv = studioCanvas(); } catch { host.innerHTML = '<div class="muted" style="padding:12px">3D preview unavailable on this device.</div>'; return; }
  cv.className = 'cr-mini-cv'; host.prepend(cv);
  const look = heroLook(edit);
  if (stageKey() !== JSON.stringify([look])) setStage([look]);
  if (!cv.dataset.wired){
    cv.dataset.wired = 1;
    cv.addEventListener('pointerdown', e => { miniDrag = { x:e.clientX, yaw:miniYaw }; if (e.pointerType === 'mouse') cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (miniDrag) miniYaw = miniDrag.yaw - (e.clientX - miniDrag.x) / 90; });
    cv.addEventListener('pointerup', () => { miniDrag = null; });
    cv.addEventListener('pointercancel', () => { miniDrag = null; });   // the browser took the swipe to scroll
  }
  if (!miniRaf) miniRaf = requestAnimationFrame(miniLoop);
}
function miniLoop(now){
  const cv = document.querySelector('#crMini .cr-mini-cv');
  if (!edit || !cv || $('#charModal').classList.contains('hidden')){ miniRaf = 0; return; }
  miniRaf = requestAnimationFrame(miniLoop);
  const dt = Math.min(.05, (now - (miniLast || now)) / 1000); miniLast = now;
  if (!miniDrag) miniYaw += dt * .35;
  // never more than half the screen's height (on a phone the page must still scroll past it)
  const w = Math.max(160, Math.min(cv.parentElement.clientWidth, Math.round(innerHeight * .5 / 1.05))), h = Math.round(w * 1.05);
  frame({ w, h, yaw:miniYaw, t:now / 1000, dt, y:.52, dist:2.15, moving:miniWalk });
}
function setMini(key, v){
  edit.mini ||= {};
  if (v === '' || v === undefined) delete edit.mini[key]; else edit.mini[key] = ['height', 'build', 'frame'].includes(key) ? +v : v;
}
const pick = a => a[Math.floor(Math.random() * a.length)];

function set(path, v){
  const h = edit;
  if (path === 'lvl') h.lvl = clamp(+v, 1, MAX_LEVEL);
  else if (path === 'cls'){ h.cls = v; h.sub = null; const C = CLASSES[v]; h.ab = { ...C.arr }; h.method = 'standard'; h.skills = C.skills[1].slice(0, C.skills[0]); h.expert = []; h.spells = []; h.color = C.color;
    h.armor = C.armor?.startsWith('heavy') ? 'Chain Mail' : C.armor?.startsWith('medium') ? 'Scale Mail' : C.armor?.startsWith('light') ? 'Leather' : 'None'; h.shield = /shield/.test(C.armor || ''); }
  else if (path === 'sub') h.sub = v === CLASSES[h.cls].sub ? null : v;   // null: the class's own
  else if (path === 'bg'){ h.bg = v; const b = BACKGROUNDS[v]; if (!b) return; h.bg2 = b.ab[0]; h.bg1 = b.ab[1]; h.skills = (h.skills || []).filter(s => !b.skills.includes(s)); }
  else if (path === 'bg2'){ h.bg2 = v; if (h.bg1 === v) h.bg1 = bgOf(h).ab.find(a => a !== v); }
  else if (path === 'sp'){ h.sp = v; const o = SPECIES[v]?.opts; h.spOpt = o ? Object.values(o)[0][0] : null; }
  else if (path.startsWith('asi.')){ (h.asi ||= {})[path.slice(4)] = v || undefined; }
  else if (path.startsWith('w.')){ const ws = [0, 1, 2].map(i => (h.weapons || [])[i] || null); ws[+path.slice(2)] = v === '—' ? null : v; h.weapons = ws.filter(Boolean); }
  else h[path] = v;
}
document.addEventListener('change', e => {
  if (!edit || !$('#charBox')?.contains(e.target)) return;
  const el = e.target;
  if (el.dataset.mini){ setMini(el.dataset.mini, el.type === 'checkbox' ? el.checked : el.value); render(); return; }
  if (el.dataset.asi){ setAsi(el.dataset.asi, el.dataset.k, el.value); render(); return; }
  if (el.dataset.cf){ set(el.dataset.cf, el.type === 'checkbox' ? el.checked : el.value); render(); }
  else if (el.dataset.ab){ const lo = edit.method === 'pointbuy' ? 8 : 3, hi = edit.method === 'pointbuy' ? 15 : 20; edit.ab[el.dataset.ab] = clamp(+el.value || 10, lo, hi); render(); }
  else if (el.dataset.skill){ const s = el.dataset.skill; edit.skills = (edit.skills || []).filter(x => x !== s); if (el.checked) edit.skills.push(s); render(); }
  else if (el.dataset.exp){ const s = el.dataset.exp; edit.expert = (edit.expert || []).filter(x => x !== s); if (el.checked) edit.expert.push(s); render(); }
  else if (el.dataset.spell){ const s = el.dataset.spell; edit.spells = (edit.spells || []).filter(x => x !== s); if (el.checked) edit.spells.push(s); render(); }
  else if (el.dataset.crFile === 'portrait' && el.files[0]){
    const img = new Image(), url = URL.createObjectURL(el.files[0]);
    img.onload = () => { const s = Math.min(1, 384 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); edit.portrait = c.toDataURL('image/jpeg', .85); URL.revokeObjectURL(url); render(); };
    img.src = url;
  }
  else if (el.dataset.crFile === 'import' && el.files[0]){
    const r = new FileReader(); r.onload = () => { try { const o = JSON.parse(r.result); if (!o.cls || !o.ab) throw 0; edit = { ...newHero(o.cls), ...o }; render(); toast('Hero loaded.'); } catch { toast('That is not a Dread Delve hero.'); } }; r.readAsText(el.files[0]);
  }
});
// text fields: keep what is typed without re-rendering (so focus is not lost); the sheet updates on blur
document.addEventListener('input', e => { if (!edit || !$('#charBox')?.contains(e.target)) return; const el = e.target; if (el.dataset.cf && /INPUT|TEXTAREA/.test(el.tagName) && el.type !== 'color' && el.type !== 'checkbox') set(el.dataset.cf, el.value);
  if (el.dataset.asi && el.tagName === 'INPUT') setAsi(el.dataset.asi, el.dataset.k, el.value);
  // sliders and colours reshape the mini as they move (the sheet re-renders when they're let go)
  if (el.dataset.mini && (el.type === 'range' || el.type === 'color')){ setMini(el.dataset.mini, el.value); const l = heroLook(edit); if (stageKey() !== JSON.stringify([l])) setStage([l]); } });
document.addEventListener('click', e => {
  if (!edit) return;
  const b = e.target.closest('[data-cr]'); if (!b || !$('#charBox').contains(b)) return;
  const a = b.dataset.cr;
  if (a === 'close'){ closeCreator(); return; }
  if (a === 'method'){ edit.method = b.dataset.k; if (edit.method === 'pointbuy') for (const k of ABILITIES) edit.ab[k] = clamp(edit.ab[k], 8, 15); if (edit.method === 'standard') edit.ab = { ...CLASSES[edit.cls].arr }; render(); }
  if (a === 'suggest'){ edit.ab = { ...CLASSES[edit.cls].arr }; if (edit.method === 'roll') edit.method = 'standard'; render(); }
  if (a === 'roll'){
    const r4 = () => { const r = [d(6), d(6), d(6), d(6)].sort((x, y) => y - x); return r[0] + r[1] + r[2]; };
    edit.rolled = Array.from({ length:6 }, r4).sort((x, y) => y - x);
    const order = Object.entries(CLASSES[edit.cls].arr).sort((x, y) => y[1] - x[1]).map(([k]) => k);
    order.forEach((k, i) => edit.ab[k] = edit.rolled[i]); render();
  }
  if (a === 'clearPortrait'){ delete edit.portrait; render(); }
  if (a === 'portraitFromMini'){ setStage([heroLook(edit)]); const url = portrait(); if (url){ edit.portrait = url; toast('Portrait taken.'); } render(); }
  if (a === 'miniStyle'){ edit.miniStyle = b.dataset.k === 'picture' ? 'picture' : undefined; if (edit.miniStyle === 'picture' && !edit.portrait) toast('Choose a picture (or take one from your mini) for the standee.'); render(); }
  if (a === 'miniSet'){ setMini(b.dataset.k, b.dataset.v); render(); }
  if (a === 'miniReset'){ delete edit.mini; render(); }
  if (a === 'miniRandom'){
    const L = heroLook(edit), B = BODIES[L.body], skins = SKINS_FANTASY[L.body] || SKINS;
    edit.mini = { ...(edit.mini || {}), skin:pick(skins), hair:B.snout ? 'bald' : pick(HAIR), hairCol:pick(HAIR_COLS), beard:B.beard ? pick(['full', 'long', 'braided']) : Math.random() < .4 ? pick(BEARDS) : 'none',
      c2:pick(['#a08a6a', '#c0a050', '#d8d0b8', '#8a2a2a', '#2a2a30']), cloak:pick(Object.keys(CLOAKS)), cloakCol:pick(['#2a2430', '#3a2a24', '#24302a', '#4a1e22', '#22283a', '#3a3a30']),
      helm:Math.random() < .7 ? 'none' : pick(Object.keys(HELMS)), height:+(.92 + Math.random() * .16).toFixed(2), build:+Math.random().toFixed(2), frame:+Math.random().toFixed(2) };
    if (B.horns) edit.mini.horns = pick(['curled', 'swept', 'ram', 'small']);
    render();
  }
  if (a.startsWith('mini:')){ const k = a.slice(5); if (k === 'walk'){ miniWalk = !miniWalk; render(); } else act(0, k); }
  if (a === 'export'){ const blob = new Blob([JSON.stringify(edit, null, 1)], { type:'application/json' }); const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = `${(edit.name || 'hero').replace(/[^\w]+/g, '-').toLowerCase()}.json`; l.click(); }
  if (a === 'save'){
    if (!edit.name?.trim()){ toast('Give your hero a name first.'); return; }
    const h = edit; closeCreator(); opts.onSave?.(h);
  }
});
