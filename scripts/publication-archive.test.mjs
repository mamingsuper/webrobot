import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const projectRoot = resolve(import.meta.dirname, "..");
const archivePath = join(
  projectRoot,
  "src/components/publications/PublicationArchive.tsx",
);
const contentPath = join(projectRoot, "src/data/content.ts");
const publicationsPath = join(projectRoot, "src/lib/publications.ts");

async function readArchive() {
  return readFile(archivePath, "utf8");
}

async function importTypeScript(source, fileName) {
  const output = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

async function loadArchivePublications() {
  const contentSource = await readFile(contentPath, "utf8");
  const contentModuleUrl = `data:text/javascript;base64,${Buffer.from(
    ts.transpileModule(contentSource, {
      fileName: contentPath,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  ).toString("base64")}`;
  const publicationsSource = (
    await readFile(publicationsPath, "utf8")
  ).replace('from "@/data/content"', `from "${contentModuleUrl}"`);

  return (await importTypeScript(publicationsSource, publicationsPath))
    .archivePublications;
}

function findJsxAttribute(sourceFile, attributeName) {
  let found = false;
  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(sourceFile) === attributeName
    ) {
      found = true;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

function exportedFunctionExpression(sourceFile, functionName) {
  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === functionName &&
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      return statement;
    }
  }
  return undefined;
}

test("archive data contains nine records and seven usable abstracts", async () => {
  const records = await loadArchivePublications();

  assert.equal(records.length, 9);
  assert.equal(
    records.filter((record) => record.abstract?.trim()).length,
    7,
  );
});

test("abstract disclosure predicate rejects missing and whitespace-only values", async () => {
  const source = await readArchive();
  const sourceFile = ts.createSourceFile(
    archivePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = exportedFunctionExpression(
    sourceFile,
    "publicationAbstract",
  );

  assert.ok(declaration, "PublicationArchive must export publicationAbstract");
  const predicateModule = await importTypeScript(
    declaration.getText(sourceFile),
    archivePath,
  );

  assert.equal(predicateModule.publicationAbstract(undefined), undefined);
  assert.equal(predicateModule.publicationAbstract("   \n\t"), undefined);
  assert.equal(predicateModule.publicationAbstract("  Useful abstract.  "), "Useful abstract.");

  const records = await loadArchivePublications();
  assert.equal(
    records.filter((record) => predicateModule.publicationAbstract(record.abstract)).length,
    7,
  );
});

test("result updates use a short status instead of making the list live", async () => {
  const source = await readArchive();
  const sourceFile = ts.createSourceFile(
    archivePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  assert.equal(findJsxAttribute(sourceFile, "aria-live"), false);
  assert.match(source, /role="status"[^>]*>\s*Showing \{visible\.length\} publications/);
});

test("archive keeps record anchors without rendering explicit permalink actions", async () => {
  const source = await readArchive();
  const records = await loadArchivePublications();

  assert.doesNotMatch(source, /Permalink\s*#/i);
  assert.match(source, /<li id=\{item\.id\} key=\{item\.id\}/);
  assert.match(source, /<h3><a href=\{`#\$\{item\.id\}`\}>\{item\.title\}<\/a><\/h3>/);
  assert.equal(records.length, 9);
  assert.equal(new Set(records.map((record) => record.id)).size, 9);
});

test("archive abstract styles are compact, readable, focus-visible, and mobile-safe", async () => {
  const css = await readFile(
    join(projectRoot, "src/app/publications/publications.css"),
    "utf8",
  );

  assert.ok(css.split("\n").length > 100, "CSS should use readable multi-line formatting");
  assert.match(css, /\.archive-abstract\s*\{[^}]*border-top:\s*1px solid/s);
  assert.match(css, /\.archive-abstract summary\s*\{[^}]*cursor:\s*pointer/s);
  assert.match(css, /\.archive-abstract summary:focus-visible\s*\{[^}]*outline:/s);
  assert.match(css, /\.archive-abstract p\s*\{[^}]*line-height:/s);
  assert.match(css, /@media\s*\(max-width:\s*700px\)[\s\S]*\.archive-abstract\s*\{[^}]*max-width:\s*100%/s);
  assert.doesNotMatch(css, /\.archive-abstract[^}]*(?:\{|;)\s*height\s*:/s);
});
