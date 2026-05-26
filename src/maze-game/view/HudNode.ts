/**
 * HudNode.ts
 *
 * Displays the elapsed time, the collision counter, and a "Reset Level" button
 * that restarts the current level without resetting the level selection or
 * control mode.
 */

import { Range } from "scenerystack/dot";
import { HBox, Text, VBox } from "scenerystack/scenery";
import { NumberDisplay, PhetFont } from "scenerystack/scenery-phet";
import { Panel, TextPushButton } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

const LABEL_FONT = new PhetFont({ size: 14, weight: "bold" });
const VALUE_FONT = new PhetFont(14);
const BUTTON_FONT = new PhetFont(13);
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

    const resetLevelButton = new TextPushButton(strings.resetLevelStringProperty, {
      font: BUTTON_FONT,
      baseColor: "#f6e652",
      listener: () => model.resetLevel(),
    });

    const content = new VBox({
      align: "left",
      spacing: VBOX_SPACING,
      children: [timeRow, collisionsRow, resetLevelButton],
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
