/* 🎯 THE TARGET CARD: a small, handsome card for the foe you're aiming at, that tells you about it at a
   glance — is it hurt, is it frightened or prone, and what have you learned about it. The host (the fight
   bar, in ui/wander.js and ui/tablehh.js) gives it a <div> and calls renderTargetCard with the aimed token,
   its bestiary entry, the odds they already compute and faceOf(token) — see the PR. It only renders what
   it's given: no messages, no state changes. A foe's hit points are never shown as numbers — health is a
   word, as the table says it. */

/* ---------- health, in words ---------- */
// Unhurt (full), Scratched (more than three quarters), Hurt (more than half), Bloodied (half or less),
// Near death (a quarter or less), Down.
export function healthWord(hp, maxHp, dead){
  if (dead) return 'Down';
  const m = Number(maxHp);
  if (!Number.isFinite(m) || m <= 0) return 'Unhurt';
  let h = Number(hp); if (!Number.isFinite(h)) h = m;
  if (h <= 0) return 'Down';
  if (h >= m) return 'Unhurt';
  const r = h / m;
  if (r > 3 / 4) return 'Scratched';
  if (r > 1 / 2) return 'Hurt';
  if (r > 1 / 4) return 'Bloodied';
  return 'Near death';
}
const WORD_CLASS = { 'Unhurt':'unhurt', 'Scratched':'scratched', 'Hurt':'hurt', 'Bloodied':'bloodied', 'Near death':'neardeath', 'Down':'down' };

/* ---------- conditions ---------- */
// icon, a few letters, and the full name for the tooltip. Unknown ones get ❓ and their first letters.
const CONDS = {
  prone:{ ic:'🛌', ab:'PR', label:'prone' }, frightened:{ ic:'😱', ab:'FR', label:'frightened' },
  restrained:{ ic:'⛓', ab:'RS', label:'restrained' }, paralyzed:{ ic:'⛓', ab:'PA', label:'paralyzed' },
  grappled:{ ic:'⛓', ab:'GR', label:'grappled' }, poisoned:{ ic:'☠', ab:'PO', label:'poisoned' },
  blinded:{ ic:'👁', ab:'BL', label:'blinded' }, charmed:{ ic:'💜', ab:'CH', label:'charmed' },
  stunned:{ ic:'💫', ab:'ST', label:'stunned' }, deafened:{ ic:'👂', ab:'DE', label:'deafened' },
  incapacitated:{ ic:'😶', ab:'IN', label:'incapacitated' }, unconscious:{ ic:'😴', ab:'UN', label:'unconscious' },
  petrified:{ ic:'🗿', ab:'PE', label:'petrified' }, exhausted:{ ic:'😮‍💨', ab:'EX', label:'exhausted' },
  raging:{ ic:'🔥', ab:'RA', label:'raging' }, dodging:{ ic:'🛡', ab:'DO', label:'dodging' },
};
const condOf = n => { const k = String(n || '').toLowerCase();
  return CONDS[k] || { ic:'❓', ab:(k.slice(0, 2) || '??').toUpperCase(), label:k || 'condition' }; };
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

/* ---------- what's known ---------- */
// only what's in revealed (tier 2, fought, on): resistances, immunities, vulnerabilities, AC. Never hit
// points — revealed.hp ("about 11") would put a number on the card — and speed isn't what the card is for.
function knownText(known){
  const r = known?.revealed || null;
  if (!r) return null;
  const bits = [];
  if (Array.isArray(r.vuln)) for (const t of r.vuln) bits.push(`Weak to ${cap(String(t))}`);
  if (Array.isArray(r.resist)) for (const t of r.resist) bits.push(`Resists ${cap(String(t))}`);
  if (Array.isArray(r.immune)) for (const t of r.immune) bits.push(`Immune to ${cap(String(t))}`);
  const ac = Number(r.ac); if (Number.isFinite(ac)) bits.push(`AC ${ac}`);
  return bits.length ? bits.join(' · ') : null;
}

/* ---------- the card ---------- */
function ensureStyle(){
  if (document.getElementById('targetCardStyle')) return;
  const s = document.createElement('style'); s.id = 'targetCardStyle';
  s.textContent = `.tc-card{display:flex;align-items:center;gap:10px;height:100%;max-height:64px;padding:6px 10px;
  box-sizing:border-box;overflow:hidden;background:var(--glass-strong);border:1px solid var(--line);border-radius:12px;
  box-shadow:var(--spec),0 8px 24px rgba(0,0,0,.45);color:var(--ink);font-family:var(--ui)}
.tc-card.hw-unhurt{--ring:var(--gold-hi)}.tc-card.hw-scratched{--ring:var(--candle)}
.tc-card.hw-hurt{--ring:var(--gold-lo)}.tc-card.hw-bloodied{--ring:var(--blood)}
.tc-card.hw-neardeath{--ring:#ff5a4e}.tc-card.hw-down{--ring:var(--dim)}
.tc-face{flex:0 0 auto;width:48px;height:48px;border-radius:50%;border:2px solid var(--ring);
  box-shadow:0 0 10px var(--ring);overflow:hidden;display:flex;align-items:center;
  justify-content:center;background:#1a141c;transition:border-color .3s var(--ease),box-shadow .3s var(--ease)}
.tc-face img{width:100%;height:100%;object-fit:cover;display:block}
.tc-init{font:600 20px var(--serif);color:var(--gold-hi)}
.tc-mid{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;justify-content:center}
.tc-top{display:flex;align-items:center;gap:6px;min-width:0}
.tc-name{flex:0 1 auto;min-width:0;font-weight:600;font-size:14px;line-height:1.2;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis}
.tc-conds{display:flex;gap:3px;flex:0 0 auto}
.tc-cond{display:inline-flex;align-items:center;gap:2px;padding:1px 4px;border:1px solid var(--line);
  border-radius:6px;background:var(--glass-2);font-size:11px;line-height:1.3;white-space:nowrap}
.tc-sub{display:flex;align-items:baseline;gap:6px;min-width:0;font-size:12px;line-height:1.2}
.tc-hw{flex:0 0 auto;font-weight:700;color:var(--ring);white-space:nowrap}
.tc-known{flex:1 1 auto;min-width:0;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tc-known.dim{font-style:italic}
.tc-odds{flex:0 0 auto;font-weight:700;font-size:20px;line-height:1;color:var(--gold-hi);white-space:nowrap}
body.hh .tc-card{max-height:44px;padding:4px 8px;gap:8px;border-radius:10px}
body.hh .tc-face{width:32px;height:32px}
body.hh .tc-init{font-size:14px}
body.hh .tc-name{font-size:12px}
body.hh .tc-sub{font-size:10.5px}
body.hh .tc-cond{font-size:10px;padding:0 3px}
body.hh .tc-odds{font-size:16px}
@media (prefers-reduced-motion: reduce){.tc-face{transition:none}}`;
  document.head.appendChild(s);
}

