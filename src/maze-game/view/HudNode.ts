/**
 * HudNode.ts
 *
 * Displays elapsed time, collision count, icon action buttons (reset / next level),
 * and a collision-warning message.
 */

import { DerivedProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { optionize } from "scenerystack/phet-core";
import { HBox, Text, VBox } from "scenerystack/scenery";
import { NumberDisplay, PhetFont, RestartButton, StepForwardButton } from "scenerystack/scenery-phet";
import { Panel, type PanelOptions } from "scenerystack/sun";
import { ElapsedTimeNode } from "scenerystack/vegas";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import MazeGameLayoutConstants from "../MazeGameLayoutConstants.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

type HudNodeSelfOptions = {
  interruptInput?: () => void;
};

type HudNodeOptions = HudNodeSelfOptions & PanelOptions;

export default class HudNode extends Panel {
  private readonly elapsedTimeNodeRef: ElapsedTimeNode;
  private readonly collisionsDisplayRef: NumberDisplay;
  private readonly derivedProperties: Array<{ dispose(): void }> = [];

  public constructor(model: MazeGameModel, providedOptions?: HudNodeOptions) {
    const stringManager = StringManager.getInstance();
    const strings = stringManager.getHudStrings();
    const a11yStrings = stringManager.getA11yStrings();

    const options = optionize<HudNodeOptions, HudNodeSelfOptions, PanelOptions>()(
      {
        interruptInput: (): void => {
          // No-op when HudNode is constructed without a ScreenView interrupt callback.
        },
        fill: MazeGameColors.panelFillProperty,
        stroke: MazeGameColors.panelStrokeProperty,
        cornerRadius: MazeGameConstants.PANEL_CORNER_RADIUS,
        xMargin: MazeGameConstants.PANEL_X_MARGIN,
        yMargin: MazeGameConstants.HUD_PANEL_Y_MARGIN,
        align: "left",
        accessibleName: a11yStrings.hudPanelStringProperty,
      },
      providedOptions,
    );

    const interruptInput = options.interruptInput;

    const elapsedTimeNode = new ElapsedTimeNode(model.timeProperty, {
      clockIconRadius: MazeGameLayoutConstants.HUD_CLOCK_ICON_RADIUS,
      font: new PhetFont(MazeGameLayoutConstants.HUD_VALUE_FONT_SIZE),
      textFill: MazeGameColors.foregroundColorProperty,
    });
    elapsedTimeNode.accessibleName = a11yStrings.timeDisplayStringProperty;

    const collisionsDisplay = new NumberDisplay(
      model.collisionsProperty,
      new Range(0, MazeGameLayoutConstants.HUD_COLLISIONS_MAX),
      {
        decimalPlaces: 0,
        align: "right",
        textOptions: {
          font: new PhetFont(MazeGameLayoutConstants.HUD_VALUE_FONT_SIZE),
          fill: MazeGameColors.foregroundColorProperty,
        },
      },
    );
    collisionsDisplay.accessibleName = a11yStrings.collisionsDisplayStringProperty;

    const collisionsRow = new HBox({
      spacing: MazeGameLayoutConstants.HUD_HBOX_SPACING,
      children: [
        new Text(strings.collisionMultiplierStringProperty, {
          font: new PhetFont({ size: MazeGameLayoutConstants.HUD_COLLISION_MARKER_FONT_SIZE, weight: "bold" }),
          fill: MazeGameColors.foregroundColorProperty,
        }),
        collisionsDisplay,
      ],
    });

    const collisionWarning = new Text(strings.collisionWarningStringProperty, {
      font: new PhetFont({ size: MazeGameLayoutConstants.HUD_WARNING_FONT_SIZE, weight: "bold" }),
      fill: MazeGameColors.collisionWarningColorProperty,
      maxWidth: MazeGameConstants.HUD_WARNING_MAX_WIDTH,
      visible: false,
    });
    collisionWarning.accessibleParagraph = strings.collisionWarningStringProperty;

    const resetLevelButton = new RestartButton({
      baseColor: MazeGameColors.resetLevelButtonColorProperty,
      listener: (): void => {
        interruptInput();
        model.resetLevel();
      },
      accessibleName: strings.resetLevelStringProperty,
    });

    const nextLevelButton = new StepForwardButton({
      baseColor: MazeGameColors.nextLevelButtonColorProperty,
      listener: (): void => {
        interruptInput();
        model.advanceLevel();
      },
      visible: false,
      accessibleName: strings.nextLevelStringProperty,
    });

    const actionButtons = new HBox({
      spacing: MazeGameLayoutConstants.HUD_HBOX_SPACING,
      children: [resetLevelButton, nextLevelButton],
    });

    const content = new VBox({
      align: "left",
      spacing: MazeGameLayoutConstants.HUD_VBOX_SPACING,
      children: [elapsedTimeNode, collisionsRow, collisionWarning, actionButtons],
    });

    const { interruptInput: _interruptInput, ...panelOptions } = options;
    super(content, panelOptions);

    this.elapsedTimeNodeRef = elapsedTimeNode;
    this.collisionsDisplayRef = collisionsDisplay;

    const collisionWarningVisibleProperty = new DerivedProperty(
      [model.collisionsProperty, model.wonProperty],
      (c, won): boolean => c > 0 && !won,
    );
    this.derivedProperties.push(collisionWarningVisibleProperty);
    collisionWarning.visibleProperty = collisionWarningVisibleProperty;

    const nextLevelVisibleProperty = new DerivedProperty(
      [model.wonProperty, model.isLastLevelProperty],
      (won, isLastLevel): boolean => won && !isLastLevel,
    );
    this.derivedProperties.push(nextLevelVisibleProperty);
    nextLevelButton.visibleProperty = nextLevelVisibleProperty;
  }

  public override dispose(): void {
    for (const derivedProperty of this.derivedProperties) {
      derivedProperty.dispose();
    }
    this.elapsedTimeNodeRef.dispose();
    this.collisionsDisplayRef.dispose();
    super.dispose();
  }
}
