/**
 * ControlPanel.ts
 *
 * A control panel with three tabs (Position / Velocity / Acceleration) and a
 * square drag-pad. Dragging anywhere inside the pad updates whichever
 * kinematic Property the active mode targets, and the arrow visualizes the
 * current state of that Property when the user isn't dragging.
 *
 * Mirrors the pixi MazeGame ParticleControlView; structurally inspired by the
 * LadyBug RemoteControlPanel.
 */

import { Multilink } from "scenerystack/axon";
import { Bounds2, clamp, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { ProfileColorProperty } from "scenerystack/scenery";
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

const TAB_SPACING = 4;
const PAD_CORNER_RADIUS = 4;
const VBOX_SPACING = 8;

const COLOR_BY_MODE: Record<ControlMode, ProfileColorProperty> = {
  [ControlMode.POSITION]: MazeGameColors.positionVectorProperty,
  [ControlMode.VELOCITY]: MazeGameColors.velocityVectorProperty,
  [ControlMode.ACCELERATION]: MazeGameColors.accelerationVectorProperty,
};

export default class ControlPanel extends Panel {
  private readonly padLayerRef: Node;
  private readonly padDragListener: DragListener;
  private readonly reflectMultilink: ReturnType<typeof Multilink.multilink>;
  private readonly arrowRef: ArrowNode;
  private readonly knobRef: Circle;

  private readonly recolorForMode = (mode: ControlMode): void => {
    const color = COLOR_BY_MODE[mode];
    this.arrowRef.fill = color;
    this.knobRef.fill = color;
  };

  public constructor(model: MazeGameModel) {
    const stringManager = StringManager.getInstance();
    const strings = stringManager.getControlModeStrings();
    const a11yStrings = stringManager.getA11yStrings();

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
          createNode: () =>
            new Text(strings.positionShortStringProperty, {
              font: tabFont,
              fill: COLOR_BY_MODE[ControlMode.POSITION],
            }),
          options: { accessibleName: strings.positionStringProperty },
        },
        {
          value: ControlMode.VELOCITY,
          createNode: () =>
            new Text(strings.velocityShortStringProperty, {
              font: tabFont,
              fill: COLOR_BY_MODE[ControlMode.VELOCITY],
            }),
          options: { accessibleName: strings.velocityStringProperty },
        },
        {
          value: ControlMode.ACCELERATION,
          createNode: () =>
            new Text(strings.accelerationShortStringProperty, {
              font: tabFont,
              fill: COLOR_BY_MODE[ControlMode.ACCELERATION],
            }),
          options: { accessibleName: strings.accelerationStringProperty },
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
    const knob = new Circle(KNOB_RADIUS, {
      cursor: "pointer",
      stroke: MazeGameColors.knobStrokeProperty,
    });
    const padLayer = new Node({
      clipArea: Shape.bounds(new Bounds2(-HALF, -HALF, HALF, HALF)),
      children: [arrow, knob],
      cursor: "pointer",
    });
    const pad = new Node({ children: [padBackground, padLayer] });
    pad.accessibleName = a11yStrings.controlPadStringProperty;

    const content = new VBox({ spacing: VBOX_SPACING, children: [header, tabs, pad] });
    super(content, {
      fill: MazeGameColors.panelFillProperty,
      stroke: MazeGameColors.panelStrokeProperty,
      cornerRadius: MazeGameConstants.PANEL_CORNER_RADIUS,
      xMargin: MazeGameConstants.PANEL_X_MARGIN,
      yMargin: MazeGameConstants.PANEL_Y_MARGIN,
      accessibleName: strings.titleStringProperty,
    });

    this.padLayerRef = padLayer;
    this.arrowRef = arrow;
    this.knobRef = knob;

    let isDragging = false;

    const setTip = (tip: Vector2): void => {
      arrow.setTailAndTip(0, 0, tip.x, tip.y);
      knob.center = tip;
    };

    const LEVEL_W = MazeGameConstants.LEVEL_MODEL_WIDTH;
    const LEVEL_H = MazeGameConstants.LEVEL_MODEL_HEIGHT;

    const tipFromModel = (): Vector2 => {
      const mode = model.controlModeProperty.value;
      const particle = model.particle;
      let tip: Vector2;
      if (mode === ControlMode.POSITION) {
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
      if (model.wonProperty.value) {
        return;
      }
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

    this.padDragListener = new DragListener({
      start: () => {
        if (model.wonProperty.value) {
          return;
        }
        isDragging = true;
      },
      drag: (event) => {
        if (model.wonProperty.value) {
          return;
        }
        const local = padLayer.globalToLocalPoint(event.pointer.point);
        const tip = new Vector2(clamp(local.x, -HALF, HALF), clamp(local.y, -HALF, HALF));
        setTip(tip);
        applyTipToModel(tip);
      },
      end: () => {
        isDragging = false;
      },
    });
    padLayer.addInputListener(this.padDragListener);

    model.controlModeProperty.link(this.recolorForMode, { disposer: this });

    this.reflectMultilink = Multilink.multilink(
      [
        model.particle.positionProperty,
        model.particle.velocityProperty,
        model.particle.accelerationProperty,
        model.controlModeProperty,
      ],
      reflect,
    );
  }

  public override dispose(): void {
    this.reflectMultilink.dispose();
    this.padLayerRef.removeInputListener(this.padDragListener);
    this.padDragListener.dispose();
    super.dispose();
  }
}
