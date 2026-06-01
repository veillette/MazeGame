/**
 * createSonificationProperties.ts
 *
 * DerivedProperty helpers for continuous sound sonification tied to model state.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Tandem } from "scenerystack/tandem";
import { ControlMode } from "../model/ControlMode.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

export const createVelocityMagnitudeSonificationProperty = (model: MazeGameModel): TReadOnlyProperty<number> => {
  return new DerivedProperty(
    [model.particle.velocityProperty, model.controlModeProperty, model.wonProperty],
    (velocity, mode, won): number => {
      if (won) {
        return 0;
      }
      if (mode !== ControlMode.VELOCITY && mode !== ControlMode.ACCELERATION) {
        return 0;
      }
      return velocity.magnitude;
    },
    { phetioFeatured: false, tandem: Tandem.OPT_OUT },
  );
};

export const velocitySonificationRange = (): { min: number; max: number } => ({
  min: 0,
  max: MazeGameConstants.VELOCITY_SONIFICATION_MAX,
});
