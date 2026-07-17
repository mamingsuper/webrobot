import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

import { renderTypeScriptComponent } from "./test-utils/load-typescript-component.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const componentPath = join(
  projectRoot,
  "src/components/dala-portfolio/PortfolioSections.tsx",
);
const contentPath = join(projectRoot, "src/data/content.ts");
const publicationsPath = join(projectRoot, "src/lib/publications.ts");
const cssPath = join(projectRoot, "src/app/portfolio-dala.css");

async function source(path = componentPath) {
  return readFile(path, "utf8");
}

function evaluateTypeScript(text, filename, dependencies = {}) {
  const compiled = ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  const evaluatedModule = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier in dependencies) return dependencies[specifier];
    throw new Error(`Unexpected import ${specifier} while loading ${filename}`);
  };

  vm.runInNewContext(
    `(function (exports, require, module) { ${compiled}\n})`,
    { console },
    { filename },
  )(evaluatedModule.exports, localRequire, evaluatedModule);
  return evaluatedModule.exports;
}

async function canonicalData() {
  const content = evaluateTypeScript(await source(contentPath), contentPath);
  const publicationModule = evaluateTypeScript(
    await source(publicationsPath),
    publicationsPath,
    { "@/data/content": content },
  );
  return { ...content, ...publicationModule };
}

function htmlText(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function functionSourceAndDirectMapBlocks(text, functionName, collectionName) {
  const sourceFile = ts.createSourceFile(
    componentPath,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = sourceFile.statements.find(
    (statement) =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === functionName,
  );
  assert.ok(declaration?.body, `${functionName} must be declared with a body`);

  const mapBlocks = [];
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "map" &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === collectionName
    ) {
      const callback = node.arguments[0];
      assert.ok(
        callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)),
        `${collectionName}.map must use an inline callback`,
      );
      mapBlocks.push(callback.body.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  }
  visit(declaration.body);

  return {
    functionText: declaration.getText(sourceFile),
    mapBlocks,
  };
}

test("legacy homepage selectors are completely removed", async () => {
  const css = await source(cssPath);
  const removedSelectors = [
    ".robot-caption",
    ".portfolio-landing",
    ".portfolio-landing-title",
    ".portfolio-landing-body",
    ".portfolio-project-content",
    ".portfolio-project-content-list",
    ".portfolio-publication-body",
    ".portfolio-archive",
    ".hero-copy",
    ".hero-kicker",
    ".hero-thesis",
    ".hero-actions",
    ".act-index",
    ".publication-status",
    ".archive-route",
  ];

  for (const selector of removedSelectors) {
    assert.doesNotMatch(
      css,
      new RegExp(`${selector.replaceAll(".", "\\\\.")}\\b`),
      `${selector} must not remain in the homepage stylesheet`,
    );
  }
});

