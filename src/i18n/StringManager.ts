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

  public getControlModeStrings(): typeof stringProperties.controlMode {
    return stringProperties.controlMode;
  }

  public getLevelStrings(): typeof stringProperties.levels {
    return stringProperties.levels;
  }

  public getHudStrings(): typeof stringProperties.hud {
    return stringProperties.hud;
  }
}
