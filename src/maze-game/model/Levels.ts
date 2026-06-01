/**
 * Levels.ts
 *
 * The four built-in maze layouts. ASCII grids copied verbatim from the pixi
 * MazeGame so collision geometry matches exactly.
 *
 *   ' ' floor    'W' wall    'S' start    'F' finish
 */

import { assertSlow } from "scenerystack/assert";
import Level from "./Level.js";
import { TileType } from "./TileType.js";

type LevelChar = " " | "W" | "S" | "F";

const charToTile: Record<LevelChar, TileType> = {
  " ": TileType.FLOOR,
  W: TileType.WALL,
  S: TileType.START,
  F: TileType.FINISH,
};

const PRACTICE: readonly string[] = [
  "                                ",
  "                           S    ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "                                ",
  "   F                            ",
  "                                ",
  "                                ",
  "                                ",
];

const LEVEL_1: readonly string[] = [
  "                                ",
  "                           S    ",
  "                                ",
  "       W                        ",
  "       W                        ",
  "       WWWWWWWWWWWWWWWWWW       ",
  "                        W       ",
  "                        W       ",
  "                                ",
  "                                ",
  "   F                            ",
  "                                ",
  "                                ",
  "                                ",
];

const LEVEL_2: readonly string[] = [
  "W                              W",
  "W      WWWWWWWWWWWWWWWW    S   W",
  "W      W                       W",
  "W      W                       W",
  "W      W   WWWWWWWWWWWWWWWWW   W",
  "W      W   W                   W",
  "W      W   W                   W",
  "W          W                   W",
  "W          W                   W",
  "W          W                   W",
  "W  F       WWWWWWWWWWWWWWWWW   W",
  "W                              W",
  "W                              W",
  "W                              W",
];

const CERTAIN_DEATH: readonly string[] = [
  "       WWWWWWWWWWWWWWWWW       W",
  "  W W  W     W     W   W   S   W",
  "       W     W     W   W       W",
  "  WWW  W  W     W              W",
  " W   W W  W     W          WWWWW",
  "       W  WWWWWWW  W  W W      W",
  "WWWWWWWW  W     W  W           W",
  "W         W     W  W W   W     W",
  "W            W     W  WWW  W  WW",
  "W      W     W     W       W   W",
  "W  F   WWWWWWWWWWWWWWWWWWWWW   W",
  "W        W     W     W     W  WW",
  "W           W     W     W      W",
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
];

export const LevelKey = {
  PRACTICE: "practice",
  LEVEL_1: "level1",
  LEVEL_2: "level2",
  CERTAIN_DEATH: "certainDeath",
} as const;

export type LevelKey = (typeof LevelKey)[keyof typeof LevelKey];

export const LEVEL_KEYS: readonly LevelKey[] = [
  LevelKey.PRACTICE,
  LevelKey.LEVEL_1,
  LevelKey.LEVEL_2,
  LevelKey.CERTAIN_DEATH,
];

export const LEVELS: Record<LevelKey, Level> = {
  [LevelKey.PRACTICE]: Level.fromStringArray(PRACTICE, charToTile),
  [LevelKey.LEVEL_1]: Level.fromStringArray(LEVEL_1, charToTile),
  [LevelKey.LEVEL_2]: Level.fromStringArray(LEVEL_2, charToTile),
  [LevelKey.CERTAIN_DEATH]: Level.fromStringArray(CERTAIN_DEATH, charToTile),
};

const countTiles = (level: Level, type: TileType): number => {
  let count = 0;
  for (const row of level.data) {
    for (const cell of row) {
      if (cell === type) {
        count++;
      }
    }
  }
  return count;
};

const assertBuiltInLevelInvariants = (level: Level, name: string): void => {
  assertSlow?.(
    countTiles(level, TileType.START) === 1 && countTiles(level, TileType.FINISH) === 1,
    `${name}: level must have exactly one START and one FINISH`,
  );
};

for (const key of LEVEL_KEYS) {
  assertBuiltInLevelInvariants(LEVELS[key], key);
}

assertSlow?.(
  LEVEL_KEYS.length === Object.keys(LEVELS).length && LEVEL_KEYS.every((key) => key in LEVELS),
  "LEVEL_KEYS must match LEVELS keys",
);
