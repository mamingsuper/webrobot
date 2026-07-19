import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

const projectRoot = resolve(import.meta.dirname, "..");

async function readComponent(name) {
  return readFile(
    join(projectRoot, "src/components/dala-portfolio", `${name}.tsx`),
    "utf8",
  );
}

test("header exposes exactly the four requested navigation items", async () => {
  const source = await readComponent("PortfolioHeader");
  const navList = source.match(
    /<ul\s+className="[^"]*\bjs-nav-list\b[^"]*">([\s\S]*?)<\/ul>/,
  )?.[1];

  assert.ok(navList, "header should contain a js-nav-list");

  const items = [...navList.matchAll(/<li\b([\s\S]*?)<\/li>/g)].map(
    ([itemSource, itemAttributes]) => {
      const label = itemSource
        .match(/>\s*([^<>{}\n]+?)\s*<\/(?:Link|a)>/)?.[1]
        .trim();
      const section = itemAttributes.match(/section-name="([^"]+)"/)?.[1];
      const anchor = itemSource.match(/anchor-link="([^"]+)"/)?.[1];
      const href = itemSource.match(/href=\{([^}]+)\}/)?.[1];

      return { label, section, target: anchor ?? href };
    },
  );

  assert.deepEqual(items, [
    { label: "About", section: "landing", target: "landing" },
    { label: "Project", section: "research", target: "research" },
    {
      label: "Publication",
      section: "publications",
      target: "publications",
    },
    { label: "CV", section: "cv", target: "hero.cv" },
  ]);
  assert.doesNotMatch(source, /mailto:|ContactButton|\bContact\b/);
  assert.doesNotMatch(source, /dala-d\.png/);
  assert.match(source, /className="ming-mark"/);
});

test("hero presents the complete About profile with one email action", async () => {
  const source = await readComponent("PortfolioSections");

  assert.match(source, /import Image from "next\/image"/);
  assert.match(source, /<div anchor-target="landing" \/>/);
  assert.match(
    source,
    /className="section portfolio-act hero-act js-section" section-name="landing"/,
  );
  assert.match(source, /src=\{hero\.avatar\}/);
  assert.match(source, /alt="Portrait of Ming Ma"/);
  assert.match(source, /\{hero\.name\}/);
  assert.match(source, /\{hero\.role\}[\s\S]*\{hero\.affiliation\}/);
  assert.match(source, /hero\.bio\.map\(\(paragraph\) =>/);
  assert.match(source, /href=\{`mailto:\$\{hero\.email\}`\}/);
  assert.match(source, />\{hero\.email\}<\/a>/);

  const heroSource = source.match(
    /export function PortfolioHero\(\) \{([\s\S]*?)\n\}\n\nexport function PortfolioResearch/,
  )?.[1];
  assert.ok(heroSource, "PortfolioHero should remain a separate component");
  assert.doesNotMatch(
    heroSource,
    /01 \/ Identity|Who decides|Enter the research|Read publications|robot-caption/,
  );
  assert.equal(
    [...heroSource.matchAll(/<(?:a|Link|button)\b/g)].length,
    1,
    "hero should expose only the Email action",
  );
});

test("hero CSS reserves desktop particle space and collapses safely on small screens", async () => {
  const css = await readFile(join(projectRoot, "src/app/portfolio-dala.css"), "utf8");

  assert.match(css, /\.hero-profile\s*\{[^}]*max-width:/s);
  assert.match(css, /\.hero-avatar\s*\{[^}]*object-fit:\s*cover/s);
  assert.match(css, /\.hero-name\s*\{[^}]*font-size:\s*clamp/s);
  assert.match(css, /@media \(min-width:\s*768px\)[\s\S]*\.hero-profile\s*\{[^}]*width:\s*min\(/);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.hero-profile\s*\{[^}]*width:\s*100%/);
  assert.doesNotMatch(css, /\.robot-caption/);
});

test("loader preserves every critical runtime hook exactly", async () => {
  const source = await readComponent("SiteLoader");
  const classTokens = [...source.matchAll(/className="([^"]+)"/g)].flatMap(
    ([, className]) => className.split(/\s+/).filter(Boolean),
  );
  const hookCounts = new Map(
    classTokens.map((hook) => [
      hook,
      classTokens.filter((candidate) => candidate === hook).length,
    ]),
  );

  const uniqueHooks = [
    "js-site-loader",
    "js-site-loader-spinner",
    "js-site-loader-spinner-svg",
    "js-site-loader-heading",
    "js-site-loader-heading-text",
    "js-site-loader-loading-text",
    "js-site-loader-ellipses",
    "js-site-loader-ellipses-wrapper",
    "js-site-loader-completed-text",
    "js-site-loader-progress",
    "js-nav-transition-mask-bg",
    "js-nav-transition-mask",
    "js-nav-transition-mask-spinner",
    "js-nav-transition-mask-spinner-svg",
  ];

  for (const hook of uniqueHooks) {
    assert.equal(hookCounts.get(hook), 1, `${hook} should occur exactly once`);
  }
  assert.equal(
    hookCounts.get("js-site-loader-progress-digit"),
    3,
    "loader should preserve all three progress digits",
  );
  assert.equal(
    source.match(/The most brilliant super intelligence is human minds\./g)
      ?.length,
    1,
    "loader should contain the exact approved heading once",
  );
  assert.equal(
    source.match(/<span>Completed<\/span>/g)?.length,
    1,
    "loader should contain the exact completed label once",
  );
});

test("footer is the contact section with approved copy and unchanged destinations", async () => {
  const source = await readComponent("PortfolioFooter");

  assert.match(source, /className="section footer \| js-section" section-name="contact"/);
  assert.match(source, /className="footer__contact-layout"/);
  assert.match(source, /className="footer__head" data-contact-copy data-reveal/);
  assert.match(source, /className="footer__planet-safe-zone" data-planet-safe-zone aria-hidden="true"/);
  assert.match(source, /Human connection leads to great ideas\./);
  assert.match(source, /href=\{`mailto:\$\{hero\.email\}`\}/);
  assert.match(source, />Contact me\.</);
  assert.match(source, /anchor-link="research"[\s\S]*Project/);
  assert.match(source, /anchor-link="publications"[\s\S]*Publication/);
  assert.match(source, /href=\{hero\.cv\}[\s\S]*CV/);
});
