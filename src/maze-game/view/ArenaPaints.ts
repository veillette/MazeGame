/**
 * ArenaPaints.ts
 *
 * Procedural fills and overlay graphics for the maze arena (walls, particle, goal).
 * Colors come from MazeGameColors; geometry scales with view tile size.
 */

import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Color, Node, Path, Pattern, type ProfileColorProperty, RadialGradient } from "scenerystack/scenery";
import { StarShape } from "scenerystack/scenery-phet";
import MazeGameColors from "../../MazeGameColors.js";

const BRICK_PATTERN_MIN_UNIT_PX = 12;
const BRICK_MORTAR_RATIO = 0.09;
const BRICK_ROW_COUNT = 2;

function toColor(paint: Color | string): Color {
  return paint instanceof Color ? paint : Color.toColor(paint);
}

/**
 * Repeatable brick-wall pattern for wall tiles.
 */
export function createBrickWallPattern(tileSizeView: number, wallColor: Color, shadowColor: Color): Pattern {
  const unit = Math.max(BRICK_PATTERN_MIN_UNIT_PX, Math.round(tileSizeView));
  const canvas = document.createElement("canvas");
  canvas.width = unit;
  canvas.height = unit;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is unavailable for wall texture.");
  }

  const mortar = shadowColor.toCSS();
  const brick = wallColor.toCSS();
  const highlight = wallColor.brighterColor(0.18).toCSS();
  const shade = wallColor.darkerColor(0.14).toCSS();
  const mortarWidth = Math.max(1, Math.round(unit * BRICK_MORTAR_RATIO));
  const rowHeight = Math.floor((unit - mortarWidth * (BRICK_ROW_COUNT + 1)) / BRICK_ROW_COUNT);
  const brickHeight = Math.max(1, rowHeight);

  context.fillStyle = mortar;
  context.fillRect(0, 0, unit, unit);

  const drawBrick = (x: number, y: number, width: number, height: number, shaded: boolean): void => {
    context.fillStyle = brick;
    context.fillRect(x, y, width, height);
    context.fillStyle = shaded ? shade : highlight;
    context.fillRect(x, y, width, Math.max(1, Math.floor(height * 0.22)));
    context.fillStyle = shaded ? highlight : shade;
    context.fillRect(
      x,
      y + height - Math.max(1, Math.floor(height * 0.12)),
      width,
      Math.max(1, Math.floor(height * 0.12)),
    );
  };

  let rowY = mortarWidth;
  for (let row = 0; row < BRICK_ROW_COUNT; row++) {
    const offset = row % 2 === 0 ? mortarWidth : mortarWidth + Math.floor(unit * 0.22);
    const brickWidth = Math.floor((unit - offset - mortarWidth) / 2);
    drawBrick(offset, rowY, Math.max(1, brickWidth), brickHeight, row === 1);
    const secondX = offset + brickWidth + mortarWidth;
    const secondWidth = unit - secondX - mortarWidth;
    if (secondWidth > 0) {
      drawBrick(secondX, rowY, secondWidth, brickHeight, row === 0);
    }
    rowY += brickHeight + mortarWidth;
  }

  const image = new Image();
  image.src = canvas.toDataURL();
  return new Pattern(image);
}

/**
 * Glossy sphere fill for the player particle (theme-aware via color properties).
 */
export function createParticleRadialFill(radiusView: number): RadialGradient {
  const highlightOffset = radiusView * 0.28;
  return new RadialGradient(-highlightOffset, -highlightOffset, 0, 0, 0, radiusView)
    .addColorStop(0, MazeGameColors.particleHighlightColorProperty)
    .addColorStop(0.35, MazeGameColors.particleColorProperty)
    .addColorStop(0.85, MazeGameColors.particleShadeColorProperty)
    .addColorStop(1, MazeGameColors.particleStrokeColorProperty);
}

/**
 * Soft outer glow behind the particle.
 */
export function createParticleGlowFill(radiusView: number): RadialGradient {
  const glowRadius = radiusView * 1.45;
  return new RadialGradient(0, 0, radiusView * 0.2, 0, 0, glowRadius)
    .addColorStop(0, MazeGameColors.particleGlowColorProperty)
    .addColorStop(1, "rgba(0,0,0,0)");
}

export type ParticleVisualNodes = {
  readonly root: Node;
  readonly glow: Circle;
  readonly body: Circle;
  readonly specular: Circle;
};

/**
 * Layered circles: glow, shaded body, and specular highlight.
 */
export function createParticleVisual(radiusView: number): ParticleVisualNodes {
  const glow = new Circle(radiusView * 1.35, {
    fill: createParticleGlowFill(radiusView),
    pickable: false,
  });
  const body = new Circle(radiusView, {
    fill: createParticleRadialFill(radiusView),
    stroke: MazeGameColors.particleStrokeColorProperty,
    lineWidth: Math.max(1, radiusView * 0.08),
  });
  const specular = new Circle(radiusView * 0.22, {
    fill: MazeGameColors.particleSpecularColorProperty,
    centerX: -radiusView * 0.28,
    centerY: -radiusView * 0.32,
    pickable: false,
  });
  const root = new Node({ children: [glow, body, specular] });
  return { root, glow, body, specular };
}

/**
 * Bullseye rings, diagonal stripes, and star marker on the finish tile.
 */
export function createGoalOverlayNode(tileSizeView: number): Node {
  const size = tileSizeView;
  const center = size / 2;
  const ringStroke = Math.max(1, size * 0.04);

  const rings = new Path(null, {
    stroke: MazeGameColors.goalMarkerColorProperty,
    lineWidth: ringStroke,
    pickable: false,
  });
  const ringShape = new Shape();
  const ringRadii = [size * 0.42, size * 0.28, size * 0.14];
  for (const radius of ringRadii) {
    ringShape.circle(center, center, radius);
  }
  rings.shape = ringShape;

  const starRadius = size * 0.2;
  const star = new Path(new StarShape({ outerRadius: starRadius, innerRadius: starRadius * 0.45 }), {
    fill: MazeGameColors.goalStarFillColorProperty,
    stroke: MazeGameColors.goalMarkerColorProperty,
    lineWidth: Math.max(1, size * 0.03),
    pickable: false,
  });
  star.center = new Vector2(center, center);

  const stripeWidth = Math.max(1, size * 0.07);
  const stripes = new Path(
    new Shape()
      .moveTo(0, size)
      .lineTo(size, 0)
      .moveTo(-size * 0.35, size)
      .lineTo(size * 0.65, 0)
      .moveTo(size * 0.35, size)
      .lineTo(size * 1.35, 0),
    {
      stroke: MazeGameColors.goalStripeColorProperty,
      lineWidth: stripeWidth,
      lineCap: "round",
      pickable: false,
    },
  );

  return new Node({
    children: [stripes, rings, star],
    pickable: false,
  });
}

/**
 * Rebuild wall-tile pattern when profile colors change.
 */
export function createWallFill(
  tileSizeView: number,
  wallColorProperty: ProfileColorProperty,
  wallShadowColorProperty: ProfileColorProperty,
): Pattern {
  return createBrickWallPattern(tileSizeView, toColor(wallColorProperty.value), toColor(wallShadowColorProperty.value));
}
