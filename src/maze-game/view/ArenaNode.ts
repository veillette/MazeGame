/**
 * ArenaNode.ts
 *
 * Renders the maze: floor, start tile, wall rectangles (with shadow stroke),
 * finish tile (color reflects collision/win state), a win-celebration ring +
 * "Goal!" overlay, velocity/acceleration vector arrows, and the particle.
 *
 * step(dt) advances the collision-flicker animation and the win-pulse ring.
 */

import { DerivedProperty, Multilink } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, DragListener, Node, Rectangle, Text } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import { ControlMode } from "../model/ControlMode.js";
import type Level from "../model/Level.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";
import { TileType } from "../model/TileType.js";

const PULSE_MIN_SCALE = 0.6;
const PULSE_MAX_SCALE = 1.8;
const GOAL_FONT_SIZE = 22;

// Visual scale for vector arrows: arrow is this many tile-lengths at max magnitude.
const ARROW_TILE_LENGTHS = 2.0;
const ARROW_HEAD_WIDTH = 12;
const ARROW_HEAD_HEIGHT = 12;
const ARROW_TAIL_WIDTH = 4;
// Hide the arrow when its model magnitude is below this threshold.
const ARROW_MIN_MAGNITUDE = 0.01;

export default class ArenaNode extends Node {
  private readonly winRing: Circle;
  private readonly goalText: Text;
  private readonly particleNode: Circle;
  private readonly velocityArrow: ArrowNode;
  private readonly accelerationArrow: ArrowNode;
  private pulseTime = 0;
  private flickerTime = 0;
  private finishCenter = new Vector2(0, 0);
  private readonly tileSizeView: number;
  private readonly modelRef: MazeGameModel;

