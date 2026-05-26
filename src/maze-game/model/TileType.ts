/**
 * TileType.ts
 *
 * The four possible tile kinds in a level grid.
 */

export const TileType = {
  FLOOR: 0,
  WALL: 1,
  START: 2,
  FINISH: 3,
} as const;

export type TileType = (typeof TileType)[keyof typeof TileType];
