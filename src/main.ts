/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screen, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. It triggers the full bootstrap chain:
 *
 *   brand.ts → splash.ts → assert.ts → init.ts
 */

// brand.js MUST be first — triggers: brand.ts → splash.ts → assert.ts → init.ts
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "./i18n/StringManager.js";
import { MazeGameScreen } from "./maze-game/MazeGameScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  const screens = [
    new MazeGameScreen({
      name: stringManager.getScreenNames().mazeGameStringProperty,
      tandem: Tandem.ROOT.createTandem("mazeGameScreen"),
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        supportsProjectorMode: true,
        supportsInteractiveHighlights: true,
      },
      audioOptions: {
        supportsSound: true,
      },
      localizationOptions: {
        supportsDynamicLocale: true,
      },
    }),
    credits: {
      leadDesign: "PhET Interactive Simulations (original)",
      softwareDevelopment: "SceneryStack port",
      team: "PhET Interactive Simulations",
      qualityAssurance: "",
    },
  });

  sim.start();
});
