/**
 * MazeGameDescriber.ts
 *
 * Announces dynamic game events (collisions, win, level/mode changes) through
 * the display's description utterance queue via addAccessibleResponse, and
 * through voicingUtteranceQueue when Voicing is enabled. Provides haptic
 * feedback on wall collisions when the Web Vibration API is available.
 */

import { Disposable, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Node } from "scenerystack/scenery";
import { voicingUtteranceQueue } from "scenerystack/scenery";
import { Utterance } from "scenerystack/utterance-queue";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";
import { createControlModeNameStringProperty, createLevelNameStringProperty } from "./createA11yDerivedProperties.js";

const vibrateOnCollision = (): void => {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(MazeGameConstants.COLLISION_VIBRATION_MS);
  }
};

const announceToVoicing = (alert: TReadOnlyProperty<string> | Utterance): void => {
  voicingUtteranceQueue.addToBack(alert instanceof Utterance ? alert : new Utterance({ alert }));
};

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
          announceToVoicing(a11yStrings.collisionAlertStringProperty);
          vibrateOnCollision();
        }
      },
      { disposer: this },
    );

    model.wonProperty.link(
      (won): void => {
        if (won) {
          descriptionAlertNode.addAccessibleResponse(a11yStrings.levelCompleteAlertStringProperty);
          announceToVoicing(a11yStrings.levelCompleteAlertStringProperty);
        }
      },
      { disposer: this },
    );

    model.levelNameProperty.lazyLink(
      (): void => {
        descriptionAlertNode.addAccessibleResponse(this.levelChangedUtterance);
        announceToVoicing(this.levelChangedUtterance);
      },
      { disposer: this },
    );

    model.controlModeProperty.lazyLink(
      (): void => {
        descriptionAlertNode.addAccessibleResponse(this.controlModeChangedUtterance);
        announceToVoicing(this.controlModeChangedUtterance);
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
