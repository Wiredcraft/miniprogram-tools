import { dset } from "dset";

const SparrowAttach = "__SparrowAttach";
const SparrowDetach = "__SparrowDetach";
const SparrowUnsubs = "__SparrowUnsubs";

export const behavior = Behavior({
  definitionFilter(config) {
    // @ts-ignore atoms could be a custom property
    const atoms = config.atoms;

    if (!atoms) return;

    config.methods = config.methods || {};
    config.methods[SparrowAttach] = function () {
      if (!this[SparrowUnsubs]) this[SparrowUnsubs] = [];

      for (let key in atoms) {
        this[SparrowUnsubs].push(atoms[key].subscribe(this, key));
      }

      // flush the state
      const data = {};
      for (let key in atoms) {
        dset(
          data,
          key.replace(/\[/g, ".").replace(/\]/g, ""),
          atoms[key].read()
        );
      }
      this.setData(data);
    };
    config.methods[SparrowDetach] = function () {
      const unsubs = this[SparrowUnsubs];
      if (!unsubs) return;
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
