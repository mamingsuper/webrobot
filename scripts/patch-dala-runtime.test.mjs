import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { countOccurrences, patchRuntime, replacements } from "./patch-dala-runtime-lib.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const patchScript = join(projectRoot, "scripts/patch-dala-runtime.mjs");
const realRuntimePath = join(projectRoot, "public/scripts/theme.js");

const originalRuntime = replacements.map(({ original }) => original).join("middle");
const patchedSignatures = replacements.map(({ replacement }) => replacement);

function replacementFor(label) {
  const replacement = replacements.find((entry) => entry.label === label);
  assert.ok(replacement, `Missing ${label} replacement`);
  return replacement;
}

function mapRange(value, inputMin, inputMax, outputMin, outputMax) {
  return outputMin + ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin);
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function evaluateRuntimeExpression(expression, progress) {
  return Function("e", "zt", "Ut", `return ${expression}`)(progress, clamp, mapRange);
}

function assertClose(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`);
}

async function createRuntimeCopy(runtime) {
  const directory = await mkdtemp(join(tmpdir(), "dala-patch-"));
  const runtimeDirectory = join(directory, "public/scripts");
  const runtimePath = join(runtimeDirectory, "theme.js");
  await mkdir(runtimeDirectory, { recursive: true });
  await writeFile(runtimePath, runtime);
  return { directory, runtimePath };
}

function runPatch(directory) {
  return spawnSync(process.execPath, [patchScript], {
    cwd: directory,
    encoding: "utf8",
  });
}

async function patchRuntimeCopy(runtime) {
  const copy = await createRuntimeCopy(runtime);
  const result = runPatch(copy.directory);
  return {
    ...copy,
    ...result,
    runtime: await readFile(copy.runtimePath, "utf8"),
  };
}

test("four-stage dynamics use the same three transition windows", () => {
  const rotation = replacementFor("rotation target thresholds");
  const horizontalPosition = replacementFor("desktop horizontal position");
  const verticalPosition = replacementFor("desktop vertical position");
  const desktopTarget = replacementFor("desktop target thresholds");
  const mobileTarget = replacementFor("mobile target thresholds");
  const desktopExplode = replacementFor("desktop explode transitions");
  const mobileExplode = replacementFor("mobile explode transitions");

  for (const dynamics of [horizontalPosition, verticalPosition, desktopTarget, mobileTarget]) {
    assert.match(dynamics.replacement, /\.7,1/);
    assert.match(dynamics.replacement, /1\.7,2/);
    assert.match(dynamics.replacement, /2\.7,3/);
  }

  assert.match(rotation.replacement, /\.7,\.85/);
  assert.match(rotation.replacement, /\.85,1/);
  assert.match(rotation.replacement, /1\.7,1\.85/);
  assert.match(rotation.replacement, /1\.85,2/);
  assert.match(rotation.replacement, /2\.7,2\.85/);
  assert.match(rotation.replacement, /2\.85,3/);
  assert.match(rotation.replacement, /,n=0;$/);
  assert.doesNotMatch(rotation.replacement, /-\.489/);

  for (const dynamics of [desktopExplode, mobileExplode]) {
    assert.match(dynamics.replacement, /\.72,\.82/);
    assert.match(dynamics.replacement, /\.9,1/);
    assert.match(dynamics.replacement, /1\.72,1\.82/);
    assert.match(dynamics.replacement, /1\.9,2/);
    assert.match(dynamics.replacement, /2\.72,2\.82/);
    assert.match(dynamics.replacement, /2\.9,3/);
  }
});

test("desktop positions and rotations settle exactly at all four stages", () => {
  const rotation = replacementFor("rotation target thresholds");
  const horizontalPosition = replacementFor("desktop horizontal position");
  const verticalPosition = replacementFor("desktop vertical position");
  const rotationExpression = rotation.replacement.match(/,t=(.*),n=0;$/)?.[1];
  const horizontalExpression = horizontalPosition.replacement.match(/,t=(.*);this\._params/)?.[1];
  const verticalExpression = verticalPosition.replacement.match(/const n=(.*);this\._params/)?.[1];

  assert.ok(rotationExpression);
  assert.ok(horizontalExpression);
  assert.ok(verticalExpression);

  const stages = [
    { progress: 0, x: 3, y: 0 },
    { progress: 1, x: -4.4, y: -0.6 },
    { progress: 2, x: -3.6, y: -1.4 },
    { progress: 3, x: -2.5, y: 0.5 },
  ];

  for (const { progress, x, y } of stages) {
    assertClose(evaluateRuntimeExpression(horizontalExpression, progress), x, `stage ${progress} x`);
    assertClose(evaluateRuntimeExpression(verticalExpression, progress), y, `stage ${progress} y`);
    assertClose(evaluateRuntimeExpression(rotationExpression, progress), 0, `stage ${progress} rotation`);
  }

  for (const progress of [.5, 1.35, 2.35, 3.5]) {
    assertClose(evaluateRuntimeExpression(rotationExpression, progress), 0, `stable ${progress} rotation`);
  }
});

test("desktop particle factor stays at the native density and scale", () => {
  const factor = replacementFor("desktop particle factor");
  assert.equal(factor.replacement, "const r=this._factor;this._material.customUniforms[3].value");
});

test("migrates each prior four-stage rotation patch", () => {
  const rotation = replacementFor("rotation target thresholds");
  assert.ok(rotation.legacy?.length);

  for (const legacyRotation of rotation.legacy) {
    const legacyRuntime = replacements
      .map((entry) => entry === rotation ? legacyRotation : entry.original)
      .join("middle");
    const patched = patchRuntime(legacyRuntime);

    for (const { replacement } of replacements) {
      assert.equal(countOccurrences(patched, replacement), 1);
    }
  }
});

test("patches resources and all three four-stage threshold signatures exactly once", async () => {
  const first = await patchRuntimeCopy(`before${originalRuntime}after`);
  assert.equal(first.status, 0, first.stderr);

  for (const signature of patchedSignatures) {
    assert.equal(countOccurrences(first.runtime, signature), 1, signature);
  }
});

test("remains idempotent after every signature is patched", async () => {
  const first = await patchRuntimeCopy(originalRuntime);
  assert.equal(first.status, 0, first.stderr);

  const second = runPatch(first.directory);
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /already patched/);

  const runtimeAfterSecondPatch = await readFile(first.runtimePath, "utf8");
  assert.equal(runtimeAfterSecondPatch, first.runtime);
  for (const signature of patchedSignatures) {
    assert.equal(countOccurrences(runtimeAfterSecondPatch, signature), 1, signature);
  }
});

test("patches an original-state copy of the real bundle back to the checked-in bundle", async () => {
  const patchedBundle = await readFile(realRuntimePath, "utf8");
  let originalBundle = patchedBundle;

  for (const { label, original, replacement } of replacements) {
    assert.equal(countOccurrences(originalBundle, original), 0, `${label} source before reversal`);
    assert.equal(countOccurrences(originalBundle, replacement), 1, `${label} target before reversal`);
    originalBundle = originalBundle.replace(replacement, original);
  }

  const copy = await createRuntimeCopy(originalBundle);
  const first = runPatch(copy.directory);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(await readFile(copy.runtimePath, "utf8"), patchedBundle);

  const second = runPatch(copy.directory);
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /already patched/);
  assert.equal(await readFile(copy.runtimePath, "utf8"), patchedBundle);
});

test("checked-in runtime preserves the native particle system and cache version", async () => {
  const runtime = await readFile(realRuntimePath, "utf8");
  const component = await readFile(
    join(projectRoot, "src/components/dala-portfolio/DalaRuntime.tsx"),
    "utf8",
  );

  assert.equal(countOccurrences(runtime, '_nb=u.isMobile?7e3:1e4'), 1);
  assert.equal(countOccurrences(runtime, 'getElementById("canvas")'), 1);
  assert.equal(countOccurrences(runtime, "u_spring:{value:.006}"), 1);
  assert.equal(countOccurrences(runtime, "u_friction:{value:.892}"), 1);
  assert.match(component, /theme\.js\?v=native-robot-v4/);
  assert.doesNotMatch(component, /theme\.js\?v=native-robot-v2/);
});

test("fails when a source and its patched target are both missing", async () => {
  const { original } = replacements.find(({ label }) => label === "desktop target thresholds");
  const result = await patchRuntimeCopy(originalRuntime.replace(original, "missing-desktop-thresholds"));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /desktop target thresholds/);
});

test("fails when a patched target is duplicated", async () => {
  const { original, replacement } = replacements.find(({ label }) => label === "mobile target thresholds");
  const duplicated = originalRuntime.replace(original, `${replacement}${replacement}`);
  const result = await patchRuntimeCopy(duplicated);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mobile target thresholds/);
});
