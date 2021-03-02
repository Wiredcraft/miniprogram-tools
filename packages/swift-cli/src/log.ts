import Debug from "debug";

const noop = () => {};
export const logger: Logger = { err: noop, info: noop, debug: noop };

type LogFn = (...arg: any) => void;
export interface Logger {
  err: LogFn;
  info: LogFn;
  debug: LogFn;
}

// https://en.wikipedia.org/wiki/Syslog
// Severity level keyword
const logLevels = ["debug", "info", "err"] as const;
export function setLogLevel(levelString: keyof Logger) {
  let found = false;
  const debugStrArr = [];
  for (let i = 0; i < logLevels.length; i++) {
    const l = logLevels[i];
    if (l === levelString) found = true;
    if (found) {
      const s = `build:${l}`;
      debugStrArr.push(s);
      logger[l] = (Debug(s) as unknown) as LogFn;
    }
  }
  const joined = debugStrArr.join(",");
  Debug.enable(joined);
}
