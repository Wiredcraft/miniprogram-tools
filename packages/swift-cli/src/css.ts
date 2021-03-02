import less from "less";
import { relative, resolve } from "path";
import { promises } from "fs";
import postcss, { AcceptedPlugin } from "postcss";

import { writeFileSafely } from "./utils";
import * as config from "./config";

const { readFile } = promises;

let postcssPlugins: AcceptedPlugin[];
async function loadPostcssConfig() {
  if (postcssPlugins) return postcssPlugins;

  const f = resolve(config.get("pwdAbs"), "postcss.config.js");
  try {
    postcssPlugins = require(f).plugins;
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
      postcssPlugins = [];
    }
    throw e;
  }
  return postcssPlugins;
}

async function postcssProcess(
  input: string,
  inputPath: string,
  outputPath: string
) {
  const inputPathRel = relative(config.get("pwdAbs"), inputPath);
  const plugins = await loadPostcssConfig();
  const ret1 = await postcss(plugins).process(input, {
    from: inputPathRel,
    to: relative(config.get("dstDirAbs"), outputPath),
  });
  return ret1;
}

export async function processCSS(inputPath: string, outputPath: string) {
  const input = await readFile(inputPath, "utf8");

  const ret1 = await postcssProcess(input, inputPath, outputPath);

  await writeFileSafely(outputPath, ret1.css);
}

export async function processLess(inputPath: string, outputPath: string) {
  const input = await readFile(inputPath, "utf8");

  const ret = await less.render(input, { paths: [config.get("srcDirAbs")] });
  const ret1 = await postcssProcess(ret.css, inputPath, outputPath);

  await writeFileSafely(outputPath, ret1.css);
}
