/**
 * LevelSelector.ts
 *
 * Lets the user pick one of the four built-in mazes via a vertical radio
 * group bound directly to the model's levelNameProperty.
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Panel } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import { LEVEL_KEYS, LevelKey } from "../model/Levels.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

const TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });
const LABEL_FONT = new PhetFont(13);
const RADIO_BUTTON_RADIUS = 7;
const RADIO_BUTTON_SPACING = 4;
const VBOX_SPACING = 6;

export default class LevelSelector extends Panel {
  public constructor(model: MazeGameModel) {
    const strings = StringManager.getInstance().getLevelStrings();

    const labelByKey: Record<LevelKey, () => Text> = {
      [LevelKey.PRACTICE]: () =>
        new Text(strings.practiceStringProperty, { font: LABEL_FONT, fill: MazeGameColors.foregroundColorProperty }),
      [LevelKey.LEVEL_1]: () =>
        new Text(strings.level1StringProperty, { font: LABEL_FONT, fill: MazeGameColors.foregroundColorProperty }),
      [LevelKey.LEVEL_2]: () =>
        new Text(strings.level2StringProperty, { font: LABEL_FONT, fill: MazeGameColors.foregroundColorProperty }),
      [LevelKey.CERTAIN_DEATH]: () =>
        new Text(strings.certainDeathStringProperty, {
          font: LABEL_FONT,
          fill: MazeGameColors.foregroundColorProperty,
        }),
    };

    const radioGroup = new AquaRadioButtonGroup<LevelKey>(
      model.levelNameProperty,
      LEVEL_KEYS.map((key) => ({ value: key, createNode: labelByKey[key] })),
      {
        spacing: RADIO_BUTTON_SPACING,
        radioButtonOptions: { radius: RADIO_BUTTON_RADIUS, stroke: MazeGameColors.foregroundColorProperty },
      },
    );

    const title = new Text(strings.titleStringProperty, {
      font: TITLE_FONT,
      fill: MazeGameColors.foregroundColorProperty,
    });

    const content = new VBox({ align: "left", spacing: VBOX_SPACING, children: [title, radioGroup] });

    super(content, {
      fill: MazeGameColors.panelFillProperty,
      stroke: MazeGameColors.panelStrokeProperty,
      cornerRadius: MazeGameConstants.PANEL_CORNER_RADIUS,
      xMargin: MazeGameConstants.PANEL_X_MARGIN,
      yMargin: MazeGameConstants.PANEL_Y_MARGIN,
      align: "left",
      accessibleName: strings.titleStringProperty,
    });
    radioGroup.accessibleName = strings.titleStringProperty;
  }
}
