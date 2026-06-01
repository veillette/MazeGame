/**
 * LevelSelector.ts
 *
 * Lets the user pick one of the four built-in mazes via a vertical radio
 * group bound to a local bridge Property synced with the model.
 */

import { Property } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Panel, type PanelOptions } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
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

type LevelSelectorSelfOptions = {
  tandem?: Tandem;
};

type LevelSelectorOptions = LevelSelectorSelfOptions & PanelOptions;

export default class LevelSelector extends Panel {
  private readonly levelNameBridgeProperty: Property<LevelKey>;

  public constructor(model: MazeGameModel, providedOptions?: LevelSelectorOptions) {
    const strings = StringManager.getInstance().getLevelStrings();

    const options = optionize<LevelSelectorOptions, LevelSelectorSelfOptions, PanelOptions>()(
      {
        tandem: Tandem.OPT_OUT,
        fill: MazeGameColors.panelFillProperty,
        stroke: MazeGameColors.panelStrokeProperty,
        cornerRadius: MazeGameConstants.PANEL_CORNER_RADIUS,
        xMargin: MazeGameConstants.PANEL_X_MARGIN,
        yMargin: MazeGameConstants.PANEL_Y_MARGIN,
        align: "left",
        accessibleName: strings.titleStringProperty,
      },
      providedOptions,
    );

    const levelNameBridgeProperty = new Property<LevelKey>(model.levelNameProperty.value);

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

    const { tandem, ...panelOptions } = options;

    const radioGroup = new AquaRadioButtonGroup<LevelKey>(
      levelNameBridgeProperty,
      LEVEL_KEYS.map((key) => ({ value: key, createNode: labelByKey[key] })),
      {
        spacing: RADIO_BUTTON_SPACING,
        radioButtonOptions: {
          radius: RADIO_BUTTON_RADIUS,
          stroke: MazeGameColors.foregroundColorProperty,
          selectedColor: MazeGameColors.levelButtonSelectedColorProperty,
          deselectedColor: MazeGameColors.levelButtonUnselectedColorProperty,
          centerColor: MazeGameColors.foregroundColorProperty,
        },
        tandem,
      },
    );

    const title = new Text(strings.titleStringProperty, {
      font: TITLE_FONT,
      fill: MazeGameColors.foregroundColorProperty,
    });

    const content = new VBox({ align: "left", spacing: VBOX_SPACING, children: [title, radioGroup] });

    super(content, panelOptions);
    radioGroup.accessibleName = strings.titleStringProperty;

    this.levelNameBridgeProperty = levelNameBridgeProperty;

    model.levelNameProperty.link(
      (levelKey): void => {
        if (levelNameBridgeProperty.value !== levelKey) {
          levelNameBridgeProperty.value = levelKey;
        }
      },
      { disposer: this },
    );

    levelNameBridgeProperty.link(
      (levelKey): void => {
        if (model.levelNameProperty.value !== levelKey) {
          model.changeLevel(levelKey);
        }
      },
      { disposer: this },
    );
  }

  public override dispose(): void {
    this.levelNameBridgeProperty.dispose();
    super.dispose();
  }
}
