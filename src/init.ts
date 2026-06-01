/**
 * init.ts
 *
 * Initializes SceneryStack with simulation metadata. This file is the START of
 * the bootstrap chain:
 *
 *   init.ts → assert.ts → splash.ts → brand.ts → everything else
 *
 * It must run before any other SceneryStack module is imported.
 */
import { init, madeWithSceneryStackSplashDataURI } from "scenerystack/init";

init({
  name: "maze-game",
  version: "0.0.0",
  brand: "made-with-scenerystack",
  locale: "en",
  availableLocales: ["en", "fr"],
  splashDataURI: madeWithSceneryStackSplashDataURI,
  allowLocaleSwitching: true,
  colorProfiles: ["default", "projector"],
});
