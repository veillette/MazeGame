import { describe, expect, it } from "vitest";
import Level from "./Level.js";
import MazeGameConstants from "./MazeGameConstants.js";
import { TileType } from "./TileType.js";

const charToTile = {
  " ": TileType.FLOOR,
  W: TileType.WALL,
  S: TileType.START,
  F: TileType.FINISH,
} as const satisfies Record<string, TileType>;

const WALL_COL = 10;

/** Minimal 32×14 grid with a vertical wall at column 10 (rows 3–10). */
const WALL_AT_COL_10: readonly string[] = [
  "                                ",
  "              S                 ",
  "                                ",
  "          W                     ",
  "          W                     ",
  "          W                     ",
  "          W                     ",
  "          W                     ",
  "          W                     ",
  "          W                     ",
  "          W                     ",
  "         F                      ",
  "                                ",
  "                                ",
];

function makeTestLevel(): Level {
  return Level.fromStringArray(WALL_AT_COL_10, charToTile);
}

function tileCenter(level: Level, col: number, row: number): { x: number; y: number } {
  return level.tileCenter(col, row);
}

describe("Level", () => {
  it("collidesWithTileTypeAt detects wall overlap", () => {
    const level = makeTestLevel();
    const { x: wallX, y } = tileCenter(level, WALL_COL, 3);
    const radius = MazeGameConstants.PARTICLE_RADIUS;
    expect(level.collidesWithTileTypeAt(TileType.WALL, wallX, y, radius)).toBe(true);
    expect(level.collidesWithTileTypeAt(TileType.WALL, wallX - 2, y, radius)).toBe(false);
  });

  it("findLastNonCollidingPoint returns a non-colliding point along the segment", () => {
    const level = makeTestLevel();
    const { x: wallX, y } = tileCenter(level, WALL_COL, 3);
    const { x: safeX } = tileCenter(level, 8, 3);
    const radius = MazeGameConstants.PARTICLE_RADIUS;
    const result = level.findLastNonCollidingPoint(TileType.WALL, safeX, y, wallX, y, radius);
    expect(level.collidesWithTileTypeAt(TileType.WALL, result.x, result.y, radius)).toBe(false);
    expect(result.x).toBeGreaterThan(safeX);
    expect(result.x).toBeLessThan(wallX);
  });

  it("tileAt treats out-of-bounds as wall", () => {
    const level = makeTestLevel();
    expect(level.tileAt(-100, 0)).toBe(TileType.WALL);
  });
});
