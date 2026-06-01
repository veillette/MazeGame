/**
 * StringManager.ts
 *
 * Singleton accessor for all localized strings. Each getter returns a
 * StringProperty that updates automatically when the user switches the locale.
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import { LocalizedString } from "scenerystack/chipper";
import MazeGameNamespace from "../MazeGameNamespace.js";
import stringsEn from "./strings_en.json";
import stringsFr from "./strings_fr.json";

// Compile-time key-parity check between locale files.
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsFr);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsFr satisfies typeof stringsEn);

const stringProperties = LocalizedString.getNestedStringProperties({
  en: stringsEn,
  fr: stringsFr,
});

export type ControlModeStrings = {
  readonly titleStringProperty: ReadOnlyProperty<string>;
  readonly positionStringProperty: ReadOnlyProperty<string>;
  readonly velocityStringProperty: ReadOnlyProperty<string>;
  readonly accelerationStringProperty: ReadOnlyProperty<string>;
  readonly positionShortStringProperty: ReadOnlyProperty<string>;
  readonly velocityShortStringProperty: ReadOnlyProperty<string>;
  readonly accelerationShortStringProperty: ReadOnlyProperty<string>;
};

export type LevelStrings = {
  readonly titleStringProperty: ReadOnlyProperty<string>;
  readonly practiceStringProperty: ReadOnlyProperty<string>;
  readonly level1StringProperty: ReadOnlyProperty<string>;
  readonly level2StringProperty: ReadOnlyProperty<string>;
  readonly certainDeathStringProperty: ReadOnlyProperty<string>;
};

export type HudStrings = {
  readonly collisionMultiplierStringProperty: ReadOnlyProperty<string>;
  readonly wonStringProperty: ReadOnlyProperty<string>;
  readonly resetLevelStringProperty: ReadOnlyProperty<string>;
  readonly collisionWarningStringProperty: ReadOnlyProperty<string>;
  readonly nextLevelStringProperty: ReadOnlyProperty<string>;
  readonly resetAllStringProperty: ReadOnlyProperty<string>;
};

export type A11yStrings = {
  readonly controlPadStringProperty: ReadOnlyProperty<string>;
  readonly particleStringProperty: ReadOnlyProperty<string>;
  readonly timeDisplayStringProperty: ReadOnlyProperty<string>;
  readonly collisionsDisplayStringProperty: ReadOnlyProperty<string>;
  readonly hudPanelStringProperty: ReadOnlyProperty<string>;
  readonly levelCompleteStringProperty: ReadOnlyProperty<string>;
};

export class StringManager {
  private static instance: StringManager | null = null;

  private constructor() {
    // Private — obtain via getInstance()
  }

  public static getInstance(): StringManager {
    if (StringManager.instance === null) {
      StringManager.instance = new StringManager();
      MazeGameNamespace.register("StringManager", StringManager.instance);
    }
    return StringManager.instance;
  }

  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return stringProperties.titleStringProperty;
  }

  public getScreenNames(): { readonly mazeGameStringProperty: ReadOnlyProperty<string> } {
    return {
      mazeGameStringProperty: stringProperties.screens.mazeGameStringProperty,
    };
  }

  public getControlModeStrings(): ControlModeStrings {
    return stringProperties.controlMode;
  }

  public getLevelStrings(): LevelStrings {
    return stringProperties.levels;
  }

  public getHudStrings(): HudStrings {
    return stringProperties.hud;
  }

  public getA11yStrings(): A11yStrings {
    return stringProperties.a11y;
  }
}
