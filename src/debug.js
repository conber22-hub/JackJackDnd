/* Console handle (window.DreadDelve) — used by the smoke test and handy when poking at a delve. */
import { state as _s, ui, tokById } from './engine/state.js';
import * as stateMod from './engine/state.js';
import { BEST } from './data/bestiary.js';
import { reach } from './engine/grid.js';
import { shiftFloor } from './game/shift.js';
import { whimRoll, whimStep } from './game/whim.js';
import { rollInitiative, nextTurn, placeMonster, doAttack, runFx, useSpecial, kill, applyDamage, infest } from './game/combat.js';
import { select, doMove, requestMove, setView, goFloor, takeStairs, setDread, doorAction, search, triggerTrap, fall } from './game/actions.js';
import { commitRoom, commitCorridor, placeDoorAt, placeTrapAt, placeStairsAt, placePropAt, placeHouseAt, eraseAt, importMap, newDelve, addFloorBelow, populate, setAutoLink } from './game/build.js';
import { undo, serialize } from './game/session.js';
import { setMode } from './ui/input.js';
import { focusTile } from './render/scene.js';
void _s;

export const get = () => stateMod.state;
export { ui, tokById, BEST, reach, shiftFloor, whimRoll, whimStep, rollInitiative, nextTurn, placeMonster, doAttack, runFx, useSpecial, kill, applyDamage, infest,
  select, doMove, requestMove, setView, goFloor, takeStairs, setDread, doorAction, search, triggerTrap, fall,
  commitRoom, commitCorridor, placeDoorAt, placeTrapAt, placeStairsAt, placePropAt, placeHouseAt, eraseAt, importMap, newDelve, addFloorBelow, populate, setAutoLink, undo, serialize, setMode, focusTile };
