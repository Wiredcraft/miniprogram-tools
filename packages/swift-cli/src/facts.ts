import * as colors from "kleur/colors";
import * as config from "./config";

export function printFacts(
  conf: { get: typeof config.get },
  env: Record<string, string | undefined>
) {
  prettyPrintKv({
    srcDir: conf.get("srcDir"),
    dstDir: conf.get("dstDir"),
    NODE_ENV: env.NODE_ENV,
    ...config.envResult.parsed,
  });
}

function prettyPrintKv(o: Record<string, any>) {
  const keys = Object.keys(o);
  keys.sort();

  let l = 0;
  for (let i = 0; i < keys.length; i++) {
    l = Math.max(keys[i].length, l);
  }

  const w = l + 4;

  const lines: string[] = [""];

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    lines.push(
      spaces(w - k.length) + colors.gray(k) + "  " + colors.cyan(o[k])
    );
  }

  lines.push("");

  // eslint-disable-next-line no-console
  console.log(lines.join("\n"));
}

function spaces(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += " ";
  }
  return s;
}
