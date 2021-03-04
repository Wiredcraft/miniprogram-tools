import less from "less";
import { relative } from "path";
import { promises } from "fs";
import postcss, { ProcessOptions, Plugin } from "postcss";
import postcssrc from "postcss-load-config";

import { writeFileSafely } from "./utils";
import * as config from "./config";

const { readFile } = promises;

interface PostCSSConfigResult {
  options: ProcessOptions;
  plugins: Plugin[];
}

let postcssConfig: PostCSSConfigResult;

async function resolvePostcssConfig() {
  if (postcssConfig) return postcssConfig;
  return postcssrc();
}

async function postcssProcess(
  input: string,
  inputPath: string,
  outputPath: string
) {
  const inputPathRel = relative(config.get("pwdAbs"), inputPath);
  const postcssConfig = await resolvePostcssConfig();
  const ret1 = await postcss(postcssConfig.plugins).process(input, {
    ...postcssConfig.options,
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
