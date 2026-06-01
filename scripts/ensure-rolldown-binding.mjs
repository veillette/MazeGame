/**
 * Vite 8 uses Rolldown native bindings. npm sometimes skips nested optional deps;
 * install the binding for this OS/CPU when it is missing.
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const BINDING_BY_PLATFORM = {
  "linux:x64": "@rolldown/binding-linux-x64-gnu",
  "linux:arm64": "@rolldown/binding-linux-arm64-gnu",
  "darwin:x64": "@rolldown/binding-darwin-x64",
  "darwin:arm64": "@rolldown/binding-darwin-arm64",
  "win32:x64": "@rolldown/binding-win32-x64-msvc",
  "win32:arm64": "@rolldown/binding-win32-arm64-msvc",
};

const key = `${process.platform}:${process.arch}`;
const packageName = BINDING_BY_PLATFORM[key];

if (!packageName) {
  console.warn(`[postinstall] No Rolldown binding mapped for ${key}; vite build may fail.`);
  process.exit(0);
}

const require = createRequire(import.meta.url);
try {
  require.resolve(packageName);
} catch {
  console.log(`[postinstall] Installing missing ${packageName}@1.0.2 …`);
  execSync(`npm install --no-save ${packageName}@1.0.2`, { stdio: "inherit" });
}
