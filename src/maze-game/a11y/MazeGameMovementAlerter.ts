/**
 * MovementAlerter wired for particle drag: baseline position at drag start, string movement alerts.
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2, Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { Node } from "scenerystack/scenery";
import { isVoicing, Voicing, type VoicingNode } from "scenerystack/scenery";
import { MovementAlerter } from "scenerystack/scenery-phet";
import type { Utterance } from "scenerystack/utterance-queue";
import { createDefaultMovementAlertStrings } from "./createMovementAlertStrings.js";

type MovementAlerterOptions = {
  alertToVoicing?: boolean;
  descriptionAlertNode?: Node | null;
  modelViewTransform?: ModelViewTransform2;
  borderAlertsOptions?: {
    boundsProperty: Property<Bounds2>;
  };
};

/** Private MovementAlerter fields needed to register voicing utterances with a VoicingNode. */
type MovementAlerterPrivateFields = {
  directionChangeUtterance: Utterance;
  borderAlertsDescriber: Record<string, Utterance | null>;
};

const BORDER_DIRECTIONS = ["LEFT", "RIGHT", "UP", "DOWN"] as const;

export default class MazeGameMovementAlerter extends MovementAlerter {
  public constructor(positionProperty: TReadOnlyProperty<Vector2>, options: MovementAlerterOptions) {
    // MovementAlerter types positionProperty as Property; particle.position is read-only at this boundary.
    super(positionProperty as ConstructorParameters<typeof MovementAlerter>[0], {
      ...options,
      movementAlerts: createDefaultMovementAlertStrings(),
    });

    if (options.alertToVoicing !== false && options.descriptionAlertNode && isVoicing(options.descriptionAlertNode)) {
      this.registerVoicingNode(options.descriptionAlertNode);
    }
  }

  /** Connect movement utterances to the particle so voicing alerts respect scene-graph visibility. */
  public registerVoicingNode(voicingNode: VoicingNode): void {
    const privateFields = this as unknown as MovementAlerterPrivateFields;

    Voicing.registerUtteranceToVoicingNode(privateFields.directionChangeUtterance, voicingNode);

    for (const direction of BORDER_DIRECTIONS) {
      const utterance = privateFields.borderAlertsDescriber[direction];
      if (utterance) {
        Voicing.registerUtteranceToVoicingNode(utterance, voicingNode);
      }
    }
  }

  /** Call when a position-mode particle drag begins so endDrag only describes this gesture. */
  public captureDragStartPosition(): void {
    this.lastAlertedPosition = this.positionProperty.get();
  }
}
