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
import { LEVEL_KEYS } from "../model/Levels.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

const LABEL_FONT = new PhetFont({ size: 14, weight: "bold" });
const VALUE_FONT = new PhetFont(14);
const BUTTON_FONT = new PhetFont(13);
const WARNING_FONT = new PhetFont({ size: 12, weight: "bold" });
const HBOX_SPACING = 6;
const VBOX_SPACING = 6;

export default class HudNode extends Panel {
  public constructor(model: MazeGameModel) {
    const strings = StringManager.getInstance().getHudStrings();

    const timeRow = new HBox({
      spacing: HBOX_SPACING,
      children: [
        new Text(strings.timeStringProperty, { font: LABEL_FONT, fill: MazeGameColors.foregroundColorProperty }),
        new NumberDisplay(model.timeProperty, new Range(0, 999), {
          decimalPlaces: 1,
          align: "right",
          textOptions: { font: VALUE_FONT },
        }),
      ],
    });

    const collisionsRow = new HBox({
      spacing: HBOX_SPACING,
      children: [
        new Text(strings.collisionsStringProperty, { font: LABEL_FONT, fill: MazeGameColors.foregroundColorProperty }),
        new NumberDisplay(model.collisionsProperty, new Range(0, 9999), {
          decimalPlaces: 0,
          align: "right",
          textOptions: { font: VALUE_FONT },
        }),
      ],
    });

    // Warning shown once a collision has occurred, until the level is reset.
    const collisionWarning = new Text(strings.collisionWarningStringProperty, {
      font: WARNING_FONT,
      fill: MazeGameColors.collisionWarningColorProperty,
      visible: false,
    });
    const collisionWarningVisibleProperty = new DerivedProperty(
      [model.collisionsProperty, model.wonProperty],
      (c, won) => c > 0 && !won,
    );
    collisionWarningVisibleProperty.link((v) => {
      collisionWarning.visible = v;
    });

    const resetLevelButton = new TextPushButton(strings.resetLevelStringProperty, {
      font: BUTTON_FONT,
      baseColor: MazeGameColors.resetLevelButtonColorProperty,
      listener: () => model.resetLevel(),
    });

    // "Next Level" — only shown when the player has won and isn't on the last level.
    const nextLevelButton = new TextPushButton(strings.nextLevelStringProperty, {
      font: BUTTON_FONT,
      baseColor: MazeGameColors.nextLevelButtonColorProperty,
      listener: () => model.advanceLevel(),
      visible: false,
    });
    const nextLevelVisibleProperty = new DerivedProperty(
      [model.wonProperty, model.levelNameProperty],
      (won, levelName) => won && LEVEL_KEYS.indexOf(levelName) < LEVEL_KEYS.length - 1,
    );
    nextLevelVisibleProperty.link((v) => {
      nextLevelButton.visible = v;
    });

    const content = new VBox({
      align: "left",
      spacing: VBOX_SPACING,
      children: [timeRow, collisionsRow, collisionWarning, resetLevelButton, nextLevelButton],
    });

    super(content, {
      fill: MazeGameColors.panelFillProperty,
      stroke: MazeGameColors.panelStrokeProperty,
      cornerRadius: 6,
      xMargin: 12,
      yMargin: 8,
      align: "left",
    });
  }
}
