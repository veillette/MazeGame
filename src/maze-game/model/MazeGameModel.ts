/**
 * MazeGameModel.ts
 *
 * The simulation model. Owns the particle, the current Level, the active
 * ControlMode, the elapsed timer, the collision counter, and the win flag.
 * The Sim framework calls step(dt) every animation frame.
 */

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

  public readonly levelNameProperty = new Property<LevelKey>(LevelKey.PRACTICE);
  public readonly levelProperty: ReadOnlyProperty<Level>;
  public readonly controlModeProperty = new Property<ControlMode>(ControlMode.POSITION);
  public readonly timeProperty = new NumberProperty(0);
  public readonly collisionsProperty = new NumberProperty(0);
  public readonly wonProperty = new BooleanProperty(false);

  // Track previous colliding state so we only increment the counter on
  // false → true transitions (i.e. each fresh contact counts as one collision).
  private previousColliding = false;

  // Fixed-timestep accumulator (seconds of unconsumed wall-clock time).
  private timeAccumulator = 0;

  public constructor() {
    this.levelProperty = new DerivedProperty([this.levelNameProperty], (name) => LEVELS[name]);

    // Reset particle position & game state when the level changes.
    this.levelNameProperty.lazyLink(() => this.resetGameState());

    // Reset the dormant kinematic vectors whenever the control mode changes
    // (mirrors the original UX: switching modes zeroes the unused vectors).
    this.controlModeProperty.lazyLink((mode) => {
      if (mode === ControlMode.POSITION) {
        this.particle.setVelocityXY(0, 0);
        this.particle.setAccelerationXY(0, 0);
      } else if (mode === ControlMode.VELOCITY) {
        this.particle.setAccelerationXY(0, 0);
      }
    });

    // Place the particle at the start tile of the initial level.
    this.placeParticleAtStart();
  }

  public step(dt: number): void {
    if (this.wonProperty.value) {
      return;
    }
    const fixed = MazeGameConstants.FIXED_DT;
    this.timeAccumulator = Math.min(this.timeAccumulator + dt, fixed * MazeGameConstants.MAX_CATCHUP_STEPS);
    while (this.timeAccumulator >= fixed && !this.wonProperty.value) {
      this.timeAccumulator -= fixed;
      this.stepInternal(fixed);
    }
  }

  private stepInternal(dt: number): void {
    const particle = this.particle;
    const mode = this.controlModeProperty.value;

    // Save pre-integration position for wall push-back bisection.
    const oldX = particle.position.x;
    const oldY = particle.position.y;

    // Integrate kinematics.
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
    // POSITION mode: position is set directly by drag/keyboard listeners.

    // Collision detection (wall).
    const level = this.levelProperty.value;
    const colliding = level.collidesWithTileTypeAt(
      TileType.WALL,
      particle.position.x,
      particle.position.y,
      particle.radius,
    );

    // Wall push-back for physics-integrated modes: bisect back to the last
    // non-colliding position so the particle never tunnels through a wall.
    if (colliding && mode !== ControlMode.POSITION) {
      const wasAlreadyColliding = level.collidesWithTileTypeAt(TileType.WALL, oldX, oldY, particle.radius);
      if (!wasAlreadyColliding) {
        let safeX = oldX;
        let safeY = oldY;
        let testX = particle.position.x;
        let testY = particle.position.y;
        for (let i = 0; i < 8; i++) {
          const midX = (safeX + testX) / 2;
          const midY = (safeY + testY) / 2;
          if (level.collidesWithTileTypeAt(TileType.WALL, midX, midY, particle.radius)) {
            testX = midX;
            testY = midY;
          } else {
            safeX = midX;
            safeY = midY;
          }
        }
        particle.setPositionXY(safeX, safeY);
      }
      // Zero velocity so the particle doesn't bore into the wall next frame.
      particle.setVelocityXY(0, 0);
    }

    particle.collidingProperty.value = colliding;
    if (colliding && !this.previousColliding) {
      this.collisionsProperty.value += 1;
    }
    this.previousColliding = colliding;

    // Win check: touching finish with zero collisions.
    if (
      this.collisionsProperty.value === 0 &&
      level.collidesWithTileTypeAt(TileType.FINISH, particle.position.x, particle.position.y, particle.radius)
    ) {
      this.wonProperty.value = true;
    }

    // Advance the timer if the particle has moved off the start tile.
    if (this.hasStartedMoving()) {
      this.timeProperty.value += dt;
    }
  }

  public changeLevel(name: LevelKey): void {
    this.levelNameProperty.value = name;
  }

  public reset(): void {
    this.levelNameProperty.reset();
    this.controlModeProperty.reset();
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
    const idx = LEVEL_KEYS.indexOf(this.levelNameProperty.value);
    if (idx < LEVEL_KEYS.length - 1) {
      const next = LEVEL_KEYS[idx + 1];
      if (next !== undefined) {
        this.levelNameProperty.value = next;
      }
    }
  }

  /** True when the player is on the last available level. */
  public get isLastLevel(): boolean {
    return LEVEL_KEYS.indexOf(this.levelNameProperty.value) === LEVEL_KEYS.length - 1;
  }

  private resetGameState(): void {
    this.timeProperty.reset();
    this.collisionsProperty.reset();
    this.wonProperty.reset();
    this.previousColliding = false;
    this.timeAccumulator = 0;
    this.particle.setVelocityXY(0, 0);
    this.particle.setAccelerationXY(0, 0);
    this.placeParticleAtStart();
  }

  private placeParticleAtStart(): void {
    const start = this.levelProperty.value.startPosition();
    const center = this.levelProperty.value.tileCenter(start.col, start.row);
    this.particle.setPositionXY(center.x, center.y);
    this.particle.collidingProperty.value = false;
  }

  /**
   * Has the particle moved off its starting tile? Used to gate the timer so
   * it doesn't tick while the user is still setting up.
   */
  private hasStartedMoving(): boolean {
    const level = this.levelProperty.value;
    const start = level.startPosition();
    const startCenter = level.tileCenter(start.col, start.row);
    const dx = this.particle.position.x - startCenter.x;
    const dy = this.particle.position.y - startCenter.y;
    // Movement threshold: a fraction of a tile so jitter doesn't start the timer.
    const threshold = MazeGameConstants.TILE_SIZE * 0.1;
    return dx * dx + dy * dy > threshold * threshold;
  }
}
