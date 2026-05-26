/**
 * MazeGameConstants.ts
 *
 * Physics and layout constants for the Maze Game model.
 */

const MazeGameConstants = {
  // Tile size in model (meters). The level grid is 32 wide × 14 tall, so the
  // playable area spans 32 m × 14 m centered at the model origin.
  TILE_SIZE: 1,

  // Player particle radius in model meters. 0.375 m matches the pixi original.
  PARTICLE_RADIUS: 0.375,

  // Grid dimensions (must match every level's ASCII grid).
  LEVEL_WIDTH: 32,
  LEVEL_HEIGHT: 14,

  // Drag-pad → model scaling for non-position modes (matches the pixi original).
  // The pad's half-extent maps to ±VELOCITY_SCALE m/s when in Velocity mode and
  // ±ACCELERATION_SCALE m/s² when in Acceleration mode.
  VELOCITY_SCALE: 8,
  ACCELERATION_SCALE: 2,

  // Keyboard input step magnitudes.
  //   POSITION: meters per key press
  //   VELOCITY: m/s per key press (absolute, not incremental)
  //   ACCELERATION: m/s² per key press (absolute, not incremental)
  KEYBOARD_POSITION_STEP: 0.5,
  KEYBOARD_VELOCITY_MAGNITUDE: 4,
  KEYBOARD_ACCELERATION_MAGNITUDE: 1,

  // Side length (px) of the square drag-pad inside the control panel.
  REMOTE_PAD_SIZE: 160,

  // Visual: particle alpha when colliding (creates the flicker effect).
  PARTICLE_COLLIDING_OPACITY: 0.4,

  // Visual: how fast the colliding-flicker toggles, in seconds per toggle.
  FLICKER_PERIOD_SECONDS: 0.08,

  // Fixed-timestep substep size (seconds). The Sim's per-frame dt is accumulated
  // and stepped in slices of this size so physics integration is independent
  // of frame rate.
  FIXED_DT: 1 / 60,

  // Maximum substeps run in a single frame. Prevents a death-spiral if the tab
  // is backgrounded and dt explodes.
  MAX_CATCHUP_STEPS: 5,

  // Seconds for one win-pulse cycle (scale 0.5 → 1.6, alpha 1 → 0).
  WIN_PULSE_DURATION: 1.4,

  // Stroke width (px) of the win-pulse ring.
  WIN_PULSE_STROKE: 3,
} as const;

export default MazeGameConstants;
