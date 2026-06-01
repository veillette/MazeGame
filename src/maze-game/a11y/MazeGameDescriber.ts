/**
 * MazeGameDescriber.ts
 *
 * Announces dynamic game events (collisions, win, level/mode changes) through
 * the display's description utterance queue via addAccessibleResponse.
 */

import { Disposable, PatternStringProperty } from "scenerystack/axon";
import type { Node } from "scenerystack/scenery";
import { Utterance } from "scenerystack/utterance-queue";
import { StringManager } from "../../i18n/StringManager.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";
import { createControlModeNameStringProperty, createLevelNameStringProperty } from "./createA11yDerivedProperties.js";

export default class MazeGameDescriber extends Disposable {
  private readonly derivedProperties: Array<{ dispose(): void }> = [];
  private readonly levelChangedUtterance: Utterance;
  private readonly controlModeChangedUtterance: Utterance;

  public constructor(model: MazeGameModel, descriptionAlertNode: Node) {
    super();

    const a11yStrings = StringManager.getInstance().getA11yStrings();

    const levelNameStringProperty = createLevelNameStringProperty(model);
    const controlModeNameStringProperty = createControlModeNameStringProperty(model);
    this.derivedProperties.push(levelNameStringProperty, controlModeNameStringProperty);

    const levelChangedAlertProperty = new PatternStringProperty(a11yStrings.levelChangedPatternStringProperty, {
      level: levelNameStringProperty,
    });
    const controlModeChangedAlertProperty = new PatternStringProperty(
      a11yStrings.controlModeChangedPatternStringProperty,
      { mode: controlModeNameStringProperty },
    );
    this.derivedProperties.push(levelChangedAlertProperty, controlModeChangedAlertProperty);

    this.levelChangedUtterance = new Utterance({ alert: levelChangedAlertProperty });
    this.controlModeChangedUtterance = new Utterance({ alert: controlModeChangedAlertProperty });

    model.collisionsProperty.link(
      (count, oldCount): void => {
        if (oldCount !== null && count > oldCount) {
          descriptionAlertNode.addAccessibleResponse(a11yStrings.collisionAlertStringProperty);
        }
      },
      { disposer: this },
    );

    model.wonProperty.link(
      (won): void => {
        if (won) {
          descriptionAlertNode.addAccessibleResponse(a11yStrings.levelCompleteAlertStringProperty);
        }
      },
      { disposer: this },
    );

    model.levelNameProperty.lazyLink(
      (): void => {
        descriptionAlertNode.addAccessibleResponse(this.levelChangedUtterance);
      },
      { disposer: this },
    );

    model.controlModeProperty.lazyLink(
      (): void => {
        descriptionAlertNode.addAccessibleResponse(this.controlModeChangedUtterance);
      },
      { disposer: this },
    );
  }

  public override dispose(): void {
    for (const derivedProperty of this.derivedProperties) {
      derivedProperty.dispose();
    }
    this.levelChangedUtterance.dispose();
    this.controlModeChangedUtterance.dispose();
    super.dispose();
  }
}
