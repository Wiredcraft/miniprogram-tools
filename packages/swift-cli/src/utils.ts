import path from "path";
import mkdirp from "mkdirp";
import { promises } from "fs";

const { writeFile } = promises;
const dirCreatedMap = new Map();

export async function writeFileSafely(filename: string, content: string) {
  const { dir } = path.parse(filename);
  if (!dirCreatedMap.has(dir)) {
    await mkdirp(dir);
    dirCreatedMap.set(dir, true);
  }
  await writeFile(filename, content, "utf8");
}

export function anyMatch<T>(arr: T[], predicate: (x: T) => boolean): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) return true;
  }
  return false;
}
