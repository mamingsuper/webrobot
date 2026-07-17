import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

import ts from "typescript";

import {
  dampProgress,
  mapScrollOffsetToProgress,
} from "../src/lib/portfolio-runtime/scroll-director.ts";

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
          throw new Error(`Unexpected runtime dependency ${specifier}`);
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

const { resolveDalaStageState } = loadTypeScriptModule(join(runtimeRoot, "math.ts"));

async function read(path) {
  return readFile(join(projectRoot, path), "utf8");
}

test("scroll offsets map continuously onto the four stage range", () => {
  const offsets = [100, 1100, 2600, 4100];

  assert.equal(mapScrollOffsetToProgress(0, offsets), 0);
  assert.equal(mapScrollOffsetToProgress(600, offsets), 0.5);
  assert.equal(mapScrollOffsetToProgress(1100, offsets), 1);
  assert.equal(mapScrollOffsetToProgress(1850, offsets), 1.5);
  assert.equal(mapScrollOffsetToProgress(3350, offsets), 2.5);
  assert.equal(mapScrollOffsetToProgress(5000, offsets), 3);
});

test("stage damping is frame-rate independent", () => {
  const once = dampProgress(0, 3, 1);
  let stepped = 0;
  for (let frame = 0; frame < 60; frame += 1) {
    stepped = dampProgress(stepped, 3, 1 / 60);
  }

  assert.ok(Math.abs(once - stepped) < 1e-10);
});

test("Dala target migration and expansion settle before the incoming section", () => {
  const stable = resolveDalaStageState(0.21);
  assert.deepEqual(stable, {
    from: 0,
    to: 1,
    morph: 0,
    explode: 0,
    settledStage: 0,
    sweep: { x: 0, y: 0, spin: 0 },
  });

  const rising = resolveDalaStageState(0.31);
  assert.ok(Math.abs(rising.morph - 3 / 14) < 1e-12);
  assert.ok(Math.abs(rising.explode - 0.5) < 1e-12);
  assert.equal(resolveDalaStageState(0.37).explode, 1);
  assert.equal(resolveDalaStageState(0.43).explode, 1);
  assert.equal(resolveDalaStageState(0.5).explode, 1);

  const falling = resolveDalaStageState(0.57);
  assert.ok(Math.abs(falling.morph - 5 / 6) < 1e-12);
  assert.ok(Math.abs(falling.explode - 0.5) < 1e-12);

  for (const offset of [0, 1, 2]) {
    assert.ok(resolveDalaStageState(offset + 0.22).morph < 1e-12);
    assert.ok(Math.abs(resolveDalaStageState(offset + 0.37).explode - 1) < 1e-12);
    assert.ok(Math.abs(resolveDalaStageState(offset + 0.5).explode - 1) < 1e-12);
    assert.equal(resolveDalaStageState(offset + 0.64).morph, 1);
    assert.equal(resolveDalaStageState(offset + 0.64).explode, 0);
  }
  assert.deepEqual(resolveDalaStageState(3), {
    from: 3,
    to: 3,
    morph: 0,
    explode: 0,
    settledStage: 3,
    sweep: { x: 0, y: 0, spin: 0 },
  });
});

