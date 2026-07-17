import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

import ts from "typescript";

const projectRoot = resolve(import.meta.dirname, "..");
const runtimeRoot = join(projectRoot, "src/lib/particle-runtime");

function loadTypeScriptModule(entryPath) {
  const cache = new Map();

  function load(filename) {
    const resolved = filename.endsWith(".ts") ? filename : `${filename}.ts`;
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const evaluatedModule = { exports: {} };
    cache.set(resolved, evaluatedModule);
    const output = ts.transpileModule(readFileSync(resolved, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: resolved,
    }).outputText;
    const wrapper = vm.runInThisContext(
      `(function (exports, require, module, __filename, __dirname) { ${output}\n})`,
      { filename: resolved },
    );
    wrapper(
      evaluatedModule.exports,
      (specifier) => {
        if (!specifier.startsWith(".")) {
          throw new Error(`Unexpected renderer dependency ${specifier}`);
        }
        return load(resolve(dirname(resolved), specifier));
      },
      evaluatedModule,
      resolved,
      dirname(resolved),
    );
    return evaluatedModule.exports;
  }

  return load(entryPath);
}

const runtime = {
  ...loadTypeScriptModule(join(runtimeRoot, "binary.ts")),
  ...loadTypeScriptModule(join(runtimeRoot, "math.ts")),
};
const {
  MPRT_COMPONENTS,
  MPRT_HEADER_BYTES,
  MPRT_POINTS_PER_STAGE,
  MPRT_STAGE_COUNT,
  MPRT_VERSION,
  clampStageProgress,
  parseParticleTargets,
  resolveStageInterpolation,
  resolveStageMotionImpulse,
  resolveStagePlacement,
  resolveViewportStagePlacement,
} = runtime;

const valueCount = MPRT_STAGE_COUNT * MPRT_POINTS_PER_STAGE * MPRT_COMPONENTS;
const binaryLength = MPRT_HEADER_BYTES + valueCount * Float32Array.BYTES_PER_ELEMENT;

function createTargetBinary() {
  const buffer = new ArrayBuffer(binaryLength);
  const view = new DataView(buffer);
  for (const [index, character] of [..."MPRT"].entries()) {
    view.setUint8(index, character.charCodeAt(0));
  }
  view.setUint32(4, MPRT_VERSION, true);
  view.setUint32(8, MPRT_STAGE_COUNT, true);
  view.setUint32(12, MPRT_POINTS_PER_STAGE, true);
  view.setUint32(16, MPRT_COMPONENTS, true);
  return { buffer, view };
}

function componentOffset(stage, point, component) {
  const index =
    stage * MPRT_POINTS_PER_STAGE * MPRT_COMPONENTS +
    point * MPRT_COMPONENTS +
    component;
  return MPRT_HEADER_BYTES + index * Float32Array.BYTES_PER_ELEMENT;
}

test("parses the exact 20-byte little-endian MPRT v2 header and vector groups", () => {
  const { buffer } = createTargetBinary();
  const parsed = parseParticleTargets(buffer);
  assert.equal(MPRT_HEADER_BYTES, 20);
  assert.equal(parsed.version, 2);
  assert.equal(parsed.stageCount, 4);
  assert.equal(parsed.pointsPerStage, 10_000);
  assert.equal(parsed.components, 12);
  assert.equal(parsed.data.length, valueCount);
  assert.equal(parsed.stages.length, 4);
  assert.equal(parsed.stages[0].length, 40_000);
  assert.equal(parsed.styles.length, 4);
  assert.equal(parsed.styles[0].length, 40_000);
  assert.equal(parsed.metadata.length, 4);
  assert.equal(parsed.metadata[0].length, 40_000);
});

test("rejects invalid magic, byte length, and big-endian header data", () => {
  const invalidMagic = createTargetBinary();
  invalidMagic.view.setUint8(0, "X".charCodeAt(0));
  assert.throws(() => parseParticleTargets(invalidMagic.buffer), /magic/);

  const truncated = createTargetBinary().buffer.slice(0, binaryLength - 4);
  assert.throws(() => parseParticleTargets(truncated), /byte length/);

  const bigEndian = createTargetBinary();
  bigEndian.view.setUint32(4, MPRT_VERSION, false);
  assert.throws(() => parseParticleTargets(bigEndian.buffer), /version/);
});

