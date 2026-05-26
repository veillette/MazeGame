/**
 * Particle.ts
 *
 * The player character: a circle with a position, velocity, and acceleration,
 * each exposed as an axon Property so the view can react.
 *
 * The pixi version had an `update(time, dt)` method that integrated based on
 * its own `mode` attribute. Here, integration moves into MazeGameModel.step so
 * the active ControlMode (which is part of the model, not the particle) is
 * available.
 */

import { BooleanProperty } from "scenerystack/axon";
import { Vector2, Vector2Property } from "scenerystack/dot";
import MazeGameConstants from "./MazeGameConstants.js";

export default class Particle {
  public readonly positionProperty = new Vector2Property(new Vector2(0, 0));
  public readonly velocityProperty = new Vector2Property(new Vector2(0, 0));
  public readonly accelerationProperty = new Vector2Property(new Vector2(0, 0));
  public readonly collidingProperty = new BooleanProperty(false);

  public readonly radius = MazeGameConstants.PARTICLE_RADIUS;

  public get position(): Vector2 {
    return this.positionProperty.value;
  }

  public get velocity(): Vector2 {
    return this.velocityProperty.value;
  }

  public get acceleration(): Vector2 {
    return this.accelerationProperty.value;
  }

  public setPositionXY(x: number, y: number): void {
    this.positionProperty.value = new Vector2(x, y);
  }

  public setVelocityXY(x: number, y: number): void {
    this.velocityProperty.value = new Vector2(x, y);
  }

  public setAccelerationXY(x: number, y: number): void {
    this.accelerationProperty.value = new Vector2(x, y);
  }

  public reset(): void {
    this.positionProperty.reset();
    this.velocityProperty.reset();
    this.accelerationProperty.reset();
    this.collidingProperty.reset();
  }
}
