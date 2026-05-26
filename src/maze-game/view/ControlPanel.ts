/**
 * ControlPanel.ts
 *
 * A control panel with three tabs (Position / Velocity / Acceleration) and a
 * square drag-pad. Dragging the knob inside the pad updates whichever
 * kinematic Property the active mode targets, and the arrow visualizes the
 * current state of that Property when the user isn't dragging.
 *
 * Mirrors the pixi MazeGame ParticleControlView; structurally inspired by the
 * LadyBug RemoteControlPanel.
 */

import { Multilink } from "scenerystack/axon";
import { Bounds2, clamp, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, DragListener, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import { Panel, RectangularRadioButtonGroup } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import { ControlMode } from "../model/ControlMode.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

const AREA = MazeGameConstants.REMOTE_PAD_SIZE;
const HALF = AREA / 2;

const TITLE_FONT_SIZE = 16;
const TAB_FONT_SIZE = 13;

const ARROW_HEAD_WIDTH = 14;
const ARROW_HEAD_HEIGHT = 14;
const ARROW_TAIL_WIDTH = 5;

const KNOB_RADIUS = 9;
const KNOB_STROKE = "rgba(0,0,0,0.4)";

const TAB_SPACING = 4;
const PAD_CORNER_RADIUS = 4;
const PANEL_CORNER_RADIUS = 6;
const PANEL_X_MARGIN = 12;
const PANEL_Y_MARGIN = 10;
const VBOX_SPACING = 8;

const COLOR_BY_MODE = {
  [ControlMode.POSITION]: MazeGameColors.positionVectorProperty,
  [ControlMode.VELOCITY]: MazeGameColors.velocityVectorProperty,
  [ControlMode.ACCELERATION]: MazeGameColors.accelerationVectorProperty,
};

export default class ControlPanel extends Panel {
  public constructor(model: MazeGameModel) {
    const strings = StringManager.getInstance().getControlModeStrings();

    const titleFont = new PhetFont({ size: TITLE_FONT_SIZE, weight: "bold" });
    const tabFont = new PhetFont(TAB_FONT_SIZE);

    const header = new Text(strings.titleStringProperty, {
      font: titleFont,
      fill: MazeGameColors.foregroundColorProperty,
    });

    const tabs = new RectangularRadioButtonGroup<ControlMode>(
      model.controlModeProperty,
      [
        {
          value: ControlMode.POSITION,
          createNode: () => new Text(strings.positionStringProperty, { font: tabFont, fill: COLOR_BY_MODE.position }),
        },
        {
          value: ControlMode.VELOCITY,
          createNode: () => new Text(strings.velocityStringProperty, { font: tabFont, fill: COLOR_BY_MODE.velocity }),
        },
        {
          value: ControlMode.ACCELERATION,
          createNode: () =>
            new Text(strings.accelerationStringProperty, { font: tabFont, fill: COLOR_BY_MODE.acceleration }),
        },
      ],
      { orientation: "horizontal", spacing: TAB_SPACING },
    );

    const padBackground = new Rectangle(-HALF, -HALF, AREA, AREA, {
      fill: MazeGameColors.padFillProperty,
      cornerRadius: PAD_CORNER_RADIUS,
    });
    const arrow = new ArrowNode(0, 0, 0, 0, {
      headWidth: ARROW_HEAD_WIDTH,
      headHeight: ARROW_HEAD_HEIGHT,
      tailWidth: ARROW_TAIL_WIDTH,
      stroke: null,
    });
    const knob = new Circle(KNOB_RADIUS, { cursor: "pointer", stroke: KNOB_STROKE });
    const padLayer = new Node({
      clipArea: Shape.bounds(new Bounds2(-HALF, -HALF, HALF, HALF)),
      children: [arrow, knob],
    });
    const pad = new Node({ children: [padBackground, padLayer] });

    const content = new VBox({ spacing: VBOX_SPACING, children: [header, tabs, pad] });
    super(content, {
      fill: MazeGameColors.panelFillProperty,
      stroke: MazeGameColors.panelStrokeProperty,
      cornerRadius: PANEL_CORNER_RADIUS,
      xMargin: PANEL_X_MARGIN,
      yMargin: PANEL_Y_MARGIN,
    });

    let isDragging = false;

    const setTip = (tip: Vector2): void => {
      arrow.setTailAndTip(0, 0, tip.x, tip.y);
      knob.center = tip;
    };

    const LEVEL_W = MazeGameConstants.LEVEL_WIDTH * MazeGameConstants.TILE_SIZE;
    const LEVEL_H = MazeGameConstants.LEVEL_HEIGHT * MazeGameConstants.TILE_SIZE;

    // pad-coordinate tip ↔ model-units (active mode determines the mapping).
    const tipFromModel = (): Vector2 => {
      const mode = model.controlModeProperty.value;
      const particle = model.particle;
      let tip: Vector2;
      if (mode === ControlMode.POSITION) {
        // Map model x ∈ [-W/2, W/2] → pad x ∈ [-HALF, HALF]; same for y.
        tip = new Vector2((particle.position.x / (LEVEL_W / 2)) * HALF, (particle.position.y / (LEVEL_H / 2)) * HALF);
      } else if (mode === ControlMode.VELOCITY) {
        tip = new Vector2(
          (particle.velocity.x / MazeGameConstants.VELOCITY_SCALE) * HALF,
          (particle.velocity.y / MazeGameConstants.VELOCITY_SCALE) * HALF,
        );
      } else {
        tip = new Vector2(
          (particle.acceleration.x / MazeGameConstants.ACCELERATION_SCALE) * HALF,
          (particle.acceleration.y / MazeGameConstants.ACCELERATION_SCALE) * HALF,
        );
      }
      return new Vector2(clamp(tip.x, -HALF, HALF), clamp(tip.y, -HALF, HALF));
    };

    const applyTipToModel = (tip: Vector2): void => {
      const mode = model.controlModeProperty.value;
      const particle = model.particle;
      if (mode === ControlMode.POSITION) {
        particle.setPositionXY((tip.x / HALF) * (LEVEL_W / 2), (tip.y / HALF) * (LEVEL_H / 2));
      } else if (mode === ControlMode.VELOCITY) {
        particle.setVelocityXY(
          (tip.x / HALF) * MazeGameConstants.VELOCITY_SCALE,
          (tip.y / HALF) * MazeGameConstants.VELOCITY_SCALE,
        );
      } else {
        particle.setAccelerationXY(
          (tip.x / HALF) * MazeGameConstants.ACCELERATION_SCALE,
          (tip.y / HALF) * MazeGameConstants.ACCELERATION_SCALE,
        );
      }
    };

    const reflect = (): void => {
      if (isDragging) {
        return;
      }
      setTip(tipFromModel());
    };

    knob.addInputListener(
      new DragListener({
        start: () => {
          isDragging = true;
        },
        drag: (event) => {
          const local = padLayer.globalToLocalPoint(event.pointer.point);
          const tip = new Vector2(clamp(local.x, -HALF, HALF), clamp(local.y, -HALF, HALF));
          setTip(tip);
          applyTipToModel(tip);
        },
        end: () => {
          isDragging = false;
        },
      }),
    );

    // Recolor arrow + knob per active mode.
    model.controlModeProperty.link((mode) => {
      const color = COLOR_BY_MODE[mode];
      arrow.fill = color;
      knob.fill = color;
    });

    // Keep the arrow in sync with the underlying Properties whenever they
    // change externally (keyboard input, mode-switch zeroing, reset, etc.).
    Multilink.multilink(
      [
        model.particle.positionProperty,
        model.particle.velocityProperty,
        model.particle.accelerationProperty,
        model.controlModeProperty,
      ],
      reflect,
    );
  }
}
