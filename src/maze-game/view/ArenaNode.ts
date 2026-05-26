/**
 * ArenaNode.ts
 *
 * Renders the maze: floor background, wall rectangles, the finish tile (whose
 * color reflects collision/win state), a win-celebration ring + "Goal!"
 * overlay that animates when the player wins, and the particle Circle. The
 * particle is directly draggable while ControlMode === POSITION.
 *
 * Owns a public step(dt) that the ScreenView calls each frame so the pulse
 * animation advances in sync with the simulation.
 */

import { DerivedProperty } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, DragListener, Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
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

export default class ArenaNode extends Node {
  private readonly winRing: Circle;
  private readonly goalText: Text;
  private pulseTime = 0;
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
      stroke: "rgba(0,0,0,0.6)",
      lineWidth: 1,
      visible: false,
    });
    this.addChild(this.goalText);

    // Rebuild walls + reposition finish whenever level changes.
    model.levelProperty.link((level: Level) => {
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
              }),
            );
          }
        }
      }

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
      if (won) {
        this.pulseTime = 0;
      }
    });

    // Particle.
    const particleRadiusView = modelViewTransform.modelToViewDeltaX(model.particle.radius);
    const particle = new Circle(particleRadiusView, {
      fill: MazeGameColors.particleColorProperty,
    });
    this.addChild(particle);

    model.particle.positionProperty.link((position) => {
      particle.translation = modelViewTransform.modelToViewPosition(position);
    });

    // Dim the particle while it's pressed against a wall.
    model.particle.collidingProperty.link((colliding) => {
      particle.opacity = colliding ? MazeGameConstants.PARTICLE_COLLIDING_OPACITY : 1;
    });

    // Direct drag of the particle — gated to POSITION mode via cursor/pickable.
    const dragEnabledProperty = new DerivedProperty(
      [model.controlModeProperty],
      (mode) => mode === ControlMode.POSITION,
    );
    dragEnabledProperty.link((enabled) => {
      particle.cursor = enabled ? "pointer" : "default";
      particle.pickable = enabled;
    });
    particle.addInputListener(
      new DragListener({
        drag: (event) => {
          if (model.controlModeProperty.value !== ControlMode.POSITION) {
            return;
          }
          const local = modelViewTransform.viewToModelPosition(particle.globalToParentPoint(event.pointer.point));
          model.particle.setPositionXY(local.x, local.y);
        },
      }),
    );
  }

  /**
   * Advance the win-celebration ring's pulse. Called from the ScreenView's
   * own step(dt) so it ticks at the same rate as the model.
   */
  public step(dt: number): void {
    if (!this.modelRef.wonProperty.value) {
      return;
    }
    const duration = MazeGameConstants.WIN_PULSE_DURATION;
    this.pulseTime = (this.pulseTime + dt) % duration;
    const t = this.pulseTime / duration;
    const scale = PULSE_MIN_SCALE + (PULSE_MAX_SCALE - PULSE_MIN_SCALE) * t;
    this.winRing.setScaleMagnitude(scale);
    this.winRing.center = this.finishCenter;
    this.winRing.opacity = 1 - t;
  }
}
