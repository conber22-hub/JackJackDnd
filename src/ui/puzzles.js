/* 🧩 THE PUZZLE SHEET — the puzzle in the room, worked from a phone (game/puzzles.js). A player whose hero stands in a
   puzzle's room gets the 🧩 button; the DM gets it whenever this floor has a puzzle, and sees the solution, the
   hints to give for a good check, reset and remove. A player's move goes to the DM's app, which checks and plays it. */
import { state, ui, tokById } from '../engine/state.js';
import { $, esc, bus } from '../util/core.js';
import { sendHost } from '../net/table.js';
import { puzzlesOn, puzzleAt, puzzleById, puzzleView, playPuzzle, puzzleHint, resetPuzzle, removePuzzle } from '../game/puzzles.js';
import { roomById } from '../engine/generator.js';
import { toast } from './hud.js';
import { registerCommands } from './palette.js';

let open = null, drawn = '';   // { L, id } of the puzzle on the sheet; what's drawn on it now
const ARROW = { N:'↑', E:'→', S:'↓', W:'←' }, DIRS = { N:'north', E:'east', S:'south', W:'west' };
const me = () => ui.role === 'dm' ? null : tokById(ui.myToken);
// The puzzle this device can work now: the player's own room's; for the DM, the selected hero's room's, else the first on the floor.
function current(){
  if (!state) return null;
  if (ui.role === 'dm'){ const sel = ui.selected && tokById(ui.selected); const p = sel ? puzzleAt(sel) : null; return p ? { L:sel.floor, p } : (puzzlesOn(ui.floor)[0] ? { L:ui.floor, p:puzzlesOn(ui.floor)[0] } : null); }
  const t = me(); const p = t && puzzleAt(t); return p ? { L:t.floor, p } : null;
}

export function openPuzzle(L = null, id = null){
  const c = id ? { L, p:puzzleById(L, id) } : current();
  if (!c?.p){ toast(ui.role === 'dm' ? 'No puzzle on this floor yet: set one in a room from the Build tab.' : 'There is no puzzle here.'); return; }
  open = { L:c.L, id:c.p.id }; render();
}
function close(){ open = null; drawn = ''; $('#puzzleSheet')?.classList.add('hidden'); }

// A move: the DM plays it here; a player sends it to the DM's app and waits for the state to come back.
function move(action){
  if (!open) return;
  if (ui.role === 'dm'){ playPuzzle(open.L, open.id, action); render(); return; }
  const p = puzzleById(open.L, open.id); if (!p) return;
  sendHost({ t:'puzzle', floor:open.L, id:open.id, action });
  $('#pzStatus') && ($('#pzStatus').textContent = '…');
}

