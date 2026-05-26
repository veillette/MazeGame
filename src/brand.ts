/**
 * brand.ts
 *
 * Registers the SceneryStack brand for this simulation.
 *
 * Chain position: init.ts → assert.ts → splash.ts → [here] brand.ts
 *
 * !! THIS FILE MUST BE THE FIRST IMPORT IN src/main.ts !!
 */

import "./splash.js";

import type { TBrand } from "scenerystack/brand";
import { brand, madeWithSceneryStackOnDark, madeWithSceneryStackOnLight } from "scenerystack/brand";

const Brand: TBrand = {
  id: "made-with-scenerystack",
  name: null,
  copyright: null,
  getLinks: () => [],
  logoOnBlackBackground: madeWithSceneryStackOnDark,
  logoOnWhiteBackground: madeWithSceneryStackOnLight,
};

brand.register("Brand", Brand);
