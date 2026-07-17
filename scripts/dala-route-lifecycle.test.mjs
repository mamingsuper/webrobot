import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

const projectRoot = resolve(import.meta.dirname, "..");

async function source(relativePath) {
  return readFile(join(projectRoot, relativePath), "utf8");
}

test("Dala homepage and publication archive use document navigation across the runtime boundary", async () => {
  const homepageSections = await source(
    "src/components/dala-portfolio/PortfolioSections.tsx",
  );
  const homepageShowcase = await source(
    "src/components/dala-portfolio/PortfolioShowcase.tsx",
  );
  const publicationPage = await source("src/app/publications/page.tsx");

  for (const [label, text] of [
    ["homepage sections", homepageSections],
    ["homepage showcase", homepageShowcase],
    ["publication page", publicationPage],
  ]) {
    assert.doesNotMatch(
      text,
      /import\s+Link\s+from\s+["']next\/link["']/,
      `${label} must not use Next Link across the document-lifetime Dala runtime boundary`,
    );
  }

  assert.doesNotMatch(homepageSections, /Permalink|\/publications#/i);
  assert.match(homepageShowcase, /<a href="\/publications">View chronological archive ↗<\/a>/);
  assert.match(
    homepageShowcase,
    /<a href=\{`\/publications#\$\{article\.id\}`\}>[\s\S]*?<\/a>/,
  );
  assert.match(
    homepageShowcase,
    /<a className="publication-preview-all" href="\/publications">/,
  );
  assert.match(publicationPage, /<a href="\/">Ming Ma<\/a>/);
  assert.match(publicationPage, /<a href="\/#research">Research<\/a>/);
  assert.match(
    publicationPage,
    /<a href="\/">← Return to the research portfolio<\/a>/,
  );
});
