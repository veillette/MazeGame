// SceneryStack expects browser globals when axon/dot modules load.
declare global {
  var self: typeof globalThis;
}

import { enableAssert, enableAssertSlow } from "scenerystack/assert";

globalThis.self = globalThis;

enableAssert();
enableAssertSlow();
