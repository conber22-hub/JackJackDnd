/* CHARACTER CREATOR — SRD 5.2, levels 1–10. Players use it from the start screen (their heroes are kept in their
   browser and sent to the DM when they join); the DM can open any sheet from the Tokens tab.
   openCreator(sheet | null, { onSave, title }) */
import { ABILITIES, ABILITY_NAMES, CLASSES, SPECIES, BACKGROUNDS, WEAPONS, ARMOR, STYLES, INVOCATIONS, SKILLS, STANDARD_ARRAY, POINT_COST, MAX_LEVEL, mod } from '../data/srd.js';
import { newHero, heroStats, heroAttacks, heroSpells, spellPool, spellLimits, asiLevels, expertiseSlots, heroWarnings, SP } from '../engine/hero.js';
import { $, esc, clamp, d } from '../util/core.js';
import { toast } from './hud.js';

let edit = null, opts = {};
const sgn = n => (n >= 0 ? '+' : '−') + Math.abs(n);
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
    <div class="sheet-l muted">${esc(SPECIES[h.sp]?.note || '')} Origin feat: ${esc(BACKGROUNDS[h.bg]?.feat || '')}.</div>
  </div>`;
}

function render(){
  const h = edit, C = CLASSES[h.cls], st = heroStats(h), L = st.L, bg = BACKGROUNDS[h.bg], spOpts = SPECIES[h.sp].opts;
  const spOptKey = spOpts ? Object.keys(spOpts)[0] : null;
  const lim = spellLimits(h), pool = spellPool(h);
  const nCan = (h.spells || []).filter(n => SP(n)?.l === 0).length, nPrep = (h.spells || []).filter(n => SP(n)?.l > 0).length;
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
    <div class="muted">${L >= 3 ? `Subclass: <b>${esc(C.sub)}</b>` : `Subclass at level 3: ${esc(C.sub)}`} · d${C.hd} hit die · saves ${C.sv.join(', ')}${C.cast ? ` · casts with ${C.cast}` : ''}</div>
    <div class="grid2"><label>Species${sel('sp', Object.keys(SPECIES), h.sp)}</label>${spOptKey ? `<label>${esc(spOptKey)}${sel('spOpt', spOpts[spOptKey], h.spOpt || spOpts[spOptKey][0])}</label>` : '<span></span>'}</div>
    <div class="muted">${esc(SPECIES[h.sp].note)}</div>
    <div class="grid3"><label>Background${sel('bg', Object.keys(BACKGROUNDS), h.bg)}</label><label>+2 to${sel('bg2', bg.ab, h.bg2)}</label><label>+1 to${sel('bg1', bg.ab.filter(a => a !== h.bg2), h.bg1)}</label></div>
    <div class="muted">Origin feat: ${esc(bg.feat)} · skills: ${bg.skills.join(', ')}</div>

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
    ${asiLevels(h).map(l => `<div class="row"><label>Level ${l} ability increase (+2)</label>${sel(`asi.${l}`, [['', '— choose —'], ...ABILITIES], h.asi?.[l] || '')}</div>`).join('')}

    <h2>Skills</h2>
    <div class="muted">Choose ${nSkills} from your class (${(h.skills || []).length} chosen). From your background: ${bg.skills.join(', ')}${h.sp === 'Elf' ? '; Elf: Perception' : ''}.</div>
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
      ${[0, 1, 2, 3, 4, 5].filter(l => pool.some(s => s.l === l)).map(l => `<h4>${l ? `Level ${l}` : 'Cantrips'}</h4><div class="cr-chk">${pool.filter(s => s.l === l).map(s => `<label class="crc"><input type="checkbox" data-spell="${esc(s.n)}" ${(h.spells || []).includes(s.n) ? 'checked' : ''}><span>${esc(s.n)}</span></label>`).join('')}</div>`).join('')}` : ''}

    <h2>Portrait</h2>
    <div class="artslot">${h.portrait ? `<img src="${h.portrait}" alt="">` : '<div style="width:56px;height:56px;border-radius:8px;background:#1d1720;display:grid;place-items:center">🖼</div>'}
      <div>Your mini on the map shows this picture.<br><label class="btn small" style="display:inline-block;margin-top:4px">Choose image<input type="file" accept="image/*" data-cr-file="portrait" hidden></label>${h.portrait ? ' <button class="btn small" data-cr="clearPortrait">Clear</button>' : ''}</div></div>

    <h2>Story</h2>
    <label>What they look like<textarea class="txt" data-cf="look">${esc(h.look)}</textarea></label>
    <label>One person they would go back for<input class="txt" data-cf="goBackFor" value="${esc(h.goBackFor)}"></label>
    <label>One thing they are ashamed of<input class="txt" data-cf="ashamed" value="${esc(h.ashamed)}"></label>
    <label>Why they would walk into a fog that smells of churches<input class="txt" data-cf="why" value="${esc(h.why)}"></label>
    <label>A smell that means home<input class="txt" data-cf="homeSmell" value="${esc(h.homeSmell)}"></label>
    <label>Backstory & notes<textarea class="txt" data-cf="backstory">${esc(h.backstory)}</textarea></label>
  </div>
  <div class="cr-side">${sheetHTML(h)}
    ${warnings.length ? `<div class="bad">${warnings.map(w => `• ${esc(w)}`).join('<br>')}</div>` : '<div class="muted" style="color:var(--ok)">Ready for the table.</div>'}
    <div class="row"><button class="btn primary" data-cr="save">${esc(opts.saveLabel || 'Save hero')}</button><button class="btn small" data-cr="export">⬇ Export</button><label class="btn small">⬆ Import<input type="file" accept=".json" data-cr-file="import" hidden></label><button class="btn small" data-cr="close">Cancel</button></div>
  </div></div>`;
}

function set(path, v){
  const h = edit;
  if (path === 'lvl') h.lvl = clamp(+v, 1, MAX_LEVEL);
  else if (path === 'cls'){ h.cls = v; const C = CLASSES[v]; h.ab = { ...C.arr }; h.method = 'standard'; h.skills = C.skills[1].slice(0, C.skills[0]); h.expert = []; h.spells = []; h.color = C.color;
    h.armor = C.armor?.startsWith('heavy') ? 'Chain Mail' : C.armor?.startsWith('medium') ? 'Scale Mail' : C.armor?.startsWith('light') ? 'Leather' : 'None'; h.shield = /shield/.test(C.armor || ''); }
  else if (path === 'bg'){ h.bg = v; const b = BACKGROUNDS[v]; h.bg2 = b.ab[0]; h.bg1 = b.ab[1]; h.skills = (h.skills || []).filter(s => !b.skills.includes(s)); }
  else if (path === 'bg2'){ h.bg2 = v; if (h.bg1 === v) h.bg1 = BACKGROUNDS[h.bg].ab.find(a => a !== v); }
  else if (path === 'sp'){ h.sp = v; const o = SPECIES[v].opts; h.spOpt = o ? Object.values(o)[0][0] : null; }
  else if (path.startsWith('asi.')){ (h.asi ||= {})[path.slice(4)] = v || undefined; }
  else if (path.startsWith('w.')){ const ws = [0, 1, 2].map(i => (h.weapons || [])[i] || null); ws[+path.slice(2)] = v === '—' ? null : v; h.weapons = ws.filter(Boolean); }
  else h[path] = v;
}
document.addEventListener('change', e => {
  if (!edit || !$('#charBox')?.contains(e.target)) return;
  const el = e.target;
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
document.addEventListener('input', e => { if (!edit || !$('#charBox')?.contains(e.target)) return; const el = e.target; if (el.dataset.cf && /INPUT|TEXTAREA/.test(el.tagName) && el.type !== 'color' && el.type !== 'checkbox') set(el.dataset.cf, el.value); });
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
  if (a === 'export'){ const blob = new Blob([JSON.stringify(edit, null, 1)], { type:'application/json' }); const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = `${(edit.name || 'hero').replace(/[^\w]+/g, '-').toLowerCase()}.json`; l.click(); }
  if (a === 'save'){
    if (!edit.name?.trim()){ toast('Give your hero a name first.'); return; }
    const h = edit; closeCreator(); opts.onSave?.(h);
  }
});
