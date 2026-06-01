# CLAUDE.md — Project Context for Claude Code

## Project: Maze Game

A SceneryStack port of the PhET Maze Game simulation. Drive a particle through
a tile-based maze using Position / Velocity / Acceleration control modes.

## Tech Stack

| Tool | Version | Notes |
|---|---|---|
| SceneryStack | ^3.0.0 | Simulation framework (PhET-derived) |
| Vite | ^8 | Build tool and dev server |
| TypeScript | ^6 | `erasableSyntaxOnly` — no `enum` or `namespace` |
| Biome | ^2.4 | Linting + formatting (not ESLint, not Prettier) |
| vite-plugin-pwa | ^1 | PWA / offline / installable |
| Vitest | ^3 | Unit tests (model collision & game logic) |
| Playwright | ^1 | Headless query-parameter smoke tests |

## !! Critical: SceneryStack Import Order !!

`src/main.ts` must have `import "./brand.js"` as its **very first import**.
This triggers the full bootstrap chain:

```
brand.ts → splash.ts → assert.ts → init.ts
```

**Never reorder these imports.**

## Key Files

### Bootstrap & shared

| File | Purpose |
|---|---|
| `src/init.ts` | Sim name (`"maze-game"`), version, locales — START of chain |
| `src/assert.ts` | Enables runtime assertions |
| `src/splash.ts` | Shows splash screen while loading |
| `src/brand.ts` | Registers brand (logo, copyright, links) |
| `src/main.ts` | Entry point — imports brand.js first |
| `src/MazeGameColors.ts` | All dynamic colors (`ProfileColorProperty`) |
| `src/MazeGameNamespace.ts` | Namespace for scoping color property names |
| `src/i18n/StringManager.ts` | Singleton localized string accessor |
| `src/i18n/strings_en.json` | English strings (source of truth for keys) |
| `src/i18n/strings_fr.json` | French strings (must have identical keys) |

### Screen & layout

| File | Purpose |
|---|---|
| `src/maze-game/MazeGameScreen.ts` | Screen wrapper |
| `src/maze-game/MazeGameLayoutConstants.ts` | View layout, typography, arrow sizes |
| `src/maze-game/MazeGamePreferences.ts` | Sim preferences (particle trace toggle) |

### Model (`src/maze-game/model/`)

| File | Purpose |
|---|---|
| `MazeGameModel.ts` | Game state & fixed-timestep step loop |
| `Level.ts` | Tile grid + collision math |
| `Levels.ts` | The 4 ASCII level grids |
| `Particle.ts` | Player particle (position/velocity/acceleration Properties) |
| `MazeGameConstants.ts` | Physics, sound levels, panel chrome, keyboard keys |
| `ControlMode.ts` | Position / Velocity / Acceleration enum object |
| `TileType.ts` | Wall / floor / start / finish tile enum object |

### View (`src/maze-game/view/`)

| File | Purpose |
|---|---|
| `MazeGameScreenView.ts` | Top-level view, keyboard input, sounds, layout |
| `ArenaNode.ts` | Maze + particle rendering, help callout, trace path |
| `ArenaPaints.ts` | Procedural wall/particle/goal paint helpers |
| `ControlPanel.ts` | Position/Velocity/Acceleration drag-pad |
| `LevelSelector.ts` | Level picker (radio buttons) |
| `HudNode.ts` | Time + collision counter readout |
| `MazeGameInfoDialog.ts` | Info button dialog content |
| `MazeGameScreenSummaryContent.ts` | PDOM screen summary at top of play area |

### Accessibility (`src/maze-game/a11y/`)

| File | Purpose |
|---|---|
| `MazeGameDescriber.ts` | Collision/win/level/mode alerts + haptic feedback |
| `createA11yDerivedProperties.ts` | Derived string properties for a11y patterns |

### Keyboard (`src/maze-game/keyboard/`)

| File | Purpose |
|---|---|
| `applyMazeGameKeyboardInput.ts` | Shared arrow/WASD/Space input handler |
| `MazeGameKeyboardHelpContent.ts` | Custom keyboard-help dialog content |
| `MazeGameKeyboardHelpSection.ts` | Particle section for keyboard help |

### Sound & preferences

| File | Purpose |
|---|---|
| `src/maze-game/sound/createSonificationProperties.ts` | Velocity magnitude → playback rate |
| `src/maze-game/preferences/createParticleTracePreference.ts` | Particle trace preference UI |

### Development tools (`public/`)

| File | Purpose |
|---|---|
| `a11y-view.html` | Side-by-side PDOM mirror + alert log (dev only) |
| `a11y-view.js` / `a11y-view.css` | A11y View logic and styling |

## Documentation

| File | Purpose |
|---|---|
| `doc/model.md` | Pedagogical model description |
| `doc/implementation-notes.md` | Architecture, a11y, testing, known deviations |
| `doc/query-parameter-testing.md` | CRC query params, recipes, automated smoke tests |

## Conventions

- **No `enum`** — use `const SomeEnum = { ... } as const` (TS6 `erasableSyntaxOnly`)
- **No `namespace`** — use modules or classes with static members
- **`import type`** required for type-only imports (`verbatimModuleSyntax`)
- **Formatter**: 2-space indent, 120-char line width, double quotes
- **Colors** always go in `MazeGameColors.ts` — never hardcode hex in view files
- **Strings** always go in JSON files — never hardcode display text in view files
- **Layout** uses `MazeGameLayoutConstants.ts` and `this.layoutBounds` — never magic pixel values
- **Physics / panel chrome** uses `MazeGameConstants.ts`

## Common Commands

```bash
npm start                  # dev server (http://localhost:5173)
npm run build              # type-check + production build
npm run fix                # biome auto-fix
npm run check              # tsc type check only
npm test                   # Vitest unit tests
npm run test:query-params  # headless Playwright query-param smoke tests
npm run icons              # regenerate PNG icons
```
