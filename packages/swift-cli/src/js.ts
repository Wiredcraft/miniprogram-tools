import { relative } from "path";
import { promises } from "fs";

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
    // many times it's became this is a new file
    return;
  }

  let code = ret.code;

  if (!config.get("isDev")) {
    const minifyRet = await minifier.transform(ret.code);
    if (!minifyRet.code) {
      throw new Error(`${inputPath} terser transform result is empty`);
    }
    code = minifyRet.code;
  }

  const tasks = [writeFileSafely(outputPath, code)];

  let map = ret.map;
  if (map) {
    map.sourceRoot = "";
    tasks.push(writeFileSafely(outputPath + ".map", JSON.stringify(map)));
  }

  await Promise.all(tasks);
}
