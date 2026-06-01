/**
 * MazeGameScreen.ts
 *
 * The top-level Screen. Wires the MazeGameModel and MazeGameScreenView
 * factories together and passes screen options (name, background color,
 * tandem) through to the parent Screen class.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { Screen, type ScreenOptions } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import MazeGameColors from "../MazeGameColors.js";
import MazeGameKeyboardHelpContent from "./keyboard/MazeGameKeyboardHelpContent.js";
import { MazeGameModel } from "./model/MazeGameModel.js";
import { MazeGameScreenView } from "./view/MazeGameScreenView.js";

type MazeGameScreenOptions = ScreenOptions & { tandem: Tandem };

export class MazeGameScreen extends Screen<MazeGameModel, MazeGameScreenView> {
  public constructor(options: MazeGameScreenOptions) {
    super(
      () => new MazeGameModel(),
      (model) => new MazeGameScreenView(model, { tandem: options.tandem.createTandem("view") }),
      optionize<MazeGameScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: MazeGameColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new MazeGameKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
