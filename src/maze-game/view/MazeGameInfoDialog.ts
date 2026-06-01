/**
 * MazeGameInfoDialog.ts
 *
 * Modal dialog opened by the info button. Explains the game goal, controls,
 * and each built-in level.
 */

import { combineOptions, optionize } from "scenerystack/phet-core";
import { Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Dialog, type DialogOptions, ScreenView } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameLayoutConstants from "../MazeGameLayoutConstants.js";

type MazeGameInfoDialogSelfOptions = {
  tandem?: Tandem;
};

type MazeGameInfoDialogOptions = MazeGameInfoDialogSelfOptions & DialogOptions;

const DESCRIPTION_FONT = new PhetFont({ size: MazeGameLayoutConstants.INFO_DIALOG_FONT_SIZE });
const TITLE_FONT = new PhetFont({
  size: MazeGameLayoutConstants.INFO_DIALOG_TITLE_FONT_SIZE,
  weight: MazeGameLayoutConstants.FONT_WEIGHT_BOLD,
});
const MAX_CONTENT_WIDTH =
  MazeGameLayoutConstants.INFO_DIALOG_MAX_CONTENT_WIDTH_FRACTION * ScreenView.DEFAULT_LAYOUT_BOUNDS.width;

export default class MazeGameInfoDialog extends Dialog {
  private readonly disposeMazeGameInfoDialog: () => void;

  public constructor(providedOptions?: MazeGameInfoDialogOptions) {
    const strings = StringManager.getInstance().getInfoStrings();

    const options = optionize<MazeGameInfoDialogOptions, MazeGameInfoDialogSelfOptions, DialogOptions>()(
      {
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    );

    const richTextOptions = {
      font: DESCRIPTION_FONT,
    };

    const intro = new RichText(strings.introductionStringProperty, richTextOptions);

    const levelDescriptionProperties = [
      strings.practiceDescriptionStringProperty,
      strings.level1DescriptionStringProperty,
      strings.level2DescriptionStringProperty,
      strings.certainDeathDescriptionStringProperty,
    ] as const;

    const levelDescriptions = levelDescriptionProperties.map(
      (description): RichText => new RichText(description, richTextOptions),
    );

    const content = new VBox({
      align: "left",
      spacing: MazeGameLayoutConstants.INFO_DIALOG_VBOX_SPACING,
      children: [intro, ...levelDescriptions],
      maxWidth: MAX_CONTENT_WIDTH,
    });

    const titleText = new Text(strings.titleStringProperty, {
      font: TITLE_FONT,
    });

    super(
      content,
      combineOptions<DialogOptions>(options, {
        title: new Node({
          children: [titleText],
          maxWidth: MAX_CONTENT_WIDTH,
        }),
      }),
    );

    this.disposeMazeGameInfoDialog = (): void => {
      intro.dispose();
      for (const description of levelDescriptions) {
        description.dispose();
      }
    };
  }

  public override dispose(): void {
    this.disposeMazeGameInfoDialog();
    super.dispose();
  }
}
