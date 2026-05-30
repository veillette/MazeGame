/**
 * MazeGameScreenView.ts
 *
 * Top-level view. Lays out:
 *   - The maze arena (left).
 *   - The right column: control-mode panel, level selector, HUD (which now
 *     includes the Reset Level and Next Level buttons).
 *   - A ResetAllButton bottom-right.
 *
 * Keyboard input is wired through SceneryStack's KeyboardListener (global
 * scope) so it integrates with the focus / hotkey system instead of bypassing
 * it via window.addEventListener. Key combinations are split so that holding
 * two direction keys produces a diagonal velocity or acceleration.
 *
 * Forwards step(dt) to ArenaNode so the win-celebration ring and collision
 * flicker animations advance in sync.
 *
 * Sound effects are wired here by linking to model properties and playing
 * built-in tambo SoundClips.
 */

import { Bounds2, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { KeyboardListener } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import {
  SoundClip,
  collect_mp3,
  selectionArpeggio001_mp3,
  soundManager,
  wallContact_mp3,
} from "scenerystack/tambo";
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
const RIGHT_COLUMN_WIDTH = 240;
const RIGHT_COLUMN_GAP = 10;

const KEYS = ["arrowLeft", "arrowRight", "arrowUp", "arrowDown", "a", "d", "w", "s", "space"] as ReadonlyArray<
  "arrowLeft" | "arrowRight" | "arrowUp" | "arrowDown" | "a" | "d" | "w" | "s" | "space"
>;

// Returns the [dx, dy] unit contribution for a single key, or null if unrecognised.
function axisForKey(key: string): readonly [number, number] | null {
  switch (key) {
    case "arrowLeft":
    case "a":
      return [-1, 0];
    case "arrowRight":
    case "d":
      return [1, 0];
    case "arrowUp":
    case "w":
      return [0, -1];
    case "arrowDown":
    case "s":
      return [0, 1];
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
    // Split the keysPressed combination string (e.g. "arrowLeft+arrowUp") so
    // that holding two direction keys contributes both components.  This
    // enables diagonal movement in velocity and acceleration modes.
    KeyboardListener.createGlobal(this, {
      keys: [...KEYS],
      fireOnHold: true,
      fire: (_event, keysPressed) => {
        const activeKeys = String(keysPressed).split("+");
        const mode = model.controlModeProperty.value;

        if (activeKeys.includes("space")) {
          if (mode === ControlMode.VELOCITY) model.particle.setVelocityXY(0, 0);
          else if (mode === ControlMode.ACCELERATION) model.particle.setAccelerationXY(0, 0);
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
        if (dx === 0 && dy === 0) return;

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

    // ── Sound effects ────────────────────────────────────────────────────────
    const collisionSound = new SoundClip(wallContact_mp3, { initialOutputLevel: 0.5 });
    soundManager.addSoundGenerator(collisionSound);
    model.collisionsProperty.link((count, oldCount) => {
      if (oldCount !== null && count > oldCount) {
        collisionSound.play();
      }
    });

    const winSound = new SoundClip(collect_mp3, { initialOutputLevel: 0.7 });
    soundManager.addSoundGenerator(winSound);
    model.wonProperty.link((won) => {
      if (won) winSound.play();
    });

    const modeSound = new SoundClip(selectionArpeggio001_mp3, { initialOutputLevel: 0.3 });
    soundManager.addSoundGenerator(modeSound);
    model.controlModeProperty.lazyLink(() => modeSound.play());
  }

  public override step(dt: number): void {
    this.arenaNode.step(dt);
  }
}
