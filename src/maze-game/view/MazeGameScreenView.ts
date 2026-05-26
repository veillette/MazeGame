/**
 * MazeGameScreenView.ts
 *
 * Top-level view. Lays out:
 *   - The maze arena (left).
 *   - The right column: control-mode panel, level selector, HUD (which now
 *     includes the Reset Level button).
 *   - A ResetAllButton bottom-right.
 *
 * Keyboard input is wired through SceneryStack's KeyboardListener (global
 * scope) so it integrates with the focus / hotkey system instead of bypassing
 * it via window.addEventListener. Each recognized key translates to a model
 * action based on the active ControlMode.
 *
 * Forwards step(dt) to ArenaNode so the win-celebration ring animates.
 */

import { Bounds2, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { KeyboardListener } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { ControlMode } from "../model/ControlMode.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";
import ArenaNode from "./ArenaNode.js";
import ControlPanel from "./ControlPanel.js";
import HudNode from "./HudNode.js";
import LevelSelector from "./LevelSelector.js";

type MazeGameScreenViewOptions = ScreenViewOptions & { tandem: Tandem };

const MARGIN = 14;

// Width (px) reserved on the right side for the panel column.
const RIGHT_COLUMN_WIDTH = 240;

// Vertical gap between right-column panels.
const RIGHT_COLUMN_GAP = 10;

// Keys this view responds to. Movement keys → an [x, y] unit vector applied
// to the active kinematic Property; "space" zeroes velocity / acceleration.
// Typed as OneKeyStroke[] (any single-key stroke string is valid).
const KEYS = ["arrowLeft", "arrowRight", "arrowUp", "arrowDown", "a", "d", "w", "s", "space"] as ReadonlyArray<
  "arrowLeft" | "arrowRight" | "arrowUp" | "arrowDown" | "a" | "d" | "w" | "s" | "space"
>;

function axisForKey(key: string): readonly [number, number] | "zero" | null {
  switch (key) {
    case "arrowLeft":
    case "a":
      return [-1, 0];
    case "arrowRight":
    case "d":
      return [1, 0];
    case "arrowUp":
    case "w":
      // Screen +Y is down, so "up" decreases y.
      return [0, -1];
    case "arrowDown":
    case "s":
      return [0, 1];
    case "space":
      return "zero";
    default:
      return null;
  }
}

export class MazeGameScreenView extends ScreenView {
  private readonly arenaNode: ArenaNode;

  public constructor(model: MazeGameModel, providedOptions: MazeGameScreenViewOptions) {
    super(providedOptions);

    const layoutBounds = this.layoutBounds;

    // ── Arena layout ────────────────────────────────────────────────────────
    const arenaLeft = MARGIN;
    const arenaTop = MARGIN;
    const arenaRight = layoutBounds.maxX - RIGHT_COLUMN_WIDTH - 2 * MARGIN;
    const arenaBottom = layoutBounds.maxY - MARGIN;
    const arenaWidth = arenaRight - arenaLeft;
    const arenaHeight = arenaBottom - arenaTop;

    const modelLevelWidth = MazeGameConstants.LEVEL_WIDTH * MazeGameConstants.TILE_SIZE;
    const modelLevelHeight = MazeGameConstants.LEVEL_HEIGHT * MazeGameConstants.TILE_SIZE;
    const scale = Math.min(arenaWidth / modelLevelWidth, arenaHeight / modelLevelHeight);

    const arenaCenterX = arenaLeft + arenaWidth / 2;
    const arenaCenterY = arenaTop + arenaHeight / 2;

    const modelViewTransform = ModelViewTransform2.createSinglePointScaleMapping(
      Vector2.ZERO,
      new Vector2(arenaCenterX, arenaCenterY),
      scale,
    );

    const arenaViewMinX = modelViewTransform.modelToViewX(-modelLevelWidth / 2);
    const arenaViewMinY = modelViewTransform.modelToViewY(-modelLevelHeight / 2);
    const arenaViewMaxX = modelViewTransform.modelToViewX(modelLevelWidth / 2);
    const arenaViewMaxY = modelViewTransform.modelToViewY(modelLevelHeight / 2);
    const arenaBounds = new Bounds2(arenaViewMinX, arenaViewMinY, arenaViewMaxX, arenaViewMaxY);

    // ── Children ────────────────────────────────────────────────────────────
    this.arenaNode = new ArenaNode(model, modelViewTransform, arenaBounds);

    const controlPanel = new ControlPanel(model);
    controlPanel.right = layoutBounds.maxX - MARGIN;
    controlPanel.top = MARGIN;

    const levelSelector = new LevelSelector(model);
    levelSelector.right = layoutBounds.maxX - MARGIN;
    levelSelector.top = controlPanel.bottom + RIGHT_COLUMN_GAP;

    const hudNode = new HudNode(model);
    hudNode.right = layoutBounds.maxX - MARGIN;
    hudNode.top = levelSelector.bottom + RIGHT_COLUMN_GAP;

    const resetAllButton = new ResetAllButton({
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
      },
      right: layoutBounds.maxX - MARGIN,
      bottom: layoutBounds.maxY - MARGIN,
      tandem: providedOptions.tandem.createTandem("resetAllButton"),
    });

    this.children = [this.arenaNode, controlPanel, levelSelector, hudNode, resetAllButton];

    // ── Keyboard input ──────────────────────────────────────────────────────
    // Registered globally so the user can press keys regardless of where focus
    // is in the document; SceneryStack routes through its hotkey/focus system.
    KeyboardListener.createGlobal(this, {
      keys: [...KEYS],
      fireOnHold: true,
      fire: (_event, keysPressed) => {
        const axis = axisForKey(keysPressed);
        if (axis === null) {
          return;
        }
        const mode = model.controlModeProperty.value;
        if (axis === "zero") {
          if (mode === ControlMode.VELOCITY) {
            model.particle.setVelocityXY(0, 0);
          } else if (mode === ControlMode.ACCELERATION) {
            model.particle.setAccelerationXY(0, 0);
          }
          return;
        }
        const [dx, dy] = axis;
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
      },
    });
  }

  public override step(dt: number): void {
    this.arenaNode.step(dt);
  }
}
