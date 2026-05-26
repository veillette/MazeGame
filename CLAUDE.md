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

## !! Critical: SceneryStack Import Order !!

`src/main.ts` must have `import "./brand.js"` as its **very first import**.
This triggers the full bootstrap chain:

```
brand.ts → splash.ts → assert.ts → init.ts
```

**Never reorder these imports.**

## Key Files

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
| `src/maze-game/MazeGameScreen.ts` | Screen wrapper |
| `src/maze-game/model/MazeGameModel.ts` | Game state & step loop |
| `src/maze-game/model/Level.ts` | Tile grid + collision math |
| `src/maze-game/model/Levels.ts` | The 4 ASCII level grids |
| `src/maze-game/model/Particle.ts` | Player particle (position/velocity/acceleration Properties) |
| `src/maze-game/view/MazeGameScreenView.ts` | Top-level view + keyboard input |
| `src/maze-game/view/ArenaNode.ts` | Maze + particle rendering |
| `src/maze-game/view/ControlPanel.ts` | Position/Velocity/Acceleration drag-pad |
| `src/maze-game/view/LevelSelector.ts` | Level picker (radio buttons) |
| `src/maze-game/view/HudNode.ts` | Time + collision counter readout |

## Conventions

- **No `enum`** — use `const SomeEnum = { ... } as const` (TS6 `erasableSyntaxOnly`)
- **No `namespace`** — use modules or classes with static members
- **`import type`** required for type-only imports (`verbatimModuleSyntax`)
- **Formatter**: 2-space indent, 120-char line width, double quotes
- **Colors** always go in `MazeGameColors.ts` — never hardcode hex in view files
- **Strings** always go in JSON files — never hardcode display text in view files
- **Positioning** always uses `this.layoutBounds` — never magic pixel values

## Common Commands

```bash
npm start          # dev server (http://localhost:5173)
npm run build      # type-check + production build
npm run fix        # biome auto-fix
npm run check      # tsc type check only
npm run icons      # regenerate PNG icons
```
