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

export default class MazeGameHotkeyData {
  public static readonly KEYBOARD_KEYS = [...MOVE_KEYS, ...STOP_KEYS] as const;

  public static readonly MOVE_PARTICLE = new HotkeyData({
    keys: [...MOVE_KEYS],
    repoName: "maze-game",
    global: true,
    binderName: "Move Particle",
  });

  public static readonly STOP_MOTION = new HotkeyData({
    keys: [...STOP_KEYS],
    repoName: "maze-game",
    global: true,
    binderName: "Stop Motion",
  });
}
