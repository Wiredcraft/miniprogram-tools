function removeItem(arr: any[], idx: number) {
  arr.splice(idx, 1);
  // arr[idx] = arr[arr.length - 1];
  // arr.length = arr.length - 1;
}

type Instance = any;
type Atom<Value> = {
  read: () => Value;
  calc: () => void;
  subscribe: (inst: Instance | Atom<unknown>, key?: string) => void;
  write: (x: Value) => void;
};
type AnyAtom = Atom<unknown>;
type AtomAffected = { instances: Instance[]; keys: string[]; atoms: AnyAtom[] };
type Getter<T> = (a: Atom<T>) => T;

const affectedByAtom = new Map<AnyAtom, AtomAffected>();
const pendingByInstance = new Map<Instance, any>();

type FnDef<Value> = (get: Getter<Value>) => Value;

function isFnDef<Value>(def: Value | FnDef<Value>): def is FnDef<Value> {
  return typeof def === "function";
}

export function atom<Value>(fn: FnDef<Value>): Atom<Value>;
export function atom<Value>(fn: Value): Atom<Value>;
export function atom<Value>(def: Value | FnDef<Value>): Atom<Value> {
  function get(a: Atom<Value>): Value {
    // atom a: a
    // atom b: config
    // "a" change will trigger "b" change
    a.subscribe(config);
    return a.read();
  }

  let value: Value;
  const config = {} as Atom<Value>;

  if (isFnDef(def)) {
    config.calc = () => {
      value = def(get);
    };
  } else {
    config.calc = () => {
      value = def;
    };
  }

  config.calc();
  config.read = () => value;

  config.subscribe = function (inst: Instance | AnyAtom, key?: string) {
    let affected = affectedByAtom.get(config as Atom<unknown>);

    if (!affected) {
      affected = { instances: [], keys: [], atoms: [] };
      // config is *the* atom, current atom
      affectedByAtom.set(config as Atom<unknown>, affected);
    }

    if (key) {
      const idx = affected.instances.indexOf(inst);
      if (idx < 0) {
        affected.instances.push(inst);
        affected.keys.push(key);
      }
    } else {
      const idx = affected.atoms.indexOf(inst);
      if (idx < 0) {
        affected.atoms.push(inst);
      }
    }

    return function unsubscribe() {
      const x = affectedByAtom.get(config as Atom<unknown>);
      if (!x) return;
      const idx = x.instances.indexOf(inst);
      removeItem(x.instances, idx);
      removeItem(x.keys, idx);
    };
  };

  config.write = function (x: Value) {
    value = x;
  };

  return config;
}

export function write<Value>(atom: Atom<Value>, v: Value) {
  atom.write(v);

  const affected =
    affectedByAtom.get(atom as Atom<unknown>) || ({} as AtomAffected);
  const instances = affected.instances || [];
  const keys = affected.keys || [];

  for (let i = 0; i < instances.length; i++) {
    const inst = instances[i];

    let pending = pendingByInstance.get(inst);

    if (!pending) {
      pending = {};
      // its import to set the pending back to map
      pendingByInstance.set(inst, pending);

      wx.nextTick(() => {
        if (pending === null) return;
        const x = pending;
        pending = null;
        pendingByInstance.set(inst, pending);
        console.log(inst.is, "setData", x);
        inst.setData(x);
      });
    }
    // merging changed properties
    pending[keys[i]] = v;
  }

  // affected atoms
  const atoms = affected.atoms || [];
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[0];
    a.calc();
    write(a, a.read());
  }
}
