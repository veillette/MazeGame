/**
 * ControlMode.ts
 *
 * Which kinematic quantity the user is steering: position, velocity, or
 * acceleration. Used by the radio button group in the ControlPanel, the
 * drag-pad in that panel, and the keyboard listener in MazeGameScreenView.
 */

export const ControlMode = {
  POSITION: "position",
  VELOCITY: "velocity",
  ACCELERATION: "acceleration",
} as const;

export type ControlMode = (typeof ControlMode)[keyof typeof ControlMode];
