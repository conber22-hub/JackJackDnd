/* THE SHIFT — the Dread Zone rewires a floor. Rolls the d100 Shift table (Dread tab) and applies the row. */
import { state, ui, log, shiftTable, isDM } from '../engine/state.js';
import { carve, linkRooms, placeDoors, moveStairs, addTrap, THEME_TRAPS, isDoorway, doorAt, trapAt } from '../engine/generator.js';
import { tableRow } from '../engine/tables.js';
import { updateVision, randomRoomTile } from '../engine/grid.js';
import { T } from '../engine/tiles.js';
import { ROOM_NAMES } from '../data/rooms.js';
import { THEMES } from '../data/themes.js';
import { d, pick, esc } from '../util/core.js';
import { animateGridChange, buildFloor } from '../render/floors.js';
import { syncTokens } from '../render/minis.js';
import { burst, clearReach, showReach } from '../render/effects.js';
import { showCard } from '../ui/hud.js';
import { sfx } from '../audio/sound.js';
import { runFx, zoneSource } from './combat.js';
import { changed, broadcast } from './session.js';
import { tokById } from '../engine/state.js';

const SHIFT_ONLY = new Set(['rewire', 'swap', 'forget', 'scatter', 'stairs', 'nest', 'trap', 'doors']);

export function shiftFloor(L, why, forced){
  if (ui.role !== 'dm' || !state.floors[L]) return;
  const f = state.floors[L], oldGrid = f.grid.slice(), below = state.floors[L + 1], oldBelow = below?.grid.slice();
  const { rows } = shiftTable();
  const roll = forced ?? d(100);
  const row = tableRow(rows, roll) || { name:'The halls shift', text:'', fx:['rewire'] };
  const dm = [], later = [];
  const here = () => state.tokens.filter(t => t.floor === L && !t.dead && !t.flags.gone);
  const occupied = r => here().some(t => t.x >= r.x && t.x < r.x + r.w && t.y >= r.y && t.y < r.y + r.h);
  let rewired = false, belowChanged = false;
  for (const fx of row.fx){
    const [kind, arg] = fx.split(':');
    if (!SHIFT_ONLY.has(kind)){ later.push(fx); continue; }
    if (kind === 'rewire'){
      if (f.autoLink){ f.edges = linkRooms(f.rooms, Math.random); rewired = true; }
      else dm.push('Hand-built halls hold their shape (auto-link is off).');
    }
    else if (kind === 'swap'){
      const cand = f.rooms.filter(r => !r.stairsUp && !r.stairsDown && r !== f.rooms[0] && !occupied(r));
      if (cand.length >= 2){
        const a = cand.splice(Math.floor(Math.random() * cand.length), 1)[0], b = pick(cand);
        [a.type, b.type] = [b.type, a.type]; [a.name, b.name] = [b.name, a.name]; [a.notes, b.notes] = [b.notes, a.notes];
        dm.push(`${a.name} and ${b.name} trade places.`);
      }
    }
    else if (kind === 'forget'){ state.explored[L] = new Set(); dm.push('The players\' map of this floor fades to what they can see now.'); }
    else if (kind === 'scatter'){
      const party = here().filter(t => t.kind !== 'monster'), used = new Set();
      for (const t of party){
        const spot = randomRoomTile(L, Math.random, r => !used.has(r.id) || used.size >= f.rooms.length) || randomRoomTile(L);
        if (!spot) continue;
        used.add(spot.room.id); burst(L, t.x, t.y, '#9b77dc');
        t.x = spot.x; t.y = spot.y; t.flags.latchedBy = null;
        setTimeout(() => burst(L, t.x, t.y, '#9b77dc'), 300);
      }
      dm.push(`${party.length} party member${party.length === 1 ? '' : 's'} scattered across the floor.`);
    }
    else if (kind === 'stairs'){
      if (f.down && below){
        const cand = f.rooms.filter(r => !r.stairsUp && !r.stairsDown && !(f.up && f.up.x === r.cx && f.up.y === r.cy));
        const r = pick(cand);
        if (r && !moveStairs(state.floors, L, 'down', r.cx, r.cy)){ belowChanged = true; dm.push(`The stairs down now rise in ${r.name}.`); }
      } else dm.push('No stairs down to move.');
    }
    else if (kind === 'nest'){
      const cand = f.rooms.filter(r => !r.stairsUp && !r.stairsDown && r !== f.rooms[0] && !occupied(r) && r.type !== 'nest' && r.type !== 'safe');
      const r = pick(cand);
      if (r){ r.type = 'nest'; r.name = pick(ROOM_NAMES.nest); dm.push(`${r.name} is now a Seep Nest.`); later.push(`spawn:seepling:2@nest`); }
    }
    else if (kind === 'trap'){
      const n = +arg || 1, kinds = THEMES[f.theme]?.traps || THEME_TRAPS[THEMES[f.theme]?.id] || ['pit'];
      const halls = f.grid.map((v, i) => v === T.HALL && !doorAt(f, i) && !trapAt(f, i) ? i : -1).filter(i => i >= 0);
      for (let k = 0; k < n && halls.length; k++) addTrap(f, halls.splice(Math.floor(Math.random() * halls.length), 1)[0], pick(kinds));
      dm.push(`${n} hidden trap${n === 1 ? '' : 's'} armed in the corridors.`);
    }
    else if (kind === 'doors'){
      if (arg === 'lock'){ let n = 0; f.doors.forEach(dr => { if (dr.state === 'closed'){ dr.state = 'locked'; n++; } }); dm.push(`${n} door${n === 1 ? '' : 's'} locked.`); }
      if (arg === 'open'){ let n = 0; f.doors.forEach(dr => { if (dr.state === 'closed' || dr.state === 'locked'){ dr.state = 'open'; n++; } }); dm.push(`${n} door${n === 1 ? '' : 's'} flew open.`); }
      if (arg === 'secret'){
        const vis = f.doors.filter(dr => dr.state !== 'secret'), hid = f.doors.filter(dr => dr.state === 'secret');
        if (hid.length){ const h = pick(hid); h.state = 'closed'; h.found = true; dm.push('A secret door reveals itself.'); }
        if (vis.length){ const v = pick(vis); v.state = 'secret'; dm.push('A door seals itself into the wall — it is secret now.'); }
        else {
          const ways = f.grid.map((_, i) => isDoorway(f, i) && !doorAt(f, i) ? i : -1).filter(i => i >= 0);
          if (ways.length){ f.doors.push({ id:f.nextObj++, i:pick(ways), state:'secret', dc:15 }); dm.push('A doorway seals itself — it is secret now.'); }
        }
      }
    }
  }
  sfx('grind');
  carve(f, here().map(t => ({ x:t.x, y:t.y })));
  if (rewired) placeDoors(f, Math.random, { doors:.3, locked:.1, secret:.05 });
  const gridChanged = f.grid.join('') !== oldGrid.join('');
  if (gridChanged) animateGridChange(L, oldGrid, f.grid); else buildFloor(L);
  if (belowChanged){ if (below.grid.join('') !== oldBelow.join('')) animateGridChange(L + 1, oldBelow, below.grid); else buildFloor(L + 1); }
  updateVision(); clearReach(); syncTokens();
  const sc = { kind:'', title:row.name, sub:`Shift d100 = ${roll === 100 ? '00' : roll} · ${f.name}`, flair:row.text || why || 'Stone grinds against stone. The way you came is not the way back.' };
  showCard({ ...sc, lines:dm.map(l => `<span class="muted">DM:</span> ${esc(l)}`) }, false); broadcast({ t:'card', c:sc });
  log(`⟲ ${why || 'The halls shift'} — ${f.name}: ${row.name} (${roll === 100 ? '00' : roll}).`);
  const zs = zoneSource(L);
  later.forEach((fx, k) => setTimeout(() => { runFx(zs, fx); changed(); }, 1900 + k * 250));
  setTimeout(() => { const t = ui.selected && tokById(ui.selected); if (t && isDM()) showReach(t); }, 1900);
  changed();
  return row;
}