function body(v){
  const k = v.kind;
  if (k === 'levers') return `<div class="pz-row">${v.levers.map((n, i) => `<button class="btn pz-lever ${v.pulled.includes(i) ? 'on' : ''}" data-pz='{"type":"pull","lever":${i}}'>🔔 ${esc(n)}</button>`).join('')}</div>
    <div class="muted">${v.pulled.length ? `Rung so far: ${v.pulled.map(i => esc(v.levers[i])).join(' → ')}` : 'None rung yet.'}</div>`;
  if (k === 'statues') return `<div class="muted">The altar is to the ${DIRS[v.altar]} (${ARROW[v.altar]}).</div><div class="pz-row">${v.positions.map((d, i) => `<button class="btn pz-statue ${d === v.altar ? 'on' : ''}" data-pz='{"type":"turn","statue":${i}}' title="Turn this one (and its neighbours)"><span class="pz-big">${ARROW[d]}</span><br>Mourner ${i + 1}</button>`).join('')}</div>`;
  if (k === 'dials') return `<div class="pz-row">${v.dials.map((cur, i) => `<label class="pz-dial">Seal ${i + 1}<select class="txt" data-pzdial="${i}">${v.symbols.map(s => `<option value="${esc(s.id)}" ${s.id === cur ? 'selected' : ''}>${s.glyph} ${esc(s.name)}</option>`).join('')}</select></label>`).join('')}</div>
    <button class="btn primary" data-pz='{"type":"check"}'>Turn the seals</button>`;
  if (k === 'riddle') return `<p class="pz-q">“${esc(v.question)}”</p><div class="row"><input class="txt" id="pzAnswer" placeholder="Your answer…" maxlength="80" style="flex:1"><button class="btn primary" data-pzanswer>Speak it</button></div>`;
  if (k === 'mirrors'){
    const on = new Set((v.beam?.path || []).map(p => `${p.x},${p.y}`));
    const cell = (c, x, y) => { const lit = on.has(`${x},${y}`), tgt = v.target.x === x && v.target.y === y;
      const glyph = tgt ? '👁' : c === '#' ? '' : c === '/' ? '╱' : c === '\\' ? '╲' : c === 'T' ? '👁' : '';
      return `<td class="pz-c ${c === '#' ? 'wall' : ''} ${lit ? 'lit' : ''} ${'/\\'.includes(c) ? 'mir' : ''}" ${'/\\'.includes(c) ? `data-pz='{"type":"rotate","x":${x},"y":${y}}'` : ''}>${glyph}</td>`; };
    const e = v.entry, side = e.dx === 1 ? 'the west' : e.dx === -1 ? 'the east' : e.dy === 1 ? 'the north' : 'the south';
    return `<div class="muted">Light comes in from ${side}, row ${e.y + 1 > 0 ? e.y + 1 : ''}${e.y < 0 ? `column ${e.x + 1}` : ''}. Tap a pane to turn it.</div>
      <table class="pz-grid">${v.grid.map((row, y) => `<tr>${[...row].map((c, x) => cell(c, x, y)).join('')}</tr>`).join('')}</table>
      <div class="muted">${v.beam?.end?.reason === 'target' ? 'The light finds the eye.' : `The light ends ${v.beam?.end?.reason === 'exit' ? 'against the far wall' : 'on stone'}.`}</div>`;
  }
  if (k === 'weights') return `<div class="muted">The tribute must weigh ${v.target} marks. The needle reads <b>${v.reading}</b>.</div>
    <div class="pz-row">${v.items.map(it => { const onPan = v.pan.includes(it.id); return `<button class="btn ${onPan ? 'on' : ''}" data-pz='{"type":"${onPan ? 'remove' : 'place'}","item":${it.id}}'>${onPan ? '⚖ ' : ''}${esc(it.name)}</button>`; }).join('')}</div>
    <button class="btn primary" data-pz='{"type":"check"}'>Offer it</button>`;
  return '';
}

function render(force = true){
  if (!open) return;
  const p = puzzleById(open.L, open.id); if (!p){ close(); return; }
  // (redraw only when the puzzle has changed, so a half-typed answer isn't wiped; and keep what was typed)
  const sig = JSON.stringify([puzzleView(p), p.last, p.trap, ui.role]);
  if (!force && sig === drawn && !$('#puzzleSheet')?.classList.contains('hidden')) return;
  drawn = sig; const typed = $('#pzAnswer')?.value || '';
  let m = $('#puzzleSheet');
  if (!m){ m = document.createElement('div'); m.id = 'puzzleSheet'; m.className = 'modal'; document.body.appendChild(m);
    m.addEventListener('click', onClick); m.addEventListener('change', onChange); m.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'pzAnswer') answer(); }); }
  const v = puzzleView(p), f = state.floors[open.L], r = roomById(f, p.room), dm = ui.role === 'dm';
  const sol = dm && p.state?.secret ? solutionText(p.state) : '';
  m.innerHTML = `<div class="sheet pz-sheet"><div class="row" style="align-items:center"><h2 style="flex:1;margin:0">🧩 ${esc(p.name)}</h2><button class="btn small" data-pzclose>✕</button></div>
    <div class="muted">${esc(r?.name || '')}${v.solved ? ' · <b>solved</b>' : ''}${v.fails ? ` · ${v.fails} wrong` : ''}</div>
    ${(v.clues || []).length ? `<div class="pz-clues">${v.clues.map(c => `<p>${esc(c)}</p>`).join('')}</div>` : ''}
    ${v.solved ? '<p class="pz-done">It is done. Something gives, deep in the stone.</p>' : body(v)}
    <div class="pz-last" id="pzStatus">${esc(p.last || '')}</div>
    ${dm ? `<div class="pz-dm"><b>DM:</b> ${sol}${p.trap ? `<div>⚠ A trap went off: <b>${esc(p.trap)}</b>.</div>` : ''}
      <div class="row"><span class="muted">A good check gives a hint:</span>${[1, 2, 3].map(n => `<button class="btn small" data-pzhint="${n}">Hint ${n}</button>`).join('')}</div>
      <div class="row"><button class="btn small" data-pzreset>↺ Reset</button><button class="btn small danger" data-pzremove>Remove</button></div></div>` : ''}</div>`;
  m.classList.remove('hidden');
  if (typed && $('#pzAnswer')) $('#pzAnswer').value = typed;
}
function solutionText(s){
  const x = s.secret;
  if (s.kind === 'levers') return `ring ${x.order.map(i => s.levers[i]).join(' → ')}.`;
  if (s.kind === 'dials') return `seals ${x.combination.join(', ')}.`;
  if (s.kind === 'riddle') return `“${esc(x.answer)}”${x.also?.length ? ` (or ${x.also.map(esc).join(', ')})` : ''}.`;
  if (s.kind === 'weights') return `${x.subset.map(i => esc(s.items[i].name)).join(' + ')} (weights ${x.weights.join(', ')}).`;
  if (s.kind === 'statues') return `turn ${x.solution.map(a => a.statue + 1).join(', ')}.`;
  if (s.kind === 'mirrors') return `turn the panes at ${x.solution.map(a => `column ${a.x + 1}, row ${a.y + 1}`).join('; ')}.`;
  return '';
}
function answer(){ const t = $('#pzAnswer')?.value.trim(); if (t) move({ type:'answer', text:t }); }
function onClick(e){
  const b = e.target.closest('[data-pz],[data-pzclose],[data-pzanswer],[data-pzhint],[data-pzreset],[data-pzremove]'); if (!b) return;
  if (b.hasAttribute('data-pzclose')) return close();
  if (b.hasAttribute('data-pzanswer')) return answer();
  if (b.dataset.pzhint) return puzzleHint(open.L, open.id, +b.dataset.pzhint);
  if (b.hasAttribute('data-pzreset')){ resetPuzzle(open.L, open.id); return render(); }
  if (b.hasAttribute('data-pzremove')){ removePuzzle(open.L, open.id); return close(); }
  try { move(JSON.parse(b.dataset.pz)); } catch {}
}
function onChange(e){ const d = e.target.dataset.pzdial; if (d !== undefined) move({ type:'set', dial:+d, symbol:e.target.value }); }

