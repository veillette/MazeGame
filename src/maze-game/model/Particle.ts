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

import { assert } from "scenerystack/assert";
import { BooleanProperty, type ReadOnlyProperty } from "scenerystack/axon";
import { Vector2, Vector2Property } from "scenerystack/dot";
import MazeGameConstants from "./MazeGameConstants.js";

const assertFiniteXY = (x: number, y: number, label: string): void => {
  assert && assert(Number.isFinite(x) && Number.isFinite(y), `${label} must be finite`);
};

export default class Particle {
  private readonly positionPropertyImpl = new Vector2Property(new Vector2(0, 0));
  private readonly velocityPropertyImpl = new Vector2Property(new Vector2(0, 0));
  private readonly accelerationPropertyImpl = new Vector2Property(new Vector2(0, 0));
  private readonly collidingPropertyImpl = new BooleanProperty(false);

  public get positionProperty(): ReadOnlyProperty<Vector2> {
    return this.positionPropertyImpl;
  }

  public get velocityProperty(): ReadOnlyProperty<Vector2> {
    return this.velocityPropertyImpl;
  }

  public get accelerationProperty(): ReadOnlyProperty<Vector2> {
    return this.accelerationPropertyImpl;
  }

  public get collidingProperty(): ReadOnlyProperty<boolean> {
    return this.collidingPropertyImpl;
  }

  public readonly radius = MazeGameConstants.PARTICLE_RADIUS;

  public get position(): Vector2 {
    return this.positionPropertyImpl.value;
  }

  public get velocity(): Vector2 {
    return this.velocityPropertyImpl.value;
  }

  public get acceleration(): Vector2 {
    return this.accelerationPropertyImpl.value;
  }

  public setPositionXY(x: number, y: number): void {
    assertFiniteXY(x, y, "position");
    this.positionPropertyImpl.value = new Vector2(x, y);
  }

  public setVelocityXY(x: number, y: number): void {
    assertFiniteXY(x, y, "velocity");
    this.velocityPropertyImpl.value = new Vector2(x, y);
  }

  public setAccelerationXY(x: number, y: number): void {
    assertFiniteXY(x, y, "acceleration");
    this.accelerationPropertyImpl.value = new Vector2(x, y);
  }

  public setColliding(value: boolean): void {
    this.collidingPropertyImpl.value = value;
  }

  public reset(): void {
    this.positionPropertyImpl.reset();
    this.velocityPropertyImpl.reset();
    this.accelerationPropertyImpl.reset();
    this.collidingPropertyImpl.reset();
  }
}
