/**
 * MazeGameHotkeyData.ts
 *
 * Single source of truth for all keyboard shortcuts in the Maze Game.
 * Both the KeyboardListener (what actually fires) and the KeyboardHelpSection
 * (what is documented) derive from these HotkeyData instances.
 */

import { HotkeyData } from "scenerystack/scenery";

const MOVE_KEYS = ["arrowLeft", "arrowRight", "arrowUp", "arrowDown", "a", "d", "w", "s"] as const;
const STOP_KEYS = ["space"] as const;

const MazeGameHotkeyData = {
  KEYBOARD_KEYS: [...MOVE_KEYS, ...STOP_KEYS] as const,

  MOVE_PARTICLE: new HotkeyData({
    keys: [...MOVE_KEYS],
    repoName: "maze-game",
    global: true,
    binderName: "Move Particle",
  }),

  STOP_MOTION: new HotkeyData({
    keys: [...STOP_KEYS],
    repoName: "maze-game",
    global: true,
    binderName: "Stop Motion",
  }),
} as const;

export default MazeGameHotkeyData;