test("transition choreography exposes sweep and the upgraded shader uniforms", async () => {
  const [engine, shaders, kernel] = await Promise.all([
    read("src/lib/particle-runtime/ParticleEngine.ts"),
    read("src/lib/particle-runtime/three-shaders.ts"),
    read("src/lib/particle-runtime/three-kernel.ts"),
  ]);
  const sweeping = resolveDalaStageState(0.37).sweep;
  assert.ok(sweeping.x < 0);
  assert.ok(sweeping.y > 0);
  assert.ok(sweeping.spin > 0);
  assert.match(shaders, /float qinticInOut\(/);
  assert.match(kernel, /DALA_STAGGER_SPREAD = 5/);
  assert.match(engine, /uCloudSpin/);
  assert.match(engine, /uOcclusionStrength/);
  assert.match(engine, /uColorBoost/);
});

test("default runtime owns one canvas and manual Dala fallback is explicit", async () => {
  const [page, experience, runtimeSwitch] = await Promise.all([
    read("src/app/page.tsx"),
    read("src/components/particle/ParticleExperience.tsx"),
    read("src/components/particle/RuntimeSwitch.tsx"),
  ]);

  assert.match(experience, /<canvas id="canvas"/);
  assert.equal(experience.match(/<canvas\b/g)?.length, 1);
  assert.match(experience, /import type \{ ParticleEngine as ParticleEngineInstance \}/);
  assert.match(experience, /await import\("@\/lib\/particle-runtime\/ParticleEngine"\)/);
  assert.match(experience, /new ParticleEngine\(\{/);
  assert.match(experience, /engine\?\.destroy\(\)/);
  assert.match(experience, /prefers-reduced-motion: reduce/);
  assert.match(experience, /visibilitychange/);
  assert.match(experience, /webglcontextlost/);
  assert.match(experience, /webglcontextrestored/);
  assert.match(experience, /triggerImpulse/);
  assert.doesNotMatch(experience, /runtimeReady/);
  assert.match(experience, /handlePointerDown[\s\S]*engine\?\.setPointer\(pointer\.x, pointer\.y, true\)/);
  for (const eventName of ["pointerdown", "pointerup", "pointercancel"]) {
    assert.match(
      experience,
      new RegExp(`addEventListener\\("${eventName}", [^,]+, \\{ passive: true \\}\\)`),
    );
    assert.match(
      experience,
      new RegExp(`removeEventListener\\("${eventName}", [^)]+\\)`),
    );
  }
  assert.doesNotMatch(experience, /touchstart|mousedown|addEventListener\("click"/);
  assert.match(page, /runtime === "dala"/);
  assert.doesNotMatch(page, /import \{ DalaRuntime \}|import \{ ParticleCanvas \}/);
  assert.match(runtimeSwitch, /useDalaFallback \? <LegacyDalaExperience \/> : <ParticleExperience \/>/);
  assert.match(runtimeSwitch, /dynamic\(/);
});

test("development visual controls fix stage, time and pointer without leaking into production", async () => {
  const [experience, director] = await Promise.all([
    read("src/components/particle/ParticleExperience.tsx"),
    read("src/lib/portfolio-runtime/scroll-director.ts"),
  ]);

  assert.match(experience, /process\.env\.NODE_ENV === "production"/);
  assert.match(experience, /window\.__MING_PARTICLE_DEBUG__ = debugControls/);
  assert.match(experience, /dataset\.particleDebug = "available"/);
  assert.match(experience, /query\.get\("particleStage"\)/);
  assert.match(experience, /query\.get\("particleTime"\)/);
  assert.match(experience, /query\.get\("particlePointer"\)/);
  assert.match(experience, /setStageProgress\(progress\)/);
  assert.match(experience, /setTime\(seconds\)/);
  assert.match(experience, /setPointer\(x, y, active = true\)/);
  assert.match(experience, /delete window\.__MING_PARTICLE_DEBUG__/);
  assert.match(director, /setDebugProgress: \(progress: number \| null\) => void/);
  assert.match(director, /debugProgress !== null/);
});

test("React loader releases semantic content after runtime failure", async () => {
  const [loader, experience, runtimeSwitch] = await Promise.all([
    read("src/components/dala-portfolio/SiteLoader.tsx"),
    read("src/components/particle/ParticleExperience.tsx"),
    read("src/components/particle/RuntimeSwitch.tsx"),
  ]);

  assert.match(loader, /portfolio:runtime-error/);
  assert.match(loader, /setState\("error"\)/);
  assert.match(loader, /data-state=\{legacyFallback \? "legacy" : state\}/);
  assert.match(loader, /Interactive particles are unavailable\. All portfolio content remains accessible\./);
  assert.match(loader, /role="status"/);
  assert.match(loader, /}, \[legacyFallback\]\);/);
  assert.doesNotMatch(loader, /}, \[\]\);/);
  assert.match(experience, /}, \[contextGeneration, reducedMotion\]\);/);
  assert.match(runtimeSwitch, /}, \[useDalaFallback\]\);/);
});

