# Maze Game — Implementation Notes

SceneryStack port of [PhET Maze Game](https://phet.colorado.edu/en/simulations/maze-game). Brand: `made-with-scenerystack`. Build: Vite 8 + TypeScript 6.

## Bootstrap

Import order is critical: `main.ts` must import `./brand.js` first (`brand → splash → assert → init`).

## Architecture

| Layer | Location |
|-------|----------|
| Model | `src/maze-game/model/` |
| View | `src/maze-game/view/` |
| Accessibility | `src/maze-game/a11y/` |
| Keyboard | `src/maze-game/keyboard/` |
| Sound | `src/maze-game/sound/` |
| Preferences | `src/maze-game/preferences/` |
| Screen | `src/maze-game/MazeGameScreen.ts` |
| Layout constants | `src/maze-game/MazeGameLayoutConstants.ts` |
| Strings | `src/i18n/strings_*.json` via `StringManager` |
| Colors | `src/MazeGameColors.ts` |

## Model

- `MazeGameModel` — fixed-timestep physics (`FIXED_DT`, `MAX_CATCHUP_STEPS`), win/collision logic
- `Level` — tile grid, collision queries, bisection push-back
- `Particle` — `Vector2Property` for position, velocity, acceleration
- `MazeGameConstants` — physics, keyboard keys, sound levels, panel chrome (`PANEL_*`, `HUD_PANEL_Y_MARGIN`)

## View / Layout

- `MazeGameScreenView` relayouts on `visibleBoundsProperty` changes; arena scale uses space left of a 240 px right column (`MazeGameLayoutConstants.RIGHT_COLUMN_WIDTH`).
- View typography and arrow sizes live in `MazeGameLayoutConstants`; physics and panel chrome in `MazeGameConstants`.

## Sound

- `MazeGameScreenView` wires tambo `SoundClip`s for collision, win, and control-mode change.
- `createSonificationProperties` maps velocity magnitude to a continuous playback-rate sound.

## Listeners and Disposal

The sim has a single screen that lives for the app lifetime. Disposal is implemented defensively for CRC compliance:

| Class | Cleanup |
|-------|---------|
| `MazeGameScreenView` | KeyboardListener, SoundClips, child view `dispose()`; model links use `{ disposer: this }` |
| `ArenaNode` | DerivedProperties, Multilink, DragListener, help-callout animation; Property links use `{ disposer: this }` |
| `ControlPanel` | Multilink, pad DragListener; mode link uses `{ disposer: this }` |
| `HudNode` | DerivedProperties, NumberDisplays; visibility links use `{ disposer: this }` |
| `MazeGameModel` | `levelProperty`, `isLastLevelProperty`, lazyLinks unlinked in `dispose()` |
| `MazeGameDescriber` | DerivedProperties, model property links via `{ disposer: this }` |

## Input Behavior

- Keyboard, control pad, and particle drag are **disabled after win** (`wonProperty`).
- Control pad drag listener is on the full pad (`padLayer`), not just the knob.
- Particle `touchArea` expanded to 44 px diameter (`PARTICLE_MIN_TOUCH_RADIUS_VIEW`).
- Shared keyboard handler: `applyMazeGameKeyboardInput` (used by screen view and control pad focus).

## Accessibility

- **Screen summary**: `MazeGameScreenSummaryContent` describes the play area, control area, current details (level, mode, collisions, win), and interaction hints at the top of the PDOM.
- **PDOM order**: `pdomPlayAreaNode` → arena; `pdomControlAreaNode` → control panel, level selector, HUD, info button, reset-all.
- **Help text**: Mode-dependent `accessibleHelpText` on the particle, control pad, and mode tabs; static help on level selector and particle-trace preference.
- **Dynamic names**: HUD time and collision displays use `PatternStringProperty` with live values.
- **Alerts**: `MazeGameDescriber` announces collisions, wins, level changes, and control-mode changes via `addAccessibleResponse` / `utteranceQueue`; collision haptics via the Web Vibration API when available.
- **Particle help callout**: Clicking the particle in `ArenaNode` shows a mode-specific visual callout (also voiced when Voicing is on); fades after a few seconds or on reset.
- **Control pad focus**: Pad is focusable (`ariaRole: application`) with a local `KeyboardListener` delegating to shared `applyMazeGameKeyboardInput`.
- **Keyboard help**: Custom particle section in the keyboard-help dialog.
- **A11y View**: `public/a11y-view.html` — side-by-side PDOM mirror and live alert log for development QA.
- **Manual testing**: `?ea`, `?stringTest=double|long`, Tab through PDOM, screen reader for dynamic values and alerts.

## Internationalization

- Locales: `en`, `fr` (compile-time key parity in `StringManager`).
- Dynamic locale via `PreferencesModel.supportsDynamicLocale`.

## Testing

- Unit tests: `Level.test.ts`, `MazeGameModel.test.ts` (Vitest).
- Manual CRC query params: `?ea`, `?fuzz&ea`, `?listenerOrder=random`, `?stringTest=dynamic|X|double|long|rtl`, `?showPointerAreas`.
- Automated smoke: `npm run test:query-params` (headless Playwright; set `MAZE_GAME_URL` if preview uses another port).
- Full guide: [query-parameter-testing.md](query-parameter-testing.md) (recipes, code paths, test matrix).

## Known Deviations from Original PhET

- Diagonal keyboard input sums axis components without normalization (√2× magnitude on diagonals).
- About-dialog credits are English-only in `main.ts` (not in JSON strings).
