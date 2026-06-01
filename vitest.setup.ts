// SceneryStack expects browser globals when axon/dot modules load.
declare global {
  var self: typeof globalThis;
}

globalThis.self = globalThis;
