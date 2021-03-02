// this file is not used currently (not imported into the index.ts)
// but this file is probably needed if we found that the "behavior" way has compatibility issues

import { dset } from "dset";

export { dset };

type Atom = any;

declare var Page: any;

const isFn = (func: unknown) => typeof func === "function";

export function withAtom(ctor: any, config: any, atoms: Record<string, Atom>) {
  // update props in data
  const data = config.data || {};

  for (let key in atoms) {
    // miniprogram setData uses "a.b[1].c"
    // dset uses "a.b.1.c"
    dset(data, key.replace(/\[/g, ".").replace(/\]/g, ""), atoms[key].read());
  }

  const enhanced = {};

  let onLoad = "attached";
  let onUnload = "detached";
  if (ctor === Page) {
    onLoad = "onLoad";
    onUnload = "onUnload";
  }

  const unsubs = [];

  enhanced[onLoad] = function (...args: any[]) {
    for (let key in atoms) {
      unsubs.push(atoms[key].subscribe(this, key));
    }
    if (isFn(config[onLoad])) config[onLoad].apply(this, args);
  };

  enhanced[onUnload] = function () {
    for (let i = 0; i < unsubs.length; i++) {
      unsubs[i]();
    }
    if (isFn(config[onUnload])) config[onUnload].call(this);
  };

  return ctor({ ...config, ...enhanced });
}
