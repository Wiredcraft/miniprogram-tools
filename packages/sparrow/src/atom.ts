function removeItem(arr: any[], idx: number) {
  arr.splice(idx, 1);
}

type Instance = any;

export type Atom<Value> = {
  read: () => Value;
  calc: () => void;
  subscribe: (inst: Instance | Atom<unknown>, key?: string) => void;
  write: (x: Value) => void;
};
type AnyAtom = Atom<unknown>;
type AtomAffected = { instances: Instance[]; keys: string[]; atoms: AnyAtom[] };
type Getter = <T>(a: Atom<T>) => T;

const affectedByAtom = new Map<AnyAtom, AtomAffected>();
const pendingByInstance = new Map<Instance, any>();

type FnDef<Value> = (get: Getter) => Value;
type AtomID = string;

function isFnDef<Value>(def: Value | FnDef<Value>): def is FnDef<Value> {
  return typeof def === "function";
}

export function atom<Value>(fn: FnDef<Value>, id?: AtomID): Atom<Value>;
export function atom<Value>(fn: Value, id?: AtomID): Atom<Value>;
export function atom<Value>(
  def: Value | FnDef<Value>,
  id?: AtomID
): Atom<Value> {
  function get<T>(a: Atom<T>): T {
    // atom a: a
    // atom b: config
    // "a" change will trigger "b" change
    a.subscribe(config);
    return a.read();
  }

  let value: Value;
  const config = {} as Atom<Value>;

  config.read = () => value;
  config.toString = () => "Atom(" + id + ")";

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
      if (idx < 0) return;
      removeItem(x.instances, idx);
      removeItem(x.keys, idx);
    };
  };

  config.write = function (x: Value) {
    value = x;
  };

  return config;
}

let scheduled = false;

export function write<Value>(atom: Atom<Value>, v: Value) {
  atom.write(v);

  const affected =
    affectedByAtom.get(atom as Atom<unknown>) || ({} as AtomAffected);
  const instances = affected.instances || [];
  const keys = affected.keys || [];

  if (scheduled === false) {
    scheduled = true;
    wx.nextTick(() => {
      scheduled = false;
      for (let [inst, pending] of pendingByInstance) {
        if (pending === null) continue;
        pendingByInstance.set(inst, null);
        console.log(inst.is, "setData", pending);
        inst.setData(pending);
      }
    });
  }

  for (let i = 0; i < instances.length; i++) {
    const inst = instances[i];

    let pending = pendingByInstance.get(inst);

    if (!pending) {
      pending = {};
      // its import to set the pending back to map
      pendingByInstance.set(inst, pending);
    }
    // merging changed properties
    pending[keys[i]] = v;
  }

  // affected atoms
  const atoms = affected.atoms || [];
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i];
    a.calc();
    write(a, a.read());
  }
}
