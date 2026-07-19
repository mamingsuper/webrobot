import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { patchRuntime } from "./patch-dala-runtime-lib.mjs";

const runtimePath = resolve("public/scripts/theme.js");
const runtime = await readFile(runtimePath, "utf8");
const patchedRuntime = patchRuntime(runtime);

if (patchedRuntime === runtime) {
  console.log("Dala native robot runtime is already patched.");
  process.exit(0);
}

await writeFile(runtimePath, patchedRuntime);
console.log("Patched Dala to load the native robot position texture.");
