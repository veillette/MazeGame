/**
 * ArenaPaints.ts
 *
 * Procedural fills and overlay graphics for the maze arena (walls, particle, goal).
 * Colors come from MazeGameColors; geometry scales with view tile size.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Color, Node, Path, Pattern, RadialGradient, VoicingNode } from "scenerystack/scenery";
import { StarShape } from "scenerystack/scenery-phet";
import MazeGameColors, { TRANSPARENT_COLOR } from "../../MazeGameColors.js";
import MazeGameLayoutConstants from "../MazeGameLayoutConstants.js";

function toColor(paint: Color | string): Color {
  return paint instanceof Color ? paint : Color.toColor(paint);
}

/**
 * Repeatable brick-wall pattern for wall tiles.
 */
export function createBrickWallPattern(tileSizeView: number, wallColor: Color, shadowColor: Color): Pattern {
  const unit = Math.max(MazeGameLayoutConstants.ARENA_BRICK_PATTERN_MIN_UNIT_PX, Math.round(tileSizeView));
  const canvas = document.createElement("canvas");
  canvas.width = unit;
  canvas.height = unit;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is unavailable for wall texture.");
  }

  const mortar = shadowColor.toCSS();
  const brick = wallColor.toCSS();
  const highlight = wallColor.brighterColor(MazeGameLayoutConstants.ARENA_BRICK_HIGHLIGHT_FACTOR).toCSS();
  const shade = wallColor.darkerColor(MazeGameLayoutConstants.ARENA_BRICK_SHADE_FACTOR).toCSS();
  const mortarWidth = Math.max(1, Math.round(unit * MazeGameLayoutConstants.ARENA_BRICK_MORTAR_RATIO));
  const rowHeight = Math.floor(
    (unit - mortarWidth * (MazeGameLayoutConstants.ARENA_BRICK_ROW_COUNT + 1)) /
      MazeGameLayoutConstants.ARENA_BRICK_ROW_COUNT,
  );
  const brickHeight = Math.max(1, rowHeight);

  context.fillStyle = mortar;
  context.fillRect(0, 0, unit, unit);

  const drawBrick = (x: number, y: number, width: number, height: number, shaded: boolean): void => {
    context.fillStyle = brick;
    context.fillRect(x, y, width, height);
    context.fillStyle = shaded ? shade : highlight;
    context.fillRect(x, y, width, Math.max(1, Math.floor(height * MazeGameLayoutConstants.ARENA_BRICK_TOP_BAND_RATIO)));
    context.fillStyle = shaded ? highlight : shade;
    context.fillRect(
      x,
      y + height - Math.max(1, Math.floor(height * MazeGameLayoutConstants.ARENA_BRICK_BOTTOM_BAND_RATIO)),
      width,
      Math.max(1, Math.floor(height * MazeGameLayoutConstants.ARENA_BRICK_BOTTOM_BAND_RATIO)),
    );
  };

  let rowY = mortarWidth;
  for (let row = 0; row < MazeGameLayoutConstants.ARENA_BRICK_ROW_COUNT; row++) {
    const offset =
      row % 2 === 0
        ? mortarWidth
        : mortarWidth + Math.floor(unit * MazeGameLayoutConstants.ARENA_BRICK_ROW_OFFSET_RATIO);
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
  const highlightOffset = radiusView * MazeGameLayoutConstants.ARENA_PARTICLE_RADIAL_HIGHLIGHT_OFFSET_RATIO;
  return new RadialGradient(-highlightOffset, -highlightOffset, 0, 0, 0, radiusView)
    .addColorStop(
      MazeGameLayoutConstants.ARENA_PARTICLE_RADIAL_STOP_HIGHLIGHT,
      MazeGameColors.particleHighlightColorProperty,
    )
    .addColorStop(MazeGameLayoutConstants.ARENA_PARTICLE_RADIAL_STOP_BODY, MazeGameColors.particleColorProperty)
    .addColorStop(MazeGameLayoutConstants.ARENA_PARTICLE_RADIAL_STOP_SHADE, MazeGameColors.particleShadeColorProperty)
    .addColorStop(
      MazeGameLayoutConstants.ARENA_PARTICLE_RADIAL_STOP_STROKE,
      MazeGameColors.particleStrokeColorProperty,
    );
}

/**
 * Soft outer glow behind the particle.
 */