// The 🧩 button: shown when this device has a puzzle to work.
function refresh(){
  const b = $('#btnPuzzle'); if (!b) return;
  const c = state && !ui.screen ? current() : null;
  b.classList.toggle('hidden', !c);
  if (c && !c.p.state?.solved && !c.p.view?.solved) b.title = `🧩 ${c.p.name}`;
  if (open) render(false);
}
let started = false;
export function ensurePuzzles(){
  if (started) return; started = true;
  if (!document.getElementById('puzzleCSS')){
    const st = document.createElement('style'); st.id = 'puzzleCSS';
    st.textContent = `body.screen #btnPuzzle{display:none!important}#btnPuzzle.hidden{display:none}.pz-sheet{max-width:560px}.pz-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.pz-row .btn.on{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold) inset}
    .pz-big{font-size:26px;line-height:1}.pz-statue{min-width:76px}.pz-dial{display:flex;flex-direction:column;gap:4px;font-size:13px}
    .pz-clues{margin:8px 0;padding:8px 12px;border-left:2px solid var(--gold);font-style:italic}.pz-clues p{margin:4px 0}.pz-q{font-size:18px;font-style:italic}
    .pz-grid{border-collapse:collapse;margin:10px auto}.pz-c{width:40px;height:40px;border:1px solid rgba(255,255,255,.12);text-align:center;font-size:22px;background:rgba(0,0,0,.25)}
    .pz-c.wall{background:rgba(120,110,100,.45)}.pz-c.lit{background:rgba(255,214,140,.28)}.pz-c.mir{cursor:pointer;color:#dfe8f0}
    .pz-last{min-height:1.4em;margin:8px 0;color:var(--candle)}.pz-done{font-size:17px;color:var(--gold-hi)}
    .pz-dm{margin-top:10px;padding:8px 10px;border:1px dashed rgba(255,255,255,.2);border-radius:8px;font-size:13px}
    @media (max-width:480px){.pz-c{width:34px;height:34px;font-size:18px}}`;
    document.head.appendChild(st);
  }
  if (!document.getElementById('btnPuzzle')){
    const b = document.createElement('button'); b.id = 'btnPuzzle'; b.className = 'icon hidden'; b.textContent = '🧩'; b.title = 'The puzzle here';
    b.onclick = () => openPuzzle();
    const help = document.getElementById('btnHelp'), bar = help?.parentElement;
    if (bar) bar.insertBefore(b, help); else document.body.appendChild(b);
  }
  registerCommands([{ id:'puzzle', n:'The puzzle here', hint:'Levers, statues, dials, a riddle, mirrors or a scale, in the room where you stand', icon:'🧩', role:'both', run:() => openPuzzle() }]);
  bus.on('state', refresh); bus.on('puzzle', refresh); bus.on('log', refresh);
  setInterval(refresh, 1200);   // (a hero walking into the room: cheap, and only toggles one button)
}
