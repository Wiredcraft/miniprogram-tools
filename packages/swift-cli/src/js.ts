import { relative } from "path";
import { promises } from "fs";
import { MinifyOutput } from "terser";

import { writeFileSafely } from "./utils";
import * as config from "./config";
import * as minifier from "./minify";

const { readFile } = promises;

export async function processJS(inputPath: string, outputPath: string) {
  const inputPathRel = relative(config.get("pwdAbs"), inputPath);

  const babel = await import("@babel/core");

  const content = await readFile(inputPath, "utf8");
  // const hash = String(Math.random()).slice(2, 8);
  const ret = await babel.transformAsync(content, {
    // sourceFileName: basename(inputPath) + "?" + hash,
    sourceFileName: "webpack:///./" + inputPathRel,
    filename: inputPath,
    sourceMaps: true,
  });

  if (!ret || !ret.code) {
    // many times it's because this is a new file
    return;
  }

  // to debug source map
  // use https://evanw.github.io/source-map-visualization/

  let code = ret.code;
  let map: MinifyOutput["map"];

  if (ret.map) {
    map = ret.map;
  }

  if (!config.get("isDev")) {
    const minifierOptions = ret.map ? { sourceMap: { content: ret.map } } : {};
    const minifyRet = await minifier.transform(ret.code, minifierOptions);
    if (!minifyRet.code) {
      throw new Error(`${inputPath} terser transform result is empty`);
    }
    code = minifyRet.code;
    if (minifyRet.map) {
      map = minifyRet.map;
    }
  }

  const tasks = [writeFileSafely(outputPath, code)];

  if (map) {
    // map.sourceRoot = "";
    const cnt = typeof map === "string" ? map : JSON.stringify(map);
    tasks.push(writeFileSafely(outputPath + ".map", cnt));
  }

  await Promise.all(tasks);
}
