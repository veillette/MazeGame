/**
 * Level.ts
 *
 * Tile-grid data plus coordinate conversions and circle/wall collision math.
 *
 * Ported from the pixi MazeGame's `models/level.js`. The grid is 32 × 14 tiles,
 * each 1 model meter on a side, centered at the model origin so the playable
 * area spans x ∈ [-16, 16], y ∈ [-7, 7] (TILE_SIZE = 1).
 */

import { assert, assertSlow } from "scenerystack/assert";
import MazeGameConstants from "./MazeGameConstants.js";
import { TileType } from "./TileType.js";

const { TILE_SIZE, LEVEL_WIDTH, LEVEL_HEIGHT } = MazeGameConstants;
const HALF_WIDTH = LEVEL_WIDTH / 2;
const HALF_HEIGHT = LEVEL_HEIGHT / 2;

export interface GridPosition {
  readonly col: number;
  readonly row: number;
}

export default class Level {
  public static readonly WIDTH = LEVEL_WIDTH;
  public static readonly HEIGHT = LEVEL_HEIGHT;

  /** Build a Level from an ASCII grid + a char-to-tile-value map. */
  public static fromStringArray(rows: readonly string[], charToTile: Record<string, TileType>): Level {
    if (rows.length !== LEVEL_HEIGHT) {
      throw new Error(`Level must have exactly ${LEVEL_HEIGHT} rows; got ${rows.length}`);
    }
    const data: TileType[][] = [];
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] ?? "";
      if (row.length !== LEVEL_WIDTH) {
        throw new Error(`Level row ${r} must be exactly ${LEVEL_WIDTH} chars; got ${row.length}`);
      }
      const cells: TileType[] = [];
      for (let c = 0; c < row.length; c++) {
        const ch = row.charAt(c);
        const value = charToTile[ch];
        if (value === undefined) {
          throw new Error(`Unknown level character "${ch}" at row ${r} col ${c}`);
        }
        cells.push(value);
      }
      data.push(cells);
    }
    return new Level(data);
  }

  public readonly data: ReadonlyArray<ReadonlyArray<TileType>>;

  public constructor(data: ReadonlyArray<ReadonlyArray<TileType>>) {
    this.data = data;
  }

  // ── Grid ↔ model coordinate conversions ────────────────────────────────────

  public xToCol(x: number): number {
    return Math.floor(x / TILE_SIZE) + HALF_WIDTH;
  }

  public yToRow(y: number): number {
    return Math.floor(y / TILE_SIZE) + HALF_HEIGHT;
  }

  /** Returns the model x of the LEFT edge of column `col`. */
  public colToX(col: number): number {
    return (col - HALF_WIDTH) * TILE_SIZE;
  }

  /** Returns the model y of the TOP edge of row `row`. */
  public rowToY(row: number): number {
    return (row - HALF_HEIGHT) * TILE_SIZE;
  }

  public inBounds(col: number, row: number): boolean {
    return row >= 0 && row < LEVEL_HEIGHT && col >= 0 && col < LEVEL_WIDTH;
  }

  public tileAt(x: number, y: number): TileType {
    const row = this.yToRow(y);
    const col = this.xToCol(x);
    if (!this.inBounds(col, row)) {
      return TileType.WALL;
    }
    return this.data[row]?.[col] ?? TileType.WALL;
  }

  /**
   * Does a circle at (x, y) with the given radius touch any tile of the given
   * type? Mirrors the pixi algorithm: cheap point-in-tile check first, then
   * AABB-vs-circle overlap on the up-to-9 neighbour tiles.
   */
  public collidesWithTileTypeAt(type: TileType, x: number, y: number, radius: number): boolean {
    assert && assert(radius >= 0 && Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(radius));
    const cCenter = this.xToCol(x);
    const rCenter = this.yToRow(y);
    if (this.inBounds(cCenter, rCenter) && this.data[rCenter]?.[cCenter] === type) {
      return true;
    }

    const offsets: ReadonlyArray<readonly [number, number]> = [
      [-radius, -radius],
      [-radius, 0],
      [-radius, radius],
      [0, -radius],
      [0, radius],
      [radius, -radius],
      [radius, 0],
      [radius, radius],
    ];

    for (const [dx, dy] of offsets) {
      const col = this.xToCol(x + dx);
      const row = this.yToRow(y + dy);
      if (!this.inBounds(col, row) || this.data[row]?.[col] !== type) {
        continue;
      }
      const tileMinX = this.colToX(col);
      const tileMinY = this.rowToY(row);
      const cx = Math.max(tileMinX, Math.min(x, tileMinX + TILE_SIZE));
      const cy = Math.max(tileMinY, Math.min(y, tileMinY + TILE_SIZE));
      const ddx = x - cx;
      const ddy = y - cy;
      if (ddx * ddx + ddy * ddy <= radius * radius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Binary-search along the segment from (safeX, safeY) toward (testX, testY)
   * for the last point that does not collide with the given tile type.
   */
  public findLastNonCollidingPoint(
    type: TileType,
    safeX: number,
    safeY: number,
    testX: number,
    testY: number,
    radius: number,
    iterations = 8,
  ): { x: number; y: number } {
    assert &&
      assert(
        !this.collidesWithTileTypeAt(type, safeX, safeY, radius),
        "findLastNonCollidingPoint requires a non-colliding safe point",
      );
    let sx = safeX;
    let sy = safeY;
    let tx = testX;
    let ty = testY;
    for (let i = 0; i < iterations; i++) {
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2;
      if (this.collidesWithTileTypeAt(type, midX, midY, radius)) {
        tx = midX;
        ty = midY;
      } else {
        sx = midX;
        sy = midY;
      }
    }
    assertSlow &&
      assertSlow(
        !this.collidesWithTileTypeAt(type, sx, sy, radius),
        "findLastNonCollidingPoint must return a non-colliding point",
      );
    return { x: sx, y: sy };
  }

  private findFirst(type: TileType): GridPosition {
    for (let r = 0; r < this.data.length; r++) {
      const row = this.data[r];
      if (!row) {
        continue;
      }
      for (let c = 0; c < row.length; c++) {
        if (row[c] === type) {
          return { col: c, row: r };
        }
      }
    }
    throw new Error(`No tile of type ${type} found in level`);
  }

  public startPosition(): GridPosition {
    return this.findFirst(TileType.START);
  }

  public finishPosition(): GridPosition {
    return this.findFirst(TileType.FINISH);
  }

  /** Center-of-tile position (model coords) for the given grid cell. */
  public tileCenter(col: number, row: number): { x: number; y: number } {
    assert && assert(this.inBounds(col, row), `tileCenter out of bounds: col=${col} row=${row}`);
    return {
      x: this.colToX(col) + TILE_SIZE / 2,
      y: this.rowToY(row) + TILE_SIZE / 2,
    };
  }
}
