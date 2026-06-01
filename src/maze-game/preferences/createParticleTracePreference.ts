/**
 * createParticleTracePreference.ts
 *
 * Builds the Visual-tab control for toggling the particle path trace.
 */

import { Dimension2 } from "scenerystack/dot";
import { combineOptions } from "scenerystack/phet-core";
import { HBox, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { ToggleSwitch, type ToggleSwitchOptions } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import MazeGameColors from "../../MazeGameColors.js";
import MazeGameLayoutConstants from "../MazeGameLayoutConstants.js";
import { particleTraceEnabledProperty } from "../MazeGamePreferences.js";

export const createParticleTracePreference = (parentTandem: Tandem): HBox => {
  const strings = StringManager.getInstance().getPreferencesStrings();

  const label = new Text(strings.particleTraceStringProperty, {
    font: new PhetFont({
      size: MazeGameLayoutConstants.PREFERENCES_LABEL_FONT_SIZE,
      weight: MazeGameLayoutConstants.FONT_WEIGHT_BOLD,
    }),
    maxWidth: MazeGameLayoutConstants.PREFERENCES_LABEL_MAX_WIDTH,
  });

  const toggleSwitch = new ToggleSwitch(
    particleTraceEnabledProperty,
    false,
    true,
    combineOptions<ToggleSwitchOptions>({
      tandem: parentTandem.createTandem("particleTraceToggleSwitch"),
      size: new Dimension2(
        MazeGameLayoutConstants.PREFERENCES_TOGGLE_SWITCH_WIDTH,
        MazeGameLayoutConstants.PREFERENCES_TOGGLE_SWITCH_HEIGHT,
      ),
      trackFillRight: MazeGameColors.toggleSwitchTrackFillRightProperty,
      accessibleName: strings.particleTraceStringProperty,
      accessibleHelpText: strings.particleTraceDescriptionStringProperty,
    }),
  );

  return new HBox({
    spacing: MazeGameLayoutConstants.PREFERENCES_CONTROL_SPACING,
    align: "center",
    children: [label, toggleSwitch],
  });
};
