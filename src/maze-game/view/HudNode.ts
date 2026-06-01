/**
 * HudNode.ts
 *
 * Displays the elapsed time, the collision counter, a "Reset Level" button,
 * a collision-warning message (visible after the first wall hit), and a
 * "Next Level" button that appears on winning (hidden on the final level).
 */

import { DerivedProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { HBox, Text, VBox } from "scenerystack/scenery";
import { NumberDisplay, PhetFont } from "scenerystack/scenery-phet";
import { Panel, TextPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

const LABEL_FONT = new PhetFont({ size: 14, weight: "bold" });
const VALUE_FONT = new PhetFont(14);
const BUTTON_FONT = new PhetFont(13);
const WARNING_FONT = new PhetFont({ size: 12, weight: "bold" });
const HBOX_SPACING = 6;
const VBOX_SPACING = 6;

type HudNodeOptions = {
  interruptInput?: () => void;
};

export default class HudNode extends Panel {
  private readonly timeDisplayRef: NumberDisplay;
  private readonly collisionsDisplayRef: NumberDisplay;
  private readonly derivedProperties: Array<{ dispose(): void }> = [];

  private readonly collisionWarningRef!: Text;
  private readonly nextLevelButtonRef!: TextPushButton;

  private readonly updateCollisionWarningVisible = (v: boolean): void => {
    this.collisionWarningRef.visible = v;
  };

  private readonly updateNextLevelVisible = (v: boolean): void => {
    this.nextLevelButtonRef.visible = v;
  };

  public constructor(model: MazeGameModel, options: HudNodeOptions = {}) {
    const stringManager = StringManager.getInstance();
    const strings = stringManager.getHudStrings();
    const a11yStrings = stringManager.getA11yStrings();
    const interruptInput =
      options.interruptInput ??
      ((): void => {
        // No-op when HudNode is constructed without a ScreenView interrupt callback.
      });

    const timeDisplay = new NumberDisplay(model.timeProperty, new Range(0, 999), {
      decimalPlaces: 1,
      align: "right",
      textOptions: { font: VALUE_FONT, fill: MazeGameColors.foregroundColorProperty },
    });
    timeDisplay.accessibleName = a11yStrings.timeDisplayStringProperty;

    const timeRow = new HBox({
      spacing: HBOX_SPACING,
      children: [
        new Text(strings.timeStringProperty, { font: LABEL_FONT, fill: MazeGameColors.foregroundColorProperty }),
        timeDisplay,
      ],
    });

    const collisionsDisplay = new NumberDisplay(model.collisionsProperty, new Range(0, 9999), {
      decimalPlaces: 0,
      align: "right",
      textOptions: { font: VALUE_FONT, fill: MazeGameColors.foregroundColorProperty },
    });
    collisionsDisplay.accessibleName = a11yStrings.collisionsDisplayStringProperty;

    const collisionsRow = new HBox({
      spacing: HBOX_SPACING,
      children: [
        new Text(strings.collisionsStringProperty, { font: LABEL_FONT, fill: MazeGameColors.foregroundColorProperty }),
        collisionsDisplay,
      ],
    });

    const collisionWarning = new Text(strings.collisionWarningStringProperty, {
      font: WARNING_FONT,
      fill: MazeGameColors.collisionWarningColorProperty,
      maxWidth: MazeGameConstants.HUD_WARNING_MAX_WIDTH,
      visible: false,
    });
    collisionWarning.accessibleParagraph = strings.collisionWarningStringProperty;

    const resetLevelButton = new TextPushButton(strings.resetLevelStringProperty, {
      font: BUTTON_FONT,
      baseColor: MazeGameColors.resetLevelButtonColorProperty,
      listener: () => {
        interruptInput();
        model.resetLevel();
      },
      accessibleName: strings.resetLevelStringProperty,
    });

    const nextLevelButton = new TextPushButton(strings.nextLevelStringProperty, {
      font: BUTTON_FONT,
      baseColor: MazeGameColors.nextLevelButtonColorProperty,
      listener: () => {
        interruptInput();
        model.advanceLevel();
      },
      visible: false,
      accessibleName: strings.nextLevelStringProperty,
    });

    const content = new VBox({
      align: "left",
      spacing: VBOX_SPACING,
      children: [timeRow, collisionsRow, collisionWarning, resetLevelButton, nextLevelButton],
    });

    super(content, {
      fill: MazeGameColors.panelFillProperty,
      stroke: MazeGameColors.panelStrokeProperty,
      cornerRadius: MazeGameConstants.PANEL_CORNER_RADIUS,
      xMargin: MazeGameConstants.PANEL_X_MARGIN,
      yMargin: MazeGameConstants.HUD_PANEL_Y_MARGIN,
      align: "left",
      accessibleName: a11yStrings.hudPanelStringProperty,
    });

    this.timeDisplayRef = timeDisplay;
    this.collisionsDisplayRef = collisionsDisplay;
    this.collisionWarningRef = collisionWarning;
    this.nextLevelButtonRef = nextLevelButton;

    const collisionWarningVisibleProperty = new DerivedProperty(
      [model.collisionsProperty, model.wonProperty],
      (c, won) => c > 0 && !won,
    );
    this.derivedProperties.push(collisionWarningVisibleProperty);
    collisionWarningVisibleProperty.link(this.updateCollisionWarningVisible, { disposer: this });

    const nextLevelVisibleProperty = new DerivedProperty(
      [model.wonProperty, model.isLastLevelProperty],
      (won, isLastLevel) => won && !isLastLevel,
    );
    this.derivedProperties.push(nextLevelVisibleProperty);
    nextLevelVisibleProperty.link(this.updateNextLevelVisible, { disposer: this });
  }

  public override dispose(): void {
    for (const derivedProperty of this.derivedProperties) {
      derivedProperty.dispose();
    }
    this.timeDisplayRef.dispose();
    this.collisionsDisplayRef.dispose();
    super.dispose();
  }
}
