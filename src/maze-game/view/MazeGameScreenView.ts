/**
 * MazeGameScreenView.ts
 *
 * Top-level view. Lays out:
 *   - The maze arena (left).
 *   - The right column: control-mode panel, level selector, HUD (which now
 *     includes the Reset Level and Next Level buttons).
 *   - A ResetAllButton bottom-right.
 *   - An InfoButton bottom-left in the right column.
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

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Range, Vector2 } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { KeyboardListener } from "scenerystack/scenery";
import { InfoButton, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import {
  ContinuousPropertySoundClip,
  collect_mp3,
  SoundClip,
  saturatedSineLoop220Hz_mp3,
  selectionArpeggio001_mp3,
  soundManager,
  wallContact_mp3,
} from "scenerystack/tambo";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import MazeGameDescriber from "../a11y/MazeGameDescriber.js";
import { applyMazeGameKeyboardInput } from "../keyboard/applyMazeGameKeyboardInput.js";
import MazeGameLayoutConstants from "../MazeGameLayoutConstants.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";
import {
  createVelocityMagnitudeSonificationProperty,
  velocitySonificationRange,
} from "../sound/createSonificationProperties.js";
import ArenaNode from "./ArenaNode.js";
import ControlPanel from "./ControlPanel.js";
import HudNode from "./HudNode.js";
import LevelSelector from "./LevelSelector.js";
import MazeGameInfoDialog from "./MazeGameInfoDialog.js";
import MazeGameScreenSummaryContent from "./MazeGameScreenSummaryContent.js";

type MazeGameScreenViewOptions = ScreenViewOptions & { tandem: Tandem };

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
  private readonly infoButton: InfoButton;
  private readonly infoDialog: MazeGameInfoDialog;
  private readonly screenSummaryContentRef: MazeGameScreenSummaryContent;
  private readonly mazeGameDescriber: MazeGameDescriber;
  private readonly keyboardListener: ReturnType<typeof KeyboardListener.createGlobal>;
  private readonly collisionSound: SoundClip;
  private readonly winSound: SoundClip;
  private readonly modeSound: SoundClip;
  private readonly velocitySonificationSound: ContinuousPropertySoundClip;
  private readonly velocityMagnitudeSonificationProperty: TReadOnlyProperty<number>;

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

    this.infoButton.left = columnRight - MazeGameLayoutConstants.RIGHT_COLUMN_WIDTH;
    this.infoButton.bottom = visibleBounds.maxY - margin;
  };

  public constructor(model: MazeGameModel, providedOptions: MazeGameScreenViewOptions) {
    const options = optionize<MazeGameScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()({}, providedOptions);
    super(options);

    const { modelViewTransform, arenaBounds } = computeArenaLayout(this.visibleBoundsProperty.value);
    this.arenaNode = new ArenaNode(model, modelViewTransform, arenaBounds);

    this.controlPanel = new ControlPanel(model, {
      tandem: options.tandem.createTandem("controlPanel"),
    });
    this.levelSelector = new LevelSelector(model, {
      tandem: options.tandem.createTandem("levelSelector"),
    });
    this.hudNode = new HudNode(model, {
      interruptInput: () => this.interruptSubtreeInput(),
    });

    this.resetAllButton = new ResetAllButton({
      baseColor: MazeGameColors.resetAllButtonColorProperty,
      listener: (): void => {
        this.interruptSubtreeInput();
        model.reset();
      },
      accessibleName: StringManager.getInstance().getHudStrings().resetAllStringProperty,
      tandem: options.tandem.createTandem("resetAllButton"),
    });

    this.infoDialog = new MazeGameInfoDialog();
    this.infoButton = new InfoButton({
      listener: (): void => {
        this.interruptSubtreeInput();
        this.infoDialog.show();
      },
      scale: MazeGameLayoutConstants.INFO_BUTTON_SCALE,
      tandem: options.tandem.createTandem("infoButton"),
    });

    this.screenSummaryContentRef = new MazeGameScreenSummaryContent(model);
    this.setScreenSummaryContent(this.screenSummaryContentRef);
    this.mazeGameDescriber = new MazeGameDescriber(model, this);

    this.children = [
      this.arenaNode,
      this.controlPanel,
      this.levelSelector,
      this.hudNode,
      this.resetAllButton,
      this.infoButton,
    ];

    this.pdomPlayAreaNode.pdomOrder = [this.arenaNode];
    this.pdomControlAreaNode.pdomOrder = [
      this.controlPanel,
      this.levelSelector,
      this.hudNode,
      this.infoButton,
      this.resetAllButton,
    ];

    this.visibleBoundsProperty.link(this.applyLayout, { disposer: this });
    this.applyLayout();

    this.keyboardListener = KeyboardListener.createGlobal(this, {
      keys: [...MazeGameConstants.KEYBOARD_KEYS],
      fireOnHold: true,
      fire: (_event: KeyboardEvent | null, keysPressed: string): void => {
        applyMazeGameKeyboardInput(model, keysPressed);
      },
    });

    this.collisionSound = new SoundClip(wallContact_mp3, {
      initialOutputLevel: MazeGameConstants.SOUND_COLLISION_OUTPUT_LEVEL,
    });
    soundManager.addSoundGenerator(this.collisionSound);
    model.collisionsProperty.link(this.playCollisionSound, { disposer: this });

    this.winSound = new SoundClip(collect_mp3, { initialOutputLevel: MazeGameConstants.SOUND_WIN_OUTPUT_LEVEL });
    soundManager.addSoundGenerator(this.winSound);
    model.wonProperty.link(this.playWinSound, { disposer: this });

    this.modeSound = new SoundClip(selectionArpeggio001_mp3, {
      initialOutputLevel: MazeGameConstants.SOUND_MODE_OUTPUT_LEVEL,
    });
    soundManager.addSoundGenerator(this.modeSound);
    model.controlModeProperty.lazyLink(this.playModeSound, { disposer: this });

    this.velocityMagnitudeSonificationProperty = createVelocityMagnitudeSonificationProperty(model);
    const sonificationRange = velocitySonificationRange();
    this.velocitySonificationSound = new ContinuousPropertySoundClip(
      this.velocityMagnitudeSonificationProperty,
      new Range(sonificationRange.min, sonificationRange.max),
      saturatedSineLoop220Hz_mp3,
      { initialOutputLevel: MazeGameConstants.SOUND_VELOCITY_SONIFICATION_OUTPUT_LEVEL },
    );
    soundManager.addSoundGenerator(this.velocitySonificationSound);
  }

  public override step(dt: number): void {
    this.arenaNode.step(dt);
  }

  public override dispose(): void {
    soundManager.removeSoundGenerator(this.collisionSound);
    soundManager.removeSoundGenerator(this.winSound);
    soundManager.removeSoundGenerator(this.modeSound);
    soundManager.removeSoundGenerator(this.velocitySonificationSound);
    this.collisionSound.dispose();
    this.winSound.dispose();
    this.modeSound.dispose();
    this.velocitySonificationSound.dispose();
    this.velocityMagnitudeSonificationProperty.dispose();

    this.keyboardListener.dispose();

    this.mazeGameDescriber.dispose();
    this.setScreenSummaryContent(null);
    this.screenSummaryContentRef.dispose();

    this.hudNode.dispose();
    this.levelSelector.dispose();
    this.controlPanel.dispose();
    this.arenaNode.dispose();
    this.infoDialog.dispose();

    super.dispose();
  }
}
