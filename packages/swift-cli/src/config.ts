import path from "path";
import dotenv from "dotenv";

export const envResult = dotenv.config();

const { NODE_ENV } = process.env;

if (!NODE_ENV) {
  console.warn("NODE_ENV not defined");
}

const config = {
  isDev: NODE_ENV === "development",

  srcDir: "src",
  dstDir: "dist",
  srcDirAbs: path.resolve("src"),
  dstDirAbs: path.resolve("dist"),

  pwdAbs: path.resolve("."),
};

export type Config = {
  isDev: boolean;
  srcDir: string;
  srcDirAbs: string;
  dstDir: string;
  dstDirAbs: string;
  pwdAbs: string;
};

export function get(): Config;
export function get<K extends keyof Config>(key: K): Config[K];

export function get(key?: keyof Config) {
  if (key) return config[key];
  return config;
}

export function setDstDir(d: string) {
  const pwd = config.pwdAbs;

  const dstDirAbs = path.resolve(d);
  const dstDirRel = path.relative(pwd, dstDirAbs);

  config.dstDir = dstDirRel;
  config.dstDirAbs = dstDirAbs;
}
