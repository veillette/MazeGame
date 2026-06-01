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
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, DragListener, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import MazeGameLayoutConstants from "../MazeGameLayoutConstants.js";
import { particleTraceEnabledProperty } from "../MazeGamePreferences.js";
import { ControlMode } from "../model/ControlMode.js";
import type Level from "../model/Level.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";
import { TileType } from "../model/TileType.js";

export default class ArenaNode extends Node {
  private readonly floorRect: Rectangle;
  private readonly winRing: Circle;
  private readonly goalText: Text;
  private readonly tracePath: Path;
  private readonly particleNode: Circle;
  private readonly velocityArrow: ArrowNode;
  private readonly accelerationArrow: ArrowNode;
  private traceModelPoints: Vector2[] = [];
  private pulseTime = 0;
  private flickerTime = 0;
  private finishCenter = new Vector2(0, 0);
  private tileSizeView = 0;
  private velocityArrowScale = 0;
  private accelerationArrowScale = 0;
  private readonly modelRef: MazeGameModel;

  private readonly particleDragListener: DragListener;
  private readonly vectorMultilink: ReturnType<typeof Multilink.multilink>;
  private readonly derivedProperties: Array<{ dispose(): void }> = [];

  private readonly rebuildLevel = (level: Level): void => {
    const { wallsLayer, startTile, finishTile } = this.levelLayoutRefs;
    const modelViewTransform = this.levelLayoutRefs.modelViewTransform;
    wallsLayer.removeAllChildren();
    const tileSize = this.tileSizeView;
    for (let r = 0; r < level.data.length; r++) {
      const row = level.data[r];
      if (!row) {
        continue;
      }
      for (let c = 0; c < row.length; c++) {
        if (row[c] === TileType.WALL) {
          const x = modelViewTransform.modelToViewX(level.colToX(c));
          const y = modelViewTransform.modelToViewY(level.rowToY(r));
          wallsLayer.addChild(
            new Rectangle(x, y, tileSize, tileSize, {
              fill: MazeGameColors.wallColorProperty,
              stroke: MazeGameColors.wallShadowColorProperty,
              lineWidth: MazeGameLayoutConstants.ARENA_WALL_LINE_WIDTH,
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
    this.winRing.setRadius(tileSize * MazeGameLayoutConstants.ARENA_WIN_RING_RADIUS_FACTOR);
    this.winRing.center = this.finishCenter;
    this.goalText.centerX = this.finishCenter.x;
    this.goalText.bottom = finishY - MazeGameConstants.GOAL_LABEL_GAP_VIEW;
  };

  private readonly syncParticlePosition = (position: Vector2): void => {
    this.particleNode.translation = this.levelLayoutRefs.modelViewTransform.modelToViewPosition(position);
  };

  private readonly updateParticlePointerTarget = (): void => {
    const modelViewTransform = this.levelLayoutRefs.modelViewTransform;
    const particleRadiusView = modelViewTransform.modelToViewDeltaX(this.modelRef.particle.radius);
    const touchRadius = Math.max(particleRadiusView, MazeGameConstants.PARTICLE_MIN_TOUCH_RADIUS_VIEW);
    this.particleNode.setRadius(particleRadiusView);
    this.particleNode.mouseArea = Shape.circle(0, 0, particleRadiusView);
    this.particleNode.touchArea = Shape.circle(0, 0, touchRadius);
    this.syncParticlePosition(this.modelRef.particle.position);
  };

  private readonly updateDragCursor = (enabled: boolean): void => {
    this.particleNode.cursor = enabled ? "pointer" : "default";
  };

  private readonly clearTrace = (): void => {
    this.traceModelPoints = [];
    this.tracePath.shape = null;
  };

  private readonly appendTracePoint = (modelPosition: Vector2): void => {
    const last = this.traceModelPoints.at(-1);
    if (last && last.distance(modelPosition) < MazeGameConstants.TRACE_MIN_SEGMENT_MODEL) {
      return;
    }
    this.traceModelPoints.push(modelPosition.copy());
    this.updateTraceShape();
  };

  private readonly updateTraceShape = (): void => {
    if (this.traceModelPoints.length < 2) {
      this.tracePath.shape = null;
      return;
    }
    const transform = this.levelLayoutRefs.modelViewTransform;
    const shape = new Shape();
    const first = this.traceModelPoints[0];
    if (!first) {
      return;
    }
    const firstView = transform.modelToViewPosition(first);
    shape.moveTo(firstView.x, firstView.y);
    for (let i = 1; i < this.traceModelPoints.length; i++) {
      const point = this.traceModelPoints[i];
      if (!point) {
        continue;
      }
      const viewPoint = transform.modelToViewPosition(point);
      shape.lineTo(viewPoint.x, viewPoint.y);
    }
    this.tracePath.shape = shape;
  };

  private readonly syncTracePreference = (enabled: boolean, oldEnabled: boolean | null): void => {
    this.tracePath.visible = enabled;
    if (!enabled) {
      this.clearTrace();
      return;
    }
    if (oldEnabled === false) {
      this.clearTrace();
      this.appendTracePoint(this.modelRef.particle.position);
    }
  };

  private readonly recordTracePosition = (position: Vector2): void => {
    if (particleTraceEnabledProperty.value) {
      this.appendTracePoint(position);
    }
  };

  private readonly clearTraceOnTimerReset = (time: number, oldTime: number | null): void => {
    if (time === 0 && oldTime !== null && oldTime > 0) {
      this.clearTrace();
      if (particleTraceEnabledProperty.value) {
        this.appendTracePoint(this.modelRef.particle.position);
      }
    }
  };

  // Stored so rebuildLevel can access layout nodes created in the constructor.
  private readonly levelLayoutRefs: {
    wallsLayer: Node;
    startTile: Rectangle;
    finishTile: Rectangle;
    modelViewTransform: ModelViewTransform2;
  };

  public constructor(model: MazeGameModel, modelViewTransform: ModelViewTransform2, viewBounds: Bounds2) {
    super();
    this.modelRef = model;

    const stringManager = StringManager.getInstance();
    const a11yStrings = stringManager.getA11yStrings();

    this.floorRect = new Rectangle(viewBounds, {
      fill: MazeGameColors.floorColorProperty,
    });
    this.addChild(this.floorRect);

    const wallsLayer = new Node();
    this.addChild(wallsLayer);

    const startTile = new Rectangle(0, 0, 0, 0, {
      fill: MazeGameColors.startTileColorProperty,
    });
    this.addChild(startTile);

    const finishTile = new Rectangle(0, 0, 0, 0, {
      fill: MazeGameColors.finishColorProperty,
    });
    this.addChild(finishTile);

    this.levelLayoutRefs = { wallsLayer, startTile, finishTile, modelViewTransform };

    const finishFillProperty = new DerivedProperty(
      [
        model.collisionsProperty,
        model.wonProperty,
        MazeGameColors.finishColorProperty,
        MazeGameColors.finishClosedColorProperty,
        MazeGameColors.finishWonColorProperty,
      ],
      (collisions, won, normal, closed, victory) => {
        if (won) {
          return victory;
        }
        if (collisions > 0) {
          return closed;
        }
        return normal;
      },
    );
    finishTile.fill = finishFillProperty;
    this.derivedProperties.push(finishFillProperty);

    this.winRing = new Circle(0, {
      stroke: MazeGameColors.finishWonColorProperty,
      lineWidth: MazeGameConstants.WIN_PULSE_STROKE,
      visible: false,
    });
    this.addChild(this.winRing);

    this.goalText = new Text(stringManager.getHudStrings().wonStringProperty, {
      font: new PhetFont({ size: MazeGameLayoutConstants.ARENA_GOAL_FONT_SIZE, weight: "bold" }),
      fill: MazeGameColors.finishWonColorProperty,
      stroke: MazeGameColors.wallShadowColorProperty,
      lineWidth: MazeGameLayoutConstants.ARENA_WALL_LINE_WIDTH,
      visible: false,
      accessibleParagraph: a11yStrings.levelCompleteStringProperty,
    });
    this.addChild(this.goalText);

    const winCelebrationVisibleProperty = new DerivedProperty([model.wonProperty], (won): boolean => won);
    this.derivedProperties.push(winCelebrationVisibleProperty);
    this.winRing.visibleProperty = winCelebrationVisibleProperty;
    this.goalText.visibleProperty = winCelebrationVisibleProperty;

    model.wonProperty.link(
      (won): void => {
        if (won) {
          this.pulseTime = 0;
        }
      },
      { disposer: this },
    );

    this.tracePath = new Path(null, {
      stroke: MazeGameColors.particleTraceColorProperty,
      lineWidth: MazeGameLayoutConstants.ARENA_TRACE_LINE_WIDTH,
      lineCap: "round",
      lineJoin: "round",
      visible: false,
    });
    this.addChild(this.tracePath);

    this.particleNode = new Circle(0, {
      fill: MazeGameColors.particleColorProperty,
    });
    this.particleNode.accessibleName = a11yStrings.particleStringProperty;
    this.addChild(this.particleNode);

    particleTraceEnabledProperty.link(this.syncTracePreference, { disposer: this });
    model.particle.positionProperty.link(this.syncParticlePosition, { disposer: this });
    model.particle.positionProperty.link(this.recordTracePosition, { disposer: this });
    model.timeProperty.link(this.clearTraceOnTimerReset, { disposer: this });

    const dragEnabledProperty = new DerivedProperty(
      [model.controlModeProperty, model.wonProperty],
      (mode, won): boolean => mode === ControlMode.POSITION && !won,
    );
    this.derivedProperties.push(dragEnabledProperty);
    this.particleNode.pickableProperty = dragEnabledProperty;
    dragEnabledProperty.link(this.updateDragCursor, { disposer: this });

    this.particleDragListener = new DragListener({
      drag: (event) => {
        if (model.wonProperty.value || model.controlModeProperty.value !== ControlMode.POSITION) {
          return;
        }
        const local = this.levelLayoutRefs.modelViewTransform.viewToModelPosition(
          this.particleNode.globalToParentPoint(event.pointer.point),
        );
        model.particle.setPositionXY(local.x, local.y);
      },
    });
    this.particleNode.addInputListener(this.particleDragListener);

    this.velocityArrow = new ArrowNode(0, 0, 1, 0, {
      headWidth: MazeGameLayoutConstants.ARENA_ARROW_HEAD_WIDTH,
      headHeight: MazeGameLayoutConstants.ARENA_ARROW_HEAD_HEIGHT,
      tailWidth: MazeGameLayoutConstants.ARENA_ARROW_TAIL_WIDTH,
      fill: MazeGameColors.velocityVectorProperty,
      stroke: null,
      visible: false,
    });
    this.addChild(this.velocityArrow);

    this.accelerationArrow = new ArrowNode(0, 0, 1, 0, {
      headWidth: MazeGameLayoutConstants.ARENA_ARROW_HEAD_WIDTH,
      headHeight: MazeGameLayoutConstants.ARENA_ARROW_HEAD_HEIGHT,
      tailWidth: MazeGameLayoutConstants.ARENA_ARROW_TAIL_WIDTH,
      fill: MazeGameColors.accelerationVectorProperty,
      stroke: null,
      visible: false,
    });
    this.addChild(this.accelerationArrow);

    this.vectorMultilink = Multilink.multilink(
      [
        model.particle.positionProperty,
        model.particle.velocityProperty,
        model.particle.accelerationProperty,
        model.controlModeProperty,
        model.wonProperty,
      ],
      (position, velocity, acceleration, mode, won) => {
        const transform = this.levelLayoutRefs.modelViewTransform;
        const vp = transform.modelToViewPosition(position);

        const showVelocity = !won && (mode === ControlMode.VELOCITY || mode === ControlMode.ACCELERATION);
        const velMag = velocity.magnitude;
        this.velocityArrow.visible = showVelocity && velMag > MazeGameLayoutConstants.ARENA_ARROW_MIN_MAGNITUDE;
        if (this.velocityArrow.visible) {
          this.velocityArrow.setTailAndTip(
            vp.x,
            vp.y,
            vp.x + velocity.x * this.velocityArrowScale,
            vp.y + velocity.y * this.velocityArrowScale,
          );
        }

        const showAcceleration = !won && mode === ControlMode.ACCELERATION;
        const accMag = acceleration.magnitude;
        this.accelerationArrow.visible = showAcceleration && accMag > MazeGameLayoutConstants.ARENA_ARROW_MIN_MAGNITUDE;
        if (this.accelerationArrow.visible) {
          this.accelerationArrow.setTailAndTip(
            vp.x,
            vp.y,
            vp.x + acceleration.x * this.accelerationArrowScale,
            vp.y + acceleration.y * this.accelerationArrowScale,
          );
        }
      },
    );

    model.levelProperty.link(this.rebuildLevel, { disposer: this });
    this.setLayout(modelViewTransform, viewBounds);
  }

  /**
   * Recompute model-to-view mapping and arena chrome when the screen visible bounds change.
   */
  public setLayout(modelViewTransform: ModelViewTransform2, viewBounds: Bounds2): void {
    this.levelLayoutRefs.modelViewTransform = modelViewTransform;
    this.floorRect.rectBounds = viewBounds;

    this.tileSizeView = modelViewTransform.modelToViewDeltaX(MazeGameConstants.TILE_SIZE);
    this.velocityArrowScale =
      (this.tileSizeView * MazeGameLayoutConstants.ARENA_ARROW_TILE_LENGTHS) / MazeGameConstants.VELOCITY_SCALE;
    this.accelerationArrowScale =
      (this.tileSizeView * MazeGameLayoutConstants.ARENA_ARROW_TILE_LENGTHS) / MazeGameConstants.ACCELERATION_SCALE;

    this.updateParticlePointerTarget();
    this.rebuildLevel(this.modelRef.levelProperty.value);
    this.updateTraceShape();
  }

  public override dispose(): void {
    for (const derivedProperty of this.derivedProperties) {
      derivedProperty.dispose();
    }
    this.vectorMultilink.dispose();
    this.particleNode.removeInputListener(this.particleDragListener);
    this.particleDragListener.dispose();
    super.dispose();
  }

  /**
   * Advance the collision-flicker and win-pulse animations.
   * Called from MazeGameScreenView.step(dt) every animation frame.
   */
  public step(dt: number): void {
    if (this.modelRef.particle.collidingProperty.value) {
      this.flickerTime += dt;
      const period = MazeGameConstants.FLICKER_PERIOD_SECONDS;
      const flickerOn = Math.floor(this.flickerTime / period) % 2 === 0;
      this.particleNode.opacity = flickerOn ? MazeGameConstants.PARTICLE_COLLIDING_OPACITY : 1;
    } else {
      this.flickerTime = 0;
      this.particleNode.opacity = 1;
    }

    if (!this.modelRef.wonProperty.value) {
      return;
    }
    const duration = MazeGameConstants.WIN_PULSE_DURATION;
    this.pulseTime = (this.pulseTime + dt) % duration;
    const t = this.pulseTime / duration;
    const scale =
      MazeGameLayoutConstants.ARENA_WIN_PULSE_MIN_SCALE +
      (MazeGameLayoutConstants.ARENA_WIN_PULSE_MAX_SCALE - MazeGameLayoutConstants.ARENA_WIN_PULSE_MIN_SCALE) * t;
    this.winRing.setScaleMagnitude(scale);
    this.winRing.center = this.finishCenter;
    this.winRing.opacity = 1 - t;
  }
}
