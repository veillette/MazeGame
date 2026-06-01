/**
 * LevelSelector.ts
 *
 * Lets the user pick one of the four built-in mazes via a vertical Vegas
 * LevelSelectionButtonGroup with mini maze preview icons.
 */

import { NumberProperty } from "scenerystack/axon";
import { Color, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { LevelSelectionButtonGroup } from "scenerystack/vegas";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import { LEVEL_KEYS, LEVELS, LevelKey } from "../model/Levels.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";
import LevelPreviewNode from "./LevelPreviewNode.js";

const TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });
const STRIP_LABEL_FONT = new PhetFont({ size: 10, weight: "bold" });
const VBOX_SPACING = 6;
const BUTTON_SIZE = 60;

const SELECTED_BASE_COLOR = new Color(102, 187, 106);
const UNSELECTED_BASE_COLOR = new Color(242, 255, 204);

const STRIP_LABEL_BY_KEY: Record<LevelKey, string> = {
  [LevelKey.PRACTICE]: "P",
  [LevelKey.LEVEL_1]: "1",
  [LevelKey.LEVEL_2]: "2",
  [LevelKey.CERTAIN_DEATH]: "X",
};

type LevelSelectorOptions = {
  tandem?: Tandem;
};

export default class LevelSelector extends Panel {
  private readonly scoreProperty: NumberProperty;

  public constructor(model: MazeGameModel, options: LevelSelectorOptions = {}) {
    const strings = StringManager.getInstance().getLevelStrings();
    const scoreProperty = new NumberProperty(0);

    const accessibleNameByKey: Record<LevelKey, typeof strings.practiceStringProperty> = {
      [LevelKey.PRACTICE]: strings.practiceStringProperty,
      [LevelKey.LEVEL_1]: strings.level1StringProperty,
      [LevelKey.LEVEL_2]: strings.level2StringProperty,
      [LevelKey.CERTAIN_DEATH]: strings.certainDeathStringProperty,
    };

    const buttonGroup = new LevelSelectionButtonGroup(
      LEVEL_KEYS.map((key) => ({
        icon: new LevelPreviewNode(LEVELS[key]),
        scoreProperty: scoreProperty,
        options: {
          listener: () => {
            model.levelNameProperty.value = key;
          },
          accessibleName: accessibleNameByKey[key],
          createScoreDisplay: () =>
            new Text(STRIP_LABEL_BY_KEY[key], {
              font: STRIP_LABEL_FONT,
              fill: MazeGameColors.foregroundColorProperty,
            }),
        },
      })),
      {
        gameLevels: [1, 2, 3, 4],
        groupButtonWidth: BUTTON_SIZE,
        groupButtonHeight: BUTTON_SIZE,
        flowBoxOptions: { orientation: "vertical", spacing: 6 },
        levelSelectionButtonOptions: {
          scoreDisplayProportion: 0.18,
          xMargin: 4,
          yMargin: 4,
          iconToScoreDisplayYSpace: 2,
        },
        tandem: options.tandem ?? Tandem.OPT_OUT,
      },
    );

    const title = new Text(strings.titleStringProperty, {
      font: TITLE_FONT,
      fill: MazeGameColors.foregroundColorProperty,
    });

    const content = new VBox({ align: "left", spacing: VBOX_SPACING, children: [title, buttonGroup] });

    super(content, {
      fill: MazeGameColors.panelFillProperty,
      stroke: MazeGameColors.panelStrokeProperty,
      cornerRadius: MazeGameConstants.PANEL_CORNER_RADIUS,
      xMargin: MazeGameConstants.PANEL_X_MARGIN,
      yMargin: MazeGameConstants.PANEL_Y_MARGIN,
      align: "left",
      accessibleName: strings.titleStringProperty,
    });
    buttonGroup.accessibleName = strings.titleStringProperty;

    this.scoreProperty = scoreProperty;

    const updateSelectionHighlight = (activeKey: LevelKey): void => {
      for (let i = 0; i < LEVEL_KEYS.length; i++) {
        const button = buttonGroup.buttons[i];
        if (button) {
          button.baseColor = LEVEL_KEYS[i] === activeKey ? SELECTED_BASE_COLOR : UNSELECTED_BASE_COLOR;
        }
      }
    };
    updateSelectionHighlight(model.levelNameProperty.value);
    model.levelNameProperty.link(updateSelectionHighlight, { disposer: this });
  }

  public override dispose(): void {
    this.scoreProperty.dispose();
    super.dispose();
  }
}
