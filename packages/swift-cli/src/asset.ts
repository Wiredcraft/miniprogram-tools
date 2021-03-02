import cpFile from "cp-file";

export async function processAsset(inputPath: string, outputPath: string) {
  await cpFile(inputPath, outputPath);
}