test("standalone CSS covers shell, entrances, focus and reduced motion", async () => {
  const [css, globals, footer] = await Promise.all([
    read("src/app/particle-runtime.css"),
    read("src/app/globals.css"),
    read("src/components/dala-portfolio/PortfolioFooter.tsx"),
  ]);

  for (const selector of [
    ".particle-experience",
    ".header__inner",
    ".nav-toggle",
    ".nav.is-open",
    ".site-loader[data-state=\"error\"]",
    ".footer__bar",
    "[data-reveal][data-in-view=\"true\"]",
    ":focus-visible",
    "@media (prefers-reduced-motion: reduce)",
  ]) {
    assert.ok(css.includes(selector), `standalone CSS should contain ${selector}`);
  }
  assert.match(globals, /@import "\.\/particle-runtime\.css"/);
  assert.match(
    css,
    /\.nav__link\s*\{[^}]*font-size:\s*clamp\(1\.35rem, 1\.35vw, 1\.5rem\);/s,
  );
  assert.doesNotMatch(footer, /animate-from|gsap/i);
  assert.match(footer, /<div className="footer__bar">/);
});

test("Contact reserves a separate responsive planet region beside or below its copy", async () => {
  const [css, footer] = await Promise.all([
    read("src/app/particle-runtime.css"),
    read("src/components/dala-portfolio/PortfolioFooter.tsx"),
  ]);

  assert.match(footer, /footer__contact-layout/);
  assert.match(footer, /data-contact-copy/);
  assert.match(footer, /data-planet-safe-zone aria-hidden="true"/);
  assert.match(
    css,
    /\.footer__contact-layout\s*\{[^}]*grid-template-rows:\s*auto minmax\(20rem, 46svh\)/s,
  );
  assert.match(
    css,
    /@media \(min-width: 768px\)[\s\S]*\.footer__contact-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 48%\) minmax\(0, 52%\)/s,
  );
  assert.match(
    css,
    /@media \(min-width: 768px\)[\s\S]*\.footer \.footer__head\s*\{[^}]*grid-column:\s*1;[^}]*text-align:\s*left/s,
  );
  assert.match(
    css,
    /@media \(min-width: 768px\)[\s\S]*\.footer__planet-safe-zone\s*\{[^}]*grid-column:\s*2;[^}]*min-height:\s*32rem/s,
  );
  assert.match(css, /\.footer__planet-safe-zone\s*\{[^}]*isolation:\s*isolate/s);
  assert.match(css, /\.footer::before\s*\{[^}]*linear-gradient\(90deg,[^}]*transparent 66%/s);
  assert.match(css, /\.footer__bar\s*\{[^}]*grid-row:\s*2/s);
});

test("native director owns navigation, accessibility and one-time entrances", async () => {
  const [director, header] = await Promise.all([
    read("src/lib/portfolio-runtime/scroll-director.ts"),
    read("src/components/dala-portfolio/PortfolioHeader.tsx"),
  ]);

  assert.match(director, /new ResizeObserver\(refresh\)/);
  assert.match(director, /const sectionSelector = "\.js-section\[section-name\]"/);
  assert.doesNotMatch(director, /const sectionSelector = "\[section-name\]"/);
  assert.match(director, /new IntersectionObserver\(/);
  assert.match(director, /window\.scrollTo\(\{/);
  assert.match(director, /behavior: reducedMotion \? "auto" : "smooth"/);
  assert.match(director, /event\.key === "Escape"/);
  assert.match(director, /aria-current/);
  assert.doesNotMatch(header, /from "next\/link"/);
  assert.match(header, /href="#landing"/);
  assert.match(header, /href="#research"/);
  assert.match(header, /href="#publications"/);
  assert.match(header, /aria-expanded="false"/);
  assert.match(header, /aria-controls="portfolio-navigation"/);
});