// the slide on a change of target: short setTimeout steps, never requestAnimationFrame (round 13 — a frame can
// take ~2.4s on a slow box, so a frame-driven animation never finishes). Only the slide moves; the card is at
// full strength from the first frame (round 14 — a fade-in on a CSS transition never advances on this box's
// slow desktop compositor, and the lines sat at opacity 0). No slide at all when the device asks for reduced
// motion, or on the card's first appearance.
let slideRun = 0;
const slides = new WeakMap();
function slideIn(card){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const run = ++slideRun; slides.set(card, run);
  const steps = [10, 7, 4, 2, 0];
  let i = 0; card.style.transform = `translateX(${steps[0]}px)`;
  const tick = () => { if (slides.get(card) !== run) return; i++;
    if (i >= steps.length){ card.style.transform = ''; return; }
    card.style.transform = `translateX(${steps[i]}px)`; setTimeout(tick, 30); };
  setTimeout(tick, 30);
}

export function renderTargetCard(el, { token, known, odds, face } = {}){
  try {
    if (!el) return;
    ensureStyle();
    if (!token){ el.replaceChildren(); delete el.dataset.tid; return; }   // no target: the card goes away
    const word = healthWord(token.hp, token.maxHp, token.dead);
    const name = String(token.name || 'Unknown').trim() || 'Unknown';
    const prevId = el.dataset.tid, id = String(token.id ?? token.bid ?? name);
    const card = document.createElement('div');
    card.className = `tc-card hw-${WORD_CLASS[word] || 'unhurt'}`;
    // the face, ringed in the health word's colour (gold unhurt → candle → amber → blood red near death)
    const faceEl = document.createElement('div'); faceEl.className = 'tc-face';
    if (face) { const img = document.createElement('img'); img.src = String(face); img.alt = ''; faceEl.appendChild(img); }
    else { const init = document.createElement('span'); init.className = 'tc-init'; init.textContent = name[0].toUpperCase(); faceEl.appendChild(init); }
    card.appendChild(faceEl);
    const mid = document.createElement('div'); mid.className = 'tc-mid';
    const top = document.createElement('div'); top.className = 'tc-top';
    const nm = document.createElement('span'); nm.className = 'tc-name'; nm.textContent = name; top.appendChild(nm);
    // its conditions, at most four, then "+2"
    const conds = Array.isArray(token.conds) ? token.conds.filter(c => c && c.n) : [];
    if (conds.length){
      const row = document.createElement('span'); row.className = 'tc-conds';
      for (const c of conds.slice(0, 4)){
        const d = condOf(c.n), chip = document.createElement('span'); chip.className = 'tc-cond'; chip.title = d.label;
        chip.textContent = `${d.ic} ${d.ab}`; row.appendChild(chip);
      }
      if (conds.length > 4){ const more = document.createElement('span'); more.className = 'tc-cond';
        more.title = conds.slice(4).map(c => condOf(c.n).label).join(', ');
        more.textContent = `+${conds.length - 4}`; row.appendChild(more); }
      top.appendChild(row);
    }
    mid.appendChild(top);
    const sub = document.createElement('div'); sub.className = 'tc-sub';
    const hw = document.createElement('span'); hw.className = 'tc-hw'; hw.textContent = word; sub.appendChild(hw);
    const kn = document.createElement('span'); kn.className = 'tc-known';
    const knownLine = knownText(known);
    if (knownLine) kn.textContent = knownLine; else { kn.textContent = 'Not yet known'; kn.classList.add('dim'); }
    sub.appendChild(kn); mid.appendChild(sub); card.appendChild(mid);
    // the odds, in big figures: the edge's mark before them, the why in the tooltip
    if (odds && odds.pct != null){
      const o = document.createElement('span'); o.className = 'tc-odds';
      const pct = typeof odds.pct === 'number' ? `${Math.round(odds.pct)}%` : String(odds.pct);
      o.textContent = `${odds.edge?.mark || ''}${pct}`;
      if (odds.edge?.text) o.title = String(odds.edge.text);
      card.appendChild(o);
    }
    el.replaceChildren(card);
    el.dataset.tid = id;
    if (prevId && prevId !== id) slideIn(card);   // a change of target slides the new card in
  } catch { try { el?.replaceChildren(); } catch {} }   // never throws on missing fields
}
