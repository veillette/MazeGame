/**
 * createA11yDerivedProperties.ts
 *
 * Shared DerivedStringProperty helpers for accessibility strings that depend on
 * model state (level name, control mode label).
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { DerivedStringProperty } from "scenerystack/axon";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import { ControlMode } from "../model/ControlMode.js";
import { LevelKey } from "../model/Levels.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

export const createLevelNameStringProperty = (model: MazeGameModel) => {
  const levelStrings = StringManager.getInstance().getLevelStrings();

  return new DerivedStringProperty(
    [
      model.levelNameProperty,
      levelStrings.practiceStringProperty,
      levelStrings.level1StringProperty,
      levelStrings.level2StringProperty,
      levelStrings.certainDeathStringProperty,
    ],
    (levelKey, practice, level1, level2, certainDeath): string => {
      switch (levelKey) {
        case LevelKey.PRACTICE:
          return practice;
        case LevelKey.LEVEL_1:
          return level1;
        case LevelKey.LEVEL_2:
          return level2;
        case LevelKey.CERTAIN_DEATH:
          return certainDeath;
        default:
          return practice;
      }
    },
    { phetioFeatured: false, tandem: Tandem.OPT_OUT },
  );
};

export const createControlModeNameStringProperty = (model: MazeGameModel) => {
  const controlModeStrings = StringManager.getInstance().getControlModeStrings();

  return new DerivedStringProperty(
    [
      model.controlModeProperty,
      controlModeStrings.positionStringProperty,
      controlModeStrings.velocityStringProperty,
      controlModeStrings.accelerationStringProperty,
    ],
    (mode, position, velocity, acceleration): string => {
      switch (mode) {
        case ControlMode.POSITION:
          return position;
        case ControlMode.VELOCITY:
          return velocity;
        case ControlMode.ACCELERATION:
          return acceleration;
        default:
          return position;
      }
    },
    { phetioFeatured: false, tandem: Tandem.OPT_OUT },
  );
};

export const createModeDependentHelpTextProperty = (
  controlModeProperty: TReadOnlyProperty<ControlMode>,
  positionHelp: TReadOnlyProperty<string>,
  velocityHelp: TReadOnlyProperty<string>,
  accelerationHelp: TReadOnlyProperty<string>,
) => {
  return new DerivedStringProperty(
    [controlModeProperty, positionHelp, velocityHelp, accelerationHelp],
    (mode, positionText, velocityText, accelerationText): string => {
      switch (mode) {
        case ControlMode.POSITION:
          return positionText;
        case ControlMode.VELOCITY:
          return velocityText;
        case ControlMode.ACCELERATION:
          return accelerationText;
        default:
          return positionText;
      }
    },
    { phetioFeatured: false, tandem: Tandem.OPT_OUT },
  );
};
