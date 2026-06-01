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

import { Multilink, Property } from "scenerystack/axon";
import { Bounds2, clamp, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { optionize } from "scenerystack/phet-core";
import type { OneKeyStroke, ProfileColorProperty } from "scenerystack/scenery";
import { Circle, DragListener, KeyboardListener, Node, Rectangle, Text, VBox, VoicingNode } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import { Panel, type PanelOptions, RectangularRadioButtonGroup } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import { createModeDependentHelpTextProperty } from "../a11y/createA11yDerivedProperties.js";
import { applyMazeGameKeyboardInput } from "../keyboard/applyMazeGameKeyboardInput.js";
import MazeGameLayoutConstants from "../MazeGameLayoutConstants.js";
import { ControlMode } from "../model/ControlMode.js";
import MazeGameConstants from "../model/MazeGameConstants.js";
import type { MazeGameModel } from "../model/MazeGameModel.js";

const AREA = MazeGameConstants.REMOTE_PAD_SIZE;
const HALF = AREA / 2;

const COLOR_BY_MODE: Record<ControlMode, ProfileColorProperty> = {
  [ControlMode.POSITION]: MazeGameColors.positionVectorProperty,
  [ControlMode.VELOCITY]: MazeGameColors.velocityVectorProperty,
  [ControlMode.ACCELERATION]: MazeGameColors.accelerationVectorProperty,
};

type ControlPanelSelfOptions = {
  tandem?: Tandem;
};

type ControlPanelOptions = ControlPanelSelfOptions & PanelOptions;

export default class ControlPanel extends Panel {
  private readonly padRef: VoicingNode;
  private readonly padLayerRef: Node;
  private readonly padDragListener: DragListener;
  private readonly padKeyboardListener: KeyboardListener<OneKeyStroke[]>;
  private readonly reflectMultilink: ReturnType<typeof Multilink.multilink>;
  private readonly controlModeBridgeProperty: Property<ControlMode>;
  private readonly arrowRef: ArrowNode;
  private readonly knobRef: Circle;
  private readonly derivedProperties: Array<{ dispose(): void }> = [];

  private readonly recolorForMode = (mode: ControlMode): void => {
    const color = COLOR_BY_MODE[mode];
    this.arrowRef.fill = color;
    this.knobRef.fill = color;
  };

  public constructor(model: MazeGameModel, providedOptions?: ControlPanelOptions) {
    const stringManager = StringManager.getInstance();
    const strings = stringManager.getControlModeStrings();
    const a11yStrings = stringManager.getA11yStrings();

    const options = optionize<ControlPanelOptions, ControlPanelSelfOptions, PanelOptions>()(
      {
        tandem: Tandem.OPT_OUT,
        fill: MazeGameColors.panelFillProperty,
        stroke: MazeGameColors.panelStrokeProperty,
        cornerRadius: MazeGameConstants.PANEL_CORNER_RADIUS,
        xMargin: MazeGameConstants.PANEL_X_MARGIN,
        yMargin: MazeGameConstants.PANEL_Y_MARGIN,
        accessibleName: strings.titleStringProperty,
      },
      providedOptions,
    );

    const { tandem, ...panelOptions } = options;

    const controlModeBridgeProperty = new Property<ControlMode>(model.controlModeProperty.value);

    const titleFont = new PhetFont({
      size: MazeGameLayoutConstants.CONTROL_PANEL_TITLE_FONT_SIZE,
      weight: MazeGameLayoutConstants.FONT_WEIGHT_BOLD,
    });
    const tabFont = new PhetFont(MazeGameLayoutConstants.CONTROL_PANEL_TAB_FONT_SIZE);

    const header = new Text(strings.titleStringProperty, {
      font: titleFont,
      fill: MazeGameColors.foregroundColorProperty,
    });

    const tabs = new RectangularRadioButtonGroup<ControlMode>(
      controlModeBridgeProperty,
      [
        {
          value: ControlMode.POSITION,
          createNode: (): Text =>
            new Text(strings.positionShortStringProperty, {
              font: tabFont,
              fill: COLOR_BY_MODE[ControlMode.POSITION],
            }),
          options: {
            accessibleName: strings.positionStringProperty,
            accessibleHelpText: a11yStrings.positionModeHelpStringProperty,
          },
        },
        {
          value: ControlMode.VELOCITY,
          createNode: (): Text =>
            new Text(strings.velocityShortStringProperty, {
              font: tabFont,
              fill: COLOR_BY_MODE[ControlMode.VELOCITY],
            }),
          options: {
            accessibleName: strings.velocityStringProperty,
            accessibleHelpText: a11yStrings.velocityModeHelpStringProperty,
          },
        },
        {
          value: ControlMode.ACCELERATION,
          createNode: (): Text =>
            new Text(strings.accelerationShortStringProperty, {
              font: tabFont,
              fill: COLOR_BY_MODE[ControlMode.ACCELERATION],
            }),
          options: {
            accessibleName: strings.accelerationStringProperty,
            accessibleHelpText: a11yStrings.accelerationModeHelpStringProperty,
          },
        },
      ],
      { orientation: "horizontal", spacing: MazeGameLayoutConstants.CONTROL_PANEL_TAB_SPACING, tandem },
    );
    const padBackground = new Rectangle(-HALF, -HALF, AREA, AREA, {
      fill: MazeGameColors.padFillProperty,
      cornerRadius: MazeGameLayoutConstants.CONTROL_PANEL_PAD_CORNER_RADIUS,
    });
    const arrow = new ArrowNode(0, 0, 0, 0, {
      headWidth: MazeGameLayoutConstants.PAD_ARROW_HEAD_WIDTH,
      headHeight: MazeGameLayoutConstants.PAD_ARROW_HEAD_HEIGHT,
      tailWidth: MazeGameLayoutConstants.PAD_ARROW_TAIL_WIDTH,
      stroke: null,
    });
    const knob = new Circle(MazeGameLayoutConstants.CONTROL_PANEL_KNOB_RADIUS, {
      cursor: "pointer",
      stroke: MazeGameColors.knobStrokeProperty,
    });
    const padLayer = new Node({
      clipArea: Shape.bounds(new Bounds2(-HALF, -HALF, HALF, HALF)),
      children: [arrow, knob],
      cursor: "pointer",
    });

    const controlPadHelpTextProperty = createModeDependentHelpTextProperty(
      model.controlModeProperty,
      a11yStrings.controlPadHelpPositionStringProperty,
      a11yStrings.controlPadHelpVelocityStringProperty,
      a11yStrings.controlPadHelpAccelerationStringProperty,
    );

    const pad = new VoicingNode({
      children: [padBackground, padLayer],
      accessibleName: a11yStrings.controlPadStringProperty,
      accessibleHelpText: controlPadHelpTextProperty,
      voicingNameResponse: a11yStrings.controlPadStringProperty,
      voicingHintResponse: controlPadHelpTextProperty,
      focusable: true,
      tagName: "div",
      ariaRole: "application",
    });

    const content = new VBox({
      spacing: MazeGameLayoutConstants.CONTROL_PANEL_VBOX_SPACING,
      children: [header, tabs, pad],
    });

    super(content, panelOptions);

    this.derivedProperties.push(controlPadHelpTextProperty);

    this.padKeyboardListener = new KeyboardListener({
      keys: [...MazeGameConstants.KEYBOARD_KEYS],
      fireOnHold: true,
      fire: (_event: KeyboardEvent | null, keysPressed: string): void => {
        applyMazeGameKeyboardInput(model, keysPressed);
      },
    });
    pad.addInputListener(this.padKeyboardListener);

    this.padRef = pad;
    this.padLayerRef = padLayer;
    this.arrowRef = arrow;
    this.knobRef = knob;
    this.controlModeBridgeProperty = controlModeBridgeProperty;

    model.controlModeProperty.link(
      (mode): void => {
        if (controlModeBridgeProperty.value !== mode) {
          controlModeBridgeProperty.value = mode;
        }
      },
      { disposer: this },
    );

    controlModeBridgeProperty.link(
      (mode): void => {
        if (model.controlModeProperty.value !== mode) {
          model.setControlMode(mode);
        }
      },
      { disposer: this },
    );

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
      start: (): void => {
        if (model.wonProperty.value) {
          return;
        }
        isDragging = true;
      },
      drag: (event): void => {
        if (model.wonProperty.value) {
          return;
        }
        const local = padLayer.globalToLocalPoint(event.pointer.point);
        const tip = new Vector2(clamp(local.x, -HALF, HALF), clamp(local.y, -HALF, HALF));
        setTip(tip);
        applyTipToModel(tip);
      },
      end: (): void => {
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
    for (const derivedProperty of this.derivedProperties) {
      derivedProperty.dispose();
    }
    this.reflectMultilink.dispose();
    this.controlModeBridgeProperty.dispose();
    this.padLayerRef.removeInputListener(this.padDragListener);
    this.padDragListener.dispose();
    this.padRef.removeInputListener(this.padKeyboardListener);
    this.padKeyboardListener.dispose();
    super.dispose();
  }
}
