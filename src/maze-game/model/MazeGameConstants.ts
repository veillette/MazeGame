/**
 * MazeGameConstants.ts
 *
 * Physics and layout constants for the Maze Game model.
 */

const TILE_SIZE = 1;
const LEVEL_WIDTH = 32;
const LEVEL_HEIGHT = 14;

const MazeGameConstants = {
  // Tile size in model (meters). The level grid is 32 wide × 14 tall, so the
  // playable area spans 32 m × 14 m centered at the model origin.
  TILE_SIZE,

  // Player particle radius in model meters. 0.375 m matches the pixi original.
  PARTICLE_RADIUS: 0.375,

  // Minimum model-space movement before appending another trace vertex.
  TRACE_MIN_SEGMENT_MODEL: TILE_SIZE * 0.02,

  // Grid dimensions (must match every level's ASCII grid).
  LEVEL_WIDTH,
  LEVEL_HEIGHT,

  // Playable model area (meters), derived from grid dimensions × tile size.
  LEVEL_MODEL_WIDTH: LEVEL_WIDTH * TILE_SIZE,
  LEVEL_MODEL_HEIGHT: LEVEL_HEIGHT * TILE_SIZE,

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

  // Keyboard input logic constants (key layout lives in MazeGameHotkeyData).
  KEYBOARD_STOP_KEY: "space",
  KEYBOARD_AXIS_BY_KEY: {
    arrowLeft: [-1, 0],
    a: [-1, 0],
    arrowRight: [1, 0],
    d: [1, 0],
    arrowUp: [0, -1],
    w: [0, -1],
    arrowDown: [0, 1],
    s: [0, 1],
  } as const,

  // SoundClip output levels (0–1).
  SOUND_COLLISION_OUTPUT_LEVEL: 0.5,
  SOUND_WIN_OUTPUT_LEVEL: 0.7,
  SOUND_MODE_OUTPUT_LEVEL: 0.3,
  SOUND_VELOCITY_SONIFICATION_OUTPUT_LEVEL: 0.25,

  // Upper bound (m/s) for mapping velocity magnitude to sonification playback rate.
  VELOCITY_SONIFICATION_MAX: 8,

  // Wall-collision haptic pulse duration in milliseconds (Web Vibration API).
  COLLISION_VIBRATION_MS: 50,

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

  // Seconds for one win-pulse cycle (scale 0.6 → 1.8, alpha 1 → 0).
  WIN_PULSE_DURATION: 1.4,

  // Stroke width (px) of the win-pulse ring.
  WIN_PULSE_STROKE: 3,

  // Gap (view px) between the finish tile top edge and the "Goal!" label bottom.
  GOAL_LABEL_GAP_VIEW: 6,

  // Max width (px) for HUD warning text so long locales do not overlap the arena.
  HUD_WARNING_MAX_WIDTH: 220,

  // Minimum particle pointer target radius in view coordinates (44 px touch target).
  PARTICLE_MIN_TOUCH_RADIUS_VIEW: 22,

  // Visible help callout when the user clicks the particle instead of using controls.
  PARTICLE_HELP_CALLOUT_MAX_WIDTH: 260,
  PARTICLE_HELP_CALLOUT_OFFSET_VIEW: 14,
  PARTICLE_HELP_VISIBLE_DURATION_MS: 3000,
  PARTICLE_HELP_FADE_DURATION: 0.4,

  // Shared Panel chrome for right-column UI (ControlPanel, LevelSelector, HudNode).
  PANEL_CORNER_RADIUS: 6,
  PANEL_X_MARGIN: 12,
  PANEL_Y_MARGIN: 10,
  HUD_PANEL_Y_MARGIN: 8,
} as const;

export default MazeGameConstants;
