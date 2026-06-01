# Query Parameter Testing — Maze Game

SceneryStack/PhET simulations read URL query parameters at startup into `phet.chipper.queryParameters`. Maze Game does not define sim-specific parameters; all flags below come from SceneryStack common code.

**Canonical schema:** `node_modules/scenerystack/src/chipper/js/browser/initialize-globals.js` — search for `QUERY_PARAMETERS_SCHEMA`.

**Local URLs:** `npm start` → `http://localhost:5173/` · `npm run build && npm run preview` → usually `http://127.0.0.1:4173/` (or next free port).

**Automated smoke checks:** `npm run test:query-params` (headless Playwright; set `MAZE_GAME_URL` if preview uses another port).

---

## How parameters are parsed

```text
URL ?ea&fuzz  →  QueryStringMachine.getAll(QUERY_PARAMETERS_SCHEMA)
              →  phet.chipper.queryParameters
              →  Sim / SimDisplay / assertions / strings
```

Parsing runs when the first module imports `initialize-globals.js` (typically when `scenerystack/sim` loads). The project bootstrap (`brand → splash → assert → init`) runs earlier; [`src/assert.ts`](../src/assert.ts) always calls `enableAssert()` in source builds regardless of `?ea`.

### Maze Game specifics

| Topic | Detail |
|--------|--------|
| Production meta | [`index.html`](../index.html) sets `phet-sim-level=production` → `phet.chipper.isProduction === true` |
| `?ea` in production | Chipper enables assertions when `!isProduction && ea` **or** `eall`; with production meta, `?ea` still sets `queryParameters.ea` but chipper may not re-call `enableAssert` — [`assert.ts`](../src/assert.ts) already enabled assertions |
| Interactive description | [`src/init.ts`](../src/init.ts) defaults `supportsInteractiveDescription: true` → `?fuzzBoard` works without extra flags |
| Strings | [`StringManager`](../src/i18n/StringManager.ts) / `LocalizedString` → `phet.chipper.mapString` when `?stringTest=…` |
| CRC list | See [implementation-notes.md](implementation-notes.md) § Testing |

### Console inspection (after load)

```js
phet.chipper.queryParameters
phet.chipper.isProduction
phet.chipper.isFuzzEnabled()
```

**Baseline snapshot (preview build, no query string):** `isProduction: true`, `locale: "en"`, `supportsInteractiveDescription: true`, `ea/fuzz/dev: false`, `listenerOrder: "default"`.

---

## Code paths (URL → behavior)

### `?ea` / `?eall` — assertions

1. `initialize-globals.js` (~992–1007): if `eall` or (`!isProduction && ea`) or debug build → `enableAssert()` / `enableAssertSlow()`.
2. [`src/assert.ts`](../src/assert.ts): unconditional `enableAssert()` on project load (dev/source).
3. Failed `assert && …` throws `Assertion failed` in the console.

### `?fuzz` / `?fuzzMouse` / `?fuzzTouch` — pointer fuzz

1. `Sim.runAnimationLoop` → `fuzzFrame()` each frame (`node_modules/scenerystack/src/joist/js/Sim.ts` ~1067).
2. `SimDisplay.fuzzInputEvents()` (`node_modules/scenerystack/src/joist/js/SimDisplay.ts` ~220): `fuzz` enables both mouse and touch; `fuzzRate` events/frame; `randomSeed` seeds fuzzers.
3. `phet.chipper.isFuzzEnabled()` is true when any of `fuzz`, `fuzzMouse`, `fuzzTouch`, `fuzzBoard` is set.

### `?fuzzBoard` — keyboard / PDOM fuzz

Same `fuzzFrame` path; requires `supportsInteractiveDescription` (on by default). Uses `KeyboardFuzzer` in scenery.

### `?listenerOrder=random|reverse|random(123)`

`node_modules/scenerystack/src/axon/js/TinyEmitter.ts`: shuffles or reverses listener order on each emit to expose order-dependent bugs.

### `?stringTest=double|long|rtl|dynamic|…`

`phet.chipper.mapString` in `initialize-globals.js` (~1067): transforms every localized string at load. `dynamic` adds arrow-key listeners to change lengths at runtime.

### `?dev` / `?showPointerAreas`

- `dev`: layout-bounds overlay on the screen view ([`Screen.ts`](../../node_modules/scenerystack/src/joist/js/Screen.ts) ~332).
- `showPointerAreas`: dashed mouse (blue) / touch (red) hit areas on `SimDisplay`.

### Developer Helper (not a query param)

**Ctrl+Shift+H** toggles the joist Helper (visual tree, PDOM tree, bounds, runtime **Fuzz** checkbox).

---

## Copy-paste test recipes

Replace `BASE` with your dev/preview URL. Flags need no `=true`. Combine with `&`.

### Assertions & robustness (CRC-style)

| URL | Purpose |
|-----|---------|
| `BASE?ea` | Assertions on; manual play all levels/modes, reset, preferences, info |
| `BASE?eall` | Basic + slow assertions (heavier) |
| `BASE?listenerOrder=random` | Random listener order |
| `BASE?listenerOrder=random(42)` | Reproducible shuffle (seed logged) |

### Input fuzz (2–5 min each)

