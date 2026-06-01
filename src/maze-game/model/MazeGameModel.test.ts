import { describe, expect, it } from "vitest";
import { ControlMode } from "./ControlMode.js";
import { LevelKey } from "./Levels.js";
import MazeGameConstants from "./MazeGameConstants.js";
import { MazeGameModel } from "./MazeGameModel.js";

const FIXED_DT = MazeGameConstants.FIXED_DT;

/** Level 1 has a vertical wall strip starting at column 7, row 3. */
const LEVEL1_WALL_COL = 7;
const LEVEL1_WALL_ROW = 3;

describe("MazeGameModel", () => {
  it("increments collisions only on false-to-true wall contact", () => {
    const model = new MazeGameModel();
    model.changeLevel(LevelKey.LEVEL_1);
    model.setControlMode(ControlMode.POSITION);
    const level = model.levelProperty.value;
    const { x: wallX, y } = level.tileCenter(LEVEL1_WALL_COL, LEVEL1_WALL_ROW);
    model.particle.setPositionXY(wallX, y);

    for (let i = 0; i < 5; i++) {
      model.step(FIXED_DT);
    }
    expect(model.collisionsProperty.value).toBe(1);

    for (let i = 0; i < 5; i++) {
      model.step(FIXED_DT);
    }
    expect(model.collisionsProperty.value).toBe(1);
  });

  it("does not win after a collision even at finish", () => {
    const model = new MazeGameModel();
    model.changeLevel(LevelKey.LEVEL_1);
    model.setControlMode(ControlMode.POSITION);
    const level = model.levelProperty.value;
    const { x: wallX, y: wallY } = level.tileCenter(LEVEL1_WALL_COL, LEVEL1_WALL_ROW);
    model.particle.setPositionXY(wallX, wallY);
    model.step(FIXED_DT);

    const finish = level.finishPosition();
    const finishCenter = level.tileCenter(finish.col, finish.row);
    model.particle.setPositionXY(finishCenter.x, finishCenter.y);
    model.step(FIXED_DT);

    expect(model.wonProperty.value).toBe(false);
    expect(model.collisionsProperty.value).toBeGreaterThan(0);
  });

  it("wins with zero collisions when touching finish", () => {
    const model = new MazeGameModel();
    model.setControlMode(ControlMode.POSITION);
    const finish = model.levelProperty.value.finishPosition();
    const center = model.levelProperty.value.tileCenter(finish.col, finish.row);
    model.particle.setPositionXY(center.x, center.y);
    model.step(FIXED_DT);
    expect(model.wonProperty.value).toBe(true);
  });

  it("does not tunnel into a wall under sustained acceleration", () => {
    const model = new MazeGameModel();
    model.changeLevel(LevelKey.LEVEL_1);
    model.setControlMode(ControlMode.ACCELERATION);
    const level = model.levelProperty.value;
    const { x: wallX, y } = level.tileCenter(LEVEL1_WALL_COL, LEVEL1_WALL_ROW);
    const approachX = wallX - MazeGameConstants.TILE_SIZE * 0.6;
    model.particle.setPositionXY(approachX, y);
    model.particle.setAccelerationXY(MazeGameConstants.ACCELERATION_SCALE, 0);

    for (let i = 0; i < 120; i++) {
      model.step(FIXED_DT);
    }

    expect(model.particle.position.x).toBeLessThan(wallX);
    expect(model.particle.velocity.x).toBe(0);
    expect(model.particle.acceleration.x).toBe(0);
  });

  it("holds position when already overlapping a wall in acceleration mode", () => {
    const model = new MazeGameModel();
    model.changeLevel(LevelKey.LEVEL_1);
    model.setControlMode(ControlMode.ACCELERATION);
    const level = model.levelProperty.value;
    const { x: wallX, y } = level.tileCenter(LEVEL1_WALL_COL, LEVEL1_WALL_ROW);
    model.particle.setPositionXY(wallX, y);
    model.particle.setAccelerationXY(2, 0);

    const xBefore = model.particle.position.x;
    for (let i = 0; i < 30; i++) {
      model.step(FIXED_DT);
    }

    expect(model.particle.position.x).toBe(xBefore);
    expect(model.particle.velocity.x).toBe(0);
    expect(model.particle.acceleration.x).toBe(0);
  });
});
