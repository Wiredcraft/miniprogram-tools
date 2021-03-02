"use strict";

const { dirname, relative, resolve } = require("path");
const { addDefault, isModule } = require("@babel/helper-module-imports");

const defaultRegeneratorRuntimeFilename = "./vendor/regenerator-runtime";

function getRelFilePathToRegeneratorRuntime(
  filename,
  regeneratorRuntimeFilename
) {
  const a = dirname(filename);
  const b = resolve(regeneratorRuntimeFilename);
  let relpath = relative(a, b);
  if (relpath[0] !== ".") relpath = "./" + relpath;
  return relpath;
}

function transform({ types: t }, { regeneratorRuntimeFilename }) {
  return {
    name: "import-regenerator",
    pre(file) {
      const cache = new Map();

      this.addDefaultImport = (source, nameHint, blockHoist) => {
        // If something on the page adds a helper when the file is an ES6
        // file, we can't reused the cached helper name after things have been
        // transformed because it has almost certainly been renamed.
        const cacheKey = isModule(file.path);
        const key = `${source}:${nameHint}:${cacheKey || ""}`;
        let cached = cache.get(key);
        if (cached) {
          cached = t.cloneNode(cached);
        } else {
          cached = addDefault(file.path, source, {
            importedInterop: "uncompiled",
            nameHint,
            blockHoist,
          });

          cache.set(key, cached);
        }
        return cached;
      };
    },
    visitor: {
      ReferencedIdentifier(path) {
        const { node } = path;
        const { name } = node;

        if (name === "regeneratorRuntime") {
          const relpath = getRelFilePathToRegeneratorRuntime(
            this.file.opts.filename,
            regeneratorRuntimeFilename || defaultRegeneratorRuntimeFilename
          );
          path.replaceWith(
            this.addDefaultImport(relpath, "regeneratorRuntime")
          );
          return;
        }
      },
    },
  };
}

module.exports = transform;
