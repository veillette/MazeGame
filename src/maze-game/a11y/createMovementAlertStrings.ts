/**
 * MovementAlerter asserts that movementAlerts values are strings, but SceneryStack defaults
 * are StringProperties. Resolve localized string values for use with MovementAlerter.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { MovementAlerter } from "scenerystack/scenery-phet";

const stringFromAlertable = (alertable: string | TReadOnlyProperty<string>): string => {
  return typeof alertable === "string" ? alertable : alertable.value;
};

/**
 * Default directional movement alert strings (up, down, left, right, diagonals).
 */
export const createDefaultMovementAlertStrings = (): Record<string, string> => {
  const defaults = MovementAlerter.getDefaultMovementDescriptions();
  const movementAlerts: Record<string, string> = {};
  for (const key of Object.keys(defaults)) {
    const alertable = defaults[key];
    if (alertable !== undefined) {
      movementAlerts[key] = stringFromAlertable(alertable);
    }
  }
  return movementAlerts;
};