export function createParticleGlowFill(radiusView: number): RadialGradient {
  const glowRadius = radiusView * MazeGameLayoutConstants.ARENA_PARTICLE_GLOW_GRADIENT_OUTER_RATIO;
  return new RadialGradient(
    0,
    0,
    radiusView * MazeGameLayoutConstants.ARENA_PARTICLE_GLOW_GRADIENT_INNER_RATIO,
    0,
    0,
    glowRadius,
  )
    .addColorStop(0, MazeGameColors.particleGlowColorProperty)
    .addColorStop(1, TRANSPARENT_COLOR);
}

export type ParticleVisualNodes = {
  readonly root: VoicingNode;
  readonly glow: Circle;
  readonly body: Circle;
  readonly specular: Circle;
};

/**
 * Layered circles: glow, shaded body, and specular highlight.
 */
export function createParticleVisual(radiusView: number): ParticleVisualNodes {
  const glow = new Circle(radiusView * MazeGameLayoutConstants.ARENA_PARTICLE_GLOW_RADIUS_RATIO, {
    fill: createParticleGlowFill(radiusView),
    pickable: false,
  });
  const body = new Circle(radiusView, {
    fill: createParticleRadialFill(radiusView),
    stroke: MazeGameColors.particleStrokeColorProperty,
    lineWidth: Math.max(1, radiusView * MazeGameLayoutConstants.ARENA_PARTICLE_BODY_STROKE_RATIO),
  });
  const specular = new Circle(radiusView * MazeGameLayoutConstants.ARENA_PARTICLE_SPECULAR_RADIUS_RATIO, {
    fill: MazeGameColors.particleSpecularColorProperty,
    centerX: -radiusView * MazeGameLayoutConstants.ARENA_PARTICLE_SPECULAR_OFFSET_X_RATIO,
    centerY: -radiusView * MazeGameLayoutConstants.ARENA_PARTICLE_SPECULAR_OFFSET_Y_RATIO,
    pickable: false,
  });
  const root = new VoicingNode({ children: [glow, body, specular] });
  return { root, glow, body, specular };
}

/**
 * Bullseye rings, diagonal stripes, and star marker on the finish tile.
 */
export function createGoalOverlayNode(tileSizeView: number): Node {
  const size = tileSizeView;
  const center = size / 2;
  const ringStroke = Math.max(1, size * MazeGameLayoutConstants.ARENA_GOAL_RING_STROKE_RATIO);

  const rings = new Path(null, {
    stroke: MazeGameColors.goalMarkerColorProperty,
    lineWidth: ringStroke,
    pickable: false,
  });
  const ringShape = new Shape();
  for (const radiusRatio of MazeGameLayoutConstants.ARENA_GOAL_RING_RADIUS_RATIOS) {
    ringShape.circle(center, center, size * radiusRatio);
  }
  rings.shape = ringShape;

  const starRadius = size * MazeGameLayoutConstants.ARENA_GOAL_STAR_RADIUS_RATIO;
  const star = new Path(
    new StarShape({
      outerRadius: starRadius,
      innerRadius: starRadius * MazeGameLayoutConstants.ARENA_GOAL_STAR_INNER_RADIUS_RATIO,
    }),
    {
      fill: MazeGameColors.goalStarFillColorProperty,
      stroke: MazeGameColors.goalMarkerColorProperty,
      lineWidth: Math.max(1, size * MazeGameLayoutConstants.ARENA_GOAL_STAR_STROKE_RATIO),
      pickable: false,
    },
  );
  star.center = new Vector2(center, center);

  const stripeWidth = Math.max(1, size * MazeGameLayoutConstants.ARENA_GOAL_STRIPE_WIDTH_RATIO);
  const [stripeStartX1, stripeStartX2] = MazeGameLayoutConstants.ARENA_GOAL_STRIPE_START_X_RATIOS;
  const [stripeEndX1, stripeEndX2] = MazeGameLayoutConstants.ARENA_GOAL_STRIPE_END_X_RATIOS;
  const stripes = new Path(
    new Shape()
      .moveTo(0, size)
      .lineTo(size, 0)
      .moveTo(size * stripeStartX1, size)
      .lineTo(size * stripeEndX1, 0)
      .moveTo(size * stripeStartX2, size)
      .lineTo(size * stripeEndX2, 0),
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
  wallColorProperty: TReadOnlyProperty<Color>,
  wallShadowColorProperty: TReadOnlyProperty<Color>,
): Pattern {
  return createBrickWallPattern(tileSizeView, toColor(wallColorProperty.value), toColor(wallShadowColorProperty.value));
}
