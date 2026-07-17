import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import vm from "node:vm";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx"];

function existingModulePath(candidate) {
  const candidates = extname(candidate)
    ? [candidate]
    : [
        ...sourceExtensions.map((extension) => `${candidate}${extension}`),
        ...sourceExtensions.map((extension) => join(candidate, `index${extension}`)),
      ];

  return candidates.find((path) => {
    try {
      return statSync(path).isFile();
    } catch {
      return false;
    }
  });
}

function nextComponentMocks() {
  function Image(props) {
    const imageProps = { ...props };
    delete imageProps.priority;
    return React.createElement("img", imageProps);
  }

  function Link({ href, children, ...props }) {
    return React.createElement("a", { href, ...props }, children);
  }

  return {
    "next/image": { __esModule: true, default: Image },
    "next/link": { __esModule: true, default: Link },
  };
}

export async function renderTypeScriptComponent(
  entryPath,
  exportName,
  { projectRoot },
) {
  const cache = new Map();
  const mocks = nextComponentMocks();

  function loadModule(modulePath) {
    const filename = existingModulePath(modulePath);
    if (!filename) throw new Error(`Cannot resolve TypeScript module ${modulePath}`);
    if (cache.has(filename)) return cache.get(filename).exports;

    const evaluatedModule = { exports: {} };
    cache.set(filename, evaluatedModule);
    const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: filename,
    }).outputText;

    function localRequire(specifier) {
      if (specifier in mocks) return mocks[specifier];
      if (specifier.startsWith("@/")) {
        return loadModule(resolve(projectRoot, "src", specifier.slice(2)));
      }
      if (specifier.startsWith(".")) {
        return loadModule(resolve(dirname(filename), specifier));
      }
      return nodeRequire(specifier);
    }

    const wrapper = vm.runInThisContext(
      `(function (exports, require, module, __filename, __dirname) { ${compiled}\n})`,
      { filename },
    );
    wrapper(
      evaluatedModule.exports,
      localRequire,
      evaluatedModule,
      filename,
      dirname(filename),
    );
    return evaluatedModule.exports;
  }

  const component = loadModule(entryPath)[exportName];
  if (typeof component !== "function") {
    throw new Error(`${exportName} is not a component exported by ${entryPath}`);
  }
  return renderToStaticMarkup(React.createElement(component));
}
