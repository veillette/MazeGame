/**
 * MazeGameScreenSummaryContent.ts
 *
 * Accessible screen summary at the top of the PDOM: play area overview,
 * control area overview, current game details, and interaction hints.
 */

import { DerivedStringProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import {
  createControlModeNameStringProperty,
  createLevelNameStringProperty,
} from "../a11y/createA11yDerivedProperties.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

export default class MazeGameScreenSummaryContent extends ScreenSummaryContent {
  private readonly derivedProperties: Array<{ dispose(): void }> = [];

  public constructor(model: MazeGameModel) {
    const a11yStrings = StringManager.getInstance().getA11yStrings();
    const summaryStrings = a11yStrings.screenSummary;
    const derivedProperties: Array<{ dispose(): void }> = [];

    const levelNameStringProperty = createLevelNameStringProperty(model);
    const controlModeNameStringProperty = createControlModeNameStringProperty(model);
    derivedProperties.push(levelNameStringProperty, controlModeNameStringProperty);

    const currentLevelPatternStringProperty = new PatternStringProperty(
      summaryStrings.currentLevelPatternStringProperty,
      {
        level: levelNameStringProperty,
      },
    );
    const currentModePatternStringProperty = new PatternStringProperty(
      summaryStrings.currentModePatternStringProperty,
      {
        mode: controlModeNameStringProperty,
      },
    );
    const collisionCountPatternStringProperty = new PatternStringProperty(
      summaryStrings.collisionCountPatternStringProperty,
      { value: model.collisionsProperty },
    );
    derivedProperties.push(
      currentLevelPatternStringProperty,
      currentModePatternStringProperty,
      collisionCountPatternStringProperty,
    );

    const wonStatusStringProperty = new DerivedStringProperty(
      [model.wonProperty, summaryStrings.wonStatusStringProperty],
      (won, wonStatus): string => (won ? wonStatus : ""),
      { phetioFeatured: false },
    );
    derivedProperties.push(wonStatusStringProperty);

    super({
      playAreaContent: summaryStrings.playAreaStringProperty,
      controlAreaContent: summaryStrings.controlAreaStringProperty,
      currentDetailsContent: [
        currentLevelPatternStringProperty,
        currentModePatternStringProperty,
        collisionCountPatternStringProperty,
        wonStatusStringProperty,
      ],
      interactionHintContent: summaryStrings.interactionHintStringProperty,
    });

    this.derivedProperties.push(...derivedProperties);
  }

  public override dispose(): void {
    for (const derivedProperty of this.derivedProperties) {
      derivedProperty.dispose();
    }
    super.dispose();
  }
}
