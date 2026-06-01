/**
 * MazeGameKeyboardHelpSection.ts
 *
 * Keyboard-help section describing arrow/WASD particle control and Space to stop motion.
 */

import {
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  TextKeyNode,
} from "scenerystack/scenery-phet";
import type { KeyboardHelpStrings } from "../../i18n/StringManager.js";

export default class MazeGameKeyboardHelpSection extends KeyboardHelpSection {
  public constructor(strings: KeyboardHelpStrings) {
    const controlParticleRow = KeyboardHelpSectionRow.labelWithIcon(
      strings.controlParticleStringProperty,
      KeyboardHelpIconFactory.arrowOrWasdKeysRowIcon(),
      {
        labelInnerContent: strings.controlParticleDescriptionStringProperty,
      },
    );

    const stopMotionRow = KeyboardHelpSectionRow.labelWithIcon(strings.stopMotionStringProperty, TextKeyNode.space(), {
      labelInnerContent: strings.stopMotionDescriptionStringProperty,
    });

    super(strings.particleStringProperty, [controlParticleRow, stopMotionRow]);
  }
}
