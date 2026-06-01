/**
 * StringManager.ts
 *
 * Singleton accessor for all localized strings. Each getter returns a
 * StringProperty that updates automatically when the user switches the locale.
 */

import type { ReadOnlyProperty, TReadOnlyProperty } from "scenerystack/axon";
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
  readonly titleStringProperty: TReadOnlyProperty<string>;
  readonly positionStringProperty: TReadOnlyProperty<string>;
  readonly velocityStringProperty: TReadOnlyProperty<string>;
  readonly accelerationStringProperty: TReadOnlyProperty<string>;
  readonly positionShortStringProperty: TReadOnlyProperty<string>;
  readonly velocityShortStringProperty: TReadOnlyProperty<string>;
  readonly accelerationShortStringProperty: TReadOnlyProperty<string>;
};

export type LevelStrings = {
  readonly titleStringProperty: TReadOnlyProperty<string>;
  readonly practiceStringProperty: TReadOnlyProperty<string>;
  readonly level1StringProperty: TReadOnlyProperty<string>;
  readonly level2StringProperty: TReadOnlyProperty<string>;
  readonly certainDeathStringProperty: TReadOnlyProperty<string>;
};

export type HudStrings = {
  readonly collisionMultiplierStringProperty: TReadOnlyProperty<string>;
  readonly wonStringProperty: TReadOnlyProperty<string>;
  readonly resetLevelStringProperty: TReadOnlyProperty<string>;
  readonly collisionWarningStringProperty: TReadOnlyProperty<string>;
  readonly nextLevelStringProperty: TReadOnlyProperty<string>;
  readonly resetAllStringProperty: TReadOnlyProperty<string>;
};

export type PreferencesStrings = {
  readonly particleTraceStringProperty: TReadOnlyProperty<string>;
  readonly particleTraceDescriptionStringProperty: TReadOnlyProperty<string>;
};

export type InfoStrings = {
  readonly titleStringProperty: TReadOnlyProperty<string>;
  readonly introductionStringProperty: TReadOnlyProperty<string>;
  readonly practiceDescriptionStringProperty: TReadOnlyProperty<string>;
  readonly level1DescriptionStringProperty: TReadOnlyProperty<string>;
  readonly level2DescriptionStringProperty: TReadOnlyProperty<string>;
  readonly certainDeathDescriptionStringProperty: TReadOnlyProperty<string>;
};

export type KeyboardHelpStrings = {
  readonly particleStringProperty: TReadOnlyProperty<string>;
  readonly controlParticleStringProperty: TReadOnlyProperty<string>;
  readonly controlParticleDescriptionStringProperty: TReadOnlyProperty<string>;
  readonly stopMotionStringProperty: TReadOnlyProperty<string>;
  readonly stopMotionDescriptionStringProperty: TReadOnlyProperty<string>;
};

export type A11yStrings = {
  readonly controlPadStringProperty: TReadOnlyProperty<string>;
  readonly particleStringProperty: TReadOnlyProperty<string>;
  readonly timeDisplayStringProperty: TReadOnlyProperty<string>;
  readonly collisionsDisplayStringProperty: TReadOnlyProperty<string>;
  readonly hudPanelStringProperty: TReadOnlyProperty<string>;
  readonly levelCompleteStringProperty: TReadOnlyProperty<string>;
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

  public getInfoStrings(): InfoStrings {
    return stringProperties.info;
  }

  public getKeyboardHelpStrings(): KeyboardHelpStrings {
    return stringProperties.keyboardHelp;
  }

  public getA11yStrings(): A11yStrings {
    return stringProperties.a11y;
  }

  public getPreferencesStrings(): PreferencesStrings {
    return stringProperties.preferences;
  }
}
