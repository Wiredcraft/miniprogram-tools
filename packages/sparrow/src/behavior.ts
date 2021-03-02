import { dset } from "dset";

const SparrowAttach = "__SparrowAttach";
const SparrowDetach = "__SparrowDetach";

export const behavior = Behavior({
  definitionFilter(config) {
    // @ts-ignore atoms could be a custom property
    const atoms = config.atoms;
    if (!atoms) return;

    // update props in data
    const data = config.data || {};
    config.data = data;

    for (let key in atoms) {
      // miniprogram setData uses "a.b[1].c"
      // dset uses "a.b.1.c"
      dset(data, key.replace(/\[/g, ".").replace(/\]/g, ""), atoms[key].read());
    }

    const unsubs = [];

    config.methods = config.methods || {};
    config.methods[SparrowAttach] = function () {
      for (let key in atoms) {
        unsubs.push(atoms[key].subscribe(this, key));
      }
    };
    config.methods[SparrowDetach] = function () {
      for (let i = 0; i < unsubs.length; i++) {
        unsubs[i]();
      }
    };
  },

  lifetimes: {
    attached() {
      this[SparrowAttach] && this[SparrowAttach]();
    },
    detached() {
      this[SparrowDetach] && this[SparrowDetach]();
    },
  },
});
