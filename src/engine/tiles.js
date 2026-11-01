/* Tile codes for floor grids. A grid is a flat array, index = y * W + x. */
export const T = { ROCK:0, ROOM:1, HALL:2, DOWN:3, UP:4 };
export const walk = v => v > 0;
// One level of raised ground outdoors (a rise, a knoll, Yester Hill's top), in world units. See engine/generator.js riseHeights().
export const STEP_H = .35;