test("splits interleaved position, style, and metadata vectors and rejects invalid components", () => {
  const valid = createTargetBinary();
  const expected = [0.125, 0.375, 0.625, 0.875];
  for (let stage = 0; stage < MPRT_STAGE_COUNT; stage += 1) {
    valid.view.setFloat32(componentOffset(stage, 17, 2), expected[stage], true);
    valid.view.setFloat32(componentOffset(stage, 17, 4), expected[stage], true);
    valid.view.setFloat32(componentOffset(stage, 17, 8), expected[stage], true);
  }
  const parsed = parseParticleTargets(valid.buffer);
  for (let stage = 0; stage < MPRT_STAGE_COUNT; stage += 1) {
    assert.equal(parsed.stages[stage][17 * 4 + 2], expected[stage]);
    assert.equal(parsed.styles[stage][17 * 4], expected[stage]);
    assert.equal(parsed.metadata[stage][17 * 4], expected[stage]);
  }

  const notFinite = createTargetBinary();
  notFinite.view.setFloat32(componentOffset(2, 3, 1), Number.NaN, true);
  assert.throws(() => parseParticleTargets(notFinite.buffer), /not finite/);

  const notNormalized = createTargetBinary();
  notNormalized.view.setFloat32(componentOffset(3, 9, 0), 1.5, true);
  assert.throws(() => parseParticleTargets(notNormalized.buffer), /normalized/);
});

test("parses the checked-in MPRT v2 asset into four independent vector groups", () => {
  const encoded = readFileSync(
    join(projectRoot, "public/particles/portfolio-targets.bin"),
  );
  const buffer = encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength,
  );
  const parsed = parseParticleTargets(buffer);
  assert.equal(parsed.data.length, 480_000);
  assert.deepEqual(
    parsed.stages.map((stage) => stage.length),
    [40_000, 40_000, 40_000, 40_000],
  );
  assert.deepEqual(
    parsed.styles.map((stage) => stage.length),
    [40_000, 40_000, 40_000, 40_000],
  );
  assert.deepEqual(
    parsed.metadata.map((stage) => stage.length),
    [40_000, 40_000, 40_000, 40_000],
  );
  for (const metadata of parsed.metadata) {
    const order = Array.from(
      { length: MPRT_POINTS_PER_STAGE },
      (_, point) => metadata[point * 4],
    );
    assert.equal(Math.min(...order), 0);
    assert.equal(Math.max(...order), 1);
    assert.equal(new Set(order).size, MPRT_POINTS_PER_STAGE);
  }
});

test("clamps progress and resolves adjacent stage interpolation", () => {
  assert.equal(clampStageProgress(-4), 0);
  assert.equal(clampStageProgress(4), 3);
  assert.equal(clampStageProgress(Number.NaN), 0);
  assert.deepEqual(resolveStageInterpolation(1.25), {
    progress: 1.25,
    from: 1,
    to: 2,
    blend: 0.25,
  });
  assert.deepEqual(resolveStageInterpolation(3), {
    progress: 3,
    from: 3,
    to: 3,
    blend: 0,
  });
  assert.throws(() => clampStageProgress(0, 0), /positive integer/);
});

test("interpolates independent scene placement with stage progress", () => {
  const project = resolveStagePlacement(1);
  const publication = resolveStagePlacement(2);
  const midpoint = resolveStagePlacement(1.5);
  assert.ok(Math.abs(midpoint.x - (project.x + publication.x) / 2) < 1e-12);
  assert.ok(Math.abs(midpoint.y - (project.y + publication.y) / 2) < 1e-12);
  assert.ok(
    Math.abs(midpoint.scale - (project.scale + publication.scale) / 2) < 1e-12,
  );
});

test("adapts every stage to a compact portrait composition", () => {
  const aspect = 390 / 844;
  const aboutDesktop = resolveStagePlacement(0);
  const aboutPortrait = resolveViewportStagePlacement(0, aspect);
  assert.ok(aboutPortrait.scale / aboutDesktop.scale >= 0.35);
  assert.ok(aboutPortrait.scale / aboutDesktop.scale <= 0.45);
  assert.ok(aboutPortrait.x > 0.45, "About should remain on the right");
  assert.ok(aboutPortrait.y > 0.25, "About should move above mobile copy");

  const project = resolveViewportStagePlacement(1, aspect);
  const publication = resolveViewportStagePlacement(2, aspect);
  const contact = resolveViewportStagePlacement(3, aspect);
  assert.ok(project.x < 0, "Project should retain its left foreground");
  assert.ok(publication.x < 0 && publication.y < 0, "Book should remain lower-left");
  assert.ok(
    Math.abs(contact.x) < 1e-12 && contact.y <= -0.15,
    "Contact planet should settle in the mobile safe zone below the copy",
  );
  assert.ok(
    contact.scale >= 0.58 && contact.scale <= 0.62,
    "Contact planet should keep its rings legible on portrait screens",
  );

  const contactDesktop = resolveViewportStagePlacement(3, 1.5);
  assert.ok(contactDesktop.x >= 0.28 && contactDesktop.x <= 0.32);
  assert.ok(contactDesktop.scale < 1.7);

  assert.deepEqual(
    resolveViewportStagePlacement(0, 1.5),
    aboutDesktop,
    "landscape placement should be unchanged",
  );

  assert.deepEqual(
    resolveViewportStagePlacement(0, 2.2),
    aboutDesktop,
    "landscape browsers should share one particle scale regardless of chrome",
  );
});

