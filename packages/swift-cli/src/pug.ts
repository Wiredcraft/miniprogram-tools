import { promises } from "fs";
import { writeFileSafely } from "./utils";
import * as config from "./config";
import pug from "pug";

const { readFile } = promises;

export async function processPug(inputPath: string, outputPath: string) {
  const input = await readFile(inputPath, "utf8");
  const ret = pug.render(input, {
    filename: inputPath,
    pretty: config.get("isDev"),
  });
  await writeFileSafely(outputPath, ret);
}