test("Project disclosure styling exposes a visible open-state indicator", async () => {
  const css = await source(cssPath);

  assert.match(css, /\.record-toggle::after\s*\{[\s\S]*content:\s*["']\+["']/);
  assert.match(
    css,
    /\.research-record\[open\]\s+\.record-toggle::after\s*\{[\s\S]*transform:\s*rotate\(/,
  );
  assert.match(css, /\.research-record summary::?-webkit-details-marker|\.research-record summary::-webkit-details-marker/);
});

test("dynamic disclosures refresh the native scroll layout after their height changes", async () => {
  const text = await source();

  assert.match(text, /^"use client";/);
  assert.match(
    text,
    /function refreshPortfolioLayout\(\) \{[\s\S]*requestAnimationFrame[\s\S]*dispatchEvent\(new Event\("resize"\)\)/,
  );
  assert.equal(
    [...text.matchAll(/<details[^>]*onToggle=\{refreshPortfolioLayout\}/g)].length,
    2,
    "Project and Publication disclosures must both refresh native section offsets",
  );
});

test("canonical homepage data has the reviewed project and publication totals", async () => {
  const { projects, archivePublications } = await canonicalData();

  assert.equal(projects.length, 3);
  assert.equal(archivePublications.length, 9);
  assert.equal(
    archivePublications.filter((article) => article.abstract?.trim()).length,
    7,
  );
  assert.equal(
    archivePublications.find((article) =>
      article.title.startsWith("Centralized Control and Dispersed Mandates"),
    )?.authors,
    "Ma Ming and Yi Kang",
  );

  for (const project of projects) {
    assert.ok(project.title.trim(), "project title must be non-empty");
    assert.ok(project.desc.trim(), `${project.title}: description must be non-empty`);
    assert.ok(project.focus.trim(), `${project.title}: focus must be non-empty`);
    assert.ok(project.methods.length > 0, `${project.title}: methods must be non-empty`);
    assert.ok(
      project.methods.every((method) => method.trim()),
      `${project.title}: every method must be non-empty`,
    );
  }
});

test("About server-renders the canonical hero profile", async () => {
  const { hero } = await canonicalData();
  const markup = await renderTypeScriptComponent(componentPath, "PortfolioHero", {
    projectRoot,
  });

  assert.match(markup, new RegExp(`<img[^>]+src="${htmlText(hero.avatar)}"`));
  assert.match(markup, /<img[^>]+alt="Portrait of Ming Ma"/);
  assert.match(markup, />Ming Ma</);
  assert.equal(countMatches(markup, /<div class="hero-biography">[\s\S]*?<p>/g), 1);
  assert.equal(countMatches(markup, /<p>/g), hero.bio.length);
  const biographyText = markup.replace(/<[^>]+>/g, "");
  for (const paragraph of hero.bio) assert.ok(biographyText.includes(htmlText(paragraph)));
  assert.equal(countMatches(markup, /<cite>/g), 5);
  assert.ok(markup.includes(`href="mailto:${htmlText(hero.email)}"`));
  assert.ok(markup.includes(`>${htmlText(hero.email)}</a>`));
});

test("About keeps runtime hooks and renders the canonical hero profile", async () => {
  const text = await source();
  const hero = text.match(
    /export function PortfolioHero\(\) \{([\s\S]*?)\n\}\n\nexport function PortfolioResearch/,
  )?.[1];

  assert.ok(hero);
  assert.match(hero, /anchor-target="landing"/);
  assert.match(hero, /js-section/);
  assert.match(hero, /section-name="landing"/);
  for (const field of ["avatar", "name", "role", "affiliation", "bio", "email"]) {
    assert.match(hero, new RegExp(`hero\\.${field}`));
  }
  assert.equal([...hero.matchAll(/mailto:/g)].length, 1);
  assert.match(
    hero,
    /<a className="hero-email" href=\{`mailto:\$\{hero\.email\}`\}>\{hero\.email\}<\/a>/,
  );
  assert.doesNotMatch(hero, />\s*Email\s*<\/a>/);
  assert.doesNotMatch(
    hero,
    /01\s*\/\s*Identity|research question|Enter research|Read publications|robot-caption|View selected work|Explore the thesis/i,
  );
});

test("Project server-renders three complete disclosures with destinations", async () => {
  const { projects, hero } = await canonicalData();
  const markup = await renderTypeScriptComponent(componentPath, "PortfolioResearch", {
    projectRoot,
  });

  assert.equal(countMatches(markup, /<details class="research-record">/g), 3);
  assert.equal(countMatches(markup, /<summary>/g), 3);
  assert.equal(countMatches(markup, /<span class="record-toggle">Detail<\/span>/g), 3);
  for (const project of projects) {
    for (const value of [project.title, project.desc, project.focus, project.methods.join(" · ")]) {
      assert.ok(markup.includes(htmlText(value)), `${project.title}: missing rendered ${value}`);
    }
    const destination = project.link || `mailto:${hero.email}`;
    assert.ok(markup.includes(`href="${htmlText(destination)}"`));
  }
});

test("Project uses disclosures and gives every project an actionable destination", async () => {
  const text = await source();
  const project = text.match(
    /export function PortfolioResearch\(\) \{([\s\S]*?)\n\}\n\nexport function PortfolioPublications/,
  )?.[1];

  assert.ok(project);
  assert.match(project, /anchor-target="research"/);
  assert.match(project, /section-name="research"/);
  assert.match(project, /<h2>Project<\/h2>/);
  const { functionText, mapBlocks } = functionSourceAndDirectMapBlocks(
    text,
    "PortfolioResearch",
    "projects",
  );
  assert.equal(mapBlocks.length, 1, "projects must be rendered by one direct map");
  assert.doesNotMatch(functionText, /projects\s*\.\s*(?:filter|slice)\s*\(/);

  const [projectItem] = mapBlocks;
  assert.equal([...projectItem.matchAll(/<details\b/g)].length, 1);
  assert.match(projectItem, /<summary>[\s\S]*role="heading"/);
  assert.match(projectItem, /<span className="record-toggle">Detail<\/span>/);
  assert.doesNotMatch(projectItem, /className="record-detail"/);
  assert.match(projectItem, /project\.desc\.trim\(\)\s*\?/);
  assert.match(projectItem, /project\.focus\.trim\(\)\s*\?/);
  assert.match(projectItem, /project\.methods\.length\s*\?/);
  assert.match(projectItem, /project\.methods\.join\(" · "\)/);
  assert.match(
    projectItem,
    /project\.link\s*\?\s*\([\s\S]*href=\{project\.link\}[\s\S]*target="_blank"[\s\S]*:\s*\([\s\S]*href=\{`mailto:\$\{hero\.email\}`\}/,
  );

  const { projects, hero } = await canonicalData();
  for (const item of projects) {
    const destination = item.link || `mailto:${hero.email}`;
    assert.ok(destination.trim(), `${item.title}: action destination must be non-empty`);
    if (item.link) assert.match(destination, /^https?:\/\//);
    else assert.equal(destination, `mailto:${hero.email}`);
  }
});

test("Publication server-renders every record, abstract, metadata, and publisher link", async () => {
  const { archivePublications } = await canonicalData();
  const markup = await renderTypeScriptComponent(componentPath, "PortfolioPublications", {
    projectRoot,
  });

  assert.equal(countMatches(markup, /<li id="[^"]+">/g), 9);
  assert.equal(countMatches(markup, /<details class="publication-abstract">/g), 7);
  assert.doesNotMatch(markup, /Permalink/i);
  assert.equal(
    countMatches(markup, />Publisher version ↗<\/a>/g),
    archivePublications.filter((article) => article.href).length,
  );

  for (const article of archivePublications) {
    for (const value of [article.title, article.year, article.kind, article.authors, article.venue]) {
      assert.ok(markup.includes(htmlText(value)), `${article.id}: missing rendered ${value}`);
    }
    if (article.status) assert.ok(markup.includes(htmlText(article.status)));
    if (article.href) assert.ok(markup.includes(`href="${htmlText(article.href)}"`));
  }

  assert.ok(markup.includes("Ma Ming and Yi Kang"));
});

test("Publication maps all nine records with conditional external actions and no permalinks", async () => {
  const text = await source();
  const publication = text.match(
    /export function PortfolioPublications\(\) \{([\s\S]*?)\n\}\s*$/,
  )?.[1];

  assert.ok(publication);
  assert.match(text, /import \{ archivePublications \} from "@\/lib\/publications"/);
  assert.match(publication, /anchor-target="publications"/);
  assert.match(publication, /section-name="publications"/);
  assert.match(publication, /<h2>Publication<\/h2>/);
  const { functionText, mapBlocks } = functionSourceAndDirectMapBlocks(
    text,
    "PortfolioPublications",
    "archivePublications",
  );
  assert.equal(
    mapBlocks.length,
    1,
    "archivePublications must be rendered by one direct map",
  );
  assert.equal(
    [...functionText.matchAll(/archivePublications\s*\.\s*map\s*\(/g)].length,
    1,
    "archivePublications must not have a duplicate second map",
  );
  assert.doesNotMatch(
    functionText,
    /archivePublications\s*\.\s*(?:filter|slice)\s*\(/,
  );

  const [articleItem] = mapBlocks;
  assert.equal([...articleItem.matchAll(/<li\b/g)].length, 1);
  for (const field of ["title", "year", "kind", "authors", "venue"]) {
    assert.match(articleItem, new RegExp(`article\\.${field}\\b`));
  }
  assert.match(articleItem, /article\.status\s*\?/);
  assert.match(articleItem, /article\.abstract\?\.trim\(\)\s*\?/);
  assert.match(articleItem, /<details className="publication-abstract" onToggle=\{refreshPortfolioLayout\}>/);
  assert.match(articleItem, /article\.href\s*\?\s*<a href=\{article\.href\} target="_blank" rel="noreferrer">Publisher version ↗<\/a>\s*:\s*null/);
  assert.doesNotMatch(articleItem, /Permalink|\/publications#/i);

  const { archivePublications } = await canonicalData();
  assert.equal(new Set(archivePublications.map((article) => article.id)).size, 9);

  for (const article of archivePublications) {
    if (article.href) assert.ok(article.href.trim(), `${article.id}: external href must be non-empty`);
  }
});

test("portfolio visual overrides keep particles visible and content aligned", async () => {
  const css = await source(cssPath);

  assert.match(css, /\.hero-biography\s*\{[^}]*color:\s*#fff/s);
  assert.match(
    css,
    /\.research-act\s*\{[^}]*background:\s*linear-gradient\(\s*90deg,[^}]*36%[^}]*43%/s,
  );
  assert.match(
    css,
    /\.publications-act\s*\{[^}]*background:\s*linear-gradient\(\s*90deg,[^}]*36%[^}]*43%/s,
  );
  assert.match(
    css,
    /\.research-act::before,\s*\.publications-act::before\s*\{[^}]*rgb\(6 8 12 \/ 24%\)/s,
  );
  assert.match(
    css,
    /@media \(min-width:\s*768px\)[\s\S]*\.research-act \.act-heading\s*\{[^}]*position:\s*relative;[^}]*top:\s*clamp\(\.5rem, \.7vw, \.85rem\);[^}]*left:\s*clamp\(\.75rem, 1vw, 1\.25rem\);[^}]*width:\s*60%;/s,
  );
  assert.match(
    css,
    /@media \(min-width:\s*768px\)[\s\S]*\.publications-act \.act-heading\s*\{[^}]*position:\s*relative;[^}]*top:\s*clamp\(\.5rem, \.7vw, \.85rem\);[^}]*left:\s*clamp\(\.75rem, 1vw, 1\.25rem\);[^}]*width:\s*60%;/s,
  );
  assert.match(
    css,
    /\.research-list\s*\{[^}]*width:\s*60%;/s,
  );
  assert.match(
    css,
    /\.publication-ledger\s*\{[^}]*width:\s*60%;/s,
  );
  assert.match(
    css,
    /\.publication-ledger h3\s*\{[^}]*max-width:\s*none;[^}]*width:\s*100%;/s,
  );
  assert.match(css, /--act-title-size:\s*clamp\(1\.9rem, 2\.35vw, 2\.75rem\);/);
  assert.match(css, /\.record-title\s*\{[^}]*font-size:\s*clamp\(1\.35rem, 1\.9vw, 2\.1rem\);/s);
  assert.match(
    css,
    /@media \(min-width:\s*768px\)[\s\S]*\.research-act,\s*\.publications-act\s*\{[^}]*padding-top:\s*clamp\(5\.5rem, 7\.5vw, 8rem\);/s,
  );
  assert.match(
    css,
    /\.footer\s*\{[^}]*display:\s*grid;[^}]*grid-template-rows:\s*minmax\(0, 1fr\) auto;/s,
  );
  assert.match(
    css,
    /\.footer__head\s*\{[^}]*width:\s*min\(46rem, calc\(100% - 2rem\)\);[^}]*align-self:\s*center;[^}]*justify-self:\s*center;/s,
  );
  assert.match(
    css,
    /\.footer__head h2\s*\{[^}]*width:\s*100%;[^}]*text-align:\s*center;/s,
  );
  assert.match(
    css,
    /\.footer__head h2 > div\s*\{[^}]*display:\s*inline-block\s*!important;[^}]*width:\s*auto;[^}]*text-align:\s*inherit;/s,
  );
  assert.match(
    css,
    /\.footer__head h2 > div > div\s*\{[^}]*width:\s*auto;[^}]*text-align:\s*inherit;/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*767px\)[\s\S]*\.portfolio-act\s*\{[^}]*min-height:\s*auto;/s,
  );
});
