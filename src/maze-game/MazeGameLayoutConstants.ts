/**
 * MazeGameLayoutConstants.ts
 *
 * View layout, typography, and shared chrome dimensions (screen margins, arrows, fonts).
 * Physics and simulation values remain in model/MazeGameConstants.ts.
 */

const MazeGameLayoutConstants = {
  SCREEN_MARGIN: 14,
  RIGHT_COLUMN_WIDTH: 240,
  RIGHT_COLUMN_GAP: 10,

  // Vector arrows on the arena (model-space vectors drawn in the play area).
  ARENA_ARROW_HEAD_WIDTH: 12,
  ARENA_ARROW_HEAD_HEIGHT: 12,
  ARENA_ARROW_TAIL_WIDTH: 4,
  ARENA_ARROW_TILE_LENGTHS: 2.0,
  ARENA_ARROW_MIN_MAGNITUDE: 0.01,

  // Vector arrow on the control-pad (slightly larger for legibility at pad scale).
  PAD_ARROW_HEAD_WIDTH: 14,
  PAD_ARROW_HEAD_HEIGHT: 14,
  PAD_ARROW_TAIL_WIDTH: 5,

  CONTROL_PANEL_TITLE_FONT_SIZE: 16,
  CONTROL_PANEL_TAB_FONT_SIZE: 13,
  CONTROL_PANEL_KNOB_RADIUS: 9,
  CONTROL_PANEL_TAB_SPACING: 4,
  CONTROL_PANEL_PAD_CORNER_RADIUS: 4,
  CONTROL_PANEL_VBOX_SPACING: 8,

  HUD_VALUE_FONT_SIZE: 14,
  HUD_WARNING_FONT_SIZE: 12,
  HUD_COLLISION_MARKER_FONT_SIZE: 16,
  HUD_HBOX_SPACING: 6,
  HUD_VBOX_SPACING: 6,
  HUD_CLOCK_ICON_RADIUS: 11,
  HUD_COLLISIONS_MAX: 9999,

  ARENA_GOAL_FONT_SIZE: 22,
  ARENA_WIN_RING_RADIUS_FACTOR: 0.6,
  ARENA_WALL_LINE_WIDTH: 1,
  ARENA_WIN_PULSE_MIN_SCALE: 0.6,
  ARENA_WIN_PULSE_MAX_SCALE: 1.8,
} as const;

export default MazeGameLayoutConstants;
