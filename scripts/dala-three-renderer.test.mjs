import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  DALA_ASSEMBLY_SECONDS,
  DALA_DYNAMICS,
  DALA_FOREGROUND_PALETTE,
  DALA_FOREGROUND_PARTICLE_COUNT,
  DALA_MAIN_PALETTE,
  DALA_MAIN_PARTICLE_COUNT,
  DALA_MOBILE_PARTICLE_COUNT,
  DALA_POSTPROCESSING,
  DALA_SPRING_JITTER,
  DALA_STAGGER_SPREAD,
  IMPULSE_SECONDS,
  createDalaGlyphGeometry,
  quinticEase,
} from "../src/lib/particle-runtime/three-kernel.ts";

const projectRoot = resolve(import.meta.dirname, "..");
const runtimeRoot = join(projectRoot, "src/lib/particle-runtime");

test("procedural Dala glyph matches the audited py-lod7 topology", () => {
  const geometry = createDalaGlyphGeometry();
  assert.equal(geometry.getAttribute("position").count, 20);
  assert.equal(geometry.index?.count, 144);
  assert.equal((geometry.index?.count ?? 0) / 3, 48);
  assert.equal(geometry.getAttribute("normal").count, 20);
  geometry.dispose();
});

test("renderer constants preserve Dala density, dynamics, palettes and post chain", () => {
  assert.equal(DALA_MAIN_PARTICLE_COUNT, 10_000);
  assert.equal(DALA_MOBILE_PARTICLE_COUNT, 7_000);
  assert.equal(DALA_FOREGROUND_PARTICLE_COUNT, 250);
  assert.equal(DALA_ASSEMBLY_SECONDS, 3);
  assert.equal(DALA_STAGGER_SPREAD, 5);
  assert.equal(DALA_SPRING_JITTER, 0.0001);
  assert.equal(IMPULSE_SECONDS, 1.4);
  assert.deepEqual(DALA_DYNAMICS, {
    spring: 0.006,
    friction: 0.892,
    hoverRadius: 0.78,
    hoverScale: 0.04,
  });
  assert.deepEqual(DALA_MAIN_PALETTE, ["#c88d00", "#5c01bb", "#007249", "#b1a0b6"]);
  assert.deepEqual(DALA_FOREGROUND_PALETTE, ["#5d399a", "#ba882b", "#287464", "#a494af"]);
  assert.deepEqual(DALA_POSTPROCESSING, {
    focalDepth: 0.125,
    focalLength: 27,
    fstop: 2509,
    maxblur: 10,
    vignetteOffset: 0.3,
    vignetteDarkness: 4,
  });
});

test("quintic assembly easing is clamped and monotonic", () => {
  assert.equal(quinticEase(-1), 0);
  assert.equal(quinticEase(0), 0);
  assert.equal(quinticEase(0.5), 0.5);
  assert.equal(quinticEase(1), 1);
  assert.equal(quinticEase(2), 1);
  let previous = 0;
  for (let step = 1; step <= 100; step += 1) {
    const current = quinticEase(step / 100);
    assert.ok(current >= previous);
    previous = current;
  }
});

test("Three.js engine owns two-target FBO, 3D foreground and restrained post-processing", async () => {
  const [engine, shaders, packageJsonSource, lockSource] = await Promise.all([
    readFile(join(runtimeRoot, "ParticleEngine.ts"), "utf8"),
    readFile(join(runtimeRoot, "three-shaders.ts"), "utf8"),
    readFile(join(projectRoot, "package.json"), "utf8"),
    readFile(join(projectRoot, "package-lock.json"), "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonSource);
  const lock = JSON.parse(lockSource);

  assert.equal(packageJson.dependencies.three, "^0.185.1");
  assert.equal(lock.packages["node_modules/three"].version, "0.185.1");
  assert.match(engine, /new THREE\.WebGLRenderer/);
  assert.match(engine, /new THREE\.PerspectiveCamera/);
  assert.match(engine, /count: 2/);
  assert.match(engine, /uPosition: \{ value: null \}/);
  assert.match(engine, /uVelocity: \{ value: null \}/);
  assert.match(engine, /new THREE\.InstancedBufferGeometry/);
  assert.match(engine, /DALA_FOREGROUND_PARTICLE_COUNT/);
  assert.match(engine, /new EffectComposer/);
  assert.doesNotMatch(engine, /UnrealBloomPass/);
  assert.match(engine, /new BokehPass/);
  assert.match(shaders, /const float SPRING = 0\.006/);
  assert.match(shaders, /float qinticInOut\(/);
  assert.match(shaders, /uniform float uCloudSpin/);
  assert.match(shaders, /uniform float uOcclusionStrength/);
  assert.match(shaders, /uniform float uColorBoost/);
  assert.match(shaders, /const float FRICTION = 0\.892/);
  assert.match(shaders, /HOVER_RADIUS = 0\.78/);
  assert.match(shaders, /HOVER_SCALE = 0\.04/);
  assert.match(shaders, /diameterPixels = mix\(6\.1, 12\.2/);
  assert.match(shaders, /float sweepBand = exp/);
  assert.match(shaders, /float spotlight = pow/);
  assert.match(shaders, /float theatreLight = clamp/);
  assert.match(shaders, /flowAmount \* spotlight/);
  assert.match(shaders, /hoverTangent \* flowAmount/);
  assert.doesNotMatch(shaders, /hoverDirection \* agitation/);
  assert.doesNotMatch(shaders, /vBarycentric|outline/i);
});

test("engine keeps the lifecycle API and click impulse lifecycle", async () => {
  const source = await readFile(join(runtimeRoot, "ParticleEngine.ts"), "utf8");
  for (const method of [
    "start()",
    "setStageProgress(progress: number)",
    "setPointer(x: number, y: number, active: boolean)",
    "setDebugTime(seconds: number | null)",
    "triggerImpulse(clipX: number, clipY: number)",
    "resize()",
    "setPaused(paused: boolean)",
    "destroy()",
  ]) {
    assert.ok(source.includes(method), `missing lifecycle method ${method}`);
  }
  assert.match(source, /triggerImpulse/);
  assert.match(source, /IMPULSE_SECONDS/);
  assert.match(source, /webglcontextlost/);
  assert.match(source, /webglcontextrestored/);
  assert.match(source, /removeEventListener\("visibilitychange"/);
  assert.match(source, /\.dispose\(\)/);
});
