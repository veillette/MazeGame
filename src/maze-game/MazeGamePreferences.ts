/**
 * MazeGamePreferences.ts
 *
 * Simulation-wide preference properties wired into the Preferences dialog
 * and the play-area view.
 */

import { BooleanProperty } from "scenerystack/axon";
import MazeGameNamespace from "../MazeGameNamespace.js";

export const particleTraceEnabledProperty = new BooleanProperty(false);

MazeGameNamespace.register("particleTraceEnabledProperty", particleTraceEnabledProperty);
