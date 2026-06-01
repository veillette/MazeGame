# Maze Game

A SceneryStack port of the [PhET Maze Game](https://phet.colorado.edu/en/simulations/maze-game)
simulation. Drive a particle through tile-based mazes using **Position**, **Velocity**, or
**Acceleration** control modes — drag the knob in the control pad, drag the particle (Position
mode), or use arrow keys / WASD.

## Requirements

- Node.js **22+** (see `.nvmrc`; Vite 8 needs 20.19+ or 22.12+)

If `npm run build` fails with **Cannot find native binding** for Rolldown, run
`rm -rf node_modules && npm ci` (the `postinstall` script installs the native binding for your
OS). On WSL/Linux x64, `@rolldown/binding-linux-x64-gnu` is also listed as a dev dependency.

## Quick Start

```bash
npm install
npm run icons    # regenerate PNG icons from icons/icon.svg (first time / after SVG changes)
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run check` | TypeScript type check (`src/` + `scripts/`) |
| `npm test` | Run Vitest unit tests (model collision & game logic) |
| `npm run test:query-params` | Headless Playwright smoke tests for CRC query params |
| `npm run lint` | Biome lint check |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `icons/icon.svg` |
| `npm run clean` | Remove `dist/` |

## Features

- Four levels (Practice through Certain Death)
- English and French UI (switch locale in sim preferences)
- Projector (light) color profile
- Interactive description (PDOM), screen summary, dynamic alerts, keyboard help
- Sound effects and velocity sonification; optional particle trace preference
- PWA: installable and offline-capable after first load (`vite-plugin-pwa`)

## Architecture

Entry: `src/main.ts` (must import `./brand.js` first).

| Layer | Location |
|---|---|
| Model | `src/maze-game/model/` |
| View | `src/maze-game/view/` |
| Accessibility | `src/maze-game/a11y/` |
| Keyboard | `src/maze-game/keyboard/` |
| Colors | `src/MazeGameColors.ts` |
| Strings | `src/i18n/` |

See [CLAUDE.md](CLAUDE.md) for the full file map and conventions.

## Documentation

| Doc | Contents |
|---|---|
| [doc/model.md](doc/model.md) | Pedagogical model description |
| [doc/implementation-notes.md](doc/implementation-notes.md) | Architecture, a11y, testing |
| [doc/query-parameter-testing.md](doc/query-parameter-testing.md) | CRC query params and test recipes |

### A11y View (development)

Open `http://localhost:5173/a11y-view.html` for a side-by-side PDOM mirror and live alert log
while exercising the sim in the embedded iframe. See [query-parameter-testing.md](doc/query-parameter-testing.md)
for details.

## CI

GitHub Actions runs lint, type-check, tests, and build on push/PR to `main`. Production deploy
to GitHub Pages is configured in `.github/workflows/deploy.yml`.

## License

MIT
