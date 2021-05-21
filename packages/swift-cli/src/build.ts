import globby from "globby";
import del from "del";
import { resolve, relative } from "path";
import { promises } from "fs";
import CheapWatch from "cheap-watch";

import { processPug } from "./pug";
import { processCSS, processLess } from "./css";
import { processAsset } from "./asset";
import { processJS } from "./js";
import { typeCheck, typeCheckWatch } from "./ts";
import { bundle as processVendor } from "./vendor";
import { Logger, setLogLevel, logger } from "./log";
import { printFacts } from "./facts";
import { anyMatch } from "./utils";
import * as config from "./config";

const { stat } = promises;

type BuildOptions = {
  level: keyof Logger;
  watch: boolean;
  "output-dir": string;
  "type-check": boolean;
};

export async function buildCmd(opts: BuildOptions) {
  config.setDstDir(opts["output-dir"]);

  try {
    setLogLevel(opts.level);
    const buildMeta = await build(config, opts);
    printFacts(config, process.env);
    if (opts.watch) {
      initWatcher(config);
      if (buildMeta.hasTsFile && opts["type-check"] === true) {
        typeCheckWatch();
      }
    }
  } catch (e) {
    console.log(e);
  }
}

async function initWatcher(conf: typeof config) {
  const { srcDir, dstDir, srcDirAbs, dstDirAbs } = conf.get();
  const dir = resolve(srcDir);
  const watch = new CheapWatch({ dir });
  await watch.init();
  logger.info("watching %s", srcDir);

  // path is a relative file path and does not contain srcDir
  watch.on("+", async ({ path, stats, isNew }) => {
    if (stats.isDirectory()) return;
    if (isNew) {
      logger.debug("new file %s", path);
    } else {
      logger.debug("change %s", path);
    }
    const absFilePath = resolve(dir, path);
    await processFile(absFilePath, conf);
  });
  watch.on("-", async ({ path /* , stats */ }) => {
    const absFilePath = resolve(dir, path);
    const destfile = resolveDest(absFilePath, srcDirAbs, dstDirAbs);
    await del(destfile);
    logger.info("remove %s/%s", dstDir, path);
  });
}

type BuildMeta = { hasTsFile: boolean };

async function build(
  conf: { get: typeof config.get },
  opts: BuildOptions
): Promise<BuildMeta> {
  const { srcDir, dstDir, srcDirAbs, dstDirAbs, pwdAbs } = conf.get();

  const t0 = new Date();
  const globs = [
    // everything
    srcDir + "/**/*",
    // except md files
    "!" + srcDir + "/**/*.md",
    "!" + srcDir + "/**/__tests__/**/*",
    "!" + srcDir + "/**/__test__/**/*",
    "!" + srcDir + "/_less/**/*.less",
  ];

  // files will have relative path and contains srcDir
  // e.g. "src/app.js"
  const files = await globby(globs);
  const absFiles = files.map((x) => resolve(x));

  const hasTsFile = anyMatch(absFiles, (x) => /\.ts$/.test(x));

  const works = [processFiles(absFiles, config)];
  if (hasTsFile && opts["type-check"] === true) {
    works.push(typeCheck());
  }

  await Promise.all(works);

  // build done
  const elapsed = Number.prototype.toFixed.call(
    (new Date().valueOf() - t0.valueOf()) / 1000,
    2
  );
  logger.info("build done in %ss", elapsed);

  // post build cleanup
  const filesShouldBeInDest = absFiles.map((f) =>
    resolveDest(f, srcDirAbs, dstDirAbs)
  );

  const filesAlreadyDest = await getFilesInDest(dstDir, ["!**/*.js.map"]);
  const toBeRemoved = getFilesToBeRemoved(
    filesAlreadyDest,
    filesShouldBeInDest
  );
  toBeRemoved.map(async (x) => {
    await del(x);
    logger.info("remove redundant file: %s", relative(pwdAbs, x));
  });
  return { hasTsFile };
}

async function processFiles(
  files: string[],
  conf: typeof config
): Promise<void> {
  const works = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    works.push(processFile(f, conf));
  }
  await Promise.all(works);
}

const rules = [
  { test: /__tests__/ },
  { test: /\.d\.ts/ },
  { test: /\.pug/, checkFreshness: true, use: processPug },
  { test: /\.css$/, checkFreshness: true, use: processCSS },
  { test: /\.less$/, checkFreshness: true, use: processLess },
  { test: /\/vendor\/\S*?\.(j|t)s$/, checkFreshness: true, use: processVendor },
  { test: /\.(j|t)s$/, checkFreshness: true, use: processJS },
  { test: /.*/, checkFreshness: true, use: processAsset },
];

async function processFile(f: string, conf: typeof config) {
  const { srcDirAbs, dstDirAbs, pwdAbs } = conf.get();
  const outputPath = resolveDest(f, srcDirAbs, dstDirAbs);

  for (const r of rules) {
    if (r.test.test(f)) {
      if (!r.use) return;

      if (r.checkFreshness) {
        const x = await isNewer(f, outputPath);
        if (!x) return;
      }

      logger.info("processing %s", relative(pwdAbs, f));
      try {
        return await r.use(f, outputPath);
      } catch (e) {
        logger.err("processing %s failed", relative(pwdAbs, f));
        logger.err("%o", e);
        console.log(e);
      }
    }
  }
}

function resolveDest(
  inputAbsFilePath: string,
  srcDirAbs: string,
  dstDirAbs: string
) {
  let ret = inputAbsFilePath.replace(srcDirAbs, dstDirAbs);
  switch (true) {
    case /\.css$/.test(ret):
      return ret.replace(/\.css$/, ".wxss");
    case /\.less$/.test(ret):
      return ret.replace(/\.less$/, ".wxss");
    case /\.ts/.test(ret):
      return ret.replace(/\.ts$/, ".js");
    case /\.pug/.test(ret):
      return ret.replace(/\.pug/, ".wxml");
    default:
      return ret;
  }
}

async function isNewer(
  src: string,
  dest: string,
  options: { alwaysTreatAsNewer: RegExp[] } = { alwaysTreatAsNewer: [] }
) {
  const { alwaysTreatAsNewer } = options;
  if (alwaysTreatAsNewer) {
    for (let i = 0; i < alwaysTreatAsNewer.length; i++) {
      const re = alwaysTreatAsNewer[i];
      if (re.test(src)) return true;
    }
  }

  try {
    const [a, b] = await Promise.all([stat(src), stat(dest)]);
    return a.mtime > b.mtime;
  } catch (err) {
    return true;
  }
}

async function getFilesInDest(destDir: string, ignoreList: string[] = []) {
  const files = await globby([`${destDir}/**/*`, ...ignoreList]);
  return files.map((x) => resolve(x));
}

function getFilesToBeRemoved(dFiles: string[], rFiles: string[]) {
  const d = dFiles.map((x) => resolve(x));
  const r = rFiles.map((x) => resolve(x));
  const o = [];

  for (let i = 0; i < d.length; i++) {
    const x = d[i];
    if (r.indexOf(x) < 0) o.push(x);
  }
  return o;
}