  public constructor(model: MazeGameModel, modelViewTransform: ModelViewTransform2, viewBounds: Bounds2) {
    super();
    this.modelRef = model;

    // Floor (covers the full arena view region).
    const floor = new Rectangle(viewBounds, {
      fill: MazeGameColors.floorColorProperty,
    });
    this.addChild(floor);

    // Walls layer — rebuilt whenever the level changes.
    const wallsLayer = new Node();
    this.addChild(wallsLayer);

    // Start tile — a semi-transparent overlay so the player can see the origin.
    const startTile = new Rectangle(0, 0, 0, 0, {
      fill: MazeGameColors.startTileColorProperty,
    });
    this.addChild(startTile);

    // The finish tile (one Rectangle whose position changes per level).
    const finishTile = new Rectangle(0, 0, 0, 0, {
      fill: MazeGameColors.finishColorProperty,
    });
    this.addChild(finishTile);

    // Color logic: green by default, red-orange while collisions > 0, yellow on win.
    const finishFillProperty = new DerivedProperty(
      [
        model.collisionsProperty,
        model.wonProperty,
        MazeGameColors.finishColorProperty,
        MazeGameColors.finishClosedColorProperty,
        MazeGameColors.finishWonColorProperty,
      ],
      (collisions, won, normal, closed, victory) => {
        if (won) return victory;
        if (collisions > 0) return closed;
        return normal;
      },
    );
    finishTile.fill = finishFillProperty;

    this.tileSizeView = modelViewTransform.modelToViewDeltaX(MazeGameConstants.TILE_SIZE);

    // Win-celebration ring: a stroked circle that pulses on victory.
    this.winRing = new Circle(this.tileSizeView * 0.6, {
      stroke: MazeGameColors.finishWonColorProperty,
      lineWidth: MazeGameConstants.WIN_PULSE_STROKE,
      visible: false,
    });
    this.addChild(this.winRing);

    // "Goal!" text overlay — visible only when wonProperty is true.
    this.goalText = new Text(StringManager.getInstance().getHudStrings().wonStringProperty, {
      font: new PhetFont({ size: GOAL_FONT_SIZE, weight: "bold" }),
      fill: MazeGameColors.finishWonColorProperty,
      stroke: MazeGameColors.wallShadowColorProperty,
      lineWidth: 1,
      visible: false,
    });
    this.addChild(this.goalText);

    // Rebuild walls + reposition start/finish whenever level changes.
    model.levelProperty.link((level: Level) => {
      wallsLayer.removeAllChildren();
      const tileSize = this.tileSizeView;
      for (let r = 0; r < level.data.length; r++) {
        const row = level.data[r];
        if (!row) continue;
        for (let c = 0; c < row.length; c++) {
          if (row[c] === TileType.WALL) {
            const x = modelViewTransform.modelToViewX(level.colToX(c));
            const y = modelViewTransform.modelToViewY(level.rowToY(r));
            wallsLayer.addChild(
              new Rectangle(x, y, tileSize, tileSize, {
                fill: MazeGameColors.wallColorProperty,
                stroke: MazeGameColors.wallShadowColorProperty,
                lineWidth: 1,
              }),
            );
          }
        }
      }

      const startGrid = level.startPosition();
      const startX = modelViewTransform.modelToViewX(level.colToX(startGrid.col));
      const startY = modelViewTransform.modelToViewY(level.rowToY(startGrid.row));
      startTile.setRect(startX, startY, tileSize, tileSize);

      const finishGrid = level.finishPosition();
      const finishX = modelViewTransform.modelToViewX(level.colToX(finishGrid.col));
      const finishY = modelViewTransform.modelToViewY(level.rowToY(finishGrid.row));
      finishTile.setRect(finishX, finishY, tileSize, tileSize);

      this.finishCenter = new Vector2(finishX + tileSize / 2, finishY + tileSize / 2);
      this.winRing.center = this.finishCenter;
      this.goalText.centerX = this.finishCenter.x;
      this.goalText.bottom = finishY - 6;
    });

    // Toggle celebration visibility and reset its animation phase on win.
    model.wonProperty.link((won) => {
      this.winRing.visible = won;
      this.goalText.visible = won;
      if (won) this.pulseTime = 0;
    });

    // Particle.
    const particleRadiusView = modelViewTransform.modelToViewDeltaX(model.particle.radius);
    this.particleNode = new Circle(particleRadiusView, {
      fill: MazeGameColors.particleColorProperty,
    });
    this.addChild(this.particleNode);

    model.particle.positionProperty.link((position) => {
      this.particleNode.translation = modelViewTransform.modelToViewPosition(position);
    });

    // Direct drag of the particle — gated to POSITION mode via cursor/pickable.
    const dragEnabledProperty = new DerivedProperty(
      [model.controlModeProperty],
      (mode) => mode === ControlMode.POSITION,
    );
    dragEnabledProperty.link((enabled) => {
      this.particleNode.cursor = enabled ? "pointer" : "default";
      this.particleNode.pickable = enabled;
    });
    this.particleNode.addInputListener(
      new DragListener({
        drag: (event) => {
          if (model.controlModeProperty.value !== ControlMode.POSITION) return;
          const local = modelViewTransform.viewToModelPosition(
            this.particleNode.globalToParentPoint(event.pointer.point),
          );
          model.particle.setPositionXY(local.x, local.y);
        },
      }),
    );

    // ── Velocity / acceleration vector arrows ────────────────────────────────
    const velocityArrowScale = (this.tileSizeView * ARROW_TILE_LENGTHS) / MazeGameConstants.VELOCITY_SCALE;
    const accelerationArrowScale = (this.tileSizeView * ARROW_TILE_LENGTHS) / MazeGameConstants.ACCELERATION_SCALE;

    this.velocityArrow = new ArrowNode(0, 0, 1, 0, {
      headWidth: ARROW_HEAD_WIDTH,
      headHeight: ARROW_HEAD_HEIGHT,
      tailWidth: ARROW_TAIL_WIDTH,
      fill: MazeGameColors.velocityVectorProperty,
      stroke: null,
      visible: false,
    });
    this.addChild(this.velocityArrow);

    this.accelerationArrow = new ArrowNode(0, 0, 1, 0, {
      headWidth: ARROW_HEAD_WIDTH,
      headHeight: ARROW_HEAD_HEIGHT,
      tailWidth: ARROW_TAIL_WIDTH,
      fill: MazeGameColors.accelerationVectorProperty,
      stroke: null,
      visible: false,
    });
    this.addChild(this.accelerationArrow);

    Multilink.multilink(
      [
        model.particle.positionProperty,
        model.particle.velocityProperty,
        model.particle.accelerationProperty,
        model.controlModeProperty,
        model.wonProperty,
      ],
      (position, velocity, acceleration, mode, won) => {
        const vp = modelViewTransform.modelToViewPosition(position);

        const showVelocity = !won && (mode === ControlMode.VELOCITY || mode === ControlMode.ACCELERATION);
        const velMag = velocity.magnitude;
        this.velocityArrow.visible = showVelocity && velMag > ARROW_MIN_MAGNITUDE;
        if (this.velocityArrow.visible) {
          this.velocityArrow.setTailAndTip(
            vp.x,
            vp.y,
            vp.x + velocity.x * velocityArrowScale,
            vp.y + velocity.y * velocityArrowScale,
          );
        }

        const showAcceleration = !won && mode === ControlMode.ACCELERATION;
        const accMag = acceleration.magnitude;
        this.accelerationArrow.visible = showAcceleration && accMag > ARROW_MIN_MAGNITUDE;
        if (this.accelerationArrow.visible) {
          this.accelerationArrow.setTailAndTip(
            vp.x,
            vp.y,
            vp.x + acceleration.x * accelerationArrowScale,
            vp.y + acceleration.y * accelerationArrowScale,
          );
        }
      },
    );
  }

  /**
   * Advance the collision-flicker and win-pulse animations.
   * Called from MazeGameScreenView.step(dt) every animation frame.
   */
  public step(dt: number): void {
    // ── Collision flicker ──────────────────────────────────────────────────
    if (this.modelRef.particle.collidingProperty.value) {
      this.flickerTime += dt;
      const period = MazeGameConstants.FLICKER_PERIOD_SECONDS;
      const flickerOn = Math.floor(this.flickerTime / period) % 2 === 0;
      this.particleNode.opacity = flickerOn ? MazeGameConstants.PARTICLE_COLLIDING_OPACITY : 1;
    } else {
      this.flickerTime = 0;
      this.particleNode.opacity = 1;
    }

    // ── Win-pulse ring ─────────────────────────────────────────────────────
    if (!this.modelRef.wonProperty.value) return;
    const duration = MazeGameConstants.WIN_PULSE_DURATION;
    this.pulseTime = (this.pulseTime + dt) % duration;
    const t = this.pulseTime / duration;
    const scale = PULSE_MIN_SCALE + (PULSE_MAX_SCALE - PULSE_MIN_SCALE) * t;
    this.winRing.setScaleMagnitude(scale);
    this.winRing.center = this.finishCenter;
    this.winRing.opacity = 1 - t;
  }
}
