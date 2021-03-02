import { spawn } from "child_process";
import { sync as whichSync } from "which";

const tscPath = whichSync("tsc");

export function typeCheck(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(tscPath, ["--noEmit"], { stdio: "inherit" });
    proc.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error("TypeScript build failed"));
      }
      resolve();
    });
  });
}

export function typeCheckWatch() {
  spawn(tscPath, ["--noEmit", "--watch", "--preserveWatchOutput"], {
    stdio: "inherit",
  });
}
