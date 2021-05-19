import assert from "assert";

import rollup = require("rollup");
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import babel from "@rollup/plugin-babel";

import * as config from "./config";
import * as minifier from "./minify";
import { writeFileSafely } from "./utils";

const inputOptionsDefault = {
  treeshake: true,
  plugins: [
    resolve(),
    commonjs(),
    replace({ __DEV__: "false", "process.env.NODE_ENV": "'production'" }),
    // https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
    babel({ babelHelpers: "bundled", extensions: [".js", ".mjs", ".ts"] }),
  ],
};

const outputOptionsDefault = {
  format: "cjs",
  compact: true,
  interop: "auto",
  freeze: false,
  // https://rollupjs.org/guide/en/#outputexports
  exports: "auto",

  // intro: "var setImmediate = null;",
} as const;

/**
 * bundle script
 *
 * @param {string} i - input file path
 * @param {string} o - output file path
 */
export async function bundle(i: string, o: string) {
  const inputOptions = { ...inputOptionsDefault, input: i };
  const outputOptions = { ...outputOptionsDefault, file: o };

  const bundler = await rollup.rollup(inputOptions);
  // bundle it
  const bundled = await bundler.generate(outputOptions);

  assert(bundled.output.length === 1, "we should have only 1 chunk");

  let code = bundled.output[0].code;
  if (!config.get("isDev")) {
    const res = await minifier.transform(code);
    code = res.code as string;
  }
  return await writeFileSafely(o, code);
}
