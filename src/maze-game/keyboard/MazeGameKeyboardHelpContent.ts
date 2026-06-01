/**
 * MazeGameKeyboardHelpContent.ts
 *
 * Content for the Keyboard Shortcuts dialog (navbar keyboard button).
 */

import { BasicActionsKeyboardHelpSection, TwoColumnKeyboardHelpContent } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameKeyboardHelpSection from "./MazeGameKeyboardHelpSection.js";

export default class MazeGameKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getKeyboardHelpStrings();

    const particleSection = new MazeGameKeyboardHelpSection(strings);
    const basicActionsSection = new BasicActionsKeyboardHelpSection();

    super([particleSection], [basicActionsSection]);
  }
}
