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
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { KeyboardListener } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { collect_mp3, SoundClip, selectionArpeggio001_mp3, soundManager, wallContact_mp3 } from "scenerystack/tambo";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import MazeGameLayoutConstants from "../MazeGameLayoutConstants.js";
import { ControlMode } from "../model/ControlMode.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";
import ArenaNode from "./ArenaNode.js";
import ControlPanel from "./ControlPanel.js";
import HudNode from "./HudNode.js";
import LevelSelector from "./LevelSelector.js";

type MazeGameScreenViewOptions = ScreenViewOptions & { tandem: Tandem };

const KEYS = ["arrowLeft", "arrowRight", "arrowUp", "arrowDown", "a", "d", "w", "s", "space"] as const;

const AXIS_BY_KEY = {
  arrowLeft: [-1, 0],
  a: [-1, 0],
  arrowRight: [1, 0],
  d: [1, 0],
  arrowUp: [0, -1],
  w: [0, -1],
  arrowDown: [0, 1],
  s: [0, 1],
} as const;

type AxisKey = keyof typeof AXIS_BY_KEY;

function isAxisKey(key: string): key is AxisKey {
  return key in AXIS_BY_KEY;
}

function axisForKey(key: string): readonly [number, number] | null {
  if (!isAxisKey(key)) {
    return null;
  }
  return AXIS_BY_KEY[key];
}

type ArenaLayout = {
  modelViewTransform: ModelViewTransform2;
  arenaBounds: Bounds2;
};

function computeArenaLayout(visibleBounds: Bounds2): ArenaLayout {
  const margin = MazeGameLayoutConstants.SCREEN_MARGIN;
  const rightColumnWidth = MazeGameLayoutConstants.RIGHT_COLUMN_WIDTH;

  const arenaLeft = visibleBounds.minX + margin;
  const arenaTop = visibleBounds.minY + margin;
  const arenaRight = visibleBounds.maxX - rightColumnWidth - 2 * margin;
  const arenaBottom = visibleBounds.maxY - margin;
  const arenaWidth = arenaRight - arenaLeft;
  const arenaHeight = arenaBottom - arenaTop;

  const modelLevelWidth = MazeGameConstants.LEVEL_MODEL_WIDTH;
  const modelLevelHeight = MazeGameConstants.LEVEL_MODEL_HEIGHT;
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

  return {
    modelViewTransform,
    arenaBounds: new Bounds2(arenaViewMinX, arenaViewMinY, arenaViewMaxX, arenaViewMaxY),
  };
}

export class MazeGameScreenView extends ScreenView {
  private readonly arenaNode: ArenaNode;
  private readonly controlPanel: ControlPanel;
  private readonly levelSelector: LevelSelector;
  private readonly hudNode: HudNode;
  private readonly resetAllButton: ResetAllButton;
  private readonly keyboardListener: ReturnType<typeof KeyboardListener.createGlobal>;
  private readonly collisionSound: SoundClip;
  private readonly winSound: SoundClip;
  private readonly modeSound: SoundClip;

  private readonly playCollisionSound = (count: number, oldCount: number | null): void => {
    if (oldCount !== null && count > oldCount) {
      this.collisionSound.play();
    }
  };

  private readonly playWinSound = (won: boolean): void => {
    if (won) {
      this.winSound.play();
    }
  };

  private readonly playModeSound = (): void => {
    this.modeSound.play();
  };

  private readonly applyLayout = (): void => {
    const visibleBounds = this.visibleBoundsProperty.value;
    const margin = MazeGameLayoutConstants.SCREEN_MARGIN;
    const rightColumnGap = MazeGameLayoutConstants.RIGHT_COLUMN_GAP;

    const { modelViewTransform, arenaBounds } = computeArenaLayout(visibleBounds);
    this.arenaNode.setLayout(modelViewTransform, arenaBounds);

    const columnRight = visibleBounds.maxX - margin;

    this.controlPanel.right = columnRight;
    this.controlPanel.top = visibleBounds.minY + margin;

    this.levelSelector.right = columnRight;
    this.levelSelector.top = this.controlPanel.bottom + rightColumnGap;

    this.hudNode.right = columnRight;
    this.hudNode.top = this.levelSelector.bottom + rightColumnGap;

    this.resetAllButton.right = columnRight;
    this.resetAllButton.bottom = visibleBounds.maxY - margin;
  };

  public constructor(model: MazeGameModel, providedOptions: MazeGameScreenViewOptions) {
    const options = optionize<MazeGameScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()({}, providedOptions);
    super(options);

    const { modelViewTransform, arenaBounds } = computeArenaLayout(this.visibleBoundsProperty.value);
    this.arenaNode = new ArenaNode(model, modelViewTransform, arenaBounds);

    this.controlPanel = new ControlPanel(model);
    this.levelSelector = new LevelSelector(model, {
      tandem: options.tandem.createTandem("levelSelector"),
    });
    this.hudNode = new HudNode(model, {
      interruptInput: () => this.interruptSubtreeInput(),
    });

    this.resetAllButton = new ResetAllButton({
      baseColor: MazeGameColors.resetAllButtonColorProperty,
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
      },
      accessibleName: StringManager.getInstance().getHudStrings().resetAllStringProperty,
      tandem: options.tandem.createTandem("resetAllButton"),
    });

    this.children = [this.arenaNode, this.controlPanel, this.levelSelector, this.hudNode, this.resetAllButton];

    this.pdomPlayAreaNode.pdomOrder = [this.arenaNode];
    this.pdomControlAreaNode.pdomOrder = [this.controlPanel, this.levelSelector, this.hudNode, this.resetAllButton];

    this.visibleBoundsProperty.link(this.applyLayout, { disposer: this });
    this.applyLayout();

    this.keyboardListener = KeyboardListener.createGlobal(this, {
      keys: [...KEYS],
      fireOnHold: true,
      fire: (_event, keysPressed) => {
        if (model.wonProperty.value) {
          return;
        }

        const activeKeys = keysPressed.split("+");
        const mode = model.controlModeProperty.value;

        if (activeKeys.includes("space")) {
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
      },
    });

    this.collisionSound = new SoundClip(wallContact_mp3, { initialOutputLevel: 0.5 });
    soundManager.addSoundGenerator(this.collisionSound);
    model.collisionsProperty.link(this.playCollisionSound, { disposer: this });

    this.winSound = new SoundClip(collect_mp3, { initialOutputLevel: 0.7 });
    soundManager.addSoundGenerator(this.winSound);
    model.wonProperty.link(this.playWinSound, { disposer: this });

    this.modeSound = new SoundClip(selectionArpeggio001_mp3, { initialOutputLevel: 0.3 });
    soundManager.addSoundGenerator(this.modeSound);
    model.controlModeProperty.lazyLink(this.playModeSound, { disposer: this });
  }

  public override step(dt: number): void {
    this.arenaNode.step(dt);
  }

  public override dispose(): void {
    soundManager.removeSoundGenerator(this.collisionSound);
    soundManager.removeSoundGenerator(this.winSound);
    soundManager.removeSoundGenerator(this.modeSound);
    this.collisionSound.dispose();
    this.winSound.dispose();
    this.modeSound.dispose();

    this.keyboardListener.dispose();

    this.hudNode.dispose();
    this.levelSelector.dispose();
    this.controlPanel.dispose();
    this.arenaNode.dispose();

    super.dispose();
  }
}
