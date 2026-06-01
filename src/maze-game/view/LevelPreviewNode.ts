/**
 * LevelPreviewNode.ts
 *
 * Static mini maze thumbnail used as the icon on Vegas level-selection buttons.
 */

import { Node, Rectangle } from "scenerystack/scenery";
import MazeGameColors from "../../MazeGameColors.js";
import type Level from "../model/Level.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import { TileType } from "../model/TileType.js";

const PREVIEW_SIZE = 48;

const FILL_BY_TILE = {
  [TileType.FLOOR]: MazeGameColors.floorColorProperty,
  [TileType.WALL]: MazeGameColors.wallColorProperty,
  [TileType.START]: MazeGameColors.startTileColorProperty,
  [TileType.FINISH]: MazeGameColors.finishColorProperty,
} as const;

export default class LevelPreviewNode extends Node {
  public constructor(level: Level, size = PREVIEW_SIZE) {
    super();

    const cols = MazeGameConstants.LEVEL_WIDTH;
    const rows = MazeGameConstants.LEVEL_HEIGHT;
    const tileSize = Math.min(size / cols, size / rows);
    const mazeWidth = cols * tileSize;
    const mazeHeight = rows * tileSize;
    const offsetX = (size - mazeWidth) / 2;
    const offsetY = (size - mazeHeight) / 2;

    const background = new Rectangle(0, 0, size, size, {
      fill: MazeGameColors.floorColorProperty,
      cornerRadius: 2,
    });
    this.addChild(background);

    for (let r = 0; r < level.data.length; r++) {
      const row = level.data[r];
      if (!row) {
        continue;
      }
      for (let c = 0; c < row.length; c++) {
        const tile = row[c];
        if (tile === undefined || tile === TileType.FLOOR) {
          continue;
        }
        this.addChild(
          new Rectangle(offsetX + c * tileSize, offsetY + r * tileSize, tileSize, tileSize, {
            fill: FILL_BY_TILE[tile],
          }),
        );
      }
    }
  }
}
