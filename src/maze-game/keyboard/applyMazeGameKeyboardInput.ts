/**
 * applyMazeGameKeyboardInput.ts
 *
 * Shared keyboard input logic for the global listener and the focused control pad.
 */

import { ControlMode } from "../model/ControlMode.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

type AxisKey = keyof typeof MazeGameConstants.KEYBOARD_AXIS_BY_KEY;

function isAxisKey(key: string): key is AxisKey {
  return key in MazeGameConstants.KEYBOARD_AXIS_BY_KEY;
}

function axisForKey(key: string): readonly [number, number] | null {
  if (!isAxisKey(key)) {
    return null;
  }
  return MazeGameConstants.KEYBOARD_AXIS_BY_KEY[key];
}

export const applyMazeGameKeyboardInput = (model: MazeGameModel, keysPressed: string): void => {
  if (model.wonProperty.value) {
    return;
  }

  const activeKeys = keysPressed.split("+");
  const mode = model.controlModeProperty.value;

  if (activeKeys.includes(MazeGameConstants.KEYBOARD_STOP_KEY)) {
    if (mode === ControlMode.VELOCITY) {
      model.particle.setVelocityXY(0, 0);
    } else if (mode === ControlMode.ACCELERATION) {
      model.particle.setAccelerationXY(0, 0);
    }
    return;
  }

  let dx = 0;
  let dy = 0;
  for (const key of activeKeys) {
    const axis = axisForKey(key);
    if (axis) {
      dx += axis[0];
      dy += axis[1];
    }
  }
  if (dx === 0 && dy === 0) {
    return;
  }

  if (mode === ControlMode.POSITION) {
    const step = MazeGameConstants.KEYBOARD_POSITION_STEP;
    const p = model.particle.position;
    model.particle.setPositionXY(p.x + dx * step, p.y + dy * step);
  } else if (mode === ControlMode.VELOCITY) {
    const m = MazeGameConstants.KEYBOARD_VELOCITY_MAGNITUDE;
    model.particle.setVelocityXY(dx * m, dy * m);
  } else {
    const m = MazeGameConstants.KEYBOARD_ACCELERATION_MAGNITUDE;
    model.particle.setAccelerationXY(dx * m, dy * m);
  }
};