| URL | Purpose |
|-----|---------|
| `BASE?fuzz&ea&disableModals` | Mouse + touch chaos; skip modals |
| `BASE?fuzz&ea&disableModals&fuzzRate=30` | Lower load (default 100) |
| `BASE?fuzzMouse&ea` | Mouse only |
| `BASE?fuzzTouch&ea` | Touch only |
| `BASE?fuzz&ea&randomSeed=42` | Reproducible fuzz |
| `BASE?fuzzBoard&ea&fuzzRate=20` | PDOM keyboard fuzz |

Watch for uncaught errors and assertion failures. Sim should stay responsive.

### Layout & hit targets

| URL | Purpose |
|-----|---------|
| `BASE?dev` | Layout bounds overlay |
| `BASE?dev&showPointerAreas` | Bounds + pointer/touch areas (pad, particle, buttons) |
| `BASE?showVisibleBounds` | Visible-bounds overlay |

### i18n & locale

| URL | Purpose |
|-----|---------|
| `BASE?stringTest=double` | Duplicate every string (`label:label`) |
| `BASE?stringTest=long` | 50-character placeholder |
| `BASE?stringTest=rtl` | RTL stress |
| `BASE?stringTest=dynamic` | Arrow keys change string length live |
| `BASE?locale=fr` | French at startup |

Focus: control panel tabs, level selector, HUD patterns, info dialog, screen summary.

### Accessibility

| URL / action | Purpose |
|--------------|---------|
| `BASE?ea` + Tab | PDOM order: screen summary → play area (arena) → control area |
| `BASE?logInteractiveDescriptionResponses&ea` | Log collision/win/level/mode alerts to console |
| `BASE?fuzzBoard&ea` | Automated keyboard fuzz |
| Screen reader | Dynamic HUD values, movement alerts, win announcement |

PDOM order is documented in [implementation-notes.md](implementation-notes.md).

---

## Suggested test matrix

1. **Smoke:** `?ea` — all levels, three control modes, win + reset.
2. **Layout:** `?dev&showPointerAreas`.
3. **i18n:** `?stringTest=double` then `?stringTest=long`.
4. **Stress:** `?fuzz&ea&disableModals` (~5 min).
5. **A11y fuzz:** `?fuzzBoard&ea` (~5 min).
6. **Robustness:** `?fuzz&ea&listenerOrder=random&disableModals`.
7. **Locale:** `?locale=fr&ea` + preferences locale switch.

Optional: use `?eall` instead of `?ea` for steps 1 and 4.

---

## Automated run results (headless)

Command: `MAZE_GAME_URL=http://127.0.0.1:4174/ npm run test:query-params`

| Recipe | Result | Notes |
|--------|--------|-------|
| baseline | pass | `isProduction: true`, fuzz off |
| `?ea` | pass | `ea: true` |
| `?dev&showPointerAreas` | pass | `dev` + `showPointerAreas` true |
| `?stringTest=double` / `long` | pass | `stringTest` set correctly |
| `?fuzz&ea&disableModals` | pass | `isFuzzEnabled: true`, 8s fuzz |
| `?fuzzBoard&ea` | pass | CSP console noise from synthetic events (no assertion failures) |
| `?fuzz&ea&listenerOrder=random` | pass | `listenerOrder: "random"` |
| `?locale=fr&ea` | pass | `locale: "fr"` |
| `?logInteractiveDescriptionResponses&ea` | pass | logging flag on |
| `?ea` + Tab ×12 | pass | Multiple PDOM focus targets reached |

Re-run after dependency or SceneryStack upgrades.

---

## Parameter quick reference

| Param | Type | Role |
|-------|------|------|
| `ea` | flag | Enable assertions (CRC; critical with production meta + built HTML) |
| `eall` | flag | Basic + slow assertions |
| `dev` | flag | Layout bounds overlay |
| `fuzz` | flag | Random mouse + touch per frame |
| `fuzzMouse` / `fuzzTouch` | flag | Pointer fuzz subset |
| `fuzzBoard` | flag | Random keyboard / PDOM events |
| `fuzzRate` | number | Events per frame (default 100) |
| `disableModals` | flag | Skip PhET menu / help / preferences during fuzz |
| `listenerOrder` | string | `default`, `random`, `reverse`, `random(seed)` |
| `stringTest` | string | `double`, `long`, `rtl`, `dynamic`, custom literal, … |
| `showPointerAreas` | flag | Visualize mouse/touch areas |
| `locale` | string | Startup locale (`en`, `fr`, …) |
| `logInteractiveDescriptionResponses` | flag | Console log a11y alerts |

~80+ parameters exist in the schema; use discovery in DevTools + schema file rather than memorizing.

---

## Avoid in public / production links

- `showAnswers` — internal PhET
- `stringTest=xss` / `xss2` — security probes only
- `binder`, `continuousTest` — CT / tooling

---

## Automation hooks (awareness)

For continuous testing (PhET aqua / fuzz-lightyear): `postMessageOnLoad`, `postMessageOnReady`, `postMessageOnError`, `launchCounter`, `memoryLimit`, `continuousTest`. Not required for manual local QA.

---

## Related docs

- [implementation-notes.md](implementation-notes.md) — architecture, PDOM order, CRC parameter list
- [CLAUDE.md](../CLAUDE.md) — project file map
