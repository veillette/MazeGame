/**
 * MazeGameColors.ts
 *
 * All dynamic colors for the simulation. Each ProfileColorProperty has a
 * "default" (dark theme) and "projector" (light theme) value; SceneryStack
 * switches profiles automatically when the user toggles Projector Mode.
 */
import { Color, ProfileColorProperty } from "scenerystack/scenery";
import MazeGameNamespace from "./MazeGameNamespace.js";

const { BLACK, WHITE } = Color;

function profileColor(name: string, def: Color | string, projector: Color | string): ProfileColorProperty {
  return new ProfileColorProperty(MazeGameNamespace, name, { default: def, projector });
}

const PANEL_FILL_DARK = new Color(40, 40, 40);
const PANEL_FILL_LIGHT = new Color(240, 240, 240);
const PANEL_STROKE_DARK = "rgba(255, 255, 255, 0.4)";
const PANEL_STROKE_LIGHT = "rgba(0, 0, 0, 0.4)";

/** Fully transparent fill/stop used for gradient fades and placeholder rectangles. */
export const TRANSPARENT_COLOR = "rgba(0,0,0,0)";

const MazeGameColors = {
  // Screen background.
  backgroundColorProperty: profileColor("background", "#1a1a2e", WHITE),

  // Default text / labels.
  foregroundColorProperty: profileColor("foreground", WHITE, BLACK),

  // Maze tiles.
  floorColorProperty: profileColor("floor", "#2a2a44", "#eeeeee"),
  wallColorProperty: profileColor("wall", "#bdbdbd", "#424242"),
  wallShadowColorProperty: profileColor("wallShadow", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.18)"),

  // Finish tile colors (cycle by game state).
  finishColorProperty: profileColor("finish", "#4caf50", "#2e7d32"),
  finishClosedColorProperty: profileColor("finishClosed", "#e64a19", "#bf360c"),
  finishWonColorProperty: profileColor("finishWon", "#ffeb3b", "#fbc02d"),

  // The player particle.
  particleColorProperty: profileColor("particle", "#e53935", "#b71c1c"),
  particleHighlightColorProperty: profileColor("particleHighlight", "#ff8a80", "#ef5350"),
  particleShadeColorProperty: profileColor("particleShade", "#c62828", "#7f0000"),
  particleStrokeColorProperty: profileColor("particleStroke", "#5d1010", "#4a0000"),
  particleSpecularColorProperty: profileColor("particleSpecular", "rgba(255,255,255,0.75)", "rgba(255,255,255,0.85)"),
  particleGlowColorProperty: profileColor("particleGlow", "rgba(229,57,53,0.35)", "rgba(183,28,28,0.3)"),
  particleTraceColorProperty: profileColor("particleTrace", "rgba(229,57,53,0.55)", "rgba(183,28,28,0.5)"),

  // Goal tile overlay (rings, star, stripes).
  goalMarkerColorProperty: profileColor("goalMarker", "rgba(255,255,255,0.85)", "rgba(255,255,255,0.9)"),
  goalStarFillColorProperty: profileColor("goalStarFill", "rgba(255,235,120,0.9)", "rgba(255,248,180,0.95)"),
  goalStripeColorProperty: profileColor("goalStripe", "rgba(255,255,255,0.22)", "rgba(255,255,255,0.35)"),
  goalTileSheenColorProperty: profileColor("goalTileSheen", "rgba(255,255,255,0.28)", "rgba(255,255,255,0.4)"),

  // Control-pad colors. Same hue across themes (matches the original sim).
  positionVectorProperty: profileColor("positionVector", "#2575BA", "#2575BA"),
  velocityVectorProperty: profileColor("velocityVector", "#CD2520", "#CD2520"),
  accelerationVectorProperty: profileColor("accelerationVector", "#349E34", "#349E34"),

  // Drag-pad surface inside the control panel.
  padFillProperty: profileColor("padFill", "rgba(255,255,255,0.5)", "rgba(255,255,255,0.85)"),

  // Control-pad knob outline.
  knobStrokeProperty: profileColor("knobStroke", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.35)"),

  // Panels.
  panelFillProperty: profileColor("panelFill", PANEL_FILL_DARK, PANEL_FILL_LIGHT),
  panelStrokeProperty: profileColor("panelStroke", PANEL_STROKE_DARK, PANEL_STROKE_LIGHT),

  // Start tile marker (semi-transparent blue).
  startTileColorProperty: profileColor("startTile", "rgba(100,160,255,0.5)", "rgba(50,100,200,0.35)"),

  // Warning text when a collision locks the player out of winning.
  collisionWarningColorProperty: profileColor("collisionWarning", "#ff7043", "#b71c1c"),

  // Reset Level button — same hue across themes.
  resetLevelButtonColorProperty: profileColor("resetLevelButton", "#f6e652", "#f6e652"),

  // Next Level button.
  nextLevelButtonColorProperty: profileColor("nextLevelButton", "#66bb6a", "#388e3c"),

  // Level selector radio button highlight states.
  levelButtonSelectedColorProperty: profileColor("levelButtonSelected", "#66bb6a", "#388e3c"),
  levelButtonUnselectedColorProperty: profileColor("levelButtonUnselected", "#f2ffcc", "#e8f5e9"),

  // Reset All button (bottom-right).
  resetAllButtonColorProperty: profileColor("resetAllButton", "#ff9800", "#ef6c00"),

  // Preferences toggle switch (on state).
  toggleSwitchTrackFillRightProperty: profileColor("toggleSwitchTrackFillRight", "#64bd5a", "#64bd5a"),
};

MazeGameNamespace.register("MazeGameColors", MazeGameColors);

export default MazeGameColors;
