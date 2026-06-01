# Maze Game — Implementation Notes

SceneryStack port of [PhET Maze Game](https://phet.colorado.edu/en/simulations/maze-game). Brand: `made-with-scenerystack`. Build: Vite 8 + TypeScript 6.

## Bootstrap

Import order is critical: `main.ts` must import `./brand.js` first (`brand → splash → assert → init`).

## Architecture

| Layer | Location |
|-------|----------|
| Model | `src/maze-game/model/` |
| View | `src/maze-game/view/` |
| Screen | `src/maze-game/MazeGameScreen.ts` |
| Strings | `src/i18n/strings_*.json` via `StringManager` |
| Colors | `src/MazeGameColors.ts` |

## Model

- `MazeGameModel` — fixed-timestep physics (`FIXED_DT`, `MAX_CATCHUP_STEPS`), win/collision logic
- `Level` — tile grid, collision queries, bisection push-back
- `Particle` — `Vector2Property` for position, velocity, acceleration

## View / Layout

- `MazeGameScreenView` scales the arena to fit left of a 240 px right column (`MARGIN`, `RIGHT_COLUMN_WIDTH`).
- Panel chrome constants live in `MazeGameConstants` (`PANEL_*`, `HUD_PANEL_Y_MARGIN`).

## Listeners and Disposal

The sim has a single screen that lives for the app lifetime. Disposal is implemented defensively for CRC compliance:

| Class | Cleanup |
|-------|---------|
| `MazeGameScreenView` | KeyboardListener, SoundClips, child view `dispose()`; model links use `{ disposer: this }` |
| `ArenaNode` | DerivedProperties, Multilink, DragListener; Property links use `{ disposer: this }` |
| `ControlPanel` | Multilink, pad DragListener; mode link uses `{ disposer: this }` |
| `HudNode` | DerivedProperties, NumberDisplays; visibility links use `{ disposer: this }` |
| `MazeGameModel` | `levelProperty`, `isLastLevelProperty`, lazyLinks unlinked in `dispose()` |

## Input Behavior

- Keyboard, control pad, and particle drag are **disabled after win** (`wonProperty`).
- Control pad drag listener is on the full pad (`padLayer`), not just the knob.
- Particle `touchArea` expanded to 44 px diameter (`PARTICLE_MIN_TOUCH_RADIUS_VIEW`).

## Accessibility

- PDOM: `pdomPlayAreaNode` → arena; `pdomControlAreaNode` → control panel, level selector, HUD, reset-all.
- Win overlay uses `a11y.levelComplete`; HUD panel uses `a11y.hudPanel`.

## Internationalization

- Locales: `en`, `fr` (compile-time key parity in `StringManager`).
- Dynamic locale via `PreferencesModel.supportsDynamicLocale`.

## Testing

- Unit tests: `Level.test.ts`, `MazeGameModel.test.ts` (Vitest).
- Manual CRC query params: `?ea`, `?fuzz&ea`, `?listenerOrder=random`, `?stringTest=dynamic|X|double|long|rtl`, `?showPointerAreas`.

## Known Deviations from Original PhET

- Diagonal keyboard input sums axis components without normalization (√2× magnitude on diagonals).
- About-dialog credits are English-only in `main.ts` (not in JSON strings).