test("smoothly interpolates portrait placement without discontinuities", () => {
  const desktop = resolveStagePlacement(0);
  const fullPortrait = resolveViewportStagePlacement(0, 0.72);
  const halfway = resolveViewportStagePlacement(0, 0.86);
  assert.ok(Math.abs(halfway.x - (desktop.x + fullPortrait.x) / 2) < 1e-12);
  assert.ok(Math.abs(halfway.y - (desktop.y + fullPortrait.y) / 2) < 1e-12);
  assert.ok(
    Math.abs(halfway.scale - (desktop.scale + fullPortrait.scale) / 2) < 1e-12,
  );
});

test("derives bounded transition energy and direction from progress velocity", () => {
  assert.deepEqual(resolveStageMotionImpulse(1, 1, 1 / 60), {
    velocity: 0,
    energy: 0,
    direction: 0,
  });
  const forward = resolveStageMotionImpulse(0.8, 1, 0.1);
  const backward = resolveStageMotionImpulse(1.2, 1, 0.1);
  assert.ok(forward.velocity > 0 && forward.energy > 0);
  assert.equal(forward.direction, 1);
  assert.ok(backward.velocity < 0 && backward.energy > 0);
  assert.equal(backward.direction, -1);
  assert.equal(resolveStageMotionImpulse(0, 3, 0.001).energy, 1.25);
});

test("renderer source owns Three.js MRT, 3D layers, post-processing, and cleanup", () => {
  const engineSource = readFileSync(join(runtimeRoot, "ParticleEngine.ts"), "utf8");
  const shaders = readFileSync(join(runtimeRoot, "three-shaders.ts"), "utf8");
  const kernelSource = readFileSync(join(runtimeRoot, "three-kernel.ts"), "utf8");
  assert.match(engineSource, /new THREE\.WebGLRenderer/);
  assert.match(engineSource, /new THREE\.PerspectiveCamera/);
  assert.match(engineSource, /EXT_color_buffer_float/);
  assert.match(engineSource, /count: 2/);
  assert.match(engineSource, /THREE\.FloatType/);
  assert.match(engineSource, /DALA_FOREGROUND_PARTICLE_COUNT/);
  assert.match(engineSource, /new EffectComposer/);
  assert.doesNotMatch(engineSource, /UnrealBloomPass/);
  assert.match(engineSource, /new BokehPass/);
  assert.match(engineSource, /triggerImpulse/);
  assert.match(engineSource, /visibilitychange/);
  assert.match(engineSource, /webglcontextlost/);
  assert.match(engineSource, /removeEventListener\("visibilitychange"/);
  assert.match(shaders, /layout\(location = 0\) out vec4 outPosition/);
  assert.match(shaders, /layout\(location = 1\) out vec4 outVelocity/);
  assert.match(shaders, /const float SPRING = 0\.006/);
  assert.match(shaders, /float qinticInOut\(/);
  assert.match(kernelSource, /DALA_STAGGER_SPREAD = 5/);
  assert.match(shaders, /uniform float uCloudSpin/);
  assert.match(shaders, /uniform float uOcclusionStrength/);
  assert.match(shaders, /uniform float uColorBoost/);
  assert.match(shaders, /uniform vec2 uImpulseOrigin/);
  assert.match(shaders, /const float FRICTION = 0\.892/);
  assert.match(shaders, /const float HOVER_RADIUS = 0\.78/);
  assert.match(shaders, /const float HOVER_SCALE = 0\.04/);
  assert.match(shaders, /warmLight/);
  assert.match(shaders, /float spotlight = pow/);
  assert.match(shaders, /float theatreLight = clamp/);
  assert.match(shaders, /flowAmount \* spotlight/);
  assert.match(engineSource, /pointerInfluence = damp/);
  assert.match(shaders, /uReducedMotion/);
  assert.match(shaders, /velocityState\.xyz \+= \(target\.xyz - positionState\.xyz\)/);
  assert.match(shaders, /quintic/);
  assert.match(shaders, /foregroundVertexShader/);
  assert.doesNotMatch(shaders, /vBarycentric|outline/);
  assert.match(shaders, /grain/);
});
