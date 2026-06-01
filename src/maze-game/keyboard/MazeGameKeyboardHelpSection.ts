/**
 * MazeGameKeyboardHelpSection.ts
 *
 * Keyboard-help section describing arrow/WASD particle control and Space to stop motion.
 * Rows are derived from MazeGameHotkeyData so the icons always match the actual bindings.
 */

import { KeyboardHelpSection, KeyboardHelpSectionRow } from "scenerystack/scenery-phet";
import type { KeyboardHelpStrings } from "../../i18n/StringManager.js";
import MazeGameHotkeyData from "./MazeGameHotkeyData.js";

export default class MazeGameKeyboardHelpSection extends KeyboardHelpSection {
  public constructor(strings: KeyboardHelpStrings) {
    const controlParticleRow = KeyboardHelpSectionRow.fromHotkeyData(MazeGameHotkeyData.MOVE_PARTICLE, {
      labelStringProperty: strings.controlParticleStringProperty,
      pdomLabelStringProperty: strings.controlParticleDescriptionStringProperty,
    });

    const stopMotionRow = KeyboardHelpSectionRow.fromHotkeyData(MazeGameHotkeyData.STOP_MOTION, {
      labelStringProperty: strings.stopMotionStringProperty,
      pdomLabelStringProperty: strings.stopMotionDescriptionStringProperty,
    });

    super(strings.particleStringProperty, [controlParticleRow, stopMotionRow]);
  }
}
