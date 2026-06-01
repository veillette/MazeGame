/**
 * MazeGameModel.ts
 *
 * The simulation model. Owns the particle, the current Level, the active
 * ControlMode, the elapsed timer, the collision counter, and the win flag.
 * The Sim framework calls step(dt) every animation frame.
 */

import { assert } from "scenerystack/assert";
import { BooleanProperty, DerivedProperty, NumberProperty, Property, type ReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { ControlMode } from "./ControlMode.js";
import type Level from "./Level.js";
import { LEVEL_KEYS, LEVELS, LevelKey } from "./Levels.js";
import MazeGameConstants from "./MazeGameConstants.js";
import Particle from "./Particle.js";
import { TileType } from "./TileType.js";

export class MazeGameModel implements TModel {
  public readonly particle = new Particle();

  private readonly levelNamePropertyImpl = new Property<LevelKey>(LevelKey.PRACTICE);
  private readonly controlModePropertyImpl = new Property<ControlMode>(ControlMode.POSITION);
  private readonly timePropertyImpl = new NumberProperty(0);
  private readonly collisionsPropertyImpl = new NumberProperty(0);
  private readonly wonPropertyImpl = new BooleanProperty(false);
  private readonly gameGenerationPropertyImpl = new NumberProperty(0);

  public readonly levelProperty: ReadOnlyProperty<Level>;
  public readonly isLastLevelProperty: ReadOnlyProperty<boolean>;

  public get levelNameProperty(): ReadOnlyProperty<LevelKey> {
    return this.levelNamePropertyImpl;
  }

  public get controlModeProperty(): ReadOnlyProperty<ControlMode> {
    return this.controlModePropertyImpl;
  }

  public get timeProperty(): ReadOnlyProperty<number> {
    return this.timePropertyImpl;
  }

  public get collisionsProperty(): ReadOnlyProperty<number> {
    return this.collisionsPropertyImpl;
  }

  public get wonProperty(): ReadOnlyProperty<boolean> {
    return this.wonPropertyImpl;
  }

  /** Increments whenever per-level game state is reset (retry, level change, reset all). */
  public get gameGenerationProperty(): ReadOnlyProperty<number> {
    return this.gameGenerationPropertyImpl;
  }

  // Track previous colliding state so we only increment the counter on
  // false → true transitions (i.e. each fresh contact counts as one collision).
  private previousColliding = false;

  // Start-tile center cached at level load so hasStartedMoving() avoids a
  // full grid scan on every physics substep.
  private cachedStartCenter: { x: number; y: number } = { x: 0, y: 0 };

  // Fixed-timestep accumulator (seconds of unconsumed wall-clock time).
  private timeAccumulator = 0;

  private readonly resetOnLevelChange = (): void => {
    this.resetGameState();
  };

  private readonly resetKinematicsOnModeChange = (mode: ControlMode): void => {
    if (mode === ControlMode.POSITION) {
      this.particle.setVelocityXY(0, 0);
      this.particle.setAccelerationXY(0, 0);
    } else if (mode === ControlMode.VELOCITY) {
      this.particle.setAccelerationXY(0, 0);
    }
  };

  public constructor() {
    this.levelProperty = new DerivedProperty([this.levelNamePropertyImpl], (name: LevelKey): Level => LEVELS[name]);
    this.isLastLevelProperty = new DerivedProperty(
      [this.levelNamePropertyImpl],
      (name: LevelKey): boolean => LEVEL_KEYS.indexOf(name) === LEVEL_KEYS.length - 1,
    );

    // Reset particle position & game state when the level changes.
    this.levelNamePropertyImpl.lazyLink(this.resetOnLevelChange);

    // Reset the dormant kinematic vectors whenever the control mode changes
    // (mirrors the original UX: switching modes zeroes the unused vectors).
    this.controlModePropertyImpl.lazyLink(this.resetKinematicsOnModeChange);

    // Place the particle at the start tile of the initial level.
    this.placeParticleAtStart();
  }

  public dispose(): void {
    this.levelNamePropertyImpl.unlink(this.resetOnLevelChange);
    this.controlModePropertyImpl.unlink(this.resetKinematicsOnModeChange);
    this.isLastLevelProperty.dispose();
    this.levelProperty.dispose();
    this.levelNamePropertyImpl.dispose();
    this.controlModePropertyImpl.dispose();
    this.timePropertyImpl.dispose();
    this.collisionsPropertyImpl.dispose();
    this.wonPropertyImpl.dispose();
    this.gameGenerationPropertyImpl.dispose();
    this.particle.dispose();
  }

  public step(dt: number): void {
    if (this.wonPropertyImpl.value) {
      return;
    }
    const fixed = MazeGameConstants.FIXED_DT;
    this.timeAccumulator = Math.min(this.timeAccumulator + dt, fixed * MazeGameConstants.MAX_CATCHUP_STEPS);
    while (this.timeAccumulator >= fixed && !this.wonPropertyImpl.value) {
      this.timeAccumulator -= fixed;
      this.stepInternal(fixed);
    }
  }

  private stepInternal(dt: number): void {
    assert?.(dt > 0, "stepInternal dt must be positive");
    const particle = this.particle;
    const mode = this.controlModePropertyImpl.value;
    const level = this.levelProperty.value;
    const radius = particle.radius;

    // Save pre-integration position for wall push-back bisection.
    const oldX = particle.position.x;
    const oldY = particle.position.y;
    const wasCollidingBefore =
      mode !== ControlMode.POSITION && level.collidesWithTileTypeAt(TileType.WALL, oldX, oldY, radius);

    // Do not integrate while already overlapping a wall (prevents tunneling).
    if (!wasCollidingBefore) {
      if (mode === ControlMode.VELOCITY) {
        const v = particle.velocity;
        particle.setPositionXY(particle.position.x + v.x * dt, particle.position.y + v.y * dt);
      } else if (mode === ControlMode.ACCELERATION) {
        const v = particle.velocity;
        const a = particle.acceleration;
        const newVx = v.x + a.x * dt;
        const newVy = v.y + a.y * dt;
        particle.setPositionXY(
          particle.position.x + v.x * dt + 0.5 * a.x * dt * dt,
          particle.position.y + v.y * dt + 0.5 * a.y * dt * dt,
        );
        particle.setVelocityXY(newVx, newVy);
      }
    }
    // POSITION mode: position is set directly by drag/keyboard listeners.

    // Wall push-back for physics-integrated modes: bisect back to the last
    // non-colliding position so the particle never tunnels through a wall.
    let collidingAfterIntegration = false;
    if (mode !== ControlMode.POSITION) {
      collidingAfterIntegration = level.collidesWithTileTypeAt(
        TileType.WALL,
        particle.position.x,
        particle.position.y,
        radius,
      );

      if (collidingAfterIntegration) {
        if (wasCollidingBefore) {
          particle.setPositionXY(oldX, oldY);
        } else {
          const safe = level.findLastNonCollidingPoint(
            TileType.WALL,
            oldX,
            oldY,
            particle.position.x,
            particle.position.y,
            radius,
          );
          particle.setPositionXY(safe.x, safe.y);
        }
        particle.setVelocityXY(0, 0);
        if (mode === ControlMode.ACCELERATION) {
          particle.setAccelerationXY(0, 0);
        }
      }
    }

    // In physics modes use the pre-push-back result: push-back always leaves
    // the particle at a non-overlapping position, but the collision contact
    // happened and must be counted. In POSITION mode re-check the final
    // position because the user may have dragged the particle into a wall.
    const colliding =
      mode !== ControlMode.POSITION
        ? collidingAfterIntegration
        : level.collidesWithTileTypeAt(TileType.WALL, particle.position.x, particle.position.y, radius);

    particle.setColliding(colliding);
    if (colliding && !this.previousColliding) {
      this.collisionsPropertyImpl.value += 1;
    }
    this.previousColliding = colliding;

    // Win check: touching finish with zero collisions.
    if (
      this.collisionsPropertyImpl.value === 0 &&
      level.collidesWithTileTypeAt(TileType.FINISH, particle.position.x, particle.position.y, particle.radius)
    ) {
      this.wonPropertyImpl.value = true;
    }

    // Advance the timer if the particle has moved off the start tile.
    if (this.hasStartedMoving()) {
      this.timePropertyImpl.value += dt;
    }

    this.assertStepInvariants(mode, colliding);
  }

  /** Dev-time checks for simulation invariants (see vitest.setup / assert.ts). */
  private assertStepInvariants(mode: ControlMode, colliding: boolean): void {
    const particle = this.particle;

    assert?.(
      particle.collidingProperty.value === colliding,
      "particle collidingProperty must match wall collision state",
    );

    if (mode !== ControlMode.POSITION && colliding) {
      assert?.(particle.velocity.x === 0 && particle.velocity.y === 0, "velocity must be zero during wall contact");
      if (mode === ControlMode.ACCELERATION) {
        assert?.(
          particle.acceleration.x === 0 && particle.acceleration.y === 0,
          "acceleration must be zero during wall contact",
        );
      }
    }

    assert?.(!this.wonPropertyImpl.value || this.collisionsPropertyImpl.value === 0, "win requires zero collisions");
  }

  public changeLevel(name: LevelKey): void {
    this.levelNamePropertyImpl.value = name;
  }

  public setControlMode(mode: ControlMode): void {
    this.controlModePropertyImpl.value = mode;
  }

  public reset(): void {
    this.levelNamePropertyImpl.reset();
    this.controlModePropertyImpl.reset();
    this.resetGameState();
  }

  /**
   * Reset only the per-level state (counters, timer, particle pose). Keeps
   * the currently selected level and control mode so the user can retry the
   * level they're on without going back to Practice + Position.
   */
  public resetLevel(): void {
    this.resetGameState();
  }

  /** Advance to the next level in sequence, if one exists. */
  public advanceLevel(): void {
    const idx = LEVEL_KEYS.indexOf(this.levelNamePropertyImpl.value);
    if (idx >= 0 && idx < LEVEL_KEYS.length - 1) {
      const next = LEVEL_KEYS[idx + 1];
      if (next !== undefined) {
        this.levelNamePropertyImpl.value = next;
      }
    }
  }

  private resetGameState(): void {
    this.timePropertyImpl.reset();
    this.collisionsPropertyImpl.reset();
    this.wonPropertyImpl.reset();
    this.previousColliding = false;
    this.timeAccumulator = 0;
    this.particle.reset();
    this.placeParticleAtStart();
    this.gameGenerationPropertyImpl.value += 1;
  }

  private placeParticleAtStart(): void {
    const level = this.levelProperty.value;
    const start = level.startPosition();
    const center = level.tileCenter(start.col, start.row);
    this.cachedStartCenter = center;
    this.particle.setPositionXY(center.x, center.y);
    this.particle.setColliding(false);
    assert?.(
      !level.collidesWithTileTypeAt(TileType.WALL, center.x, center.y, this.particle.radius),
      "start position must not overlap a wall",
    );
  }

  /**
   * Has the particle moved off its starting tile? Used to gate the timer so
   * it doesn't tick while the user is still setting up.
   *
   * Uses a cached start center (set in placeParticleAtStart) to avoid
   * re-scanning the full tile grid on every physics substep.
   */
  private hasStartedMoving(): boolean {
    const dx = this.particle.position.x - this.cachedStartCenter.x;
    const dy = this.particle.position.y - this.cachedStartCenter.y;
    // Movement threshold: a fraction of a tile so jitter doesn't start the timer.
    const threshold = MazeGameConstants.TILE_SIZE * 0.1;
    return dx * dx + dy * dy > threshold * threshold;
  }
}
